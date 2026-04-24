import type { ProjectViewModel } from '@/lib/projects/project-types';

interface Props {
  project: ProjectViewModel;
}

const fmt = (n: number) => `EGP ${n.toLocaleString()}`;
const fmtArea = (n: number) => `${n.toLocaleString()} m²`;

export default function ProjectPricingTable({ project }: Props) {
  const { startPrices, startAreas, buildingTypes } = project;

  const types = buildingTypes.length > 0
    ? buildingTypes
    : Array.from(new Set([...Object.keys(startPrices), ...Object.keys(startAreas)]));

  const hasPrices = Object.keys(startPrices).length > 0;
  const hasAreas = Object.keys(startAreas).length > 0;
  const hasOverall = project.startingPrice || project.averagePricePerMeter;

  if (!hasPrices && !hasAreas && !hasOverall) return null;

  return (
    <div className="bg-white rounded-lg border p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Pricing &amp; Areas</h2>

      {(hasPrices || hasAreas) && types.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 pr-4 font-medium text-gray-600">Type</th>
                {hasPrices && (
                  <th className="text-right py-2 pr-4 font-medium text-gray-600">Starting Price</th>
                )}
                {hasAreas && (
                  <th className="text-right py-2 font-medium text-gray-600">Starting Area</th>
                )}
              </tr>
            </thead>
            <tbody>
              {types.map((type) => {
                const price = startPrices[type];
                const area = startAreas[type];
                if (!price && !area) return null;
                return (
                  <tr key={type} className="border-b border-gray-100 last:border-0">
                    <td className="py-2.5 pr-4 text-gray-800 capitalize">
                      {type.replace(/_/g, ' ')}
                    </td>
                    {hasPrices && (
                      <td className="py-2.5 pr-4 text-right font-medium text-gray-900">
                        {price ? fmt(price) : '—'}
                      </td>
                    )}
                    {hasAreas && (
                      <td className="py-2.5 text-right font-medium text-gray-900">
                        {area ? fmtArea(area) : '—'}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {hasOverall && (
        <div className={`flex flex-wrap gap-4 text-sm ${(hasPrices || hasAreas) && types.length > 0 ? 'mt-4 pt-4 border-t border-gray-100' : ''}`}>
          {project.startingPrice && (
            <div>
              <span className="text-gray-500">Overall Starting Price</span>
              <p className="font-semibold text-gray-900 mt-0.5">{project.startingPrice}</p>
            </div>
          )}
          {project.averagePricePerMeter && (
            <div>
              <span className="text-gray-500">Avg Price / m²</span>
              <p className="font-semibold text-gray-900 mt-0.5">{project.averagePricePerMeter}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
