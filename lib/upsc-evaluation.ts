import { GoogleGenAI } from "@google/genai";

const genAI = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
});

/**
 * Count words in a text string
 */
function countWords(text: string): number {
  if (!text || text.trim().length === 0) return 0;
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}

interface QuestionAnswer {
  questionNumber: number;
  question: string;
  answer: string;
  answerParts: {
    introduction: string;
    body: string[];
    conclusion: string;
  };
  wordCounts: {
    introduction: number;
    body: number[];
    conclusion: number;
    total: number;
  };
}

interface EvaluationScore {
  questionNumber: number;
  question: string;
  score: number;
  maxScore: number;
  feedback: string;
  strengths: string[];
  weaknesses: string[];
  structureAnalysis: {
    introduction: { present: boolean; wordCount: number; feedback: string };
    body: { present: boolean; wordCount: number; feedback: string };
    conclusion: { present: boolean; wordCount: number; feedback: string };
  };
}

interface EvaluationResult {
  totalScore: number;
  maxTotalScore: number;
  percentage: number;
  scores: EvaluationScore[];
  overallFeedback: string;
}

const UPSC_EVALUATION_PROMPT = `You are an expert UPSC (Union Public Service Commission) essay evaluator with deep knowledge of Indian government, constitutional law, current affairs, and administrative services examination patterns.

CRITICAL: This evaluation is EXCLUSIVELY for UPSC Indian government examination essays. Do NOT evaluate any other type of content.

## TASK 1: ANSWER STRUCTURE FORMULA

### Introduction Formula (40 words):
- Sentence 1: Define the key term/concept directly
- Sentence 2: Provide current context or significance

### Body Formula (170 words):
- Point 1: Constitutional/Legal/Historical foundation (40 words)
- Point 2: Current status/Government initiatives (50 words)
- Point 3: Challenges/Issues (40 words)
- Point 4: Examples and evidence (40 words)

### Conclusion Formula (40 words):
- Sentence 1: Synthesize the key arguments
- Sentence 2: Provide actionable way forward

**Word Distribution**: Introduction (15%) + Body (70%) + Conclusion (15%) = 250 words

## TASK 2: ANALYSIS OF HIGH-SCORING ANSWERS

Common Patterns in 9/10 Answers:
1. Start with definition, never with history
2. Use "However" or "While" for balanced view
3. Include 2-3 examples, not more
4. Mention at least one government scheme
5. End with practical, not idealistic solutions
6. Use simple language, avoid jargon
7. Never exceed word limit
8. Include multiple stakeholder perspectives
9. Link to Constitutional values
10. Recent examples score higher than historical ones

## TASK 3: QUESTION-TYPE TEMPLATES

### "Discuss" Questions:
- Set context → Present multiple viewpoints → Government stance → Stakeholder perspectives → Balanced conclusion
- 30% facts, 70% perspectives

### "Analyze" Questions:
- Break into components → Examine each part → Show interconnections → Cause-effect → Synthesis
- 40% breakdown, 60% deep examination

### "Critically Examine" Questions:
- State the proposition → Arguments FOR (40%) → Arguments AGAINST (40%) → Your assessment (20%)
- Must show both sides equally

### "Explain/What" Questions:
- Definition → Features → Current status → Significance → Examples
- 70% facts, 30% analysis

### "Compare" Questions:
- Basis of comparison → Similarities (40%) → Differences (40%) → Which is better and why (20%)
- Use table format if helpful

## TASK 4: AI ANSWER SCORING GUIDE

**Score 9-10**: All elements present, recent examples, perfect structure, within word limit
**Score 7-8**: Good structure, relevant examples, minor gaps in content
**Score 5-6**: Basic structure present, generic examples, some irrelevant content
**Score 3-4**: Poor structure, missing key elements, off-topic portions
**Score 1-2**: Completely misses the question, no structure

## COMMON ISSUES TO CHECK:
- Missing current affairs
- No government scheme mentioned
- Exceeding word limit
- No Constitutional reference where needed
- Unbalanced perspective

## WEB SEARCH VERIFICATION:
Use web search to verify and validate:
- Current government schemes and initiatives (PM-KISAN, Ayushman Bharat, etc.)
- Recent policy changes and amendments
- Latest statistics and data from government sources
- Constitutional provisions and articles
- Recent Supreme Court judgments
- Current affairs relevance (last 6-12 months)
- Ministry initiatives and programs

Be strict but fair. UPSC expects excellence. Focus ONLY on UPSC Indian government examination context.`;

