"use client";
import { useState, useRef, useEffect } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import axios from "axios";
import toast from "react-hot-toast";

import { v4 as uuidv4 } from "uuid";
import { useRouter } from "next/navigation";
import {
  addUnit,
  deleteImage,
  uploadImages,
  addDeveloper, // Add this import if it exists in serviceFetching
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
    district: Yup.string(),
    view: Yup.string().required("View is required"),
    // Make totalPrice and downPayment conditional based on purpose
    totalPrice: Yup.number().when("purpose", {
      is: (purpose) => purpose === "Sell" || purpose === "Buy",
      then: () => Yup.number()
        .positive("Price must be greater than zero")
        .required("Total price is required"),
      otherwise: () => Yup.number().nullable()
    }),
    downPayment: Yup.number().when("purpose", {
      is: (purpose) => purpose === "Sell" || purpose === "Buy",
      then: () => Yup.number()
        .positive("Down payment must be greater than zero")
        .required("Down payment is required"),
      otherwise: () => Yup.number().nullable()
    }),
    deliveryDate: Yup.string().when("purpose", {
      is: (purpose) => purpose === "Sell" || purpose === "Buy",
      then: () => Yup.string().required("Delivery date is required"),
      otherwise: () => Yup.string().nullable()
    }),
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
    paymentPlans: Yup.string(),
    // Add validation for rental properties
    availability: Yup.boolean().when("purpose", {
      is: "Rent",
      then: () => Yup.boolean().required("Availability is required"),
      otherwise: () => Yup.boolean().nullable()
    }),
    startingDate: Yup.string().when("purpose", {
      is: "Rent",
      then: () => Yup.string().required("Starting date is required"),
      otherwise: () => Yup.string().nullable()
    }),
    // At least one rent type is required for rental properties
    monthlyRent: Yup.number().when(["purpose", "weeklyRent", "dailyRent"], {
      is: (purpose, weeklyRent, dailyRent) => 
        purpose === "Rent" && !weeklyRent && !dailyRent,
      then: () => Yup.number().positive("Must be a positive number").required("At least one rent type is required"),
      otherwise: () => Yup.number().nullable().min(0, "Must be a positive number")
    }),
    weeklyRent: Yup.number().when("purpose", {
      is: "Rent",
      then: () => Yup.number().nullable().min(0, "Must be a positive number"),
      otherwise: () => Yup.number().nullable()
    }),
    dailyRent: Yup.number().when("purpose", {
      is: "Rent",
      then: () => Yup.number().nullable().min(0, "Must be a positive number"),
      otherwise: () => Yup.number().nullable()
    }),
  });

  const [isAddCompoundModalOpen, setIsAddCompoundModalOpen] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isPaymentPlanPopupOpen, setIsPaymentPlanPopupOpen] = useState(false);
  const fileInputRef = useRef(null);

  // Get default values from the JSON file
  const defaultBuildingType = propertyEnums.EnumBuildingType[0] || "apartment";
  const defaultPurpose = propertyEnums.EnumPropertyIntent[0] || "buy";
  const defaultView = propertyEnums.EnumViewType[0] || "lagoon";

  // Initialize formik with default values from the JSON file
  const formik = useFormik({
    initialValues: {
      buildingType: defaultBuildingType.charAt(0).toUpperCase() + defaultBuildingType.slice(1),
      purpose: defaultPurpose.charAt(0).toUpperCase() + defaultPurpose.slice(1),
      compound: "",
      view: defaultView.charAt(0).toUpperCase() + defaultView.slice(1),
      country: "Egypt",
      city: "",
      district: "",
      clientName: clientId,
      clientId: clientId,
      developer: "",
      isNewDeveloper: false,
      unitId: uuidv4(),
      unitTitle: "",
      deliveryDate: "",
      bathroomCount: "",
      floor: "",
      roomsCount: "",
      landArea: "",
      gardenSize: "",
      finishing: "",
      dataSource: "website", // Set default value for dataSource
      downPayment: "",
      totalPrice: "",
      paymentPlans: "",
      garageArea: "",
      images: [],
      // Add default amenities object
      amenities: {},
      // Add default rental fields
      availability: false,
      startingDate: "",
      monthlyRent: "",
      weeklyRent: "",
      dailyRent: "",
    },
    validationSchema, // Uncomment this line to enable validation
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
        };
       console.log(values.purpose)
        // Handle purpose-specific fields
        if (values.purpose === "Sell" || values.purpose === "Buy") {
          console.log(values.purpose)
          preparedFormData.downPayment = values.downPayment ? Number(values.downPayment) : 0;
          preparedFormData.totalPrice = values.totalPrice ? Number(values.totalPrice) : 0;
          
          // Ensure the same keys are sent for both Sell and Buy
          if (values.purpose === "Sell") {
            // Clone all the Buy-specific properties
            
          }
        }
       
        
        else if (values.purpose === "Rent") {
          console.log("Processing rental property");
          
          // Convert rent values to numbers
          preparedFormData.monthlyRent = values.monthlyRent ? Number(values.monthlyRent) : 0;
          preparedFormData.weeklyRent = values.weeklyRent ? Number(values.weeklyRent) : 0;
          preparedFormData.dailyRent = values.dailyRent ? Number(values.dailyRent) : 0;
          
          console.log("Amenities before processing:", values.amenities);
          
          // Format amenities as an array of objects
          if (values.amenities && typeof values.amenities === 'object') {
            const amenitiesArray = [];
            
            // Convert the amenities object to array of objects format
            Object.entries(values.amenities).forEach(([key, value]) => {
              // Only include amenities that are available (true)
              if (value) {
                const amenityObj = {};
                amenityObj[key] = value;
                amenitiesArray.push(amenityObj);
              }
            });
            
            preparedFormData.amenities = amenitiesArray;
            console.log("Formatted amenities as array of objects:", preparedFormData.amenities);
          } else {
            preparedFormData.amenities = [];
            console.log("No amenities found, using empty array");
          }
          
          // Remove any _amenitiesArray property
          delete preparedFormData._amenitiesArray;
        }
        
        console.log("Final data to submit:", preparedFormData);
        
        // Call the API to add the unit
        const response = await addUnit(preparedFormData);
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
        formik.setFieldValue("buildingType", defaultBuildingType.charAt(0).toUpperCase() + defaultBuildingType.slice(1));
        formik.setFieldValue("purpose", defaultPurpose.charAt(0).toUpperCase() + defaultPurpose.slice(1));
        formik.setFieldValue("view", defaultView.charAt(0).toUpperCase() + defaultView.slice(1));
        formik.setFieldValue("country", "Egypt");
        formik.setFieldValue("district", "");
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

    try {
      // Create an array to store all uploaded image data
      const uploadedImagesData = [];
      
      // Upload each file one by one
      for (const file of selectedFiles) {
        const formDataToUpload = new FormData();
        formDataToUpload.append("file", file);
        
        // Upload the current file
        const uploadedImage = await uploadImages(formDataToUpload);
        
        // Add to our array of uploaded images
        if (Array.isArray(uploadedImage)) {
          uploadedImagesData.push(...uploadedImage);
        } else {
          uploadedImagesData.push(uploadedImage);
        }
      }

      // Update formik values with all new images
      formik.setFieldValue("images", [...formik.values.images, ...uploadedImagesData]);

      toast.success(`${uploadedImagesData.length} images uploaded successfully`);
      setSelectedFiles([]);
      resetFileInput();
    } catch (error) {
      console.error("Error uploading images:", error);
      toast.error(
        `Failed to upload images: ${error.message || "Unknown error"}`
      );
    } finally {
      setUploadingImages(false);
    }
  };

  const removeSelectedFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const removeUploadedImage = async (index, imageId) => {
    try {
      // استخدام وظيفة deleteImage من serviceFetching
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

  const handleDrop = (e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    handleFileSelection(files);
  };

  // Update the handleAddPaymentPlan function to concatenate strings
  const handleAddPaymentPlan = (planText) => {
    const currentPlans = formik.values.paymentPlans;
    formik.setFieldValue(
      "paymentPlans",
      currentPlans ? `${currentPlans}, ${planText}` : planText
    );
  };

  // Update the handleRemovePaymentPlan function to work with string
  const handleRemovePaymentPlan = (index) => {
    const plansArray = formik.values.paymentPlans.split(", ");
    plansArray.splice(index, 1);
    formik.setFieldValue("paymentPlans", plansArray.join(", "));
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  // Add this custom submit handler function
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate required fields based on purpose
    const requiredFields = [
      'unitTitle', 'compound', 'buildingType', 'purpose', 
      'city', 'view', 'roomsCount', 'bathroomCount'
    ];
    
    // Add purpose-specific required fields
    if (formik.values.purpose === 'Sell' || formik.values.purpose === 'Buy') {
      requiredFields.push('totalPrice', 'downPayment', 'deliveryDate');
    } else if (formik.values.purpose === 'Rent') {
      // For rental properties, check if at least one rent type is provided
      if (!formik.values.monthlyRent && !formik.values.weeklyRent && !formik.values.dailyRent) {
        formik.setFieldError('monthlyRent', 'At least one rent type is required');
        toast.error('Please provide at least one rent type');
        return;
      }
    }
    
    // Check for missing required fields
    let hasErrors = false;
    requiredFields.forEach(field => {
      if (!formik.values[field]) {
        formik.setFieldError(field, `${field} is required`);
        formik.setFieldTouched(field, true);
        hasErrors = true;
      }
    });
    
    if (hasErrors) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    // Check if images are uploaded
    if (formik.values.images.length === 0) {
      toast.error("Please upload images before saving the unit");
      return;
    }
    
    // If validation passes, submit the form
    formik.handleSubmit();
  };

  const handleCompoundSave = (compoundData) => {
    // Set the newly created compound name to the unit's compound field
    formik.setFieldValue(
      "compound",
      compoundData.name || compoundData.compoundName
    );
  };

  // Add these to your existing imports
 
  
  // Inside your useUnitForm hook, add:
  const [isAddDeveloperModalOpen, setIsAddDeveloperModalOpen] = useState(false);
  
  // Add this function to handle saving a new developer
  const handleDeveloperSave = async (developerData) => {
      try {
        // Show loading toast
        const loadingToast = toast.loading("Adding new developer...");
        
        // Create the developer data object
        const developerToAdd = {
          name: developerData.name,
          logo:"",
          description: developerData.description || "",
         
        };
        
        // Call the API to add the developer
        const response = await addDeveloper(developerToAdd);
        
        // Directly update the form with the new developer value
        formik.setFieldValue("developer", developerData.name);
        // Set isNewDeveloper to false to show the select dropdown with the new value
        formik.setFieldValue("isNewDeveloper", false);
        
        // Close the modal
        setIsAddDeveloperModalOpen(false);
        
        // Dismiss loading toast and show success message
        toast.dismiss(loadingToast);
        toast.success("Developer added successfully");
        
        return response.data;
        
      } catch (error) {
        console.error("Error adding developer:", error);
        toast.error("Failed to add developer: " + (error.response?.data?.message || error.message));
        throw error;
      }
    };
  
  // Make sure to include these in your return statement
  // Update the return statement to include handleSubmit
  // Fix the return statement by removing the extra closing brace
  return {
    formik,
    isAddCompoundModalOpen,
    uploadingImages,
    selectedFiles,
    isPaymentPlanPopupOpen,
    fileInputRef,
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
    }}
  }; // This is the correct closing brace for the return statement
