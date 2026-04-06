'use client';

import { useEffect } from 'react';
import Head from 'next/head';
import { useSearchParams } from 'next/navigation';
import { useDeepLink } from '@/hooks/useDeepLink';
import { useGoogleAnalytics } from '@/hooks/useGoogleAnalytics';
import { ANALYTICS } from '@/constants/analytics';

export default function DeeplinkPage() {
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
    <>
      <Head>
        <meta charSet="UTF-8" />
        <title>Opening LenaAI...</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-semibold text-gray-900 mb-4">
            Opening LenaAI app...
          </h1>
          <p className="text-gray-600 mb-6">
            If nothing happens,{' '}
            <a 
              href="/download" 
              className="text-blue-600 hover:text-blue-800 underline"
            >
              download the app here
            </a>.
          </p>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      </div>
    </>
  );
}
