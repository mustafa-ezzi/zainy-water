import { os } from "@orpc/server";
import { z } from "zod";
import { db } from "@/db";
import { BottleUsage, Miscellaneous, Moderator } from "@/db/schema";
import { and, desc, eq, gte, lte } from "drizzle-orm";
import { endOfDay, startOfDay } from "date-fns";

export const addMiscDelivery = os
  .input(
    z.object({
      moderator_id: z.string(),
      customer_name: z.string(),
      description: z.string(),
      filled_bottles: z.number(),
      empty_bottles: z.number(),
      damaged_bottles: z.number(),
      isPaid: z.boolean(),
      payment: z.number(),
      delivery_date: z.coerce.date(),
    })
  )
  .output(z.void())
  .errors({
    UNAUTHORIZED: {
      status: 401,
      message: "You must be logged in to perform this action.",
    },
    BAD_REQUEST: {
      status: 400,
      message: "Not enough remaining bottles",
    },
    BOTTLE_USAGE_404: {
      status: 404,
      message: "Bottle usage not found",
    },
  })
  .handler(async ({ input, errors }) => {
    const [moderator] = await db
      .select()
      .from(Moderator)
      .where(eq(Moderator.id, input.moderator_id))
      .limit(1);

    if (!moderator) {
      throw errors.UNAUTHORIZED();
    }

    const [bottleUsage] = await db
      .select()
      .from(BottleUsage)
      .where(
        and(
          eq(BottleUsage.moderator_id, input.moderator_id),
          gte(
            BottleUsage.createdAt,
            startOfDay(input.delivery_date)
          ),
          lte(
            BottleUsage.createdAt,
            endOfDay(input.delivery_date)
          )
        )
      )
      .orderBy(desc(BottleUsage.createdAt))
      .limit(1);

    if (!bottleUsage) {
      throw errors.BOTTLE_USAGE_404();
    }

    if (bottleUsage.remaining_bottles < input.filled_bottles) {
      throw errors.BAD_REQUEST();
    }

    // Proceed with adding the miscellaneous delivery
    await db.transaction(async (tx) => {
      await Promise.all([
        tx.insert(Miscellaneous).values({
          moderator_id: input.moderator_id,
          customer_name: input.customer_name,
          description: input.description,
          filled_bottles: input.filled_bottles,
          empty_bottles: input.empty_bottles,
          damaged_bottles: input.damaged_bottles,
          payment: input.isPaid ? input.payment : 0,
          isPaid: input.isPaid,
          delivery_date: new Date(input.delivery_date),
        }),

        tx
          .update(BottleUsage)
          .set({
            sales: bottleUsage.sales + input.filled_bottles,
            remaining_bottles:
              bottleUsage.remaining_bottles - input.filled_bottles,
            empty_bottles: bottleUsage.empty_bottles + input.empty_bottles,
            damaged_bottles:
              bottleUsage.damaged_bottles + input.damaged_bottles,
            revenue: bottleUsage.revenue + (input.isPaid ? input.payment : 0), 

          })
          .where(eq(BottleUsage.id, bottleUsage.id)),
      ]);
    });
  });
