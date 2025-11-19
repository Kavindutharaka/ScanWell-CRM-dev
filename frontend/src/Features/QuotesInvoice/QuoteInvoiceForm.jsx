import React, { useState, useEffect, useMemo } from "react";
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
  Edit,
  ArrowUp,
  ArrowDown,
  Truck,
  Route as RouteIcon
} from "lucide-react";
import * as QuotesInvoiceAPI from '../../api/QuotesInvoiceAPI';

// ============================================================================
// REUSABLE DROPDOWN COMPONENT
// ============================================================================
const DynamicDropdown = ({ 
  label, 
  name, 
  value, 
  onChange, 
  options = [], 
  placeholder = "Select...",
  required = false,
  error = null,
  disabled = false,
  className = ""
}) => {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-slate-700 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <select
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 ${
          error ? 'border-red-500 bg-red-50' : 'border-slate-300'
        } ${disabled ? 'bg-slate-100 cursor-not-allowed' : ''}`}
      >
        <option value="">{placeholder}</option>
        {options.map((opt, idx) => (
          <option key={idx} value={opt.value || opt}>
            {opt.label || opt}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};

// ============================================================================
// REUSABLE INPUT COMPONENT
// ============================================================================
const FormInput = ({ 
  label, 
  name, 
  value, 
  onChange, 
  type = "text",
  placeholder = "",
  required = false,
  error = null,
  disabled = false,
  className = ""
}) => {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-slate-700 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        placeholder={placeholder}
        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 ${
          error ? 'border-red-500 bg-red-50' : 'border-slate-300'
        } ${disabled ? 'bg-slate-100 cursor-not-allowed' : ''}`}
      />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export default function QuoteInvoiceForm({ onClose, type = 'quote', editDocument = null, onSuccess }) {
  const [step, setStep] = useState(1);
  
  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================
  
  // Core Quote Information
  const [quoteData, setQuoteData] = useState({
    quoteId: generateQuoteId(),
    customerId: '',
    customerName: '',
    pickupLocationId: '',
    deliveryLocationId: '',
    creditTermsId: '',
    createdDate: new Date().toISOString().split('T')[0],
    clientId: '',
    clientName: '',
    days: '',
    freightMode: '', // 'Air Import' | 'Air Export' | 'Sea Import FCL' | 'Sea Import LCL' | 'Sea Export FCL' | 'Sea Export LCL'
    freightCategory: '', // 'direct' | 'transit' | 'multimodal'
    createdBy: '' // Will be set from system user
  });

  // Route Configuration
  const [routeConfig, setRouteConfig] = useState({
    mode: '', // 'air' | 'sea'
    type: '', // 'import' | 'export'
    cargoType: '' // 'fcl' | 'lcl' | 'air'
  });

  // Direct Route Data
  const [directRoute, setDirectRoute] = useState({
    portOfLoading: {
      portId: '',
      carrier: '',
      incoterm: '',
      currency: 'USD',
      cargoType: ''
    },
    portOfDischarge: {
      portId: '',
      carrier: '',
      incoterm: '',
      currency: 'USD',
      cargoType: ''
    }
  });

  // Transit Route Data (for Transit mode)
  const [transitRoute, setTransitRoute] = useState({
    portOfLoading: {
      portId: '',
      carrier: '',
      incoterm: '',
      currency: 'USD',
      cargoType: ''
    },
    transitStops: [], // Array of transit points
    portOfDischarge: {
      portId: '',
      carrier: '',
      incoterm: '',
      currency: 'USD',
      cargoType: ''
    }
  });

  // Multimodal Segments
  const [multimodalSegments, setMultimodalSegments] = useState([]);

  // Route Plan Data (for Air/Sea table)
  const [routePlanData, setRoutePlanData] = useState({
    origin: {
      airportPortCode: '',
      carrier1: '',
      equipment: '',
      units: '',
      netWeight: '',
      grossWeight: '',
      cbm: '',
      chargeableWeight: '',
      totalPieces: ''
    },
    transitPoints: [], // Array of transit point data
    destination: {
      airportPortCode: '',
      carrier1: '',
      equipment: '',
      units: '',
      netWeight: '',
      grossWeight: '',
      cbm: '',
      chargeableWeight: '',
      totalPieces: ''
    }
  });

  // Freight Charges
  const [freightCharges, setFreightCharges] = useState([]);

  // Additional Charges
  const [additionalCharges, setAdditionalCharges] = useState([]);

  // Terms & Conditions
  const [termsConditions, setTermsConditions] = useState([
    'RATES ARE VALID TILL <> - SUBJECT TO SURCHARGE FLUCTUATIONS AS PER THE CARRIER',
    'RATES ARE SUBJECT TO INWARD LOCAL HANDLING CHARGES OF LKR.18000.00 + VAT (SVAT)',
    'RATES ARE QUOTED ON FOB/EXW BASIS',
    'RATES ARE NOT APPLICABLE FOR DANGEROUS GOODS OR PERISHABLE CARGO',
    'DUE TO THE CURRENT MARITIME CONSTRAINT\'S',
    'VESSEL ARE SUBJECT BLANK SAILINGS/OMITTING COLOMBO PORT, ROLL OVERS WITH OR WITHOUT PRIOR NOTICE',
    'RATES ARE SUBJECT TO CONTAINER DEPOSIT'
  ]);
  const [customTerms, setCustomTerms] = useState([]);

  // Dropdown Options (to be loaded from DB)
  const [dropdownOptions, setDropdownOptions] = useState({
    customers: [],
    clients: [],
    locations: [],
    creditTerms: [],
    ports: [],
    airports: [],
    carriers: [],
    incoterms: [],
    currencies: [],
    cargoTypes: [],
    equipment: [],
    chargeNames: []
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================
  
  // Generate Quote ID: Format YYYYMMDDHHmmss
  function generateQuoteId() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    return `${year}${month}${day}${hours}${minutes}${seconds}`;
  }

  // Fetch dropdown options from database
  const fetchDropdownOptions = async (tableName) => {
    try {
      // TODO: Replace with actual API calls
      // const response = await API.fetchOptions(tableName);
      // return response.data;
      
      // Placeholder return values
      switch(tableName) {
        case 'customers':
          return [
            { value: '1', label: 'Customer A' },
            { value: '2', label: 'Customer B' }
          ];
        case 'locations':
          return [
            { value: '1', label: 'Colombo' },
            { value: '2', label: 'Negombo' }
          ];
        case 'creditTerms':
          return [
            { value: '1', label: 'Net 30' },
            { value: '2', label: 'Net 60' }
          ];
        case 'carriers':
          return [
            'MSC', 'MAERSK', 'CMA CGM', 'HAPAG-LLOYD', 'ONE',
            'Emirates', 'Singapore Airlines', 'Qatar Airways'
          ];
        case 'incoterms':
          return ['EXW', 'FOB', 'CFR', 'CIF', 'DAP', 'DDP'];
        case 'currencies':
          return ['USD', 'LKR', 'EUR', 'GBP'];
        case 'cargoTypes':
          return ['General Cargo', 'Dangerous Goods', 'Perishable', 'Heavy Lift'];
        case 'equipment':
          return ['20GP', '40GP', '40HQ', '45HQ', 'Pallet', 'Loose'];
        case 'ports':
          return [
            { value: 'LKCMB', label: 'Colombo (LKCMB)' },
            { value: 'SGSIN', label: 'Singapore (SGSIN)' },
            { value: 'AEJEA', label: 'Dubai (AEJEA)' }
          ];
        case 'airports':
          return [
            { value: 'CMB', label: 'Colombo - CMB' },
            { value: 'DXB', label: 'Dubai - DXB' },
            { value: 'SIN', label: 'Singapore - SIN' }
          ];
        default:
          return [];
      }
    } catch (error) {
      console.error(`Error fetching ${tableName}:`, error);
      return [];
    }
  };

  // Load all dropdown options on mount
  useEffect(() => {
    const loadAllOptions = async () => {
      setLoading(true);
      try {
        const [
          customers,
          locations,
          creditTerms,
          carriers,
          incoterms,
          currencies,
          cargoTypes,
          equipment,
          ports,
          airports
        ] = await Promise.all([
          fetchDropdownOptions('customers'),
          fetchDropdownOptions('locations'),
          fetchDropdownOptions('creditTerms'),
          fetchDropdownOptions('carriers'),
          fetchDropdownOptions('incoterms'),
          fetchDropdownOptions('currencies'),
          fetchDropdownOptions('cargoTypes'),
          fetchDropdownOptions('equipment'),
          fetchDropdownOptions('ports'),
          fetchDropdownOptions('airports')
        ]);

        setDropdownOptions({
          customers,
          clients: customers, // Assuming clients are similar to customers
          locations,
          creditTerms,
          carriers,
          incoterms,
          currencies,
          cargoTypes,
          equipment,
          ports,
          airports,
          chargeNames: [
            'Freight Charges', 'Handling Fee', 'Air Line Security Fee', 'BL Fee',
            'Custom Clearance', 'SLPA Charges', 'Trico Charges', 'TIEP Cancellation Fee',
            'Rework Charges', 'Doc Fee', 'CFS charges', 'Loading/Unloading'
          ]
        });
      } catch (error) {
        console.error('Error loading dropdown options:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAllOptions();
  }, []);

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  const handleQuoteDataChange = (e) => {
    const { name, value } = e.target;
    setQuoteData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRouteConfigChange = (e) => {
    const { name, value } = e.target;
    setRouteConfig(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Direct Route Handlers
  const handleDirectRouteChange = (section, field, value) => {
    setDirectRoute(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  // Transit Route Handlers
  const handleTransitRouteChange = (section, field, value) => {
    if (section === 'transitStops') {
      // Handle transit stops array
      return;
    }
    
    setTransitRoute(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const addTransitStop = () => {
    setTransitRoute(prev => ({
      ...prev,
      transitStops: [
        ...prev.transitStops,
        {
          id: Date.now(),
          portId: '',
          carrier: '',
          incoterm: '',
          currency: 'USD',
          cargoType: ''
        }
      ]
    }));
  };

  const removeTransitStop = (id) => {
    setTransitRoute(prev => ({
      ...prev,
      transitStops: prev.transitStops.filter(stop => stop.id !== id)
    }));
  };

  const updateTransitStop = (id, field, value) => {
    setTransitRoute(prev => ({
      ...prev,
      transitStops: prev.transitStops.map(stop =>
        stop.id === id ? { ...stop, [field]: value } : stop
      )
    }));
  };

  const moveTransitStop = (id, direction) => {
    setTransitRoute(prev => {
      const stops = [...prev.transitStops];
      const index = stops.findIndex(stop => stop.id === id);
      
      if (direction === 'up' && index > 0) {
        [stops[index], stops[index - 1]] = [stops[index - 1], stops[index]];
      } else if (direction === 'down' && index < stops.length - 1) {
        [stops[index], stops[index + 1]] = [stops[index + 1], stops[index]];
      }
      
      return { ...prev, transitStops: stops };
    });
  };

  // Multimodal Segment Handlers
  const addMultimodalSegment = () => {
    setMultimodalSegments(prev => [
      ...prev,
      {
        id: Date.now(),
        selectedMode: '', // 'Air' | 'Sea' | 'Trucking' | 'Rail'
        origin: '',
        destination: '',
        chargeableWeight: '',
        weightBreaker: '',
        pricingUnit: '', // 'Per KG' | 'Per CBM' | 'Per Container' | 'Per Shipment'
        charge: '',
        currency: 'USD'
      }
    ]);
  };

  const removeMultimodalSegment = (id) => {
    setMultimodalSegments(prev => prev.filter(seg => seg.id !== id));
  };

  const updateMultimodalSegment = (id, field, value) => {
    setMultimodalSegments(prev =>
      prev.map(seg => (seg.id === id ? { ...seg, [field]: value } : seg))
    );
  };

  // Route Plan Data Handlers
  const handleRoutePlanChange = (section, field, value) => {
    if (section === 'transitPoints') {
      return; // Handle separately
    }
    
    setRoutePlanData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const addRoutePlanTransitPoint = () => {
    setRoutePlanData(prev => ({
      ...prev,
      transitPoints: [
        ...prev.transitPoints,
        {
          id: Date.now(),
          airportPortCode: '',
          carrier1: '',
          equipment: '',
          units: '',
          netWeight: '',
          grossWeight: '',
          cbm: '',
          chargeableWeight: '',
          totalPieces: ''
        }
      ]
    }));
  };

  const removeRoutePlanTransitPoint = (id) => {
    setRoutePlanData(prev => ({
      ...prev,
      transitPoints: prev.transitPoints.filter(pt => pt.id !== id)
    }));
  };

  const updateRoutePlanTransitPoint = (id, field, value) => {
    setRoutePlanData(prev => ({
      ...prev,
      transitPoints: prev.transitPoints.map(pt =>
        pt.id === id ? { ...pt, [field]: value } : pt
      )
    }));
  };

  // Freight Charges Handlers
  const addFreightCharge = () => {
    const columns = ['origin'];
    
    if (quoteData.freightCategory === 'transit') {
      transitRoute.transitStops.forEach((_, idx) => {
        columns.push(`transit${idx + 1}`);
      });
    }
    
    columns.push('destination');

    const newCharge = {
      id: Date.now(),
      chargeName: '',
      uom: ''
    };

    columns.forEach(col => {
      newCharge[col] = '';
    });

    setFreightCharges(prev => [...prev, newCharge]);
  };

  const removeFreightCharge = (id) => {
    setFreightCharges(prev => prev.filter(charge => charge.id !== id));
  };

  const updateFreightCharge = (id, field, value) => {
    setFreightCharges(prev =>
      prev.map(charge => (charge.id === id ? { ...charge, [field]: value } : charge))
    );
  };

  // Additional Charges Handlers
  const addAdditionalCharge = () => {
    setAdditionalCharges(prev => [
      ...prev,
      {
        id: Date.now(),
        name: '',
        description: '',
        quantity: 1,
        rate: 0,
        currency: 'USD',
        amount: 0
      }
    ]);
  };

  const removeAdditionalCharge = (id) => {
    setAdditionalCharges(prev => prev.filter(charge => charge.id !== id));
  };

  const updateAdditionalCharge = (id, field, value) => {
    setAdditionalCharges(prev =>
      prev.map(charge => {
        if (charge.id === id) {
          const updated = { ...charge, [field]: value };
          // Auto-calculate amount
          if (field === 'quantity' || field === 'rate') {
            updated.amount = (updated.quantity || 0) * (updated.rate || 0);
          }
          return updated;
        }
        return charge;
      })
    );
  };

  // Terms Handlers
  const addCustomTerm = () => {
    setCustomTerms(prev => [...prev, '']);
  };

  const updateCustomTerm = (index, value) => {
    setCustomTerms(prev =>
      prev.map((term, idx) => (idx === index ? value : term))
    );
  };

  const removeCustomTerm = (index) => {
    setCustomTerms(prev => prev.filter((_, idx) => idx !== index));
  };

  // ============================================================================
  // VALIDATION
  // ============================================================================

  const validateStep1 = () => {
    const newErrors = {};

    if (!quoteData.freightMode) {
      newErrors.freightMode = 'Please select a freight mode';
    }

    if (!quoteData.freightCategory) {
      newErrors.freightCategory = 'Please select a freight category';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors = {};

    if (!quoteData.customerId) newErrors.customerId = 'Customer is required';
    if (!quoteData.pickupLocationId) newErrors.pickupLocationId = 'Pickup location is required';
    if (!quoteData.deliveryLocationId) newErrors.deliveryLocationId = 'Delivery location is required';

    // Validate route configuration based on freight category
    if (quoteData.freightCategory === 'direct') {
      if (!directRoute.portOfLoading.portId) newErrors.loadingPort = 'Port of loading is required';
      if (!directRoute.portOfDischarge.portId) newErrors.dischargePort = 'Port of discharge is required';
    } else if (quoteData.freightCategory === 'transit') {
      if (!transitRoute.portOfLoading.portId) newErrors.loadingPort = 'Port of loading is required';
      if (!transitRoute.portOfDischarge.portId) newErrors.dischargePort = 'Port of discharge is required';
    } else if (quoteData.freightCategory === 'multimodal') {
      if (multimodalSegments.length === 0) {
        newErrors.multimodal = 'At least one segment is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ============================================================================
  // SUBMISSION
  // ============================================================================

  const handleSubmit = async () => {
    if (!validateStep2()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare data structure for backend
      const payload = {
        quoteId: quoteData.quoteId,
        customerId: quoteData.customerId,
        pickupLocationId: quoteData.pickupLocationId,
        deliveryLocationId: quoteData.deliveryLocationId,
        creditTermsId: quoteData.creditTermsId,
        createdDate: quoteData.createdDate,
        clientId: quoteData.clientId,
        days: parseInt(quoteData.days) || 0,
        freightMode: quoteData.freightMode, // 'Air Import', 'Air Export', 'Sea Import FCL', etc.
        freightCategory: quoteData.freightCategory, // 'direct', 'transit', 'multimodal'
        createdBy: quoteData.createdBy,
        
        // Route data based on freight category
        routeData: quoteData.freightCategory === 'direct' ? directRoute :
                   quoteData.freightCategory === 'transit' ? transitRoute :
                   { segments: multimodalSegments },
        
        // Route plan table data
        routePlanData: routePlanData,
        
        // Charges
        freightCharges: freightCharges,
        additionalCharges: additionalCharges,
        
        // Terms & Conditions
        termsConditions: [...termsConditions, ...customTerms.filter(t => t.trim())],
        
        // Metadata
        type: type // 'quote' or 'invoice'
      };

      console.log('Submitting quote data:', payload);

      // TODO: Replace with actual API call
      // const response = await QuotesInvoiceAPI.createQuote(payload);
      
      // Simulated success
      setTimeout(() => {
        alert('Quote created successfully!');
        if (onSuccess) onSuccess();
        onClose();
      }, 1000);

    } catch (error) {
      console.error('Error submitting quote:', error);
      alert('Failed to create quote. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ============================================================================
  // RENDER FUNCTIONS
  // ============================================================================

  // Step 1: Freight Mode & Category Selection
  const renderFreightCategorySelector = () => {
    const freightModes = [
      {
        id: 'Air Import',
        name: 'Air Import',
        icon: Plane,
        description: 'Air freight import services',
        color: 'from-sky-500 to-blue-600'
      },
      {
        id: 'Air Export',
        name: 'Air Export',
        icon: Plane,
        description: 'Air freight export services',
        color: 'from-blue-500 to-indigo-600'
      },
      {
        id: 'Sea Import FCL',
        name: 'Sea Import FCL',
        icon: Container,
        description: 'Full Container Load import',
        color: 'from-cyan-500 to-teal-600'
      },
      {
        id: 'Sea Import LCL',
        name: 'Sea Import LCL',
        icon: Package,
        description: 'Less than Container Load import',
        color: 'from-teal-500 to-emerald-600'
      },
      {
        id: 'Sea Export FCL',
        name: 'Sea Export FCL',
        icon: Container,
        description: 'Full Container Load export',
        color: 'from-indigo-500 to-purple-600'
      },
      {
        id: 'Sea Export LCL',
        name: 'Sea Export LCL',
        icon: Package,
        description: 'Less than Container Load export',
        color: 'from-purple-500 to-pink-600'
      }
    ];

    const freightCategories = [
      {
        id: 'direct',
        name: 'Direct',
        icon: RouteIcon,
        description: 'Direct route from origin to destination',
        color: 'from-blue-500 to-blue-600'
      },
      {
        id: 'transit',
        name: 'Transit',
        icon: Ship,
        description: 'Route with multiple transit points',
        color: 'from-purple-500 to-purple-600'
      },
      {
        id: 'multimodal',
        name: 'Multimodal',
        icon: Truck,
        description: 'Multiple modes of transportation',
        color: 'from-emerald-500 to-emerald-600'
      }
    ];

    return (
      <div className="space-y-8">
        {/* Freight Mode Selection */}
        <div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Step 1: Select Freight Mode</h2>
          <p className="text-slate-600">Choose the freight mode for this quote</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {freightModes.map((mode) => {
            const Icon = mode.icon;
            const isSelected = quoteData.freightMode === mode.id;
            
            return (
              <button
                key={mode.id}
                onClick={() => {
                  setQuoteData(prev => ({ 
                    ...prev, 
                    freightMode: mode.id,
                    freightCategory: '' // Reset category when mode changes
                  }));
                  setErrors({});
                }}
                className={`p-6 rounded-xl border-2 transition-all transform hover:scale-105 ${
                  isSelected
                    ? 'border-teal-500 bg-teal-50 shadow-lg'
                    : 'border-slate-200 bg-white hover:border-teal-300'
                }`}
              >
                <div className={`w-16 h-16 rounded-lg bg-gradient-to-br ${mode.color} flex items-center justify-center mx-auto mb-4`}>
                  <Icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">{mode.name}</h3>
                <p className="text-sm text-slate-600">{mode.description}</p>
                {isSelected && (
                  <div className="mt-4 flex items-center justify-center text-teal-600">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {errors.freightMode && (
          <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <p className="text-sm text-red-700">{errors.freightMode}</p>
          </div>
        )}

        {/* Freight Category Selection - Only show if mode is selected */}
        {quoteData.freightMode && (
          <>
            <div className="pt-6 border-t border-slate-200">
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Step 2: Select Freight Category</h2>
              <p className="text-slate-600">Choose the routing type for your shipment</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {freightCategories.map((category) => {
                const Icon = category.icon;
                const isSelected = quoteData.freightCategory === category.id;
                
                return (
                  <button
                    key={category.id}
                    onClick={() => {
                      setQuoteData(prev => ({ ...prev, freightCategory: category.id }));
                      setErrors({});
                    }}
                    className={`p-6 rounded-xl border-2 transition-all transform hover:scale-105 ${
                      isSelected
                        ? 'border-teal-500 bg-teal-50 shadow-lg'
                        : 'border-slate-200 bg-white hover:border-teal-300'
                    }`}
                  >
                    <div className={`w-16 h-16 rounded-lg bg-gradient-to-br ${category.color} flex items-center justify-center mx-auto mb-4`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-800 mb-2">{category.name}</h3>
                    <p className="text-sm text-slate-600">{category.description}</p>
                    {isSelected && (
                      <div className="mt-4 flex items-center justify-center text-teal-600">
                        <CheckCircle className="w-5 h-5" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {errors.freightCategory && (
              <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <p className="text-sm text-red-700">{errors.freightCategory}</p>
              </div>
            )}
          </>
        )}

        <div className="flex justify-end pt-4">
          <button
            onClick={() => {
              if (validateStep1()) {
                setStep(2);
              }
            }}
            className="px-8 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-all font-medium flex items-center gap-2"
          >
            Continue
            <ChevronDown className="w-5 h-5 rotate-[-90deg]" />
          </button>
        </div>
      </div>
    );
  };

  // Step 2: Quote Details & Route Configuration
  const renderQuoteDetailsForm = () => {
    return (
      <div className="space-y-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Quote Details</h2>
          <p className="text-slate-600">Enter quote information and route configuration</p>
        </div>

        {/* Common Fields */}
        <div className="bg-white rounded-lg border border-slate-200 p-6 space-y-6">
          <h3 className="text-lg font-semibold text-slate-800 border-b border-slate-200 pb-3">
            Basic Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FormInput
              label="Quote ID"
              name="quoteId"
              value={quoteData.quoteId}
              onChange={handleQuoteDataChange}
              disabled={true}
              className="md:col-span-1"
            />

            <DynamicDropdown
              label="Select Customer"
              name="customerId"
              value={quoteData.customerId}
              onChange={handleQuoteDataChange}
              options={dropdownOptions.customers}
              placeholder="Choose customer"
              required={true}
              error={errors.customerId}
              className="md:col-span-1"
            />

            <DynamicDropdown
              label="Pickup Location"
              name="pickupLocationId"
              value={quoteData.pickupLocationId}
              onChange={handleQuoteDataChange}
              options={dropdownOptions.locations}
              placeholder="Choose pickup location"
              required={true}
              error={errors.pickupLocationId}
              className="md:col-span-1"
            />

            <DynamicDropdown
              label="Delivery Location"
              name="deliveryLocationId"
              value={quoteData.deliveryLocationId}
              onChange={handleQuoteDataChange}
              options={dropdownOptions.locations}
              placeholder="Choose delivery location"
              required={true}
              error={errors.deliveryLocationId}
              className="md:col-span-1"
            />

            <DynamicDropdown
              label="Credit Terms"
              name="creditTermsId"
              value={quoteData.creditTermsId}
              onChange={handleQuoteDataChange}
              options={dropdownOptions.creditTerms}
              placeholder="Choose credit terms"
              className="md:col-span-1"
            />

            <FormInput
              label="Created Date"
              name="createdDate"
              value={quoteData.createdDate}
              onChange={handleQuoteDataChange}
              type="date"
              disabled={true}
              className="md:col-span-1"
            />

            <FormInput
              label="Select Client (Auto-suggestion)"
              name="clientName"
              value={quoteData.clientName}
              onChange={handleQuoteDataChange}
              placeholder="Search client name"
              className="md:col-span-1"
            />

            <FormInput
              label="Days"
              name="days"
              value={quoteData.days}
              onChange={handleQuoteDataChange}
              type="number"
              placeholder="Number of days"
              className="md:col-span-1"
            />

            <div className="md:col-span-1 flex items-center">
              <div className="px-4 py-2 bg-teal-50 border border-teal-200 rounded-lg">
                <p className="text-sm font-medium text-teal-800">
                  Freight Category: <span className="capitalize font-bold">{quoteData.freightCategory}</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Route Configuration based on Freight Category */}
        {quoteData.freightCategory === 'direct' && renderDirectRouteConfig()}
        {quoteData.freightCategory === 'transit' && renderTransitRouteConfig()}
        {quoteData.freightCategory === 'multimodal' && renderMultimodalConfig()}

        {/* Route Plan Table */}
        {(quoteData.freightCategory === 'direct' || quoteData.freightCategory === 'transit') && 
          renderRoutePlanTable()}

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-4">
          <button
            onClick={() => setStep(1)}
            className="px-6 py-3 text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-all"
          >
            Back
          </button>
          <button
            onClick={() => {
              if (validateStep2()) {
                setStep(3);
              }
            }}
            className="px-8 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-all font-medium flex items-center gap-2"
          >
            Continue to Charges
            <ChevronDown className="w-5 h-5 rotate-[-90deg]" />
          </button>
        </div>
      </div>
    );
  };

  // Direct Route Configuration
  const renderDirectRouteConfig = () => {
    const portOptions = routeConfig.mode === 'air' ? dropdownOptions.airports : dropdownOptions.ports;

    return (
      <div className="bg-white rounded-lg border border-slate-200 p-6 space-y-6">
        <h3 className="text-lg font-semibold text-slate-800 border-b border-slate-200 pb-3">
          Direct Route Configuration
        </h3>

        {/* Port of Loading */}
        <div className="space-y-4">
          <h4 className="font-medium text-slate-700 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-teal-600" />
            Port of Loading
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 pl-6">
            <DynamicDropdown
              label="Port/Airport"
              name="portId"
              value={directRoute.portOfLoading.portId}
              onChange={(e) => handleDirectRouteChange('portOfLoading', 'portId', e.target.value)}
              options={portOptions}
              placeholder="Select port"
              required={true}
              error={errors.loadingPort}
            />
            <DynamicDropdown
              label="Carrier"
              name="carrier"
              value={directRoute.portOfLoading.carrier}
              onChange={(e) => handleDirectRouteChange('portOfLoading', 'carrier', e.target.value)}
              options={dropdownOptions.carriers}
              placeholder="Select carrier"
            />
            <DynamicDropdown
              label="Incoterm"
              name="incoterm"
              value={directRoute.portOfLoading.incoterm}
              onChange={(e) => handleDirectRouteChange('portOfLoading', 'incoterm', e.target.value)}
              options={dropdownOptions.incoterms}
              placeholder="Select incoterm"
            />
            <DynamicDropdown
              label="Currency"
              name="currency"
              value={directRoute.portOfLoading.currency}
              onChange={(e) => handleDirectRouteChange('portOfLoading', 'currency', e.target.value)}
              options={dropdownOptions.currencies}
            />
            <DynamicDropdown
              label="Cargo Type"
              name="cargoType"
              value={directRoute.portOfLoading.cargoType}
              onChange={(e) => handleDirectRouteChange('portOfLoading', 'cargoType', e.target.value)}
              options={dropdownOptions.cargoTypes}
              placeholder="Select cargo type"
            />
          </div>
        </div>

        {/* Port of Discharge */}
        <div className="space-y-4">
          <h4 className="font-medium text-slate-700 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-orange-600" />
            Port of Discharge
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 pl-6">
            <DynamicDropdown
              label="Port/Airport"
              name="portId"
              value={directRoute.portOfDischarge.portId}
              onChange={(e) => handleDirectRouteChange('portOfDischarge', 'portId', e.target.value)}
              options={portOptions}
              placeholder="Select port"
              required={true}
              error={errors.dischargePort}
            />
            <DynamicDropdown
              label="Carrier"
              name="carrier"
              value={directRoute.portOfDischarge.carrier}
              onChange={(e) => handleDirectRouteChange('portOfDischarge', 'carrier', e.target.value)}
              options={dropdownOptions.carriers}
              placeholder="Select carrier"
            />
            <DynamicDropdown
              label="Incoterm"
              name="incoterm"
              value={directRoute.portOfDischarge.incoterm}
              onChange={(e) => handleDirectRouteChange('portOfDischarge', 'incoterm', e.target.value)}
              options={dropdownOptions.incoterms}
              placeholder="Select incoterm"
            />
            <DynamicDropdown
              label="Currency"
              name="currency"
              value={directRoute.portOfDischarge.currency}
              onChange={(e) => handleDirectRouteChange('portOfDischarge', 'currency', e.target.value)}
              options={dropdownOptions.currencies}
            />
            <DynamicDropdown
              label="Cargo Type"
              name="cargoType"
              value={directRoute.portOfDischarge.cargoType}
              onChange={(e) => handleDirectRouteChange('portOfDischarge', 'cargoType', e.target.value)}
              options={dropdownOptions.cargoTypes}
              placeholder="Select cargo type"
            />
          </div>
        </div>
      </div>
    );
  };

  // Transit Route Configuration
  const renderTransitRouteConfig = () => {
    const portOptions = routeConfig.mode === 'air' ? dropdownOptions.airports : dropdownOptions.ports;

    return (
      <div className="bg-white rounded-lg border border-slate-200 p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <h3 className="text-lg font-semibold text-slate-800">
            Transit Route Configuration
          </h3>
          <button
            onClick={addTransitStop}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-all text-sm font-medium flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Transit Stop
          </button>
        </div>

        {/* Port of Loading */}
        <div className="space-y-4">
          <h4 className="font-medium text-slate-700 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-teal-600" />
            Port of Loading
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 pl-6">
            <DynamicDropdown
              label="Port/Airport"
              name="portId"
              value={transitRoute.portOfLoading.portId}
              onChange={(e) => handleTransitRouteChange('portOfLoading', 'portId', e.target.value)}
              options={portOptions}
              placeholder="Select port"
              required={true}
              error={errors.loadingPort}
            />
            <DynamicDropdown
              label="Carrier"
              name="carrier"
              value={transitRoute.portOfLoading.carrier}
              onChange={(e) => handleTransitRouteChange('portOfLoading', 'carrier', e.target.value)}
              options={dropdownOptions.carriers}
              placeholder="Select carrier"
            />
            <DynamicDropdown
              label="Incoterm"
              name="incoterm"
              value={transitRoute.portOfLoading.incoterm}
              onChange={(e) => handleTransitRouteChange('portOfLoading', 'incoterm', e.target.value)}
              options={dropdownOptions.incoterms}
              placeholder="Select incoterm"
            />
            <DynamicDropdown
              label="Currency"
              name="currency"
              value={transitRoute.portOfLoading.currency}
              onChange={(e) => handleTransitRouteChange('portOfLoading', 'currency', e.target.value)}
              options={dropdownOptions.currencies}
            />
            <DynamicDropdown
              label="Cargo Type"
              name="cargoType"
              value={transitRoute.portOfLoading.cargoType}
              onChange={(e) => handleTransitRouteChange('portOfLoading', 'cargoType', e.target.value)}
              options={dropdownOptions.cargoTypes}
              placeholder="Select cargo type"
            />
          </div>
        </div>

        {/* Transit Stops */}
        {transitRoute.transitStops.map((stop, index) => (
          <div key={stop.id} className="space-y-4 bg-slate-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-slate-700 flex items-center gap-2">
                <Ship className="w-4 h-4 text-purple-600" />
                Transit {index + 1}
              </h4>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => moveTransitStop(stop.id, 'up')}
                  disabled={index === 0}
                  className="p-1 text-slate-600 hover:bg-slate-200 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Move up"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
                <button
                  onClick={() => moveTransitStop(stop.id, 'down')}
                  disabled={index === transitRoute.transitStops.length - 1}
                  className="p-1 text-slate-600 hover:bg-slate-200 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Move down"
                >
                  <ArrowDown className="w-4 h-4" />
                </button>
                <button
                  onClick={() => removeTransitStop(stop.id)}
                  className="p-1 text-red-600 hover:bg-red-50 rounded"
                  title="Remove"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 pl-6">
              <DynamicDropdown
                label="Port/Airport"
                name="portId"
                value={stop.portId}
                onChange={(e) => updateTransitStop(stop.id, 'portId', e.target.value)}
                options={portOptions}
                placeholder="Select port"
              />
              <DynamicDropdown
                label="Carrier"
                name="carrier"
                value={stop.carrier}
                onChange={(e) => updateTransitStop(stop.id, 'carrier', e.target.value)}
                options={dropdownOptions.carriers}
                placeholder="Select carrier"
              />
              <DynamicDropdown
                label="Incoterm"
                name="incoterm"
                value={stop.incoterm}
                onChange={(e) => updateTransitStop(stop.id, 'incoterm', e.target.value)}
                options={dropdownOptions.incoterms}
                placeholder="Select incoterm"
              />
              <DynamicDropdown
                label="Currency"
                name="currency"
                value={stop.currency}
                onChange={(e) => updateTransitStop(stop.id, 'currency', e.target.value)}
                options={dropdownOptions.currencies}
              />
              <DynamicDropdown
                label="Cargo Type"
                name="cargoType"
                value={stop.cargoType}
                onChange={(e) => updateTransitStop(stop.id, 'cargoType', e.target.value)}
                options={dropdownOptions.cargoTypes}
                placeholder="Select cargo type"
              />
            </div>
          </div>
        ))}

        {/* Port of Discharge */}
        <div className="space-y-4">
          <h4 className="font-medium text-slate-700 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-orange-600" />
            Port of Discharge
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 pl-6">
            <DynamicDropdown
              label="Port/Airport"
              name="portId"
              value={transitRoute.portOfDischarge.portId}
              onChange={(e) => handleTransitRouteChange('portOfDischarge', 'portId', e.target.value)}
              options={portOptions}
              placeholder="Select port"
              required={true}
              error={errors.dischargePort}
            />
            <DynamicDropdown
              label="Carrier"
              name="carrier"
              value={transitRoute.portOfDischarge.carrier}
              onChange={(e) => handleTransitRouteChange('portOfDischarge', 'carrier', e.target.value)}
              options={dropdownOptions.carriers}
              placeholder="Select carrier"
            />
            <DynamicDropdown
              label="Incoterm"
              name="incoterm"
              value={transitRoute.portOfDischarge.incoterm}
              onChange={(e) => handleTransitRouteChange('portOfDischarge', 'incoterm', e.target.value)}
              options={dropdownOptions.incoterms}
              placeholder="Select incoterm"
            />
            <DynamicDropdown
              label="Currency"
              name="currency"
              value={transitRoute.portOfDischarge.currency}
              onChange={(e) => handleTransitRouteChange('portOfDischarge', 'currency', e.target.value)}
              options={dropdownOptions.currencies}
            />
            <DynamicDropdown
              label="Cargo Type"
              name="cargoType"
              value={transitRoute.portOfDischarge.cargoType}
              onChange={(e) => handleTransitRouteChange('portOfDischarge', 'cargoType', e.target.value)}
              options={dropdownOptions.cargoTypes}
              placeholder="Select cargo type"
            />
          </div>
        </div>
      </div>
    );
  };

  // Multimodal Configuration
  const renderMultimodalConfig = () => {
    const modeOptions = ['Air', 'Sea', 'Trucking', 'Rail'];
    const pricingUnits = ['Per KG', 'Per CBM', 'Per Container', 'Per Shipment'];

    return (
      <div className="bg-white rounded-lg border border-slate-200 p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <h3 className="text-lg font-semibold text-slate-800">
            Multimodal Configuration
          </h3>
          <button
            onClick={addMultimodalSegment}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all text-sm font-medium flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Segment
          </button>
        </div>

        {multimodalSegments.length === 0 && (
          <div className="text-center py-8 text-slate-500">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No segments added yet. Click "Add Segment" to begin.</p>
          </div>
        )}

        <div className="space-y-4">
          {multimodalSegments.map((segment, index) => (
            <div key={segment.id} className="bg-slate-50 rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-slate-700">Segment {index + 1}</h4>
                <button
                  onClick={() => removeMultimodalSegment(segment.id)}
                  className="p-1 text-red-600 hover:bg-red-50 rounded"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <DynamicDropdown
                  label="Selected Mode"
                  name="selectedMode"
                  value={segment.selectedMode}
                  onChange={(e) => updateMultimodalSegment(segment.id, 'selectedMode', e.target.value)}
                  options={modeOptions}
                  placeholder="Select mode"
                />

                <DynamicDropdown
                  label="Origin"
                  name="origin"
                  value={segment.origin}
                  onChange={(e) => updateMultimodalSegment(segment.id, 'origin', e.target.value)}
                  options={segment.selectedMode === 'Air' ? dropdownOptions.airports : dropdownOptions.ports}
                  placeholder="Select origin"
                />

                <DynamicDropdown
                  label="Destination"
                  name="destination"
                  value={segment.destination}
                  onChange={(e) => updateMultimodalSegment(segment.id, 'destination', e.target.value)}
                  options={segment.selectedMode === 'Air' ? dropdownOptions.airports : dropdownOptions.ports}
                  placeholder="Select destination"
                />

                <FormInput
                  label="Chargeable Weight"
                  name="chargeableWeight"
                  value={segment.chargeableWeight}
                  onChange={(e) => updateMultimodalSegment(segment.id, 'chargeableWeight', e.target.value)}
                  type="number"
                  placeholder="0.00"
                />

                <FormInput
                  label="Weight Breaker"
                  name="weightBreaker"
                  value={segment.weightBreaker}
                  onChange={(e) => updateMultimodalSegment(segment.id, 'weightBreaker', e.target.value)}
                  placeholder="Weight breaker"
                />

                <DynamicDropdown
                  label="Pricing Unit"
                  name="pricingUnit"
                  value={segment.pricingUnit}
                  onChange={(e) => updateMultimodalSegment(segment.id, 'pricingUnit', e.target.value)}
                  options={pricingUnits}
                  placeholder="Select unit"
                />

                <FormInput
                  label="Charge"
                  name="charge"
                  value={segment.charge}
                  onChange={(e) => updateMultimodalSegment(segment.id, 'charge', e.target.value)}
                  type="number"
                  placeholder="0.00"
                />

                <DynamicDropdown
                  label="Currency"
                  name="currency"
                  value={segment.currency}
                  onChange={(e) => updateMultimodalSegment(segment.id, 'currency', e.target.value)}
                  options={dropdownOptions.currencies}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Multimodal Charges Summary */}
        {multimodalSegments.length > 0 && (
          <div className="overflow-x-auto">
            <h4 className="font-semibold text-slate-700 mb-3">Charges Summary</h4>
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-100">
                  <th className="border border-slate-300 px-4 py-2 text-left text-sm font-semibold text-slate-700">Mode</th>
                  <th className="border border-slate-300 px-4 py-2 text-left text-sm font-semibold text-slate-700">Origin</th>
                  <th className="border border-slate-300 px-4 py-2 text-left text-sm font-semibold text-slate-700">Destination</th>
                  <th className="border border-slate-300 px-4 py-2 text-left text-sm font-semibold text-slate-700">Chg. Weight</th>
                  <th className="border border-slate-300 px-4 py-2 text-left text-sm font-semibold text-slate-700">Weight Breaker</th>
                  <th className="border border-slate-300 px-4 py-2 text-left text-sm font-semibold text-slate-700">Pricing Unit</th>
                  <th className="border border-slate-300 px-4 py-2 text-right text-sm font-semibold text-slate-700">Charge</th>
                  <th className="border border-slate-300 px-4 py-2 text-left text-sm font-semibold text-slate-700">Currency</th>
                </tr>
              </thead>
              <tbody>
                {multimodalSegments.map((segment) => (
                  <tr key={segment.id} className="hover:bg-slate-50">
                    <td className="border border-slate-300 px-4 py-2 text-sm text-slate-700">{segment.selectedMode}</td>
                    <td className="border border-slate-300 px-4 py-2 text-sm text-slate-700">{segment.origin}</td>
                    <td className="border border-slate-300 px-4 py-2 text-sm text-slate-700">{segment.destination}</td>
                    <td className="border border-slate-300 px-4 py-2 text-sm text-slate-700">{segment.chargeableWeight}</td>
                    <td className="border border-slate-300 px-4 py-2 text-sm text-slate-700">{segment.weightBreaker}</td>
                    <td className="border border-slate-300 px-4 py-2 text-sm text-slate-700">{segment.pricingUnit}</td>
                    <td className="border border-slate-300 px-4 py-2 text-sm text-slate-700 text-right">{parseFloat(segment.charge || 0).toFixed(2)}</td>
                    <td className="border border-slate-300 px-4 py-2 text-sm text-slate-700">{segment.currency}</td>
                  </tr>
                ))}
                <tr className="bg-slate-100 font-semibold">
                  <td colSpan="6" className="border border-slate-300 px-4 py-2 text-sm text-slate-700 text-right">TOTAL:</td>
                  <td className="border border-slate-300 px-4 py-2 text-sm text-slate-700 text-right">
                    {multimodalSegments.reduce((sum, seg) => sum + parseFloat(seg.charge || 0), 0).toFixed(2)}
                  </td>
                  <td className="border border-slate-300 px-4 py-2 text-sm text-slate-700">USD</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {errors.multimodal && (
          <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <p className="text-sm text-red-700">{errors.multimodal}</p>
          </div>
        )}
      </div>
    );
  };

  // Route Plan Table (Air/Sea) - Continued in Part 2 due to length
  const renderRoutePlanTable = () => {
    const isAir = routeConfig.mode === 'air';
    const title = isAir ? 'Air Route Plan' : 'Sea Route Plan';
    const codeLabel = isAir ? 'Airport Code' : 'Port Code';

    const columns = ['origin'];
    routePlanData.transitPoints.forEach((_, idx) => {
      columns.push(`transit${idx + 1}`);
    });
    columns.push('destination');

    return (
      <div className="bg-white rounded-lg border border-slate-200 p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
          {quoteData.freightCategory === 'transit' && (
            <button
              onClick={addRoutePlanTransitPoint}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all text-sm font-medium flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Transit Column
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-slate-100">
                <th className="border border-slate-300 px-4 py-2 text-left text-sm font-semibold text-slate-700 w-40">
                  Field
                </th>
                <th className="border border-slate-300 px-4 py-2 text-center text-sm font-semibold text-slate-700">
                  Origin
                </th>
                {routePlanData.transitPoints.map((_, idx) => (
                  <th key={idx} className="border border-slate-300 px-4 py-2 text-center text-sm font-semibold text-slate-700">
                    Transit {idx + 1}
                    <button
                      onClick={() => removeRoutePlanTransitPoint(routePlanData.transitPoints[idx].id)}
                      className="ml-2 p-1 text-red-600 hover:bg-red-50 rounded inline-flex"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </th>
                ))}
                <th className="border border-slate-300 px-4 py-2 text-center text-sm font-semibold text-slate-700">
                  Destination
                </th>
              </tr>
            </thead>
            <tbody>
              {/* Airport/Port Codes */}
              <tr>
                <td className="border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 bg-slate-50">
                  {codeLabel}
                </td>
                <td className="border border-slate-300 px-2 py-2">
                  <DynamicDropdown
                    label=""
                    name="airportPortCode"
                    value={routePlanData.origin.airportPortCode}
                    onChange={(e) => handleRoutePlanChange('origin', 'airportPortCode', e.target.value)}
                    options={isAir ? dropdownOptions.airports : dropdownOptions.ports}
                    placeholder="Select"
                    className="w-full"
                  />
                </td>
                {routePlanData.transitPoints.map((pt) => (
                  <td key={pt.id} className="border border-slate-300 px-2 py-2">
                    <DynamicDropdown
                      label=""
                      name="airportPortCode"
                      value={pt.airportPortCode}
                      onChange={(e) => updateRoutePlanTransitPoint(pt.id, 'airportPortCode', e.target.value)}
                      options={isAir ? dropdownOptions.airports : dropdownOptions.ports}
                      placeholder="Select"
                      className="w-full"
                    />
                  </td>
                ))}
                <td className="border border-slate-300 px-2 py-2">
                  <DynamicDropdown
                    label=""
                    name="airportPortCode"
                    value={routePlanData.destination.airportPortCode}
                    onChange={(e) => handleRoutePlanChange('destination', 'airportPortCode', e.target.value)}
                    options={isAir ? dropdownOptions.airports : dropdownOptions.ports}
                    placeholder="Select"
                    className="w-full"
                  />
                </td>
              </tr>

              {/* Carrier Option 1 */}
              <tr>
                <td className="border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 bg-slate-50">
                  Carrier Option 1
                </td>
                <td className="border border-slate-300 px-2 py-2">
                  <DynamicDropdown
                    label=""
                    name="carrier1"
                    value={routePlanData.origin.carrier1}
                    onChange={(e) => handleRoutePlanChange('origin', 'carrier1', e.target.value)}
                    options={dropdownOptions.carriers}
                    placeholder="Select"
                    className="w-full"
                  />
                </td>
                {routePlanData.transitPoints.map((pt) => (
                  <td key={pt.id} className="border border-slate-300 px-2 py-2">
                    <DynamicDropdown
                      label=""
                      name="carrier1"
                      value={pt.carrier1}
                      onChange={(e) => updateRoutePlanTransitPoint(pt.id, 'carrier1', e.target.value)}
                      options={dropdownOptions.carriers}
                      placeholder="Select"
                      className="w-full"
                    />
                  </td>
                ))}
                <td className="border border-slate-300 px-2 py-2">
                  <DynamicDropdown
                    label=""
                    name="carrier1"
                    value={routePlanData.destination.carrier1}
                    onChange={(e) => handleRoutePlanChange('destination', 'carrier1', e.target.value)}
                    options={dropdownOptions.carriers}
                    placeholder="Select"
                    className="w-full"
                  />
                </td>
              </tr>

              {/* Equipment */}
              <tr>
                <td className="border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 bg-slate-50">
                  Equipment
                </td>
                <td className="border border-slate-300 px-2 py-2">
                  <DynamicDropdown
                    label=""
                    name="equipment"
                    value={routePlanData.origin.equipment}
                    onChange={(e) => handleRoutePlanChange('origin', 'equipment', e.target.value)}
                    options={dropdownOptions.equipment}
                    placeholder="Select"
                    className="w-full"
                  />
                </td>
                {routePlanData.transitPoints.map((pt) => (
                  <td key={pt.id} className="border border-slate-300 px-2 py-2">
                    <DynamicDropdown
                      label=""
                      name="equipment"
                      value={pt.equipment}
                      onChange={(e) => updateRoutePlanTransitPoint(pt.id, 'equipment', e.target.value)}
                      options={dropdownOptions.equipment}
                      placeholder="Select"
                      className="w-full"
                    />
                  </td>
                ))}
                <td className="border border-slate-300 px-2 py-2">
                  <DynamicDropdown
                    label=""
                    name="equipment"
                    value={routePlanData.destination.equipment}
                    onChange={(e) => handleRoutePlanChange('destination', 'equipment', e.target.value)}
                    options={dropdownOptions.equipment}
                    placeholder="Select"
                    className="w-full"
                  />
                </td>
              </tr>

              {/* Units, Weights, CBM, etc. */}
              {[
                { key: 'units', label: 'Units' },
                { key: 'netWeight', label: 'Net Weight' },
                { key: 'grossWeight', label: 'Gross Weight' },
                { key: 'cbm', label: 'CBM' },
                { key: 'chargeableWeight', label: 'Chargeable Weight' },
                { key: 'totalPieces', label: 'Total Pieces' }
              ].map((field) => (
                <tr key={field.key}>
                  <td className="border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 bg-slate-50">
                    {field.label}
                  </td>
                  <td className="border border-slate-300 px-2 py-2">
                    <FormInput
                      label=""
                      name={field.key}
                      value={routePlanData.origin[field.key]}
                      onChange={(e) => handleRoutePlanChange('origin', field.key, e.target.value)}
                      type="number"
                      placeholder="0.00"
                      className="w-full"
                    />
                  </td>
                  {routePlanData.transitPoints.map((pt) => (
                    <td key={pt.id} className="border border-slate-300 px-2 py-2">
                      <FormInput
                        label=""
                        name={field.key}
                        value={pt[field.key]}
                        onChange={(e) => updateRoutePlanTransitPoint(pt.id, field.key, e.target.value)}
                        type="number"
                        placeholder="0.00"
                        className="w-full"
                      />
                    </td>
                  ))}
                  <td className="border border-slate-300 px-2 py-2">
                    <FormInput
                      label=""
                      name={field.key}
                      value={routePlanData.destination[field.key]}
                      onChange={(e) => handleRoutePlanChange('destination', field.key, e.target.value)}
                      type="number"
                      placeholder="0.00"
                      className="w-full"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Step 3: Charges & Terms
  const renderChargesAndTerms = () => {
    return (
      <div className="space-y-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Charges & Terms</h2>
          <p className="text-slate-600">Add freight charges, additional charges, and terms & conditions</p>
        </div>

        {/* Freight Charges Table */}
        {quoteData.freightCategory !== 'multimodal' && renderFreightChargesTable()}

        {/* Additional Charges */}
        {renderAdditionalCharges()}

        {/* Terms & Conditions */}
        {renderTermsAndConditions()}

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-4 border-t border-slate-200">
          <button
            onClick={() => setStep(2)}
            className="px-6 py-3 text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-all"
          >
            Back
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-8 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:bg-teal-400 transition-all font-medium flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Create Quote
              </>
            )}
          </button>
        </div>

        <div className="text-center text-sm text-slate-500 pt-4 border-t border-slate-200">
          <p className="italic">This is an automated created quote hence does not require a signature.</p>
          <p className="mt-2">Created By: <span className="font-medium text-slate-700">{quoteData.createdBy || 'System User'}</span></p>
        </div>
      </div>
    );
  };

  // Freight Charges Table
  const renderFreightChargesTable = () => {
    const columns = ['origin'];
    
    if (quoteData.freightCategory === 'transit') {
      transitRoute.transitStops.forEach((_, idx) => {
        columns.push(`transit${idx + 1}`);
      });
    }
    
    columns.push('destination');

    return (
      <div className="bg-white rounded-lg border border-slate-200 p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <h3 className="text-lg font-semibold text-slate-800">Freight Charges</h3>
          <button
            onClick={addFreightCharge}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-all text-sm font-medium flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Charge
          </button>
        </div>

        {freightCharges.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No charges added yet. Click "Add Charge" to begin.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-slate-100">
                  <th className="border border-slate-300 px-4 py-2 text-left text-sm font-semibold text-slate-700">
                    Charge Name
                  </th>
                  <th className="border border-slate-300 px-4 py-2 text-left text-sm font-semibold text-slate-700">
                    UOM
                  </th>
                  {columns.map((col, idx) => (
                    <th key={idx} className="border border-slate-300 px-4 py-2 text-center text-sm font-semibold text-slate-700 capitalize">
                      {col.replace(/(\d+)/, ' $1')}
                    </th>
                  ))}
                  <th className="border border-slate-300 px-4 py-2 text-center text-sm font-semibold text-slate-700 w-16">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {freightCharges.map((charge) => (
                  <tr key={charge.id} className="hover:bg-slate-50">
                    <td className="border border-slate-300 px-2 py-2">
                      <DynamicDropdown
                        label=""
                        name="chargeName"
                        value={charge.chargeName}
                        onChange={(e) => updateFreightCharge(charge.id, 'chargeName', e.target.value)}
                        options={dropdownOptions.chargeNames}
                        placeholder="Select"
                        className="w-full"
                      />
                    </td>
                    <td className="border border-slate-300 px-2 py-2">
                      <FormInput
                        label=""
                        name="uom"
                        value={charge.uom}
                        onChange={(e) => updateFreightCharge(charge.id, 'uom', e.target.value)}
                        placeholder="e.g., per KG"
                        className="w-full"
                      />
                    </td>
                    {columns.map((col, idx) => (
                      <td key={idx} className="border border-slate-300 px-2 py-2">
                        <FormInput
                          label=""
                          name={col}
                          value={charge[col] || ''}
                          onChange={(e) => updateFreightCharge(charge.id, col, e.target.value)}
                          type="number"
                          placeholder="0.00"
                          className="w-full"
                        />
                      </td>
                    ))}
                    <td className="border border-slate-300 px-2 py-2 text-center">
                      <button
                        onClick={() => removeFreightCharge(charge.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  // Additional Charges
  const renderAdditionalCharges = () => {
    const totalAmount = additionalCharges.reduce((sum, charge) => sum + parseFloat(charge.amount || 0), 0);

    return (
      <div className="bg-white rounded-lg border border-slate-200 p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <h3 className="text-lg font-semibold text-slate-800">Additional Charges</h3>
          <button
            onClick={addAdditionalCharge}
            className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-all text-sm font-medium flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Charge
          </button>
        </div>

        {additionalCharges.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <Plus className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No additional charges. Click "Add Charge" to add.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {additionalCharges.map((charge) => (
              <div key={charge.id} className="grid grid-cols-1 md:grid-cols-6 gap-4 p-4 bg-slate-50 rounded-lg items-end">
                <FormInput
                  label="Name"
                  name="name"
                  value={charge.name}
                  onChange={(e) => updateAdditionalCharge(charge.id, 'name', e.target.value)}
                  placeholder="Charge name"
                  className="md:col-span-2"
                />
                <FormInput
                  label="Quantity"
                  name="quantity"
                  value={charge.quantity}
                  onChange={(e) => updateAdditionalCharge(charge.id, 'quantity', e.target.value)}
                  type="number"
                  placeholder="1"
                />
                <FormInput
                  label="Rate"
                  name="rate"
                  value={charge.rate}
                  onChange={(e) => updateAdditionalCharge(charge.id, 'rate', e.target.value)}
                  type="number"
                  placeholder="0.00"
                />
                <DynamicDropdown
                  label="Currency"
                  name="currency"
                  value={charge.currency}
                  onChange={(e) => updateAdditionalCharge(charge.id, 'currency', e.target.value)}
                  options={dropdownOptions.currencies}
                />
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Amount</label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-700">
                      {parseFloat(charge.amount || 0).toFixed(2)}
                    </div>
                    <button
                      onClick={() => removeAdditionalCharge(charge.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            <div className="flex justify-end p-4 bg-slate-100 rounded-lg">
              <div className="text-lg font-bold text-slate-800">
                Total Additional Charges: {totalAmount.toFixed(2)} USD
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Terms & Conditions
  const renderTermsAndConditions = () => {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <h3 className="text-lg font-semibold text-slate-800">Terms & Conditions</h3>
          <button
            onClick={addCustomTerm}
            className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-all text-sm font-medium flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Custom Term
          </button>
        </div>

        <div className="space-y-2">
          <h4 className="text-sm font-medium text-slate-700">Standard Terms:</h4>
          {termsConditions.map((term, index) => (
            <div key={index} className="flex items-start gap-2 p-3 bg-slate-50 rounded-lg">
              <span className="text-xs text-slate-500 mt-1">{index + 1}.</span>
              <p className="text-sm text-slate-700 flex-1">{term}</p>
            </div>
          ))}
        </div>

        {customTerms.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-slate-700">Custom Terms:</h4>
            {customTerms.map((term, index) => (
              <div key={index} className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg">
                <span className="text-xs text-amber-700 mt-1">{termsConditions.length + index + 1}.</span>
                <textarea
                  value={term}
                  onChange={(e) => updateCustomTerm(index, e.target.value)}
                  className="flex-1 px-3 py-2 border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm resize-none"
                  rows={2}
                  placeholder="Enter custom term..."
                />
                <button
                  onClick={() => removeCustomTerm(index)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="w-full max-w-7xl bg-white rounded-2xl shadow-2xl max-h-[95vh] flex flex-col my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-gradient-to-r from-teal-50 to-emerald-50 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-teal-600 flex items-center justify-center">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">
                {editDocument ? 'Edit' : 'Create New'} {type === 'quote' ? 'Quote' : 'Invoice'}
              </h1>
              <p className="text-sm text-slate-600">Multi-route freight quotation system</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/70 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-slate-500" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-center gap-2">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold ${
              step >= 1 ? 'bg-teal-600 text-white' : 'bg-slate-200 text-slate-600'
            }`}>
              1
            </div>
            <div className={`h-1 flex-1 ${step >= 2 ? 'bg-teal-600' : 'bg-slate-200'}`} />
            <div className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold ${
              step >= 2 ? 'bg-teal-600 text-white' : 'bg-slate-200 text-slate-600'
            }`}>
              2
            </div>
            <div className={`h-1 flex-1 ${step >= 3 ? 'bg-teal-600' : 'bg-slate-200'}`} />
            <div className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold ${
              step >= 3 ? 'bg-teal-600 text-white' : 'bg-slate-200 text-slate-600'
            }`}>
              3
            </div>
          </div>
          <div className="flex justify-between mt-2 text-xs font-medium text-slate-600">
            <span>Freight Mode & Category</span>
            <span>Quote Details</span>
            <span>Charges & Terms</span>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {step === 1 && renderFreightCategorySelector()}
          {step === 2 && renderQuoteDetailsForm()}
          {step === 3 && renderChargesAndTerms()}
        </div>
      </div>
    </div>
  );
}