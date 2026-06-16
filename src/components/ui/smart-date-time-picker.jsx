"use client";

import { useI18n } from "@/hooks/useI18n";
import { formatDateTimeAmPmShort } from "@/utils/formateDate";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  isBefore,
  isSameDay,
  isSameMonth,
  startOfDay,
  startOfMonth,
  subMonths,
} from "date-fns";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const TIME_SLOTS = (() => {
  const slots = [];
  for (let hour = 8; hour <= 20; hour += 1) {
    slots.push(`${String(hour).padStart(2, "0")}:00`);
    if (hour < 20) slots.push(`${String(hour).padStart(2, "0")}:30`);
  }
  return slots;
})();

function parseValue(value) {
  if (!value) return { date: null, time: null };
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return { date: null, time: null };
  return { date: d, time: format(d, "HH:mm") };
}

function buildLocalValue(date, time) {
  if (!date || !time) return "";
  const [hh, mm] = time.split(":").map(Number);
  const next = new Date(date);
  next.setHours(hh, mm, 0, 0);
  return format(next, "yyyy-MM-dd'T'HH:mm");
}

/**
 * Calendar + time-slot picker with Done to collapse (replaces native datetime-local).
 */
export default function SmartDateTimePicker({
  value,
  onChange,
  required = false,
  className = "",
}) {
  const { translate, locale, t } = useI18n();
  const isRTL = t?.direction === "rtl";

  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);

  const dayHeaders =
    t?.calendar?.dayHeaders ||
    ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

  useEffect(() => {
    if (!open) return;
    const parsed = parseValue(value);
    if (parsed.date) {
      setSelectedDate(parsed.date);
      setSelectedTime(parsed.time);
      setMonth(startOfMonth(parsed.date));
    }
  }, [open, value]);

  const today = startOfDay(new Date());
  const days = useMemo(
    () => eachDayOfInterval({ start: startOfMonth(month), end: endOfMonth(month) }),
    [month],
  );

  const leadingEmpty = days[0]?.getDay() ?? 0;

  const isPrevMonthDisabled = isBefore(
    startOfMonth(subMonths(month, 1)),
    startOfMonth(today),
  );

  const displayLabel = useMemo(() => {
    if (!value) return "";
    return formatDateTimeAmPmShort(value, locale);
  }, [value, locale]);

  const canConfirm = selectedDate != null && selectedTime != null;

  const handleDone = () => {
    if (!canConfirm) return;
    onChange?.(buildLocalValue(selectedDate, selectedTime));
    setOpen(false);
  };

  const handleOpen = () => setOpen(true);

  return (
    <div className={`relative ${className}`}>
      {!open ? (
        <button
          type="button"
          onClick={handleOpen}
          className={`w-full flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm text-start transition-colors ${
            value
              ? "border-primary/25 bg-primary/5 text-gray-900"
              : "border-gray-200 bg-white text-gray-500 hover:border-primary/30 hover:bg-gray-50"
          }`}
          aria-expanded={false}
          aria-haspopup="dialog"
        >
          <Calendar
            className={`w-4 h-4 shrink-0 ${value ? "text-primary" : "text-gray-400"}`}
            aria-hidden
          />
          <span className="flex-1 min-w-0 truncate">
            {displayLabel ||
              translate("matchPage.pickDateTime", "Choose date and time")}
          </span>
          <span className="text-xs font-medium text-primary shrink-0">
            {translate(
              value ? "matchPage.changeDateTime" : "matchPage.openDateTime",
              value ? "Change" : "Select",
            )}
          </span>
        </button>
      ) : (
        <div
          role="dialog"
          aria-label={translate("matchPage.pickDateTime", "Choose date and time")}
          className="rounded-xl border border-gray-200 bg-white shadow-md overflow-hidden"
        >
          <div className="flex flex-col sm:flex-row sm:max-h-[min(70vh,420px)]">
            <div className="p-3 sm:p-4 sm:w-[min(100%,280px)] sm:border-e border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <button
                  type="button"
                  onClick={() => setMonth(subMonths(month, 1))}
                  disabled={isPrevMonthDisabled}
                  className="icon-btn h-8 w-8 rounded-full text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:pointer-events-none"
                  aria-label={translate("calendar.previousMonth", "Previous month")}
                >
                  {isRTL ? (
                    <ChevronRight className="w-5 h-5" />
                  ) : (
                    <ChevronLeft className="w-5 h-5" />
                  )}
                </button>
                <span className="text-sm font-semibold text-gray-800">
                  {format(month, "MMMM yyyy")}
                </span>
                <button
                  type="button"
                  onClick={() => setMonth(addMonths(month, 1))}
                  className="icon-btn h-8 w-8 rounded-full text-gray-600 hover:bg-gray-100"
                  aria-label={translate("calendar.nextMonth", "Next month")}
                >
                  {isRTL ? (
                    <ChevronLeft className="w-5 h-5" />
                  ) : (
                    <ChevronRight className="w-5 h-5" />
                  )}
                </button>
              </div>

              <div className="grid grid-cols-7 gap-0.5 mb-1">
                {dayHeaders.map((day) => (
                  <div
                    key={day}
                    className="text-center text-[10px] font-semibold text-gray-400 py-1"
                  >
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-0.5">
                {Array.from({ length: leadingEmpty }).map((_, i) => (
                  <div key={`pad-${i}`} className="h-9" />
                ))}
                {days.map((day) => {
                  const isPast = isBefore(startOfDay(day), today);
                  const isSelected = selectedDate && isSameDay(day, selectedDate);
                  const inMonth = isSameMonth(day, month);
                  return (
                    <button
                      key={day.toISOString()}
                      type="button"
                      disabled={isPast}
                      onClick={() => {
                        setSelectedDate(day);
                        if (!selectedTime) setSelectedTime("10:00");
                      }}
                      className={`h-9 w-full rounded-full text-sm font-medium transition-colors ${
                        isPast
                          ? "text-gray-300 cursor-not-allowed"
                          : isSelected
                            ? "bg-primary text-white"
                            : inMonth
                              ? "text-gray-800 hover:bg-primary/10"
                              : "text-gray-400 hover:bg-gray-50"
                      }`}
                    >
                      {format(day, "d")}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex-1 min-h-0 border-t sm:border-t-0 sm:border-s border-gray-100 p-3 sm:p-4 flex flex-col">
              <p className="text-xs font-semibold text-gray-600 mb-2">
                {translate("calendar.availableTimes", "Available times")}
              </p>
              {!selectedDate ? (
                <p className="text-xs text-gray-400 flex-1">
                  {translate("calendar.selectDayPrompt", "Select a day to see available times.")}
                </p>
              ) : (
                <div className="flex-1 min-h-0 overflow-y-auto -mx-1 px-1">
                  <div className="grid grid-cols-3 sm:grid-cols-2 gap-1.5">
                    {TIME_SLOTS.map((slot) => {
                      const active = selectedTime === slot;
                      return (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => setSelectedTime(slot)}
                          className={`px-2 py-2 rounded-lg text-xs font-medium border transition-colors ${
                            active
                              ? "border-primary bg-primary text-white"
                              : "border-gray-200 text-gray-700 hover:border-primary/40 hover:bg-primary/5"
                          }`}
                        >
                          {slot}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 px-3 py-2.5 border-t border-gray-100 bg-gray-50/80">
            {selectedDate && selectedTime ? (
              <p className="text-xs text-gray-600 truncate min-w-0" dir="ltr">
                <span className="font-medium text-gray-800">
                  {format(selectedDate, "EEE, MMM d")}
                </span>
                <span className="mx-1 text-gray-400">·</span>
                <span>{selectedTime}</span>
              </p>
            ) : (
              <p className="text-xs text-gray-400">
                {translate("matchPage.pickDateTime", "Choose date and time")}
              </p>
            )}
            <button
              type="button"
              onClick={handleDone}
              disabled={!canConfirm}
              className="shrink-0 px-4 py-1.5 bg-primary text-white text-sm font-medium rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
            >
              {translate("matchPage.dateTimeDone", "Done")}
            </button>
          </div>
        </div>
      )}

      {required && !value && !open && (
        <input
          type="text"
          tabIndex={-1}
          className="sr-only"
          value=""
          readOnly
          required
          aria-hidden
        />
      )}
    </div>
  );
}
