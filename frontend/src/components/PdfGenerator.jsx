import jsPDF from 'jspdf';
import 'jspdf-autotable'; // Ensure this line is present

class PdfGenerator {
  constructor() {
    this.doc = null;
    this.pageWidth = 210; // A4 width in mm
    this.pageHeight = 297; // A4 height in mm
    this.margin = 15;
    this.currentY = 20;
  }

  generate(documentData, type) {
    this.doc = new jsPDF();
    this.currentY = 20;
    this.addHeader(documentData);
    this.addTitle(documentData, type);
    this.addRecipientInfo(documentData);
    this.addFreightRates(documentData);
    this.addAdditionalCharges(documentData);
    this.addRemarks(documentData);
    this.addFooter(documentData);
    return this.doc;
  }

  addHeader(data) {
    this.doc.setFontSize(20);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(0, 128, 128); // Teal color
    this.doc.text('Scanwell Logistics', this.margin, this.currentY);
    
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(100, 100, 100);
    this.doc.text('Air & Sea Freight Solutions', this.margin, this.currentY + 6);
    
    this.doc.setFontSize(10);
    this.doc.setTextColor(0, 0, 0);
    this.doc.text(`Document #: ${data.documentNumber}`, this.pageWidth - this.margin - 60, this.currentY);
    this.doc.text(`Date: ${this.formatDate(data.issueDate)}`, this.pageWidth - this.margin - 60, this.currentY + 6);
    
    if (data.validUntil) {
      this.doc.text(`Valid Until: ${this.formatDate(data.validUntil)}`, this.pageWidth - this.margin - 60, this.currentY + 12);
    }
    this.currentY += 25;
    this.addLine();
  }

  addTitle(data, type) {
    const isQuote = type === 'quote';
    const freightTypeLabel = this.getFreightTypeLabel(data.freightType);
    
    this.doc.setFontSize(16);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(255, 215, 0); // Yellow color for title
    const title = isQuote ? `${freightTypeLabel} - QUOTATION` : `${freightTypeLabel} - INVOICE`;
    this.doc.text(title, this.margin, this.currentY);
    this.currentY += 10;
  }

  addRecipientInfo(data) {
    this.doc.setFontSize(11);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('To:', this.margin, this.currentY);
    
    this.doc.setFont('helvetica', 'normal');
    this.currentY += 6;
    this.doc.text(data.recipient || 'Dear Mr./Ms.', this.margin, this.currentY);
    this.currentY += 5;
    
    if (data.recipientEmail) {
      this.doc.text(`Email: ${data.recipientEmail}`, this.margin, this.currentY);
      this.currentY += 5;
    }
    
    if (data.recipientAddress) {
      const addressLines = this.doc.splitTextToSize(data.recipientAddress, 100);
      this.doc.text(addressLines, this.margin, this.currentY);
      this.currentY += addressLines.length * 5;
    }
    this.currentY += 5;
  }

  addFreightRates(data) {
    this.currentY += 5;
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('FREIGHT RATES', this.margin, this.currentY);
    this.currentY += 7;
    const freightType = data.freightType;

    if (freightType?.includes('air')) {
      this.addAirFreightTable(data.rateData);
    } else if (freightType?.includes('fcl')) {
      this.addSeaFCLTable(data.rateData);
    } else if (freightType?.includes('lcl')) {
      this.addSeaLCLTable(data.rateData);
    }
    this.currentY += 5;
  }

  addAirFreightTable(rates) {
    if (!this.doc.autoTable) {
      console.error('jspdf-autotable plugin is not loaded. Please ensure it is installed and imported.');
      return;
    }
    const tableData = [
      [
        rates.airline || 'N/A',
        rates.rateM ? `$${rates.rateM}` : '-',
        rates.rate45Minus ? `$${rates.rate45Minus}` : '-',
        rates.rate45Plus ? `$${rates.rate45Plus}` : '-',
        rates.rate100 ? `$${rates.rate100}` : '-',
        rates.rate300 ? `$${rates.rate300}` : '-',
        rates.rate500 ? `$${rates.rate500}` : '-',
        rates.rate1000 ? `$${rates.rate1000}` : '-',
        rates.transitTime ? `${rates.transitTime} DAYS` : '-',
        rates.frequency || '-',
        rates.routing || '-'
      ]
    ];
    this.doc.autoTable({
      startY: this.currentY,
      head: [['AIRLINE', '-45KG', '+45KG', '+100KG', '+300KG', '+500KG', '+1000KG', 'TRANSIT TIME', 'FREQUENCY', 'ROUTING']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [0, 128, 128],
        textColor: 255,
        fontSize: 10,
        fontStyle: 'bold'
      },
      bodyStyles: {
        fontSize: 10
      },
      margin: { left: this.margin, right: this.margin }
    });
    this.currentY = this.doc.lastAutoTable.finalY + 5;
  }

