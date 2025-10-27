"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { CalendarIcon, Eye, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface CreateAnnouncementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  editingAnnouncement?: {
    id: string;
    title: string;
    content: string;
    targetAudience: string;
    status: string;
    scheduledFor: string | null;
  } | null;
}

export function CreateAnnouncementDialog({
  open,
  onOpenChange,
  onSuccess,
  editingAnnouncement,
}: CreateAnnouncementDialogProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [targetAudience, setTargetAudience] = useState<"all" | "active" | "inactive">("all");
  const [scheduledDate, setScheduledDate] = useState<Date>();
  const [scheduledTime, setScheduledTime] = useState("09:00");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("compose");
  const { toast } = useToast();

  useEffect(() => {
    if (editingAnnouncement) {
      setTitle(editingAnnouncement.title);
      setContent(editingAnnouncement.content);
      setTargetAudience(editingAnnouncement.targetAudience as "all" | "active" | "inactive");
      
      if (editingAnnouncement.scheduledFor) {
        const scheduledDateTime = new Date(editingAnnouncement.scheduledFor);
        setScheduledDate(scheduledDateTime);
        setScheduledTime(
          format(scheduledDateTime, "HH:mm")
        );
      }
    } else {
      // Reset form when not editing
      setTitle("");
      setContent("");
      setTargetAudience("all");
      setScheduledDate(undefined);
      setScheduledTime("09:00");
    }
  }, [editingAnnouncement, open]);

  const handleSubmit = async (sendNow: boolean = false) => {
    if (!title.trim() || !content.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (!sendNow && !scheduledDate) {
      toast({
        title: "Error",
        description: "Please select a scheduled date or send now",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      let scheduledFor = null;
      if (!sendNow && scheduledDate) {
        const [hours, minutes] = scheduledTime.split(":");
        const scheduled = new Date(scheduledDate);
        scheduled.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        scheduledFor = scheduled.toISOString();
      }

      const payload = {
        title,
        content,
        targetAudience,
        scheduledFor,
        sendNow,
      };

      const url = editingAnnouncement
        ? `/api/announcements/${editingAnnouncement.id}`
        : "/api/announcements";
      
      const method = editingAnnouncement ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save announcement");
      }

      toast({
        title: "Success",
        description: sendNow
          ? "Announcement sent successfully"
          : editingAnnouncement
          ? "Announcement updated successfully"
          : "Announcement scheduled successfully",
      });

      onSuccess();
    } catch (error) {
      console.error("Error saving announcement:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save announcement",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getPreviewContent = () => {
    return {
      userName: "John Doe",
      title: title || "Announcement Title",
      content: content || "Your announcement content will appear here...",
    };
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingAnnouncement ? "Edit Announcement" : "Create Announcement"}
          </DialogTitle>
          <DialogDescription>
            Send an announcement to users via email. You can send immediately or schedule for later.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="compose">Compose</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>

          <TabsContent value="compose" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="Enter announcement title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Content *</Label>
              <Textarea
                id="content"
                placeholder="Enter announcement content. Use double line breaks for paragraphs."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={10}
                disabled={loading}
                className="resize-none"
              />
              <p className="text-xs text-slate-500">
                Tip: Use double line breaks (press Enter twice) to create separate paragraphs.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="audience">Target Audience</Label>
              <Select
                value={targetAudience}
                onValueChange={(value: "all" | "active" | "inactive") =>
                  setTargetAudience(value)
                }
                disabled={loading}
              >
                <SelectTrigger id="audience">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="active">Active Users (logged in last 7 days)</SelectItem>
                  <SelectItem value="inactive">Inactive Users (not logged in last 7 days)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Schedule (Optional)</Label>
              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "flex-1 justify-start text-left font-normal",
                        !scheduledDate && "text-muted-foreground"
                      )}
                      disabled={loading}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {scheduledDate ? format(scheduledDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={scheduledDate}
                      onSelect={setScheduledDate}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>

                <Input
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="w-32"
                  disabled={loading}
                />
              </div>
              <p className="text-xs text-slate-500">
                Leave empty to send immediately, or select a date and time to schedule.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="preview" className="mt-4">
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="bg-blue-500 text-white text-center py-3 px-4 rounded-t-lg">
                    <p className="text-xs font-bold tracking-wider">📢 ANNOUNCEMENT</p>
                  </div>
                  
                  <div className="px-4">
                    <h2 className="text-2xl font-bold text-slate-900 mb-4">
                      {getPreviewContent().title}
                    </h2>
                    
                    <p className="text-slate-600 mb-4">
                      Hi {getPreviewContent().userName},
                    </p>
                    
                    <div className="space-y-4">
                      {getPreviewContent().content.split('\n\n').map((paragraph, index) => (
                        <p key={index} className="text-slate-600">
                          {paragraph}
                        </p>
                      ))}
                    </div>
                    
                    <div className="mt-6 pt-6 border-t border-slate-200">
                      <p className="text-sm text-slate-500">
                        Thank you for being part of our community! 🙏
                        <br />
                        The UPSC Aspirant Platform Team
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          
          {!editingAnnouncement && (
            <Button
              onClick={() => handleSubmit(true)}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700"
            >
              <Send className="h-4 w-4 mr-2" />
              {loading ? "Sending..." : "Send Now"}
            </Button>
          )}
          
          <Button
            onClick={() => handleSubmit(false)}
            disabled={loading}
          >
            <CalendarIcon className="h-4 w-4 mr-2" />
            {loading
              ? "Saving..."
              : editingAnnouncement
              ? "Update"
              : scheduledDate
              ? "Schedule"
              : "Save as Draft"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
