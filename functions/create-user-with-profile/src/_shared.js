import { Client, Databases, Users, ID, Query } from "node-appwrite";

function must(key) {
  const v = process.env[key];
  if (!v) throw new Error(`Missing env var: ${key}`);
  return v;
}

// Appwrite sometimes exposes req.bodyJson as a getter that throws if body is empty.
// This helper makes it safe and always returns an object.
function safeBodyJson(req) {
  try {
    const val = req?.bodyJson;
    if (!val) return {};
    if (typeof val === "object") return val;
    return {};
  } catch {
    return {};
  }
}

function json(res, statusCode, body) {
  // Appwrite Functions 1.6+ formato directo
  return res.json(body, statusCode);
}

function splitName(fullName = "") {
  const parts = String(fullName).trim().split(" ").filter(Boolean);
  return {
    firstName: parts[0] || "",
    lastName: parts.slice(1).join(" "),
  };
}

export {
  must,
  safeBodyJson,
  json,
  splitName,
  Client,
  Databases,
  Users,
  ID,
  Query,
};
