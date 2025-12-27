import {
  must,
  safeBodyJson,
  json,
  splitName,
  Client,
  Databases,
  Users,
  ID,
  Query,
} from "./_shared.js";

export default async ({ req, res, log, error }) => {
  try {
    const client = new Client()
      .setEndpoint(must("APPWRITE_ENDPOINT"))
      .setProject(must("APPWRITE_PROJECT_ID"))
      .setKey(must("APPWRITE_API_KEY"));

    const databases = new Databases(client);
    const users = new Users(client);

    const databaseId = must("APPWRITE_DATABASE_ID");
    const usersProfileCollectionId = must("COLLECTION_USERS_PROFILE_ID");

    const payload = safeBodyJson(req);

    const userAuthId = String(payload.userAuthId || "").trim();

    if (!userAuthId) {
      return json(res, 400, { ok: false, error: "userAuthId is required" });
    }

    // 1) Find existing profile by userAuthId
    const existing = await databases.listDocuments(
      databaseId,
      usersProfileCollectionId,
      [Query.equal("userAuthId", userAuthId)]
    );

    if (existing.total > 0) {
      return json(res, 200, {
        ok: true,
        created: false,
        profile: existing.documents[0],
      });
    }

    // 2) Get Auth user (server-side) to fill missing required fields
    const authUser = await users.get(userAuthId);

    const fullName = String(authUser?.name || payload.name || "").trim();
    const parsed = splitName(fullName);

    const firstName = String(payload.firstName || parsed.firstName).trim();
    const lastName = String(payload.lastName || parsed.lastName).trim();

    if (!firstName || !lastName) {
      return json(res, 400, {
        ok: false,
        error:
          "firstName and lastName are required (provide them or include them in Auth user name)",
      });
    }

    const docData = {
      userAuthId,
      email: String(authUser?.email || payload.email || "")
        .trim()
        .toLowerCase(),
      username: String(payload.username || "").trim() || undefined,
      firstName,
      lastName,
      phone: String(payload.phone || "").trim() || undefined,
      avatarFileId: String(payload.avatarFileId || "").trim() || undefined,
      isPlatformAdmin: payload.isPlatformAdmin === true,
      status: String(payload.status || "ACTIVE"),
      enabled: payload.enabled ?? true,
    };
    Object.keys(docData).forEach(
      (k) => docData[k] === undefined && delete docData[k]
    );

    const created = await databases.createDocument(
      databaseId,
      usersProfileCollectionId,
      ID.unique(),
      docData
    );

    return json(res, 201, { ok: true, created: true, profile: created });
  } catch (e) {
    try {
      error?.(e.message || String(e));
    } catch {}
    return json(res, 500, { ok: false, error: e.message || String(e) });
  }
};
