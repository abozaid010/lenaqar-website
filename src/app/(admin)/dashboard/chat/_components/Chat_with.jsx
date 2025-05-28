"use client";

import { useRouter } from "next/navigation";
import { useI18n } from "@/context/translate-api";

const ChatWith = ({ name }) => {
  const router = useRouter();
  const { t } = useI18n();
  const handleBack = () => {
    router.back();
  };

  return (
    <div className="flex items-center justify-start gap-3">
      {/* <button
        onClick={handleBack}
        className="w-6 h-6 p-1 rounded-full bg-primary/90 flex items-center justify-center hover:opacity-85"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className=""
          viewBox="0 0 20 20"
          fill="white"
        >
          <path
            fillRule="evenodd"
            d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button> */}
      <h1 className="text-lg text-priamry/90">
        <span className="text-primary font-bold">{name || t.clientsTable.newLead}</span>
      </h1>
    </div>
  );
};

export default ChatWith;
