"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  FileText, 
  Calendar as CalendarIcon,
  Filter,
  TrendingUp,
  Award,
  Eye,
  X
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { EvaluationDisplay } from "@/components/evaluation-display";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ProgressCharts } from "@/components/progress-charts";

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
  fileUrl: string;
  copyType: "gs" | "essay";
  evaluationResult: EvaluationResult | null;
  status: string;
  createdAt: string;
}

export function HistoryClient() {
  const [evaluations, setEvaluations] = useState<CopyEvaluation[]>([]);
  const [filteredEvaluations, setFilteredEvaluations] = useState<CopyEvaluation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEvaluation, setSelectedEvaluation] = useState<CopyEvaluation | null>(null);
  
  // Filter states
  const [copyTypeFilter, setCopyTypeFilter] = useState<string>("all");
  const [scoreFilter, setScoreFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  });

  useEffect(() => {
    fetchEvaluations();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [evaluations, copyTypeFilter, scoreFilter, dateRange]);

  const fetchEvaluations = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/evaluations/history");
      if (response.ok) {
        const data = await response.json();
        setEvaluations(data.evaluations || []);
      }
    } catch (error) {
      console.error("Failed to fetch evaluations:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...evaluations];

    // Filter by copy type
    if (copyTypeFilter !== "all") {
      filtered = filtered.filter((e) => e.copyType === copyTypeFilter);
    }

    // Filter by score range
    if (scoreFilter !== "all" && filtered.length > 0) {
      filtered = filtered.filter((e) => {
        if (!e.evaluationResult) return false;
        const percentage = (e.evaluationResult.totalScore / e.evaluationResult.maxScore) * 100;
        
        switch (scoreFilter) {
          case "excellent":
            return percentage >= 80;
          case "good":
            return percentage >= 60 && percentage < 80;
          case "average":
            return percentage >= 40 && percentage < 60;
          case "poor":
            return percentage < 40;
          default:
            return true;
        }
      });
    }

    // Filter by date range
    if (dateRange.from || dateRange.to) {
      filtered = filtered.filter((e) => {
        const evalDate = new Date(e.createdAt);
        if (dateRange.from && dateRange.to) {
          return evalDate >= dateRange.from && evalDate <= dateRange.to;
        } else if (dateRange.from) {
          return evalDate >= dateRange.from;
        } else if (dateRange.to) {
          return evalDate <= dateRange.to;
        }
        return true;
      });
    }

    setFilteredEvaluations(filtered);
  };

  const clearFilters = () => {
    setCopyTypeFilter("all");
    setScoreFilter("all");
    setDateRange({ from: undefined, to: undefined });
  };

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return "text-green-600 dark:text-green-400";
    if (percentage >= 60) return "text-blue-600 dark:text-blue-400";
    if (percentage >= 40) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const getScoreBadgeVariant = (percentage: number): "default" | "secondary" | "destructive" | "outline" => {
    if (percentage >= 80) return "default";
    if (percentage >= 60) return "secondary";
    if (percentage >= 40) return "outline";
    return "destructive";
  };

  const hasActiveFilters = copyTypeFilter !== "all" || scoreFilter !== "all" || dateRange.from || dateRange.to;

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FileText className="w-8 h-8" />
            Answer History
          </h1>
          <p className="text-muted-foreground mt-1">
            View and track all your answer evaluations
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-sm">
            {filteredEvaluations.length} {filteredEvaluations.length === 1 ? "evaluation" : "evaluations"}
          </Badge>
        </div>
      </div>

      {/* Progress Charts */}
      {evaluations.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <TrendingUp className="w-6 h-6" />
            Progress Analytics
          </h2>
          <ProgressCharts evaluations={evaluations} />
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Filter className="w-5 h-5" />
            Filters
          </CardTitle>
          <CardDescription>
            Filter evaluations by type, score, and date range
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Copy Type Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Copy Type</label>
              <Select value={copyTypeFilter} onValueChange={setCopyTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="gs">General Studies</SelectItem>
                  <SelectItem value="essay">Essay</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Score Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Score Range</label>
              <Select value={scoreFilter} onValueChange={setScoreFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All scores" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Scores</SelectItem>
                  <SelectItem value="excellent">Excellent (80%+)</SelectItem>
                  <SelectItem value="good">Good (60-79%)</SelectItem>
                  <SelectItem value="average">Average (40-59%)</SelectItem>
                  <SelectItem value="poor">Needs Improvement (&lt;40%)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date Range Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Date From</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dateRange.from && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.from ? format(dateRange.from, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateRange.from}
                    onSelect={(date) => setDateRange({ ...dateRange, from: date })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Date To</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dateRange.to && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.to ? format(dateRange.to, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateRange.to}
                    onSelect={(date) => setDateRange({ ...dateRange, to: date })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {hasActiveFilters && (
            <div className="mt-4">
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="w-4 h-4 mr-2" />
                Clear Filters
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Evaluations List */}
      {filteredEvaluations.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No evaluations found</h3>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              {hasActiveFilters
                ? "Try adjusting your filters to see more results"
                : "Upload your first answer copy to get started with evaluations"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredEvaluations.map((evaluation) => {
            const result = evaluation.evaluationResult;
            const percentage = result
              ? (result.totalScore / result.maxScore) * 100
              : 0;

            return (
              <Card key={evaluation.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <FileText className="w-5 h-5 text-muted-foreground" />
                        <h3 className="font-semibold text-lg">{evaluation.fileName}</h3>
                        <Badge variant="outline">
                          {evaluation.copyType === "gs" ? "General Studies" : "Essay"}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                        <span className="flex items-center gap-1">
                          <CalendarIcon className="w-4 h-4" />
                          {format(new Date(evaluation.createdAt), "PPP")}
                        </span>
                      </div>

                      {result && (
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <Award className="w-5 h-5 text-muted-foreground" />
                            <span className={cn("text-2xl font-bold", getScoreColor(percentage))}>
                              {result.totalScore}/{result.maxScore}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              ({percentage.toFixed(1)}%)
                            </span>
                          </div>
                          <Badge variant={getScoreBadgeVariant(percentage)}>
                            {percentage >= 80
                              ? "Excellent"
                              : percentage >= 60
                              ? "Good"
                              : percentage >= 40
                              ? "Average"
                              : "Needs Improvement"}
                          </Badge>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2">
                      {result && (
                        <Button
                          onClick={() => setSelectedEvaluation(evaluation)}
                          size="sm"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </Button>
                      )}
                      {evaluation.status !== "completed" && (
                        <Badge variant="secondary">{evaluation.status}</Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Evaluation Detail Dialog */}
      <Dialog open={!!selectedEvaluation} onOpenChange={() => setSelectedEvaluation(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Evaluation Details</DialogTitle>
          </DialogHeader>
          {selectedEvaluation && selectedEvaluation.evaluationResult && (
            <EvaluationDisplay
              evaluation={selectedEvaluation.evaluationResult}
              copyType={selectedEvaluation.copyType}
              fileName={selectedEvaluation.fileName}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
