import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import logo from '../../../assets/images/logo.png'; // Import company logo

/**
 * Generate a professional PDF for warehouse quotation
 * @param {Object} quoteData - The warehouse quote data
 * @param {Array} lineItems - Array of service line items
 * @param {Array} notes - Array of terms and notes
 * @param {Object} userData - User information for footer (optional)
 */
export const generateWarehousePDF = (quoteData, lineItems, notes, userData = null) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 15;
  let yPos = 15;

  // ===== HEADER SECTION (Matching Company Style) =====
  // Logo - maintaining aspect ratio (50 x 10)
  doc.addImage(logo, 'PNG', margin, yPos, 50, 10);
  
  // Company Info (Right aligned)
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Scanwell Logistics Colombo (Pvt) Ltd.', pageWidth - margin, yPos + 2, { align: 'right' });
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('67/1 Hudson Road Colombo 3 Sri Lanka.', pageWidth - margin, yPos + 7, { align: 'right' });
  doc.text('Office #+94 11 2426600/4766400', pageWidth - margin, yPos + 12, { align: 'right' });
  
  yPos += 25;

  // Title (Centered)
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('WAREHOUSE QUOTATION', pageWidth / 2, yPos, { align: 'center' });
  
  yPos += 12;

  // ===== QUOTE DETAILS SECTION =====
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(quoteData.quoteNumber || 'N/A', margin, yPos);
  
  // Warehouse Service label (right aligned)
  doc.text('Warehouse Services', pageWidth - margin, yPos, { align: 'right' });
  
  yPos += 5;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  
  if (quoteData.validityDate) {
    const validityDate = new Date(quoteData.validityDate).toLocaleDateString('en-GB');
    doc.text(`Valid Until: ${validityDate}`, pageWidth - margin, yPos, { align: 'right' });
  }
  
  yPos += 10;

  // Customer Information
  doc.setFont('helvetica', 'bold');
  doc.text('Customer', margin, yPos);
  doc.setFont('helvetica', 'normal');
  yPos += 4;
  doc.text(quoteData.customerName || 'N/A', margin, yPos);
  
  yPos += 8;

  // Quote Details Box
  doc.setFont('helvetica', 'bold');
  doc.text('Currency', margin, yPos);
  doc.text('Issued Date', 70, yPos);
  doc.text('Validity Period', 130, yPos);
  
  yPos += 4;
  doc.setFont('helvetica', 'normal');
  doc.text(quoteData.currency || 'LKR', margin, yPos);
  doc.text(new Date(quoteData.issuedDate).toLocaleDateString('en-GB'), 70, yPos);
  doc.text(`${quoteData.validityDays} days`, 130, yPos);
  
  yPos += 8;

  // Line separator
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 8;

  // ===== SERVICE ITEMS TABLE =====
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Service Items', margin, yPos);
  yPos += 5;

  const tableData = lineItems.map((item, index) => {
    return [
      (index + 1).toString(),
      item.category || '',
      item.description || '',
      item.remarks || '',
      item.unitOfMeasurement || '',
      parseFloat(item.amount || 0).toLocaleString('en-US', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
      })
    ];
  });

  // Calculate total
  const total = lineItems.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);

  autoTable(doc, {
    startY: yPos,
    head: [['#', 'Category', 'Description', 'Remarks', 'Unit', `Amount (${quoteData.currency})`]],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [200, 200, 200],
      textColor: 0,
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'center'
    },
    bodyStyles: {
      fontSize: 8,
      cellPadding: 2
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 28 },
      2: { cellWidth: 55 },
      3: { cellWidth: 35 },
      4: { cellWidth: 25 },
      5: { cellWidth: 27, halign: 'right', fontStyle: 'bold' }
    },
    margin: { left: margin, right: margin },
    foot: [[
      '', '', '', '', 
      { content: 'TOTAL:', styles: { halign: 'right', fontStyle: 'bold', fontSize: 9 } },
      { 
        content: total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), 
        styles: { halign: 'right', fontStyle: 'bold', fontSize: 9, fillColor: [240, 240, 240] } 
      }
    ]],
    footStyles: {
      fillColor: [240, 240, 240],
      textColor: 0,
      fontStyle: 'bold'
    }
  });

  // Get final Y position after table
  yPos = doc.lastAutoTable.finalY + 10;

  // ===== INSURANCE SECTION =====
  // Check if we need a new page for insurance section
  if (yPos > pageHeight - 80) {
    doc.addPage();
    yPos = 20;
  }

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Insurance', margin, yPos);
  yPos += 5;

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  const insuranceText = 'The said quotation is subjected to Customer securing a Comprehensive all risks Insurance Cover for all goods stored at the Warehouse and while cargo transportation.';
  const insuranceLines = doc.splitTextToSize(insuranceText, pageWidth - 2 * margin);
  insuranceLines.forEach(line => {
    doc.text(line, margin, yPos);
    yPos += 4;
  });

  yPos += 6;

  // ===== NOTES SECTION =====
  // Check if we need a new page for notes
  if (yPos > pageHeight - 60) {
    doc.addPage();
    yPos = 20;
  }

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Notes', margin, yPos);
  yPos += 5;

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');

  // Add default note about fork-lift rates
  const defaultNote = '@ Rates are based on 2.5Ton Fork-lift. If any heavy equipment\'s are needed prices will indicated at that time.';
  const defaultNoteLines = doc.splitTextToSize(defaultNote, pageWidth - 2 * margin);
  defaultNoteLines.forEach(line => {
    doc.text(line, margin, yPos);
    yPos += 4;
  });

  // Add user-provided notes if any
  if (notes && notes.length > 0) {
    notes.forEach((note) => {
      if (note && note.trim()) {
        // Check if we need a new page
        if (yPos > pageHeight - 25) {
          doc.addPage();
          yPos = 20;
        }

        const noteLines = doc.splitTextToSize(`- ${note}`, pageWidth - 2 * margin);
        noteLines.forEach(line => {
          doc.text(line, margin, yPos);
          yPos += 4;
        });
      }
    });
  }

  // ===== FOOTER SECTION (System Generated) =====
  // Position footer at bottom of last page
  const finalY = pageHeight - 15;
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  
  // Format user information
  const userName = userData ? `${userData.firstName || ''} ${userData.lastName || ''}`.trim() : 'System';
  const userEmail = userData?.email ? ` (${userData.email})` : '';
  
  doc.text(`Quotation generated by - ${userName}${userEmail}`, margin, finalY);
  doc.text('This is a Computer generated Document and no Signature required.', margin, finalY + 4);

  // Page numbering
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text(
      `Page ${i} of ${pageCount}`,
      pageWidth - margin - 15,
      pageHeight - 10,
      { align: 'right' }
    );
  }

  // Save the PDF
  const fileName = `${quoteData.quoteNumber || 'Warehouse-Quote'}.pdf`;
  doc.save(fileName);
};

