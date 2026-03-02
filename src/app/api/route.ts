import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ 
    message: "JM Consulting API",
    version: "2.0.0",
    timestamp: new Date().toISOString(),
    endpoints: [
      "/api/seed",
      "/api/pl/niveles",
      "/api/pl/cuentas",
      "/api/cashflow/items",
      "/api/cashflow/entries"
    ]
  });
}