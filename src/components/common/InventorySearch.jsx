import React, { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';

const InventorySearch = ({ items = [], onSelect, placeholder = "Caută produs...", defaultQuery = "" }) => {
    const [query, setQuery] = useState(defaultQuery);
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const wrapperRef = useRef(null);

    useEffect(() => {
        setQuery(defaultQuery);
    }, [defaultQuery]);

    useEffect(() => {
        // Click outside to close
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setShowSuggestions(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);

    const handleSearch = (e) => {
        const val = e.target.value;
        setQuery(val);

        if (val.length > 0) {
            const matches = items.filter(item =>
                item.name.toLowerCase().includes(val.toLowerCase())
            ).slice(0, 10); // Limit to 10 results
            setSuggestions(matches);
            setShowSuggestions(true);
        } else {
            setSuggestions([]);
            setShowSuggestions(false);
        }
    };

    const handleSelect = (item) => {
        setQuery(item.name);
        setShowSuggestions(false);
        if (onSelect) onSelect(item);
    };

    const clearSearch = () => {
        setQuery('');
        setSuggestions([]);
        setShowSuggestions(false);
        if (onSelect) onSelect(null); // Clear selection
    };

    return (
        <div ref={wrapperRef} style={{ position: 'relative', width: '100%' }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Search size={16} style={{ position: 'absolute', left: '10px', color: '#94a3b8' }} />
                <input
                    type="text"
                    value={query}
                    onChange={handleSearch}
                    onFocus={() => { if (query) setShowSuggestions(true); }}
                    placeholder={placeholder}
                    className="form-control"
                    style={{
                        width: '100%',
                        padding: '0.6rem 0.6rem 0.6rem 2.2rem',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1'
                    }}
                />
                {query && (
                    <button
                        type="button"
                        onClick={clearSearch}
                        style={{
                            position: 'absolute',
                            right: '10px',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#94a3b8',
                            display: 'flex'
                        }}
                    >
                        <X size={16} />
                    </button>
                )}
            </div>

            {showSuggestions && suggestions.length > 0 && (
                <ul style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    backgroundColor: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    marginTop: '4px',
                    maxHeight: '200px',
                    overflowY: 'auto',
                    zIndex: 1000,
                    listStyle: 'none',
                    padding: 0,
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                }}>
                    {suggestions.map(item => (
                        <li
                            key={item.id}
                            onClick={() => handleSelect(item)}
                            style={{
                                padding: '0.6rem 1rem',
                                borderBottom: '1px solid #f1f5f9',
                                cursor: 'pointer',
                                transition: 'background 0.2s',
                                display: 'flex',
                                justifyContent: 'space-between'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                        >
                            <span style={{ fontWeight: '500', color: '#0f172a' }}>{item.name}</span>
                            <span style={{ color: '#64748b', fontSize: '0.85rem' }}>{item.stock || 0} {item.unit}</span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default InventorySearch;
