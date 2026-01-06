import axios from "axios";

const getBaseUrl = () => {
  const url = process.env.API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    "https://api.lenaai.net";
  return url.startsWith("http") ? url : `https://${url}`;
};

const BASE_URL = getBaseUrl();

export async function loginUser(credentials) {
    const params = new URLSearchParams();
    params.append('grant_type', 'password');
    params.append('username', credentials.email);
    params.append('password', credentials.password);

    const response = await axios.post(`${BASE_URL}/client/login`, params, {
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
