import { fillPdfWithMapping, validatePdfMapping } from "@/utils/pdfUtils";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

type UseMapPreviewInput = {
  pdfBuffer: ArrayBuffer | null;
  jsonObject: unknown;
  mappingObject: Record<string, string> | null;
};

type UseMapPreviewResult = {
  isPreviewOpen: boolean;
  isGeneratingPreview: boolean;
  previewUrl: string;
  openPreview: () => Promise<void>;
  closePreview: () => void;
};

export function useMapPreview({
  pdfBuffer,
  jsonObject,
  mappingObject,
}: UseMapPreviewInput): UseMapPreviewResult {
  const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(false);
  const [isGeneratingPreview, setIsGeneratingPreview] =
    useState<boolean>(false);
  const [previewUrl, setPreviewUrl] = useState<string>("");

  const openPreview = useCallback(async () => {
    if (isGeneratingPreview) {
      return;
    }

    if (!pdfBuffer || !jsonObject) {
      toast.error("Upload both PDF and JSON before preview.");
      return;
    }

    if (!mappingObject || Object.keys(mappingObject).length === 0) {
      toast.error("Create at least one mapping before preview.");
      return;
    }

    setPreviewUrl((currentPreviewUrl) => {
      if (currentPreviewUrl) {
        URL.revokeObjectURL(currentPreviewUrl);
      }

      return "";
    });

    try {
      setIsPreviewOpen(true);
      setIsGeneratingPreview(true);

      const validation = await validatePdfMapping(
        pdfBuffer,
        jsonObject,
        mappingObject,
      );

      if (validation.warningCount > 0) {
        toast.warning(
          `Mapping check found ${validation.warningCount} warning${validation.warningCount > 1 ? "s" : ""}.`,
        );
      }

      if (validation.errorCount > 0) {
        const previewIssues = validation.issues
          .filter((issue) => issue.level === "error")
          .slice(0, 3);

        previewIssues.forEach((issue) => {
          toast.error(`${issue.fieldName}: ${issue.message}`);
        });

        if (validation.errorCount > previewIssues.length) {
          toast.error(
            `+${validation.errorCount - previewIssues.length} more mapping error${validation.errorCount - previewIssues.length > 1 ? "s" : ""}.`,
          );
        }

        setIsPreviewOpen(false);
        return;
      }

      const blob = await fillPdfWithMapping(
        pdfBuffer,
        jsonObject,
        mappingObject,
      );
      const url = URL.createObjectURL(blob);
      setPreviewUrl((currentPreviewUrl) => {
        if (currentPreviewUrl) {
          URL.revokeObjectURL(currentPreviewUrl);
        }

        return url;
      });
    } catch (error) {
      toast.error(`Failed to generate preview: ${String(error)}`);
    } finally {
      setIsGeneratingPreview(false);
    }
  }, [isGeneratingPreview, jsonObject, mappingObject, pdfBuffer]);

  const closePreview = useCallback(() => {
    setIsPreviewOpen(false);
  }, []);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  return {
    isPreviewOpen,
    isGeneratingPreview,
    previewUrl,
    openPreview,
    closePreview,
  };
}
