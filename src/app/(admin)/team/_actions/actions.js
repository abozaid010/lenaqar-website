'use server';

import { getClientid } from "@/components/services/clientCookies";
import { createNewEmployee, editExistingEmployee } from "@/components/services/serviceFetching";
import { revalidatePath } from "next/cache";

export async function addNewSales(prevState, formData) {
    try {
        const clientId = await getClientid();

        const payload = Object.fromEntries(formData.entries());

        const newSales = {
            ...payload,
            "position": "sales",
            client_id: clientId,
        };

        await createNewEmployee(newSales);

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

export async function editEmployee(prevState, formData) {
    try {
        const clientId = await getClientid();

        const payload = Object.fromEntries(formData.entries());

        console.log(payload);
        const newSales = {
            ...payload,
            "position": "sales",
            client_id: clientId,
        };

        await editExistingEmployee(newSales);

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