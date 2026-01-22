import { ORPCError, os } from "@orpc/server";
import { z } from "zod";
import { db } from "@/db";
import { BottleUsage, TotalBottles } from "@/db/schema";
import { and, desc, eq, gte, lte } from "drizzle-orm";
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
      totalBottles: z.custom<typeof TotalBottles.$inferSelect>(),
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
      // 1️⃣ Get TotalBottles
      const [total] = await tx.select().from(TotalBottles).limit(1);
      if (!total) throw errors.BAD_REQUEST({ message: "TotalBottles not initialized" });

      // 2️⃣ Get existing usage for that day
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
          empty_bottles: 0,
          refilled_bottles: 0,
          caps: input.caps,
          createdAt: from,
        });

        // update TotalBottles
        const updatedTotal = await tx
          .update(TotalBottles)
          .set({
            available_bottles: total.available_bottles - input.filled_bottles,
            used_bottles: total.used_bottles + input.filled_bottles,
            updatedAt: new Date(),
          })
          .where(eq(TotalBottles.id, total.id))
          .returning();

        return { success: true, totalBottles: updatedTotal[0] };
      }

      // -------------------------------
      // REFILL FLOW
      // -------------------------------
      // -------------------------------
      // UPDATE EXISTING ENTRY
      // -------------------------------

      // Calculate new totals
      const newFilledBottles = existing.filled_bottles + input.filled_bottles;
      const newCaps = existing.caps + input.caps;

      // Calculate how many bottles can be refilled
      const refillable = Math.min(existing.empty_bottles, newCaps);
      const actualRefill = Math.min(refillable, input.filled_bottles);

      // Check stock for new filled bottles + refill
      const totalNeededFromStock = input.filled_bottles + actualRefill;
      if (total.available_bottles < totalNeededFromStock) {
        throw errors.BAD_REQUEST({ message: "Not enough bottles in stock" });
      }

      // Update BottleUsage
      await tx.update(BottleUsage).set({
        filled_bottles: newFilledBottles,
        caps: newCaps - actualRefill,
        empty_bottles: existing.empty_bottles - actualRefill,
        remaining_bottles: existing.remaining_bottles + input.filled_bottles + actualRefill,
        refilled_bottles: (existing.refilled_bottles ?? 0) + actualRefill,
        updatedAt: new Date(),
      }).where(eq(BottleUsage.id, existing.id));

      // Update TotalBottles
      const updatedTotal = await tx.update(TotalBottles).set({
        available_bottles: total.available_bottles - totalNeededFromStock,
        used_bottles: total.used_bottles + totalNeededFromStock,
        updatedAt: new Date(),
      }).where(eq(TotalBottles.id, total.id)).returning();

      return { success: true, totalBottles: updatedTotal[0] };


      // nothing to refill
      return { success: true, totalBottles: total };

    });
  });
