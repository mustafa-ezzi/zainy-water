import { db } from "@/db";
import { BottleUsage, Customer, Delivery, TotalBottles } from "@/db/schema";
import { DeliveryTableData } from "@/modules/moderator/daily-deliveries/ui/daily-delivery-table";
import { os } from "@orpc/server";
import { startOfDay } from "date-fns";
import { and, desc, eq, gte } from "drizzle-orm";
import { z } from "zod";

export const DeleteDeliveryDataProp = z.object({
  data: z.custom<DeliveryTableData>(),
  moderator_id: z.string(),
});

export const deleteDailyDelivery = os
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
    const [bottleUsage] = await db
      .select()
      .from(BottleUsage)
      .where(
        and(
          eq(BottleUsage.moderator_id, input.moderator_id),
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
                bottleUsage.sales - input.data.delivery.filled_bottles
              ),
              remaining_bottles:
                bottleUsage.remaining_bottles +
                input.data.delivery.filled_bottles,
              empty_bottles: Math.max(
                0,
                bottleUsage.empty_bottles - input.data.delivery.empty_bottles
              ),
              revenue: bottleUsage.revenue - input.data.delivery.payment,
            })
            .where(eq(BottleUsage.id, bottleUsage.id)),

          tx
            .update(TotalBottles)
            .set({
              damaged_bottles:
                totalBottles.damaged_bottles -
                input.data.delivery.damaged_bottles,
            })
            .where(eq(TotalBottles.id, totalBottles.id)),

          tx
            .update(Customer)
            .set({
              bottles:
                input.data.customer.bottles +
                input.data.delivery.empty_bottles -
                input.data.delivery.filled_bottles,
              balance:
                input.data.customer.balance +
                input.data.delivery.payment -
                (input.data.delivery.filled_bottles - input.data.delivery.foc) *
                  input.data.customer.bottle_price,
            })
            .where(eq(Customer.id, input.data.customer.id)),

          tx.delete(Delivery).where(eq(Delivery.id, input.data.delivery.id)),
        ]);
      });
    } catch (error) {
      console.error("Failed to delete delivery", error);
      throw errors.TRANSACTION_FAIL();
    }

    //     await sendWhatsAppMessage(
    //       input.data.customer.phone,
    //       `\`\`\`⚠️ NOTE: The delivery made at\`\`\` *_${format(input.data.delivery.createdAt, "hh:mm aaaa PPPP")}_* \`\`\`has been deleted due to invalid/wrong delivery entry.
    // Short Delivery Details:
    // - Customer: ${input.data.customer.name}
    // - Filled Bottles: ${input.data.delivery.filled_bottles}
    // - Empty Bottles: ${input.data.delivery.empty_bottles}
    // - Payment: ${input.data.delivery.payment}

    // Sorry for the inconvenience.\`\`\``
    //     );
  });
