import { db } from "@/db";
import { BottleUsage } from "@/db/schema";
import { adminProcedure } from "@/middlewares/admin-clerk";
import { ORPCError } from "@orpc/client";
import { eq } from "drizzle-orm";
import z from "zod";

export const deleteBottleUsage = adminProcedure
  .input(z.string())
  .output(z.void())
  .handler(async ({ input: id }) => {
    const [bottleUsage] = await db
      .select()
      .from(BottleUsage)
      .where(eq(BottleUsage.id, id));

    if (!bottleUsage) {
      throw new ORPCError("Bottle usage record not found");
    }

    await db.delete(BottleUsage).where(eq(BottleUsage.id, bottleUsage.id));
  });
