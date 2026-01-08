// src/Features/Quotes/utils/pdfGenerator.js
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import logo from '../../../assets/images/logo.png';

/**
 * Add Air Freight Charges Table for Transit/MultiModal (Pivoted by Carrier)
 */
function addAirFreightChargesTableTransit(doc, chargesData, yPos, segmentNum) {
  // Handle both old format (direct array) and new format (tables with charges)
  let charges = [];
  if (Array.isArray(chargesData)) {
    if (chargesData.length > 0 && chargesData[0].charges) {
      // New format: array of tables
      chargesData.forEach(table => {
        if (table.charges) {
          charges = charges.concat(table.charges);
        }
      });
    } else {
      // Old format or direct array
      charges = chargesData;
    }
  }
  
  const validCharges = charges.filter(c => c.carrier || c.unitType || c.amount);
  
  if (validCharges.length === 0) {
    return yPos;
  }
  
  if (yPos > 230) {
    doc.addPage();
    yPos = 20;
  }
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(`Freight Charges (Segment ${segmentNum})`, 15, yPos);
  yPos += 3;
  
  // Collect all unique unit types and sort them
  const allUnitTypes = new Set();
  validCharges.forEach(charge => {
    if (charge.unitType) {
      allUnitTypes.add(charge.unitType);
    }
  });
  
  // Convert to sorted array - try to sort numerically for weight breaks
  const unitTypeColumns = Array.from(allUnitTypes).sort((a, b) => {
    // Try to extract numbers for sorting
    const numA = parseFloat(a.replace(/[^0-9.-]/g, ''));
    const numB = parseFloat(b.replace(/[^0-9.-]/g, ''));
    if (!isNaN(numA) && !isNaN(numB)) {
      return numA - numB;
    }
    return a.localeCompare(b);
  });
  
  // If no unit types found, use standard ones
  if (unitTypeColumns.length === 0) {
    unitTypeColumns.push('-45', '45', '100', '300', '500', '1000');
  }
  
  // Group charges by carrier
  const carrierGroups = {};
  validCharges.forEach(charge => {
    const carrier = charge.carrier || 'N/A';
    if (!carrierGroups[carrier]) {
      carrierGroups[carrier] = {
        carrier: carrier,
        currency: charge.currency || '',
        unitTypes: {},
        surcharge: charge.surcharge || '',
        transitTime: charge.transitTime || '',
        frequency: charge.frequency || '',
        routing: charge.numberOfRouting || '',
        remarks: formatRemarksWithBreaks(charge.remarks || '')
      };
    }
    
    // Store amount by unit type
    const unitType = charge.unitType || '';
    if (unitType) {
      carrierGroups[carrier].unitTypes[unitType] = charge.amount || '';
    }
  });
  
  // Build table data
  const tableData = Object.values(carrierGroups).map(group => {
    const row = [
      group.carrier,
      group.currency
    ];
    
    // Add unit type values
    unitTypeColumns.forEach(unitType => {
      row.push(group.unitTypes[unitType] || '');
    });
    
    // Add remaining columns
    row.push(group.surcharge);
    row.push(group.transitTime);
    row.push(group.frequency);
    row.push(group.routing);
    row.push(group.remarks);
    
    return row;
  });
  
  // Build headers
  const headers = ['AIRLINE', 'CCY'];
  headers.push(...unitTypeColumns);
  headers.push('SURCHARGES', 'T/T', 'FREQUENCY', 'ROUTING', 'REMARKS');
  
  // Calculate column widths dynamically based on number of unit types
  const numUnitTypes = unitTypeColumns.length;
  const unitTypeWidth = numUnitTypes > 6 ? 10 : 12;
  
  const columnStyles = {
    0: { cellWidth: 15 },  // AIRLINE
    1: { cellWidth: 10 }   // CCY
  };
  
  // Unit type columns
  for (let i = 0; i < numUnitTypes; i++) {
    columnStyles[2 + i] = { cellWidth: unitTypeWidth };
  }
  
  // Remaining columns
  columnStyles[2 + numUnitTypes] = { cellWidth: 16 };  // SURCHARGES
  columnStyles[3 + numUnitTypes] = { cellWidth: 10 };  // T/T
  columnStyles[4 + numUnitTypes] = { cellWidth: 13 };  // FREQUENCY
  columnStyles[5 + numUnitTypes] = { cellWidth: 15 };  // ROUTING
  columnStyles[6 + numUnitTypes] = { cellWidth: 28, overflow: 'linebreak' };  // REMARKS - much wider
  
  autoTable(doc, {
    startY: yPos,
    head: [headers],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [200, 200, 200], textColor: 0, fontSize: 6.5, fontStyle: 'bold' },
    bodyStyles: { fontSize: 6.5, overflow: 'linebreak', cellPadding: 1.5 },
    columnStyles: columnStyles,
    margin: { left: 15, right: 15 }
  });
  
  return doc.lastAutoTable.finalY + 8;
}

/**
 * Add Freight Charges Table for Transit/MultiModal
 * Handles freightChargesTables format with different field names
 */
