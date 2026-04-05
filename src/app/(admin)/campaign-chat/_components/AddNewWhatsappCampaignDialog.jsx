"use client";

import { useState } from "react";
import Dialog from "@/components/ui/Dialog";
import LenaTextarea from "@/components/ui/inputs/lena-textarea";
import LenaTextField from "@/components/ui/inputs/lena-text-field";
import { API_BASE_URL } from "@/lib/apiConfig";
import { Plus, Send } from "lucide-react";

const AddNewWhatsappCampaignDialog = ({ isOpen, onClose }) => {
  const [contacts, setContacts] = useState('[\n  {\n    "phone": "Nada",\n    "name": "+20 102 0914828"\n  }\n]');
  const [languageCode, setLanguageCode] = useState("ar_EG");
  const [templateName, setTemplateName] = useState("download_app_message1");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const validateForm = () => {
    if (!contacts.trim()) {
      setError("Contacts field is required");
      return false;
    }
    
    try {
      JSON.parse(contacts);
    } catch (e) {
      setError("Contacts must be valid JSON array");
      return false;
    }
    
    if (!languageCode.trim()) {
      setError("Language code is required");
      return false;
    }
    
    if (!templateName.trim()) {
      setError("Template name is required");
      return false;
    }
    
    setError("");
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    setError("");
    
    try {
      const payload = {
        client_id: "public",
        contacts: JSON.parse(contacts),
        template_name: templateName,
        language_code: languageCode
      };

      const response = await fetch(`${API_BASE_URL}/webhook/bulk/whatsapp/send`, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log("Campaign sent successfully:", result);
      
      // Reset form
      setContacts('[\n  {\n    "phone": "Nada",\n    "name": "+20 102 0914828"\n  }\n]');
      setLanguageCode("ar_EG");
      setTemplateName("download_app_message1");
      
      // Close dialog
      onClose();
      
      // You could show a success toast here
      alert("Campaign sent successfully!");
      
    } catch (err) {
      console.error("Error sending campaign:", err);
      setError(err.message || "Failed to send campaign. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleContactsChange = (e) => {
    setContacts(e.target.value);
    if (error && error.includes("Contacts")) {
      setError("");
    }
  };

  const handleLanguageCodeChange = (e) => {
    setLanguageCode(e.target.value);
    if (error && error.includes("Language")) {
      setError("");
    }
  };

  const handleTemplateNameChange = (e) => {
    setTemplateName(e.target.value);
    if (error && error.includes("Template")) {
      setError("");
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Add New WhatsApp Campaign"
      showCloseButton={!isSubmitting}
      closeOnOutsideClick={!isSubmitting}
      closeOnEscape={!isSubmitting}
    >
      <form onSubmit={handleSubmit} className="h-full flex flex-col">
        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Contacts Field - 80% of parent view */}
        <div className="mb-6 flex-1">
          <LenaTextarea
            label="Contacts (JSON Array)"
            name="contacts"
            value={contacts}
            onChange={handleContactsChange}
            required
            error={error && error.includes("Contacts")}
            errorMessage={error && error.includes("Contacts") ? error : ""}
            helperText="Enter contacts as JSON array with phone and name fields"
            rows={12}
            className="font-mono text-sm"
            dir="ltr"
            disabled={isSubmitting}
          />
        </div>

        {/* Language Code and Template Name */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <LenaTextField
              label="Language Code"
              name="language_code"
              value={languageCode}
              onChange={handleLanguageCodeChange}
              required
              error={error && error.includes("Language")}
              errorMessage={error && error.includes("Language") ? error : ""}
              placeholder="e.g., ar_EG"
              disabled={isSubmitting}
            />
          </div>
          
          <div>
            <LenaTextField
              label="Template Name"
              name="template_name"
              value={templateName}
              onChange={handleTemplateNameChange}
              required
              error={error && error.includes("Template")}
              errorMessage={error && error.includes("Template") ? error : ""}
              placeholder="e.g., download_app_message1"
              disabled={isSubmitting}
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send size={16} />
                Send Campaign
              </>
            )}
          </button>
        </div>
      </form>
    </Dialog>
  );
};

export default AddNewWhatsappCampaignDialog;
