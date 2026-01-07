export async function sendWhatsAppMessage(
  phone: string,
  message: string
) {
  try {
    await fetch(`https://water-web-server-production.up.railway.app/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        phone,
        message,
      }),
    });
  } catch (error) {
    console.error("❌ WhatsApp send failed", error);
  }
}
