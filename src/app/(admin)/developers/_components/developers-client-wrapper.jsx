"use client";

import AddDeveloperDialog from "@/components/ui/add-developer-dialog";
import { useI18n } from "@/context/translate-api";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

export default function DevelopersClientWrapper({
  initialDevelopers,
  clientId,
}) {
  const { t } = useI18n();
  const [developers, setDevelopers] = useState(initialDevelopers || []);
  const [selectedDeveloper, setSelectedDeveloper] = useState(null);
  const [isOpen, setIsOpen] = useState(false);

  const handleEdit = (developerData) => {
    selectedDeveloper(developerData);
  };

  const handleAdd = (newDeveloper) => {
    setDevelopers((prev) => [...prev, newDeveloper]);
    setIsOpen(false);
  };

  const handleDelete = (developerId) => {
    setDevelopers((prev) =>
      prev.filter((developer) => developer.id !== developerId)
    );
  };

  console.log("Developers:", developers);

  return (
    <>
      <div className="bg-gray-50 flex flex-col lg:flex-row gap-4 p-3">
        <div className="bg-white flex-1 h-fit rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-primary p-4 flex justify-between items-center">
            <h2 className="text-white text-xl font-semibold">
              {t.sidebar.myProjects}
            </h2>
            <button
              onClick={() => setIsOpen(true)}
              className="flex items-center gap-2 bg-white text-primary px-4 py-2 rounded-lg transition-colors duration-200"
            >
              <Plus size={20} />
              <span> {t.addNewProject}</span>
            </button>
          </div>

          <div className="max-h-[80vh] overflow-y-auto">
            {developers.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-6">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <svg
                    className="w-8 h-8 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2H7a2 2 0 00-2 2v2M7 7h10"
                    />
                  </svg>
                </div>
                <p className="text-center font-medium text-xl text-gray-400">
                  {t.projectUndfined}
                </p>
              </div>
            ) : (
              <div className="space-y-3 p-4">
                {developers.map((d) => (
                  <div
                    key={d.id}
                    className="bg-gray-50 rounded-lg p-3 border border-gray-200 hover:shadow-md transition-shadow duration-200 cursor-pointer flex justify-between items-start"
                  >
                    <div>
                      <h3 className="font-semibold text-lg">{d.name}</h3>

                      {d.description && <p>{d.description}</p>}
                    </div>

                    <div className="flex items-center space-x-2 text-sm">
                      <button
                        className="ml-2 p-2 bg-white/90 text-gray-700 rounded-full shadow transition-all duration-200 hover:bg-primary hover:text-white"
                        title="Edit Developer"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        className="ml-1 p-2 bg-white/90 hover:bg-red-600 text-gray-700 hover:text-white rounded-full shadow transition-all duration-200"
                        title="Delete Developer"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <AddDeveloperDialog
        client_id={clientId}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onAdd={handleAdd}
      />
    </>
  );
}