function addFreightChargesTableTransit(doc, charges, yPos, isAir, segmentNum) {
  
  // Check if charges have carrier/unitType format or chargeableWeight format
  const hasCarrierFormat = charges.some(c => c.carrier || c.unitType || c.amount);
  const hasWeightFormat = charges.some(c => c.chargeableWeight || c.weightBreaker || c.charge);
  
  
  // Use specialized Air table ONLY for air freight with carrier/unitType format
  // If data has chargeableWeight format, use regular table even for air mode
  if (isAir && hasCarrierFormat && !hasWeightFormat) {
    return addAirFreightChargesTableTransit(doc, charges, yPos, segmentNum);
  }
  
  
  // Handle carrier/unitType format (like Direct quotes)
  if (hasCarrierFormat) {
    const validCharges = charges.filter(c => c.carrier || c.unitType || c.amount);
    
    if (validCharges.length === 0) {
      return yPos;
    }
    
    if (yPos > 230) {
      doc.addPage();
      yPos = 20;
    }
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(`Freight Charges (Segment ${segmentNum})`, 15, yPos);
    yPos += 3;
    
    const tableData = validCharges.map(charge => {
      const units = charge.numberOfUnits || '';
      const total = calculateChargeTotal(charge);
      
      const row = [
        charge.carrier || '',
        charge.unitType || '',
        units,
        charge.amount || '',
        charge.currency || '',
        charge.transitTime || '',
        charge.numberOfRouting || ''
      ];
      
      row.push(Math.round(total).toString());
      row.push(formatRemarksWithBreaks(charge.remarks || ''));
      return row;
    });
    
    const headers = ['Carrier', 'Unit Type', 'Units', 'Amount', 'Currency', 'Transit', 'Routing', 'Total', 'Remarks'];
    
    autoTable(doc, {
      startY: yPos,
      head: [headers],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [200, 200, 200], textColor: 0, fontSize: 7, fontStyle: 'bold' },
      bodyStyles: { fontSize: 6.5, overflow: 'linebreak', cellPadding: 1.5 },
      columnStyles: {
        0: { cellWidth: 16 },  // Carrier
        1: { cellWidth: 13 },  // Unit Type
        2: { cellWidth: 8 },   // Units
        3: { cellWidth: 12 },  // Amount
        4: { cellWidth: 13 },  // Currency
        5: { cellWidth: 12 },  // Transit
        6: { cellWidth: 14 },  // Routing
        7: { cellWidth: 11 },  // Total
        8: { cellWidth: 63, overflow: 'linebreak', fontSize: 6.5 }  // Remarks - much wider
      },
      margin: { left: 15, right: 15 }
    });
    
    return doc.lastAutoTable.finalY + 8;
  }
  
  // Handle chargeableWeight format (original Transit format)
  if (hasWeightFormat) {
    const validCharges = charges.filter(c => c.chargeableWeight || c.weightBreaker || c.charge);
    
    if (validCharges.length === 0) {
      return yPos;
    }
    
    if (yPos > 230) {
      doc.addPage();
      yPos = 20;
    }
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(`Freight Charges (Segment ${segmentNum})`, 15, yPos);
    yPos += 3;
    
    const tableData = validCharges.map(charge => {
      // Calculate total: chargeableWeight * charge
      const weight = parseFloat(charge.chargeableWeight) || 0;
      const rate = parseFloat(charge.charge) || 0;
      const total = weight * rate;
      
      return [
        charge.chargeableWeight || '',
        charge.weightBreaker || '',
        charge.pricingUnit || '',
        charge.charge || '',
        charge.currency || 'USD',
        Math.round(total).toString(),
        formatRemarksWithBreaks(charge.remarks || '')
      ];
    });
    
    autoTable(doc, {
      startY: yPos,
      head: [['Chargeable Weight', 'Weight Breaker', 'Pricing Unit', 'Charge', 'Currency', 'Total', 'Remarks']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [200, 200, 200], textColor: 0, fontSize: 7, fontStyle: 'bold' },
      bodyStyles: { fontSize: 6.5, overflow: 'linebreak', cellPadding: 1.5 },
      columnStyles: {
        0: { cellWidth: 22 },
        1: { cellWidth: 22 },
        2: { cellWidth: 22 },
        3: { cellWidth: 18 },
        4: { cellWidth: 16 },
        5: { cellWidth: 18 },
        6: { cellWidth: 42, overflow: 'linebreak' }  // Much wider for Remarks
      },
      margin: { left: 15, right: 15 }
    });
    
    return doc.lastAutoTable.finalY + 8;
  }
  
  // No valid charges found
  return yPos;
}

/**
 * Calculate total for transit/multimodal quotes with new structure
 * Includes: Origin Handling + Destination Handling
 * Excludes: Freight Charges
 */
function calculateTransitTotalNew(segments) {
  let total = 0;
  
  segments.forEach(segment => {
    // Origin handling
    if (segment.originHandling) {
      segment.originHandling.forEach(charge => {
        total += calculateChargeTotal(charge);
      });
    }
    
    // Destination handling
    if (segment.destinationHandling) {
      segment.destinationHandling.forEach(charge => {
        total += calculateChargeTotal(charge);
      });
    }
    
    // NOTE: Freight charges are NOT included in total
  });
  
  return total;
}

/**
 * Get currency from transit/multimodal segments (from origin or destination handling)
 */
function getSegmentsCurrency(segments) {
  for (const segment of segments) {
    // Check destination handling first
    if (segment.destinationHandling && segment.destinationHandling.length > 0) {
      const currency = segment.destinationHandling[0]?.currency;
      if (currency) return currency;
    }
    // Then check origin handling
    if (segment.originHandling && segment.originHandling.length > 0) {
      const currency = segment.originHandling[0]?.currency;
      if (currency) return currency;
    }
  }
  return 'USD'; // Default to USD
}

/**
 * Format remarks text with line breaks for better display
 * Splits at numbered points (01., 02., etc.) and long sections
 */
