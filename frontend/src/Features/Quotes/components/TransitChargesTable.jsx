// components/TransitChargesTable.jsx
import { Trash2 } from 'lucide-react';
import AutocompleteInput from './AutocompleteInput';
import { 
  getCarriersByCategory,
  unitTypeSuggestions,
  currencySuggestions,
  chargeNameSuggestions
} from '../../../data/quoteData';

export default function TransitChargesTable({ 
  title, 
  chargeData, 
  routeOption, 
  routeIdx,
  tableIdx, 
  formData, 
  setFormData, 
  chargeType,
  showCarrier = false,
  disabled = false,
  category,
  onRemove = null
}) {
  const carrierList = getCarriersByCategory(category);
  const isAir = category === 'air';

  const getLocationColumns = () => {
    const columns = ['origin'];
    routeOption.transits.forEach((_, idx) => {
      columns.push(`transit${idx + 1}`);
    });
    columns.push('destination');
    return columns;
  };

  const getLocationLabel = (location) => {
    if (location === 'origin') return 'Origin';
    if (location === 'destination') return 'Destination';
    if (location.startsWith('transit')) {
      const num = location.replace('transit', '');
      return `Transit ${num}`;
    }
    return location;
  };

  const updateFieldPerLocation = (fieldName, location, value) => {
    if (disabled) return;
    const updated = [...formData.routeOptions];
    if (!updated[routeIdx][chargeType][tableIdx][fieldName]) {
      updated[routeIdx][chargeType][tableIdx][fieldName] = {};
    }
    updated[routeIdx][chargeType][tableIdx][fieldName][location] = value;
    setFormData(prev => ({ ...prev, routeOptions: updated }));
  };

  const calculateLocationTotal = (location) => {
    return parseFloat(chargeData.amountPerLocation?.[location] || 0);
  };

  const calculateGrandTotal = () => {
    const amounts = chargeData.amountPerLocation || {};
    return Object.values(amounts).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
  };

  const locationColumns = getLocationColumns();

  return (
    <div className="space-y-4 mb-6 bg-white rounded-lg p-4 border border-gray-200">
      <div className="flex justify-between items-center border-b pb-2">
        <h3 className="text-lg font-medium text-gray-700">{title}</h3>
        {onRemove && !disabled && (
          <button
            type="button"
            onClick={onRemove}
            className="flex items-center gap-1 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
          >
            <Trash2 size={16} />
            Remove
          </button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300">
          <thead className="bg-gray-50">
            <tr>
              <th className="border border-gray-300 px-4 py-2 text-left w-48"></th>
              {locationColumns.map((location) => (
                <th key={location} className="border border-gray-300 px-4 py-2 text-center font-semibold min-w-[150px]">
                  {getLocationLabel(location)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Carrier or Charge Name Row */}
            <tr>
              <td className="border border-gray-300 px-4 py-2 bg-gray-50 font-medium">
                {showCarrier ? 'Carrier' : 'Charge Name'}
              </td>
              {locationColumns.map((location) => (
                <td key={location} className="border border-gray-300 p-2">
                  <AutocompleteInput
                    value={showCarrier 
                      ? (chargeData.carrierPerLocation?.[location] || '')
                      : (chargeData.chargeNamePerLocation?.[location] || '')
                    }
                    onChange={(value) => updateFieldPerLocation(
                      showCarrier ? 'carrierPerLocation' : 'chargeNamePerLocation',
                      location,
                      value
                    )}
                    suggestions={showCarrier ? carrierList : chargeNameSuggestions[chargeType.replace('Tables', '')] || chargeNameSuggestions.handling}
                    showLabel={false}
                    disabled={disabled}
                  />
                </td>
              ))}
            </tr>

            {/* Unit Type Row */}
            <tr>
              <td className="border border-gray-300 px-4 py-2 bg-gray-50 font-medium">Unit Type</td>
              {locationColumns.map((location) => (
                <td key={location} className="border border-gray-300 p-2">
                  <AutocompleteInput
                    value={chargeData.unitTypePerLocation?.[location] || ''}
                    onChange={(value) => updateFieldPerLocation('unitTypePerLocation', location, value)}
                    suggestions={unitTypeSuggestions}
                    showLabel={false}
                    disabled={disabled}
                  />
                </td>
              ))}
            </tr>

            {/* Number of Units Row */}
            <tr>
              <td className="border border-gray-300 px-4 py-2 bg-gray-50 font-medium">Number of Units</td>
              {locationColumns.map((location) => (
                <td key={location} className="border border-gray-300 p-2">
                  <input
                    type="number"
                    value={chargeData.unitsPerLocation?.[location] || ''}
                    onChange={(e) => updateFieldPerLocation('unitsPerLocation', location, e.target.value)}
                    disabled={disabled}
                    placeholder="0"
                    className="w-full px-2 py-1 border border-gray-300 rounded disabled:bg-gray-100"
                  />
                </td>
              ))}
            </tr>

            {/* Amount Row */}
            <tr>
              <td className="border border-gray-300 px-4 py-2 bg-gray-50 font-medium">Amount</td>
              {locationColumns.map((location) => (
                <td key={location} className="border border-gray-300 p-2">
                  <input
                    type="number"
                    step="0.01"
                    value={chargeData.amountPerLocation?.[location] || ''}
                    onChange={(e) => updateFieldPerLocation('amountPerLocation', location, e.target.value)}
                    disabled={disabled}
                    placeholder="0.00"
                    className="w-full px-2 py-1 border border-gray-300 rounded disabled:bg-gray-100"
                  />
                </td>
              ))}
            </tr>

            {/* Currency Row */}
            <tr>
              <td className="border border-gray-300 px-4 py-2 bg-gray-50 font-medium">Currency</td>
              {locationColumns.map((location) => (
                <td key={location} className="border border-gray-300 p-2">
                  <AutocompleteInput
                    value={chargeData.currencyPerLocation?.[location] || ''}
                    onChange={(value) => updateFieldPerLocation('currencyPerLocation', location, value)}
                    suggestions={currencySuggestions}
                    showLabel={false}
                    disabled={disabled}
                  />
                </td>
              ))}
            </tr>

            {/* Transit Time Row (Sea & Air) */}
            {showCarrier && (
              <tr>
                <td className="border border-gray-300 px-4 py-2 bg-gray-50 font-medium">Transit Time</td>
                {locationColumns.map((location) => (
                  <td key={location} className="border border-gray-300 p-2">
                    <input
                      type="text"
                      value={chargeData.transitTimePerLocation?.[location] || ''}
                      onChange={(e) => updateFieldPerLocation('transitTimePerLocation', location, e.target.value)}
                      disabled={disabled}
                      placeholder="e.g., 7-10 days"
                      className="w-full px-2 py-1 border border-gray-300 rounded disabled:bg-gray-100"
                    />
                  </td>
                ))}
              </tr>
            )}

            {/* Number of Routing Row (Sea & Air) */}
            {showCarrier && (
              <tr>
                <td className="border border-gray-300 px-4 py-2 bg-gray-50 font-medium">Number of Routing</td>
                {locationColumns.map((location) => (
                  <td key={location} className="border border-gray-300 p-2">
                    <input
                      type="text"
                      value={chargeData.numberOfRoutingPerLocation?.[location] || ''}
                      onChange={(e) => updateFieldPerLocation('numberOfRoutingPerLocation', location, e.target.value)}
                      disabled={disabled}
                      placeholder="e.g., Direct"
                      className="w-full px-2 py-1 border border-gray-300 rounded disabled:bg-gray-100"
                    />
                  </td>
                ))}
              </tr>
            )}

            {/* Surcharge Row (Air Only) */}
            {showCarrier && isAir && (
              <tr>
                <td className="border border-gray-300 px-4 py-2 bg-gray-50 font-medium">Surcharge</td>
                {locationColumns.map((location) => (
                  <td key={location} className="border border-gray-300 p-2">
                    <input
                      type="number"
                      step="0.01"
                      value={chargeData.surchargePerLocation?.[location] || ''}
                      onChange={(e) => updateFieldPerLocation('surchargePerLocation', location, e.target.value)}
                      disabled={disabled}
                      placeholder="0.00"
                      className="w-full px-2 py-1 border border-gray-300 rounded disabled:bg-gray-100"
                    />
                  </td>
                ))}
              </tr>
            )}

            {/* Frequency Row (Air Only) */}
            {showCarrier && isAir && (
              <tr>
                <td className="border border-gray-300 px-4 py-2 bg-gray-50 font-medium">Frequency</td>
                {locationColumns.map((location) => (
                  <td key={location} className="border border-gray-300 p-2">
                    <input
                      type="text"
                      value={chargeData.frequencyPerLocation?.[location] || ''}
                      onChange={(e) => updateFieldPerLocation('frequencyPerLocation', location, e.target.value)}
                      disabled={disabled}
                      placeholder="e.g., Daily"
                      className="w-full px-2 py-1 border border-gray-300 rounded disabled:bg-gray-100"
                    />
                  </td>
                ))}
              </tr>
            )}

            {/* Total Row */}
            <tr className="bg-blue-50">
              <td className="border border-gray-300 px-4 py-2 bg-gray-100 font-bold">Total</td>
              {locationColumns.map((location) => (
                <td key={location} className="border border-gray-300 p-2">
                  <input
                    type="text"
                    value={(calculateLocationTotal(location) || 0).toFixed(2)}
                    readOnly
                    className="w-full px-2 py-1 border border-gray-300 rounded bg-blue-100 font-semibold text-center"
                  />
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Grand Total Summary */}
      <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-3">
        <div className="flex justify-between items-center">
          <span className="font-semibold text-gray-700">Total for {title}:</span>
          <span className="text-2xl font-bold text-blue-900">{calculateGrandTotal().toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}