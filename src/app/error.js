'use client';

import { InfoIcon } from 'lucide-react';
import { useEffect, useRef, useState, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';

const MAX_AUTO_RETRIES = 2;
const BASE_RETRY_DELAY_MS = 800;

// Persist retry attempts across error-boundary resets (same tab session).
// Keyed by pathname + stable error identifier.
const retryCountsByKey = new Map();

function getRetryCount(key) {
    return retryCountsByKey.get(key) ?? 0;
}

function setRetryCount(key, count) {
    retryCountsByKey.set(key, count);
}

function clearRetryCount(key) {
    retryCountsByKey.delete(key);
}

export default function Error({ error, reset }) {
    const router = useRouter();
    const pathname = usePathname();
    const retryTimerRef = useRef(null);
    const [showErrorUI, setShowErrorUI] = useState(false);
    const [attemptForUI, setAttemptForUI] = useState(0);

    useEffect(() => {
        // Keep logging for debugging without crashing the UI
        console.error(error?.message ?? error);
    }, [error]);

    // Stable key so auto-retries don't restart if the error boundary remounts.
    const errorId = error?.digest || error?.message || String(error);
    const retryKey = `${pathname || ''}|${errorId}`;

    useEffect(() => {
        // If Next doesn't provide reset for some reason, fall back to showing UI immediately.
        if (typeof reset !== 'function') {
            setShowErrorUI(true);
            return;
        }

        const currentAttempt = getRetryCount(retryKey);
        setAttemptForUI(currentAttempt);

        // Auto-retry before showing the full error UI (exactly MAX_AUTO_RETRIES times)
        if (currentAttempt < MAX_AUTO_RETRIES) {
            const delay = BASE_RETRY_DELAY_MS * Math.pow(2, currentAttempt); // simple backoff
            setShowErrorUI(false);

            retryTimerRef.current = setTimeout(() => {
                setRetryCount(retryKey, currentAttempt + 1);
                // Trigger a fresh render attempt
                reset();
                router.refresh();
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
    }, [retryKey, reset, router]); // Retry keyed by (pathname + errorId)

    const handleTryAgain = useCallback(() => {
        if (retryTimerRef.current) {
            clearTimeout(retryTimerRef.current);
            retryTimerRef.current = null;
        }

        clearRetryCount(retryKey);
        setAttemptForUI(0);
        setShowErrorUI(false);

        reset();
        router.refresh();
    }, [reset, router, retryKey]);

    if (!showErrorUI) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-gray-100 text-center px-4">
                <InfoIcon color="#030250" size={60} className="mb-6 animate-pulse" />
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Reconnecting…</h2>
                <p className="text-gray-600">
                    Trying again ({attemptForUI + 1}/{MAX_AUTO_RETRIES + 1})
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
                    onClick={handleTryAgain}
                    className="px-6 py-2 bg-primary text-white font-medium rounded-md hover:bg-primary-dark transition hover:opacity-90"
                >
                    Try again
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
