"use server";

import makeWASocket, { DisconnectReason, useMultiFileAuthState } from "baileys";
import { Boom } from "@hapi/boom";
import QRCode from "qrcode";
import P from "pino";
import { WebSocketServer } from "ws";

const wss = new WebSocketServer({ port: 8080 });
console.log("WebSocket server running on ws://localhost:8080");

wss.on("connection", (ws) => {
  console.log("Client connected to receive WhatsApp QR code");
});


export async function sendWhatsAppMessage(
  phone: string,
  message: string,
  showQR: boolean = true
): Promise<{
  success: boolean;
  message: string;
}> {
  return new Promise((resolve, reject) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let sock: any = null;
    let isResolved = false;

    const connectAndSend = async () => {
      try {
        const { state, saveCreds } =
          // eslint-disable-next-line react-hooks/rules-of-hooks
          await useMultiFileAuthState("auth_info_baileys");
        sock = makeWASocket({
          // can provide additional config here
          auth: state,
          logger: P({ level: "silent" }), // Reduce log noise
        });

        // Basic phone validation: remove non-digits, check length (international with country code, typically 10-15 digits)
        const cleanedPhone = phone.replace(/[^0-9]/g, "");
        if (cleanedPhone.length !== 12) {
          if (!isResolved) {
            isResolved = true;
            reject(
              new Error(
                "Invalid phone number format. Please provide a valid pakistani number without symbols."
              )
            );
          }
          return;
        }

        const jid = `${cleanedPhone}@s.whatsapp.net`;

        // Set a timeout to prevent hanging connections
        const connectionTimeout = setTimeout(() => {
          if (!isResolved) {
            isResolved = true;
            cleanup();
            reject(new Error("Connection timeout after 60 seconds"));
          }
        }, 60000); // Increased timeout for QR code scanning

        const cleanup = () => {
          clearTimeout(connectionTimeout);
          // Remove all event listeners
          sock.ev.removeAllListeners("connection.update");
          sock.ev.removeAllListeners("messages.upsert");
          sock.ev.removeAllListeners("creds.update");

          // Close WebSocket connection if available
          if (sock.ws && typeof sock.ws.close === "function") {
            sock.ws.close();
          }

          // Try to end the socket if method exists
          if (sock && typeof sock.end === "function") {
            try {
              sock.end(undefined);
            } catch {
              // Ignore errors during cleanup
            }
          }
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        sock.ev.on("connection.update", async (update: any) => {
          const { connection, lastDisconnect, qr } = update;

          if (qr && showQR) {
            console.log("\n🔗 WHATSAPP CONNECTION REQUIRED 🔗");
            console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
            console.log("📱 Please scan this QR code with your WhatsApp:");
            console.log("   1. Open WhatsApp on your phone");
            console.log("   2. Go to Settings > Linked Devices");
            console.log('   3. Tap "Link a Device"');
            console.log("   4. Scan the QR code below:");
            console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

            try {
              const qrCode = await QRCode.toString(qr, {
                type: "terminal",
                small: true,
                margin: 1,
              });
              console.log(qrCode);
            } catch {
              console.log("❌ Failed to generate QR code in terminal format");
              console.log("Raw QR data:", qr);
            }

            console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
            console.log("⏳ Waiting for QR code to be scanned...");
            console.log(
              "💡 Connection will timeout in 60 seconds if not scanned"
            );
            console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
          }

          if (connection === "close") {
            const shouldReconnect =
              (lastDisconnect?.error as Boom)?.output?.statusCode !==
              DisconnectReason.loggedOut;

            console.log("\n❌ WhatsApp connection closed");
            console.log("Reason:", lastDisconnect?.error?.message || "Unknown");
            console.log("Should reconnect:", shouldReconnect);

            if (!isResolved) {
              if (shouldReconnect) {
                console.log("🔄 Attempting to reconnect in 3 seconds...\n");
                // Retry the connection after cleanup
                cleanup();
                setTimeout(() => connectAndSend(), 3000);
              } else {
                isResolved = true;
                cleanup();
                reject(
                  new Error(
                    "WhatsApp connection was logged out. Please scan QR code again."
                  )
                );
              }
            }
          } else if (connection === "open") {
            console.log("\n✅ WhatsApp connection established successfully!");
            console.log("📤 Sending message...");

            try {
              // Wait a bit to ensure connection is fully established
              await new Promise((resolve) => setTimeout(resolve, 500));

              await sock.sendMessage(jid, { text: message });

              if (!isResolved) {
                isResolved = true;
                console.log("✅ Message sent successfully!");

                // Schedule cleanup after a short delay to ensure message is sent
                setTimeout(() => {
                  cleanup();
                }, 1000);

                resolve({
                  success: true,
                  message: `Message sent successfully to ${jid}`,
                });
              }
            } catch (sendError) {
              if (!isResolved) {
                isResolved = true;
                console.log("❌ Failed to send message:", sendError);
                cleanup();
                reject(
                  new Error(
                    `Failed to send message: ${sendError instanceof Error ? sendError.message : "Unknown error"}`
                  )
                );
              }
            }
          } else if (connection === "connecting") {
            console.log("🔄 Connecting to WhatsApp...");
          }
        });


        // Reduced message logging to prevent spam
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        sock.ev.on("messages.upsert", async (event: any) => {
          // Only log our own sent messages to reduce console spam
          for (const m of event.messages) {
            if (m.key.fromMe) {
              console.log("Message sent:", JSON.stringify(m.key, undefined, 2));
            }
          }
        });

        // to storage creds (session info) when it updates
        sock.ev.on("creds.update", saveCreds);
      } catch (error) {
        console.error("Error connecting to WhatsApp:", error);
        if (!isResolved) {
          isResolved = true;
          reject(
            new Error(error instanceof Error ? error.message : "Unknown error")
          );
        }
      }
    };

    connectAndSend();
  });
}

