import { adminProcedure } from "@/middlewares/admin-clerk";
import { Customer, Delivery, Moderator } from "@/db/schema";
import { z } from "zod";
import { subDays } from "date-fns";
import { db } from "@/db";
import { and, desc, eq, gte, lte } from "drizzle-orm";

export const Delivery30dRow = z.object({
  Delivery: z.custom<typeof Delivery.$inferSelect>(),
  Moderator: z.custom<typeof Moderator.$inferSelect>(),
  Customer: z.custom<typeof Customer.$inferSelect>(),
});

export const get30dDeliveries = adminProcedure
  .input(z.void())
  .output(Delivery30dRow.array())
  .handler(async () => {
    const now = new Date();
    const from = subDays(now, 30);

    const deliveries = await db
      .select()
      .from(Delivery)
      .where(and(lte(Delivery.createdAt, now), gte(Delivery.createdAt, from)))
      .innerJoin(Moderator, eq(Delivery.moderator_id, Moderator.id))
      .innerJoin(Customer, eq(Delivery.customer_id, Customer.customer_id))
      .orderBy(desc(Delivery.createdAt));

    // Return fully joined rows to avoid N+1 queries
    return deliveries as z.infer<typeof Delivery30dRow>[];
  });
