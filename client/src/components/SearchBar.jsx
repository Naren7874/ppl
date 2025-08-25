import React, { useState, useCallback, useEffect } from 'react';
import { Search, X, Clock, Pin, TrendingUp, Lightbulb } from 'lucide-react';

const SearchBar = ({ onSearch, recentSearches = [], onClearRecent }) => {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const handleSearch = useCallback((searchQuery = query) => {
    if (searchQuery.trim()) {
      onSearch(searchQuery.trim());
      setShowSuggestions(false);
    }
  }, [query, onSearch]);

  useEffect(() => {
    if (query.trim() === '') {
      onSearch('');
      return;
    }

    const timer = setTimeout(() => {
      if (query) {
        handleSearch(query);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, handleSearch, onSearch]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      e.target.blur();
    }
  };

  const clearSearch = () => {
    setQuery('');
    onSearch('');
    setShowSuggestions(false);
  };

  const selectRecentSearch = (recentQuery) => {
    setQuery(recentQuery);
    handleSearch(recentQuery);
    setShowSuggestions(false);
  };

  return (
    <div className="relative w-full">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-gray-400" />
        </div>
        
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            setIsFocused(true);
            setShowSuggestions(true);
          }}
          onBlur={() => {
            setIsFocused(false);
            setTimeout(() => setShowSuggestions(false), 200);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Search notes..."
          className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors bg-white shadow-sm"
        />
        
        {query && (
          <button
            onClick={clearSearch}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
          >
            <X className="h-4 w-4 text-gray-400 hover:text-gray-600 transition-colors" />
          </button>
        )}
      </div>

      {/* Search Suggestions */}
      {showSuggestions && (
        <div className="absolute z-10 mt-2 w-full bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
          {recentSearches.length > 0 ? (
            <>
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                <span className="text-xs font-medium text-gray-500 flex items-center gap-2">
                  <Clock size={14} />
                  Recent searches
                </span>
                <button
                  onClick={onClearRecent}
                  className="text-xs text-blue-600 hover:text-blue-800 transition-colors font-medium"
                >
                  Clear all
                </button>
              </div>
              
              <div className="max-h-60 overflow-y-auto">
                {recentSearches.map((search, index) => (
                  <button
                    key={index}
                    onClick={() => selectRecentSearch(search.query)}
                    className="w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors flex items-center gap-3 border-b border-gray-100 last:border-b-0"
                  >
                    <Clock className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <span className="truncate text-gray-700">{search.query}</span>
                    {search.isPinned && (
                      <Pin className="h-3 w-3 text-amber-500 fill-amber-500 ml-auto flex-shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="p-4">
              <div className="flex items-center gap-3 text-gray-500 mb-3">
                <TrendingUp size={16} />
                <span className="text-sm font-medium">Search tips</span>
              </div>
              <div className="space-y-2 text-xs text-gray-600">
                <div className="flex items-start gap-2">
                  <Lightbulb size={12} className="mt-0.5 text-blue-500 flex-shrink-0" />
                  <span>Search by title or content</span>
                </div>
                <div className="flex items-start gap-2">
                  <Lightbulb size={12} className="mt-0.5 text-blue-500 flex-shrink-0" />
                  <span>Use quotes for exact matches</span>
                </div>
                <div className="flex items-start gap-2">
                  <Lightbulb size={12} className="mt-0.5 text-blue-500 flex-shrink-0" />
                  <span>Prefix with 'tag:' to search tags</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;