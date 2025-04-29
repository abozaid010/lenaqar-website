"use client";

import { useRouter } from "next/navigation";
import AddUnitButton from "./add-unit-button";
import DeleteUnitBtn from "./delete-unit-btn";

export default function UnitPageHeader({ unit, compounds, developers }) {
  const router = useRouter();

  const handleBackToUnits = () => {
    router.push(`/units`);
  };

  return (
    <div className="py-6 px-4 border-b flex justify-between items-center">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">
          {unit?.unitTitle || ""}
        </h1>
        <div className="flex flex-wrap gap-2">
          <p className="text-gray-600">
            {unit.buildingType}
            {unit.buildingType ? " in " : ""}
            {unit.compound}
          </p>
        </div>
      </div>

      <div className="flex gap-2">
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

        <DeleteUnitBtn unitId={unit.unitId} />
      </div>
    </div>
  );
}
