"use client";

import { Switch } from "@/components/ui/switch";
import { Brain } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface ThinkingToggleProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
}

export function ThinkingToggle({ enabled, onToggle }: ThinkingToggleProps) {
  return (
    <Card className="w-fit">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-primary" />
          <CardTitle className="text-base">Thinking Mode</CardTitle>
        </div>
        <CardDescription className="text-xs">
          {enabled
            ? "AI will show its reasoning process"
            : "AI will provide quick responses"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2">
          <Switch
            id="thinking-mode"
            checked={enabled}
            onCheckedChange={onToggle}
          />
          <label
            htmlFor="thinking-mode"
            className="text-sm font-medium cursor-pointer"
          >
            {enabled ? "Enabled" : "Disabled"}
          </label>
        </div>
      </CardContent>
    </Card>
  );
}
