'use server';

import { getClientid } from "@/components/services/clientCookies";
import { revalidatePath } from "next/cache";

export async function addNewSales(prevState, formData) {
    try {
        const clientId = await getClientid();

        const payload = Object.fromEntries(formData.entries());

        console.log("clientId", Object.fromEntries(formData.entries()));
        const newSales = {
            ...payload,
            client_id: clientId,
        };

        await new Promise((resolve) => setTimeout(resolve, 1000));

        revalidatePath("/team");

        return {
            success: true,
            data: newSales,
        };
    } catch (error) {

        return {
            success: false,
            error: "Failed to add new sales.",
        };
    }
}