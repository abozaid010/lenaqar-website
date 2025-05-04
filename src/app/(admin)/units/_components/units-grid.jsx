"use client";

import Link from "next/link";
import { MapPin, Share2 } from "lucide-react";
import { useState } from "react";
import { getShareUnitData } from "@/components/services/serviceFetching";
import ShareModal from "./units-share-modal";

export default function UnitsGrid({ units }) {
  const [showModal, setShowModal] = useState(false);
  const [shareData, setShareData] = useState(null);
  const [loadingShare, setLoadingShare] = useState(false);

  const handleShareClick = async (unitId, e) => {
    e.preventDefault();
    e.stopPropagation();

    setShowModal(true);
    setLoadingShare(true);

    try {
      const data = await getShareUnitData(unitId);
      console.log("Received share data:", data);
      setShareData(data);
    } catch (error) {
      console.error("Error fetching share data:", error);
      setShareData(null);
    } finally {
      setLoadingShare(false);
    }
  };

  return (
    <>
      {units.length === 0 ? (
        <div className="text-center font-medium text-xl mt-5 text-gray-400">
          No units found.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-5">
          {units.map((u, idx) => (
            <Link href={`/units/${u.unitId}`} key={idx} className="relative">
              {/* Image Section */}
              <div className="relative w-full h-92 overflow-hidden rounded-lg shadow-lg">
                {u.images && u.images.length > 0 ? (
                  <img
                    src={u.images[0].url}
                    alt={u.name || u.compound || "Property"}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-400">No image</span>
                  </div>
                )}

                {/* Share Button */}
                <button
                  type="button"
                  onClick={(e) => handleShareClick(u.unitId, e)}
                  className="absolute top-2 left-2 cursor-pointer p-2.5 bg-white/80 rounded-full shadow-lg border border-gray-100 group"
                >
                  <Share2 className="w-4 h-4 text-primary group-hover:text-white" />
                </button>
              </div>

              {/* Text Overlay Section */}
              <div className="absolute bottom-4 left-[5%] w-[90%] bg-black/35 py-2 px-3 rounded-md">
                <h3 className="text-lg font-bold text-white line-clamp-1">
                  {u?.unitTitle || "Unnamed Property"}
                </h3>
                <div className="flex items-center text-white/90 mb-1">
                  <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span className="line-clamp-1 text-sm">
                    {u.city || "Location not specified"}
                  </span>
                </div>

                {/* Compound and Purpose Display */}
                <div className="flex flex-wrap gap-2 mb-2">
                  {u.compound && (
                    <span className="px-2 py-1 bg-blue-100 text-primary rounded-full text-xs font-medium">
                      {u.compound}
                    </span>
                  )}
                  {u.purpose && (
                    <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                      {u.purpose}
                    </span>
                  )}
                </div>

                {/* Pricing Information */}
                <div className="text-sm text-white/90">
                  {u.purpose === "Rent" || u.purpose === "rent" ? (
                    <span>
                      <span className="font-medium">Rent Price:</span>{" "}
                      {u.rentDurationType?.daily?.price
                        ? `${u.rentDurationType.daily.price} EGP/day`
                        : u.rentDurationType?.weekly?.price
                          ? `${u.rentDurationType.weekly.price} EGP/week`
                          : u.rentDurationType?.monthly?.price
                            ? `${u.rentDurationType.monthly.price} EGP/month`
                            : u.rentPrice
                              ? `${u.rentPrice} EGP`
                              : "Price not specified"}
                    </span>
                  ) : (
                    u.totalPrice && (
                      <span>
                        <span className="font-medium">Total Price:</span>{" "}
                        {u.totalPrice} EGP
                      </span>
                    )
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* ShareModal component with the correct props */}
      <ShareModal
        showModal={showModal}
        setShowModal={setShowModal}
        shareData={shareData}
        loadingShare={loadingShare}
      />
    </>
  );
}
