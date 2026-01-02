import { z } from "zod";
import { db } from "@/db";
import { tool, ToolSet } from "ai";
import { subDays } from "date-fns";
import {
  BottleUsage,
  Customer,
  Delivery,
  Moderator,
  TotalBottles,
} from "@/db/schema";
import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import { tavily } from "@tavily/core";

export const tools: ToolSet = {
  getAllDeliveries: tool({
    description: `Call this function to query the PostgreSQL database and obtain the list of all the deliveries ("Delivery" table records) for the last 15 days from now.`,
    inputSchema: z.object({
      reason: z
        .string()
        .optional()
        .describe(
          "A brief reason or explanation regarding why you choose to call this tool.",
        ),
    }),
    execute: async ({ reason }) => {
      console.log("\nCalled getDeliveries tool. Reason: ", { reason });
      const now = new Date();
      const from = subDays(now, 15);

      try {
        const deliveries = await db
          .select()
          .from(Delivery)
          .where(
            and(gte(Delivery.createdAt, from), lte(Delivery.createdAt, now)),
          )
          .innerJoin(Customer, eq(Delivery.customer_id, Customer.customer_id))
          .innerJoin(Moderator, eq(Delivery.moderator_id, Moderator.id))
          .orderBy(desc(Delivery.createdAt));

        console.log({ deliveries });

        return { success: true, data: deliveries };
      } catch (error) {
        console.error("Error executing SQL query:", error);
        return { success: false, error: "Failed to execute SQL query." };
      }
    },
  }),

  getAllModerators: tool({
    description: `\nCall this function to query the PostgreSQL database and obtain the list of all the Moderators ("Moderator" table records)`,
    inputSchema: z.object({
      reason: z
        .string()
        .optional()
        .describe(
          "A brief and explanatory reason or justification regarding why you choose to call this tool.",
        ),
    }),
    execute: async ({ reason }) => {
      console.log("Called getModerators tool. Reason: ", { reason });

      try {
        const moderators = await db
          .select()
          .from(Moderator)
          .orderBy(desc(Moderator.createdAt));

        console.log({ moderators });

        return { success: true, data: moderators };
      } catch (error) {
        console.error("Error executing SQL query:", error);
        return { success: false, error: "Failed to execute SQL query." };
      }
    },
  }),

  getAllCustomers: tool({
    description: `Call this function to query the PostgreSQL database and obtain the list of all the Customers ("Customer" table records)`,
    inputSchema: z.object({
      reason: z
        .string()
        .optional()
        .describe(
          "A brief and explanatory reason or justification regarding why you choose to call this tool.",
        ),
    }),
    execute: async ({ reason }) => {
      console.log("\nCalled getCustomers tool. Reason: ", { reason });

      try {
        const customers = await db
          .select()
          .from(Customer)
          .orderBy(desc(Customer.createdAt));

        console.log({ customers });

        return { success: true, data: customers };
      } catch (error) {
        console.error("Error executing SQL query:", error);
        return { success: false, error: "Failed to execute SQL query." };
      }
    },
  }),

  getAllBottleUsage: tool({
    description: `Call this function to query the PostgreSQL database and obtain the list of all the Bottle Usage for every Moderator ("BottleUsage" table records) for last 15 days`,
    inputSchema: z.object({
      reason: z
        .string()
        .optional()
        .describe(
          "A brief and explanatory reason or justification regarding why you choose to call this tool.",
        ),
    }),
    execute: async ({ reason }) => {
      console.log("\nCalled getBottleUsage tool. Reason: ", { reason });

      const now = new Date();
      const from = subDays(now, 15);

      try {
        const bottleUsage = await db
          .select()
          .from(BottleUsage)
          .where(
            and(
              gte(BottleUsage.createdAt, from),
              lte(BottleUsage.createdAt, now),
            ),
          )
          .innerJoin(Moderator, eq(BottleUsage.moderator_id, Moderator.id))
          .orderBy(desc(BottleUsage.createdAt));

        console.log({ bottleUsage });

        return { success: true, data: bottleUsage };
      } catch (error) {
        console.error("Error executing SQL query:", error);
        return { success: false, error: "Failed to execute SQL query." };
      }
    },
  }),

  getTotalBottles: tool({
    description: `Call this function to query the PostgreSQL database and obtain the record for overall bottles ("TotalBottles" table record) including total owned bottles, used bottles, available bottles and damaged bottles`,
    inputSchema: z.object({
      reason: z
        .string()
        .optional()
        .describe(
          "A brief and explanatory reason or justification regarding why you choose to call this tool.",
        ),
    }),
    execute: async ({ reason }) => {
      console.log("\nCalled getTotalBottles tool. Reason: ", { reason });

      try {
        const totalBottles = await db
          .select()
          .from(TotalBottles)
          .orderBy(desc(TotalBottles.createdAt))
          .limit(1);

        console.log({ totalBottles });

        return { success: true, data: totalBottles };
      } catch (error) {
        console.error("Error executing SQL query:", error);
        return { success: false, error: "Failed to execute SQL query." };
      }
    },
  }),

  getDeliveriesByCustomerName: tool({
    description: `Call this function to query the PostgreSQL database and obtain the record for all the deliveries associated with a particular customer ("Delivery" & "Customer" table record)`,
    inputSchema: z.object({
      customerName: z
        .string()
        .describe(
          "The name of the customer to query deliveries for. (case sensitive)",
        ),
      reason: z
        .string()
        .optional()
        .describe(
          "A brief and explanatory reason or justification regarding why you choose to call this tool.",
        ),
    }),
    execute: async ({ customerName, reason }) => {
      console.log("\nCalled getDeliveriesByCustomerName tool. Reason: ", {
        reason,
      });

      try {
        const deliveries = await db
          .select()
          .from(Delivery)
          .innerJoin(Customer, eq(Delivery.customer_id, Customer.customer_id))
          .where(eq(Customer.name, customerName));

        console.log({ deliveries });

        return { success: true, data: deliveries };
      } catch (error) {
        console.error("Error executing SQL query:", error);
        return { success: false, error: "Failed to execute SQL query." };
      }
    },
  }),

  getDeliveriesByModeratorName: tool({
    description: `Call this function to query the PostgreSQL database and obtain the record for all the deliveries associated with a particular moderator ("Delivery" & "Moderator" table record)`,
    inputSchema: z.object({
      moderatorName: z
        .string()
        .describe(
          "The name of the moderator to query deliveries for. (case sensitive)",
        ),
      reason: z
        .string()
        .optional()
        .describe(
          "A brief and explanatory reason or justification regarding why you choose to call this tool.",
        ),
    }),
    execute: async ({ moderatorName, reason }) => {
      console.log("\nCalled getDeliveriesByModeratorName tool. Reason: ", {
        reason,
      });

      try {
        const deliveries = await db
          .select()
          .from(Delivery)
          .innerJoin(Moderator, eq(Delivery.moderator_id, Moderator.id))
          .where(eq(Moderator.name, moderatorName));

        console.log({ deliveries });

        return { success: true, data: deliveries };
      } catch (error) {
        console.error("Error executing SQL query:", error);
        return { success: false, error: "Failed to execute SQL query." };
      }
    },
  }),

  getBottleUsageByModeratorName: tool({
    description: `Call this function to query the PostgreSQL database and obtain the record for all the bottle usage associated with a particular moderator ("BottleUsage" & "Moderator" table record)`,
    inputSchema: z.object({
      moderatorName: z
        .string()
        .describe(
          "The name of the moderator to query bottle usage for. (case sensitive)",
        ),
      reason: z
        .string()
        .optional()
        .describe(
          "A brief and explanatory reason or justification regarding why you choose to call this tool.",
        ),
    }),
    execute: async ({ moderatorName, reason }) => {
      console.log("\nCalled getBottleUsageByModeratorName tool. Reason: ", {
        reason,
      });

      try {
        const bottleUsage = await db
          .select()
          .from(BottleUsage)
          .innerJoin(Moderator, eq(BottleUsage.moderator_id, Moderator.id))
          .where(eq(Moderator.name, moderatorName));

        console.log({ bottleUsage });

        return { success: true, data: bottleUsage };
      } catch (error) {
        console.error("Error executing SQL query:", error);
        return { success: false, error: "Failed to execute SQL query." };
      }
    },
  }),

  rawSQLQuery: tool({
    description: `Call this function to execute a raw SQL query against the Postgres SQL database for complex queries (for which the other tools are insufficient).
     Only SELECT queries are allowed. Mutation queries are strictly prohibited.
     NOTE: Prefer this tool for querying single records or small datasets. For larger datasets, consider using the other tools to ensure performance and safety.`,
    inputSchema: z.object({
      sqlQuery: z.string().describe("The raw SQL query to execute."),
    }),
    execute: async ({ sqlQuery }) => {
      console.log("\nCalled rawSQLQuery tool. SQL Query: ", {
        sqlQuery,
      });

      try {
        if (!isSafeSelectQuery(sqlQuery)) {
          console.error("Unsafe SQL query detected:", sqlQuery);
          return { success: false, error: "Unsafe SQL query detected." };
        }

        const result = await db.execute(sql.raw(sqlQuery));
        const rows = result.rows;

        console.log({ rows });

        return { success: true, data: rows };
      } catch (error) {
        console.error("Error executing SQL query:", error);
        return { success: false, error: "Failed to execute SQL query." };
      }
    },
  }),
};

export const tools_with_webSearch: ToolSet = {
  ...tools,
  tavilySearch: tool({
    description: `Performs a real-time web search using the Tavily API. Use this when you need up-to-date information from the internet and don’t already have a specific URL. Returns relevant search results including titles, snippets, and links.`,
    inputSchema: z.object({
      query: z.string().describe("Search query string."),
      maxResults: z
        .number()
        .optional()
        .describe("Max number of results (default: 5)."),
    }),
    execute: async ({ query, maxResults = 5 }) => {
      console.log("Called tavilySearch tool:", { query, maxResults });

      try {
        const client = tavily({ apiKey: process.env.TAVILY_API_KEY! });
        const options = { max_results: maxResults };
        const response = await client.search(query, options);
        console.log("Tavily response:", response);

        return { success: true, data: response };
      } catch (err) {
        console.error("Tavily search error:", err);
        return { success: false, error: "Failed to perform web search" };
      }
    },
  }),
};

function isSafeSelectQuery(query: string): boolean {
  const sqlRegex =
    /^(?=.*\bSELECT\b)(?!.*\b(INSERT|UPDATE|DELETE|CREATE|DROP|ALTER|TRUNCATE|REPLACE)\b).*$/i;
  return sqlRegex.test(query);
}
