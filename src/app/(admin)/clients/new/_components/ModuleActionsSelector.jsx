"use client";

import { useMemo, useState } from "react";
import FormMultiSelect from "@/components/ui/inputs/form-multi-select";
import { Loader2 } from "lucide-react";
import { useI18n } from "@/hooks/useI18n";
import {
  buildActionOptions,
  getAvailableActionsForModule,
  getFallbackPermissionSchema,
  getResolvedPermissionSchema,
  sanitizeModuleActions,
} from "@/lib/permission-schema";
import { DEFAULT_CLIENT_MODULE_ACTIONS } from "@/lib/default-module-actions";

const FALLBACK_SCHEMA = getFallbackPermissionSchema();

/** New broker clients — standardized base actions + module extras. */
export const DEFAULT_BROKER_MODULE_ACTIONS = {
  ...DEFAULT_CLIENT_MODULE_ACTIONS,
};

/** New developer clients — same standardized matrix as broker. */
export const DEFAULT_DEVELOPER_MODULE_ACTIONS = {
  ...DEFAULT_CLIENT_MODULE_ACTIONS,
};

const ModuleActionsSelector = ({
  moduleActions = {},
  onChange,
  permissionSchema = null,
  isSchemaLoading = false,
}) => {
  const { translate } = useI18n();
  const [expandedModules, setExpandedModules] = useState(new Set());

  const schema = useMemo(
    () => getResolvedPermissionSchema(permissionSchema),
    [permissionSchema]
  );

  const moduleList = useMemo(
    () => schema.modules.map((m) => m.module),
    [schema.modules]
  );

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
    const allowed = new Set(getAvailableActionsForModule(schema, module));
    const filtered = (selectedActions || []).filter((a) => allowed.has(a));

    const newModuleActions = {
      ...moduleActions,
      [module]: filtered,
    };

    if (filtered.length === 0) {
      delete newModuleActions[module];
    }

    onChange(sanitizeModuleActions(newModuleActions, schema));
  };

  const selectAllActions = (module) => {
    const allForModule = getAvailableActionsForModule(schema, module);
    handleModuleActionsChange(module, allForModule);
  };

  const clearAllActions = (module) => {
    handleModuleActionsChange(module, []);
  };

  const formatModuleLabel = (module) => {
    return module
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const hasWhatsappActions = (actions) =>
    actions?.includes("whatsapp") ||
    actions?.includes("whatsapp_api") ||
    actions?.includes("whatsapp_automation");

  if (isSchemaLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-8 text-gray-500">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span className="text-sm">
          {translate(
            "modulePermissions.loadingSchema",
            "Loading permission options…"
          )}
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-gray-600">
          {translate(
            "modulePermissions.hint",
            "Select actions for each module. Click on a module to expand and configure permissions."
          )}
        </p>
      </div>

      {moduleList.map((module) => {
        const isExpanded = expandedModules.has(module);
        const currentActions = moduleActions[module] || [];
        const hasActions = currentActions.length > 0;
        const availableActions = getAvailableActionsForModule(schema, module);
        const actionOptions = buildActionOptions(availableActions, translate);
        const showWhatsappNote =
          hasWhatsappActions(availableActions) && hasWhatsappActions(currentActions);

        return (
          <div key={module} className="border border-gray-200 rounded-lg">
            <div
              className={`flex items-center justify-between p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors rounded-t-lg ${!isExpanded ? "rounded-b-lg" : ""}`}
              onClick={() => toggleModule(module)}
            >
              <div className="flex items-center space-x-3">
                <div
                  className={`w-2 h-2 rounded-full ${hasActions ? "bg-green-500" : "bg-gray-400"}`}
                />
                <h3 className="font-medium text-gray-900">
                  {formatModuleLabel(module)}
                </h3>
                {hasActions && (
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                    {currentActions.length}{" "}
                    {translate("modulePermissions.actionsCount", "actions")}
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
                      {translate("modulePermissions.selectAll", "Select All")}
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        clearAllActions(module);
                      }}
                      className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                    >
                      {translate("modulePermissions.clearAll", "Clear All")}
                    </button>
                  </>
                )}
                <svg
                  className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </div>

            {isExpanded && (
              <div className="p-6 border-t border-gray-200 bg-white">
                <FormMultiSelect
                  label={translate(
                    "modulePermissions.actionsForModule",
                    "Actions for {module}"
                  ).replace("{module}", formatModuleLabel(module))}
                  name={`${module}_actions`}
                  value={currentActions}
                  onChange={(e) =>
                    handleModuleActionsChange(module, e.target.value)
                  }
                  options={actionOptions}
                  valueKey="value"
                  labelKey="label"
                  placeholder={translate(
                    "modulePermissions.selectActionsPlaceholder",
                    "Select actions for this module"
                  )}
                />

                {showWhatsappNote && (
                  <p className="mt-2 text-xs text-gray-500">
                    {translate(
                      "modulePermissions.whatsappNote",
                      "WhatsApp API Template and WhatsApp Automation apply to bulk messaging for this module."
                    )}
                  </p>
                )}

                {currentActions.length > 0 && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-md">
                    <p className="text-sm text-blue-800">
                      <strong>
                        {translate(
                          "modulePermissions.selectedActions",
                          "Selected actions:"
                        )}
                      </strong>{" "}
                      {currentActions
                        .map((a) =>
                          actionOptions.find((o) => o.value === a)?.label ?? a
                        )
                        .join(", ")}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-2">
          {translate("modulePermissions.summaryTitle", "Summary")}
        </h4>
        <p className="text-sm text-gray-600">
          {translate(
            "modulePermissions.summaryConfigured",
            "Configured permissions for {count} of {total} modules."
          )
            .replace("{count}", String(Object.keys(moduleActions).length))
            .replace("{total}", String(moduleList.length))}
        </p>
        {Object.keys(moduleActions).length > 0 && (
          <div className="mt-2">
            <p className="text-xs text-gray-500 mb-1">
              {translate(
                "modulePermissions.summaryModulesWithPermissions",
                "Modules with permissions:"
              )}
            </p>
            <div className="flex flex-wrap gap-1">
              {Object.keys(moduleActions).map((module) => (
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
