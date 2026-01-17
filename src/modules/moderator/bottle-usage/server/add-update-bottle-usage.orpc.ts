import { ORPCError, os } from "@orpc/server";
import { z } from "zod";
import { db } from "@/db";
import { BottleUsage, TotalBottles } from "@/db/schema";
import { and, desc, eq, gte, lte } from "drizzle-orm";
import { endOfDay } from "date-fns";

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
      message: "Filled bottles cannot exceed total available bottles",
    },
  })
  .handler(async ({ input, errors }) => {
    if (!input.dob) throw new ORPCError("BAD_REQUEST: DOB is not provided");

    const from = input.dob;
    const to = endOfDay(input.dob);

    // 1️⃣ Get latest TotalBottles
    const [totalBottles] = await db
      .select()
      .from(TotalBottles)
      .orderBy(desc(TotalBottles.createdAt))
      .limit(1);

    if (!totalBottles) throw errors.TOTAL_BOTTLES_404();

    if (totalBottles.available_bottles < input.filled_bottles) {
      throw errors.BAD_REQUEST();
    }

    // 2️⃣ Check if BottleUsage exists for this moderator/date
    const [existingUsage] = await db
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

    // 3️⃣ Transaction to update both tables atomically
    await db.transaction(async (tx) => {
      if (!existingUsage) {
        // First entry for this day
        const [previousUsage] = await tx
          .select()
          .from(BottleUsage)
          .where(eq(BottleUsage.moderator_id, input.moderator_id))
          .orderBy(desc(BottleUsage.createdAt))
          .limit(1);

        await tx.insert(BottleUsage).values({
          moderator_id: input.moderator_id,
          filled_bottles: input.filled_bottles,
          caps: input.caps,
          empty_bottles: previousUsage?.empty_bottles ?? 0,
          remaining_bottles:
            (previousUsage?.remaining_bottles ?? totalBottles.available_bottles) -
            input.filled_bottles,
          createdAt: from,
        });
      } else {
        if (existingUsage.done) {
          throw new ORPCError(
            `Bottle usage for ${from.toDateString()} is already marked as done`
          );
        }

        await tx
          .update(BottleUsage)
          .set({
            filled_bottles: existingUsage.filled_bottles + input.filled_bottles,
            caps: existingUsage.caps + input.caps,
            remaining_bottles:
              existingUsage.remaining_bottles - input.filled_bottles,
          })
          .where(eq(BottleUsage.id, existingUsage.id));
      }

      // 4️⃣ Update TotalBottles
      await tx
        .update(TotalBottles)
        .set({
          available_bottles: totalBottles.available_bottles - input.filled_bottles,
          used_bottles: totalBottles.used_bottles + input.filled_bottles,
        })
        .where(eq(TotalBottles.id, totalBottles.id));
    });

    return { success: true };
  });
