/* eslint-disable @typescript-eslint/no-unused-vars */
import { z } from "zod";
import { os } from "@orpc/server";
import { db } from "@/db";
import { BottleUsage, TotalBottles } from "@/db/schema";
import { and, desc, eq, gte, lte } from "drizzle-orm";
import { startOfDay, endOfDay } from "date-fns";
import { ORPCError } from "@orpc/client";

export const MiscellaneousBottleUsageDataSchema = z.object({
  moderator_id: z.string(),
  empty_bottles: z.number().min(0),
  damaged_bottles: z.number().min(0),
  date: z.date(),
});

export const addMiscBottleUsage = os
  .input(MiscellaneousBottleUsageDataSchema)
  .output(z.void())
  .errors({
    BOTTLE_USAGE_NOT_FOUND: {
      status: 404,
      message: "No bottle usage found for today",
    },
    INSUFFICIENT_REMAINING_BOTTLES: {
      status: 400,
      message: "Not enough remaining bottles capacity for damaged bottles",
    },
  })
  .handler(async ({ input, errors }) => {
    // Get bottle usage record for the provided date
    const from = startOfDay(input.date);
    const to = endOfDay(input.date);

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
      throw errors.BOTTLE_USAGE_NOT_FOUND();
    }

    // Validate damaged bottles don't exceed remaining bottles
    if (input.damaged_bottles > bottleUsage.remaining_bottles) {
      throw errors.INSUFFICIENT_REMAINING_BOTTLES();
    }

    // Update bottle usage:
    // - ADD empty bottles received
    // - ADD damaged bottles count
    // - SUBTRACT damaged bottles from remaining
    await db
      .update(BottleUsage)
      .set({
        empty_bottles: bottleUsage.empty_bottles + input.empty_bottles,
        damaged_bottles: bottleUsage.damaged_bottles + input.damaged_bottles,
        remaining_bottles: bottleUsage.remaining_bottles - input.damaged_bottles,
      })
      .where(eq(BottleUsage.id, bottleUsage.id));
  });
