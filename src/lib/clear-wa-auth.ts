#!/usr/bin/env bun
import { rmSync, existsSync } from "fs";
import { join } from "path";

console.log("🗑️  Clearing WhatsApp authentication data...");

const authPath = join(process.cwd(), "auth_info_baileys");

if (existsSync(authPath)) {
  try {
    rmSync(authPath, { recursive: true, force: true });
    console.log("✅ Auth data cleared successfully!");
    console.log(
      "📋 You can now run the connection script again for fresh pairing"
    );
  } catch (error) {
    console.error("❌ Error clearing auth data:", error);
    process.exit(1);
  }
} else {
  console.log("ℹ️  No auth data found to clear");
}
