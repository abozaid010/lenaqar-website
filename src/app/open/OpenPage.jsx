'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useDeepLink } from '@/hooks/useDeepLink';
import { useGoogleAnalytics } from '@/hooks/useGoogleAnalytics';
import { ANALYTICS } from '@/constants/analytics';

export default function OpenPage() {
  const params = useSearchParams();
  const type = params.get('type');
  const id = params.get('id');
  
  useDeepLink(type, id);
  const { trackEvent } = useGoogleAnalytics();

  useEffect(() => {
    // Track deep link attempt
    trackEvent(ANALYTICS.EVENTS.DEEP_LINK_ATTEMPT, {
      type: type || 'missing',
      id: id || 'missing'
    });
  }, [type, id, trackEvent]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="text-center max-w-md">
        <p className="text-lg text-gray-900 mb-4">Opening LenaAI...</p>
        <p className="text-gray-600">
          If nothing happens,{' '}
          <a 
            href="/download" 
            className="text-blue-600 hover:text-blue-800 underline"
          >
            download the app here
          </a>.
        </p>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mt-6"></div>
      </div>
    </div>
  );
}
