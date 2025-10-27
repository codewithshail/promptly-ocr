import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { geminiService } from "@/lib/services/gemini.service";

/**
 * POST /api/flashcards/generate
 * Generate flashcards from a news article using AI
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { articleTitle, articleContent } = body;

    if (!articleTitle || !articleContent) {
      return NextResponse.json(
        { error: "Article title and content are required" },
        { status: 400 }
      );
    }

    // Generate flashcards using Gemini
    const prompt = `You are an expert at creating educational flashcards for UPSC exam preparation.

Given the following news article, create 3-5 flashcards that test important facts, concepts, and details relevant to UPSC preparation.

Article Title: ${articleTitle}

Article Content:
${articleContent}

Requirements for each flashcard:
1. Question should be clear and specific
2. Answer should be concise but complete (2-4 sentences)
3. Focus on UPSC-relevant information: facts, policies, dates, key figures, implications
4. Avoid yes/no questions
5. Test understanding, not just recall

Return the response in the following JSON format:
{
  "flashcards": [
    {
      "question": "Question text here?",
      "answer": "Answer text here."
    }
  ]
}

Generate 3-5 flashcards. Return ONLY valid JSON, no markdown code blocks.`;

    const response = await geminiService.chat(prompt, {
      enableWebSearch: false,
    });

    // Extract JSON from response
    let jsonText = response.trim();
    jsonText = jsonText.replace(/```json\s*/g, "").replace(/```\s*/g, "");

    const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Failed to extract JSON from flashcard generation response");
    }

    const parsed = JSON.parse(jsonMatch[0]);

    if (!parsed.flashcards || !Array.isArray(parsed.flashcards)) {
      throw new Error("Invalid flashcard format: missing flashcards array");
    }

    // Validate each flashcard
    parsed.flashcards.forEach((fc: any, index: number) => {
      if (!fc.question || !fc.answer) {
        throw new Error(`Invalid flashcard format at index ${index}`);
      }
    });

    return NextResponse.json({
      flashcards: parsed.flashcards,
      count: parsed.flashcards.length,
    });
  } catch (error) {
    console.error("Error generating flashcards:", error);
    return NextResponse.json(
      { error: "Failed to generate flashcards" },
      { status: 500 }
    );
  }
}
