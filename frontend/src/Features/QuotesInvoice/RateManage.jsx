import React, { useState, useEffect } from "react";
import {
  X,
  Plane,
  Ship,
  Plus,
  Save,
  Edit,
  Trash2,
  CheckCircle,
  AlertCircle,
  MapPin,
  Calendar,
  DollarSign,
  Container,
  Package,
  FileText,
  Building,
  User,
  Copy
} from "lucide-react";
import * as QuotesInvoiceAPI from '../../api/QuotesInvoiceAPI';
import * as RateAPI from '../../api/rateAPI';
import AirImport from '../../AirImport';
import AirExport from "../../AirExport";
import SeaImportFcl from "../../SeaImportFcl";
import SeaImportLcl from "../../SeaImportLcl";
import SeaExportFclTemplate from "../../SeaExportFcl";
import SeaExportLcl from "../../SeaExportLcl";

export default function RateManage({ onClose }) {
  const [step, setStep] = useState(1);
  const [freightType, setFreightType] = useState('');

  const type = 'quote';

  // Route & Rate Matching
  const [routeData, setRouteData] = useState({
    origin: '',
    destination: '',
    route: '',
    weight: '',
    containerType: '',
    volume: ''
  });
  const [matchingRates, setMatchingRates] = useState([]);
  const [selectedRate, setSelectedRate] = useState(null);
  const [rateMatchMessage, setRateMatchMessage] = useState('');
  const [calculatedTotal, setCalculatedTotal] = useState(0);

  // Document Form
  const [formData, setFormData] = useState({
    documentNumber: '',
    recipient: '',
    recipientEmail: '',
    recipientAddress: '',
    issueDate: '',
    dueDate: '',
    expiryDate: '',
    currency: 'USD',
    notes: '',
    terms: '',
    templateName: '',
    validUntil: ''
  });

  // Rate Data (for manual entry or editing)
  const [rateData, setRateData] = useState({
    airline: '',
    liner: '',
    routing: '',
    surcharges: '',
    transitTime: '',
    frequency: '',
    routingType: 'DIRECT',
    rate45Minus: '',
    rate45Plus: '',
    rateM: '',
    rate45KG: '',
    rate100: '',
    rate300: '',
    rate500: '',
    rate1000: '',
    rate20GP: '',
    rate40GP: '',
    rate40HQ: '',
    lclRate: '',
    validateDate: ''
  });

  // Additional Charges & Remarks
  const [additionalCharges, setAdditionalCharges] = useState([]);
  const [remarksList, setRemarksList] = useState([]);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveAsTemplate, setSaveAsTemplate] = useState(false);

  // Rate Management States
  const [existingRates, setExistingRates] = useState([]);
  const [loadingRates, setLoadingRates] = useState(false);
  const [rateError, setRateError] = useState('');
  const [editingRateId, setEditingRateId] = useState(null);
  const [rateFormError, setRateFormError] = useState('');

  const [editDocument, setEditDocument] = useState(false);


  const chargeTypes = [
    'Freight Charges', 'EXW Charges', 'BL Fee', 'CFS charges', 'Loading/Unloading',
    'Custom clearance charges', 'Handling Charges', 'PSS charges', 'ACI Fee', 'AMS Fee',
    'ECI fee', 'Pickup Charges', 'Local Forwarding charges', 'SLPA charges', 'Doc Fee',
    'Export license fee', 'Trico Gatepass', 'VGM fee', 'Manifest amendment fee', 'EDI charges',
    'Peek charges', 'Origin Charges', 'Waiting Charges', 'Palletizing Charges', 'Labour Charges',
    'Equipment charges', 'DG surcharges', 'Over weight surcharges', 'Custom Inspection fee',
    'Additional surcharges', 'GRI charges', 'Others'
  ];

  const defaultRemarks = [
    'Rates are subject to Surcharge fluctuations as per the Carrier',
    'Rates are subject to fluctuation by the carrier with or without prior notice',
    'Rates are not applicable for Dangerous Goods or Perishable Cargo',
    'Scanwell Logistics will accept payments in USD currency for shipments'
  ];

  // Apply selected rate
  const applyRate = (rate) => {
    setSelectedRate(rate);
    setRateData({
      airline: rate.airline || '',
      liner: rate.liner || '',
      routing: rate.route || '',
      surcharges: rate.surcharges || '',
      transitTime: rate.transitTime || '',
      frequency: rate.frequency || '',
      routingType: rate.routingType || 'DIRECT',
      rate45Minus: rate.rate45Minus || '',
      rate45Plus: rate.rate45Plus || '',
      rateM: rate.rateM || '',
      rate45KG: rate.rate45KG || '',
      rate100: rate.rate100 || '',
      rate300: rate.rate300 || '',
      rate500: rate.rate500 || '',
      rate1000: rate.rate1000 || '',
      rate20GP: rate.rate20GP || '',
      rate40GP: rate.rate40GP || '',
      rate40HQ: rate.rate40HQ || '',
      lclRate: rate.lclRate || '',
      validateDate: rate.validateDate || ''
    });
    setRateMatchMessage('Rate applied successfully!');
  };

  // useEffect(() => {
  //   if (selectedRate && routeData.weight) {
  //     setCalculatedTotal(calculateRateTotal());
  //   }
  // }, [selectedRate, routeData, freightType]);


  useEffect(() => {
    if (freightType && step === 2) {
      fetchExistingRates();
    }
  }, [freightType, step]);

  const fetchExistingRates = async () => {
    setLoadingRates(true);
    setRateError('');
    try {
      const allRates = await RateAPI.fetchRates();
      // Filter rates by freight type and parse rateDataJson
      const filteredRates = allRates
        .filter(rate => rate.freightType === freightType)
        .map(rate => {
          // Parse rateDataJson if it exists
          let parsedRateData = {};
          if (rate.rateDataJson) {
            try {
              parsedRateData = JSON.parse(rate.rateDataJson);
            } catch (e) {
              console.error('Error parsing rateDataJson:', e);
            }
          }
          // Merge parsed rate data with the main rate object
          return {
            ...rate,
            ...parsedRateData
          };
        });
      setExistingRates(filteredRates || []);
    } catch (err) {
      console.error('Error fetching rates:', err);
      setRateError('Failed to load rates. Please try again.');
    } finally {
      setLoadingRates(false);
    }
  };

  // Handle Rate Form Submission (Create or Update)
  const handleRateSubmit = async (e) => {
    e.preventDefault();
    setRateFormError('');

    if (!rateData.validateDate) {
      setRateFormError('Validation date is required.');
      return;
    }

    // Validate route data
    if (!routeData.origin || !routeData.destination) {
      setRateFormError('Origin and Destination are required.');
      return;
    }

    // Prepare rate data JSON with values from rateData state
    const rateDatas = {
      airline: rateData.airline || null,
      liner: rateData.liner || null,
      routing: rateData.routing || null,
      surcharges: rateData.surcharges || null,
      transitTime: 0,
      frequency: rateData.frequency || null,
      routingType: rateData.routingType || 'DIRECT',
      rate45Minus: rateData.rate45Minus ? parseFloat(rateData.rate45Minus) : null,
      rate45Plus: rateData.rate45Plus ? parseFloat(rateData.rate45Plus) : null,
      rateM: rateData.rateM ? parseFloat(rateData.rateM) : null,
      rate45KG: rateData.rate45KG ? parseFloat(rateData.rate45KG) : null,
      rate100: rateData.rate100 ? parseFloat(rateData.rate100) : null,
      rate300: rateData.rate300 ? parseFloat(rateData.rate300) : null,
      rate500: rateData.rate500 ? parseFloat(rateData.rate500) : null,
      rate1000: rateData.rate1000 ? parseFloat(rateData.rate1000) : null,
      rate20GP: rateData.rate20GP ? parseFloat(rateData.rate20GP) : null,
      rate40GP: rateData.rate40GP ? parseFloat(rateData.rate40GP) : null,
      rate40HQ: rateData.rate40HQ ? parseFloat(rateData.rate40HQ) : null,
      lclRate: rateData.lclRate ? parseFloat(rateData.lclRate) : null,
    };

    // Prepare payload with values from routeData and rateData
    const payload = {
      freightType: freightType,
      origin: routeData.origin,
      destination: routeData.destination,
      route: routeData.route || `${routeData.origin}/${routeData.destination}`,
      rateDataJson: JSON.stringify(rateDatas),
      validateDate: rateData.validateDate, 
      owner: "System" // You can replace this with actual logged-in user
    };

    console.log('Sending to backend:', payload);
    console.log('Rate Data:', rateDatas);

    try {
      if (editingRateId) {
        setEditDocument(true);
        // For update, include the ID in the payload
        const updatePayload = {
          ...payload,
          id: editingRateId
        };
        await RateAPI.updateRate(updatePayload);
      } else {
        await RateAPI.createRate(payload);
      }
      
      // Reset form and reload rates
      resetRateForm();
      setRouteData({
        origin: '',
        destination: '',
        route: '',
        weight: '',
        containerType: '',
        volume: ''
      });
      
      fetchExistingRates();
      setRateMatchMessage(editingRateId ? 'Rate updated successfully!' : 'Rate created successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setRateMatchMessage(''), 3000);
    } catch (err) {
      console.error('Error saving rate:', err);
      setRateFormError(err.response?.data?.message || err.message || 'Failed to save rate.');
    }
  };

  const resetRateForm = () => {
    setEditingRateId(null);
    setRateData({
      airline: '',
      liner: '',
      routing: '',
      surcharges: '',
      transitTime: '',
      frequency: '',
      routingType: 'DIRECT',
      rate45Minus: '',
      rate45Plus: '',
      rateM: '',
      rate45KG: '',
      rate100: '',
      rate300: '',
      rate500: '',
      rate1000: '',
      rate20GP: '',
      rate40GP: '',
      rate40HQ: '',
      lclRate: '',
      validateDate: ''
    });
  };

  const startEditRate = (rate) => {
    setEditingRateId(rate.id);
    
    // Parse rateDataJson if it exists, otherwise use direct properties
    let rateInfo = rate;
    if (rate.rateDataJson && typeof rate.rateDataJson === 'string') {
      try {
        const parsed = JSON.parse(rate.rateDataJson);
        rateInfo = { ...rate, ...parsed };
      } catch (e) {
        console.error('Error parsing rate data:', e);
      }
    }
    
    setRateData({
      airline: rateInfo.airline || '',
      liner: rateInfo.liner || '',
      routing: rateInfo.routing || rateInfo.route || '',
      surcharges: rateInfo.surcharges || '',
      transitTime: rateInfo.transitTime || '',
      frequency: rateInfo.frequency || '',
      routingType: rateInfo.routingType || 'DIRECT',
      rate45Minus: rateInfo.rate45Minus || '',
      rate45Plus: rateInfo.rate45Plus || '',
      rateM: rateInfo.rateM || '',
      rate45KG: rateInfo.rate45KG || '',
      rate100: rateInfo.rate100 || '',
      rate300: rateInfo.rate300 || '',
      rate500: rateInfo.rate500 || '',
      rate1000: rateInfo.rate1000 || '',
      rate20GP: rateInfo.rate20GP || '',
      rate40GP: rateInfo.rate40GP || '',
      rate40HQ: rateInfo.rate40HQ || '',
      lclRate: rateInfo.lclRate || '',
      validateDate: rate.validateDate || ''
    });
    
    setRouteData(prev => ({
      ...prev,
      origin: rate.origin || '',
      destination: rate.destination || '',
      route: rate.route || ''
    }));
  };

  const deleteRate = async (id) => {
    if (!window.confirm('Are you sure you want to delete this rate?')) return;
    try {
      await RateAPI.deleteRate(id);
      fetchExistingRates();
      setRateMatchMessage('Rate deleted successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setRateMatchMessage(''), 3000);
    } catch (err) {
      console.error('Error deleting rate:', err);
      setRateError(err.response?.data?.message || err.message || 'Failed to delete rate.');
    }
  };

  // Form Handlers
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleRateChange = (e) => {
    const { name, value } = e.target;
    setRateData(prev => ({ ...prev, [name]: value }));
  };

  const handleRouteChange = (e) => {
    const { name, value } = e.target;
    setRouteData(prev => ({ ...prev, [name]: value }));
  };


  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: formData.currency,
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const handleSubmit = async () => {
    
  };


  const renderFreightTypeSelector = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-slate-800 mb-4">Select Freight Type</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border-2 border-slate-200 rounded-lg p-4 hover:border-teal-500 transition-all">
          <div className="flex items-center gap-3 mb-3">
            <Plane className="w-6 h-6 text-blue-500" />
            <h4 className="font-semibold text-slate-800">Air Freight</h4>
          </div>
          <div className="space-y-2">
            <button
              onClick={() => { setFreightType('air-import'); setStep(2); }}
              className="w-full text-left px-4 py-3 bg-slate-50 hover:bg-blue-50 rounded-lg transition-colors"
            >
              Air Import
            </button>
            <button
              onClick={() => { setFreightType('air-export'); setStep(2); }}
              className="w-full text-left px-4 py-3 bg-slate-50 hover:bg-blue-50 rounded-lg transition-colors"
            >
              Air Export
            </button>
          </div>
        </div>

        <div className="border-2 border-slate-200 rounded-lg p-4 hover:border-teal-500 transition-all">
          <div className="flex items-center gap-3 mb-3">
            <Ship className="w-6 h-6 text-teal-500" />
            <h4 className="font-semibold text-slate-800">Sea Freight</h4>
          </div>
          <div className="space-y-2">
            <button
              onClick={() => { setFreightType('sea-import-fcl'); setStep(2); }}
              className="w-full text-left px-4 py-3 bg-slate-50 hover:bg-teal-50 rounded-lg transition-colors flex items-center justify-between"
            >
              <span>Sea Import FCL</span>
              <Container className="w-4 h-4 text-slate-400" />
            </button>
            <button
              onClick={() => { setFreightType('sea-import-lcl'); setStep(2); }}
              className="w-full text-left px-4 py-3 bg-slate-50 hover:bg-teal-50 rounded-lg transition-colors flex items-center justify-between"
            >
              <span>Sea Import LCL</span>
              <Package className="w-4 h-4 text-slate-400" />
            </button>
            <button
              onClick={() => { setFreightType('sea-export-fcl'); setStep(2); }}
              className="w-full text-left px-4 py-3 bg-slate-50 hover:bg-teal-50 rounded-lg transition-colors flex items-center justify-between"
            >
              <span>Sea Export FCL</span>
              <Container className="w-4 h-4 text-slate-400" />
            </button>
            <button
              onClick={() => { setFreightType('sea-export-lcl'); setStep(2); }}
              className="w-full text-left px-4 py-3 bg-slate-50 hover:bg-teal-50 rounded-lg transition-colors flex items-center justify-between"
            >
              <span>Sea Export LCL</span>
              <Package className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        </div>
      </div>

      {errors.freightType && (
        <p className="text-sm text-red-600 flex items-center gap-1">
          <span className="w-4 h-4">⚠️</span>
          {errors.freightType}
        </p>
      )}
    </div>
  );

  return (
    <div className="w-full max-w-6xl mx-auto bg-white rounded-2xl shadow-xl max-h-[90vh] flex flex-col">
      {/* Header */}
      <div className={`flex items-center justify-between p-6 border-b border-slate-200 rounded-t-2xl ${
        type === 'quote' ? 'bg-gradient-to-r from-amber-50 to-orange-50' : 'bg-gradient-to-r from-emerald-50 to-teal-50'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
            type === 'quote' ? 'bg-amber-500' : 'bg-emerald-500'
          }`}>
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">
              Rate Management - {editDocument ? 'Edit' : 'Create'} {type.charAt(0).toUpperCase() + type.slice(1)}
            </h1>
            <p className="text-sm text-slate-600">
              Manage rates and generate {type}s
            </p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-white/70 rounded-lg transition-colors">
          <X className="w-5 h-5 text-slate-500" />
        </button>
      </div>

      {/* Form Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Error Display */}
        {(rateError || errors.submit) && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-500 mr-3" />
              <p className="text-sm text-red-700">{rateError || errors.submit}</p>
              <button 
                onClick={() => { setRateError(''); setErrors(prev => ({ ...prev, submit: '' })); }}
                className="ml-auto text-red-500 hover:text-red-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Success Message */}
        {rateMatchMessage && (
          <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
              <p className="text-sm text-green-700">{rateMatchMessage}</p>
              <button 
                onClick={() => setRateMatchMessage('')}
                className="ml-auto text-green-500 hover:text-green-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
        
        <div className="space-y-8">
          {/* Step Indicator */}
          <div className="flex items-center gap-2 mb-6">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${step >= 1 ? 'bg-teal-600 text-white' : 'bg-slate-200 text-slate-600'}`}>1</div>
            <div className={`h-1 flex-1 ${step >= 2 ? 'bg-teal-600' : 'bg-slate-200'}`} />
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${step >= 2 ? 'bg-teal-600 text-white' : 'bg-slate-200 text-slate-600'}`}>2</div>
            <div className={`h-1 flex-1 ${step >= 3 ? 'bg-teal-600' : 'bg-slate-200'}`} />
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${step >= 3 ? 'bg-teal-600 text-white' : 'bg-slate-200 text-slate-600'}`}>3</div>
          </div>

          {/* Step 1: Select Freight Type */}
          {step === 1 && renderFreightTypeSelector()}

          {/* Step 2: Rate Management */}
          {step === 2 && (
            <div className="space-y-6">
              {/* Route Input Section */}
              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg p-6 border border-blue-200">
                <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-blue-600" />
                  Route Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Origin</label>
                    <input
                      name="origin"
                      value={routeData.origin}
                      onChange={handleRouteChange}
                      placeholder="e.g., CMB"
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Destination</label>
                    <input
                      name="destination"
                      value={routeData.destination}
                      onChange={handleRouteChange}
                      placeholder="e.g., IND"
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Route</label>
                    <input
                      name="route"
                      value={routeData.route}
                      onChange={handleRouteChange}
                      placeholder="e.g., CMB/DXB/IND"
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>
              </div>

              {/* Existing Rates */}
              <div className="bg-white rounded-lg border-2 border-slate-200 p-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Available Rates</h3>
                {loadingRates ? (
                  <div className="text-center py-8">
                    <div className="inline-block w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-sm text-slate-600 mt-3">Loading rates...</p>
                  </div>
                ) : existingRates.length === 0 ? (
                  <div className="text-center py-8 bg-slate-50 rounded-lg">
                    <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                    <p className="text-sm text-slate-600">No rates found for this freight type.</p>
                    <p className="text-xs text-slate-500 mt-1">Create a new rate below to get started.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {existingRates.map(rate => (
                      <div
                        key={rate.id}
                        className={`p-4 border-2 rounded-lg transition-all ${
                          selectedRate?.id === rate.id
                            ? 'border-green-500 bg-green-50'
                            : 'border-slate-200 hover:border-teal-300 bg-white'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              {selectedRate?.id === rate.id && (
                                <CheckCircle className="w-5 h-5 text-green-600" />
                              )}
                              <p className="font-semibold text-slate-800">
                                {rate.airline || rate.liner || 'Rate'} - {rate.route || 'N/A'}
                              </p>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-slate-600">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                Valid until: {new Date(rate.validateDate).toLocaleDateString()}
                              </span>
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {rate.origin} → {rate.destination}
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                          
                            <button
                              onClick={() => startEditRate(rate)}
                              className="p-2 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition-colors"
                              title="Edit Rate"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => deleteRate(rate.id)}
                              className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                              title="Delete Rate"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Create/Edit Rate Form */}
              <form onSubmit={handleRateSubmit} className="bg-slate-50 rounded-lg p-6 border-2 border-slate-200">
                <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  {editingRateId ? <Edit className="w-5 h-5 text-amber-600" /> : <Plus className="w-5 h-5 text-teal-600" />}
                  {editingRateId ? 'Update Rate' : 'Create New Rate'}
                </h3>
                
                {rateFormError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    <p className="text-sm text-red-600">{rateFormError}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      <Calendar className="w-4 h-4 inline mr-1" />
                      Valid Until *
                    </label>
                    <input
                      name="validateDate"
                      type="date"
                      value={rateData.validateDate}
                      onChange={handleRateChange}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                      required
                    />
                  </div>
                  {freightType.startsWith('air') && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        <Plane className="w-4 h-4 inline mr-1" />
                        Airline
                      </label>
                      <input
                        name="airline"
                        value={rateData.airline}
                        onChange={handleRateChange}
                        placeholder="e.g., EK, QR, UL"
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                  )}
                  {freightType.startsWith('sea') && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        <Ship className="w-4 h-4 inline mr-1" />
                        Liner/Carrier
                      </label>
                      <input
                        name="liner"
                        value={rateData.liner}
                        onChange={handleRateChange}
                        placeholder="e.g., MSC, MAERSK"
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                  )}
                </div>

                {/* Rate Fields Based on Freight Type */}
                {freightType === 'air-import' && (
                  <div className="space-y-4">
                    <h4 className="font-medium text-slate-700">Air Import Rates</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">M (-45KG)</label>
                        <input
                          name="rateM"
                          type="number"
                          step="0.01"
                          value={rateData.rateM}
                          onChange={handleRateChange}
                          placeholder="0.00"
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">+45KG</label>
                        <input
                          name="rate45KG"
                          type="number"
                          step="0.01"
                          value={rateData.rate45KG}
                          onChange={handleRateChange}
                          placeholder="0.00"
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {freightType === 'air-export' && (
                  <div className="space-y-4">
                    <h4 className="font-medium text-slate-700">Air Export Rates</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {[
                        { name: 'rate45Minus', label: '-45KG' },
                        { name: 'rate45Plus', label: '+45KG' },
                        { name: 'rate100', label: '+100KG' },
                        { name: 'rate300', label: '+300KG' },
                        { name: 'rate500', label: '+500KG' },
                        { name: 'rate1000', label: '+1000KG' }
                      ].map(field => (
                        <div key={field.name}>
                          <label className="block text-sm font-medium text-slate-700 mb-2">{field.label}</label>
                          <input
                            name={field.name}
                            type="number"
                            step="0.01"
                            value={rateData[field.name]}
                            onChange={handleRateChange}
                            placeholder="0.00"
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {freightType.includes('fcl') && (
                  <div className="space-y-4">
                    <h4 className="font-medium text-slate-700">FCL Container Rates</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">20' GP</label>
                        <input
                          name="rate20GP"
                          type="number"
                          step="0.01"
                          value={rateData.rate20GP}
                          onChange={handleRateChange}
                          placeholder="0.00"
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">40' GP</label>
                        <input
                          name="rate40GP"
                          type="number"
                          step="0.01"
                          value={rateData.rate40GP}
                          onChange={handleRateChange}
                          placeholder="0.00"
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">40' HQ</label>
                        <input
                          name="rate40HQ"
                          type="number"
                          step="0.01"
                          value={rateData.rate40HQ}
                          onChange={handleRateChange}
                          placeholder="0.00"
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {freightType.includes('lcl') && (
                  <div className="space-y-4">
                    <h4 className="font-medium text-slate-700">LCL Rate</h4>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">LCL Rate (USD/CBM or W/M)</label>
                      <input
                        name="lclRate"
                        type="number"
                        step="0.01"
                        value={rateData.lclRate}
                        onChange={handleRateChange}
                        placeholder="0.00"
                        className="w-full md:w-1/3 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                  </div>
                )}

                <div className="flex gap-3 mt-6">
                  <button
                    type="submit"
                    className="px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-all font-medium flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    {editingRateId ? 'Update Rate' : 'Create Rate'}
                  </button>
                  {editingRateId && (
                    <button
                      type="button"
                      onClick={resetRateForm}
                      className="px-6 py-3 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-all font-medium"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>

              {/* Shipment Details & Calculated Total */}
              {selectedRate && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6 border-2 border-green-200">
                  <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-green-600" />
                    Shipment Details & Cost Calculation
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    {(freightType.includes('air') || freightType.includes('lcl')) && (
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Weight (KG)</label>
                        <input
                          name="weight"
                          type="number"
                          value={routeData.weight}
                          onChange={handleRouteChange}
                          placeholder="Enter weight"
                          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                    )}
                    {freightType.includes('fcl') && (
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Container Type</label>
                        <select
                          name="containerType"
                          value={routeData.containerType}
                          onChange={handleRouteChange}
                          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        >
                          <option value="">Select Container Type</option>
                          <option value="20GP">20' GP</option>
                          <option value="40GP">40' GP</option>
                          <option value="40HQ">40' HQ</option>
                        </select>
                      </div>
                    )}
                    {freightType.includes('lcl') && (
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Volume (CBM)</label>
                        <input
                          name="volume"
                          type="number"
                          value={routeData.volume}
                          onChange={handleRouteChange}
                          placeholder="Enter volume"
                          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                    )}
                  </div>
                  {calculatedTotal > 0 && (
                    <div className="bg-white rounded-lg p-6 border-2 border-green-300 shadow-sm">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm text-slate-600 mb-1">Estimated Freight Cost</p>
                          <p className="text-3xl font-bold text-green-600">{formatCurrency(calculatedTotal)}</p>
                        </div>
                        <CheckCircle className="w-12 h-12 text-green-500" />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer Actions */}
      {step === 2 && (
        <div className="flex flex-col sm:flex-row justify-between gap-3 p-6 border-t border-slate-200 bg-slate-50 rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-6 py-3 text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-all font-medium"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={() => handleSubmit()}
              disabled={isSubmitting}
              className="px-6 py-3 text-white bg-slate-600 hover:bg-slate-700 disabled:bg-slate-400 rounded-lg transition-all font-medium flex items-center gap-2 justify-center"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Close...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Close
                </>
              )}
            </button>
          </div>
        </div>
      )}

    </div>
  );
}