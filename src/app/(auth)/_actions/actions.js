"use server";

import { cookies } from "next/headers";
import { loginUser } from "@/utils/server-api";
import { COOKIE_KEYS } from "@/constants/cookieKeys";
import { getServerCookieOptions } from "@/lib/CookieConfig";
import {
  getErrorMessage,
  isSuccessResponse,
} from "@/utils/api-response-handler";

function extractJwtExp(token) {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(Buffer.from(base64, "base64").toString("utf-8"));
    return typeof payload.exp === "number" ? payload.exp : null;
  } catch {
    return null;
  }
}

export async function loginAction(prevState, formData) {
  // Input validation and sanitization
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "").trim();

  // Basic validation
  if (!email || !password) {
    return {
      success: false,
      message: "Email and password are required"
    };
  }

  // Email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return {
      success: false,
      message: "Please enter a valid email address"
    };
  }

  try {
    // Call the centralized API function
    const response = await loginUser({
      email,
      password
    });
    // Handle non-successful responses
    if (!isSuccessResponse(response)) {
      return {
        success: false,
        message: getErrorMessage(
          response,
          "Login failed. Please check your credentials."
        ),
      };
    }

    // Extract response data (v2: JWT has no module_actions; permissions come from /client/v1/profile)
    const data = response.data || {};
    const userData = data.user || data;

    const access_token = data.access_token ?? userData.access_token;
    const refresh_token = data.refresh_token ?? userData.refresh_token;

    const client_id = data.client_id ?? userData.client_id;
    const client_name = data.client_name ?? userData.client_name;
    const userEmail = data.email ?? userData.email;
    const phone_number = data.phone_number ?? userData.phone_number;
    const client_type = data.client_type ?? userData.client_type;
    const role = data.role ?? userData.role ?? null;
    const permissions_version =
      data.permissions_version ?? userData.permissions_version ?? null;

    // Validate required fields
    if (!access_token || !refresh_token) {
      throw new Error("Invalid response from server");
    }

    const cookieStore = await cookies();

    // Set cookies using centralized CookieConfig for consistency
    // Access token: 1 hour expiration (httpOnly — never readable by client JS)
    const accessTokenOptions = getServerCookieOptions("ACCESS_TOKEN");
    cookieStore.set(COOKIE_KEYS.ACCESS_TOKEN, access_token, accessTokenOptions);

    // Non-httpOnly mirror: stores only the exp unix-seconds timestamp so client
    // code can schedule proactive refresh without touching the token itself.
    const exp = extractJwtExp(access_token);
    if (exp !== null) {
      cookieStore.set(
        COOKIE_KEYS.ACCESS_TOKEN_EXP,
        String(exp),
        getServerCookieOptions("ACCESS_TOKEN_EXP")
      );
    }

    // Refresh token: 30 days expiration (explicit, not inheriting from default)
    const refreshTokenOptions = getServerCookieOptions("REFRESH_TOKEN");
    cookieStore.set(COOKIE_KEYS.REFRESH_TOKEN, refresh_token, refreshTokenOptions);

    // Client ID: 30 days expiration
    const clientIdOptions = getServerCookieOptions("CLIENT_ID");
    cookieStore.set(COOKIE_KEYS.CLIENT_ID, client_id, clientIdOptions);

    // Client info: 30 days expiration
    const clientInfoOptions = getServerCookieOptions("CLIENT_INFO");
    cookieStore.set(
      COOKIE_KEYS.CLIENT_INFO,
      JSON.stringify({
        email: userEmail,
        client_name,
        phone_number,
        client_type,
        ...(role != null && typeof role === "string" ? { role } : {}),
        ...(permissions_version != null ? { permissions_version } : {}),
      }),
      clientInfoOptions
    );

    return {
      success: true,
      message: "Login successful",
      clientId: client_id,
      role: role != null && typeof role === "string" ? role : null,
      permissions_version:
        typeof permissions_version === "number" ? permissions_version : null,
    };

  } catch (error) {
    let errorMessage = "An error occurred during login";

    if (error.name === 'AbortError') {
      errorMessage = "Request timed out. Please try again.";
    } else if (error.response) {
      // Handle different HTTP error statuses
      switch (error.response.status) {
        case 401:
          errorMessage = "Invalid email or password";
          break;
        case 429:
          errorMessage = "Too many attempts. Please try again later.";
          break;
        case 500:
          errorMessage = "Server error. Please try again later.";
          break;
        default:
          errorMessage = error.response.data?.message || "Login failed";
      }
    } else if (error.request) {
      errorMessage = "Unable to connect to the server. Please check your connection.";
    }

    console.error('Login error:', error.message);

    return {
      success: false,
      message: errorMessage
    };
  }
}