const formatRemarksWithBreaks = (remarks) => {
  if (!remarks || remarks.trim() === '') return '';
  
  let formatted = remarks;
  
  // Add line breaks before numbered items (01., 02., 03., etc.)
  formatted = formatted.replace(/(\d{2}\.\s)/g, '\n$1');
  
  // Remove leading line break if exists
  formatted = formatted.replace(/^\n/, '');
  
  // Also break at common separators if line is too long
  if (formatted.length > 60) {
    // Break after periods followed by space if not part of numbers
    formatted = formatted.replace(/(\.\s)(?=\D)/g, '$1\n');
    // Remove excessive line breaks (more than 2 consecutive)
    formatted = formatted.replace(/\n{3,}/g, '\n\n');
  }
  
  return formatted.trim();
};

/**
 * Extract charges from table structures used in Transit routes
 * Converts location-based table format to charge array format
 */
const extractChargesFromTables = (tables, chargeType = 'handling') => {
  
  if (!tables || tables.length === 0) {
    return [];
  }
  
  const allCharges = [];
  
  tables.forEach((table, idx) => {
    
    // Handle Transit format: freight charges with nested charges array
    if (table.charges && Array.isArray(table.charges)) {
      allCharges.push(...table.charges);
      return;
    }
    
    // Handle MultiModal format: freight charges with direct fields (no nested charges array)
    if (chargeType === 'freight' && (table.chargeableWeight || table.weightBreaker || table.charge)) {
      // This is a direct freight charge object (MultiModal format)
      allCharges.push(table);
      return;
    }
    
    // Handle handling/destination charges (location-based format)
    const locations = Object.keys(table.chargeNamePerLocation || {});
    
    locations.forEach(location => {
      const chargeName = table.chargeNamePerLocation?.[location];
      const unitType = table.unitTypePerLocation?.[location];
      const units = table.unitsPerLocation?.[location];
      const amount = table.amountPerLocation?.[location];
      const currency = table.currencyPerLocation?.[location];
      
      // Only add if there's actual data
      if (chargeName || amount) {
        allCharges.push({
          chargeName: chargeName || '',
          unitType: unitType || '',
          numberOfUnits: units || '',
          amount: amount || '',
          currency: currency || '',
          total: 0,
          remark: ''
        });
      }
    });
  });
  
  return allCharges;
};

/**
 * Calculate total for a charge
 */
const calculateChargeTotal = (charge) => {
  // If total is already calculated and non-zero, use it
  if (charge.total && parseFloat(charge.total) > 0) {
    return parseFloat(charge.total);
  }
  
  // Calculate: numberOfUnits * amount
  const units = parseFloat(charge.numberOfUnits) || 1; // Default to 1 if empty
  const amount = parseFloat(charge.amount) || 0;
  
  return units * amount;
};

/**
 * Format amount based on currency
 * All currencies: no decimals (e.g., 2075, 18000)
 */
const formatCurrencyAmount = (amount, currency) => {
  return Math.round(amount).toString();
};

/**
 * Common header for all PDFs
 */
const addPDFHeader = (doc, quoteData) => {
  let yPos = 15;
  
  // Logo - maintaining aspect ratio (original: 367 x 72, ratio 5.097:1)
  doc.addImage(logo, 'PNG', 15, yPos, 50, 10);
  
  // Company Info
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Scanwell Logistics Colombo (Pvt) Ltd.', 195, yPos + 2, { align: 'right' });
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('67/1 Hudson Road Colombo 3 Sri Lanka.', 195, yPos + 7, { align: 'right' });
  doc.text('Office #+94 11 2426600/4766400', 195, yPos + 12, { align: 'right' });
  
  yPos += 25;
  
  // Title
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('QUOTATION', 105, yPos, { align: 'center' });
  
  return yPos + 12;
};

/**
 * Add customer section
 */
const addCustomerSection = (doc, quoteData, yPos) => {
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(quoteData.quoteNumber || 'N/A', 15, yPos);
  
  const isAir = quoteData.freightCategory === 'air';
  const freightLabel = isAir ? 'Air' : 'Sea';
  const modeLabel = quoteData.freightMode?.charAt(0).toUpperCase() + quoteData.freightMode?.slice(1);
  const typeLabel = quoteData.freightType?.toUpperCase();
  const typeText = `${freightLabel} ${modeLabel} ${typeLabel}`;
  
  doc.text(typeText, 195, yPos, { align: 'right' });
  
  yPos += 5;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Credit Terms', 195, yPos, { align: 'right' });
  
  if (quoteData.rateValidity) {
    yPos += 4;
    const validityDate = new Date(quoteData.rateValidity).toLocaleDateString('en-GB');
    doc.text(`Rate Validity: ${validityDate}, 05:30`, 195, yPos, { align: 'right' });
  }
  
  yPos += 10;
  
  // Customer and Address
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Customer', 15, yPos);
  
  // Add Customer Address label if address exists
  if (quoteData.customerAddress && quoteData.customerAddress.trim() !== '') {
    doc.text('Customer Address', 130, yPos);
  }
  
  doc.setFont('helvetica', 'normal');
  yPos += 4;
  
  const customerNameYPos = yPos;
  doc.text(quoteData.customer || 'N/A', 15, yPos);
  
  // Customer Address - display to the right of customer name
  let addressLineCount = 0;
  if (quoteData.customerAddress && quoteData.customerAddress.trim() !== '') {
    doc.setFont('helvetica', 'normal');
    const addressLines = doc.splitTextToSize(quoteData.customerAddress, 70);
    addressLines.forEach((line, index) => {
      doc.text(line, 130, customerNameYPos + (index * 4));
    });
    addressLineCount = addressLines.length;
  }
  
  // Advance yPos by the maximum of customer name line or address lines
  const maxLines = Math.max(1, addressLineCount);
  yPos += (maxLines * 4) + 4;
  
  // Addresses
  doc.setFont('helvetica', 'bold');
  doc.text('Pickup Address', 15, yPos);
  doc.text('Delivery Address', 130, yPos);
  doc.setFont('helvetica', 'normal');
  yPos += 4;
  doc.text(quoteData.pickupLocation || 'N/A', 15, yPos);
  doc.text(quoteData.deliveryLocation || 'N/A', 130, yPos);
  
  yPos += 8;
  
  return yPos;
};

