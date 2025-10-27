"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import { TrendingUp, TrendingDown, Minus, Award, Target } from "lucide-react";
import { format } from "date-fns";
import { useState, useMemo } from "react";

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

interface CopyEvaluation {
  id: string;
  fileName: string;
  copyType: "gs" | "essay";
  evaluationResult: EvaluationResult | null;
  createdAt: string;
}

interface ProgressChartsProps {
  evaluations: CopyEvaluation[];
}

export function ProgressCharts({ evaluations }: ProgressChartsProps) {
  const [selectedCopyType, setSelectedCopyType] = useState<string>("all");
  const [comparisonEval1, setComparisonEval1] = useState<string>("");
  const [comparisonEval2, setComparisonEval2] = useState<string>("");

  // Filter evaluations based on selected copy type
  const filteredEvaluations = useMemo(() => {
    const completed = evaluations.filter((e) => e.evaluationResult !== null);
    if (selectedCopyType === "all") return completed;
    return completed.filter((e) => e.copyType === selectedCopyType);
  }, [evaluations, selectedCopyType]);

  // Prepare score trend data
  const scoreTrendData = useMemo(() => {
    return filteredEvaluations.map((evaluation) => {
      const result = evaluation.evaluationResult!;
      const percentage = (result.totalScore / result.maxScore) * 100;
      return {
        date: format(new Date(evaluation.createdAt), "MMM dd"),
        score: parseFloat(percentage.toFixed(1)),
        fileName: evaluation.fileName,
        copyType: evaluation.copyType === "gs" ? "GS" : "Essay",
      };
    });
  }, [filteredEvaluations]);

  // Calculate average scores by copy type
  const averageScoresByType = useMemo(() => {
    const gsEvals = evaluations.filter((e) => e.copyType === "gs" && e.evaluationResult);
    const essayEvals = evaluations.filter((e) => e.copyType === "essay" && e.evaluationResult);

    const gsAvg = gsEvals.length > 0
      ? gsEvals.reduce((sum, e) => {
          const result = e.evaluationResult!;
          return sum + (result.totalScore / result.maxScore) * 100;
        }, 0) / gsEvals.length
      : 0;

    const essayAvg = essayEvals.length > 0
      ? essayEvals.reduce((sum, e) => {
          const result = e.evaluationResult!;
          return sum + (result.totalScore / result.maxScore) * 100;
        }, 0) / essayEvals.length
      : 0;

    return [
      { type: "General Studies", average: parseFloat(gsAvg.toFixed(1)), count: gsEvals.length },
      { type: "Essay", average: parseFloat(essayAvg.toFixed(1)), count: essayEvals.length },
    ];
  }, [evaluations]);

  // Calculate subject-wise performance (based on criteria)
  const subjectWisePerformance = useMemo(() => {
    if (filteredEvaluations.length === 0) return [];

    const criteriaScores: Record<string, { total: number; count: number }> = {};

    filteredEvaluations.forEach((evaluation) => {
      const result = evaluation.evaluationResult!;
      result.breakdown.forEach((item) => {
        if (!criteriaScores[item.criterion]) {
          criteriaScores[item.criterion] = { total: 0, count: 0 };
        }
        const percentage = (item.score / item.maxScore) * 100;
        criteriaScores[item.criterion].total += percentage;
        criteriaScores[item.criterion].count += 1;
      });
    });

    return Object.entries(criteriaScores).map(([criterion, data]) => ({
      criterion,
      average: parseFloat((data.total / data.count).toFixed(1)),
      fullMark: 100,
    }));
  }, [filteredEvaluations]);

  // Calculate trend
  const calculateTrend = () => {
    if (scoreTrendData.length < 2) return { direction: "stable", value: 0 };

    const recentScores = scoreTrendData.slice(-3);
    const olderScores = scoreTrendData.slice(0, -3);

    if (olderScores.length === 0) return { direction: "stable", value: 0 };

    const recentAvg = recentScores.reduce((sum, d) => sum + d.score, 0) / recentScores.length;
    const olderAvg = olderScores.reduce((sum, d) => sum + d.score, 0) / olderScores.length;

    const diff = recentAvg - olderAvg;

    if (Math.abs(diff) < 2) return { direction: "stable", value: 0 };
    if (diff > 0) return { direction: "up", value: diff };
    return { direction: "down", value: Math.abs(diff) };
  };

  const trend = calculateTrend();

  // Get comparison data
  const comparisonData = useMemo(() => {
    if (!comparisonEval1 || !comparisonEval2) return null;

    const eval1 = evaluations.find((e) => e.id === comparisonEval1);
    const eval2 = evaluations.find((e) => e.id === comparisonEval2);

    if (!eval1?.evaluationResult || !eval2?.evaluationResult) return null;

    const criteria = new Set([
      ...eval1.evaluationResult.breakdown.map((b) => b.criterion),
      ...eval2.evaluationResult.breakdown.map((b) => b.criterion),
    ]);

    return Array.from(criteria).map((criterion) => {
      const item1 = eval1.evaluationResult!.breakdown.find((b) => b.criterion === criterion);
      const item2 = eval2.evaluationResult!.breakdown.find((b) => b.criterion === criterion);

      return {
        criterion,
        eval1: item1 ? parseFloat(((item1.score / item1.maxScore) * 100).toFixed(1)) : 0,
        eval2: item2 ? parseFloat(((item2.score / item2.maxScore) * 100).toFixed(1)) : 0,
      };
    });
  }, [comparisonEval1, comparisonEval2, evaluations]);

  if (evaluations.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Award className="w-16 h-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No data available</h3>
          <p className="text-sm text-muted-foreground text-center max-w-md">
            Complete some evaluations to see your progress charts and analytics
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Evaluations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{evaluations.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {evaluations.filter((e) => e.copyType === "gs").length} GS •{" "}
              {evaluations.filter((e) => e.copyType === "essay").length} Essay
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {filteredEvaluations.length > 0
                ? (
                    filteredEvaluations.reduce((sum, e) => {
                      const result = e.evaluationResult!;
                      return sum + (result.totalScore / result.maxScore) * 100;
                    }, 0) / filteredEvaluations.length
                  ).toFixed(1)
                : "0"}
              %
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Across {filteredEvaluations.length} evaluations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Performance Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {trend.direction === "up" && (
                <>
                  <TrendingUp className="w-6 h-6 text-green-600" />
                  <span className="text-3xl font-bold text-green-600">+{trend.value.toFixed(1)}%</span>
                </>
              )}
              {trend.direction === "down" && (
                <>
                  <TrendingDown className="w-6 h-6 text-red-600" />
                  <span className="text-3xl font-bold text-red-600">-{trend.value.toFixed(1)}%</span>
                </>
              )}
              {trend.direction === "stable" && (
                <>
                  <Minus className="w-6 h-6 text-gray-600" />
                  <span className="text-3xl font-bold text-gray-600">Stable</span>
                </>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Recent performance</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="trend" className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="trend">Score Trend</TabsTrigger>
            <TabsTrigger value="subject">Subject-wise</TabsTrigger>
            <TabsTrigger value="comparison">Comparison</TabsTrigger>
          </TabsList>

          <Select value={selectedCopyType} onValueChange={setSelectedCopyType}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="gs">General Studies</SelectItem>
              <SelectItem value="essay">Essay</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Score Trend Chart */}
        <TabsContent value="trend" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Score Trend Over Time</CardTitle>
              <CardDescription>
                Track your performance improvement across evaluations
              </CardDescription>
            </CardHeader>
            <CardContent>
              {scoreTrendData.length > 0 ? (
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={scoreTrendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-white p-3 border rounded-lg shadow-lg">
                              <p className="font-semibold">{data.fileName}</p>
                              <p className="text-sm text-muted-foreground">{data.date}</p>
                              <p className="text-sm">
                                <span className="font-medium">Score:</span> {data.score}%
                              </p>
                              <Badge variant="outline" className="mt-1">
                                {data.copyType}
                              </Badge>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                      name="Score (%)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[350px] text-muted-foreground">
                  No data available for selected filter
                </div>
              )}
            </CardContent>
          </Card>

          {/* Average by Type */}
          <Card>
            <CardHeader>
              <CardTitle>Average Score by Copy Type</CardTitle>
              <CardDescription>Compare your performance across different copy types</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={averageScoresByType}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="type" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white p-3 border rounded-lg shadow-lg">
                            <p className="font-semibold">{data.type}</p>
                            <p className="text-sm">
                              <span className="font-medium">Average:</span> {data.average}%
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Based on {data.count} evaluations
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend />
                  <Bar dataKey="average" fill="#3b82f6" name="Average Score (%)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Subject-wise Performance */}
        <TabsContent value="subject">
          <Card>
            <CardHeader>
              <CardTitle>Subject-wise Performance</CardTitle>
              <CardDescription>
                Analyze your strengths and weaknesses across different criteria
              </CardDescription>
            </CardHeader>
            <CardContent>
              {subjectWisePerformance.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <RadarChart data={subjectWisePerformance}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="criterion" />
                    <PolarRadiusAxis domain={[0, 100]} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-white p-3 border rounded-lg shadow-lg">
                              <p className="font-semibold">{data.criterion}</p>
                              <p className="text-sm">
                                <span className="font-medium">Average:</span> {data.average}%
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Radar
                      name="Average Score"
                      dataKey="average"
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      fillOpacity={0.6}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[400px] text-muted-foreground">
                  No data available for selected filter
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Comparison */}
        <TabsContent value="comparison" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Compare Two Evaluations</CardTitle>
              <CardDescription>
                Select two evaluations to compare their performance across criteria
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">First Evaluation</label>
                  <Select value={comparisonEval1} onValueChange={setComparisonEval1}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select evaluation" />
                    </SelectTrigger>
                    <SelectContent>
                      {evaluations
                        .filter((e) => e.evaluationResult)
                        .map((evaluation) => (
                          <SelectItem key={evaluation.id} value={evaluation.id}>
                            {evaluation.fileName} ({format(new Date(evaluation.createdAt), "MMM dd")})
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Second Evaluation</label>
                  <Select value={comparisonEval2} onValueChange={setComparisonEval2}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select evaluation" />
                    </SelectTrigger>
                    <SelectContent>
                      {evaluations
                        .filter((e) => e.evaluationResult && e.id !== comparisonEval1)
                        .map((evaluation) => (
                          <SelectItem key={evaluation.id} value={evaluation.id}>
                            {evaluation.fileName} ({format(new Date(evaluation.createdAt), "MMM dd")})
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {comparisonData ? (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={comparisonData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="criterion" angle={-45} textAnchor="end" height={100} />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="eval1" fill="#3b82f6" name="First Evaluation" />
                    <Bar dataKey="eval2" fill="#10b981" name="Second Evaluation" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground">
                  <Target className="w-16 h-16 mb-4" />
                  <p>Select two evaluations to compare</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
