import { adminProcedure } from "@/middlewares/admin-clerk";
import { z } from "zod";
import { Customer, TotalBottles } from "@/db/schema";
import { db } from "@/db";
import { desc, eq } from "drizzle-orm";

export const CreateNewCustomerDataSchema = z.object({
  data: z.custom<typeof Customer.$inferInsert>(),
});

export const createCustomer = adminProcedure
  .input(CreateNewCustomerDataSchema)
  .output(z.void())
  .handler(async ({ input }) => {
    const customer = input.data;

    await db.transaction(async (tx) => {
      // 🔒 ALWAYS read inside transaction
      const [total] = await tx
        .select()
        .from(TotalBottles)
        .orderBy(desc(TotalBottles.createdAt))
        .limit(1);

      if (!total) {
        throw new Error("TotalBottles entry does not exist.");
      }

      if (customer.deposit > total.available_bottles) {
        throw new Error("Not enough available bottles for deposit.");
      }

      const deposit = customer.deposit ?? 0;

      // ✅ Update bottles FIRST
      await tx
        .update(TotalBottles)
        .set({
          total_bottles: total.total_bottles - deposit,
          available_bottles: total.available_bottles - deposit,
          deposit_bottles: (total.deposit_bottles ?? 0) + deposit,
        })
        .where(eq(TotalBottles.id, total.id));

      // ✅ Then create customer
      await tx.insert(Customer).values({
        ...customer,
        customer_id: customer.customer_id.toLowerCase(),
      });
    });
  });
