"use client";
import {
  createContext,
  Dispatch,
  ReactNode,
  SetStateAction,
  useContext,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePathname } from "next/navigation";

type MappingObjectValue = Record<string, string> | null;
type PersistedSessionState = {
  pdfBufferBase64: string;
  jsonObject: unknown;
  mappingObject: MappingObjectValue;
};
type FileContextValue = {
  pdfBuffer: ArrayBuffer | null;
  setPdfBuffer: Dispatch<SetStateAction<ArrayBuffer | null>>;

  jsonObject: unknown;
  setJsonObject: Dispatch<SetStateAction<unknown>>;

  mappingObject: MappingObjectValue;
  setMappingObject: Dispatch<SetStateAction<MappingObjectValue>>;
  resetAll: () => void;
  isHydrated: boolean;
};

const FileContext = createContext<FileContextValue | null>(null);

const SESSION_STORAGE_KEY = "pdf-form-session-v1";
const MAX_SESSION_STORAGE_BYTES = 4 * 1024 * 1024;
const MIN_PERSISTABLE_PDF_BYTES = 2 * 1024 * 1024;

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;

  for (let index = 0; index < bytes.length; index += chunkSize) {
    const chunk = bytes.subarray(index, index + chunkSize);
    binary += String.fromCharCode(...chunk);
  }

  return btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes.buffer;
}

export function FileProvider({ children }: { children: ReactNode }) {
  const [pdfBuffer, setPdfBuffer] = useState<ArrayBuffer | null>(null);
  const [jsonObject, setJsonObject] = useState<unknown>(null);
  const [mappingObject, setMappingObject] = useState<MappingObjectValue>(null);
  const [isHydrated, setIsHydrated] = useState<boolean>(false);
  const pathname = usePathname();
  const hasLoadedRef = useRef(false);

  const clearSessionStorage = useCallback(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
  }, []);

  const resetAll = useCallback(() => {
    setPdfBuffer(null);
    setJsonObject(null);
    setMappingObject(null);
    clearSessionStorage();
  }, [clearSessionStorage]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (pathname === "/upload") {
      resetAll();
      hasLoadedRef.current = true;
      setIsHydrated(true);
      return;
    }

    if (hasLoadedRef.current) {
      return;
    }

    hasLoadedRef.current = true;

    try {
      const rawSession = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (!rawSession) {
        setIsHydrated(true);
        return;
      }

      const parsed = JSON.parse(rawSession) as PersistedSessionState;
      if (!parsed?.pdfBufferBase64 || parsed.jsonObject == null) {
        setIsHydrated(true);
        return;
      }

      setPdfBuffer(base64ToArrayBuffer(parsed.pdfBufferBase64));
      setJsonObject(parsed.jsonObject);
      setMappingObject(parsed.mappingObject ?? null);
    } catch {
      clearSessionStorage();
    } finally {
      setIsHydrated(true);
    }
  }, [clearSessionStorage, pathname, resetAll]);

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !isHydrated ||
      pathname === "/upload"
    ) {
      return;
    }

    if (!pdfBuffer || jsonObject == null) {
      clearSessionStorage();
      return;
    }

    if (pdfBuffer.byteLength > MIN_PERSISTABLE_PDF_BYTES) {
      clearSessionStorage();
      return;
    }

    try {
      const sessionPayload: PersistedSessionState = {
        pdfBufferBase64: arrayBufferToBase64(pdfBuffer),
        jsonObject,
        mappingObject,
      };

      const serializedPayload = JSON.stringify(sessionPayload);
      const payloadSizeBytes = new TextEncoder().encode(
        serializedPayload,
      ).length;

      if (payloadSizeBytes > MAX_SESSION_STORAGE_BYTES) {
        clearSessionStorage();
        return;
      }

      window.sessionStorage.setItem(SESSION_STORAGE_KEY, serializedPayload);
    } catch {
      clearSessionStorage();
    }
  }, [
    clearSessionStorage,
    isHydrated,
    jsonObject,
    mappingObject,
    pdfBuffer,
    pathname,
  ]);

  const value = useMemo(
    () => ({
      pdfBuffer,
      setPdfBuffer,
      jsonObject,
      setJsonObject,
      mappingObject,
      setMappingObject,
      resetAll,
      isHydrated,
    }),
    [isHydrated, jsonObject, mappingObject, pdfBuffer, resetAll],
  );

  return <FileContext value={value}>{children}</FileContext>;
}

const useFileContext = () => {
  const context = useContext(FileContext);
  if (!context) {
    throw new Error("useFileContext must be used inside FileProvider");
  }

  return context;
};

export default useFileContext;
