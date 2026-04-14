import { addEdge, Connection, Edge } from "@xyflow/react";

export function createEdgesFromMapping(
  mappingObject: Record<string, string> | null,
): Edge[] {
  if (typeof mappingObject === "object" && mappingObject != null) {
    return Object.entries(mappingObject).map(([pdfFieldName, path]) => ({
      id: `${pdfFieldName}-${path}`,
      source: "json-source-node",
      sourceHandle: String(path),
      target: "pdf-fields-node",
      targetHandle: pdfFieldName,
      animated: true,
    }));
  }
  return [];
}

export function buildMappingFromEdges(
  edgesList: Edge[],
): Record<string, string> {
  return edgesList.reduce<Record<string, string>>((accumulator, edge) => {
    if (edge.targetHandle == null || edge.sourceHandle == null) {
      return accumulator;
    }

    accumulator[String(edge.targetHandle)] = String(edge.sourceHandle);
    return accumulator;
  }, {});
}

export function areMappingsEqual(
  current: Record<string, string> | null,
  next: Record<string, string>,
): boolean {
  const safeCurrent = current ?? {};
  const currentKeys = Object.keys(safeCurrent);
  const nextKeys = Object.keys(next);

  if (currentKeys.length !== nextKeys.length) {
    return false;
  }

  return currentKeys.every((key) => safeCurrent[key] === next[key]);
}

export function filterEdgesByVisibleSources(
  edges: Edge[],
  visibleSourceHandles: Set<string> | null,
): Edge[] {
  if (visibleSourceHandles == null) {
    return edges;
  }

  return edges.filter((edge) => {
    if (edge.sourceHandle == null) {
      return true;
    }

    return visibleSourceHandles.has(String(edge.sourceHandle));
  });
}

export function connectEdgeSingleTarget(
  existing: Edge[],
  params: Connection,
): Edge[] {
  if (params.sourceHandle == null || params.targetHandle == null) {
    return existing;
  }

  const sourceHandle = params.sourceHandle;
  const targetField = params.targetHandle;

  const withoutTarget = existing.filter(
    (edge) => edge.targetHandle !== targetField,
  );

  const connectionExists = withoutTarget.some(
    (edge) =>
      edge.sourceHandle === sourceHandle && edge.targetHandle === targetField,
  );

  if (connectionExists) {
    return withoutTarget;
  }

  return addEdge(
    {
      ...params,
      id: `${targetField}-${sourceHandle}`,
      animated: true,
    },
    withoutTarget,
  );
}
