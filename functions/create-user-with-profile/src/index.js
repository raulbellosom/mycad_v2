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
  // Track what was created for error reporting
  let createdUser = null;
  let createdProfile = null;
  let groupMemberDoc = null;
  let userRoleDoc = null;

  try {
    const client = new Client()
      .setEndpoint(must("APPWRITE_ENDPOINT"))
      .setProject(must("APPWRITE_PROJECT_ID"))
      .setKey(must("APPWRITE_API_KEY"));

    const databases = new Databases(client);
    const users = new Users(client);

    const databaseId = must("APPWRITE_DATABASE_ID");
    const usersProfileCollectionId = must("COLLECTION_USERS_PROFILE_ID");
    const groupsCollectionId = process.env.COLLECTION_GROUPS_ID || "";

    // Optional collections for tenancy/RBAC
    const groupMembersCollectionId =
      process.env.COLLECTION_GROUP_MEMBERS_ID || "";
    const userRolesCollectionId = process.env.COLLECTION_USER_ROLES_ID || "";
    const defaultGroupRole = process.env.DEFAULT_GROUP_ROLE || "MEMBER";
    const defaultRoleId = process.env.DEFAULT_ROLE_ID || "";

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

    // Validar y limpiar teléfono si se proporciona
    let validPhone = undefined;
    if (payload.phone) {
      const rawPhone = String(payload.phone).trim();
      // Debe empezar con + y tener entre 7-15 dígitos totales
      if (rawPhone.startsWith("+")) {
        const digits = rawPhone.slice(1).replace(/\D/g, "");
        if (digits.length >= 7 && digits.length <= 15) {
          validPhone = `+${digits}`;
        }
      }
    }

    // 1) Create Auth user
    // Signature: users.create(userId, email, phone, password, name)
    log?.("Creating Auth user...");
    createdUser = await users.create(
      ID.unique(),
      email,
      validPhone,
      password,
      name
    );
    log?.(`Auth user created: ${createdUser.$id}`);

    // 2) Create users_profile
    const parsed = splitName(name);
    const firstName = String(payload.firstName || parsed.firstName).trim();
    const lastName = String(payload.lastName || parsed.lastName).trim();

    if (!firstName || !lastName) {
      return json(res, 400, {
        ok: false,
        error: "firstName and lastName are required",
      });
    }

    const profilePayload = {
      userAuthId: createdUser.$id,
      email,
      username: String(payload.username || "").trim() || undefined,
      firstName,
      lastName,
      phone: validPhone,
      avatarFileId: String(payload.avatarFileId || "").trim() || undefined,
      isPlatformAdmin: payload.isPlatformAdmin === true,
      status: String(payload.status || "ACTIVE"),
      enabled: payload.enabled ?? true,
    };

    // Remove undefined fields
    Object.keys(profilePayload).forEach(
      (k) => profilePayload[k] === undefined && delete profilePayload[k]
    );

    log?.("Creating users_profile...");
    createdProfile = await databases.createDocument(
      databaseId,
      usersProfileCollectionId,
      ID.unique(),
      profilePayload
    );
    log?.(`Profile created: ${createdProfile.$id}`);

    // 3) Optional: create group membership (group_members)
    // Schema: groupId = groups.teamId (TeamId), profileId = users_profile.$id
    // Relationships: group = groups.$id, profile = users_profile.$id
    if (payload.groupId && groupMembersCollectionId) {
      try {
        log?.(`Creating group membership for teamId: ${payload.groupId}`);

        // Buscar el $id del documento de groups usando teamId
        // para poder llenar la relación "group"
        let groupDocId = null;
        if (groupsCollectionId) {
          const groupsResult = await databases.listDocuments(
            databaseId,
            groupsCollectionId,
            [Query.equal("teamId", payload.groupId), Query.limit(1)]
          );
          if (groupsResult.documents.length > 0) {
            groupDocId = groupsResult.documents[0].$id;
            log?.(`Found group document: ${groupDocId}`);
          }
        }

        const memberPayload = {
          // Campos de índice/búsqueda
          groupId: String(payload.groupId), // teamId para queries
          profileId: createdProfile.$id, // para queries
          // Campos de datos
          role: String(payload.role || defaultGroupRole),
          enabled: true,
          joinedAt: new Date().toISOString(),
          notes: String(payload.notes || ""),
          // Relaciones two-way
          profile: createdProfile.$id, // relación → users_profile
        };

        // Solo agregar la relación group si encontramos el documento
        if (groupDocId) {
          memberPayload.group = groupDocId; // relación → groups
        }

        groupMemberDoc = await databases.createDocument(
          databaseId,
          groupMembersCollectionId,
          ID.unique(),
          memberPayload
        );
        log?.(`Group membership created: ${groupMemberDoc.$id}`);
      } catch (memberError) {
        log?.(
          `Warning: Failed to create group membership: ${memberError.message}`
        );
        // No fallar todo el proceso
      }
    }

    // 4) Optional: assign a default Role (user_roles)
    if (
      payload.groupId &&
      userRolesCollectionId &&
      (payload.roleId || defaultRoleId)
    ) {
      try {
        log?.("Creating user role assignment...");
        userRoleDoc = await databases.createDocument(
          databaseId,
          userRolesCollectionId,
          ID.unique(),
          {
            groupId: String(payload.groupId),
            profileId: createdProfile.$id,
            profile: createdProfile.$id, // relación → users_profile
            roleId: String(payload.roleId || defaultRoleId),
            enabled: true,
            assignedAt: new Date().toISOString(),
          }
        );
        log?.(`User role assigned: ${userRoleDoc.$id}`);
      } catch (roleError) {
        log?.(`Warning: Failed to assign role: ${roleError.message}`);
      }
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
    return json(res, 500, {
      ok: false,
      error: e.message || String(e),
      // Info de lo que sí se creó (para debugging)
      partialData: {
        userId: createdUser?.$id || null,
        profileId: createdProfile?.$id || null,
      },
    });
  }
};
