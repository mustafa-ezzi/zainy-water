import { db } from "@/db";
import { BottleUsage, TotalBottles } from "@/db/schema";
import { TIME_OFFSET } from "@/lib/utils";
import { ORPCError, os } from "@orpc/server";
import { addHours, endOfDay, startOfDay } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { and, desc, eq, gte, lte } from "drizzle-orm";
import z from "zod";

export const returnBottleUsage = os
  .input(
    z.object({
      moderator_id: z.string(),
      empty_bottles: z.number().min(0, "Empty bottles must be non-negative"),
      remaining_bottles: z
        .number()
        .min(0, "Remaining bottles must be non-negative"),
      caps: z.number().min(0, "Caps must be non-negative"),
      dob: z.date().nullable(),
    })
  )
  .output(z.void())
  .errors({
    BOTTLE_USAGE_404: {
      status: 404,
      message: "Bottle usage record not found for this moderator",
    },
    TOTAL_BOTTLES_404: {
      status: 404,
      message: "Total bottles record not found",
    },
    INSUFFICIENT_BOTTLES: {
      status: 400,
      message: "Insufficient bottles to return",
    },
    INSUFFICIENT_CAPS: {
      status: 400,
      message: "Insufficient caps to return",
    },
  })
  .handler(async ({ input, errors }) => {
    if (!input.dob) {
      throw new ORPCError("BAD_REQUEST: DOB is not provided");
    }

    // Shift the time range by TIME_OFFSET hours to account for GMT+5 (Karachi timezone) in production
    const from = startOfDay(input.dob);
    const to = endOfDay(input.dob);

    const [bottleUsage] = await db
      .select()
      .from(BottleUsage)
      .where(
        and(
          eq(BottleUsage.moderator_id, input.moderator_id),
          gte(BottleUsage.createdAt, from),
          lte(BottleUsage.createdAt, to)
        )
      )
      .orderBy(desc(BottleUsage.createdAt))
      .limit(1);

    if (!bottleUsage) {
      throw errors.BOTTLE_USAGE_404();
    }

    if (bottleUsage.done) {
      throw new Error("Bottle usage is already marked as done");
    }

    // Check if moderator has enough bottles and caps to return
    if (
      bottleUsage.empty_bottles < input.empty_bottles ||
      bottleUsage.remaining_bottles < input.remaining_bottles
    ) {
      throw errors.INSUFFICIENT_BOTTLES();
    }

    if (bottleUsage.caps < input.caps) {
      throw errors.INSUFFICIENT_CAPS();
    }

    const [totalBottles] = await db
      .select()
      .from(TotalBottles)
      .orderBy(desc(TotalBottles.createdAt))
      .limit(1);

    if (!totalBottles) {
      throw errors.TOTAL_BOTTLES_404();
    }

    await db.transaction(async (tx) => {
      await Promise.all([
        // Update TotalBottles
        tx
          .update(TotalBottles)
          .set({
            available_bottles:
              totalBottles.available_bottles +
              input.empty_bottles +
              input.remaining_bottles,
            used_bottles:
              totalBottles.used_bottles -
              input.empty_bottles -
              input.remaining_bottles,
          })
          .where(eq(TotalBottles.id, totalBottles.id)),

        // Update BottleUsage
        tx
          .update(BottleUsage)
          .set({
            empty_bottles: bottleUsage.empty_bottles - input.empty_bottles,
            remaining_bottles:
              bottleUsage.remaining_bottles - input.remaining_bottles,
            returned_bottles:
              bottleUsage.returned_bottles +
              input.remaining_bottles +
              input.empty_bottles,
            empty_returned: bottleUsage.empty_returned + input.empty_bottles,
            remaining_returned:
              bottleUsage.remaining_returned + input.remaining_bottles,
          })
          .where(eq(BottleUsage.id, bottleUsage.id)),
      ]);
    });
  });
