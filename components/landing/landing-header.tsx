import Link from "next/link";
import { Button } from "@/components/ui/button";
import { GraduationCap } from "lucide-react";

export function LandingHeader() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b bg-white/80 backdrop-blur-md shadow-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 p-2">
            <GraduationCap className="h-6 w-6 text-white" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            UPSC Aspirant
          </span>
        </div>
        <div className="flex gap-3">
          <Link href="/sign-in">
            <Button variant="ghost" size="sm" className="h-10">
              Sign In
            </Button>
          </Link>
          <Link href="/sign-up">
            <Button
              size="sm"
              className="h-10 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              Get Started
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
