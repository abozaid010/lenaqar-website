"use server";

import { cookies } from "next/headers";
import { loginUser } from "@/utils/server-api";
import { COOKIE_KEYS } from "@/constants/cookieKeys";
import { getServerCookieOptions } from "@/lib/CookieConfig";

export async function loginAction(prevState, formData) {
  // Input validation and sanitization
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");

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
    if (!response.status) {
      return {
        success: false,
        message: response.message || "Login failed. Please check your credentials."
      };
    }

    // Extract response data
    // The API might return user data directly in response.data or nested in a 'user' object
    const data = response.data || {};

    // Check if data is directly in the response or nested
    const userData = data.user || data;

    const {
      access_token,
      refresh_token,
      expires_in,
      token_type = 'Bearer'
    } = data; // tokens seem to be at top level usually, but checking both levels for user info

    const {
      client_id,
      client_name,
      email: userEmail,
      phone_number,
      client_type,
    } = userData;

    // Validate required fields
    if (!access_token || !refresh_token) {
      throw new Error("Invalid response from server");
    }

    const cookieStore = await cookies();

    // Set cookies using centralized CookieConfig for consistency
    // Access token: 1 hour expiration
    const accessTokenOptions = getServerCookieOptions("ACCESS_TOKEN");
    cookieStore.set(COOKIE_KEYS.ACCESS_TOKEN, access_token, accessTokenOptions);

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
        client_type
      }),
      clientInfoOptions
    );

    return {
      success: true,
      message: "Login successful"
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
