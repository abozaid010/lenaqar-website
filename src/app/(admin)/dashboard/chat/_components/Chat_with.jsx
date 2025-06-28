"use client";

import { useI18n } from "@/context/translate-api";

const ChatWith = ({ name }) => {
  const { t } = useI18n();

  return (
    <div className="flex items-center justify-start gap-3">
      <h1 className="text-lg text-priamry/90">
        <span className="text-primary font-bold">
          {name || t.clientsTable.newLead}
        </span>
      </h1>
    </div>
  );
};

export default ChatWith;
