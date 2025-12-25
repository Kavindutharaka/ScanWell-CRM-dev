// components/EquipmentSection.jsx
import AutocompleteInput from './AutocompleteInput';
import { getEquipmentByCategory } from '../../../data/quoteData';

export default function EquipmentSection({ formData, setFormData, category, disabled = false }) {
  const updateEquipment = (field, value) => {
    if (disabled) return;
    setFormData(prev => ({
      ...prev,
      equipment: { ...prev.equipment, [field]: value }
    }));
  };

  const equipmentList = getEquipmentByCategory(category);

  return (
    <div className="space-y-4 mb-6">
      <h3 className="text-lg font-medium text-gray-700 border-b pb-2">Equipment Details</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <AutocompleteInput
          label="Equipment"
          value={formData.equipment.equipment}
          onChange={(value) => updateEquipment('equipment', value)}
          suggestions={equipmentList}
          disabled={disabled}
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Units</label>
          <input
            type="number"
            value={formData.equipment.units}
            onChange={(e) => updateEquipment('units', e.target.value)}
            disabled={disabled}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Gross Weight</label>
          <input
            type="number"
            value={formData.equipment.grossWeight}
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
            value={formData.equipment.volume}
            onChange={(e) => updateEquipment('volume', e.target.value)}
            disabled={disabled}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Chargeable Weight</label>
          <input
            type="number"
            value={formData.equipment.chargeableWeight}
            onChange={(e) => updateEquipment('chargeableWeight', e.target.value)}
            disabled={disabled}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100"
          />
        </div>
      </div>
    </div>
  );
}