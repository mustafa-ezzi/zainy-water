import { db } from "@/db";
import { TotalBottles } from "@/db/schema";
async function main() {
  try {
    const totalBottles = await db
      .insert(TotalBottles)
      .values({
        total_bottles: 1000,
        available_bottles: 1000,
      })
      .returning();

    console.log({ totalBottles });
  } catch (error) {
    console.error("Error creating total bottles:", error);
  }
}

await main();
