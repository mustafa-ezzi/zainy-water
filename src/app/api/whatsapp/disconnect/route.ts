// // import { sock, startWhatsapp } from "../../../../../whatsapp/ws-server"; // adjust the import path correctly
// import { NextResponse } from "next/server"; // Use this for App Router (recommended)
// // import type { NextApiRequest, NextApiResponse } from "next"; // Use for Pages Router

// // For App Router (Next.js 13+)
// export async function POST() {
//     if (!sock) {
//         return NextResponse.json({ error: "Not connected" }, { status: 400 });
//     }

//     try {
//         // Log out from WhatsApp servers (revokes the session)
//         await sock.logout();

//         // Delete the auth folder contents to force fresh QR on next connect
//         const fs = require("fs");
//         const path = require("path");
//         const authDir = path.join(process.cwd(), "auth_info_baileys");

//         if (fs.existsSync(authDir)) {
//             fs.rmSync(authDir, { recursive: true, force: true });
//             console.log("🗑️ Auth folder deleted");
//         }

//         // Restart the WhatsApp connection (will generate new QR)
//         await startWhatsapp();

//         return NextResponse.json({
//             success: true,
//             message: "Logged out successfully. New QR will appear shortly.",
//         });
//     } catch (error) {
//         console.error("Logout error:", error);
//         return NextResponse.json(
//             { error: "Logout failed", details: (error as any).message },
//             { status: 500 }
//         );
//     }
// }

// // If you're using Pages Router instead:
// // export default async function handler(req: NextApiRequest, res: NextApiResponse) {
// //     if (req.method !== "POST") return res.status(405).end();
// //     // ... same body as above, but use res.status().json()
// // }