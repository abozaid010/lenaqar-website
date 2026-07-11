"use server";

import { getClientid } from "@/components/services/clientCookies";
import {
  createNewEmployee,
  editExistingEmployee,
} from "@/components/services/serviceFetching";
import { fetchClientProfileFromCookies } from "@/lib/fetchClientProfile.server";
import { deriveTeamMemberModuleActionsFromParent } from "@/lib/team-module-actions";
import { revalidatePath } from "next/cache";
import { assertCanManageTeam } from "@/lib/getRoleFromToken";

/** Same parent-derived matrix for create and update team members. */
async function getTeamMemberModuleActionsForRole(role) {
  const profile = await fetchClientProfileFromCookies();
  const parentModuleActions = profile?.data?.module_actions;
  return deriveTeamMemberModuleActionsFromParent(parentModuleActions, role);
}

export async function addNewSales(prevState, formData) {
  try {
    const { allowed } = await assertCanManageTeam();
    if (!allowed) {
      return { success: false, error: "You do not have permission to add team members." };
    }
    const clientId = await getClientid();

    const payload = Object.fromEntries(formData.entries());
    const role = payload.role || "viewer";

    const module_actions = await getTeamMemberModuleActionsForRole(role);

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
    console.error("[addNewSales] Error:", error?.message ?? error);
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

    // Skip password if empty (user didn't change it)
    if (!payload.password || payload.password.trim() === "") {
      delete payload.password;
    }

    const module_actions = await getTeamMemberModuleActionsForRole(role);

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
    console.error("[editEmployee] Error:", error?.message ?? error);
    return {
      success: false,
      error: error.message || "Failed to edit team member.",
    };
  }
}
