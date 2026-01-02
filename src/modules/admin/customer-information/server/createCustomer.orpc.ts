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
  .handler(async ({ input: data }) => {
    try {
      const [total_bottles] = await db
        .select()
        .from(TotalBottles)
        .orderBy(desc(TotalBottles.createdAt))
        .limit(1);

      if (!total_bottles) {
        throw new Error(
          "Cannot create customer: TotalBottles entry does not exist."
        );
      }

      if (data.data.deposit > total_bottles.available_bottles) {
        throw new Error(
          "Cannot create customer: Not enough available bottles for the deposit."
        );
      }

      await db.transaction(async (tx) => {
        await Promise.all([
          tx
            .update(TotalBottles)
            .set({
              total_bottles: total_bottles.total_bottles - data.data.deposit,
              available_bottles:
                total_bottles.available_bottles - data.data.deposit,
              deposit_bottles:
                total_bottles.deposit_bottles + data.data.deposit,
            })
            .where(eq(TotalBottles.id, total_bottles.id)),

          tx.insert(Customer).values({
            ...data.data,
            customer_id: data.data.customer_id.toLowerCase(),
          }),
        ]);
      });
    } catch (error) {
      console.error("Error creating new customer:", error);
      throw error;
    }
  });
