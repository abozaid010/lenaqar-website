"use client";

import { useActionState, useEffect, useState, useMemo } from "react";
import { addNewAction } from "../_actions/actions";
import { Loader2, Clock, Calendar, ChevronUp, ChevronDown } from "lucide-react";
import toast from "react-hot-toast";
import Cookies from "js-cookie";
import { useI18n } from "@/context/translate-api";

const initialState = {
  success: false,
  message: "",
};

export default function NewActionForm({ userId, onSuccess }) {
  const { t } = useI18n();
  const [state, action, pending] = useActionState(addNewAction, initialState);
  const clientId = Cookies.get("client_id");

  const ACTIONS = useMemo(
    () => [
      { value: "Office visit", label: t.actionForm.actions.officeVisit },
      { value: "Make a call", label: t.actionForm.actions.makeCall },
      { value: "Property view", label: t.actionForm.actions.propertyView },
      { value: "Not interested", label: t.actionForm.actions.notInterested },
      { value: "Not qualified", label: t.actionForm.actions.notQualified },
      { value: "Follow up later", label: t.actionForm.actions.followUpLater },
      {
        value: "Missing requirement",
        label: t.actionForm.actions.missingRequirement,
      },
      { label: "Blocked", value: "Blocked" },
    ],
    [t]
  );

  // Convert 24h to 12h format
  const to12HourFormat = (time24) => {
    if (!time24) return { hours: "12", minutes: "00", ampm: "AM" };

    const [hours, minutes] = time24.split(":").map(Number);
    const ampm = hours >= 12 ? "PM" : "AM";
    const hours12 = hours % 12 || 12;

    return {
      hours: String(hours12).padStart(2, "0"),
      minutes: String(minutes).padStart(2, "0"),
      ampm,
    };
  };

  // Convert 12h to 24h format
  const to24HourFormat = (hours, minutes, ampm) => {
    let hours24 = parseInt(hours, 10) || 12;
    if (ampm === "PM" && hours24 < 12) hours24 += 12;
    if (ampm === "AM" && hours24 === 12) hours24 = 0;

    return `${String(hours24).padStart(2, "0")}:${String(minutes || "00").padStart(2, "0")}`;
  };

  // Get current time in 24h format
  const getDefaultTime = () => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  };

  // Get current date
  const getDefaultDate = () => {
    const now = new Date();
    return now.toISOString().split("T")[0];
  };

  const [formData, setFormData] = useState({
    action: ACTIONS[0].value,
    comment: "",
    meeting_date: getDefaultDate(),
    meeting_time: getDefaultTime(),
    client_id: clientId,
  });

  const [timeState, setTimeState] = useState(() => {
    const converted = to12HourFormat(getDefaultTime());
    return {
      hours: converted.hours,
      minutes: converted.minutes,
      ampm: converted.ampm,
    };
  });

  useEffect(() => {
    if (state.success) {
      toast.success(t.actionForm.successMessage, {
        duration: 3000,
        position: "top-right",
      });
      const defaultTime = getDefaultTime();
      setFormData({
        action: ACTIONS[0].value,
        comment: "",
        meeting_date: getDefaultDate(),
        meeting_time: defaultTime,
        client_id: clientId,
      });

      const converted = to12HourFormat(defaultTime);
      setTimeState({
        hours: converted.hours,
        minutes: converted.minutes,
        ampm: converted.ampm,
      });

      onSuccess();
    } else if (state.message) {
      toast.error(state.message || t.actionForm.errorMessage, {
        position: "top-right",
      });
    }
  }, [state, userId, onSuccess, t, ACTIONS, clientId]);

  // Update 24-hour time in formData whenever any time component changes
  useEffect(() => {
    const time24 = to24HourFormat(
      timeState.hours,
      timeState.minutes,
      timeState.ampm
    );
    setFormData((prev) => ({ ...prev, meeting_time: time24 }));
  }, [timeState]);

  const handleTimeChange = (field) => (e) => {
    const value = e.target.value;

    // Allow empty value for better UX during editing
    if (value === "") {
      setTimeState((prev) => ({ ...prev, [field]: "" }));
      return;
    }

    // Only allow digits
    const digitsOnly = value.replace(/\D/g, "");

    // Limit to 2 digits
    if (digitsOnly.length > 2) return;

    // Validate values
    let finalValue = digitsOnly;

    if (field === "hours") {
      // Hours must be between 1-12
      const numValue = parseInt(digitsOnly, 10);
      if (numValue > 12) finalValue = "12";
      if (numValue < 1 && digitsOnly.length === 2) finalValue = "01";
    } else if (field === "minutes") {
      // Minutes must be between 00-59
      const numValue = parseInt(digitsOnly, 10);
      if (numValue > 59) finalValue = "59";
    }

    setTimeState((prev) => ({ ...prev, [field]: finalValue }));
  };

  // Handle arrow up/down keys and buttons
  const handleTimeAdjustment = (field, direction) => {
    const step = direction === "up" ? 1 : -1;

    if (field === "hours") {
      let newValue = parseInt(timeState.hours || "12", 10) + step;
      // Wrap around 12-1
      if (newValue > 12) newValue = 1;
      if (newValue < 1) newValue = 12;
      setTimeState((prev) => ({
        ...prev,
        hours: String(newValue).padStart(2, "0"),
      }));
    } else if (field === "minutes") {
      let newMinutes = parseInt(timeState.minutes || "00", 10) + step;
      let newHours = parseInt(timeState.hours || "12", 10);

      // Handle minute overflow
      if (newMinutes > 59) {
        newMinutes = 0;
        newHours += 1;
        if (newHours > 12) newHours = 1;
      }
      // Handle minute underflow
      else if (newMinutes < 0) {
        newMinutes = 59;
        newHours -= 1;
        if (newHours < 1) newHours = 12;
      }

      setTimeState((prev) => ({
        ...prev,
        hours: String(newHours).padStart(2, "0"),
        minutes: String(newMinutes).padStart(2, "0"),
      }));
    } else if (field === "ampm") {
      setTimeState((prev) => ({
        ...prev,
        ampm: prev.ampm === "AM" ? "PM" : "AM",
      }));
    }
  };

  const handleTimeArrowKeys = (field) => (e) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      handleTimeAdjustment(field, "up");
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      handleTimeAdjustment(field, "down");
    }
  };

  const handleAmPmToggle = () => {
    handleTimeAdjustment("ampm", "toggle");
  };

  const handleDateChange = (e) => {
    setFormData({
      ...formData,
      meeting_date: e.target.value || getDefaultDate(),
    });
  };

  const getFullMeetingDateTime = () => {
    const date = formData.meeting_date || getDefaultDate();
    const time = formData.meeting_time || getDefaultTime();
    return `${date}T${time}`;
  };

  // Format time values on blur
  const handleTimeBlur = (field) => () => {
    if (field === "hours") {
      setTimeState((prev) => ({
        ...prev,
        hours: String(parseInt(prev.hours || "12")).padStart(2, "0"),
      }));
    } else if (field === "minutes") {
      setTimeState((prev) => ({
        ...prev,
        minutes: String(parseInt(prev.minutes || "0")).padStart(2, "0"),
      }));
    }
  };

  return (
    <form className="p-3" action={action}>
      <input type="hidden" name="user_id" value={userId} />
      <input type="hidden" name="phone_number" value={""} />
      <input type="hidden" name="client_id" value={clientId} />
      <input
        type="hidden"
        name="meeting_time"
        value={getFullMeetingDateTime()}
      />

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t.actionForm.dateLabel}
          </label>
          <div className="relative">
            <input
              type="date"
              value={formData.meeting_date}
              onChange={handleDateChange}
              className="w-full border border-gray-300 rounded-md p-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 pr-8"
            />
            <Calendar className="h-4 w-4 text-gray-500 absolute right-2.5 top-2.5 pointer-events-none" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t.actionForm.timeLabel}
          </label>
          <div className="relative flex items-center border border-gray-300 rounded-md overflow-hidden">
            <div className="relative flex items-center">
              <input
                type="text"
                value={timeState.hours}
                onChange={handleTimeChange("hours")}
                onKeyDown={handleTimeArrowKeys("hours")}
                onBlur={handleTimeBlur("hours")}
                className="w-12 p-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-center border-r border-gray-300"
                placeholder="HH"
                maxLength={2}
                inputMode="numeric"
              />
              <div className="absolute right-1 flex flex-col space-y-0.5">
                <button
                  type="button"
                  onClick={() => handleTimeAdjustment("hours", "up")}
                  className="h-3 w-3 flex items-center justify-center p-0.5 rounded hover:bg-gray-200"
                >
                  <ChevronUp className="h-2.5 w-2.5 text-gray-500" />
                </button>
                <button
                  type="button"
                  onClick={() => handleTimeAdjustment("hours", "down")}
                  className="h-3 w-3 flex items-center justify-center p-0.5 rounded hover:bg-gray-200"
                >
                  <ChevronDown className="h-2.5 w-2.5 text-gray-500" />
                </button>
              </div>
            </div>

            <span className="px-1 text-gray-700">:</span>

            <div className="relative flex items-center gap-2  space-x-0.5">
              <input
                type="text"
                value={timeState.minutes}
                onChange={handleTimeChange("minutes")}
                onKeyDown={handleTimeArrowKeys("minutes")}
                onBlur={handleTimeBlur("minutes")}
                className="w-12 p-2 text-sm focus:outline-none  focus:ring-1 focus:ring-blue-500 text-center border-r border-gray-300"
                placeholder="MM"
                maxLength={2}
                inputMode="numeric"
              />
              <div className="absolute right-1 flex flex-col   space-y-0.5">
                <button
                  type="button"
                  onClick={() => handleTimeAdjustment("minutes", "up")}
                  className="h-3 w-3 flex items-center justify-center p-0.5 rounded hover:bg-gray-200"
                >
                  <ChevronUp className="h-2.5 w-2.5 text-gray-500" />
                </button>
                <button
                  type="button"
                  onClick={() => handleTimeAdjustment("minutes", "down")}
                  className="h-3 w-3 flex items-center justify-center p-0.5 rounded hover:bg-gray-200"
                >
                  <ChevronDown className="h-2.5 w-2.5 text-gray-500" />
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={handleAmPmToggle}
              onKeyDown={handleTimeArrowKeys("ampm")}
              className="ml-1 px-2 py-2 text-sm text-center text-gray-600 hover:text-blue-600 bg-gray-100 flex-grow focus:outline-none focus:ring-1 focus:ring-blue-500 relative"
            >
              {timeState.ampm}
              <div className="absolute right-6 top-[8px] flex items-center flex-col gap-y-0.5">
                <ChevronUp className="h-2.5 w-2.5 text-gray-500" />
                <ChevronDown className="h-2.5 w-2.5 text-gray-500" />
              </div>
            </button>
            <span className="px-2 flex items-center">
              <Clock className="h-4 w-4 text-gray-500 pointer-events-none" />
            </span>
          </div>
        </div>
      </div>

      <div className="mb-4">
        <select
          name="action"
          className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-700 hover:bg-gray-100 text-sm mb-3"
          value={formData.action}
          onChange={(e) => setFormData({ ...formData, action: e.target.value })}
          required
        >
          {ACTIONS.map((action) => (
            <option key={action.value} value={action.value}>
              {action.label}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-4">
        <textarea
          name="comment"
          className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-blue-500 w-full text-gray-700 hover:bg-gray-100 text-sm"
          placeholder={t.actionForm.commentPlaceholder}
          rows="3"
          value={formData.comment}
          onChange={(e) =>
            setFormData({ ...formData, comment: e.target.value })
          }
        />
      </div>

      <button
        disabled={pending}
        className="w-full flex justify-center items-center bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 cursor-pointer disabled:opacity-60 disabled:cursor-auto disabled:hover:bg-blue-500 transition-colors"
      >
        {pending ? <Loader2 className="animate-spin mr-2" size={18} /> : null}
        {pending ? t.actionForm.submittingButton : t.actionForm.submitButton}
      </button>
    </form>
  );
}
