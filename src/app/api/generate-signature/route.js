// app/api/generate-signature/route.js
import crypto from "crypto";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const method = "GET";
    const va = process.env.PAYMENT_VA;
    const apiKey = process.env.PAYMENT_API_KEY;

    // Validasi jika env belum diset
    if (!va || !apiKey) {
      return NextResponse.json(
        { error: "Konfigurasi server tidak lengkap" },
        { status: 500 }
      );
    }

    const body = ""; // GET kosong

    const bodyHash = crypto
      .createHash("sha256")
      .update(body)
      .digest("hex")
      .toLowerCase();

    const stringToSign = `${method}:${va}:${bodyHash}:${apiKey}`;

    const signature = crypto
      .createHmac("sha256", apiKey)
      .update(stringToSign)
      .digest("hex");

    // Di sini kamu bisa langsung melakukan fetch() ke API pihak ketiga
    // menggunakan signature tersebut, ATAU mengembalikan signature-nya
    
    return NextResponse.json({ signature });
    
  } catch (error) {
    return NextResponse.json(
      { error: "Gagal membuat signature" },
      { status: 500 }
    );
  }
}