import axios from "axios";
import { API_BASE_URL, PUBLIC_X_API_KEY } from "@/lib/apiConfig";

export async function loginUser(credentials) {
    const isDev = process.env.NODE_ENV === "development";
    const params = new URLSearchParams();
    params.append('grant_type', 'password');
    params.append('username', credentials.email);
    params.append('password', credentials.password);

    const url = `${API_BASE_URL}/client/login`;
    const startedAt = Date.now();
    if (isDev) {
        console.log("[auth][login][request]", {
            method: "POST",
            url,
            username: credentials?.email ? String(credentials.email) : null,
            contentType: "application/x-www-form-urlencoded",
        });
    }

    const headers = {
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
    };
    if (PUBLIC_X_API_KEY) {
        headers["X-API-Key"] = PUBLIC_X_API_KEY;
    }

    let response;
    try {
        response = await axios.post(url, params, {
            headers,
            validateStatus: (status) => status >= 200 && status < 500,
            timeout: 30000,
        });
    } catch (error) {
        if (isDev) {
            console.log("[auth][login][response]", {
                method: "POST",
                url,
                status: null,
                durationMs: Date.now() - startedAt,
                ok: false,
                message: error?.message ?? null,
                dataKeys: null,
            });
        }
        throw error;
    }

    if (isDev) {
        const ms = Date.now() - startedAt;
        const body = response?.data;
        const data = body?.data;
        const dataKeys =
            data && typeof data === "object" && !Array.isArray(data)
                ? Object.keys(data).filter((k) => !String(k).includes("token"))
                : null;
        console.log("[auth][login][response]", {
            method: "POST",
            url,
            status: response?.status ?? null,
            durationMs: ms,
            ok: Boolean(body?.status),
            message: body?.message ?? body?.error_message ?? null,
            dataKeys,
        });
    }

    if (!response?.data) {
        throw new Error("No data received from server");
    }

    return response.data;
}
