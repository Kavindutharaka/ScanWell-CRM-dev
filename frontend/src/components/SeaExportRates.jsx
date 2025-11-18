import React from 'react';

const SeaExportRates = () => {
  const fclCharges = [
    'Freight Charges',
    'EXW Charges',
    'BL Fee',
    'CFS charges',
    'Loading/ Unloading',
    'Custom clearance charges',
    'Handling Charges',
    'PSS charges',
    'ACI Fee',
    'AMS Fee',
    'ECI fee',
    'Pickup Charges',
    'Local Forwarding charges',
    'SLPA charges',
    'Doc Fee',
    'Export license fee',
    'Trico Gatepass',
    'VGM fee',
    'Manifest amendment fee',
    'EDI charges',
    'Peek charges',
    'Origin Charges',
    'Others',
    'Waiting Charges',
    'Palletizing Charges',
    'Labour Charges',
    'Equipment charges',
    'DG surcharges',
    'Over weight surcharges'
  ];

  const lclCharges = [
    ...fclCharges,
    'Custom Inspection fee',
    'Additional surcharges',
    'GRI charges'
  ];

  const remarksFcl = [
    'Rates are valid till …………. - Subject to Surcharge fluctuations as per the Carrier',
    'Rates are subject to fluctuation by the carrier with or without prior notice',
    'Rates are subject to destination chargers.',
    'Vessel are subject blank sailings/Omitting Colombo port, Roll overs with or without prior notice.',
    'Rates are subject to local forwarding chargers',
    'Quoted rate based on CY/CY basis'
  ];

  const remarksLcl = [
    'Rates are valid till …………. - Subject to Surcharge fluctuations as per the Carrier',
    'Rates are subject to fluctuation by the carrier with or without prior notice',
    'Rates are subject to destination chargers.',
    'Vessel are subject blank sailings/Omitting Colombo port, Roll overs with or without prior notice.',
    'Rates are subject to local forwarding chargers',
    'Quoted rate based on CFS/CFS basis'
  ];

  const closingText = `If there is any further clarification please do feel free to contact us. Trust the rates and 
services are acceptable and look forward to handling your valuable cargo. 
Kindly note that Scanwell’ Logistics will accept payments in USD currency for shipments`;

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      {/* FCL Section */}
      <div style={{ marginBottom: '40px' }}>
        <h1 style={{ textAlign: 'center', color: '#FFD700', borderBottom: '2px solid #FFD700', paddingBottom: '10px' }}>
          SEA EXPORT FCL
        </h1>
        <p style={{ textAlign: 'center', marginBottom: '20px' }}>Dear Mr/Ms.,</p>
        <p style={{ textAlign: 'center', marginBottom: '20px' }}>
          Please note below Sea freight rates from Colombo to _____ for your kind reference.
        </p>

        {/* FCL Rates Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
          <thead>
            <tr style={{ backgroundColor: '#ADD8E6' }}>
              <th style={{ border: '1px solid #ccc', padding: '8px' }}>LINER</th>
              <th style={{ border: '1px solid #ccc', padding: '8px' }}>20’GP RATE USD</th>
              <th style={{ border: '1px solid #ccc', padding: '8px' }}>40 GP RATE USD</th>
              <th style={{ border: '1px solid #ccc', padding: '8px' }}>40 HQ RATE USD</th>
              <th style={{ border: '1px solid #ccc', padding: '8px' }}>ROUTING</th>
              <th style={{ border: '1px solid #ccc', padding: '8px' }}>TRANSIT TIME DAYS</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'center' }} colSpan="6">
                (Rates to be filled)
              </td>
            </tr>
          </tbody>
        </table>

        {/* Other Charges */}
        <h3 style={{ color: '#000080' }}>OTHER CHARGES</h3>
        <p>Under Charges type.</p>
        <ul style={{ marginBottom: '20px' }}>
          {fclCharges.map((charge, index) => (
            <li key={index} style={{ marginBottom: '5px' }}>{charge}</li>
          ))}
        </ul>

        {/* Remarks */}
        <h3>Remarks,</h3>
        <ul>
          {remarksFcl.map((remark, index) => (
            <li key={index} style={{ marginBottom: '5px' }}>{remark}</li>
          ))}
        </ul>

        <p style={{ textAlign: 'center', marginTop: '20px' }}>{closingText}</p>
      </div>

      {/* LCL Section */}
      <div>
        <h1 style={{ textAlign: 'center', color: '#FFD700', borderBottom: '2px solid #FFD700', paddingBottom: '10px' }}>
          SEA EXPORT LCL
        </h1>
        <p style={{ textAlign: 'center', marginBottom: '20px' }}>Dear Mr/Ms.,</p>
        <p style={{ textAlign: 'center', marginBottom: '20px' }}>
          Please note below Sea freight rates from Colombo to _____ for your kind reference.
        </p>

        {/* LCL Rates Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
          <thead>
            <tr style={{ backgroundColor: '#ADD8E6' }}>
              <th style={{ border: '1px solid #ccc', padding: '8px' }}>LINER</th>
              <th style={{ border: '1px solid #ccc', padding: '8px' }}>FREIGHT RATE USD</th>
              <th style={{ border: '1px solid #ccc', padding: '8px' }}>ROUTING</th>
              <th style={{ border: '1px solid #ccc', padding: '8px' }}>TRANSIT TIME DAYS</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'center' }} colSpan="4">
                (Rates to be filled)
              </td>
            </tr>
          </tbody>
        </table>

        {/* Other Charges for LCL */}
        <h3 style={{ color: '#000080' }}>OTHER CHARGES</h3>
        <p>Under Charges type.</p>
        <ul style={{ marginBottom: '20px' }}>
          {lclCharges.map((charge, index) => (
            <li key={index} style={{ marginBottom: '5px' }}>{charge}</li>
          ))}
        </ul>

        {/* Remarks for LCL */}
        <h3>Remarks,</h3>
        <ul>
          {remarksLcl.map((remark, index) => (
            <li key={index} style={{ marginBottom: '5px' }}>{remark}</li>
          ))}
        </ul>

        <p style={{ textAlign: 'center', marginTop: '20px' }}>{closingText}</p>
      </div>
    </div>
  );
};

export default SeaExportRates;