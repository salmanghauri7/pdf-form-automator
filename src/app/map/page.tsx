"use client";
import JsonTreeNode from "@/component/map/JsonTreeNode";
import PdfFieldNode from "@/component/map/PdfFieldNode";
import useFileContext from "@/context/FileContext";
import { FlattenedEntry, flattenJsonObject } from "@/utils/jsonUtils";
import { extractPdfFormFields, fillPdfWithMapping } from "@/utils/pdfUtils";
import "@xyflow/react/dist/style.css";
import {
  addEdge,
  applyEdgeChanges,
  Background,
  Connection,
  Controls,
  Edge,
  EdgeChange,
  ReactFlow,
  useEdgesState,
  useNodesState,
} from "@xyflow/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import PreviewModal from "@/component/map/PreviewModal";

const nodeTypes = {
  jsonTree: JsonTreeNode,
  pdfField: PdfFieldNode,
};

export default function MapJsonToPdf() {
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>();
  const [formFields, setFormFields] = useState<string[]>([]);
  const [jsonPaths, setJsonPaths] = useState<FlattenedEntry[]>([]);
  const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(false);
  const [isGeneratingPreview, setIsGeneratingPreview] =
    useState<boolean>(false);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const { pdfBuffer, jsonObject, mappingObject, setMappingObject, isHydrated } =
    useFileContext();

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    if (!pdfBuffer || !jsonObject) {
      router.replace("/upload");
      return;
    }

    const processData = async () => {
      try {
        setLoading(true);
        setError("");

        const formFields = await extractPdfFormFields(pdfBuffer);
        setFormFields(formFields);

        if (
          jsonObject &&
          typeof jsonObject === "object" &&
          !Array.isArray(jsonObject)
        ) {
          const flatData = flattenJsonObject({
            jsonData: jsonObject as Record<string, unknown>,
          });
          setJsonPaths(flatData);
        } else {
          setError("No valid JSON object found to flatten.");
        }
      } catch (error) {
        setError("Got this error" + error);
      } finally {
        setLoading(false);
      }
    };

    processData();
  }, [isHydrated, pdfBuffer, jsonObject, router]);

  const initialNodes = useMemo(() => {
    const sourceNode = {
      id: "json-source-node",
      type: "jsonTree",
      data: { jsonData: jsonObject },
      position: { x: 40, y: 80 },
      draggable: false,
    };
    const targetNode = {
      id: "pdf-fields-node",
      type: "pdfField",
      data: { fields: formFields },
      position: { x: 760, y: 80 },
      draggable: false,
    };
    return [sourceNode, targetNode];
  }, [jsonObject, formFields]);

  const initialEdges = useMemo<Edge[]>(() => {
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
  }, [mappingObject]);

  const buildMappingFromEdges = useCallback(
    (edgesList: Edge[]): Record<string, string> => {
      return edgesList.reduce<Record<string, string>>((accumulator, edge) => {
        if (edge.targetHandle == null || edge.sourceHandle == null) {
          return accumulator;
        }

        accumulator[String(edge.targetHandle)] = String(edge.sourceHandle);
        return accumulator;
      }, {});
    },
    [],
  );

  const areMappingsEqual = useCallback(
    (current: Record<string, string> | null, next: Record<string, string>) => {
      const safeCurrent = current ?? {};
      const currentKeys = Object.keys(safeCurrent);
      const nextKeys = Object.keys(next);

      if (currentKeys.length !== nextKeys.length) {
        return false;
      }

      return currentKeys.every((key) => safeCurrent[key] === next[key]);
    },
    [],
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges] = useEdgesState(initialEdges);

  useEffect(() => {
    setNodes(initialNodes);
  }, [initialNodes, setNodes]);

  useEffect(() => {
    setEdges(initialEdges);
  }, [initialEdges, setEdges]);

  useEffect(() => {
    const derivedMapping = buildMappingFromEdges(edges);

    setMappingObject((currentMapping) => {
      if (areMappingsEqual(currentMapping, derivedMapping)) {
        return currentMapping;
      }

      return derivedMapping;
    });
  }, [areMappingsEqual, buildMappingFromEdges, edges, setMappingObject]);

  const onConnect = useCallback(
    (params: Connection) => {
      if (params.sourceHandle == null || params.targetHandle == null) {
        return;
      }

      const sourceHandle = params.sourceHandle;
      const targetField = params.targetHandle;

      setEdges((existing) => {
        const withoutTarget = existing.filter(
          (edge) => edge.targetHandle !== targetField,
        );

        return addEdge(
          {
            ...params,
            id: `${targetField}-${sourceHandle}`,
            animated: true,
          },
          withoutTarget,
        );
      });
    },
    [setEdges],
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      setEdges((currentEdges) => {
        return applyEdgeChanges(changes, currentEdges);
      });
    },
    [setEdges],
  );

  const onEdgeClick = useCallback(
    (event: React.MouseEvent, edge: Edge) => {
      event.preventDefault();

      setEdges((currentEdges) => {
        return currentEdges.filter((currentEdge) => currentEdge.id !== edge.id);
      });
    },
    [setEdges],
  );

  const openPreview = async () => {
    if (!pdfBuffer || !jsonObject) {
      return;
    }
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    try {
      setIsPreviewOpen(true);
      setIsGeneratingPreview(true);
      const blob = await fillPdfWithMapping(
        pdfBuffer,
        jsonObject,
        mappingObject ?? {},
      );
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
    } finally {
      setIsGeneratingPreview(false);
    }
  };

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="rounded-2xl border border-slate-300 bg-slate-50 px-8 py-6 text-center shadow-lg">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
          <p className="text-sm font-medium text-slate-700">
            Preparing mapping canvas...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
        <div className="max-w-md rounded-xl border border-red-200 bg-red-50 p-5 text-red-700">
          <p className="text-sm font-medium">{error}</p>
          <button
            type="button"
            onClick={() => router.push("/upload")}
            className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
          >
            Back to Upload
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[linear-gradient(180deg,#f1f5f9_0%,#dbe3ee_100%)]">
      <header className="border-b border-slate-300/80 bg-slate-50/85 px-4 py-3 backdrop-blur sm:px-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-slate-900">
              Mapping Canvas
            </h1>
            <p className="text-xs text-slate-600">
              Connect JSON leaf paths to PDF form fields.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded-md border border-slate-300 bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 shadow-sm">
              Paths: {jsonPaths.length}
            </span>
            <span className="rounded-md border border-slate-300 bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 shadow-sm">
              Fields: {formFields.length}
            </span>
            <button
              type="button"
              onClick={openPreview}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500"
            >
              Preview
            </button>
          </div>
        </div>
        <p className="mt-2 text-xs text-slate-500">
          Tip: click a connection line to remove it
        </p>
      </header>

      <div className="h-[calc(100vh-65px)] w-full">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onEdgeClick={onEdgeClick}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.2 }}
        >
          <Background gap={20} color="#cbd5e1" />
          <Controls />
        </ReactFlow>
      </div>

      <PreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        previewUrl={previewUrl}
        isGenerating={isGeneratingPreview}
      />
    </div>
  );
}
