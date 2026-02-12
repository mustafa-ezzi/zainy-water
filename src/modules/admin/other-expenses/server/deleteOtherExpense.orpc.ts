import { z } from "zod";
import { adminProcedure } from "@/middlewares/admin-clerk";
import { db } from "@/db";
import { OtherExpense, BottleUsage, Moderator } from "@/db/schema";
import { eq, and, gte, lte } from "drizzle-orm";
import { endOfDay, startOfDay } from "date-fns";
import { ORPCError } from "@orpc/client";

export const deleteOtherExpense = adminProcedure
    .input(
        z.object({
            expenseId: z.string(),
            moderatorId: z.string(),
            expenseAmount: z.number(),
            reffilledBottles: z.number(),
            expenseDate: z.coerce.date(),
        })
    )
    .output(z.object({ success: z.boolean() }))
    .handler(async ({ input }) => {
        try {
            // 1. Find the expense to delete
            const [expense] = await db
                .select()
                .from(OtherExpense)
                .where(eq(OtherExpense.id, input.expenseId))
                .limit(1);

            if (!expense) {
                throw new ORPCError("Expense not found");
            }

            // 2. Find the bottle usage record for that date
            const [usage] = await db
                .select()
                .from(BottleUsage)
                .where(
                    and(
                        eq(BottleUsage.moderator_id, input.moderatorId),
                        gte(BottleUsage.createdAt, startOfDay(input.expenseDate)),
                        lte(BottleUsage.createdAt, endOfDay(input.expenseDate))
                    )
                )
                .limit(1);

            if (!usage) {
                throw new ORPCError("Bottle usage record not found for this date");
            }

            // 3. Update bottle usage to reverse the changes
            await db
                .update(BottleUsage)
                .set({
                    empty_bottles: usage.empty_bottles + input.reffilledBottles,
                    remaining_bottles:
                        usage.remaining_bottles - input.reffilledBottles,
                    caps: usage.caps + input.reffilledBottles,
                    refilled_bottles:
                        (usage.refilled_bottles ?? 0) - input.reffilledBottles,
                    expense: usage.expense - input.expenseAmount,
                })
                .where(eq(BottleUsage.id, usage.id));

            // 4. Delete the expense
            await db
                .delete(OtherExpense)
                .where(eq(OtherExpense.id, input.expenseId));

            return { success: true };
        } catch (error) {
            console.error("Failed to delete other expense:", error);
            throw error;
        }
    });
