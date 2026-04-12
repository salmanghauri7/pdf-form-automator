type FlattenJsonObjectProps = {
  jsonData: Record<string, unknown>;
  prefix: string;
  result: Record<string, unknown>;
};

export function flattenJsonObject({
  jsonData,
  prefix = "",
  result = {},
}: FlattenJsonObjectProps) : Record<string,unknown> {
  for (const key in jsonData) {
    const path = prefix ? `${prefix}.${key}` : key;
    const value=jsonData[key];
    if (
      typeof value === "object" &&
      value != null &&
      !Array.isArray(value)
    ) {
      flattenJsonObject({ jsonData: value as Record<string, unknown>, prefix: path, result });
    }
    else{
        result[path] = jsonData[key];
    }
  }
  return result;
}

