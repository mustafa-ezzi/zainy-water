import { os } from "@orpc/server";
import { z } from "zod";
import { TotalBottles } from "@/db/schema";
import { db } from "@/db";
import { desc } from "drizzle-orm";

export const getTotalBottles = os
  .input(z.void())
  .output(
    z.discriminatedUnion("success", [
      z.object({
        success: z.literal(true),
        totalBottles: z.custom<typeof TotalBottles.$inferSelect>(),
      }),
      z.object({
        success: z.literal(false),
        error: z.string(),
      }),
    ])
  )
  .handler(async () => {
    // Fetch from database directly
    try {
      const [totalBottles] = await db
        .select()
        .from(TotalBottles)
        .orderBy(desc(TotalBottles.createdAt))
        .limit(1);

      if (!totalBottles) {
        return { success: false, error: "Total bottles record not found" };
      }
      return { success: true, totalBottles };
    } catch (error) {
      console.error("error fetching total bottles record", { error });
      return {
        success: false,
        error: error instanceof Error ? error.message : "Internal Server Error",
      };
    }
  });
