// src/Features/Quotes/utils/pdfGenerator.js
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import logo from '../../../assets/images/logo.png';

/**
 * Add Air Freight Charges Table for Transit/MultiModal (Pivoted by Carrier)
 */
function addAirFreightChargesTableTransit(doc, chargesData, yPos, segmentNum, tableName = null) {
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
  const title = tableName ? `Freight Charges - ${tableName} (Segment ${segmentNum})` : `Freight Charges (Segment ${segmentNum})`;
  doc.text(title, 15, yPos);
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
    const carrier = charge.carrier || '';
    if (!carrierGroups[carrier]) {
      carrierGroups[carrier] = {
        carrier: carrier,
        currency: charge.currency || '',
        minimum: charge.minimum || '',
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
      group.currency,
      group.minimum
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
  const headers = ['AIRLINE', 'CCY', 'M'];
  headers.push(...unitTypeColumns);
  headers.push('SURCHARGES', 'T/T', 'FREQUENCY', 'ROUTING', 'REMARKS');
  
  // Calculate column widths dynamically based on number of unit types
  const numUnitTypes = unitTypeColumns.length;
  const unitTypeWidth = numUnitTypes > 6 ? 10 : 12;
  
  const columnStyles = {
    0: { cellWidth: 15 },  // AIRLINE
    1: { cellWidth: 10 },  // CCY
    2: { cellWidth: 10 }   // M
  };
  
  // Unit type columns
  for (let i = 0; i < numUnitTypes; i++) {
    columnStyles[3 + i] = { cellWidth: unitTypeWidth };
  }
  
  // Remaining columns
  columnStyles[3 + numUnitTypes] = { cellWidth: 16 };  // SURCHARGES
  columnStyles[4 + numUnitTypes] = { cellWidth: 10 };  // T/T
  columnStyles[5 + numUnitTypes] = { cellWidth: 13 };  // FREQUENCY
  columnStyles[6 + numUnitTypes] = { cellWidth: 15 };  // ROUTING
  columnStyles[7 + numUnitTypes] = { cellWidth: 28, overflow: 'linebreak' };  // REMARKS - much wider
  
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
function addFreightChargesTableTransit(doc, charges, yPos, isAir, segmentNum, tableName = null) {
  
  // Check if charges have carrier/unitType format or chargeableWeight format
  const hasCarrierFormat = charges.some(c => c.carrier || c.unitType || c.amount);
  const hasWeightFormat = charges.some(c => c.chargeableWeight || c.weightBreaker || c.charge);
  
  
  // Use specialized Air table ONLY for air freight with carrier/unitType format
  // If data has chargeableWeight format, use regular table even for air mode
  if (isAir && hasCarrierFormat && !hasWeightFormat) {
    return addAirFreightChargesTableTransit(doc, charges, yPos, segmentNum, tableName);
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
    const title = tableName ? `Freight Charges - ${tableName} (Segment ${segmentNum})` : `Freight Charges (Segment ${segmentNum})`;
    doc.text(title, 15, yPos);
    yPos += 3;

    const tableData = validCharges.map(charge => {
      const units = charge.numberOfUnits || '';
      const total = calculateChargeTotal(charge);
      const currency = charge.currency || '';
      const amount = charge.amount || '';
      const formattedAmount = currency && amount ? `${currency} ${amount}` : amount;
      const formattedTotal = currency ? `${currency} ${Math.round(total)}` : Math.round(total).toString();
      
      const row = [
        charge.carrier || '',
        charge.unitType || '',
        units,
        formattedAmount,
        charge.transitTime || '',
        charge.numberOfRouting || ''
      ];
      
      row.push(formattedTotal);
      row.push(formatRemarksWithBreaks(charge.remarks || ''));
      return row;
    });
    
    const headers = ['Carrier', 'Unit Type', 'Units', 'Amount', 'Transit', 'Routing', 'Total', 'Remarks'];
    
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
        3: { cellWidth: 25 },  // Amount (with currency)
        4: { cellWidth: 12 },  // Transit
        5: { cellWidth: 14 },  // Routing
        6: { cellWidth: 24 },  // Total (with currency)
        7: { cellWidth: 50, overflow: 'linebreak', fontSize: 6.5 }  // Remarks
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
    const title = tableName ? `Freight Charges - ${tableName} (Segment ${segmentNum})` : `Freight Charges (Segment ${segmentNum})`;
    doc.text(title, 15, yPos);
    yPos += 3;
    
    const tableData = validCharges.map(charge => {
      // Calculate total: chargeableWeight * charge
      const weight = parseFloat(charge.chargeableWeight) || 0;
      const rate = parseFloat(charge.charge) || 0;
      const total = weight * rate;
      const currency = charge.currency || 'USD';
      const chargeAmount = charge.charge || '';
      const formattedCharge = chargeAmount ? `${currency} ${chargeAmount}` : '';
      const formattedTotal = `${currency} ${Math.round(total)}`;
      
      return [
        charge.chargeableWeight || '',
        charge.weightBreaker || '',
        charge.pricingUnit || '',
        formattedCharge,
        formattedTotal,
        formatRemarksWithBreaks(charge.remarks || '')
      ];
    });
    
    autoTable(doc, {
      startY: yPos,
      head: [['Chargeable Weight', 'Weight Breaker', 'Pricing Unit', 'Charge', 'Total', 'Remarks']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [200, 200, 200], textColor: 0, fontSize: 7, fontStyle: 'bold' },
      bodyStyles: { fontSize: 6.5, overflow: 'linebreak', cellPadding: 1.5 },
      columnStyles: {
        0: { cellWidth: 22 },
        1: { cellWidth: 22 },
        2: { cellWidth: 22 },
        3: { cellWidth: 28 },  // Charge (with currency)
        4: { cellWidth: 28 },  // Total (with currency)
        5: { cellWidth: 48, overflow: 'linebreak' }  // Remarks
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
  yPos += (maxLines * 4);

  // Contact Name - display below customer name if exists
  if (quoteData.contactName && quoteData.contactName.trim() !== '') {
    doc.setFont('helvetica', 'bold');
    doc.text('Contact Person', 15, yPos);
    doc.setFont('helvetica', 'normal');
    yPos += 4;
    doc.text(quoteData.contactName, 15, yPos);
    yPos += 4;
  }

  yPos += 4;

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
export const generateDirectQuotePDF = (quoteData, userData = null, returnDoc = false) => {
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

      // Freight Charges - handle both new freightChargesTables and old freightCharges format
      if (option.freightChargesTables && Array.isArray(option.freightChargesTables) && option.freightChargesTables.length > 0) {
        // New format: multiple tables
        const hasMultipleTables = option.freightChargesTables.length > 1 ||
                                   (option.freightChargesTables[0]?.tableName && option.freightChargesTables[0]?.tableName !== 'Default');

        if (hasMultipleTables) {
          // Render each table separately with table name
          option.freightChargesTables.forEach((table, tableIndex) => {
            const tableCharges = table.charges || [];
            if (tableCharges.length > 0) {
              const tableName = table.tableName || `Table ${tableIndex + 1}`;
              yPos = addFreightChargesTableWithName(doc, tableCharges, yPos, isAir, tableName, optionIndex + 1);
            }
          });
        } else {
          // Single table - render without table name
          const charges = option.freightChargesTables[0]?.charges || [];
          yPos = addFreightChargesTable(doc, charges, yPos, isAir);
        }
      } else if (option.freightCharges) {
        // Old format: direct array
        yPos = addFreightChargesTable(doc, option.freightCharges || [], yPos, isAir);
      }

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
  
  // Format user information
  const userName = userData ? `${userData.firstName || ''} ${userData.lastName || ''}`.trim() : 'System';
  const userEmail = userData?.email ? ` (${userData.email})` : '';
  
  doc.text(`Quotation generated by - ${userName}${userEmail}`, 15, yPos);
  doc.text('This is a Computer generated Document and no Signature required.', 15, yPos + 4);
  
  // Save
  if (returnDoc) {
    return doc;
  }
  doc.save(`${quoteData.quoteNumber || 'Quote'}.pdf`);
};

/**
 * Add Air Freight Charges Table with optional table name (Pivoted by Carrier and Unit Type)
 */
function addAirFreightChargesTableWithName(doc, charges, yPos, tableName = null, optionNum = null) {
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
  const title = tableName
    ? `Freight Charges - ${tableName} (Option ${optionNum})`
    : `Freight Charges (Option ${optionNum})`;
  doc.text(title, 15, yPos);
  yPos += 3;

  // Collect all unique unit types and sort them
  const allUnitTypes = new Set();
  validCharges.forEach(charge => {
    if (charge.unitType) {
      allUnitTypes.add(charge.unitType);
    }
  });

  // Convert to sorted array
  const unitTypeColumns = Array.from(allUnitTypes).sort((a, b) => {
    const numA = parseFloat(a.replace(/[^0-9.-]/g, ''));
    const numB = parseFloat(b.replace(/[^0-9.-]/g, ''));
    if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
    return a.localeCompare(b);
  });

  // If no unit types found, use standard ones
  if (unitTypeColumns.length === 0) {
    unitTypeColumns.push('-45', '45', '100', '300', '500', '1000');
  }

  // Group charges by carrier
  const carrierGroups = {};
  validCharges.forEach(charge => {
    const carrier = charge.carrier || '';
    if (!carrierGroups[carrier]) {
      carrierGroups[carrier] = {
        carrier: carrier,
        currency: charge.currency || '',
        minimum: charge.minimum || '',
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
  const tableData = [];
  Object.values(carrierGroups).forEach(group => {
    const row = [group.carrier, group.currency];

    // Add amounts for each unit type column
    unitTypeColumns.forEach(unitType => {
      row.push(group.unitTypes[unitType] || '');
    });

    row.push(
      group.minimum,
      group.surcharge,
      group.transitTime,
      group.frequency,
      group.routing,
      group.remarks
    );

    tableData.push(row);
  });

  // Build headers
  const headers = ['AIRLINE', 'CCY', ...unitTypeColumns, 'MIN', 'SURCH', 'T/T', 'FREQ', 'ROUTING', 'REMARKS'];

  autoTable(doc, {
    startY: yPos,
    head: [headers],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [200, 200, 200], textColor: 0, fontSize: 6.5, fontStyle: 'bold' },
    bodyStyles: { fontSize: 6.5, overflow: 'linebreak', cellPadding: 1.5 },
    margin: { left: 15, right: 15 }
  });

  return doc.lastAutoTable.finalY + 8;
}

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
    const carrier = charge.carrier || '';
    if (!carrierGroups[carrier]) {
      carrierGroups[carrier] = {
        carrier: carrier,
        currency: charge.currency || '',
        minimum: charge.minimum || '',
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
      group.currency,
      group.minimum
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
  const headers = ['AIRLINE', 'CCY', 'M'];
  headers.push(...unitTypeColumns);
  headers.push('SURCHARGES', 'T/T', 'FREQUENCY', 'ROUTING', 'REMARKS');
  
  // Calculate column widths dynamically based on number of unit types
  const numUnitTypes = unitTypeColumns.length;
  const unitTypeWidth = numUnitTypes > 6 ? 10 : 12;
  
  const columnStyles = {
    0: { cellWidth: 15 },  // AIRLINE
    1: { cellWidth: 10 },  // CCY
    2: { cellWidth: 10 }   // M
  };
  
  // Unit type columns
  for (let i = 0; i < numUnitTypes; i++) {
    columnStyles[3 + i] = { cellWidth: unitTypeWidth };
  }
  
  // Remaining columns
  columnStyles[3 + numUnitTypes] = { cellWidth: 16 };  // SURCHARGES
  columnStyles[4 + numUnitTypes] = { cellWidth: 10 };  // T/T
  columnStyles[5 + numUnitTypes] = { cellWidth: 13 };  // FREQUENCY
  columnStyles[6 + numUnitTypes] = { cellWidth: 15 };  // ROUTING
  columnStyles[7 + numUnitTypes] = { cellWidth: 28, overflow: 'linebreak' };  // REMARKS - much wider
  
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
 * Add Freight Charges Table with optional table name
 */
function addFreightChargesTableWithName(doc, charges, yPos, isAir, tableName = null, optionNum = null) {
  // Use specialized Air table for air freight
  if (isAir) {
    return addAirFreightChargesTableWithName(doc, charges, yPos, tableName, optionNum);
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
  const title = tableName
    ? `Freight Charges - ${tableName} (Option ${optionNum})`
    : `Freight Charges (Option ${optionNum})`;
  doc.text(title, 15, yPos);
  yPos += 3;

  const tableData = validCharges.map(charge => {
    const units = charge.numberOfUnits || '';
    const total = calculateChargeTotal(charge);
    const currency = charge.currency || '';
    const amount = charge.amount || '';
    const formattedAmount = currency && amount ? `${currency} ${amount}` : amount;
    const formattedTotal = currency ? `${currency} ${Math.round(total)}` : Math.round(total).toString();

    const row = [
      charge.carrier || '',
      charge.unitType || '',
      units,
      formattedAmount,
      charge.transitTime || '',
      charge.numberOfRouting || ''
    ];

    row.push(formattedTotal);
    row.push(formatRemarksWithBreaks(charge.remarks || ''));
    return row;
  });

  const headers = ['Carrier', 'Unit Type', 'Units', 'Amount', 'Transit', 'Routing', 'Total', 'Remarks'];

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
      3: { cellWidth: 25 },  // Amount (with currency)
      4: { cellWidth: 12 },  // Transit
      5: { cellWidth: 14 },  // Routing
      6: { cellWidth: 24 },  // Total (with currency)
      7: { cellWidth: 50, overflow: 'linebreak', fontSize: 6.5 }  // Remarks
    },
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
    const currency = charge.currency || '';
    const amount = charge.amount || '';
    const formattedAmount = currency && amount ? `${currency} ${amount}` : amount;
    const formattedTotal = currency ? `${currency} ${Math.round(total)}` : Math.round(total).toString();
    
    const row = [
      charge.carrier || '',
      charge.unitType || '',
      units,
      formattedAmount,
      charge.transitTime || '',
      charge.numberOfRouting || ''
    ];
    
    row.push(formattedTotal);
    row.push(formatRemarksWithBreaks(charge.remarks || ''));
    return row;
  });
  
  const headers = ['Carrier', 'Unit Type', 'Units', 'Amount', 'Transit', 'Routing', 'Total', 'Remarks'];
  
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
      3: { cellWidth: 25 },  // Amount (with currency)
      4: { cellWidth: 12 },  // Transit
      5: { cellWidth: 14 },  // Routing
      6: { cellWidth: 24 },  // Total (with currency)
      7: { cellWidth: 50, overflow: 'linebreak', fontSize: 6.5 }  // Remarks
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
    const currency = charge.currency || '';
    const amount = charge.amount || '';
    const formattedAmount = currency && amount ? `${currency} ${amount}` : amount;
    const formattedTotal = currency ? `${currency} ${Math.round(total)}` : Math.round(total).toString();
    
    return [
      charge.chargeName || '',
      charge.unitType || '',
      units,
      formattedAmount,
      formattedTotal,
      formatRemarksWithBreaks(charge.remark || '')
    ];
  });
  
  autoTable(doc, {
    startY: yPos,
    head: [['Charge Name', 'Unit Type', 'Units', 'Amount', 'Total', 'Remark']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [200, 200, 200], textColor: 0, fontSize: 7, fontStyle: 'bold' },
    bodyStyles: { fontSize: 6.5, overflow: 'linebreak', cellPadding: 1.5 },
    columnStyles: {
      0: { cellWidth: 36 },
      1: { cellWidth: 22 },
      2: { cellWidth: 12 },
      3: { cellWidth: 28 },  // Amount (with currency)
      4: { cellWidth: 28 },  // Total (with currency)
      5: { cellWidth: 44, overflow: 'linebreak' }  // Remark
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
export const generateTransitQuotePDF = (quoteData, userData = null, returnDoc = false) => {
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

    // Freight Charges - handle multiple tables if they exist
    if (segment.freightChargesTables && Array.isArray(segment.freightChargesTables) && segment.freightChargesTables.length > 0) {
      // Check if we have multiple tables with table names
      const hasMultipleTables = segment.freightChargesTables.length > 1 ||
                                 (segment.freightChargesTables[0]?.tableName && segment.freightChargesTables[0]?.tableName !== 'Default');

      if (hasMultipleTables) {
        // Render each table separately
        segment.freightChargesTables.forEach((table, tableIndex) => {
          const tableCharges = table.charges || [];
          if (tableCharges.length > 0) {
            const tableName = table.tableName || `Table ${tableIndex + 1}`;
            yPos = addFreightChargesTableTransit(doc, tableCharges, yPos, segment.mode === 'air', index + 1, tableName);
          }
        });
      } else {
        // Single table - flatten and render
        const freightCharges = extractChargesFromTables(segment.freightChargesTables, 'freight');
        if (freightCharges.length > 0) {
          yPos = addFreightChargesTableTransit(doc, freightCharges, yPos, segment.mode === 'air', index + 1);
        }
      }
    } else if (segment.freightCharges) {
      // Old format - direct array
      const freightCharges = segment.freightCharges;
      if (freightCharges.length > 0) {
        yPos = addFreightChargesTableTransit(doc, freightCharges, yPos, segment.mode === 'air', index + 1);
      }
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
  
  // Format user information
  const userName = userData ? `${userData.firstName || ''} ${userData.lastName || ''}`.trim() : 'System';
  const userEmail = userData?.email ? ` (${userData.email})` : '';
  
  doc.text(`Quotation generated by - ${userName}${userEmail}`, 15, finalY);
  doc.text('This is a Computer generated Document and no Signature required.', 15, finalY + 4);
  
  if (returnDoc) {
    return doc;
  }
  doc.save(`${quoteData.quoteNumber || 'Transit-Quote'}.pdf`);
};

/**
 * Generate PDF for MultiModal Quotes
 */
export const generateMultiModalQuotePDF = (quoteData, userData = null, returnDoc = false) => {
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

    // Freight Charges - handle multiple tables if they exist
    if (segment.freightChargesTables && Array.isArray(segment.freightChargesTables) && segment.freightChargesTables.length > 0) {
      // Check if we have multiple tables with table names
      const hasMultipleTables = segment.freightChargesTables.length > 1 ||
                                 (segment.freightChargesTables[0]?.tableName && segment.freightChargesTables[0]?.tableName !== 'Default');

      if (hasMultipleTables) {
        // Render each table separately
        segment.freightChargesTables.forEach((table, tableIndex) => {
          const tableCharges = table.charges || [];
          if (tableCharges.length > 0) {
            const tableName = table.tableName || `Table ${tableIndex + 1}`;
            yPos = addFreightChargesTableTransit(doc, tableCharges, yPos, segment.mode === 'air', index + 1, tableName);
          }
        });
      } else {
        // Single table - flatten and render
        const freightCharges = extractChargesFromTables(segment.freightChargesTables, 'freight');
        if (freightCharges.length > 0) {
          yPos = addFreightChargesTableTransit(doc, freightCharges, yPos, segment.mode === 'air', index + 1);
        }
      }
    } else if (segment.freightCharges) {
      // Old format - direct array
      const freightCharges = segment.freightCharges;
      if (freightCharges.length > 0) {
        yPos = addFreightChargesTableTransit(doc, freightCharges, yPos, segment.mode === 'air', index + 1);
      }
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
  
  // Format user information
  const userName = userData ? `${userData.firstName || ''} ${userData.lastName || ''}`.trim() : 'System';
  const userEmail = userData?.email ? ` (${userData.email})` : '';
  
  doc.text(`Quotation generated by - ${userName}${userEmail}`, 15, finalY);
  doc.text('This is a Computer generated Document and no Signature required.', 15, finalY + 4);
  if (returnDoc) {
    return doc;
  }
  doc.save(`${quoteData.quoteNumber || 'MultiModal-Quote'}.pdf`);
};


// pdfPrintHelpers.js
// Add these print functions to your existing pdfGenerator.js file

/**
 * Generic function to print a PDF
 * Opens the PDF in a new window and triggers the browser's print dialog
 * @param {jsPDF} pdf - The jsPDF instance to print
 * @param {string} filename - Optional filename for the PDF
 */
export const printPDF = (pdf, filename = 'document.pdf') => {
  try {
    // Get the PDF as a blob
    const pdfBlob = pdf.output('blob');
    const blobUrl = URL.createObjectURL(pdfBlob);
    
    // Create an iframe to load the PDF
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    
    // Append iframe to body
    document.body.appendChild(iframe);
    
    // Set the source and trigger print when loaded
    iframe.src = blobUrl;
    iframe.onload = function() {
      setTimeout(() => {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
        
        // Clean up after printing or if user cancels
        setTimeout(() => {
          document.body.removeChild(iframe);
          URL.revokeObjectURL(blobUrl);
        }, 1000);
      }, 100);
    };
  } catch (error) {
    console.error('Error printing PDF:', error);
    alert('Failed to print PDF. Please try downloading instead.');
  }
};

/**
 * Print function for Direct Quote PDFs
 * Add this function to your pdfGenerator.js file alongside generateDirectQuotePDF
 */
export const printDirectQuotePDF = (quoteData, userData = null) => {
  try {
    // Generate PDF but return doc instead of saving
    const doc = generateDirectQuotePDF(quoteData, userData, true);
    printPDF(doc, `Quote_${quoteData.quoteNumber}_Direct.pdf`);
  } catch (error) {
    console.error('Error printing direct quote PDF:', error);
    alert('Failed to print PDF');
  }
};

export const printTransitQuotePDF = (quoteData, userData = null) => {
  try {
    // Generate PDF but return doc instead of saving
    const doc = generateTransitQuotePDF(quoteData, userData, true);
    printPDF(doc, `Quote_${quoteData.quoteNumber}_Transit.pdf`);
  } catch (error) {
    console.error('Error printing transit quote PDF:', error);
    alert('Failed to print PDF');
  }
};

export const printMultiModalQuotePDF = (quoteData, userData = null) => {
  try {
    // Generate PDF but return doc instead of saving
    const doc = generateMultiModalQuotePDF(quoteData, userData, true);
    printPDF(doc, `Quote_${quoteData.quoteNumber}_MultiModal.pdf`);
  } catch (error) {
    console.error('Error printing multi-modal quote PDF:', error);
    alert('Failed to print PDF');
  }
};

/**
 * Print function for Warehouse Quote PDFs
 * Add this function to your warehousePDFGenerator.js file
 */
// export const printWarehouseQuotePDF = async (quoteData) => {
//   try {
//     const pdf = await generateWarehouseQuotePDFObject(quoteData); // Modified version that returns pdf
//     printPDF(pdf, `Quote_${quoteData.quoteNumber}_Warehouse.pdf`);
//   } catch (error) {
//     console.error('Error printing warehouse quote PDF:', error);
//     alert('Failed to print PDF');
//   }
// };

/**
 * IMPORTANT: Refactoring Instructions
 * 
 * To implement these print functions, you need to refactor your existing PDF generation functions:
 * 
 * 1. Keep your existing generateXXXQuotePDF functions that call pdf.save()
 * 2. Create new generateXXXQuotePDFObject functions that return the pdf object
 * 3. Both functions should share the same PDF generation logic
 * 
 * Example refactoring pattern:
 * 
 * // Shared PDF generation logic
 * const buildDirectQuotePDF = async (quoteData) => {
 *   const pdf = new jsPDF(...);
 *   // ... all your PDF generation code ...
 *   return pdf;
 * };
 * 
 * // For download (existing function)
 * export const generateDirectQuotePDF = async (quoteData) => {
 *   const pdf = await buildDirectQuotePDF(quoteData);
 *   pdf.save(`Quote_${quoteData.quoteNumber}_Direct.pdf`);
 * };
 * 
 * // For print (new function)
 * export const generateDirectQuotePDFObject = async (quoteData) => {
 *   return await buildDirectQuotePDF(quoteData);
 * };
 * 
 * // Then use printPDF helper
 * export const printDirectQuotePDF = async (quoteData) => {
 *   const pdf = await generateDirectQuotePDFObject(quoteData);
 *   printPDF(pdf, `Quote_${quoteData.quoteNumber}_Direct.pdf`);
 * };
 */

// Alternative simpler approach if you don't want to refactor:
// Modify your existing generate functions to accept a "mode" parameter

/**
 * Alternative: Modified Direct Quote PDF generator with mode parameter
 */
export const generateDirectQuotePDF_Alternative = async (quoteData, mode = 'download') => {
  // ... all your PDF generation code ...
  const pdf = new jsPDF(/* your config */);
  
  // ... build the PDF ...
  
  if (mode === 'download') {
    pdf.save(`Quote_${quoteData.quoteNumber}_Direct.pdf`);
  } else if (mode === 'print') {
    printPDF(pdf, `Quote_${quoteData.quoteNumber}_Direct.pdf`);
  }
  
  return pdf; // Return for additional processing if needed
};

// Then in your component:
// Download: generateDirectQuotePDF_Alternative(pdfData, 'download');
// Print: generateDirectQuotePDF_Alternative(pdfData, 'print');
