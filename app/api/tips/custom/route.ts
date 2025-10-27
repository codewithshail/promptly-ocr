import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { tipsService } from "@/lib/services/tips.service";
import { handleNetworkError, formatErrorForLogging } from "@/lib/error-handler";
import { redis } from "@/lib/redis";

// Rate limiting configuration
const RATE_LIMIT_MAX_REQUESTS = 10;
const RATE_LIMIT_WINDOW = 60 * 60; // 1 hour in seconds

/**
 * Check if user has exceeded rate limit
 * @param userId - User ID
 * @returns true if rate limit exceeded, false otherwise
 */
async function checkRateLimit(userId: string): Promise<boolean> {
  const rateLimitKey = `rate-limit:custom-tips:${userId}`;
  
  try {
    // Get current request count
    const currentCount = await redis.get<number>(rateLimitKey);
    
    if (currentCount === null) {
      // First request in this window
      await redis.setex(rateLimitKey, RATE_LIMIT_WINDOW, 1);
      return false;
    }
    
    if (currentCount >= RATE_LIMIT_MAX_REQUESTS) {
      // Rate limit exceeded
      return true;
    }
    
    // Increment counter
    await redis.incr(rateLimitKey);
    return false;
  } catch (error) {
    console.error("Rate limit check failed:", formatErrorForLogging(error));
    // On error, allow the request (fail open)
    return false;
  }
}

/**
 * POST /api/tips/custom
 * Generate custom tip for a specific subject and question
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in to generate custom tips." },
        { status: 401 }
      );
    }

    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid request body. Please provide valid JSON." },
        { status: 400 }
      );
    }

    const { subject, question } = body;

    // Validate required fields
    if (!subject || typeof subject !== "string") {
      return NextResponse.json(
        { error: "Subject is required and must be a string." },
        { status: 400 }
      );
    }

    if (!question || typeof question !== "string") {
      return NextResponse.json(
        { error: "Question is required and must be a string." },
        { status: 400 }
      );
    }

    // Validate question length (max 500 characters as per requirements)
    if (question.trim().length === 0) {
      return NextResponse.json(
        { error: "Question cannot be empty." },
        { status: 400 }
      );
    }

    if (question.length > 500) {
      return NextResponse.json(
        { error: "Question must be 500 characters or less." },
        { status: 400 }
      );
    }

    // Check rate limit
    const rateLimitExceeded = await checkRateLimit(userId);
    
    if (rateLimitExceeded) {
      return NextResponse.json(
        { 
          error: "Rate limit exceeded. You can generate up to 10 custom tips per hour. Please try again later.",
          code: "RATE_LIMIT_ERROR"
        },
        { status: 429 }
      );
    }

    // Generate custom tip using TipsService
    const result = await tipsService.generateCustomTip(
      userId,
      subject.trim(),
      question.trim()
    );

    // Return structured response
    return NextResponse.json({
      tip: result.tip,
      cached: result.cached,
      subject: result.tip.subject,
      timestamp: result.tip.timestamp,
    }, { status: 200 });

  } catch (error) {
    console.error("Custom tips API error:", formatErrorForLogging(error));
    
    const errorResponse = handleNetworkError(error);
    
    // Return appropriate status code based on error type
    let statusCode = 500;
    if (errorResponse.code === "RATE_LIMIT_ERROR") {
      statusCode = 429;
    } else if (errorResponse.code === "AUTH_ERROR") {
      statusCode = 401;
    } else if (errorResponse.code === "PERMISSION_ERROR") {
      statusCode = 403;
    } else if (errorResponse.code === "NOT_FOUND_ERROR") {
      statusCode = 404;
    }
    
    return NextResponse.json(
      { 
        error: errorResponse.message,
        code: errorResponse.code 
      },
      { status: statusCode }
    );
  }
}
