"use client";
import React, { useState, useEffect } from "react";
import im from "../../../../public/images/building1.jpg";
import { MapPin, Plus, ChevronLeft, ChevronRight, Share2 } from "lucide-react";
import AddUnitModal from "../scomponent/AddUnit/AddUnitModal";
import Link from "next/link";
import propertyEnums from "../data/propertyEnums.json";
import toast from "react-hot-toast";
import { useSearchParams } from "next/navigation";
// Sample data - replace with your actual data

const RealEstateListings = ({ initialData, comboundata, developersData }) => {
  const searchParams = useSearchParams();
  const [selectedEstate, setSelectedEstate] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [developerFilter, setDeveloperFilter] = useState("all");
  const [compoundFilter, setCompoundFilter] = useState("all");
  const [purposeFilter, setPurposeFilter] = useState("all"); // Add purpose filter state
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const itemsPerPage = 8;
  
  // Set current page from URL parameter when component mounts
  useEffect(() => {
    const page = searchParams.get('page');
    if (page) {
      setCurrentPage(parseInt(page));
    }
  }, [searchParams]);
  
  // Filter estates based on search, developer filter, compound filter, and purpose filter
  const filteredEstates = initialData
    ? initialData.filter((estate) => {
        const matchesSearch =
          (estate.unitTitle?.toLowerCase() || "").includes(
            searchTerm.toLowerCase()
          ) ||
          (estate.compound?.toLowerCase() || "").includes(
            searchTerm.toLowerCase()
          ) ||
          (estate.city?.toLowerCase() || "").includes(searchTerm.toLowerCase());

        let matchesDeveloper = true;
        if (developerFilter !== "all") {
          matchesDeveloper = estate.developer === developerFilter;
        }

        let matchesCompound = true;
        if (compoundFilter !== "all") {
          matchesCompound = estate.compound === compoundFilter;
        }

        let matchesPurpose = true;
        if (purposeFilter !== "all") {
          matchesPurpose = estate.purpose.toLowerCase() === purposeFilter.toLowerCase();
        }

        return (
          matchesSearch && matchesDeveloper && matchesCompound && matchesPurpose
        );
      })
    : [];

  // Get unique developers for filter dropdown
  const developers = [
    ...new Set(
      developersData
        ? developersData.map((developer) => developer.name)
        : initialData
            .filter((estate) => estate.developer)
            .map((estate) => estate.developer)
    ),
  ];

  // Calculate pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredEstates.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredEstates.length / itemsPerPage);

  const handleCardClick = (estateId) => {
    setSelectedEstate(selectedEstate === estateId ? null : estateId);
  };

  const handleAddBuilding = () => {
    setIsAddModalOpen(true);
  };

  const handleSaveUnit = (formData) => {
    console.log("New unit data:", formData);
    // Here you would typically add the new unit to your data
    // and possibly make an API call to save it
  };

 

  // Generate pagination numbers
  const getPaginationNumbers = () => {
    const pages = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 5; i++) {
          pages.push(i);
        }
      } else if (currentPage >= totalPages - 2) {
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        for (let i = currentPage - 2; i <= currentPage + 2; i++) {
          pages.push(i);
        }
      }
    }
    return pages;
  };

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">
            Real Estate Properties
          </h1>
          <p className="text-gray-600 mt-2">Explore our exclusive listings</p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 bg-white rounded-lg shadow-md p-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search by name or location..."
                className="w-full px-5 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <select
                className="flex-1 min-w-[180px] px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={developerFilter}
                onChange={(e) => setDeveloperFilter(e.target.value)}
              >
                <option value="all">All Developers</option>
                {developers.map((developer, index) => (
                  <option
                    key={`developer-${index}-${developer}`}
                    value={developer}
                  >
                    {developer}
                  </option>
                ))}
              </select>

              <select
                className="flex-1 min-w-[180px] px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={compoundFilter}
                onChange={(e) => setCompoundFilter(e.target.value)}
              >
                <option value="all">All Compounds</option>
                {comboundata &&
                  comboundata.map((compound, index) => (
                    <option
                      key={`compound-${index}-${compound.name}`}
                      value={compound.name}
                    >
                      {compound.name}
                    </option>
                  ))}
              </select>

              <select
                className="flex-1 min-w-[180px] px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={purposeFilter}
                onChange={(e) => setPurposeFilter(e.target.value)}
              >
                <option value="all">All Purposes</option>
                {propertyEnums &&
                  propertyEnums.EnumPropertyIntent.map((purpose, index) => (
                    <option
                      key={`purpose-${index}-${purpose}`}
                      value={purpose.charAt(0).toUpperCase() + purpose.slice(1)}
                    >
                      {purpose.charAt(0).toUpperCase() + purpose.slice(1)}
                    </option>
                  ))}
              </select>

              <button
                onClick={handleAddBuilding}
                className="flex-shrink-0 w-full sm:w-auto px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md flex items-center justify-center transition duration-300"
              >
                <Plus className="w-5 h-5 mr-2" />
                Add Building
              </button>
            </div>
          </div>
        </div>

        {/* Real Estate Cards */}
        {filteredEstates.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-xl text-gray-600">
              No properties match your criteria. Try adjusting your search.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {currentItems.map((estate, idx) => (
              <Link
                href={`/dashbord/units/${estate.unitId}?page=${currentPage}`}
                key={idx}
                className="flex flex-col"
              >
                {/* Estate Card with fixed height */}
                <div
                  className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300  flex flex-col cursor-pointer"
                  onClick={() => handleCardClick(estate.id)}
                >
                  <div className="relative h-56">
                    {estate.images && estate.images.length > 0 ? (
                      <>
                        <img
                          src={estate.images[0].url}
                          alt={estate.name || estate.compound || "Property"}
                          className="w-full h-full object-cover"
                        />
                        <button 
                          className="absolute top-2 left-2 cursor-pointer p-2.5 bg-white/90 hover:bg-primary hover:text-white rounded-full shadow-lg transition-all duration-300 backdrop-blur-sm border border-gray-100 group"
                          // onClick={(e) => {
                          //   e.preventDefault();
                          //   e.stopPropagation();
                          //   const url = `${window.location.origin}/dashbord/units/${estate.unitId}`;
                          //   navigator.clipboard.writeText(url);
                          //   toast.success("Link copied to clipboard!");
                          // }}
                        >
                          <Share2 className="w-4 h-4 text-gray-700 group-hover:text-white" />
                        </button>
                      </>
                    ) : (
                      <>
                        <img
                          src={estate.images[0].url}
                          alt={estate.name || estate.compound || "Property"}
                          className="w-full h-full object-cover"
                        />
                        <button 
                          className="absolute top-2 left-2 cursor-pointer p-2.5 bg-white/90 hover:bg-primary hover:text-white rounded-full shadow-lg transition-all duration-300 backdrop-blur-sm border border-gray-100 group"
                          // onClick={(e) => {
                          //   e.preventDefault();
                          //   e.stopPropagation();
                          //   const url = `${window.location.origin}/dashbord/units/${estate.unitId}`;
                          //   navigator.clipboard.writeText(url);
                          //   toast.success("Link copied to clipboard!");
                          // }}
                        >
                          <Share2 className="w-4 h-4 text-gray-700 group-hover:text-white" />
                        </button>
                      </>
                    )}
                  </div>

                  <div className="p-4 flex-grow flex flex-col gap-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-800 mb-1 line-clamp-1 rtl:text-right">
                        {estate?.unitTitle || "Unnamed Property"}
                      </h3>
                      <div className="flex items-center text-gray-700 mb-2">
                        <MapPin className="w-4 h-4 mr-2 text-gray-500 flex-shrink-0" />
                        <span className="line-clamp-1">
                          {estate.city || "Location not specified"}
                        </span>
                      </div>

                      {/* Compound and Purpose Display */}
                      <div className="flex flex-wrap gap-2 ">
                        {estate.compound && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                            {estate.compound}
                          </span>
                        )}
                        {estate.purpose && (
                          <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                            {estate.purpose}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 ">
                   
                      {estate.finishing && (
                        <div className="text-sm text-gray-600 rtl:text-right">
                          <span className="font-medium">Finishing:</span>{" "}
                          {estate.finishing}
                        </div>
                      )}

                      {estate.purpose === "Rent" || estate.purpose === "rent" ? (
                        <div className="text-sm text-gray-600 rtl:text-right">
                          <span className="font-medium">Rent Price:</span>{" "}
                          {estate.rentDurationType?.daily?.price ? 
                            `${estate.rentDurationType.daily.price} EGP/day` : 
                            estate.rentDurationType?.weekly?.price ? 
                              `${estate.rentDurationType.weekly.price} EGP/week` : 
                              estate.rentDurationType?.monthly?.price ? 
                                `${estate.rentDurationType.monthly.price} EGP/month` : 
                                estate.rentPrice ? `${estate.rentPrice} EGP` : "Price not specified"}
                        </div>
                      ) : (
                        estate.totalPrice && (
                          <div className="text-sm text-gray-600 rtl:text-right">
                            <span className="font-medium">Total Price:</span>{" "}
                            {estate.totalPrice} EGP
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

        {/* Pagination with fixed position */}
        {filteredEstates.length > 0 && (
          <div className="fixed max-w-md mx-auto bottom-0 left-0 right-0  z-10">
            <div className=" flex justify-center">
              <nav className="flex items-center  px-4 py-3 rounded-xl ">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className={`mx-1 p-2 rounded-full ${currentPage === 1 ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-white text-primary hover:bg-primary/10 border border-gray-200"} transition-all duration-300 flex items-center justify-center`}
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                {getPaginationNumbers().map((pageNumber) => (
                  <button
                    key={`page-${pageNumber}`}
                    onClick={() => setCurrentPage(pageNumber)}
                    className={`mx-1 w-10 h-10 flex items-center justify-center rounded-full transition-all duration-300 ${
                      currentPage === pageNumber
                        ? "bg-primary text-white font-medium shadow-md transform scale-110"
                        : "text-gray-700 hover:bg-primary/10 border border-gray-200"
                    }`}
                  >
                    {pageNumber}
                  </button>
                ))}

                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  className={`mx-1 p-2 rounded-full ${currentPage === totalPages ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-white text-primary hover:bg-primary/10 border border-gray-200"} transition-all duration-300 flex items-center justify-center`}
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </nav>
            </div>
          </div>
        )}

        {/* Add Unit Modal */}
        <AddUnitModal
          developersData={developersData}
          comboundata={comboundata}
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSave={handleSaveUnit}
        />
      </div>
    </div>
  );
};

export default RealEstateListings;
