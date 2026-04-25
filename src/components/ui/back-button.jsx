'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useI18n } from '@/hooks/useI18n';

export default function BackButton({ 
  className = "", 
  fallbackRoute = "/myProjects",
  onClick 
} = {}) {
  const router = useRouter();
  const { translate } = useI18n();

  const handleBack = () => {
    if (onClick) {
      onClick();
      return;
    }

    // Smart navigation: go back to projects list or use browser history
    if (typeof window !== 'undefined' && window.history.length > 2) {
      router.back();
    } else {
      router.push(fallbackRoute);
    }
  };

  return (
    <button
      onClick={handleBack}
      className={`group flex items-center gap-2 px-4 py-2 h-10 bg-white border border-gray-200 rounded-lg hover:border-primary/40 hover:bg-gray-50 transition-all duration-200 shadow-sm hover:shadow-md ${className}`}
    >
      <ArrowLeft 
        size={18} 
        className="text-gray-600 group-hover:text-primary transition-colors duration-200 shrink-0" 
      />
      <span className="text-sm font-semibold text-gray-900">{translate('common.back')}</span>
    </button>
  );
}
