"use client";
import JsonTreeNode from "@/component/map/JsonTreeNode";
import PdfFieldNode from "@/component/map/PdfFieldNode";
import useFileContext from "@/context/FileContext";
import { FlattenedEntry, flattenJsonObject } from "@/utils/jsonUtils";
import { extractPdfFormFields } from "@/utils/pdfUtils";
import "@xyflow/react/dist/style.css";
import {
  addEdge,
  Background,
  Connection,
  Controls,
  ReactFlow,
  useEdgesState,
  useNodesState,
} from "@xyflow/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

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
  const { pdfBuffer, jsonObject, mappingObject, setMappingObject } =
    useFileContext();

  useEffect(() => {
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
  }, [pdfBuffer, jsonObject, router]);

  const initialNodes = useMemo(() => {
    const sourceNode = {
      id: "json-source-node",
      type: "jsonTree",
      data: { jsonData: jsonObject },
      position: { x: 40, y: 80 },
      draggable: false,
    };
    const targetNodes = formFields.map((field, index) => ({
      id: field,
      type: "pdfField",
      data: { fieldName: field },
      position: { x: 760, y: 60 + index * 80 },
      draggable: false,
    }));
    return [sourceNode, ...targetNodes];
  }, [jsonObject, formFields]);

  const initialEdges = useMemo(() => {
    if (typeof mappingObject === "object" && mappingObject != null) {
      return Object.entries(mappingObject).map(([pdfFieldName, path]) => ({
        id: `${pdfFieldName}-${path}`,
        source: "json-source-node",
        sourceHandle: String(path),
        target: pdfFieldName,
        targetHandle: pdfFieldName,
        animated: true,
      }));
    }
    return [];
  }, [mappingObject]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  useEffect(() => {
    setNodes(initialNodes);
  }, [initialNodes, setNodes]);

  useEffect(() => {
    setEdges(initialEdges);
  }, [initialEdges, setEdges]);

  const onConnect = useCallback(
    (params: Connection) => {
      if (params.sourceHandle == null || params.target == null) {
        return;
      }

      const sourceHandle = params.sourceHandle;
      const target = params.target;

      setEdges((existing) => {
        const withoutTarget = existing.filter((edge) => edge.target !== target);

        return addEdge(
          {
            ...params,
            id: `${target}-${sourceHandle}`,
            animated: true,
          },
          withoutTarget,
        );
      });

      setMappingObject((previous) => ({
        ...previous,
        [target]: sourceHandle,
      }));
    },
    [setEdges, setMappingObject],
  );

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="rounded-2xl border border-slate-200 bg-white px-8 py-6 text-center shadow-lg">
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
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
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
    <div className="relative min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#e2e8f0_100%)]">
      <header className="border-b border-white/80 bg-white/70 px-4 py-3 backdrop-blur sm:px-6">
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
            <span className="rounded-md bg-white px-3 py-1 text-xs font-medium text-slate-700 shadow-sm">
              Paths: {jsonPaths.length}
            </span>
            <span className="rounded-md bg-white px-3 py-1 text-xs font-medium text-slate-700 shadow-sm">
              Fields: {formFields.length}
            </span>
            {/* <button
              type="button"
              onClick={openPreview}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500"
            >
              Preview
            </button> */}
          </div>
        </div>
      </header>

      <div className="h-[calc(100vh-65px)] w-full">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.2 }}
        >
          <Background gap={20} color="#cbd5e1" />
          <Controls />
        </ReactFlow>
      </div>

      {/* <PreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        previewUrl={previewUrl}
        isGenerating={isGeneratingPreview}
      /> */}
    </div>
  );
}
