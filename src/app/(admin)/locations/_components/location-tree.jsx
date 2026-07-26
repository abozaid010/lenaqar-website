"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Loader2,
  Plus,
} from "lucide-react";
import { EditButton, DeleteButton } from "@/components/ui/action-button";
import { useI18n } from "@/hooks/useI18n";
import { useLocationChildren } from "@/hooks/use-market-index";
import { childLevelForParent, locationLabel } from "./location-label";

function LocationTreeNode({
  node,
  depth,
  onAddChild,
  onEditAliases,
  onDelete,
}) {
  const { translate, locale } = useI18n();
  const [expanded, setExpanded] = useState(false);
  const childLevel = childLevelForParent(node);
  const canExpand =
    childLevel != null || !node.is_leaf || (node.children_count ?? 0) > 0;
  const childrenQuery = useLocationChildren(node.id, expanded && canExpand);

  const children = Array.isArray(childrenQuery.data?.locations)
    ? childrenQuery.data.locations
    : [];

  const toggle = () => {
    if (!canExpand) return;
    setExpanded((v) => !v);
  };

  return (
    <li className="select-none">
      <div
        className="group flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-gray-50"
        style={{ paddingInlineStart: `${depth * 1.25 + 0.5}rem` }}
      >
        <button
          type="button"
          onClick={toggle}
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded text-gray-500 ${
            canExpand ? "hover:bg-gray-200" : "invisible"
          }`}
          aria-label={
            expanded
              ? translate("locations.tree.collapse")
              : translate("locations.tree.expand")
          }
          disabled={!canExpand}
        >
          {expanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4 rtl:-scale-x-100" />
          )}
        </button>

        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium text-gray-900">
            {locationLabel(node, locale)}
          </div>
          <div className="truncate text-xs text-gray-500">
            {translate(`locations.levels.${node.level}`)}
            {node.en_name && locale === "ar" ? ` · ${node.en_name}` : null}
            {node.ar_name && locale !== "ar" ? ` · ${node.ar_name}` : null}
            {(node.aliases || []).length > 0
              ? ` · ${translate("locations.tree.aliasesCount").replace(
                  "{count}",
                  String(node.aliases.length)
                )}`
              : null}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
          {childLevel ? (
            <button
              type="button"
              onClick={() => onAddChild(node, childLevel)}
              className="inline-flex h-8 items-center gap-1 rounded-md border border-gray-200 bg-white px-2 text-xs text-gray-700 hover:bg-gray-50"
              title={translate("locations.actions.addChild").replace(
                "{level}",
                translate(`locations.levels.${childLevel}`)
              )}
            >
              <Plus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">
                {translate(`locations.levels.${childLevel}`)}
              </span>
            </button>
          ) : null}
          <EditButton
            size="sm"
            title={translate("locations.actions.editAliases")}
            ariaLabel={translate("locations.actions.editAliases")}
            onClick={() => onEditAliases(node)}
          />
          <DeleteButton
            size="sm"
            title={translate("locations.actions.delete")}
            ariaLabel={translate("locations.actions.delete")}
            onClick={() => onDelete(node)}
          />
        </div>
      </div>

      {expanded ? (
        <ul className="ms-0">
          {childrenQuery.isLoading ? (
            <li
              className="flex items-center gap-2 px-2 py-2 text-xs text-gray-500"
              style={{ paddingInlineStart: `${(depth + 1) * 1.25 + 0.5}rem` }}
            >
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              {translate("common.loading")}
            </li>
          ) : children.length === 0 ? (
            <li
              className="px-2 py-2 text-xs text-gray-400"
              style={{ paddingInlineStart: `${(depth + 1) * 1.25 + 0.5}rem` }}
            >
              {translate("locations.tree.emptyChildren")}
            </li>
          ) : (
            children.map((child) => (
              <LocationTreeNode
                key={child.id}
                node={child}
                depth={depth + 1}
                onAddChild={onAddChild}
                onEditAliases={onEditAliases}
                onDelete={onDelete}
              />
            ))
          )}
        </ul>
      ) : null}
    </li>
  );
}

export default function LocationTree({
  roots,
  isLoading,
  onAddChild,
  onEditAliases,
  onDelete,
}) {
  const { translate } = useI18n();
  const locations = Array.isArray(roots?.locations) ? roots.locations : [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-sm text-gray-500">
        <Loader2 className="h-5 w-5 animate-spin" />
        {translate("common.loading")}
      </div>
    );
  }

  if (locations.length === 0) {
    return (
      <div className="py-16 text-center text-sm text-gray-500">
        {translate("locations.tree.empty")}
      </div>
    );
  }

  return (
    <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200 bg-white">
      {locations.map((node) => (
        <LocationTreeNode
          key={node.id}
          node={node}
          depth={0}
          onAddChild={onAddChild}
          onEditAliases={onEditAliases}
          onDelete={onDelete}
        />
      ))}
    </ul>
  );
}