/**
 * Generate PDF for Direct Quotes
 */
export const generateDirectQuotePDF = (quoteData) => {
  const doc = new jsPDF();
  let yPos = addPDFHeader(doc, quoteData);
  
  yPos = addCustomerSection(doc, quoteData, yPos);
  
  // Parse data - handle both old and new formats
  const equipment = quoteData.equipment ? JSON.parse(quoteData.equipment) : {};
  const terms = quoteData.termsConditions ? JSON.parse(quoteData.termsConditions) : [];
  const isAir = quoteData.freightCategory === 'air';
  
  // Check for new carrierOptions format
  let carrierOptions = [];
  if (quoteData.carrierOptions) {
    carrierOptions = JSON.parse(quoteData.carrierOptions);
  } else {
    // Old format - convert to new format
    const carriers = quoteData.carriers ? JSON.parse(quoteData.carriers) : [];
    const freightCharges = quoteData.freightCharges ? JSON.parse(quoteData.freightCharges) : [];
    const destinationCharges = quoteData.destinationCharges ? JSON.parse(quoteData.destinationCharges) : [];
    const originHandling = quoteData.originHandling ? JSON.parse(quoteData.originHandling) : [];
    const destinationHandling = quoteData.destinationHandling ? JSON.parse(quoteData.destinationHandling) : [];
    
    // Create single option from old format
    if (carriers.length > 0 || freightCharges.length > 0) {
      carrierOptions = [{
        carrier: carriers[0]?.carrier || '',
        incoterm: carriers[0]?.incoterm || '',
        currency: carriers[0]?.currency || '',
        cargoType: carriers[0]?.cargoType || '',
        freightCharges: freightCharges,
        destinationCharges: destinationCharges,
        originHandling: originHandling,
        destinationHandling: destinationHandling
      }];
    }
  }
  
  // Line separator
  doc.line(15, yPos, 195, yPos);
  yPos += 5;
  
  // Port Details
  doc.setFont('helvetica', 'bold');
  doc.text('Port of Loading', 15, yPos);
  doc.text('Port of Discharge', 130, yPos);
  doc.setFont('helvetica', 'normal');
  yPos += 4;
  doc.text(quoteData.portOfLoading || 'N/A', 15, yPos);
  doc.text(quoteData.portOfDischarge || 'N/A', 130, yPos);
  
  yPos += 8;
  
  // Equipment
  doc.setFont('helvetica', 'bold');
  doc.text('Equipment', 15, yPos);
  doc.text('Units', 70, yPos);
  doc.text('Gross Weight', 95, yPos);
  doc.text('Volume (m³)', 135, yPos);
  doc.text('Chargeable Weight', 165, yPos);
  
  yPos += 4;
  doc.setFont('helvetica', 'normal');
  doc.text(equipment.equipment || 'N/A', 15, yPos);
  doc.text(equipment.units || '0', 70, yPos);
  doc.text(equipment.grossWeight || '0', 95, yPos);
  doc.text(equipment.volume || '0', 135, yPos);
  doc.text(equipment.chargeableWeight || '0', 165, yPos);
  
  yPos += 10;
  
  // Carrier Options or Old Format Charges
  if (carrierOptions.length > 0) {
    carrierOptions.forEach((option, optionIndex) => {
      if (yPos > 240) {
        doc.addPage();
        yPos = 20;
      }
      
      // Option Header (only if multiple options)
      if (carrierOptions.length > 1) {
        doc.setFillColor(230, 230, 230);
        doc.rect(15, yPos - 3, 180, 7, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text(`${isAir ? 'Airline' : 'Carrier'} Option [${optionIndex + 1}]`, 18, yPos + 2);
        yPos += 10;
      }
      
      // Carrier Details (if exists)
      if (option.carrier || option.incoterm || option.currency || option.cargoType) {
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        yPos += 2;
        
        doc.setFont('helvetica', 'normal');
        let detailsText = [];
        if (option.carrier) detailsText.push(`${isAir ? 'Airline' : 'Carrier'}: ${option.carrier}`);
        if (option.incoterm) detailsText.push(`Incoterm: ${option.incoterm}`);
        if (option.currency) detailsText.push(`Currency: ${option.currency}`);
        if (option.cargoType) detailsText.push(`Cargo Type: ${option.cargoType}`);
        
        if (detailsText.length > 0) {
          doc.text(detailsText.join('  |  '), 15, yPos);
          yPos += 8;
        }
      }
      
      // Freight Charges
      yPos = addFreightChargesTable(doc, option.freightCharges || [], yPos, isAir);
      
      // Destination Charges
      yPos = addOtherChargesTable(doc, option.destinationCharges || [], 'Destination Charges (POD)', yPos);
      
      // Origin Handling
      yPos = addOtherChargesTable(doc, option.originHandling || [], 'Origin Handling Charges', yPos);
      
      // Destination Handling
      yPos = addOtherChargesTable(doc, option.destinationHandling || [], 'Destination Handling Charges', yPos);
      
    });
  }
  
  // Terms & Conditions
  if (terms.length > 0) {
    if (yPos > 240) {
      doc.addPage();
      yPos = 20;
    }
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Terms & Conditions:', 15, yPos);
    yPos += 5;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    terms.forEach(term => {
      const lines = doc.splitTextToSize(`- ${term}`, 170);
      lines.forEach(line => {
        if (yPos > 280) {
          doc.addPage();
          yPos = 20;
        }
        doc.text(line, 15, yPos);
        yPos += 4;
      });
    });
  }
  
  // Footer
  yPos = 280;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.text('Quotation generated by - System', 15, yPos);
  doc.text('This is a Computer generated Document and no Signature required.', 15, yPos + 4);
  
  // Save
  doc.save(`${quoteData.quoteNumber || 'Quote'}.pdf`);
};

/**
 * Add Air Freight Charges Table (Pivoted by Carrier and Unit Type)
 */
function addAirFreightChargesTable(doc, charges, yPos) {
  const validCharges = charges.filter(c => c.carrier || c.unitType || c.amount);
  
  if (validCharges.length === 0) {
    return yPos;
  }
  
  if (yPos > 230) {
    doc.addPage();
    yPos = 20;
  }
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Freight Charges', 15, yPos);
  yPos += 3;
  
  // Collect all unique unit types and sort them
  const allUnitTypes = new Set();
  validCharges.forEach(charge => {
    if (charge.unitType) {
      allUnitTypes.add(charge.unitType);
    }
  });
  
  // Convert to sorted array - try to sort numerically for weight breaks
  const unitTypeColumns = Array.from(allUnitTypes).sort((a, b) => {
    // Try to extract numbers for sorting
    const numA = parseFloat(a.replace(/[^0-9.-]/g, ''));
    const numB = parseFloat(b.replace(/[^0-9.-]/g, ''));
    if (!isNaN(numA) && !isNaN(numB)) {
      return numA - numB;
    }
    return a.localeCompare(b);
  });
  
  // If no unit types found, use standard ones
  if (unitTypeColumns.length === 0) {
    unitTypeColumns.push('-45', '45', '100', '300', '500', '1000');
  }
  
  // Group charges by carrier
  const carrierGroups = {};
  validCharges.forEach(charge => {
    const carrier = charge.carrier || 'N/A';
    if (!carrierGroups[carrier]) {
      carrierGroups[carrier] = {
        carrier: carrier,
        currency: charge.currency || '',
        unitTypes: {},
        surcharge: charge.surcharge || '',
        transitTime: charge.transitTime || '',
        frequency: charge.frequency || '',
        routing: charge.numberOfRouting || '',
        remarks: formatRemarksWithBreaks(charge.remarks || '')
      };
    }
    
    // Store amount by unit type
    const unitType = charge.unitType || '';
    if (unitType) {
      carrierGroups[carrier].unitTypes[unitType] = charge.amount || '';
    }
  });
  
  // Build table data
  const tableData = Object.values(carrierGroups).map(group => {
    const row = [
      group.carrier,
      group.currency
    ];
    
    // Add unit type values
    unitTypeColumns.forEach(unitType => {
      row.push(group.unitTypes[unitType] || '');
    });
    
    // Add remaining columns
    row.push(group.surcharge);
    row.push(group.transitTime);
    row.push(group.frequency);
    row.push(group.routing);
    row.push(group.remarks);
    
    return row;
  });
  
  // Build headers
  const headers = ['AIRLINE', 'CCY'];
  headers.push(...unitTypeColumns);
  headers.push('SURCHARGES', 'T/T', 'FREQUENCY', 'ROUTING', 'REMARKS');
  
  // Calculate column widths dynamically based on number of unit types
  const numUnitTypes = unitTypeColumns.length;
  const unitTypeWidth = numUnitTypes > 6 ? 10 : 12;
  
  const columnStyles = {
    0: { cellWidth: 15 },  // AIRLINE
    1: { cellWidth: 10 }   // CCY
  };
  
  // Unit type columns
  for (let i = 0; i < numUnitTypes; i++) {
    columnStyles[2 + i] = { cellWidth: unitTypeWidth };
  }
  
  // Remaining columns
  columnStyles[2 + numUnitTypes] = { cellWidth: 16 };  // SURCHARGES
  columnStyles[3 + numUnitTypes] = { cellWidth: 10 };  // T/T
  columnStyles[4 + numUnitTypes] = { cellWidth: 13 };  // FREQUENCY
  columnStyles[5 + numUnitTypes] = { cellWidth: 15 };  // ROUTING
  columnStyles[6 + numUnitTypes] = { cellWidth: 28, overflow: 'linebreak' };  // REMARKS - much wider
  
  autoTable(doc, {
    startY: yPos,
    head: [headers],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [200, 200, 200], textColor: 0, fontSize: 6.5, fontStyle: 'bold' },
    bodyStyles: { fontSize: 6.5, overflow: 'linebreak', cellPadding: 1.5 },
    columnStyles: columnStyles,
    margin: { left: 15, right: 15 }
  });
  
  return doc.lastAutoTable.finalY + 8;
}

