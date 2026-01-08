import jsPDF from 'jspdf';
import 'jspdf-autotable';

/**
 * Generate a professional PDF for warehouse quotation
 * @param {Object} quoteData - The warehouse quote data
 * @param {Array} lineItems - Array of service line items
 * @param {Array} notes - Array of terms and notes
 */
export const generateWarehousePDF = (quoteData, lineItems, notes) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 15;

  // Company Logo/Header
  doc.setFillColor(13, 148, 136); // Teal color
  doc.rect(0, 0, pageWidth, 35, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('SCANWELL LOGISTICS', margin, 15);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Scan Distribution Centre Lanka (Pvt) Ltd', margin, 22);
  doc.text('Warehouse & Distribution Services', margin, 28);

  // Reset text color
  doc.setTextColor(0, 0, 0);

  // Quote Title
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('WAREHOUSE QUOTATION', margin, 50);

  // Quote Details Box
  const detailsY = 60;
  doc.setFillColor(240, 253, 250); // Light teal
  doc.rect(margin, detailsY, pageWidth - 2 * margin, 35, 'F');
  doc.setDrawColor(13, 148, 136);
  doc.rect(margin, detailsY, pageWidth - 2 * margin, 35, 'S');

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  // Left column
  doc.setFont('helvetica', 'bold');
  doc.text('Customer:', margin + 5, detailsY + 8);
  doc.text('Currency:', margin + 5, detailsY + 16);
  doc.text('Issued:', margin + 5, detailsY + 24);

  doc.setFont('helvetica', 'normal');
  doc.text(quoteData.customerName || '', margin + 30, detailsY + 8);
  doc.text(quoteData.currency || 'LKR', margin + 30, detailsY + 16);
  doc.text(new Date(quoteData.issuedDate).toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  }), margin + 30, detailsY + 24);

  // Right column
  const rightCol = pageWidth - 80;
  doc.setFont('helvetica', 'bold');
  doc.text('Quote No:', rightCol, detailsY + 8);
  doc.text('Validity:', rightCol, detailsY + 16);

  doc.setFont('helvetica', 'normal');
  doc.text(quoteData.quoteNumber || 'Pending', rightCol + 25, detailsY + 8);
  doc.text(`${quoteData.validityDays} days`, rightCol + 25, detailsY + 16);

  if (quoteData.validityDate) {
    doc.setFont('helvetica', 'bold');
    doc.text('Valid Until:', rightCol, detailsY + 24);
    doc.setFont('helvetica', 'normal');
    doc.text(new Date(quoteData.validityDate).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }), rightCol + 25, detailsY + 24);
  }

  // Service Items Table
  const tableStartY = detailsY + 45;
  
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

  doc.autoTable({
    startY: tableStartY,
    head: [['#', 'Category', 'Description', 'Remarks', 'Unit', 'Amount']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [13, 148, 136],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
      halign: 'center'
    },
    bodyStyles: {
      fontSize: 8,
      cellPadding: 3
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 25 },
      2: { cellWidth: 60 },
      3: { cellWidth: 40 },
      4: { cellWidth: 25 },
      5: { cellWidth: 25, halign: 'right', fontStyle: 'bold' }
    },
    margin: { left: margin, right: margin },
    didDrawPage: (data) => {
      // Add page numbers
      const pageCount = doc.internal.getNumberOfPages();
      doc.setFontSize(8);
      doc.setTextColor(100);
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.text(
          `Page ${i} of ${pageCount}`,
          pageWidth - margin - 20,
          pageHeight - 10
        );
      }
    }
  });

  // Notes Section
  let notesY = doc.lastAutoTable.finalY + 15;
  
  // Check if we need a new page for notes
  if (notesY > pageHeight - 80) {
    doc.addPage();
    notesY = 20;
  }

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Terms & Conditions:', margin, notesY);
  
  notesY += 8;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');

  notes.forEach((note, index) => {
    if (note && note.trim()) {
      // Check if we need a new page
      if (notesY > pageHeight - 20) {
        doc.addPage();
        notesY = 20;
      }

      const noteLines = doc.splitTextToSize(`@ ${note}`, pageWidth - 2 * margin - 5);
      doc.text(noteLines, margin + 3, notesY);
      notesY += noteLines.length * 4;
    }
  });

  // Services Footer
  notesY += 10;
  
  // Check if we need a new page for footer
  if (notesY > pageHeight - 50) {
    doc.addPage();
    notesY = 20;
  }

  doc.setFillColor(13, 148, 136);
  doc.rect(margin, notesY, pageWidth - 2 * margin, 30, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('SERVICES WE OFFER', margin + 5, notesY + 8);
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  const services = [
    '*Bonded warehousing  *Cross Dock Operations  *Pick & Pack operations',
    '*Distributions & Transportation  *Freight forwarding  *Clearing & Forwarding',
    '*Common user warehousing  *Other Value added services'
  ];
  
  services.forEach((service, index) => {
    doc.text(service, margin + 5, notesY + 15 + (index * 4));
  });

  // Company Contact Footer
  doc.setFillColor(248, 250, 252);
  doc.rect(0, pageHeight - 20, pageWidth, 20, 'F');
  
  doc.setTextColor(71, 85, 105);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  const contactInfo = 'Scanwell Logistics | Tel: +94 11 234 5678 | Email: info@scanwell.lk | www.scanwell.lk';
  const contactWidth = doc.getTextWidth(contactInfo);
  doc.text(contactInfo, (pageWidth - contactWidth) / 2, pageHeight - 10);

  // Save the PDF
  const fileName = `Warehouse_Quote_${quoteData.quoteNumber || 'Draft'}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
};

/**
 * Generate PDF and open in new window for preview
 */
export const previewWarehousePDF = (quoteData, lineItems, notes) => {
  const doc = new jsPDF();
  // ... same generation code as above ...
  
  // Open in new window instead of downloading
  const pdfBlob = doc.output('blob');
  const pdfUrl = URL.createObjectURL(pdfBlob);
  window.open(pdfUrl, '_blank');
};

/**
 * Generate PDF as blob for uploading or emailing
 */
export const generateWarehousePDFBlob = (quoteData, lineItems, notes) => {
  const doc = new jsPDF();
  // ... same generation code as above ...
  
  return doc.output('blob');
};
