"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import CalendarSelector from "./calender-selector";
import { useI18n } from "@/context/translate-api";

export default function CalendarModal({ buttonText = "Try Lena Now", style }) {
  const { t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const [isBookingComplete, setIsBookingComplete] = useState(false);
  const [bookingData, setBookingData] = useState(null);

  const openModal = () => {
    setIsOpen(true);
    setIsBookingComplete(false);
  };

  const closeModal = () => setIsOpen(false);

  const handleBookingComplete = (data) => {
    setBookingData(data);
    setIsBookingComplete(true);
    console.log("Booking Data:", data);
  };

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
      <div
        className={`bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-auto transition-all duration-300 ${
          isOpen ? "scale-100" : "scale-95"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={closeModal}
          className="absolute top-1 right-2 p-2 rounded-full text-gray-500 z-10"
        >
          <X className="h-5 w-5" />
          <span className="sr-only">{t.calendarModal.closeButton}</span>
        </button>

        {isBookingComplete ? (
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
              {t.calendarModal.confirmationTitle}
            </h2>
            <p className="text-gray-600 mb-6">
              {t.calendarModal.thankYou} <span className="font-bold">{bookingData?.name}</span>!
              {t.calendarModal.meetingScheduled} {" "}
              {bookingData?.date &&
                new Date(bookingData.date).toLocaleDateString()}{" "}
              {t.calendarModal.at} {bookingData?.time}.
            </p>
            <p className="text-gray-600 mb-6">
              {t.calendarModal.confirmationSent} {bookingData?.email} {t.calendarModal.withDetails}.
            </p>
            <button
              onClick={closeModal}
              className="px-6 cursor-pointer py-2 bg-primary hover:bg-primary text-white font-medium rounded-md"
            >
              {t.calendarModal.closeButton}
            </button>
          </div>
        ) : (
          <CalendarSelector onBookingComplete={handleBookingComplete} />
        )}
      </div>
    </div>
  );

  return (
    <>
      <button
        onClick={openModal}
        className={`${style}`}
      >
        {buttonText}
      </button>
       
      {typeof window !== "undefined" &&
        createPortal(modalContent, document.body)}
    </>
  );
}