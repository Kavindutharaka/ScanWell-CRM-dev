// components/MultiModalFreightChargesTable.jsx
import { Trash2 } from 'lucide-react';
import AutocompleteInput from './AutocompleteInput';
import { currencySuggestions,getWeightBreakersByMode } from '../../../data/quoteData';

const weightBreakerSuggestions = [
  "-45 Kg",
  "+45 Kg",
  "+100 kg",
  "+300 kg",
  "+500 kg",
  "+1000 kg",
  "+1500 kg",
  "+2000 kg",
  "+3000 kg",
  "+5000 kg"
];

const pricingUnitSuggestions = [
  'Per Kg',
  'Per Lb',
  'Per Container',
  'Per CBM',
  'Per Shipment',
  'Flat Rate',
  'Per Unit',
  'Per Pallet'
];

export default function MultiModalFreightChargesTable({
  title,
  chargeData,
  routeIdx,
  routeSegmentIdx,
  tableIdx,
  formData,
  setFormData,
  disabled = false,
  onRemove = null
}) {
  const updateField = (field, value) => {
    if (disabled) return;
    const updated = [...formData.routeOptions];
    updated[routeIdx].routes[routeSegmentIdx].freightChargesTables[tableIdx][field] = value;
    setFormData(prev => ({ ...prev, routeOptions: updated }));
  };

   const currentMode = formData.routeOptions[routeIdx].routes[routeSegmentIdx].mode;
   const weightBreakerOptions = getWeightBreakersByMode(currentMode);

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

      {/* Mode indicator */}
      <div className="text-xs text-gray-600 mb-2">
        Mode: <span className="font-semibold capitalize">{currentMode}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Chargeable Weight (Kg)
          </label>
          <input
            type="number"
            step="0.01"
            value={chargeData.chargeableWeight || ''}
            onChange={(e) => updateField('chargeableWeight', e.target.value)}
            disabled={disabled}
            placeholder="0.00"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100 focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Weight Breaker
          </label>
          <AutocompleteInput
            value={chargeData.weightBreaker || ''}
            onChange={(value) => updateField('weightBreaker', value)}
            suggestions={weightBreakerOptions}
            showLabel={false}
            disabled={disabled}
            placeholder={`Select ${currentMode} weight breaker`}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Pricing Unit
          </label>
          <AutocompleteInput
            value={chargeData.pricingUnit || ''}
            onChange={(value) => updateField('pricingUnit', value)}
            suggestions={pricingUnitSuggestions}
            showLabel={false}
            disabled={disabled}
            placeholder="Select pricing unit"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Charge (Price)
          </label>
          <input
            type="number"
            step="0.01"
            value={chargeData.charge || ''}
            onChange={(e) => updateField('charge', e.target.value)}
            disabled={disabled}
            placeholder="0.00"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100 focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Currency
          </label>
          <AutocompleteInput
            value={chargeData.currency || ''}
            onChange={(value) => updateField('currency', value)}
            suggestions={currencySuggestions}
            showLabel={false}
            disabled={disabled}
            placeholder="Select currency"
          />
        </div>
      </div>

      <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-3">
        <div className="flex justify-between items-center">
          <span className="font-semibold text-gray-700">Total Freight Charge:</span>
          <span className="text-2xl font-bold text-purple-900">
            {((parseFloat(chargeData.chargeableWeight) || 0) * (parseFloat(chargeData.charge) || 0)).toFixed(2)} {chargeData.currency || ''}
          </span>
        </div>
        <div className="text-xs text-gray-600 mt-1">
          ({chargeData.chargeableWeight || '0'} × {chargeData.charge || '0'} {chargeData.pricingUnit || ''})
        </div>
      </div>
    </div>
  );
}