import React from 'react';

const Quotation = ({ data }) => {
  // Helper for formatting currency
  const formatNumber = (num) => num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div style={styles.pageContainer}>
      {/* --- Header Section --- */}
      <div style={styles.header}>
        <div style={styles.logoSection}>
          {/* In a real scenario, use <img src={data.company.logoUrl} /> */}
          <div style={styles.logoPlaceholder}>
            <span style={{ color: '#0099cc', fontWeight: 'bold' }}>Scanwell Logo</span>
          </div>
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

        <div style={{ marginTop: '20px' }}>
          <div style={styles.sectionLabel}>Customer</div>
          <div style={styles.customerName}>{data.customer.name}</div>
          <div style={styles.customerAddress}>{data.customer.address}</div>
        </div>

        <div style={{ ...styles.flexBetween, marginTop: '20px' }}>
          <div>
            <span style={styles.sectionLabel}>Pickup Address</span>
            <div>{data.shipment.pickupAddress || ''}</div>
          </div>
          <div>
            <span style={styles.sectionLabel}>Delivery Address</span>
            <div>{data.shipment.deliveryAddress || ''}</div>
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
        <div style={{ ...styles.gridRow, marginTop: '10px' }}>
          <div style={{ flex: 1 }}>
            <div style={styles.sectionLabel}>Delivery Terms</div>
            <div style={styles.gridValue}>{data.shipment.deliveryTerms}</div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={styles.sectionLabel}>Pcs</div>
            <div style={styles.gridValue}>{data.shipment.pcs}</div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={styles.sectionLabel}>Volume</div>
            <div style={styles.gridValue}>{formatNumber(data.shipment.volume)}</div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={styles.sectionLabel}>Gross Weight</div>
            <div style={styles.gridValue}>{formatNumber(data.shipment.grossWeight)}</div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={styles.sectionLabel}>Chargable Weight</div>
            <div style={styles.gridValue}>{formatNumber(data.shipment.chargableWeight)}</div>
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
          {data.freightCharges.map((item, index) => (
            <tr key={index}>
              <td style={styles.td}>{item.carrier}</td>
              <td style={styles.td}>{item.equip}</td>
              <td style={styles.td}>{item.containers}</td>
              <td style={styles.td}>{formatNumber(item.rate)} {item.rateUnit}</td>
              <td style={styles.td}>{item.currency}</td>
              <td style={styles.td}>{item.surcharge}</td>
              <td style={styles.td}>{item.tt}</td>
              <td style={styles.td}>{item.freq}</td>
              <td style={styles.td}>{item.route}</td>
              <td style={styles.td}>{item.comments}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* --- Other Charges Section --- */}
      <div style={styles.sectionHeader}>OTHER CHARGES</div>

      {/* LKR Table */}
      <div style={styles.subChargeSection}>
        <div style={styles.currencyHeader}>LKR</div>
        <table style={styles.chargeTable}>
          <tbody>
            {data.otherCharges.lkr.items.map((item, idx) => (
              <tr key={idx}>
                <td style={styles.chargeTdName}>{item.name}</td>
                <td style={styles.chargeTdUnit}>LKR</td>
                <td style={styles.chargeTdAmount}>{formatNumber(item.amount)} {item.unit}</td>
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

      {/* USD Table */}
      <div style={styles.subChargeSection}>
        <div style={styles.currencyHeader}>USD</div>
        <table style={styles.chargeTable}>
          <tbody>
            {data.otherCharges.usd.items.map((item, idx) => (
              <tr key={idx}>
                <td style={styles.chargeTdName}>{item.name}</td>
                <td style={styles.chargeTdUnit}>USD</td>
                <td style={styles.chargeTdAmount}>{formatNumber(item.amount)} {item.unit}</td>
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

      {/* --- Footer / Terms --- */}
      <div style={styles.footer}>
        <ul style={styles.termsList}>
          {data.termsAndConditions.map((term, i) => (
            <li key={i}>- {term}</li>
          ))}
        </ul>
        
        <div style={styles.generatorInfo}>
          <p>Quotation generated by - {data.generatedBy}</p>
          <p style={{ fontStyle: 'italic', fontSize: '10px' }}>
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
    padding: '20mm',
    backgroundColor: 'white',
    color: '#000',
    fontFamily: 'Arial, Helvetica, sans-serif',
    fontSize: '11px',
    boxSizing: 'border-box',
    margin: '0 auto',
    boxShadow: '0 0 10px rgba(0,0,0,0.1)' // Visual help if viewed on screen
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '20px'
  },
  logoSection: {
    width: '50%'
  },
  logoPlaceholder: {
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    border: '1px solid #ccc',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '8px',
    textAlign: 'center'
  },
  companyDetails: {
    textAlign: 'right',
    width: '50%'
  },
  companyName: {
    fontSize: '14px',
    fontStyle: 'italic',
    color: '#336699',
    margin: 0
  },
  companyText: {
    margin: 0,
    fontSize: '10px',
    color: '#555'
  },
  titleSection: {
    textAlign: 'center',
    marginBottom: '20px'
  },
  docTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    textTransform: 'uppercase'
  },
  topMetaContainer: {
    marginBottom: '20px'
  },
  flexBetween: {
    display: 'flex',
    justifyContent: 'space-between'
  },
  textAlignRight: {
    textAlign: 'right'
  },
  boldText: {
    fontWeight: 'bold'
  },
  sectionLabel: {
    fontWeight: 'bold',
    fontSize: '11px',
    marginBottom: '2px'
  },
  customerName: {
    fontWeight: 'bold',
    fontSize: '11px'
  },
  customerAddress: {
    fontSize: '11px'
  },
  shipmentGrid: {
    borderTop: '2px solid #000',
    paddingTop: '10px',
    marginBottom: '20px'
  },
  gridRow: {
    display: 'flex',
    justifyContent: 'flex-start',
    gap: '20px'
  },
  gridItem: {
    width: '200px'
  },
  gridValue: {
    fontSize: '11px'
  },
  sectionHeader: {
    fontWeight: 'bold',
    textDecoration: 'underline',
    marginBottom: '5px',
    marginTop: '15px'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    border: '1px solid #000',
    marginBottom: '10px'
  },
  tableHeaderRow: {
    backgroundColor: '#fff',
    borderBottom: '1px solid #000'
  },
  th: {
    borderRight: '1px solid #000',
    padding: '4px',
    textAlign: 'left',
    fontSize: '10px',
    fontWeight: 'bold'
  },
  td: {
    borderRight: '1px solid #000',
    padding: '4px',
    textAlign: 'left',
    fontSize: '10px'
  },
  subChargeSection: {
    marginBottom: '10px'
  },
  currencyHeader: {
    fontWeight: 'bold',
    textDecoration: 'underline',
    marginBottom: '2px'
  },
  chargeTable: {
    width: '100%',
    borderCollapse: 'collapse',
    marginBottom: '5px'
  },
  chargeTdName: {
    width: '40%',
    padding: '3px 0',
    fontSize: '10px'
  },
  chargeTdUnit: {
    width: '10%',
    textAlign: 'left',
    fontSize: '10px'
  },
  chargeTdAmount: {
    width: '30%',
    textAlign: 'right',
    paddingRight: '20px',
    fontSize: '10px'
  },
  chargeTdTotal: {
    width: '20%',
    textAlign: 'right',
    fontWeight: 'bold',
    fontSize: '10px'
  },
  totalRow: {
    borderTop: '1px dashed #999',
    borderBottom: '2px solid #000'
  },
  totalLabel: {
    fontWeight: 'bold',
    padding: '5px0',
    fontSize: '11px',
    textAlign: 'left'
  },
  totalValue: {
    fontWeight: 'bold',
    textAlign: 'right',
    padding: '5px 0',
    fontSize: '11px'
  },
  footer: {
    marginTop: '30px',
    borderTop: '2px solid #000',
    paddingTop: '10px'
  },
  termsList: {
    listStyleType: 'none',
    padding: 0,
    margin: 0,
    fontSize: '9px',
    lineHeight: '1.4'
  },
  generatorInfo: {
    marginTop: '30px',
    fontSize: '10px'
  }
};

export default Quotation;