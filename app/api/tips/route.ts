import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { tipsCache } from "@/db/schema";
import { eq, and, gt } from "drizzle-orm";
import { geminiService } from "@/lib/services/gemini.service";
import { inngest } from "@/lib/inngest/client";
import { handleNetworkError, formatErrorForLogging, retryWithBackoff } from "@/lib/error-handler";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const subject = searchParams.get("subject");
    const topic = searchParams.get("topic") || undefined;

    if (!subject) {
      return NextResponse.json(
        { error: "Subject parameter is required" },
        { status: 400 }
      );
    }

    // Check cache first
    const now = new Date();
    const cachedTips = await db
      .select()
      .from(tipsCache)
      .where(
        and(
          eq(tipsCache.subject, subject),
          topic ? eq(tipsCache.topic, topic) : eq(tipsCache.topic, ""),
          gt(tipsCache.expiresAt, now)
        )
      )
      .limit(1);

    if (cachedTips.length > 0) {
      const cached = cachedTips[0];
      return NextResponse.json({
        subject,
        tips: JSON.parse(cached.content),
        sources: JSON.parse(cached.sources || "[]"),
        cachedAt: cached.cachedAt,
        cacheId: cached.id,
        fromCache: true,
      });
    }

    // If not in cache, trigger Inngest job to generate tips
    await inngest.send({
      name: "tips/request",
      data: {
        subject,
        topic,
        userId,
      },
    });

    // Generate tips immediately for the response with retry logic
    const tipsResponse = await retryWithBackoff(
      () => geminiService.generateTips(subject, topic),
      { maxRetries: 2 }
    );

    // Cache the tips for 7 days
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const insertResult = await db.insert(tipsCache).values({
      subject,
      topic: topic || "",
      content: JSON.stringify(tipsResponse.tips),
      sources: JSON.stringify(tipsResponse.sources),
      cachedAt: new Date(),
      expiresAt,
    }).returning();

    return NextResponse.json({
      subject,
      tips: tipsResponse.tips,
      sources: tipsResponse.sources,
      cachedAt: tipsResponse.cachedAt,
      cacheId: insertResult[0]?.id,
      fromCache: false,
    });
  } catch (error) {
    console.error("Tips API error:", formatErrorForLogging(error));
    
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
