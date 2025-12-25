// components/CarrierOptionSection.jsx
import { Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import AutocompleteInput from './AutocompleteInput';
import { getCarriersByCategory, incotermSuggestions, currencySuggestions, cargoTypeSuggestions } from '../../../data/quoteData';
import FreightChargesSection from './FreightChargesSection';
import DestinationChargesSection from './DestinationChargesSection';
import HandlingChargesSection from './HandlingChargesSection';

export default function CarrierOptionSection({ 
  option, 
  index, 
  category, 
  formData,
  setFormData,
  onRemove, 
  disabled = false,
  totalOptions
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const carrierList = getCarriersByCategory(category);
  const optionLabel = category === 'air' ? 'Airline Option' : 'Sea Option';

  const updateCarrierOption = (field, value) => {
    if (disabled) return;
    
    const updatedOptions = [...formData.carrierOptions];
    updatedOptions[index] = {
      ...updatedOptions[index],
      [field]: value
    };
    
    setFormData(prev => ({
      ...prev,
      carrierOptions: updatedOptions
    }));
  };

  // Create wrapper formData for charge sections
  const createChargeFormData = (chargeType) => ({
    [chargeType]: option[chargeType] || []
  });

  const createChargeSetFormData = (chargeType) => (updater) => {
    if (typeof updater === 'function') {
      const currentData = { [chargeType]: option[chargeType] || [] };
      const updated = updater(currentData);
      updateCarrierOption(chargeType, updated[chargeType]);
    } else {
      updateCarrierOption(chargeType, updater[chargeType]);
    }
  };

  return (
    <div className="border-2 border-blue-300 rounded-lg mb-6 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white p-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="hover:bg-blue-700 p-1 rounded transition-colors"
            >
              {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
            <h3 className="text-lg font-semibold">
              {optionLabel} [{index + 1}]
            </h3>
          </div>
          {totalOptions > 1 && !disabled && (
            <button
              type="button"
              onClick={onRemove}
              className="flex items-center gap-2 px-3 py-1.5 bg-red-600 hover:bg-red-700 rounded transition-colors"
            >
              <Trash2 size={16} />
              Remove Option
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="p-6 bg-blue-50/30">
          {/* Carrier Details */}
          <div className="bg-white rounded-lg p-4 mb-6 shadow-sm">
            <h4 className="text-md font-semibold text-gray-700 mb-4">
              {category === 'air' ? 'Airline' : 'Carrier'} Details
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <AutocompleteInput
                label={category === 'air' ? 'Airline' : 'Carrier'}
                value={option.carrier || ''}
                onChange={(value) => updateCarrierOption('carrier', value)}
                suggestions={carrierList}
                disabled={disabled}
              />

              <AutocompleteInput
                label="Incoterm"
                value={option.incoterm || ''}
                onChange={(value) => updateCarrierOption('incoterm', value)}
                suggestions={incotermSuggestions}
                disabled={disabled}
              />

              <AutocompleteInput
                label="Currency"
                value={option.currency || ''}
                onChange={(value) => updateCarrierOption('currency', value)}
                suggestions={currencySuggestions}
                disabled={disabled}
              />

              <AutocompleteInput
                label="Cargo Type"
                value={option.cargoType || ''}
                onChange={(value) => updateCarrierOption('cargoType', value)}
                suggestions={cargoTypeSuggestions}
                disabled={disabled}
              />
            </div>
          </div>

          {/* Freight Charges */}
          <div className="bg-white rounded-lg p-4 mb-4 shadow-sm">
            <FreightChargesSection
              formData={createChargeFormData('freightCharges')}
              setFormData={createChargeSetFormData('freightCharges')}
              category={category}
              disabled={disabled}
              carrierName={option.carrier}
            />
          </div>

          {/* Destination Charges */}
          <div className="bg-white rounded-lg p-4 mb-4 shadow-sm">
            <DestinationChargesSection
              formData={createChargeFormData('destinationCharges')}
              setFormData={createChargeSetFormData('destinationCharges')}
              disabled={disabled}
            />
          </div>

          {/* Origin Handling Charges */}
          <div className="bg-white rounded-lg p-4 mb-4 shadow-sm">
            <HandlingChargesSection
              formData={createChargeFormData('originHandling')}
              setFormData={createChargeSetFormData('originHandling')}
              type="origin"
              title="Origin Handling Charges"
              disabled={disabled}
            />
          </div>

          {/* Destination Handling Charges */}
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <HandlingChargesSection
              formData={createChargeFormData('destinationHandling')}
              setFormData={createChargeSetFormData('destinationHandling')}
              type="destination"
              title="Destination Handling Charges"
              disabled={disabled}
            />
          </div>
        </div>
      )}
    </div>
  );
}