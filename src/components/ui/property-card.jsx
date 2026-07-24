"use client";

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
import ImageWithLoader from "./image-with-loader";
import { getDisplayImageUrl } from "@/utils/imageUtils";
import { useI18n } from "@/hooks/useI18n";
import { getBuildingTypeLabel } from "@/lib/enums/buildingTypes";
import { buildAdminUnitDetailPath } from "@/lib/units/unit-share-links";
import { LenaCookiesManager } from "@/lib/LenaCookiesManager";
import {
  isRentPurpose,
  resolveMonthlyRentPrice,
  resolveSaleTotalPrice,
} from "@/lib/units/unit-price";

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
  const { t, translate } = useI18n();
  const [hoveredImage, setHoveredImage] = useState(null);
  const handleImageHover = () => {
    if (data.images?.length > 1) {
      setHoveredImage(getDisplayImageUrl(data.images[1].url));
    }
  };

  const {
    buildingType,
    floor,
    roomsCount,
    bathroomCount,
    city,
    unitId,
    code,
    landArea,
    view,
    finishing,
    totalPrice,
    monthlyRentPrice,
    purpose,
    project,
    unitTitle,
  } = data;

  const buildingTypeLabel = getBuildingTypeLabel(buildingType, translate, buildingType);
  const clientId = LenaCookiesManager.getClientId();
  const unitHref = code?.trim()
    ? buildAdminUnitDetailPath(code, clientId)
    : unitId
      ? `/units/${unitId}`
      : "#";

  const displayPrice = isRentPurpose(purpose)
    ? resolveMonthlyRentPrice({ purpose, monthlyRentPrice, totalPrice })
    : resolveSaleTotalPrice({ totalPrice });
  const priceLabel = isRentPurpose(purpose)
    ? translate("rentalDetails.monthlyRentPrice", "Monthly rent")
    : translate("unitPricing.totalPrice", "Total Price");

  return (
    <div className="flex flex-col gap-2 rounded-md overflow-hidden bg-gray-200 shadow-md p-2 m-2 w-72 h-96">
      <Link
        href={unitHref}
        className="rounded-md bg-gray-100 h-44 overflow-hidden relative"
      >
        {data.images?.length > 0 && (hoveredImage || data.images[0].url) ? (
          <ImageWithLoader
            onMouseEnter={handleImageHover}
            onMouseLeave={() => setHoveredImage(null)}
            src={hoveredImage || getDisplayImageUrl(data.images[0].url)}
            alt="property_image"
            className="w-full h-full object-cover transition-all duration-300 hover:scale-105"
          />
        ) : (
          <ImageWithLoader
            src="/images/property_placeholder.jpg"
            alt="property_image"
            className="w-full h-full object-cover"
          />
        )}
      </Link>

      <div>
        <Link
          href={unitHref}
          className="mb-2 line-clamp-1 text-sm font-medium text-gray-800 hover:text-primary hover:underline"
        >
          {unitTitle} | {buildingTypeLabel}{" "}
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
            label={t?.unitLabels?.bedrooms || "Rooms"}
            value={roomsCount ? roomsCount : "N/A"}
          />
          <InfoItem
            icon={<Bath size={18} />}
            label={t?.unitLabels?.bathrooms || "Bathrooms"}
            value={bathroomCount ? bathroomCount : "N/A"}
          />
          <InfoItem
            icon={<MapPin size={18} />}
            label="Location"
            value={`${project}, ${city}`}
          />
          <InfoItem
            icon={<Square size={18} />}
            label="Total Area"
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
            label={priceLabel}
            value={displayPrice ? `${formatCurrency(displayPrice)} EGP` : "N/A"}
          />
        </div>
      </div>
    </div>
  );
}
