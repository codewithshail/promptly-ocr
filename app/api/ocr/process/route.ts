import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { Mistral } from "@mistralai/mistralai";
import { GoogleGenAI } from "@google/genai";
import { getPrescriptionById, updatePrescription } from "@/db/queries";

// Initialize Mistral client
const mistral = new Mistral({
  apiKey: process.env.MISTRAL_API_KEY,
});

// Initialize Google Gemini client
const genAI = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
});

// Helper function to determine if file is an image or document
function getFileType(fileUrl: string): "image_url" | "document_url" {
  const imageExtensions = [".png", ".jpg", ".jpeg", ".avif", ".gif", ".webp"];
  const lowerUrl = fileUrl.toLowerCase();

  const isImage = imageExtensions.some((ext) => lowerUrl.includes(ext));
  return isImage ? "image_url" : "document_url";
}

// Helper function to process OCR with retry logic
async function processOCRWithRetry(
  fileUrl: string,
  maxRetries = 3
): Promise<string> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Call Mistral OCR API using the dedicated /v1/ocr endpoint
      const fileType = getFileType(fileUrl);

      // FIXED: document should be an object, not an array
      // Using snake_case for property names as per REST API specification
      // Note: The OCR API does not accept a 'prompt' parameter
      const requestBody = {
        model: "mistral-ocr-latest",
        document:
          fileType === "image_url"
            ? { type: "image_url", image_url: fileUrl }
            : { type: "document_url", document_url: fileUrl },
      };

      const response = await fetch("https://api.mistral.ai/v1/ocr", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.MISTRAL_API_KEY}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OCR API error: ${response.status} - ${errorText}`);
      }

      const ocrResult = await response.json();

      // Extract text from OCR response
      // The API returns { pages: [{ markdown: "...", ... }] }
      let extractedText = "";

      if (ocrResult.pages && Array.isArray(ocrResult.pages)) {
        // Concatenate markdown from all pages
        extractedText = ocrResult.pages
          .map((page: any) => page.markdown || "")
          .join("\n\n")
          .trim();
      }

      if (!extractedText) {
        console.error(
          "OCR response structure:",
          JSON.stringify(ocrResult, null, 2)
        );
        throw new Error("No text extracted from OCR response");
      }

      return extractedText;
    } catch (error) {
      lastError = error as Error;
      console.error(`OCR attempt ${attempt} failed:`, error);

      // If this isn't the last attempt, wait before retrying
      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
      }
    }
  }

  throw lastError || new Error("OCR processing failed after all retries");
}

// Helper function to enhance OCR text using Gemini AI
async function enhanceTextWithAI(ocrText: string): Promise<string> {
  try {
    const prompt = `You are a medical prescription expert. Your task is to correct OCR errors in the following prescription text.

Focus on:
- Correcting common OCR mistakes (l vs 1, O vs 0, S vs 5, etc.)
- Fixing handwriting misinterpretations
- Improving medical terminology and drug name accuracy
- Preserving original structure and formatting
- Maintaining dosage accuracy

Return ONLY the corrected text in markdown format, preserving the original structure.

OCR Text:
${ocrText}`;

    const result = await genAI.models.generateContentStream({
      model: "gemini-2.0-flash-thinking-exp-01-21",
      contents: prompt,
      config: {
        thinkingConfig: {
          thinkingBudget: -1, // Unlimited thinking
        },
      },
    });

    let enhancedText = "";

    for await (const chunk of result) {
      const chunkText = chunk.text;
      if (chunkText) {
        enhancedText += chunkText;
      }
    }

    return enhancedText.trim() || ocrText;
  } catch (error) {
    console.error("AI enhancement failed:", error);
    throw error;
  }
}

// Helper function to classify prescription content using Gemini AI
async function classifyContent(
  prescriptionText: string
): Promise<{ relevant: string; irrelevant: string }> {
  try {
    const prompt = `You are a medical prescription classifier. Analyze the following prescription text and separate it into two categories:

**Relevant Information** (medications, dosages, instructions, patient-specific details, warnings):
- Medication names and strengths
- Dosage instructions
- Frequency and duration
- Special instructions or warnings
- Patient-specific information

**Irrelevant Information** (administrative content):
- Clinic headers and letterheads
- Doctor names and credentials
- Clinic addresses and contact information
- Phone numbers and email addresses
- Logos and signatures
- Administrative text

