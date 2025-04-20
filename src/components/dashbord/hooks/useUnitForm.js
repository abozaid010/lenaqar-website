"use client";
import { useState, useRef, useEffect } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import toast from "react-hot-toast";

import { v4 as uuidv4 } from "uuid";
import { useRouter } from "next/navigation";
import {
  addUnit,
  deleteImage,
  uploadImages,
  addDeveloper,
  addUnitRent, // Add this import if it exists in serviceFetching
} from "@/components/services/serviceFetching";
import Cookies from "js-cookie";
// import { uploadImages, deleteImage, addUnit } from '@/components/services/serviceFetching';
import propertyEnums from "../data/propertyEnums.json";

export const useUnitForm = (onClose, onSave) => {
  const router = useRouter();

  // Get client_id from cookies
  const clientId = Cookies.get("client_id");

  // Define validation schema using Yup
  const validationSchema = Yup.object({
    unitTitle: Yup.string().required("Unit title is required"),
    compound: Yup.string().required("Compound is required"),
    buildingType: Yup.string().required("Building type is required"),
    purpose: Yup.string().required("Purpose is required"),
    country: Yup.string().required("Country is required"),
    city: Yup.string().required("City is required"),
    district: Yup.string(), // Optional
    view: Yup.string().required("View is required"),
    roomsCount: Yup.number()
      .positive("Rooms count must be greater than zero")
      .required("Rooms count is required"),
    bathroomCount: Yup.number()
      .positive("Bathroom count must be greater than zero")
      .required("Bathroom count is required"),
    floor: Yup.number().required("Floor is required"),
    landArea: Yup.number()
      .positive("Land area must be greater than zero")
      .required("Land area is required"),
    gardenSize: Yup.number().required("Garden size is required"),
    garageArea: Yup.number().required("Garage area is required"),
    finishing: Yup.string().required("Finishing type is required"),
    developer: Yup.string().required("Developer is required"),
    dataSource: Yup.string().required("Data source is required"),
    
    // Fix conditional validation for Buy/Sell properties
    totalPrice: Yup.number().when('purpose', {
      is: (val) => val === "Sell" || val === "Buy",
      then: (schema) => schema.positive("Price must be greater than zero").required("Total price is required"),
      otherwise: (schema) => schema.nullable()
    }),
    downPayment: Yup.number().when('purpose', {
      is: (val) => val === "Sell" || val === "Buy",
      then: (schema) => schema.min(0, "Down payment cannot be negative").required("Down payment is required"),
      otherwise: (schema) => schema.nullable()
    }),
    deliveryDate: Yup.string().when('purpose', {
      is: (val) => val === "Sell" || val === "Buy",
      then: (schema) => schema.required("Delivery date is required"),
      otherwise: (schema) => schema.nullable()
    }),
    
    // Basic payment plans validation
    paymentPlans: Yup.object({
      years: Yup.number().min(0, "Years cannot be negative"),
      price: Yup.number().min(0, "Price cannot be negative"),
      maintenance: Yup.number().min(0, "Maintenance cannot be negative")
    }),
    
    // Fix conditional validation for Rent properties
    isAvailable: Yup.boolean().when('purpose', {
      is: "Rent",
      then: (schema) => schema.required("Availability is required"),
      otherwise: (schema) => schema.nullable()
    }),
    availabilityDate: Yup.string().when('purpose', {
      is: "Rent",
      then: (schema) => schema.required("Availability date is required"),
      otherwise: (schema) => schema.nullable()
    }),
    rentPrice: Yup.number().when('purpose', {
      is: "Rent",
      then: (schema) => schema.min(0, "Rent price cannot be negative").required("Rent price is required"),
      otherwise: (schema) => schema.nullable()
    }),
    
    // Validation for rent duration types
    rentDurationType: Yup.object().when('purpose', {
      is: "Rent",
      then: (schema) => Yup.object({
        daily: Yup.object({
          price: Yup.number().min(0, "Price cannot be negative").default(0),
          securityDeposit: Yup.number().min(0, "Security deposit cannot be negative").default(0),
          cleaningFee: Yup.number().min(0, "Cleaning fee cannot be negative").default(0),
          serviceFee: Yup.number().min(0, "Service fee cannot be negative").default(0),
          currency: Yup.string().default("EGP")
        }),
        weekly: Yup.object({
          price: Yup.number().min(0, "Price cannot be negative").default(0),
          securityDeposit: Yup.number().min(0, "Security deposit cannot be negative").default(0),
          cleaningFee: Yup.number().min(0, "Cleaning fee cannot be negative").default(0),
          serviceFee: Yup.number().min(0, "Service fee cannot be negative").default(0),
          currency: Yup.string().default("EGP")
        }),
        monthly: Yup.object({
          price: Yup.number().min(0, "Price cannot be negative").default(0),
          securityDeposit: Yup.number().min(0, "Security deposit cannot be negative").default(0),
          cleaningFee: Yup.number().min(0, "Cleaning fee cannot be negative").default(0),
          serviceFee: Yup.number().min(0, "Service fee cannot be negative").default(0),
          currency: Yup.string().default("EGP")
        })
      }),
      otherwise: (schema) => schema.nullable()
    })
  });

  const [isAddCompoundModalOpen, setIsAddCompoundModalOpen] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isPaymentPlanPopupOpen, setIsPaymentPlanPopupOpen] = useState(false);
  const [isAddDeveloperModalOpen, setIsAddDeveloperModalOpen] = useState(false);
  const [uploadStatus, setUploadStatus] = useState([]);
  const fileInputRef = useRef(null);

  // Get default values from the JSON file
  const defaultBuildingType = propertyEnums.EnumBuildingType[0] || "apartment";
  const defaultPurpose = propertyEnums.EnumPropertyIntent[0] || "buy";
  const defaultView = propertyEnums.EnumViewType[0] || "lagoon";

  // Initialize formik with default values from the JSON file
  const formik = useFormik({
    initialValues: {
      buildingType: defaultBuildingType,
      purpose: defaultPurpose.charAt(0).toUpperCase() + defaultPurpose.slice(1),
      compound: "",
      view: defaultView,
      isGated: false,
      country: "Egypt",
      city: "",
      district: "",
      clientName: clientId,
      clientId: clientId,
      developer: "",
      unitId: uuidv4(),
      unitTitle: "",
      deliveryDate: "",
      deliveryStatus: "",
      bathroomCount: "",
      floor: "",
      roomsCount: "",
      landArea: "",
      gardenSize: "",
      finishing: "",
      dataSource: "website",
      downPayment: "",
      totalPrice: "",
      paymentPlans: {
        years: 0,
        price: 0,
        maintenance: 0
      },
      garageArea: "",
      images: [],
      amenities: {},
      isAvailable: false,
      availabilityDate: "",
      rentDurationType: {
        daily: {
          price: 0,
          securityDeposit: 0,
          cleaningFee: 0,
          serviceFee: 0,
          currency: "EGP"
        },
        weekly: {
          price: 0,
          securityDeposit: 0,
          cleaningFee: 0,
          serviceFee: 0,
          currency: "EGP"
        },
        monthly: {
          price: 0,
          securityDeposit: 0,
          cleaningFee: 0,
          serviceFee: 0,
          currency: "EGP"
        }
      },
      rentPrice: 0,
    },
    validationSchema,
    onSubmit: async (values) => {
      console.log("test",values)
      try {
        console.log("Form submission started with values:", values);
        console.log("Purpose:", values.purpose);
        
        // Check if images are uploaded
        if (values.images.length === 0) {
          toast.error("Please upload images before saving the unit");
          return;
        }
       
        // Convert numeric fields to numbers
        const preparedFormData = {
          ...values,
          updatedAt: new Date().toISOString(), // Add current timestamp
          bathroomCount: values.bathroomCount ? Number(values.bathroomCount) : 0,
          floor: values.floor ? Number(values.floor) : 0,
          roomsCount: values.roomsCount ? Number(values.roomsCount) : 0,
          landArea: values.landArea ? Number(values.landArea) : 0,
          gardenSize: values.gardenSize ? Number(values.gardenSize) : 0,
          garageArea: values.garageArea ? Number(values.garageArea) : 0,
          district: values.district || "", // Ensure district is included in the payload
        };
       
        // Handle purpose-specific fields
        if (values.purpose === "Sell" || values.purpose === "Buy") {
          
          preparedFormData.downPayment = values.downPayment ? Number(values.downPayment) : 0;
          preparedFormData.totalPrice = values.totalPrice ? Number(values.totalPrice) : 0;
          preparedFormData.isGated = values.isGated || false; // Ensure isGated is included for Sell/Buy
          
          // Ensure paymentPlans is in the correct format
          preparedFormData.paymentPlans = {
            years: values.paymentPlans.years ? Number(values.paymentPlans.years) : 0,
            price: values.paymentPlans.price ? Number(values.paymentPlans.price) : 0,
            maintenance: values.paymentPlans.maintenance ? Number(values.paymentPlans.maintenance) : 0
          };
          
          // Set deliveryStatus dynamically based on deliveryDate
          if (values.deliveryDate) {
            const deliveryDate = new Date(values.deliveryDate);
            const today = new Date();
            preparedFormData.deliveryStatus = deliveryDate > today ? "off-plan" : "ready to move";
          } else {
            preparedFormData.deliveryStatus = "ready to move"; // Default value
          }
          
          // Remove rental-specific fields for Sell/Buy
          delete preparedFormData.amenities;
          delete preparedFormData.rentPrice;
          delete preparedFormData.rentDurationType;
          delete preparedFormData.isAvailable;
          delete preparedFormData.availabilityDate;
        }
        else if (values.purpose === "Rent") {
          console.log("Processing rental property");
          
          // Handle the rent structure
          preparedFormData.rentPrice = values.rentPrice ? Number(values.rentPrice) : 0;
          preparedFormData.rentDurationType = values.rentDurationType;
          preparedFormData.isAvailable = values.isAvailable || false;
          preparedFormData.availabilityDate = values.availabilityDate || "";
          
          // Remove sell/buy specific fields for Rent
          delete preparedFormData.paymentPlans;
          delete preparedFormData.downPayment;
          delete preparedFormData.deliveryDate;
          delete preparedFormData.deliveryStatus;
          delete preparedFormData.totalPrice;
          
          console.log("Amenities before processing:", values.amenities);
          
          // Format amenities as an array of strings
          if (values.amenities && typeof values.amenities === 'object') {
            const amenitiesArray = [];
            
            // Convert the amenities object to array of strings format
            Object.entries(values.amenities).forEach(([key, value]) => {
              // Only include amenities that are available (true)
              if (value) {
                // Capitalize the first letter of each amenity
                const capitalizedKey = key.charAt(0).toUpperCase() + key.slice(1);
                amenitiesArray.push(capitalizedKey);
              }
            });
            
            preparedFormData.amenities = amenitiesArray;
            console.log("Formatted amenities as array of strings:", preparedFormData.amenities);
          } else {
            preparedFormData.amenities = [];
            console.log("No amenities found, using empty array");
          }
          
          // Remove any _amenitiesArray property
          delete preparedFormData._amenitiesArray;
        }
        
        console.log("Final data to submit:", preparedFormData);
        
        // Call the API to add the unit
        let response;
        if (values.purpose === "Rent") {
          // Use addUnitRent for rental properties
          response = await addUnitRent(preparedFormData);
        } else {
          // Use addUnit for buy/sell properties
          response = await addUnit(preparedFormData);
        }
        console.log("API response:", response);
    
        toast.success("Unit added successfully");
        
        // Call onSave callback with the prepared data
        if (typeof onSave === 'function') {
          onSave(preparedFormData);
        }
        
        router.refresh(); // Refresh the data without page reload
    
        // Reset form to initial values with a new UUID
        formik.resetForm();
        formik.setFieldValue("unitId", uuidv4());
        formik.setFieldValue("buildingType", defaultBuildingType);
        formik.setFieldValue("purpose", defaultPurpose.charAt(0).toUpperCase() + defaultPurpose.slice(1));
        formik.setFieldValue("view", defaultView);
        formik.setFieldValue("country", "Egypt");
        formik.setFieldValue("clientId", clientId);
        formik.setFieldValue("images", []);
        formik.setFieldValue("amenities", {}); // Reset to empty object, not array
    
        // Close the modal
        if (typeof onClose === 'function') {
          onClose();
        }
      } catch (error) {
        console.error("Error adding unit:", error);
        console.error("Error details:", error.response?.data || error.message);
        toast.error(error.response?.data?.message || error.message || "Failed to add unit");
      }
    },
  });

  // Generate new UUID when modal opens
  useEffect(() => {
    formik.setFieldValue("unitId", uuidv4());
  }, []);

  // Reset file input to allow reselecting the same file
  const resetFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFileSelection = (files, replace = false) => {
    if (!files || files.length === 0) return;

    // Convert FileList to Array
    const newFiles = Array.from(files);
    
    // Validate each file (size and type)
    const validFiles = newFiles.filter(file => {
      const isValidType = ['image/jpeg', 'image/png', 'image/webp'].includes(file.type);
      const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB limit
      
      if (!isValidType) {
        toast.error(`${file.name} is not a supported image format`);
      }
      if (!isValidSize) {
        toast.error(`${file.name} exceeds the 5MB size limit`);
      }
      
      return isValidType && isValidSize;
    });

    // Store the selected files without uploading immediately
    setSelectedFiles(prev => [...prev, ...validFiles]);
  };
  
  const handleImageUpload = async () => {
    if (selectedFiles.length === 0) return;
  
    setUploadingImages(true);
  
    // Initialize upload status for each file
    const initialStatus = selectedFiles.map(() => 'loading');
    setUploadStatus(initialStatus);
  
    try {
      // Create an array to store all uploaded image data
      const uploadedImagesData = [];
      
      // Upload each file one by one
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const formDataToUpload = new FormData();
        formDataToUpload.append("file", file);
        
        try {
          // Upload the current file
          const uploadedImage = await uploadImages(formDataToUpload);
          
          // Format the image data to match the required structure
          if (Array.isArray(uploadedImage)) {
            // If response is an array, map each item to the required format
            const formattedImages = uploadedImage.map(img => ({
              url: img.url || img.imageUrl || "",
              fileId: img.fileId || img._id || ""
            }));
            uploadedImagesData.push(...formattedImages);
          } else {
            // If response is a single object
            uploadedImagesData.push({
              url: uploadedImage.url || uploadedImage.imageUrl || "",
              fileId: uploadedImage.fileId || uploadedImage._id || ""
            });
          }
          
          // Update status for this file to success
          setUploadStatus(prev => {
            const newStatus = [...prev];
            newStatus[i] = 'success';
            return newStatus;
          });
        } catch (error) {
          console.error(`Error uploading image ${i}:`, error);
          
          // Update status for this file to error
          setUploadStatus(prev => {
            const newStatus = [...prev];
            newStatus[i] = 'error';
            return newStatus;
          });
        }
      }
  
      // Update formik values with all new images
      formik.setFieldValue("images", [...formik.values.images, ...uploadedImagesData]);
  
      // Only show success message for successfully uploaded images
      const successCount = uploadStatus.filter(status => status === 'success').length;
      if (successCount > 0) {
        toast.success(`${successCount} images uploaded successfully`);
      }
      
      // Keep only failed images in the selected files
      const failedIndices = uploadStatus.map((status, index) => status === 'error' ? index : -1).filter(index => index !== -1);
      const failedFiles = failedIndices.map(index => selectedFiles[index]);
      setSelectedFiles(failedFiles);
      
      // Reset upload status for remaining files
      setUploadStatus(failedFiles.map(() => null));
      
      resetFileInput();
    } catch (error) {
      console.error("Error in upload process:", error);
      toast.error(`Failed to upload images: ${error.message || "Unknown error"}`);
      
      // Mark all as failed
      setUploadStatus(selectedFiles.map(() => 'error'));
    } finally {
      setUploadingImages(false);
    }
  };

  const removeSelectedFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    
    // Also update the upload status array
    setUploadStatus((prev) => {
      if (prev.length > 0) {
        return prev.filter((_, i) => i !== index);
      }
      return prev;
    });
  };

  const removeUploadedImage = async (index, imageId) => {
    try {
      // Use the deleteImage function from serviceFetching
      await deleteImage(imageId);

      // Remove from formik state after successful API deletion
      const updatedImages = [...formik.values.images];
      updatedImages.splice(index, 1);
      formik.setFieldValue("images", updatedImages);

      toast.success("Image deleted successfully");
    } catch (error) {
      console.error("Error deleting image:", error);
      toast.error(
        `Failed to delete image: ${error.message || "Unknown error"}`
      );
    }
  };

  const handleCompoundSave = (compoundData) => {
    // Update the compound field with the new compound
    formik.setFieldValue("compound", compoundData.name);
    setIsAddCompoundModalOpen(false);
  };

  const handleDeveloperSave = async (developerData) => {
    try {
      // Call the API to add a new developer
      const response = await addDeveloper(developerData);
      
      // Update the developer field with the new developer
      formik.setFieldValue("developer", developerData.name);
      setIsAddDeveloperModalOpen(false);
      
      toast.success("Developer added successfully");
    } catch (error) {
      console.error("Error adding developer:", error);
      toast.error(`Failed to add developer: ${error.message || "Unknown error"}`);
    }
  };

  const handleAddPaymentPlan = (planData) => {
    // Assuming planData contains years, price, and maintenance fields
    formik.setFieldValue("paymentPlans", {
      years: Number(planData.years) || 0,
      price: Number(planData.price) || 0,
      maintenance: Number(planData.maintenance) || 0
    });
    setIsPaymentPlanPopupOpen(false);
  };

  const handleRemovePaymentPlan = () => {
    formik.setFieldValue("paymentPlans", {
      years: 0,
      price: 0,
      maintenance: 0
    });
  };

  const handleDrop = (e) => {
    e.preventDefault();
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelection(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (formik.values.images.length === 0) {
      toast.error("You must upload images to the server first");
      return;
    }
    
    formik.handleSubmit();
  };

  return {
    formik,
    isAddCompoundModalOpen,
    uploadingImages,
    selectedFiles,
    isPaymentPlanPopupOpen,
    fileInputRef,
    uploadStatus,
    setIsAddCompoundModalOpen,
    setIsPaymentPlanPopupOpen,
    handleFileSelection,
    handleImageUpload,
    removeSelectedFile,
    removeUploadedImage,
    handleDrop,
    handleAddPaymentPlan,
    handleRemovePaymentPlan,
    handleDragOver,
    handleCompoundSave,
    isAddDeveloperModalOpen,
    setIsAddDeveloperModalOpen,
    handleDeveloperSave,
    handleSubmit,
    // Add function to handle amenity checkbox changes
    handleAmenityChange: (amenity, checked) => {
      const updatedAmenities = { ...formik.values.amenities || {} };
      updatedAmenities[amenity] = checked;
      formik.setFieldValue("amenities", updatedAmenities);
    }
  };
};