'use server';

import { revalidatePath } from "next/cache";
import axiosInstance from "@/utils/axiosInstance";
import { getClientid } from "@/components/services/clientCookies";

export async function addNewAction(prevState, formData) {
    const clientId = await getClientid();
    const phoneNumber = formData.get('userId');
    const actionID = `${phoneNumber}_${clientId}`;

    let AIActions = JSON.parse(formData.get('ai_action'));

    if (Object.keys(AIActions).length === 0) {
        AIActions = {
            "client_id": clientId,
            "user_id": phoneNumber,
            "created_at": new Date().toISOString(),
            "preferred_time": new Date().toISOString(),
            "action": "Not interested",
            "description": "The client is not interested or not qualified in the property",
        };
    }

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

    try {
        await axiosInstance.put(`/action/${actionID}`, JSON.stringify(payload), {
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