/**
 * Add Freight Charges Table
 */
function addFreightChargesTable(doc, charges, yPos, isAir) {
  // Use specialized Air table for air freight
  if (isAir) {
    return addAirFreightChargesTable(doc, charges, yPos);
  }
  
  // Filter out empty charges
  const validCharges = charges.filter(c => c.carrier || c.unitType || c.amount);
  
  if (validCharges.length === 0) {
    return yPos;
  }
  
  if (yPos > 230) {
    doc.addPage();
    yPos = 20;
  }
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Freight Charges', 15, yPos);
  yPos += 3;
  
  const tableData = validCharges.map(charge => {
    const units = charge.numberOfUnits || '';
    const total = calculateChargeTotal(charge);
    
    const row = [
      charge.carrier || '',
      charge.unitType || '',
      units,
      charge.amount || '',
      charge.currency || '',
      charge.transitTime || '',
      charge.numberOfRouting || ''
    ];
    
    row.push(Math.round(total).toString());
    row.push(formatRemarksWithBreaks(charge.remarks || ''));
    return row;
  });
  
  const headers = ['Carrier', 'Unit Type', 'Units', 'Amount', 'Currency', 'Transit', 'Routing', 'Total', 'Remarks'];
  
  autoTable(doc, {
    startY: yPos,
    head: [headers],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [200, 200, 200], textColor: 0, fontSize: 7, fontStyle: 'bold' },
    bodyStyles: { fontSize: 6.5, overflow: 'linebreak', cellPadding: 1.5 },
    columnStyles: {
      0: { cellWidth: 16 },  // Carrier
      1: { cellWidth: 13 },  // Unit Type
      2: { cellWidth: 8 },   // Units
      3: { cellWidth: 12 },  // Amount
      4: { cellWidth: 13 },  // Currency
      5: { cellWidth: 12 },  // Transit
      6: { cellWidth: 14 },  // Routing
      7: { cellWidth: 11 },  // Total
      8: { cellWidth: 63, overflow: 'linebreak', fontSize: 6.5 }  // Remarks - much wider
    },
    margin: { left: 15, right: 15 }
  });
  
  return doc.lastAutoTable.finalY + 8;
}

