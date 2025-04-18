import React, { useState } from "react";

const PropertyDetailsSection = ({ formData, handleChange }) => {
  const [errors, setErrors] = useState({});
  
  const validateInput = (name, value) => {
    if (value < 0) {
      // Show toast notification for negative values
      showToast(`${name} cannot be negative`);
      return false;
    }
    return true;
  };
  
  const showToast = (message) => {
    // Create toast element
    const toast = document.createElement("div");
    toast.className = "fixed bottom-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-fade-in";
    toast.textContent = message;
    document.body.appendChild(toast);
    
    // Remove toast after 3 seconds
    setTimeout(() => {
      toast.classList.add("animate-fade-out");
      setTimeout(() => document.body.removeChild(toast), 500);
    }, 3000);
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const numValue = parseFloat(value);
    
    if (value === "" || isNaN(numValue)) {
      // Allow empty input or reset
      handleChange(e);
      return;
    }
    
    if (validateInput(name, numValue)) {
      handleChange(e);
      // Clear error if it was previously set
      if (errors[name]) {
        setErrors(prev => ({ ...prev, [name]: null }));
      }
    } else {
      // Keep the old value to prevent negative numbers
      e.preventDefault();
      e.target.value = formData[name];
    }
  };
  
  // Add custom CSS for animations to document
  React.useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      .animate-fade-in {
        animation: fadeIn 0.5s ease-in-out;
      }
      .animate-fade-out {
        animation: fadeOut 0.5s ease-in-out;
      }
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes fadeOut {
        from { opacity: 1; transform: translateY(0); }
        to { opacity: 0; transform: translateY(20px); }
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);
  
  const fields = [
    { name: "roomsCount", label: "Rooms Count" },
    { name: "bathroomCount", label: "Bathroom Count" },
    { name: "floor", label: "Floor" },
    { name: "landArea", label: "Land Area (m²)" },
    { name: "gardenSize", label: "Garden Size (m²)" },
    { name: "garageArea", label: "Garage Area (m²)" }
  ];

  return (
    <div className="mb-8">
      <h3 className="text-xl font-semibold text-gray-700 mb-4">
        Property Details
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {fields.map((field) => (
          <div key={field.name}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {field.label}
            </label>
            <input
              type="number"
              name={field.name}
              value={formData[field.name]}
              onChange={handleInputChange}
              min="0"
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default PropertyDetailsSection;