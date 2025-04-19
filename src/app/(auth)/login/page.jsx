import Link from "next/link";
import LoginForm from "../_components/login-form";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-purple-100 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-primary p-6 text-center">
          <h1 className="text-3xl font-bold text-white">Lena Ai</h1>
          <p className="text-blue-100 mt-2">Sign in to your account</p>
        </div>

        <div className="p-4">
          {/* Form */}
          <LoginForm />

          <div className="mt-3">
            <Link
              href="/"
              className="block text-center py-2 px-4 rounded-lg border-2 border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-200"
            >
              Back to Home
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-2 bg-gray-50 border-t border-gray-100 text-center text-xs text-gray-500">
          &copy; 2025 Lena AI. All rights reserved, Version 0.0.001.
        </div>
      </div>
    </div>
  );
}
