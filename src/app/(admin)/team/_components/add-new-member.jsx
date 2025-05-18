"use client";

import Dialog from "@/components/ui/Dialog";
import { PlusIcon, Loader2 } from "lucide-react";
import { useState, useActionState, useEffect } from "react";
import { addNewSales } from "../_actions/actions";
import toast from "react-hot-toast";
import { useI18n } from "@/context/translate-api";

const initialFormData = {
  name: "",
  email: "",
  phone: "",
  position: "sales",
};

const initialState = {
  success: false,
  error: null,
};

export default function AddNewMember() {
  const { t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState(initialFormData);
  const [state, formAction, pending] = useActionState(
    addNewSales,
    initialState
  );

  useEffect(() => {
    if (state.success) {
      setFormData(initialFormData);
      setIsOpen(false);
    }
    if (state.error) {
      toast.error(state.error);
    }
  }, [state]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  return (
    <>
      <button
        className="mt-4 self-end w-fit flex items-center gap-2 py-2 px-4 text-sm font-medium text-white bg-primary rounded-md hover:opacity-90"
        onClick={() => setIsOpen(true)}
      >
        <PlusIcon size={20} />
        <span className="text-base">{t.team.addNew}</span>
      </button>

      <Dialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={"Add New Sales"}
      >
        <form action={formAction} className="space-y-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t.team.email} <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              name="email"
              value={formData.description}
              required
              onChange={handleChange}
              rows={2}
              className="block w-full rounded-md border border-gray-300 py-1 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t.team.phone} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="phone"
              required
              placeholder="+20 123 456 7890"
              value={formData.phone}
              onChange={handleChange}
              className="block w-full rounded-md border border-gray-300 py-1 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <button
            disabled={pending}
            className={`w-full mt-4 px-4 py-1.5 bg-primary rounded-md text-sm font-medium text-white focus:outline-none focus:ring-1 focus:ring-blue-500 ${
              pending ? "pointer-events-none opacity-80" : "hover:bg-primary/90"
            }`}
          >
            {pending ? (
              <div className="flex items-center justify-center gap-2">
                <Loader2 size={20} className="animate-spin" />
                <span>{t.team.loading}</span>
              </div>
            ) : (
              <span>{t.team.save}</span>
            )}
          </button>
        </form>
      </Dialog>
    </>
  );
}
