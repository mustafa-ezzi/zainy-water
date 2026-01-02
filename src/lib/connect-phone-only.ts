import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  Browsers,
} from "baileys";
import P from "pino";

// No QR - Pure phone number pairing approach
export async function connectWithPhoneOnly(phoneNumber: string) {
  console.log("📱 Phone-only pairing for:", phoneNumber);

  try {
    // Clear and initialize auth
    const { state, saveCreds } =
      // eslint-disable-next-line react-hooks/rules-of-hooks
      await useMultiFileAuthState("auth_info_baileys");
    const { version } = await fetchLatestBaileysVersion();

    console.log("📱 WA Version:", version.join("."));

    const sock = makeWASocket({
      version,
      auth: state,
      logger: P({ level: "fatal" }), // Almost no logging
      browser: Browsers.ubuntu("Chrome"),
      printQRInTerminal: false,
      qrTimeout: 0, // Disable QR timeout
      connectTimeoutMs: 60000, // 1 minute timeout
      defaultQueryTimeoutMs: 60000,
      keepAliveIntervalMs: 30000,
      markOnlineOnConnect: false,
      syncFullHistory: false,
      shouldSyncHistoryMessage: () => false,
      getMessage: async () => ({ conversation: "Hello" }),
    });

    // Immediately request pairing code on socket creation
    setTimeout(async () => {
      if (!state.creds.registered) {
        try {
          console.log("🔐 Requesting pairing code immediately...");
          const code = await sock.requestPairingCode(phoneNumber);
          console.log("\n🚨 IMMEDIATE PAIRING CODE:", code);
          console.log("📞 For phone:", phoneNumber);
          console.log("⏰ Enter this code in WhatsApp NOW!");
          console.log(
            "📱 Settings > Linked Devices > Link Device > Link with phone number\n"
          );
        } catch (error) {
          console.error("❌ Failed to get pairing code:", error);
        }
      }
    }, 1000); // Request immediately after connection starts

    sock.ev.on("connection.update", async (update) => {
      const { connection, lastDisconnect, receivedPendingNotifications, qr } =
        update;

      // Ignore QR completely
      if (qr) {
        console.log("❌ Ignoring QR - using phone pairing only");
        return;
      }

      console.log("📊 Connection:", connection);

      if (connection === "connecting") {
        console.log("🔄 Connecting...");
      } else if (connection === "open") {
        console.log(
          "✅ SUCCESS! Connected as:",
          sock.user?.name,
          sock.user?.id
        );
        console.log("📱 Phone number verified:", sock.user?.id?.split(":")[0]);
      } else if (connection === "close") {
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        console.log("❌ Connection closed, code:", statusCode);
        console.log("❌ Reason:", lastDisconnect?.error?.message);

        // Only reconnect for network issues, not auth issues
        if (
          statusCode !== DisconnectReason.loggedOut &&
          statusCode !== DisconnectReason.badSession
        ) {
          console.log("🔄 Reconnecting in 5 seconds...");
          setTimeout(() => connectWithPhoneOnly(phoneNumber), 5000);
        } else {
          console.log("🗑️ Auth issue detected. Clear auth data and restart.");
        }
      }

      if (receivedPendingNotifications) {
        console.log("📬 Received pending notifications");
      }
    });

    sock.ev.on("creds.update", saveCreds);

    // Handle messages (optional)
    sock.ev.on("messages.upsert", async (m) => {
      console.log("📨 New message:", m.messages.length, "messages");
    });

    return sock;
  } catch (error) {
    console.error("❌ Connection failed:", error);
    throw error;
  }
}

// Alternative phone number formats to try
const phoneFormats = [
  // "923390036284", // Taher
  // "923353570253", // AliAsghar
  // "923075053535", // AliAsghar Business Acc
  "923111577553", // Admin Business Acc
];

let currentFormatIndex = 0;

async function tryDifferentFormats() {
  if (currentFormatIndex < phoneFormats.length) {
    const phone = phoneFormats[currentFormatIndex];
    console.log(
      `\n🧪 Trying format ${currentFormatIndex + 1}/${phoneFormats.length}: ${phone}`
    );
    currentFormatIndex++;

    await connectWithPhoneOnly(phone);
  } else {
    console.log("❌ All phone formats failed. Please check your phone number.");
  }
}

// Start the connection
console.log("🚀 Starting PHONE-ONLY WhatsApp connection...");
tryDifferentFormats();

process.on("SIGINT", () => {
  console.log("\n🛑 Shutting down...");
  process.exit(0);
});
