"use client";

import LoadingSpinner from "@/components/ui/loading-spinner";
import { getProfileDataByEmail, updateProfileData } from "@/utils/api";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function ClientInfo({ client_email }) {
  const { data, isLoading } = useQuery({
    queryKey: ["clientData" + client_email],
    queryFn: () => getProfileDataByEmail(client_email),
    staleTime: 1000 * 60 * 10, // 10 minutes
    refetchOnWindowFocus: false,
  });

  const router = useRouter();
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [formData, setFormData] = useState({
    phone_number: data?.data?.phone_number,
    email: data?.data?.email,
    price_percentage: data?.data?.price_percentage || 0,
  });
  const [isChanged, setIsChanged] = useState(false);

  useEffect(() => {
    setFormData({
      phone_number: data?.data?.phone_number,
      email: data?.data?.email,
      price_percentage: data?.data?.price_percentage || 0,
    });
  }, [isLoading]);

  function handleChange(e) {
    const { name, value } = e.target;

    if (name === "price_percentage" && parseFloat(value) > 100) {
      toast.error("Percentage cannot exceed 100%");
      return;
    }

    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      setIsChanged(JSON.stringify(updated) !== JSON.stringify(data.data));
      return updated;
    });
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoadingSubmit(true);
      await updateProfileData(formData);
      toast.success("Profile updated successfully");
      setTimeout(() => {
        router.refresh();
      }, 500);
    } catch (error) {
    } finally {
      setLoadingSubmit(false);
    }
  };

  return (
    <>
      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <form
          onSubmit={handleSubmit}
          className="client-info-form flex flex-col gap-4 max-w-md mx-auto p-6 bg-white rounded-lg shadow mt-6"
        >
          <label className="flex flex-col text-gray-600 mb-1">
            Email:
            <div className="relative">
              <input
                type="email"
                name="email"
                value={formData.email || ""}
                onChange={handleChange}
                disabled={true}
                className="mt-2 p-2 pr-8 border border-gray-300 rounded bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-200 w-full"
              />
            </div>
          </label>
          <label className="flex flex-col text-gray-600 mb-1">
            Phone Number:
            <div className="relative">
              <input
                type="text"
                name="phone_number"
                value={formData.phone_number || ""}
                onChange={handleChange}
                className="mt-2 p-2 pr-8 border border-gray-300 rounded bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400 w-full"
              />
            </div>
          </label>
          <label className="flex flex-col text-gray-600 mb-1">
            Client Name:
            <div className="relative">
              <input
                type="text"
                disabled={true}
                readOnly={true}
                value={data.data?.client_name}
                className="mt-2 p-2 pr-8 border border-gray-300 rounded bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-200 w-full"
              />
            </div>
          </label>

          <label className="flex flex-col font-medium text-gray-700 mb-2">
            Price Percentage:
            <div className="relative mt-1">
              <input
                type="number"
                name="price_percentage"
                step="0.01"
                min="0"
                max="100"
                value={formData.price_percentage || ""}
                onChange={handleChange}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 pl-3 pr-8 py-2.5 text-gray-900"
                placeholder="0.00"
              />
              <div className="absolute inset-y-0 rtl:left-4 ltr:right-4 flex items-center pointer-events-none pr-3">
                <span className="text-gray-500 font-medium">%</span>
              </div>
            </div>
          </label>

          {isChanged && (
            <button
              disabled={loadingSubmit}
              className="mt-2 py-2 px-4 bg-primary text-white rounded hover:opacity-90 transition disabled:opacity-80 disabled:!cursor-auto"
            >
              {loadingSubmit ? (
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
      )}
    </>
  );
}
