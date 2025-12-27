import { functions } from "../../../shared/appwrite/client";
import { env } from "../../../shared/appwrite/env";

export async function createUserWithProfile(data) {
  // data: { email, password, name }
  // This calls an Appwrite Function that handles the secure creation
  const execution = await functions.createExecution(
    env.fnCreateUserWithProfileId,
    JSON.stringify(data)
  );

  const response = JSON.parse(execution.responseBody || "{}");

  if (execution.status !== "completed") {
    throw new Error(response.error || "Error en ejecución de Function");
  }

  return response;
}
