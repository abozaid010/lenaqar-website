"use client";
import { useFormik } from "formik";
import * as Yup from "yup";
import { toast } from "react-hot-toast";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  uploadImages,
  deleteImage,
  addCompound,
} from "@/components/services/serviceFetching";

// Enhanced validation schema with rules for all input
const validationSchema = Yup.object({
  name: Yup.string().required("Compound name is required"),
  description: Yup.string().min(
    10,
    "Description must be at least 10 characters"
  ),
  developer_name: Yup.string().required("Developer name is required"),
  city: Yup.string().required("City is required"),
  country: Yup.string().required("Country is required"),
  // area field removed from validation schema
  video_url: Yup.string()
    .url("Please enter a valid URL")
    .nullable()
    .transform((value) => (value === "" ? null : value))
    .required("Please enter a link"),
  // Add this validation to your Formik validation schema in useCompoundForm:
  google_map_link: Yup.string()
    .url('Must be a valid URL')
    .test(
      'is-google-maps',
      'Must be a valid Google Maps URL',
      (value) => {
        if (!value) return true; // Allow empty values
        return value.includes('google.com/maps') || 
               value.includes('goo.gl/maps') || 
               value.includes('maps.app.goo.gl');
      }
    )
    .nullable()
    .transform((value) => (value === "" ? null : value))
    .required("Please enter a link"),
  master_plan: Yup.mixed().required("Master plan image is required"),
  gated: Yup.boolean(),
});

export const useCompoundForm = (onClose, onSave) => {
  const router = useRouter();
  const [newDeveloper, setNewDeveloper] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [deletingImage, setDeletingImage] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null); // 'success', 'error', or null
  const fileInputRef = useRef(null);
  const [developersData, setDevelopersData] = useState([]);

  // Function to update developers list after adding a new one
  const updateDevelopers = (newDeveloperData) => {
    setDevelopersData(prevData => [...prevData, newDeveloperData]);
  };

  const formik = useFormik({
    initialValues: {
      name: "",
      description: "",
      developer_name: "",
      city: "",
      country: "Egypt",
      area: 100, // Added back with default value of 100
      gated: false,
      video_url: "",
      google_map_link: "",
      master_plan: null,
    },
    validationSchema,
    onSubmit: async (values, { setSubmitting, resetForm }) => {
      // Check if master plan image exists
      if (!values.master_plan) {
        toast.error(
          "Master plan image must be uploaded before saving the compound"
        );
        setSubmitting(false);
        return;
      }

      try {
        const submissionData = {
          ...values,
          master_plan: values.master_plan ? values.master_plan.url : null,
        };

        // Use addCompound function from serviceFetching
        const response = await addCompound(submissionData);
        router.refresh();

        // Call the onSave function provided by the parent component with the response data
        if (onSave) {
          onSave(response);
        }

        // Reset the form to clear all data
        resetForm();
        setSelectedFile(null);
        
        // Show success message
        toast.success("Compound added successfully");

        // Close the modal
        onClose();
      } catch (error) {
        console.error("Error submitting form:", error);
        toast.error(error.message || "Failed to add compound");
      } finally {
        setSubmitting(false);
      }
    },
  });

  const resetFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    resetFileInput();
  };

  const handleImageUpload = async () => {
    if (!selectedFile) return;

    setUploadingImage(true);
    setUploadStatus(null);
    
    try {
      const imageFormData = new FormData();
      imageFormData.append("file", selectedFile);

      // Use uploadImages function from serviceFetching
      const uploadedImages = await uploadImages(imageFormData);

      // Check if there was an error response
      if (uploadedImages.status === 500 || uploadedImages.error) {
        throw new Error(uploadedImages.message || "Server error occurred");
      }

      const uploadedImage = Array.isArray(uploadedImages)
        ? uploadedImages[0]
        : uploadedImages;
      formik.setFieldValue("master_plan", uploadedImage);
      setUploadStatus('success');
      resetFileInput();

      toast.success("Master plan uploaded successfully");
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error(error.message || "Failed to upload image");
      setUploadStatus('error');
    } finally {
      setUploadingImage(false);
    }
  };

  const removeUploadedImage = async () => {
    if (!formik.values.master_plan || !formik.values.master_plan.fileId) return;

    setDeletingImage(true);
    try {
      // Use deleteImage function from serviceFetching
      await deleteImage(formik.values.master_plan.fileId);

      // Remove from state after successful API deletion
      formik.setFieldValue("master_plan", null);
      toast.success("Image deleted successfully");
    } catch (error) {
      console.error("Error deleting image:", error);
      toast.error(error.message || "Failed to delete image");
    } finally {
      setDeletingImage(false);
    }
  };

  return {
    formik,
    newDeveloper,
    uploadingImage,
    selectedFile,
    deletingImage,
    uploadStatus,
    fileInputRef,
    handleFileSelect,
    removeSelectedFile,
    handleImageUpload,
    removeUploadedImage,
    setNewDeveloper,
    developersData,
    setDevelopersData,
    updateDevelopers,
  };
};
