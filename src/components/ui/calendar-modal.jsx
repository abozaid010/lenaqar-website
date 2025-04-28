"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import CalendarSelector from "./calender-selector";

export default function CalendarModal({ buttonText = "Try Lena Now" }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isBookingComplete, setIsBookingComplete] = useState(false);
  const [bookingData, setBookingData] = useState(null);

  const openModal = () => {
    setIsOpen(true);
    setIsBookingComplete(false);
  };

  const closeModal = () => setIsOpen(false);

  // Handle booking completion
  const handleBookingComplete = (data) => {
    setBookingData(data);
    setIsBookingComplete(true);

    console.log("Booking Data:", data);
  };

  // Disable/enable scroll on modal open/close
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const modalContent = (
    <div
      className={`fixed inset-0 bg-black/50 flex items-center justify-center z-50 transition-opacity duration-300 ${
        isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
      onClick={closeModal}
    >
      {/* Modal content */}
      <div
        className={`bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-auto transition-all duration-300 ${
          isOpen ? "scale-100" : "scale-95"
        }`}
        onClick={(e) => e.stopPropagation()} // Prevent clicks inside from closing
      >
        {/* Close button */}
        <button
          onClick={closeModal}
          className="absolute top-3 right-3 p-2 rounded-full hover:bg-gray-100 text-gray-500 z-10"
        >
          <X className="h-5 w-5" />
          <span className="sr-only">Close</span>
        </button>

        {isBookingComplete ? (
          // Booking confirmation screen
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M5 13l4 4L19 7"
                ></path>
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Booking Confirmed!
            </h2>
            <p className="text-gray-600 mb-6">
              Thank you, <span className="font-bold">{bookingData?.name}</span>!
              Your meeting has been scheduled for{" "}
              {bookingData?.date &&
                new Date(bookingData.date).toLocaleDateString()}{" "}
              at {bookingData?.time}.
            </p>
            <p className="text-gray-600 mb-6">
              We've sent a confirmation email to {bookingData?.email} with all
              the details.
            </p>
            <button
              onClick={closeModal}
              className="px-6 cursor-pointer py-2 bg-primary hover:bg-primary text-white font-medium rounded-md"
            >
              Close
            </button>
          </div>
        ) : (
          // Calendar component
          <CalendarSelector onBookingComplete={handleBookingComplete} />
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Button to open the modal */}
      <button
        onClick={openModal}
        className="bg-gradient-to-r from-[#3926A7] to-[#21EAF4] hover:opacity-90 px-8 py-3 rounded-md text-white font-medium transition-all shadow-lg mt-4"
      >
        {buttonText}
      </button>

      {/* Render modal in a portal */}
      {typeof window !== "undefined" &&
        createPortal(modalContent, document.body)}
    </>
  );
}
