// components/TransitFreightChargesSection.jsx
import { Plus, Trash2 } from 'lucide-react';
import AutocompleteInput from './AutocompleteInput';
import { getCarriersByCategory, unitTypeSuggestions, currencySuggestions, getUOMSuggestions} from '../../../data/quoteData';
import AirTransitFreightChargesSection from './AirTransitFreightChargesSection';

export default function TransitFreightChargesSection({ 
  formData, 
  setFormData, 
  routeIdx,
  tableIdx,
  chargeData,
  tableName,
  category, 
  disabled = false,
  onRemove = null
}) {
  
  // Use Air-specific component for air freight
  if (category === 'air') {
    return <AirTransitFreightChargesSection 
      formData={formData}
      setFormData={setFormData}
      routeIdx={routeIdx}
      tableIdx={tableIdx}
      chargeData={chargeData}
      tableName={tableName}
      disabled={disabled}
      onRemove={onRemove}
    />;
  }

  const addCharge = () => {
    if (disabled) return;
    const newCharge = {
      carrier: '',
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
      newCharge.minimum = '';
      newCharge.surcharge = '';
      newCharge.frequency = '';
    }

    const updated = [...formData.routeOptions];
    updated[routeIdx].freightChargesTables[tableIdx].charges.push(newCharge);
    setFormData(prev => ({ ...prev, routeOptions: updated }));
  };

  const removeCharge = (chargeIdx) => {
    if (disabled) return;
    const updated = [...formData.routeOptions];
    updated[routeIdx].freightChargesTables[tableIdx].charges = 
      updated[routeIdx].freightChargesTables[tableIdx].charges.filter((_, i) => i !== chargeIdx);
    setFormData(prev => ({ ...prev, routeOptions: updated }));
  };

  const updateCharge = (chargeIdx, field, value) => {
    if (disabled) return;
    const updated = [...formData.routeOptions];
    updated[routeIdx].freightChargesTables[tableIdx].charges[chargeIdx][field] = value;
    
    if (field === 'numberOfUnits' || field === 'amount') {
      const charge = updated[routeIdx].freightChargesTables[tableIdx].charges[chargeIdx];
      const units = parseFloat(charge.numberOfUnits) || 0;
      const amount = parseFloat(charge.amount) || 0;
      charge.total = units * amount;
    }
    
    setFormData(prev => ({ ...prev, routeOptions: updated }));
  };

  const calculateGrandTotal = () => {
    if (!chargeData.charges || !Array.isArray(chargeData.charges)) return 0;
    return chargeData.charges.reduce((sum, charge) => sum + (parseFloat(charge.total) || 0), 0);
  };

  const carrierList = getCarriersByCategory(category);
  const UOMSuggestions = getUOMSuggestions(category);
  
  
  const isAir = category === 'air';
  const charges = chargeData.charges || [];

  return (
    <div className="space-y-4 mb-6 bg-white rounded-lg p-4 border border-gray-200">
      <div className="flex justify-between items-center border-b pb-2">
        <h3 className="text-lg font-medium text-gray-700">Freight Charges ({tableName})</h3>
        <div className="flex items-center gap-2">
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
              <th className="border border-gray-300 px-4 py-2 text-left">{category == 'air' ? 'AirLine' : 'Carrier'}</th>
              <th className="border border-gray-300 px-4 py-2 text-left">Unit Type</th>
              {isAir && <th className="border border-gray-300 px-4 py-2 text-left">M</th>}
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
            {charges.map((charge, chargeIdx) => (
              <tr key={chargeIdx}>
                <td className="border border-gray-300 p-2">
                  <AutocompleteInput
                    value={charge.carrier}
                    onChange={(value) => updateCharge(chargeIdx, 'carrier', value)}
                    suggestions={carrierList}
                    showLabel={false}
                    disabled={disabled}
                  />
                </td>
                <td className="border border-gray-300 p-2">
                  <AutocompleteInput
                    value={charge.unitType}
                    onChange={(value) => updateCharge(chargeIdx, 'unitType', value)}
                    suggestions={UOMSuggestions}
                    showLabel={false}
                    disabled={disabled}
                  />
                </td>
                {isAir && (
                  <td className="border border-gray-300 p-2">
                    <input
                      type="number"
                      step="0.01"
                      value={charge.minimum || ''}
                      onChange={(e) => updateCharge(chargeIdx, 'minimum', e.target.value)}
                      disabled={disabled}
                      placeholder="0.00"
                      className="w-full px-2 py-1 border border-gray-300 rounded disabled:bg-gray-100"
                    />
                  </td>
                )}
                <td className="border border-gray-300 p-2">
                  <input
                    type="number"
                    value={charge.numberOfUnits}
                    onChange={(e) => updateCharge(chargeIdx, 'numberOfUnits', e.target.value)}
                    disabled={disabled}
                    className="w-full px-2 py-1 border border-gray-300 rounded disabled:bg-gray-100"
                  />
                </td>
                <td className="border border-gray-300 p-2">
                  <input
                    type="number"
                    step="0.01"
                    value={charge.amount}
                    onChange={(e) => updateCharge(chargeIdx, 'amount', e.target.value)}
                    disabled={disabled}
                    className="w-full px-2 py-1 border border-gray-300 rounded disabled:bg-gray-100"
                  />
                </td>
                <td className="border border-gray-300 p-2">
                  <AutocompleteInput
                    value={charge.currency}
                    onChange={(value) => updateCharge(chargeIdx, 'currency', value)}
                    suggestions={currencySuggestions}
                    showLabel={false}
                    disabled={disabled}
                  />
                </td>
                <td className="border border-gray-300 p-2">
                  <input
                    type="text"
                    value={charge.transitTime || ''}
                    onChange={(e) => updateCharge(chargeIdx, 'transitTime', e.target.value)}
                    disabled={disabled}
                    placeholder="e.g., 7-10 days"
                    className="w-full px-2 py-1 border border-gray-300 rounded disabled:bg-gray-100"
                  />
                </td>
                <td className="border border-gray-300 p-2">
                  <input
                    type="text"
                    value={charge.numberOfRouting || ''}
                    onChange={(e) => updateCharge(chargeIdx, 'numberOfRouting', e.target.value)}
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
                        onChange={(e) => updateCharge(chargeIdx, 'surcharge', e.target.value)}
                        disabled={disabled}
                        placeholder="0.00"
                        className="w-full px-2 py-1 border border-gray-300 rounded disabled:bg-gray-100"
                      />
                    </td>
                    <td className="border border-gray-300 p-2">
                      <input
                        type="text"
                        value={charge.frequency || ''}
                        onChange={(e) => updateCharge(chargeIdx, 'frequency', e.target.value)}
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
                    onChange={(e) => updateCharge(chargeIdx, 'remarks', e.target.value)}
                    disabled={disabled}
                    placeholder="Add remarks..."
                    className="w-full px-2 py-1 border border-gray-300 rounded disabled:bg-gray-100"
                  />
                </td>
                <td className="border border-gray-300 p-2 text-center">
                  {charges.length > 1 && !disabled && (
                    <button
                      type="button"
                      onClick={() => removeCharge(chargeIdx)}
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
              <td colSpan={isAir ? "11" : "8"} className="border border-gray-300 px-4 py-2 text-right">Grand Total:</td>
              <td className="border border-gray-300 px-4 py-2">{calculateGrandTotal().toFixed(2)}</td>
              <td className="border border-gray-300"></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}