// src/Features/Quotes/components/OtherChargesSection.jsx
import { Plus, Trash2 } from 'lucide-react';
import AutocompleteInput from './AutocompleteInput';
import { currencySuggestions, chargeNameSuggestions } from '../../../data/quoteData';

export default function OtherChargesSection({ formData, setFormData, disabled = false }) {
  const addCharge = () => {
    if (disabled) return;
    setFormData(prev => ({
      ...prev,
      otherCharges: [
        ...prev.otherCharges,
        {
          chargeDescription: '',
          amount: '',
          currency: '',
          per: ''
        }
      ]
    }));
  };

  const removeCharge = (index) => {
    if (disabled) return;
    setFormData(prev => ({
      ...prev,
      otherCharges: prev.otherCharges.filter((_, i) => i !== index)
    }));
  };

  const updateCharge = (index, field, value) => {
    if (disabled) return;
    const updated = [...formData.otherCharges];
    updated[index][field] = value;
    setFormData(prev => ({ ...prev, otherCharges: updated }));
  };

  // Calculate grand totals per currency
  const calculateTotalsByCurrency = () => {
    const totals = {};
    formData.otherCharges.forEach(charge => {
      const amount = parseFloat(charge.amount) || 0;
      const currency = charge.currency || 'USD';
      if (!totals[currency]) {
        totals[currency] = 0;
      }
      totals[currency] += amount;
    });
    return totals;
  };

  const totals = calculateTotalsByCurrency();

  // All charge name suggestions combined
  const allChargeNames = [
    ...chargeNameSuggestions.destination,
    ...chargeNameSuggestions.origin,
    ...chargeNameSuggestions.handling,
    'EXW Charges',
    'Doc Fee',
    'Terminal Charges',
    'Customs Clearance',
    'Inland Transportation',
    'Warehousing',
    'Insurance'
  ];

  return (
    <div className="space-y-4 mb-6">
      <div className="flex justify-between items-center border-b pb-2">
        <h3 className="text-lg font-medium text-gray-700">Other Charges</h3>
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
              <th className="border border-gray-300 px-4 py-2 text-left">Charge Description</th>
              <th className="border border-gray-300 px-4 py-2 text-left w-48">Amount</th>
              <th className="border border-gray-300 px-4 py-2 text-left w-32">Currency</th>
              <th className="border border-gray-300 px-4 py-2 text-left w-40">Per</th>
              <th className="border border-gray-300 px-4 py-2 text-center w-20">Action</th>
            </tr>
          </thead>
          <tbody>
            {formData.otherCharges.map((charge, index) => (
              <tr key={index}>
                <td className="border border-gray-300 p-2">
                  <AutocompleteInput
                    value={charge.chargeDescription}
                    onChange={(value) => updateCharge(index, 'chargeDescription', value)}
                    suggestions={allChargeNames}
                    showLabel={false}
                    disabled={disabled}
                    placeholder="Enter charge description"
                  />
                </td>
                <td className="border border-gray-300 p-2">
                  <input
                    type="number"
                    step="0.01"
                    value={charge.amount}
                    onChange={(e) => updateCharge(index, 'amount', e.target.value)}
                    disabled={disabled}
                    placeholder="0.00"
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
                    value={charge.per}
                    onChange={(e) => updateCharge(index, 'per', e.target.value)}
                    disabled={disabled}
                    placeholder="e.g., (01) or container (01)"
                    className="w-full px-2 py-1 border border-gray-300 rounded disabled:bg-gray-100"
                  />
                </td>
                <td className="border border-gray-300 p-2 text-center">
                  {formData.otherCharges.length > 1 && !disabled && (
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
        </table>
      </div>

      {/* Grand Totals by Currency */}
      <div className="space-y-2">
        {Object.entries(totals).map(([currency, total]) => (
          <div key={currency} className="flex justify-end items-center">
            <span className="text-lg font-semibold text-gray-700">
              Total Amount: {currency} {total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}