import { db } from "@/db";
import { BottleUsage, TotalBottles } from "@/db/schema";
import { adminProcedure } from "@/middlewares/admin-clerk";
import { ORPCError } from "@orpc/client";
import { desc, eq } from "drizzle-orm";
import z from "zod";

export const resetBottleUsage = adminProcedure
  .input(z.string())
  .output(z.void())
  .handler(async ({ input: id }) => {
    const result = await db.transaction(async (tx) => {
      return await Promise.all([
        tx.select().from(BottleUsage).where(eq(BottleUsage.id, id)).limit(1),

        tx
          .select()
          .from(TotalBottles)
          .orderBy(desc(TotalBottles.createdAt))
          .limit(1),
      ]);
    });

    const data = {
      bottleUsage: result[0][0],
      totalBottles: result[1][0],
    };

    if (!data.bottleUsage || !data.totalBottles) {
      throw new ORPCError("Bottle usage or total bottles record not found");
    }

    const new_available_bottles =
      data.totalBottles.available_bottles +
      data.bottleUsage.empty_bottles +
      data.bottleUsage.remaining_bottles;
    const new_used_bottles =
      data.totalBottles.total_bottles - new_available_bottles;

    await db.transaction(async (tx) => {
      await Promise.all([
        tx
          .update(BottleUsage)
          .set({
            filled_bottles: 0,
            sales: 0,
            returned_bottles: 0,
            empty_bottles: 0,
            remaining_bottles: 0,
            damaged_bottles: 0,
            empty_returned: 0,
            remaining_returned: 0,
            revenue: 0,
            expense: 0,
            caps: 0,
          })
          .where(eq(BottleUsage.id, id)),

        tx
          .update(TotalBottles)
          .set({
            available_bottles: new_available_bottles,
            used_bottles: new_used_bottles,
          })
          .where(eq(TotalBottles.id, data.totalBottles.id)),
      ]);
    });
  });