IMPORTANT FORMATTING RULES:
1. ALWAYS use proper markdown formatting with headings (###), bullet points, and bold text
2. Make medication names BOLD and prominent using **Medication Name**
3. Use ### for section headings like "### Medications Prescribed"
4. Use bullet points (-) for lists
5. Highlight dosages and important instructions in bold
6. Structure the content clearly with proper spacing

Format your response EXACTLY as follows:

## Relevant Information

### Medications Prescribed
- **[Medication Name]**: [Strength/Dosage]
  - Dosage: [specific dosage]
  - Frequency: [how often]
  - Duration: [how long]
  - Instructions: [special instructions]

### Important Notes
[Any warnings or special instructions]

## Irrelevant Information
[administrative content in markdown format]

Prescription Text:
${prescriptionText}`;

    const result = await genAI.models.generateContentStream({
      model: "gemini-2.0-flash-exp",
      contents: prompt,
    });

    let classifiedText = "";

    for await (const chunk of result) {
      const chunkText = chunk.text;
      if (chunkText) {
        classifiedText += chunkText;
      }
    }

    // Parse the response to extract relevant and irrelevant sections
    const relevantMatch = classifiedText.match(
      /## Relevant Information\s*([\s\S]*?)(?=## Irrelevant Information|$)/i
    );
    const irrelevantMatch = classifiedText.match(
      /## Irrelevant Information\s*([\s\S]*?)$/i
    );

    const relevant = relevantMatch ? relevantMatch[1].trim() : prescriptionText;
    const irrelevant = irrelevantMatch ? irrelevantMatch[1].trim() : "";

    return { relevant, irrelevant };
  } catch (error) {
    console.error("AI classification failed:", error);
    throw error;
  }
}

// POST - Process OCR for a prescription
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { prescriptionId } = body;

    // Validate required fields
    if (!prescriptionId) {
      return NextResponse.json(
        { error: "Prescription ID is required" },
        { status: 400 }
      );
    }

    // Fetch prescription from database
    const prescription = await getPrescriptionById(prescriptionId);

    if (!prescription) {
      return NextResponse.json(
        { error: "Prescription not found" },
        { status: 404 }
      );
    }

    // Verify ownership
    if (prescription.userId !== userId) {
      return NextResponse.json(
        { error: "Unauthorized access to prescription" },
        { status: 403 }
      );
    }

    // Update status to processing
    await updatePrescription(prescriptionId, {
      status: "processing",
      errorMessage: null,
    });

    try {
      // Step 1: Process OCR with retry logic
      const extractedText = await processOCRWithRetry(prescription.fileUrl);

      // Update prescription with extracted text
      await updatePrescription(prescriptionId, {
        extractedText,
      });

      let finalText = extractedText;
      let enhancedText: string | null = null;

      // Step 2: AI Enhancement (if enabled)
      if (prescription.useAdvancedAI) {
        try {
          // Update status to ai_enhancing
          await updatePrescription(prescriptionId, {
            status: "ai_enhancing",
          });

          enhancedText = await enhanceTextWithAI(extractedText);
          finalText = enhancedText;

          // Update prescription with enhanced text
          await updatePrescription(prescriptionId, {
            enhancedText,
          });
        } catch (aiError) {
          console.error(
            "AI enhancement failed, falling back to OCR text:",
            aiError
          );
          // Fallback to standard OCR text if AI enhancement fails
          finalText = extractedText;
        }
      }

      // Step 3: Content Classification (always run after OCR/enhancement)
      let relevantContent: string | null = null;
      let irrelevantContent: string | null = null;

      try {
        // Update status to classifying
        await updatePrescription(prescriptionId, {
          status: "classifying",
        });

        const classified = await classifyContent(finalText);
        relevantContent = classified.relevant;
        irrelevantContent = classified.irrelevant;

        // Update prescription with classified content
        await updatePrescription(prescriptionId, {
          relevantContent,
          irrelevantContent,
        });
      } catch (classifyError) {
        console.error(
          "Classification failed, using unclassified text:",
          classifyError
        );
        // Fallback: store all text as relevant if classification fails
        relevantContent = finalText;
        irrelevantContent = null;

        await updatePrescription(prescriptionId, {
          relevantContent,
          irrelevantContent,
        });
      }

      // Step 4: Mark as completed
      const updatedPrescription = await updatePrescription(prescriptionId, {
        status: "completed",
        errorMessage: null,
      });

      return NextResponse.json({
        success: true,
        text: extractedText,
        enhancedText,
        relevantContent,
        irrelevantContent,
        prescription: updatedPrescription,
      });
    } catch (ocrError) {
      // Update prescription with failed status and error message
      const errorMessage =
        ocrError instanceof Error ? ocrError.message : "OCR processing failed";

      await updatePrescription(prescriptionId, {
        status: "failed",
        errorMessage,
      });

      return NextResponse.json(
        {
          success: false,
          error: errorMessage,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in OCR processing endpoint:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to process OCR request",
      },
      { status: 500 }
    );
  }
}
