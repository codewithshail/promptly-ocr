import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { newsService } from "@/lib/services/news.service";
import { handleNetworkError, formatErrorForLogging } from "@/lib/error-handler";

/**
 * GET /api/news
 * Fetch personalized news feed for the authenticated user
 * Query params:
 * - page: Page number (default: 1)
 * - limit: Number of articles per page (default: 20)
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    // Validate parameters
    if (page < 1 || limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: "Invalid pagination parameters" },
        { status: 400 }
      );
    }

    // Fetch personalized news feed
    const articles = await newsService.getPersonalizedFeed(userId, limit * page);

    // Paginate results
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedArticles = articles.slice(startIndex, endIndex);
    const hasMore = articles.length > endIndex;

    return NextResponse.json({
      articles: paginatedArticles,
      page,
      limit,
      total: articles.length,
      hasMore,
    });
  } catch (error) {
    console.error("Error fetching news:", formatErrorForLogging(error));
    
    // Try to return cached news as fallback
    try {
      const searchParams = request.nextUrl.searchParams;
      const limit = parseInt(searchParams.get("limit") || "20", 10);
      const cachedArticles = await newsService.getCachedNews(limit);
      
      return NextResponse.json({
        articles: cachedArticles,
        page: 1,
        limit,
        total: cachedArticles.length,
        hasMore: false,
        cached: true,
      });
    } catch (fallbackError) {
      console.error("Error fetching cached news:", formatErrorForLogging(fallbackError));
      
      const errorResponse = handleNetworkError(error);
      
      return NextResponse.json(
        { 
          error: errorResponse.message,
          code: errorResponse.code 
        },
        { status: 500 }
      );
    }
  }
}
