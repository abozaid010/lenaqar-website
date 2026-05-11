"use client";

import { useI18n } from "@/context/translate-api";
import { USER_ACTIONS, getActionLabel } from "@/utils/actions";
import { LenaCookiesManager } from "@/lib/LenaCookiesManager";
import { ChevronDown, ChevronUp, Clock, Loader2 } from "lucide-react";
import { useActionState, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { addNewAction } from "../_actions/actions";

const initialState = {
  success: false,
  message: "",
};

export default function NewActionForm({
  userId,
  phoneNumber = "",
  name = "",
  onSuccess,
  onActionUpdate,
}) {
  const { t, locale } = useI18n();
  const [state, action, pending] = useActionState(addNewAction, initialState);
  const clientId = LenaCookiesManager.getClientId();

  // Get actions suitable for the action form (excluding "all" and null values)
  const ACTIONS = USER_ACTIONS.filter(
    (action) => action.value && action.value !== "" && action.value !== null
  ).map((action) => ({
    label: getActionLabel(action.value, locale),
    value: action.value,
  }));

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

    return `${String(hours24).padStart(2, "0")}:${String(
      minutes || "00"
    ).padStart(2, "0")}`;
  };

  // Get current time in 24h format
  const getDefaultTime = () => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, "0")}:${String(
      now.getMinutes()
    ).padStart(2, "0")}`;
  };

  // Get current date
  const getDefaultDate = () => {
    const now = new Date();
    return now.toISOString().split("T")[0];
  };

  const [formData, setFormData] = useState({
    action: ACTIONS[0]?.value || "Make a call",
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

      // Update the action in the table
      if (onActionUpdate && userId) {
        onActionUpdate(userId, formData.action);
      }

      const defaultTime = getDefaultTime();
      setFormData({
        action: ACTIONS[0]?.value || "Make a call",
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
  }, [
    state,
    t,
    onActionUpdate,
    userId,
    formData.action,
    onSuccess,
    clientId,
    ACTIONS,
  ]);

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
    <form className="p-4 bg-gray-50/30 rounded-b-lg border-t border-gray-100" action={action}>
      <input type="hidden" name="user_id" value={userId || ""} />
      <input type="hidden" name="name" value={name || ""} />
      <input type="hidden" name="phone_number" value={phoneNumber || ""} />
      <input type="hidden" name="client_id" value={clientId || ""} />
      <input
        type="hidden"
        name="meeting_time"
        value={getFullMeetingDateTime()}
      />

      {/* Date & Time Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">
            {t.actionForm.dateLabel}
          </label>
          <input
            type="date"
            value={formData.meeting_date}
            onChange={handleDateChange}
            className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">
            {t.actionForm.timeLabel}
          </label>
          <div className="flex items-center bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
            {/* Hours */}
            <div className="relative flex-1 group">
              <input
                type="text"
                value={timeState.hours}
                onChange={handleTimeChange("hours")}
                onKeyDown={handleTimeArrowKeys("hours")}
                onBlur={handleTimeBlur("hours")}
                className="w-full py-2.5 text-center text-sm font-semibold focus:outline-none bg-transparent"
                placeholder="HH"
                maxLength={2}
                inputMode="numeric"
              />
              <div className="absolute right-1 top-1/2 -translate-y-1/2 flex flex-col opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  onClick={() => handleTimeAdjustment("hours", "up")}
                  className="p-0.5 hover:bg-gray-100 rounded text-gray-400 hover:text-primary"
                >
                  <ChevronUp size={12} />
                </button>
                <button
                  type="button"
                  onClick={() => handleTimeAdjustment("hours", "down")}
                  className="p-0.5 hover:bg-gray-100 rounded text-gray-400 hover:text-primary"
                >
                  <ChevronDown size={12} />
                </button>
              </div>
            </div>

            <span className="text-gray-300 font-bold">:</span>

            {/* Minutes */}
            <div className="relative flex-1 group">
              <input
                type="text"
                value={timeState.minutes}
                onChange={handleTimeChange("minutes")}
                onKeyDown={handleTimeArrowKeys("minutes")}
                onBlur={handleTimeBlur("minutes")}
                className="w-full py-2.5 text-center text-sm font-semibold focus:outline-none bg-transparent"
                placeholder="MM"
                maxLength={2}
                inputMode="numeric"
              />
              <div className="absolute right-1 top-1/2 -translate-y-1/2 flex flex-col opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  onClick={() => handleTimeAdjustment("minutes", "up")}
                  className="p-0.5 hover:bg-gray-100 rounded text-gray-400 hover:text-primary"
                >
                  <ChevronUp size={12} />
                </button>
                <button
                  type="button"
                  onClick={() => handleTimeAdjustment("minutes", "down")}
                  className="p-0.5 hover:bg-gray-100 rounded text-gray-400 hover:text-primary"
                >
                  <ChevronDown size={12} />
                </button>
              </div>
            </div>

            {/* AM/PM */}
            <button
              type="button"
              onClick={handleAmPmToggle}
              className="px-3 py-2.5 text-xs font-bold bg-gray-50 border-l border-gray-100 text-primary hover:bg-primary/5 transition-colors focus:outline-none"
            >
              {timeState.ampm}
            </button>
            
            <div className="px-2 border-l border-gray-100">
              <Clock size={14} className="text-gray-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Action Selection */}
      <div className="mb-4">
        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">
          Action Type
        </label>
        <div className="relative">
          <select
            name="action"
            className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary appearance-none transition-all shadow-sm"
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
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
            <ChevronDown size={16} />
          </div>
        </div>
      </div>

      {/* Comment */}
      <div className="mb-6">
        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">
          Notes / Comments
        </label>
        <textarea
          name="comment"
          className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm resize-none"
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
        className="w-full flex justify-center items-center text-white px-4 py-3 rounded-xl bg-primary hover:bg-primary/90 transition-all shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed font-semibold text-sm"
      >
        {pending ? <Loader2 className="animate-spin mr-2" size={18} /> : null}
        {pending ? t.actionForm.submittingButton : t.actionForm.submitButton}
      </button>
    </form>
  );
}
