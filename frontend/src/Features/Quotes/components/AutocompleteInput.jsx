// components/AutocompleteInput.jsx
import { useState, useRef, useEffect } from 'react';

export default function AutocompleteInput({ 
  label, 
  value, 
  onChange, 
  suggestions = [], 
  placeholder = '',
  showLabel = true,
  disabled = false
}) {
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(0);
  const [dropdownStyle, setDropdownStyle] = useState({});
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);

  const MAX_SUGGESTIONS = 5; // Limit to 3 suggestions

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    const handleScroll = () => {
      if (showSuggestions) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScroll, true);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [showSuggestions]);

  useEffect(() => {
    if (showSuggestions && inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      setDropdownStyle({
        position: 'fixed',
        top: `${rect.bottom + 2}px`,
        left: `${rect.left}px`,
        width: `${rect.width}px`,
        zIndex: 9999
      });
    }
  }, [showSuggestions, value]);

  const handleChange = (e) => {
    const userInput = e.target.value;
    onChange(userInput);

    const filtered = suggestions.filter(
      suggestion =>
        suggestion.toLowerCase().includes(userInput.toLowerCase())
    ).slice(0, MAX_SUGGESTIONS); // Limit to 3 suggestions

    setFilteredSuggestions(filtered);
    setShowSuggestions(true);
    setActiveSuggestionIndex(0);
  };

  const handleClick = (suggestion) => {
    onChange(suggestion);
    setFilteredSuggestions([]);
    setShowSuggestions(false);
    setActiveSuggestionIndex(0);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (showSuggestions && filteredSuggestions[activeSuggestionIndex]) {
        handleClick(filteredSuggestions[activeSuggestionIndex]);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (activeSuggestionIndex > 0) {
        setActiveSuggestionIndex(activeSuggestionIndex - 1);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (activeSuggestionIndex < filteredSuggestions.length - 1) {
        setActiveSuggestionIndex(activeSuggestionIndex + 1);
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  return (
    <div ref={wrapperRef} className="relative">
      {showLabel && label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          if (suggestions.length > 0 && !disabled) {
            const topSuggestions = suggestions.slice(0, MAX_SUGGESTIONS); // Show only first 3
            setFilteredSuggestions(topSuggestions);
            setShowSuggestions(true);
          }
        }}
        placeholder={placeholder || (label ? `Enter ${label.toLowerCase()}...` : '')}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
        autoComplete="off"
        disabled={disabled}
      />
      
      {showSuggestions && filteredSuggestions.length > 0 && !disabled && (
        <ul 
          style={dropdownStyle}
          className="bg-white border border-gray-300 rounded-lg mt-1 shadow-lg overflow-hidden"
        >
          {filteredSuggestions.map((suggestion, index) => (
            <li
              key={index}
              onClick={() => handleClick(suggestion)}
              onMouseEnter={() => setActiveSuggestionIndex(index)}
              className={`px-3 py-2 cursor-pointer text-sm transition-colors ${
                index === activeSuggestionIndex
                  ? 'bg-blue-100 text-blue-900'
                  : 'hover:bg-gray-100'
              }`}
            >
              {suggestion}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}