import useFileContext from "@/context/FileContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function MapJsonToPdf(){
    const router = useRouter();
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>();
    const {pdfBuffer, jsonObject} = useFileContext();

    useEffect(() => {
        if(!pdfBuffer || !jsonObject){
            router.replace("/upload");
        }

       const processData = async () => {
        try{
            setLoading(true);

        }catch(error){
            setError("Got this error" + error);
        }
       } 

       processData();
    }, [pdfBuffer, jsonObject, loading, router])
}