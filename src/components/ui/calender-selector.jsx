"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, ArrowRight, Check } from "lucide-react";
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isBefore,
  isSameDay,
  parseISO,
  getYear,
  getDate,
} from "date-fns";

export default function CalendarSelector({
  onSelectDateTime,
  onBookingComplete,
  // TODO: retrevie available times from the server
  mockTimesByDay = {
    23: ["11:30am", "1:30pm", "2:00pm", "2:30pm", "3:00pm", "3:30pm", "4:00pm"],
    24: ["11:00am", "2:00pm", "3:00pm"],
    27: ["10:00am", "1:00pm"],
    28: ["9:30am", "12:30pm"],
    29: ["4:00pm"],
    30: ["11:00am", "1:00pm", "2:30pm"],
  },
}) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [showTimeColumn, setShowTimeColumn] = useState(false);
  const [bookingStage, setBookingStage] = useState("calendar");
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    phone: "",
    notes: "",
  });

  // Check if a date is unavailable
  const isDateUnavailable = (date) => {
    const currentYear = getYear(today);
    const dateDay = getDate(date);

    if (!isSameMonth(date, today) || getYear(date) !== currentYear) {
      return true;
    }

    // Check if the day has available times in mockTimesByDay
    return !Object.keys(mockTimesByDay).includes(dateDay.toString());
  };

  // Get days for the current month view
  const getDaysInMonth = () => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    return eachDayOfInterval({ start, end });
  };

  const days = getDaysInMonth();
  const today = new Date();

  // Handle month navigation
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  // Handle date selection
  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setSelectedTime(null);
    setShowTimeColumn(true);
  };

  // Handle time selection
  const handleTimeSelect = (time) => {
    setSelectedTime(time);
    if (selectedDate && onSelectDateTime) {
      onSelectDateTime(selectedDate, time);
    }
  };

  // Handle confirm button click
  const handleConfirm = () => {
    setBookingStage("form");
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Combine date, time and form data
    const bookingData = {
      date: selectedDate,
      time: selectedTime,
      ...formData,
    };

    // Call the callback if provided
    if (onBookingComplete) {
      onBookingComplete(bookingData);
    }
  };

  // Check if a date is in the past
  const isDateInPast = (date) => {
    return isBefore(date, today) && !isSameDay(date, today);
  };

  // Format the selected date for display
  const formattedSelectedDate = selectedDate
    ? format(selectedDate, "EEEE, MMMM d")
    : "";

  return (
    <div className="flex flex-col md:flex-row border rounded-lg shadow-sm overflow-hidden max-w-5xl mx-auto bg-white">
      {/* Left panel - Company info */}
      <div className="border-r border-gray-200 w-full md:w-82 flex flex-col">
        <div className="flex justify-center border-b border-gray-200 py-8">
          <Image
            src={"/images/logo.png"}
            alt="logo_image"
            width={120}
            height={40}
          />
        </div>

        <div className="mt-4 p-6">
          <Image
            src={"/images/logo.png"}
            alt="logo_image"
            width={50}
            height={50}
          />

          <div className="mt-6">
            <div className="text-gray-600">Lena AI</div>
            <h2 className="text-xl md:text-2xl font-bold text-slate-800 mb-4">
              30 Minute Meeting
            </h2>
          </div>

          <div className="flex items-start mb-4">
            <div className="w-6 h-6 mr-0.5 text-gray-500">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="w-5 h-5"
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <span className="text-gray-600 font-semibold text-sm">15 min</span>
          </div>

          <div className="flex items-start mb-6">
            <div className="w-6 h-6 mr-2 mt-0.5 text-gray-500">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="w-5 h-5"
              >
                <rect x="3" y="4" width="18" height="16" rx="2" />
                <path d="M16 2v4M8 2v4M3 10h18" />
              </svg>
            </div>
            <span className="text-gray-600 text-sm font-semibold">
              Web conferencing details provided upon confirmation.
            </span>
          </div>

          <div className="mt-auto">
            <h3 className="text-primary font-bold mb-2">Book a meeting</h3>
            <p className="text-gray-600 text-sm font-medium">
              Book 30-Minute meeting with Lena Team
            </p>
          </div>
        </div>
      </div>

      {bookingStage === "calendar" ? (
        <>
          {/* Middle panel - Calendar - Fixed width */}
          <div className="p-6 border-r border-gray-200 w-full md:w-96 flex-shrink-0">
            <h2 className="text-xl font-medium text-slate-800 mb-6">
              Select a Date & Time
            </h2>

            {/* Month navigation */}
            <div className="flex justify-between items-center mb-6">
              <button
                onClick={prevMonth}
                className="p-2 rounded-full hover:bg-gray-100 text-gray-600"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              <h3 className="text-lg font-medium">
                {format(currentDate, "MMMM yyyy")}
              </h3>

              <button
                onClick={nextMonth}
                className="p-2 rounded-full hover:bg-gray-100 text-gray-600"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            {/* Calendar grid */}
            <div className="mb-6">
              {/* Day headers */}
              <div className="grid grid-cols-7 mb-2">
                {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map(
                  (day) => (
                    <div
                      key={day}
                      className="text-center text-sm font-medium text-gray-600 py-2"
                    >
                      {day}
                    </div>
                  )
                )}
              </div>

              {/* Calendar days */}
              <div className="grid grid-cols-7 gap-1">
                {/* Empty cells for days before the start of the month */}
                {Array.from({ length: days[0].getDay() }).map((_, index) => (
                  <div key={`empty-start-${index}`} className="h-10 p-1" />
                ))}

                {/* Actual days of the month */}
                {days.map((day) => {
                  const isPast = isDateInPast(day);
                  const isUnavailable = isDateUnavailable(day);
                  const isDisabled = isPast || isUnavailable;
                  const isSelected =
                    selectedDate && isSameDay(day, selectedDate);
                  const isCurrentMonth = isSameMonth(day, currentDate);
                  const dayNumber = format(day, "d");

                  // Determine if this is one of the highlighted days (23, 24, etc.)
                  const isHighlighted =
                    ["23", "24", "27", "28", "29", "30"].includes(dayNumber) &&
                    !isDisabled;

                  // Build class string using template literals
                  let dayClasses =
                    "h-10 w-10 relative flex items-center justify-center rounded-full text-sm font-medium";

                  if (isDisabled) {
                    dayClasses += " text-gray-300 !cursor-default";
                  } else {
                    dayClasses += " hover:bg-gray-100";
                  }

                  if (isSelected) {
                    dayClasses += " bg-primary text-white hover:bg-primary/90";
                  }

                  if (!isSelected && isHighlighted) {
                    dayClasses += " text-primary";
                  }

                  if (!isCurrentMonth) {
                    dayClasses += " opacity-50";
                  }

                  return (
                    <button
                      key={day.toString()}
                      onClick={() => !isDisabled && handleDateSelect(day)}
                      disabled={isDisabled}
                      className={dayClasses}
                    >
                      {dayNumber}
                      {isSelected && (
                        <div className="absolute bottom-1.5 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-white rounded-full" />
                      )}
                    </button>
                  );
                })}

                {/* Empty cells for days after the end of the month */}
                {Array.from({ length: 6 - days[days.length - 1].getDay() }).map(
                  (_, index) => (
                    <div key={`empty-end-${index}`} className="h-12 p-1" />
                  )
                )}
              </div>
            </div>
          </div>

          {/* Right panel - Time slots (only shown when a date is selected) */}
          <div className="py-6 px-3">
            {showTimeColumn && selectedDate ? (
              <div className="w-full md:w-52 flex-shrink-0 flex flex-col gap-4 h-full">
                <div>
                  <h3 className="text-lg font-medium text-slate-800 mb-4">
                    {formattedSelectedDate}
                  </h3>

                  <div className="space-y-2 px-2 overflow-y-auto max-h-80">
                    {mockTimesByDay[format(selectedDate, "d")]?.map((time) => {
                      const isPastTime = isBefore(
                        parseISO(
                          `${format(selectedDate, "yyyy-MM-dd")}T${time}`
                        ),
                        new Date()
                      );

                      const timeButtonClasses = `cursor-pointer w-full py-2 border rounded-md text-center font-medium ${
                        selectedTime === time
                          ? "border-primary text-priamry bg-primary/10 border-2"
                          : "border-gray-300 text-gray-700 hover:border-gray-400"
                      }`;

                      return (
                        <button
                          key={time}
                          onClick={() => handleTimeSelect(time)}
                          disabled={isPastTime}
                          className={timeButtonClasses}
                        >
                          <span>{time}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Confirm button - only shown when both date and time are selected */}
                {selectedDate && selectedTime && (
                  <div className="flex-1 flex items-end">
                    <button
                      onClick={handleConfirm}
                      className="mt-2 w-full py-2 px-4 bg-primary hover:opacity-95 cursor-pointer text-white font-medium rounded-md flex items-center justify-center"
                    >
                      <span>Confirm</span>
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col justify-center h-full">
                <h3 className="text-slate-800 font-bold mb-2">
                  Available Times
                </h3>
                <p className="text-gray-500 text-sm">
                  Select a day to see available times.
                </p>
              </div>
            )}
          </div>
        </>
      ) : (
        // Form view - replaces both calendar and time columns
        <div className="p-6 flex-1">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-800">
              Enter Your Information
            </h2>
            <p className="text-gray-600">
              You're booking a meeting on{" "}
              <span className="font-bold">
                {selectedDate && format(selectedDate, "MMMM d, yyyy")}
              </span>{" "}
              at <span className="font-bold">{selectedTime}</span>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-2.5">
            <div>
              <label
                htmlFor="firstName"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="firstName"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                placeholder="+20 123 456 7890"
                required
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label
                htmlFor="company"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Company
              </label>
              <input
                type="text"
                id="company"
                name="company"
                value={formData.company}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label
                htmlFor="notes"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Please share anything that will help prepare for our meeting.
              </label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Let us know how we can help you..."
              ></textarea>
            </div>

            <button className="w-full cursor-pointer py-2 px-4 bg-primary hover:opacity-95 text-white font-medium rounded-md flex items-center justify-center">
              <span>Complete Booking</span>
              <Check className="ml-2" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
