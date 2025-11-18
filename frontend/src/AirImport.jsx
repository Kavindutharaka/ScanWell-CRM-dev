import { useState, useEffect, useMemo } from 'react';

export default function AirImportTemplate({ 
  name = "Kamal Gunrathne", 
  origin = "Matare", 
  rateData = {}, 
  additionalCharges = [], 
  remarks = [],
  currency = 'USD',
  autoCopy = false,
  onCopySuccess
}) {
  // Padding function for fixed-width columns
  const padString = (str, width, align = 'left') => {
    const string = String(str || '');
    if (string.length >= width) return string.slice(0, width);
    const padding = ' '.repeat(width - string.length);
    return align === 'left' ? string + padding : padding + string;
  };

  const totalExWorks = additionalCharges.reduce((sum, charge) => sum + (parseFloat(charge.amount) || 0), 0);

  const tableDetails = [
    { id: 1, name: "AIRLINE", value: rateData.airline || '' },
    { id: 2, name: "-45KG", value: `${rateData.rateM || 0} ${currency}` },
    { id: 3, name: "+45KG", value: `${rateData.rate45Minus || 0} ${currency}` },
    { id: 4, name: "TOTAL EX-WORKSCHARGES", value: `${totalExWorks.toFixed(2)} ${currency}` },
    { id: 5, name: "Transit time", value: rateData.transitTime ? (isNaN(rateData.transitTime) ? rateData.transitTime : `${rateData.transitTime} days`) : '' },
    { id: 6, name: "FREQUENCY", value: rateData.frequency || '' },
    { id: 7, name: "ROUTING", value: rateData.routing || '' },
  ];

  const formattedText = useMemo(() => {
    const columnWidths = [25, 14, 14, 30, 20, 20, 20]; // Widths for each column
    const headerRow = tableDetails
      .map((detail, index) => padString(detail.name, columnWidths[index], 'left'))
      .join('');
    const dataRow = tableDetails
      .map((detail, index) => padString(detail.value || '', columnWidths[index], 'left'))
      .join('');

    // console.log("yyyyy: ", dataRow);

    const chargesSection = additionalCharges.length > 0 
      ? additionalCharges
          .map(charge => 
            `${padString(
              `${charge.type || charge.name || 'Unknown Charge'} ${charge.description ? `(${charge.description})` : ''}`,
              30,
              'left'
            )}${padString(
              `${(charge.amount || 0)}${currency}`,
              10,
              'right'
            )}`
          )
          .join('\n')
      : '';

    const remarksSection = remarks.length > 0 
      ? remarks.map(remark => `• ${remark}`).join('\n')
      : '';

    return `AIR IMPORT

Dear Mr/Ms. ${name},

Please note below Air rates from ${origin} to Colombo for your kind reference.

${headerRow}
${dataRow}

${chargesSection ? `\nAdditional Charges:\n${chargesSection}\n` : ''}

Remarks,
${remarksSection ? `\n${remarksSection}` : ''}

If there is any further clarification please do feel free to contact us. Trust the rates and services are acceptable and look forward to handling your valuable cargo.

Kindly note that Scanwell’ Logistics will accept payments in ${currency} currency for shipments`;
  }, [name, origin, tableDetails, additionalCharges, remarks, currency, totalExWorks, rateData]);

  const [copied, setCopied] = useState(false);

  const copyToClipboard = async (div) => {
    const htmlContent = div.innerHTML;

    try {
      const clipboardItem = new ClipboardItem({
        'text/html': new Blob([htmlContent], { type: 'text/html' }),
        'text/plain': new Blob([formattedText], { type: 'text/plain' })
      });

      await navigator.clipboard.write([clipboardItem]);
      setCopied(true);
      // console.log("this is rate aval", tableDetails);
      setTimeout(() => setCopied(false), 2000);
      onCopySuccess?.();
    } catch (err) {
      console.error('Copy failed:', err);
      navigator.clipboard.writeText(formattedText).catch(() => {
        const temp = document.createElement('textarea');
        temp.value = formattedText;
        document.body.appendChild(temp);
        temp.select();
        document.execCommand('copy');
        document.body.removeChild(temp);
      });
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      onCopySuccess?.();
    }
  };

  useEffect(() => {
    if (autoCopy) {
      const timer = setTimeout(() => {
        const div = document.querySelector('.air-import-template');
        if (div) {
          copyToClipboard(div);
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [autoCopy, formattedText]);

  const handleCopy = (event) => {
    if (!autoCopy) {
      copyToClipboard(event.currentTarget);
    }
  };

  return (
    <div 
      ref={(el) => { if (el && autoCopy) el.classList.add('air-import-template'); }}
      onClick={handleCopy} 
      role="button" 
      tabIndex={0} 
      className='w-[2480px] h-[3508px] p-10 relative cursor-pointer'
      onKeyDown={(e) => e.key === 'Enter' && handleCopy(e)}
    >
      {copied && <div className="absolute top-2 right-2 bg-green-500 text-white p-2 rounded">Copied!</div>}
      
      <h1 className='uppercase font-bold underline text-2xl mb-4'>Air Import</h1>
      <div className='text-base mb-4'>
        <p>Dear Mr/Ms. {name},</p>
        <p>Please note below Air rates from {origin} <span className='font-bold'>to Colombo</span> for your kind reference.</p>
      </div>
      <table className='border-2 border-collapse w-full mb-4'>
        <thead>
          <tr>
            {tableDetails.map((detail) => (
              <th key={detail.id} className='border border-gray-300 p-2'>{detail.name}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            {tableDetails.map((detail) => (
              <td key={detail.id} className='border border-gray-300 p-2 text-center'>
                {detail.value}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
      {additionalCharges.length > 0 && (
        <div className='w-60 mb-4'>
          <h4 className='font-bold mb-2'>Additional Charges:</h4>
          {additionalCharges.map((charge, index) => (
            <div key={index} className='flex justify-between'>
              <span>{charge.type || charge.name || 'Unknown Charge'} {charge.description ? `(${charge.description})` : ''}</span>
              <span>{(charge.amount || 0)}{currency}</span>
            </div>
          ))}
        </div>
      )}
      <div className='mt-4 mb-8'>
        <h3 className='font-bold'>Remarks,</h3>
        <div className='mt-2'>
          {remarks.map((remark, index) => (
            <p key={index}>&bull; {remark}</p>
          ))}
        </div>
      </div>
      <div className='mt-8'>
        <p>If there is any further clarification please do feel free to contact us. Trust the rates and services are acceptable and look 
        forward to handling your valuable cargo. </p>
        <p className='font-bold bg-yellow-400'>Kindly note that Scanwell’ Logistics will accept payments in {currency} currency for shipments </p>
      </div>
    </div>
  );
}