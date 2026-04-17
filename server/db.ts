import "dotenv/config";

import * as schema from "@shared/schema";
import ws from "ws";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

let pool: any;
let db: any;

export async function initDb() {
  const pgModule = await import("pg");
  const { drizzle } = await import("drizzle-orm/node-postgres");

  const Pool = pgModule.Pool ?? pgModule.default?.Pool;
  if (!Pool) throw new Error("Cannot find Pool in pg module");

  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  db = drizzle(pool, { schema });

  console.log("Using local PostgreSQL");
}

export { pool, db };
