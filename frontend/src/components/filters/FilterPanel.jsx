import { Filter, X } from 'lucide-react';
import MultiSelectDropdown from './MultiSelectDropdown';

/**
 * Reusable filter panel that renders a row of MultiSelectDropdown components.
 *
 * @param {Array} filterConfig - Array of { key, label, allLabel, options: [{value, label}], minWidth? }
 * @param {Object} filters - Current filter state, e.g. { status: ['draft'], category: [] }
 * @param {Function} onFilterChange - (key, selectedArray) => void
 * @param {Function} onClearAll - () => void
 * @param {string} accentColor - 'teal' | 'blue' | 'purple'
 */
export default function FilterPanel({
  filterConfig = [],
  filters = {},
  onFilterChange,
  onClearAll,
  accentColor = 'teal'
}) {
  const activeCount = Object.values(filters).filter(arr => arr.length > 0).length;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="flex items-center gap-1 text-gray-400">
        <Filter size={18} />
        {activeCount > 0 && (
          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-red-500 text-white text-xs font-bold">
            {activeCount}
          </span>
        )}
      </div>

      {filterConfig.map(config => (
        <MultiSelectDropdown
          key={config.key}
          label={config.label}
          options={config.options}
          selected={filters[config.key] || []}
          onChange={(selected) => onFilterChange(config.key, selected)}
          allLabel={config.allLabel}
          accentColor={accentColor}
          minWidth={config.minWidth || '140px'}
        />
      ))}

      {activeCount > 0 && (
        <button
          type="button"
          onClick={onClearAll}
          className="flex items-center gap-1 px-2 py-1.5 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
          title="Clear all filters"
        >
          <X size={14} />
          Clear
        </button>
      )}
    </div>
  );
}
