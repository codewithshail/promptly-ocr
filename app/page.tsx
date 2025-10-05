import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Pill, Upload, FileText, Volume2 } from 'lucide-react';

export default async function Home() {
  const { userId } = await auth();

  if (userId) {
    redirect('/dashboard');
  }

  return (
    <main className="flex min-h-screen flex-col">
      <header className="border-b bg-white shadow-sm">
        <div className="mx-auto flex h-14 sm:h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <Pill className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
            <span className="text-base sm:text-xl font-bold text-gray-900 truncate">
              <span className="hidden sm:inline">Prescription Reader</span>
              <span className="sm:hidden">Rx Reader</span>
            </span>
          </div>
          <div className="flex gap-2 sm:gap-4">
            <Link href="/sign-in">
              <Button variant="ghost" size="sm" className="h-9 sm:h-10 text-xs sm:text-sm">
                Sign In
              </Button>
            </Link>
            <Link href="/sign-up">
              <Button size="sm" className="h-9 sm:h-10 text-xs sm:text-sm">
                <span className="hidden xs:inline">Get Started</span>
                <span className="xs:hidden">Start</span>
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="flex flex-1 flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-12 sm:py-16">
        <div className="max-w-4xl text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900 animate-in fade-in duration-500">
            Process Prescriptions Faster
          </h1>
          <p className="mt-4 sm:mt-6 text-sm sm:text-base md:text-lg leading-6 sm:leading-8 text-gray-600 max-w-2xl mx-auto px-4 animate-in fade-in duration-700">
            Upload customer prescriptions, extract text with OCR, and hear them
            read aloud. Designed for medical store staff to serve customers
            efficiently.
          </p>
          <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 animate-in fade-in duration-1000">
            <Link href="/sign-up" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto h-12 sm:h-11 text-base sm:text-lg transition-transform active:scale-[0.98] hover:shadow-lg">
                Get Started
              </Button>
            </Link>
            <Link href="/sign-in" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full sm:w-auto h-12 sm:h-11 text-base sm:text-lg transition-transform active:scale-[0.98] hover:shadow-md">
                Sign In
              </Button>
            </Link>
          </div>

          <div className="mt-12 sm:mt-16 grid gap-6 sm:gap-8 grid-cols-1 sm:grid-cols-3">
            <div className="flex flex-col items-center p-4 rounded-lg transition-transform hover:scale-105">
              <div className="rounded-full bg-blue-100 p-3 transition-transform hover:scale-110">
                <Upload className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
              </div>
              <h3 className="mt-3 sm:mt-4 font-semibold text-sm sm:text-base text-gray-900">
                Upload Prescriptions
              </h3>
              <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-gray-600 px-2">
                Support for images and documents up to 50MB
              </p>
            </div>
            <div className="flex flex-col items-center p-4 rounded-lg transition-transform hover:scale-105">
              <div className="rounded-full bg-blue-100 p-3 transition-transform hover:scale-110">
                <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
              </div>
              <h3 className="mt-3 sm:mt-4 font-semibold text-sm sm:text-base text-gray-900">
                Extract Text
              </h3>
              <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-gray-600 px-2">
                Powered by Mistral OCR for accurate text extraction
              </p>
            </div>
            <div className="flex flex-col items-center p-4 rounded-lg transition-transform hover:scale-105">
              <div className="rounded-full bg-blue-100 p-3 transition-transform hover:scale-110">
                <Volume2 className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
              </div>
              <h3 className="mt-3 sm:mt-4 font-semibold text-sm sm:text-base text-gray-900">
                Listen to Audio
              </h3>
              <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-gray-600 px-2">
                Text-to-speech for hands-free prescription reading
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
