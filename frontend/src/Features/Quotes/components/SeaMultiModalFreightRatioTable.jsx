// components/SeaMultiModalFreightRatioTable.jsx
import { Plus, Trash2 } from 'lucide-react';
import AutocompleteInput from './AutocompleteInput';
import { getCarriersByCategory, currencySuggestions } from '../../../data/quoteData';
import { useState, useEffect } from 'react';

export default function SeaMultiModalFreightRatioTable({
  title,
  chargeData,
  routeIdx,
  routeSegmentIdx,
  tableIdx,
  formData,
  setFormData,
  disabled = false,
  onRemove = null
}) {
  const standardRatios = ['1:167', '1:200', '1:300', '1:400', '1:500'];

  const transformToHorizontal = (charges) => {
    const grouped = {};

    charges.forEach(charge => {
      const carrier = charge.carrier || '';
      if (!grouped[carrier]) {
        grouped[carrier] = {
          carrier: carrier,
          currency: charge.currency || '',
          surcharge: charge.surcharge || '',
          transitTime: charge.transitTime || '',
          frequency: charge.frequency || '',
          numberOfRouting: charge.numberOfRouting || '',
          remarks: charge.remarks || '',
          ratios: {}
        };
      }

      if (charge.ratio) {
        grouped[carrier].ratios[charge.ratio] = charge.amount || '';
      }
    });

    const result = Object.values(grouped);
    return result.length > 0 ? result : [{
      carrier: '',
      currency: '',
      surcharge: '',
      transitTime: '',
      frequency: '',
      numberOfRouting: '',
      remarks: '',
      ratios: {}
    }];
  };

  const transformToVertical = (horizontalData) => {
    const verticalCharges = [];

    horizontalData.forEach(row => {
      standardRatios.forEach(ratio => {
        const amount = row.ratios[ratio] || '';

        verticalCharges.push({
          carrier: row.carrier,
          ratio: ratio,
          amount: amount,
          currency: row.currency,
          surcharge: row.surcharge,
          transitTime: row.transitTime,
          frequency: row.frequency,
          numberOfRouting: row.numberOfRouting,
          remarks: row.remarks || ''
        });
      });
    });

    return verticalCharges;
  };

  const [horizontalData, setHorizontalData] = useState(() =>
    transformToHorizontal(chargeData.charges || [])
  );

  useEffect(() => {
    const updated = [...formData.routeOptions];
    updated[routeIdx].routes[routeSegmentIdx].seaFreightRatioChargesTables[tableIdx].charges = transformToVertical(horizontalData);
    setFormData(prev => ({ ...prev, routeOptions: updated }));
  }, [horizontalData]);

  useEffect(() => {
    const charges = chargeData.charges || [];
    if (charges.length > 0) {
      const currentVertical = JSON.stringify(transformToVertical(horizontalData));
      const newVertical = JSON.stringify(charges);

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
      surcharge: '',
      transitTime: '',
      frequency: '',
      numberOfRouting: '',
      remarks: '',
      ratios: {}
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

  const updateRatio = (index, ratio, value) => {
    if (disabled) return;
    setHorizontalData(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        ratios: { ...updated[index].ratios, [ratio]: value }
      };
      return updated;
    });
  };

  const carrierList = getCarriersByCategory('air');

  return (
    <div className="space-y-4 mb-6 bg-white rounded-lg p-4 border border-gray-200">
      <div className="flex justify-between items-center border-b pb-2">
        <h3 className="text-lg font-medium text-gray-700">{title}</h3>
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
              Remove
            </button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300">
          <thead className="bg-gray-50">
            <tr>
              <th className="border border-gray-300 px-2 py-2 text-left" style={{ minWidth: '70px' }}>AIRLINE</th>
              <th className="border border-gray-300 px-2 py-2 text-left" style={{ minWidth: '65px' }}>CCY</th>
              {standardRatios.map(ratio => (
                <th key={ratio} className="border border-gray-300 px-2 py-2 text-left" style={{ minWidth: '60px' }}>{ratio}</th>
              ))}
              <th className="border border-gray-300 px-2 py-2 text-left" style={{ minWidth: '90px' }}>SURCHARGE</th>
              <th className="border border-gray-300 px-2 py-2 text-left" style={{ minWidth: '50px' }}>T/T</th>
              <th className="border border-gray-300 px-2 py-2 text-left" style={{ minWidth: '85px' }}>FREQUENCY</th>
              <th className="border border-gray-300 px-2 py-2 text-left" style={{ minWidth: '100px' }}>ROUTING</th>
              <th className="border border-gray-300 px-2 py-2 text-left" style={{ minWidth: '90px' }}>REMARKS</th>
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
                {standardRatios.map(ratio => (
                  <td key={ratio} className="border border-gray-300 p-1">
                    <input
                      type="number"
                      step="0.01"
                      value={row.ratios[ratio] || ''}
                      onChange={(e) => updateRatio(index, ratio, e.target.value)}
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
