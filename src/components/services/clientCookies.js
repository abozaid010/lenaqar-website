"use server";

import { cookies } from "next/headers";
import toast from "react-hot-toast";

export const getClientid = async () => {
  const cookieStore = await cookies();
  const cookie = cookieStore.get("lena-website::client_id");


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
  };
};
export const gettoken = async () => {
  const cookieStore = await cookies();
  const cookie = cookieStore.get("access_token");


  if (!cookie || !cookie.value) return {};

  try {
    return cookie.value;
  } catch (error) {
    console.error("Failed to parse client_id cookie:", error);
    return {};
  }
};

export const removeClientId = async () => {
  const cookie = cookies().get("lena-website::client_id");

  console.log(cookie);
  if (!cookie || !cookie.value)
    return toast.error("Failed to remove client_id cookie:");

  try {
    cookies.delete("lena-website::client_id");
    console.log("client_id cookie removed");
  } catch (error) {
    console.error("Failed to remove client_id cookie:", error);
  }
};
