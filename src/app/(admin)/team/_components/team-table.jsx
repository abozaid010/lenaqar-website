"use client";

import { useI18n } from "@/context/translate-api";
import { deleteEmployee } from "@/utils/api";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import AddNewMember from "./add-new-member";
import EmptyStateVideo from "@/components/ui/empty-state-video";

export default function TeamTable({ data }) {
  const router = useRouter();
  const { t } = useI18n();
  const [currentId, setCurrentId] = useState(null);
  const [loadingDelete, setLoadingDelete] = useState(false);

  const handleDelete = async (id) => {
    setLoadingDelete(true);
    setCurrentId(id);
    try {
      await deleteEmployee(id);
      toast.success("Team member deleted successfully");
      router.refresh();
    } catch (error) {
      toast.error("Failed to delete team member");
    } finally {
      setLoadingDelete(false);
      setCurrentId(null);
    }
  };

  return (
    <div>
      {!data || data.length === 0 ? (
        <EmptyStateVideo variant="team" autoPlay muted showControls loop />
      ) : (
        <div className="border border-gray-200 sm:rounded-lg scroll-snap-x-mandatory mt-6">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100">
              <tr className="text-left text-xs sm:text-sm font-medium text-gray-600">
                <th className="px-2 py-2 text-center whitespace-nowrap">
                  {t.clientsTable.headers.name || "Name"}
                </th>

                <th className="px-2 py-2 text-center whitespace-nowrap">
                  {t.team.email || "Email"}
                </th>

                <th className="px-2 sm:px-4 py-2 text-center whitespace-nowrap">
                  {t.team.phone || "Phone"}
                </th>
                <th className="px-2 sm:px-4 py-2 text-center whitespace-nowrap">
                  {t.team.role || "Position"}
                </th>

                <th className="px-2 py-2 text-center whitespace-nowrap"></th>

                <th className="px-2 py-2 text-center whitespace-nowrap"></th>
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-gray-200">
              {data.map((item) => (
                <tr key={item.id}>
                  <td className="px-2 py-2 font-medium text-gray-600 whitespace-nowrap text-center">
                    {item.name}
                  </td>
                  <td className="px-2 py-2 text-gray-600 whitespace-nowrap text-center">
                    {item.email}
                  </td>
                  <td className="px-2 py-2 text-gray-600 whitespace-nowrap text-center">
                    {item.phone}
                  </td>
                  <td className="px-2 py-2 text-gray-600 whitespace-nowrap text-center">
                    {item.position}
                  </td>
                  <td className="px-2 py-2 text-center">
                    <AddNewMember isEdit={true} data={item} />
                  </td>

                  <td className="px-2 py-2 text-center">
                    <button onClick={() => handleDelete(item.id)}>
                      {loadingDelete && currentId === item.id ? (
                        <div className="animate-spin w-4 h-4 border-2 border-gray-400 rounded-full border-t-transparent"></div>
                      ) : (
                        <Trash2 className="w-4 h-4 text-red-500 hover:text-red-700" />
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
