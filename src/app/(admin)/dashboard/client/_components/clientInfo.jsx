"use client";

import { Loader2, Tornado } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { updateProfileData } from "@/components/services/serviceFetching";
import toast from "react-hot-toast";

export default function ClientInfo({ data }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    phone_number: data.phone_number,
    email: data.email,
  });
  const [isChanged, setIsChanged] = useState(false);

  useEffect(() => {
    setIsChanged(false);
  }, [data]);

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      setIsChanged(JSON.stringify(updated) !== JSON.stringify(data));
      return updated;
    });
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setIsLoading(true);
      await updateProfileData(formData);
      toast.success("Profile updated successfully");
      setTimeout(() => {
        router.refresh();
      }, 500);
    } catch (error) {
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="client-info-form flex flex-col gap-4 max-w-md mx-auto p-6 bg-white rounded-lg shadow mt-6"
    >
      <label className="flex flex-col text-gray-600 mb-1">
        Email:
        <input
          type="email"
          name="email"
          value={formData.email || ""}
          onChange={handleChange}
          className="mt-2 p-2 border border-gray-300 rounded bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-200"
        />
      </label>
      <label className="flex flex-col text-gray-600 mb-1">
        Phone Number:
        <input
          type="text"
          name="phone_number"
          value={formData.phone_number || ""}
          onChange={handleChange}
          className="mt-2 p-2 border border-gray-300 rounded bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </label>
      <label className="flex flex-col text-gray-600 mb-1">
        Client Name:
        <input
          type="text"
          disabled={true}
          readOnly={true}
          value={data.client_name}
          className="mt-2 p-2 border border-gray-300 rounded bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-200"
        />
      </label>

      {isChanged && (
        <button
          disabled={isLoading}
          className="mt-2 py-2 px-4 bg-primary text-white rounded hover:opacity-90 transition disabled:opacity-80 disabled:!cursor-auto"
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <Loader2 className="animate-spin" />
              <span className="ml-2">Saving...</span>
            </div>
          ) : (
            "Save Changes"
          )}
        </button>
      )}
    </form>
  );
}
