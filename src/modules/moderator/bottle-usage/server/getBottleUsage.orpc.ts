import { endOfDay, startOfDay } from "date-fns";
import { and, desc, eq, gte, lte } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { BottleUsage } from "@/db/schema";
import { ORPCError, os } from "@orpc/server";

export const getBottleUsage = os
  .input(z.object({ id: z.string(), date: z.date().nullable() }))
  .output(z.union([z.custom<typeof BottleUsage.$inferSelect>(), z.null()]))
  .handler(async ({ input }) => {
    if (!input.id) {
      throw new ORPCError("BAD_REQUEST: Moderator ID is missing");
    }
    if (!input.date) {
      throw new ORPCError("BAD_REQUEST: DOB is not provided");
    }

    // Shift the time range by TIME_OFFSET hours to account for GMT+5 (Karachi timezone) in production
    const from = startOfDay(input.date);
    const to = endOfDay(input.date);

    try {
      // First, try to get today's bottle usage
      console.log(`Fetching bottle-usage record:\nFrom: ${from} \nTo: ${to}`);
      const [bottleUsage] = await db
        .select()
        .from(BottleUsage)
        .where(
          and(
            eq(BottleUsage.moderator_id, input.id),
            gte(BottleUsage.createdAt, from),
            lte(BottleUsage.createdAt, to)
          )
        )
        .orderBy(desc(BottleUsage.createdAt))
        .limit(1);

      if (bottleUsage) {
        return bottleUsage;
      }
      return null;

      // // If no record exists for today, create one
      // // First get the most recent bottle usage to carry over remaining bottles
      // const prevFrom = startOfDay(subDays(input.date, 1));
      // const prevTo = endOfDay(subDays(input.date, 1));

      // const [previousBottleUsage] = await db
      //   .select()
      //   .from(BottleUsage)
      //   .where(
      //     and(
      //       eq(BottleUsage.moderator_id, input.id),
      //       gte(BottleUsage.createdAt, prevFrom),
      //       lte(BottleUsage.createdAt, prevTo)
      //     )
      //   )
      //   .limit(1);

      // // Attempt to create new bottle usage record
      // try {
      //   const [newBottleUsage] = await db
      //     .insert(BottleUsage)
      //     .values({
      //       moderator_id: input.id,
      //       filled_bottles: 0,
      //       empty_bottles: previousBottleUsage?.empty_bottles ?? 0,
      //       remaining_bottles: previousBottleUsage?.remaining_bottles ?? 0,
      //       createdAt: from,
      //     })
      //     .returning();

      //   return newBottleUsage;
      // } catch (insertError) {
      //   // If insert fails (possibly due to race condition), try to fetch again
      //   console.warn(
      //     "Insert failed, attempting to fetch existing record:",
      //     insertError
      //   );

      //   const [existingUsage] = await db
      //     .select()
      //     .from(BottleUsage)
      //     .where(
      //       and(
      //         eq(BottleUsage.moderator_id, input.id),
      //         gte(BottleUsage.createdAt, from),
      //         lte(BottleUsage.createdAt, to)
      //       )
      //     )
      //     .orderBy(desc(BottleUsage.createdAt))
      //     .limit(1);

      //   if (existingUsage) {
      //     return existingUsage;
      //   }

      //   // If we still can't find a record, re-throw the original error
      //   throw insertError;
      // }
    } catch (error) {
      console.error("Error fetching bottle usage:", error);
      // Re-throw the error so React Query can handle it properly
      // This allows you to distinguish between errors and null data in your UI
      throw new ORPCError(
        `Failed to fetch bottle usage for moderator ${input.id}: ${error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  });
