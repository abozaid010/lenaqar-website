import type { ChatTurn } from "@/hooks/useConversation";
import type { UnitImage } from "@/lib/units/unit-types";
import { getClientLogoDisplayUrl } from "@/utils/imageUtils";
import {
  hasDisplayUserMessageText,
  isExactPlaceholderUserMessage,
  resolveImageFileId,
} from "@/utils/imageUtils";

export interface ConversationImage {
  /** Stable key for selection state (fileId preferred). */
  key: string;
  fileId: string;
  /** Canonical URL for API payloads. */
  url: string;
  /** URL for rendering in the UI. */
  displayUrl: string;
}

function pickRawMediaUrl(message: ChatTurn): string | null {
  if (!message || typeof message !== "object") return null;

  const url =
    message.image_url ??
    message.media_url ??
    (typeof message.image === "string" ? message.image : null);

  if (url == null) return null;
  const trimmed = String(url).trim();
  return trimmed || null;
}

function pickRawUserImageUrl(message: ChatTurn): string | null {
  const explicit = message.user_image_url ?? message.user_media_url;
  if (explicit != null) {
    const trimmed = String(explicit).trim();
    if (trimmed) return trimmed;
  }

  const shared = pickRawMediaUrl(message);
  if (!shared) return null;

  const hasUserText = hasDisplayUserMessageText(message.user_message);
  const hasBotText = Boolean(
    String(message.bot_response ?? message.bot_message ?? "").trim(),
  );

  if (hasUserText || !hasBotText) return shared;
  if (isExactPlaceholderUserMessage(message.user_message)) return shared;

  return null;
}

function pickRawBotImageUrl(message: ChatTurn): string | null {
  const explicit =
    message.bot_image_url ??
    message.bot_media_url ??
    message.admin_reply_image_url;
  if (explicit != null) {
    const trimmed = String(explicit).trim();
    if (trimmed) return trimmed;
  }

  const shared = pickRawMediaUrl(message);
  if (!shared) return null;

  const hasUserText = hasDisplayUserMessageText(message.user_message);
  const hasBotText = Boolean(
    String(message.bot_response ?? message.bot_message ?? "").trim(),
  );

  if (hasBotText && !hasUserText) return shared;

  return null;
}

function toAbsoluteImageUrl(rawUrl: string): string {
  const trimmed = String(rawUrl).trim();
  if (!trimmed) return trimmed;

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }

  return getClientLogoDisplayUrl(trimmed) || trimmed;
}

function toConversationImage(rawUrl: string): ConversationImage | null {
  const trimmed = String(rawUrl).trim();
  if (!trimmed) return null;

  const fileId = resolveImageFileId({ url: trimmed });
  if (!fileId) return null;

  const url = toAbsoluteImageUrl(trimmed);
  const displayUrl = getClientLogoDisplayUrl(url) || url;

  return {
    key: fileId,
    fileId,
    url,
    displayUrl,
  };
}

/** Collect unique images from all turns in a conversation. */
export function extractConversationImages(messages: ChatTurn[]): ConversationImage[] {
  if (!Array.isArray(messages) || messages.length === 0) return [];

  const seen = new Set<string>();
  const images: ConversationImage[] = [];

  for (const message of messages) {
    const urls = [pickRawUserImageUrl(message), pickRawBotImageUrl(message)].filter(
      Boolean,
    ) as string[];

    for (const rawUrl of urls) {
      const image = toConversationImage(rawUrl);
      if (!image || seen.has(image.key)) continue;
      seen.add(image.key);
      images.push(image);
    }
  }

  return images;
}

function normalizeUrlForCompare(url: string): string {
  try {
    const parsed = new URL(url);
    return `${parsed.hostname}${parsed.pathname}`.toLowerCase();
  } catch {
    return String(url).trim().toLowerCase();
  }
}

/** Whether a conversation image is already linked on the unit (by fileId or URL). */
export function isConversationImageAttached(
  image: ConversationImage,
  unitImages: UnitImage[] | undefined | null,
): boolean {
  if (!Array.isArray(unitImages) || unitImages.length === 0) return false;

  const targetUrl = normalizeUrlForCompare(image.url);

  return unitImages.some((unitImage) => {
    if (!unitImage?.url) return false;

    const unitFileId = resolveImageFileId(unitImage);
    if (unitFileId && unitFileId === image.fileId) return true;

    return normalizeUrlForCompare(unitImage.url) === targetUrl;
  });
}

/** Map selected conversation images to unit image objects (no upload). */
export function conversationImagesToUnitImages(
  images: ConversationImage[],
): UnitImage[] {
  return images.map((image) => ({
    fileId: image.fileId,
    url: image.url,
    source: "chat",
  }));
}

/** Append new images to existing unit images, skipping duplicates. */
export function mergeUnitImages(
  existingImages: UnitImage[] | undefined | null,
  newImages: UnitImage[],
): UnitImage[] {
  const current = Array.isArray(existingImages) ? existingImages : [];
  const merged = [...current];

  for (const candidate of newImages) {
    const alreadyExists = merged.some((existing) => {
      const existingFileId = resolveImageFileId(existing);
      const candidateFileId = resolveImageFileId(candidate);
      if (existingFileId && candidateFileId && existingFileId === candidateFileId) {
        return true;
      }
      return (
        normalizeUrlForCompare(existing.url) === normalizeUrlForCompare(candidate.url)
      );
    });

    if (!alreadyExists) {
      merged.push(candidate);
    }
  }

  return merged;
}
