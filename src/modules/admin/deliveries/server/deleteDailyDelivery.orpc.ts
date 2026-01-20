import { db } from "@/db";
import { BottleUsage, Customer, Delivery, TotalBottles } from "@/db/schema";
import { adminProcedure } from "@/middlewares/admin-clerk";
import { startOfDay } from "date-fns";
import { and, desc, eq, gte } from "drizzle-orm";
import { z } from "zod";
import { columnSchema } from "../ui/data-table-3-daily-deliveries";

export const DeleteDeliveryDataProp = z.object({
  data: z.custom<columnSchema>(),
});

export const deleteDailyDelivery = adminProcedure
  .input(DeleteDeliveryDataProp)
  .output(z.void())
  .errors({
    BOTTLE_USAGE_404: {
      status: 404,
      message: "Bottle usage not found",
    },
    TOTAL_BOTTLES_404: {
      status: 404,
      message: "Total bottles record not found",
    },
    TRANSACTION_FAIL: {
      status: 500,
      message: "Failed to delete delivery",
    },
  })
  .handler(async ({ input, errors }) => {
    const { data } = input;
    const [bottleUsage] = await db
      .select()
      .from(BottleUsage)
      .where(
        and(
          eq(BottleUsage.moderator_id, data.Moderator.id),
          gte(BottleUsage.createdAt, startOfDay(new Date()))
        )
      )
      .orderBy(desc(BottleUsage.createdAt))
      .limit(1);

    if (!bottleUsage) {
      throw errors.BOTTLE_USAGE_404();
    }

    const [totalBottles] = await db
      .select()
      .from(TotalBottles)
      .orderBy(desc(TotalBottles.createdAt))
      .limit(1);

    if (!totalBottles) {
      throw errors.TOTAL_BOTTLES_404();
    }

    try {
      await db.transaction(async (tx) => {
        await Promise.all([
          tx
            .update(BottleUsage)
            .set({
              sales: Math.max(
                0,
                bottleUsage.sales - data.Delivery.filled_bottles
              ),
              remaining_bottles:
                bottleUsage.remaining_bottles + data.Delivery.filled_bottles,
              empty_bottles: Math.max(
                0,
                bottleUsage.empty_bottles - data.Delivery.empty_bottles
              ),
              revenue: bottleUsage.revenue - data.Delivery.payment,
              damaged_bottles:
                bottleUsage.damaged_bottles - data.Delivery.damaged_bottles,
            })
            .where(eq(BottleUsage.id, bottleUsage.id)),

          tx
            .update(TotalBottles)
            .set({
              damaged_bottles:
                totalBottles.damaged_bottles - data.Delivery.damaged_bottles,
            })
            .where(eq(TotalBottles.id, totalBottles.id)),

          tx
            .update(Customer)
            .set({
              bottles:
                data.Customer.bottles +
                data.Delivery.empty_bottles -
                data.Delivery.filled_bottles,
              balance:
                data.Customer.balance +
                data.Delivery.payment -
                (data.Delivery.filled_bottles - data.Delivery.foc) *
                data.Customer.bottle_price,
            })
            .where(eq(Customer.id, data.Customer.id)),

          tx.delete(Delivery).where(eq(Delivery.id, data.Delivery.id)),
        ]);
      });
    } catch (error) {
      console.error("Failed to delete delivery", error);
      throw errors.TRANSACTION_FAIL();
    }

    //     await sendWhatsAppMessage(
    //       data.customer.phone,
    //       `\`\`\`⚠️ NOTE: The delivery made at\`\`\` *_${format(data.delivery.createdAt, "hh:mm aaaa PPPP")}_* \`\`\`has been deleted due to invalid/wrong delivery entry.
    // Short Delivery Details:
    // - Customer: ${data.customer.name}
    // - Filled Bottles: ${data.delivery.filled_bottles}
    // - Empty Bottles: ${data.delivery.empty_bottles}
    // - Payment: ${data.delivery.payment}

    // Sorry for the inconvenience.\`\`\``
    //     );
  });
