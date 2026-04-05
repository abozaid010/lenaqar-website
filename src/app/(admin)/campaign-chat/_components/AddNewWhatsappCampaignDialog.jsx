"use client";

import { useState } from "react";
import Dialog from "@/components/ui/Dialog";
import LenaTextarea from "@/components/ui/inputs/lena-textarea";
import LenaTextField from "@/components/ui/inputs/lena-text-field";
import { API_BASE_URL } from "@/lib/apiConfig";
import { Send } from "lucide-react";

const AddNewWhatsappCampaignDialog = ({ isOpen, onClose }) => {
  const [contacts, setContacts] = useState('[\n  {\n    "phone": "+20 102 0914828",\n    "name": "Nada"\n  }\n]');
  const [languageCode, setLanguageCode] = useState("ar_EG");
  const [templateName, setTemplateName] = useState("download_app_message1");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const validatePhoneNumber = (phone) => {
    // Basic phone number validation - should start with + and contain 8-15 digits
    return phone.trim().length > 0;
  };

  const validateLanguageCode = (code) => {
    // Language code format: ll_CC (e.g., ar_EG, en_US)
    const langRegex = /^[a-z]{2}_[A-Z]{2}$/;
    return langRegex.test(code.trim());
  };

  const validateContacts = (contactsStr) => {
    if (!contactsStr.trim()) {
      setError("Contacts field is required");
      return false;
    }
    
    try {
      const parsedContacts = JSON.parse(contactsStr);
      
      // Check if it's an array
      if (!Array.isArray(parsedContacts)) {
        setError("Contacts must be a JSON array");
        return false;
      }
      
      // Check if array is not empty
      if (parsedContacts.length === 0) {
        setError("Contacts array cannot be empty");
        return false;
      }
      
      // Validate each contact object
      for (let i = 0; i < parsedContacts.length; i++) {
        const contact = parsedContacts[i];
        
        // Check if contact is an object
        if (typeof contact !== 'object' || contact === null) {
          setError(`Contact at index ${i} must be an object`);
          return false;
        }
        
        // Check required fields
        if (!contact.phone || !contact.name) {
          setError(`Contact at index ${i} must have both 'phone' and 'name' fields`);
          return false;
        }
        
        // Validate phone number format
        if (!validatePhoneNumber(contact.phone)) {
          setError(`Invalid phone number format for contact at index ${i}. Phone should start with + followed by 8-15 digits`);
          return false;
        }
        
        // Check name is not empty
        if (!contact.name.trim()) {
          setError(`Name cannot be empty for contact at index ${i}`);
          return false;
        }
      }
      
      return true;
    } catch (e) {
      setError("Contacts must be valid JSON array");
      return false;
    }
  };

  const validateForm = () => {
    // Clear previous messages
    setError("");
    setSuccess("");
    
    // Validate contacts
    if (!validateContacts(contacts)) {
      return false;
    }
    
    // Validate language code
    if (!languageCode.trim()) {
      setError("Language code is required");
      return false;
    }
    
    if (!validateLanguageCode(languageCode)) {
      setError("Invalid language code format. Use format: ll_CC (e.g., ar_EG, en_US)");
      return false;
    }
    
    // Validate template name
    if (!templateName.trim()) {
      setError("Template name is required");
      return false;
    }
    
    if (templateName.trim().length < 2) {
      setError("Template name must be at least 2 characters long");
      return false;
    }
    
    // Template name should only contain letters, numbers, underscores, and hyphens
    const templateNameRegex = /^[a-zA-Z0-9_-]+$/;
    if (!templateNameRegex.test(templateName.trim())) {
      setError("Template name can only contain letters, numbers, underscores, and hyphens");
      return false;
    }
    
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
      setContacts('[\n  {\n    "phone": "+20 102 0914828",\n    "name": "Nada"\n  }\n]');
      setLanguageCode("ar_EG");
      setTemplateName("download_app_message1");
      
      // Show success message
      setSuccess("Campaign sent successfully!");
      
      // Close dialog after a short delay
      setTimeout(() => {
        onClose();
        setSuccess("");
      }, 1500);
      
    } catch (err) {
      setSuccess("");
      setError(err.message || "Failed to send campaign. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const clearError = (field) => {
    if (error && error.toLowerCase().includes(field.toLowerCase())) {
      setError("");
    }
    if (success) {
      setSuccess("");
    }
  };

  const handleContactsChange = (e) => {
    setContacts(e.target.value);
    clearError("contacts");
  };

  const handleLanguageCodeChange = (e) => {
    setLanguageCode(e.target.value);
    clearError("language");
  };

  const handleTemplateNameChange = (e) => {
    setTemplateName(e.target.value);
    clearError("template");
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

        {/* Success Message */}
        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
            <p className="text-sm text-green-600">{success}</p>
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
            helperText="Enter contacts as JSON array with phone and name fields. Phone should start with + followed by digits (e.g., +20 102 0914828)"
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
