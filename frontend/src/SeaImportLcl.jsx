import { useState, useEffect, useMemo } from 'react';

export default function SeaImportLcl({ 
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

  // Define column widths for the table
  const tableColumnWidths = [15, 10, 15, 5]; // LINER, LCL FREIGHT RATE, ROUTING, TRANSIT TIME

  // Format table row (single row since rateData is an object)
  const formatTableRow = () => {
    return [
      padString(rateData.liner || rateData.airline || 'N/A', tableColumnWidths[0], 'left'),
      padString(rateData.lclRate || 'N/A', tableColumnWidths[1], 'right'),
      padString(rateData.routingType || rateData.routing || '', tableColumnWidths[2], 'left'),
      padString(rateData.transitTime || 'N/A', tableColumnWidths[3], 'right')
    ].join(' ');
  };

  const tableHeader = [
    padString("LINER", tableColumnWidths[0], 'left'),
    padString("LCL FREIGHT RATE", tableColumnWidths[1], 'left'),
    padString("ROUTING", tableColumnWidths[2], 'left'),
    padString("TRANSIT TIME", tableColumnWidths[3], 'left')
  ].join(' ');

  const tableRow = formatTableRow();

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
      : '(remarks)';

    return `SEA IMPORT LCL

Dear Mr/Ms. ${name},

Please note below sea freight LCL rates from ${origin} to Colombo for your kind reference.

${tableHeader}
${tableRow}

${chargesSection ? `\nOTHER CHARGES\n${chargesSection}\n` : '\nOTHER CHARGES\n'}

Remarks,
${remarksSection}

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
        const div = document.querySelector('.sea-import-lcl-template');
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
      ref={(el) => { if (el && autoCopy) el.classList.add('sea-import-lcl-template'); }}
      onClick={handleCopy} 
      role="button" 
      tabIndex={0} 
      className='w-[2480px] h-[3508px] p-10 relative cursor-pointer'
      onKeyDown={(e) => e.key === 'Enter' && handleCopy(e)}
    >
      {copied && <div className="absolute top-2 right-2 bg-green-500 text-white p-2 rounded">Copied!</div>}
      
      <h1 className='uppercase font-bold underline text-2xl mb-4'>SEA IMPORT LCL</h1>
      <div className='text-base mb-4'>
        <p>Dear Mr/Ms. {name},</p>
        <p>Please note below sea freight LCL rates from {origin} <span className='font-bold'>to Colombo</span> for your kind reference.</p>
      </div>
      <table className='border-2 border-collapse w-full mb-4'>
        <thead>
          <tr>
            {["LINER", "LCL FREIGHT RATE", "ROUTING", "TRANSIT TIME"].map((header, index) => (
              <th key={index} className='border border-gray-300 p-2'>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className='border border-gray-300 p-2'>{rateData.liner || rateData.airline || 'N/A'}</td>
            <td className='border border-gray-300 p-2 text-center'>{rateData.lclRate || 'N/A'}</td>
            <td className='border border-gray-300 p-2'>{rateData.routingType || rateData.routing || ''}</td>
            <td className='border border-gray-300 p-2 text-right'>{rateData.transitTime || 'N/A'}</td>
          </tr>
        </tbody>
      </table>
      <div className='mb-4'>
        <h4 className='font-bold mb-2'>OTHER CHARGES</h4>
        {additionalCharges.length > 0 ? (
          additionalCharges.map((charge, index) => (
            <div key={index} className='flex justify-between'>
              <span>{charge.type || charge.name || 'Unknown Charge'} {charge.description ? `(${charge.description})` : ''}</span>
              <span>{(charge.amount || 0)}{currency}</span>
            </div>
          ))
        ) : (
          <p>No additional charges</p>
        )}
      </div>
      <div className='mt-4 mb-8'>
        <h3 className='font-bold'>Remarks,</h3>
        <div className='mt-2'>
          {remarks.length > 0 ? (
            remarks.map((remark, index) => (
              <p key={index}>&bull; {remark}</p>
            ))
          ) : (
            <p>(remarks)</p>
          )}
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