"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Megaphone, Plus, Edit, Trash2, Calendar, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { CreateAnnouncementDialog } from "@/components/create-announcement-dialog";

interface Announcement {
  id: string;
  title: string;
  content: string;
  targetAudience: "all" | "active" | "inactive";
  status: "draft" | "scheduled" | "sent";
  scheduledFor: string | null;
  sentAt: string | null;
  createdAt: string;
  recipientCount?: number;
}

export function AdminAnnouncementsClient() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [announcementToDelete, setAnnouncementToDelete] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/announcements");
      if (!response.ok) throw new Error("Failed to fetch announcements");
      const data = await response.json();
      setAnnouncements(data.announcements || []);
    } catch (error) {
      console.error("Error fetching announcements:", error);
      toast({
        title: "Error",
        description: "Failed to load announcements",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!announcementToDelete) return;

    try {
      const response = await fetch(`/api/announcements/${announcementToDelete}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete announcement");

      toast({
        title: "Success",
        description: "Announcement deleted successfully",
      });

      fetchAnnouncements();
    } catch (error) {
      console.error("Error deleting announcement:", error);
      toast({
        title: "Error",
        description: "Failed to delete announcement",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setAnnouncementToDelete(null);
    }
  };

  const handleEdit = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    setCreateDialogOpen(true);
  };

  const handleCreateSuccess = () => {
    setCreateDialogOpen(false);
    setEditingAnnouncement(null);
    fetchAnnouncements();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "draft":
        return <Badge variant="secondary">Draft</Badge>;
      case "scheduled":
        return <Badge className="bg-blue-500">Scheduled</Badge>;
      case "sent":
        return <Badge className="bg-green-500">Sent</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getAudienceBadge = (audience: string) => {
    switch (audience) {
      case "all":
        return <Badge variant="outline">All Users</Badge>;
      case "active":
        return <Badge variant="outline">Active Users</Badge>;
      case "inactive":
        return <Badge variant="outline">Inactive Users</Badge>;
      default:
        return <Badge variant="outline">{audience}</Badge>;
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Announcements</h1>
          <p className="text-slate-600 mt-1">Loading announcements...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Announcements</h1>
          <p className="text-slate-600 mt-1">
            Send announcements to users via email
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Announcement
        </Button>
      </div>

      {announcements.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Megaphone className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">
              No announcements yet
            </h3>
            <p className="text-slate-600 mb-4">
              Create your first announcement to notify users about important updates.
            </p>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Announcement
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>All Announcements</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Audience</TableHead>
                  <TableHead>Scheduled For</TableHead>
                  <TableHead>Sent At</TableHead>
                  <TableHead>Recipients</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {announcements.map((announcement) => (
                  <TableRow key={announcement.id}>
                    <TableCell className="font-medium">
                      {announcement.title}
                    </TableCell>
                    <TableCell>{getStatusBadge(announcement.status)}</TableCell>
                    <TableCell>{getAudienceBadge(announcement.targetAudience)}</TableCell>
                    <TableCell>
                      {announcement.scheduledFor ? (
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="h-3 w-3" />
                          {formatDate(announcement.scheduledFor)}
                        </div>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {announcement.sentAt ? (
                        formatDate(announcement.sentAt)
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {announcement.recipientCount !== undefined ? (
                        <div className="flex items-center gap-1 text-sm">
                          <Users className="h-3 w-3" />
                          {announcement.recipientCount}
                        </div>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {announcement.status !== "sent" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(announcement)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        {announcement.status !== "sent" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setAnnouncementToDelete(announcement.id);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <CreateAnnouncementDialog
        open={createDialogOpen}
        onOpenChange={(open) => {
          setCreateDialogOpen(open);
          if (!open) setEditingAnnouncement(null);
        }}
        onSuccess={handleCreateSuccess}
        editingAnnouncement={editingAnnouncement}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Announcement</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this announcement? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
