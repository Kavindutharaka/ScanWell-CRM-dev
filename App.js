import React from 'react';
import Quotation from './Quotation'; // Assuming you saved the component above as Quotation.js

function App() {
  // This is the dynamic data object you would fetch from an API or database
  const quoteData = {
    company: {
      logoUrl: "", 
      name: "Scanwell Logistics Colombo (Pvt) Ltd.",
      address: "67/1 Hudson Road Colombo 3 Sri Lanka.",
      phone: "+94 11 2426600/4766400"
    },
    meta: {
      quoteNumber: "Q-2025-11-36",
      serviceType: "LCL – Sea Import",
      terms: "Credit Terms"
    },
    customer: {
      name: "COURTAULDS TRADING COMPANY (PVT) LTD",
      address: "PALUGAHAWELA, KATUWELLEGAMA, 11526, SRI LANKA, KULIYAPITIYA, SRI LANKA"
    },
    shipment: {
      pickupAddress: "",
      deliveryAddress: "",
      pol: "HO CHI MINH",
      pod: "COLOMBO",
      deliveryTerms: "EXW",
      pcs: 25,
      volume: 5.00,
      grossWeight: 236.00,
      chargableWeight: 256.00
    },
    freightCharges: [
      {
        carrier: "WHL",
        equip: "",
        containers: 0,
        rate: 23.00,
        rateUnit: "per CBM",
        currency: "USD",
        surcharge: "",
        tt: "10",
        freq: "WEEKLY",
        route: "DIRECT",
        comments: ""
      }
    ],
    otherCharges: {
      lkr: {
        items: [
          { name: "DO CHARGES", amount: 18000.00, unit: "per Shipment" }
        ],
        total: 18000.00
      },
      usd: {
        items: [
          { name: "Handling Charge", amount: 25.00, unit: "per Shipment" }
        ],
        total: 25.00
      }
    },
    termsAndConditions: [
      "RATES ARE VALID TILL < > - SUBJECT TO SURCHARGE FLUCTUATIONS AS PER THE CARRIER",
      "RATES ARE SUBJECT TO INWARD LOCAL HANDLING CHARGES OF LKR.18000.00 + VAT (SVAT)",
      "RATES ARE QUOTED ON FOB/EXW BASIS.",
      "RATES ARE NOT APPLICABLE FOR DANGEROUS GOODS OR PERISHABLE CARGO",
      "DUE TO THE CURRENT MARITIME CONSTRAINT'S",
      "VESSEL ARE SUBJECT BLANK SAILINGS/OMITTING COLOMBO PORT, ROLL OVERS WITH OR WITHOUT PRIOR NOTICE.",
      "RATES ARE SUBJECT TO CONTAINER DEPOSIT."
    ],
    generatedBy: "rukshala"
  };

  return (
    <div style={{ backgroundColor: '#f0f0f0', padding: '40px', minHeight: '100vh' }}>
      {/* Render the Quotation component with the data */}
      <Quotation data={quoteData} />
    </div>
  );
}

export default App;