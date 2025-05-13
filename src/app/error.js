'use client';

import { InfoIcon } from 'lucide-react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Error({ error }) {
    const router = useRouter();
    useEffect(() => {
        console.log(error);
    }, [error]);

    return (
        <div className="flex flex-col items-center justify-center h-screen bg-gray-100 text-center px-4">

            <InfoIcon color='red' size={80} className='mb-6' />

            <h2 className="text-2xl font-bold text-gray-800 mb-4">
                We are upgrading our service
            </h2>
            <p className="text-gray-600 mb-6">
                We’ll be back live soon. Please check back later.
            </p>

            {/* Button to Home */}
            <button
                onClick={() => router.push('/')}
                className="px-6 py-2 bg-primary text-white font-medium rounded-md hover:bg-primary-dark transition hover:opacity-90"
            >
                Go to Home
            </button>
        </div>
    );
}