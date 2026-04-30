"use server";

import { getClientid } from "@/components/services/clientCookies";
import {
  createNewEmployee,
  editExistingEmployee,
} from "@/components/services/serviceFetching";
import { getModuleActionsForTeamRole } from "@/lib/team-module-actions";
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
    const module_actions = getModuleActionsForTeamRole(role);

    const newSales = {
      ...payload,
      role,
      job_title: role,
      client_id: clientId,
      module_actions,
    };

    await createNewEmployee(newSales);

    revalidatePath("/team");

    return {
      success: true,
      data: newSales,
    };
  } catch (error) {
    console.error("[addNewSales] Error:", error);
    return {
      success: false,
      error: error.message || "Failed to add new sales.",
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
    const module_actions = getModuleActionsForTeamRole(role);

    // Skip password if empty (user didn't change it)
    if (!payload.password || payload.password.trim() === "") {
      delete payload.password;
    }

    const newSales = {
      ...payload,
      role,
      job_title: role,
      client_id: clientId,
      module_actions,
    };

    await editExistingEmployee(newSales);

    revalidatePath("/team");

    return {
      success: true,
      data: newSales,
    };
  } catch (error) {
    console.error("[editEmployee] Error:", error);
    return {
      success: false,
      error: error.message || "Failed to edit team member.",
    };
  }
}
