"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";

const DynamicSuggestionsList = ({ suggestions = [], onChange }) => {
  const [newSuggestion, setNewSuggestion] = useState("");

  const addSuggestion = () => {
    if (newSuggestion.trim()) {
      const updatedSuggestions = [...suggestions, newSuggestion.trim()];
      onChange(updatedSuggestions);
      setNewSuggestion("");
    }
  };

  const removeSuggestion = (index) => {
    const updatedSuggestions = suggestions.filter((_, i) => i !== index);
    onChange(updatedSuggestions);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addSuggestion();
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Initial Chatbot Suggestions
      </label>
      
      <div className="space-y-2">
        {/* Add new suggestion input */}
        <div className="flex space-x-2">
          <input
            type="text"
            value={newSuggestion}
            onChange={(e) => setNewSuggestion(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Enter a suggestion..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
          <button
            type="button"
            onClick={addSuggestion}
            disabled={!newSuggestion.trim()}
            className="px-3 py-2 bg-primary text-white rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
          >
            <Plus size={16} />
            <span>Add</span>
          </button>
        </div>

        {/* List of existing suggestions */}
        {suggestions.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-gray-500">Current suggestions:</p>
            {suggestions.map((suggestion, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 bg-gray-50 rounded-md border border-gray-200"
              >
                <span className="text-sm text-gray-700 flex-1">{suggestion}</span>
                <button
                  type="button"
                  onClick={() => removeSuggestion(index)}
                  className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                  title="Remove suggestion"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        {suggestions.length === 0 && (
          <p className="text-xs text-gray-400 italic">
            No suggestions added yet. Add suggestions above to provide initial chatbot prompts.
          </p>
        )}
      </div>

      {suggestions.length > 0 && (
        <div className="mt-3 p-3 bg-blue-50 rounded-md">
          <p className="text-xs text-blue-800">
            <strong>Tip:</strong> These suggestions will appear as initial prompts for users when they start chatting with the bot.
          </p>
        </div>
      )}
    </div>
  );
};

export default DynamicSuggestionsList;
