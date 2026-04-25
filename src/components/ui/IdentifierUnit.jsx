"use client";

import { useI18n } from "@/hooks/useI18n";

const IdentifierUnit = () => {
  const { t } = useI18n();

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800">
        {t.identifierUnit.title}
      </h1>
      <p className="text-gray-600 mt-1">{t.identifierUnit.subtitle}</p>
    </div>
  );
};

export default IdentifierUnit;
