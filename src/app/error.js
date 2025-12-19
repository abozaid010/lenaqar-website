'use client';

import { InfoIcon } from 'lucide-react';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

const MAX_AUTO_RETRIES = 2;
const BASE_RETRY_DELAY_MS = 800;

export default function Error({ error, reset }) {
    const router = useRouter();
    const retryTimerRef = useRef(null);
    const attemptRef = useRef(0); // Use ref to persist across error boundary resets
    const resetRef = useRef(reset); // Store reset in ref to avoid dependency issues
    const [displayAttempt, setDisplayAttempt] = useState(0); // For UI display only
    const [showErrorUI, setShowErrorUI] = useState(false);
    const [retryKey, setRetryKey] = useState(0); // Force effect re-run on manual reload

    // Keep resetRef updated
    useEffect(() => {
        resetRef.current = reset;
    }, [reset]);

    useEffect(() => {
        console.log(error);
    }, [error]);

    // Create a stable error identifier to avoid re-running on same error
    const errorId = error?.message || error?.digest || String(error);

    // Auto-retry before showing the full error UI
    useEffect(() => {
        // If Next doesn't provide reset for some reason, fall back to showing UI immediately.
        if (typeof resetRef.current !== 'function') {
            setShowErrorUI(true);
            return;
        }

        // Clear any pending timer on unmount or retryKey change
        if (retryTimerRef.current) {
            clearTimeout(retryTimerRef.current);
            retryTimerRef.current = null;
        }

        const currentAttempt = attemptRef.current;

        if (currentAttempt < MAX_AUTO_RETRIES) {
            const delay = BASE_RETRY_DELAY_MS * Math.pow(2, currentAttempt); // simple backoff
            setDisplayAttempt(currentAttempt);
            setShowErrorUI(false);

            retryTimerRef.current = setTimeout(() => {
                // Increment the ref BEFORE calling reset
                attemptRef.current += 1;
                setDisplayAttempt(attemptRef.current);
                
                // Use setTimeout to ensure state updates are flushed before reset
                setTimeout(() => {
                    resetRef.current?.();
                }, 0);
            }, delay);

            return () => {
                if (retryTimerRef.current) {
                    clearTimeout(retryTimerRef.current);
                    retryTimerRef.current = null;
                }
            };
        }

        setShowErrorUI(true);
        return () => {
            if (retryTimerRef.current) {
                clearTimeout(retryTimerRef.current);
                retryTimerRef.current = null;
            }
        };
    }, [errorId, retryKey]); // Only depend on stable errorId and retryKey

    // Reset attempt counter when manually reloading
    const handleManualReload = useCallback(() => {
        // Clear any pending timer immediately
        if (retryTimerRef.current) {
            clearTimeout(retryTimerRef.current);
            retryTimerRef.current = null;
        }
        // Reset counters
        attemptRef.current = 0;
        setDisplayAttempt(0);
        setShowErrorUI(false);
        setRetryKey((k) => k + 1); // Force effect re-run
        
        // Call reset after state updates
        setTimeout(() => {
            resetRef.current?.();
        }, 0);
    }, []);

    if (!showErrorUI) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-gray-100 text-center px-4">
                <InfoIcon color="#030250" size={60} className="mb-6 animate-pulse" />
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Reconnecting…</h2>
                <p className="text-gray-600">
                    Trying again ({displayAttempt + 1}/{MAX_AUTO_RETRIES + 1})
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
                    onClick={handleManualReload}
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
