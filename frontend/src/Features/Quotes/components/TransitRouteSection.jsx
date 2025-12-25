// components/TransitRouteSection.jsx
import { Plus, Trash2 } from 'lucide-react';
import AutocompleteInput from './AutocompleteInput';
import { 
  getPortSuggestions,
  getCarriersByCategory,
  incotermSuggestions,
  currencySuggestions,
  cargoTypeSuggestions,
  unitTypeSuggestions,
  chargeNameSuggestions
} from '../../../data/quoteData';

export default function TransitRouteSection({ route, routeIdx, formData, setFormData, category, disabled = false }) {
  const addSegment = () => {
    if (disabled) return;
    const updated = [...formData.transitRoutes];
    updated[routeIdx].segments.push({
      from: '',
      to: '',
      carriers: [{ carrier: '', incoterm: '', currency: '', cargoType: '' }],
      freightCharges: [{ carrier: '', unitType: '', numberOfUnits: '', amount: '', currency: '', total: 0 }],
      destinationCharges: [{ chargeName: '', unitType: '', numberOfUnits: '', amount: '', currency: '', total: 0 }],
      originHandling: [{ chargeName: '', unitType: '', numberOfUnits: '', amount: '', currency: '', total: 0 }],
      destinationHandling: [{ chargeName: '', unitType: '', numberOfUnits: '', amount: '', currency: '', total: 0 }]
    });
    setFormData(prev => ({ ...prev, transitRoutes: updated }));
  };

  const removeSegment = (segIdx) => {
    if (disabled) return;
    const updated = [...formData.transitRoutes];
    updated[routeIdx].segments = updated[routeIdx].segments.filter((_, i) => i !== segIdx);
    setFormData(prev => ({ ...prev, transitRoutes: updated }));
  };

  const removeRoute = () => {
    if (disabled) return;
    setFormData(prev => ({
      ...prev,
      transitRoutes: prev.transitRoutes.filter((_, i) => i !== routeIdx)
    }));
  };

  const updateSegment = (segIdx, field, value) => {
    if (disabled) return;
    const updated = [...formData.transitRoutes];
    updated[routeIdx].segments[segIdx][field] = value;
    setFormData(prev => ({ ...prev, transitRoutes: updated }));
  };

  const addCarrier = (segIdx) => {
    if (disabled) return;
    const updated = [...formData.transitRoutes];
    updated[routeIdx].segments[segIdx].carriers.push({ carrier: '', incoterm: '', currency: '', cargoType: '' });
    setFormData(prev => ({ ...prev, transitRoutes: updated }));
  };

  const removeCarrier = (segIdx, carrierIdx) => {
    if (disabled) return;
    const updated = [...formData.transitRoutes];
    updated[routeIdx].segments[segIdx].carriers = updated[routeIdx].segments[segIdx].carriers.filter((_, i) => i !== carrierIdx);
    setFormData(prev => ({ ...prev, transitRoutes: updated }));
  };

  const updateCarrier = (segIdx, carrierIdx, field, value) => {
    if (disabled) return;
    const updated = [...formData.transitRoutes];
    updated[routeIdx].segments[segIdx].carriers[carrierIdx][field] = value;
    setFormData(prev => ({ ...prev, transitRoutes: updated }));
  };

  const addCharge = (segIdx, chargeType) => {
    if (disabled) return;
    const updated = [...formData.transitRoutes];
    const newCharge = chargeType === 'freightCharges'
      ? { carrier: '', unitType: '', numberOfUnits: '', amount: '', currency: '', total: 0 }
      : { chargeName: '', unitType: '', numberOfUnits: '', amount: '', currency: '', total: 0 };
    updated[routeIdx].segments[segIdx][chargeType].push(newCharge);
    setFormData(prev => ({ ...prev, transitRoutes: updated }));
  };

  const removeCharge = (segIdx, chargeType, chargeIdx) => {
    if (disabled) return;
    const updated = [...formData.transitRoutes];
    updated[routeIdx].segments[segIdx][chargeType] = updated[routeIdx].segments[segIdx][chargeType].filter((_, i) => i !== chargeIdx);
    setFormData(prev => ({ ...prev, transitRoutes: updated }));
  };

  const updateCharge = (segIdx, chargeType, chargeIdx, field, value) => {
    if (disabled) return;
    const updated = [...formData.transitRoutes];
    updated[routeIdx].segments[segIdx][chargeType][chargeIdx][field] = value;
    
    if (field === 'numberOfUnits' || field === 'amount') {
      const charge = updated[routeIdx].segments[segIdx][chargeType][chargeIdx];
      const units = parseFloat(charge.numberOfUnits) || 0;
      const amount = parseFloat(charge.amount) || 0;
      charge.total = units * amount;
    }
    
    setFormData(prev => ({ ...prev, transitRoutes: updated }));
  };

  const locationSuggestions = getPortSuggestions(category);
  const carrierList = getCarriersByCategory(category);

  return (
    <div className="border-2 border-blue-200 rounded-lg p-4 mb-4 bg-blue-50">
      <div className="flex justify-between items-center mb-4">
        <h4 className="text-lg font-semibold text-blue-900">{route.routeName}</h4>
        {formData.transitRoutes.length > 1 && !disabled && (
          <button
            type="button"
            onClick={removeRoute}
            className="flex items-center gap-1 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
          >
            <Trash2 size={16} />
            Remove Route
          </button>
        )}
      </div>

      {route.segments.map((segment, segIdx) => (
        <div key={segIdx} className="bg-white rounded-lg p-4 mb-4 border border-gray-300">
          <div className="flex justify-between items-center mb-3">
            <h5 className="font-medium text-gray-700">
              Segment {segIdx + 1}
              {segIdx === 0 && ` (${formData.portOfLoading || 'Origin'})`}
              {segIdx === route.segments.length - 1 && ` → (${formData.portOfDischarge || 'Destination'})`}
            </h5>
            {route.segments.length > 1 && !disabled && (
              <button
                type="button"
                onClick={() => removeSegment(segIdx)}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <AutocompleteInput
              label="From"
              value={segment.from}
              onChange={(value) => updateSegment(segIdx, 'from', value)}
              suggestions={locationSuggestions}
              disabled={disabled}
            />
            <AutocompleteInput
              label="To"
              value={segment.to}
              onChange={(value) => updateSegment(segIdx, 'to', value)}
              suggestions={locationSuggestions}
              disabled={disabled}
            />
          </div>

          {/* Carriers Table */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <h6 className="text-sm font-medium text-gray-700">Carriers</h6>
              {!disabled && (
                <button
                  type="button"
                  onClick={() => addCarrier(segIdx)}
                  className="flex items-center gap-1 px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                >
                  <Plus size={14} />
                  {category == 'air' ? 'Add AirLine' : 'Add Carrier'}
                </button>
              )}
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="border border-gray-300 px-2 py-1 text-left">{category == 'air' ? 'AirLine' : 'Carrier'}</th>
                    <th className="border border-gray-300 px-2 py-1 text-left">Incoterm</th>
                    <th className="border border-gray-300 px-2 py-1 text-left">Currency</th>
                    <th className="border border-gray-300 px-2 py-1 text-left">Cargo Type</th>
                    <th className="border border-gray-300 px-2 py-1 w-16">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {segment.carriers.map((carrier, carrierIdx) => (
                    <tr key={carrierIdx}>
                      <td className="border border-gray-300 p-1">
                        <AutocompleteInput
                          value={carrier.carrier}
                          onChange={(value) => updateCarrier(segIdx, carrierIdx, 'carrier', value)}
                          suggestions={carrierList}
                          showLabel={false}
                          disabled={disabled}
                        />
                      </td>
                      <td className="border border-gray-300 p-1">
                        <AutocompleteInput
                          value={carrier.incoterm}
                          onChange={(value) => updateCarrier(segIdx, carrierIdx, 'incoterm', value)}
                          suggestions={incotermSuggestions}
                          showLabel={false}
                          disabled={disabled}
                        />
                      </td>
                      <td className="border border-gray-300 p-1">
                        <AutocompleteInput
                          value={carrier.currency}
                          onChange={(value) => updateCarrier(segIdx, carrierIdx, 'currency', value)}
                          suggestions={currencySuggestions}
                          showLabel={false}
                          disabled={disabled}
                        />
                      </td>
                      <td className="border border-gray-300 p-1">
                        <AutocompleteInput
                          value={carrier.cargoType}
                          onChange={(value) => updateCarrier(segIdx, carrierIdx, 'cargoType', value)}
                          suggestions={cargoTypeSuggestions}
                          showLabel={false}
                          disabled={disabled}
                        />
                      </td>
                      <td className="border border-gray-300 p-1 text-center">
                        {segment.carriers.length > 1 && !disabled && (
                          <button
                            type="button"
                            onClick={() => removeCarrier(segIdx, carrierIdx)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Freight Charges */}
          <ChargeTable
            title="Freight Charges"
            charges={segment.freightCharges}
            chargeType="freightCharges"
            onAdd={() => addCharge(segIdx, 'freightCharges')}
            onRemove={(idx) => removeCharge(segIdx, 'freightCharges', idx)}
            onUpdate={(idx, field, value) => updateCharge(segIdx, 'freightCharges', idx, field, value)}
            showCarrier={true}
            carrierList={carrierList}
            disabled={disabled}
          />

          {/* Destination Charges */}
          <ChargeTable
            title="Destination Charges (POD)"
            charges={segment.destinationCharges}
            chargeType="destinationCharges"
            onAdd={() => addCharge(segIdx, 'destinationCharges')}
            onRemove={(idx) => removeCharge(segIdx, 'destinationCharges', idx)}
            onUpdate={(idx, field, value) => updateCharge(segIdx, 'destinationCharges', idx, field, value)}
            showCarrier={false}
            disabled={disabled}
          />

          {/* Origin Handling */}
          <ChargeTable
            title="Origin Handling"
            charges={segment.originHandling}
            chargeType="originHandling"
            onAdd={() => addCharge(segIdx, 'originHandling')}
            onRemove={(idx) => removeCharge(segIdx, 'originHandling', idx)}
            onUpdate={(idx, field, value) => updateCharge(segIdx, 'originHandling', idx, field, value)}
            showCarrier={false}
            disabled={disabled}
          />

          {/* Destination Handling */}
          <ChargeTable
            title="Destination Handling"
            charges={segment.destinationHandling}
            chargeType="destinationHandling"
            onAdd={() => addCharge(segIdx, 'destinationHandling')}
            onRemove={(idx) => removeCharge(segIdx, 'destinationHandling', idx)}
            onUpdate={(idx, field, value) => updateCharge(segIdx, 'destinationHandling', idx, field, value)}
            showCarrier={false}
            disabled={disabled}
          />
        </div>
      ))}

      {!disabled && (
        <button
          type="button"
          onClick={addSegment}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 w-full justify-center"
        >
          <Plus size={18} />
          Add Transit Segment
        </button>
      )}
    </div>
  );
}

// Helper component for charge tables
function ChargeTable({ title, charges, onAdd, onRemove, onUpdate, showCarrier, carrierList, disabled = false }) {
  const calculateTotal = () => {
    return charges.reduce((sum, charge) => sum + (parseFloat(charge.total) || 0), 0);
  };

  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-2">
        <h6 className="text-sm font-medium text-gray-700">{title}</h6>
        {!disabled && (
          <button
            type="button"
            onClick={onAdd}
            className="flex items-center gap-1 px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
          >
            <Plus size={14} />
            Add
          </button>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="border border-gray-300 px-2 py-1 text-left">
                {showCarrier ? 'Carrier' : 'Charge Name'}
              </th>
              <th className="border border-gray-300 px-2 py-1 text-left">Unit Type</th>
              <th className="border border-gray-300 px-2 py-1 text-left">Units</th>
              <th className="border border-gray-300 px-2 py-1 text-left">Amount</th>
              <th className="border border-gray-300 px-2 py-1 text-left">Currency</th>
              <th className="border border-gray-300 px-2 py-1 text-left">Total</th>
              <th className="border border-gray-300 px-2 py-1 w-16">Action</th>
            </tr>
          </thead>
          <tbody>
            {charges.map((charge, idx) => (
              <tr key={idx}>
                <td className="border border-gray-300 p-1">
                  <AutocompleteInput
                    value={showCarrier ? charge.carrier : charge.chargeName}
                    onChange={(value) => onUpdate(idx, showCarrier ? 'carrier' : 'chargeName', value)}
                    suggestions={showCarrier 
                      ? carrierList
                      : chargeNameSuggestions.handling
                    }
                    showLabel={false}
                    disabled={disabled}
                  />
                </td>
                <td className="border border-gray-300 p-1">
                  <AutocompleteInput
                    value={charge.unitType}
                    onChange={(value) => onUpdate(idx, 'unitType', value)}
                    suggestions={unitTypeSuggestions}
                    showLabel={false}
                    disabled={disabled}
                  />
                </td>
                <td className="border border-gray-300 p-1">
                  <input
                    type="number"
                    value={charge.numberOfUnits}
                    onChange={(e) => onUpdate(idx, 'numberOfUnits', e.target.value)}
                    disabled={disabled}
                    className="w-full px-1 py-1 border border-gray-300 rounded text-sm disabled:bg-gray-100"
                  />
                </td>
                <td className="border border-gray-300 p-1">
                  <input
                    type="number"
                    step="0.01"
                    value={charge.amount}
                    onChange={(e) => onUpdate(idx, 'amount', e.target.value)}
                    disabled={disabled}
                    className="w-full px-1 py-1 border border-gray-300 rounded text-sm disabled:bg-gray-100"
                  />
                </td>
                <td className="border border-gray-300 p-1">
                  <AutocompleteInput
                    value={charge.currency}
                    onChange={(value) => onUpdate(idx, 'currency', value)}
                    suggestions={currencySuggestions}
                    showLabel={false}
                    disabled={disabled}
                  />
                </td>
                <td className="border border-gray-300 p-1">
                  <input
                    type="text"
                    value={charge.total.toFixed(2)}
                    readOnly
                    className="w-full px-1 py-1 border border-gray-300 rounded bg-gray-50 text-sm"
                  />
                </td>
                <td className="border border-gray-300 p-1 text-center">
                  {charges.length > 1 && !disabled && (
                    <button
                      type="button"
                      onClick={() => onRemove(idx)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-50 font-semibold">
            <tr>
              <td colSpan="5" className="border border-gray-300 px-2 py-1 text-right text-sm">Total:</td>
              <td className="border border-gray-300 px-2 py-1 text-sm">{calculateTotal().toFixed(2)}</td>
              <td className="border border-gray-300"></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}