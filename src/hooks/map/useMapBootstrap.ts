import { extractPdfFormFields } from "@/utils/pdfUtils";
import { useEffect, useState } from "react";

type UseMapBootstrapInput = {
  isHydrated: boolean;
  pdfBuffer: ArrayBuffer | null;
  jsonObject: unknown;
  onMissingData: () => void;
};

type UseMapBootstrapResult = {
  loading: boolean;
  error?: string;
  formFields: string[];
};

export function useMapBootstrap({
  isHydrated,
  pdfBuffer,
  jsonObject,
  onMissingData,
}: UseMapBootstrapInput): UseMapBootstrapResult {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>();
  const [formFields, setFormFields] = useState<string[]>([]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    if (!pdfBuffer || !jsonObject) {
      onMissingData();
      return;
    }

    let isCancelled = false;

    const processData = async () => {
      try {
        setLoading(true);
        setError(undefined);

        const extractedFormFields = await extractPdfFormFields(pdfBuffer);

        if (isCancelled) {
          return;
        }

        setFormFields(extractedFormFields);
      } catch (err) {
        if (isCancelled) {
          return;
        }

        setError(`Got this error${String(err)}`);
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    processData();

    return () => {
      isCancelled = true;
    };
  }, [isHydrated, jsonObject, onMissingData, pdfBuffer]);

  return {
    loading,
    error,
    formFields,
  };
}
