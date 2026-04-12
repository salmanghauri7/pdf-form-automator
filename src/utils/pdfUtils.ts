import {
  PDFCheckBox,
  PDFDocument,
  PDFDropdown,
  PDFField,
  PDFOptionList,
  PDFRadioGroup,
  PDFTextField,
  PDFFont,
} from "pdf-lib";
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

export type MappingValidationIssue = {
  level: "error" | "warning";
  fieldName: string;
  jsonPath: string;
  message: string;
};

export type MappingValidationResult = {
  issues: MappingValidationIssue[];
  errorCount: number;
  warningCount: number;
};

const BOOLEAN_TRUE_VALUES = ["true", "1", "yes", "y", "on", "checked"];
const BOOLEAN_FALSE_VALUES = ["false", "0", "no", "n", "off", "unchecked", ""];

function parseBooleanLike(value: unknown): boolean | undefined {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    if (value === 1) {
      return true;
    }

    if (value === 0) {
      return false;
    }

    return undefined;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();

    if (BOOLEAN_TRUE_VALUES.includes(normalized)) {
      return true;
    }

    if (BOOLEAN_FALSE_VALUES.includes(normalized)) {
      return false;
    }
  }

  return undefined;
}

function toBoolean(value: unknown): boolean {
  const parsed = parseBooleanLike(value);

  if (parsed !== undefined) {
    return parsed;
  }

  return Boolean(value);
}

function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => String(item));
  }

  return [String(value)];
}

function findMatchingOption(value: unknown, options: string[]): string | null {
  const normalizedOptions = options.map((option) =>
    option.trim().toLowerCase(),
  );
  const candidate = String(value).trim();
  const normalizedCandidate = candidate.toLowerCase();

  const exactIndex = options.findIndex((option) => option === candidate);
  if (exactIndex >= 0) {
    return options[exactIndex];
  }

  const normalizedIndex = normalizedOptions.indexOf(normalizedCandidate);
  if (normalizedIndex >= 0) {
    return options[normalizedIndex];
  }

  if (options.length === 1) {
    const booleanLike = parseBooleanLike(value);
    if (booleanLike === true) {
      return options[0];
    }
  }

  return null;
}

function findMatchingOptions(value: unknown, options: string[]): string[] {
  const requested = toStringArray(value);

  return requested
    .map((item) => findMatchingOption(item, options))
    .filter((item): item is string => item !== null);
}

function getFieldTypeName(field: PDFField): string {
  if (field instanceof PDFTextField) {
    return "text";
  }

  if (field instanceof PDFCheckBox) {
    return "checkbox";
  }

  if (field instanceof PDFRadioGroup) {
    return "radio";
  }

  if (field instanceof PDFDropdown) {
    return "dropdown";
  }

  if (field instanceof PDFOptionList) {
    return "optionList";
  }

  return "unsupported";
}

function validateFieldValue(
  field: PDFField,
  rawValue: unknown,
  fieldName: string,
  jsonPath: string,
): MappingValidationIssue[] {
  if (field instanceof PDFTextField) {
    return [];
  }

  if (field instanceof PDFCheckBox) {
    const parsedBoolean = parseBooleanLike(rawValue);
    if (parsedBoolean === undefined) {
      return [
        {
          level: "warning",
          fieldName,
          jsonPath,
          message:
            "Value is not clearly boolean-like; checkbox will use generic truthy/falsey conversion.",
        },
      ];
    }

    return [];
  }

  if (field instanceof PDFRadioGroup) {
    const options = field.getOptions();
    const matched = findMatchingOption(rawValue, options);

    if (matched) {
      return [];
    }

    return [
      {
        level: "error",
        fieldName,
        jsonPath,
        message: `Invalid radio option \"${String(rawValue)}\". Valid: [${options.join(", ")}]`,
      },
    ];
  }

  if (field instanceof PDFDropdown) {
    const options = field.getOptions();
    const [firstValue] = toStringArray(rawValue);
    const matched = findMatchingOption(firstValue, options);

    if (matched) {
      return [];
    }

    return [
      {
        level: "error",
        fieldName,
        jsonPath,
        message: `Invalid dropdown option \"${String(rawValue)}\". Valid: [${options.join(", ")}]`,
      },
    ];
  }

  if (field instanceof PDFOptionList) {
    const options = field.getOptions();
    const matched = findMatchingOptions(rawValue, options);

    if (matched.length > 0) {
      return [];
    }

    return [
      {
        level: "error",
        fieldName,
        jsonPath,
        message: `Invalid list option \"${String(rawValue)}\". Valid: [${options.join(", ")}]`,
      },
    ];
  }

  return [
    {
      level: "warning",
      fieldName,
      jsonPath,
      message: `Unsupported PDF field type \"${getFieldTypeName(field)}\".`,
    },
  ];
}

