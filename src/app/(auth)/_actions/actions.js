"use server";

import axiosInstance from "@/utils/axiosInstance";
import { cookies } from "next/headers";

export async function loginAction(prevState, formData) {
  const clientEmail = formData.get("email");
  const password = formData.get("password");

  // TODO: frontend validation to eliminate unnecessary server calls
  // const isValidPassword = passwordValidation(password);
  // if (!isValidPassword) {
  //     return {
  //         success: false,
  //         message: "Invalid password format",
  //         errors: {
  //             password: "Password must be at least 8 characters long, contain at least one uppercase letter, one lowercase letter, and one number.",
  //         },
  //     };
  // }

  try {
    const payload = {
      username: clientEmail,
      password: password,
    };
    const response = await axiosInstance.post("/client/login", payload, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded", // Specifies that the request body is encoded as application/x-www-form-urlencoded.
      },
    });

    const {
      access_token,
      client_id,
      client_name,
      email,
      phone_number,
      refresh_token,
    } = response.data.data;
    const cookieStore = await cookies();
    cookieStore.set("access_token", access_token, {
      path: "/",
      secure: true,
      httpOnly: true,
    });
    cookieStore.set("refresh_token", refresh_token, {
      path: "/",
      secure: true,
      httpOnly: true,
    });
    cookieStore.set("lena-website-client_id", client_id, { path: "/" });
    cookieStore.set(
      "client_info",
      JSON.stringify({ email, client_name, phone_number }),
      { path: "/" }
    );

    return {
      success: true,
      message: "Login successful",
    };
  } catch (error) {
    console.error("Login failed:", error.message);
    return {
      success: false,
      message: "Login failed. Please check your credentials.",
    };
  }
}

const passwordValidation = (password) => {
  /**
   * Password must contain:
   * - At least 8 characters
   * - At least one uppercase letter
   * - At least one lowercase letter
   * - At least one number
   */
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;
  return passwordRegex.test(password);
};
