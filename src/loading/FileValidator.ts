import {
  getFileExtension,
  isSupportedModelExtension,
  type SupportedModelExtension,
} from "./SupportedFormats";

export interface ModelFileInfo {
  name: string;
  extension: SupportedModelExtension;
  sizeBytes: number;
}

export type FileValidationResult =
  | {
      ok: true;
      file: File;
      fileInfo: ModelFileInfo;
      warningMessage: string | null;
    }
  | {
      ok: false;
      errorMessage: string;
    };

const LARGE_FILE_WARNING_BYTES = 100 * 1024 * 1024;

export function validateModelFile(file: File | null): FileValidationResult {
  if (!file) {
    return {
      ok: false,
      errorMessage: "Please choose a model file to inspect.",
    };
  }

  const extension = getFileExtension(file.name);

  if (!isSupportedModelExtension(extension)) {
    return {
      ok: false,
      errorMessage: "Unsupported file type. Please upload a .glb or .gltf file.",
    };
  }

  return {
    ok: true,
    file,
    fileInfo: {
      name: file.name,
      extension,
      sizeBytes: file.size,
    },
    warningMessage:
      file.size >= LARGE_FILE_WARNING_BYTES
        ? "Large file selected. It may take longer to load."
        : null,
  };
}
