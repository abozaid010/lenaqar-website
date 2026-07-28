"use client";
import { assignSalsePerson } from "@/components/services/serviceFetching";
import { useI18n } from "@/hooks/useI18n";
import { SELECTION_COLORS } from "@/constants/colors";
import {
  formatPhoneForDisplay,
  phoneToE164,
} from "@/components/phone/phone-utils";
import { handleCopyFullPhoneNumber } from "@/utils/phone-utils";
import { getActionLabel, SCHEDULE_VISIBLE_ACTIONS } from "@/utils/actions";
import { useActionCatalog, getScheduledActionsFromCatalog } from "@/hooks/use-action-catalog";
import { fetchScheduledActionsByDate } from "@/utils/api";
import { formatScheduleRowDateTime, formatScheduleWeekDayDate } from "@/utils/formateDate";
import {
  Building2,
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Copy,
  Loader2,
  Phone,
  User,
  UserPlus,
  Eye,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import UnifiedDialog from "@/components/ui/UnifiedDialog";
import PhoneTelLink from "@/components/phone/PhoneTelLink";
import NewActionForm from "@/app/(admin)/dashboard/_components/new-action-form";
import ScheduleUserDetailsDialog from "./ScheduleUserDetailsDialog";

/** Lead id for creating a follow-up action from the schedule card. */
function getScheduledActionUserId(item) {
  return item?.user_id ?? item?.userId ?? null;
}

/** Stable row id from API payload (id field name varies). */
function getScheduledActionId(item) {
  return item?.id ?? item?.action_id ?? item?.actionId ?? item?._id ?? null;
}

/** Unique React key — never use numeric `+` on a missing id (yields NaN). */
function getScheduledActionKey(item, index) {
  const id = getScheduledActionId(item);
  if (id != null && id !== "") {
    return String(id);
  }
  const uid = getScheduledActionUserId(item) ?? "unknown";
  const time = item?.meeting_time || item?.created_at || "";
  const action = item?.action || "";
  const phone = item?.phone_number || "";
  return `schedule-${uid}-${time}-${action}-${phone}-${index}`;
}

/** Local calendar date + time from meeting_time or created_at. */
function getAppointmentDateTimeParts(appointment) {
  const raw = appointment?.meeting_time || appointment?.created_at;
  if (!raw) return null;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return null;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return { dateStr: `${y}-${m}-${day}`, timeStr: `${hh}:${mm}` };
}

// Returns the Saturday that starts the week containing `date` (Sat → Fri).
const getWeekStartSaturday = (date) => {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Sunday ... 6 = Saturday
  const offset = (day + 1) % 7; // days since last Saturday
  d.setDate(d.getDate() - offset);
  d.setHours(0, 0, 0, 0);
  return d;
};

const formatToISODate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// Allow browsing schedule history up to ~4 months (17 weeks) back.
const MAX_PAST_WEEKS = 17;
// Allow browsing schedule up to 8 weeks ahead.
const MAX_NEXT_WEEKS = 8;

const Schedule = ({ data, dataSales, scheduledActionValues }) => {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(() =>
    getWeekStartSaturday(new Date())
  );
  const [openDropdown, setOpenDropdown] = useState(null);
  const [appointments, setAppointments] = useState(data || []);
  const [loading, setLoading] = useState(null);
  const [isWeekLoading, setIsWeekLoading] = useState(false);
  const [editAppointment, setEditAppointment] = useState(null);
  const [detailsAppointment, setDetailsAppointment] = useState(null);
  const { t, translate, locale } = useI18n();
  const isRTL = locale === "ar";
  const { data: catalog } = useActionCatalog();

  const visibleScheduleActions = useMemo(() => {
    const fromCatalog = getScheduledActionsFromCatalog(catalog);
    if (fromCatalog.length) return fromCatalog;
    if (Array.isArray(scheduledActionValues) && scheduledActionValues.length) {
      return scheduledActionValues;
    }
    return SCHEDULE_VISIBLE_ACTIONS;
  }, [catalog, scheduledActionValues]);

  const isVisibleScheduleAction = (action) => {
    const normalized = String(action || "").trim().toLowerCase();
    return visibleScheduleActions.some(
      (item) => String(item).trim().toLowerCase() === normalized
    );
  };

  const getAppointmentDateTime = (appointment) =>
    appointment?.meeting_time || appointment?.created_at;

  const getNext7DaysValues = () => {
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(currentDate);
      date.setDate(date.getDate() + i);
      dates.push(date.toISOString().split("T")[0]);
    }
    return dates;
  };

  const getWeekRangeDisplay = () => {
    const dates = getNext7DaysValues();
    const firstDate = new Date(dates[0]);
    const lastDate = new Date(dates[dates.length - 1]);
    return `${formatScheduleWeekDayDate(firstDate, locale)} - ${formatScheduleWeekDayDate(lastDate, locale)}`;
  };

  const filteredData = appointments?.filter((item) => {
    const itemDate = String(item?.meeting_time || item?.created_at || "").split(
      "T"
    )[0];
    if (!itemDate) return false;
    return (
      getNext7DaysValues().includes(itemDate) &&
      isVisibleScheduleAction(item?.action)
    );
  });

  const loadWeekData = async (weekStartDate) => {
    const weekStart = new Date(weekStartDate);
    const weekEnd = new Date(weekStartDate);
    weekEnd.setDate(weekEnd.getDate() + 6);

    setIsWeekLoading(true);
    try {
      const nextWeekData = await fetchScheduledActionsByDate(
        formatToISODate(weekStart),
        formatToISODate(weekEnd),
        visibleScheduleActions
      );
      setAppointments(nextWeekData);
    } catch (error) {
      console.error("Failed to load week schedule:", error?.message ?? error);
      toast.error(t.schaduall?.loadError || "Failed to load schedule");
      setAppointments([]);
    } finally {
      setIsWeekLoading(false);
    }
  };

  const navigateWeek = async (direction) => {
    const newDate = new Date(currentDate);
    if (direction === "next") {
      newDate.setDate(newDate.getDate() + 7);
    } else {
      newDate.setDate(newDate.getDate() - 7);
    }
    setCurrentDate(newDate);
    await loadWeekData(newDate);
  };

  // Bounds are anchored to the current week's Saturday so navigation works
  // consistently regardless of which weekday "today" is.
  const canNavigatePrev = () => {
    const minWeekStart = getWeekStartSaturday(new Date());
    minWeekStart.setDate(minWeekStart.getDate() - MAX_PAST_WEEKS * 7);
    return currentDate > minWeekStart;
  };

  const canNavigateNext = () => {
    const maxWeekStart = getWeekStartSaturday(new Date());
    maxWeekStart.setDate(maxWeekStart.getDate() + MAX_NEXT_WEEKS * 7);
    return currentDate < maxWeekStart;
  };

  const toggleDropdown = (index) => {
    setOpenDropdown(openDropdown === index ? null : index);
  };

  const assignSalesPerson = async (appointmentId, salesperson, index) => {
    try {
      setLoading(index);
      const response = await assignSalsePerson(appointmentId, salesperson);

      // Update appointments state with new data
      setAppointments((prevAppointments) =>
        prevAppointments.map((appointment) =>
          appointment.id === appointmentId
            ? {
                ...appointment,
                assigned_sales: [
                  ...(appointment.assigned_sales || []),
                  salesperson,
                ],
              }
            : appointment
        )
      );

      // Show success toast
      toast.success(
        t.schaduall.salesAssigned || "Salesperson assigned successfully"
      );

      // Refresh data from server
      router.refresh();

      setOpenDropdown(null);
    } catch (error) {
      console.error("Error assigning sales person:", error?.message ?? error);
      toast.error(t.schaduall.assignError || "Failed to assign salesperson");
    } finally {
      setLoading(null);
    }
  };

  const handleOpenEditAppointment = (appointment) => {
    const uid = getScheduledActionUserId(appointment);
    if (!uid) {
      toast.error(
        t.schaduall?.cannotUpdateActionMissingUser ||
          "This task is not linked to a lead."
      );
      return;
    }
    setEditAppointment(appointment);
  };

  const closeEditAppointment = () => setEditAppointment(null);

  const handleOpenUserDetails = (appointment) => {
    const uid = getScheduledActionUserId(appointment);
    if (!uid) {
      toast.error(
        t.schaduall?.cannotOpenDetailsMissingUser ||
          "This task is not linked to a lead."
      );
      return;
    }
    setDetailsAppointment(appointment);
  };

  const closeUserDetails = () => setDetailsAppointment(null);

  return (
    <div className="border border-red-50">
      <div className={`min-h-screen ${SELECTION_COLORS.BG} p-6`}>
        <div className="max-w-7xl mx-auto ">
          <div className="mb-8">
            {/* Week Navigation */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-gray-500" />
                  <span className="text-lg font-semibold text-gray-800">
                    {getWeekRangeDisplay()}
                  </span>
                </div>
                <div className="flex gap-2 rtl:flex-row-reverse">
                  <button
                    onClick={() => navigateWeek("prev")}
                    disabled={!canNavigatePrev() || isWeekLoading}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 border ${
                      canNavigatePrev()
                        ? "text-gray-600 hover:text-primary hover:bg-primary/10 border-gray-200 hover:border-violet-200"
                        : "text-gray-400 border-gray-200 cursor-not-allowed"
                    }`}
                  >
                    <ChevronLeft
                      className={`w-4 h-4  ${isRTL ? "rotate-180" : ""}`}
                    />
                    {t.previous}
                  </button>
                  <button
                    onClick={() => navigateWeek("next")}
                    disabled={!canNavigateNext() || isWeekLoading}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 border ${
                      canNavigateNext()
                        ? "text-gray-600 hover:text-primary hover:bg-primary/10 border-gray-200 hover:border-violet-200"
                        : "text-gray-400 border-gray-200 cursor-not-allowed"
                    }`}
                  >
                    {t.next}
                    <ChevronRight
                      className={`w-4 h-4  ${isRTL ? "rotate-180" : ""}`}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Appointments List */}
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,3.3fr)_minmax(0,1fr)] gap-4">
            <div className="space-y-2 min-w-0">
              {isWeekLoading ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                  <Loader2 className="w-8 h-8 text-primary mx-auto mb-3 animate-spin" />
                  <p className="text-gray-500">
                    {t.loading || "Loading..."}
                  </p>
                </div>
              ) : filteredData?.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                  <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-500 mb-2">
                    {" "}
                    {t.Noappointments}{" "}
                  </h3>
                  <p className="text-gray-400"> {t.scheduleweek}</p>
                </div>
              ) : (
                filteredData?.map((appointment, index) => {
                  const actionLabel =
                    getActionLabel(appointment.action, translate) ||
                    appointment.action ||
                    translate("dashboardFilter.actions.noAction", "No Action");
                  const dateTimeRaw = getAppointmentDateTime(appointment);
                  const formattedDateTime = formatScheduleRowDateTime(
                    dateTimeRaw,
                    locale
                  );
                  const phoneE164 =
                    phoneToE164(appointment.phone_number, "EG") ||
                    appointment.phone_number;
                  const phoneDisplay =
                    formatPhoneForDisplay(appointment.phone_number, "EG") ||
                    appointment.phone_number;
                  const companyName = appointment.company_name?.trim();

                  return (
                    <div
                      key={getScheduledActionKey(appointment, index)}
                      className="bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all duration-150"
                    >
                      <div className="px-3 py-2.5">
                        {/* Row 1: action + note (main) · name · company · phone */}
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="flex-1 min-w-0 flex items-baseline gap-1">
                            <span className="font-semibold text-sm text-gray-900 shrink-0">
                              {actionLabel}
                            </span>
                            {appointment.comment?.trim() ? (
                              <span
                                className="text-[10px] leading-snug text-gray-500 truncate min-w-0"
                                title={appointment.comment.trim()}
                              >
                                · {appointment.comment.trim()}
                              </span>
                            ) : null}
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0 text-sm text-gray-800">
                            <User className="w-3.5 h-3.5 text-primary shrink-0" />
                            <span className="font-medium truncate max-w-[100px] sm:max-w-[140px]">
                              {appointment.name || "—"}
                            </span>
                            {companyName ? (
                              <>
                                <Building2 className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                <span
                                  className="text-xs text-gray-600 truncate max-w-[80px] sm:max-w-[120px]"
                                  title={companyName}
                                >
                                  {companyName}
                                </span>
                              </>
                            ) : null}
                            {appointment.phone_number ? (
                              <span className="inline-flex items-center gap-1 min-w-0">
                                <PhoneTelLink
                                  phoneNumber={appointment.phone_number}
                                  stopPropagation
                                  aria-label={t.buttons?.call || "Call"}
                                  title={t.buttons?.call || "Call"}
                                  className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-white transition-colors shrink-0"
                                >
                                  <Phone className="w-3 h-3" />
                                </PhoneTelLink>
                                <button
                                  type="button"
                                  onClick={(e) =>
                                    handleCopyFullPhoneNumber(
                                      e,
                                      phoneE164,
                                      () =>
                                        toast.success(
                                          t.clientsTable?.phoneCopied ||
                                            "Phone copied"
                                        ),
                                      () =>
                                        toast.error(
                                          t.clientsTable?.phoneCopyFailed ||
                                            "Failed to copy"
                                        )
                                    )
                                  }
                                  title={
                                    t.clientsTable?.clickToCopy ||
                                    "Click to copy"
                                  }
                                  aria-label={
                                    t.clientsTable?.clickToCopy ||
                                    "Click to copy"
                                  }
                                  className="font-medium text-gray-700 hover:text-primary transition-colors cursor-pointer inline-flex items-center gap-1 group min-w-0"
                                >
                                  <span dir="ltr" className="truncate max-w-[90px] sm:max-w-[120px]">
                                    {phoneDisplay}
                                  </span>
                                  <Copy className="w-3 h-3 opacity-40 group-hover:opacity-100 transition-opacity shrink-0" />
                                </button>
                              </span>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </div>
                        </div>

                        {/* Row 2: datetime · assign sales · details */}
                        <div className="flex items-center justify-between gap-2 mt-1.5 min-h-[28px]">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEditAppointment(appointment);
                            }}
                            className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-gray-600 hover:text-primary transition-colors min-w-0"
                            aria-label={
                              translate(
                                "schaduall.clickToEditDateTime",
                                "Edit date and time"
                              )
                            }
                          >
                            <Clock className="w-3.5 h-3.5 shrink-0 text-gray-400" />
                            <span className="truncate">
                              {formattedDateTime || "—"}
                            </span>
                          </button>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {appointment.assigned_sales?.length > 0 ? (
                              <span className="inline-flex items-center gap-1 text-xs text-primary font-medium max-w-[100px] sm:max-w-[140px]">
                                <User className="w-3.5 h-3.5 shrink-0" />
                                <span className="truncate">
                                  {appointment.assigned_sales
                                    .map((e) => e.name)
                                    .join(", ")}
                                </span>
                              </span>
                            ) : (
                              <div className="relative">
                                <button
                                  type="button"
                                  onClick={() => toggleDropdown(index)}
                                  disabled={!dataSales?.length}
                                  className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-primary border border-primary/20 rounded-md hover:bg-primary/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  <UserPlus className="w-3.5 h-3.5" />
                                  <span className="hidden sm:inline">
                                    {dataSales?.length
                                      ? translate("schaduall.ChooseSalesperson")
                                      : translate("schaduall.noSale")}
                                  </span>
                                  {dataSales?.length > 0 && (
                                    <ChevronDown
                                      className={`w-3.5 h-3.5 transition-transform duration-200 ${
                                        openDropdown === index
                                          ? "rotate-180"
                                          : ""
                                      }`}
                                    />
                                  )}
                                </button>

                                {openDropdown === index &&
                                  dataSales?.length > 0 && (
                                    <div className="absolute top-full end-0 mt-1 w-52 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                                      <div className="max-h-48 overflow-y-auto py-1">
                                        {dataSales.map((salesperson, si) => (
                                          <button
                                            key={salesperson.id ?? si}
                                            type="button"
                                            onClick={() =>
                                              assignSalesPerson(
                                                salesperson.id,
                                                appointment,
                                                index
                                              )
                                            }
                                            disabled={loading === index}
                                            className={`flex items-center gap-2 w-full px-3 py-2 text-sm text-start hover:bg-primary/5 transition-colors ${
                                              loading === index
                                                ? "opacity-50 cursor-not-allowed"
                                                : ""
                                            }`}
                                          >
                                            {loading === index ? (
                                              <Loader2 className="w-4 h-4 animate-spin text-primary" />
                                            ) : (
                                              <span className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white text-[10px] font-semibold shrink-0">
                                                {salesperson.name
                                                  .split(" ")
                                                  .map((n) => n[0])
                                                  .join("")}
                                              </span>
                                            )}
                                            <span className="truncate font-medium text-gray-800">
                                              {salesperson.name}
                                            </span>
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                              </div>
                            )}

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenUserDetails(appointment);
                              }}
                              className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-white bg-primary rounded-md hover:bg-primary/90 transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">
                                {translate("schaduall.viewDetails")}
                              </span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Team sidebar — ~30% narrower than previous 1/3 column */}
            <div className="min-w-0">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <h3 className="text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-primary shrink-0" />
                  <span className="truncate">{t.sidebar?.team ?? "Team"}</span>
                </h3>
                {dataSales?.length > 0 ? (
                  <div className="space-y-2">
                    {dataSales.map((salesperson, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 transition-all duration-200"
                      >
                        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-semibold text-xs shrink-0">
                          {salesperson.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm text-gray-800 truncate">
                            {salesperson.name}
                          </div>
                          <div className="text-[10px] text-gray-500 truncate">
                            {salesperson.role}
                          </div>
                          <div className="mt-0.5 flex items-center gap-1">
                            <div
                              className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${
                                salesperson.tasks?.length > 0
                                  ? "bg-primary/10 text-primary"
                                  : "bg-gray-100 text-gray-500"
                              }`}
                            >
                              {salesperson.tasks?.length || 0} {t.Tasks}
                            </div>
                            {salesperson.tasks?.length === 0 && (
                              <span className="text-[10px] text-gray-400 truncate">
                                ({t.schaduall.Available})
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <UserPlus className="w-6 h-6 text-gray-400" />
                    </div>
                    <h4 className="text-sm font-medium text-gray-600">
                      {t.schaduall.NoSalesAvailable || "nosales"}
                    </h4>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <UnifiedDialog
        isOpen={!!editAppointment}
        onClose={closeEditAppointment}
        title={
          t.schaduall?.updateActionTimeTitle ||
          "Update date and time"
        }
        headerVariant="unified"
        cancelLabel={t.buttons?.cancel}
        headerTrailing={null}
        bodyClassName="p-0 sm:p-1"
      >
        {editAppointment ? (
          <>
            <p className="text-sm text-gray-600 mb-4 px-1 leading-relaxed">
              {t.schaduall?.updateActionTimeHint ||
                "Submitting updates the current action with the details below."}
            </p>
            <NewActionForm
              key={`schedule-edit-${getScheduledActionKey(editAppointment, 0)}`}
              userId={String(getScheduledActionUserId(editAppointment) ?? "")}
              phoneNumber={
                phoneToE164(editAppointment.phone_number, "EG") ||
                editAppointment.phone_number ||
                ""
              }
              name={editAppointment.name || ""}
              ownerType={editAppointment.owner_type || null}
              defaultAction={editAppointment.action || null}
              defaultComment={editAppointment.comment ?? ""}
              defaultMeetingDate={
                getAppointmentDateTimeParts(editAppointment)?.dateStr ?? null
              }
              defaultMeetingTime={
                getAppointmentDateTimeParts(editAppointment)?.timeStr ?? null
              }
              submitButtonLabel={
                t.schaduall?.updateAction ||
                "Update action"
              }
              useUpdateApi
              fieldPriority="schedule"
              onSuccess={() => {
                closeEditAppointment();
                router.refresh();
              }}
            />
          </>
        ) : null}
      </UnifiedDialog>

      <ScheduleUserDetailsDialog
        isOpen={!!detailsAppointment}
        onClose={closeUserDetails}
        appointment={detailsAppointment}
        onDataChanged={() => router.refresh()}
      />
    </div>
  );
};

export default Schedule;
