"use client";

import { useRouter } from "next/navigation";
import { deleteUnit } from "@/components/services/serviceFetching";
import AddUnitButton from "./add-unit-button";
import toast from "react-hot-toast";

export default function UnitPageHeader({ unit, compounds, developers }) {
  const router = useRouter();

  const handleBackToUnits = () => {
    router.push(`/units`);
  };

  const handleDeleteUnit = async () => {
    toast(
      <div className="flex flex-col gap-4 text-black rounded-md">
        <p>Are you sure you want to delete this unit?</p>
        <div className="flex gap-2">
          <button
            className="bg-red-500 cursor-pointer text-white px-4 py-2 rounded-md"
            onClick={() => {
              deleteUnit(unit.unitId);
              toast.dismiss();
              router.push(`/units`);
            }}
          >
            Delete
          </button>
          <button
            className="bg-gray-500 cursor-pointer text-white px-4 py-2 rounded-md"
            onClick={() => {
              toast.dismiss();
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 border-b flex justify-between items-center">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">
          {unit?.unitTitle || ""}
        </h1>
        <div className="flex flex-wrap gap-2 mt-2">
          <p className="text-gray-600">
            {unit.buildingType}
            {unit.buildingType ? " in " : ""}
            {unit.compound}
          </p>
        </div>
      </div>
      <div className="flex gap-4">
        {/* Back button that preserves pagination */}
        <button
          onClick={handleBackToUnits}
          className="cursor-pointer bg-gray-500 text-white px-4 py-2 rounded-md flex items-center"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-1"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
              clipRule="evenodd"
            />
          </svg>
          Back to Units
        </button>

        <AddUnitButton
          isEdit={true}
          unitData={unit}
          compounds={compounds}
          developers={developers}
        />

        <button
          onClick={handleDeleteUnit}
          className="cursor-pointer bg-red-500 text-white px-4 py-2 rounded-md"
        >
          Delete Unit
        </button>
      </div>
    </div>
  );
}
