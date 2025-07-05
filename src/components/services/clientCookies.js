"use server";

import { cookies } from "next/headers";

export const getClientid = async () => {
  const cookieStore = await cookies();
  const cookie = cookieStore.get("lena-website-client_id");

  if (!cookie || !cookie.value) return {};

  try {
    return cookie.value;
  } catch (error) {
    console.error("Failed to parse client_id cookie:", error);
    return {};
  }
};

export const getClientEmail = async () => {
  const cookieStore = await cookies();
  const clientInfo = cookieStore.get("client_info");

  const email = JSON.parse(clientInfo?.value)?.email;

  if (email) {
    return email;
  } else {
    return false;
  }
};
