"use client";
import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import im from "../../../../public/images/building1.jpg"
// Change this import to match the actual file extension

import { updateUnit, deleteUnit, updateUnitRent } from "@/components/services/serviceFetching";
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
  const pageParam = searchParams.get('page') || '1';

  // Reference to the fullscreen swiper
  const fullscreenSwiperRef = useRef(null);

  // Handle back navigation with page parameter
  const handleBackToUnits = () => {
    router.push(`/dashbord/units?page=${pageParam}`);
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
              router.push(`/dashbord/units?page=${pageParam}`);
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
    let newUnit;
  
    if (purpose === "Sell" || purpose === "Buy") {
      newUnit = await updateUnit(updatedUnit);
    } else if (purpose === "Rent") {
      newUnit = await updateUnitRent(updatedUnit);
    }
  
    setIsUpdateModalOpen(false);
    toast.success('Unit updated successfully');
    router.push(`/dashbord/units/${unit.unitId}?page=${pageParam}`);
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

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="p-6 border-b flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">{unit?.unitTitle}</h1>
          <div className="flex flex-wrap gap-2 mt-2">
            <p className="text-gray-600">
              {unit?.buildingType} in {unit?.compound}
            </p>
          </div>
        </div>
        <div className="flex gap-4">
          {/* Back button that preserves pagination */}
          <button 
            onClick={handleBackToUnits}
            className="cursor-pointer bg-gray-500 text-white px-4 py-2 rounded-md flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
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
            {updatedUnit.images && updatedUnit.images[mainImageIndex] && (
              <Image
                src={updatedUnit.images[mainImageIndex].url || im.src}
                alt={`${updatedUnit.unitTitle} - Main Image`}
                fill
                className="object-cover border h-[500px]  transition-transform duration-300 group-hover:scale-105"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-end">
              <div className="flex items-center gap-2 text-white mb-4 px-4 py-2 rounded-full bg-black/40 backdrop-blur-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span>Click to view in fullscreen</span>
              </div>
            </div>
          </div>
          
          {/* Thumbnail swiper */}
          {updatedUnit.images && updatedUnit.images.length > 0 && (
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
                      src={image.url || im.src}
                      alt={`${updatedUnit.unitTitle} - ${index + 1}`}
                      fill
                      className="object-cover "
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
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h2 className="text-2xl font-bold text-gray-800">

              EGP {updatedUnit?.totalPrice ? updatedUnit.totalPrice.toLocaleString() : '0'}
            </h2>
            <p className="text-gray-600">
              Down Payment: EGP {updatedUnit?.downPayment ? updatedUnit.downPayment.toLocaleString() : '0'}
            </p>
            <p className="text-gray-600">
              Payment Plans: {updatedUnit?.paymentPlans || 'N/A'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-600">Rooms</p>
              <p className="font-semibold">{updatedUnit.roomsCount}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-600">Bathrooms</p>
              <p className="font-semibold">{updatedUnit.bathroomCount}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-600">Floor</p>
              <p className="font-semibold">{updatedUnit.floor}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-600">View</p>
              <p className="font-semibold">{updatedUnit.view}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-600">City</p>
              <p className="font-semibold">{updatedUnit.city}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-600">Country</p>
              <p className="font-semibold">{updatedUnit.country}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-600">Purpose</p>
              <p className="font-semibold">
                <span className="inline-block px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                  {updatedUnit.purpose}
                </span>
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-600">Building Type</p>
              <p className="font-semibold">{updatedUnit.buildingType}</p>
            </div>
          </div>

          {/* Additional Details */}
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-600">Finishing</span>
              <span className="font-semibold">{updatedUnit.finishing}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Land Area</span>
              <span className="font-semibold">{updatedUnit.landArea} m²</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Garden Size</span>
              <span className="font-semibold">{updatedUnit.gardenSize} m²</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Delivery Date</span>
              <span className="font-semibold">
                {updatedUnit.deliveryDate ? new Date(updatedUnit.deliveryDate).toLocaleDateString() : 'N/A'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gray-100 p-6 border-t">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-gray-800">Location</h3>
            <p className="text-gray-600">
              {updatedUnit.compound}, {updatedUnit.city}, {updatedUnit.country}
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-800">Developer</h3>
            <p className="text-gray-600">{updatedUnit.developer}</p>
          </div>
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
              {updatedUnit.unitTitle} - Image Gallery
            </div>
            <button 
              onClick={closeFullscreenGallery}
              className="text-white bg-black bg-opacity-50 p-2 rounded-full hover:bg-opacity-70 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
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
              {updatedUnit.images && updatedUnit.images.map((image, index) => (
                <SwiperSlide key={index} className="flex items-center justify-center">
                  <div className="relative w-full h-full max-w-7xl max-h-screen mx-auto ">
                    <Image
                      src={image.url || im.src}
                      alt={`${updatedUnit.unitTitle} - ${index + 1}`}
                      fill
                      className="object-contain"
                      priority
                    />
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
          <div className="p-4 flex justify-between items-center bg-black bg-opacity-50 backdrop-blur-sm">
            <div className="text-white">
              Image {mainImageIndex + 1} of {updatedUnit.images?.length}
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