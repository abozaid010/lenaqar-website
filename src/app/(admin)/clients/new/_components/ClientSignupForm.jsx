"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { Loader2 } from "lucide-react";
import FormInput from "@/components/ui/inputs/form-input";
import FormSelect from "@/components/ui/inputs/form-select";
import ModuleActionsSelector, { DEFAULT_BROKER_MODULE_ACTIONS, DEFAULT_DEVELOPER_MODULE_ACTIONS } from "./ModuleActionsSelector";
import DynamicSuggestionsList from "./DynamicSuggestionsList";
import { useI18n } from "@/hooks/useI18n";
import ClientLogoUploader from "@/components/ui/inputs/client-logo-uploader";
import { PhoneField } from "@/components/phone/PhoneField";
import { getPhoneValidationError } from "@/components/phone/phone-utils";
import { uploadImages, updateAdminClient } from "@/utils/api";
import { processImage } from "@/utils/processImage";

const CLIENT_TYPES = [
  { value: "broker", label: "Broker" },
  { value: "developer", label: "Developer" },
];

const SHARING_POLICIES = [
  { value: "only_my_units", label: "Only My Units" },
  { value: "pull_from_other_clients", label: "Pull From Other Clients" },
];

const DEVELOPER_SHARING_POLICIES = [
  { value: "only_my_developers", label: "Only My Developers" },
  { value: "pull_from_other_clients", label: "Pull From Other Clients" },
];

const PROJECTS_SHARING_POLICIES = [
  { value: "only_my_projects", label: "Only My Projects" },
  { value: "pull_from_other_clients", label: "Pull From Other Clients" },
];

const ACCURATE_QUERIES_LEVELS = [
  { value: 0, label: "0 - Very Accurate" },
  { value: 1, label: "1 - Accurate" },
  { value: 2, label: "2 - Somewhat Accurate" },
  { value: 3, label: "3 - Not Accurate" },
  { value: 4, label: "4 - Least Accurate" },
];

function extractCreatedClientId(apiPayload) {
  if (!apiPayload || typeof apiPayload !== "object") return null;
  const d = apiPayload.data;
  if (!d || typeof d !== "object") return null;
  if (d.client_id) return d.client_id;
  if (d.data && typeof d.data === "object" && d.data.client_id) return d.data.client_id;
  return null;
}

