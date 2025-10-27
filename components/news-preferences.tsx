"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type NewsCategory =
  | "national"
  | "international"
  | "economy"
  | "science-tech"
  | "environment"
  | "polity"
  | "defense"
  | "culture";

interface CategoryOption {
  value: NewsCategory;
  label: string;
  description: string;
}

const CATEGORY_OPTIONS: CategoryOption[] = [
  {
    value: "national",
    label: "National News",
    description: "Domestic affairs, policies, and events",
  },
  {
    value: "international",
    label: "International News",
    description: "Global affairs and foreign relations",
  },
  {
    value: "economy",
    label: "Economy",
    description: "Economic policies, markets, and business",
  },
  {
    value: "science-tech",
    label: "Science & Technology",
    description: "Scientific developments and innovations",
  },
  {
    value: "environment",
    label: "Environment",
    description: "Climate, ecology, and sustainability",
  },
  {
    value: "polity",
    label: "Polity",
    description: "Governance, constitution, and political systems",
  },
  {
    value: "defense",
    label: "Defense",
    description: "Military, security, and strategic affairs",
  },
  {
    value: "culture",
    label: "Culture",
    description: "Arts, heritage, and cultural events",
  },
];

interface NewsPreferencesProps {
  initialCategories?: NewsCategory[];
  onSave?: (categories: NewsCategory[]) => Promise<boolean>;
}

export function NewsPreferences({ initialCategories = [], onSave }: NewsPreferencesProps) {
  const { toast } = useToast();
  const [selectedCategories, setSelectedCategories] = useState<NewsCategory[]>(initialCategories);
  const [isSaving, setIsSaving] = useState(false);

  // Update selected categories when initial categories change
  useEffect(() => {
    setSelectedCategories(initialCategories);
  }, [initialCategories]);

  const toggleCategory = (category: NewsCategory) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  const handleSave = async () => {
    if (!onSave) return;

    try {
      setIsSaving(true);
      const success = await onSave(selectedCategories);

      if (success) {
        toast({
          title: "Success",
          description: "Your news preferences have been saved",
        });
      } else {
        throw new Error("Failed to save");
      }
    } catch (error) {
      console.error("Error saving preferences:", error);
      toast({
        title: "Error",
        description: "Failed to save your preferences",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>News Preferences</CardTitle>
        <CardDescription>
          Choose the categories you want to see in your news feed. Your preferred categories will appear first.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {CATEGORY_OPTIONS.map((category) => {
            const isSelected = selectedCategories.includes(category.value);
            return (
              <button
                key={category.value}
                onClick={() => toggleCategory(category.value)}
                className={`relative p-4 rounded-lg border-2 transition-all text-left ${
                  isSelected
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
              >
                {isSelected && (
                  <div className="absolute top-2 right-2">
                    <div className="bg-primary text-primary-foreground rounded-full p-1">
                      <Check className="h-4 w-4" />
                    </div>
                  </div>
                )}
                <div className="space-y-2">
                  <h3 className="font-semibold">{category.label}</h3>
                  <p className="text-sm text-muted-foreground">
                    {category.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {selectedCategories.length === 0 ? (
              "No categories selected - you'll see all news"
            ) : (
              <>
                {selectedCategories.length} {selectedCategories.length === 1 ? "category" : "categories"} selected
              </>
            )}
          </div>
          <Button
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "Save Preferences"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
