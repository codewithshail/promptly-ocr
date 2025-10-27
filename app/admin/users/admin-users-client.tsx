"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Shield,
  TrendingUp,
  FileCheck,
  ClipboardList,
  Eye,
  Award,
  Calendar,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string | null;
  isAdmin: boolean;
  createdAt: string;
  preferences?: {
    dailyStreak: number;
    leaderboardOptIn: boolean;
  };
  _count?: {
    evaluations: number;
    testAttempts: number;
    notes: number;
    activities: number;
  };
}

interface UserActivity {
  id: string;
  activityType: string;
  createdAt: string;
}

export function AdminUsersClient() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userActivities, setUserActivities] = useState<UserActivity[]>([]);
  const [promotingUser, setPromotingUser] = useState<User | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchQuery]);

  async function fetchUsers() {
    try {
      const response = await fetch("/api/admin/users");
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  function filterUsers() {
    if (!searchQuery) {
      setFilteredUsers(users);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = users.filter(
      (user) =>
        user.email.toLowerCase().includes(query) ||
        user.firstName?.toLowerCase().includes(query) ||
        user.lastName?.toLowerCase().includes(query)
    );
    setFilteredUsers(filtered);
  }

  async function handleViewDetails(user: User) {
    setSelectedUser(user);
    
    // Fetch user activities
    try {
      const response = await fetch(`/api/admin/users/${user.id}/activities`);
      if (response.ok) {
        const data = await response.json();
        setUserActivities(data.activities);
      }
    } catch (error) {
      console.error("Error fetching user activities:", error);
    }
  }

  async function handlePromoteToAdmin(userId: string) {
    try {
      const response = await fetch(`/api/admin/users/${userId}/promote`, {
        method: "POST",
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "User promoted to admin successfully",
        });
        fetchUsers();
      } else {
        throw new Error("Failed to promote");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to promote user",
        variant: "destructive",
      });
    } finally {
      setPromotingUser(null);
    }
  }

  if (loading) {
    return null;
  }

  return (
    <>
      <div className="space-y-4">
        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search users by name or email..."
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{users.length}</div>
              <p className="text-sm text-slate-600">Total Users</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">
                {users.filter((u) => u.isAdmin).length}
              </div>
              <p className="text-sm text-slate-600">Admins</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">
                {users.filter((u) => u._count && u._count.activities > 0).length}
              </div>
              <p className="text-sm text-slate-600">Active Users</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">
                {users.reduce((sum, u) => sum + (u._count?.evaluations || 0), 0)}
              </div>
              <p className="text-sm text-slate-600">Total Evaluations</p>
            </CardContent>
          </Card>
        </div>

        {/* Users List */}
        {filteredUsers.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-slate-600">No users found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredUsers.map((user) => (
              <Card key={user.id}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    {user.imageUrl ? (
                      <img
                        src={user.imageUrl}
                        alt={user.firstName || "User"}
                        className="h-12 w-12 rounded-full"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-slate-200 flex items-center justify-center">
                        <span className="text-lg font-semibold text-slate-600">
                          {user.firstName?.[0] || user.email[0].toUpperCase()}
                        </span>
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-slate-900">
                              {user.firstName && user.lastName
                                ? `${user.firstName} ${user.lastName}`
                                : user.email}
                            </h3>
                            {user.isAdmin && (
                              <Badge variant="default" className="gap-1">
                                <Shield className="h-3 w-3" />
                                Admin
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-slate-600">{user.email}</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 mb-3">
                        {user.preferences && (
                          <>
                            <span className="flex items-center gap-1">
                              <TrendingUp className="h-3 w-3" />
                              {user.preferences.dailyStreak} day streak
                            </span>
                            {user.preferences.leaderboardOptIn && (
                              <Badge variant="outline" className="text-xs">
                                <Award className="h-3 w-3 mr-1" />
                                Leaderboard
                              </Badge>
                            )}
                          </>
                        )}
                        {user._count && (
                          <>
                            <span className="flex items-center gap-1">
                              <FileCheck className="h-3 w-3" />
                              {user._count.evaluations} evaluations
                            </span>
                            <span className="flex items-center gap-1">
                              <ClipboardList className="h-3 w-3" />
                              {user._count.testAttempts} tests
                            </span>
                          </>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Joined{" "}
                          {formatDistanceToNow(new Date(user.createdAt), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetails(user)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                        {!user.isAdmin && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPromotingUser(user)}
                          >
                            <Shield className="h-4 w-4 mr-2" />
                            Promote to Admin
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* User Details Dialog */}
      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                {selectedUser.imageUrl ? (
                  <img
                    src={selectedUser.imageUrl}
                    alt={selectedUser.firstName || "User"}
                    className="h-16 w-16 rounded-full"
                  />
                ) : (
                  <div className="h-16 w-16 rounded-full bg-slate-200 flex items-center justify-center">
                    <span className="text-2xl font-semibold text-slate-600">
                      {selectedUser.firstName?.[0] ||
                        selectedUser.email[0].toUpperCase()}
                    </span>
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-semibold">
                    {selectedUser.firstName && selectedUser.lastName
                      ? `${selectedUser.firstName} ${selectedUser.lastName}`
                      : selectedUser.email}
                  </h3>
                  <p className="text-sm text-slate-600">{selectedUser.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Streak</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {selectedUser.preferences?.dailyStreak || 0}
                    </div>
                    <p className="text-xs text-slate-600">days</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Evaluations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {selectedUser._count?.evaluations || 0}
                    </div>
                    <p className="text-xs text-slate-600">completed</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Tests</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {selectedUser._count?.testAttempts || 0}
                    </div>
                    <p className="text-xs text-slate-600">attempts</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {selectedUser._count?.notes || 0}
                    </div>
                    <p className="text-xs text-slate-600">created</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  {userActivities.length === 0 ? (
                    <p className="text-sm text-slate-500">No recent activity</p>
                  ) : (
                    <div className="space-y-2">
                      {userActivities.slice(0, 10).map((activity) => (
                        <div
                          key={activity.id}
                          className="flex items-center justify-between text-sm"
                        >
                          <span className="text-slate-700">
                            {activity.activityType.replace("_", " ")}
                          </span>
                          <span className="text-slate-500">
                            {formatDistanceToNow(new Date(activity.createdAt), {
                              addSuffix: true,
                            })}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Promote to Admin Dialog */}
      <AlertDialog
        open={!!promotingUser}
        onOpenChange={() => setPromotingUser(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Promote to Admin</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to promote {promotingUser?.email} to admin?
              They will have full access to the admin panel.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => promotingUser && handlePromoteToAdmin(promotingUser.id)}
            >
              Promote
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
