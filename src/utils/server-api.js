import axios from "axios";
import { API_BASE_URL } from "@/lib/apiConfig";

export async function loginUser(credentials) {
    const params = new URLSearchParams();
    params.append('grant_type', 'password');
    params.append('username', credentials.email);
    params.append('password', credentials.password);

    const response = await axios.post(`${API_BASE_URL}/client/login`, params, {
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        validateStatus: status => status >= 200 && status < 500
    });

    if (!response.data) {
        throw new Error("No data received from server");
    }

    return response.data;
}
