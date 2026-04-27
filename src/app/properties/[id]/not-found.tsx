import Link from 'next/link';
import { Home, ArrowLeft, Search } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg border shadow-lg p-8 text-center">
        {/* Icon */}
        <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-6">
          <Search className="w-8 h-8 text-gray-400" />
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Unit Not Found</h1>
        
        {/* Description */}
        <p className="text-gray-600 mb-6">
          The property unit you're looking for doesn't exist or has been removed. 
          Please check the URL or browse our available properties.
        </p>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Link
            href="/properties"
            className="w-full bg-blue-600 text-white rounded-lg py-3 px-4 font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          >
            <Search className="w-5 h-5" />
            Browse Properties
          </Link>
          
          <Link
            href="/"
            className="w-full border border-gray-300 text-gray-700 rounded-lg py-3 px-4 font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
          >
            <Home className="w-5 h-5" />
            Go Home
          </Link>
        </div>

        {/* Additional Help */}
        <div className="mt-6 pt-6 border-t">
          <p className="text-sm text-gray-500">
            If you believe this is an error, please contact our support team.
          </p>
        </div>
      </div>
    </div>
  );
}
