"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  BookOpen,
  Globe,
  Landmark,
  TrendingUp,
  Lightbulb,
  Leaf,
  Scale,
  Users,
} from "lucide-react";
import { TipsDisplay } from "@/components/tips-display";
import { TipsErrorBoundary } from "@/components/error-boundary";

type UPSCSubject =
  | "history"
  | "geography"
  | "polity"
  | "economy"
  | "science"
  | "environment"
  | "ethics"
  | "current-affairs";

interface SubjectCard {
  id: UPSCSubject;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

const subjects: SubjectCard[] = [
  {
    id: "history",
    title: "History",
    description: "Ancient, Medieval & Modern Indian History",
    icon: <BookOpen className="h-8 w-8" />,
    color: "bg-amber-500",
  },
  {
    id: "geography",
    title: "Geography",
    description: "Physical, Human & Economic Geography",
    icon: <Globe className="h-8 w-8" />,
    color: "bg-blue-500",
  },
  {
    id: "polity",
    title: "Polity",
    description: "Indian Constitution & Governance",
    icon: <Landmark className="h-8 w-8" />,
    color: "bg-purple-500",
  },
  {
    id: "economy",
    title: "Economy",
    description: "Indian Economy & Economic Development",
    icon: <TrendingUp className="h-8 w-8" />,
    color: "bg-green-500",
  },
  {
    id: "science",
    title: "Science & Technology",
    description: "General Science & Technology Developments",
    icon: <Lightbulb className="h-8 w-8" />,
    color: "bg-yellow-500",
  },
  {
    id: "environment",
    title: "Environment",
    description: "Ecology, Biodiversity & Climate Change",
    icon: <Leaf className="h-8 w-8" />,
    color: "bg-emerald-500",
  },
  {
    id: "ethics",
    title: "Ethics",
    description: "Ethics, Integrity & Aptitude",
    icon: <Scale className="h-8 w-8" />,
    color: "bg-indigo-500",
  },
  {
    id: "current-affairs",
    title: "Current Affairs",
    description: "National & International Current Affairs",
    icon: <Users className="h-8 w-8" />,
    color: "bg-red-500",
  },
];

export default function TipsPage() {
  const [selectedSubject, setSelectedSubject] = useState<UPSCSubject | null>(
    null
  );

  if (selectedSubject) {
    return (
      <TipsErrorBoundary>
        <div className="w-full max-w-full overflow-x-hidden">
          <TipsDisplay
            subject={selectedSubject}
            onBack={() => setSelectedSubject(null)}
          />
        </div>
      </TipsErrorBoundary>
    );
  }

  return (
    <TipsErrorBoundary>
      <div className="w-full max-w-full overflow-x-hidden">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">Tips & Tricks</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Select a subject to get expert preparation tips, strategies, and
            resources
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {subjects.map((subject) => (
            <Card
              key={subject.id}
              className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105 overflow-hidden"
              onClick={() => setSelectedSubject(subject.id)}
            >
              <CardHeader>
                <div
                  className={`${subject.color} w-16 h-16 rounded-lg flex items-center justify-center text-white mb-4 shrink-0`}
                >
                  {subject.icon}
                </div>
                <CardTitle className="text-lg sm:text-xl break-words">{subject.title}</CardTitle>
                <CardDescription className="text-sm break-words">{subject.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Click to view tips →
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </TipsErrorBoundary>
  );
}
