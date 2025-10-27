import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function CTASection() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(255,255,255,0.1),transparent_50%)]" />

      <div className="max-w-4xl mx-auto text-center relative z-10">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6">
          Ready to Transform Your
          <span className="block">UPSC Preparation?</span>
        </h2>
        <p className="text-lg sm:text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
          Join thousands of aspirants who are already using AI to accelerate
          their UPSC journey
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/sign-up" className="w-full sm:w-auto">
            <Button
              size="lg"
              className="w-full sm:w-auto h-14 px-8 text-lg bg-white text-blue-600 hover:bg-gray-100 shadow-xl hover:shadow-2xl transition-all"
            >
              Get Started Now
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <Link href="/sign-in" className="w-full sm:w-auto">
            <Button
              size="lg"
              variant="outline"
              className="w-full sm:w-auto h-14 px-8 text-lg border-2 border-white text-white hover:bg-white/10"
            >
              Sign In
            </Button>
          </Link>
        </div>
        <p className="mt-8 text-sm text-blue-100">
          No credit card required • Free to start • Cancel anytime
        </p>
      </div>
    </section>
  );
}
