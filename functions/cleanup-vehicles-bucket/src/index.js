import {
  must,
  json,
  boolEnv,
  intEnv,
  hoursAgo,
  isOlderThan,
  Client,
  Databases,
  Storage,
  Query,
} from "./_shared.js";

/**
 * ENV expected (same naming style as your other functions):
 *
 * APPWRITE_ENDPOINT
 * APPWRITE_PROJECT_ID
 * APPWRITE_API_KEY
 *
 * APPWRITE_DATABASE_ID
 * COLLECTION_VEHICLE_FILES_ID
 * BUCKET_VEHICLES_ID
 *
 * ORPHAN_TTL_HOURS=24
 * DRY_RUN=true
 * PAGE_SIZE=100
 * MAX_FILES_PER_RUN=2000
 * ONLY_ENABLED_LINKS=true
 *
 * FILE_ID_ATTRIBUTE=fileId
 * ENABLED_ATTRIBUTE=enabled
 */

async function fileHasLink(databases, databaseId, vehicleFilesCollectionId, fileId) {
  const fileIdAttr = process.env.FILE_ID_ATTRIBUTE || "fileId";
  const onlyEnabled = boolEnv("ONLY_ENABLED_LINKS", true);

  const queries = [Query.equal(fileIdAttr, fileId), Query.limit(1)];
  if (onlyEnabled) {
    const enabledAttr = process.env.ENABLED_ATTRIBUTE || "enabled";
    queries.push(Query.equal(enabledAttr, true));
  }

  const res = await databases.listDocuments(databaseId, vehicleFilesCollectionId, queries);
  return (res?.total || 0) > 0;
}

export default async ({ req, res, log, error }) => {
  try {
    const client = new Client()
      .setEndpoint(must("APPWRITE_ENDPOINT"))
      .setProject(must("APPWRITE_PROJECT_ID"))
      .setKey(must("APPWRITE_API_KEY"));

    const storage = new Storage(client);
    const databases = new Databases(client);

    const databaseId = must("APPWRITE_DATABASE_ID");
    const vehicleFilesCollectionId = must("COLLECTION_VEHICLE_FILES_ID");
    const bucketId = must("BUCKET_VEHICLES_ID");

    const ttlHours = intEnv("ORPHAN_TTL_HOURS", 24);
    const dryRun = boolEnv("DRY_RUN", true);
    const pageSize = intEnv("PAGE_SIZE", 100);
    const maxFiles = intEnv("MAX_FILES_PER_RUN", 2000);

    const threshold = hoursAgo(ttlHours);

    log?.(
      `cleanup_start bucket=${bucketId} ttlHours=${ttlHours} threshold=${threshold.toISOString()} dryRun=${dryRun}`
    );

    let scanned = 0;
    let deleted = 0;
    let skippedTooNew = 0;
    let skippedLinked = 0;
    let candidates = 0;

    let cursorAfter = null;

    while (scanned < maxFiles) {
      const limit = Math.min(pageSize, maxFiles - scanned);
      const queries = [Query.limit(limit)];
      if (cursorAfter) queries.push(Query.cursorAfter(cursorAfter));

      const page = await storage.listFiles(bucketId, queries);
      const files = page?.files || [];
      if (files.length === 0) break;

      for (const f of files) {
        scanned++;
        cursorAfter = f.$id;

        const createdAt = f.$createdAt || f.createdAt;
        if (!createdAt || !isOlderThan(createdAt, threshold)) {
          skippedTooNew++;
          if (scanned >= maxFiles) break;
          continue;
        }

        candidates++;

        let linked = false;
        try {
          linked = await fileHasLink(
            databases,
            databaseId,
            vehicleFilesCollectionId,
            f.$id
          );
        } catch (e) {
          // Safety: if link check fails, do not delete.
          error?.(
            `link_check_failed file=${f.$id} err=${e?.message || String(e)}`
          );
          if (scanned >= maxFiles) break;
          continue;
        }

        if (linked) {
          skippedLinked++;
          if (scanned >= maxFiles) break;
          continue;
        }

        if (dryRun) {
          log?.(
            `would_delete_orphan file=${f.$id} name=${f.name} createdAt=${createdAt}`
          );
        } else {
          try {
            await storage.deleteFile(bucketId, f.$id);
            deleted++;
            log?.(`deleted_orphan file=${f.$id} name=${f.name}`);
          } catch (e) {
            error?.(`delete_failed file=${f.$id} err=${e?.message || String(e)}`);
          }
        }

        if (scanned >= maxFiles) break;
      }

      if (files.length < limit) break;
    }

    const out = {
      ok: true,
      scanned,
      candidates,
      deleted,
      skippedTooNew,
      skippedLinked,
      dryRun,
    };

    log?.(`cleanup_done ${JSON.stringify(out)}`);
    return json(res, 200, out);
  } catch (e) {
    try {
      error?.(e.message || String(e));
    } catch {}
    return json(res, 500, { ok: false, error: e.message || String(e) });
  }
};
