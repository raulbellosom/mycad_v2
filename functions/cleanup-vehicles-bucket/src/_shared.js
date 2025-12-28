import { Client, Databases, Storage, Query } from "node-appwrite";

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

function boolEnv(key, def = false) {
  const v = process.env[key];
  if (v === undefined) return def;
  return String(v).toLowerCase() === "true";
}

function intEnv(key, def) {
  const v = process.env[key];
  if (v === undefined || v === "") return def;
  const n = Number(v);
  if (!Number.isFinite(n))
    throw new Error(`Invalid number for env var ${key}: ${v}`);
  return Math.floor(n);
}

function hoursAgo(hours) {
  return new Date(Date.now() - hours * 60 * 60 * 1000);
}

function isOlderThan(iso, threshold) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return false;
  return d.getTime() < threshold.getTime();
}

export {
  must,
  safeBodyJson,
  json,
  boolEnv,
  intEnv,
  hoursAgo,
  isOlderThan,
  Client,
  Databases,
  Storage,
  Query,
};