/**
 * Classify essay content into questions and answers using Gemini 2.0-flash-thinking
 */
export async function classifyEssayContent(
  ocrText: string
): Promise<QuestionAnswer[]> {
  try {
    const prompt = `${UPSC_EVALUATION_PROMPT}

## TASK: CLASSIFY UPSC ESSAY QUESTIONS AND ANSWERS

CRITICAL: This is EXCLUSIVELY for UPSC Indian government examination essays. Analyze ONLY UPSC-related content.

Analyze the following UPSC mock essay text and extract all questions with their corresponding answers.

**Instructions**:
1. **Identify Question Type**: First, determine if each question is Discuss/Analyze/Critically Examine/Explain/Compare
2. **Extract Question and Answer**: Identify each question number, complete question text, and full answer
3. **Divide Answer Structure**: Split each answer into THREE parts based on UPSC answer structure:
   - **Introduction** (First 15% of answer, ~40 words): Definition and current context
   - **Body** (Middle 70% of answer, ~170 words): Split into 4 logical points:
     * Point 1: Constitutional/Legal/Historical foundation
     * Point 2: Current status/Government initiatives  
     * Point 3: Challenges/Issues
     * Point 4: Examples and evidence
   - **Conclusion** (Last 15% of answer, ~40 words): Synthesis and actionable way forward
4. **Smart Parsing**: Look for natural paragraph breaks, topic shifts, and structural markers to identify sections
5. **Handle Variations**: If the answer doesn't follow perfect structure, do your best to categorize content appropriately

**Expected JSON Format**:
\`\`\`json
{
  "questionsAnswers": [
    {
      "questionNumber": 1,
      "question": "Full question text here (e.g., 'Discuss the role of technology in modern governance')",
      "answer": "Complete answer text as written by student",
      "answerParts": {
        "introduction": "Introduction paragraph - should define key terms and provide current context (first 15% of answer)",
        "body": [
          "Body point 1: Constitutional/Legal/Historical foundation - relevant articles, laws, historical background",
          "Body point 2: Current status/Government initiatives - recent schemes like Digital India, e-Governance, specific ministry programs",
          "Body point 3: Challenges/Issues - implementation gaps, digital divide, privacy concerns, infrastructure issues",
          "Body point 4: Examples and evidence - specific case studies, statistics, success stories, recent developments"
        ],
        "conclusion": "Conclusion paragraph - synthesis of arguments and actionable way forward (last 15% of answer)"
      },
      "wordCounts": {
        "introduction": 0,
        "body": [0, 0, 0, 0],
        "conclusion": 0,
        "total": 0
      }
    }
  ]
}
\`\`\`

**OCR Text**:
${ocrText}

IMPORTANT: 
- Focus ONLY on UPSC Indian government examination content
- Classify based on the UPSC answer structure formula (15% intro, 70% body, 15% conclusion)
- Identify introduction, body (4 distinct points), and conclusion clearly
- If answer structure is unclear, make intelligent guesses based on content flow
- Look for keywords: "Introduction" often has definitions; "Conclusion" often has "Thus/Therefore/Hence"
- Body points should be logically distinct - look for paragraph breaks or topic shifts
- Return ONLY valid JSON, no markdown code blocks, no additional text
- Ensure the JSON is properly formatted and parseable

Return the JSON object:`;

    const result = await genAI.models.generateContentStream({
      model: "gemini-2.0-flash-thinking-exp",
      contents: prompt,
      config: {
        thinkingConfig: {
          thinkingBudget: -1,
        },
      },
    });

    let responseText = "";
    for await (const chunk of result) {
      if (chunk.text) {
        responseText += chunk.text;
      }
    }

    // Extract JSON from response - handle markdown code blocks
    let jsonText = responseText.trim();
    
    // Remove markdown code blocks if present
    jsonText = jsonText.replace(/```json\s*/g, '').replace(/```\s*/g, '');
    
    // Find JSON object
    const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Failed to extract JSON from classification response");
    }

    const parsed = JSON.parse(jsonMatch[0]);
    const questionsAnswers: QuestionAnswer[] = parsed.questionsAnswers || [];
    
    // Calculate word counts for each answer
    const questionsWithCounts = questionsAnswers.map(qa => {
      const introWordCount = countWords(qa.answerParts.introduction);
      const bodyWordCounts = qa.answerParts.body.map(bodyPart => countWords(bodyPart));
      const conclusionWordCount = countWords(qa.answerParts.conclusion);
      const totalWordCount = introWordCount + bodyWordCounts.reduce((sum, count) => sum + count, 0) + conclusionWordCount;
      
      return {
        ...qa,
        wordCounts: {
          introduction: introWordCount,
          body: bodyWordCounts,
          conclusion: conclusionWordCount,
          total: totalWordCount,
        },
      };
    });
    
    return questionsWithCounts;
  } catch (error) {
    console.error("Essay classification failed:", error);
    throw error;
  }
}

