"use client";

import Dialog from "@/components/ui/Dialog";
import CancelButton from "@/components/ui/cancel-button";
import SearchableDropdownSelect from "@/components/ui/inputs/searchable-dropdown-select";
import { PhoneField } from "@/components/phone/PhoneField";
import { PlusIcon, Loader2, Edit2 } from "lucide-react";
import { useState, useActionState, useEffect, useMemo, useRef } from "react";
import { addNewSales, editEmployee } from "../_actions/actions";
import toast from "react-hot-toast";
import { useI18n } from "@/context/translate-api";

const ROLE_VALUES = ["admin", "editor", "viewer"];

function validatePassword(value, isEdit) {
  if (isEdit && !value) return null;
  if (!value || value.length < 8) return "length";
  const hasLetter = /[a-zA-Z]/.test(value);
  const hasSymbol = /[^a-zA-Z0-9]/.test(value);
  if (!hasLetter || !hasSymbol) return "chars";
  return null;
}

const initialFormData = {
  name: "",
  email: "",
  password: "",
  phone: "",
  position: "sales",
  role: "viewer",
};

const initialState = {
  success: false,
  error: null,
};

export default function AddNewMember({ isEdit = false, data, canManageTeam = true, onSuccess }) {
  const { t, locale } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState(() => {
    if (isEdit) {
      return {
        id: data.id,
        name: data.name,
        email: data.email,
        password: "",
        phone: data.phone,
        position: data.position,
        role: data.role ?? data.job_title ?? data.position ?? "viewer",
      };
    }
    return initialFormData;
  });
  const [state, formAction, pending, resetActionState] = useActionState(
    isEdit ? editEmployee : addNewSales,
    initialState
  );
  const [passwordError, setPasswordError] = useState(null);
  const lastHandledStateRef = useRef(null);

  // Reset action state when dialog opens to clear any stale success/error
  useEffect(() => {
    if (isOpen) {
      resetActionState?.();
      lastHandledStateRef.current = null;
    }
  }, [isOpen, resetActionState]);

  useEffect(() => {
    if (state === lastHandledStateRef.current) return;

    if (state.success) {
      lastHandledStateRef.current = state;
      setFormData(isEdit ? formData : initialFormData);
      setIsOpen(false);
      onSuccess?.(state.data);
    } else if (state.error) {
      lastHandledStateRef.current = state;
      toast.error(state.error);
    }
  }, [state, onSuccess, isEdit, formData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    if (name === "password") setPasswordError(null);
  };

  const getPasswordErrorMessage = () => {
    if (!passwordError) return null;
    return t.team?.passwordInvalid ?? "Password must be at least 8 characters and contain both letters and a symbol.";
  };

  const handleSubmit = (e) => {
    const err = validatePassword(formData.password, isEdit);
    if (err) {
      e.preventDefault();
      setPasswordError(err);
      toast.error(
        t.team?.passwordInvalid ??
          "Password must be at least 8 characters and contain both letters and a symbol."
      );
    } else {
      setPasswordError(null);
    }
  };

  const roleOptions = useMemo(
    () =>
      ROLE_VALUES.map((value) => ({
        value,
        label: t.team?.roles?.[value] ?? value,
      })),
    [t, locale]
  );

  return (
    <>
      {canManageTeam &&
        (isEdit === true ? (
          <button onClick={() => setIsOpen(true)}>
            <Edit2 className="w-4 h-4 text-blue-500 hover:text-blue-700" />
          </button>
        ) : (
          <button
            className="flex-1 md:flex-initial px-4 py-2 h-10 bg-primary hover:bg-primary/90 text-white rounded-md flex items-center justify-center gap-2 transition-colors text-sm font-medium shadow-sm hover:shadow-md"
            onClick={() => setIsOpen(true)}
          >
            <PlusIcon size={18} className="shrink-0" />
            <span className="hidden sm:inline whitespace-nowrap">{t.team.addNew}</span>
          </button>
        ))}

      <Dialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={t.team?.addNewSales ?? "Add New Sales"}
        showCloseButton={false}
        headerLeading={
          locale === "ar" ? (
            <button
              type="submit"
              form="add-member-form"
              disabled={pending}
              className={`px-3 py-1.5 text-sm font-medium rounded focus:outline-none focus:ring-1 focus:ring-white ${
                pending
                  ? "pointer-events-none opacity-80 bg-white/80 text-primary"
                  : "bg-white text-primary hover:bg-white/90"
              }`}
            >
              {pending ? (
                <span className="flex items-center gap-2">
                  <Loader2 size={16} className="animate-spin" />
                  {t.team.loading}
                </span>
              ) : (
                t.team.save
              )}
            </button>
          ) : (
            <CancelButton onClick={() => setIsOpen(false)}>
              {t.buttons?.cancel || "Cancel"}
            </CancelButton>
          )
        }
        headerActions={
          locale === "ar" ? (
            <CancelButton onClick={() => setIsOpen(false)}>
              {t.buttons?.cancel || "Cancel"}
            </CancelButton>
          ) : (
            <button
              type="submit"
              form="add-member-form"
              disabled={pending}
              className={`px-3 py-1.5 text-sm font-medium rounded focus:outline-none focus:ring-1 focus:ring-white ${
                pending
                  ? "pointer-events-none opacity-80 bg-white/80 text-primary"
                  : "bg-white text-primary hover:bg-white/90"
              }`}
            >
              {pending ? (
                <span className="flex items-center gap-2">
                  <Loader2 size={16} className="animate-spin" />
                  {t.team.loading}
                </span>
              ) : (
                t.team.save
              )}
            </button>
          )
        }
      >
        <form
          id="add-member-form"
          action={formAction}
          className="space-y-2"
          onSubmit={handleSubmit}
        >
          {isEdit && <input type="hidden" name="id" value={formData.id} />}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 text-start">
              {t.team.name} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              required
              onChange={handleChange}
              className="block w-full rounded-md border border-gray-300 py-1 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 text-start">
              {t.team.email} <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              required
              onChange={handleChange}
              className="block w-full rounded-md border border-gray-300 py-1 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 text-start">
              {t.team.password}
              {!isEdit && <span className="text-red-500"> *</span>}
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              required={!isEdit}
              onChange={handleChange}
              placeholder={
                isEdit
                  ? locale === "ar"
                    ? "(اتركه فارغاً للإبقاء على الحالي)"
                    : "(leave blank to keep current)"
                  : undefined
              }
              className={`block w-full rounded-md border py-1 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                passwordError
                  ? "border-red-500"
                  : "border-gray-300"
              }`}
              autoComplete="new-password"
              aria-invalid={!!passwordError}
              aria-describedby={passwordError ? "password-error" : undefined}
            />
            {passwordError && (
              <p id="password-error" className="text-xs text-red-500 mt-1">
                {getPasswordErrorMessage()}
              </p>
            )}
            {!passwordError && (
              <p className="text-xs text-gray-500 mt-1">
                {t.team?.passwordHint ?? "At least 8 characters, with letters and a symbol"}
              </p>
            )}
          </div>

          <PhoneField
            className="w-full"
            name="phone"
            label={t.team.phone}
            required
            defaultCountry="EG"
            value={formData.phone ?? ""}
            onChange={(next) =>
              setFormData((prev) => ({ ...prev, phone: next ?? "" }))
            }
            placeholder="+20 123 456 7890"
          />

          <div>
            <SearchableDropdownSelect
              name="role"
              label={t.team.role || "Role"}
              options={roleOptions}
              value={formData.role ?? ""}
              onChange={handleChange}
              placeholder={t.team.role || "Select role"}
              required
            />
            <input type="hidden" name="role" value={formData.role ?? ""} />
          </div>
        </form>
      </Dialog>
    </>
  );
}
