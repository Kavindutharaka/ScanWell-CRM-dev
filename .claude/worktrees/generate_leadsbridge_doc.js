const fs = require('fs');
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, AlignmentType, BorderStyle, WidthType, ShadingType,
  LevelFormat, PageOrientation, TabStopType, TabStopPosition
} = require('docx');

const BRAND = "2E75B6";
const HEADER_FILL = "2E75B6";
const ALT_FILL = "F2F2F2";
const BORDER_COLOR = "BFBFBF";

const border = { style: BorderStyle.SINGLE, size: 4, color: BORDER_COLOR };
const cellBorders = { top: border, bottom: border, left: border, right: border };
const cellMargins = { top: 100, bottom: 100, left: 140, right: 140 };

function headerCell(text, width) {
  return new TableCell({
    borders: cellBorders,
    width: { size: width, type: WidthType.DXA },
    shading: { fill: HEADER_FILL, type: ShadingType.CLEAR, color: "auto" },
    margins: cellMargins,
    children: [new Paragraph({
      children: [new TextRun({ text, bold: true, color: "FFFFFF", size: 22 })]
    })]
  });
}

function bodyCell(text, width, altRow = false, bold = false) {
  const shading = altRow ? { fill: ALT_FILL, type: ShadingType.CLEAR, color: "auto" } : undefined;
  return new TableCell({
    borders: cellBorders,
    width: { size: width, type: WidthType.DXA },
    shading,
    margins: cellMargins,
    children: [new Paragraph({
      children: [new TextRun({ text, size: 22, bold })]
    })]
  });
}

function heading(text, level = HeadingLevel.HEADING_1) {
  return new Paragraph({
    heading: level,
    children: [new TextRun({ text })]
  });
}

function para(text, opts = {}) {
  return new Paragraph({
    spacing: { after: 120 },
    children: [new TextRun({ text, size: 22, ...opts })]
  });
}

function bullet(text) {
  return new Paragraph({
    numbering: { reference: "bullets", level: 0 },
    children: [new TextRun({ text, size: 22 })]
  });
}

function numbered(text) {
  return new Paragraph({
    numbering: { reference: "numbers", level: 0 },
    children: [new TextRun({ text, size: 22 })]
  });
}

// Supported platforms table
const platformsTable = new Table({
  width: { size: 9360, type: WidthType.DXA },
  columnWidths: [2400, 2400, 4560],
  rows: [
    new TableRow({
      tableHeader: true,
      children: [
        headerCell("Platform", 2400),
        headerCell("Source", 2400),
        headerCell("Data Synced to CRM", 4560),
      ]
    }),
    new TableRow({
      children: [
        bodyCell("Facebook Lead Ads", 2400),
        bodyCell("Meta Graph API", 2400),
        bodyCell("Full name, email, phone, custom form fields, campaign name, ad set, ad ID", 4560),
      ]
    }),
    new TableRow({
      children: [
        bodyCell("Instagram Lead Ads", 2400, true),
        bodyCell("Meta Graph API", 2400, true),
        bodyCell("Full name, email, phone, custom form fields, campaign name, ad creative", 4560, true),
      ]
    }),
    new TableRow({
      children: [
        bodyCell("WhatsApp Business", 2400),
        bodyCell("WhatsApp Business API", 2400),
        bodyCell("Contact name, phone number, message content, timestamp, conversation ID", 4560),
      ]
    }),
  ]
});

// Monthly pricing table
const monthlyTable = new Table({
  width: { size: 9360, type: WidthType.DXA },
  columnWidths: [1800, 1500, 2200, 1700, 2160],
  rows: [
    new TableRow({
      tableHeader: true,
      children: [
        headerCell("Plan", 1800),
        headerCell("Price (USD)", 1500),
        headerCell("Leads / Month", 2200),
        headerCell("Bridges", 1700),
        headerCell("Service Type", 2160),
      ]
    }),
    new TableRow({
      children: [
        bodyCell("Free", 1800),
        bodyCell("$0", 1500),
        bodyCell("50", 2200),
        bodyCell("1", 1700),
        bodyCell("Self-Service", 2160),
      ]
    }),
    new TableRow({
      children: [
        bodyCell("Starter", 1800, true),
        bodyCell("$29 / month", 1500, true),
        bodyCell("800", 2200, true),
        bodyCell("3", 1700, true),
        bodyCell("Self-Service", 2160, true),
      ]
    }),
    new TableRow({
      children: [
        bodyCell("Pro  (Recommended)", 1800, false, true),
        bodyCell("$79 / month", 1500, false, true),
        bodyCell("2,000", 2200, false, true),
        bodyCell("15", 1700, false, true),
        bodyCell("Self-Service", 2160, false, true),
      ]
    }),
    new TableRow({
      children: [
        bodyCell("Business", 1800, true),
        bodyCell("$999 / month", 1500, true),
        bodyCell("Custom volume", 2200, true),
        bodyCell("Unlimited", 1700, true),
        bodyCell("Managed-Service", 2160, true),
      ]
    }),
  ]
});

