import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { COOKIE_KEYS } from "@/constants/cookieKeys";

const SESSION_COOKIE_NAMES = [
  COOKIE_KEYS.ACCESS_TOKEN,
  COOKIE_KEYS.REFRESH_TOKEN,
  COOKIE_KEYS.CLIENT_ID,
  COOKIE_KEYS.CLIENT_INFO,
];

/**
 * Clears auth cookies (including httpOnly refresh). POST only.
 */
export async function POST() {
  const res = NextResponse.json({ ok: true });
  for (const name of SESSION_COOKIE_NAMES) {
    res.cookies.delete(name);
  }
  return res;
}