/**
 * Evaluate UPSC essay answers and provide marks using Gemini 2.0-flash-thinking with web search
 */
export async function evaluateEssayAnswers(
  questionsAnswers: QuestionAnswer[]
): Promise<EvaluationResult> {
  try {
    const prompt = `${UPSC_EVALUATION_PROMPT}

## TASK: EVALUATE UPSC ESSAY ANSWERS WITH WEB SEARCH

CRITICAL: Evaluate EXCLUSIVELY for UPSC Indian government examination standards. Use web search to verify current information.

**Questions and Answers**:
${JSON.stringify(questionsAnswers, null, 2)}

**Evaluation Instructions**:

### STEP 1: IDENTIFY QUESTION TYPE
For each question, determine the type by looking for keywords:
- **"Discuss"**: Requires multiple viewpoints, balanced perspective (30% facts, 70% perspectives)
- **"Analyze"**: Requires breaking down into components, cause-effect (40% breakdown, 60% examination)
- **"Critically Examine"**: Requires FOR and AGAINST arguments equally (40% FOR, 40% AGAINST, 20% assessment)
- **"Explain/What"**: Requires definition, features, significance (70% facts, 30% analysis)
- **"Compare"**: Requires similarities and differences (40% similarities, 40% differences, 20% conclusion)

### STEP 2: CHECK TEMPLATE ADHERENCE
Verify if the answer follows the appropriate question-type template from TASK 3 above.

### STEP 3: STRUCTURE ANALYSIS (15-70-15 Rule)
- **Introduction** (15% of answer, ~40 words): 
  * Must define key term/concept directly (not start with history)
  * Must provide current context or significance
- **Body** (70% of answer, ~170 words): 
  * Point 1: Constitutional/Legal/Historical foundation (40 words)
  * Point 2: Current status/Government initiatives with specific schemes (50 words)
  * Point 3: Challenges/Issues (40 words)
  * Point 4: Examples and evidence - recent, not historical (40 words)
- **Conclusion** (15% of answer, ~40 words): 
  * Must synthesize key arguments
  * Must provide actionable (not idealistic) way forward

### STEP 4: CONTENT VERIFICATION (USE WEB SEARCH)
- Verify government schemes mentioned (PM-KISAN, Ayushman Bharat, Digital India, etc.)
- Check Constitutional references (Articles, Parts, Schedules, Amendments)
- Validate current affairs relevance (last 6-12 months only)
- Confirm statistics and data accuracy from official sources

### STEP 5: HIGH-SCORING PATTERNS CHECK (10 Critical Points)
1. ✓ Starts with definition (NOT history)
2. ✓ Uses "However"/"While" for balanced view
3. ✓ Has 2-3 examples (NOT more)
4. ✓ Mentions at least ONE government scheme by name
5. ✓ Ends with practical (NOT idealistic) solution
6. ✓ Uses simple language (NO jargon)
7. ✓ Within word limit (250 words ±10%)
8. ✓ Includes multiple stakeholder perspectives
9. ✓ Links to Constitutional values/articles
10. ✓ Recent examples (NOT historical)

### STEP 6: ASSIGN SCORE (out of 100)
- **90-100**: All 10 patterns present, perfect structure, recent examples, within word limit, correct template
- **70-89**: Good structure, 7-9 patterns present, relevant examples, minor content gaps
- **50-69**: Basic structure, 5-6 patterns present, generic examples, some irrelevant content
- **30-49**: Poor structure, 3-4 patterns present, missing key elements, off-topic portions
- **0-29**: Completely misses question, 0-2 patterns present, no proper structure

**Expected JSON Format**:
\`\`\`json
{
  "totalScore": 0,
  "maxTotalScore": 0,
  "percentage": 0,
  "scores": [
    {
      "questionNumber": 1,
      "question": "Question text",
      "score": 80,
      "maxScore": 100,
      "feedback": "Detailed feedback with specific UPSC context",
      "strengths": ["Strength 1 with UPSC relevance (plain text, no markdown)", "Strength 2 (plain text)"],
      "weaknesses": ["Weakness 1 with improvement suggestion (plain text, no markdown)", "Weakness 2 (plain text)"],
      "structureAnalysis": {
        "introduction": {
          "present": true,
          "wordCount": 45,
          "feedback": "Specific feedback on definition and context"
        },
        "body": {
          "present": true,
          "wordCount": 180,
          "feedback": "Feedback on Constitutional foundation, schemes, challenges, examples"
        },
        "conclusion": {
          "present": true,
          "wordCount": 40,
          "feedback": "Feedback on synthesis and actionable way forward"
        }
      }
    }
  ],
  "overallFeedback": "Overall UPSC-specific assessment"
}
\`\`\`

### STEP 7: GENERATE DETAILED FEEDBACK
For each question, provide:
- **Feedback**: 2-3 sentences explaining the score, mentioning question type adherence, structure quality, and content accuracy
- **Strengths**: 2-4 specific positive points (e.g., "Mentioned PM-KISAN scheme with context", "Good Constitutional reference to Article 21")
- **Weaknesses**: 2-4 specific areas for improvement (e.g., "Missing recent examples from 2024", "Introduction starts with history instead of definition")
- **Structure Analysis**: For each section (intro/body/conclusion), note if present, word count, and specific feedback

IMPORTANT:
- Use web search to verify ALL government schemes, Constitutional references, and current affairs
- Be strict but fair - UPSC expects excellence
- Focus ONLY on UPSC Indian government examination context
- Return ONLY valid JSON, no markdown code blocks, no additional text
- In strengths and weaknesses arrays, use PLAIN TEXT ONLY - NO asterisks, NO bold formatting, NO markdown symbols
- Ensure feedback is specific and actionable, not generic

Return the JSON object:`;

    const result = await genAI.models.generateContentStream({
      model: "gemini-2.0-flash-thinking-exp",
      contents: prompt,
      config: {
        thinkingConfig: {
          thinkingBudget: -1,
        },
        tools: [{ googleSearch: {} }],
      },
    });

    let responseText = "";
    for await (const chunk of result) {
      if (chunk.text) {
        responseText += chunk.text;
      }
    }

    // Extract JSON from response - handle markdown code blocks
    let jsonText = responseText.trim();
    jsonText = jsonText.replace(/```json\s*/g, '').replace(/```\s*/g, '');
    
    const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Failed to extract JSON from evaluation response");
    }

    const evaluation: EvaluationResult = JSON.parse(jsonMatch[0]);
    return evaluation;
  } catch (error) {
    console.error("Essay evaluation failed:", error);
    throw error;
  }
}

