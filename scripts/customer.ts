import { db } from "@/db";
import { Customer } from "@/db/schema";
async function main() {
  try {
    const customer = await db
      .insert(Customer)
      .values({
        customer_id: "abcd",
        name: "John",
        address: "123 Main St",
        area: "Saddar",
        phone: "123-456-7890",
        bottle_price: 100,
        bottles: 1,
        deposit: 5,
        deposit_price: 800,
        balance: 300,
      })
      .returning();

    console.log("Customer created:", customer);
  } catch (error) {
    console.error("Error creating customer:", error);
  }
}

await main();
