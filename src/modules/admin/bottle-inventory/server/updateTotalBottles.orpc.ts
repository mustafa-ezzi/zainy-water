import { adminProcedure } from "@/middlewares/admin-clerk";
import { z } from "zod";
import { db } from "@/db";
import { TotalBottles } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

export const TotalBottlesDataSchema = z.object({
  total_bottles: z.number().min(0).optional(),
  available_bottles: z.number().min(0).optional(),
  used_bottles: z.number().min(0).optional(),
  damaged_bottles: z.number().min(0).optional(),
});

export const updateTotalBottles = adminProcedure
  .input(TotalBottlesDataSchema)
  .output(
    z.object({
      success: z.boolean(),
      message: z.string(),
    }),
  )
  .handler(async ({ input: totalBottlesData }) => {
    const [latestTotalBottles] = await db
      .select()
      .from(TotalBottles)
      .orderBy(desc(TotalBottles.createdAt))
      .limit(1);

    if (!latestTotalBottles) {
      if (
        (totalBottlesData.available_bottles || 0) +
        (totalBottlesData.used_bottles || 0) >
        (totalBottlesData.total_bottles || 0)
      ) {
        return {
          success: false,
          message:
            "Total bottles cannot be less than the sum of available and used bottles",
        };
      }

      await db.insert(TotalBottles).values({
        total_bottles: totalBottlesData.total_bottles || 0,
        available_bottles:
          totalBottlesData.available_bottles ||
          totalBottlesData.total_bottles ||
          0,
        used_bottles: totalBottlesData.used_bottles || 0,
        damaged_bottles: totalBottlesData.damaged_bottles || 0,
      });

      return {
        success: true,
        message: "New Bottles record added successfully",
      };
    }

    if (!!totalBottlesData.total_bottles) {
      // UPDATE TOTAL BOTTLES
      const availableBottles =
        latestTotalBottles.available_bottles +
        totalBottlesData.total_bottles -
        latestTotalBottles.total_bottles;

      await db
        .update(TotalBottles)
        .set({
          total_bottles: totalBottlesData.total_bottles,
          available_bottles: availableBottles,
        })
        .where(eq(TotalBottles.id, latestTotalBottles.id));

      return { success: true, message: "Total bottles updated successfully" };
    } else if (!!totalBottlesData.available_bottles) {
      // UPDATE AVAILABLE BOTTLES
      if (
        totalBottlesData.available_bottles > latestTotalBottles.total_bottles
      ) {
        return {
          success: false,
          message:
            "Available bottles cannot be greater than current available bottles",
        };
      }

      const used_bottles =
        latestTotalBottles.used_bottles -
        (totalBottlesData.available_bottles -
          latestTotalBottles.available_bottles);

      await db
        .update(TotalBottles)
        .set({
          available_bottles: totalBottlesData.available_bottles,
          used_bottles: used_bottles,
        })
        .where(eq(TotalBottles.id, latestTotalBottles.id));

      return {
        success: true,
        message: "Available bottles updated successfully",
      };
    } else if (!!totalBottlesData.used_bottles) {
      // UPDATE USED BOTTLES
      if (totalBottlesData.used_bottles > latestTotalBottles.total_bottles) {
        return {
          success: false,
          message:
            "Used bottles cannot be greater than total available bottles",
        };
      }

      const available_bottles =
        latestTotalBottles.available_bottles -
        (totalBottlesData.used_bottles - latestTotalBottles.used_bottles);

      await db
        .update(TotalBottles)
        .set({
          available_bottles: available_bottles,
          used_bottles: totalBottlesData.used_bottles,
        })
        .where(eq(TotalBottles.id, latestTotalBottles.id));

      return { success: true, message: "Used bottles updated successfully" };
    } else if (!!totalBottlesData.damaged_bottles) {
      // UPDATE DAMAGED BOTTLES
      await db
        .update(TotalBottles)
        .set({
          damaged_bottles: totalBottlesData.damaged_bottles,
          total_bottles:
            latestTotalBottles.total_bottles -
            (totalBottlesData.damaged_bottles -
              latestTotalBottles.damaged_bottles),
          available_bottles:
            latestTotalBottles.available_bottles -
            (totalBottlesData.damaged_bottles -
              latestTotalBottles.damaged_bottles),
        })
        .where(eq(TotalBottles.id, latestTotalBottles.id));

      return { success: true, message: "Damaged bottles updated successfully" };
    }

    return { success: false, message: "Atleast one field must be provided" };
  });
