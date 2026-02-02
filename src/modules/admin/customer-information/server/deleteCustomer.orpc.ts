import { adminProcedure } from "@/middlewares/admin-clerk";
import { db } from "@/db";
import { Customer, TotalBottles } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";

export const deleteCustomer = adminProcedure
  .input(z.object({ id: z.string() }))
  .output(z.void())
  .handler(async ({ input }) => {
    await db.transaction(async (tx) => {
      // 1️⃣ Fetch customer
      const [customer] = await tx
        .select()
        .from(Customer)
        .where(eq(Customer.id, input.id))
        .limit(1);

      if (!customer) {
        throw new Error("Customer not found");
      }

      const deposit = customer.deposit ?? 0;

      // 2️⃣ Fetch latest total bottles
      const [total] = await tx
        .select()
        .from(TotalBottles)
        .orderBy(desc(TotalBottles.createdAt))
        .limit(1);

      if (!total) {
        throw new Error("TotalBottles entry not found");
      }

      // 3️⃣ Return deposit bottles
      if (deposit > 0) {
        await tx
          .update(TotalBottles)
          .set({
            available_bottles: total.available_bottles + deposit,
            deposit_bottles: Math.max(
              (total.deposit_bottles ?? 0) - deposit,
              0
            ),
          })
          .where(eq(TotalBottles.id, total.id));
      }

      // 4️⃣ Delete customer
      await tx.delete(Customer).where(eq(Customer.id, input.id));
    });
  });