/**
 * Add Other Charges Table (Destination, Origin Handling, etc.)
 */
function addOtherChargesTable(doc, charges, title, yPos) {
  // Filter out empty charges
  const validCharges = charges.filter(c => c.chargeName || c.amount);
  
  if (validCharges.length === 0) {
    return yPos;
  }
  
  if (yPos > 230) {
    doc.addPage();
    yPos = 20;
  }
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(title, 15, yPos);
  yPos += 3;
  
  const tableData = validCharges.map(charge => {
    const units = charge.numberOfUnits || (charge.unitType === 'SHIPMENT' ? '1' : '');
    const total = calculateChargeTotal(charge);
    
    return [
      charge.chargeName || '',
      charge.unitType || '',
      units,
      charge.amount || '',
      charge.currency || '',
      Math.round(total).toString(),
      formatRemarksWithBreaks(charge.remark || '')
    ];
  });
  
  autoTable(doc, {
    startY: yPos,
    head: [['Charge Name', 'Unit Type', 'Units', 'Amount', 'Currency', 'Total', 'Remark']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [200, 200, 200], textColor: 0, fontSize: 7, fontStyle: 'bold' },
    bodyStyles: { fontSize: 6.5, overflow: 'linebreak', cellPadding: 1.5 },
    columnStyles: {
      0: { cellWidth: 36 },
      1: { cellWidth: 22 },
      2: { cellWidth: 12 },
      3: { cellWidth: 18 },
      4: { cellWidth: 16 },
      5: { cellWidth: 18 },
      6: { cellWidth: 48, overflow: 'linebreak' }  // Much wider for Remark
    },
    margin: { left: 15, right: 15 }
  });
  
  return doc.lastAutoTable.finalY + 8;
}

/**
 * Calculate option total
 */
function calculateOptionTotal(option) {
  let total = 0;
  
  // Destination charges (POD)
  if (option.destinationCharges) {
    option.destinationCharges.forEach(charge => {
      total += calculateChargeTotal(charge);
    });
  }
  
  // Origin handling
  if (option.originHandling) {
    option.originHandling.forEach(charge => {
      total += calculateChargeTotal(charge);
    });
  }
  
  // Destination handling
  if (option.destinationHandling) {
    option.destinationHandling.forEach(charge => {
      total += calculateChargeTotal(charge);
    });
  }
  
  // NOTE: Freight charges are NOT included in total
  
  return total;
}

/**
 * Generate PDF for Transit Quotes
 */
