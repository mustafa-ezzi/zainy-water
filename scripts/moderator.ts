import { db } from "@/db";
import { Moderator } from "@/db/schema";

async function main() {
  try {
    const moderator = await db
      .insert(Moderator)
      .values({
        name: "Khan",
        password: "1234",
        areas: ["Saddar", "Nazimabad", "Gulshan"],
      })
      .returning();

    console.log("Moderator created:", moderator);
  } catch (error) {
    console.error("Error creating moderator:", error);
  }
}

await main();
