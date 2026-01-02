import { os } from "@orpc/server";
import { z } from "zod";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/db";
import { Admin } from "@/db/schema";
import { eq } from "drizzle-orm";

export const adminMiddleware = os
  .input(z.void())
  .output(
    z.object({
      status: z.number(),
      message: z.string(),
    }),
  )
  .handler(async () => {
    try {
      const user = await currentUser();

      if (!user) {
        return { status: 401, message: "Unauthorized" };
      }

      const [admin] = await db
        .select()
        .from(Admin)
        .where(eq(Admin.clerk_id, user.id))
        .limit(1);

      if (!!admin) {
        if (admin.isAuthorized) {
          return {
            status: 202,
            message: "Admin already exists and is authorized",
          };
        }
        return {
          status: 200,
          message: "Admin already exists but not authorized",
        };
      }

      await db.insert(Admin).values({
        name: user.fullName || "Unknown Admin",
        clerk_id: user.id,
        isAuthorized: false,
      });

      console.log("Admin created successfully");
      return { status: 201, message: "Admin created successfully" };
    } catch (error) {
      console.error("Error creating admin:", error);
      return { status: 500, message: "Internal server error" };
    }
  });