/**
 * Generate AI recommendations for improvement using Gemini 2.0-flash-thinking with web search
 */
export async function generateImprovementRecommendations(
  evaluationResult: EvaluationResult,
  questionsAnswers: QuestionAnswer[]
): Promise<string> {
  try {
    const prompt = `${UPSC_EVALUATION_PROMPT}

## TASK: GENERATE UPSC-SPECIFIC IMPROVEMENT RECOMMENDATIONS WITH WEB SEARCH

CRITICAL: Provide recommendations EXCLUSIVELY for UPSC Indian government examination preparation. Use web search for current information.

**Evaluation Results**:
${JSON.stringify(evaluationResult, null, 2)}

**Original Answers**:
${JSON.stringify(questionsAnswers, null, 2)}

**Instructions**:
1. **Analyze Patterns**: Identify recurring strengths and weaknesses across all answers
2. **UPSC-Specific Gaps**: Check for missing Constitutional references, government schemes, current affairs
3. **Web Search**: Find current government initiatives, recent policy changes, latest schemes to recommend
4. **Actionable Steps**: Provide specific, practical recommendations for UPSC preparation
5. **Resources**: Suggest official government websites, portals, and UPSC-relevant materials
6. **Study Strategy**: Recommend how to improve answer structure, content, and presentation

**Format Requirements**:
- Use clean markdown formatting with proper headings (###) and bullet points (-)
- Use **bold** for emphasis where needed (it will be rendered properly)
- Make it readable and well-structured
- Focus on UPSC Indian government examination context ONLY
- The output will be rendered as markdown, so use proper markdown syntax

**Required Sections**:

### Performance Summary
[Brief overview: Total score, percentage, overall performance level]

### Key Strengths to Maintain
[List specific strengths observed in the answers with UPSC context]

### Critical Areas for Improvement
[Specific weaknesses with actionable improvement steps]

### Government Schemes to Study
[Use web search to list current government schemes relevant to the topics covered]

### Constitutional References to Learn
[Specific Articles, Parts, Schedules relevant to the questions]

### Current Affairs Focus Areas
[Recent developments, policies, judgments from last 6-12 months - use web search]

### Writing Strategy Improvements
[Specific tips based on UPSC answer structure formula]

### Question-Type Specific Tips
[Based on the question types encountered: Discuss/Analyze/Critically Examine/Explain/Compare]

### Recommended Study Resources
[Official government websites: pib.gov.in, india.gov.in, ministry websites, etc.]

### Practice Recommendations
[How to practice and improve for UPSC examination]

IMPORTANT:
- Use web search to provide current, accurate information
- Focus ONLY on UPSC Indian government examination context
- Be specific with scheme names, Constitutional articles, ministry initiatives
- Provide practical, actionable advice
- Be encouraging but honest about areas needing improvement

Generate the recommendations:`;

    const result = await genAI.models.generateContentStream({
      model: "gemini-2.0-flash-thinking-exp",
      contents: prompt,
      config: {
        thinkingConfig: {
          thinkingBudget: -1,
        },
        tools: [{ googleSearch: {} }],
      },
    });

    let recommendations = "";
    for await (const chunk of result) {
      if (chunk.text) {
        recommendations += chunk.text;
      }
    }

    return recommendations.trim();
  } catch (error) {
    console.error("Recommendations generation failed:", error);
    throw error;
  }
}
