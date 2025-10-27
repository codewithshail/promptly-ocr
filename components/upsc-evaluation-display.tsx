"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  Award, 
  TrendingUp, 
  CheckCircle2, 
  XCircle, 
  BookOpen,
  Lightbulb,
  Target,
  BarChart3
} from "lucide-react";
import ReactMarkdown from "react-markdown";

interface StructureAnalysis {
  introduction: { present: boolean; wordCount: number; feedback: string };
  body: { present: boolean; wordCount: number; feedback: string };
  conclusion: { present: boolean; wordCount: number; feedback: string };
}

interface EvaluationScore {
  questionNumber: number;
  question: string;
  score: number;
  maxScore: number;
  feedback: string;
  strengths: string[];
  weaknesses: string[];
  structureAnalysis: StructureAnalysis;
}

interface EvaluationResult {
  totalScore: number;
  maxTotalScore: number;
  percentage: number;
  scores: EvaluationScore[];
  overallFeedback: string;
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

interface UPSCEvaluationDisplayProps {
  questionsAnswers: QuestionAnswer[];
  evaluationResult: EvaluationResult;
  aiRecommendations: string;
}

function ScoreCard({ score, maxScore, percentage }: { score: number; maxScore: number; percentage: number }) {
  const getScoreColor = (pct: number) => {
    if (pct >= 80) return "text-green-600 dark:text-green-400";
    if (pct >= 60) return "text-blue-600 dark:text-blue-400";
    if (pct >= 40) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const getScoreGrade = (pct: number) => {
    if (pct >= 90) return "Outstanding";
    if (pct >= 80) return "Excellent";
    if (pct >= 70) return "Very Good";
    if (pct >= 60) return "Good";
    if (pct >= 50) return "Average";
    return "Needs Improvement";
  };

  return (
    <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Award className="w-5 h-5" />
          Overall Score
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div>
            <div className={`text-4xl font-bold ${getScoreColor(percentage)}`}>
              {score}/{maxScore}
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              {percentage.toFixed(1)}% - {getScoreGrade(percentage)}
            </div>
          </div>
          <div className="text-right">
            <Badge variant="outline" className="text-lg px-3 py-1">
              {getScoreGrade(percentage)}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function QuestionEvaluation({ evaluation }: { evaluation: EvaluationScore }) {
  const percentage = (evaluation.score / evaluation.maxScore) * 100;
  
  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <CardTitle className="text-lg mb-2">
              Question {evaluation.questionNumber}
            </CardTitle>
            <CardDescription className="text-sm">
              {evaluation.question}
            </CardDescription>
          </div>
          <Badge 
            variant={percentage >= 70 ? "default" : "secondary"}
            className="text-lg px-3 py-1 flex-shrink-0"
          >
            {evaluation.score}/{evaluation.maxScore}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Structure Analysis */}
        <div>
          <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Structure Analysis
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-2">
              {evaluation.structureAnalysis.introduction.present ? (
                <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              )}
              <div>
                <span className="font-medium">Introduction ({evaluation.structureAnalysis.introduction.wordCount} words):</span>
                <span className="text-muted-foreground ml-1">
                  {evaluation.structureAnalysis.introduction.feedback}
                </span>
              </div>
            </div>
            <div className="flex items-start gap-2">
              {evaluation.structureAnalysis.body.present ? (
                <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              )}
              <div>
                <span className="font-medium">Body ({evaluation.structureAnalysis.body.wordCount} words):</span>
                <span className="text-muted-foreground ml-1">
                  {evaluation.structureAnalysis.body.feedback}
                </span>
              </div>
            </div>
            <div className="flex items-start gap-2">
              {evaluation.structureAnalysis.conclusion.present ? (
                <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              )}
              <div>
                <span className="font-medium">Conclusion ({evaluation.structureAnalysis.conclusion.wordCount} words):</span>
                <span className="text-muted-foreground ml-1">
                  {evaluation.structureAnalysis.conclusion.feedback}
                </span>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Strengths */}
        {evaluation.strengths.length > 0 && (
          <div>
            <h4 className="font-semibold text-sm mb-2 flex items-center gap-2 text-green-600 dark:text-green-400">
              <CheckCircle2 className="w-4 h-4" />
              Strengths
            </h4>
            <ul className="space-y-1 text-sm">
              {evaluation.strengths.map((strength, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-green-600 dark:text-green-400 mt-1">•</span>
                  <span>{strength.replace(/\*\*/g, '').replace(/\*/g, '')}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Weaknesses */}
        {evaluation.weaknesses.length > 0 && (
          <div>
            <h4 className="font-semibold text-sm mb-2 flex items-center gap-2 text-red-600 dark:text-red-400">
              <XCircle className="w-4 h-4" />
              Areas for Improvement
            </h4>
            <ul className="space-y-1 text-sm">
              {evaluation.weaknesses.map((weakness, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-red-600 dark:text-red-400 mt-1">•</span>
                  <span>{weakness.replace(/\*\*/g, '').replace(/\*/g, '')}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <Separator />

        {/* Detailed Feedback */}
        <div>
          <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            Detailed Feedback
          </h4>
          <p className="text-sm text-muted-foreground">{evaluation.feedback}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export function UPSCEvaluationDisplay({
  questionsAnswers,
  evaluationResult,
  aiRecommendations,
}: UPSCEvaluationDisplayProps) {
  return (
    <div className="space-y-6">
      {/* Overall Score Card */}
      <ScoreCard
        score={evaluationResult.totalScore}
        maxScore={evaluationResult.maxTotalScore}
        percentage={evaluationResult.percentage}
      />

      {/* Overall Feedback */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Overall Assessment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{evaluationResult.overallFeedback}</p>
        </CardContent>
      </Card>

      {/* Individual Question Evaluations */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Question-wise Evaluation
        </h2>
        {evaluationResult.scores.map((score) => (
          <QuestionEvaluation key={score.questionNumber} evaluation={score} />
        ))}
      </div>

      {/* AI Recommendations */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            AI-Powered Improvement Recommendations
          </CardTitle>
          <CardDescription>
            Personalized suggestions to enhance your UPSC essay writing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px] w-full rounded-md border bg-white dark:bg-gray-950 p-4">
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <ReactMarkdown>{aiRecommendations}</ReactMarkdown>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Questions and Answers Reference with Structure */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Your Answers - Structured View
          </CardTitle>
          <CardDescription>
            View your answers broken down by UPSC structure (Introduction, Body, Conclusion)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px] w-full rounded-md border p-4">
            <div className="space-y-8">
              {questionsAnswers.map((qa) => (
                <div key={qa.questionNumber} className="space-y-4">
                  <h4 className="font-bold text-base">
                    Question {qa.questionNumber}: {qa.question}
                  </h4>
                  
                  {/* Word Count Summary */}
                  <div className="bg-muted/50 rounded-lg p-3 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-semibold">Total Words:</span>
                      <Badge variant="outline" className="text-base">
                        {qa.wordCounts.total} words
                      </Badge>
                    </div>
                  </div>

                  {/* Introduction */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                        <h5 className="font-semibold text-sm text-blue-600 dark:text-blue-400">
                          Introduction (15% target)
                        </h5>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {qa.wordCounts.introduction} words
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground pl-4 border-l-2 border-blue-500">
                      {qa.answerParts.introduction}
                    </div>
                  </div>

                  {/* Body */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        <h5 className="font-semibold text-sm text-green-600 dark:text-green-400">
                          Body (70% target)
                        </h5>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {qa.wordCounts.body.reduce((sum, count) => sum + count, 0)} words
                      </Badge>
                    </div>
                    <div className="space-y-3 pl-4 border-l-2 border-green-500">
                      {qa.answerParts.body.map((bodyPart, idx) => (
                        <div key={idx} className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-foreground text-sm">Point {idx + 1}:</span>
                            <Badge variant="outline" className="text-xs">
                              {qa.wordCounts.body[idx]} words
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {bodyPart}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Conclusion */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-purple-500" />
                        <h5 className="font-semibold text-sm text-purple-600 dark:text-purple-400">
                          Conclusion (15% target)
                        </h5>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {qa.wordCounts.conclusion} words
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground pl-4 border-l-2 border-purple-500">
                      {qa.answerParts.conclusion}
                    </div>
                  </div>

                  {qa.questionNumber < questionsAnswers.length && (
                    <Separator className="mt-6" />
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
