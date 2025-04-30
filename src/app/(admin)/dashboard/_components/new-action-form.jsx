"use client";

import { useActionState, useEffect, useState, useMemo } from "react";
import { addNewAction } from "../_actions/actions";
import { Loader2, Clock, Calendar } from "lucide-react";
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
  const [showAmPm, setShowAmPm] = useState(false);
  
  const ACTIONS = useMemo(() => [
    { value: "Office visit", label: t.actionForm.actions.officeVisit },
    { value: "Make a call", label: t.actionForm.actions.makeCall },
    { value: "Property view", label: t.actionForm.actions.propertyView },
    { value: "Not interested", label: t.actionForm.actions.notInterested },
    { value: "Not qualified", label: t.actionForm.actions.notQualified },
    { value: "Follow up later", label: t.actionForm.actions.followUpLater },
    { value: "Missing requirement", label: t.actionForm.actions.missingRequirement },
  ], [t]);

  // Convert 24h to 12h format
  const to12HourFormat = (time24) => {
    if (!time24) return { hours: 12, minutes: 0, ampm: 'AM' };
    
    const [hours, minutes] = time24.split(':').map(Number);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12;
    
    return {
      hours: hours12,
      minutes,
      ampm,
      formatted: `${String(hours12).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${ampm}`
    };
  };

  // Convert 12h to 24h format
  const to24HourFormat = (hours, minutes, ampm) => {
    let hours24 = parseInt(hours, 10);
    if (ampm === 'PM' && hours24 < 12) hours24 += 12;
    if (ampm === 'AM' && hours24 === 12) hours24 = 0;
    
    return `${String(hours24).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  };

  // Get current time in 24h format
  const getDefaultTime = () => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  };

  // Get current date
  const getDefaultDate = () => {
    const now = new Date();
    return now.toISOString().split('T')[0];
  };

  const [formData, setFormData] = useState({
    action: ACTIONS[0].value,
    comment: "",
    meeting_date: getDefaultDate(),
    meeting_time: getDefaultTime(),
    client_id: clientId
  });

  const [timeInput, setTimeInput] = useState(
    to12HourFormat(getDefaultTime()).formatted
  );

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
        client_id: clientId
      });
      setTimeInput(to12HourFormat(defaultTime).formatted);
      onSuccess();
    } else if (state.message) {
      toast.error(state.message || t.actionForm.errorMessage, {
        position: "top-right",
      });
    }
  }, [state, userId, onSuccess, t, ACTIONS, clientId]);

  const handleTimeChange = (e) => {
    const value = e.target.value;
    setTimeInput(value);
    
    // Try to parse the input
    const match = value.match(/^(\d{1,2}):(\d{2})\s?(AM|PM)?$/i) || 
                 value.match(/^(\d{1,2})\s?(AM|PM)?$/i);
    
    if (match) {
      let hours = match[1] || '12';
      let minutes = match[2] || '00';
      let ampm = (match[3] || '').toUpperCase();
      
      // If user typed just "2" and then "P", convert to "2:00 PM"
      if (!minutes && ampm) {
        minutes = '00';
      }
      
      // If no AM/PM specified but hours > 12, assume PM
      if (!ampm && parseInt(hours) > 12) {
        ampm = 'PM';
      } else if (!ampm) {
        ampm = 'AM';
      }
      
      // Convert to 24h format
      const time24 = to24HourFormat(hours, minutes, ampm);
      setFormData(prev => ({ ...prev, meeting_time: time24 }));
      
      // Update display with formatted time
      const formatted = to12HourFormat(time24).formatted;
      if (formatted !== value) {
        setTimeout(() => setTimeInput(formatted), 10);
      }
    }
  };

  const handleAmPmToggle = () => {
    const current = to12HourFormat(formData.meeting_time);
    const newAmpm = current.ampm === 'AM' ? 'PM' : 'AM';
    const time24 = to24HourFormat(current.hours, current.minutes, newAmpm);
    
    setFormData(prev => ({ ...prev, meeting_time: time24 }));
    setTimeInput(to12HourFormat(time24).formatted);
  };

  const handleDateChange = (e) => {
    setFormData({
      ...formData,
      meeting_date: e.target.value || getDefaultDate()
    });
  };

  const getFullMeetingDateTime = () => {
    const date = formData.meeting_date || getDefaultDate();
    const time = formData.meeting_time || getDefaultTime();
    return `${date}T${time}`;
  };

  return (
    <form className="p-3" action={action}>
      <input type="hidden" name="user_id" value={userId} />
      <input type="hidden" name="phone_number" value={""} />
      <input type="hidden" name="client_id" value={clientId} />
      <input type="hidden" name="meeting_time" value={getFullMeetingDateTime()} />

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
          <div className="relative flex items-center">
            <input
              type="text"
              value={timeInput}
              onChange={handleTimeChange}
              className="w-full border border-gray-300 rounded-md p-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 pr-16"
              placeholder="HH:MM AM/PM"
            />
            <button
              type="button"
              onClick={handleAmPmToggle}
              className="absolute right-8 px-2 text-sm text-gray-600 hover:text-blue-600"
            >
              {to12HourFormat(formData.meeting_time).ampm}
            </button>
            <Clock className="h-4 w-4 text-gray-500 absolute right-2.5 pointer-events-none" />
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
          onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
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