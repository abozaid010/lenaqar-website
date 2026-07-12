"use client";

import { useI18n } from "@/hooks/useI18n";
import { USER_ACTIONS, getActionLabel } from "@/utils/actions";
import { LenaCookiesManager } from "@/lib/LenaCookiesManager";
import { ChevronDown, ChevronUp, Clock, Loader2 } from "lucide-react";
import { useActionState, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { addNewAction } from "../_actions/actions";
import { updateUserAction } from "@/utils/api";

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
  /** Pre-fill when opening from schedule (or similar); creates a new action on submit. */
  defaultAction = null,
  defaultComment = null,
  defaultMeetingDate = null,
  defaultMeetingTime = null,
  submitButtonLabel = null,
  useUpdateApi = false,
  /** Show "Add New Action" heading above fields. */
  showHeading = false,
  /** Pin Save to the bottom of the composer on mobile. */
  stickySubmit = false,
  /**
   * Field order:
   * - "action": Action Type → Notes → Date/Time (Actions modal)
   * - "schedule": Date/Time → Action → Notes (schedule edit flows)
   */
  fieldPriority = "action",
  /** Elevated composer styling for the Actions modal. */
  composerLayout = false,
}) {
  const { translate, locale, t } = useI18n();
  const [state, action, pending] = useActionState(addNewAction, initialState);
  const clientId = LenaCookiesManager.getClientId();
  const clientInfo = LenaCookiesManager.getClientInfo();
  // Same author convention as the bulk action flow so the persisted record and
  // the optimistic timeline entry agree on who logged the action.
  const author =
    (typeof clientInfo?.email === "string" && clientInfo.email.trim()) ||
    (typeof clientInfo?.name === "string" && clientInfo.name.trim()) ||
    "";
  const [updating, setUpdating] = useState(false);
  /** Collapse optional schedule in the Actions composer so Save stays above the fold. */
  const [scheduleOpen, setScheduleOpen] = useState(
    !(composerLayout && fieldPriority === "action")
  );
  const notesRef = useRef(null);
  const lastHandledSuccessRef = useRef(null);

  const ACTIONS = USER_ACTIONS.filter(
    (actionItem) => actionItem.value && actionItem.value !== "new"
  ).map((actionItem) => ({
    label: getActionLabel(actionItem.value, locale),
    value: actionItem.value,
  }));

  const getDefaultDate = () => {
    const now = new Date();
    return now.toISOString().split("T")[0];
  };

  const getDefaultTime = () => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, "0")}:${String(
      now.getMinutes()
    ).padStart(2, "0")}`;
  };

  const initialMeetingDate = defaultMeetingDate || getDefaultDate();
  const initialMeetingTime = defaultMeetingTime || getDefaultTime();

  const pickInitialAction = () => {
    const first = ACTIONS[0]?.value || "Make a call";
    if (defaultAction && ACTIONS.some((a) => a.value === defaultAction)) {
      return defaultAction;
    }
    return first;
  };

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

  const to24HourFormat = (hours, minutes, ampm) => {
    let hours24 = parseInt(hours, 10) || 12;
    if (ampm === "PM" && hours24 < 12) hours24 += 12;
    if (ampm === "AM" && hours24 === 12) hours24 = 0;

    return `${String(hours24).padStart(2, "0")}:${String(
      minutes || "00"
    ).padStart(2, "0")}`;
  };

  const [formData, setFormData] = useState(() => ({
    action: pickInitialAction(),
    comment: defaultComment ?? "",
    meeting_date: initialMeetingDate,
    meeting_time: initialMeetingTime,
    client_id: clientId,
  }));

  const [timeState, setTimeState] = useState(() => {
    const converted = to12HourFormat(initialMeetingTime);
    return {
      hours: converted.hours,
      minutes: converted.minutes,
      ampm: converted.ampm,
    };
  });

  const resetForm = () => {
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

    if (notesRef.current) {
      notesRef.current.style.height = "auto";
    }
  };

  useEffect(() => {
    if (!state.success) {
      if (state.message) {
        toast.error(
          state.message ||
            translate(
              "actionForm.errorMessage",
              t?.actionForm?.errorMessage || "Failed to add action"
            ),
          { position: "top-right" }
        );
      }
      return;
    }

    // Prefer submittedAt so consecutive saves each trigger refresh/clear.
    const successKey = state.submittedAt ?? `${state.message}-${Date.now()}`;
    if (lastHandledSuccessRef.current === successKey) return;
    lastHandledSuccessRef.current = successKey;

    toast.success(
      translate(
        "actionForm.successMessage",
        t?.actionForm?.successMessage || "Action added successfully"
      ),
      {
        duration: 3000,
        position: "top-right",
      }
    );

    // Prefer the persisted action echoed by the server; fall back to a locally
    // built record so consumers can append optimistically without a refetch.
    const createdAction =
      state.action && state.action.action
        ? state.action
        : {
            action: formData.action,
            comment: formData.comment,
            created_at: new Date().toISOString(),
            meeting_time: getFullMeetingDateTime(),
            author,
          };

    if (onActionUpdate && userId) {
      onActionUpdate(userId, createdAction.action, createdAction);
    }

    resetForm();
    onSuccess?.(createdAction);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- keyed on success identity
  }, [state.success, state.message, state.submittedAt]);

  useEffect(() => {
    const time24 = to24HourFormat(
      timeState.hours,
      timeState.minutes,
      timeState.ampm
    );
    setFormData((prev) => ({ ...prev, meeting_time: time24 }));
  }, [timeState]);

  const autoGrowNotes = (el) => {
    if (!el) return;
    el.style.height = "auto";
    const max = 220;
    el.style.height = `${Math.min(el.scrollHeight, max)}px`;
  };

  const handleTimeChange = (field) => (e) => {
    const value = e.target.value;

    if (value === "") {
      setTimeState((prev) => ({ ...prev, [field]: "" }));
      return;
    }

    const digitsOnly = value.replace(/\D/g, "");
    if (digitsOnly.length > 2) return;

    let finalValue = digitsOnly;

    if (field === "hours") {
      const numValue = parseInt(digitsOnly, 10);
      if (numValue > 12) finalValue = "12";
      if (numValue < 1 && digitsOnly.length === 2) finalValue = "01";
    } else if (field === "minutes") {
      const numValue = parseInt(digitsOnly, 10);
      if (numValue > 59) finalValue = "59";
    }

    setTimeState((prev) => ({ ...prev, [field]: finalValue }));
  };

  const handleTimeAdjustment = (field, direction) => {
    const step = direction === "up" ? 1 : -1;

    if (field === "hours") {
      let newValue = parseInt(timeState.hours || "12", 10) + step;
      if (newValue > 12) newValue = 1;
      if (newValue < 1) newValue = 12;
      setTimeState((prev) => ({
        ...prev,
        hours: String(newValue).padStart(2, "0"),
      }));
    } else if (field === "minutes") {
      let newMinutes = parseInt(timeState.minutes || "00", 10) + step;
      let newHours = parseInt(timeState.hours || "12", 10);

      if (newMinutes > 59) {
        newMinutes = 0;
        newHours += 1;
        if (newHours > 12) newHours = 1;
      } else if (newMinutes < 0) {
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

  const handleTimeBlur = (field) => () => {
    if (field === "hours") {
      setTimeState((prev) => ({
        ...prev,
        hours: String(parseInt(prev.hours || "12", 10)).padStart(2, "0"),
      }));
    } else if (field === "minutes") {
      setTimeState((prev) => ({
        ...prev,
        minutes: String(parseInt(prev.minutes || "0", 10)).padStart(2, "0"),
      }));
    }
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    if (!userId) return;

    try {
      setUpdating(true);
      await updateUserAction(userId, {
        action: formData.action,
        comment: formData.comment,
        meeting_time: getFullMeetingDateTime(),
        phone_number: phoneNumber || "",
        name: name || "",
      });

      toast.success(
        translate(
          "schaduall.updateActionSuccess",
          t?.schaduall?.updateActionSuccess || "Action updated successfully"
        ),
        {
          duration: 3000,
          position: "top-right",
        }
      );

      if (onActionUpdate) {
        onActionUpdate(userId, formData.action);
      }
      onSuccess?.();
    } catch (error) {
      toast.error(
        error?.response?.data?.detail ||
          error?.message ||
          translate(
            "schaduall.updateActionError",
            t?.schaduall?.updateActionError || "Failed to update action"
          ),
        { position: "top-right" }
      );
    } finally {
      setUpdating(false);
    }
  };

  const labelClass =
    "mb-1.5 ms-1 block text-xs font-bold uppercase tracking-wider text-gray-500";
  const inputClass =
    "w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20";

  const headingLabel = translate(
    "actionForm.addNewAction",
    locale === "ar" ? "إضافة إجراء جديد" : "Add New Action"
  );
  const actionLabel = translate(
    "actionForm.actionLabel",
    t?.actionForm?.actionLabel || "Action Type"
  );
  const commentLabel = translate(
    "actionForm.commentLabel",
    t?.actionForm?.commentLabel || "Notes / Comments"
  );
  const commentPlaceholder = translate(
    "actionForm.commentPlaceholder",
    t?.actionForm?.commentPlaceholder || "Enter your comment here..."
  );
  const dateLabel = translate(
    "actionForm.dateLabel",
    t?.actionForm?.dateLabel || "Date"
  );
  const timeLabel = translate(
    "actionForm.timeLabel",
    t?.actionForm?.timeLabel || "Time"
  );
  const scheduleOptionalLabel = translate(
    "actionForm.scheduleOptional",
    locale === "ar" ? "التاريخ والوقت (اختياري)" : "Date & Time (optional)"
  );
  const submittingLabel = translate(
    "actionForm.submittingButton",
    t?.actionForm?.submittingButton || "Saving..."
  );
  const submitLabel =
    submitButtonLabel ||
    translate(
      "actionForm.submitButton",
      t?.actionForm?.submitButton || "Save"
    );

  const scheduleFieldsInner = (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
      <div>
        <label className={labelClass}>{dateLabel}</label>
        <input
          type="date"
          value={formData.meeting_date}
          onChange={handleDateChange}
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass}>{timeLabel}</label>
        <div className="flex items-center overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
          <div className="group relative flex-1">
            <input
              type="text"
              value={timeState.hours}
              onChange={handleTimeChange("hours")}
              onKeyDown={handleTimeArrowKeys("hours")}
              onBlur={handleTimeBlur("hours")}
              className="w-full bg-transparent py-2.5 text-center text-sm font-semibold focus:outline-none"
              placeholder="HH"
              maxLength={2}
              inputMode="numeric"
            />
            <div className="absolute end-1 top-1/2 flex -translate-y-1/2 flex-col opacity-0 transition-opacity group-hover:opacity-100">
              <button
                type="button"
                onClick={() => handleTimeAdjustment("hours", "up")}
                className="rounded p-0.5 text-gray-400 hover:bg-gray-100 hover:text-primary"
              >
                <ChevronUp size={12} />
              </button>
              <button
                type="button"
                onClick={() => handleTimeAdjustment("hours", "down")}
                className="rounded p-0.5 text-gray-400 hover:bg-gray-100 hover:text-primary"
              >
                <ChevronDown size={12} />
              </button>
            </div>
          </div>

          <span className="font-bold text-gray-300">:</span>

          <div className="group relative flex-1">
            <input
              type="text"
              value={timeState.minutes}
              onChange={handleTimeChange("minutes")}
              onKeyDown={handleTimeArrowKeys("minutes")}
              onBlur={handleTimeBlur("minutes")}
              className="w-full bg-transparent py-2.5 text-center text-sm font-semibold focus:outline-none"
              placeholder="MM"
              maxLength={2}
              inputMode="numeric"
            />
            <div className="absolute end-1 top-1/2 flex -translate-y-1/2 flex-col opacity-0 transition-opacity group-hover:opacity-100">
              <button
                type="button"
                onClick={() => handleTimeAdjustment("minutes", "up")}
                className="rounded p-0.5 text-gray-400 hover:bg-gray-100 hover:text-primary"
              >
                <ChevronUp size={12} />
              </button>
              <button
                type="button"
                onClick={() => handleTimeAdjustment("minutes", "down")}
                className="rounded p-0.5 text-gray-400 hover:bg-gray-100 hover:text-primary"
              >
                <ChevronDown size={12} />
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={handleAmPmToggle}
            className="border-s border-gray-100 bg-gray-50 px-3 py-2.5 text-xs font-bold text-primary transition-colors hover:bg-primary/5 focus:outline-none"
          >
            {timeState.ampm}
          </button>

          <div className="border-s border-gray-100 px-2">
            <Clock size={14} className="text-gray-400" />
          </div>
        </div>
      </div>
    </div>
  );

  const scheduleFields =
    composerLayout && fieldPriority === "action" ? (
      <div className="mb-3">
        <button
          type="button"
          onClick={() => setScheduleOpen((open) => !open)}
          className="flex w-full items-center justify-between rounded-lg px-1 py-1.5 text-start text-xs font-bold uppercase tracking-wider text-gray-500 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          aria-expanded={scheduleOpen}
        >
          <span>{scheduleOptionalLabel}</span>
          {scheduleOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
        {scheduleOpen ? <div className="mt-2">{scheduleFieldsInner}</div> : null}
      </div>
    ) : (
      <div className="mb-4">
        {fieldPriority === "action" ? (
          <p className={`${labelClass} mb-2`}>{scheduleOptionalLabel}</p>
        ) : null}
        {scheduleFieldsInner}
      </div>
    );

  const actionField = (
    <div className="mb-3">
      <label className={labelClass} htmlFor="new-action-type">
        {actionLabel}
      </label>
      <div className="relative">
        <select
          id="new-action-type"
          name="action"
          className={`${inputClass} appearance-none pe-10 font-medium text-gray-700`}
          value={formData.action}
          onChange={(e) =>
            setFormData({ ...formData, action: e.target.value })
          }
          required
        >
          {ACTIONS.map((actionItem) => (
            <option key={actionItem.value} value={actionItem.value}>
              {actionItem.label}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-gray-400">
          <ChevronDown size={16} />
        </div>
      </div>
    </div>
  );

  const notesField = (
    <div className={fieldPriority === "action" ? "mb-3" : "mb-6"}>
      <label className={labelClass} htmlFor="new-action-notes">
        {commentLabel}
      </label>
      <textarea
        id="new-action-notes"
        ref={notesRef}
        name="comment"
        className={`${inputClass} min-h-[96px] resize-none text-gray-700 ${
          composerLayout ? "min-h-[120px] text-base leading-relaxed" : ""
        }`}
        placeholder={commentPlaceholder}
        rows={composerLayout ? 5 : 3}
        value={formData.comment}
        onChange={(e) => {
          setFormData({ ...formData, comment: e.target.value });
          autoGrowNotes(e.target);
        }}
      />
    </div>
  );

  const submitButton = (
    <button
      type="submit"
      disabled={pending || updating}
      className="flex w-full items-center justify-center rounded-xl bg-primary px-4 py-3.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-primary/90 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending || updating ? (
        <Loader2 className="me-2 animate-spin" size={18} />
      ) : null}
      {pending || updating ? submittingLabel : submitLabel}
    </button>
  );

  return (
    <form
      className={
        composerLayout
          ? "flex min-h-0 flex-1 flex-col bg-white"
          : "rounded-b-lg border-t border-gray-100 bg-gray-50/30 p-4"
      }
      action={useUpdateApi ? undefined : action}
      onSubmit={useUpdateApi ? handleUpdateSubmit : undefined}
    >
      <input type="hidden" name="user_id" value={userId || ""} />
      <input type="hidden" name="author" value={author} />
      <input type="hidden" name="name" value={name || ""} />
      <input type="hidden" name="phone_number" value={phoneNumber || ""} />
      <input type="hidden" name="client_id" value={clientId || ""} />
      <input
        type="hidden"
        name="meeting_time"
        value={getFullMeetingDateTime()}
      />

      <div
        className={
          composerLayout
            ? "min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pt-4"
            : ""
        }
      >
        {showHeading ? (
          <h4 className="mb-3 text-sm font-bold text-primary">
            {headingLabel}
          </h4>
        ) : null}

        <div
          className={
            composerLayout
              ? "rounded-xl border border-primary/15 bg-white p-3 shadow-sm ring-1 ring-primary/10 sm:p-4"
              : ""
          }
        >
          {fieldPriority === "schedule" ? (
            <>
              {scheduleFields}
              {actionField}
              {notesField}
            </>
          ) : (
            <>
              {actionField}
              {notesField}
              {scheduleFields}
            </>
          )}
        </div>
      </div>

      <div
        className={
          stickySubmit || composerLayout
            ? "sticky bottom-0 z-10 shrink-0 border-t border-gray-100 bg-white/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-white/90 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
            : ""
        }
      >
        {submitButton}
      </div>
    </form>
  );
}