// Standalone function to test WhatsApp connection via QR code
export async function connectWhatsAppViaQR(): Promise<{
  success: boolean;
  message: string;
}> {
  return new Promise((resolve, reject) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let sock: any = null;
    let isResolved = false;

    const connect = async () => {
      try {
        console.log("🚀 Starting WhatsApp connection...");
        const { state, saveCreds } =
          // eslint-disable-next-line react-hooks/rules-of-hooks
          await useMultiFileAuthState("auth_info_baileys");

        sock = makeWASocket({
          auth: state,
          logger: P({ level: "warn" }), // Show some logs for connection status
        });

        // Set a longer timeout for QR code scanning
        const connectionTimeout = setTimeout(() => {
          if (!isResolved) {
            isResolved = true;
            cleanup();
            reject(
              new Error(
                "Connection timeout after 120 seconds. Please try again."
              )
            );
          }
        }, 120000);

        const cleanup = () => {
          clearTimeout(connectionTimeout);
          if (sock) {
            sock.ev.removeAllListeners("connection.update");
            sock.ev.removeAllListeners("creds.update");

            if (sock.ws && typeof sock.ws.close === "function") {
              sock.ws.close();
            }
          }
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        sock.ev.on("connection.update", async (update: any) => {
          const { connection, lastDisconnect, qr } = update;

          if (qr) {
            const qrDataUrl = await QRCode.toDataURL(qr); // Generates base64 image
            wss.clients.forEach((client) => {
              if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({ type: "qr", data: qrDataUrl }));
              }
            });
          }

          if (connection === "open") {
            wss.clients.forEach((client) => {
              if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({ type: "status", data: "connected" }));
              }
            });
          }

          if (qr) {
            console.log("\n🔗 WHATSAPP QR CODE CONNECTION 🔗");
            console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
            console.log("📱 Please scan this QR code with your WhatsApp:");
            console.log("   1. Open WhatsApp on your phone");
            console.log("   2. Go to Settings > Linked Devices");
            console.log('   3. Tap "Link a Device"');
            console.log("   4. Scan the QR code below:");
            console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

            try {
              const qrCode = await QRCode.toString(qr, {
                type: "terminal",
                small: true,
                margin: 1,
                width: 50,
              });
              console.log(qrCode);
            } catch {
              console.log("❌ Failed to generate QR code in terminal format");
              console.log("Please scan this raw QR data:", qr);
            }

            console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
            console.log("⏳ Waiting for QR code to be scanned...");
            console.log(
              "💡 Connection will timeout in 120 seconds if not scanned"
            );
            console.log(
              "🔄 A new QR code will be generated if this one expires"
            );
            console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
          }

          if (connection === "close") {
            const shouldReconnect =
              (lastDisconnect?.error as Boom)?.output?.statusCode !==
              DisconnectReason.loggedOut;

            console.log("\n❌ WhatsApp connection closed");

            if (!isResolved) {
              if (shouldReconnect) {
                console.log("🔄 Connection interrupted. Reconnecting...\n");
                cleanup();
                setTimeout(() => connect(), 2000);
              } else {
                isResolved = true;
                cleanup();
                reject(
                  new Error(
                    "WhatsApp session logged out. Please scan QR code again."
                  )
                );
              }
            }
          } else if (connection === "open") {
            console.log("\n🎉 SUCCESS! WhatsApp connection established!");
            console.log(
              "✅ Your WhatsApp is now connected and ready to send messages."
            );
            console.log("📱 You can now use the sendWhatsAppMessage function.");

            if (!isResolved) {
              isResolved = true;
              setTimeout(() => {
                cleanup();
              }, 2000);

              resolve({
                success: true,
                message:
                  "WhatsApp connected successfully! You can now send messages.",
              });
            }
          } else if (connection === "connecting") {
            console.log("🔄 Connecting to WhatsApp servers...");
          }
        });

        sock.ev.on("creds.update", saveCreds);
      } catch (error) {
        console.error("❌ Error during connection:", error);
        if (!isResolved) {
          isResolved = true;
          reject(
            new Error(
              error instanceof Error
                ? error.message
                : "Unknown connection error"
            )
          );
        }
      }
    };

    connect();
  });
}

// Test function - uncomment to test QR connection
// (async () => {
//   try {
//     console.log('🔧 Testing WhatsApp QR connection...');
//     const result = await connectWhatsAppViaQR();
//     console.log("✅ Connection Result:", result);
//   } catch (error) {
//     console.error("❌ Connection Error:", error);
//   }
// })();

// Uncomment below to test sending a message (make sure you're connected first)
(async () => {
  try {
    console.log('📱 Testing message send...');
    const result = await sendWhatsAppMessage("+923390036284", "Hello from WhatsApp Bot! 🤖");
    console.log("✅ Message Result:", result);
  } catch (error) {
    console.error("❌ Message Error:", error);
  }
})();
