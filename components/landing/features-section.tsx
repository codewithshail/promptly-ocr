import {
  MessageSquare,
  FileCheck,
  Newspaper,
  Lightbulb,
} from "lucide-react";
import { FeatureCard } from "./feature-card";

const features = [
  {
    icon: MessageSquare,
    title: "AI Chatbot",
    description:
      "Get instant answers to your UPSC queries with our AI-powered chatbot featuring thinking mode for deeper analysis",
    features: [
      "Web search integration",
      "Thinking mode for complex topics",
      "24/7 study companion",
    ],
    gradientFrom: "from-blue-600",
    gradientTo: "to-indigo-600",
    bgGradientFrom: "from-blue-50",
    bgGradientTo: "to-blue-100",
  },
  {
    icon: FileCheck,
    title: "Copy Checking",
    description:
      "Upload GS and Essay answers for detailed AI evaluation with scores, feedback, and improvement tips",
    features: [
      "GS & Essay evaluation",
      "Detailed scoring breakdown",
      "Personalized recommendations",
    ],
    gradientFrom: "from-indigo-600",
    gradientTo: "to-purple-600",
    bgGradientFrom: "from-indigo-50",
    bgGradientTo: "to-indigo-100",
  },
  {
    icon: Newspaper,
    title: "Current Affairs",
    description:
      "Stay updated with personalized news feed covering all UPSC-relevant topics from trusted sources",
    features: [
      "Personalized news feed",
      "Daily quizzes & flashcards",
      "Trusted Indian sources",
    ],
    gradientFrom: "from-purple-600",
    gradientTo: "to-pink-600",
    bgGradientFrom: "from-purple-50",
    bgGradientTo: "to-purple-100",
  },
  {
    icon: Lightbulb,
    title: "Tips & Tricks",
    description:
      "Access subject-specific preparation strategies sourced from web search for accuracy and relevance",
    features: [
      "Subject-wise strategies",
      "Web-sourced accuracy",
      "Bookmark favorites",
    ],
    gradientFrom: "from-pink-600",
    gradientTo: "to-rose-600",
    bgGradientFrom: "from-pink-50",
    bgGradientTo: "to-pink-100",
  },
];

export function FeaturesSection() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Everything You Need to
            <span className="block bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Ace UPSC
            </span>
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Comprehensive tools designed specifically for UPSC aspirants to
            maximize preparation efficiency
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <FeatureCard key={index} {...feature} />
          ))}
        </div>
      </div>
    </section>
  );
}
