import Link from "next/link";
import { Home, Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[60vh] bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg border shadow-lg p-8 text-center">
        <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-6">
          <Search className="w-8 h-8 text-gray-400" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Property Not Found</h1>
        <p className="text-gray-600 mb-6">
          The requested property could not be found. Please check the reference code or browse available listings.
        </p>
        <div className="space-y-3">
          <Link
            href="/allProberties"
            className="w-full bg-primary text-white rounded-lg py-3 px-4 font-medium hover:opacity-90 transition-colors flex items-center justify-center gap-2"
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
      </div>
    </div>
  );
}
