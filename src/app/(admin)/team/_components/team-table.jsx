"use client";

import { useI18n } from "@/context/translate-api";
import { Trash2, Edit2 } from "lucide-react";

export default function TeamTable({ data }) {
  const { t } = useI18n();

  return (
    <div className="mt-6">
      {!data || data.length === 0 ? (
        <div className="text-center font-medium text-xl mt-5 text-gray-400">
          There are no team members yet
        </div>
      ) : (
        <div className="border border-gray-200 sm:rounded-lg scroll-snap-x-mandatory">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100">
              <tr className="text-left text-xs sm:text-sm font-medium text-gray-600">
                <th className="px-2 py-2 text-center whitespace-nowrap">
                  {t.clientsTable.headers.name || "Name"}
                </th>

                <th className="px-2 py-2 text-center whitespace-nowrap">
                  Email
                </th>

                <th className="px-2 sm:px-4 py-2 text-center whitespace-nowrap">
                  phone
                </th>
                <th className="px-2 sm:px-4 py-2 text-center whitespace-nowrap">
                  Position
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
                    <button
                      onClick={() => {
                        /* handle edit */
                      }}
                    >
                      <Edit2 className="w-4 h-4 text-blue-500 hover:text-blue-700" />
                    </button>
                  </td>

                  <td className="px-2 py-2 text-center">
                    <button
                      onClick={() => {
                        /* handle delete */
                      }}
                    >
                      <Trash2 className="w-4 h-4 text-red-500 hover:text-red-700" />
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
