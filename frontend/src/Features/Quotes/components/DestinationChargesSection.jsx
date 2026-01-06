// components/DestinationChargesSection.jsx
import { Plus, Trash2 } from 'lucide-react';
import AutocompleteInput from './AutocompleteInput';
import { chargeNameSuggestions, unitTypeSuggestions, currencySuggestions } from '../../../data/quoteData';

export default function DestinationChargesSection({ formData, setFormData, disabled = false }) {
  const addCharge = () => {
    if (disabled) return;
    setFormData(prev => ({
      ...prev,
      destinationCharges: [...prev.destinationCharges, { chargeName: '', unitType: '', numberOfUnits: '', amount: '', currency: '', total: 0, remark: '' }]
    }));
  };

  const removeCharge = (index) => {
    if (disabled) return;
    setFormData(prev => ({
      ...prev,
      destinationCharges: prev.destinationCharges.filter((_, i) => i !== index)
    }));
  };

  const updateCharge = (index, field, value) => {
    if (disabled) return;
    const updated = [...formData.destinationCharges];
    updated[index][field] = value;
    
    if (field === 'numberOfUnits' || field === 'amount') {
      const units = parseFloat(updated[index].numberOfUnits) || 0;
      const amount = parseFloat(updated[index].amount) || 0;
      updated[index].total = units * amount;
    }
    
    setFormData(prev => ({ ...prev, destinationCharges: updated }));
  };

  const calculateGrandTotal = () => {
    return formData.destinationCharges.reduce((sum, charge) => sum + (parseFloat(charge.total) || 0), 0);
  };

  return (
    <div className="space-y-4 mb-6">
      <div className="flex justify-between items-center border-b pb-2">
        <h3 className="text-lg font-medium text-gray-700">Destination Charges (POD)</h3>
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
              <th className="border border-gray-300 px-4 py-2 text-left">Charge Name</th>
              <th className="border border-gray-300 px-4 py-2 text-left">Unit Type</th>
              <th className="border border-gray-300 px-4 py-2 text-left">Number of Units</th>
              <th className="border border-gray-300 px-4 py-2 text-left">Amount</th>
              <th className="border border-gray-300 px-4 py-2 text-left">Currency</th>
              <th className="border border-gray-300 px-4 py-2 text-left">Total</th>
              <th className="border border-gray-300 px-4 py-2 text-left">Remark</th>
              <th className="border border-gray-300 px-4 py-2 text-center w-20">Action</th>
            </tr>
          </thead>
          <tbody>
            {formData.destinationCharges.map((charge, index) => (
              <tr key={index}>
                <td className="border border-gray-300 p-2">
                  <AutocompleteInput
                    value={charge.chargeName}
                    onChange={(value) => updateCharge(index, 'chargeName', value)}
                    suggestions={chargeNameSuggestions.destination}
                    showLabel={false}
                    disabled={disabled}
                  />
                </td>
                <td className="border border-gray-300 p-2">
                  <AutocompleteInput
                    value={charge.unitType}
                    onChange={(value) => updateCharge(index, 'unitType', value)}
                    suggestions={unitTypeSuggestions}
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
                    value={charge.total.toFixed(2)}
                    readOnly
                    className="w-full px-2 py-1 border border-gray-300 rounded bg-gray-50"
                  />
                </td>
                <td className="border border-gray-300 p-2">
                  <input
                    type="text"
                    value={charge.remark || ''}
                    onChange={(e) => updateCharge(index, 'remark', e.target.value)}
                    disabled={disabled}
                    className="w-full px-2 py-1 border border-gray-300 rounded disabled:bg-gray-100"
                    placeholder="Add remark..."
                  />
                </td>
                <td className="border border-gray-300 p-2 text-center">
                  {formData.destinationCharges.length > 1 && !disabled && (
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
              <td colSpan="6" className="border border-gray-300 px-4 py-2 text-right">Grand Total:</td>
              <td className="border border-gray-300 px-4 py-2">{calculateGrandTotal().toFixed(2)}</td>
              <td className="border border-gray-300"></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}