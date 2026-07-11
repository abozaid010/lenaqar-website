import axios from "axios";
import { API_BASE_URL, PUBLIC_X_API_KEY } from "@/lib/apiConfig";

export async function loginUser(credentials) {
    const params = new URLSearchParams();
    params.append('grant_type', 'password');
    params.append('username', credentials.email);
    params.append('password', credentials.password);

    const url = `${API_BASE_URL}/client/login`;

    const headers = {
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
    };
    if (PUBLIC_X_API_KEY) {
        headers["X-API-Key"] = PUBLIC_X_API_KEY;
    }

    const response = await axios.post(url, params, {
        headers,
        validateStatus: (status) => status >= 200 && status < 500,
        timeout: 30000,
    });

    if (!response?.data) {
        throw new Error("No data received from server");
    }

    return response.data;
}
