"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import {
  updateUnit,
  deleteUnit,
  updateUnitRent,
} from "@/components/services/serviceFetching";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
// Import Swiper components and styles
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Thumbs } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "swiper/css/thumbs";
import UpdateUnitModal from "../scomponent/UpdateUnit/UpdateUnitModal";

export default function UnitDetails({ unit, developers, comboundata }) {
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [updatedUnit, setUpdatedUnit] = useState(unit);
  const [mainImageIndex, setMainImageIndex] = useState(0);
  const [thumbsSwiper, setThumbsSwiper] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const pageParam = searchParams.get("page") || "1";

  // Check if the unit is for rent
  const isRent = updatedUnit?.purpose?.toLowerCase() === "rent";

  // Reference to the fullscreen swiper
  const fullscreenSwiperRef = useRef(null);

  // Handle back navigation with page parameter
  const handleBackToUnits = () => {
    router.push(`/units`);
  };

  const handleDeleteUnit = async () => {
    toast(
      <div className="flex flex-col gap-4 text-black rounded-md">
        <p>Are you sure you want to delete this unit?</p>
        <div className="flex gap-2">
          <button
            className="bg-red-500 cursor-pointer text-white px-4 py-2 rounded-md"
            onClick={() => {
              deleteUnit(unit.unitId);
              toast.dismiss();
              router.push(`/units`);
            }}
          >
            Delete
          </button>
          <button
            className="bg-gray-500 cursor-pointer text-white px-4 py-2 rounded-md"
            onClick={() => {
              toast.dismiss();
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    );
  };

  const handleUpdateUnit = async (updatedUnit, purpose) => {
    if (purpose === "Sell" || purpose === "Buy") {
      await updateUnit(updatedUnit);
    } else if (purpose === "Rent") {
      await updateUnitRent(updatedUnit);
    }

    setIsUpdateModalOpen(false);
    toast.success("Unit updated successfully");
    router.push(`/units/${unit.unitId}`);
  };

  // Open fullscreen gallery when clicking on the main image
  const openFullscreenGallery = () => {
    setIsFullscreen(true);
    // Set the fullscreen swiper to the current main image index
    if (fullscreenSwiperRef.current && fullscreenSwiperRef.current.swiper) {
      setTimeout(() => {
        fullscreenSwiperRef.current.swiper.slideTo(mainImageIndex, 0);
      }, 100);
    }
  };

  // Close fullscreen gallery
  const closeFullscreenGallery = () => {
    setIsFullscreen(false);
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString();
  };

  // Format currency with symbol
  const formatCurrency = (amount, currency = "EGP") => {
    if (amount === undefined || amount === null) return "";
    return `${currency} ${amount.toLocaleString()}`;
  };

  // Format empty or zero values with appropriate labels
  const formatValue = (value, unit = "") => {
    if (value === undefined || value === null || value === "") {
      return "";
    }
    return `${value}${unit ? " " + unit : ""}`;
  };

  // Check if a rent duration type has any non-zero values to display
  const hasDurationValues = (durationType) => {
    if (!updatedUnit?.rentDurationType?.[durationType]) return false;

    const typeDuration = updatedUnit.rentDurationType[durationType];
    return (
      (typeDuration.totalPrice && typeDuration.totalPrice !== 0) ||
      (typeDuration.securityDeposit && typeDuration.securityDeposit !== 0) ||
      (typeDuration.serviceFee && typeDuration.serviceFee !== 0) ||
      (typeDuration.cleaningFee && typeDuration.cleaningFee !== 0)
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="p-6 border-b flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            {updatedUnit?.unitTitle || ""}
          </h1>
          <div className="flex flex-wrap gap-2 mt-2">
            <p className="text-gray-600">
              {formatValue(updatedUnit?.buildingType)}
              {updatedUnit?.buildingType ? " in " : ""}
              {formatValue(updatedUnit?.compound)}
            </p>
          </div>
        </div>
        <div className="flex gap-4">
          {/* Back button that preserves pagination */}
          <button
            onClick={handleBackToUnits}
            className="cursor-pointer bg-gray-500 text-white px-4 py-2 rounded-md flex items-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-1"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                clipRule="evenodd"
              />
            </svg>
            Back to Units
          </button>

          <button
            onClick={() => setIsUpdateModalOpen(true)}
            className="cursor-pointer bg-primary text-white px-4 py-2 rounded-md"
          >
            Update Unit
          </button>

          <button
            onClick={handleDeleteUnit}
            className="cursor-pointer bg-red-500 text-white px-4 py-2 rounded-md"
          >
            Delete Unit
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
        <div className="space-y-4">
          {/* Main image with enhanced fullscreen indicator */}
          <div
            className="relative h-[600px] w-full rounded-lg overflow-hidden cursor-pointer shadow-lg group"
            onClick={openFullscreenGallery}
          >
            {updatedUnit.images && updatedUnit.images[mainImageIndex] ? (
              <Image
                src={updatedUnit.images[mainImageIndex].url}
                alt={`${updatedUnit.unitTitle || "Unit"} - Main Image`}
                fill
                className="object-cover border h-[500px] transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-200">
                <p className="text-gray-500 text-lg">No images available</p>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-end">
              <div className="flex items-center gap-2 text-white mb-4 px-4 py-2 rounded-full bg-black/40 backdrop-blur-sm">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <span>Click to view in fullscreen</span>
              </div>
            </div>
          </div>

          {/* Thumbnail swiper */}
          {updatedUnit.images && updatedUnit.images.length > 0 ? (
            <Swiper
              modules={[Navigation, Thumbs]}
              spaceBetween={10}
              slidesPerView={4}
              navigation
              watchSlidesProgress
              onSwiper={setThumbsSwiper}
              className="swiper-thumbs"
            >
              {updatedUnit.images.map((image, index) => (
                <SwiperSlide key={index}>
                  <div
                    className={`relative h-20 rounded-lg overflow-hidden cursor-pointer transition-all duration-200 ${
                      mainImageIndex === index
                        ? "ring-2 ring-primary scale-95 shadow-md"
                        : "hover:ring-1 hover:ring-primary/50"
                    }`}
                    onClick={() => setMainImageIndex(index)}
                  >
                    <Image
                      src={image.url}
                      alt={`${updatedUnit.unitTitle || "Unit"} - ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                    {mainImageIndex === index && (
                      <div className="absolute inset-0 bg-primary/10 flex items-center justify-center">
                        <div className="w-4 h-4 rounded-full bg-primary/80"></div>
                      </div>
                    )}
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          ) : (
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-gray-500">No thumbnail images available</p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          {/* Price information section - enhanced for rent */}
          <div className="bg-gray-50 p-6 rounded-lg">
            {isRent ? (
              <>
                <h2 className="text-2xl font-bold text-gray-800">
                  {formatCurrency(updatedUnit?.rentPrice)}
                </h2>

                {/* Rent duration types */}
                {updatedUnit?.rentDurationType && (
                  <div className="mt-4 space-y-6">
                    {/* Daily rate - only show if has non-zero values */}
                    {hasDurationValues("daily") && (
                      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                        <h3 className="font-semibold text-lg text-gray-800 flex items-center">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 mr-2 text-blue-500"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                          Daily Rate
                        </h3>
                        <div className="mt-2 grid grid-cols-2 gap-2">
                          {updatedUnit.rentDurationType.daily?.totalPrice >
                            0 && (
                            <div className="col-span-2">
                              <p className="text-gray-500 text-sm">
                                Total Price
                              </p>
                              <p className="font-medium text-gray-800">
                                {formatCurrency(
                                  updatedUnit.rentDurationType.daily
                                    ?.totalPrice,
                                  updatedUnit.rentDurationType.daily?.currency
                                )}
                              </p>
                            </div>
                          )}
                          {updatedUnit.rentDurationType.daily?.securityDeposit >
                            0 && (
                            <div>
                              <p className="text-gray-500 text-sm">
                                Security Deposit
                              </p>
                              <p className="font-medium text-gray-800">
                                {formatCurrency(
                                  updatedUnit.rentDurationType.daily
                                    ?.securityDeposit,
                                  updatedUnit.rentDurationType.daily?.currency
                                )}
                              </p>
                            </div>
                          )}
                          {updatedUnit.rentDurationType.daily?.serviceFee >
                            0 && (
                            <div>
                              <p className="text-gray-500 text-sm">
                                Service Fee
                              </p>
                              <p className="font-medium text-gray-800">
                                {formatCurrency(
                                  updatedUnit.rentDurationType.daily
                                    ?.serviceFee,
                                  updatedUnit.rentDurationType.daily?.currency
                                )}
                              </p>
                            </div>
                          )}
                          {updatedUnit.rentDurationType.daily?.cleaningFee >
                            0 && (
                            <div>
                              <p className="text-gray-500 text-sm">
                                Cleaning Fee
                              </p>
                              <p className="font-medium text-gray-800">
                                {formatCurrency(
                                  updatedUnit.rentDurationType.daily
                                    ?.cleaningFee,
                                  updatedUnit.rentDurationType.daily?.currency
                                )}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Weekly rate - only show if has non-zero values */}
                    {hasDurationValues("weekly") && (
                      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                        <h3 className="font-semibold text-lg text-gray-800 flex items-center">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 mr-2 text-green-500"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                            />
                          </svg>
                          Weekly Rate
                        </h3>
                        <div className="mt-2 grid grid-cols-2 gap-2">
                          {updatedUnit.rentDurationType.weekly?.totalPrice >
                            0 && (
                            <div className="col-span-2">
                              <p className="text-gray-500 text-sm">
                                Total Price
                              </p>
                              <p className="font-medium text-gray-800">
                                {formatCurrency(
                                  updatedUnit.rentDurationType.weekly
                                    ?.totalPrice,
                                  updatedUnit.rentDurationType.weekly?.currency
                                )}
                              </p>
                            </div>
                          )}
                          {updatedUnit.rentDurationType.weekly
                            ?.securityDeposit > 0 && (
                            <div>
                              <p className="text-gray-500 text-sm">
                                Security Deposit
                              </p>
                              <p className="font-medium text-gray-800">
                                {formatCurrency(
                                  updatedUnit.rentDurationType.weekly
                                    ?.securityDeposit,
                                  updatedUnit.rentDurationType.weekly?.currency
                                )}
                              </p>
                            </div>
                          )}
                          {updatedUnit.rentDurationType.weekly?.serviceFee >
                            0 && (
                            <div>
                              <p className="text-gray-500 text-sm">
                                Service Fee
                              </p>
                              <p className="font-medium text-gray-800">
                                {formatCurrency(
                                  updatedUnit.rentDurationType.weekly
                                    ?.serviceFee,
                                  updatedUnit.rentDurationType.weekly?.currency
                                )}
                              </p>
                            </div>
                          )}
                          {updatedUnit.rentDurationType.weekly?.cleaningFee >
                            0 && (
                            <div>
                              <p className="text-gray-500 text-sm">
                                Cleaning Fee
                              </p>
                              <p className="font-medium text-gray-800">
                                {formatCurrency(
                                  updatedUnit.rentDurationType.weekly
                                    ?.cleaningFee,
                                  updatedUnit.rentDurationType.weekly?.currency
                                )}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Monthly rate - only show if has non-zero values */}
                    {hasDurationValues("monthly") && (
                      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                        <h3 className="font-semibold text-lg text-gray-800 flex items-center">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 mr-2 text-purple-500"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                          Monthly Rate
                        </h3>
                        <div className="mt-2 grid grid-cols-2 gap-2">
                          {updatedUnit.rentDurationType.monthly?.totalPrice >
                            0 && (
                            <div className="col-span-2">
                              <p className="text-gray-500 text-sm">
                                Total Price
                              </p>
                              <p className="font-medium text-gray-800">
                                {formatCurrency(
                                  updatedUnit.rentDurationType.monthly
                                    ?.totalPrice,
                                  updatedUnit.rentDurationType.monthly?.currency
                                )}
                              </p>
                            </div>
                          )}
                          {updatedUnit.rentDurationType.monthly
                            ?.securityDeposit > 0 && (
                            <div>
                              <p className="text-gray-500 text-sm">
                                Security Deposit
                              </p>
                              <p className="font-medium text-gray-800">
                                {formatCurrency(
                                  updatedUnit.rentDurationType.monthly
                                    ?.securityDeposit,
                                  updatedUnit.rentDurationType.monthly?.currency
                                )}
                              </p>
                            </div>
                          )}
                          {updatedUnit.rentDurationType.monthly?.serviceFee >
                            0 && (
                            <div>
                              <p className="text-gray-500 text-sm">
                                Service Fee
                              </p>
                              <p className="font-medium text-gray-800">
                                {formatCurrency(
                                  updatedUnit.rentDurationType.monthly
                                    ?.serviceFee,
                                  updatedUnit.rentDurationType.monthly?.currency
                                )}
                              </p>
                            </div>
                          )}
                          {updatedUnit.rentDurationType.monthly?.cleaningFee >
                            0 && (
                            <div>
                              <p className="text-gray-500 text-sm">
                                Cleaning Fee
                              </p>
                              <p className="font-medium text-gray-800">
                                {formatCurrency(
                                  updatedUnit.rentDurationType.monthly
                                    ?.cleaningFee,
                                  updatedUnit.rentDurationType.monthly?.currency
                                )}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {updatedUnit?.availabilityDate && (
                  <p className="text-gray-600 mt-4">
                    Available from: {formatDate(updatedUnit?.availabilityDate)}
                  </p>
                )}

                {updatedUnit?.amenities && updatedUnit.amenities.length > 0 ? (
                  <div className="mt-3">
                    <p className="font-semibold text-gray-700 mb-2">
                      Amenities:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {updatedUnit.amenities.map((amenity, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium"
                        >
                          {amenity}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="mt-3">
                    <p className="font-semibold text-gray-700 mb-2">
                      Amenities:
                    </p>
                    <p className="text-gray-500">No amenities specified</p>
                  </div>
                )}
              </>
            ) : (
              <>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">
                    {updatedUnit?.totalPrice
                      ? `EGP ${updatedUnit.totalPrice.toLocaleString()}`
                      : ""}
                  </h2>
                  <div className="flex items-center gap-2 mt-2 bg-gray-200 px-4 rounded-xl text-sm font-semibold text-slate-700 w-fit">
                    {updatedUnit?.paymentPlans?.years && (
                      <span>{updatedUnit?.paymentPlans?.years} Years - </span>
                    )}
                    {updatedUnit?.paymentPlans?.price && (
                      <span>{updatedUnit?.paymentPlans?.price} EGP </span>
                    )}
                    {updatedUnit?.paymentPlans?.maintenance > 0 && (
                      <span>
                        - {updatedUnit?.paymentPlans?.maintenance} Maintenance
                      </span>
                    )}
                  </div>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {updatedUnit?.deliveryDate && (
                    <div>
                      <p className="text-gray-600">Delivery Date:</p>
                      <p className="font-semibold">
                        {formatDate(updatedUnit?.deliveryDate)}
                      </p>
                    </div>
                  )}
                  {updatedUnit?.deliveryStatus && (
                    <div>
                      <p className="text-gray-600">Delivery Status:</p>
                      <p className="font-semibold">
                        {updatedUnit?.deliveryStatus}
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {updatedUnit.roomsCount && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-600">Rooms</p>
                <p className="font-semibold">
                  {formatValue(updatedUnit.roomsCount)}
                </p>
              </div>
            )}
            {updatedUnit.bathroomCount && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-600">Bathrooms</p>
                <p className="font-semibold">
                  {formatValue(updatedUnit.bathroomCount)}
                </p>
              </div>
            )}
            {updatedUnit.floor && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-600">Floor</p>
                <p className="font-semibold">
                  {formatValue(updatedUnit.floor)}
                </p>
              </div>
            )}
            {updatedUnit.view && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-600">View</p>
                <p className="font-semibold">{formatValue(updatedUnit.view)}</p>
              </div>
            )}
            {updatedUnit.city && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-600">City</p>
                <p className="font-semibold">{formatValue(updatedUnit.city)}</p>
              </div>
            )}
            {updatedUnit.country && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-600">Country</p>
                <p className="font-semibold">
                  {formatValue(updatedUnit.country)}
                </p>
              </div>
            )}
            {updatedUnit.purpose && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-600">Purpose</p>
                <p className="font-semibold">
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                      isRent
                        ? "bg-blue-100 text-blue-800"
                        : "bg-purple-100 text-purple-800"
                    }`}
                  >
                    {updatedUnit.purpose}
                  </span>
                </p>
              </div>
            )}
            {updatedUnit.buildingType && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-600">Building Type</p>
                <p className="font-semibold">
                  {formatValue(updatedUnit.buildingType)}
                </p>
              </div>
            )}
          </div>

          {/* Additional Details - only show if values exist */}
          <div className="space-y-4">
            {updatedUnit.finishing && (
              <div className="flex justify-between">
                <span className="text-gray-600">Finishing</span>
                <span className="font-semibold">
                  {formatValue(updatedUnit.finishing)}
                </span>
              </div>
            )}
            {updatedUnit.landArea > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Land Area</span>
                <span className="font-semibold">
                  {formatValue(updatedUnit.landArea, "m²")}
                </span>
              </div>
            )}
            {updatedUnit.gardenSize > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Garden Size</span>
                <span className="font-semibold">
                  {formatValue(updatedUnit.gardenSize, "m²")}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-gray-100 p-6 border-t">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {(updatedUnit.compound ||
            updatedUnit.city ||
            updatedUnit.country) && (
            <div>
              <h3 className="font-semibold text-gray-800">Location</h3>
              <p className="text-gray-600">
                {updatedUnit.compound ? updatedUnit.compound : ""}
                {updatedUnit.compound && updatedUnit.city ? ", " : ""}
                {updatedUnit.city ? updatedUnit.city : ""}
                {(updatedUnit.compound || updatedUnit.city) &&
                updatedUnit.country
                  ? ", "
                  : ""}
                {updatedUnit.country ? updatedUnit.country : ""}
              </p>
            </div>
          )}
          {updatedUnit.developer && (
            <div>
              <h3 className="font-semibold text-gray-800">Developer</h3>
              <p className="text-gray-600">{updatedUnit.developer}</p>
            </div>
          )}
        </div>
      </div>

      <div className="p-6">
        <UpdateUnitModal
          isOpen={isUpdateModalOpen}
          onClose={() => setIsUpdateModalOpen(false)}
          onSubmit={handleUpdateUnit}
          unit={unit}
          developers={developers}
          comboundata={comboundata}
        />
      </div>

      {/* Enhanced Fullscreen Gallery Modal */}
      {isFullscreen && (
        <div className="fixed inset-0 bg-black z-50 flex flex-col">
          <div className="flex justify-between items-center p-4">
            <div className="text-white text-lg font-medium">
              {updatedUnit.unitTitle || "Unit"} - Image Gallery
            </div>
            <button
              onClick={closeFullscreenGallery}
              className="text-white bg-black bg-opacity-50 p-2 rounded-full hover:bg-opacity-70 transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <Swiper
              ref={fullscreenSwiperRef}
              modules={[Navigation, Pagination]}
              spaceBetween={0}
              slidesPerView={1}
              navigation
              pagination={{ clickable: true }}
              className="w-full h-full"
              initialSlide={mainImageIndex}
              onSlideChange={(swiper) => setMainImageIndex(swiper.activeIndex)}
            >
              {updatedUnit.images && updatedUnit.images.length > 0 ? (
                updatedUnit.images.map((image, index) => (
                  <SwiperSlide
                    key={index}
                    className="flex items-center justify-center"
                  >
                    <div className="relative w-full h-full max-w-7xl max-h-screen mx-auto">
                      <Image
                        src={image.url}
                        alt={`${updatedUnit.unitTitle || "Unit"} - ${index + 1}`}
                        fill
                        className="object-contain"
                        priority
                      />
                    </div>
                  </SwiperSlide>
                ))
              ) : (
                <SwiperSlide className="flex items-center justify-center">
                  <div className="text-white text-center">
                    <p className="text-xl">No images available</p>
                  </div>
                </SwiperSlide>
              )}
            </Swiper>
          </div>
          <div className="p-4 flex justify-between items-center bg-black bg-opacity-50 backdrop-blur-sm">
            <div className="text-white">
              {updatedUnit.images && updatedUnit.images.length > 0
                ? `Image ${mainImageIndex + 1} of ${updatedUnit.images.length}`
                : "No images"}
            </div>
            <div className="text-white text-sm">
              Use arrow keys or swipe to navigate
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
