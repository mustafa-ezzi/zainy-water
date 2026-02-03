import { z } from "zod";
import { os } from "@orpc/server";
import {
  Area,
  BottleUsage,
  Customer,
  Delivery,
  TotalBottles,
} from "@/db/schema";
import { db } from "@/db";
import { and, desc, eq, gte, lte } from "drizzle-orm";
import { endOfDay, startOfDay } from "date-fns";

export const DeliveryRecordZod = z.object({
  filled_bottles: z.number(),
  empty_bottles: z.number(),
  deposit_bottles: z.number(),
  foc: z.number(),
  damaged_bottles: z.number(),
  customer_id: z.string(),
  balance: z.number(),
  customer_bottles: z.number(),
  payment: z.number(),
  is_online: z.boolean().default(false),

  moderator_id: z.string(),
  delivery_date: z.date(),
});

const DeliveryOutputZod = z.discriminatedUnion("success", [
  z.object({
    success: z.literal(false),
    error: z.string(),
  }),
  z.object({
    success: z.literal(true),
  }),
]);

export const addDailyDelivery = os
  .input(DeliveryRecordZod)
  .output(DeliveryOutputZod)
  .handler(async ({ input }) => {
    try {
      // get customer
      const [customer] = await db
        .select()
        .from(Customer)
        .where(eq(Customer.customer_id, input.customer_id));

      if (!customer.isActive) {
        return { success: false, error: "Customer is not active." };
      }

      // get bottle usage for the day (create one if missing)
      let [bottleUsage] = await db
        .select()
        .from(BottleUsage)
        .where(
          and(
            eq(BottleUsage.moderator_id, input.moderator_id),
            gte(BottleUsage.createdAt, startOfDay(input.delivery_date)),
            lte(BottleUsage.createdAt, endOfDay(input.delivery_date))
          )
        )
        .orderBy(desc(BottleUsage.createdAt))
        .limit(1);

      // If no bottle usage exists for this day (or the existing one is marked done), create a fresh record
      if (!bottleUsage || bottleUsage.done) {
        // Get the most recent previous bottle usage to carry over remaining/empty counts
        const [previousBottleUsage] = await db
          .select()
          .from(BottleUsage)
          .where(eq(BottleUsage.moderator_id, input.moderator_id))
          .orderBy(desc(BottleUsage.createdAt))
          .limit(1);

        try {
          const [newBottleUsage] = await db
            .insert(BottleUsage)
            .values({
              moderator_id: input.moderator_id,
              filled_bottles: 0,
              empty_bottles: previousBottleUsage?.empty_bottles ?? 0,
              remaining_bottles: previousBottleUsage?.remaining_bottles ?? 0,
              damaged_bottles: previousBottleUsage?.damaged_bottles ?? 0,
              sales: 0,
              revenue: 0,
              createdAt: startOfDay(input.delivery_date),
              done: false,
            })
            .returning();

          bottleUsage = newBottleUsage;
        } catch (insertError) {
          // Race condition: another process might have created it. Try to fetch again and proceed if found.
          const [existingUsage] = await db
            .select()
            .from(BottleUsage)
            .where(
              and(
                eq(BottleUsage.moderator_id, input.moderator_id),
                gte(BottleUsage.createdAt, startOfDay(input.delivery_date)),
                lte(BottleUsage.createdAt, endOfDay(input.delivery_date))
              )
            )
            .orderBy(desc(BottleUsage.createdAt))
            .limit(1);

          if (existingUsage) {
            bottleUsage = existingUsage;
          } else {
            throw insertError;
          }
        }
      }

      // get total bottles record
      const [totalBottles] = await db
        .select()
        .from(TotalBottles)
        .orderBy(desc(TotalBottles.createdAt))
        .limit(1);

      if (!bottleUsage)
        return { success: false, error: "Bottle usage record not found." };

      if (!totalBottles) {
        return { success: false, error: "Total bottles record not found." };
      }

      const updatedSales = bottleUsage.sales + input.filled_bottles;

      if (bottleUsage.remaining_bottles < input.filled_bottles) {
        return { success: false, error: "Insufficient bottles to sale." };
      }

      await db.transaction(async (tx) => {
        await Promise.all([
          tx
            .update(Customer)
            .set({
              balance: input.balance,
              bottles: input.customer_bottles,
              deposit: customer.deposit + input.deposit_bottles,
            })
            .where(eq(Customer.customer_id, input.customer_id))
            .returning(),

          tx
            .update(BottleUsage)
            .set({
              sales: updatedSales,
              empty_bottles: bottleUsage.empty_bottles + input.empty_bottles,
              remaining_bottles:
                bottleUsage.remaining_bottles - input.filled_bottles,
              damaged_bottles:
                bottleUsage.damaged_bottles + input.damaged_bottles,
              revenue: bottleUsage.revenue + input.payment,
            })
            .where(eq(BottleUsage.id, bottleUsage.id))
            .returning(),

          tx
            .update(TotalBottles)
            .set({
              damaged_bottles:
                totalBottles.damaged_bottles + input.damaged_bottles,
              available_bottles: Math.max(
                0,
                totalBottles.available_bottles - input.damaged_bottles
              ),
            })
            .where(eq(TotalBottles.id, totalBottles.id))
            .returning(),

          tx
            .insert(Delivery)
            .values({
              customer_id: input.customer_id,
              moderator_id: input.moderator_id,
              delivery_date: input.delivery_date,
              payment: input.payment,
              is_online: input.is_online,

              filled_bottles: input.filled_bottles,
              empty_bottles: input.empty_bottles,
              foc: input.foc,
              damaged_bottles: input.damaged_bottles,
            })
            .returning(),
        ]);
      });

      return {
        success: true,
      };
    } catch (error) {
      console.error("Error adding daily delivery record:", error);
      return {
        success: false,
        error: `Error adding daily delivery record: ${error}`,
      };
    }
  });

export const getDailyDeliveries = os
  .input(z.object({ moderator_id: z.string(), date: z.date() }))
  .output(
    z.union([
      z.array(
        z.object({
          Delivery: z.custom<typeof Delivery.$inferSelect>(),
          Customer: z.custom<typeof Customer.$inferSelect>(),
        })
      ),
      z.null(),
    ])
  )
  .handler(async ({ input }) => {
    const data = await db
      .select()
      .from(Delivery)
      .where(
        and(
          eq(Delivery.moderator_id, input.moderator_id),
          gte(Delivery.delivery_date, startOfDay(input.date)),
          lte(Delivery.delivery_date, endOfDay(input.date))
        )
      )
      .orderBy(desc(Delivery.createdAt))
      .innerJoin(Customer, eq(Delivery.customer_id, Customer.customer_id));

    return data;
  });

export const getCustomersByArea = os
  .input(z.object({ area: z.enum(Area.enumValues) }))
  .output(z.array(z.custom<typeof Customer.$inferSelect>()))
  .errors({
    INTERNAL_SERVER_ERROR: {
      status: 500,
      message: "Error fetching customers",
    },
  })
  .handler(async ({ input, errors }) => {
    try {
      const customers = await db
        .select()
        .from(Customer)
        .where(and(eq(Customer.area, input.area), eq(Customer.isActive, true)));
      return customers;
    } catch (error) {
      console.error("Error fetching customers by area:", error);
      throw errors.INTERNAL_SERVER_ERROR();
    }
  });
