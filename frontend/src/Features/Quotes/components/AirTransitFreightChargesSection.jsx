// components/AirTransitFreightChargesSection.jsx
import { Plus, Trash2 } from 'lucide-react';
import AutocompleteInput from './AutocompleteInput';
import { getCarriersByCategory, currencySuggestions } from '../../../data/quoteData';
import { useState, useEffect } from 'react';

export default function AirTransitFreightChargesSection({ 
  formData, 
  setFormData, 
  routeIdx,
  tableIdx,
  chargeData,
  tableName,
  disabled = false,
  onRemove = null
}) {
  // Define standard unit types for air freight - match existing data format
  const standardUnitTypes = ['-45 Kg', '+45 Kg', '+100 kg', '+300 kg', '+500 kg', '+1000 kg'];
  
  // Transform vertical data to horizontal format for display
  const transformToHorizontal = (charges) => {
    const grouped = {};
    
    charges.forEach(charge => {
      const carrier = charge.carrier || '';
      if (!grouped[carrier]) {
        grouped[carrier] = {
          carrier: carrier,
          currency: charge.currency || '',
          transitTime: charge.transitTime || '',
          numberOfRouting: charge.numberOfRouting || '',
          surcharge: charge.surcharge || '',
          frequency: charge.frequency || '',
          remarks: charge.remarks || '',
          unitTypes: {}
        };
      }
      
      if (charge.unitType) {
        grouped[carrier].unitTypes[charge.unitType] = charge.amount || '';
      }
    });
    
    const result = Object.values(grouped);
    // Always have at least one empty row
    return result.length > 0 ? result : [{
      carrier: '',
      currency: '',
      transitTime: '',
      numberOfRouting: '',
      surcharge: '',
      frequency: '',
      remarks: '',
      unitTypes: {}
    }];
  };

  // Transform horizontal data back to vertical format for saving
  const transformToVertical = (horizontalData) => {
    const verticalCharges = [];
    
    horizontalData.forEach(row => {
      standardUnitTypes.forEach(unitType => {
        const amount = row.unitTypes[unitType] || '';
        
        verticalCharges.push({
          carrier: row.carrier,
          unitType: unitType,
          numberOfUnits: '',
          amount: amount,
          currency: row.currency,
          transitTime: row.transitTime,
          numberOfRouting: row.numberOfRouting,
          surcharge: row.surcharge,
          frequency: row.frequency,
          total: 0,
          remarks: row.remarks || ''
        });
      });
    });
    
    return verticalCharges;
  };

  const [horizontalData, setHorizontalData] = useState(() => 
    transformToHorizontal(chargeData.charges || [])
  );

  // Update formData whenever horizontalData changes
  useEffect(() => {
    const updated = [...formData.routeOptions];
    updated[routeIdx].freightChargesTables[tableIdx].charges = transformToVertical(horizontalData);
    setFormData(prev => ({ ...prev, routeOptions: updated }));
  }, [horizontalData]);

  // Sync from chargeData when it changes externally (like on load)
  useEffect(() => {
    const charges = chargeData.charges || [];
    if (charges.length > 0) {
      const currentVertical = JSON.stringify(transformToVertical(horizontalData));
      const newVertical = JSON.stringify(charges);
      
      // Only update if the data actually changed from external source
      if (currentVertical !== newVertical) {
        setHorizontalData(transformToHorizontal(charges));
      }
    }
  }, [chargeData.charges]);

  const addCarrier = () => {
    if (disabled) return;
    
    const newRow = {
      carrier: '',
      currency: '',
      transitTime: '',
      numberOfRouting: '',
      surcharge: '',
      frequency: '',
      remarks: '',
      unitTypes: {}
    };
    
    setHorizontalData(prev => [...prev, newRow]);
  };

  const removeCarrier = (index) => {
    if (disabled) return;
    setHorizontalData(prev => prev.filter((_, i) => i !== index));
  };

  const updateCarrier = (index, field, value) => {
    if (disabled) return;
    setHorizontalData(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const updateUnitType = (index, unitType, value) => {
    if (disabled) return;
    setHorizontalData(prev => {
      const updated = [...prev];
      updated[index] = { 
        ...updated[index], 
        unitTypes: { ...updated[index].unitTypes, [unitType]: value }
      };
      return updated;
    });
  };

  const carrierList = getCarriersByCategory('air');

  return (
    <div className="space-y-4 mb-6 bg-white rounded-lg p-4 border border-gray-200">
      <div className="flex justify-between items-center border-b pb-2">
        <h3 className="text-lg font-medium text-gray-700">Freight Charges ({tableName})</h3>
        <div className="flex items-center gap-2">
          {!disabled && (
            <button
              type="button"
              onClick={addCarrier}
              className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
            >
              <Plus size={16} />
              Add Carrier
            </button>
          )}
          {onRemove && !disabled && (
            <button
              type="button"
              onClick={onRemove}
              className="flex items-center gap-1 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
            >
              <Trash2 size={16} />
              Remove Table
            </button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300">
          <thead className="bg-gray-50">
            <tr>
              <th className="border border-gray-300 px-2 py-2 text-left" style={{ minWidth: '70px' }}>AirLine</th>
              <th className="border border-gray-300 px-2 py-2 text-left" style={{ minWidth: '65px' }}>Currency</th>
              {standardUnitTypes.map(unitType => (
                <th key={unitType} className="border border-gray-300 px-2 py-2 text-left" style={{ minWidth: '60px' }}>{unitType}</th>
              ))}
              <th className="border border-gray-300 px-2 py-2 text-left" style={{ minWidth: '90px' }}>Surcharge</th>
              <th className="border border-gray-300 px-2 py-2 text-left" style={{ minWidth: '50px' }}>T/T</th>
              <th className="border border-gray-300 px-2 py-2 text-left" style={{ minWidth: '85px' }}>Frequency</th>
              <th className="border border-gray-300 px-2 py-2 text-left" style={{ minWidth: '100px' }}>Routing</th>
              <th className="border border-gray-300 px-2 py-2 text-left" style={{ minWidth: '90px' }}>Remarks</th>
              <th className="border border-gray-300 px-2 py-2 text-center" style={{ width: '60px' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {horizontalData.map((row, index) => (
              <tr key={index}>
                <td className="border border-gray-300 p-1">
                  <AutocompleteInput
                    value={row.carrier}
                    onChange={(value) => updateCarrier(index, 'carrier', value)}
                    suggestions={carrierList}
                    showLabel={false}
                    disabled={disabled}
                  />
                </td>
                <td className="border border-gray-300 p-1">
                  <AutocompleteInput
                    value={row.currency}
                    onChange={(value) => updateCarrier(index, 'currency', value)}
                    suggestions={currencySuggestions}
                    showLabel={false}
                    disabled={disabled}
                  />
                </td>
                {standardUnitTypes.map(unitType => (
                  <td key={unitType} className="border border-gray-300 p-1">
                    <input
                      type="number"
                      step="0.01"
                      value={row.unitTypes[unitType] || ''}
                      onChange={(e) => updateUnitType(index, unitType, e.target.value)}
                      disabled={disabled}
                      placeholder="0.00"
                      className="w-full px-2 py-1 border border-gray-300 rounded disabled:bg-gray-100 text-sm"
                    />
                  </td>
                ))}
                <td className="border border-gray-300 p-1">
                  <input
                    type="text"
                    value={row.surcharge || ''}
                    onChange={(e) => updateCarrier(index, 'surcharge', e.target.value)}
                    disabled={disabled}
                    placeholder="e.g., ALL IN"
                    className="w-full px-2 py-1 border border-gray-300 rounded disabled:bg-gray-100 text-sm"
                  />
                </td>
                <td className="border border-gray-300 p-1">
                  <input
                    type="text"
                    value={row.transitTime || ''}
                    onChange={(e) => updateCarrier(index, 'transitTime', e.target.value)}
                    disabled={disabled}
                    placeholder="e.g., 2"
                    className="w-full px-2 py-1 border border-gray-300 rounded disabled:bg-gray-100 text-sm"
                  />
                </td>
                <td className="border border-gray-300 p-1">
                  <input
                    type="text"
                    value={row.frequency || ''}
                    onChange={(e) => updateCarrier(index, 'frequency', e.target.value)}
                    disabled={disabled}
                    placeholder="e.g., DAILY"
                    className="w-full px-2 py-1 border border-gray-300 rounded disabled:bg-gray-100 text-sm"
                  />
                </td>
                <td className="border border-gray-300 p-1">
                  <input
                    type="text"
                    value={row.numberOfRouting || ''}
                    onChange={(e) => updateCarrier(index, 'numberOfRouting', e.target.value)}
                    disabled={disabled}
                    placeholder="e.g., CMB/KUL/KTI"
                    className="w-full px-2 py-1 border border-gray-300 rounded disabled:bg-gray-100 text-sm"
                  />
                </td>
                <td className="border border-gray-300 p-1">
                  <input
                    type="text"
                    value={row.remarks || ''}
                    onChange={(e) => updateCarrier(index, 'remarks', e.target.value)}
                    disabled={disabled}
                    placeholder="Add remarks..."
                    className="w-full px-2 py-1 border border-gray-300 rounded disabled:bg-gray-100 text-sm"
                  />
                </td>
                <td className="border border-gray-300 p-1 text-center">
                  {horizontalData.length > 1 && !disabled && (
                    <button
                      type="button"
                      onClick={() => removeCarrier(index)}
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
  );
}
