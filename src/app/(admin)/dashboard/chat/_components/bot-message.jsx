"use client"

import React, { useState } from "react";
import PropertyCard from "@/components/ui/property-card";
import { useI18n } from "@/context/translate-api";

export default function BotMessageCard({ message }) {
  const { properties, bot_response, timestamp, project_data } = message;
  const [fullscreenImg, setFullscreenImg] = useState(null);

  const propertiesItems = properties ? Object.values(properties) : [];
  const { t } = useI18n();

  return (
    <div className="w-fit rounded-lg p-2 bg-white flex flex-col ">
      <div className="text-sm ">{bot_response || message}</div>

      {propertiesItems?.length > 0 &&
        propertiesItems.map((itm, idx) => (
          <PropertyCard key={idx} data={itm} message={message} project_data={project_data} />
        ))}

      {/* Project Data Card */}
      {project_data && Object.keys(project_data).length > 0 && (
        <div className="mt-4 p-4 rounded-xl shadow-lg border bg-gray-50 flex flex-col gap-3 max-w-md">
          <h2 className="text-lg font-bold text-gray-800 mb-2">{project_data.name}</h2>
          {project_data.master_plan && (
            <img
              src={project_data.master_plan}
              alt="Master Plan"
              className="w-full max-w-full h-auto rounded-md border mx-auto cursor-pointer transition-transform duration-200 hover:scale-105 hover:shadow-2xl"
              onClick={() => setFullscreenImg(project_data.master_plan)}
              title={t.clickToViewFullscreen}
            />
          )}
          <div className="flex gap-3 mt-2">
            {project_data.google_map_link && (
              <a
                href={project_data.google_map_link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-[#edeaff] text-primary rounded-lg font-medium shadow-sm hover:bg-[#d6d3fa] transition"
              >
                <svg width="20" height="20" fill="currentColor" className="text-red-500" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                {t.viewOnGoogleMaps}
              </a>
            )}
            {project_data.video_url && (
              <a
                href={project_data.video_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[#edeaff] text-primary rounded-lg font-medium shadow-sm hover:bg-[#d6d3fa] transition"
              >
                <svg width="22" height="22" fill="red" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a2.994 2.994 0 0 0-2.112-2.12C19.19 3.5 12 3.5 12 3.5s-7.19 0-9.386.566a2.994 2.994 0 0 0-2.112 2.12C0 8.384 0 12 0 12s0 3.616.502 5.814a2.994 2.994 0 0 0 2.112 2.12C4.81 20.5 12 20.5 12 20.5s7.19 0 9.386-.566a2.994 2.994 0 0 0 2.112-2.12C24 15.616 24 12 24 12s0-3.616-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
                {t.watchVideo}
              </a>
            )}
          </div>
        </div>
      )}

      {/* Phases Card */}
      {project_data?.phases && Object.keys(project_data.phases).length > 0 && (
        <div className="mt-4 p-4 rounded-xl shadow-lg border bg-white flex flex-col gap-3 max-w-md">
          <h3 className="text-md font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <svg width="20" height="20" fill="currentColor" className="text-blue-500" viewBox="0 0 24 24">
              <path d="M4 13h4v-2H4v2zm0 4h4v-2H4v2zm0-8h4V7H4v2zm6 8h10v-2H10v2zm0-4h10v-2H10v2zm0-6v2h10V7H10z"/>
            </svg>
          {t.phase}: {project_data.phases.name}
          </h3>
          {project_data.phases.master_plan && (
            <img
              src={project_data.phases.master_plan}
              alt="Phase Master Plan"
              className="w-full max-w-full h-auto rounded-md border mx-auto cursor-pointer transition-transform duration-200 hover:scale-105 hover:shadow-2xl"
              onClick={() => setFullscreenImg(project_data.phases.master_plan)}
              title={t.clickToViewFullscreen}
            />
          )}
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
          <img
            src={fullscreenImg}
            alt="Fullscreen"
            className="max-h-[90vh] max-w-[90vw] rounded-lg shadow-2xl border-4 border-white"
          />
        </div>
      )}
    </div>
  );
}
