import { PDFDocument } from "pdf-lib";
import { get as lodashGet } from "lodash";

export async function extractPdfFormFields(
  pdfBuffer: ArrayBuffer | null,
): Promise<string[]> {
  if (!pdfBuffer) {
    console.error("No PDF loaded yet");
    return [];
  }
  const pdfDoc = await PDFDocument.load(pdfBuffer);
  const form = pdfDoc.getForm();
  const fields = form.getFields();
  return fields.map((field) => field.getName());
}

export async function fillPdfWithMapping(
  pdfBuffer: ArrayBuffer,
  jsonData: unknown,
  mappingObject: Record<string, string> ,
): Promise<Blob> {
  const pdfDoc = await PDFDocument.load(pdfBuffer);
  const form = pdfDoc.getForm();

  for (const [pdfFieldName, jsonPath] of Object.entries(mappingObject)) {
    const rawValue = lodashGet(jsonData, jsonPath);

    if (rawValue === undefined || rawValue === null) {
      continue;
    }

    const textValue = String(rawValue);

    try {
      const field = form.getTextField(pdfFieldName);
      field.setText(textValue);
      continue;
    } catch {
      // Fall through for non-text fields.
    }
  }

  const bytes = await pdfDoc.save();
  const arrayBuffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(arrayBuffer).set(bytes);
  return new Blob([arrayBuffer], { type: "application/pdf" });
}
