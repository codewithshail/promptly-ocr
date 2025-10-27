import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { geminiService } from "@/lib/services/gemini.service";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { topic, subject } = await req.json();

    if (!topic || !subject) {
      return NextResponse.json(
        { error: "Topic and subject are required" },
        { status: 400 }
      );
    }

    // Generate quiz questions using Gemini
    const prompt = `Generate 5 multiple-choice quiz questions for UPSC preparation on the topic "${topic}" in the subject "${subject}".

For each question, provide:
1. A clear, concise question
2. Four answer options (A, B, C, D)
3. The correct answer (0-3 index)
4. A brief explanation of why the answer is correct

Format your response as a JSON array with this structure:
[
  {
    "question": "Question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": 0,
    "explanation": "Explanation here"
  }
]

Make the questions challenging but fair, covering key concepts, facts, and applications related to the topic.`;

    const response = await geminiService.chat(prompt, {
      enableWebSearch: false,
      enableThinking: false,
    });

    // Parse the JSON response
    let questions;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/) || response.match(/```\n([\s\S]*?)\n```/);
      const jsonString = jsonMatch ? jsonMatch[1] : response;
      questions = JSON.parse(jsonString);
    } catch (parseError) {
      console.error("Failed to parse quiz questions:", parseError);
      // Fallback: try to parse the entire response
      try {
        questions = JSON.parse(response);
      } catch {
        return NextResponse.json(
          { error: "Failed to generate valid quiz questions" },
          { status: 500 }
        );
      }
    }

    // Validate questions format
    if (!Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json(
        { error: "Invalid quiz format" },
        { status: 500 }
      );
    }

    return NextResponse.json({ questions });
  } catch (error) {
    console.error("Error generating quiz:", error);
    return NextResponse.json(
      { error: "Failed to generate quiz" },
      { status: 500 }
    );
  }
}
