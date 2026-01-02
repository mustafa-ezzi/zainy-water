"use server";

import { db } from "@/db";
import { BottleUsage } from "@/db/schema";
import { and, eq } from "drizzle-orm";

async function main() {
  const data = await db.select().from(BottleUsage);

  console.table(data);

  data.forEach(async (rec) => {
    if (rec.filled_bottles === 0 && rec.returned_bottles === 0) {
      await db.delete(BottleUsage).where(eq(BottleUsage.id, rec.id));
      console.log(
        `Deleted record for bottle_id: ${rec.id}, date: ${rec.createdAt}`
      );
    }
  });

  return;
}

await main();
