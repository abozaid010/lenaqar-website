"use client";

import { useState } from "react";
import FormMultiSelect from "@/components/ui/inputs/form-multi-select";

const MODULES = [
  "projects",
  "developers", 
  "units",
  "campaign",
  "chat_campaign",
  "conversation",
  "news",
  "team_members",
  "map",
  "resale",
  "analytics",
  "calendar"
];

const ACTIONS = [
  { value: "view", label: "View" },
  { value: "create", label: "Create" },
  { value: "import", label: "Import" },
  { value: "update_own", label: "Update Own" },
  { value: "update_any", label: "Update Any" },
  { value: "delete_own", label: "Delete Own" },
  { value: "delete_any", label: "Delete Any" }
];

const ModuleActionsSelector = ({ moduleActions = {}, onChange }) => {
  const [expandedModules, setExpandedModules] = useState(new Set());

  const toggleModule = (module) => {
    const newExpanded = new Set(expandedModules);
    if (newExpanded.has(module)) {
      newExpanded.delete(module);
    } else {
      newExpanded.add(module);
    }
    setExpandedModules(newExpanded);
  };

  const handleModuleActionsChange = (module, selectedActions) => {
    const newModuleActions = {
      ...moduleActions,
      [module]: selectedActions
    };
    
    // Remove empty arrays
    if (selectedActions.length === 0) {
      delete newModuleActions[module];
    }
    
    onChange(newModuleActions);
  };

  const selectAllActions = (module) => {
    const allActionValues = ACTIONS.map(action => action.value);
    handleModuleActionsChange(module, allActionValues);
  };

  const clearAllActions = (module) => {
    handleModuleActionsChange(module, []);
  };

  const formatModuleLabel = (module) => {
    return module
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-gray-600">
          Select actions for each module. Click on a module to expand and configure permissions.
        </p>
      </div>

      {MODULES.map((module) => {
        const isExpanded = expandedModules.has(module);
        const currentActions = moduleActions[module] || [];
        const hasActions = currentActions.length > 0;

        return (
          <div key={module} className="border border-gray-200 rounded-lg">
            <div
              className={`flex items-center justify-between p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors rounded-t-lg ${!isExpanded ? 'rounded-b-lg' : ''}`}
              onClick={() => toggleModule(module)}
            >
              <div className="flex items-center space-x-3">
                <div className={`w-2 h-2 rounded-full ${hasActions ? 'bg-green-500' : 'bg-gray-400'}`} />
                <h3 className="font-medium text-gray-900">
                  {formatModuleLabel(module)}
                </h3>
                {hasActions && (
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                    {currentActions.length} actions
                  </span>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                {isExpanded && (
                  <>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        selectAllActions(module);
                      }}
                      className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                    >
                      Select All
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        clearAllActions(module);
                      }}
                      className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                    >
                      Clear All
                    </button>
                  </>
                )}
                <svg
                  className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {isExpanded && (
              <div className="p-6 border-t border-gray-200 bg-white">
                <FormMultiSelect
                  label={`Actions for ${formatModuleLabel(module)}`}
                  name={`${module}_actions`}
                  value={currentActions}
                  onChange={(e) => handleModuleActionsChange(module, e.target.value)}
                  options={ACTIONS}
                  valueKey="value"
                  labelKey="label"
                  placeholder="Select actions for this module"
                />
                
                {currentActions.length > 0 && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-md">
                    <p className="text-sm text-blue-800">
                      <strong>Selected actions:</strong> {currentActions.join(", ")}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-2">Summary</h4>
        <p className="text-sm text-gray-600">
          Configured permissions for {Object.keys(moduleActions).length} of {MODULES.length} modules.
        </p>
        {Object.keys(moduleActions).length > 0 && (
          <div className="mt-2">
            <p className="text-xs text-gray-500 mb-1">Modules with permissions:</p>
            <div className="flex flex-wrap gap-1">
              {Object.keys(moduleActions).map(module => (
                <span 
                  key={module}
                  className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded"
                >
                  {formatModuleLabel(module)}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ModuleActionsSelector;
