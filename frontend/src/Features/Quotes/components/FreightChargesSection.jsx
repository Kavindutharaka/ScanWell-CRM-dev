// components/FreightChargesSection.jsx
import { Plus, Trash2 } from 'lucide-react';
import AutocompleteInput from './AutocompleteInput';
import { getCarriersByCategory, unitTypeSuggestions, currencySuggestions, getUOMSuggestions } from '../../../data/quoteData';
import { useEffect, useState } from 'react';

export default function FreightChargesSection({ formData, setFormData, category, disabled = false, carrierName = null }) {

  const addCharge = () => {
    if (disabled) return;
    const newCharge = {
      carrier: carrierName || '',
      unitType: '',
      numberOfUnits: '',
      amount: '',
      currency: '',
      transitTime: '',
      numberOfRouting: '',
      total: 0,
      remarks: ''
    };

    // Add air-specific fields
    if (category === 'air') {
      newCharge.surcharge = '';
      newCharge.frequency = '';
    }

    setFormData(prev => ({
      ...prev,
      freightCharges: [...prev.freightCharges, newCharge]
    }));
  };

  const removeCharge = (index) => {
    if (disabled) return;
    setFormData(prev => ({
      ...prev,
      freightCharges: prev.freightCharges.filter((_, i) => i !== index)
    }));
  };

  const updateCharge = (index, field, value) => {
    if (disabled) return;
    const updated = [...formData.freightCharges];
    updated[index][field] = value;
    
    if (field === 'numberOfUnits' || field === 'amount') {
      const units = parseFloat(updated[index].numberOfUnits) || 0;
      const amount = parseFloat(updated[index].amount) || 0;
      updated[index].total = units * amount;
    }
    
    setFormData(prev => ({ ...prev, freightCharges: updated }));
  };

  const calculateGrandTotal = () => {
    return formData.freightCharges.reduce((sum, charge) => sum + (parseFloat(charge.total) || 0), 0);
  };

  const carrierList = getCarriersByCategory(category);
  const isAir = category === 'air';

  const UOMSuggestions = getUOMSuggestions(category);

  return (
    <div className="space-y-4 mb-6">
      <div className="flex justify-between items-center border-b pb-2">
        <h3 className="text-lg font-medium text-gray-700">Freight Charges</h3>
        {!disabled && (
          <button
            type="button"
            onClick={addCharge}
            className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
          >
            <Plus size={16} />
            Add Charge
          </button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300">
          <thead className="bg-gray-50">
            <tr>
              <th className="border border-gray-300 px-4 py-2 text-left">{category == 'air' ? 'AirLine' : 'Carrier'}</th>
              <th className="border border-gray-300 px-4 py-2 text-left">Unit Type</th>
              <th className="border border-gray-300 px-4 py-2 text-left">Number of Units</th>
              <th className="border border-gray-300 px-4 py-2 text-left">Amount</th>
              <th className="border border-gray-300 px-4 py-2 text-left">Currency</th>
              <th className="border border-gray-300 px-4 py-2 text-left">Transit Time</th>
              <th className="border border-gray-300 px-4 py-2 text-left">Number of Routing</th>
              {isAir && (
                <>
                  <th className="border border-gray-300 px-4 py-2 text-left">Surcharge</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Frequency</th>
                </>
              )}
              <th className="border border-gray-300 px-4 py-2 text-left">Total</th>
              <th className="border border-gray-300 px-4 py-2 text-left">Remarks</th>
              <th className="border border-gray-300 px-4 py-2 text-center w-20">Action</th>
            </tr>
          </thead>
          <tbody>
            {formData.freightCharges.map((charge, index) => (
              <tr key={index}>
                <td className="border border-gray-300 p-2">
                  <AutocompleteInput
                    value={charge.carrier}
                    onChange={(value) => updateCharge(index, 'carrier', value)}
                    suggestions={carrierList}
                    showLabel={false}
                    disabled={disabled || carrierName !== null}
                  />
                </td>
                <td className="border border-gray-300 p-2">
                  <AutocompleteInput
                    value={charge.unitType}
                    onChange={(value) => updateCharge(index, 'unitType', value)}
                    suggestions={UOMSuggestions}
                    showLabel={false}
                    disabled={disabled}
                  />
                </td>
                <td className="border border-gray-300 p-2">
                  <input
                    type="number"
                    value={charge.numberOfUnits}
                    onChange={(e) => updateCharge(index, 'numberOfUnits', e.target.value)}
                    disabled={disabled}
                    className="w-full px-2 py-1 border border-gray-300 rounded disabled:bg-gray-100"
                  />
                </td>
                <td className="border border-gray-300 p-2">
                  <input
                    type="number"
                    step="0.01"
                    value={charge.amount}
                    onChange={(e) => updateCharge(index, 'amount', e.target.value)}
                    disabled={disabled}
                    className="w-full px-2 py-1 border border-gray-300 rounded disabled:bg-gray-100"
                  />
                </td>
                <td className="border border-gray-300 p-2">
                  <AutocompleteInput
                    value={charge.currency}
                    onChange={(value) => updateCharge(index, 'currency', value)}
                    suggestions={currencySuggestions}
                    showLabel={false}
                    disabled={disabled}
                  />
                </td>
                <td className="border border-gray-300 p-2">
                  <input
                    type="text"
                    value={charge.transitTime || ''}
                    onChange={(e) => updateCharge(index, 'transitTime', e.target.value)}
                    disabled={disabled}
                    placeholder="e.g., 7-10 days"
                    className="w-full px-2 py-1 border border-gray-300 rounded disabled:bg-gray-100"
                  />
                </td>
                <td className="border border-gray-300 p-2">
                  <input
                    type="text"
                    value={charge.numberOfRouting || ''}
                    onChange={(e) => updateCharge(index, 'numberOfRouting', e.target.value)}
                    disabled={disabled}
                    placeholder="e.g., Direct"
                    className="w-full px-2 py-1 border border-gray-300 rounded disabled:bg-gray-100"
                  />
                </td>
                {isAir && (
                  <>
                    <td className="border border-gray-300 p-2">
                      <input
                        type="number"
                        step="0.01"
                        value={charge.surcharge || ''}
                        onChange={(e) => updateCharge(index, 'surcharge', e.target.value)}
                        disabled={disabled}
                        placeholder="0.00"
                        className="w-full px-2 py-1 border border-gray-300 rounded disabled:bg-gray-100"
                      />
                    </td>
                    <td className="border border-gray-300 p-2">
                      <input
                        type="text"
                        value={charge.frequency || ''}
                        onChange={(e) => updateCharge(index, 'frequency', e.target.value)}
                        disabled={disabled}
                        placeholder="e.g., Daily"
                        className="w-full px-2 py-1 border border-gray-300 rounded disabled:bg-gray-100"
                      />
                    </td>
                  </>
                )}
                <td className="border border-gray-300 p-2">
                  <input
                    type="text"
                    value={charge.total.toFixed(2)}
                    readOnly
                    className="w-full px-2 py-1 border border-gray-300 rounded bg-gray-50"
                  />
                </td>
                <td className="border border-gray-300 p-2">
                  <input
                    type="text"
                    value={charge.remarks || ''}
                    onChange={(e) => updateCharge(index, 'remarks', e.target.value)}
                    disabled={disabled}
                    placeholder="Add remarks..."
                    className="w-full px-2 py-1 border border-gray-300 rounded disabled:bg-gray-100"
                  />
                </td>
                <td className="border border-gray-300 p-2 text-center">
                  {formData.freightCharges.length > 1 && !disabled && (
                    <button
                      type="button"
                      onClick={() => removeCharge(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-50 font-semibold">
            <tr>
              <td colSpan={isAir ? "10" : "8"} className="border border-gray-300 px-4 py-2 text-right">Grand Total:</td>
              <td className="border border-gray-300 px-4 py-2">{calculateGrandTotal().toFixed(2)}</td>
              <td className="border border-gray-300"></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}