/**
 * Generate PDF and open in new window for preview
 */
export const previewWarehousePDF = (quoteData, lineItems, notes, userData = null) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 15;
  let yPos = 15;

  // Header Section
  doc.addImage(logo, 'PNG', margin, yPos, 50, 10);
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Scanwell Logistics Colombo (Pvt) Ltd.', pageWidth - margin, yPos + 2, { align: 'right' });
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('67/1 Hudson Road Colombo 3 Sri Lanka.', pageWidth - margin, yPos + 7, { align: 'right' });
  doc.text('Office #+94 11 2426600/4766400', pageWidth - margin, yPos + 12, { align: 'right' });
  
  yPos += 25;

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('WAREHOUSE QUOTATION', pageWidth / 2, yPos, { align: 'center' });
  
  yPos += 12;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(quoteData.quoteNumber || 'N/A', margin, yPos);
  doc.text('Warehouse Services', pageWidth - margin, yPos, { align: 'right' });
  
  yPos += 5;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  
  if (quoteData.validityDate) {
    const validityDate = new Date(quoteData.validityDate).toLocaleDateString('en-GB');
    doc.text(`Valid Until: ${validityDate}`, pageWidth - margin, yPos, { align: 'right' });
  }
  
  yPos += 10;

  doc.setFont('helvetica', 'bold');
  doc.text('Customer', margin, yPos);
  doc.setFont('helvetica', 'normal');
  yPos += 4;
  doc.text(quoteData.customerName || 'N/A', margin, yPos);
  
  yPos += 8;

  doc.setFont('helvetica', 'bold');
  doc.text('Currency', margin, yPos);
  doc.text('Issued Date', 70, yPos);
  doc.text('Validity Period', 130, yPos);
  
  yPos += 4;
  doc.setFont('helvetica', 'normal');
  doc.text(quoteData.currency || 'LKR', margin, yPos);
  doc.text(new Date(quoteData.issuedDate).toLocaleDateString('en-GB'), 70, yPos);
  doc.text(`${quoteData.validityDays} days`, 130, yPos);
  
  yPos += 8;
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 8;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Service Items', margin, yPos);
  yPos += 5;

  const tableData = lineItems.map((item, index) => [
    (index + 1).toString(),
    item.category || '',
    item.description || '',
    item.remarks || '',
    item.unitOfMeasurement || '',
    parseFloat(item.amount || 0).toLocaleString('en-US', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })
  ]);

  const total = lineItems.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);

  autoTable(doc, {
    startY: yPos,
    head: [['#', 'Category', 'Description', 'Remarks', 'Unit', `Amount (${quoteData.currency})`]],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [200, 200, 200],
      textColor: 0,
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'center'
    },
    bodyStyles: {
      fontSize: 8,
      cellPadding: 2
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 28 },
      2: { cellWidth: 55 },
      3: { cellWidth: 35 },
      4: { cellWidth: 25 },
      5: { cellWidth: 27, halign: 'right', fontStyle: 'bold' }
    },
    margin: { left: margin, right: margin }
    // Removed total footer as per client request
  });

  yPos = doc.lastAutoTable.finalY + 10;

  // ===== INSURANCE SECTION =====
  if (yPos > pageHeight - 80) {
    doc.addPage();
    yPos = 20;
  }

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Insurance', margin, yPos);
  yPos += 5;

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  const insuranceText = 'The said quotation is subjected to Customer securing a Comprehensive all risks Insurance Cover for all goods stored at the Warehouse and while cargo transportation.';
  const insuranceLines = doc.splitTextToSize(insuranceText, pageWidth - 2 * margin);
  insuranceLines.forEach(line => {
    doc.text(line, margin, yPos);
    yPos += 4;
  });

  yPos += 6;

  // ===== NOTES SECTION =====
  if (yPos > pageHeight - 60) {
    doc.addPage();
    yPos = 20;
  }

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Notes', margin, yPos);
  yPos += 5;

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');

  // Add default note about fork-lift rates
  const defaultNote = '@ Rates are based on 2.5Ton Fork-lift. If any heavy equipment\'s are needed prices will indicated at that time.';
  const defaultNoteLines = doc.splitTextToSize(defaultNote, pageWidth - 2 * margin);
  defaultNoteLines.forEach(line => {
    doc.text(line, margin, yPos);
    yPos += 4;
  });

  // Add user-provided notes if any
  if (notes && notes.length > 0) {
    notes.forEach((note) => {
      if (note && note.trim()) {
        if (yPos > pageHeight - 25) {
          doc.addPage();
          yPos = 20;
        }
        const noteLines = doc.splitTextToSize(`- ${note}`, pageWidth - 2 * margin);
        noteLines.forEach(line => {
          doc.text(line, margin, yPos);
          yPos += 4;
        });
      }
    });
  }

  const finalY = pageHeight - 15;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  
  const userName = userData ? `${userData.firstName || ''} ${userData.lastName || ''}`.trim() : 'System';
  const userEmail = userData?.email ? ` (${userData.email})` : '';
  
  doc.text(`Quotation generated by - ${userName}${userEmail}`, margin, finalY);
  doc.text('This is a Computer generated Document and no Signature required.', margin, finalY + 4);

  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text(
      `Page ${i} of ${pageCount}`,
      pageWidth - margin - 15,
      pageHeight - 10,
      { align: 'right' }
    );
  }

  // Open in new window instead of downloading
  const pdfBlob = doc.output('blob');
  const pdfUrl = URL.createObjectURL(pdfBlob);
  window.open(pdfUrl, '_blank');
};

