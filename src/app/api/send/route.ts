// import { NextResponse } from "next/server";
// import { sendWhatsappMessage } from "../../../lib/whatsapp/sendMessage";

// export async function POST(req: Request) {
//   const { phone, message } = await req.json();

//   try {
//     await sendWhatsappMessage(phone, message);
//     return NextResponse.json({ success: true });
//   } catch (err: any) {
//     return NextResponse.json(
//       { success: false, error: err.message },
//       { status: 500 }
//     );
//   }
// }
