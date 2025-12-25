// components/CarrierChargesSection.jsx
import FreightChargesSection from './FreightChargesSection';
import DestinationChargesSection from './DestinationChargesSection';
import HandlingChargesSection from './HandlingChargesSection';

export default function CarrierChargesSection({ 
  carrierName, 
  formData, 
  setFormData, 
  category, 
  disabled = false 
}) {
  const carrierData = formData.carrierOptions?.[carrierName];

  if (!carrierData?.enabled) return null;

  const updateCarrierCharges = (chargeType, data) => {
    setFormData(prev => ({
      ...prev,
      carrierOptions: {
        ...prev.carrierOptions,
        [carrierName]: {
          ...prev.carrierOptions[carrierName],
          [chargeType]: data
        }
      }
    }));
  };

  // Create a temporary formData object for each section
  const createSectionFormData = (chargeType) => ({
    ...formData,
    [chargeType]: carrierData[chargeType]
  });

  const createSectionSetFormData = (chargeType) => (updater) => {
    if (typeof updater === 'function') {
      const currentData = { [chargeType]: carrierData[chargeType] };
      const updated = updater(currentData);
      updateCarrierCharges(chargeType, updated[chargeType]);
    } else {
      updateCarrierCharges(chargeType, updater[chargeType]);
    }
  };

  return (
    <div className="border-2 border-blue-200 rounded-lg p-6 mb-6 bg-blue-50/30">
      <div className="mb-4 flex items-center gap-3">
        <div className="h-8 w-1 bg-blue-600 rounded"></div>
        <h2 className="text-xl font-semibold text-blue-900">
          {category === 'air' ? 'Airline' : 'Carrier'}: {carrierName}
        </h2>
      </div>

      {/* Freight Charges for this carrier */}
      <FreightChargesSection
        formData={createSectionFormData('freightCharges')}
        setFormData={createSectionSetFormData('freightCharges')}
        category={category}
        disabled={disabled}
        carrierName={carrierName}
      />

      {/* Destination Charges for this carrier */}
      <DestinationChargesSection
        formData={createSectionFormData('destinationCharges')}
        setFormData={createSectionSetFormData('destinationCharges')}
        disabled={disabled}
      />

      {/* Origin Handling Charges for this carrier */}
      <HandlingChargesSection
        formData={createSectionFormData('originHandling')}
        setFormData={createSectionSetFormData('originHandling')}
        type="origin"
        title="Origin Handling Charges"
        disabled={disabled}
      />

      {/* Destination Handling Charges for this carrier */}
      <HandlingChargesSection
        formData={createSectionFormData('destinationHandling')}
        setFormData={createSectionSetFormData('destinationHandling')}
        type="destination"
        title="Destination Handling Charges"
        disabled={disabled}
      />
    </div>
  );
}