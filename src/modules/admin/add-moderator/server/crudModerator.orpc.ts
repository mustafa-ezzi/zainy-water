import { adminProcedure } from "@/middlewares/admin-clerk";
import { z } from "zod";
import { Area, Moderator } from "@/db/schema";
import { db } from "@/db";
import { eq } from "drizzle-orm";
import { ORPCError } from "@orpc/client";

export const getModList = adminProcedure
  .input(z.void())
  .output(z.array(z.custom<typeof Moderator.$inferSelect>()))
  .handler(async () => {
    try {
      // Fetch from database directly
      const data = await db.select().from(Moderator);
      return data;
    } catch (error) {
      console.error("Error fetching moderators:", error);
      return [];
    }
  });

export const ModeratorData = z.object({
  name: z.string(),
  password: z.string(),
  areas: z.array(z.enum(Area.enumValues)),
  isWorking: z.boolean(),
});

export const createModerator = adminProcedure
  .input(ModeratorData)
  .output(z.custom<typeof Moderator.$inferSelect>())
  .handler(async ({ input }) => {
    try {
      const [checkMod] = await db
        .select()
        .from(Moderator)
        .where(eq(Moderator.name, input.name.toLowerCase()))
        .limit(1);
      if (checkMod) {
        throw new ORPCError(
          `Moderator with name ${input.name} already exists.`
        );
      }

      const [newModerator] = await db
        .insert(Moderator)
        .values({
          name: input.name.toLowerCase(),
          password: input.password,
          areas: input.areas,
          isWorking: input.isWorking,
        })
        .returning();

      return newModerator;
    } catch (error) {
      console.error("Error creating moderator:", error);
      throw error;
    }
  });

export const deleteModerator = adminProcedure
  .input(z.object({ name: z.string() }))
  .output(z.void())
  .handler(async ({ input }) => {
    try {
      // First get the moderator to get their ID for session invalidation
      const [moderatorToDelete] = await db
        .select({ id: Moderator.id })
        .from(Moderator)
        .where(eq(Moderator.name, input.name))
        .limit(1);

      if (!moderatorToDelete) {
        throw new ORPCError(`Moderator with name ${input.name} not found.`);
      }

      await db.delete(Moderator).where(eq(Moderator.id, moderatorToDelete.id));

      console.log(`Moderator: ${input.name} deleted successfully.`);
    } catch (error) {
      console.error(`Error deleting moderator: ${input.name}:`, error);
      throw new Error(
        `Failed to delete moderator: ${error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  });

export const updateModerator = adminProcedure
  .input(
    z.object({
      name: z.string(),
      data: ModeratorData,
    })
  )
  .output(
    z.custom<typeof Moderator.$inferSelect>()
    // z.void()
  )
  .handler(async ({ input }) => {
    console.log("Updating moderator with input:", input);
    try {
      const [updatedModerator] = await db
        .update(Moderator)
        .set({
          name: input.data.name.toLowerCase(),
          password: input.data.password,
          areas: input.data.areas,
          isWorking: input.data.isWorking,
        })
        .where(eq(Moderator.name, input.name))
        .returning();

      return updatedModerator;
    } catch (error) {
      console.error("Failed to update moderator:", error);
      throw new Error("Could not update moderator");
    }
  });

export const updateModStatus = adminProcedure
  .input(
    z.object({
      name: z.string(),
      currentStatus: z.boolean(),
    })
  )
  .output(z.custom<typeof Moderator.$inferSelect>())
  .handler(async ({ input }) => {
    const name = input.name.toLowerCase();
    const [updatedModerator] = await db
      .update(Moderator)
      .set({
        isWorking: !input.currentStatus,
      })
      .where(eq(Moderator.name, name))
      .returning();

    if (updatedModerator) {
      console.log(`Moderator: ${name} status changed successfully.`);

      return updatedModerator;
    } else {
      throw new Error(`Failed to change status for moderator: ${name}`);
    }
  });
