import { PDFDocument } from "pdf-lib";
export async function extractPdfFormFields(pdfBuffer: ArrayBuffer):Promise<string[]> {
  const pdfDoc = await PDFDocument.load(pdfBuffer);
  const form = pdfDoc.getForm();
  const fields = form.getFields();
  return fields.map((field) => field.getName());
}
