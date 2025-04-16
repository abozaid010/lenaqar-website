'use server';

import { revalidatePath } from "next/cache";
import axiosInstance from "@/utils/axiosInstance";
import { getClientid } from "@/components/services/clientCookies";

export async function addNewAction(prevState, formData) {
    const clientId = await getClientid();
    const phoneNumber = formData.get('userId');
    const actionID = `07110321520_${clientId}`;

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
        console.error("Error posting action:", error);
        return {
            success: false,
            message: "Failed to post action",
        };
    }
}