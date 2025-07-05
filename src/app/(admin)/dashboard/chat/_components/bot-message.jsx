"use client";

import ImageSwiperModal from "@/components/ui/images-swiper-modal";
import PropertyCard from "@/components/ui/property-card";
import { useI18n } from "@/context/translate-api";
import { formatTimestamp } from "@/utils/formateDate";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

export default function BotMessageCard({ message }) {
  const {
    properties,
    bot_response,
    timestamp,
    project_data,
    crm_link,
    project_phases,
  } = message;
  const [fullscreenImg, setFullscreenImg] = useState(null);
  const [swiperImages, setSwiperImages] = useState([]);
  const [showImagesModal, setShowImagesModal] = useState(false);

  const propertiesItems = properties ? Object.values(properties) : [];
  const { t } = useI18n();
  return (
    <div className="rounded-lg p-3 bg-[#e2dbff] flex flex-col max-w-xl">
      {bot_response && <div className="text-sm">{bot_response}</div>}

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

          {project_data.master_plan && (
            <Image
              src={project_data.master_plan}
              alt="Master Plan"
              width={400}
              height={200}
              className="w-full max-w-full h-auto rounded-md border mx-auto cursor-pointer transition-transform duration-200 hover:scale-[1.02]"
              onClick={() => setFullscreenImg(project_data.master_plan)}
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
                    <Image
                      src={img.url}
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
                  <Image
                    src={phase.master_plan}
                    alt="Master Plan"
                    width={400}
                    height={200}
                    className="w-full max-w-full h-auto rounded-md border mx-auto cursor-pointer transition-transform duration-200 hover:scale-[1.02]"
                    onClick={() => setFullscreenImg(phase.master_plan)}
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
                          <Image
                            src={img.url}
                            alt={`Phase Image ${idx + 1}`}
                            width={80}
                            height={80}
                            className="w-20 h-20 object-cover rounded cursor-pointer border hover:scale-105 transition"
                            onClick={() => {
                              console.log(phase.images);
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
          <Image
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
          {t.viewInCRM || "View in CRM"}
        </Link>
      )}

      {timestamp && (
        <div className="text-xs mt-2 text-gray-600 text-end">
          {formatTimestamp(timestamp)}
        </div>
      )}
    </div>
  );
}
