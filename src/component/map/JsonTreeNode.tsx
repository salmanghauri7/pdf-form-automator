"use client";

import { memo } from "react";
import { Handle, Position } from "@xyflow/react";

type JsonTree = {
  key: string;
  label: string;
  isLeaf: boolean;
  path?: string;
  children?: JsonTree[];
};

type JsonTreeNodeProps = {
  data?: {
    jsonData?: unknown;
    jsonObject?: unknown;
  };
};

type JsonBranchProps = {
  node: JsonTree;
  parentPath?: string;
};

function buildTree(value: unknown, key = "root"): JsonTree {
  if (value === null || value === undefined || typeof value !== "object") {
    return { key, label: key, isLeaf: true, path: key === "root" ? "" : key };
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

function JsonBranch({ node, parentPath = "" }: JsonBranchProps) {
  if (node.isLeaf) {
    const fullPath = parentPath;

    return (
      <div className="relative ml-5 border-l border-slate-200 pl-3">
        <div className="rounded bg-blue-50 px-2 py-1 text-xs text-blue-800">
          {fullPath}
        </div>
        <Handle
          type="source"
          position={Position.Right}
          id={fullPath}
          className="h-2.5! w-2.5! border-0! bg-blue-500!"
          style={{ right: -10, top: "50%", transform: "translateY(-50%)" }}
        />
      </div>
    );
  }

  return (
    <details className="ml-2" open>
      <summary className="cursor-pointer list-none rounded px-2 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600 hover:bg-slate-100">
        {node.label}
      </summary>
      <div className="space-y-1 py-1">
        {(node.children || []).map((child) => {
          const pathPart = child.label;
          const childPath = pathPart.startsWith("[")
            ? `${parentPath}${pathPart}`
            : parentPath
              ? `${parentPath}.${pathPart}`
              : pathPart;

          return (
            <JsonBranch
              key={`${parentPath}-${child.label}`}
              node={child}
              parentPath={childPath}
            />
          );
        })}
      </div>
    </details>
  );
}

function JsonTreeNode({ data }: JsonTreeNodeProps) {
  const tree = buildTree(data?.jsonData ?? data?.jsonObject ?? {});

  return (
    <div className="w-90 rounded-xl border border-slate-200 bg-white p-3 shadow-md">
      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
        JSON Source
      </div>
      <div className="max-h-[66vh] overflow-auto pr-2">
        <JsonBranch node={tree} />
      </div>
    </div>
  );
}

export default memo(JsonTreeNode);
