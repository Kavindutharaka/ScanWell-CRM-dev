// components/RouteSection.jsx
import { Plus, Trash2, Settings } from 'lucide-react';
import AutocompleteInput from './AutocompleteInput';
import { getCarriersByCategory, incotermSuggestions, currencySuggestions, cargoTypeSuggestions } from '../../../data/quoteData';

export default function RouteSection({ formData, setFormData, category, disabled = false }) {
  const addCarrier = () => {
    if (disabled) return;
    setFormData(prev => ({
      ...prev,
      carriers: [...prev.carriers, { carrier: '', incoterm: '', currency: '', cargoType: '' }]
    }));
  };

  const removeCarrier = (index) => {
    if (disabled) return;
    const carrierName = formData.carriers[index].carrier;
    
    // Remove carrier options if they exist
    const updatedOptions = { ...formData.carrierOptions };
    if (updatedOptions[carrierName]) {
      delete updatedOptions[carrierName];
    }
    
    setFormData(prev => ({
      ...prev,
      carriers: prev.carriers.filter((_, i) => i !== index),
      carrierOptions: updatedOptions
    }));
  };

  const updateCarrier = (index, field, value) => {
    if (disabled) return;
    const updated = [...formData.carriers];
    const oldCarrierName = updated[index].carrier;
    updated[index][field] = value;
    
    // If carrier name changed and had options, update the key
    if (field === 'carrier' && oldCarrierName && formData.carrierOptions?.[oldCarrierName]) {
      const updatedOptions = { ...formData.carrierOptions };
      updatedOptions[value] = updatedOptions[oldCarrierName];
      delete updatedOptions[oldCarrierName];
      
      setFormData(prev => ({
        ...prev,
        carriers: updated,
        carrierOptions: updatedOptions
      }));
    } else {
      setFormData(prev => ({ ...prev, carriers: updated }));
    }
  };

  const toggleCarrierOptions = (carrierName) => {
    if (disabled || !carrierName) return;
    
    const currentOptions = formData.carrierOptions || {};
    const isEnabled = currentOptions[carrierName]?.enabled;
    
    if (isEnabled) {
      // Disable options
      const updatedOptions = { ...currentOptions };
      delete updatedOptions[carrierName];
      setFormData(prev => ({ ...prev, carrierOptions: updatedOptions }));
    } else {
      // Enable options with default empty arrays
      setFormData(prev => ({
        ...prev,
        carrierOptions: {
          ...currentOptions,
          [carrierName]: {
            enabled: true,
            freightCharges: [{ carrier: carrierName, unitType: '', numberOfUnits: '', amount: '', currency: '', transitTime: '', numberOfRouting: '', surcharge: '', frequency: '', total: 0 }],
            destinationCharges: [{ chargeName: '', unitType: '', numberOfUnits: '', amount: '', currency: '', total: 0 }],
            originHandling: [{ chargeName: '', unitType: '', numberOfUnits: '', amount: '', currency: '', total: 0 }],
            destinationHandling: [{ chargeName: '', unitType: '', numberOfUnits: '', amount: '', currency: '', total: 0 }]
          }
        }
      }));
    }
  };

  const carrierList = getCarriersByCategory(category);

  return (
    <div className="space-y-4 mb-6">
      <div className="flex justify-between items-center border-b pb-2">
        <h3 className="text-lg font-medium text-gray-700">
          {category === 'air' ? 'Airlines & Route Details' : 'Carriers & Route Details'}
        </h3>
        {!disabled && (
          <button
            type="button"
            onClick={addCarrier}
            className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
          >
            <Plus size={16} />
            Add {category === 'air' ? 'Airline' : 'Carrier'}
          </button>
        )}
      </div>

      <div className="space-y-3">
        {formData.carriers.map((carrier, index) => (
          <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <div className="flex items-start gap-4">
              <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                <AutocompleteInput
                  label={category === 'air' ? 'Airline' : 'Carrier'}
                  value={carrier.carrier}
                  onChange={(value) => updateCarrier(index, 'carrier', value)}
                  suggestions={carrierList}
                  disabled={disabled}
                />

                <AutocompleteInput
                  label="Incoterm"
                  value={carrier.incoterm}
                  onChange={(value) => updateCarrier(index, 'incoterm', value)}
                  suggestions={incotermSuggestions}
                  disabled={disabled}
                />

                <AutocompleteInput
                  label="Currency"
                  value={carrier.currency}
                  onChange={(value) => updateCarrier(index, 'currency', value)}
                  suggestions={currencySuggestions}
                  disabled={disabled}
                />

                <AutocompleteInput
                  label="Cargo Type"
                  value={carrier.cargoType}
                  onChange={(value) => updateCarrier(index, 'cargoType', value)}
                  suggestions={cargoTypeSuggestions}
                  disabled={disabled}
                />
              </div>

              <div className="flex gap-2 pt-6">
                {!disabled && carrier.carrier && (
                  <button
                    type="button"
                    onClick={() => toggleCarrierOptions(carrier.carrier)}
                    className={`flex items-center gap-1 px-3 py-2 rounded transition-colors ${
                      formData.carrierOptions?.[carrier.carrier]?.enabled
                        ? 'bg-green-600 text-white hover:bg-green-700'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                    title="Configure charge sections for this carrier"
                  >
                    <Settings size={16} />
                    {formData.carrierOptions?.[carrier.carrier]?.enabled ? 'Options On' : 'Options'}
                  </button>
                )}
                
                {formData.carriers.length > 1 && !disabled && (
                  <button
                    type="button"
                    onClick={() => removeCarrier(index)}
                    className="text-red-600 hover:text-red-700 p-2"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <AutocompleteInput
          label="Port of Loading (POL)"
          value={formData.portOfLoading}
          onChange={(value) => setFormData(prev => ({ ...prev, portOfLoading: value }))}
          suggestions={[]}
          disabled={disabled}
        />

        <AutocompleteInput
          label="Port of Discharge (POD)"
          value={formData.portOfDischarge}
          onChange={(value) => setFormData(prev => ({ ...prev, portOfDischarge: value }))}
          suggestions={[]}
          disabled={disabled}
        />
      </div>
    </div>
  );
}