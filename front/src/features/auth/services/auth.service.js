import { ID } from "appwrite";
import toast from "react-hot-toast";
import { account, functions } from "../../../shared/appwrite/client";
import { env } from "../../../shared/appwrite/env";

export async function registerAndLogin({
  email,
  password,
  firstName,
  lastName,
}) {
  const name = `${firstName} ${lastName}`.trim();

  // 1) Create Auth user
  const created = await account.create(ID.unique(), email, password, name);

  // 2) Login
  try {
    await account.createEmailPasswordSession(email, password);
  } catch (e) {
    // If session is active, try to delete it and retry (or ignore if it's the same user context)
    if (e.message?.includes("prohibited when a session is active")) {
      await account.deleteSession("current");
      await account.createEmailPasswordSession(email, password);
    } else {
      throw e;
    }
  }

  // 3) Ensure users_profile
  if (env.fnEnsureProfileId) {
    try {
      await functions.createExecution(
        env.fnEnsureProfileId,
        JSON.stringify({
          userAuthId: created.$id,
          firstName,
          lastName,
          email,
        }),
        false
      );
    } catch (e) {
      toast.error("Error al configurar el perfil del usuario.");
    }
  } else {
    console.warn("Falta configurar Fn para perfil de usuario");
  }

  return created;
}
