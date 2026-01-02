#!/usr/bin/env bun

// Simple WhatsApp QR Code Connection Script
// Run this with: bun whatsapp-connect.ts

import { connectWhatsAppViaQR } from "../modules/moderator/daily-deliveries/server/mod-whatsapp-automation";

console.log("🔌 WhatsApp QR Code Connection Tool");
console.log("═══════════════════════════════════════");
console.log("This will help you connect your WhatsApp to the system.");
console.log("Make sure you have your phone ready to scan the QR code!\n");

(async () => {
  try {
    await connectWhatsAppViaQR();
    console.log("\n🎉 SUCCESS!");
    console.log("Your WhatsApp is now connected and ready to use.");
    console.log(
      "You can now run your application and send messages automatically.",
    );
    process.exit(0);
  } catch (error) {
    console.error("\n❌ CONNECTION FAILED:");
    console.error(error instanceof Error ? error.message : "Unknown error");
    console.log("\n💡 Tips:");
    console.log("• Make sure you have a stable internet connection");
    console.log("• Ensure your phone has WhatsApp installed and active");
    console.log("• Try running the script again");
    console.log("• Check that no other WhatsApp Web sessions are active");
    process.exit(1);
  }
})();
