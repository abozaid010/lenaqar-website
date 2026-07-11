"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useI18n } from "@/hooks/useI18n";
import { Pencil, Check, X } from "lucide-react";
import { updateUserName } from "@/utils/api";
import toast from "react-hot-toast";

export default function ChatWith({ name: initialName, userId, onNameUpdate }) {
  const { translate } = useI18n();
  const [isEditing, setIsEditing] = useState(false);
  const [nameValue, setNameValue] = useState(initialName || "");
  const [displayName, setDisplayName] = useState(initialName || "");
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    const nextName = initialName || "";
    setDisplayName(nextName);
    setNameValue(nextName);
    setIsEditing(false);
  }, [userId, initialName]);

  const startEditing = useCallback(() => {
    setNameValue(displayName);
    setIsEditing(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [displayName]);

  const cancelEditing = useCallback(() => {
    setIsEditing(false);
    setNameValue(displayName);
  }, [displayName]);

  const saveName = useCallback(async () => {
    const trimmed = nameValue.trim();
    if (!trimmed) {
      cancelEditing();
      return;
    }

    if (trimmed === displayName) {
      setIsEditing(false);
      return;
    }

    if (!userId) {
      toast.error(
        translate(
          "chatWith.missingUserId",
          "Cannot update name without a lead id.",
        ),
      );
      cancelEditing();
      return;
    }

    setIsSaving(true);
    try {
      const response = await updateUserName(userId, trimmed);
      if (response?.status === true) {
        setDisplayName(trimmed);
        onNameUpdate?.(trimmed);
        toast.success(
          translate("chatWith.nameUpdated", "Name updated successfully"),
        );
      } else {
        toast.error(
          response?.message ||
            translate("chatWith.nameUpdateFailed", "Failed to update name"),
        );
      }
    } catch (error) {
      console.error("Failed to update name:", error?.message ?? error);
      toast.error(
        error?.message ||
          translate("chatWith.nameUpdateFailed", "Failed to update name"),
      );
    } finally {
      setIsSaving(false);
      setIsEditing(false);
    }
  }, [
    nameValue,
    displayName,
    userId,
    onNameUpdate,
    cancelEditing,
    translate,
  ]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      saveName();
    }
    if (e.key === "Escape") {
      cancelEditing();
    }
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="text"
          value={nameValue}
          onChange={(e) => setNameValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={saveName}
          disabled={isSaving}
          className="text-sm font-bold text-primary border-b-2 border-primary bg-transparent focus:outline-none w-40 px-1"
          placeholder={translate("chatWith.namePlaceholder", "Enter name...")}
        />
        {isSaving ? (
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        ) : (
          <>
            <button
              type="button"
              onClick={saveName}
              className="p-1 text-green-600 hover:text-green-700 hover:bg-green-50 rounded transition-colors"
              aria-label={translate("common.save", "Save")}
            >
              <Check className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={cancelEditing}
              className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
              aria-label={translate("common.cancel", "Cancel")}
            >
              <X className="h-4 w-4" />
            </button>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 group/name min-w-0">
      <h1 className="text-sm text-primary/90 truncate">
        <span className="text-primary font-bold">
          {displayName ||
            translate("clientsTable.newLead", "New Lead")}
        </span>
      </h1>
      <button
        type="button"
        onClick={startEditing}
        className="shrink-0 opacity-0 group-hover/name:opacity-100 p-0.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-all"
        aria-label={translate("common.edit", "Edit")}
      >
        <Pencil className="h-3 w-3" />
      </button>
    </div>
  );
}
