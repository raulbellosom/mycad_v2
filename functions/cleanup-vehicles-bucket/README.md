# cleanup-vehicle-orphans (Appwrite Function)

Deletes orphan files from the vehicles bucket that were uploaded but never linked in `vehicle_files`.

## How it decides "orphan"
- Lists files in `BUCKET_VEHICLES_ID`
- If file is older than `ORPHAN_TTL_HOURS`
- Checks `COLLECTION_VEHICLE_FILES_ID` for a document with `FILE_ID_ATTRIBUTE == file.$id`
  - If `ONLY_ENABLED_LINKS=true`, requires `ENABLED_ATTRIBUTE == true`
- If no doc found => orphan => delete (or log if DRY_RUN=true)

## Suggested schedule
Run hourly:
`0 * * * *`

## First run
Set `DRY_RUN=true` and review logs.
Then set `DRY_RUN=false`.

## Structure
Matches your existing function structure:
- `package.json` uses "type": "module"
- Entry is `src/index.js`
- Shared helpers in `src/_shared.js`
