import { PgColumn } from "drizzle-orm/pg-core";
import {
  Admin,
  Customer,
  Moderator,
  Delivery,
  OtherExpense,
  Miscellaneous,
  TotalBottles,
  BottleUsage,
  Area,
} from "@/db/schema"; // Adjust the import path to your schema file

// Helper to check if an object is a PgColumn
function isPgColumn(obj: unknown): obj is PgColumn {
  return (
    obj !== null &&
    typeof obj === "object" &&
    typeof (obj as Record<string, unknown>).getSQLType === "function" &&
    "notNull" in obj
  );
}

export function getSchemaDescription() {
  let description = "Database Schema:\n\n";

  // Enums
  description += "Enums:\n";
  description += `- Area: ${Area.enumValues.join(", ")}\n\n`;

  // Tables
  const tables = {
    Admin,
    Customer,
    Moderator,
    Delivery,
    OtherExpense,
    Miscellaneous,
    TotalBottles,
    BottleUsage,
  };

  description += "Tables:\n";
  for (const [tableName, table] of Object.entries(tables)) {
    description += `Table: ${tableName}\n`;
    const columns = Object.entries(table).filter(([, value]) =>
      isPgColumn(value),
    );
    for (const [colName, colValue] of columns) {
      const col = colValue as PgColumn;
      let colDesc = `  - ${colName}: ${col.getSQLType()}`;
      const extras: string[] = [];
      if (col.primary) extras.push("PRIMARY KEY");
      if (col.notNull) extras.push("NOT NULL");
      if (col.hasDefault) {
        const defaultVal = col.default;
        if (
          typeof defaultVal === "object" &&
          defaultVal !== null &&
          "fn" in defaultVal
        ) {
          extras.push("DEFAULT (generated)");
        } else if (typeof defaultVal === "function") {
          extras.push("DEFAULT (function)");
        } else {
          extras.push(`DEFAULT ${JSON.stringify(defaultVal)}`);
        }
      }
      if (extras.length > 0) colDesc += ` (${extras.join(", ")})`;
      description += `${colDesc}\n`;
    }
    description += "\n";
  }

  // Indexes (manually extracted from schema for simplicity; could be extended if needed)
  description += "Indexes:\n";
  description +=
    "- Admin: admin_id_idx on id, admin_clerk_id_idx on clerk_id\n";
  description +=
    "- Customer: customer_id_idx on id, customer_customer_id_idx on customer_id\n";
  description += "- Moderator: moderator_id_idx on id\n";
  description +=
    "- Delivery: delivery_id_idx on id, delivery_customer_id_idx on customer_id, delivery_moderator_id_idx on moderator_id\n";
  description +=
    "- OtherExpense: other_expense_id_idx on id, other_expense_moderator_id_idx on moderator_id\n";
  description +=
    "- Miscellaneous: misc_moderator_id_idx on moderator_id, misc_is_paid_idx on isPaid\n\n";

  // Foreign Keys (extracted from schema definitions)
  description += "Foreign Keys:\n";
  description +=
    "- Delivery.customer_id references Customer.customer_id (on delete cascade)\n";
  description +=
    "- Delivery.moderator_id references Moderator.id (on delete cascade)\n";
  description +=
    "- OtherExpense.moderator_id references Moderator.id (on delete cascade)\n";
  description +=
    "- Miscellaneous.moderator_id references Moderator.id (on delete cascade)\n\n";

  // Relations (based on defined relations)
  description += "Relations:\n";
  description += "- Customer has many Deliveries (one-to-many)\n";
  description += "- Moderator has many Deliveries (one-to-many)\n";
  description += "- Moderator has many OtherExpenses (one-to-many)\n";
  description += "- Moderator has many BottleUsages (one-to-many)\n";
  description += "- Moderator has many Miscellaneous (one-to-many)\n";
  description += "- Delivery belongs to one Customer (many-to-one)\n";
  description += "- Delivery belongs to one Moderator (many-to-one)\n";
  description += "- OtherExpense belongs to one Moderator (many-to-one)\n";
  description += "- BottleUsage belongs to one Moderator (many-to-one)\n";
  description += "- Miscellaneous belongs to one Moderator (many-to-one)\n";
  description += "- Note: TotalBottles, Admin have no defined relations.\n";

  return description;
}