// Annual pricing table
const annualTable = new Table({
  width: { size: 9360, type: WidthType.DXA },
  columnWidths: [1800, 2200, 2200, 1700, 1460],
  rows: [
    new TableRow({
      tableHeader: true,
      children: [
        headerCell("Plan", 1800),
        headerCell("Price (USD)", 2200),
        headerCell("Leads / Month", 2200),
        headerCell("Bridges", 1700),
        headerCell("Savings", 1460),
      ]
    }),
    new TableRow({
      children: [
        bodyCell("Free", 1800),
        bodyCell("$0", 2200),
        bodyCell("50", 2200),
        bodyCell("1", 1700),
        bodyCell("—", 1460),
      ]
    }),
    new TableRow({
      children: [
        bodyCell("Starter", 1800, true),
        bodyCell("$22 / mo (billed annually)", 2200, true),
        bodyCell("800", 2200, true),
        bodyCell("3", 1700, true),
        bodyCell("3 months free", 1460, true),
      ]
    }),
    new TableRow({
      children: [
        bodyCell("Pro  (Recommended)", 1800, false, true),
        bodyCell("$60 / mo (billed annually)", 2200, false, true),
        bodyCell("2,000", 2200, false, true),
        bodyCell("15", 1700, false, true),
        bodyCell("3 months free", 1460, false, true),
      ]
    }),
    new TableRow({
      children: [
        bodyCell("Business", 1800, true),
        bodyCell("$999 / mo (billed annually)", 2200, true),
        bodyCell("Custom volume", 2200, true),
        bodyCell("Unlimited", 1700, true),
        bodyCell("Custom", 1460, true),
      ]
    }),
  ]
});

