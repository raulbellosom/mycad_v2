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

    // Optional collections for tenancy/RBAC
    const groupMembersCollectionId =
      process.env.COLLECTION_GROUP_MEMBERS_ID || "";
    const userRolesCollectionId = process.env.COLLECTION_USER_ROLES_ID || "";
    const defaultGroupRole = process.env.DEFAULT_GROUP_ROLE || "MEMBER"; // enum: OWNER/ADMIN/MEMBER/VIEWER
    const defaultRoleId = process.env.DEFAULT_ROLE_ID || ""; // roles.$id (optional)

    const payload = safeBodyJson(req);

    const email = String(payload.email || "")
      .trim()
      .toLowerCase();
    const password = String(payload.password || "");
    const name = String(payload.name || "").trim();

    if (!email || !password || !name) {
      return json(res, 400, {
        ok: false,
        error: "email, password, name are required",
      });
    }

    // 1) Create Auth user
    const createdUser = await users.create(ID.unique(), email, password, name);

    // 2) Create users_profile
    // Schema vNext expects:
    // userAuthId (required), email (required), firstName (required), lastName (required)
    const parsed = splitName(name);

    const firstName = String(payload.firstName || parsed.firstName).trim();
    const lastName = String(payload.lastName || parsed.lastName).trim();

    if (!firstName || !lastName) {
      return json(res, 400, {
        ok: false,
        error:
          "firstName and lastName are required (provide them or include them in 'name')",
      });
    }

    const profilePayload = {
      userAuthId: createdUser.$id,
      email,
      username: String(payload.username || "").trim() || undefined,
      firstName,
      lastName,
      phone: String(payload.phone || "").trim() || undefined,
      avatarFileId: String(payload.avatarFileId || "").trim() || undefined,

      // In the Console schema, these are NOT required and can have defaults.
      isPlatformAdmin: payload.isPlatformAdmin === true,
      status: String(payload.status || "ACTIVE"),
      enabled: payload.enabled ?? true,
    };

    // remove undefined fields to avoid strict schema validation issues
    Object.keys(profilePayload).forEach(
      (k) => profilePayload[k] === undefined && delete profilePayload[k]
    );

    const createdProfile = await databases.createDocument(
      databaseId,
      usersProfileCollectionId,
      ID.unique(),
      profilePayload
    );

    // 3) Optional: create group membership (group_members)
    // IMPORTANT: In vNext DB doc, groupId is the TeamId (groups.teamId), not groups.$id.
    let groupMemberDoc = null;
    if (payload.groupId && groupMembersCollectionId) {
      groupMemberDoc = await databases.createDocument(
        databaseId,
        groupMembersCollectionId,
        ID.unique(),
        {
          groupId: String(payload.groupId),
          profileId: createdProfile.$id,
          role: String(payload.role || defaultGroupRole),
          enabled: true,
          joinedAt: new Date().toISOString(),
          notes: String(payload.notes || ""),
        }
      );
    }

    // 4) Optional: assign a default Role (user_roles) inside the group
    // This is separate from group_members.role (membership-level).
    let userRoleDoc = null;
    if (
      payload.groupId &&
      userRolesCollectionId &&
      (payload.roleId || defaultRoleId)
    ) {
      userRoleDoc = await databases.createDocument(
        databaseId,
        userRolesCollectionId,
        ID.unique(),
        {
          groupId: String(payload.groupId),
          profileId: createdProfile.$id,
          roleId: String(payload.roleId || defaultRoleId),
          enabled: true,
          assignedAt: new Date().toISOString(),
        }
      );
    }

    return json(res, 201, {
      ok: true,
      user: createdUser,
      profile: createdProfile,
      groupMember: groupMemberDoc,
      userRole: userRoleDoc,
    });
  } catch (e) {
    try {
      error?.(e.message || String(e));
    } catch {}
    return json(res, 500, { ok: false, error: e.message || String(e) });
  }
};
