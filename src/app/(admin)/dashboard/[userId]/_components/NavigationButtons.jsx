"use client";

import { useI18n } from "@/context/translate-api";
import { ArrowBigLeft, ArrowBigRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function NavigationButtons({ id }) {
  const router = useRouter();
  const { t } = useI18n();
  const isRTL = t.direction === "rtl";
  const [nextId, setNextId] = useState(null);
  const [prevId, setPrevId] = useState(null);

  useEffect(() => {
    const usersId = JSON.parse(localStorage.getItem("usersId") || "[]");
    const currentIndex = usersId.indexOf(id);
    setNextId(
      currentIndex !== -1 && currentIndex < usersId.length - 1
        ? usersId[currentIndex + 1]
        : null
    );
    setPrevId(currentIndex > 0 ? usersId[currentIndex - 1] : null);
  }, [id]);

  const handleNavigation = (id) => {
    router.push(`/dashboard/${id}`);
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => prevId && handleNavigation(prevId)}
        disabled={!prevId}
        className={`p-1.5 text-white rounded-lg text-lg font-medium transition-all duration-200 shadow-sm flex items-center justify-center ${
          prevId
            ? "bg-primary hover:bg-primary/90 hover:shadow-md cursor-pointer"
            : "bg-gray-300 cursor-not-allowed"
        }`}
        aria-label="Previous"
      >
        {isRTL ? <ArrowBigRight size={20} /> : <ArrowBigLeft size={20} />}
      </button>
      <button
        onClick={() => nextId && handleNavigation(nextId)}
        disabled={!nextId}
        className={`p-1.5 text-white rounded-lg text-lg font-medium transition-all duration-200 shadow-sm flex items-center justify-center ${
          nextId
            ? "bg-primary hover:bg-primary/90 hover:shadow-md cursor-pointer"
            : "bg-gray-300 cursor-not-allowed"
        }`}
        aria-label="Next"
      >
        {isRTL ? <ArrowBigLeft size={20} /> : <ArrowBigRight size={20} />}
      </button>
    </div>
  );
}
