import { adminProcedure } from "@/middlewares/admin-clerk";
import { db } from "@/db";
import { Customer } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

export const deleteCustomer = adminProcedure
  .input(z.object({ id: z.string() }))
  .output(z.void())
  .handler(async ({ input }) => {
    try {
      await db.delete(Customer).where(eq(Customer.id, input.id));
    } catch (error) {
      console.error("Error deleting customer");
      throw error;
    }
  });
