"use server";
import crypto from "crypto";

export async function getPaymentChannels() {
  // 1. Pastikan tidak ada spasi menggunakan .trim()
  //   const va = "0000005695703592".trim();
  const va = "1179005406897350".trim();
  //   const apiKey = "SANDBOXD9011739-62CF-4C4B-98B1-842F1A1F4855".trim();
  const apiKey = "72DD41FC-A8B1-400D-8F5A-58F6A49B511E".trim();

  //   const url = "https://sandbox.ipaymu.com/api/v2/payment-channels";
  const url = "https://my.ipaymu.com/api/v2/payment-channels";
  const method = "GET";

  // 2. PERUBAHAN UTAMA: Ubah string kosong menjadi objek JSON kosong
  // karena aturan iPaymu: "Request body harus berupa JSON"[cite: 81].
  const requestBody = JSON.stringify({});

  // Generate Timestamp
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");
  const timestamp = `${year}${month}${day}${hours}${minutes}${seconds}`;

  // Hash Body dengan SHA256 -> Lowercase
  const bodyHash = crypto
    .createHash("sha256")
    .update(requestBody)
    .digest("hex")
    .toLowerCase();

  // Susun StringToSign sesuai panduan: HTTPMethod:VaNumber:Lowercase(SHA-256(RequestBody)):ApiKey [cite: 66, 68]
  const stringToSign = `${method}:${va}:${bodyHash}:${apiKey}`;

  // Buat Signature dengan HMAC-SHA256 [cite: 60, 64]
  const signature = crypto
    .createHmac("sha256", apiKey)
    .update(stringToSign)
    .digest("hex");

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        va: va,
        signature: signature,
        timestamp: timestamp,
      },
      cache: "no-store",
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Fetch error:", error);
    return { error: "Gagal terhubung ke API" };
  }
}
