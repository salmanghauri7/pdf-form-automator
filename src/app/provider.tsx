import { FileProvider } from "@/context/FileContext";
import { ReactNode } from "react";

export default function Provider({children}: {children:ReactNode}){
    return <FileProvider>{children}</FileProvider>
}