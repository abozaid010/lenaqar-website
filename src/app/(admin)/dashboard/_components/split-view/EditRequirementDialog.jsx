"use client";

import {
  BUILDING_TYPE_VALUES,
  FINISHING_TYPE_VALUES,
  FURNISHING_TYPE_VALUES,
  PROPERTY_INTENT_VALUES,
  PROPERTY_PURPOSE_VALUES,
  PROPERTY_STATUS_VALUES,
  PROPERTY_USAGE_VALUES,
  VIEW_TYPE_VALUES,
} from "@/data/constants";
import { LenaCookiesManager } from "@/lib/LenaCookiesManager";
import { getClientRequirements, updateUserRequirements } from "@/utils/api";
import { X } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

function toNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function parseListField(v) {
  if (Array.isArray(v)) return v.filter(Boolean).join(", ");
  if (v == null) return "";
  return String(v);
}

function splitList(s) {
  if (!s?.trim()) return [];
  return s
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

export default function EditRequirementDialog({
  open,
  onClose,
  userId,
  onSuccess,
}) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(() => ({
    client_id: "",
    user_id: "",
    country: "",
    city: "",
    district: "",
    project: "",
    developer: "",
    buildingType: BUILDING_TYPE_VALUES[0],
    viewType: VIEW_TYPE_VALUES[0],
    finishingType: FINISHING_TYPE_VALUES[0],
    furnishingType: FURNISHING_TYPE_VALUES[0],
    propertyStatus: PROPERTY_STATUS_VALUES[0],
    propertyUsage: PROPERTY_USAGE_VALUES[0],
    propertyPurpose: PROPERTY_PURPOSE_VALUES[0],
    propertyIntent: PROPERTY_INTENT_VALUES[0],
    land_area: 0,
    roomsCount: 0,
    bathroomCount: 0,
    floor: 0,
    gardenSize: 0,
    garageSize: 0,
    deliveryDate: "",
    totalPrice: 0,
    downPayment: 0,
    monthlyInstallment: 0,
    serviceCharges: 0,
    dealBreakers: "",
    additionalFeatures: "",
  }));

  useEffect(() => {
    if (!open || !userId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const raw = await getClientRequirements(userId);
        if (cancelled || raw?.error) {
          if (raw?.error) toast.error(String(raw.error));
          return;
        }
        const clientId = LenaCookiesManager.getClientId() || "";
        const last = (arr) =>
          Array.isArray(arr) && arr.length ? arr[arr.length - 1] : arr;

        setForm({
          client_id: raw.client_id ?? clientId,
          user_id: userId,
          country: raw.country ?? "",
          city: raw.city ?? "",
          district: raw.district ?? "",
          project: raw.project ?? "",
          developer: raw.developer ?? "",
          buildingType: last(raw.buildingType) || BUILDING_TYPE_VALUES[0],
          viewType: last(raw.viewType) || VIEW_TYPE_VALUES[0],
          finishingType: last(raw.finishingType) || FINISHING_TYPE_VALUES[0],
          furnishingType: last(raw.furnishingType) || FURNISHING_TYPE_VALUES[0],
          propertyStatus: last(raw.propertyStatus) || PROPERTY_STATUS_VALUES[0],
          propertyUsage: last(raw.propertyUsage) || PROPERTY_USAGE_VALUES[0],
          propertyPurpose: last(raw.propertyPurpose) || PROPERTY_PURPOSE_VALUES[0],
          propertyIntent: last(raw.propertyIntent) || PROPERTY_INTENT_VALUES[0],
          land_area: toNum(raw.land_area),
          roomsCount: toNum(raw.roomsCount),
          bathroomCount: toNum(raw.bathroomCount),
          floor: toNum(raw.floor),
          gardenSize: toNum(raw.gardenSize),
          garageSize: toNum(raw.garageSize),
          deliveryDate: raw.deliveryDate ?? "",
          totalPrice: toNum(raw.totalPrice),
          downPayment: toNum(raw.downPayment),
          monthlyInstallment: toNum(raw.monthlyInstallment),
          serviceCharges: toNum(raw.serviceCharges),
          dealBreakers: parseListField(raw.dealBreakers),
          additionalFeatures: parseListField(raw.additionalFeatures),
        });
      } catch (e) {
        if (!cancelled) toast.error(e?.message || "Failed to load requirements");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, userId]);

  const set = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userId) return;
    setSaving(true);
    try {
      const clientId = form.client_id || LenaCookiesManager.getClientId() || "";
      const payload = {
        client_id: clientId,
        user_id: userId,
        country: form.country,
        city: form.city,
        district: form.district,
        project: form.project,
        developer: form.developer,
        buildingType: form.buildingType,
        viewType: form.viewType,
        finishingType: form.finishingType,
        furnishingType: form.furnishingType,
        propertyStatus: form.propertyStatus,
        propertyUsage: form.propertyUsage,
        propertyPurpose: form.propertyPurpose,
        propertyIntent: form.propertyIntent,
        land_area: toNum(form.land_area),
        roomsCount: toNum(form.roomsCount),
        bathroomCount: toNum(form.bathroomCount),
        floor: toNum(form.floor),
        gardenSize: toNum(form.gardenSize),
        garageSize: toNum(form.garageSize),
        deliveryDate: form.deliveryDate || "",
        totalPrice: toNum(form.totalPrice),
        downPayment: toNum(form.downPayment),
        monthlyInstallment: toNum(form.monthlyInstallment),
        serviceCharges: toNum(form.serviceCharges),
        dealBreakers: splitList(form.dealBreakers),
        additionalFeatures: splitList(form.additionalFeatures),
        score: {},
      };
      await updateUserRequirements(userId, payload);
      toast.success("Requirements saved");
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(err?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-2">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between p-3 border-b shrink-0">
          <h3 className="text-sm font-semibold text-gray-900">Edit requirement</h3>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        {loading ? (
          <div className="p-8 text-center text-sm text-gray-500">Loading…</div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="p-3 overflow-y-auto flex-1 min-h-0 text-xs space-y-3"
          >
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {[
                ["country", "Country"],
                ["city", "City"],
                ["district", "District"],
                ["project", "Project"],
                ["developer", "Developer"],
              ].map(([k, label]) => (
                <div key={k}>
                  <label className="text-gray-600">{label}</label>
                  <input
                    className="w-full border border-gray-200 rounded px-2 py-1 mt-0.5"
                    value={form[k]}
                    onChange={(e) => set(k, e.target.value)}
                  />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              <div>
                <label className="text-gray-600">Building type</label>
                <select
                  className="w-full border border-gray-200 rounded px-2 py-1 mt-0.5"
                  value={form.buildingType}
                  onChange={(e) => set("buildingType", e.target.value)}
                >
                  {BUILDING_TYPE_VALUES.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-gray-600">View</label>
                <select
                  className="w-full border border-gray-200 rounded px-2 py-1 mt-0.5"
                  value={form.viewType}
                  onChange={(e) => set("viewType", e.target.value)}
                >
                  {VIEW_TYPE_VALUES.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-gray-600">Finishing</label>
                <select
                  className="w-full border border-gray-200 rounded px-2 py-1 mt-0.5"
                  value={form.finishingType}
                  onChange={(e) => set("finishingType", e.target.value)}
                >
                  {FINISHING_TYPE_VALUES.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-gray-600">Furnishing</label>
                <select
                  className="w-full border border-gray-200 rounded px-2 py-1 mt-0.5"
                  value={form.furnishingType}
                  onChange={(e) => set("furnishingType", e.target.value)}
                >
                  {FURNISHING_TYPE_VALUES.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-gray-600">Status</label>
                <select
                  className="w-full border border-gray-200 rounded px-2 py-1 mt-0.5"
                  value={form.propertyStatus}
                  onChange={(e) => set("propertyStatus", e.target.value)}
                >
                  {PROPERTY_STATUS_VALUES.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-gray-600">Usage</label>
                <select
                  className="w-full border border-gray-200 rounded px-2 py-1 mt-0.5"
                  value={form.propertyUsage}
                  onChange={(e) => set("propertyUsage", e.target.value)}
                >
                  {PROPERTY_USAGE_VALUES.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-gray-600">Purpose</label>
                <select
                  className="w-full border border-gray-200 rounded px-2 py-1 mt-0.5"
                  value={form.propertyPurpose}
                  onChange={(e) => set("propertyPurpose", e.target.value)}
                >
                  {PROPERTY_PURPOSE_VALUES.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-gray-600">Intent</label>
                <select
                  className="w-full border border-gray-200 rounded px-2 py-1 mt-0.5"
                  value={form.propertyIntent}
                  onChange={(e) => set("propertyIntent", e.target.value)}
                >
                  {PROPERTY_INTENT_VALUES.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
              {[
                ["land_area", "Land"],
                ["roomsCount", "Rooms"],
                ["bathroomCount", "Baths"],
                ["floor", "Floor"],
                ["gardenSize", "Garden"],
                ["garageSize", "Garage"],
              ].map(([k, label]) => (
                <div key={k}>
                  <label className="text-gray-600">{label}</label>
                  <input
                    type="number"
                    className="w-full border border-gray-200 rounded px-2 py-1 mt-0.5"
                    value={form[k]}
                    onChange={(e) => set(k, e.target.value)}
                  />
                </div>
              ))}
            </div>
            <div>
              <label className="text-gray-600">Delivery date</label>
              <input
                className="w-full md:w-48 border border-gray-200 rounded px-2 py-1 mt-0.5"
                value={form.deliveryDate}
                onChange={(e) => set("deliveryDate", e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {[
                ["totalPrice", "Total price"],
                ["downPayment", "Down payment"],
                ["monthlyInstallment", "Monthly"],
                ["serviceCharges", "Service"],
              ].map(([k, label]) => (
                <div key={k}>
                  <label className="text-gray-600">{label}</label>
                  <input
                    type="number"
                    className="w-full border border-gray-200 rounded px-2 py-1 mt-0.5"
                    value={form[k]}
                    onChange={(e) => set(k, e.target.value)}
                  />
                </div>
              ))}
            </div>
            <div>
              <label className="text-gray-600">Deal breakers (comma-separated)</label>
              <textarea
                className="w-full border border-gray-200 rounded px-2 py-1 mt-0.5 min-h-[48px]"
                value={form.dealBreakers}
                onChange={(e) => set("dealBreakers", e.target.value)}
              />
            </div>
            <div>
              <label className="text-gray-600">Additional features (comma-separated)</label>
              <textarea
                className="w-full border border-gray-200 rounded px-2 py-1 mt-0.5 min-h-[48px]"
                value={form.additionalFeatures}
                onChange={(e) => set("additionalFeatures", e.target.value)}
              />
            </div>
            <div className="flex gap-2 justify-end pt-2 border-t sticky bottom-0 bg-white pb-1">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 border border-gray-200 rounded"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-3 py-1.5 bg-primary text-white rounded disabled:opacity-60"
              >
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
