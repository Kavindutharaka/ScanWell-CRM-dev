// components/MultiModalRouteConfiguration.jsx
import { Plus, Trash2, ArrowRight } from 'lucide-react';
import AutocompleteInput from './AutocompleteInput';
import MultiModalSegmentDetails from './MultiModalSegmentDetails';
import { airportSuggestions, seaportSuggestions } from '../../../data/quoteData';

export default function MultiModalRouteConfiguration({ routeOption, routeIdx, formData, setFormData, disabled = false }) {
  const addRoute = () => {
    if (disabled) return;
    const updated = [...formData.routeOptions];
    updated[routeIdx].routes.push({
      mode: 'air',
      origin: '',
      destination: '',
      equipment: {
        carrier: '',
        equipment: '',
        transitTime: '',
        netWeight: '',
        grossWeight: '',
        volume: '',
        chargeableWeight: ''
      },
      freightChargesTables: [
        {
          tableName: 'Default',
          chargeableWeight: '',
          weightBreaker: '',
          pricingUnit: '',
          charge: '',
          currency: ''
        }
      ],
      originHandling: [
        { chargeName: '', unitType: '', numberOfUnits: '', amount: '', currency: '', total: 0 }
      ],
      destinationHandling: [
        { chargeName: '', unitType: '', numberOfUnits: '', amount: '', currency: '', total: 0 }
      ]
    });
    setFormData(prev => ({ ...prev, routeOptions: updated }));
  };

  const removeRoute = (routeSegmentIdx) => {
    if (disabled || routeOption.routes.length === 1) return;
    const updated = [...formData.routeOptions];
    updated[routeIdx].routes = updated[routeIdx].routes.filter((_, i) => i !== routeSegmentIdx);
    setFormData(prev => ({ ...prev, routeOptions: updated }));
  };

  const updateRoute = (routeSegmentIdx, field, value) => {
    if (disabled) return;
    const updated = [...formData.routeOptions];
    updated[routeIdx].routes[routeSegmentIdx][field] = value;
    setFormData(prev => ({ ...prev, routeOptions: updated }));
  };

  const getLocationSuggestions = (mode) => {
    if (mode === 'air') return airportSuggestions;
    if (mode === 'sea') return seaportSuggestions;
    // For trucking, you can create city/location suggestions
    return ['Los Angeles, CA', 'New York, NY', 'Chicago, IL', 'Houston, TX', 'Miami, FL', 'Atlanta, GA', 'Dallas, TX'];
  };

  const getModeIcon = (mode) => {
    if (mode === 'air') return '✈️';
    if (mode === 'sea') return '🚢';
    if (mode === 'trucking') return '🚛';
    return '📦';
  };

  const getModeColor = (mode) => {
    if (mode === 'air') return { bg: 'bg-blue-100', border: 'border-blue-500', text: 'text-blue-900', badgeBg: 'bg-blue-200' };
    if (mode === 'sea') return { bg: 'bg-teal-100', border: 'border-teal-500', text: 'text-teal-900', badgeBg: 'bg-teal-200' };
    if (mode === 'trucking') return { bg: 'bg-orange-100', border: 'border-orange-500', text: 'text-orange-900', badgeBg: 'bg-orange-200' };
    return { bg: 'bg-gray-100', border: 'border-gray-500', text: 'text-gray-900', badgeBg: 'bg-gray-200' };
  };

  const getSegmentLabel = (route) => {
    const modeIcon = getModeIcon(route.mode);
    const modeName = route.mode === 'air' ? 'Air' : route.mode === 'sea' ? 'Sea' : 'Trucking';
    const origin = route.origin || 'Origin';
    const destination = route.destination || 'Destination';
    return `${modeIcon} ${modeName}: ${origin} → ${destination}`;
  };

  return (
    <div className="space-y-6 mb-6">
      {/* TOP SECTION: Add/Manage Segments */}
      <div className="bg-white rounded-lg p-6 border-2 border-purple-300 shadow-md">
        <div className="flex justify-between items-center mb-4">
          <h4 className="text-lg font-semibold text-purple-900">Create Route Segments</h4>
          {!disabled && (
            <button
              type="button"
              onClick={addRoute}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 shadow-lg"
            >
              <Plus size={18} />
              Add Segment
            </button>
          )}
        </div>

        <p className="text-sm text-gray-600 mb-4">Add your route segments here. Details for each segment will appear below.</p>

        {/* Route Path Visualization */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 border-2 border-purple-200 mb-6">
          <div className="flex items-center gap-2 flex-wrap">
            {routeOption.routes.map((route, idx) => {
              const colors = getModeColor(route.mode);
              return (
                <div key={idx} className="flex items-center gap-2">
                  {idx > 0 && <ArrowRight className="text-purple-500" size={24} />}
                  <div className="flex flex-col items-center">
                    <span className="text-xs text-gray-500 mb-1 font-semibold">Segment {idx + 1}</span>
                    <div className={`px-4 py-3 ${colors.bg} border-2 ${colors.border} rounded-lg font-semibold text-sm min-w-[140px] text-center shadow-sm`}>
                      <div className="text-xs mb-1">{getModeIcon(route.mode)} {route.mode === 'air' ? 'Air' : route.mode === 'sea' ? 'Sea' : 'Trucking'}</div>
                      <div>{route.origin || 'Origin'}</div>
                      <div className="text-xs text-gray-600">↓</div>
                      <div>{route.destination || 'Dest'}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Segment Input Forms */}
        <div className="space-y-4">
          {routeOption.routes.map((route, routeSegmentIdx) => {
            const colors = getModeColor(route.mode);
            return (
              <div key={routeSegmentIdx} className="bg-gray-50 rounded-lg p-4 border border-gray-300">
                <div className="flex justify-between items-center mb-3">
                  <h5 className="font-semibold text-gray-800 flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-bold ${colors.badgeBg} ${colors.text}`}>
                      Segment {routeSegmentIdx + 1}
                    </span>
                  </h5>
                  {routeOption.routes.length > 1 && !disabled && (
                    <button
                      type="button"
                      onClick={() => removeRoute(routeSegmentIdx)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      <Trash2 size={16} />
                      Remove
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mode</label>
                    <select
                      value={route.mode}
                      onChange={(e) => updateRoute(routeSegmentIdx, 'mode', e.target.value)}
                      disabled={disabled}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100 focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="air">✈️ Air</option>
                      <option value="sea">🚢 Sea</option>
                      <option value="trucking">🚛 Trucking</option>
                    </select>
                  </div>

                  <AutocompleteInput
                    label="Origin"
                    value={route.origin}
                    onChange={(value) => updateRoute(routeSegmentIdx, 'origin', value)}
                    suggestions={getLocationSuggestions(route.mode)}
                    disabled={disabled}
                  />

                  <AutocompleteInput
                    label="Destination"
                    value={route.destination}
                    onChange={(value) => updateRoute(routeSegmentIdx, 'destination', value)}
                    suggestions={getLocationSuggestions(route.mode)}
                    disabled={disabled}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* BOTTOM SECTION: Auto-Generated Segment Details */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-px bg-gradient-to-r from-purple-300 to-pink-300 flex-1"></div>
          <h4 className="text-lg font-semibold text-purple-900 px-4">Segment Details</h4>
          <div className="h-px bg-gradient-to-r from-pink-300 to-purple-300 flex-1"></div>
        </div>

        <p className="text-sm text-gray-600 text-center mb-6">
          Fill in the details for each segment below. Equipment, freight charges, and handling charges are specific to each segment.
        </p>

        {routeOption.routes.map((route, routeSegmentIdx) => {
          const colors = getModeColor(route.mode);
          return (
            <div 
              key={routeSegmentIdx} 
              className="bg-white rounded-lg p-6 border-2 border-gray-300 shadow-lg"
              id={`segment-detail-${routeSegmentIdx}`}
            >
              {/* Segment Header */}
              <div className={`bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg p-4 mb-6 border-2 border-purple-300`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg ${route.mode === 'air' ? 'bg-blue-600' : route.mode === 'sea' ? 'bg-teal-600' : 'bg-orange-600'}`}>
                      {routeSegmentIdx + 1}
                    </span>
                    <div>
                      <h5 className="text-xl font-bold text-gray-800">
                        Segment {routeSegmentIdx + 1}
                      </h5>
                      <p className="text-sm text-gray-700 font-medium">
                        {getSegmentLabel(route)}
                      </p>
                    </div>
                  </div>
                  <div className={`px-4 py-2 rounded-lg font-semibold ${colors.badgeBg} ${colors.text}`}>
                    {getModeIcon(route.mode)} {route.mode === 'air' ? 'Air Freight' : route.mode === 'sea' ? 'Sea Freight' : 'Trucking'}
                  </div>
                </div>
              </div>

              {/* Segment-specific Equipment, Freight Charges, and Handling Charges */}
              <MultiModalSegmentDetails
                route={route}
                routeIdx={routeIdx}
                routeSegmentIdx={routeSegmentIdx}
                formData={formData}
                setFormData={setFormData}
                disabled={disabled}
                mode={route.mode}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}