import React, { useState, useEffect } from "react";
import {
  X,
  FileText,
  User,
  Plus,
  Trash2,
  Save,
  Plane,
  Ship,
  Package,
  Container,
  ChevronDown,
  AlertCircle,
  MapPin,
  CheckCircle,
  Truck,
  Route as RouteIcon,
  DollarSign,
  Download,
  Layers
} from "lucide-react";
import {
  fetchQuotes,
  createQuote,
  updateQuote,
  fetchQuoteById
} from '../../api/QuotesInvoiceAPI';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
// Import the logo
import logo from '../../assets/images/logo.png';

// --- Reusable Components ---
const DynamicDropdown = ({ label, name, value, onChange, options = [], placeholder = "Select...", required = false, error = null, disabled = false, className = "" }) => {
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

const FormInput = ({ label, name, value, onChange, type = "text", placeholder = "", required = false, error = null, disabled = false, className = "" }) => {
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

export default function QuoteInvoiceForm({ onClose, type = 'quote', editDocument = null, onSuccess }) {
  // --- Original State Logic ---
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

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
    freightMode: '',
    freightCategory: '',
    createdBy: 'rukshala'
  });

  // Direct Route State
  const [directRoute, setDirectRoute] = useState({
    portOfLoading: '',
    portOfDischarge: '',
    options: [{
      id: 1,
      carrier: '',
      incoterm: '',
      currency: 'USD',
      cargoType: '',
      equipment: '',
      units: '',
      netWeight: '',
      grossWeight: '',
      cbm: '',
      chargeableWeight: '',
      totalPieces: ''
    }]
  });

  // Transit Route State
  const [transitRoute, setTransitRoute] = useState({
    portOfLoading: '',
    portOfDischarge: '',
    transitStops: [],
    segments: []
  });

  const [activeOptionIndex, setActiveOptionIndex] = useState(0);

  // Charges State
  const [freightCharges, setFreightCharges] = useState({
    origin: [],
    destination: []
  });

  const [handlingCharges, setHandlingCharges] = useState({
    origin: [],
    destination: []
  });

  // Terms State
  const [termsConditions, setTermsConditions] = useState([
    { id: 1, text: 'RATES ARE VALID TILL <> - SUBJECT TO SURCHARGE FLUCTUATIONS AS PER THE CARRIER', selected: true },
    { id: 2, text: 'RATES ARE SUBJECT TO INWARD LOCAL HANDLING CHARGES OF LKR.18000.00 + VAT (SVAT)', selected: true },
    { id: 3, text: 'RATES ARE QUOTED ON FOB/EXW BASIS', selected: true },
    { id: 4, text: 'RATES ARE NOT APPLICABLE FOR DANGEROUS GOODS OR PERISHABLE CARGO', selected: false },
    { id: 5, text: 'DUE TO THE CURRENT MARITIME CONSTRAINT\'S', selected: false },
    { id: 6, text: 'VESSEL ARE SUBJECT BLANK SAILINGS/OMITTING COLOMBO PORT, ROLL OVERS WITH OR WITHOUT PRIOR NOTICE', selected: false },
    { id: 7, text: 'RATES ARE SUBJECT TO CONTAINER DEPOSIT', selected: false }
  ]);
  
  const [customTerms, setCustomTerms] = useState([]);

  // Dropdown Options
  const [dropdownOptions, setDropdownOptions] = useState({
    customers: [],
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

  function generateQuoteId() {
    const now = new Date();
    return `Q-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}-${Math.floor(Math.random() * 1000)}`;
  }

  // --- Mock Data Load ---
  useEffect(() => {
    const loadAllOptions = async () => {
      setLoading(true);
      const mockData = {
        customers: [{ value: '1', label: 'COURTAULDS TRADING COMPANY (PVT) LTD', address: 'PALUGAHAWELA, KATUWELLEGAMA, 11526, SRI LANKA' }, { value: '2', label: 'ABC Exporters' }],
        locations: [{ value: '1', label: 'Colombo' }, { value: '2', label: 'Kandy' }],
        creditTerms: [{ value: '1', label: 'Credit Terms' }, { value: '2', label: 'Prepaid' }],
        carriers: ['WHL', 'MAERSK', 'MSC', 'CMA CGM', 'ONE', 'UL', 'SQ'],
        incoterms: ['EXW', 'FOB', 'CFR', 'CIF', 'DAP', 'DDP'],
        currencies: ['USD', 'LKR', 'EUR', 'GBP', 'AED', 'JPY'],
        cargoTypes: ['General Cargo', 'Dangerous Goods', 'Perishable', 'Crates'],
        equipment: ['20GP', '40GP', '40HQ', 'LCL', 'Air Pallet'],
        ports: [{ value: 'HO CHI MINH', label: 'HO CHI MINH' }, { value: 'COLOMBO', label: 'COLOMBO' }, { value: 'SGSIN', label: 'Singapore' }],
        airports: [{ value: 'CMB', label: 'Colombo (CMB)' }, { value: 'DXB', label: 'Dubai (DXB)' }],
        chargeNames: ['DO CHARGES', 'Handling Charge', 'Freight', 'THC', 'Documentation Fee']
      };

      setDropdownOptions(prev => ({ ...prev, ...mockData }));
      setLoading(false);
    };
    loadAllOptions();
  }, []);

  // --- Logic for Transit Segments ---
  useEffect(() => {
    if (quoteData.freightCategory === 'transit') {
      updateTransitSegments();
    }
  }, [transitRoute.transitStops, transitRoute.portOfLoading, transitRoute.portOfDischarge]);

  const updateTransitSegments = () => {
    const stops = [
      transitRoute.portOfLoading,
      ...transitRoute.transitStops.map(s => s.portId),
      transitRoute.portOfDischarge
    ].filter(Boolean);

    if (stops.length < 2) return;

    const newSegments = [];
    for (let i = 0; i < stops.length - 1; i++) {
      const from = stops[i];
      const to = stops[i+1];
      const existing = transitRoute.segments[i];
      newSegments.push({
        id: existing ? existing.id : Date.now() + i,
        from,
        to,
        carrierOptions: existing ? existing.carrierOptions : [{
          id: Date.now(), carrier: '', incoterm: '', currency: 'USD', cargoType: ''
        }]
      });
    }
    setTransitRoute(prev => ({ ...prev, segments: newSegments }));
  };

  // --- UI Event Handlers ---

  const handleDirectRouteChange = (field, value) => {
    setDirectRoute(prev => ({ ...prev, [field]: value }));
  };

  const addDirectOption = () => {
    setDirectRoute(prev => ({
      ...prev,
      options: [...prev.options, {
        id: Date.now(),
        carrier: '', incoterm: '', currency: 'USD', cargoType: '',
        equipment: '', units: '', netWeight: '', grossWeight: '', cbm: '', chargeableWeight: '', totalPieces: ''
      }]
    }));
  };

  const updateDirectOption = (index, field, value) => {
    const newOptions = [...directRoute.options];
    newOptions[index] = { ...newOptions[index], [field]: value };
    setDirectRoute(prev => ({ ...prev, options: newOptions }));
  };

  const removeDirectOption = (index) => {
    if (directRoute.options.length > 1) {
      const newOptions = directRoute.options.filter((_, i) => i !== index);
      setDirectRoute(prev => ({ ...prev, options: newOptions }));
      if (activeOptionIndex >= newOptions.length) setActiveOptionIndex(0);
    }
  };

  const addTransitStop = () => {
    const id = Date.now();
    setTransitRoute(prev => ({
      ...prev,
      transitStops: [...prev.transitStops, { id, portId: '' }]
    }));
    setFreightCharges(prev => ({ ...prev, [`transit_${prev.transitStops.length + 1}`]: [] }));
  };

  const updateTransitStop = (index, value) => {
    const newStops = [...transitRoute.transitStops];
    newStops[index].portId = value;
    setTransitRoute(prev => ({ ...prev, transitStops: newStops }));
  };

  const removeTransitStop = (index) => {
    const newStops = transitRoute.transitStops.filter((_, i) => i !== index);
    setTransitRoute(prev => ({ ...prev, transitStops: newStops }));
  };

  const updateTransitSegmentOption = (segmentIndex, optionIndex, field, value) => {
    const newSegments = [...transitRoute.segments];
    newSegments[segmentIndex].carrierOptions[optionIndex][field] = value;
    setTransitRoute(prev => ({ ...prev, segments: newSegments }));
  };

  const addTransitSegmentOption = (segmentIndex) => {
    const newSegments = [...transitRoute.segments];
    newSegments[segmentIndex].carrierOptions.push({
      id: Date.now(), carrier: '', incoterm: '', currency: 'USD', cargoType: ''
    });
    setTransitRoute(prev => ({ ...prev, segments: newSegments }));
  };

  const addCharge = (type, locationKey) => {
    const setter = type === 'freight' ? setFreightCharges : setHandlingCharges;
    setter(prev => ({
      ...prev,
      [locationKey]: [...(prev[locationKey] || []), {
        id: Date.now(), chargeName: '', uom: '', chargeAmount: '', total: 0, currency: 'USD'
      }]
    }));
  };

  const updateCharge = (type, locationKey, id, field, value) => {
    const setter = type === 'freight' ? setFreightCharges : setHandlingCharges;
    setter(prev => ({
      ...prev,
      [locationKey]: prev[locationKey].map(charge => {
        if (charge.id === id) {
          const updated = { ...charge, [field]: value };
          if (field === 'uom' || field === 'chargeAmount') {
            updated.total = (parseFloat(updated.chargeAmount) || 0); 
          }
          return updated;
        }
        return charge;
      })
    }));
  };

  const removeCharge = (type, locationKey, id) => {
    const setter = type === 'freight' ? setFreightCharges : setHandlingCharges;
    setter(prev => ({
      ...prev,
      [locationKey]: prev[locationKey].filter(c => c.id !== id)
    }));
  };

  // --- PDF LOGIC (Updated with Logo) ---

  const preparePdfData = (optionIndex = 0) => {
    const selectedCustomer = dropdownOptions.customers.find(c => c.value === quoteData.customerId);
    const selectedOption = directRoute.options[optionIndex] || directRoute.options[0];
    
    const lkrCharges = [];
    const usdCharges = [];
    let lkrTotal = 0;
    let usdTotal = 0;

    const processHandlingCharges = (chargeList) => {
      if(!chargeList) return;
      chargeList.forEach(c => {
        const item = { 
          name: c.chargeName, 
          amount: parseFloat(c.chargeAmount) || 0, 
          unit: c.uom ? `per ${c.uom}` : 'per Shipment'
        };
        
        if (c.currency === 'LKR') {
          lkrCharges.push(item);
          lkrTotal += item.amount;
        } else {
          usdCharges.push(item);
          usdTotal += item.amount;
        }
      });
    };

    processHandlingCharges(handlingCharges.origin);
    processHandlingCharges(handlingCharges.destination);

    const combinedFreightCharges = [...freightCharges.origin, ...freightCharges.destination];
    const fmt = (num) => num ? parseFloat(num).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}) : "0.00";

    return {
      company: {
        name: "Scanwell Logistics Colombo (Pvt) Ltd.",
        address: "67/1 Hudson Road Colombo 3 Sri Lanka.",
        phone: "+94 11 2426600/4766400"
      },
      meta: {
        quoteNumber: quoteData.quoteId,
        serviceType: quoteData.freightMode || "LCL - Sea Import",
        terms: dropdownOptions.creditTerms.find(t => t.value === quoteData.creditTermsId)?.label || "Credit Terms"
      },
      customer: {
        name: quoteData.customerName || selectedCustomer?.label || "",
        address: selectedCustomer?.address || ""
      },
      shipment: {
        pol: quoteData.freightCategory === 'transit' ? transitRoute.portOfLoading : directRoute.portOfLoading,
        pod: quoteData.freightCategory === 'transit' ? transitRoute.portOfDischarge : directRoute.portOfDischarge,
        deliveryTerms: selectedOption.incoterm,
        pcs: selectedOption.totalPieces,
        volume: fmt(selectedOption.cbm),
        grossWeight: fmt(selectedOption.grossWeight),
        chargeableWeight: fmt(selectedOption.chargeableWeight)
      },
      freightTable: combinedFreightCharges.length > 0 ? combinedFreightCharges.map(fc => ({
        carrier: selectedOption.carrier || "TBA",
        equip: selectedOption.equipment || "",
        containers: selectedOption.units || "0",
        rate: `${fmt(fc.chargeAmount)} per ${fc.uom || 'Unit'}`,
        currency: fc.currency,
        surcharge: "",
        tt: "10", // Mock
        freq: "WEEKLY", // Mock
        route: quoteData.freightCategory ? quoteData.freightCategory.toUpperCase() : "DIRECT",
        comments: ""
      })) : [{
        carrier: selectedOption.carrier || "TBA",
        equip: selectedOption.equipment || "",
        containers: selectedOption.units || "0",
        rate: "0.00",
        currency: selectedOption.currency || "USD",
        surcharge: "",
        tt: "TBA",
        freq: "TBA",
        route: "DIRECT",
        comments: ""
      }],
      otherCharges: {
        lkr: { items: lkrCharges, total: lkrTotal },
        usd: { items: usdCharges, total: usdTotal }
      },
      terms: [
        ...termsConditions.filter(t => t.selected).map(t => t.text),
        ...customTerms.filter(t => t.selected).map(t => t.text)
      ],
      generatedBy: quoteData.createdBy
    };
  };

  const handleGeneratePDF = (specificOptionIndex = null) => {
    const indexToUse = specificOptionIndex !== null ? specificOptionIndex : activeOptionIndex;
    const data = preparePdfData(indexToUse);
    
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // --- 1. Header Section ---
    // LOGO REPLACEMENT
    doc.addImage(logo, 'PNG', 15, 10, 45, 12);

    // Company Text (Right side)
    doc.setTextColor(50, 80, 120);
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text(data.company.name, pageWidth - 15, 20, { align: 'right' });
    
    doc.setTextColor(0);
    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    doc.text(data.company.address, pageWidth - 15, 25, { align: 'right' });
    doc.text(`Office #${data.company.phone}`, pageWidth - 15, 29, { align: 'right' });

    // Title
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text("QUOTATION", pageWidth / 2, 40, { align: 'center' });

    // --- 2. Meta Section ---
    let currentY = 55;
    doc.setFontSize(9);
    doc.text(data.meta.quoteNumber, 15, currentY);
    doc.text(data.meta.serviceType, pageWidth - 15, currentY, { align: 'right' });
    doc.text(data.meta.terms, pageWidth - 15, currentY + 4, { align: 'right' });

    // --- 3. Customer Section ---
    currentY += 15;
    doc.setFontSize(9);
    doc.setFont(undefined, 'bold');
    doc.text("Customer", 15, currentY);
    doc.setFont(undefined, 'normal');
    doc.text(data.customer.name, 15, currentY + 5);
    const addressLines = doc.splitTextToSize(data.customer.address, 120);
    doc.text(addressLines, 15, currentY + 9);
    currentY += 9 + (addressLines.length * 4);

    // --- 4. Pickup / Delivery Labels ---
    currentY += 5;
    doc.setFont(undefined, 'bold');
    doc.text("Pickup Address", 15, currentY);
    doc.text("Delivery Address", pageWidth - 15, currentY, { align: 'right' });
    currentY += 4;
    doc.setLineWidth(0.5);
    doc.line(15, currentY, pageWidth - 15, currentY);

    // --- 5. Shipment Details Grid ---
    currentY += 5;
    autoTable(doc, {
      startY: currentY,
      head: [['Port of Loading', 'Port of Discharge']],
      body: [[data.shipment.pol, data.shipment.pod]],
      theme: 'plain',
      styles: { fontSize: 8, cellPadding: 1, textColor: 0 },
      headStyles: { fontStyle: 'bold', fontSize: 8, textColor: 0 },
      columnStyles: { 0: { cellWidth: 80 }, 1: { cellWidth: 80 } },
      margin: { left: 15 }
    });

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 2,
      head: [['Delivery Terms', 'Pcs', 'Volume', 'Gross Weight', 'Chargable Weight']],
      body: [[
        data.shipment.deliveryTerms,
        data.shipment.pcs,
        data.shipment.volume,
        data.shipment.grossWeight,
        data.shipment.chargeableWeight
      ]],
      theme: 'plain',
      styles: { fontSize: 8, cellPadding: 1, textColor: 0 },
      headStyles: { fontStyle: 'bold', fontSize: 8, textColor: 0 },
      columnStyles: { 0: { cellWidth: 30 }, 1: { cellWidth: 20 }, 2: { cellWidth: 40 }, 3: { cellWidth: 40 }, 4: { cellWidth: 40 } },
      margin: { left: 15 }
    });

    // --- 6. Freight Charges Table ---
    currentY = doc.lastAutoTable.finalY + 5;
    doc.setFont(undefined, 'bold');
    doc.text("Freight Charges", 15, currentY);
    doc.setLineWidth(0.1);
    doc.line(15, currentY + 1, 38, currentY + 1);

    autoTable(doc, {
      startY: currentY + 3,
      head: [['Carrier', 'Equip.', 'No of Containers', 'Rate Per', 'Cur', 'Surcharge', 'TT', 'Freq', 'Route', 'Comments']],
      body: data.freightTable.map(row => [
        row.carrier, row.equip, row.containers, row.rate, row.currency, row.surcharge, row.tt, row.freq, row.route, row.comments
      ]),
      theme: 'grid',
      styles: { fontSize: 7, textColor: 0, lineColor: 0, lineWidth: 0.1 },
      headStyles: { fillColor: false, textColor: 0, fontStyle: 'bold', lineWidth: 0.1 },
      margin: { left: 15, right: 15 }
    });

    // --- 7. Other Charges Section ---
    currentY = doc.lastAutoTable.finalY + 8;
    doc.setFontSize(9);
    doc.setFont(undefined, 'bold');
    doc.text("OTHER CHARGES", 15, currentY);
    doc.line(15, currentY + 1, 40, currentY + 1);
    currentY += 6;

    // LKR Section
    if (data.otherCharges.lkr.items.length > 0) {
        doc.setFontSize(8);
        doc.setFont(undefined, 'bold');
        doc.text("LKR", 15, currentY);
        doc.line(15, currentY + 1, 20, currentY + 1);
        
        autoTable(doc, {
            startY: currentY + 2,
            body: data.otherCharges.lkr.items.map(i => [i.name, 'LKR', `${parseFloat(i.amount).toLocaleString('en-US', {minimumFractionDigits: 2})} ${i.unit}`, parseFloat(i.amount).toLocaleString('en-US', {minimumFractionDigits: 2})]),
            theme: 'plain',
            styles: { fontSize: 8, textColor: 0, cellPadding: 1 },
            columnStyles: { 0: { cellWidth: 60 }, 1: { cellWidth: 20 }, 2: { cellWidth: 60, halign: 'right' }, 3: { cellWidth: 40, halign: 'right' } },
            margin: { left: 15 }
        });

        let finalY = doc.lastAutoTable.finalY;
        doc.setLineDash([1, 1], 0);
        doc.line(15, finalY, pageWidth - 15, finalY);
        doc.setLineDash([]);
        doc.setFont(undefined, 'bold');
        doc.text("TOTAL", 15, finalY + 4);
        doc.text(parseFloat(data.otherCharges.lkr.total).toLocaleString('en-US', {minimumFractionDigits: 2}), pageWidth - 15, finalY + 4, { align: 'right' });
        doc.setLineWidth(0.3);
        doc.line(15, finalY + 5, pageWidth - 15, finalY + 5);
        currentY = finalY + 10;
    }

    // USD Section
    if (data.otherCharges.usd.items.length > 0) {
        doc.setFontSize(8);
        doc.setFont(undefined, 'bold');
        doc.text("USD", 15, currentY);
        doc.setLineWidth(0.1);
        doc.line(15, currentY + 1, 20, currentY + 1);

         autoTable(doc, {
            startY: currentY + 2,
            body: data.otherCharges.usd.items.map(i => [i.name, 'USD', `${parseFloat(i.amount).toLocaleString('en-US', {minimumFractionDigits: 2})} ${i.unit}`, parseFloat(i.amount).toLocaleString('en-US', {minimumFractionDigits: 2})]),
            theme: 'plain',
            styles: { fontSize: 8, textColor: 0, cellPadding: 1 },
            columnStyles: { 0: { cellWidth: 60 }, 1: { cellWidth: 20 }, 2: { cellWidth: 60, halign: 'right' }, 3: { cellWidth: 40, halign: 'right' } },
            margin: { left: 15 }
        });

        let finalY = doc.lastAutoTable.finalY;
        doc.setLineDash([1, 1], 0);
        doc.line(15, finalY, pageWidth - 15, finalY);
        doc.setLineDash([]);
        doc.setFont(undefined, 'bold');
        doc.text("TOTAL", 15, finalY + 4);
        doc.text(parseFloat(data.otherCharges.usd.total).toLocaleString('en-US', {minimumFractionDigits: 2}), pageWidth - 15, finalY + 4, { align: 'right' });
        doc.setLineWidth(0.3);
        doc.line(15, finalY + 5, pageWidth - 15, finalY + 5);
        currentY = finalY + 15;
    }

    // --- 8. Terms & Conditions ---
    if (currentY > 250) {
        doc.addPage();
        currentY = 20;
    }
    doc.setLineWidth(0.5);
    doc.line(15, currentY, pageWidth - 15, currentY);
    currentY += 5;

    doc.setFontSize(7);
    doc.setFont(undefined, 'normal');
    data.terms.forEach(term => {
        const lines = doc.splitTextToSize(`- ${term}`, pageWidth - 30);
        doc.text(lines, 15, currentY);
        currentY += (lines.length * 3) + 1;
    });

    // --- 9. Footer ---
    currentY += 10;
    doc.text(`Quotation generated by - ${data.generatedBy}`, 15, currentY);
    currentY += 4;
    doc.setFont(undefined, 'italic');
    doc.text("This is a Computer generated Document and no Signature required.", 15, currentY);

    doc.save(`${data.meta.quoteNumber}.pdf`);
  };

  const handleSave = async () => {
  if (isSubmitting) return;
  setIsSubmitting(true);

  try {
    // Prepare data exactly as backend expects
    const payload = {
      sysID: editDocument?.sysID || null,
      quoteId: quoteData.quoteId,
      customerId: quoteData.customerId,
      customerName: quoteData.customerName,
      pickupLocationId: quoteData.pickupLocationId,
      deliveryLocationId: quoteData.deliveryLocationId,
      creditTermsId: quoteData.creditTermsId,
      createdDate: quoteData.createdDate,
      clientId: quoteData.clientId,
      clientName: quoteData.clientName,
      days: quoteData.days,
      freightMode: quoteData.freightMode,
      freightCategory: quoteData.freightCategory,
      createdBy: quoteData.createdBy,

      // Serialize complex objects as JSON strings (exactly as backend expects)
      directRoute: quoteData.freightCategory === 'direct' 
        ? JSON.stringify(directRoute) 
        : null,

      transitRoute: quoteData.freightCategory === 'transit'
        ? JSON.stringify(transitRoute)
        : null,

      multimodalSegments: null, // You can implement later
      routePlanData: null,

      freightCharges: JSON.stringify(freightCharges),
      handlingCharges: JSON.stringify(handlingCharges),
      termsConditions: JSON.stringify(
        termsConditions.filter(t => t.selected).map(t => t.text)
      ),
      customTerms: JSON.stringify(customTerms)
    };

    console.log("this is payload: ", payload);

    let result;
    if (editDocument) {
      // Update existing
      result = await updateQuote(payload);
      alert("Quote updated successfully!");
    } else {
      // Create new
      result = await createQuote(payload);
      alert("Quote created successfully!");
    }

    console.log("Success:", result);

    // Call success callback and close
    if (onSuccess) onSuccess();
    onClose();

  } catch (error) {
    console.error("Error saving quote:", error);
    const msg = error.response?.data || error.message || "Failed to save quote";
    alert("Error: " + msg);
  } finally {
    setIsSubmitting(false);
  }
};

  // --- UI RENDER ---

  const renderFreightModeSelection = () => {
    const modes = [
      { id: 'Air Import', icon: Plane, color: 'text-sky-600', bg: 'bg-sky-50' },
      { id: 'Air Export', icon: Plane, color: 'text-blue-600', bg: 'bg-blue-50' },
      { id: 'Sea Import FCL', icon: Container, color: 'text-teal-600', bg: 'bg-teal-50' },
      { id: 'Sea Import LCL', icon: Package, color: 'text-emerald-600', bg: 'bg-emerald-50' },
      { id: 'Sea Export FCL', icon: Ship, color: 'text-indigo-600', bg: 'bg-indigo-50' },
      { id: 'Sea Export LCL', icon: Layers, color: 'text-purple-600', bg: 'bg-purple-50' }
    ];

    const categories = [
      { id: 'direct', label: 'Direct', icon: RouteIcon },
      { id: 'transit', label: 'Transit', icon: Layers },
      { id: 'multimodal', label: 'MultiModal', icon: Truck }
    ];

    return (
      <div className="space-y-8">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Step 1: Freight Configuration</h2>
          <p className="text-slate-500 text-sm">Select mode and routing type</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {modes.map(mode => (
            <button
              key={mode.id}
              onClick={() => setQuoteData(p => ({ ...p, freightMode: mode.id }))}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                quoteData.freightMode === mode.id ? 'border-teal-500 ring-1 ring-teal-500' : 'border-slate-200 hover:border-teal-200'
              }`}
            >
              <div className={`w-10 h-10 rounded-lg ${mode.bg} ${mode.color} flex items-center justify-center mb-3`}>
                <mode.icon className="w-6 h-6" />
              </div>
              <span className="font-semibold text-slate-700">{mode.id}</span>
            </button>
          ))}
        </div>

        {quoteData.freightMode && (
          <div className="pt-6 border-t border-slate-100">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Select Routing Type</h3>
            <div className="flex gap-4">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setQuoteData(p => ({ ...p, freightCategory: cat.id }))}
                  className={`flex-1 p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                    quoteData.freightCategory === cat.id ? 'border-teal-500 bg-teal-50 text-teal-700' : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <cat.icon className="w-6 h-6" />
                  <span className="font-medium">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <button
            disabled={!quoteData.freightMode || !quoteData.freightCategory}
            onClick={() => setStep(2)}
            className="px-6 py-2 bg-teal-600 text-white rounded-lg disabled:opacity-50 hover:bg-teal-700 transition-colors"
          >
            Continue
          </button>
        </div>
      </div>
    );
  };

  const renderQuoteDetails = () => (
    <div className="space-y-8">
      {/* Header Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50 p-6 rounded-xl border border-slate-200">
        <FormInput label="Quote Number" value={quoteData.quoteId} disabled />
        <FormInput label="Created Date" type="date" value={quoteData.createdDate} disabled />
        <FormInput label="Valid Days" type="number" value={quoteData.days} onChange={e => setQuoteData({...quoteData, days: e.target.value})} />
        
        <DynamicDropdown
          label="Customer"
          value={quoteData.customerId}
          options={dropdownOptions.customers}
          onChange={e => {
            const cust = dropdownOptions.customers.find(c => c.value === e.target.value);
            setQuoteData({...quoteData, customerId: e.target.value, customerName: cust?.label || ''});
          }}
        />
        <DynamicDropdown label="Pickup Location" value={quoteData.pickupLocationId} options={dropdownOptions.locations} onChange={e => setQuoteData({...quoteData, pickupLocationId: e.target.value})} />
        <DynamicDropdown label="Delivery Location" value={quoteData.deliveryLocationId} options={dropdownOptions.locations} onChange={e => setQuoteData({...quoteData, deliveryLocationId: e.target.value})} />
        <DynamicDropdown label="Credit Terms" value={quoteData.creditTermsId} options={dropdownOptions.creditTerms} onChange={e => setQuoteData({...quoteData, creditTermsId: e.target.value})} />
      </div>

      {/* --- Route Config --- */}
      {quoteData.freightCategory === 'direct' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <RouteIcon className="w-5 h-5 text-teal-600" /> Direct Route Configuration
            </h3>
            <button onClick={addDirectOption} className="text-sm bg-teal-50 text-teal-700 px-3 py-1 rounded-md hover:bg-teal-100 flex items-center gap-1">
              <Plus className="w-4 h-4" /> Add Carrier Option
            </button>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-6">
            <DynamicDropdown label="Port of Loading" value={directRoute.portOfLoading} options={quoteData.freightMode.includes('Air') ? dropdownOptions.airports : dropdownOptions.ports} onChange={e => handleDirectRouteChange('portOfLoading', e.target.value)} />
            <DynamicDropdown label="Port of Discharge" value={directRoute.portOfDischarge} options={quoteData.freightMode.includes('Air') ? dropdownOptions.airports : dropdownOptions.ports} onChange={e => handleDirectRouteChange('portOfDischarge', e.target.value)} />
          </div>

          <div className="space-y-4">
            {directRoute.options.map((opt, idx) => (
              <div key={opt.id} className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                <div className="flex justify-between mb-3">
                  <span className="font-semibold text-slate-700 text-sm">Option {idx + 1}</span>
                  {idx > 0 && <button onClick={() => removeDirectOption(idx)} className="text-red-500"><Trash2 className="w-4 h-4" /></button>}
                </div>
                <div className="grid grid-cols-4 gap-4">
                  <DynamicDropdown label="Carrier" value={opt.carrier} options={dropdownOptions.carriers} onChange={e => updateDirectOption(idx, 'carrier', e.target.value)} />
                  <DynamicDropdown label="Incoterm" value={opt.incoterm} options={dropdownOptions.incoterms} onChange={e => updateDirectOption(idx, 'incoterm', e.target.value)} />
                  <DynamicDropdown label="Currency" value={opt.currency} options={dropdownOptions.currencies} onChange={e => updateDirectOption(idx, 'currency', e.target.value)} />
                  <DynamicDropdown label="Cargo Type" value={opt.cargoType} options={dropdownOptions.cargoTypes} onChange={e => updateDirectOption(idx, 'cargoType', e.target.value)} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {quoteData.freightCategory === 'transit' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Layers className="w-5 h-5 text-purple-600" /> Transit Route Configuration
          </h3>
          
          <div className="grid grid-cols-2 gap-6 mb-4">
            <DynamicDropdown label="Port of Loading" value={transitRoute.portOfLoading} options={quoteData.freightMode.includes('Air') ? dropdownOptions.airports : dropdownOptions.ports} onChange={e => setTransitRoute({...transitRoute, portOfLoading: e.target.value})} />
            <DynamicDropdown label="Port of Discharge" value={transitRoute.portOfDischarge} options={quoteData.freightMode.includes('Air') ? dropdownOptions.airports : dropdownOptions.ports} onChange={e => setTransitRoute({...transitRoute, portOfDischarge: e.target.value})} />
          </div>

          <div className="mb-6">
             <div className="flex justify-between items-center mb-2">
               <label className="text-sm font-medium text-slate-700">Transit Stops</label>
               <button onClick={addTransitStop} className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded hover:bg-purple-200">Add Stop</button>
             </div>
             {transitRoute.transitStops.map((stop, idx) => (
               <div key={stop.id} className="flex gap-4 items-end mb-2">
                 <DynamicDropdown 
                   className="flex-1"
                   label={`Transit Stop ${idx + 1}`}
                   value={stop.portId}
                   options={quoteData.freightMode.includes('Air') ? dropdownOptions.airports : dropdownOptions.ports}
                   onChange={e => updateTransitStop(idx, e.target.value)}
                 />
                 <button onClick={() => removeTransitStop(idx)} className="p-2 bg-red-50 text-red-600 rounded mb-[2px]"><Trash2 className="w-5 h-5" /></button>
               </div>
             ))}
          </div>

          {transitRoute.segments.length > 0 && (
            <div className="space-y-4 border-t pt-4">
              <h4 className="font-semibold text-slate-700">Route Segments & Carriers</h4>
              {transitRoute.segments.map((seg, segIdx) => (
                <div key={seg.id} className="bg-purple-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-medium text-sm text-purple-800">
                      Segment: {seg.from} ➔ {seg.to}
                    </span>
                    <button onClick={() => addTransitSegmentOption(segIdx)} className="text-xs text-purple-700 flex items-center gap-1"><Plus className="w-3 h-3"/> Add Option</button>
                  </div>
                  {seg.carrierOptions.map((opt, optIdx) => (
                     <div key={opt.id} className="grid grid-cols-4 gap-3 mb-2 bg-white p-2 rounded border border-purple-100">
                        <DynamicDropdown label="Carrier" value={opt.carrier} options={dropdownOptions.carriers} onChange={e => updateTransitSegmentOption(segIdx, optIdx, 'carrier', e.target.value)} />
                        <DynamicDropdown label="Incoterm" value={opt.incoterm} options={dropdownOptions.incoterms} onChange={e => updateTransitSegmentOption(segIdx, optIdx, 'incoterm', e.target.value)} />
                        <DynamicDropdown label="Currency" value={opt.currency} options={dropdownOptions.currencies} onChange={e => updateTransitSegmentOption(segIdx, optIdx, 'currency', e.target.value)} />
                        <DynamicDropdown label="Cargo Type" value={opt.cargoType} options={dropdownOptions.cargoTypes} onChange={e => updateTransitSegmentOption(segIdx, optIdx, 'cargoType', e.target.value)} />
                     </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* --- Destination, Carrier & Equipment Section --- */}
      {(quoteData.freightCategory === 'direct' || quoteData.freightCategory === 'transit') && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
           <div className="border-b pb-4 mb-4">
             <h3 className="text-lg font-bold text-slate-800">Destination, Carrier & Equipment Details</h3>
             <p className="text-sm text-slate-500">
               {quoteData.freightCategory === 'direct' 
                 ? "Define measurements per carrier option." 
                 : "Define overall shipment measurements (linked to Option ID)."}
             </p>
           </div>

           {directRoute.options.length > 1 && (
             <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
               {directRoute.options.map((_, idx) => (
                 <button
                   key={idx}
                   onClick={() => setActiveOptionIndex(idx)}
                   className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
                     activeOptionIndex === idx 
                       ? 'bg-teal-600 text-white shadow-md' 
                       : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                   }`}
                 >
                   Option {idx + 1}
                 </button>
               ))}
             </div>
           )}

           <div className="grid grid-cols-2 md:grid-cols-4 gap-6 animate-in fade-in">
             <DynamicDropdown 
                label="Equipment" 
                value={directRoute.options[activeOptionIndex]?.equipment} 
                options={dropdownOptions.equipment} 
                onChange={e => updateDirectOption(activeOptionIndex, 'equipment', e.target.value)} 
             />
             <FormInput 
                label={quoteData.freightMode.includes('Air') ? "Units (Kg)" : "Units/Containers"} 
                type="number"
                value={directRoute.options[activeOptionIndex]?.units} 
                onChange={e => updateDirectOption(activeOptionIndex, 'units', e.target.value)} 
             />
             <FormInput 
                label="Net Weight" 
                type="number"
                value={directRoute.options[activeOptionIndex]?.netWeight} 
                onChange={e => updateDirectOption(activeOptionIndex, 'netWeight', e.target.value)} 
             />
             <FormInput 
                label="Gross Weight" 
                type="number"
                value={directRoute.options[activeOptionIndex]?.grossWeight} 
                onChange={e => updateDirectOption(activeOptionIndex, 'grossWeight', e.target.value)} 
             />
             <FormInput 
                label={quoteData.freightMode.includes('Air') ? "Volume (m³)" : "CBM"} 
                type="number"
                value={directRoute.options[activeOptionIndex]?.cbm} 
                onChange={e => updateDirectOption(activeOptionIndex, 'cbm', e.target.value)} 
             />
             <FormInput 
                label="Chargeable Weight" 
                type="number"
                value={directRoute.options[activeOptionIndex]?.chargeableWeight} 
                onChange={e => updateDirectOption(activeOptionIndex, 'chargeableWeight', e.target.value)} 
             />
             <FormInput 
                label="Total Pieces" 
                type="number"
                value={directRoute.options[activeOptionIndex]?.totalPieces} 
                onChange={e => updateDirectOption(activeOptionIndex, 'totalPieces', e.target.value)} 
             />
           </div>
        </div>
      )}

      <div className="flex justify-between pt-6">
        <button onClick={() => setStep(1)} className="px-6 py-2 border rounded-lg hover:bg-slate-50">Back</button>
        <button onClick={() => setStep(3)} className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700">Continue to Charges</button>
      </div>
    </div>
  );

  const renderChargesAndTerms = () => {
    // Helper to render a charge table
    const renderTable = (charges, locationKey, type) => (
      <div className="mt-2">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-slate-100 text-left">
              <th className="p-2 border">Charge Name</th>
              <th className="p-2 border w-24">UOM</th>
              <th className="p-2 border w-24">Amount</th>
              <th className="p-2 border w-24">Currency</th>
              <th className="p-2 border w-24">Total</th>
              <th className="p-2 border w-10"></th>
            </tr>
          </thead>
          <tbody>
            {charges.map(c => (
              <tr key={c.id}>
                <td className="p-1 border">
                  <DynamicDropdown 
                     className="mb-0" 
                     value={c.chargeName} 
                     options={dropdownOptions.chargeNames} 
                     onChange={e => updateCharge(type, locationKey, c.id, 'chargeName', e.target.value)} 
                  />
                </td>
                <td className="p-1 border"><input type="text" className="w-full p-1 border rounded" value={c.uom} onChange={e => updateCharge(type, locationKey, c.id, 'uom', e.target.value)} /></td>
                <td className="p-1 border"><input type="number" className="w-full p-1 border rounded" value={c.chargeAmount} onChange={e => updateCharge(type, locationKey, c.id, 'chargeAmount', e.target.value)} /></td>
                <td className="p-1 border">
                  <select className="w-full p-1 border rounded" value={c.currency} onChange={e => updateCharge(type, locationKey, c.id, 'currency', e.target.value)}>
                    <option value="USD">USD</option>
                    <option value="LKR">LKR</option>
                  </select>
                </td>
                <td className="p-2 border font-medium text-right">{(parseFloat(c.chargeAmount) || 0).toFixed(2)}</td>
                <td className="p-1 border text-center"><button onClick={() => removeCharge(type, locationKey, c.id)} className="text-red-500"><Trash2 className="w-4 h-4" /></button></td>
              </tr>
            ))}
            <tr>
              <td colSpan="6" className="p-2 text-center">
                <button onClick={() => addCharge(type, locationKey)} className="text-teal-600 text-xs font-bold flex items-center justify-center gap-1 mx-auto hover:underline">
                  <Plus className="w-3 h-3" /> Add Charge
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );

    return (
      <div className="space-y-8">
        {/* Freight Charges */}
        <div className="bg-white p-6 rounded-xl border border-slate-200">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-teal-600" /> Freight Charges
          </h3>
          
          <div className="space-y-6">
            <div>
              <h4 className="font-semibold text-slate-700">Origin Charges (POL)</h4>
              {renderTable(freightCharges.origin, 'origin', 'freight')}
            </div>

            {quoteData.freightCategory === 'transit' && transitRoute.transitStops.map((stop, idx) => (
              <div key={stop.id}>
                <h4 className="font-semibold text-slate-700">Transit Charges: {stop.portId || `Stop ${idx+1}`}</h4>
                {renderTable(freightCharges[`transit_${idx+1}`] || [], `transit_${idx+1}`, 'freight')}
              </div>
            ))}

            <div>
              <h4 className="font-semibold text-slate-700">Destination Charges (POD)</h4>
              {renderTable(freightCharges.destination, 'destination', 'freight')}
            </div>
          </div>
        </div>

        {/* Handling Charges */}
        <div className="bg-white p-6 rounded-xl border border-slate-200">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Package className="w-5 h-5 text-purple-600" /> Handling Charges
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h4 className="font-semibold text-slate-700">Origin Handling</h4>
              {renderTable(handlingCharges.origin, 'origin', 'handling')}
            </div>
            <div>
              <h4 className="font-semibold text-slate-700">Destination Handling</h4>
              {renderTable(handlingCharges.destination, 'destination', 'handling')}
            </div>
          </div>
        </div>

        {/* Terms */}
        <div className="bg-white p-6 rounded-xl border border-slate-200">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Terms & Conditions</h3>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {termsConditions.map(term => (
              <label key={term.id} className="flex items-start gap-3 p-2 hover:bg-slate-50 rounded cursor-pointer">
                <input type="checkbox" checked={term.selected} onChange={() => setTermsConditions(termsConditions.map(t => t.id === term.id ? {...t, selected: !t.selected} : t))} className="mt-1" />
                <span className="text-sm text-slate-700">{term.text}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center pt-6 border-t">
          <button onClick={() => setStep(2)} className="px-6 py-2 border rounded-lg hover:bg-slate-50">Back</button>
          <div className="flex gap-3">
             <button onClick={() => handleGeneratePDF()} className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 hover:bg-blue-700">
               <Download className="w-4 h-4" /> PDF (Current Option)
             </button>
             {directRoute.options.length > 1 && (
               <button onClick={() => directRoute.options.forEach((_, i) => handleGeneratePDF(i))} className="px-4 py-2 bg-slate-800 text-white rounded-lg flex items-center gap-2 hover:bg-slate-900">
                 <Download className="w-4 h-4" /> PDF (All Options)
               </button>
             )}
             <button onClick={handleSave} className="px-6 py-2 bg-teal-600 text-white rounded-lg flex items-center gap-2 hover:bg-teal-700">
               <Save className="w-4 h-4" /> Save Quote
             </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto backdrop-blur-sm">
      <div className="w-full max-w-7xl bg-white rounded-2xl shadow-2xl max-h-[95vh] flex flex-col my-8">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-gradient-to-r from-teal-50 to-emerald-50 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-teal-600 flex items-center justify-center shadow-lg shadow-teal-200">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">
                {editDocument ? 'Edit' : 'Create New'} {type === 'quote' ? 'Quote' : 'Invoice'}
              </h1>
              <p className="text-sm text-slate-600">Complex Freight Logistics Wizard</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/70 rounded-lg transition-colors">
            <X className="w-6 h-6 text-slate-500" />
          </button>
        </div>

        <div className="px-6 pt-6 pb-4 bg-slate-50/50">
          <div className="flex items-center gap-2 max-w-2xl mx-auto">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm transition-colors ${step >= 1 ? 'bg-teal-600 text-white' : 'bg-slate-200 text-slate-600'}`}>1</div>
            <div className={`h-1 flex-1 rounded ${step >= 2 ? 'bg-teal-600' : 'bg-slate-200'}`} />
            <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm transition-colors ${step >= 2 ? 'bg-teal-600 text-white' : 'bg-slate-200 text-slate-600'}`}>2</div>
            <div className={`h-1 flex-1 rounded ${step >= 3 ? 'bg-teal-600' : 'bg-slate-200'}`} />
            <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm transition-colors ${step >= 3 ? 'bg-teal-600 text-white' : 'bg-slate-200 text-slate-600'}`}>3</div>
          </div>
          <div className="flex justify-between mt-2 text-xs font-medium text-slate-500 max-w-2xl mx-auto px-1">
            <span>Mode & Type</span>
            <span>Route & Details</span>
            <span>Charges & Terms</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
          {step === 1 && renderFreightModeSelection()}
          {step === 2 && renderQuoteDetails()}
          {step === 3 && renderChargesAndTerms()}
        </div>
      </div>
    </div>
  );
}