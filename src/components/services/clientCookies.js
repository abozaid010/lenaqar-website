"use server";

import { COOKIE_KEYS } from "@/constants/cookieKeys";
import { cookies } from "next/headers";

export const getClientid = async () => {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(COOKIE_KEYS.CLIENT_ID);

  if (!cookie || !cookie.value) return {};

  try {
    return cookie.value;
  } catch (error) {
    console.error("Failed to parse client_id cookie:", error?.message ?? error);
    return {};
  }
};
