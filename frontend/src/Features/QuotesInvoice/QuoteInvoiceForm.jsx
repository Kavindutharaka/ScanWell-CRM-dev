import React, { useState, useEffect } from "react";
import {
  X,
  FileText,
  User,
  Calendar,
  DollarSign,
  Plus,
  Trash2,
  Save,
  Copy,
  Send,
  Building,
  Plane,
  Ship,
  Package,
  Container,
  ChevronDown,
  AlertCircle,
  MapPin,
  Search,
  CheckCircle,
  Edit
} from "lucide-react";
import * as QuotesInvoiceAPI from '../../api/QuotesInvoiceAPI';
import AirImport from '../../AirImport';
import AirExport from "../../AirExport";
import SeaImportFcl from "../../SeaImportFcl";
import SeaImportLcl from "../../SeaImportLcl";
import SeaExportFclTemplate from "../../SeaExportFcl";
import SeaExportLcl from "../../SeaExportLcl";

import * as RateAPI from '../../api/rateAPI';

export default function QuoteInvoiceForm({ onClose, type = 'quote', editDocument = null, onSuccess }) {
  const [step, setStep] = useState(1);
  const [freightType, setFreightType] = useState('');

  const [routeData, setRouteData] = useState({
      origin: '',
      destination: '',
    });
  
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

  const [rateData, setRateData] = useState({
    airline: '',
    rate45Minus: '',
    rate45Plus: '',
    rateM: '',
    rate100: '',
    rate300: '',
    rate500: '',
    rate1000: '',
    surcharges: '',
    transitTime: '',
    frequency: '',
    routing: '',
    rate20GP: '',
    rate40GP: '',
    rate40HQ: '',
    lclRate: '',
    liner: '',
    routingType: 'DIRECT'
  });

  const [additionalCharges, setAdditionalCharges] = useState([]);
  const [remarksList, setRemarksList] = useState([]);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveAsTemplate, setSaveAsTemplate] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [error, setError] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [importCopy, setImportCopy] = useState(false);
  const [exportCopy, setExportCopy] = useState(false);
  const [seaImportFCLCopy, setSeaImportFCLCopy] = useState(false);
  const [seaImportLCLCopy, setSeaImportLCLCopy] = useState(false);
  const [seaExportFclCopy, setSeaExportFclCopy] = useState(false);
  const [seaExportLclCopy, setSeaExportLclCopy] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState(null);

  const [clickSel, setClickSel] = useState(false);

  // New states for rate search functionality
  const [existingRates, setExistingRates] = useState([]);
  const [loadingRates, setLoadingRates] = useState(false);
  const [selectedRate, setSelectedRate] = useState(null);
  const [showRateSearch, setShowRateSearch] = useState(false);

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

  const isClickSel =()=>{
    setClickSel(true);
  };

  // Load templates from API
  const loadTemplates = async () => {
    setLoadingTemplates(true);
    try {
      const data = await QuotesInvoiceAPI.fetchTemplates(freightType || null);
      console.log("this is fetched data templates: ",data);
      const parsedTemplates = data.map(template => ({
        ...template,
        data: template.dataJson ? JSON.parse(template.dataJson) : null
      }));
      setTemplates(parsedTemplates);
    } catch (err) {
      console.error('Error loading templates:', err);
      setError('Failed to load templates');
    } finally {
      setLoadingTemplates(false);
    }
  };

  const handleRouteChange = (e) => {
    const { name, value } = e.target;
    setRouteData(prev => ({ ...prev, [name]: value }));
    // Clear selected rate when route changes
    setSelectedRate(null);
    setExistingRates([]);
  };

  // Search for available rates based on route
  // const searchRates = async () => {
  //   if (!routeData.origin || !routeData.destination) {
  //     setError('Please enter both origin and destination');
  //     return;
  //   }

  //   setLoadingRates(true);
  //   setError(null);
  //   try {
  //     const rates = await RateAPI.fetchRatesByRoute(routeData.origin, routeData.destination);
  //     console.log("Fetched rates: ", rates);
      
  //     // Filter rates by current freight type
  //     const filteredRates = rates.filter(rate => rate.freightType === freightType);
      
  //     // Parse rateDataJson for each rate
  //     const parsedRates = filteredRates.map(rate => ({
  //       ...rate,
  //       rateData: rate.rateDataJson ? JSON.parse(rate.rateDataJson) : {}
  //     }));
      
  //     setExistingRates(parsedRates);
  //     setShowRateSearch(true);
      
  //     if (parsedRates.length === 0) {
  //       setError(`No rates found for ${freightType} from ${routeData.origin} to ${routeData.destination}`);
  //     }
  //   } catch (err) {
  //     console.error('Error fetching rates:', err);
  //     setError('Failed to fetch rates. Please try again.');
  //   } finally {
  //     setLoadingRates(false);
  //   }
  // };

  // Apply selected rate to rateData
  const applySelectedRate = (rate) => {
    setSelectedRate(rate);
    setRateData({
      ...rateData,
      ...rate.rateData,
      // Preserve any manually entered data that's not in the rate
    });
  };

  // Load templates when freight type changes
  useEffect(() => {
    if (freightType && showTemplates) {
      loadTemplates();
    }
  }, [freightType, showTemplates]);

  // Auto-generate document number
  useEffect(() => {
    const prefix = type === 'quote' ? 'QUO' : 'INV';
    const year = new Date().getFullYear();
    const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    setFormData(prev => ({
      ...prev,
      documentNumber: `${prefix}-${year}-${randomNum}`
    }));
  }, [type]);

  // Initialize default remarks
  useEffect(() => {
    setRemarksList([
      'Rates are subject to Surcharge fluctuations as per the Carrier',
      'Scanwell Logistics will accept payments in USD currency for shipments'
    ]);
  }, []);

  // Load edit document data
  useEffect(() => {
    if (editDocument) {
      setFormData({
        documentNumber: editDocument.documentNumber || '',
        recipient: editDocument.recipient || '',
        recipientEmail: editDocument.recipientEmail || '',
        recipientAddress: editDocument.recipientAddress || '',
        issueDate: editDocument.issueDate || '',
        dueDate: editDocument.dueDate || '',
        expiryDate: editDocument.expiryDate || '',
        currency: editDocument.currency || 'USD',
        notes: editDocument.notes || '',
        terms: editDocument.terms || '',
        templateName: '',
        validUntil: editDocument.validUntil || ''
      });
      
      if (editDocument.freightType) {
        setFreightType(editDocument.freightType);
        setStep(2);
      }
      if (editDocument.rateData) {
        setRateData(editDocument.rateData);
      }
      if (editDocument.additionalCharges) {
        setAdditionalCharges(editDocument.additionalCharges);
      }
      if (editDocument.remarksList) {
        setRemarksList(editDocument.remarksList);
      }
    }
  }, [editDocument]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleRateChange = (e) => {
    const { name, value } = e.target;
    setRateData(prev => ({ ...prev, [name]: value }));
  };

  const addCharge = () => {
    setAdditionalCharges([
      ...additionalCharges,
      { id: Date.now(), type: '', description: '', amount: 0 }
    ]);
  };

  const updateCharge = (id, field, value) => {
    setAdditionalCharges(charges =>
      charges.map(charge =>
        charge.id === id ? { ...charge, [field]: value } : charge
      )
    );
  };

  const removeCharge = (id) => {
    setAdditionalCharges(charges => charges.filter(charge => charge.id !== id));
  };

  const toggleRemark = (remark) => {
    setRemarksList(prev =>
      prev.includes(remark)
        ? prev.filter(r => r !== remark)
        : [...prev, remark]
    );
  };

  const calculateTotal = () => {
    return additionalCharges.reduce((sum, charge) => sum + (parseFloat(charge.amount) || 0), 0);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: formData.currency,
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.recipient.trim()) newErrors.recipient = 'Recipient is required';
    if (!formData.recipientEmail.trim()) {
      newErrors.recipientEmail = 'Recipient email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.recipientEmail)) {
      newErrors.recipientEmail = 'Please enter a valid email address';
    }
    if (!formData.issueDate) newErrors.issueDate = 'Issue date is required';
    if (!freightType) newErrors.freightType = 'Please select a freight type';
    
    if (type === 'invoice' && !formData.dueDate) {
      newErrors.dueDate = 'Due date is required for invoices';
    }
    
    if (type === 'quote' && !formData.expiryDate) {
      newErrors.expiryDate = 'Expiry date is required for quotes';
    }
    
    if (saveAsTemplate && !formData.templateName.trim()) {
      newErrors.templateName = 'Template name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCopy =()=>{
    if(freightType === "air-import"){
      console.log("air import trigger!!!");
      setImportCopy(true);
    }else if(freightType === "air-export"){
      console.log("air export trigger!!!");
      setExportCopy(true);
    }else if(freightType === "sea-import-fcl"){
      console.log("Sea import fcl trigger!!!");
      setSeaImportFCLCopy(true);
    }else if(freightType === "sea-import-lcl"){
      console.log("Sea import lcl trigger!!!");
      setSeaImportLCLCopy(true);
    }else if(freightType === "sea-export-fcl"){
      console.log("Sea export fcl trigger!!!");
      setSeaExportFclCopy(true);
    }else if(freightType === "sea-export-lcl"){
      console.log("Sea export lcl trigger!!!");
      setSeaExportLclCopy(true);
    }
  };

  const handleSubmit = async (action = 'save') => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    setError(null);
    
    try {
      // Prepare document data with type-specific fields
      const documentData = {
        documentNumber: formData.documentNumber,
        recipient: formData.recipient,
        recipientEmail: formData.recipientEmail,
        recipientAddress: formData.recipientAddress,
        issueDate: formData.issueDate,
        currency: formData.currency,
        notes: formData.notes,
        terms: formData.terms,
        validUntil: formData.validUntil,
        freightType,
        rateData: rateData,
        additionalCharges,
        remarksList,
        total: calculateTotal(),
        type,
        status: editDocument ? editDocument.status : 'Draft', // Preserve status if editing
        owner: editDocument ? editDocument.owner : 'Current User' // You can replace with actual user
      };
      console.log("this is going to save data", documentData);
      // Add type-specific fields
      if (type === 'quote') {
        documentData.expiryDate = formData.expiryDate;
      } else if (type === 'invoice') {
        documentData.dueDate = formData.dueDate;
        documentData.paymentStatus = editDocument ? editDocument.paymentStatus : 'Pending';
      }
      
      let savedDocument;
      
      if (editDocument && editDocument.id) {
        // Update existing document
        savedDocument = await QuotesInvoiceAPI.updateDocument(editDocument.id, documentData);
      } else {
        // Create new document
        if (type === 'quote') {
          savedDocument = await QuotesInvoiceAPI.createQuote(documentData);
        } else {
          savedDocument = await QuotesInvoiceAPI.createInvoice(documentData);
        }
      }
      
      if (saveAsTemplate && formData.templateName) {
        try {
          await QuotesInvoiceAPI.createTemplate({
            Name: formData.templateName,
            FreightType: freightType,
            DataJson: JSON.stringify(documentData)
          });
        } catch (err) {
          console.error('Error saving template:', err);
        }
      }
      
      
      if (action === 'save') {
        alert(`${type.charAt(0).toUpperCase() + type.slice(1)} saved successfully!`);
      }
      
      if (onSuccess) {
        onSuccess();
      }
      
      onClose();
    } catch (err) {
      console.error(`Error ${action}ing ${type}:`, err);
      setError(err.response?.data?.message || `Failed to ${action} ${type}. Please try again.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const loadTemplate = (template) => {
    if (template.data) {
      const { 
        documentNumber, 
        recipient, 
        recipientEmail, 
        recipientAddress, 
        issueDate, 
        dueDate, 
        expiryDate, 
        currency, 
        notes, 
        terms, 
        validUntil 
      } = template.data;
      setFormData({
        documentNumber: documentNumber || '',
        recipient: recipient || '',
        recipientEmail: recipientEmail || '',
        recipientAddress: recipientAddress || '',
        issueDate: issueDate || '',
        dueDate: dueDate || '',
        expiryDate: expiryDate || '',
        currency: currency || 'USD',
        notes: notes || '',
        terms: terms || '',
        templateName: '',
        validUntil: validUntil || ''
      });
      setRateData(template.data.rateData || {});
      setAdditionalCharges(template.data.additionalCharges || []);
      setRemarksList(template.data.remarksList || []);
    }
    setFreightType(template.freightType);
    setShowTemplates(false);
    setShowPreview(false);
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

  const renderRateTable = () => {
    if (freightType.startsWith('air')) {
      return (
        <div className="space-y-4">
          <h3 className="font-semibold text-slate-800">Air Freight Rates</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Airline</label>
              <input
                type="text"
                name="airline"
                value={rateData.airline}
                onChange={handleRateChange}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="e.g., EK, QR, UL"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Routing</label>
              <input
                type="text"
                name="routing"
                value={rateData.routing}
                onChange={handleRateChange}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="e.g., CMB/DXB/NBO"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">M (-45KG)</label>
              <input
                type="number"
                name="rateM"
                value={rateData.rateM}
                onChange={handleRateChange}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="0.00"
                step="0.01"
              />
            </div>
            
            {['rate45Minus', 'rate45Plus', 'rate100', 'rate300', 'rate500', 'rate1000'].map((field, idx) => (
              <div key={field}>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  {['45KG', '+45KG', '+100KG', '+300KG', '+500KG', '+1000KG'][idx]}
                </label>
                <input
                  type="number"
                  name={field}
                  value={rateData[field]}
                  onChange={handleRateChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="0.00"
                  step="0.01"
                />
              </div>
            ))}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Transit Time (Days)</label>
              <input
                type="number"
                name="transitTime"
                value={rateData.transitTime}
                onChange={handleRateChange}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="0"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Surcharges</label>
              <input
                type="text"
                name="surcharges"
                value={rateData.surcharges}
                onChange={handleRateChange}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="e.g., 0.35, ALL IN"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Frequency</label>
              <input
                type="text"
                name="frequency"
                value={rateData.frequency}
                onChange={handleRateChange}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="e.g., DAILY, 3-4 WEEKLY"
              />
            </div>
          </div>
        </div>
      );
    }

    if (freightType.includes('fcl')) {
      return (
        <div className="space-y-4">
          <h3 className="font-semibold text-slate-800">Sea Freight FCL Rates</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Liner/Carrier</label>
              <input
                type="text"
                name="liner"
                value={rateData.liner}
                onChange={handleRateChange}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="e.g., MSC, MAERSK"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Routing Type</label>
              <select
                name="routingType"
                value={rateData.routingType}
                onChange={handleRateChange}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="DIRECT">DIRECT</option>
                <option value="TRANSHIP">TRANSHIP</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">20' GP Rate (USD)</label>
              <input
                type="number"
                name="rate20GP"
                value={rateData.rate20GP}
                onChange={handleRateChange}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="0.00"
                step="0.01"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">40' GP Rate (USD)</label>
              <input
                type="number"
                name="rate40GP"
                value={rateData.rate40GP}
                onChange={handleRateChange}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="0.00"
                step="0.01"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">40' HQ Rate (USD)</label>
              <input
                type="number"
                name="rate40HQ"
                value={rateData.rate40HQ}
                onChange={handleRateChange}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="0.00"
                step="0.01"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Transit Time (Days)</label>
            <input
              type="number"
              name="transitTime"
              value={rateData.transitTime}
              onChange={handleRateChange}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              placeholder="0"
            />
          </div>
        </div>
      );
    }

    if (freightType.includes('lcl')) {
      return (
        <div className="space-y-4">
          <h3 className="font-semibold text-slate-800">Sea Freight LCL Rates</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Liner/Carrier</label>
              <input
                type="text"
                name="liner"
                value={rateData.liner}
                onChange={handleRateChange}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="e.g., MSC, MAERSK"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Routing Type</label>
              <select
                name="routingType"
                value={rateData.routingType}
                onChange={handleRateChange}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="DIRECT">DIRECT</option>
                <option value="TRANSHIP">TRANSHIP</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">LCL Rate (USD/W/M or CBM)</label>
              <input
                type="number"
                name="lclRate"
                value={rateData.lclRate}
                onChange={handleRateChange}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="0.00"
                step="0.01"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Transit Time (Days)</label>
              <input
                type="number"
                name="transitTime"
                value={rateData.transitTime}
                onChange={handleRateChange}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="0"
              />
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  if (showPreview && currentTemplate) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-6xl max-h-[90vh] w-full flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-teal-500">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-800">Preview Template</h1>
                <p className="text-sm text-slate-600">Template: {currentTemplate.name}</p>
              </div>
            </div>
            <button onClick={() => setShowPreview(false)} className="p-2 hover:bg-white/70 rounded-lg transition-colors">
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>

          {/* Preview Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {currentTemplate.freightType === 'air-import' && (
              <AirImport
                name={currentTemplate.data.recipient}
                origin={currentTemplate.data.recipientAddress}
                rateData={currentTemplate.data.rateData}
                additionalCharges={currentTemplate.data.additionalCharges}
                remarks={currentTemplate.data.remarksList}
                autoCopy={false}
              />
            )}
            {currentTemplate.freightType === 'air-export' && (
              <AirExport
                name={currentTemplate.data.recipient}
                origin={currentTemplate.data.recipientAddress}
                rateData={currentTemplate.data.rateData}
                additionalCharges={currentTemplate.data.additionalCharges}
                remarks={currentTemplate.data.remarksList}
                autoCopy={false}
                currency={currentTemplate.data.currency || 'USD'}
              />
            )}
            {currentTemplate.freightType === 'sea-import-fcl' && (
              <SeaImportFcl
                name={currentTemplate.data.recipient}
                origin={currentTemplate.data.recipientAddress}
                rateData={currentTemplate.data.rateData}
                additionalCharges={currentTemplate.data.additionalCharges}
                remarks={currentTemplate.data.remarksList}
                autoCopy={false}
                currency={currentTemplate.data.currency || 'USD'}
              />
            )}
            {currentTemplate.freightType === 'sea-import-lcl' && (
              <SeaImportLcl
                name={currentTemplate.data.recipient}
                origin={currentTemplate.data.recipientAddress}
                rateData={currentTemplate.data.rateData}
                additionalCharges={currentTemplate.data.additionalCharges}
                remarks={currentTemplate.data.remarksList}
                autoCopy={false}
                currency={currentTemplate.data.currency || 'USD'}
              />
            )}
            {currentTemplate.freightType === 'sea-export-fcl' && (
              <SeaExportFclTemplate
                name={currentTemplate.data.recipient}
                origin={currentTemplate.data.recipientAddress}
                rateData={currentTemplate.data.rateData}
                additionalCharges={currentTemplate.data.additionalCharges}
                remarks={currentTemplate.data.remarksList}
                autoCopy={false}
                currency={currentTemplate.data.currency || 'USD'}
              />
            )}
            {currentTemplate.freightType === 'sea-export-lcl' && (
              <SeaExportLcl
                name={currentTemplate.data.recipient}
                origin={currentTemplate.data.recipientAddress}
                rateData={currentTemplate.data.rateData}
                additionalCharges={currentTemplate.data.additionalCharges}
                remarks={currentTemplate.data.remarksList}
                autoCopy={false}
                currency={currentTemplate.data.currency || 'USD'}
              />
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end gap-3 p-6 border-t border-slate-200 bg-slate-50">
            <button
              onClick={() => setShowPreview(false)}
              className="px-6 py-3 text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-all font-medium"
            >
              Cancel
            </button>
            <button
              onClick={() => loadTemplate(currentTemplate)}
              className="px-6 py-3 text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-all font-medium flex items-center gap-2 justify-center"
            >
              <Save className="w-4 h-4" />
              Load Template
            </button>
          </div>
        </div>
      </div>
    );
  }

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
              {editDocument ? 'Edit' : 'Create New'} {type.charAt(0).toUpperCase() + type.slice(1)}
            </h1>
            <p className="text-sm text-slate-600">
              Generate professional freight {type}s
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
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-500 mr-3" />
              <p className="text-sm text-red-700">{error}</p>
              <button 
                onClick={() => setError(null)}
                className="ml-auto text-red-500 hover:text-red-700"
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

          {/* Step 2: Basic Information & Rates */}
          {step === 2 && (
            <div className="space-y-6">
              {/* Template Section */}
              <div className="bg-slate-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-slate-800">Load Template</h3>
                  <button
                    onClick={() => setShowTemplates(!showTemplates)}
                    className="text-sm text-teal-600 hover:text-teal-700 transition-colors"
                  >
                    {showTemplates ? 'Hide' : 'Show'} Templates
                  </button>
                </div>
                
                {showTemplates && (
                  <>
                    {loadingTemplates ? (
                      <div className="text-center py-4">
                        <div className="inline-block w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-sm text-slate-600 mt-2">Loading templates...</p>
                      </div>
                    ) : templates.length === 0 ? (
                      <div className="text-center py-4 text-sm text-slate-600">
                        No templates available for this freight type
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {templates
                          .filter(template => template.freightType === freightType)
                          .map((template) => (
                            <button
                              key={template.id}
                              onClick={() => { setCurrentTemplate(template); setShowPreview(true); }}
                              className="text-left p-3 bg-white rounded-lg border border-slate-200 hover:border-teal-300 hover:bg-teal-50 transition-all"
                            >
                              <span className="text-sm font-medium text-slate-700">{template.name}</span>
                            </button>
                          ))
                        }
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Basic Information fields */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
                    <FileText className="w-4 h-4" />
                    Document Number
                  </label>
                  <input
                    type="text"
                    name="documentNumber"
                    value={formData.documentNumber}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50"
                    readOnly
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
                    <DollarSign className="w-4 h-4" />
                    Currency
                  </label>
                  <select
                    name="currency"
                    value={formData.currency}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="USD">USD - US Dollar</option>
                    <option value="EUR">EUR - Euro</option>
                    <option value="GBP">GBP - British Pound</option>
                    <option value="LKR">LKR - Sri Lankan Rupee</option>
                  </select>
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
                    <Building className="w-4 h-4" />
                    Recipient/Company *
                  </label>
                  <input
                    type="text"
                    name="recipient"
                    value={formData.recipient}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                      errors.recipient ? 'border-red-500 bg-red-50' : 'border-slate-300'
                    }`}
                    placeholder="Enter recipient name"
                  />
                  {errors.recipient && (
                    <p className="mt-2 text-sm text-red-600">{errors.recipient}</p>
                  )}
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
                    <User className="w-4 h-4" />
                    Recipient Email *
                  </label>
                  <input
                    type="email"
                    name="recipientEmail"
                    value={formData.recipientEmail}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                      errors.recipientEmail ? 'border-red-500 bg-red-50' : 'border-slate-300'
                    }`}
                    placeholder="Enter email"
                  />
                  {errors.recipientEmail && (
                    <p className="mt-2 text-sm text-red-600">{errors.recipientEmail}</p>
                  )}
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
                    <Calendar className="w-4 h-4" />
                    Issue Date *
                  </label>
                  <input
                    type="date"
                    name="issueDate"
                    value={formData.issueDate}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                      errors.issueDate ? 'border-red-500 bg-red-50' : 'border-slate-300'
                    }`}
                  />
                  {errors.issueDate && (
                    <p className="mt-2 text-sm text-red-600">{errors.issueDate}</p>
                  )}
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
                    <Calendar className="w-4 h-4 text-red-600" />
                    {type === 'invoice' ? 'Due Date *' : 'Expiry Date *'}
                  </label>
                  <input
                    type="date"
                    name={type === 'invoice' ? 'dueDate' : 'expiryDate'}
                    value={type === 'invoice' ? formData.dueDate : formData.expiryDate}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                      (errors.dueDate || errors.expiryDate) ? 'border-red-500 bg-red-50' : 'border-slate-300'
                    }`}
                  />
                  {(errors.dueDate || errors.expiryDate) && (
                    <p className="mt-2 text-sm text-red-600">{errors.dueDate || errors.expiryDate}</p>
                  )}
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
                    <Calendar className="w-4 h-4" />
                    Valid Until (Optional)
                  </label>
                  <input
                    type="date"
                    name="validUntil"
                    value={formData.validUntil}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              {/* Recipient Address */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  Recipient Address
                </label>
                <textarea
                  name="recipientAddress"
                  value={formData.recipientAddress}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                  placeholder="Enter address"
                />
              </div>

              {/* Route Input Section with Search */}
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
                  <div className="flex items-end">
                    <button
                      onClick={()=>console.log('Search Rates')}
                      disabled={loadingRates || !routeData.origin || !routeData.destination}
                      className="w-full px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                    >
                      {loadingRates ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Searching...
                        </>
                      ) : (
                        <>
                          <Search className="w-4 h-4" />
                          Search Rates
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Search Available Rates - Display Section */}
              {showRateSearch && existingRates.length > 0 && (
                <div className="bg-white rounded-lg border-2 border-teal-200 p-6">
                  <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-teal-600" />
                    Available Rates ({existingRates.length})
                  </h3>
                  <div className="space-y-3">
                    {existingRates.map(rate => (
                      <div
                        key={rate.sysID}
                        className={`p-4 border-2 rounded-lg transition-all cursor-pointer ${
                          selectedRate?.sysID === rate.sysID
                            ? 'border-teal-500 bg-teal-50'
                            : 'border-slate-200 hover:border-teal-300 bg-white'
                        }`}
                        onClick={() => applySelectedRate(rate)}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              {selectedRate?.sysID === rate.sysID && (
                                <CheckCircle className="w-5 h-5 text-teal-600" />
                              )}
                              <p className="font-semibold text-slate-800">
                                {rate.rateData?.airline || rate.rateData?.liner || 'Rate'} - {rate.route}
                              </p>
                            </div>
                            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                Valid until: {new Date(rate.validateDate).toLocaleDateString()}
                              </span>
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {rate.origin} → {rate.destination}
                              </span>
                              {rate.rateData?.transitTime && (
                                <span className="flex items-center gap-1">
                                  Transit: {rate.rateData.transitTime} days
                                </span>
                              )}
                              {rate.rateData?.routingType && (
                                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
                                  {rate.rateData.routingType}
                                </span>
                              )}
                            </div>
                            {/* Show rate details based on freight type */}
                            <div className="mt-2 text-xs text-slate-600 flex flex-wrap gap-3">
                              {freightType.includes('fcl') && (
                                <>
                                  {rate.rateData?.rate20GP && <span>20'GP: ${rate.rateData.rate20GP}</span>}
                                  {rate.rateData?.rate40GP && <span>40'GP: ${rate.rateData.rate40GP}</span>}
                                  {rate.rateData?.rate40HQ && <span>40'HQ: ${rate.rateData.rate40HQ}</span>}
                                </>
                              )}
                              {freightType.includes('lcl') && rate.rateData?.lclRate && (
                                <span>LCL: ${rate.rateData.lclRate}/CBM</span>
                              )}
                              {freightType.startsWith('air') && (
                                <>
                                  {rate.rateData?.rateM && <span>M: ${rate.rateData.rateM}</span>}
                                  {rate.rateData?.rate45Plus && <span>+45: ${rate.rateData.rate45Plus}</span>}
                                  {rate.rateData?.rate100 && <span>+100: ${rate.rateData.rate100}</span>}
                                </>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              // applySelectedRate(rate);
                              isClickSel();
                            }}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                              selectedRate?.sysID === rate.sysID
                                ? 'bg-teal-600 text-white'
                                : 'bg-slate-100 text-slate-700 hover:bg-teal-100'
                            }`}
                          >
                            {clickSel ? 'Selected' : 'Select'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Manual Rate Entry - Always visible but populated if rate selected */}
              <div className="bg-slate-50 rounded-lg p-6 border border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-slate-800">
                    {selectedRate ? 'Selected Rate Details (Editable)' : 'Manual Rate Entry'}
                  </h3>
                  {selectedRate && (
                    <button
                      onClick={() => {
                        setSelectedRate(null);
                        setRateData({
                          airline: '',
                          rate45Minus: '',
                          rate45Plus: '',
                          rateM: '',
                          rate100: '',
                          rate300: '',
                          rate500: '',
                          rate1000: '',
                          surcharges: '',
                          transitTime: '',
                          frequency: '',
                          routing: '',
                          rate20GP: '',
                          rate40GP: '',
                          rate40HQ: '',
                          lclRate: '',
                          liner: '',
                          routingType: 'DIRECT'
                        });
                      }}
                      className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1"
                    >
                      <X className="w-4 h-4" />
                      Clear Selection
                    </button>
                  )}
                </div>
                {renderRateTable()}
              </div>

              <div className="flex justify-between pt-4">
                <button
                  onClick={() => setStep(1)}
                  className="px-6 py-3 text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-all"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="px-6 py-3 text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-all"
                >
                  Next: Additional Charges
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Additional Charges & Remarks */}
          {step === 3 && (
            <div className="space-y-6">
              {/* Additional Charges */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-slate-800">Additional Charges</h3>
                  <button
                    onClick={addCharge}
                    className="flex items-center gap-2 px-3 py-2 bg-teal-600 text-white rounded-lg text-sm hover:bg-teal-700 transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    Add Charge
                  </button>
                </div>

                <div className="space-y-3">
                  {additionalCharges.map((charge) => (
                    <div key={charge.id} className="bg-slate-50 rounded-lg p-4">
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                        <div className="md:col-span-4">
                          <label className="block text-sm font-medium text-slate-700 mb-2">Charge Type</label>
                          <select
                            value={charge.type}
                            onChange={(e) => updateCharge(charge.id, 'type', e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                          >
                            <option value="">Select charge type</option>
                            {chargeTypes.map((type) => (
                              <option key={type} value={type}>{type}</option>
                            ))}
                          </select>
                        </div>
                        <div className="md:col-span-5">
                          <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                          <input
                            type="text"
                            value={charge.description}
                            onChange={(e) => updateCharge(charge.id, 'description', e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                            placeholder="Charge description"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-slate-700 mb-2">Amount</label>
                          <input
                            type="number"
                            value={charge.amount}
                            onChange={(e) => updateCharge(charge.id, 'amount', e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                            placeholder="0.00"
                            step="0.01"
                          />
                        </div>
                        <div className="md:col-span-1">
                          <button
                            onClick={() => removeCharge(charge.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Total */}
                <div className="bg-slate-100 rounded-lg p-4 mt-4">
                  <div className="flex justify-between text-lg font-bold text-slate-900">
                    <span>Total Additional Charges:</span>
                    <span>{formatCurrency(calculateTotal())}</span>
                  </div>
                </div>
              </div>

              {/* Remarks */}
              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Remarks</h3>
                <div className="space-y-2">
                  {defaultRemarks.map((remark, index) => (
                    <label key={index} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors">
                      <input
                        type="checkbox"
                        checked={remarksList.includes(remark)}
                        onChange={() => toggleRemark(remark)}
                        className="mt-1 w-4 h-4 text-teal-600 border-slate-300 rounded focus:ring-teal-500"
                      />
                      <span className="text-sm text-slate-700">{remark}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Notes and Terms */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-3">Notes</label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                    placeholder="Additional notes"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-3">Terms & Conditions</label>
                  <textarea
                    name="terms"
                    value={formData.terms}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                    placeholder="Payment terms"
                  />
                </div>
              </div>

              {/* Save as Template */}
              <div className="bg-amber-50 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <input
                    type="checkbox"
                    id="saveAsTemplate"
                    checked={saveAsTemplate}
                    onChange={(e) => setSaveAsTemplate(e.target.checked)}
                    className="w-4 h-4 text-amber-600 border-amber-300 rounded focus:ring-amber-500"
                  />
                  <label htmlFor="saveAsTemplate" className="text-sm font-medium text-amber-800">
                    Save as Template
                  </label>
                </div>
                
                {saveAsTemplate && (
                  <div>
                    <input
                      type="text"
                      name="templateName"
                      value={formData.templateName}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                        errors.templateName ? 'border-red-500 bg-red-50' : 'border-amber-300'
                      }`}
                      placeholder="Enter template name"
                    />
                    {errors.templateName && (
                      <p className="mt-2 text-sm text-red-600">{errors.templateName}</p>
                    )}
                  </div>
                )}
              </div>

              <div className="flex justify-between pt-4">
                <button
                  onClick={() => setStep(2)}
                  className="px-6 py-3 text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-all"
                >
                  Back
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer Actions */}
      {step === 3 && (
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
              onClick={() => handleSubmit('save')}
              disabled={isSubmitting}
              className="px-6 py-3 text-white bg-slate-600 hover:bg-slate-700 disabled:bg-slate-400 rounded-lg transition-all font-medium flex items-center gap-2 justify-center"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save
                </>
              )}
            </button>
            
            <button
              onClick={() => {
                handleCopy();
              }}
              disabled={isSubmitting}
              className={`px-6 py-3 text-white rounded-lg transition-all font-medium flex items-center gap-2 justify-center ${
                type === 'quote' ? 'bg-amber-500 hover:bg-amber-600' : 'bg-emerald-500 hover:bg-emerald-600'
              }`}
            >
              <Copy className="w-4 h-4" />
              Copy to Clipboard
            </button>
          </div>
        </div>
      )}
      <div className="hidden">
          <AirImport
          name={formData.recipient}
          origin={formData.recipientAddress}
          rateData={rateData}
          additionalCharges={additionalCharges}
          remarks={remarksList}
          autoCopy={importCopy}
          />
      </div>
      <div className="hidden">
          <AirExport
          name={formData.recipient}
          origin={formData.recipientAddress}
          rateData={rateData}
          additionalCharges={additionalCharges}
          remarks={remarksList}
          autoCopy={exportCopy}
          currency="USD"
          />
      </div>
      <div className="hidden">
          <SeaImportFcl
          name={formData.recipient}
          origin={formData.recipientAddress}
          rateData={rateData}
          additionalCharges={additionalCharges}
          remarks={remarksList}
          autoCopy={seaImportFCLCopy}
          currency="USD"
          />
      </div>
      <div className="hidden">
          <SeaImportLcl
          name={formData.recipient}
          origin={formData.recipientAddress}
          rateData={rateData}
          additionalCharges={additionalCharges}
          remarks={remarksList}
          autoCopy={seaImportLCLCopy}
          currency="USD"
          />
      </div>
      <div className="hidden">
          <SeaExportFclTemplate
          name={formData.recipient}
          origin={formData.recipientAddress}
          rateData={rateData}
          additionalCharges={additionalCharges}
          remarks={remarksList}
          autoCopy={seaExportFclCopy}
          currency="USD"
          />
      </div>
      <div className="hidden">
          <SeaExportLcl
          name={formData.recipient}
          origin={formData.recipientAddress}
          rateData={rateData}
          additionalCharges={additionalCharges}
          remarks={remarksList}
          autoCopy={seaExportLclCopy}
          currency="USD"
          />
      </div>
    </div>
  );
}