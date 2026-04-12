import { PDFDocument } from "pdf-lib";
import { get as lodashGet } from "lodash";
import fontkit from "@pdf-lib/fontkit";

const DEFAULT_UNICODE_FONT_PATH = "/fonts/NotoSans-Regular.ttf";

async function loadCustomFontBytes(
  fontPath: string = DEFAULT_UNICODE_FONT_PATH,
): Promise<ArrayBuffer> {
  const response = await fetch(fontPath);

  if (!response.ok) {
    throw new Error(
      `Failed to load custom font at ${fontPath}. Add a TTF file under public/fonts.`,
    );
  }

  return response.arrayBuffer();
}

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
  mappingObject: Record<string, string>,
): Promise<Blob> {
  const pdfDoc = await PDFDocument.load(pdfBuffer);
  pdfDoc.registerFontkit(fontkit);

  const customFontBytes = await loadCustomFontBytes();
  const customFont = await pdfDoc.embedFont(customFontBytes);

  const form = pdfDoc.getForm();
  form.updateFieldAppearances(customFont);

  for (const [pdfFieldName, jsonPath] of Object.entries(mappingObject)) {
    const rawValue = lodashGet(jsonData, jsonPath);

    if (rawValue === undefined || rawValue === null) {
      continue;
    }

    const textValue = String(rawValue);

    try {
      const field = form.getTextField(pdfFieldName);
      field.setText(textValue);
      field.updateAppearances(customFont);
      continue;
    } catch (error) {
      console.error(`Failed to set PDF field \"${pdfFieldName}\".`, error);
    }
  }

  const bytes = await pdfDoc.save();
  const arrayBuffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(arrayBuffer).set(bytes);
  return new Blob([arrayBuffer], { type: "application/pdf" });
}
