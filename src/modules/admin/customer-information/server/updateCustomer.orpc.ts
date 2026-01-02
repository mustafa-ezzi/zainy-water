import { adminProcedure } from "@/middlewares/admin-clerk";
import { z } from "zod";
import { Customer, TotalBottles } from "@/db/schema";
import { db } from "@/db";
import { desc, eq } from "drizzle-orm";

export const UpdateCustomerInfoDataSchema = z.object({
  id: z.string(),
  data: z.custom<typeof Customer.$inferInsert>(),
});

export const updateCustomer = adminProcedure
  .input(UpdateCustomerInfoDataSchema)
  .output(z.void())
  .errors({
    BAD_REQUEST: {
      message: "Cannot update customer: Not enough available bottles.",
    },
  })
  .handler(async ({ input: data, errors }) => {
    try {
      const [customer_info] = await db
        .select()
        .from(Customer)
        .where(eq(Customer.id, data.id));

      const [total_bottles] = await db
        .select()
        .from(TotalBottles)
        .orderBy(desc(TotalBottles.createdAt))
        .limit(1);

      const bottle_difference = data.data.bottles - customer_info.bottles;
      const deposit_difference = data.data.deposit - customer_info.deposit;

      const new_available_bottles =
        total_bottles.available_bottles -
        bottle_difference -
        deposit_difference;
      const new_used_bottles = total_bottles.used_bottles + bottle_difference;
      const new_deposit_bottles =
        total_bottles.deposit_bottles + deposit_difference;
      const new_total_bottles =
        total_bottles.total_bottles - deposit_difference;

      console.log({
        bottle_difference,
        deposit_difference,
        new_available_bottles,
        new_used_bottles,
        new_deposit_bottles,
        new_total_bottles,
      });

      if (
        deposit_difference > new_available_bottles ||
        new_total_bottles < new_available_bottles + new_used_bottles ||
        new_available_bottles < 0 ||
        new_used_bottles < 0
      ) {
        throw errors.BAD_REQUEST();
      }

      await db.transaction(async (tx) => {
        await Promise.all([
          tx
            .update(Customer)
            .set({
              ...data.data,
              customer_id: data.data.customer_id.toLowerCase(),
            })
            .where(eq(Customer.id, data.id)),

          tx
            .update(TotalBottles)
            .set({
              total_bottles: new_total_bottles,
              available_bottles: new_available_bottles,
              used_bottles: new_used_bottles,
              deposit_bottles: new_deposit_bottles,
            })
            .where(eq(TotalBottles.id, total_bottles.id)),
        ]);
      });
    } catch (error) {
      console.error("Error updating customer information:", error);
      throw error;
    }
  });
