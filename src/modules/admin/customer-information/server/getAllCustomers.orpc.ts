import { adminProcedure } from "@/middlewares/admin-clerk";
import { z } from "zod";
import { Customer } from "@/db/schema";
import { db } from "@/db";
import { desc } from "drizzle-orm";

export const GetAllCustomersRecords = z.object({
  Customer: z.custom<typeof Customer.$inferSelect>(),
});

export const getAllCustomers = adminProcedure
  .input(z.void())
  .output(GetAllCustomersRecords.array())
  .handler(async () => {
    try {
      const customers = await db
        .select()
        .from(Customer)
        .orderBy(desc(Customer.createdAt));

      return customers.map((customer) => ({
        Customer: customer,
      }));
    } catch (error) {
      console.error("Error fetching all customers: ", { error });
      throw error;
    }
  });
