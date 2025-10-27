"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  Award, 
  CheckCircle2, 
  AlertCircle,
  Lightbulb,
  Download,
  BarChart3
} from "lucide-react";
import { TemplateSuggestions } from "@/components/template-suggestions";

interface ScoreBreakdown {
  criterion: string;
  score: number;
  maxScore: number;
  feedback: string;
}

interface EvaluationResult {
  totalScore: number;
  maxScore: number;
  breakdown: ScoreBreakdown[];
  feedback: string[];
  recommendations: string[];
}

interface EvaluationDisplayProps {
  evaluation: EvaluationResult;
  copyType: "gs" | "essay";
  fileName: string;
  onExport?: () => void;
}

export function EvaluationDisplay({
  evaluation,
  copyType,
  fileName,
  onExport,
}: EvaluationDisplayProps) {
  const percentage = (evaluation.totalScore / evaluation.maxScore) * 100;

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

  const getCriterionPercentage = (score: number, maxScore: number) => {
    return ((score / maxScore) * 100).toFixed(1);
  };

  return (
    <div className="space-y-6">
      {/* Header with File Info */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Evaluation Results</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {fileName} • {copyType === "gs" ? "General Studies" : "Essay"}
          </p>
        </div>
        {onExport && (
          <Button onClick={onExport} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export Results
          </Button>
        )}
      </div>

      {/* Overall Score Card */}
      <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5" />
            Overall Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <div className={`text-5xl font-bold ${getScoreColor(percentage)}`}>
                {evaluation.totalScore}/{evaluation.maxScore}
              </div>
              <div className="text-sm text-muted-foreground mt-2">
                {percentage.toFixed(1)}% • {getScoreGrade(percentage)}
              </div>
            </div>
            <div className="text-right">
              <Badge 
                variant={percentage >= 70 ? "default" : "secondary"}
                className="text-lg px-4 py-2"
              >
                {getScoreGrade(percentage)}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Score Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Score Breakdown
          </CardTitle>
          <CardDescription>
            Detailed evaluation across different criteria
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {evaluation.breakdown.map((item, index) => {
            const itemPercentage = parseFloat(getCriterionPercentage(item.score, item.maxScore));
            return (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm">{item.criterion}</h4>
                    <p className="text-xs text-muted-foreground mt-1">{item.feedback}</p>
                  </div>
                  <div className="text-right ml-4">
                    <div className={`text-lg font-bold ${getScoreColor(itemPercentage)}`}>
                      {item.score}/{item.maxScore}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {itemPercentage}%
                    </div>
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      itemPercentage >= 80
                        ? "bg-green-500"
                        : itemPercentage >= 60
                        ? "bg-blue-500"
                        : itemPercentage >= 40
                        ? "bg-yellow-500"
                        : "bg-red-500"
                    }`}
                    style={{ width: `${itemPercentage}%` }}
                  />
                </div>
                
                {index < evaluation.breakdown.length - 1 && <Separator className="mt-4" />}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Detailed Feedback */}
      {evaluation.feedback && evaluation.feedback.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              Detailed Feedback
            </CardTitle>
            <CardDescription>
              Specific observations about your answer
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {evaluation.feedback.map((item, index) => (
                <li key={index} className="flex items-start gap-3">
                  <AlertCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">{item}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      {evaluation.recommendations && evaluation.recommendations.length > 0 && (
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              Recommendations for Improvement
            </CardTitle>
            <CardDescription>
              Actionable suggestions to enhance your performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {evaluation.recommendations.map((item, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                      {index + 1}
                    </span>
                  </div>
                  <span className="text-sm">{item}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Template Suggestions */}
      <TemplateSuggestions copyType={copyType} />

      {/* Next Steps */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="text-base">What's Next?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
            <span>Topics from this evaluation have been added to your revision schedule</span>
          </p>
          <p className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
            <span>Review the recommendations and work on identified weak areas</span>
          </p>
          <p className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
            <span>Practice more questions to improve your scores</span>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
