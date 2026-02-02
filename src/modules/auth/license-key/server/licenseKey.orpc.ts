export const runtime = "nodejs";


import { os } from "@orpc/server";
import { z } from "zod";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/db";
import { Admin } from "@/db/schema";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import nodemailer from "nodemailer";
import { dev_emails } from "@/lib/utils";

export const checkLicenseKey = os
  .input(
    z.object({
      licenseKey: z.string(),
    }),
  )
  .output(
    z.object({
      success: z.boolean(),
      message: z.string().optional(),
      error: z.string().optional(),
    }),
  )
  .handler(async ({ input }) => {
    const user = await currentUser();

    if (!user) {
      return { success: false, error: "User not found" };
    }

    const licenseKey = input.licenseKey.trim();

    try {
      const [admin] = await db
        .select()
        .from(Admin)
        .where(eq(Admin.clerk_id, user.id))
        .limit(1);

      if (!admin) {
        return { success: false, error: "Admin record not found" };
      }

      if (admin.clerk_id === licenseKey) {
        await db
          .update(Admin)
          .set({ isAuthorized: true })
          .where(eq(Admin.id, admin.id));

        (await cookies()).delete("license_key");
        (await cookies()).set("license_key", admin.clerk_id, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          path: "/",
          maxAge: 60 * 60 * 24 * 30, // 30 days
          sameSite: "lax",
        });

        return { success: true, message: "Authorization successful" };
      } else {
        return { success: false, error: "Authorization failed" };
      }
    } catch (error) {
      console.log({ success: false, error });
      throw error;
    }
  });

export const requestLicense = os
  .input(z.void())
  .output(
    z.object({
      success: z.boolean(),
      message: z.string(),
      redirect: z.boolean(),
    }),
  )
  .handler(async () => {
    const user = await currentUser();

    if (!user) {
      throw new Error("User not found");
    }

    const [admin] = await db
      .select()
      .from(Admin)
      .where(eq(Admin.clerk_id, user.id));
    if (!admin) {
      throw new Error("Admin record not found");
    }

    if (admin.isAuthorized) {
      (await cookies()).delete("license_key");
      (await cookies()).set("license_key", admin.clerk_id);
      return {
        success: true,
        message: "Admin already authorized",
        redirect: true,
      };
    } else {
      console.log("Sending license email....");
      await sendLicenseEmail({
        name: user.fullName || "Unknown Admin",
        email: user.emailAddresses[0].emailAddress || "Unknown Email",
        license_key: admin.clerk_id,
      });
      console.log("License email sent successfully.");
      return {
        success: true,
        message: "License request sent",
        redirect: false,
      };
    }
  });

export async function sendLicenseEmail({
  name,
  email,
  license_key,
}: {
  name: string;
  email: string;
  license_key: string;
}) {
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });


  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: dev_emails,
    subject: `New Admin Login Request from ${name}`,
    html: `Name: ${name}<br />
    Email: ${email} <br/>
    New account is requesting access to the admin portal.<br />
    License Key: <strong>${license_key}</strong>`,
  });

  return { success: true };
}
