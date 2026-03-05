import type { Metadata } from "next";
import { AuthProvider } from "@/components/AuthProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "ZoomMate — Your Real-Time Interview Copilot",
  description:
    "Get instant, AI-powered answers during interviews. ZoomMate listens, transcribes, and generates smart responses in real-time.",
  keywords: ["interview", "copilot", "AI", "real-time", "job interview", "meeting assistant"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased min-h-screen">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
