import { promises as fs } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_FILE = join(__dirname, "data.json");

let inMemoryStore = null;

async function readStoreFromDisk() {
  const file = await fs.readFile(DATA_FILE, "utf-8");
  return JSON.parse(file);
}

async function writeStoreToDisk(store) {
  await fs.writeFile(DATA_FILE, JSON.stringify(store, null, 2), "utf-8");
}

function nextId(store, key) {
  const value = store.nextIds[key];
  store.nextIds[key] += 1;
  return value;
}

export async function getStore() {
  if (!inMemoryStore) {
    inMemoryStore = await readStoreFromDisk();
  }
  return JSON.parse(JSON.stringify(inMemoryStore));
}

export async function saveStore(store) {
  inMemoryStore = JSON.parse(JSON.stringify(store));
  try {
    await writeStoreToDisk(store);
  } catch (error) {
    console.warn(
      "Unable to persist employee-management data to disk. Falling back to in-memory store.",
      error.message
    );
  }
}

export function generateEmployeeId(store) {
  return nextId(store, "employee");
}

export function generateProjectId(store) {
  return nextId(store, "project");
}

export function generateProjectEmployeeId(store) {
  return nextId(store, "projectEmployee");
}
