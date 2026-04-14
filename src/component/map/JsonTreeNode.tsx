"use client";

import { memo, useEffect, useMemo, useState } from "react";
import { Handle, Position } from "@xyflow/react";
import { FaCaretDown, FaCaretRight } from "react-icons/fa";

type JsonTree = {
  key: string;
  label: string;
  isLeaf: boolean;
  children?: JsonTree[];
};

type JsonTreeNodeProps = {
  data: {
    jsonObject?: unknown;
    onVisibleHandlesChange?: (handles: string[]) => void;
  };
};

type JsonBranchProps = {
  node: JsonTree;
  parentPath?: string;
  isLast?: boolean;
  isRoot?: boolean;
  openBranches: Record<string, boolean>;
  onBranchToggle: (branchKey: string, isOpen: boolean) => void;
};

const ROOT_BRANCH_KEY = "__root__";

function buildTree(value: unknown, key = "object"): JsonTree {
  if (value === null || value === undefined || typeof value !== "object") {
    return { key, label: key, isLeaf: true };
  }

  if (Array.isArray(value)) {
    return {
      key,
      label: key,
      isLeaf: false,
      children: value.map((item, index) => buildTree(item, `[${index}]`)),
    };
  }

  return {
    key,
    label: key,
    isLeaf: false,
    children: Object.entries(value).map(([childKey, childValue]) =>
      buildTree(childValue, childKey),
    ),
  };
}

function TreeConnector({
  isRoot,
  isLast,
}: {
  isRoot?: boolean;
  isLast?: boolean;
}) {
  if (isRoot) {
    return null;
  }

  return (
    <>
      <span className="absolute left-2.25 top-0 h-4 border-l border-slate-700" />
      <span className="absolute left-2.25 top-4 w-3 border-t border-slate-700" />
      {isLast ? null : (
        <span className="absolute bottom-0 left-2.25 top-4 border-l border-slate-700" />
      )}
    </>
  );
}

function buildChildPath(parentPath: string, pathPart: string) {
  return pathPart.startsWith("[")
    ? `${parentPath}${pathPart}`
    : parentPath
      ? `${parentPath}.${pathPart}`
      : pathPart;
}

function collectVisibleLeafPaths(
  node: JsonTree,
  parentPath: string,
  openBranches: Record<string, boolean>,
  isRoot = false,
): string[] {
  if (node.isLeaf) {
    return parentPath ? [parentPath] : [];
  }

  const branchKey = isRoot ? ROOT_BRANCH_KEY : parentPath;
  const isOpen = openBranches[branchKey] ?? true;

  if (!isOpen) {
    return [];
  }

  return (node.children ?? []).flatMap((child) => {
    const childPath = buildChildPath(parentPath, child.label);

    return collectVisibleLeafPaths(child, childPath, openBranches, false);
  });
}

function JsonBranch({
  node,
  parentPath = "",
  isLast = false,
  isRoot = false,
  openBranches,
  onBranchToggle,
}: JsonBranchProps) {
  const branchKey = isRoot ? ROOT_BRANCH_KEY : parentPath;
  const isOpen = openBranches[branchKey] ?? true;

  if (node.isLeaf) {
    const fullPath = parentPath;

    return (
      <div className="relative pl-5">
        <TreeConnector isRoot={isRoot} isLast={isLast} />
        <div className="relative rounded bg-blue-50 px-2 py-1 text-xs text-blue-800">
          {fullPath}
          <Handle
            type="source"
            position={Position.Right}
            id={fullPath}
            isConnectable
            className="h-2.5! w-2.5! border-0! bg-blue-500!"
            style={{ right: -10, top: "50%", transform: "translateY(-100%)" }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="relative pl-5">
      <TreeConnector isRoot={isRoot} isLast={isLast} />
      <details
        className="ml-0"
        open={isOpen}
        onToggle={(event) => {
          onBranchToggle(branchKey, event.currentTarget.open);
        }}
      >
        <summary className="flex cursor-pointer list-none items-center gap-2 rounded px-1 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600 hover:bg-slate-100">
          {isOpen ? (
            <FaCaretDown
              aria-hidden="true"
              className="text-[10px] text-slate-900"
            />
          ) : (
            <FaCaretRight
              aria-hidden="true"
              className="text-[10px] text-slate-900"
            />
          )}
          <span>{node.label}</span>
        </summary>
        <div className="space-y-1 py-1">
          {(node.children || []).map((child, index, arr) => {
            const childPath = buildChildPath(parentPath, child.label);

            return (
              <JsonBranch
                key={childPath || `${node.label}-${index}`}
                node={child}
                parentPath={childPath}
                isLast={index === arr.length - 1}
                isRoot={false}
                openBranches={openBranches}
                onBranchToggle={onBranchToggle}
              />
            );
          })}
        </div>
      </details>
    </div>
  );
}

function JsonTreeNode({ data }: JsonTreeNodeProps) {
  const [openBranches, setOpenBranches] = useState<Record<string, boolean>>({});

  const tree = useMemo(
    () => buildTree(data?.jsonObject ?? {}, "object"),
    [data?.jsonObject],
  );

  useEffect(() => {
    const visibleHandles = collectVisibleLeafPaths(
      tree,
      "",
      openBranches,
      true,
    );
    data?.onVisibleHandlesChange?.(visibleHandles);
  }, [data, openBranches, tree]);

  const onBranchToggle = (branchKey: string, isOpen: boolean) => {
    setOpenBranches((current) => {
      if ((current[branchKey] ?? true) === isOpen) {
        return current;
      }

      return {
        ...current,
        [branchKey]: isOpen,
      };
    });
  };

  return (
    <div className="w-90 rounded-xl border border-slate-300 bg-slate-50 p-3 shadow-md">
      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
        JSON Source
      </div>
      <div className="max-h-[1000vh]  pr-2">
        <JsonBranch
          node={tree}
          isRoot
          openBranches={openBranches}
          onBranchToggle={onBranchToggle}
        />
      </div>
    </div>
  );
}

export default memo(JsonTreeNode);
