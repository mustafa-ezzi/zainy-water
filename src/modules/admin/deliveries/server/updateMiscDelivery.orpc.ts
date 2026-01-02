import { z } from "zod";
import {
  BottleUsage,
  Miscellaneous,
  Moderator,
  TotalBottles,
} from "@/db/schema";
import { adminProcedure } from "@/middlewares/admin-clerk";
import { db } from "@/db";
import { and, desc, eq, gte, lte } from "drizzle-orm";
import { startOfDay } from "date-fns";

export const UpdateMiscDeliveryDataSchema = z.object({
  Miscellaneous: z.custom<typeof Miscellaneous.$inferSelect>(),
  Moderator: z.custom<typeof Moderator.$inferSelect>(),
  data: z.object({
    customer_name: z.string(),
    description: z.string(),
    filled_bottles: z.number(),
    empty_bottles: z.number(),
    damaged_bottles: z.number(),
    isPaid: z.boolean(),
    payment: z.number(),
  }),
});

export const updateMiscDelivery = adminProcedure
  .input(UpdateMiscDeliveryDataSchema)
  .output(
    z.object({
      success: z.boolean(),
      message: z.string(),
    })
  )
  .handler(async ({ input: data }) => {
    try {
      const [totalBottles] = await db
        .select()
        .from(TotalBottles)
        .orderBy(desc(TotalBottles.createdAt))
        .limit(1);

      if (!totalBottles) {
        throw new Error("Total bottles not found");
      }

      const [bottleUsage] = await db
        .select()
        .from(BottleUsage)
        .where(
          and(
            eq(BottleUsage.moderator_id, data.Moderator.id),
            gte(BottleUsage.createdAt, startOfDay(new Date())),
            lte(BottleUsage.createdAt, new Date())
          )
        )
        .limit(1);

      if (!bottleUsage) {
        throw new Error("Bottle usage not found");
      }

      const valueDiffs = {
        filledBottles:
          data.data.filled_bottles - data.Miscellaneous.filled_bottles,
        emptyBottles:
          data.data.empty_bottles - data.Miscellaneous.empty_bottles,
        damagedBottles:
          data.data.damaged_bottles - data.Miscellaneous.damaged_bottles,
      };

      const updatedData = {
        sales: bottleUsage.sales + valueDiffs.filledBottles,
        remainingBottles:
          bottleUsage.remaining_bottles - valueDiffs.filledBottles,
        emptyBottles: bottleUsage.empty_bottles + valueDiffs.emptyBottles,
        damagedBottles:
          totalBottles.damaged_bottles + valueDiffs.damagedBottles,
        availableBottles:
          totalBottles.available_bottles - valueDiffs.damagedBottles,
      };

      Object.entries(updatedData).forEach(([key, value]) => {
        if (value < 0) {
          throw new Error(`Invalid ${key} value: ${value}`);
        }
      });

      await db.transaction(async (tx) => {
        await Promise.all([
          tx
            .update(BottleUsage)
            .set({
              sales: updatedData.sales,
              remaining_bottles: updatedData.remainingBottles,
              empty_bottles: updatedData.emptyBottles,
              damaged_bottles:
                bottleUsage.damaged_bottles -
                data.Miscellaneous.damaged_bottles +
                data.data.damaged_bottles,
              revenue:
                bottleUsage.revenue -
                data.Miscellaneous.payment +
                data.data.payment,
            })
            .where(eq(BottleUsage.id, bottleUsage.id)),

          tx.update(TotalBottles).set({
            damaged_bottles: updatedData.damagedBottles,
            available_bottles: updatedData.availableBottles,
          }),

          tx
            .update(Miscellaneous)
            .set({
              ...data.data,
            })
            .where(eq(Miscellaneous.id, data.Miscellaneous.id)),
        ]);
      });

      return {
        success: true,
        message: "Delivery updated successfully",
      };
    } catch (error) {
      console.error("Error updating delivery:", error);
      throw error;
    }
  });
