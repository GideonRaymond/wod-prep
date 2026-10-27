import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { APP_NAME } from "@/constants/brand";
import { WodProvider } from "@/providers/WodProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  // Each step names itself in the tab ("Check · Chalkup"); the favicon comes from icon.svg,
  // favicon.ico and apple-icon.png in this folder.
  title: { default: APP_NAME, template: `%s · ${APP_NAME}` },
  description:
    "Get ready for today's CrossFit class: break the workout down and build the class around it",
  applicationName: APP_NAME,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <WodProvider>{children}</WodProvider>
      </body>
    </html>
  );
}
