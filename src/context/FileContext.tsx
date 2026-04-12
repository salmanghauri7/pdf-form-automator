'use client';
import { createContext, Dispatch, ReactNode, SetStateAction, useContext, useMemo, useState } from "react";

type MappingObjectValue = Record<string, string> | null;
type FileContextValue = {

    pdfBuffer: ArrayBuffer | null;
    setPdfBuffer: Dispatch<SetStateAction<ArrayBuffer | null>>;

    jsonObject: unknown;
    setJsonObject: Dispatch<SetStateAction<unknown>>;

    mappingObject: MappingObjectValue;
    setMappingObject: Dispatch<SetStateAction<MappingObjectValue>>;
    resetAll: () => void;
}

const FileContext = createContext<FileContextValue | null>(null);

export function FileProvider({children}: {children: ReactNode}){
    const [pdfBuffer, setPdfBuffer] = useState<ArrayBuffer | null>(null);
    const [jsonObject, setJsonObject] = useState<unknown>(null);
    const [mappingObject, setMappingObject] = useState<MappingObjectValue>(null);

    const value = useMemo(
        () => ({
            pdfBuffer,
            setPdfBuffer,
            jsonObject, 
            setJsonObject,
            mappingObject,
            setMappingObject,
            resetAll: () => {
                setPdfBuffer(null);
                setJsonObject(null);
                setMappingObject(null);
            }
        }),
        [pdfBuffer, jsonObject, mappingObject]
    );

    return <FileContext value={value}>{children}</FileContext>
}

const useFileContext = () => {
    const context= useContext(FileContext);
    if(!context){
        throw new Error("useFileContext must be used inside FileProvider");
    }

    return context;
}

export default useFileContext;