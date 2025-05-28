'use client';

import { ArrowBigLeft, ArrowBigRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useI18n } from "@/context/translate-api";

export default function NavigationButtons({id}) {
  const router = useRouter();
  const { t } = useI18n();
  const isRTL = t.direction === "rtl";
  const usersId = JSON.parse(window.localStorage.getItem("usersId"));
  const currentIndex = usersId?.indexOf(id);
  const nextId = currentIndex !== -1 && currentIndex < usersId.length - 1 ? usersId[currentIndex + 1] : null;
  const prevId = currentIndex > 0 ? usersId[currentIndex - 1] : null;

  const handleNavigation = (id) => {
    router.push(`/dashboard/chat/${id}`);
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => prevId && handleNavigation(prevId)}
        disabled={!prevId}
        className={`p-2 text-white rounded-lg text-lg font-medium transition-all duration-200 shadow-sm flex items-center justify-center w-10 h-10 ${
          prevId 
            ? 'bg-primary hover:bg-primary/90 hover:shadow-md cursor-pointer' 
            : 'bg-gray-300 cursor-not-allowed'
        }`}
        aria-label="Previous"
      >
        {isRTL ? <ArrowBigRight /> : <ArrowBigLeft />}
      </button>
      <button
        onClick={() => nextId && handleNavigation(nextId)}
        disabled={!nextId}
        className={`p-2 text-white rounded-lg text-lg font-medium transition-all duration-200 shadow-sm flex items-center justify-center w-10 h-10 ${
          nextId 
            ? 'bg-primary hover:bg-primary/90 hover:shadow-md cursor-pointer' 
            : 'bg-gray-300 cursor-not-allowed'
        }`}
        aria-label="Next"
      >
        {isRTL ? <ArrowBigLeft /> : <ArrowBigRight />}
      </button>
    </div>
  );
} 