export const generateTransitQuotePDF = (quoteData) => {
  const doc = new jsPDF();
  let yPos = addPDFHeader(doc, quoteData);
  
  yPos = addCustomerSection(doc, quoteData, yPos);
  
  const equipment = quoteData.equipment ? JSON.parse(quoteData.equipment) : {};
  const terms = quoteData.termsConditions ? JSON.parse(quoteData.termsConditions) : [];
  
  // Parse routes - handle nested structure
  let routesData = [];
  let allSegments = [];
  
  // Try TransitRoutes first, then routes
  const routesField = quoteData.transitRoutes || quoteData.routes;
  if (routesField) {
    const parsedRoutes = JSON.parse(routesField);
    if (Array.isArray(parsedRoutes) && parsedRoutes.length > 0) {
      // Direct array of routes
      routesData = parsedRoutes;
      allSegments = parsedRoutes;
      
      // OR Extract routes array from nested structure
      if (parsedRoutes[0].routes) {
        routesData = parsedRoutes[0].routes;
        allSegments = parsedRoutes[0].routes;
      }
    }
  }
  
  doc.line(15, yPos, 195, yPos);
  yPos += 5;
  
  // Route Segments Display
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Route Segments', 15, yPos);
  yPos += 5;
  
  doc.setFont('helvetica', 'normal');
  if (routesData.length > 0) {
    const routeText = routesData.map(r => r.origin || 'N/A').concat([routesData[routesData.length - 1]?.destination || 'N/A']).join(' → ');
    const routeLines = doc.splitTextToSize(routeText, 170);
    routeLines.forEach(line => {
      doc.text(line, 15, yPos);
      yPos += 4;
    });
  }
  
  yPos += 6;
  
  // Equipment (top level or first segment)
  const topEquipment = equipment.equipment ? equipment : (allSegments[0]?.equipment || {});
  doc.setFont('helvetica', 'bold');
  doc.text('Equipment', 15, yPos);
  doc.text('Units', 70, yPos);
  doc.text('Gross Weight', 95, yPos);
  doc.text('Volume (m³)', 135, yPos);
  doc.text('Chargeable Weight', 165, yPos);
  
  yPos += 4;
  doc.setFont('helvetica', 'normal');
  doc.text(topEquipment.equipment || equipment.equipment || 'N/A', 15, yPos);
  doc.text(equipment.units || topEquipment.units || '0', 70, yPos);
  doc.text(topEquipment.grossWeight || equipment.grossWeight || '0', 95, yPos);
  doc.text(topEquipment.volume || equipment.volume || '0', 135, yPos);
  doc.text(topEquipment.chargeableWeight || equipment.chargeableWeight || '0', 165, yPos);
  
  yPos += 10;
  
  // Process each segment
  allSegments.forEach((segment, index) => {
    if (yPos > 240) {
      doc.addPage();
      yPos = 20;
    }
    
    doc.setFillColor(200, 220, 240);
    doc.rect(15, yPos - 3, 180, 7, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    
    const segmentMode = segment.mode?.toUpperCase() || 'N/A';
    const segmentRoute = `${segment.origin || 'N/A'} → ${segment.destination || 'N/A'}`;
    doc.text(`Segment ${index + 1}: ${segmentMode} (${segmentRoute})`, 18, yPos + 2);
    yPos += 10;
    
    // Freight Charges - extract from freightChargesTables
    if (segment.freightChargesTables) {
    }
    
    let freightCharges = [];
    if (segment.freightChargesTables && Array.isArray(segment.freightChargesTables)) {
      freightCharges = extractChargesFromTables(segment.freightChargesTables, 'freight');
    } else if (segment.freightCharges) {
      freightCharges = segment.freightCharges;
    } else {
    }
    
    if (freightCharges.length > 0) {
      yPos = addFreightChargesTableTransit(doc, freightCharges, yPos, segment.mode === 'air', index + 1);
    } else {
    }
    
    // Origin Handling - extract from originHandlingTables
    let originHandling = [];
    if (segment.originHandlingTables && Array.isArray(segment.originHandlingTables)) {
      originHandling = extractChargesFromTables(segment.originHandlingTables, 'handling');
    } else if (segment.originHandling) {
      originHandling = segment.originHandling;
    }
    if (originHandling.length > 0) {
      yPos = addOtherChargesTable(doc, originHandling, `Seg${index + 1}: Origin Handling`, yPos);
    }
    
    // Destination Handling - extract from destinationHandlingTables
    let destinationHandling = [];
    if (segment.destinationHandlingTables && Array.isArray(segment.destinationHandlingTables)) {
      destinationHandling = extractChargesFromTables(segment.destinationHandlingTables, 'handling');
    } else if (segment.destinationHandling) {
      destinationHandling = segment.destinationHandling;
    }
    if (destinationHandling.length > 0) {
      yPos = addOtherChargesTable(doc, destinationHandling, `Seg${index + 1}: Destination Handling`, yPos);
    }
    
    // Destination Charges (POD) - extract from destinationChargesTables
    let destinationCharges = [];
    if (segment.destinationChargesTables && Array.isArray(segment.destinationChargesTables)) {
      destinationCharges = extractChargesFromTables(segment.destinationChargesTables, 'handling');
    } else if (segment.destinationCharges) {
      destinationCharges = segment.destinationCharges;
    }
    if (destinationCharges.length > 0) {
      yPos = addOtherChargesTable(doc, destinationCharges, `Seg${index + 1}: Destination Charges (POD)`, yPos);
    }
    
    yPos += 5;
  });
  
  
  // Terms
  if (terms.length > 0) {
    yPos += 10;
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Terms & Conditions:', 15, yPos);
    yPos += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    terms.forEach(term => {
      const lines = doc.splitTextToSize(`- ${term}`, 170);
      lines.forEach(line => {
        if (yPos > 280) {
          doc.addPage();
          yPos = 20;
        }
        doc.text(line, 15, yPos);
        yPos += 4;
      });
    });
  }
  
  // Footer
  const finalY = 280;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.text('Quotation generated by - System', 15, finalY);
  doc.text('This is a Computer generated Document and no Signature required.', 15, finalY + 4);
  
  doc.save(`${quoteData.quoteNumber || 'Transit-Quote'}.pdf`);
};

/**
 * Generate PDF for MultiModal Quotes
 */
export const generateMultiModalQuotePDF = (quoteData) => {
  const doc = new jsPDF();
  let yPos = addPDFHeader(doc, quoteData);
  
  yPos = addCustomerSection(doc, quoteData, yPos);
  
  const equipment = quoteData.equipment ? JSON.parse(quoteData.equipment) : {};
  const terms = quoteData.termsConditions ? JSON.parse(quoteData.termsConditions) : [];
  
  // Parse routes - handle nested structure (same as transit)
  let routesData = [];
  let allSegments = [];
  
  // Try TransitRoutes first, then routes
  const routesField = quoteData.transitRoutes || quoteData.routes;
  if (routesField) {
    const parsedRoutes = JSON.parse(routesField);
    if (Array.isArray(parsedRoutes) && parsedRoutes.length > 0) {
      // Direct array of routes
      routesData = parsedRoutes;
      allSegments = parsedRoutes;
      
      // OR Extract routes array from nested structure
      if (parsedRoutes[0].routes) {
        routesData = parsedRoutes[0].routes;
        allSegments = parsedRoutes[0].routes;
      }
    }
  }
  
  doc.line(15, yPos, 195, yPos);
  yPos += 5;
  
  // Route Segments Display
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Route Segments', 15, yPos);
  yPos += 5;
  
  doc.setFont('helvetica', 'normal');
  if (routesData.length > 0) {
    const routeText = routesData.map((r, idx) => {
      const mode = r.mode?.toUpperCase() || 'N/A';
      const route = `${r.origin || 'N/A'} → ${r.destination || 'N/A'}`;
      return `Seg ${idx + 1}: ${mode} (${route})`;
    }).join('  |  ');
    
    const routeLines = doc.splitTextToSize(routeText, 170);
    routeLines.forEach(line => {
      doc.text(line, 15, yPos);
      yPos += 4;
    });
  }
  
  yPos += 6;
  
  // Equipment (top level or first segment)
  const topEquipment = equipment.equipment ? equipment : (allSegments[0]?.equipment || {});
  doc.setFont('helvetica', 'bold');
  doc.text('Equipment', 15, yPos);
  doc.text('Units', 70, yPos);
  doc.text('Gross Weight', 95, yPos);
  doc.text('Volume (m³)', 135, yPos);
  doc.text('Chargeable Weight', 165, yPos);
  
  yPos += 4;
  doc.setFont('helvetica', 'normal');
  doc.text(topEquipment.equipment || equipment.equipment || 'N/A', 15, yPos);
  doc.text(equipment.units || topEquipment.units || '0', 70, yPos);
  doc.text(topEquipment.grossWeight || equipment.grossWeight || '0', 95, yPos);
  doc.text(topEquipment.volume || equipment.volume || '0', 135, yPos);
  doc.text(topEquipment.chargeableWeight || equipment.chargeableWeight || '0', 165, yPos);
  
  yPos += 10;
  
  // Process each segment
  allSegments.forEach((segment, index) => {
    if (yPos > 240) {
      doc.addPage();
      yPos = 20;
    }
    
    doc.setFillColor(200, 220, 240);
    doc.rect(15, yPos - 3, 180, 7, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    
    const segmentMode = segment.mode?.toUpperCase() || 'N/A';
    const segmentRoute = `${segment.origin || 'N/A'} → ${segment.destination || 'N/A'}`;
    doc.text(`Segment ${index + 1}: ${segmentMode} (${segmentRoute})`, 18, yPos + 2);
    yPos += 10;
    
    // Freight Charges - extract from freightChargesTables
    if (segment.freightChargesTables) {
    }
    
    let freightCharges = [];
    if (segment.freightChargesTables && Array.isArray(segment.freightChargesTables)) {
      freightCharges = extractChargesFromTables(segment.freightChargesTables, 'freight');
    } else if (segment.freightCharges) {
      freightCharges = segment.freightCharges;
    } else {
    }
    
    if (freightCharges.length > 0) {
      yPos = addFreightChargesTableTransit(doc, freightCharges, yPos, segment.mode === 'air', index + 1);
    } else {
    }
    
    
    // Origin Handling - extract from originHandlingTables
    let originHandling = [];
    if (segment.originHandlingTables && Array.isArray(segment.originHandlingTables)) {
      originHandling = extractChargesFromTables(segment.originHandlingTables, 'handling');
    } else if (segment.originHandling) {
      originHandling = segment.originHandling;
    }
    if (originHandling.length > 0) {
      yPos = addOtherChargesTable(doc, originHandling, `Seg${index + 1}: Origin Handling`, yPos);
    }
    
    // Destination Handling - extract from destinationHandlingTables
    let destinationHandling = [];
    if (segment.destinationHandlingTables && Array.isArray(segment.destinationHandlingTables)) {
      destinationHandling = extractChargesFromTables(segment.destinationHandlingTables, 'handling');
    } else if (segment.destinationHandling) {
      destinationHandling = segment.destinationHandling;
    }
    if (destinationHandling.length > 0) {
      yPos = addOtherChargesTable(doc, destinationHandling, `Seg${index + 1}: Destination Handling`, yPos);
    }
    
    // Destination Charges (POD) - extract from destinationChargesTables
    let destinationCharges = [];
    if (segment.destinationChargesTables && Array.isArray(segment.destinationChargesTables)) {
      destinationCharges = extractChargesFromTables(segment.destinationChargesTables, 'handling');
    } else if (segment.destinationCharges) {
      destinationCharges = segment.destinationCharges;
    }
    if (destinationCharges.length > 0) {
      yPos = addOtherChargesTable(doc, destinationCharges, `Seg${index + 1}: Destination Charges (POD)`, yPos);
    }
    
    yPos += 5;
  });
  
  
  // Terms
  if (terms.length > 0) {
    yPos += 10;
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Terms & Conditions:', 15, yPos);
    yPos += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    terms.forEach(term => {
      const lines = doc.splitTextToSize(`- ${term}`, 170);
      lines.forEach(line => {
        if (yPos > 280) {
          doc.addPage();
          yPos = 20;
        }
        doc.text(line, 15, yPos);
        yPos += 4;
      });
    });
  }
  
  // Footer
  const finalY = 280;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.text('Quotation generated by - System', 15, finalY);
  doc.text('This is a Computer generated Document and no Signature required.', 15, finalY + 4);
  
  doc.save(`${quoteData.quoteNumber || 'MultiModal-Quote'}.pdf`);
};