function setFieldValue(
  field: PDFField,
  rawValue: unknown,
  font: PDFFont,
): void {
  if (field instanceof PDFTextField) {
    field.setText(String(rawValue));
    field.updateAppearances(font);
    return;
  }

  if (field instanceof PDFCheckBox) {
    if (toBoolean(rawValue)) {
      field.check();
    } else {
      field.uncheck();
    }
    return;
  }

  if (field instanceof PDFRadioGroup) {
    const options = field.getOptions();
    const matched = findMatchingOption(rawValue, options);

    if (matched) {
      field.select(matched);
      return;
    }

    console.warn(
      `[PDF Mapper] Invalid radio option for "${field.getName()}". ` +
        `Received: "${String(rawValue)}", Valid options are: [${options.join(", ")}]`,
    );
    return;
  }

  if (field instanceof PDFDropdown) {
    const options = field.getOptions();
    const [selectedOption] = toStringArray(rawValue);

    const matched = findMatchingOption(selectedOption, options);

    if (matched) {
      field.select(matched);
      field.updateAppearances(font);
    } else {
      console.warn(
        `[PDF Mapper] Invalid dropdown option for "${field.getName()}". ` +
          `Received: "${String(rawValue)}", Valid options are: [${options.join(", ")}]`,
      );
    }
    return;
  }

  if (field instanceof PDFOptionList) {
    const options = field.getOptions();
    const selectedOptions = findMatchingOptions(rawValue, options);

    if (selectedOptions.length > 0) {
      field.select(selectedOptions);
      field.updateAppearances(font);
      return;
    }

    console.warn(
      `[PDF Mapper] Invalid option list values for "${field.getName()}". ` +
        `Received: "${String(rawValue)}", Valid options are: [${options.join(", ")}]`,
    );
    return;
  }

  // Instead of throwing, we just log it to keep the app running
  console.error(`Unsupported field type for "${field.getName()}"`);
}

export async function validatePdfMapping(
  pdfBuffer: ArrayBuffer,
  jsonData: unknown,
  mappingObject: Record<string, string>,
): Promise<MappingValidationResult> {
  const issues: MappingValidationIssue[] = [];
  const pdfDoc = await PDFDocument.load(pdfBuffer);
  const form = pdfDoc.getForm();

  for (const [pdfFieldName, jsonPath] of Object.entries(mappingObject)) {
    if (!jsonPath) {
      issues.push({
        level: "error",
        fieldName: pdfFieldName,
        jsonPath,
        message: "JSON path is empty.",
      });
      continue;
    }

    const rawValue = lodashGet(jsonData, jsonPath);

    if (rawValue === undefined || rawValue === null) {
      issues.push({
        level: "warning",
        fieldName: pdfFieldName,
        jsonPath,
        message: "No value found at the mapped JSON path.",
      });
      continue;
    }

    try {
      const field = form.getField(pdfFieldName);
      issues.push(
        ...validateFieldValue(field, rawValue, pdfFieldName, jsonPath),
      );
    } catch {
      issues.push({
        level: "error",
        fieldName: pdfFieldName,
        jsonPath,
        message: "PDF field does not exist in this document.",
      });
    }
  }

  const errorCount = issues.filter((issue) => issue.level === "error").length;
  const warningCount = issues.filter(
    (issue) => issue.level === "warning",
  ).length;

  return {
    issues,
    errorCount,
    warningCount,
  };
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

    try {
      const field = form.getField(pdfFieldName);
      setFieldValue(field, rawValue, customFont);
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
