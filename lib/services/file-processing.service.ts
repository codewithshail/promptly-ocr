import { v2 as cloudinary } from "cloudinary";
import { GoogleGenAI } from "@google/genai";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * File upload response
 */
export interface FileUploadResponse {
  url: string;
  publicId: string;
}

/**
 * FileProcessingService - Unified service for file upload, OCR, and text extraction
 * Supports both PDF and image files for GS and Essay copy types
 */
export class FileProcessingService {
  private genAI: GoogleGenAI;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY || "";
    this.genAI = new GoogleGenAI({ apiKey });
  }

  /**
   * Upload file to Cloudinary
   * @param file - File to upload
   * @param userId - User ID for folder organization
   * @returns Upload response with URL and public ID
   */
  async uploadFile(file: File, userId: string): Promise<FileUploadResponse> {
    try {
      // Convert file to base64 for Cloudinary upload
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const base64File = `data:${file.type};base64,${buffer.toString("base64")}`;

      // Determine if file is PDF
      const isPDF = file.type === "application/pdf";

      // Upload to Cloudinary with public access
      const uploadResponse = await cloudinary.uploader.upload(base64File, {
        folder: "upsc-copies",
        resource_type: isPDF ? "raw" : "auto",
        public_id: `${userId}_${Date.now()}`,
        type: "upload",
        access_mode: "public",
        invalidate: true,
      });

      return {
        url: uploadResponse.secure_url,
        publicId: uploadResponse.public_id,
      };
    } catch (error) {
      console.error("File upload failed:", error);
      throw new Error("Failed to upload file");
    }
  }

  /**
   * Extract text from file (PDF or image)
   * @param fileUrl - URL of the file
   * @param fileType - MIME type of the file
   * @returns Extracted text
   */
  async extractText(fileUrl: string, fileType: string): Promise<string> {
    try {
      if (fileType === "application/pdf") {
        return await this.extractTextFromPDF(fileUrl);
      } else if (fileType.startsWith("image/")) {
        return await this.extractTextFromImage(fileUrl);
      } else {
        throw new Error(`Unsupported file type: ${fileType}`);
      }
    } catch (error) {
      console.error("Text extraction failed:", error);
      throw new Error("Failed to extract text from file");
    }
  }

  /**
   * Extract text from image using Gemini Vision
   * @param imageUrl - URL of the image
   * @returns Extracted text
   */
  async extractTextFromImage(imageUrl: string): Promise<string> {
    try {
      // Fetch image and convert to base64
      const response = await fetch(imageUrl);
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const base64Image = buffer.toString("base64");

      // Determine MIME type from URL or default to jpeg
      let mimeType = "image/jpeg";
      if (imageUrl.includes(".png")) mimeType = "image/png";
      else if (imageUrl.includes(".jpg") || imageUrl.includes(".jpeg"))
        mimeType = "image/jpeg";
      else if (imageUrl.includes(".webp")) mimeType = "image/webp";

      const prompt = `Extract all text from this image. This is a UPSC examination answer copy.

Instructions:
1. Extract ALL text exactly as written, preserving formatting and structure
2. Maintain question numbers and answer structure
3. Include all handwritten or printed text
4. Preserve paragraph breaks and sections
5. If there are multiple questions, separate them clearly

Return ONLY the extracted text, no additional commentary.`;

      const result = await this.genAI.models.generateContent({
        model: "gemini-2.0-flash-exp",
        contents: [
          {
            role: "user",
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType,
                  data: base64Image,
                },
              },
            ],
          },
        ],
      });

      const extractedText = result.text || "";
      return extractedText.trim();
    } catch (error) {
      console.error("Image text extraction failed:", error);
      throw new Error("Failed to extract text from image");
    }
  }

  /**
   * Extract text from PDF using Gemini
   * @param pdfUrl - URL of the PDF
   * @returns Extracted text
   */
  async extractTextFromPDF(pdfUrl: string): Promise<string> {
    try {
      // Fetch PDF and convert to base64
      const response = await fetch(pdfUrl);
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const base64PDF = buffer.toString("base64");

      const prompt = `Extract all text from this PDF document. This is a UPSC examination answer copy.

Instructions:
1. Extract ALL text exactly as written, preserving formatting and structure
2. Maintain question numbers and answer structure
3. Include all text content from all pages
4. Preserve paragraph breaks and sections
5. If there are multiple questions, separate them clearly

Return ONLY the extracted text, no additional commentary.`;

      const result = await this.genAI.models.generateContent({
        model: "gemini-2.0-flash-exp",
        contents: [
          {
            role: "user",
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType: "application/pdf",
                  data: base64PDF,
                },
              },
            ],
          },
        ],
      });

      const extractedText = result.text || "";
      return extractedText.trim();
    } catch (error) {
      console.error("PDF text extraction failed:", error);
      throw new Error("Failed to extract text from PDF");
    }
  }

  /**
   * Validate file type and size
   * @param file - File to validate
   * @param maxSizeMB - Maximum file size in MB (default: 10MB)
   * @returns Validation result
   */
  validateFile(
    file: File,
    maxSizeMB: number = 10
  ): { valid: boolean; error?: string } {
    // Check file type
    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: "Invalid file type. Please upload PDF, JPEG, PNG, or WebP files.",
      };
    }

    // Check file size
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return {
        valid: false,
        error: `File size exceeds ${maxSizeMB}MB limit.`,
      };
    }

    return { valid: true };
  }
}

// Export singleton instance
export const fileProcessingService = new FileProcessingService();
