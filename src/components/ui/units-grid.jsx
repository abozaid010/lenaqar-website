"use client";

import Link from "next/link";
import Image from "next/image";
import { useI18n } from "@/context/translate-api";

import { Forward, ForwardIcon, MapPin, Share, Share2 } from "lucide-react";
import { useState } from "react";
import { getShareUnitData } from "@/components/services/serviceFetching";
import ShareModal from "@/components/ui/units-share-modal";
import shareButton from "../../../public/share.svg";

export default function UnitsGrid({ units, readonly = false }) {
  const [showModal, setShowModal] = useState(false);
  const [shareData, setShareData] = useState(null);
  const [loadingShare, setLoadingShare] = useState(false);
  const { t } = useI18n();

  // Add a formattcer function for prices
  const formatPrice = (price) => {
    if (!price) return "Price not specified";
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

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
        <div className="text-center font-medium text-xl mt-5 text-gray-400 ">
          No units found.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3  mt-4">
          {units.map((u, idx) => (
            <Link
              href={` ${readonly ? "/allProberties/" : "/units/"}${u.unitId}`}
              key={idx}
              className="relative"
            >
              {/* Image Section */}
              <div className="relative w-full h-92 overflow-hidden rounded-md shadow-lg">
                {u.images && u.images.length > 0 ? (
                  <Image
                    fill
                    src={u.images[0].url || "/images/defaultImage.jpg"}
                    alt={u.name || u.compound || "Property"}
                    loading="eager"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = "/images/defaultImage.jpg";
                      e.currentTarget.onerror = null;
                    }}
                    priority={true}
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-400">No image</span>
                  </div>
                )}

                {/* Share Button */}
                {!readonly ? (
                  <div className="  ">
                    <button
                      type="button"
                      onClick={(e) => handleShareClick(u.unitId, e)}
                      className="absolute  top-2 right-5 cursor-pointer   group"
                    >
                      <img src={shareButton.src} alt="share" />
                    </button>
                    <p
                      style={{
                        fontWeight: "500",
                      }}
                      className="absolute  text-[14px]  top-3 rounded-sm left-5 cursor-pointer bg-primary text-white px-2 capitalize"
                    >
                      {" "}
                  {t.for}{u.purpose === "rent" ? t.rent: t.sell}
                     
                    </p>
                  </div>
                ) : (
                  ""
                )}
              </div>

              {/* Text Overlay Section */}
              <div className="absolute bottom-0 left-0 w-full bg-black/40 py-2 px-3 rounded-b-lg">
                <h3 className="text-[20px] font-bold text-white line-clamp-1">
                  {u?.unitTitle || "Unnamed Property"}
                </h3>
                <div className="flex items-center justify-between text-[12.5px] text-white font-semibold mb-1">
                  {/* <MapPin className="w-4 h-4 mr-2 flex-shrink-0" /> */}
                  <p className=" text-white font-normal text-[16px]"> {t.city} </p>
                  <span className="line-clamp-1 text-[14px] font-bold">
                    {u.city || "Location not specified"}
                  </span>
                </div>

                {/* Compound and Purpose Display */}
                <div className="flex flex-wrap justify-between gap-2 mb-2">
                  <p className=" text-white text-[16px] font-normal">{t.project}</p>
                  <div>
                    {u.compound && (
                      <span className=" py-1 text-white text-[14px]  rounded-full text-xs font-bold">
                        {u.compound}
                      </span>
                    )}
                  </div>
                </div>

                {/* Pricing Information */}
                <div className="text-sm flex items-center justify-between text-white">
                  {u.purpose === "Rent" || u.purpose === "rent" ? (
                    <div className="flex items-center justify-between w-full">
                      <div className="font-normal text-[16px]">{t.rentPrice}</div>
                      <div className=" font-semibold text-[14px]">
                        {u.rentDurationType?.daily?.price
                          ? `${formatPrice(u.rentDurationType.daily.price)} EGP/day`
                          : u.rentDurationType?.weekly?.price
                            ? `${formatPrice(u.rentDurationType.weekly.price)} EGP/week`
                            : u.rentDurationType?.monthly?.price
                              ? `${formatPrice(u.rentDurationType.monthly.price)} EGP/month`
                              : u.rentPrice
                                ? `${formatPrice(u.rentPrice)} EGP`
                                : "Price not specified"}
                      </div>
                    </div>
                  ) : (
                    u.totalPrice && (
                      <div className="flex items-center justify-between w-full">
                        <span className="font-normal text-[16px]">
                          {t.totalPrice}
                        </span>
                        <span className=" font-semibold text-[14px]">
                          {formatPrice(u.totalPrice)} EGP
                        </span>
                      </div>
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
