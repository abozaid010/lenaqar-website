"use client"
import React from "react";
import { useI18n } from "@/context/translate-api"; // Adjust path as needed

const IdentifierUnit = () => {
  const { t } = useI18n();

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800">
        {t.identifierUnit.title}
      </h1>
      <p className="text-gray-600 mt-1">
        {t.identifierUnit.subtitle}
      </p>
    </div>
  );
};

export default IdentifierUnit;