// DirectQuoteForm.jsx
import { useState, useEffect, useContext } from 'react';
import { Save, ArrowLeft, FileDown, Plus, Printer } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import BasicInfoSection from './components/BasicInfoSection';
import PortDetailsSection from './components/PortDetailsSection';
import EquipmentSection from './components/EquipmentSection';
import CarrierOptionSection from './components/CarrierOptionSection';
import TermsConditionsSection from './components/TermsConditionsSection';
import { generateQuoteNumber } from '../../utils/quoteUtils';
import { fetchQuoteById, updateQuote, createNewQuote } from '../../api/QuoteApi';
import { generateDirectQuotePDF, printDirectQuotePDF } from './utils/pdfGenerator';
import { fetchAccountAddress } from '../../api/AccountApi';
import { AuthContext } from "../../context/AuthContext";
import { fetchUserDetailsByRoleID } from '../../api/UserRoleApi';

export default function DirectQuoteForm({ category, mode }) {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const quoteId = searchParams.get('id');
  const isEditMode = searchParams.get('edit') === 'true';
  const isViewMode = quoteId && !isEditMode;
  const [userDetails, setUserDetails] = useState(null);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
      if (user) {
        console.log("Current user in header:", user);
        getUserById(user.id);
      }
    }, [user]);
    
    const getUserById = async (userId) => {
      try {
        const res = await fetchUserDetailsByRoleID(userId);
        console.log("Fetched user data:", res);
        // API returns an array, so take the first item
        if (res && res.length > 0) {
          setUserDetails(res[0]);
        }
      } catch (error) {
        console.error("Error fetching user details:", error);
      }
    };
  
  // Create default carrier option structure
  const createDefaultOption = () => ({
    carrier: '',
    incoterm: '',
    currency: '',
    cargoType: '',
    freightCharges: [{ 
      carrier: '', 
      unitType: '', 
      numberOfUnits: '', 
      amount: '', 
      currency: '', 
      transitTime: '', 
      numberOfRouting: '', 
      surcharge: '', 
      frequency: '', 
      total: 0,
      remarks: ''
    }],
    destinationCharges: [{ 
      chargeName: '', 
      unitType: '', 
      numberOfUnits: '', 
      amount: '', 
      currency: '', 
      total: 0 
    }],
    originHandling: [{ 
      chargeName: '', 
      unitType: '', 
      numberOfUnits: '', 
      amount: '', 
      currency: '', 
      total: 0 
    }],
    destinationHandling: [{ 
      chargeName: '', 
      unitType: '', 
      numberOfUnits: '', 
      amount: '', 
      currency: '', 
      total: 0 
    }]
  });

  const [formData, setFormData] = useState({
    quoteNumber: '',
    createdDate: new Date().toISOString().split('T')[0],
    rateValidity: '',
    customer: '',
    pickupLocation: '',
    deliveryLocation: '',
    portOfLoading: '',
    portOfDischarge: '',
    equipment: { equipment: '', units: '', netWeight: '', grossWeight: '', volume: '', chargeableWeight: '' },
    carrierOptions: [createDefaultOption()], // Array of carrier options
    termsConditions: []
  });

  useEffect(() => {
    if (quoteId) {
      loadQuoteData();
    } else {
      // Generate quote number only for new quotes
      setFormData(prev => ({
        ...prev,
        quoteNumber: generateQuoteNumber()
      }));
    }
  }, [quoteId]);

  const formatDate = (dateString) => {
    if (!dateString) return "";
    return dateString.split("T")[0];
  };

  const loadQuoteData = async () => {
    try {
      setLoading(true);
      const data = await fetchQuoteById(quoteId);
      console.log("=== LOAD QUOTE DATA DEBUG ===");
      console.log("Raw data from API:", data[0]);
      
      // Parse carrierOptions - handle both old and new format
      let parsedCarrierOptions = [createDefaultOption()];
      
      const carrierOptionsField = data[0].carrierOptions || data[0].CarrierOptions;
      if (carrierOptionsField) {
        console.log("carrierOptions exists, raw value:", carrierOptionsField);
        try {
          const parsed = JSON.parse(carrierOptionsField);
          console.log("Parsed carrierOptions:", parsed);
          
          // Check if it's the new array format
          if (Array.isArray(parsed) && parsed.length > 0) {
            console.log("Using new array format");
            parsedCarrierOptions = parsed;
          }
          // Check if it's old object format (with carrier keys)
          else if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
            console.log("Converting from old object format");
            // Convert old format to new array format
            parsedCarrierOptions = Object.keys(parsed).map(carrierKey => {
              const option = parsed[carrierKey];
              return {
                carrier: carrierKey,
                incoterm: option.incoterm || '',
                currency: option.currency || '',
                cargoType: option.cargoType || '',
                freightCharges: option.freightCharges || [{ carrier: carrierKey, unitType: '', numberOfUnits: '', amount: '', currency: '', transitTime: '', numberOfRouting: '', surcharge: '', frequency: '', total: 0 }],
                destinationCharges: option.destinationCharges || [{ chargeName: '', unitType: '', numberOfUnits: '', amount: '', currency: '', total: 0 }],
                originHandling: option.originHandling || [{ chargeName: '', unitType: '', numberOfUnits: '', amount: '', currency: '', total: 0 }],
                destinationHandling: option.destinationHandling || [{ chargeName: '', unitType: '', numberOfUnits: '', amount: '', currency: '', total: 0 }]
              };
            });
            console.log("Converted to array:", parsedCarrierOptions);
          }
        } catch (e) {
          console.error("Error parsing carrierOptions:", e);
        }
      }
      // Handle very old format with separate carriers, freightCharges, etc.
      else if (data[0].carriers || data[0].Carriers) {
        console.log("Using very old format with separate fields");
        try {
          const carriersField = data[0].carriers || data[0].Carriers;
          const freightChargesField = data[0].freightCharges || data[0].FreightCharges;
          const destinationChargesField = data[0].destinationCharges || data[0].DestinationCharges;
          const originHandlingField = data[0].originHandling || data[0].OriginHandling;
          const destinationHandlingField = data[0].destinationHandling || data[0].DestinationHandling;
          
          const carriers = carriersField ? JSON.parse(carriersField) : [];
          const freightCharges = freightChargesField ? JSON.parse(freightChargesField) : [];
          const destinationCharges = destinationChargesField ? JSON.parse(destinationChargesField) : [];
          const originHandling = originHandlingField ? JSON.parse(originHandlingField) : [];
          const destinationHandling = destinationHandlingField ? JSON.parse(destinationHandlingField) : [];
          
          console.log("Old format carriers:", carriers);
          
          // Create options from old format
          if (carriers.length > 0) {
            parsedCarrierOptions = carriers.map((carrier, idx) => ({
              carrier: carrier.carrier || '',
              incoterm: carrier.incoterm || '',
              currency: carrier.currency || '',
              cargoType: carrier.cargoType || '',
              freightCharges: freightCharges.length > 0 ? freightCharges : [{ carrier: carrier.carrier || '', unitType: '', numberOfUnits: '', amount: '', currency: '', transitTime: '', numberOfRouting: '', surcharge: '', frequency: '', total: 0 }],
              destinationCharges: destinationCharges.length > 0 ? destinationCharges : [{ chargeName: '', unitType: '', numberOfUnits: '', amount: '', currency: '', total: 0 }],
              originHandling: originHandling.length > 0 ? originHandling : [{ chargeName: '', unitType: '', numberOfUnits: '', amount: '', currency: '', total: 0 }],
              destinationHandling: destinationHandling.length > 0 ? destinationHandling : [{ chargeName: '', unitType: '', numberOfUnits: '', amount: '', currency: '', total: 0 }]
            }));
            console.log("Converted old format to:", parsedCarrierOptions);
          }
        } catch (e) {
          console.error("Error converting old format:", e);
        }
      }

      const newFormData = {
        quoteId: data[0].quoteId || data[0].QuoteId || '',
        quoteNumber: data[0].quoteNumber || data[0].QuoteNumber || '',
        createdDate: formatDate(data[0].createdDate || data[0].CreatedDate),
        rateValidity: formatDate(data[0].rateValidity || data[0].RateValidity),
        customer: data[0].customer || data[0].Customer || '',
        pickupLocation: data[0].pickupLocation || data[0].PickupLocation || '',
        deliveryLocation: data[0].deliveryLocation || data[0].DeliveryLocation || '',
        portOfLoading: data[0].portOfLoading || data[0].PortOfLoading || '',
        portOfDischarge: data[0].portOfDischarge || data[0].PortOfDischarge || '',
        equipment: (data[0].equipment || data[0].Equipment) ? JSON.parse(data[0].equipment || data[0].Equipment) : { equipment: '', units: '', netWeight: '', grossWeight: '', volume: '', chargeableWeight: '' },
        carrierOptions: parsedCarrierOptions,
        termsConditions: (data[0].termsConditions || data[0].TermsConditions) ? JSON.parse(data[0].termsConditions || data[0].TermsConditions) : [],
        createdAt: data[0].createdAt || data[0].CreatedAt || ''
      };
      
      console.log("Final form data to set:", newFormData);
      setFormData(newFormData);
    } catch (error) {
      console.error('Error loading quote:', error);
      alert('Failed to load quote data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate customer
    if (!formData.customer || formData.customer.trim() === '') {
      alert('Customer is required. Please enter a customer name.');
      return;
    }
    
    const payload = {
      quoteId: formData.quoteId,
      quoteNumber: formData.quoteNumber,
      freightCategory: category,
      freightMode: mode,
      freightType: 'direct',
      createdDate: formData.createdDate,
      rateValidity: formData.rateValidity,
      customer: formData.customer,
      pickupLocation: formData.pickupLocation,
      deliveryLocation: formData.deliveryLocation,
      portOfLoading: formData.portOfLoading,
      portOfDischarge: formData.portOfDischarge,
      equipment: JSON.stringify(formData.equipment),
      carrierOptions: JSON.stringify(formData.carrierOptions),
      termsConditions: JSON.stringify(formData.termsConditions),
      status: 'draft',
      createdBy: userDetails.emp_id,
      createdAt: quoteId ? (formData.createdAt || new Date().toISOString()) : new Date().toISOString()
    };

    try {
      if (quoteId) {
        console.log("Update payload:", payload);
        await updateQuote(payload);
        alert('Quote updated successfully!');
      } else {
        const { quoteId, ...createPayload } = payload;
        await createNewQuote(createPayload);
        alert('Quote created successfully!');
      }
      navigate(-1);
    } catch (error) {
      console.error('Error saving quote:', error);
      alert('Failed to save quote');
    }
  };

  const addCarrierOption = () => {
    if (disabled) return;
    setFormData(prev => ({
      ...prev,
      carrierOptions: [...prev.carrierOptions, createDefaultOption()]
    }));
  };

  const removeCarrierOption = (index) => {
    if (disabled || formData.carrierOptions.length <= 1) return;
    setFormData(prev => ({
      ...prev,
      carrierOptions: prev.carrierOptions.filter((_, i) => i !== index)
    }));
  };

  const preparePDFData = async () => {
    let customerAddress = '';
    if (formData.customer) {
      try {
        customerAddress = await fetchAccountAddress(formData.customer);
        console.log("Customer Address:", customerAddress);
      } catch (error) {
        console.error("Error fetching customer address:", error);
      }
    }

    return {
      quoteNumber: formData.quoteNumber,
      freightCategory: category,
      freightMode: mode,
      freightType: 'direct',
      createdDate: formData.createdDate,
      rateValidity: formData.rateValidity,
      customer: formData.customer,
      customerAddress: customerAddress,
      pickupLocation: formData.pickupLocation,
      deliveryLocation: formData.deliveryLocation,
      portOfLoading: formData.portOfLoading,
      portOfDischarge: formData.portOfDischarge,
      equipment: JSON.stringify(formData.equipment),
      carrierOptions: JSON.stringify(formData.carrierOptions),
      termsConditions: JSON.stringify(formData.termsConditions)
    };
  };

  const handleDownloadPDF = async () => {
    const pdfData = await preparePDFData();
    generateDirectQuotePDF(pdfData);
  };

  const handlePrintPDF = async () => {
    const pdfData = await preparePDFData();
    printDirectQuotePDF(pdfData);
  };

  const disabled = isViewMode;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">
              {category?.toUpperCase()} - {mode?.toUpperCase()} (Direct)
            </h2>
            {isViewMode && (
              <span className="text-sm text-blue-600 font-medium">View Mode</span>
            )}
            {isEditMode && (
              <span className="text-sm text-green-600 font-medium">Edit Mode</span>
            )}
          </div>
          <div className="flex gap-2">
            {quoteId && (
              <>
                <button
                  type="button"
                  onClick={handleDownloadPDF}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  <FileDown size={18} />
                  Download PDF
                </button>
                <button
                  type="button"
                  onClick={handlePrintPDF}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Printer size={18} />
                  Print
                </button>
              </>
            )}
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              <ArrowLeft size={18} />
              Back
            </button>
          </div>
        </div>

        {/* Basic Information */}
        <BasicInfoSection formData={formData} setFormData={setFormData} disabled={disabled} />

        {/* Port Details */}
        <PortDetailsSection formData={formData} setFormData={setFormData} disabled={disabled} />

        {/* Equipment Details */}
        <EquipmentSection formData={formData} setFormData={setFormData} category={category} disabled={disabled} />

        {/* Carrier Options Section */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-700">
              {category === 'air' ? 'Airline Options' : 'Sea Options'}
            </h3>
            {!disabled && (
              <button
                type="button"
                onClick={addCarrierOption}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-md transition-all hover:shadow-lg"
              >
                <Plus size={18} />
                Add Option
              </button>
            )}
          </div>

          {/* Render all carrier options */}
          {formData.carrierOptions.map((option, index) => (
            <CarrierOptionSection
              key={index}
              option={option}
              index={index}
              category={category}
              formData={formData}
              setFormData={setFormData}
              onRemove={() => removeCarrierOption(index)}
              disabled={disabled}
              totalOptions={formData.carrierOptions.length}
            />
          ))}
        </div>

        {/* Terms & Conditions */}
        <TermsConditionsSection formData={formData} setFormData={setFormData} disabled={disabled} />

        {/* Save Button */}
        {!disabled && (
          <div className="flex justify-end mt-6">
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Save size={18} />
              {quoteId ? 'Update Quote' : 'Save Quote'}
            </button>
          </div>
        )}
      </div>
    </form>
  );
}