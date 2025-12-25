// components/PortDetailsSection.jsx
import AutocompleteInput from './AutocompleteInput';

export default function PortDetailsSection({ formData, setFormData, disabled = false }) {
  return (
    <div className="space-y-4 mb-6">
      <h3 className="text-lg font-medium text-gray-700 border-b pb-2">
        Port of Loading (POL) and Port of Discharge (POD)
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AutocompleteInput
          label="Port of Loading (POL)"
          value={formData.portOfLoading}
          onChange={(value) => setFormData(prev => ({ ...prev, portOfLoading: value }))}
          suggestions={[]}
          disabled={disabled}
        />

        <AutocompleteInput
          label="Port of Discharge (POD)"
          value={formData.portOfDischarge}
          onChange={(value) => setFormData(prev => ({ ...prev, portOfDischarge: value }))}
          suggestions={[]}
          disabled={disabled}
        />
      </div>
    </div>
  );
}