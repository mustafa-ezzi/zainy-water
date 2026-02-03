import { z } from "zod";
import {
  BottleUsage,
  Customer,
  Delivery,
  Moderator,
  TotalBottles,
} from "@/db/schema";
import { adminProcedure } from "@/middlewares/admin-clerk";
import { db } from "@/db";
import { and, desc, eq, gte, lte } from "drizzle-orm";
import { ORPCError } from "@orpc/client";
import { endOfDay, startOfDay } from "date-fns";

export const UpdateDailyDeliveryDataSchema = z.object({
  Delivery: z.custom<typeof Delivery.$inferSelect>(),
  Moderator: z.custom<typeof Moderator.$inferSelect>(),
  Customer: z.custom<typeof Customer.$inferSelect>(),
  data: z.object({
    payment: z.number().min(0),
    filled_bottles: z.number().min(0),
    empty_bottles: z.number().min(0),
    foc: z.number().min(0),
    damaged_bottles: z.number().min(0),
  }),
});

export const updateDailyDelivery = adminProcedure
  .input(UpdateDailyDeliveryDataSchema)
  .output(
    z.object({
      success: z.boolean(),
      message: z.string(),
    })
  )
  .handler(async ({ input: data }) => {
    const from = startOfDay(data.Delivery.delivery_date);
    const to = endOfDay(data.Delivery.delivery_date);

    try {
      const [bottleUsage] = await db
        .select()
        .from(BottleUsage)
        .where(
          and(
            eq(BottleUsage.moderator_id, data.Moderator.id),
            gte(BottleUsage.createdAt, from),
            lte(BottleUsage.createdAt, to)
          )
        )
        .orderBy(desc(BottleUsage.createdAt))
        .limit(1);

      if (!bottleUsage) {
        throw new ORPCError("Bottle usage not found");
      }

      const [totalBottles] = await db
        .select()
        .from(TotalBottles)
        .orderBy(desc(TotalBottles.createdAt))
        .limit(1);

      if (!totalBottles) {
        throw new ORPCError("Total bottles not found");
      }

      const valueDiffs = {
        filledBottles: data.data.filled_bottles - data.Delivery.filled_bottles,
        emptyBottles: data.data.empty_bottles - data.Delivery.empty_bottles,
        damagedBottles:
          data.data.damaged_bottles - data.Delivery.damaged_bottles,
        foc: data.data.foc - data.Delivery.foc,
        payment: data.data.payment - data.Delivery.payment,
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
        payment: data.Delivery.payment + valueDiffs.payment,
        customer_balance:
          data.Customer.balance -
          valueDiffs.foc * data.Customer.bottle_price +
          valueDiffs.filledBottles * data.Customer.bottle_price -
          valueDiffs.payment,
        customer_bottles: data.Customer.bottles - valueDiffs.emptyBottles,
      };

      // Validation checks
      Object.entries(updatedData).forEach(([key, value]) => {
        if (key === "customer_balance") return;
        if (value < 0) {
          throw new ORPCError(`Invalid ${key} value: ${value}`);
        }
      });

      // Update customer, bottle usage, and total bottles
      await db.transaction(async (tx) => {
        await Promise.all([
          tx
            .update(Customer)
            .set({
              balance: updatedData.customer_balance,
              bottles: updatedData.customer_bottles,
            })
            .where(eq(Customer.id, data.Customer.id)),

          tx
            .update(BottleUsage)
            .set({
              sales: updatedData.sales,
              remaining_bottles: updatedData.remainingBottles,
              empty_bottles: updatedData.emptyBottles,
              damaged_bottles:
                bottleUsage.damaged_bottles -
                data.Delivery.damaged_bottles +
                data.data.damaged_bottles,
              revenue:
                bottleUsage.revenue - data.Delivery.payment + data.data.payment,
            })
            .where(eq(BottleUsage.id, bottleUsage.id)),

          tx
            .update(TotalBottles)
            .set({
              damaged_bottles: updatedData.damagedBottles,
              available_bottles: updatedData.availableBottles,
            })
            .where(eq(TotalBottles.id, totalBottles.id)),

          // Update actual delivery
          tx
            .update(Delivery)
            .set({
              ...data.data,
            })
            .where(eq(Delivery.id, data.Delivery.id)),
        ]);
      });

      return {
        success: true,
        message: "Daily delivery updated successfully",
      };
    } catch (error) {
      console.error("Error updating daily delivery:", error);
      throw error;
    }
  });
