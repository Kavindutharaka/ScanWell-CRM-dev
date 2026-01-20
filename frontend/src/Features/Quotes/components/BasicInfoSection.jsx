// components/BasicInfoSection.jsx
import AutocompleteInput from './AutocompleteInput';
import { customerSuggestions, locationSuggestions } from '../../../data/quoteData';
import {fetchAccountNames, fetchAccountContacts} from '../../../api/AccountApi'
import { useEffect, useState } from 'react';

export default function BasicInfoSection({ formData, setFormData, disabled = false }) {
  const [accountNames, setAccountNames] = useState([]);
  const [contactNames, setContactNames] = useState([]);

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  useEffect(() => {
    const loadAccountNames = async () => {
      const names = await fetchAccountNames();
      console.log('Fetched Account Names:', names);
      setAccountNames(names);
    };
    loadAccountNames();
  }, []);

  // Fetch contacts when customer changes
  useEffect(() => {
    const loadContactNames = async () => {
      if (formData.customer && formData.customer.trim() !== '') {
        console.log('Fetching contacts for customer:', formData.customer);
        const contacts = await fetchAccountContacts(formData.customer);
        console.log('Fetched Contacts:', contacts);

        // Extract contact names from the contacts array
        const names = contacts.map(contact => contact.contactName).filter(name => name && name.trim() !== '');
        setContactNames(names);
      } else {
        // Clear contacts if no customer is selected
        setContactNames([]);
        updateField('contactName', '');
      }
    };
    loadContactNames();
  }, [formData.customer]);

  return (
    <div className="space-y-4 mb-6">
      <h3 className="text-lg font-medium text-gray-700 border-b pb-2">Basic Information</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Quote Number</label>
          <input
            type="text"
            value={formData.quoteNumber || ''}
            readOnly
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
            placeholder="Auto-generated"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Created Date</label>
          <input
            type="date"
            value={formData.createdDate || ''}
            disabled
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Rate Validity</label>
          <input
            type="date"
            value={formData.rateValidity || ''}
            onChange={(e) => updateField('rateValidity', e.target.value)}
            disabled={disabled}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100"
          />
        </div>

        <AutocompleteInput
          label="Customer"
          value={formData.customer || ''}
          onChange={(value) => updateField('customer', value)}
          suggestions={accountNames}
          disabled={disabled}
        />

        <AutocompleteInput
          label="Contact Name"
          value={formData.contactName || ''}
          onChange={(value) => updateField('contactName', value)}
          suggestions={contactNames}
          disabled={disabled || !formData.customer}
        />

        <AutocompleteInput
          label="Pickup Location"
          value={formData.pickupLocation || ''}
          onChange={(value) => updateField('pickupLocation', value)}
          suggestions={locationSuggestions.pickup}
          disabled={disabled}
        />

        <AutocompleteInput
          label="Delivery Location"
          value={formData.deliveryLocation || ''}
          onChange={(value) => updateField('deliveryLocation', value)}
          suggestions={locationSuggestions.delivery}
          disabled={disabled}
        />
      </div>
    </div>
  );
}