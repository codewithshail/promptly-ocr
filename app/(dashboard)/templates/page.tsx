"use client";

import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { TemplateCard } from "@/components/template-card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";
import { TemplateDetail } from "@/components/template-detail";

interface AnswerTemplate {
  id: string;
  questionType: string;
  title: string;
  structure: string;
  sampleAnswer: string;
  annotations: string;
}

// Sample templates data - will be replaced with API call
const sampleTemplates: AnswerTemplate[] = [
  {
    id: "1",
    questionType: "Essay",
    title: "Argumentative Essay Template",
    structure: "Introduction → Arguments For → Arguments Against → Balanced Conclusion",
    sampleAnswer: "Sample argumentative essay structure with clear thesis statement...",
    annotations: JSON.stringify([
      { section: "Introduction", tip: "Start with a hook and clear thesis" },
      { section: "Body", tip: "Present balanced arguments with evidence" },
      { section: "Conclusion", tip: "Synthesize arguments and provide nuanced view" }
    ])
  },
  {
    id: "2",
    questionType: "Essay",
    title: "Analytical Essay Template",
    structure: "Introduction → Analysis Framework → Key Points → Synthesis → Conclusion",
    sampleAnswer: "Sample analytical essay with systematic breakdown...",
    annotations: JSON.stringify([
      { section: "Introduction", tip: "Define key terms and scope" },
      { section: "Analysis", tip: "Use frameworks like SWOT, PESTLE" },
      { section: "Conclusion", tip: "Provide actionable insights" }
    ])
  },
  {
    id: "3",
    questionType: "General Studies",
    title: "150-Word Answer Template",
    structure: "Introduction (30 words) → Body (90 words) → Conclusion (30 words)",
    sampleAnswer: "Concise answer format for 10-mark questions...",
    annotations: JSON.stringify([
      { section: "Introduction", tip: "Define and contextualize" },
      { section: "Body", tip: "2-3 key points with examples" },
      { section: "Conclusion", tip: "Way forward or significance" }
    ])
  },
  {
    id: "4",
    questionType: "General Studies",
    title: "250-Word Answer Template",
    structure: "Introduction (40 words) → Body (170 words) → Conclusion (40 words)",
    sampleAnswer: "Detailed answer format for 15-mark questions...",
    annotations: JSON.stringify([
      { section: "Introduction", tip: "Hook + definition + context" },
      { section: "Body", tip: "4-5 dimensions with examples and data" },
      { section: "Conclusion", tip: "Balanced view + way forward" }
    ])
  },
  {
    id: "5",
    questionType: "Ethics",
    title: "Case Study Answer Template",
    structure: "Facts → Stakeholders → Ethical Dilemmas → Options → Best Course of Action",
    sampleAnswer: "Structured approach to ethics case studies...",
    annotations: JSON.stringify([
      { section: "Facts", tip: "List key facts objectively" },
      { section: "Stakeholders", tip: "Identify all affected parties" },
      { section: "Dilemmas", tip: "Highlight conflicting values" },
      { section: "Action", tip: "Justify with ethical principles" }
    ])
  },
  {
    id: "6",
    questionType: "Ethics",
    title: "Quote-Based Answer Template",
    structure: "Quote Interpretation → Relevance → Examples → Personal Reflection",
    sampleAnswer: "Template for quote-based ethics questions...",
    annotations: JSON.stringify([
      { section: "Interpretation", tip: "Explain the quote's meaning" },
      { section: "Relevance", tip: "Connect to UPSC syllabus themes" },
      { section: "Examples", tip: "Use historical and contemporary examples" }
    ])
  }
];

const questionTypes = ["All", "Essay", "General Studies", "Ethics"];

export default function TemplatesPage() {
  const searchParams = useSearchParams();
  const highlightId = searchParams.get("highlight");
  
  const [selectedTemplate, setSelectedTemplate] = useState<AnswerTemplate | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("All");

  // Auto-select template if highlight parameter is present
  useEffect(() => {
    if (highlightId && !selectedTemplate) {
      const template = sampleTemplates.find(t => t.id === highlightId);
      if (template) {
        setSelectedTemplate(template);
      }
    }
  }, [highlightId, selectedTemplate]);

  const filteredTemplates = useMemo(() => {
    return sampleTemplates.filter((template) => {
      const matchesSearch = template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.questionType.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = filterType === "All" || template.questionType === filterType;
      return matchesSearch && matchesFilter;
    });
  }, [searchQuery, filterType]);

  if (selectedTemplate) {
    return (
      <TemplateDetail
        template={selectedTemplate}
        onBack={() => setSelectedTemplate(null)}
      />
    );
  }

  return (
    <div className="w-full max-w-full overflow-x-hidden">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">Answer Templates</h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          Browse structured templates for different question types to improve your answer writing
        </p>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            {questionTypes.map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Templates Grid */}
      {filteredTemplates.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No templates found matching your search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredTemplates.map((template) => (
            <TemplateCard
              key={template.id}
              id={template.id}
              title={template.title}
              questionType={template.questionType}
              description={template.structure}
              onClick={() => setSelectedTemplate(template)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
