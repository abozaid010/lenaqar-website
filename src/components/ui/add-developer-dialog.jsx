"use client";

import { addDeveloper } from "@/components/services/serviceFetching";
import Dialog from "@/components/ui/Dialog";
import { useI18n } from "@/context/translate-api";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { v4 as uuidv4 } from "uuid";

export default function AddDeveloperDialog({
  isOpen,
  onClose,
  onAdd,
  onEdit,
  client_id,
  developer,
}) {
  const isEdit = !!developer;
  const [formData, setFormData] = useState(
    developer
      ? { ...developer }
      : {
          id: uuidv4(),
          name: "",
          description: "",
          logo: "",
          client_id: client_id || "",
        }
  );

  useEffect(() => {
    if (developer) {
      setFormData({ ...developer });
    } else {
      setFormData({
        id: uuidv4(),
        name: "",
        description: "",
        logo: "",
        client_id: client_id || "",
      });
    }
  }, [developer, client_id, isOpen]);

  const { t } = useI18n();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    // Clear error for this field when user types
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: null,
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await addDeveloper(formData); // You may want to use a separate updateDeveloper API for editing
      if (res.code === 200) {
        toast.success(
          isEdit
            ? "Developer updated successfully!"
            : "Developer added successfully!"
        );
        if (isEdit) {
          onEdit && onEdit(res.data);
        } else {
          onAdd && onAdd(res.data);
        }
        onClose();
      } else {
        toast.error("Failed to save developer. Please try again.");
      }
    } catch (error) {
      setErrors({ submit: "Failed to save developer. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? "Edit Developer" : "Add New Developer"}
    >
      <div>
        <div className="space-y-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t.DeveloperName} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              required
              onChange={handleChange}
              className="block w-full rounded-md border border-gray-300 py-1 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t.formLabels?.description}
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={2}
              className="block w-full rounded-md border border-gray-300 py-1 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className={`px-4 py-1.5 w-42 bg-primary rounded-md text-sm font-medium text-white focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                isSubmitting
                  ? "pointer-events-none opacity-80"
                  : "hover:bg-primary/90"
              }`}
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 size={20} className="animate-spin" />
                  {t.saving}
                </div>
              ) : isEdit ? (
                "Save Changes"
              ) : (
                t.saveDeveloper
              )}
            </button>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
