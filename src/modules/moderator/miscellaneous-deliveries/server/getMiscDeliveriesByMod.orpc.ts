import { os } from "@orpc/server";
import { z } from "zod";
import { Miscellaneous } from "@/db/schema";
import { db } from "@/db";
import { and, desc, eq, gte, lte } from "drizzle-orm";
import { endOfDay, startOfDay } from "date-fns";

export const getMiscDeliveriesByMod = os
  .input(z.object({ id: z.string(), dob: z.date() }))
  .output(
    z.union([z.array(z.custom<typeof Miscellaneous.$inferSelect>()), z.null()])
  )
  .handler(async ({ input }) => {
    // Fetch from database directly
    const miscDelivery = await db
      .select()
      .from(Miscellaneous)
      .where(
        and(
          eq(Miscellaneous.moderator_id, input.id),
          gte(Miscellaneous.createdAt, startOfDay(input.dob)),
          lte(Miscellaneous.createdAt, endOfDay(input.dob))
        )
      )
      .orderBy(desc(Miscellaneous.createdAt));

    return miscDelivery.length > 0 ? miscDelivery : null;
  });
