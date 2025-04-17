'use server';

import { revalidatePath } from "next/cache";
import axiosInstance from "@/utils/axiosInstance";
import { getClientid } from "@/components/services/clientCookies";

export async function addNewAction(prevState, formData) {
    const clientId = await getClientid();
    const phoneNumber = formData.get('userId');
    const actionID = `${phoneNumber}_${clientId}`;
    const AIActions = JSON.parse(formData.get('ai_action'));

    // Case1: there is no AI action
    if (Object.keys(AIActions).length === 0) {
        const payload = {
            client_id: clientId,
            user_id: formData.get('userId'),
            action: formData.get('action_type'),
            description: formData.get('comment'),
            created_at: new Date().toISOString()
        };

        try {
            await axiosInstance.post(`/action/`, payload);

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

    // case2: there is AI action
    try {
        const newAction = {
            action: formData.get('action_type'),
            comment: formData.get('comment'),
            created_at: new Date().toISOString(),
            user: "sales",
        };

        const payload = {
            ...AIActions,
            "actions_history": AIActions.actions_history ? [...AIActions.actions_history, newAction] : [
                newAction,
            ],
        };

        await axiosInstance.put(`/action/${actionID}`, JSON.stringify(payload));

        revalidatePath('/dashbord');

        return {
            success: true,
            message: "Action posted successfully",
        };
    } catch (error) {
        // Handle specific error scenarios
        if (error.response) {
            // Server responded with a status code outside the 2xx range
            console.error("Server response error:", error.response.data);
            return {
                success: false,
                message: `Failed to post action: ${error.response.data.detail || "Server error"}`,
            };
        } else if (error.request) {
            // Request was made but no response received
            console.error("No response received:", error.request);
            return {
                success: false,
                message: "Failed to post action: No response from server",
            };
        } else {
            // Something else caused the error
            console.error("Unexpected error:", error.message);
            return {
                success: false,
                message: `Failed to post action: ${error.message}`,
            };
        }
    }
}