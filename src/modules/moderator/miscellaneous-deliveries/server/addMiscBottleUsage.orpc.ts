/* eslint-disable @typescript-eslint/no-unused-vars */
import { z } from "zod";
import { os } from "@orpc/server";
import { db } from "@/db";
import { BottleUsage, TotalBottles } from "@/db/schema";
import { and, desc, eq, gt, lte } from "drizzle-orm";
import { startOfDay } from "date-fns";

export const MiscellaneousBottleUsageDataSchema = z.object({
  moderator_id: z.string(),
  empty_bottles: z.number(),
  damaged_bottles: z.number(),
});

export const addMiscBottleUsage = os
  .input(MiscellaneousBottleUsageDataSchema)
  .output(z.void())
  .errors({
    TOTAL_BOTTLES_404: {
      status: 404,
      message: "Total bottles not found",
    },
  })
  .handler(async ({ input, errors }) => {
    // const [totalBottles] = await db
    //   .select()
    //   .from(TotalBottles)
    //   .orderBy(desc(TotalBottles.createdAt))
    //   .limit(1);
    // if (!totalBottles) {
    //   throw errors.TOTAL_BOTTLES_404();
    // }
    // const [bottleUsage] = await db
    //   .select()
    //   .from(BottleUsage)
    //   .where(
    //     and(
    //       eq(BottleUsage.moderator_id, input.moderator_id),
    //       lte(BottleUsage.createdAt, new Date()),
    //       gt(BottleUsage.createdAt, startOfDay(new Date())),
    //     ),
    //   );
    // if (!!bottleUsage) {
    //   await db
    //     .update(BottleUsage)
    //     .set({
    //       empty_bottles: bottleUsage.empty_bottles + input.empty_bottles,
    //     })
    //     .where(eq(BottleUsage.id, bottleUsage.id));
    // } else {
    //   const bottleUsageData: typeof BottleUsage.$inferInsert = {
    //     moderator_id: input.moderator_id,
    //     empty_bottles: input.empty_bottles,
    //     remaining_bottles: 0,
    //     caps: 0,
    //     filled_bottles: 0,
    //     returned_bottles: 0,
    //     sales: 0,
    //   };
    //   await db.insert(BottleUsage).values({
    //     ...bottleUsageData,
    //   });
    // }
    // await db.update(TotalBottles).set({
    //   damaged_bottles: totalBottles.damaged_bottles + input.damaged_bottles,
    //   available_bottles: totalBottles.available_bottles - input.damaged_bottles,
    // });
  });
