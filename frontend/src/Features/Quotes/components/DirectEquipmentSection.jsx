// src/Features/Quotes/components/DirectEquipmentSection.jsx
import AutocompleteInput from './AutocompleteInput';
import { getEquipmentByCategory } from '../../../data/quoteData';

export default function DirectEquipmentSection({ formData, setFormData, category, disabled = false }) {
  const updateEquipment = (field, value) => {
    if (disabled) return;
    setFormData(prev => ({
      ...prev,
      equipment: { ...prev.equipment, [field]: value }
    }));
  };

  const equipmentList = getEquipmentByCategory(category);

  return (
    <div className="mb-6">
      <h3 className="text-lg font-medium text-gray-700 mb-4">Equipment Details</h3>
      
      <div className="grid grid-cols-5 gap-4 bg-gray-50 p-4 rounded-lg">
        <div>
          <div className="text-sm font-medium text-gray-600 mb-2">Equipment</div>
          <AutocompleteInput
            value={formData.equipment.equipment}
            onChange={(value) => updateEquipment('equipment', value)}
            suggestions={equipmentList}
            showLabel={false}
            disabled={disabled}
          />
        </div>

        <div>
          <div className="text-sm font-medium text-gray-600 mb-2">Units</div>
          <input
            type="number"
            value={formData.equipment.units}
            onChange={(e) => updateEquipment('units', e.target.value)}
            disabled={disabled}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100"
          />
        </div>

        <div>
          <div className="text-sm font-medium text-gray-600 mb-2">Gross Weight (Kg)</div>
          <input
            type="number"
            value={formData.equipment.grossWeight}
            onChange={(e) => updateEquipment('grossWeight', e.target.value)}
            disabled={disabled}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100"
          />
        </div>

        <div>
          <div className="text-sm font-medium text-gray-600 mb-2">Volume (m³)</div>
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
          <div className="text-sm font-medium text-gray-600 mb-2">Chargeable Weight (Kg)</div>
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