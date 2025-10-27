import Link from "next/link";
import { GraduationCap } from "lucide-react";

export function LandingFooter() {
  return (
    <footer className="bg-gray-900 text-gray-300 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 p-2">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold text-white">
                UPSC Aspirant
              </span>
            </div>
            <p className="text-gray-400 max-w-md">
              Your complete AI-powered companion for UPSC preparation. Master
              your journey with intelligent tools designed for success.
            </p>
          </div>

          {/* Features */}
          <div>
            <h3 className="text-white font-semibold mb-4">Features</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/sign-up"
                  className="hover:text-white transition-colors"
                >
                  AI Chatbot
                </Link>
              </li>
              <li>
                <Link
                  href="/sign-up"
                  className="hover:text-white transition-colors"
                >
                  Copy Checking
                </Link>
              </li>
              <li>
                <Link
                  href="/sign-up"
                  className="hover:text-white transition-colors"
                >
                  Current Affairs
                </Link>
              </li>
              <li>
                <Link
                  href="/sign-up"
                  className="hover:text-white transition-colors"
                >
                  Tips & Tricks
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-white font-semibold mb-4">Company</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/sign-up"
                  className="hover:text-white transition-colors"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  href="/sign-up"
                  className="hover:text-white transition-colors"
                >
                  Contact
                </Link>
              </li>
              <li>
                <Link
                  href="/sign-up"
                  className="hover:text-white transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/sign-up"
                  className="hover:text-white transition-colors"
                >
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-400">
            © {new Date().getFullYear()} UPSC Aspirant. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm text-gray-400">
            <Link
              href="/sign-up"
              className="hover:text-white transition-colors"
            >
              Privacy
            </Link>
            <Link
              href="/sign-up"
              className="hover:text-white transition-colors"
            >
              Terms
            </Link>
            <Link
              href="/sign-up"
              className="hover:text-white transition-colors"
            >
              Contact
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
