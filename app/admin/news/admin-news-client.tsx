"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  ExternalLink,
  Newspaper,
  Eye,
  Bookmark,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  content: string;
  source: string;
  category: string;
  imageUrl?: string;
  publishedAt: string;
  fetchedAt: string;
  externalUrl?: string;
  _count?: {
    bookmarks: number;
  };
}

const CATEGORIES = [
  "national",
  "international",
  "economy",
  "science-tech",
  "environment",
  "polity",
  "defense",
  "culture",
];

export function AdminNewsClient() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [filteredArticles, setFilteredArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedArticles, setSelectedArticles] = useState<Set<string>>(
    new Set()
  );
  const [deletingArticle, setDeletingArticle] = useState<NewsArticle | null>(
    null
  );
  const [showCreateForm, setShowCreateForm] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchArticles();
  }, []);

  useEffect(() => {
    filterArticles();
  }, [articles, searchQuery, selectedCategory]);

  async function fetchArticles() {
    try {
      const response = await fetch("/api/admin/news");
      if (response.ok) {
        const data = await response.json();
        setArticles(data.articles);
      }
    } catch (error) {
      console.error("Error fetching articles:", error);
      toast({
        title: "Error",
        description: "Failed to load news articles",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  function filterArticles() {
    let filtered = articles;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (article) =>
          article.title.toLowerCase().includes(query) ||
          article.summary?.toLowerCase().includes(query)
      );
    }

    if (selectedCategory !== "all") {
      filtered = filtered.filter(
        (article) => article.category === selectedCategory
      );
    }

    setFilteredArticles(filtered);
  }

  async function handleDelete(articleId: string) {
    try {
      const response = await fetch(`/api/admin/news?id=${articleId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Article deleted successfully",
        });
        fetchArticles();
      } else {
        throw new Error("Failed to delete");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete article",
        variant: "destructive",
      });
    } finally {
      setDeletingArticle(null);
    }
  }

  async function handleBulkDelete() {
    if (selectedArticles.size === 0) return;

    try {
      const response = await fetch("/api/admin/news/bulk", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selectedArticles) }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: `${selectedArticles.size} articles deleted`,
        });
        setSelectedArticles(new Set());
        fetchArticles();
      } else {
        throw new Error("Failed to delete");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete articles",
        variant: "destructive",
      });
    }
  }

  function toggleArticleSelection(articleId: string) {
    const newSelection = new Set(selectedArticles);
    if (newSelection.has(articleId)) {
      newSelection.delete(articleId);
    } else {
      newSelection.add(articleId);
    }
    setSelectedArticles(newSelection);
  }

  function toggleSelectAll() {
    if (selectedArticles.size === filteredArticles.length) {
      setSelectedArticles(new Set());
    } else {
      setSelectedArticles(new Set(filteredArticles.map((a) => a.id)));
    }
  }

  if (loading) {
    return null;
  }

  return (
    <>
      <div className="space-y-4">
        {/* Filters and Actions */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search articles..."
                  className="pl-10"
                />
              </div>

              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full sm:w-48">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button onClick={() => setShowCreateForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Article
              </Button>
            </div>

            {selectedArticles.size > 0 && (
              <div className="mt-4 flex items-center justify-between p-3 bg-slate-100 rounded-lg">
                <span className="text-sm font-medium">
                  {selectedArticles.size} article(s) selected
                </span>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleBulkDelete}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Selected
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{articles.length}</div>
              <p className="text-sm text-slate-600">Total Articles</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{filteredArticles.length}</div>
              <p className="text-sm text-slate-600">Filtered Results</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">
                {articles.reduce((sum, a) => sum + (a._count?.bookmarks || 0), 0)}
              </div>
              <p className="text-sm text-slate-600">Total Bookmarks</p>
            </CardContent>
          </Card>
        </div>

        {/* Articles List */}
        {filteredArticles.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Newspaper className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">
                No articles found
              </h3>
              <p className="text-slate-600">
                {searchQuery || selectedCategory !== "all"
                  ? "Try adjusting your filters"
                  : "Articles will appear here once fetched"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2 px-2">
              <Checkbox
                checked={selectedArticles.size === filteredArticles.length}
                onCheckedChange={toggleSelectAll}
              />
              <span className="text-sm text-slate-600">Select All</span>
            </div>

            {filteredArticles.map((article) => (
              <Card key={article.id}>
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <Checkbox
                      checked={selectedArticles.has(article.id)}
                      onCheckedChange={() => toggleArticleSelection(article.id)}
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="flex-1">
                          <h3 className="font-semibold text-slate-900 mb-1">
                            {article.title}
                          </h3>
                          <p className="text-sm text-slate-600 line-clamp-2">
                            {article.summary}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
                        <Badge variant="outline">{article.category}</Badge>
                        <span className="flex items-center gap-1">
                          <Newspaper className="h-3 w-3" />
                          {article.source}
                        </span>
                        {article._count && article._count.bookmarks > 0 && (
                          <span className="flex items-center gap-1">
                            <Bookmark className="h-3 w-3" />
                            {article._count.bookmarks} bookmarks
                          </span>
                        )}
                        <span>
                          {formatDistanceToNow(new Date(article.publishedAt), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>

                      <div className="flex gap-2 mt-3">
                        {article.externalUrl && (
                          <Button variant="outline" size="sm" asChild>
                            <a
                              href={article.externalUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <ExternalLink className="h-4 w-4 mr-2" />
                              Source
                            </a>
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDeletingArticle(article)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <AlertDialog
        open={!!deletingArticle}
        onOpenChange={() => setDeletingArticle(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Article</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this article? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingArticle && handleDelete(deletingArticle.id)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
