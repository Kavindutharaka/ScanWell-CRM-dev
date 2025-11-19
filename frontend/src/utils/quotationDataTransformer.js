// utils/quotationDataTransformer.js

/**
 * Transforms QuoteInvoiceForm data into Quotation template format
 * @param {Object} formData - Data from QuoteInvoiceForm
 * @returns {Object} - Formatted data for QuotationTemplate
 */
export const transformQuoteDataForPDF = (formData) => {
  const {
    quoteData,
    directRoute,
    transitRoute,
    routePlanData,
    freightCharges,
    additionalCharges,
    termsConditions,
    customTerms,
    dropdownOptions
  } = formData;

  // Get customer details
  const customer = dropdownOptions.customers?.find(c => c.value === quoteData.customerId);
  const customerName = customer?.label || quoteData.customerName || 'N/A';

  // Get location details
  const pickupLocation = dropdownOptions.locations?.find(l => l.value === quoteData.pickupLocationId);
  const deliveryLocation = dropdownOptions.locations?.find(l => l.value === quoteData.deliveryLocationId);

  // Get route data based on freight category
  const activeRoute = quoteData.freightCategory === 'transit' ? transitRoute : directRoute;
  const pol = activeRoute?.portOfLoading?.portId || routePlanData?.origin?.airportPortCode || '-';
  const pod = activeRoute?.portOfDischarge?.portId || routePlanData?.destination?.airportPortCode || '-';
  const deliveryTerms = activeRoute?.portOfDischarge?.incoterm || activeRoute?.portOfLoading?.incoterm || '-';

  // Transform freight charges to template format
  const transformedFreightCharges = freightCharges.map(charge => ({
    carrier: charge.carrier || activeRoute?.portOfLoading?.carrier || '-',
    equip: charge.equipment || routePlanData?.origin?.equipment || '-',
    containers: charge.containers || 0,
    rate: charge.rate || 0,
    rateUnit: charge.rateUnit || 'per CBM',
    currency: charge.currency || activeRoute?.portOfLoading?.currency || 'USD',
    surcharge: charge.surcharge || '-',
    tt: charge.transitTime || routePlanData?.transitTime || '-',
    freq: charge.frequency || 'WEEKLY',
    route: quoteData.freightCategory?.toUpperCase() || 'DIRECT',
    comments: charge.comments || ''
  }));

  // Group additional charges by currency
  const groupedCharges = additionalCharges.reduce((acc, charge) => {
    const currency = charge.currency || 'USD';
    if (!acc[currency]) {
      acc[currency] = {
        items: [],
        total: 0
      };
    }
    
    const amount = parseFloat(charge.amount) || 0;
    acc[currency].items.push({
      name: charge.name || 'Additional Charge',
      amount: amount,
      unit: charge.unit || 'per Shipment'
    });
    acc[currency].total += amount;
    
    return acc;
  }, {});

  // Separate LKR and USD charges
  const otherCharges = {
    lkr: groupedCharges.LKR || { items: [], total: 0 },
    usd: groupedCharges.USD || { items: [], total: 0 }
  };

  // Combine all terms
  const allTerms = [
    ...termsConditions,
    ...customTerms.filter(t => t && t.trim())
  ];

  // Return transformed data
  return {
    company: {
      logoUrl: "", // Add your logo URL here
      name: "Scanwell Logistics Colombo (Pvt) Ltd.",
      address: "67/1 Hudson Road Colombo 3 Sri Lanka.",
      phone: "+94 11 2426600/4766400"
    },
    meta: {
      quoteNumber: quoteData.quoteId || 'N/A',
      serviceType: quoteData.freightMode || 'Freight Service',
      terms: quoteData.creditTermsId ? 
        dropdownOptions.creditTerms?.find(ct => ct.value === quoteData.creditTermsId)?.label || 'Credit Terms' 
        : 'Credit Terms'
    },
    customer: {
      name: customerName,
      address: customer?.address || 'N/A'
    },
    shipment: {
      pickupAddress: pickupLocation?.label || '',
      deliveryAddress: deliveryLocation?.label || '',
      pol: pol,
      pod: pod,
      deliveryTerms: deliveryTerms,
      pcs: parseInt(routePlanData?.origin?.totalPieces) || 0,
      volume: parseFloat(routePlanData?.origin?.cbm) || 0,
      grossWeight: parseFloat(routePlanData?.origin?.grossWeight) || 0,
      chargeableWeight: parseFloat(routePlanData?.origin?.chargeableWeight) || 0
    },
    freightCharges: transformedFreightCharges,
    otherCharges: otherCharges,
    termsAndConditions: allTerms,
    generatedBy: quoteData.createdBy || localStorage.getItem('username') || 'System'
  };
};

/**
 * Validates if quote data is ready for PDF generation
 * @param {Object} formData - Data from QuoteInvoiceForm
 * @returns {Object} - { isValid: boolean, errors: string[] }
 */
export const validateQuoteDataForPDF = (formData) => {
  const errors = [];

  if (!formData.quoteData?.quoteId) {
    errors.push('Quote ID is required');
  }

  if (!formData.quoteData?.customerId && !formData.quoteData?.customerName) {
    errors.push('Customer information is required');
  }

  if (!formData.quoteData?.freightMode) {
    errors.push('Freight mode is required');
  }

  if (!formData.quoteData?.freightCategory) {
    errors.push('Freight category is required');
  }

  if (!formData.freightCharges || formData.freightCharges.length === 0) {
    errors.push('At least one freight charge is required');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};