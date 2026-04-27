export default function UnitDetailsSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumbs Skeleton */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-2">
            <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Gallery Skeleton */}
            <div className="relative w-full h-96 lg:h-[500px] bg-gray-200 rounded-lg animate-pulse"></div>

            {/* Header Summary Skeleton */}
            <div className="bg-white rounded-lg border p-6 space-y-4">
              <div className="h-8 w-3/4 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 w-1/2 bg-gray-200 rounded animate-pulse"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-8 w-32 bg-gray-200 rounded animate-pulse"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-6 w-24 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
            </div>

            {/* Quick Facts Skeleton */}
            <div className="bg-white rounded-lg border p-6">
              <div className="h-6 w-24 bg-gray-200 rounded animate-pulse mb-4"></div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-gray-50 rounded-lg p-3">
                    <div className="h-8 w-8 bg-gray-200 rounded animate-pulse mx-auto mb-2"></div>
                    <div className="h-4 w-16 bg-gray-200 rounded animate-pulse mx-auto mb-1"></div>
                    <div className="h-3 w-12 bg-gray-200 rounded animate-pulse mx-auto"></div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pricing Skeleton */}
            <div className="bg-white rounded-lg border p-6 space-y-4">
              <div className="h-6 w-32 bg-gray-200 rounded animate-pulse"></div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="h-4 w-20 bg-blue-200 rounded animate-pulse mb-1"></div>
                <div className="h-8 w-40 bg-blue-200 rounded animate-pulse"></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="bg-gray-50 rounded-lg p-4">
                    <div className="h-4 w-16 bg-gray-200 rounded animate-pulse mb-1"></div>
                    <div className="h-6 w-24 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                ))}
              </div>
            </div>

            {/* Specifications Skeleton */}
            <div className="bg-white rounded-lg border p-6">
              <div className="h-6 w-24 bg-gray-200 rounded animate-pulse mb-6"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex justify-between items-center py-2 border-b border-gray-100">
                      <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  ))}
                </div>
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex justify-between items-center py-2 border-b border-gray-100">
                      <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-8 space-y-6">
              {/* Sticky Inquiry Card Skeleton */}
              <div className="bg-white rounded-lg border shadow-lg p-6 space-y-4">
                <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mx-auto mb-2"></div>
                <div className="h-4 w-48 bg-gray-200 rounded animate-pulse mx-auto"></div>
                <div className="h-12 w-full bg-gray-200 rounded animate-pulse"></div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
                </div>
                <div className="h-10 w-full bg-gray-200 rounded animate-pulse"></div>
              </div>

              {/* Trust Items Skeleton */}
              <div className="bg-white rounded-lg border p-6">
                <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-4"></div>
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex justify-between items-center">
                      <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Action Bar Skeleton */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg">
        <div className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex-1 h-12 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-12 w-12 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-12 w-12 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
