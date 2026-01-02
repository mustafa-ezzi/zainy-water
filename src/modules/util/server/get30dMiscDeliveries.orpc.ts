import { adminProcedure } from "@/middlewares/admin-clerk";
import { Miscellaneous, Moderator } from "@/db/schema";
import { z } from "zod";
import { subDays } from "date-fns";
import { db } from "@/db";
import { and, desc, eq, gte, lte } from "drizzle-orm";

export const MiscDeliveriesRecords = z.object({
  Miscellaneous: z.custom<typeof Miscellaneous.$inferSelect>(),
  Moderator: z.custom<typeof Moderator.$inferSelect>(),
});

export const get30dMiscDeliveries = adminProcedure
  .input(z.void())
  .output(MiscDeliveriesRecords.array())
  .handler(async () => {
    const now = new Date();
    const from = subDays(now, 30);

    try {
      const misc_deliveries = await db
        .select()
        .from(Miscellaneous)
        .where(
          and(
            lte(Miscellaneous.createdAt, now),
            gte(Miscellaneous.createdAt, from),
          ),
        )
        .innerJoin(Moderator, eq(Miscellaneous.moderator_id, Moderator.id))
        .orderBy(desc(Miscellaneous.createdAt));

      return misc_deliveries;
    } catch (error) {
      console.error("Error fetching 30D misc deliveries:", error);
      throw error;
    }
  });
