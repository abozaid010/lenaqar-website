"use client";

import { useState, useEffect } from "react";

export default function ClientInfo({ data }) {
  const [formData, setFormData] = useState({
    email: data.email,
    phone_number: data.phone_number,
  });
  const [isChanged, setIsChanged] = useState(false);

  useEffect(() => {
    setFormData(data || {});
    setIsChanged(false);
  }, [data]);

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      setIsChanged(JSON.stringify(updated) !== JSON.stringify(data));
      return updated;
    });
  }

  return (
    <form className="client-info-form flex flex-col gap-4 max-w-md mx-auto p-6 bg-white rounded-lg shadow mt-6">
      <label className="flex flex-col text-gray-600 mb-1">
        Email:
        <input
          type="email"
          name="email"
          value={formData.email || ""}
          onChange={handleChange}
          className="mt-2 p-2 border border-gray-300 rounded bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </label>
      <label className="flex flex-col text-gray-600 mb-1">
        Phone Number:
        <input
          type="text"
          name="phone_number"
          value={formData.phone_number || ""}
          onChange={handleChange}
          className="mt-2 p-2 border border-gray-300 rounded bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </label>
      <label className="flex flex-col text-gray-600 mb-1">
        Client Name:
        <input
          type="text"
          disabled={true}
          readOnly={true}
          onChange={handleChange}
          className="mt-2 p-2 border border-gray-300 rounded bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-200"
        />
      </label>

      {isChanged && (
        <button
          type="button"
          className="mt-4 py-2 px-4 bg-primary text-white rounded hover:opacity-90 transition"
        >
          Save Changes
        </button>
      )}
    </form>
  );
}
