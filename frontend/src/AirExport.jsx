import { useState, useEffect, useMemo } from 'react';

export default function AirExport({ 
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

  // Define column widths for the NBO table
  const nboColumnWidths = [10, 8, 8, 8, 8, 8, 8, 15, 10, 15]; // AIRLINE, M, -45, 45, 100, 300, 500, 1000, SURCHARGES, T/T FREQUENCY

  // Format NBO table row (single row since rateData is an object)
  const formatNboRow = () => {
    return [
      padString(rateData.airline || 'N/A', nboColumnWidths[0], 'left'),
      padString(rateData.rateM || 'N/A', nboColumnWidths[1], 'right'),
      padString(rateData.rate45Minus || 'N/A', nboColumnWidths[2], 'right'),
      padString(rateData.rate45Plus || 'N/A', nboColumnWidths[3], 'right'),
      padString(rateData.rate100 || 'N/A', nboColumnWidths[4], 'right'),
      padString(rateData.rate300 || 'N/A', nboColumnWidths[5], 'right'),
      padString(rateData.rate500 || 'N/A', nboColumnWidths[6], 'right'),
      padString(rateData.rate1000 || 'N/A', nboColumnWidths[7], 'right'),
      padString(rateData.surcharges || '', nboColumnWidths[8], 'right'),
      padString(`${rateData.transitTime} ${rateData.frequency || ''}`, nboColumnWidths[9], 'left')
    ].join('');
  };

  const nboHeader = [
    padString("AIRLINE", nboColumnWidths[0], 'left'),
    padString("M", nboColumnWidths[1], 'right'),
    padString("-45", nboColumnWidths[2], 'right'),
    padString("45", nboColumnWidths[3], 'right'),
    padString("100", nboColumnWidths[4], 'right'),
    padString("300", nboColumnWidths[5], 'right'),
    padString("500", nboColumnWidths[6], 'right'),
    padString("1000", nboColumnWidths[7], 'right'),
    padString("SURCHARGES", nboColumnWidths[8], 'left'),
    padString("T/T FREQUENCY", nboColumnWidths[9], 'left')
  ].join('');

  const nboRows = formatNboRow();

  // Define column widths for ADD, CAI, and OTHER CHARGES tables (same structure with ROUTINE)
  const addCaiColumnWidths = [10, 8, 8, 8, 8, 8, 8, 15, 10, 15, 15]; // Add ROUTINE column

  const formatAddCaiRow = () => {
    return [
      padString(rateData.airline || 'N/A', addCaiColumnWidths[0], 'left'),
      padString(rateData.rateM || 'N/A', addCaiColumnWidths[1], 'right'),
      padString(rateData.rate45Minus || 'N/A', addCaiColumnWidths[2], 'right'),
      padString(rateData.rate45Plus || 'N/A', addCaiColumnWidths[3], 'right'),
      padString(rateData.rate100 || 'N/A', addCaiColumnWidths[4], 'right'),
      padString(rateData.rate300 || 'N/A', addCaiColumnWidths[5], 'right'),
      padString(rateData.rate500 || 'N/A', addCaiColumnWidths[6], 'right'),
      padString(rateData.rate1000 || 'N/A', addCaiColumnWidths[7], 'right'),
      padString(rateData.surcharges || '', addCaiColumnWidths[8], 'right'),
      padString(`${rateData.transitTime} ${rateData.frequency || ''}`, addCaiColumnWidths[9], 'left'),
      padString(rateData.routing || '', addCaiColumnWidths[10], 'left')
    ].join('');
  };

  const addHeader = [
    padString("AIRLINE", addCaiColumnWidths[0], 'left'),
    padString("M", addCaiColumnWidths[1], 'right'),
    padString("-45", addCaiColumnWidths[2], 'right'),
    padString("45", addCaiColumnWidths[3], 'right'),
    padString("100", addCaiColumnWidths[4], 'right'),
    padString("300", addCaiColumnWidths[5], 'right'),
    padString("500", addCaiColumnWidths[6], 'right'),
    padString("1000", addCaiColumnWidths[7], 'right'),
    padString("SURCHARGES", addCaiColumnWidths[8], 'left'),
    padString("T/T FREQUENCY", addCaiColumnWidths[9], 'left'),
    padString("ROUTINE", addCaiColumnWidths[10], 'left')
  ].join('');

  const addRows = formatAddCaiRow();

  const caiHeader = addHeader; // Same structure as ADD
  const caiRows = formatAddCaiRow();

  const otherChargesHeader = addHeader; // Same structure
  const otherChargesRows = formatAddCaiRow();

  const formattedText = useMemo(() => {
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

    return `AIR EXPORT

Dear Mr/Ms. ${name},

Please note below Air rates from ${origin} to [location] for your kind reference.

NBO
${nboHeader}
${nboRows}

ADD
${addHeader}
${addRows}

CAI
${caiHeader}
${caiRows}

[OTHER CHARGES]
${otherChargesHeader}
${otherChargesRows}

${chargesSection ? `\nAdditional Charges:\n${chargesSection}\n` : ''}

Remarks,
${remarksSection ? `\n${remarksSection}` : ''}

If there is any further clarification please do feel free to contact us. Trust the rates and services are acceptable and look forward to handling your valuable cargo.

Kindly note that Scanwell’ Logistics will accept payments in ${currency} currency for shipments`;
  }, [name, origin, rateData, additionalCharges, remarks, currency]);

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
        const div = document.querySelector('.air-export-template');
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
      ref={(el) => { if (el && autoCopy) el.classList.add('air-export-template'); }}
      onClick={handleCopy} 
      role="button" 
      tabIndex={0} 
      className='w-[2480px] h-[3508px] p-10 relative cursor-pointer'
      onKeyDown={(e) => e.key === 'Enter' && handleCopy(e)}
    >
      {copied && <div className="absolute top-2 right-2 bg-green-500 text-white p-2 rounded">Copied!</div>}
      
      <h1 className='uppercase font-bold underline text-2xl mb-4'>Air Export</h1>
      <div className='text-base mb-4'>
        <p>Dear Mr/Ms. {name},</p>
        <p>Please note below Air rates from {origin} <span className='font-bold'>to [location]</span> for your kind reference.</p>
      </div>
      <div className='mb-4'>
        <h3 className='font-bold'>NBO</h3>
        <table className='border-2 border-collapse w-full mb-4'>
          <thead>
            <tr>
              {["AIRLINE", "M", "-45", "45", "100", "300", "500", "1000", "SURCHARGES", "T/T FREQUENCY"].map((header, index) => (
                <th key={index} className='border border-gray-300 p-2'>{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className='border border-gray-300 p-2'>{rateData.airline || 'N/A'}</td>
              <td className='border border-gray-300 p-2 text-center'>{rateData.rateM || 'N/A'}</td>
              <td className='border border-gray-300 p-2 text-center'>{rateData.rate45Minus || 'N/A'}</td>
              <td className='border border-gray-300 p-2 text-center'>{rateData.rate45Plus || 'N/A'}</td>
              <td className='border border-gray-300 p-2 text-center'>{rateData.rate100 || 'N/A'}</td>
              <td className='border border-gray-300 p-2 text-center'>{rateData.rate300 || 'N/A'}</td>
              <td className='border border-gray-300 p-2 text-center'>{rateData.rate500 || 'N/A'}</td>
              <td className='border border-gray-300 p-2 text-center'>{rateData.rate1000 || 'N/A'}</td>
              <td className='border border-gray-300 p-2 text-center'>{rateData.surcharges || ''}</td>
              <td className='border border-gray-300 p-2'>{`${rateData.transitTime} ${rateData.frequency || ''}`}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div className='mb-4'>
        <h3 className='font-bold'>ADD</h3>
        <table className='border-2 border-collapse w-full mb-4'>
          <thead>
            <tr>
              {["AIRLINE", "M", "-45", "45", "100", "300", "500", "1000", "SURCHARGES", "T/T FREQUENCY", "ROUTINE"].map((header, index) => (
                <th key={index} className='border border-gray-300 p-2'>{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className='border border-gray-300 p-2'>{rateData.airline || 'N/A'}</td>
              <td className='border border-gray-300 p-2 text-center'>{rateData.rateM || 'N/A'}</td>
              <td className='border border-gray-300 p-2 text-center'>{rateData.rate45Minus || 'N/A'}</td>
              <td className='border border-gray-300 p-2 text-center'>{rateData.rate45Plus || 'N/A'}</td>
              <td className='border border-gray-300 p-2 text-center'>{rateData.rate100 || 'N/A'}</td>
              <td className='border border-gray-300 p-2 text-center'>{rateData.rate300 || 'N/A'}</td>
              <td className='border border-gray-300 p-2 text-center'>{rateData.rate500 || 'N/A'}</td>
              <td className='border border-gray-300 p-2 text-center'>{rateData.rate1000 || 'N/A'}</td>
              <td className='border border-gray-300 p-2 text-center'>{rateData.surcharges || ''}</td>
              <td className='border border-gray-300 p-2'>{`${rateData.transitTime} ${rateData.frequency || ''}`}</td>
              <td className='border border-gray-300 p-2'>{rateData.routing || ''}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div className='mb-4'>
        <h3 className='font-bold'>CAI</h3>
        <table className='border-2 border-collapse w-full mb-4'>
          <thead>
            <tr>
              {["AIRLINE", "M", "-45", "45", "100", "300", "500", "1000", "SURCHARGES", "T/T FREQUENCY", "ROUTINE"].map((header, index) => (
                <th key={index} className='border border-gray-300 p-2'>{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className='border border-gray-300 p-2'>{rateData.airline || 'N/A'}</td>
              <td className='border border-gray-300 p-2 text-center'>{rateData.rateM || 'N/A'}</td>
              <td className='border border-gray-300 p-2 text-center'>{rateData.rate45Minus || 'N/A'}</td>
              <td className='border border-gray-300 p-2 text-center'>{rateData.rate45Plus || 'N/A'}</td>
              <td className='border border-gray-300 p-2 text-center'>{rateData.rate100 || 'N/A'}</td>
              <td className='border border-gray-300 p-2 text-center'>{rateData.rate300 || 'N/A'}</td>
              <td className='border border-gray-300 p-2 text-center'>{rateData.rate500 || 'N/A'}</td>
              <td className='border border-gray-300 p-2 text-center'>{rateData.rate1000 || 'N/A'}</td>
              <td className='border border-gray-300 p-2 text-center'>{rateData.surcharges || ''}</td>
              <td className='border border-gray-300 p-2'>{`${rateData.transitTime} ${rateData.frequency || ''}`}</td>
              <td className='border border-gray-300 p-2'>{rateData.routing || ''}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div className='mb-4'>
        <h3 className='font-bold'>[OTHER CHARGES]</h3>
        <table className='border-2 border-collapse w-full mb-4'>
          <thead>
            <tr>
              {["AIRLINE", "M", "-45", "45", "100", "300", "500", "1000", "SURCHARGES", "T/T FREQUENCY", "ROUTINE"].map((header, index) => (
                <th key={index} className='border border-gray-300 p-2'>{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className='border border-gray-300 p-2'>{rateData.airline || 'N/A'}</td>
              <td className='border border-gray-300 p-2 text-center'>{rateData.rateM || 'N/A'}</td>
              <td className='border border-gray-300 p-2 text-center'>{rateData.rate45Minus || 'N/A'}</td>
              <td className='border border-gray-300 p-2 text-center'>{rateData.rate45Plus || 'N/A'}</td>
              <td className='border border-gray-300 p-2 text-center'>{rateData.rate100 || 'N/A'}</td>
              <td className='border border-gray-300 p-2 text-center'>{rateData.rate300 || 'N/A'}</td>
              <td className='border border-gray-300 p-2 text-center'>{rateData.rate500 || 'N/A'}</td>
              <td className='border border-gray-300 p-2 text-center'>{rateData.rate1000 || 'N/A'}</td>
              <td className='border border-gray-300 p-2 text-center'>{rateData.surcharges || ''}</td>
              <td className='border border-gray-300 p-2'>{`${rateData.transitTime} ${rateData.frequency || ''}`}</td>
              <td className='border border-gray-300 p-2'>{rateData.routing || ''}</td>
            </tr>
          </tbody>
        </table>
      </div>
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