const doc = new Document({
  creator: "ScanWell CRM",
  title: "ScanWell CRM — Meta Platforms Integration via LeadsBridge",
  styles: {
    default: { document: { run: { font: "Arial", size: 22 } } },
    paragraphStyles: [
      {
        id: "Title", name: "Title", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 36, bold: true, font: "Arial", color: BRAND },
        paragraph: { spacing: { before: 0, after: 120 } }
      },
      {
        id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 28, bold: true, font: "Arial", color: BRAND },
        paragraph: { spacing: { before: 280, after: 140 }, outlineLevel: 0 }
      },
      {
        id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 24, bold: true, font: "Arial", color: "333333" },
        paragraph: { spacing: { before: 200, after: 100 }, outlineLevel: 1 }
      }
    ]
  },
  numbering: {
    config: [
      {
        reference: "bullets",
        levels: [{
          level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } }
        }]
      },
      {
        reference: "numbers",
        levels: [{
          level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } }
        }]
      }
    ]
  },
  sections: [{
    properties: {
      page: {
        size: { width: 12240, height: 15840 },
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
      }
    },
    children: [
      // Title
      new Paragraph({
        style: "Title",
        children: [new TextRun({ text: "ScanWell CRM" })]
      }),
      new Paragraph({
        spacing: { after: 200 },
        children: [new TextRun({
          text: "Meta Platforms Integration via LeadsBridge",
          size: 26, bold: true, color: "555555"
        })]
      }),
      new Paragraph({
        border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: BRAND, space: 1 } },
        children: [new TextRun({ text: "" })]
      }),

      // 1. Overview
      heading("1. Overview"),
      para("This document outlines the integration between ScanWell CRM and Meta platforms (Facebook, Instagram, and WhatsApp) using LeadsBridge as the third-party integration layer. The goal is to replace manual Excel-based lead uploads with a real-time, API-driven lead capture flow that pushes every lead directly into ScanWell CRM the moment it is generated."),
      para("LeadsBridge is an official Meta Business Partner offering a secure, compliant bridge between Meta Lead Ads / WhatsApp Business and third-party CRM systems. This eliminates manual work, reduces lead response time, and ensures no lead is lost."),

      // 2. Integration Method
      heading("2. Integration Method"),
      para("The integration follows a simple, real-time data flow from Meta platforms into ScanWell CRM:", { bold: true }),
      numbered("A user submits a lead form on Facebook Lead Ads, Instagram Lead Ads, or sends an inquiry via WhatsApp Business."),
      numbered("LeadsBridge receives the event in real-time via the Meta Graph API / WhatsApp Business API."),
      numbered("LeadsBridge applies the configured field mapping (Meta form fields  \u2192  ScanWell CRM fields)."),
      numbered("LeadsBridge pushes the mapped lead to ScanWell CRM through a secure webhook / REST API endpoint."),
      numbered("ScanWell CRM validates, stores, and displays the lead instantly on the user\u2019s dashboard."),
      para("End-to-end delivery time: typically under 10 seconds from form submission to CRM appearance.", { italics: true }),

      // 3. Supported Platforms
      heading("3. Supported Platforms"),
      platformsTable,
      new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: "" })] }),

      // 4. API Integration Architecture
      heading("4. API Integration Architecture"),
      para("The integration architecture consists of three layers:", { bold: true }),
      bullet("Source layer  \u2014  Meta Graph API and WhatsApp Business API expose lead events from Facebook, Instagram, and WhatsApp."),
      bullet("Middleware layer  \u2014  LeadsBridge \u201CBridges\u201D authenticate with Meta (OAuth), subscribe to lead events, handle field mapping, transformation, and delivery."),
      bullet("Destination layer  \u2014  ScanWell CRM exposes a secure webhook / REST endpoint that accepts authenticated lead payloads from LeadsBridge."),
      bullet("Real-time sync  \u2014  Event-driven push (not polling) for sub-10-second delivery."),
      bullet("Field mapping  \u2014  Configurable per-platform mapping between Meta form fields and ScanWell CRM fields."),
      bullet("Error handling  \u2014  Automatic retry on failed deliveries, error logging, and notification alerts via LeadsBridge dashboard."),
      bullet("Security  \u2014  OAuth 2.0 with Meta, HTTPS-only webhook endpoint, API key authentication on ScanWell CRM side."),

      // 5. LeadsBridge Subscription Pricing
      heading("5. LeadsBridge Subscription Pricing"),
      para("LeadsBridge offers flexible pricing based on monthly lead volume and number of active bridges. Two billing cycles are available:"),

      heading("Monthly Billing", HeadingLevel.HEADING_2),
      monthlyTable,
      new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: "" })] }),

      heading("Annual Billing", HeadingLevel.HEADING_2),
      annualTable,
      new Paragraph({
        spacing: { after: 120 },
        children: [new TextRun({
          text: "Save 3 months with annual subscription \u2014 pay for 9 months, get 12.",
          italics: true, color: "C0504D"
        })]
      }),

      // 6. Recommended Plan
      heading("6. Recommended Plan"),
      para("For ScanWell CRM\u2019s projected lead volume and the need to connect Facebook, Instagram, and WhatsApp simultaneously, the Pro tier is recommended:", { bold: true }),
      bullet("Monthly: USD 79 / month."),
      bullet("Annually: USD 60 / month (billed annually \u2014 saves USD 228 per year)."),
      bullet("Includes up to 2,000 leads per month."),
      bullet("Includes up to 15 bridges  \u2014  enough to cover Facebook Lead Ads + Instagram Lead Ads + WhatsApp Business with room to add more campaigns or platforms later."),
      bullet("Self-service plan \u2014 full access to the LeadsBridge dashboard for bridge management."),

      // 7. Cost Summary
      heading("7. Cost Summary"),
      para("The client\u2019s total cost for this integration is split into two parts:", { bold: true }),
      bullet("LeadsBridge subscription \u2014 paid directly to LeadsBridge (monthly or annually, Pro tier recommended)."),
      bullet("ScanWell CRM integration setup fee \u2014 one-time fee covering configuration, field mapping, webhook setup, testing, and documentation."),
      para("LeadsBridge billing is handled on the LeadsBridge platform; ScanWell CRM has no involvement in LeadsBridge payment processing."),

      // 8. Deliverables
      heading("8. Deliverables"),
      bullet("LeadsBridge account setup and verification with the client\u2019s Meta Business Manager."),
      bullet("Bridge configuration for Facebook Lead Ads \u2192 ScanWell CRM."),
      bullet("Bridge configuration for Instagram Lead Ads \u2192 ScanWell CRM."),
      bullet("Bridge configuration for WhatsApp Business \u2192 ScanWell CRM."),
      bullet("ScanWell CRM webhook endpoint implementation and authentication."),
      bullet("Field mapping for all three platforms."),
      bullet("End-to-end testing with live test leads from each platform."),
      bullet("Integration documentation and handover to the client team."),

      // Footer note
      new Paragraph({
        spacing: { before: 400 },
        border: { top: { style: BorderStyle.SINGLE, size: 6, color: BRAND, space: 8 } },
        children: [new TextRun({
          text: "ScanWell CRM  \u2014  Meta Integration Proposal",
          size: 18, color: "808080", italics: true
        })]
      }),
    ]
  }]
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync("D:/Kavindu/ScanWell-CRM-dev-2/ScanWell_CRM_Meta_Integration_LeadsBridge.docx", buffer);
  console.log("Generated: ScanWell_CRM_Meta_Integration_LeadsBridge.docx");
}).catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