  addSeaFCLTable(rates) {
    if (!this.doc.autoTable) {
      console.error('jspdf-autotable plugin is not loaded. Please ensure it is installed and imported.');
      return;
    }
    const tableData = [
      [
        rates.liner || 'N/A',
        rates.rate20GP ? `$${rates.rate20GP}` : '-',
        rates.rate40GP ? `$${rates.rate40GP}` : '-',
        rates.rate40HQ ? `$${rates.rate40HQ}` : '-',
        rates.routingType || 'DIRECT',
        rates.transitTime ? `${rates.transitTime} DAYS` : '-'
      ]
    ];
    this.doc.autoTable({
      startY: this.currentY,
      head: [['LINER', '20\'GP RATE', '40 GP RATE', '40 HQ RATE', 'ROUTING', 'TRANSIT TIME']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [0, 128, 128],
        textColor: 255,
        fontSize: 10,
        fontStyle: 'bold'
      },
      bodyStyles: {
        fontSize: 10
      },
      margin: { left: this.margin, right: this.margin }
    });
    this.currentY = this.doc.lastAutoTable.finalY + 5;
  }

  addSeaLCLTable(rates) {
    if (!this.doc.autoTable) {
      console.error('jspdf-autotable plugin is not loaded. Please ensure it is installed and imported.');
      return;
    }
    const tableData = [
      [
        rates.liner || 'N/A',
        rates.lclRate ? `$${rates.lclRate} per W/M` : '-',
        rates.routingType || 'DIRECT',
        rates.transitTime ? `${rates.transitTime} DAYS` : '-'
      ]
    ];
    this.doc.autoTable({
      startY: this.currentY,
      head: [['LINER', 'LCL FREIGHT RATE', 'ROUTING', 'TRANSIT TIME']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [0, 128, 128],
        textColor: 255,
        fontSize: 10,
        fontStyle: 'bold'
      },
      bodyStyles: {
        fontSize: 10
      },
      margin: { left: this.margin, right: this.margin },
      columnStyles: {
        1: { cellWidth: 50 }
      }
    });
    this.currentY = this.doc.lastAutoTable.finalY + 5;
  }

  addAdditionalCharges(data) {
    if (!data.additionalCharges || data.additionalCharges.length === 0) {
      return;
    }
    this.currentY += 5;
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('OTHER CHARGES', this.margin, this.currentY);
    this.currentY += 7;
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    data.additionalCharges.forEach((charge, index) => {
      this.doc.text(`• ${charge.type || 'N/A'}`, this.margin, this.currentY);
      this.currentY += 5;
    });
    this.currentY += 5;
  }

  addRemarks(data) {
    if (!data.remarksList || data.remarksList.length === 0) {
      return;
    }
    if (this.currentY > 220) {
      this.doc.addPage();
      this.currentY = 20;
    }
    this.currentY += 5;
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Remarks,', this.margin, this.currentY);
    this.currentY += 7;
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    data.remarksList.forEach((remark, index) => {
      const remarkLines = this.doc.splitTextToSize(`• ${remark}`, this.pageWidth - 2 * this.margin);
      if (this.currentY + (remarkLines.length * 5) > this.pageHeight - 30) {
        this.doc.addPage();
        this.currentY = 20;
      }
      this.doc.text(remarkLines, this.margin, this.currentY);
      this.currentY += remarkLines.length * 5 + 2;
    });
  }

  addFooter(data) {
    this.currentY = this.pageHeight - 30;
    this.addLine();
    this.doc.setFontSize(9);
    this.doc.setFont('helvetica', 'italic');
    this.doc.setTextColor(100, 100, 100);
    const footerText = 'Scanwell Logistics - Professional Air & Sea Freight Services';
    this.doc.text(footerText, this.pageWidth / 2, this.currentY + 5, { align: 'center' });
    this.doc.text('Thank you for your business!', this.pageWidth / 2, this.currentY + 10, { align: 'center' });
    const paymentNotice = 'Kindly note that Scanwell Logistics will accept payments in USD currency for shipments';
    this.doc.setFontSize(8);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(255, 140, 0); // Orange color
    this.doc.text(paymentNotice, this.pageWidth / 2, this.currentY + 15, { align: 'center' });
  }

  addLine() {
    this.doc.setDrawColor(0, 128, 128);
    this.doc.setLineWidth(0.5);
    this.doc.line(this.margin, this.currentY, this.pageWidth - this.margin, this.currentY);
    this.currentY += 3;
  }

  formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  formatCurrency(amount) {
    return parseFloat(amount || 0).toFixed(2);
  }

  getFreightTypeLabel(freightType) {
    const labels = {
      'air-import': 'AIR IMPORT',
      'air-export': 'AIR EXPORT',
      'sea-import-fcl': 'SEA IMPORT FCL',
      'sea-import-lcl': 'SEA IMPORT LCL',
      'sea-export-fcl': 'SEA EXPORT FCL',
      'sea-export-lcl': 'SEA EXPORT LCL'
    };
    return labels[freightType] || 'FREIGHT SERVICE';
  }

  download(filename) {
    this.doc.save(filename);
  }

  getBlob() {
    return this.doc.output('blob');
  }
}

export default PdfGenerator;