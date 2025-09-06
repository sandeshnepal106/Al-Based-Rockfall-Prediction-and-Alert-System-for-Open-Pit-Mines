import React from 'react'
import { Search, MapPin } from "lucide-react";

const locationsearch = ({
    address,
    onAddressChange,
    onSearch,
    suggestions,
    onSuggestionSelect,
    loading,
    error
}) => {
    return (
        <div className="w-full max-w-2xl mt-8">
            <div className="relative">
                <div className="flex gap-3">
                    <div className="flex-grow relative">
                        <input
                            type="text"
                            value={address}
                            onChange={onAddressChange}
                            placeholder="Enter location (e.g., Ravangla, South Sikkim)"
                            className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-800/50 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                        />

                        {/* Suggestions Dropdown */}
                        {suggestions.length > 0 && (
                            <div className="absolute z-20 w-full mt-1 bg-slate-800 border border-slate-600 rounded-xl shadow-xl max-h-60 overflow-y-auto">
                                {suggestions.map((suggestion, index) => (
                                    <div
                                        key={index}
                                        className="px-4 py-3 hover:bg-slate-700 cursor-pointer border-b border-slate-600 last:border-b-0 text-white text-sm"
                                        onClick={() => onSuggestionSelect(suggestion)}
                                    >
                                        <div className="flex items-center gap-2">
                                            <MapPin className="h-4 w-4 text-blue-400" />
                                            {suggestion.display_name}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <button
                        type="button"
                        onClick={onSearch}
                        disabled={loading || !address.trim()}
                        className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500 disabled:from-gray-600 disabled:to-gray-500 rounded-xl shadow-lg flex items-center gap-2 font-semibold text-white transition-all"
                    >
                        <Search className="h-5 w-5" />
                        {loading ? "Searching..." : "Search"}
                    </button>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="mt-2 p-3 bg-red-900/30 border border-red-500/50 rounded-lg text-red-300 text-sm">
                    {error}
                </div>
            )}
        </div>
    )
}

export default locationsearch
