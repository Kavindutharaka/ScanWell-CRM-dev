// components/TransitRouteConfiguration.jsx
import { Plus, Trash2, ArrowRight } from 'lucide-react';
import AutocompleteInput from './AutocompleteInput';
import { 
  getPortSuggestions,
  getCarriersByCategory,
  incotermSuggestions,
  currencySuggestions,
  cargoTypeSuggestions
} from '../../../data/quoteData';

export default function TransitRouteConfiguration({ routeOption, routeIdx, formData, setFormData, category, disabled = false }) {
  const locationSuggestions = getPortSuggestions(category);
  const carrierList = getCarriersByCategory(category);

  const updateRouteField = (field, value) => {
    if (disabled) return;
    const updated = [...formData.routeOptions];
    updated[routeIdx][field] = value;
    setFormData(prev => ({ ...prev, routeOptions: updated }));
  };

  const addTransit = () => {
    if (disabled) return;
    const updated = [...formData.routeOptions];
    updated[routeIdx].transits.push('');
    setFormData(prev => ({ ...prev, routeOptions: updated }));
  };

  const removeTransit = (transitIdx) => {
    if (disabled) return;
    const updated = [...formData.routeOptions];
    updated[routeIdx].transits = updated[routeIdx].transits.filter((_, i) => i !== transitIdx);
    setFormData(prev => ({ ...prev, routeOptions: updated }));
  };

  const updateTransit = (transitIdx, value) => {
    if (disabled) return;
    const updated = [...formData.routeOptions];
    updated[routeIdx].transits[transitIdx] = value;
    setFormData(prev => ({ ...prev, routeOptions: updated }));
  };

  const addCarrier = () => {
    if (disabled) return;
    const updated = [...formData.routeOptions];
    updated[routeIdx].carriers.push({ carrier: '', incoterm: '', currency: '', cargoType: '' });
    setFormData(prev => ({ ...prev, routeOptions: updated }));
  };

  const removeCarrier = (carrierIdx) => {
    if (disabled) return;
    const updated = [...formData.routeOptions];
    updated[routeIdx].carriers = updated[routeIdx].carriers.filter((_, i) => i !== carrierIdx);
    setFormData(prev => ({ ...prev, routeOptions: updated }));
  };

  const updateCarrier = (carrierIdx, field, value) => {
    if (disabled) return;
    const updated = [...formData.routeOptions];
    updated[routeIdx].carriers[carrierIdx][field] = value;
    setFormData(prev => ({ ...prev, routeOptions: updated }));
  };

  return (
    <div className="space-y-6 mb-6">
      {/* Route Configuration */}
      <div>
        <h4 className="text-md font-medium text-gray-700 mb-3">Route Configuration</h4>
        
        {/* Route Path Visualization */}
        <div className="bg-white rounded-lg p-4 border-2 border-blue-200 mb-4">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Origin */}
            <div className="flex flex-col items-center">
              <span className="text-xs text-gray-500 mb-1">Origin</span>
              <div className="px-4 py-2 bg-green-100 border-2 border-green-500 rounded-lg font-medium text-sm min-w-[120px] text-center">
                {routeOption.origin || 'Not set'}
              </div>
            </div>

            <ArrowRight className="text-blue-500" size={20} />

            {/* Transits */}
            {routeOption.transits.map((transit, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <div className="flex flex-col items-center">
                  <span className="text-xs text-gray-500 mb-1">Transit {idx + 1}</span>
                  <div className="px-4 py-2 bg-yellow-100 border-2 border-yellow-500 rounded-lg font-medium text-sm min-w-[120px] text-center">
                    {transit || 'Not set'}
                  </div>
                </div>
                <ArrowRight className="text-blue-500" size={20} />
              </div>
            ))}

            {/* Destination */}
            <div className="flex flex-col items-center">
              <span className="text-xs text-gray-500 mb-1">Destination</span>
              <div className="px-4 py-2 bg-red-100 border-2 border-red-500 rounded-lg font-medium text-sm min-w-[120px] text-center">
                {routeOption.destination || 'Not set'}
              </div>
            </div>
          </div>
        </div>

        {/* Route Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <AutocompleteInput
            label="Origin"
            value={routeOption.origin}
            onChange={(value) => updateRouteField('origin', value)}
            suggestions={locationSuggestions}
            disabled={disabled}
          />

          <div className="flex items-end">
            {!disabled && (
              <button
                type="button"
                onClick={addTransit}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
              >
                <Plus size={18} />
                Add Transit
              </button>
            )}
          </div>

          <AutocompleteInput
            label="Destination"
            value={routeOption.destination}
            onChange={(value) => updateRouteField('destination', value)}
            suggestions={locationSuggestions}
            disabled={disabled}
          />
        </div>

        {/* Transit Stops */}
        {routeOption.transits.length > 0 && (
          <div className="space-y-2 mb-4">
            <h5 className="text-sm font-medium text-gray-700">Transit Stops</h5>
            {routeOption.transits.map((transit, transitIdx) => (
              <div key={transitIdx} className="flex items-center gap-2">
                <span className="text-sm text-gray-600 min-w-[80px]">Transit {transitIdx + 1}:</span>
                <div className="flex-1">
                  <AutocompleteInput
                    value={transit}
                    onChange={(value) => updateTransit(transitIdx, value)}
                    suggestions={locationSuggestions}
                    showLabel={false}
                    disabled={disabled}
                  />
                </div>
                {!disabled && (
                  <button
                    type="button"
                    onClick={() => removeTransit(transitIdx)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Carrier Options */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <h4 className="text-md font-medium text-gray-700">{category == 'air' ? 'AirLine Options' : 'Carrier Options'}</h4>
          {!disabled && (
            <button
              type="button"
              onClick={addCarrier}
              className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
            >
              <Plus size={16} />
              {category == 'air' ? 'Add AirLine' : 'Add Carrier'}
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300">
            <thead className="bg-gray-50">
              <tr>
                <th className="border border-gray-300 px-4 py-2 text-left">{category == 'air' ? 'AirLine' : 'Carrier'}</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Incoterm</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Currency</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Cargo Type</th>
                <th className="border border-gray-300 px-4 py-2 text-center w-20">Action</th>
              </tr>
            </thead>
            <tbody>
              {routeOption.carriers.map((carrier, carrierIdx) => (
                <tr key={carrierIdx}>
                  <td className="border border-gray-300 p-2">
                    <AutocompleteInput
                      value={carrier.carrier}
                      onChange={(value) => updateCarrier(carrierIdx, 'carrier', value)}
                      suggestions={carrierList}
                      showLabel={false}
                      disabled={disabled}
                    />
                  </td>
                  <td className="border border-gray-300 p-2">
                    <AutocompleteInput
                      value={carrier.incoterm}
                      onChange={(value) => updateCarrier(carrierIdx, 'incoterm', value)}
                      suggestions={incotermSuggestions}
                      showLabel={false}
                      disabled={disabled}
                    />
                  </td>
                  <td className="border border-gray-300 p-2">
                    <AutocompleteInput
                      value={carrier.currency}
                      onChange={(value) => updateCarrier(carrierIdx, 'currency', value)}
                      suggestions={currencySuggestions}
                      showLabel={false}
                      disabled={disabled}
                    />
                  </td>
                  <td className="border border-gray-300 p-2">
                    <AutocompleteInput
                      value={carrier.cargoType}
                      onChange={(value) => updateCarrier(carrierIdx, 'cargoType', value)}
                      suggestions={cargoTypeSuggestions}
                      showLabel={false}
                      disabled={disabled}
                    />
                  </td>
                  <td className="border border-gray-300 p-2 text-center">
                    {routeOption.carriers.length > 1 && !disabled && (
                      <button
                        type="button"
                        onClick={() => removeCarrier(carrierIdx)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}