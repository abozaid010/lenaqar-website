"use server";

import { getClientid } from "@/components/services/clientCookies";
import {
  createNewEmployee,
  editExistingEmployee,
} from "@/components/services/serviceFetching";
import { revalidatePath } from "next/cache";
import { assertCanManageTeam } from "@/lib/getRoleFromToken";

export async function addNewSales(prevState, formData) {
  try {
    const { allowed } = await assertCanManageTeam();
    if (!allowed) {
      return { success: false, error: "You do not have permission to add team members." };
    }
    const clientId = await getClientid();

    const payload = Object.fromEntries(formData.entries());
    const role = payload.role || "viewer";

    const newSales = {
      ...payload,
      role,
      job_title: role,
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
    const { allowed } = await assertCanManageTeam();
    if (!allowed) {
      return { success: false, error: "You do not have permission to edit team members." };
    }
    const clientId = await getClientid();

    const payload = Object.fromEntries(formData.entries());
    const role = payload.role || "viewer";

    const newSales = {
      ...payload,
      role,
      job_title: role,
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
