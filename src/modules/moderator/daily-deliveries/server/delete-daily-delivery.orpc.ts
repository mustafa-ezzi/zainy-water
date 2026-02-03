import { db } from "@/db";
import { BottleUsage, Customer, Delivery, TotalBottles } from "@/db/schema";
import { DeliveryTableData } from "@/modules/moderator/daily-deliveries/ui/daily-delivery-table";
import { os } from "@orpc/server";
import { startOfDay, format } from "date-fns";
import { and, desc, eq, gte, lte } from "drizzle-orm";
import { z } from "zod";
import { sendWhatsAppMessage } from "@/lib/sendWhatsapp";

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
      message: "Bottle usage not found for delivery date",
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
    const dayStart = startOfDay(input.data.delivery.delivery_date);
    const dayEnd = new Date(dayStart);
    dayEnd.setHours(23, 59, 59, 999);

    try {
      await db.transaction(async (tx) => {
        // 1️⃣ Get bottle usage FOR SAME DAY
        const [usage] = await tx
          .select()
          .from(BottleUsage)
          .where(
            and(
              eq(BottleUsage.moderator_id, input.moderator_id),
              gte(BottleUsage.createdAt, dayStart),
              lte(BottleUsage.createdAt, dayEnd)
            )
          )
          .limit(1);

        if (!usage) throw errors.BOTTLE_USAGE_404();

        // 2️⃣ Get total bottles
        const [totalBottles] = await tx
          .select()
          .from(TotalBottles)
          .limit(1);

        if (!totalBottles) throw errors.TOTAL_BOTTLES_404();

        // 3️⃣ Rollback bottle usage (WITH remaining recalculation)
        const newSales = Math.max(
          0,
          usage.sales - input.data.delivery.filled_bottles
        );

        const newRemaining = Math.max(
          0,
          usage.filled_bottles - newSales
        );

        await tx
          .update(BottleUsage)
          .set({
            sales: newSales,
            remaining_bottles: newRemaining,

            empty_bottles: Math.max(
              0,
              usage.empty_bottles - input.data.delivery.empty_bottles
            ),

            revenue: usage.revenue - input.data.delivery.payment,
          })
          .where(eq(BottleUsage.id, usage.id));



        // 4️⃣ Rollback damaged bottles
        await tx
          .update(TotalBottles)
          .set({
            damaged_bottles:
              totalBottles.damaged_bottles -
              input.data.delivery.damaged_bottles,
          })
          .where(eq(TotalBottles.id, totalBottles.id));

        // 5️⃣ Rollback customer
        await tx
          .update(Customer)
          .set({
            bottles:
              input.data.customer.bottles +
              input.data.delivery.empty_bottles -
              input.data.delivery.filled_bottles,

            balance:
              input.data.customer.balance +
              input.data.delivery.payment -
              (input.data.delivery.filled_bottles -
                input.data.delivery.foc) *
              input.data.customer.bottle_price,
          })
          .where(eq(Customer.id, input.data.customer.id));

        // 6️⃣ Delete delivery
        await tx
          .delete(Delivery)
          .where(eq(Delivery.id, input.data.delivery.id));
      });
    } catch (error) {
      console.error("Failed to delete delivery", error);
      throw errors.TRANSACTION_FAIL();
    }

    // 7️⃣ Notify customer
    await sendWhatsAppMessage(
      input.data.customer.phone,
      `Hi ${input.data.customer.name},  
We corrected a delivery entry from today due to a recording mistake.

🕒 Delivery Time: ${format(input.data.delivery.createdAt, "hh:mm aaaa")}, ${format(input.data.delivery.createdAt, "PPPP")}

💧 Bottle Details
* Filled Bottles: ${input.data.delivery.filled_bottles}
* Empty Bottles Collected: ${input.data.delivery.empty_bottles}
* FOC Bottles (Free): ${input.data.delivery.foc || 0}

💰 Payment
* Bill Amount: Rs ${input.data.delivery.filled_bottles * input.data.customer.bottle_price - (input.data.delivery.foc || 0) * input.data.customer.bottle_price}
* Amount Received: Rs ${input.data.delivery.payment}

If anything here seems incorrect, please reply and we’ll check it.
Thank you 🙏`

    );
  });

