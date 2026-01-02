// Using NEON
import {
  drizzle as drizzleNeon,
  NeonDatabase,
} from "drizzle-orm/neon-serverless";
import {
  drizzle as drizzlePG,
  NodePgDatabase,
} from "drizzle-orm/node-postgres";
import * as schema from "./schema";
import "dotenv/config";
import { Pool as PgPool } from "pg";
import { Pool as NeonPool } from "@neondatabase/serverless";

const db_env = process.env.DB_ENV;
const db_url = process.env.DATABASE_URL;
if (!db_url) {
  throw new Error("DATABASE_URL environment variable is not set");
}

let db: NeonDatabase<typeof schema> | NodePgDatabase<typeof schema>;

// Neon Serverless
if (!db_env || db_env === "neon") {
  // const sql = neon(db_url);
  const pool = new NeonPool({ connectionString: db_url });
  db = drizzleNeon({ client: pool, schema });

  // LOCAL
} else if (db_env === "local") {
  const pool = new PgPool({
    connectionString: db_url,
  });

  db = drizzlePG({ client: pool, schema });
} else {
  throw new Error(`Unsupported DB_ENV "${db_env}". Use "neon" or "local".`);
}

export { db };

//

// Using PostgreSQL on Podman/Docker
// import "dotenv/config";
// import { drizzle } from "drizzle-orm/node-postgres";
// import { Pool } from "pg";

// const pool = new Pool({
//   connectionString: process.env.DATABASE_URL!,
// });
// const db = drizzle({ client: pool });
// export { db };
