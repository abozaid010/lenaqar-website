'use client';

import { InfoIcon } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

const MAX_AUTO_RETRIES = 2;
const BASE_RETRY_DELAY_MS = 800;

export default function Error({ error, reset }) {
    const router = useRouter();
    const retryTimerRef = useRef(null);
    const [attempt, setAttempt] = useState(0);
    const [showErrorUI, setShowErrorUI] = useState(false);
    const [retryKey, setRetryKey] = useState(0); // Force effect re-run on manual reload

    useEffect(() => {
        console.log(error);
    }, [error]);

    // Auto-retry before showing the full error UI
    useEffect(() => {
        // If Next doesn't provide reset for some reason, fall back to showing UI immediately.
        if (typeof reset !== 'function') {
            setShowErrorUI(true);
            return;
        }

        // Clear any pending timer on error changes / unmount.
        if (retryTimerRef.current) {
            clearTimeout(retryTimerRef.current);
            retryTimerRef.current = null;
        }

        if (attempt < MAX_AUTO_RETRIES) {
            const delay = BASE_RETRY_DELAY_MS * Math.pow(2, attempt); // simple backoff
            retryTimerRef.current = setTimeout(() => {
                setAttempt((a) => a + 1);
                reset();
            }, delay);
            setShowErrorUI(false);
            return () => {
                if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
            };
        }

        setShowErrorUI(true);
        return () => {
            if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
        };
    }, [attempt, reset, error, retryKey]); // Added retryKey to dependencies

    if (!showErrorUI) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-gray-100 text-center px-4">
                <InfoIcon color="#030250" size={60} className="mb-6 animate-pulse" />
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Reconnecting…</h2>
                <p className="text-gray-600">
                    Trying again ({attempt + 1}/{MAX_AUTO_RETRIES + 1})
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center h-screen bg-gray-100 text-center px-4">

            <InfoIcon color='#030250' size={60} className='mb-6' />

            <h2 className="text-2xl font-bold text-gray-800 mb-4">
                We are upgrading our service
            </h2>
            <p className="text-gray-600 mb-6">
                We are running some maintenance on our system. Please click reload to try again.
            </p>

            <div className="flex items-center gap-3">
                <button
                    onClick={() => {
                        // Clear any pending timer immediately
                        if (retryTimerRef.current) {
                            clearTimeout(retryTimerRef.current);
                            retryTimerRef.current = null;
                        }
                        // Reset state and force effect to re-run
                        setAttempt(0);
                        setShowErrorUI(false);
                        setRetryKey((k) => k + 1); // Force effect re-run
                        if (typeof reset === 'function') reset();
                    }}
                    className="px-6 py-2 bg-primary text-white font-medium rounded-md hover:bg-primary-dark transition hover:opacity-90"
                >
                    Reload
                </button>

                {/* Button to Home */}
                <button
                    onClick={() => router.push('/')}
                    className="px-6 py-2 bg-white text-gray-800 font-medium rounded-md border border-gray-300 hover:bg-gray-50 transition"
                >
                    Go to Home
                </button>
            </div>
        </div>
    );
}