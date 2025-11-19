import React from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const QuotationTemplate = ({ data, previewMode = false }) => {
  // Helper for formatting currency
  const formatNumber = (num) => {
    const number = parseFloat(num) || 0;
    return number.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <div id="quotation-template" style={styles.pageContainer}>
      {/* --- Header Section --- */}
      <div style={styles.header}>
        <div style={styles.logoSection}>
          {data.company.logoUrl ? (
            <img src={data.company.logoUrl} alt="Company Logo" style={styles.logo} />
          ) : (
            <div style={styles.logoPlaceholder}>
              <span style={{ color: '#0099cc', fontWeight: 'bold', fontSize: '10px' }}>Scanwell</span>
            </div>
          )}
        </div>
        <div style={styles.companyDetails}>
          <h2 style={styles.companyName}>{data.company.name}</h2>
          <p style={styles.companyText}>{data.company.address}</p>
          <p style={styles.companyText}>Office #{data.company.phone}</p>
        </div>
      </div>

      {/* --- Title --- */}
      <div style={styles.titleSection}>
        <h1 style={styles.docTitle}>Quotation</h1>
      </div>

      {/* --- Quote Meta & Customer --- */}
      <div style={styles.topMetaContainer}>
        <div style={styles.flexBetween}>
          <span style={styles.boldText}>{data.meta.quoteNumber}</span>
          <div style={styles.textAlignRight}>
            <div style={styles.boldText}>{data.meta.serviceType}</div>
            <div style={styles.boldText}>{data.meta.terms}</div>
          </div>
        </div>

        <div style={{ marginTop: '15px' }}>
          <div style={styles.sectionLabel}>Customer</div>
          <div style={styles.customerName}>{data.customer.name}</div>
          <div style={styles.customerAddress}>{data.customer.address}</div>
        </div>

        <div style={{ ...styles.flexBetween, marginTop: '15px' }}>
          <div style={{ width: '48%' }}>
            <span style={styles.sectionLabel}>Pickup Address</span>
            <div style={{ fontSize: '10px' }}>{data.shipment.pickupAddress || '-'}</div>
          </div>
          <div style={{ width: '48%' }}>
            <span style={styles.sectionLabel}>Delivery Address</span>
            <div style={{ fontSize: '10px' }}>{data.shipment.deliveryAddress || '-'}</div>
          </div>
        </div>
      </div>

      {/* --- Shipment Details (Grid) --- */}
      <div style={styles.shipmentGrid}>
        {/* Row 1 */}
        <div style={styles.gridRow}>
          <div style={styles.gridItem}>
            <div style={styles.sectionLabel}>Port of Loading</div>
            <div style={styles.gridValue}>{data.shipment.pol}</div>
          </div>
          <div style={styles.gridItem}>
            <div style={styles.sectionLabel}>Port of Discharge</div>
            <div style={styles.gridValue}>{data.shipment.pod}</div>
          </div>
        </div>
        
        {/* Row 2 */}
        <div style={{ ...styles.gridRow, marginTop: '8px' }}>
          <div style={{ flex: 1, minWidth: '80px' }}>
            <div style={styles.sectionLabel}>Delivery Terms</div>
            <div style={styles.gridValue}>{data.shipment.deliveryTerms}</div>
          </div>
          <div style={{ flex: 1, minWidth: '60px' }}>
            <div style={styles.sectionLabel}>Pcs</div>
            <div style={styles.gridValue}>{data.shipment.pcs || '-'}</div>
          </div>
          <div style={{ flex: 1, minWidth: '80px' }}>
            <div style={styles.sectionLabel}>Volume</div>
            <div style={styles.gridValue}>{data.shipment.volume ? formatNumber(data.shipment.volume) : '-'}</div>
          </div>
          <div style={{ flex: 1, minWidth: '100px' }}>
            <div style={styles.sectionLabel}>Gross Weight</div>
            <div style={styles.gridValue}>{data.shipment.grossWeight ? formatNumber(data.shipment.grossWeight) : '-'}</div>
          </div>
          <div style={{ flex: 1, minWidth: '120px' }}>
            <div style={styles.sectionLabel}>Chargeable Weight</div>
            <div style={styles.gridValue}>{data.shipment.chargeableWeight ? formatNumber(data.shipment.chargeableWeight) : '-'}</div>
          </div>
        </div>
      </div>

      {/* --- Freight Charges Table --- */}
      <div style={styles.sectionHeader}>Freight Charges</div>
      <table style={styles.table}>
        <thead>
          <tr style={styles.tableHeaderRow}>
            <th style={styles.th}>Carrier</th>
            <th style={styles.th}>Equip.</th>
            <th style={styles.th}>No of Containers</th>
            <th style={styles.th}>Rate Per</th>
            <th style={styles.th}>Cur</th>
            <th style={styles.th}>Surcharge</th>
            <th style={styles.th}>TT</th>
            <th style={styles.th}>Freq</th>
            <th style={styles.th}>Route</th>
            <th style={styles.th}>Comments</th>
          </tr>
        </thead>
        <tbody>
          {data.freightCharges && data.freightCharges.length > 0 ? (
            data.freightCharges.map((item, index) => (
              <tr key={index}>
                <td style={styles.td}>{item.carrier || '-'}</td>
                <td style={styles.td}>{item.equip || '-'}</td>
                <td style={styles.td}>{item.containers || '-'}</td>
                <td style={styles.td}>{item.rate ? `${formatNumber(item.rate)} ${item.rateUnit || ''}` : '-'}</td>
                <td style={styles.td}>{item.currency || 'USD'}</td>
                <td style={styles.td}>{item.surcharge || '-'}</td>
                <td style={styles.td}>{item.tt || '-'}</td>
                <td style={styles.td}>{item.freq || '-'}</td>
                <td style={styles.td}>{item.route || '-'}</td>
                <td style={styles.td}>{item.comments || '-'}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="10" style={{ ...styles.td, textAlign: 'center', padding: '10px' }}>
                No freight charges added
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* --- Other Charges Section --- */}
      {data.otherCharges && (data.otherCharges.lkr?.items?.length > 0 || data.otherCharges.usd?.items?.length > 0) && (
        <>
          <div style={styles.sectionHeader}>OTHER CHARGES</div>

          {/* LKR Table */}
          {data.otherCharges.lkr?.items?.length > 0 && (
            <div style={styles.subChargeSection}>
              <div style={styles.currencyHeader}>LKR</div>
              <table style={styles.chargeTable}>
                <tbody>
                  {data.otherCharges.lkr.items.map((item, idx) => (
                    <tr key={idx}>
                      <td style={styles.chargeTdName}>{item.name}</td>
                      <td style={styles.chargeTdUnit}>LKR</td>
                      <td style={styles.chargeTdAmount}>
                        {formatNumber(item.amount)} {item.unit || ''}
                      </td>
                      <td style={styles.chargeTdTotal}>{formatNumber(item.amount)}</td>
                    </tr>
                  ))}
                  <tr style={styles.totalRow}>
                    <td colSpan="3" style={styles.totalLabel}>TOTAL</td>
                    <td style={styles.totalValue}>{formatNumber(data.otherCharges.lkr.total)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* USD Table */}
          {data.otherCharges.usd?.items?.length > 0 && (
            <div style={styles.subChargeSection}>
              <div style={styles.currencyHeader}>USD</div>
              <table style={styles.chargeTable}>
                <tbody>
                  {data.otherCharges.usd.items.map((item, idx) => (
                    <tr key={idx}>
                      <td style={styles.chargeTdName}>{item.name}</td>
                      <td style={styles.chargeTdUnit}>USD</td>
                      <td style={styles.chargeTdAmount}>
                        {formatNumber(item.amount)} {item.unit || ''}
                      </td>
                      <td style={styles.chargeTdTotal}>{formatNumber(item.amount)}</td>
                    </tr>
                  ))}
                  <tr style={styles.totalRow}>
                    <td colSpan="3" style={styles.totalLabel}>TOTAL</td>
                    <td style={styles.totalValue}>{formatNumber(data.otherCharges.usd.total)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* --- Footer / Terms --- */}
      <div style={styles.footer}>
        {data.termsAndConditions && data.termsAndConditions.length > 0 && (
          <ul style={styles.termsList}>
            {data.termsAndConditions.map((term, i) => (
              <li key={i} style={{ marginBottom: '2px' }}>- {term}</li>
            ))}
          </ul>
        )}
        
        <div style={styles.generatorInfo}>
          <p style={{ margin: '5px 0' }}>Quotation generated by - {data.generatedBy || 'System'}</p>
          <p style={{ fontStyle: 'italic', fontSize: '9px', margin: 0 }}>
            This is a Computer generated Document and no Signature required.
          </p>
        </div>
      </div>
    </div>
  );
};

// --- Inline Styles ---
const styles = {
  pageContainer: {
    width: '210mm', // A4 Width
    minHeight: '297mm', // A4 Height
    padding: '15mm',
    backgroundColor: 'white',
    color: '#000',
    fontFamily: 'Arial, Helvetica, sans-serif',
    fontSize: '10px',
    boxSizing: 'border-box',
    margin: '0 auto',
    boxShadow: '0 0 10px rgba(0,0,0,0.1)'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '15px',
    paddingBottom: '10px',
    borderBottom: '1px solid #ddd'
  },
  logoSection: {
    width: '50%'
  },
  logo: {
    maxWidth: '100px',
    maxHeight: '60px'
  },
  logoPlaceholder: {
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    border: '2px solid #0099cc',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '8px',
    textAlign: 'center',
    backgroundColor: '#f0f8ff'
  },
  companyDetails: {
    textAlign: 'right',
    width: '50%'
  },
  companyName: {
    fontSize: '13px',
    fontStyle: 'italic',
    color: '#336699',
    margin: '0 0 5px 0',
    fontWeight: 'bold'
  },
  companyText: {
    margin: '2px 0',
    fontSize: '9px',
    color: '#555'
  },
  titleSection: {
    textAlign: 'center',
    marginBottom: '15px',
    paddingBottom: '10px',
    borderBottom: '2px solid #336699'
  },
  docTitle: {
    fontSize: '20px',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    color: '#336699',
    margin: 0,
    letterSpacing: '2px'
  },
  topMetaContainer: {
    marginBottom: '15px',
    padding: '10px',
    backgroundColor: '#f9f9f9',
    border: '1px solid #ddd'
  },
  flexBetween: {
    display: 'flex',
    justifyContent: 'space-between'
  },
  textAlignRight: {
    textAlign: 'right'
  },
  boldText: {
    fontWeight: 'bold',
    fontSize: '10px'
  },
  sectionLabel: {
    fontWeight: 'bold',
    fontSize: '9px',
    marginBottom: '2px',
    color: '#333'
  },
  customerName: {
    fontWeight: 'bold',
    fontSize: '10px',
    color: '#336699'
  },
  customerAddress: {
    fontSize: '9px',
    color: '#555'
  },
  shipmentGrid: {
    borderTop: '2px solid #336699',
    paddingTop: '10px',
    marginBottom: '15px',
    backgroundColor: '#f9f9f9',
    padding: '10px'
  },
  gridRow: {
    display: 'flex',
    justifyContent: 'flex-start',
    gap: '15px',
    flexWrap: 'wrap'
  },
  gridItem: {
    minWidth: '150px',
    flex: 1
  },
  gridValue: {
    fontSize: '10px',
    fontWeight: '500'
  },
  sectionHeader: {
    fontWeight: 'bold',
    fontSize: '11px',
    textDecoration: 'underline',
    marginBottom: '5px',
    marginTop: '12px',
    color: '#336699'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    border: '1px solid #333',
    marginBottom: '10px',
    fontSize: '9px'
  },
  tableHeaderRow: {
    backgroundColor: '#e6f2ff',
    borderBottom: '2px solid #333'
  },
  th: {
    border: '1px solid #333',
    padding: '5px 3px',
    textAlign: 'left',
    fontSize: '9px',
    fontWeight: 'bold',
    backgroundColor: '#d4e6f7'
  },
  td: {
    border: '1px solid #333',
    padding: '4px 3px',
    textAlign: 'left',
    fontSize: '8px'
  },
  subChargeSection: {
    marginBottom: '10px'
  },
  currencyHeader: {
    fontWeight: 'bold',
    fontSize: '10px',
    textDecoration: 'underline',
    marginBottom: '3px',
    color: '#336699'
  },
  chargeTable: {
    width: '100%',
    borderCollapse: 'collapse',
    marginBottom: '5px',
    fontSize: '9px'
  },
  chargeTdName: {
    width: '40%',
    padding: '3px 5px',
    fontSize: '9px',
    borderBottom: '1px solid #eee'
  },
  chargeTdUnit: {
    width: '10%',
    textAlign: 'left',
    fontSize: '9px',
    padding: '3px',
    borderBottom: '1px solid #eee'
  },
  chargeTdAmount: {
    width: '30%',
    textAlign: 'right',
    paddingRight: '10px',
    fontSize: '9px',
    borderBottom: '1px solid #eee'
  },
  chargeTdTotal: {
    width: '20%',
    textAlign: 'right',
    fontWeight: 'bold',
    fontSize: '9px',
    paddingRight: '5px',
    borderBottom: '1px solid #eee'
  },
  totalRow: {
    borderTop: '1px solid #999',
    borderBottom: '2px solid #333',
    backgroundColor: '#f0f0f0'
  },
  totalLabel: {
    fontWeight: 'bold',
    padding: '5px',
    fontSize: '10px',
    textAlign: 'right'
  },
  totalValue: {
    fontWeight: 'bold',
    textAlign: 'right',
    padding: '5px',
    fontSize: '10px'
  },
  footer: {
    marginTop: '20px',
    borderTop: '2px solid #336699',
    paddingTop: '10px'
  },
  termsList: {
    listStyleType: 'none',
    padding: 0,
    margin: 0,
    fontSize: '8px',
    lineHeight: '1.5',
    color: '#444'
  },
  generatorInfo: {
    marginTop: '20px',
    fontSize: '9px',
    color: '#666',
    borderTop: '1px solid #ddd',
    paddingTop: '10px'
  }
};

// --- PDF Generation Function ---
export const generatePDF = async (data, filename = 'quotation.pdf') => {
  try {
    // Create a temporary container
    const tempDiv = document.createElement('div');
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.style.top = '0';
    document.body.appendChild(tempDiv);

    // Render the quotation template into the temp div
    const root = ReactDOM.createRoot(tempDiv);
    root.render(<QuotationTemplate data={data} />);

    // Wait for rendering
    await new Promise(resolve => setTimeout(resolve, 500));

    const element = document.getElementById('quotation-template');
    
    if (!element) {
      throw new Error('Quotation template element not found');
    }

    // Generate canvas from HTML
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });

    // Create PDF
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
    const imgX = (pdfWidth - imgWidth * ratio) / 2;
    const imgY = 0;

    pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
    
    // Save PDF
    pdf.save(filename);

    // Cleanup
    root.unmount();
    document.body.removeChild(tempDiv);

    return { success: true, message: 'PDF generated successfully' };
  } catch (error) {
    console.error('Error generating PDF:', error);
    return { success: false, message: error.message };
  }
};

export default QuotationTemplate;