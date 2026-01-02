import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { db } from "@/db";
import { BottleUsage, TotalBottles } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { adminProcedure } from "@/middlewares/admin-clerk";

export const editBottleUsage = adminProcedure
  .input(
    z.object({
      id: z.string(),
      status: z.boolean(),
      revenue: z.number(),
      expense: z.number(),
      filled: z.number(),
      sales: z.number(),
      empty: z.number(),
      remaining: z.number(),
      empty_returned: z.number(),
      remaining_returned: z.number(),
      damaged: z.number(),
      refilled: z.number(),
      caps: z.number(),
    })
  )
  .output(z.object({ success: z.boolean() }))
  .errors({
    TOTAL_BOTTLES_404: {
      status: 404,
      message: "Total bottles record not found",
    },
    BOTTLE_USAGE_404: {
      status: 404,
      message: "Bottle Usage record not found",
    },
  })
  .handler(async ({ input, errors }) => {
    const [total_bottles] = await db
      .select()
      .from(TotalBottles)
      .orderBy(desc(TotalBottles.createdAt))
      .limit(1);

    if (!total_bottles) {
      throw errors.TOTAL_BOTTLES_404();
    }

    const [bottleUsage] = await db
      .select()
      .from(BottleUsage)
      .where(eq(BottleUsage.id, input.id));

    if (!bottleUsage) {
      throw errors.BOTTLE_USAGE_404();
    }

    // Input Validation
    const valueDiffs = {
      filled: input.filled - bottleUsage.filled_bottles,
      empty: input.empty - bottleUsage.empty_bottles,
      sales: input.sales - bottleUsage.sales,
      remaining: input.remaining - bottleUsage.remaining_bottles,
      empty_returned: input.empty_returned - bottleUsage.empty_returned,
      remaining_returned:
        input.remaining_returned - bottleUsage.remaining_returned,
      damaged: input.damaged - bottleUsage.damaged_bottles,
      refilled: input.refilled - bottleUsage.refilled_bottles,
    };

    if (
      valueDiffs.filled + valueDiffs.damaged >
      total_bottles.available_bottles
    ) {
      throw new ORPCError(
        "Filled + damaged bottles cannot exceed total available bottles"
      );
    }
    if (input.empty > input.sales) {
      throw new ORPCError("Empty bottles cannot exceed sales");
    }
    if (input.sales > input.filled + input.refilled) {
      throw new ORPCError("Sales cannot exceed filled + refilled bottles");
    }
    if (
      input.remaining >
      input.filled - input.empty_returned - input.remaining_returned
    ) {
      throw new ORPCError(
        "Remaining bottles cannot exceed filled - returned bottles"
      );
    }
    if (input.empty_returned > input.sales - input.remaining_returned) {
      throw new ORPCError("Empty returned bottles cannot exceed sales");
    }
    if (
      input.remaining_returned >
      input.filled + input.refilled - input.sales
    ) {
      throw new ORPCError(
        "Remaining returned bottles cannot exceed filled + refilled bottles - sales"
      );
    }
    if (input.refilled > input.sales) {
      throw new ORPCError("Refilled bottles cannot exceed sales");
    }
    if (input.caps < input.refilled) {
      throw new ORPCError("Caps (taken) cannot be less than refilled bottles");
    }

    await db.transaction(async (tx) => {
      await Promise.all([
        tx
          .update(TotalBottles)
          .set({
            damaged_bottles: Math.max(
              total_bottles.damaged_bottles + valueDiffs.damaged,
              0
            ),
            available_bottles: Math.max(
              total_bottles.available_bottles -
                valueDiffs.filled -
                valueDiffs.damaged,
              0
            ),
          })
          .where(eq(TotalBottles.id, total_bottles.id)),

        tx
          .update(BottleUsage)
          .set({
            done: input.status,
            revenue: input.revenue,
            expense: input.expense,
            filled_bottles: input.filled,
            sales: input.sales,
            empty_bottles: input.empty,
            remaining_bottles: input.remaining,
            returned_bottles: input.remaining_returned + input.empty_returned,
            empty_returned: input.empty_returned,
            remaining_returned: input.remaining_returned,
            damaged_bottles: input.damaged,
            refilled_bottles: input.refilled,
            caps: input.caps,
          })
          .where(eq(BottleUsage.id, bottleUsage.id)),
      ]);
    });

    return { success: true };
  });
