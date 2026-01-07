import { ORPCError, os } from "@orpc/server";
import { z } from "zod";
import { db } from "@/db";
import { BottleUsage, TotalBottles } from "@/db/schema";
import { and, desc, eq, gte, lte } from "drizzle-orm";
import { endOfDay, startOfDay, addHours, subDays } from "date-fns";
import { format } from "date-fns";
import { TIME_OFFSET } from "@/lib/utils";

export const addUpdateBottleUsage = os
  .input(
    z.object({
      moderator_id: z.string(),
      dob: z.date().nullable(),
      filled_bottles: z.number(),
      caps: z.number(),
    })
  )
  .output(z.object({ success: z.boolean() }))
  .errors({
    TOTAL_BOTTLES_404: {
      status: 404,
      message: "Total bottles record not found",
    },
    BAD_REQUEST: {
      status: 400,
      message: "Filled_bottles cannot exceed total available bottles",
    },
  })
  .handler(async ({ input, errors }) => {
    if (!input.dob) {
      throw new ORPCError("BAD_REQUEST: DOB is not provided");
    }

    const from = input.dob;
    const to = endOfDay(input.dob);

    const [total_bottles] = await db
      .select()
      .from(TotalBottles)
      .orderBy(desc(TotalBottles.createdAt))
      .limit(1);

    if (!total_bottles) {
      throw errors.TOTAL_BOTTLES_404();
    }

    if (total_bottles.available_bottles < input.filled_bottles) {
      throw errors.BAD_REQUEST();
    }

    const [bottleUsage] = await db
      .select()
      .from(BottleUsage)
      .orderBy(desc(BottleUsage.createdAt))
      .where(
        and(
          eq(BottleUsage.moderator_id, input.moderator_id),
          lte(BottleUsage.createdAt, to),
          gte(BottleUsage.createdAt, from)
        )
      )
      .limit(1);

    if (!bottleUsage) {
      const [previousBottleUsage] = await db
        .select()
        .from(BottleUsage)
        .where(eq(BottleUsage.moderator_id, input.moderator_id))
        .orderBy(desc(BottleUsage.createdAt))
        .limit(1);
      // Attempt to create new bottle usage record
      await db.transaction(async (tx) => {
        await Promise.all([
          tx.insert(BottleUsage).values({
            moderator_id: input.moderator_id,
            filled_bottles: input.filled_bottles,
            empty_bottles: previousBottleUsage?.empty_bottles ?? 0,
            remaining_bottles: (previousBottleUsage?.remaining_bottles ?? 0) + input.filled_bottles,
            caps: input.caps,
            createdAt: from,
          }),
          tx
            .update(TotalBottles)
            .set({
              available_bottles:
                total_bottles.available_bottles - input.filled_bottles,
              used_bottles: total_bottles.used_bottles + input.filled_bottles,
            })
            .where(eq(TotalBottles.id, total_bottles.id)),
        ]);
      });

      return { success: true };
    }

    if (bottleUsage?.done) {
      throw new ORPCError(
        `Bottle usage for ${format(input.dob, "PPP")} is already marked as done`
      );
    }

    await db.transaction(async (tx) => {
      await Promise.all([
        tx
          .update(BottleUsage)
          .set({
            filled_bottles: bottleUsage.filled_bottles + input.filled_bottles,
            remaining_bottles:
              bottleUsage.remaining_bottles + input.filled_bottles,
            caps: bottleUsage.caps + input.caps,
          })
          .where(eq(BottleUsage.id, bottleUsage.id)),

        tx
          .update(TotalBottles)
          .set({
            available_bottles:
              total_bottles.available_bottles - input.filled_bottles,
            used_bottles: total_bottles.used_bottles + input.filled_bottles,
          })
          .where(eq(TotalBottles.id, total_bottles.id)),
      ]);
    });

    return { success: true };
  });