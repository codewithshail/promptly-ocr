import { geminiService } from "./gemini.service";
import {
  EVALUATION_PROMPTS,
  formatPrompt,
  EvaluationResult,
} from "@/lib/config/evaluation-prompts";

/**
 * EvaluationService - Service for evaluating GS and Essay copies
 * Uses configurable prompts from evaluation-prompts.ts
 */
export class EvaluationService {
  /**
   * Evaluate General Studies (GS) copy
   * @param extractedText - Text extracted from the copy
   * @returns Evaluation result with scores and feedback
   */
  async evaluateGS(extractedText: string): Promise<EvaluationResult> {
    try {
      if (!extractedText || extractedText.trim().length === 0) {
        throw new Error("Extracted text is empty");
      }

      // Use Gemini service to evaluate with GS prompt
      const evaluation = await geminiService.evaluateCopy(extractedText, "gs");

      return evaluation;
    } catch (error) {
      console.error("GS evaluation failed:", error);
      throw new Error("Failed to evaluate General Studies copy");
    }
  }

  /**
   * Evaluate Essay copy
   * @param extractedText - Text extracted from the copy
   * @returns Evaluation result with scores and feedback
   */
  async evaluateEssay(extractedText: string): Promise<EvaluationResult> {
    try {
      if (!extractedText || extractedText.trim().length === 0) {
        throw new Error("Extracted text is empty");
      }

      // Use Gemini service to evaluate with Essay prompt
      const evaluation = await geminiService.evaluateCopy(
        extractedText,
        "essay"
      );

      return evaluation;
    } catch (error) {
      console.error("Essay evaluation failed:", error);
      throw new Error("Failed to evaluate Essay copy");
    }
  }

  /**
   * Get evaluation prompt for a specific copy type
   * Useful for debugging or displaying prompt to admins
   * @param copyType - Type of copy ('gs' or 'essay')
   * @returns Prompt template
   */
  getEvaluationPrompt(copyType: "gs" | "essay"): string {
    return copyType === "gs" ? EVALUATION_PROMPTS.GS : EVALUATION_PROMPTS.ESSAY;
  }

  /**
   * Format evaluation prompt with extracted text
   * Useful for testing or debugging
   * @param copyType - Type of copy ('gs' or 'essay')
   * @param extractedText - Text to insert into prompt
   * @returns Formatted prompt
   */
  formatEvaluationPrompt(copyType: "gs" | "essay", extractedText: string): string {
    const template = this.getEvaluationPrompt(copyType);
    return formatPrompt(template, { extractedText });
  }

  /**
   * Validate evaluation result structure
   * @param evaluation - Evaluation result to validate
   * @returns Validation result
   */
  validateEvaluationResult(evaluation: EvaluationResult): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (typeof evaluation.totalScore !== "number") {
      errors.push("Missing or invalid totalScore");
    }

    if (typeof evaluation.maxScore !== "number") {
      errors.push("Missing or invalid maxScore");
    }

    if (!Array.isArray(evaluation.breakdown)) {
      errors.push("Missing or invalid breakdown array");
    } else {
      evaluation.breakdown.forEach((item, index) => {
        if (!item.criterion) {
          errors.push(`Breakdown item ${index}: missing criterion`);
        }
        if (typeof item.score !== "number") {
          errors.push(`Breakdown item ${index}: missing or invalid score`);
        }
        if (typeof item.maxScore !== "number") {
          errors.push(`Breakdown item ${index}: missing or invalid maxScore`);
        }
        if (!item.feedback) {
          errors.push(`Breakdown item ${index}: missing feedback`);
        }
      });
    }

    if (!Array.isArray(evaluation.feedback)) {
      errors.push("Missing or invalid feedback array");
    }

    if (!Array.isArray(evaluation.recommendations)) {
      errors.push("Missing or invalid recommendations array");
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

// Export singleton instance
export const evaluationService = new EvaluationService();
