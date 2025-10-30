import fs from "fs";
import path from "path";

const DATA_DIR = path.resolve("data");
const FILE = path.join(DATA_DIR, "config.json");

export function ensureStore() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(FILE))
    fs.writeFileSync(FILE, JSON.stringify({ guilds: {} }, null, 2));
}

export function readStore() {
  ensureStore();
  return JSON.parse(fs.readFileSync(FILE, "utf8"));
}

export function writeStore(data) {
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
}

export function setGuildConfig(guildId, patch) {
  const db = readStore();
  db.guilds[guildId] = { ...(db.guilds[guildId] || {}), ...patch };
  writeStore(db);
}

export function getGuildConfig(guildId) {
  const db = readStore();
  return db.guilds[guildId] || null;
}
