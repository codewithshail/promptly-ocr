// Supported file types for prescription uploads
export const ACCEPTED_FILE_TYPES = {
  "image/png": [".png"],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/avif": [".avif"],
  "application/pdf": [".pdf"],
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": [
    ".pptx",
  ],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
    ".docx",
  ],
} as const;

// Maximum file size (50MB in bytes)
export const MAX_FILE_SIZE = 50 * 1024 * 1024;

// Get all accepted file extensions
export const ACCEPTED_EXTENSIONS = Object.values(ACCEPTED_FILE_TYPES).flat();

// Validate file type
export function isValidFileType(file: File): boolean {
  return Object.keys(ACCEPTED_FILE_TYPES).includes(file.type);
}

// Validate file size
export function isValidFileSize(file: File): boolean {
  return file.size <= MAX_FILE_SIZE;
}

// Get human-readable file size
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}

// Validate file before upload
export function validateFile(file: File): {
  valid: boolean;
  error?: string;
} {
  if (!isValidFileType(file)) {
    return {
      valid: false,
      error: `Invalid file type. Accepted formats: ${ACCEPTED_EXTENSIONS.join(", ")}`,
    };
  }

  if (!isValidFileSize(file)) {
    return {
      valid: false,
      error: `File size exceeds maximum limit of ${formatFileSize(MAX_FILE_SIZE)}`,
    };
  }

  return { valid: true };
}
