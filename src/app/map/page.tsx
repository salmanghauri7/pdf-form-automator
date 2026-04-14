"use client";
import JsonTreeNode from "@/component/map/JsonTreeNode";
import PdfFieldNode from "@/component/map/PdfFieldNode";
import useFileContext from "@/context/FileContext";
import "@xyflow/react/dist/style.css";
import {
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
import { Toaster } from "sonner";
import {
  areMappingsEqual,
  buildMappingFromEdges,
  connectEdgeSingleTarget,
  createEdgesFromMapping,
  filterEdgesByVisibleSources,
} from "@/utils/mapFlowUtils";
import { useMapBootstrap } from "@/hooks/map/useMapBootstrap";
import { useMapPreview } from "@/hooks/map/useMapPreview";

const nodeTypes = {
  jsonTree: JsonTreeNode,
  pdfField: PdfFieldNode,
};

export default function MapJsonToPdf() {
  const router = useRouter();
  const [visibleSourceHandles, setVisibleSourceHandles] =
    useState<Set<string> | null>(null);
  const { pdfBuffer, jsonObject, mappingObject, setMappingObject, isHydrated } =
    useFileContext();

  const { loading, error, formFields } = useMapBootstrap({
    isHydrated,
    pdfBuffer,
    jsonObject,
    onMissingData: () => router.replace("/upload"),
  });

  const {
    isPreviewOpen,
    isGeneratingPreview,
    previewUrl,
    openPreview,
    closePreview,
  } = useMapPreview({
    pdfBuffer,
    jsonObject,
    mappingObject,
  });

  const onVisibleSourceHandlesChange = useCallback((handles: string[]) => {
    setVisibleSourceHandles(new Set(handles));
  }, []);

  const initialNodes = useMemo(() => {
    const sourceNode = {
      id: "json-source-node",
      type: "jsonTree",
      data: {
        jsonObject,
        onVisibleHandlesChange: onVisibleSourceHandlesChange,
      },
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
  }, [formFields, jsonObject, onVisibleSourceHandlesChange]);

  const initialEdges = useMemo<Edge[]>(() => {
    return createEdgesFromMapping(mappingObject);
  }, [mappingObject]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges] = useEdgesState(initialEdges);

  const renderedEdges = useMemo(() => {
    return filterEdgesByVisibleSources(edges, visibleSourceHandles);
  }, [edges, visibleSourceHandles]);

  useEffect(() => {
    setNodes(initialNodes);
  }, [initialNodes, setNodes]);

  useEffect(() => {
    setEdges(initialEdges);
  }, [initialEdges, setEdges]);

  useEffect(() => {
    if (!isHydrated || loading) {
      return;
    }

    const derivedMapping = buildMappingFromEdges(edges);

    setMappingObject((currentMapping) => {
      if (areMappingsEqual(currentMapping, derivedMapping)) {
        return currentMapping;
      }

      return derivedMapping;
    });
  }, [edges, isHydrated, loading, setMappingObject]);

  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((existing) => {
        return connectEdgeSingleTarget(existing, params);
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

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-slate-100">
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
      <div className="flex min-h-dvh items-center justify-center bg-slate-100 px-4">
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
    <div className="relative flex h-dvh flex-col overflow-hidden bg-[linear-gradient(180deg,#f1f5f9_0%,#dbe3ee_100%)]">
      <Toaster position="top-right" richColors closeButton />
      <header className="shrink-0 border-b border-slate-300/80 bg-slate-50/85 px-4 py-3 backdrop-blur sm:px-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold text-slate-900">
                Mapping Canvas
              </h1>
              <button
                type="button"
                title="Tip: click a connection line to remove it"
                aria-label="Tip: click a connection line to remove it"
                className="flex h-5 w-5 cursor-help items-center justify-center rounded-full border border-slate-300 bg-slate-100 text-[11px] font-semibold text-slate-600 shadow-sm transition hover:bg-slate-200 hover:text-slate-900"
              >
                i
              </button>
            </div>
            <p className="text-xs text-slate-600">
              Connect JSON leaf paths to PDF form fields.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={openPreview}
              disabled={isGeneratingPreview}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500"
            >
              Preview
            </button>
          </div>
        </div>
      </header>

      <div className="min-h-0 w-full flex-1">
        <ReactFlow
          nodes={nodes}
          edges={renderedEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onEdgeClick={onEdgeClick}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          connectionLineStyle={{
            stroke: "#2563ea",
            strokeWidth: 1.5,
            strokeDasharray: "6 4",
            opacity: 0.95,
          }}
          fitView
          fitViewOptions={{ padding: 0.2 }}
        >
          <Background gap={20} color="#cbd5e1" />
          <Controls />
        </ReactFlow>
      </div>

      <PreviewModal
        isOpen={isPreviewOpen}
        onClose={closePreview}
        previewUrl={previewUrl}
        isGenerating={isGeneratingPreview}
      />
    </div>
  );
}
