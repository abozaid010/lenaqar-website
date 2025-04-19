"use client";
import React, { useState } from "react";
import { X, Loader } from "lucide-react";
import { useFormik } from "formik";
import * as Yup from "yup";
import toast from "react-hot-toast";
import { v4 as uuidv4 } from 'uuid'; // Import UUID library

const AddDeveloperModal = ({ isOpen, onClose, onSave }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize formik outside of any conditional statements
  const formik = useFormik({
    initialValues: {
      id: uuidv4(), // Generate UUID4 for id
      name: "",
      description: "",
      logo: "", // Add logo field with empty string default
    },
    validationSchema: Yup.object({
      name: Yup.string()
        .required("Developer name is required")
        .matches(/^[\u0600-\u06FFa-zA-Z\s]+$/, "Name must contain only letters (Arabic or English)"),
      description: Yup.string(),
      logo: Yup.string(), // Add validation for logo field
    }),
    onSubmit: async (values) => {
      try {
        setIsSubmitting(true);
    
        const id = uuidv4(); // Generate the UUID once
        const data = {
          ...values,
          id,
          logo: "",
        };
    
        // Set the UUID in the form values (if needed for display, etc.)
        formik.setFieldValue('id', id);
    
        // Call the onSave function passed from parent component
        await onSave(data);
    
        // Reset form after successful save
        formik.resetForm();
    
        // Close the form/modal
        onClose();
      } catch (error) {
        console.error("Error saving developer:", error);
        toast.error("Failed to add developer");
      } finally {
        setIsSubmitting(false);
      }
    }
  });    

  // Return null after initializing all hooks
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="bg-primary px-6 py-4 border-b flex justify-between items-center rounded-t-xl">
          <h2 className="text-xl font-bold text-white">Add New Developer</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-primary/80 transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        <form onSubmit={formik.handleSubmit} className="p-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Developer Name
            </label>
            <input
              type="text"
              name="name"
              value={formik.values.name}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className={`w-full px-4 py-2 rounded-lg border ${
                formik.touched.name && formik.errors.name
                  ? "border-red-500 focus:ring-red-500"
                  : "border-gray-300 focus:ring-primary"
              } focus:border-transparent`}
            />
            {formik.touched.name && formik.errors.name && (
              <p className="mt-1 text-sm text-red-500">{formik.errors.name}</p>
            )}
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description (Optional)
            </label>
            <textarea
              name="description"
              value={formik.values.description}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              rows="3"
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent"
            ></textarea>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-800 font-medium rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-70 flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  <span>Saving</span>
                </>
              ) : (
                "Save Developer"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddDeveloperModal;