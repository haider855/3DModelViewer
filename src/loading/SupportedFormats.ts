export const SUPPORTED_MODEL_EXTENSIONS = [".glb", ".gltf"] as const;

export type SupportedModelExtension = (typeof SUPPORTED_MODEL_EXTENSIONS)[number];

export const ACCEPTED_MODEL_FILE_TYPES = SUPPORTED_MODEL_EXTENSIONS.join(",");

export function getFileExtension(fileName: string): string {
  const extensionStart = fileName.lastIndexOf(".");

  if (extensionStart === -1) {
    return "";
  }

  return fileName.slice(extensionStart).toLowerCase();
}

export function isSupportedModelExtension(
  extension: string,
): extension is SupportedModelExtension {
  return SUPPORTED_MODEL_EXTENSIONS.includes(
    extension.toLowerCase() as SupportedModelExtension,
  );
}
