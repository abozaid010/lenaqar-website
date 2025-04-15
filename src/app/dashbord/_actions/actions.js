'use server';

import { revalidatePath } from "next/cache";
import axiosInstance from "@/utils/axiosInstance";
import { getClientid } from "@/components/services/clientCookies";

export async function addNewAction(prevState, formData) {
    const clientId = await getClientid();

    const payload = {
        client_id: clientId,
        user_id: formData.get('userId'),
        action: formData.get('action_type'),
        description: formData.get('comment'),
        created_at: new Date().toISOString()
    };

    try {
        await axiosInstance.post(`/action/`, payload, {
            headers: {
                "Content-Type": "application/json",
            },
        });

        revalidatePath('/dashbord');
        return {
            success: true,
            message: "Action posted successfully",
        };


    } catch (error) {
        console.error("Error posting action:", error);
        return {
            success: false,
            message: "Failed to post action",
        };
    }
}