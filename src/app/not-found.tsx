import { Logo } from "@/components/Logo";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="text-center">
        <Logo size="lg" />
        <h1 className="text-6xl font-bold mt-8 mb-4">404</h1>
        <p className="text-gray-400 mb-8">This page doesn&apos;t exist.</p>
        <Link
          href="/"
          className="px-6 py-3 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-medium transition-all"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}
