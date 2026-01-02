import { db } from "@/db";
import { BottleUsage, TotalBottles, Moderator } from "@/db/schema";
import { desc } from "drizzle-orm";

async function addRecord(
  moderator_id: string,
  filled_bottles: number,
  returned_bottles: number,
  createdAt: Date
) {
  try {
    const [total_bottles] = await db
      .select()
      .from(TotalBottles)
      .orderBy(desc(TotalBottles.createdAt));

    if (!total_bottles) {
      throw new Error(
        "No total bottles record found. Please run total_bottles.ts first"
      );
    }

    if (total_bottles.available_bottles < filled_bottles) {
      throw new Error("Filled_bottles cannot exceed total available bottles");
    }

    await db
      .insert(BottleUsage)
      .values({
        moderator_id: moderator_id,
        filled_bottles: filled_bottles,
        returned_bottles: returned_bottles,
        createdAt: createdAt,
        updatedAt: createdAt,
      })
      .returning();

    const updated_available_bottles =
      total_bottles.available_bottles - filled_bottles + returned_bottles;

    const updated_used_bottles =
      total_bottles.used_bottles + filled_bottles - returned_bottles;

    if (
      updated_available_bottles > total_bottles.total_bottles ||
      updated_used_bottles < 0
    ) {
      throw new Error("Inconsistent bottle counts");
    }

    await db.update(TotalBottles).set({
      available_bottles: updated_available_bottles,
      used_bottles: updated_used_bottles,
    });

    console.log(`✅ Day ${createdAt.toISOString().split("T")[0]}:`, {
      filled: filled_bottles,
      returned: returned_bottles,
      net_used: filled_bottles - returned_bottles,
    });
  } catch (error) {
    console.error("❌ Error creating bottle usage:", error);
  }
}

async function main() {
  try {
    console.log("🏁 Starting 90-day bottle usage seeding...");

    // Get the first available moderator
    const moderators = await db.select().from(Moderator);

    if (moderators.length === 0) {
      console.error("❌ No moderators found. Please run moderator.ts first");
      return;
    }

    const moderator_id = moderators[1].id;
    console.log(
      `📋 Using moderator: ${moderators[1].name} (${moderator_id.slice(
        0,
        8
      )}...)`
    );

    // Check current total bottles status
    const [totalBottles] = await db
      .select()
      .from(TotalBottles)
      .orderBy(desc(TotalBottles.createdAt));

    if (!totalBottles) {
      console.error(
        "❌ No total bottles record found. Please run total_bottles.ts first"
      );
      return;
    }

    console.log(`📊 Current bottles status:`, {
      total: totalBottles.total_bottles,
      available: totalBottles.available_bottles,
      used: totalBottles.used_bottles,
    });

    // Generate 90 days of seeding data (from 89 days ago to today)
    const today = new Date("2025-08-10"); // Current date
    const seedData = [];

    // Generate realistic bottle usage patterns with some variation
    const baseUsagePatterns = [
      { filled: 45, returned: 20 }, // Light day
      { filled: 65, returned: 30 }, // Normal day
      { filled: 80, returned: 35 }, // Busy day
      { filled: 55, returned: 25 }, // Average day
      { filled: 70, returned: 40 }, // Good return day
      { filled: 50, returned: 15 }, // Low return day
      { filled: 60, returned: 35 }, // Balanced day
      { filled: 75, returned: 45 }, // High activity day
      { filled: 40, returned: 18 }, // Quiet day
      { filled: 85, returned: 50 }, // Peak day
    ];

    for (let i = 89; i >= 0; i--) {
      // 89 days ago to today (inclusive = 90 days)
      const currentDate = new Date(today);
      currentDate.setDate(today.getDate() - i);

      // Add some randomness to make data more realistic
      const patternIndex = i % baseUsagePatterns.length;
      const basePattern = baseUsagePatterns[patternIndex];

      // Add small random variations (-10 to +10 for filled, -5 to +5 for returned)
      const variation = Math.floor(Math.random() * 21) - 10; // -10 to +10
      const returnVariation = Math.floor(Math.random() * 11) - 5; // -5 to +5

      const filled_bottles = Math.max(20, basePattern.filled + variation); // Minimum 20
      const returned_bottles = Math.max(
        5,
        Math.min(filled_bottles - 5, basePattern.returned + returnVariation)
      ); // Min 5, Max filled-5

      // Weekend effect - slightly lower usage on weekends (day 0 = Sunday, 6 = Saturday)
      const dayOfWeek = currentDate.getDay();
      const weekendMultiplier = dayOfWeek === 0 || dayOfWeek === 6 ? 0.8 : 1.0;

      const final_filled = Math.floor(filled_bottles * weekendMultiplier);
      const final_returned = Math.floor(returned_bottles * weekendMultiplier);

      seedData.push({
        filled_bottles: final_filled,
        returned_bottles: final_returned,
        createdAt: new Date(currentDate.getTime()), // Create a new Date object
      });
    }

    console.log(
      `🔄 Processing ${seedData.length} bottle usage records (${
        seedData[0].createdAt.toISOString().split("T")[0]
      } to ${
        seedData[seedData.length - 1].createdAt.toISOString().split("T")[0]
      })...`
    );

    // Process records sequentially to avoid race conditions
    for (let i = 0; i < seedData.length; i++) {
      const { filled_bottles, returned_bottles, createdAt } = seedData[i];
      await addRecord(
        moderator_id,
        filled_bottles,
        returned_bottles,
        createdAt
      );

      // Show progress every 10 records
      if ((i + 1) % 10 === 0) {
        console.log(
          `📈 Progress: ${i + 1}/${seedData.length} records processed`
        );
      }

      // Small delay to ensure proper ordering and avoid overwhelming the database
      await new Promise((resolve) => setTimeout(resolve, 50));
    }

    // Show final status
    const [finalBottles] = await db
      .select()
      .from(TotalBottles)
      .orderBy(desc(TotalBottles.createdAt));

    console.log(`🎉 90-day seeding completed! Final bottles status:`, {
      total: finalBottles.total_bottles,
      available: finalBottles.available_bottles,
      used: finalBottles.used_bottles,
    });

    // Calculate total net usage over 90 days
    const totalNetUsage = seedData.reduce(
      (sum, record) => sum + (record.filled_bottles - record.returned_bottles),
      0
    );
    console.log(
      `📊 Total net bottle usage over 90 days: ${totalNetUsage} bottles`
    );
    console.log(
      `📊 Average daily net usage: ${Math.round(totalNetUsage / 90)} bottles`
    );
  } catch (error) {
    console.error("❌ Error in main function:", error);
  }
}

await main();
