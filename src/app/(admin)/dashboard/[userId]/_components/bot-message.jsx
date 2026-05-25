"use client";

import ImageSwiperModal from "@/components/ui/images-swiper-modal";
import PropertyCard from "@/components/ui/property-card";
import { useI18n } from "@/context/translate-api";
import { formatTimestamp } from "@/utils/formateDate";
import SafeImage from "@/components/ui/safe-image";
import { getDisplayImageUrl } from "@/utils/imageUtils";
import Link from "next/link";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function BotMessageCard({ message }) {
  const {
    properties,
    bot_response,
    timestamp,
    source,
    project_data,
    crm_link,
    project_phases,
  } = message;

  const [fullscreenImg, setFullscreenImg] = useState(null);
  const [swiperImages, setSwiperImages] = useState([]);
  const [showImagesModal, setShowImagesModal] = useState(false);

  const propertiesItems = properties ? Object.values(properties) : [];
  const { t } = useI18n();
  const isWhatsappAutomationSource =
    source === "whatsapp_automation" || source === "wa_automation";

  return (
    <div className="rounded-lg p-3 bg-[#e2dbff] flex flex-col max-w-xl">
      {bot_response && (
        <div className="text-sm text-primary markdown-content" style={{ whiteSpace: "normal" }}>
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              ul: ({ children, ...props }) => (
                <ul
                  className="list-disc pl-4 sm:pl-5 space-y-1.5 sm:space-y-2 my-3 sm:my-4"
                  style={{ whiteSpace: "normal" }}
                  {...props}
                >
                  {children}
                </ul>
              ),
              ol: ({ children, ...props }) => (
                <ol
                  className="list-decimal pl-4 sm:pl-5 space-y-1.5 sm:space-y-2 my-3 sm:my-4"
                  style={{ whiteSpace: "normal" }}
                  {...props}
                >
                  {children}
                </ol>
              ),
              li: ({ children, ...props }) => (
                <li
                  className="leading-relaxed mb-2 sm:mb-2.5 break-words text-sm sm:text-base"
                  style={{ whiteSpace: "normal", display: "list-item" }}
                  {...props}
                >
                  {children}
                </li>
              ),
              p: ({ children, ...props }) => (
                <p
                  className="mb-3 sm:mb-4 leading-relaxed last:mb-0 text-sm sm:text-base break-words"
                  style={{ whiteSpace: "normal" }}
                  {...props}
                >
                  {children}
                </p>
              ),
              strong: ({ children, ...props }) => (
                <strong
                  className="font-semibold text-gray-900 dark:text-gray-100"
                  {...props}
                >
                  {children}
                </strong>
              ),
              em: ({ children, ...props }) => (
                <em
                  className="italic text-gray-800 dark:text-gray-200"
                  {...props}
                >
                  {children}
                </em>
              ),
              hr: ({ ...props }) => (
                <hr
                  className="my-4 sm:my-5 border-gray-300 dark:border-gray-600"
                  {...props}
                />
              ),
              code: ({ inline, children, ...props }) => {
                if (inline) {
                  return (
                    <code
                      className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs font-mono"
                      {...props}
                    >
                      {children}
                    </code>
                  );
                }
                return (
                  <code
                    className="block p-3 bg-gray-100 dark:bg-gray-800 rounded text-xs font-mono overflow-x-auto"
                    {...props}
                  >
                    {children}
                  </code>
                );
              },
            }}
          >
            {(() => {
              const content = String(bot_response || "");
              // Normalize line endings first
              let processed = content.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
              
              // Convert inline bullet lists to proper markdown format
              // Pattern 1: After punctuation like colon, start new paragraph list
              // "text: - item" -> "text:\n\n- item"
              processed = processed.replace(/([.:،,؛;!?]\s*)\s+-\s+/g, "$1\n\n- ");
              
              // Pattern 2: Convert remaining inline " - " to newline list items
              // Only if not already on a new line (avoid double conversion)
              // "item1 - item2" -> "item1\n- item2"
              processed = processed.replace(/([^\n])\s+-\s+([A-Z\u0600-\u06FF])/g, "$1\n- $2");
              processed = processed.replace(/([^\n])\s+-\s+/g, "$1\n- ");
              
              // Clean up: ensure lists don't have excessive spacing
              processed = processed.replace(/\n{3,}/g, "\n\n");
              
              return processed.trim();
            })()}
          </ReactMarkdown>
        </div>
      )}

      {propertiesItems?.length > 0 &&
        propertiesItems.map((itm, idx) => (
          <PropertyCard key={idx} data={itm} message={message} />
        ))}

      {/* Project Data Card */}
      {project_data && Object.keys(project_data).length > 0 && (
        <div className="mt-4 p-4 rounded shadow-lg border bg-gray-50 flex flex-col gap-3 max-w-md">
          <div>
            <h2 className="text-lg font-bold text-gray-800">
              {project_data?.en_name}
            </h2>
            {project_data.description && (
              <div className="text-gray-700 text-sm">
                {project_data.description}
              </div>
            )}
          </div>

          {project_data.master_plan?.url && (
            <SafeImage
              src={getDisplayImageUrl(project_data.master_plan.url)}
              alt="Master Plan"
              width={400}
              height={200}
              className="w-full max-w-full h-auto rounded-md border mx-auto cursor-pointer transition-transform duration-200 hover:scale-[1.02]"
              onClick={() => setFullscreenImg(getDisplayImageUrl(project_data.master_plan.url))}
              title={t.clickToViewFullscreen}
            />
          )}

          {/* Project Images Preview */}
          {project_data.images &&
            Array.isArray(project_data.images) &&
            project_data.images.length > 0 && (
              <div className="flex flex-wrap gap-2 relative">
                {project_data.images.slice(0, 4).map((img, idx) => (
                  <div key={img.fileId || idx} className="relative">
                    <SafeImage
                      src={getDisplayImageUrl(img.url)}
                      alt={`Project Image ${idx + 1}`}
                      width={80}
                      height={80}
                      className="w-20 h-20 object-cover rounded cursor-pointer border hover:scale-105 transition"
                      onClick={() => {
                        setShowImagesModal(true);
                        setSwiperImages(project_data.images);
                      }}
                    />
                    {/* If this is the 4th image and there are more, show overlay */}
                    {idx === 3 && project_data.images.length > 4 && (
                      <div
                        className="absolute inset-0 bg-black/60 flex items-center justify-center rounded cursor-pointer text-white text-lg font-semibold"
                        onClick={() => {
                          setShowImagesModal(true);
                          setSwiperImages(project_data.images);
                        }}
                      >
                        +{project_data.images.length - 4}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

          {(project_data.google_map_link || project_data.video_url) && (
            <div className="flex gap-3">
              <a
                href={project_data.google_map_link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-[#edeaff] text-primary rounded-lg font-medium shadow-sm hover:bg-[#d6d3fa] transition"
              >
                <svg
                  width="20"
                  height="20"
                  fill="currentColor"
                  className="text-red-500"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                </svg>
                {t.viewOnGoogleMaps}
              </a>

              <a
                href={project_data.video_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[#edeaff] text-primary rounded-lg font-medium shadow-sm hover:bg-[#d6d3fa] transition"
              >
                <svg width="22" height="22" fill="red" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a2.994 2.994 0 0 0-2.112-2.12C19.19 3.5 12 3.5 12 3.5s-7.19 0-9.386.566a2.994 2.994 0 0 0-2.112 2.12C0 8.384 0 12 0 12s0 3.616.502 5.814a2.994 2.994 0 0 0 2.112 2.12C4.81 20.5 12 20.5 12 20.5s7.19 0 9.386-.566a2.994 2.994 0 0 0 2.112-2.12C24 15.616 24 12 24 12s0-3.616-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
                {t.watchVideo}
              </a>
            </div>
          )}
        </div>
      )}

      {/* Project Phases Cards */}
      {project_phases &&
        Array.isArray(project_phases) &&
        project_phases.length > 0 && (
          <div className="mt-6 flex flex-col gap-4">
            {project_phases.map((phase, idx) => (
              <div
                key={phase.id || idx}
                className="p-4 rounded shadow-lg border bg-gray-50 flex flex-col gap-3 max-w-md"
              >
                <div>
                  <h2 className="text-lg font-bold text-gray-800">
                    {phase.name}
                  </h2>
                  {phase.description && (
                    <div className="text-gray-700 text-sm">
                      {phase.description}
                    </div>
                  )}
                </div>
                {phase.master_plan && (
                  <SafeImage
                    src={getDisplayImageUrl(typeof phase.master_plan === "string" ? phase.master_plan : phase.master_plan?.url)}
                    alt="Master Plan"
                    width={400}
                    height={200}
                    className="w-full max-w-full h-auto rounded-md border mx-auto cursor-pointer transition-transform duration-200 hover:scale-[1.02]"
                    onClick={() => setFullscreenImg(getDisplayImageUrl(typeof phase.master_plan === "string" ? phase.master_plan : phase.master_plan?.url))}
                    title={t.clickToViewFullscreen}
                  />
                )}
                {/* Phase Images Preview */}
                {phase.images &&
                  Array.isArray(phase.images) &&
                  phase.images.length > 0 && (
                    <div className="flex flex-wrap gap-2 relative">
                      {phase.images.slice(0, 4).map((img, idx) => (
                        <div key={img.fileId || idx} className="relative">
                          <SafeImage
                            src={getDisplayImageUrl(img.url)}
                            alt={`Phase Image ${idx + 1}`}
                            width={80}
                            height={80}
                            className="w-20 h-20 object-cover rounded cursor-pointer border hover:scale-105 transition"
                            onClick={() => {
                              setShowImagesModal(true);
                              setSwiperImages(phase.images);
                            }}
                          />
                          {idx === 3 && phase.images.length > 4 && (
                            <div
                              className="absolute inset-0 bg-black/60 flex items-center justify-center rounded cursor-pointer text-white text-lg font-semibold"
                              onClick={() => {
                                setShowImagesModal(true);
                                setSwiperImages(phase.images);
                              }}
                            >
                              +{phase.images.length - 4}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
              </div>
            ))}
          </div>
        )}

      {/* Fullscreen Modal */}
      {fullscreenImg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80">
          <button
            onClick={() => setFullscreenImg(null)}
            className="absolute top-6 right-6 bg-white text-gray-700 rounded-full w-10 h-10 flex items-center justify-center text-2xl font-bold shadow-lg hover:bg-gray-200 transition z-50"
            aria-label="Close"
          >
            ×
          </button>
          <SafeImage
            src={fullscreenImg}
            alt="Fullscreen"
            width={900}
            height={600}
            className="max-h-[90vh] max-w-[90vw] rounded-lg shadow-2xl border-4 border-white"
          />
        </div>
      )}

      {/* Project Images Swiper Modal */}
      {showImagesModal && (
        <ImageSwiperModal
          open={showImagesModal}
          onClose={() => {
            setShowImagesModal(false);
            setSwiperImages([]);
          }}
          images={swiperImages}
        />
      )}

      {crm_link && (
        <Link
          href={crm_link}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 flex items-center gap-2 px-4 py-2 bg-[#edeaff] text-primary rounded-lg font-medium shadow-sm hover:bg-[#d6d3fa] transition w-fit"
        >
          <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
          </svg>
          {t.viewInCRM || "View in Dashboard"}
        </Link>
      )}

      {timestamp && (
        <div className="text-xs mt-2 text-gray-600 flex items-center justify-end gap-1.5">
          {isWhatsappAutomationSource && (
            <span
              className="inline-flex items-center justify-center text-emerald-600"
              title={t?.whatsapp || "WhatsApp"}
              aria-label={t?.whatsapp || "WhatsApp"}
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.188z" />
              </svg>
            </span>
          )}
          {formatTimestamp(timestamp)}
        </div>
      )}
    </div>
  );
}