const ClientSignupForm = () => {
  const { t } = useI18n();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [deferredLogoFile, setDeferredLogoFile] = useState(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [formData, setFormData] = useState({
    // Basic Information
    client_id: "",
    client_name: "",
    email: "",
    password: "",
    full_name: "",
    phone_number: "",
    price_percentage: "",
    address: "",
    google_map_link: "",
    crm_link: "",
    
    // Settings
    client_type: "developer",
    is_active: true,
    accurate_queries_level: 0,
    sharing_policy: "only_my_units",
    developer_sharing_policy: "only_my_developers",
    projects_sharing_policy: "only_my_projects",
    
    // Chatbot
    chatbot_welcome_message: "",
    chatbot_initial_suggestions: [],
    
    // Module Actions - default to developer permissions since client_type default is "developer"
    module_actions: { ...DEFAULT_DEVELOPER_MODULE_ACTIONS },
  });

  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    // Required fields validation
    if (!formData.client_id.trim()) {
      newErrors.client_id = "Client ID is required";
    }
    if (!formData.client_name.trim()) {
      newErrors.client_name = "Client name is required";
    }
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }
    if (!formData.password.trim()) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }
    if (!formData.full_name.trim()) {
      newErrors.full_name = "Full name is required";
    }
    const phoneErr = getPhoneValidationError(formData.phone_number, {
      defaultCountry: "EG",
      required: true,
    });
    if (phoneErr) {
      newErrors.phone_number = phoneErr;
    }
    if (formData.price_percentage === "" || isNaN(formData.price_percentage)) {
      newErrors.price_percentage = "Price percentage is required and must be a number";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData(prev => {
      const newData = {
        ...prev,
        [name]: type === "checkbox" ? checked :
                type === "number" ? (value === "" ? "" : parseFloat(value)) :
                value
      };

      // Set default module actions when client_type changes
      if (name === "client_type") {
        if (value === "broker") {
          newData.module_actions = { ...DEFAULT_BROKER_MODULE_ACTIONS };
        } else if (value === "developer") {
          newData.module_actions = { ...DEFAULT_DEVELOPER_MODULE_ACTIONS };
        }
      }

      return newData;
    });

    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error("Please fix the errors in the form");
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch("/api/client/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        const createdId = extractCreatedClientId(data);
        if (deferredLogoFile && createdId) {
          try {
            setLogoUploading(true);
            const compressedFile = await processImage(deferredLogoFile, { maxSizeMB: 5, maxWidthOrHeight: 1920 });
            const formDataToUpload = new FormData();
            formDataToUpload.append("file", compressedFile);
            const up = await uploadImages(formDataToUpload, createdId);
            if (up?.url) {
              await updateAdminClient(createdId, { logo_url: up.url });
            } else {
              toast.error(
                t?.common?.imageUploadFailed ||
                  "Failed to upload image. Please try again."
              );
            }
          } catch (logoErr) {
            console.error("Logo upload after signup failed:", logoErr);
            toast.error("Client created but logo upload failed.");
          } finally {
            setLogoUploading(false);
          }
        }
        toast.success(t?.common?.clientCreated);
        router.push("/dashboard");
      } else {
        toast.error(data.error || t?.common?.failedToCreateClient);
      }
    } catch (error) {
      console.error("Error creating client:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information Section */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput
            label="Client ID"
            name="client_id"
            value={formData.client_id}
            onChange={handleInputChange}
            required
            error={!!errors.client_id}
            errorMessage={errors.client_id}
            placeholder="Enter unique client ID"
          />
          
          <FormInput
            label="Client Name"
            name="client_name"
            value={formData.client_name}
            onChange={handleInputChange}
            required
            error={!!errors.client_name}
            errorMessage={errors.client_name}
            placeholder="Enter client/company name"
          />
          
          <FormInput
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleInputChange}
            required
            error={!!errors.email}
            errorMessage={errors.email}
            placeholder="user@example.com"
          />
          
          <FormInput
            label="Password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleInputChange}
            required
            error={!!errors.password}
            errorMessage={errors.password}
            placeholder="Minimum 6 characters"
          />
          
          <FormInput
            label="Full Name"
            name="full_name"
            value={formData.full_name}
            onChange={handleInputChange}
            required
            error={!!errors.full_name}
            errorMessage={errors.full_name}
            placeholder="Enter full name"
          />
          
          <PhoneField
            className="w-full"
            name="phone_number"
            label="Phone Number"
            required
            defaultCountry="EG"
            value={formData.phone_number ?? ""}
            onChange={(next) => {
              setFormData((prev) => ({ ...prev, phone_number: next ?? "" }));
              if (errors.phone_number) {
                setErrors((prev) => ({ ...prev, phone_number: "" }));
              }
            }}
            error={errors.phone_number || undefined}
          />
          
          <FormInput
            label="Price Percentage"
            name="price_percentage"
            type="number"
            step="0.01"
            value={formData.price_percentage}
            onChange={handleInputChange}
            required
            error={!!errors.price_percentage}
            errorMessage={errors.price_percentage}
            placeholder="0.00"
            adornment="%"
          />
        </div>
        
        <div className="mt-4">
          <FormInput
            label="Address"
            name="address"
            value={formData.address}
            onChange={handleInputChange}
            placeholder="Enter physical address"
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <FormInput
            label="Google Map Link"
            name="google_map_link"
            value={formData.google_map_link}
            onChange={handleInputChange}
            placeholder="https://maps.google.com/..."
          />
          
          <FormInput
            label="CRM Link"
            name="crm_link"
            value={formData.crm_link}
            onChange={handleInputChange}
            placeholder="https://crm.example.com/..."
          />
        </div>

        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">Client Logo</label>
          <ClientLogoUploader
            deferred
            onDeferredFile={setDeferredLogoFile}
            isUploading={logoUploading}
            setIsUploading={setLogoUploading}
          />
        </div>
      </div>

      {/* Settings Section */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Settings & Configuration</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormSelect
            label="Client Type"
            name="client_type"
            value={formData.client_type}
            onChange={handleInputChange}
          >
            {CLIENT_TYPES.map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </FormSelect>
          
          <FormSelect
            label="Accurate Queries Level"
            name="accurate_queries_level"
            value={formData.accurate_queries_level}
            onChange={handleInputChange}
          >
            {ACCURATE_QUERIES_LEVELS.map(level => (
              <option key={level.value} value={level.value}>
                {level.label}
              </option>
            ))}
          </FormSelect>
          
          <FormSelect
            label="Sharing Policy"
            name="sharing_policy"
            value={formData.sharing_policy}
            onChange={handleInputChange}
          >
            {SHARING_POLICIES.map(policy => (
              <option key={policy.value} value={policy.value}>
                {policy.label}
              </option>
            ))}
          </FormSelect>
          
          <FormSelect
            label="Developer Sharing Policy"
            name="developer_sharing_policy"
            value={formData.developer_sharing_policy}
            onChange={handleInputChange}
          >
            {DEVELOPER_SHARING_POLICIES.map(policy => (
              <option key={policy.value} value={policy.value}>
                {policy.label}
              </option>
            ))}
          </FormSelect>
          
          <FormSelect
            label="Projects Sharing Policy"
            name="projects_sharing_policy"
            value={formData.projects_sharing_policy}
            onChange={handleInputChange}
          >
            {PROJECTS_SHARING_POLICIES.map(policy => (
              <option key={policy.value} value={policy.value}>
                {policy.label}
              </option>
            ))}
          </FormSelect>
        </div>
        
        <div className="mt-4">
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              name="is_active"
              checked={formData.is_active}
              onChange={handleInputChange}
              className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
            />
            <span className="text-sm font-medium text-gray-700">Active Client</span>
          </label>
        </div>
      </div>

      {/* Chatbot Settings */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Chatbot Settings</h2>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Welcome Message
          </label>
          <textarea
            name="chatbot_welcome_message"
            value={formData.chatbot_welcome_message}
            onChange={handleInputChange}
            rows={3}
            className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter welcome message for the chatbot..."
          />
        </div>
        
        <DynamicSuggestionsList
          suggestions={formData.chatbot_initial_suggestions}
          onChange={(suggestions) => 
            setFormData(prev => ({ ...prev, chatbot_initial_suggestions: suggestions }))
          }
        />
      </div>

      {/* Module Actions */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Module Permissions</h2>
        <ModuleActionsSelector
          moduleActions={formData.module_actions}
          onChange={(moduleActions) => 
            setFormData(prev => ({ ...prev, module_actions: moduleActions }))
          }
        />
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading || logoUploading}
          className="px-6 py-2 bg-primary text-white rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          {isLoading || logoUploading ? (
            <>
              <Loader2 className="animate-spin" size={16} />
              <span>Creating...</span>
            </>
          ) : (
            <span>Create Client</span>
          )}
        </button>
      </div>
    </form>
  );
};

export default ClientSignupForm;
