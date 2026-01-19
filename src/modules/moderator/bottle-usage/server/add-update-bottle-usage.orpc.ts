import { ORPCError, os } from "@orpc/server";
import { z } from "zod";
import { db } from "@/db";
import { BottleUsage, TotalBottles } from "@/db/schema";
import { and, eq, gte, lte } from "drizzle-orm";
import { startOfDay, endOfDay } from "date-fns";

export const addUpdateBottleUsage = os
  .input(
    z.object({
      moderator_id: z.string(),
      dob: z.date(),
      filled_bottles: z.number().min(0),
      caps: z.number().min(0),
    })
  )
  .output(
    z.object({
      success: z.boolean(),
      totalBottles: z.object({
        available_bottles: z.number(),
        used_bottles: z.number(),
      }),
    })
  )
  .errors({
    BAD_REQUEST: { status: 400, message: "Invalid operation" },
    ALREADY_DONE: { status: 400, message: "This day is already marked as done" },
  })
  .handler(async ({ input, errors }) => {
    const from = startOfDay(input.dob);
    const to = endOfDay(input.dob);

    return await db.transaction(async (tx) => {
      // 1️⃣ Get Total Bottles
      const [total] = await tx.select().from(TotalBottles).limit(1);
      if (!total) throw errors.BAD_REQUEST({ message: "TotalBottles not initialized" });

      // 2️⃣ Get existing usage
      const [existing] = await tx
        .select()
        .from(BottleUsage)
        .where(
          and(
            eq(BottleUsage.moderator_id, input.moderator_id),
            gte(BottleUsage.createdAt, from),
            lte(BottleUsage.createdAt, to)
          )
        )
        .limit(1);

      if (existing?.done) throw errors.ALREADY_DONE();

      let actualRefill = input.filled_bottles;

      // -------------------------------
      // FIRST ENTRY OF THE DAY
      // -------------------------------
      if (!existing) {
        if (total.available_bottles < input.filled_bottles) {
          throw errors.BAD_REQUEST({ message: "Not enough bottles in stock" });
        }

        await tx.insert(BottleUsage).values({
          moderator_id: input.moderator_id,
          filled_bottles: input.filled_bottles,
          remaining_bottles: input.filled_bottles,
          caps: input.caps,
          createdAt: from,
        });

      } else {
        // -------------------------------
        // REFILL FLOW
        // -------------------------------
        const totalCaps = existing.caps + input.caps;
        const refillable = Math.min(existing.empty_bottles, totalCaps);
        actualRefill = Math.min(refillable, input.filled_bottles);

        if (actualRefill <= 0) {
          return {
            success: true,
            totalBottles: {
              available_bottles: total.available_bottles,
              used_bottles: total.used_bottles,
            },
          };
        }

        if (total.available_bottles < actualRefill) {
          throw errors.BAD_REQUEST({
            message: "Not enough bottles in stock for refill",
          });
        }

        await tx.update(BottleUsage).set({
          caps: totalCaps - actualRefill,
          empty_bottles: existing.empty_bottles - actualRefill,
          remaining_bottles: existing.remaining_bottles + actualRefill,
          refilled_bottles: existing.refilled_bottles + actualRefill,
          updatedAt: new Date(),
        }).where(eq(BottleUsage.id, existing.id));
      }

      // 3️⃣ Update TotalBottles
      const updatedTotal = await tx
        .update(TotalBottles)
        .set({
          available_bottles: total.available_bottles - actualRefill,
          used_bottles: total.used_bottles + actualRefill,
          updatedAt: new Date(),
        })
        .where(eq(TotalBottles.id, total.id))
        .returning();

      return {
        success: true,
        totalBottles: {
          available_bottles: updatedTotal[0].available_bottles,
          used_bottles: updatedTotal[0].used_bottles,
        },
      };
    });
  });
