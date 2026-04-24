import { redirect } from "next/navigation";
import { isCurrentUserKingAdmin } from "@/lib/kingAdmin";
import ClientSignupForm from "./_components/ClientSignupForm";

export default function ClientSignupPage() {
  // Check if current user is king admin
  if (!isCurrentUserKingAdmin()) {
    redirect("/dashboard");
  }

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Create New Client
          </h1>
          <p className="text-gray-600">
            Fill in the form below to create a new client account.
          </p>
        </div>
        
        <ClientSignupForm />
      </div>
    </div>
  );
}
