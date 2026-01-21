import { NextResponse } from "next/server";
import { notifySlack, notifyTelegram } from "@/lib/notifications";

export async function POST(request: Request) {
  const { message } = await request.json();

  await Promise.all([notifySlack(message), notifyTelegram(message)]);

  return NextResponse.json({ ok: true });
}
