import React, { useState } from 'react';

const CopyableDiv = () => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (event) => {
    const div = event.currentTarget; // The div being clicked
    const htmlContent = div.innerHTML; // Captures exact HTML (tables, text, etc.)
    const textContent = div.innerText || div.textContent; // Plain text fallback

    try {
      // Create ClipboardItem with HTML and text formats
      const clipboardItem = new ClipboardItem({
        'text/html': new Blob([htmlContent], { type: 'text/html' }),
        'text/plain': new Blob([textContent], { type: 'text/plain' })
      });

      await navigator.clipboard.write([clipboardItem]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // Reset feedback after 2s
    } catch (err) {
      console.error('Copy failed:', err);
      // Fallback for older browsers (e.g., select and execCommand)
      const range = document.createRange();
      range.selectNodeContents(div);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      document.execCommand('copy');
      selection.removeAllRanges();
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      onClick={handleCopy}
      style={{
        border: '1px solid #ccc',
        padding: '16px',
        cursor: 'pointer',
        userSelect: 'none', // Prevents accidental text selection on click
        backgroundColor: copied ? '#e8f5e8' : 'white'
      }}
      title="Click to copy content"
    >
      {/* Your formatted content goes here */}
      <h3>Sample Report</h3>
      <p>This is <strong>bold text</strong> with a <em>italic note</em>.</p>
      <table style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr>
            <th style={{ border: '1px solid #ddd', padding: '8px' }}>Item</th>
            <th style={{ border: '1px solid #ddd', padding: '8px' }}>Price</th>
            <th style={{ border: '1px solid #ddd', padding: '8px' }}>Qty</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ border: '1px solid #ddd', padding: '8px' }}>Apple</td>
            <td style={{ border: '1px solid #ddd', padding: '8px' }}>$1.00</td>
            <td style={{ border: '1px solid #ddd', padding: '8px' }}>5</td>
          </tr>
          <tr>
            <td style={{ border: '1px solid #ddd', padding: '8px' }}>Banana</td>
            <td style={{ border: '1px solid #ddd', padding: '8px' }}>$0.50</td>
            <td style={{ border: '1px solid #ddd', padding: '8px' }}>3</td>
          </tr>
        </tbody>
      </table>
      <p>Total: $6.50</p>
      {copied && <p style={{ color: 'green', marginTop: '8px' }}>Copied to clipboard! 📋</p>}
    </div>
  );
};

export default CopyableDiv;