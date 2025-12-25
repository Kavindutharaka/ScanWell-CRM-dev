// components/MultiModalSegmentDetails.jsx
import { Plus, Trash2 } from 'lucide-react';
import AutocompleteInput from './AutocompleteInput';
import MultiModalFreightChargesTable from './MultiModalFreightChargesTable';
import { 
  getCarriersByCategory, 
  getEquipmentByCategory,
  chargeNameSuggestions,
  unitTypeSuggestions,
  currencySuggestions
} from '../../../data/quoteData';

export default function MultiModalSegmentDetails({ 
  route, 
  routeIdx, 
  routeSegmentIdx, 
  formData, 
  setFormData, 
  disabled = false ,
  mode
}) {
  // Update equipment field
  const updateEquipment = (field, value) => {
    if (disabled) return;
    const updated = [...formData.routeOptions];
    updated[routeIdx].routes[routeSegmentIdx].equipment[field] = value;
    setFormData(prev => ({ ...prev, routeOptions: updated }));
  };

  // Add freight charge table
  const addFreightChargeTable = () => {
    if (disabled) return;
    const updated = [...formData.routeOptions];
    const tables = updated[routeIdx].routes[routeSegmentIdx].freightChargesTables;
    const nextOptionNum = tables.length;
    
    updated[routeIdx].routes[routeSegmentIdx].freightChargesTables.push({
      tableName: `Option ${nextOptionNum}`,
      chargeableWeight: '',
      weightBreaker: '',
      pricingUnit: '',
      charge: '',
      currency: ''
    });
    
    setFormData(prev => ({ ...prev, routeOptions: updated }));
  };

  // Remove freight charge table
  const removeFreightChargeTable = (tableIdx) => {
    if (disabled || tableIdx === 0) return;
    const updated = [...formData.routeOptions];
    updated[routeIdx].routes[routeSegmentIdx].freightChargesTables = 
      updated[routeIdx].routes[routeSegmentIdx].freightChargesTables.filter((_, i) => i !== tableIdx);
    setFormData(prev => ({ ...prev, routeOptions: updated }));
  };

  // Handling charges functions
  const addHandlingCharge = (type) => {
    if (disabled) return;
    const updated = [...formData.routeOptions];
    const field = type === 'origin' ? 'originHandling' : 'destinationHandling';
    updated[routeIdx].routes[routeSegmentIdx][field].push({
      chargeName: '',
      unitType: '',
      numberOfUnits: '',
      amount: '',
      currency: '',
      total: 0
    });
    setFormData(prev => ({ ...prev, routeOptions: updated }));
  };

  const removeHandlingCharge = (type, chargeIdx) => {
    if (disabled) return;
    const updated = [...formData.routeOptions];
    const field = type === 'origin' ? 'originHandling' : 'destinationHandling';
    updated[routeIdx].routes[routeSegmentIdx][field] = 
      updated[routeIdx].routes[routeSegmentIdx][field].filter((_, i) => i !== chargeIdx);
    setFormData(prev => ({ ...prev, routeOptions: updated }));
  };

  const updateHandlingCharge = (type, chargeIdx, field, value) => {
    if (disabled) return;
    const updated = [...formData.routeOptions];
    const handlingField = type === 'origin' ? 'originHandling' : 'destinationHandling';
    updated[routeIdx].routes[routeSegmentIdx][handlingField][chargeIdx][field] = value;
    
    if (field === 'numberOfUnits' || field === 'amount') {
      const charge = updated[routeIdx].routes[routeSegmentIdx][handlingField][chargeIdx];
      const units = parseFloat(charge.numberOfUnits) || 0;
      const amount = parseFloat(charge.amount) || 0;
      charge.total = units * amount;
    }
    
    setFormData(prev => ({ ...prev, routeOptions: updated }));
  };

  const calculateHandlingTotal = (type) => {
    const field = type === 'origin' ? 'originHandling' : 'destinationHandling';
    return route[field].reduce((sum, charge) => sum + (parseFloat(charge.total) || 0), 0);
  };

  const carrierList = getCarriersByCategory(route.mode);
  const equipmentList = getEquipmentByCategory(route.mode);

  return (
    <div className="space-y-6">
      {/* Equipment Details */}
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <h6 className="text-md font-semibold text-gray-700 mb-4">Equipment Details</h6>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <AutocompleteInput
            label={mode == 'air' ? 'AirLine' : 'Carrier' }
            value={route.equipment.carrier}
            onChange={(value) => updateEquipment('carrier', value)}
            suggestions={carrierList}
            disabled={disabled}
          />

          <AutocompleteInput
            label="Equipment"
            value={route.equipment.equipment}
            onChange={(value) => updateEquipment('equipment', value)}
            suggestions={equipmentList}
            disabled={disabled}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Transit Time (Days)</label>
            <input
              type="number"
              value={route.equipment.transitTime}
              onChange={(e) => updateEquipment('transitTime', e.target.value)}
              disabled={disabled}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Net Weight (Kg)</label>
            <input
              type="number"
              value={route.equipment.netWeight}
              onChange={(e) => updateEquipment('netWeight', e.target.value)}
              disabled={disabled}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Gross Weight (Kg)</label>
            <input
              type="number"
              value={route.equipment.grossWeight}
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
              value={route.equipment.volume}
              onChange={(e) => updateEquipment('volume', e.target.value)}
              disabled={disabled}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Chargeable Weight (Kg)</label>
            <input
              type="number"
              value={route.equipment.chargeableWeight}
              onChange={(e) => updateEquipment('chargeableWeight', e.target.value)}
              disabled={disabled}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100"
            />
          </div>
        </div>
      </div>

      {/* Freight Charges Tables */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <h6 className="text-md font-semibold text-gray-700">Freight Charges</h6>
          {!disabled && (
            <button
              type="button"
              onClick={addFreightChargeTable}
              className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
            >
              <Plus size={16} />
              Add Table
            </button>
          )}
        </div>

        {route.freightChargesTables.map((table, tableIdx) => (
          <div key={tableIdx} className="mb-4">
            <MultiModalFreightChargesTable
              title={`Freight Charges (${table.tableName})`}
              chargeData={table}
              routeIdx={routeIdx}
              routeSegmentIdx={routeSegmentIdx}
              tableIdx={tableIdx}
              formData={formData}
              setFormData={setFormData}
              disabled={disabled}
              onRemove={tableIdx > 0 ? () => removeFreightChargeTable(tableIdx) : null}
            />
          </div>
        ))}
      </div>

      {/* Origin Handling Charges */}
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <div className="flex justify-between items-center mb-3">
          <h6 className="text-md font-semibold text-gray-700">Origin Handling Charges</h6>
          {!disabled && (
            <button
              type="button"
              onClick={() => addHandlingCharge('origin')}
              className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
            >
              <Plus size={16} />
              Add Charge
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300">
            <thead className="bg-gray-100">
              <tr>
                <th className="border border-gray-300 px-4 py-2 text-left">Charge Name</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Unit Type</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Number of Units</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Amount</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Currency</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Total</th>
                <th className="border border-gray-300 px-4 py-2 text-center w-20">Action</th>
              </tr>
            </thead>
            <tbody>
              {route.originHandling.map((charge, chargeIdx) => (
                <tr key={chargeIdx}>
                  <td className="border border-gray-300 p-2">
                    <AutocompleteInput
                      value={charge.chargeName}
                      onChange={(value) => updateHandlingCharge('origin', chargeIdx, 'chargeName', value)}
                      suggestions={chargeNameSuggestions.handling}
                      showLabel={false}
                      disabled={disabled}
                    />
                  </td>
                  <td className="border border-gray-300 p-2">
                    <AutocompleteInput
                      value={charge.unitType}
                      onChange={(value) => updateHandlingCharge('origin', chargeIdx, 'unitType', value)}
                      suggestions={unitTypeSuggestions}
                      showLabel={false}
                      disabled={disabled}
                    />
                  </td>
                  <td className="border border-gray-300 p-2">
                    <input
                      type="number"
                      value={charge.numberOfUnits}
                      onChange={(e) => updateHandlingCharge('origin', chargeIdx, 'numberOfUnits', e.target.value)}
                      disabled={disabled}
                      className="w-full px-2 py-1 border border-gray-300 rounded disabled:bg-gray-100"
                    />
                  </td>
                  <td className="border border-gray-300 p-2">
                    <input
                      type="number"
                      step="0.01"
                      value={charge.amount}
                      onChange={(e) => updateHandlingCharge('origin', chargeIdx, 'amount', e.target.value)}
                      disabled={disabled}
                      className="w-full px-2 py-1 border border-gray-300 rounded disabled:bg-gray-100"
                    />
                  </td>
                  <td className="border border-gray-300 p-2">
                    <AutocompleteInput
                      value={charge.currency}
                      onChange={(value) => updateHandlingCharge('origin', chargeIdx, 'currency', value)}
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
                  <td className="border border-gray-300 p-2 text-center">
                    {route.originHandling.length > 1 && !disabled && (
                      <button
                        type="button"
                        onClick={() => removeHandlingCharge('origin', chargeIdx)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-100 font-semibold">
              <tr>
                <td colSpan="5" className="border border-gray-300 px-4 py-2 text-right">Grand Total:</td>
                <td className="border border-gray-300 px-4 py-2">{calculateHandlingTotal('origin').toFixed(2)}</td>
                <td className="border border-gray-300"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Destination Handling Charges */}
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <div className="flex justify-between items-center mb-3">
          <h6 className="text-md font-semibold text-gray-700">Destination Handling Charges</h6>
          {!disabled && (
            <button
              type="button"
              onClick={() => addHandlingCharge('destination')}
              className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
            >
              <Plus size={16} />
              Add Charge
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300">
            <thead className="bg-gray-100">
              <tr>
                <th className="border border-gray-300 px-4 py-2 text-left">Charge Name</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Unit Type</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Number of Units</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Amount</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Currency</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Total</th>
                <th className="border border-gray-300 px-4 py-2 text-center w-20">Action</th>
              </tr>
            </thead>
            <tbody>
              {route.destinationHandling.map((charge, chargeIdx) => (
                <tr key={chargeIdx}>
                  <td className="border border-gray-300 p-2">
                    <AutocompleteInput
                      value={charge.chargeName}
                      onChange={(value) => updateHandlingCharge('destination', chargeIdx, 'chargeName', value)}
                      suggestions={chargeNameSuggestions.handling}
                      showLabel={false}
                      disabled={disabled}
                    />
                  </td>
                  <td className="border border-gray-300 p-2">
                    <AutocompleteInput
                      value={charge.unitType}
                      onChange={(value) => updateHandlingCharge('destination', chargeIdx, 'unitType', value)}
                      suggestions={unitTypeSuggestions}
                      showLabel={false}
                      disabled={disabled}
                    />
                  </td>
                  <td className="border border-gray-300 p-2">
                    <input
                      type="number"
                      value={charge.numberOfUnits}
                      onChange={(e) => updateHandlingCharge('destination', chargeIdx, 'numberOfUnits', e.target.value)}
                      disabled={disabled}
                      className="w-full px-2 py-1 border border-gray-300 rounded disabled:bg-gray-100"
                    />
                  </td>
                  <td className="border border-gray-300 p-2">
                    <input
                      type="number"
                      step="0.01"
                      value={charge.amount}
                      onChange={(e) => updateHandlingCharge('destination', chargeIdx, 'amount', e.target.value)}
                      disabled={disabled}
                      className="w-full px-2 py-1 border border-gray-300 rounded disabled:bg-gray-100"
                    />
                  </td>
                  <td className="border border-gray-300 p-2">
                    <AutocompleteInput
                      value={charge.currency}
                      onChange={(value) => updateHandlingCharge('destination', chargeIdx, 'currency', value)}
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
                  <td className="border border-gray-300 p-2 text-center">
                    {route.destinationHandling.length > 1 && !disabled && (
                      <button
                        type="button"
                        onClick={() => removeHandlingCharge('destination', chargeIdx)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-100 font-semibold">
              <tr>
                <td colSpan="5" className="border border-gray-300 px-4 py-2 text-right">Grand Total:</td>
                <td className="border border-gray-300 px-4 py-2">{calculateHandlingTotal('destination').toFixed(2)}</td>
                <td className="border border-gray-300"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}