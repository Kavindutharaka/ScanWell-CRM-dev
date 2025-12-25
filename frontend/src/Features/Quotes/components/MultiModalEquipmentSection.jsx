// components/MultiModalEquipmentSection.jsx
import AutocompleteInput from './AutocompleteInput';
import { getCarriersByCategory, equipmentSuggestions } from '../../../data/quoteData';

export default function MultiModalEquipmentSection({ routeOption, routeIdx, formData, setFormData, disabled = false }) {
  const updateEquipment = (field, value) => {
    if (disabled) return;
    const updated = [...formData.routeOptions];
    updated[routeIdx].equipment[field] = value;
    setFormData(prev => ({ ...prev, routeOptions: updated }));
  };

  // Determine carriers based on routes
  const getAllCarriers = () => {
    const hasAir = routeOption.routes.some(r => r.mode === 'air');
    const hasSea = routeOption.routes.some(r => r.mode === 'sea');
    
    if (hasAir && hasSea) {
      return [...getCarriersByCategory('air'), ...getCarriersByCategory('sea')];
    } else if (hasAir) {
      return getCarriersByCategory('air');
    } else {
      return getCarriersByCategory('sea');
    }
  };

  const getAllEquipment = () => {
    const hasAir = routeOption.routes.some(r => r.mode === 'air');
    const hasSea = routeOption.routes.some(r => r.mode === 'sea');
    
    if (hasAir && hasSea) {
      return [...equipmentSuggestions.air, ...equipmentSuggestions.sea];
    } else if (hasAir) {
      return equipmentSuggestions.air;
    } else {
      return equipmentSuggestions.sea;
    }
  };

  return (
    <div className="space-y-4 mb-6">
      <h3 className="text-lg font-medium text-gray-700 border-b pb-2">Equipment Details</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <AutocompleteInput
          label="Carrier"
          value={routeOption.equipment.carrier}
          onChange={(value) => updateEquipment('carrier', value)}
          suggestions={getAllCarriers()}
          disabled={disabled}
        />

        <AutocompleteInput
          label="Equipment"
          value={routeOption.equipment.equipment}
          onChange={(value) => updateEquipment('equipment', value)}
          suggestions={getAllEquipment()}
          disabled={disabled}
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Units</label>
          <input
            type="number"
            value={routeOption.equipment.units}
            onChange={(e) => updateEquipment('units', e.target.value)}
            disabled={disabled}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Transit Time (Days)</label>
          <input
            type="number"
            value={routeOption.equipment.transitTime}
            onChange={(e) => updateEquipment('transitTime', e.target.value)}
            disabled={disabled}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Net Weight</label>
          <input
            type="number"
            value={routeOption.equipment.netWeight}
            onChange={(e) => updateEquipment('netWeight', e.target.value)}
            disabled={disabled}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Gross Weight</label>
          <input
            type="number"
            value={routeOption.equipment.grossWeight}
            onChange={(e) => updateEquipment('grossWeight', e.target.value)}
            disabled={disabled}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Volume (m³)</label>
          <input
            type="number"
            step="0.01"
            value={routeOption.equipment.volume}
            onChange={(e) => updateEquipment('volume', e.target.value)}
            disabled={disabled}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Chargeable Weight</label>
          <input
            type="number"
            value={routeOption.equipment.chargeableWeight}
            onChange={(e) => updateEquipment('chargeableWeight', e.target.value)}
            disabled={disabled}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100"
          />
        </div>
      </div>
    </div>
  );
}