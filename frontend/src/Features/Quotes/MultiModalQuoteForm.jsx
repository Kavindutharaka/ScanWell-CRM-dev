// MultiModalQuoteForm.jsx
import { useState, useEffect } from 'react';
import { Save, Plus, ArrowLeft, Trash2, FileDown, Printer } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import BasicInfoSection from './components/BasicInfoSection';
import MultiModalRouteConfiguration from './components/MultiModalRouteConfiguration';
import TermsConditionsSection from './components/TermsConditionsSection';
import { generateQuoteNumber } from '../../utils/quoteUtils';
import { fetchQuoteById, updateQuote, createNewQuote } from '../../api/QuoteApi';
import { generateMultiModalQuotePDF, printMultiModalQuotePDF } from './utils/pdfGenerator';
import { fetchAccountAddress } from '../../api/AccountApi';

export default function MultiModalQuoteForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const quoteId = searchParams.get('id');
  const isEditMode = searchParams.get('edit') === 'true';
  const isViewMode = quoteId && !isEditMode;

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    quoteNumber: '',
    createdDate: new Date().toISOString().split('T')[0],
    rateValidity: '',
    customer: '',
    pickupLocation: '',
    deliveryLocation: '',
    importExport: 'import',
    routeOptions: [
      {
        routeName: 'Option 1',
        routes: [
          {
            mode: 'air',
            origin: '',
            destination: '',
            // Equipment details per segment
            equipment: {
              carrier: '',
              equipment: '',
              transitTime: '',
              netWeight: '',
              grossWeight: '',
              volume: '',
              chargeableWeight: ''
            },
            // Freight charges per segment
            freightChargesTables: [
              {
                tableName: 'Default',
                chargeableWeight: '',
                weightBreaker: '',
                pricingUnit: '',
                charge: '',
                currency: ''
              }
            ],
            // Handling charges per segment
            originHandling: [
              { chargeName: '', unitType: '', numberOfUnits: '', amount: '', currency: '', total: 0 }
            ],
            destinationHandling: [
              { chargeName: '', unitType: '', numberOfUnits: '', amount: '', currency: '', total: 0 }
            ]
          }
        ]
      }
    ],
    termsConditions: []
  });

  useEffect(() => {
    if (quoteId) {
      loadQuoteData();
    } else {
      setFormData(prev => ({
        ...prev,
        quoteNumber: generateQuoteNumber()
      }));
    }
  }, [quoteId]);

  const dateFormatter =(dateTime)=>{
    if (!dateTime) return "";
    return dateTime.split("T")[0];
  };

  const loadQuoteData = async () => {
    try {
      setLoading(true);
      const data = await fetchQuoteById(quoteId);
      
      setFormData({
        quoteNumber: data[0].quoteNumber || '',
        createdDate: dateFormatter(data[0].createdDate) || '',
        rateValidity: dateFormatter(data[0].rateValidity) || '',
        customer: data[0].customer || '',
        pickupLocation: data[0].pickupLocation || '',
        deliveryLocation: data[0].deliveryLocation || '',
        importExport: data[0].freightMode || 'import',
        routeOptions: data[0].routes ? JSON.parse(data[0].routes) : formData.routeOptions,
        termsConditions: data[0].termsConditions ? JSON.parse(data[0].termsConditions) : []
      });
    } catch (error) {
      console.error('Error loading quote:', error);
      alert('Failed to load quote data');
    } finally {
      setLoading(false);
    }
  };

  const addRouteOption = () => {
    if (isViewMode) return;
    
    setFormData(prev => ({
      ...prev,
      routeOptions: [
        ...prev.routeOptions,
        {
          routeName: `Option ${prev.routeOptions.length + 1}`,
          routes: [
            {
              mode: 'air',
              origin: '',
              destination: '',
              equipment: {
                carrier: '',
                equipment: '',
                transitTime: '',
                netWeight: '',
                grossWeight: '',
                volume: '',
                chargeableWeight: ''
              },
              freightChargesTables: [
                {
                  tableName: 'Default',
                  chargeableWeight: '',
                  weightBreaker: '',
                  pricingUnit: '',
                  charge: '',
                  currency: ''
                }
              ],
              originHandling: [
                { chargeName: '', unitType: '', numberOfUnits: '', amount: '', currency: '', total: 0 }
              ],
              destinationHandling: [
                { chargeName: '', unitType: '', numberOfUnits: '', amount: '', currency: '', total: 0 }
              ]
            }
          ]
        }
      ]
    }));
  };

  const removeRouteOption = (routeIdx) => {
    if (isViewMode || formData.routeOptions.length === 1) return;
    
    setFormData(prev => ({
      ...prev,
      routeOptions: prev.routeOptions.filter((_, i) => i !== routeIdx)
    }));
  };

  const calculateTotalTransitTime = () => {
    return formData.routeOptions.reduce((optionSum, option) => {
      const routeSum = option.routes.reduce((routeSum, route) => {
        return routeSum + (parseInt(route.equipment.transitTime) || 0);
      }, 0);
      return optionSum + routeSum;
    }, 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate customer
    if (!formData.customer || formData.customer.trim() === '') {
      alert('Customer is required. Please enter a customer name.');
      return;
    }
    
    const payload = {
      quoteNumber: formData.quoteNumber,
      freightCategory: 'multimodal',
      freightMode: formData.importExport,
      freightType: 'multimodal',
      createdDate: formData.createdDate,
      rateValidity: formData.rateValidity,
      customer: formData.customer,
      pickupLocation: formData.pickupLocation,
      deliveryLocation: formData.deliveryLocation,
      routes: JSON.stringify(formData.routeOptions),
      totalTransitTime: calculateTotalTransitTime(),
      termsConditions: JSON.stringify(formData.termsConditions),
      status: 'draft',
      createdBy: 11,
      createdAt: new Date().toISOString()
    };

    // Add quoteId when updating
    if (quoteId) {
      payload.quoteId = quoteId;
    }

    try {
      if (quoteId) {
        await updateQuote(payload);
        alert('Quote updated successfully!');
      } else {
        await createNewQuote(payload);
        alert('Quote created successfully!');
      }
      navigate(-1);
    } catch (error) {
      console.error('Error saving quote:', error);
      alert('Failed to save quote');
    }
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
      freightMode: formData.importExport,
      freightType: 'multimodal',
      createdDate: formData.createdDate,
      rateValidity: formData.rateValidity,
      customer: formData.customer,
      customerAddress: customerAddress,
      pickupLocation: formData.pickupLocation,
      deliveryLocation: formData.deliveryLocation,
      routes: JSON.stringify(formData.routeOptions),
      termsConditions: JSON.stringify(formData.termsConditions)
    };
  };

  const handleDownloadPDF = async () => {
    const pdfData = await preparePDFData();
    generateMultiModalQuotePDF(pdfData);
  };

  const handlePrintPDF = async () => {
    const pdfData = await preparePDFData();
    printMultiModalQuotePDF(pdfData);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">Multi-Modal Freight Quote</h2>
            <p className="text-sm text-gray-600 mt-1">Quote Number: {formData.quoteNumber}</p>
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

        {/* Import/Export Selector */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Import / Export</label>
          <select
            value={formData.importExport}
            onChange={(e) => setFormData(prev => ({ ...prev, importExport: e.target.value }))}
            disabled={isViewMode}
            className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100"
          >
            <option value="import">Import</option>
            <option value="export">Export</option>
          </select>
        </div>

        {/* Basic Information */}
        <BasicInfoSection formData={formData} setFormData={setFormData} disabled={isViewMode} />

        {/* Route Options */}
        <div className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-700">Route Options</h3>
            {!isViewMode && (
              <button
                type="button"
                onClick={addRouteOption}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <Plus size={18} />
                Add Option
              </button>
            )}
          </div>

          {formData.routeOptions.map((routeOption, routeIdx) => (
            <div key={routeIdx} className="border-2 border-purple-200 rounded-lg p-6 mb-6 bg-gradient-to-br from-purple-50 to-pink-50">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-lg font-semibold text-purple-900">{routeOption.routeName}</h4>
                {formData.routeOptions.length > 1 && !isViewMode && (
                  <button
                    type="button"
                    onClick={() => removeRouteOption(routeIdx)}
                    className="flex items-center gap-1 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                  >
                    <Trash2 size={16} />
                    Remove Option
                  </button>
                )}
              </div>

              {/* Route Configuration with per-segment details */}
              <MultiModalRouteConfiguration
                routeOption={routeOption}
                routeIdx={routeIdx}
                formData={formData}
                setFormData={setFormData}
                disabled={isViewMode}
              />
            </div>
          ))}
        </div>

        {/* Total Transit Time */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-lg p-4 mb-6">
          <div className="text-lg font-semibold text-blue-900">
            Total Transit Time: {calculateTotalTransitTime()} Days
          </div>
        </div>

        {/* Terms & Conditions */}
        <TermsConditionsSection formData={formData} setFormData={setFormData} disabled={isViewMode} />

        {!isViewMode && (
          <div className="flex justify-end mt-6">
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
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