/**
 * Generate PDF as blob for uploading or emailing
 */
export const generateWarehousePDFBlob = (quoteData, lineItems, notes, userData = null) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 15;
  let yPos = 15;

  // Header
  doc.addImage(logo, 'PNG', margin, yPos, 50, 10);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Scanwell Logistics Colombo (Pvt) Ltd.', pageWidth - margin, yPos + 2, { align: 'right' });
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('67/1 Hudson Road Colombo 3 Sri Lanka.', pageWidth - margin, yPos + 7, { align: 'right' });
  doc.text('Office #+94 11 2426600/4766400', pageWidth - margin, yPos + 12, { align: 'right' });
  yPos += 25;

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('WAREHOUSE QUOTATION', pageWidth / 2, yPos, { align: 'center' });
  yPos += 12;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(quoteData.quoteNumber || 'N/A', margin, yPos);
  doc.text('Warehouse Services', pageWidth - margin, yPos, { align: 'right' });
  yPos += 5;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  if (quoteData.validityDate) {
    const validityDate = new Date(quoteData.validityDate).toLocaleDateString('en-GB');
    doc.text(`Valid Until: ${validityDate}`, pageWidth - margin, yPos, { align: 'right' });
  }
  yPos += 10;

  doc.setFont('helvetica', 'bold');
  doc.text('Customer', margin, yPos);
  doc.setFont('helvetica', 'normal');
  yPos += 4;
  doc.text(quoteData.customerName || 'N/A', margin, yPos);
  yPos += 8;

  doc.setFont('helvetica', 'bold');
  doc.text('Currency', margin, yPos);
  doc.text('Issued Date', 70, yPos);
  doc.text('Validity Period', 130, yPos);
  yPos += 4;

  doc.setFont('helvetica', 'normal');
  doc.text(quoteData.currency || 'LKR', margin, yPos);
  doc.text(new Date(quoteData.issuedDate).toLocaleDateString('en-GB'), 70, yPos);
  doc.text(`${quoteData.validityDays} days`, 130, yPos);
  yPos += 8;

  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 8;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Service Items', margin, yPos);
  yPos += 5;

  const tableData = lineItems.map((item, index) => [
    (index + 1).toString(),
    item.category || '',
    item.description || '',
    item.remarks || '',
    item.unitOfMeasurement || '',
    parseFloat(item.amount || 0).toLocaleString('en-US', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })
  ]);

  const total = lineItems.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);

  autoTable(doc, {
    startY: yPos,
    head: [['#', 'Category', 'Description', 'Remarks', 'Unit', `Amount (${quoteData.currency})`]],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [200, 200, 200],
      textColor: 0,
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'center'
    },
    bodyStyles: {
      fontSize: 8,
      cellPadding: 2
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 28 },
      2: { cellWidth: 55 },
      3: { cellWidth: 35 },
      4: { cellWidth: 25 },
      5: { cellWidth: 27, halign: 'right', fontStyle: 'bold' }
    },
    margin: { left: margin, right: margin }
    // Removed total footer as per client request
  });

  yPos = doc.lastAutoTable.finalY + 10;

  // ===== INSURANCE SECTION =====
  if (yPos > pageHeight - 80) {
    doc.addPage();
    yPos = 20;
  }

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Insurance', margin, yPos);
  yPos += 5;

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  const insuranceText = 'The said quotation is subjected to Customer securing a Comprehensive all risks Insurance Cover for all goods stored at the Warehouse and while cargo transportation.';
  const insuranceLines = doc.splitTextToSize(insuranceText, pageWidth - 2 * margin);
  insuranceLines.forEach(line => {
    doc.text(line, margin, yPos);
    yPos += 4;
  });

  yPos += 6;

  // ===== NOTES SECTION =====
  if (yPos > pageHeight - 60) {
    doc.addPage();
    yPos = 20;
  }

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Notes', margin, yPos);
  yPos += 5;

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');

  // Add default note about fork-lift rates
  const defaultNote = '@ Rates are based on 2.5Ton Fork-lift. If any heavy equipment\'s are needed prices will indicated at that time.';
  const defaultNoteLines = doc.splitTextToSize(defaultNote, pageWidth - 2 * margin);
  defaultNoteLines.forEach(line => {
    doc.text(line, margin, yPos);
    yPos += 4;
  });

  // Add user-provided notes if any
  if (notes && notes.length > 0) {
    notes.forEach((note) => {
      if (note && note.trim()) {
        if (yPos > pageHeight - 25) {
          doc.addPage();
          yPos = 20;
        }
        const noteLines = doc.splitTextToSize(`- ${note}`, pageWidth - 2 * margin);
        noteLines.forEach(line => {
          doc.text(line, margin, yPos);
          yPos += 4;
        });
      }
    });
  }

  const finalY = pageHeight - 15;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  
  const userName = userData ? `${userData.firstName || ''} ${userData.lastName || ''}`.trim() : 'System';
  const userEmail = userData?.email ? ` (${userData.email})` : '';
  
  doc.text(`Quotation generated by - ${userName}${userEmail}`, margin, finalY);
  doc.text('This is a Computer generated Document and no Signature required.', margin, finalY + 4);

  return doc.output('blob');
};

export const printWarehousePDF = (quoteData, lineItems, notes, userData = null) => {
  try {
    const pdfBlob = generateWarehousePDFBlob(quoteData, lineItems, notes, userData);
    const blobUrl = URL.createObjectURL(pdfBlob);
    
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    
    document.body.appendChild(iframe);
    
    iframe.src = blobUrl;
    iframe.onload = function() {
      setTimeout(() => {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
        setTimeout(() => {
          document.body.removeChild(iframe);
          URL.revokeObjectURL(blobUrl);
        }, 1000);
      }, 100);
    };
  } catch (error) {
    console.error('Error printing warehouse PDF:', error);
    alert('Failed to print PDF. Please try downloading instead.');
  }
};