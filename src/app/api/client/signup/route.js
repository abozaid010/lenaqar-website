import { NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/apiConfig";
import { isRequestFromKingAdmin } from "@/lib/kingAdmin";
import { bffFetch } from "@/lib/bffFetch";

/**
 * POST /api/client/signup
 * Creates a new client by forwarding the request to the external API
 * Only accessible by king admin users (client_id === 'public')
 */
export async function POST(request) {
  try {
    // Check if the request is from a king admin with proper JWT validation
    if (!(await isRequestFromKingAdmin(request))) {
      return NextResponse.json(
        { error: "Unauthorized. King admin access required." },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Validate required fields
    const requiredFields = [
      'client_id',
      'client_name', 
      'email',
      'password',
      'full_name',
      'phone_number',
      'price_percentage'
    ];

    const missingFields = requiredFields.filter(field => !body[field]);
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Validate password length
    if (body.password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long" },
        { status: 400 }
      );
    }

    // Validate accurate_queries_level range
    if (body.accurate_queries_level !== undefined && 
        (body.accurate_queries_level < 0 || body.accurate_queries_level > 4)) {
      return NextResponse.json(
        { error: "accurate_queries_level must be between 0 and 4" },
        { status: 400 }
      );
    }

    // Prepare the request payload
    const payload = {
      client_id: body.client_id,
      client_name: body.client_name,
      email: body.email,
      password: body.password,
      full_name: body.full_name,
      address: body.address || null,
      google_map_link: body.google_map_link || null,
      phone_number: body.phone_number,
      client_type: body.client_type || "free",
      is_active: body.is_active !== undefined ? body.is_active : true,
      created_at: new Date().toISOString(),
      price_percentage: parseFloat(body.price_percentage) || 0,
      sharing_policy: body.sharing_policy || "only_my_units",
      developer_sharing_policy: body.developer_sharing_policy || "only_my_developers",
      projects_sharing_policy: body.projects_sharing_policy || "only_my_projects",
      crm_link: body.crm_link || null,
      accurate_queries_level: parseInt(body.accurate_queries_level) || 0,
      chatbot_welcome_message: body.chatbot_welcome_message || null,
      chatbot_initial_suggestions: body.chatbot_initial_suggestions || null,
      module_actions: body.module_actions || {}
    };

    // Call the external API
    let response;
    try {
      response = await bffFetch(`${API_BASE_URL}/client/signup`, {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });
    } catch (fetchError) {
      if (fetchError.code === 'ECONNREFUSED' || fetchError.name === 'AbortError') {
        return NextResponse.json(
          { error: `Backend API unavailable at ${API_BASE_URL}. Please check if the server is running.` },
          { status: 503 }
        );
      }
      throw fetchError;
    }

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: errorText };
      }
      
      return NextResponse.json(
        { error: errorData.error || `Client signup failed with status ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      message: "Client created successfully",
      data: data
    });

  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[client-signup] Error:", error?.message ?? error);
    }
    
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
