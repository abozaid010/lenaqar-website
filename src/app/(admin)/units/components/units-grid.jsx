import Link from "next/link";
import { MapPin, Share2 } from "lucide-react";

export default function UnitsGrid({ units }) {
  return (
    <>
      {units.length === 0 ? (
        <div className="text-center font-medium text-xl mt-5 text-gray-400">
          No units found.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-5">
          {units.map((u, idx) => (
            <Link
              href={`/units/${u.unitId}`}
              key={idx}
              className="flex flex-col"
            >
              <div className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300  flex flex-col cursor-pointer">
                <div className="relative h-56">
                  {u.images && u.images.length > 0 ? (
                    <>
                      <img
                        src={u.images[0].url}
                        alt={u.name || u.compound || "Property"}
                        className="w-full h-full object-cover"
                      />
                      <button className="absolute top-2 left-2 cursor-pointer p-2.5 bg-white/90 hover:bg-primary hover:text-white rounded-full shadow-lg transition-all duration-300 backdrop-blur-sm border border-gray-100 group">
                        <Share2 className="w-4 h-4 text-gray-700 group-hover:text-white" />
                      </button>
                    </>
                  ) : (
                    <>
                      <img
                        src={u.images[0].url}
                        alt={u.name || u.compound || "Property"}
                        className="w-full h-full object-cover"
                      />
                      <button className="absolute top-2 left-2 cursor-pointer p-2.5 bg-white/90 hover:bg-primary hover:text-white rounded-full shadow-lg transition-all duration-300 backdrop-blur-sm border border-gray-100 group">
                        <Share2 className="w-4 h-4 text-gray-700 group-hover:text-white" />
                      </button>
                    </>
                  )}
                </div>

                <div className="p-4 flex-grow flex flex-col gap-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-800 mb-1 line-clamp-1 rtl:text-right">
                      {u?.unitTitle || "Unnamed Property"}
                    </h3>
                    <div className="flex items-center text-gray-700 mb-2">
                      <MapPin className="w-4 h-4 mr-2 text-gray-500 flex-shrink-0" />
                      <span className="line-clamp-1">
                        {u.city || "Location not specified"}
                      </span>
                    </div>

                    {/* Compound and Purpose Display */}
                    <div className="flex flex-wrap gap-2 ">
                      {u.compound && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                          {u.compound}
                        </span>
                      )}
                      {u.purpose && (
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                          {u.purpose}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 ">
                    {u.finishing && (
                      <div className="text-sm text-gray-600 rtl:text-right">
                        <span className="font-medium">Finishing:</span>{" "}
                        {u.finishing}
                      </div>
                    )}

                    {u.purpose === "Rent" || u.purpose === "rent" ? (
                      <div className="text-sm text-gray-600 rtl:text-right">
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
                      </div>
                    ) : (
                      u.totalPrice && (
                        <div className="text-sm text-gray-600 rtl:text-right">
                          <span className="font-medium">Total Price:</span>{" "}
                          {u.totalPrice} EGP
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
