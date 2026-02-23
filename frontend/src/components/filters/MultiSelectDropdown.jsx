import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

const colorMap = {
  teal: {
    checkbox: 'bg-teal-600 border-teal-600',
    ring: 'focus:ring-teal-500',
    hover: 'hover:border-teal-400'
  },
  blue: {
    checkbox: 'bg-blue-600 border-blue-600',
    ring: 'focus:ring-blue-500',
    hover: 'hover:border-blue-400'
  },
  purple: {
    checkbox: 'bg-purple-600 border-purple-600',
    ring: 'focus:ring-purple-500',
    hover: 'hover:border-purple-400'
  }
};

/**
 * Self-contained multi-select dropdown with checkboxes.
 * Manages its own open/close state and click-outside detection.
 */
export default function MultiSelectDropdown({
  label,
  options = [],
  selected = [],
  onChange,
  allLabel = 'All',
  accentColor = 'teal',
  minWidth = '140px'
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const colors = colorMap[accentColor] || colorMap.teal;

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOption = (value) => {
    if (selected.includes(value)) {
      onChange(selected.filter(v => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  const selectAll = () => {
    onChange([]);
  };

  const displayText = selected.length === 0
    ? allLabel
    : selected.length === options.length
    ? allLabel
    : `${selected.length} Selected`;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg ${colors.hover} ${colors.ring} focus:ring-2 focus:border-transparent bg-white text-left`}
        style={{ minWidth }}
      >
        <span className="text-sm text-gray-700 truncate flex-1">{displayText}</span>
        <ChevronDown
          size={15}
          className={`text-gray-400 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50" style={{ minWidth: '180px' }}>
          {/* "All" option */}
          <div
            className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100"
            onClick={selectAll}
          >
            <div className={`w-4 h-4 rounded border flex items-center justify-center ${selected.length === 0 ? colors.checkbox : 'border-gray-300'}`}>
              {selected.length === 0 && <Check size={12} className="text-white" />}
            </div>
            <span className="text-sm text-gray-700">{allLabel}</span>
          </div>

          {/* Individual options */}
          {options.map(opt => (
            <div
              key={opt.value}
              className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer"
              onClick={() => toggleOption(opt.value)}
            >
              <div className={`w-4 h-4 rounded border flex items-center justify-center ${selected.includes(opt.value) ? colors.checkbox : 'border-gray-300'}`}>
                {selected.includes(opt.value) && <Check size={12} className="text-white" />}
              </div>
              <span className="text-sm text-gray-700">{opt.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
