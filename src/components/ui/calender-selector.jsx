"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Check,
  ArrowLeft,
} from "lucide-react";
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
} from "date-fns";
import { useI18n } from "@/context/translate-api";
import { Loader2, Globe } from "lucide-react";
import { createBooking, getAvailableSlots } from "../services/serviceFetching";
import toast from "react-hot-toast";

export default function CalendarSelector({
  onSelectDateTime,
  onBookingComplete,
}) {
  const { t } = useI18n();
  const isRTL = t.direction === "rtl";
  // for fetch available slots
  const [loading, setLoading] = useState(false);
  // for booking
  const [isLoading, setIsLoading] = useState(false);
  const [availableSlots, setAvailableSlots] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [showTimeColumn, setShowTimeColumn] = useState(false);
  const [bookingStage, setBookingStage] = useState("calendar");
  const [back, setback] = useState(false);

  const [formData, setFormData] = useState({
    client_name: "",
    client_email: "",
    company: "",
    phone_number: "",
    notes: "",
  });

  // Fetch available slots when the month changes
  useEffect(() => {
    const fetchAvailableSlots = async () => {
      try {
        setLoading(true);

        const monthString = format(currentDate, "yyyy-MM");
        const data = await getAvailableSlots(monthString);

        if (data.status && data.code === 200) {
          setAvailableSlots(data.data);
        } else {
          toast.error("Failed to fetch available slots");
        }
      } catch (error) {
        console.error("Error fetching available slots:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAvailableSlots();
  }, [currentDate]);

  // Check if a day is available based on API response
  const isDayAvailable = (day) => {
    if (!availableSlots || !availableSlots.days) return false;

    const dayNumber = format(day, "dd");
    return !Object.keys(availableSlots.days).includes(dayNumber);
  };

  // Get available times for a selected day
  const getAvailableTimesForDay = (day) => {
    if (!availableSlots || !availableSlots.days) return [];

    const dayNumber = format(day, "dd");
    return availableSlots.days[dayNumber] || [];
  };

  const getDaysInMonth = () => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    return eachDayOfInterval({ start, end });
  };

  const days = getDaysInMonth();
  const today = new Date();

  // Handle month navigation
  const prevMonth = () => {
    const prevMonthDate = subMonths(currentDate, 1);
    if (!isBefore(startOfMonth(prevMonthDate), startOfMonth(today))) {
      setCurrentDate(prevMonthDate);
    }
  };
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  // Check if previous month button should be disabled
  const isPrevMonthDisabled = () => {
    const prevMonthDate = subMonths(currentDate, 1);
    return isBefore(startOfMonth(prevMonthDate), startOfMonth(today));
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setSelectedTime(null);
    setShowTimeColumn(true);
  };

  const handleTimeSelect = (time) => {
    setSelectedTime(time);
    if (selectedDate && onSelectDateTime) {
      onSelectDateTime(selectedDate, time);
    }
  };

  const handleConfirm = () => {
    setBookingStage("form");
    setback(true);
  };

  const handelBack = () => {
    setBookingStage("calendar");
    setback(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const bookingData = {
      selected_date: format(selectedDate, "yyyy-MM-dd"),
      selected_time: selectedTime,
      ...formData,
    };

    try {
      setIsLoading(true);

      const res = await createBooking(bookingData);
      if (res.status && res.code === 200) {
        setFormData({
          client_name: "",
          client_email: "",
          company: "",
          phone_number: "",
          notes: "",
        });
        setSelectedDate(null);
        setSelectedTime(null);
        if (onBookingComplete) {
          onBookingComplete(bookingData);
        }
      }
    } catch (error) {
      toast.error("Failed to create booking");
      console.error("Error creating booking:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const isDateInPast = (date) => {
    return isBefore(date, today) && !isSameDay(date, today);
  };

  const formattedSelectedDate = selectedDate
    ? format(selectedDate, "EEEE, MMMM d")
    : "";

  return (
    <div className="flex flex-col md:flex-row border rounded-lg shadow-sm overflow-hidden max-w-5xl mx-auto bg-white">
      {/* Left panel - Company info */}
      <div className="border-r border-gray-200 w-full md:w-82 flex flex-col">
        <div className="flex items-center justify-between border-b border-gray-200 py-4 px-6">
          <div className="w-10">
            {back && (
              <button
                onClick={handelBack}
                className="flex items-center borderjustify-center rounded-full p-2 font-bold hover:bg-gray-100 transition-colors"
                aria-label={t.calendar.backButton}
              >
                <ArrowLeft size={20} color="#030250" />
              </button>
            )}
          </div>
          <div className="flex-1 flex justify-center ">
            <Image
              src="/images/logo.png"
              alt={t.calendar.logoAlt}
              width={120}
              height={40}
              className="object-contain"
            />
          </div>
        </div>

        <div className="mt-4 p-6 ">
          <Image
            src={"/images/logo.png"}
            alt={t.calendar.logoAlt}
            width={50}
            height={50}
          />

          <div className="mt-6 ">
            <div className="text-gray-600">{t.calendar.companyName}</div>
            <h2 className="text-xl md:text-2xl font-bold text-slate-800 mb-4">
              {t.calendar.meetingDuration}
            </h2>
          </div>

          <div className="flex items-start mb-4 ">
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
            <span className="text-gray-600 font-semibold text-sm">
              {t.calendar.duration}
            </span>
          </div>

          <div className="flex items-center gap-2 mb-6  ">
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
              {t.calendar.conferencingDetails}
            </span>
          </div>

          <div className="mt-auto ">
            <h3 className="text-primary font-bold mb-2">
              {t.calendar.bookMeeting}
            </h3>
            <p className="text-gray-600 text-sm font-medium">
              {t.calendar.meetingDescription}
            </p>
          </div>
        </div>
      </div>

      {bookingStage === "calendar" ? (
        <>
          {/* Middle panel - Calendar */}
          <div className="p-6 border-r  border-gray-200 w-full md:w-96 flex-shrink-0">
            <div className="flex flex-col h-full gap-6">
              <h2 className="text-xl font-medium text-slate-800">
                {t.calendar.selectDateTime}
              </h2>

              {/* Month navigation */}
              <div className="flex justify-between items-center">
                <button
                  onClick={prevMonth}
                  disabled={isPrevMonthDisabled()}
                  className="p-2 rounded-full hover:bg-gray-100 text-gray-600 disabled:pointer-events-none disabled:opacity-50"
                  aria-label={
                    isRTL ? t.calendar.nextMonth : t.calendar.previousMonth
                  }
                >
                  {isRTL ? (
                    <ChevronRight className="h-5 w-5" />
                  ) : (
                    <ChevronLeft className="h-5 w-5" />
                  )}
                </button>

                <h3 className="text-lg font-medium">
                  {format(currentDate, "MMMM yyyy")}
                </h3>

                <button
                  onClick={nextMonth}
                  className="p-2 rounded-full hover:bg-gray-100 text-gray-600"
                  aria-label={
                    isRTL ? t.calendar.previousMonth : t.calendar.nextMonth
                  }
                >
                  {isRTL ? (
                    <ChevronLeft className="h-5 w-5" />
                  ) : (
                    <ChevronRight className="h-5 w-5" />
                  )}
                </button>
              </div>

              <div className="flex-1 flex items-center justify-center">
                {/* Loading indicator */}
                {loading && (
                  <div className="flex justify-center items-center">
                    <Loader2 className="h-6 w-6 text-primary animate-spin" />
                    <span className="ml-2 text-gray-600">
                      Loading available slots...
                    </span>
                  </div>
                )}

                {/* Calendar grid */}
                {!loading && (
                  <div>
                    {/* Day headers */}
                    <div className="grid grid-cols-7 mb-2">
                      {t.calendar.dayHeaders.map((day) => (
                        <div
                          key={day}
                          className="text-center text-sm font-medium text-gray-600 py-2"
                        >
                          {day}
                        </div>
                      ))}
                    </div>

                    {/* Calendar days */}
                    <div className="grid grid-cols-7 gap-1">
                      {Array.from({ length: days[0].getDay() }).map(
                        (_, index) => (
                          <div
                            key={`empty-start-${index}`}
                            className="h-10 p-1"
                          />
                        )
                      )}

                      {days.map((day) => {
                        const isPast = isDateInPast(day);
                        const isUnavailable = isDayAvailable(day);
                        const isDisabled = isPast || isUnavailable;
                        const isSelected =
                          selectedDate && isSameDay(day, selectedDate);
                        const isCurrentMonth = isSameMonth(day, currentDate);
                        const dayNumber = format(day, "d");

                        const isHighlighted =
                          ["23", "24", "27", "28", "29", "30"].includes(
                            dayNumber
                          ) && !isDisabled;

                        let dayClasses =
                          "h-10 w-10 relative flex items-center justify-center rounded-full text-sm font-medium";

                        if (isDisabled) {
                          dayClasses += " text-gray-300 !cursor-default";
                        } else {
                          dayClasses += " hover:bg-gray-100";
                        }

                        if (isSelected) {
                          dayClasses +=
                            " bg-primary text-white hover:bg-primary/90";
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
                            aria-label={`${dayNumber} ${format(day, "MMMM")}`}
                          >
                            {dayNumber}
                            {isSelected && (
                              <div className="absolute bottom-1.5 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-white rounded-full" />
                            )}
                          </button>
                        );
                      })}

                      {Array.from({
                        length: 6 - days[days.length - 1].getDay(),
                      }).map((_, index) => (
                        <div key={`empty-end-${index}`} className="h-12 p-1" />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Timezone selector */}
              <div>
                <div className="text-gray-700 mb-1 text-sm">Time zone</div>
                <div className="flex items-center text-xs text-gray-800">
                  <Globe className="h-4 w-4 mr-2 text-gray-500" />
                  <span>Africa/Cairo</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right panel - Time slots */}
          <div className="py-6 px-3">
            {showTimeColumn && selectedDate ? (
              <div className="w-full md:w-52 flex-shrink-0 flex flex-col gap-4 h-full">
                <div className="flex-1 flex flex-col">
                  <h3 className="text-lg font-medium text-slate-800 mb-4">
                    {formattedSelectedDate}
                  </h3>

                  <div className="space-y-2 px-2 overflow-y-auto inner-scroll-bar flex-1 max-h-90">
                    {getAvailableTimesForDay(selectedDate).map((time) => {
                      const isPastTime = isBefore(
                        parseISO(
                          `${format(selectedDate, "yyyy-MM-dd")}T${time}`
                        ),
                        new Date()
                      );

                      const timeButtonClasses = `cursor-pointer w-full py-2 border border-primary rounded-md text-center font-medium ${
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

                {selectedDate && selectedTime && (
                  <button
                    onClick={handleConfirm}
                    className="mt-2 w-full py-2 px-4 bg-primary hover:opacity-95 cursor-pointer text-white font-medium rounded-md flex items-center justify-center"
                  >
                    <span>{t.calendar.confirmButton}</span>
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </button>
                )}
              </div>
            ) : (
              <div className="flex flex-col justify-center h-full">
                <h3 className="text-slate-800 font-bold mb-2">
                  {t.calendar.availableTimes}
                </h3>
                <p className="text-gray-500 text-sm">
                  {t.calendar.selectDayPrompt}
                </p>
              </div>
            )}
          </div>
        </>
      ) : (
        // Form view
        <div className="p-6 flex-1">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-800">
              {t.calendar.enterInfo}
            </h2>
            <p className="text-gray-600">
              {t.calendar.bookingFor}{" "}
              <span className="font-bold">
                {selectedDate && format(selectedDate, "MMMM d, yyyy")}
              </span>{" "}
              {t.calendar.at} <span className="font-bold">{selectedTime}</span>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-2.5">
            <div>
              <label
                htmlFor="firstName"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                {t.calendar.nameLabel} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="firstName"
                name="client_name"
                value={formData.client_name}
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
                {t.calendar.emailLabel} <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                id="email"
                name="client_email"
                value={formData.client_email}
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
                {t.calendar.phoneLabel} <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                id="phone"
                name="phone_number"
                placeholder={t.calendar.phonePlaceholder}
                required
                value={formData.phone_number}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label
                htmlFor="company"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                {t.calendar.companyLabel}
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
                {t.calendar.notesLabel}
              </label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder={t.calendar.notesPlaceholder}
              ></textarea>
            </div>

            <button
              disabled={isLoading}
              className="w-full cursor-pointer py-2 px-4 bg-primary hover:opacity-95 text-white font-medium rounded-md flex items-center justify-center disabled:pointer-events-none disabled:opacity-75"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  <span>{t.calendar.bookingInProgress}</span>
                </>
              ) : (
                <>
                  <span>{t.calendar.completeBooking}</span>
                  <Check className="ml-2" />
                </>
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
