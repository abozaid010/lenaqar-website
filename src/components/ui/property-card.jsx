"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { formatCurrency } from "@/utils/formatters";
import {
  Bath,
  Bed,
  DollarSign,
  Eye,
  Home,
  Landmark,
  MapPin,
  Square,
} from "lucide-react";

const InfoItem = ({ icon, label, value }) => (
  <div className="flex items-center gap-1">
    <div className="bg-blue-100 p-1.5 rounded-md text-blue-600">{icon}</div>
    <div>
      <p className="text-[10px] font-normal text-gray-500 line-clamp-1 ">
        {label}
      </p>
      <p className="text-xs font-medium line-clamp-1 text-gray-800">{value}</p>
    </div>
  </div>
);

export default function PropertyCard({ data }) {
  const [hoveredImage, setHoveredImage] = useState(null);
  const handleImageHover = () => {
    if (data.images?.length > 1) {
      setHoveredImage(data.images[1].url);
    }
  };

  const {
    buildingType,
    floor,
    roomsCount,
    bathroomCount,
    city,
    unitId,
    landArea,
    view,
    finishing,
    totalPrice,
    project,
    unitTitle,
  } = data;
  return (
    <div className="flex flex-col gap-2 rounded-md overflow-hidden bg-gray-200 shadow-md p-2 m-2 w-72 h-96">
      <Link
        href={`/units/${unitId}`}
        className="rounded-md bg-gray-100 h-44 overflow-hidden relative"
      >
        {data.images?.length > 0 && (hoveredImage || data.images[0].url) ? (
          <Image
            onMouseEnter={handleImageHover}
            onMouseLeave={() => setHoveredImage(null)}
            src={hoveredImage || data.images[0].url}
            layout="fill"
            objectFit="cover"
            alt="property_image"
          />
        ) : (
          <Image
            src="/images/property_placeholder.jpg"
            layout="fill"
            objectFit="cover"
            alt="property_image"
          />
        )}
      </Link>

      <div>
        <Link
          href={`/units/${unitId}`}
          className="mb-2 line-clamp-1 text-sm font-medium text-gray-800 hover:text-primary hover:underline"
        >
          {unitTitle} | {buildingType}{" "}
        </Link>

        {/* Property details */}
        <div className="grid grid-cols-2 gap-1.5">
          <InfoItem
            icon={<Home size={18} />}
            label="Floor"
            value={floor ? floor : "N/A"}
          />
          <InfoItem
            icon={<Bed size={18} />}
            label="Rooms"
            value={roomsCount ? roomsCount : "N/A"}
          />
          <InfoItem
            icon={<Bath size={18} />}
            label="Bathrooms"
            value={bathroomCount ? bathroomCount : "N/A"}
          />
          <InfoItem
            icon={<MapPin size={18} />}
            label="Location"
            value={`${project}, ${city}`}
          />
          <InfoItem
            icon={<Square size={18} />}
            label="Land Area"
            value={landArea ? `${landArea} m²` : "N/A"}
          />

          <InfoItem icon={<Eye size={18} />} label="View" value={view} />

          <InfoItem
            icon={<Landmark size={18} />}
            label="Finishing"
            value={finishing}
          />
          <InfoItem
            icon={<DollarSign size={18} />}
            label="Price"
            value={totalPrice ? `${formatCurrency(totalPrice)} EGP` : "N/A"}
          />
        </div>
      </div>
    </div>
  );
}
