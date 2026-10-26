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

/** Roughens chalk lettering on the board (the chalk-text utility); one copy for the whole app. */
function ChalkFilter() {
  return (
    <svg aria-hidden width="0" height="0" className="absolute">
      <filter id="chalk" x="-5%" y="-10%" width="110%" height="120%">
        <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={7} result="n" />
        <feDisplacementMap
          in="SourceGraphic"
          in2="n"
          scale={1.4}
          xChannelSelector="R"
          yChannelSelector="G"
          result="d"
        />
        <feColorMatrix
          in="n"
          type="matrix"
          values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -2 1.85"
          result="m"
        />
        <feComposite in="d" in2="m" operator="in" />
      </filter>
    </svg>
  );
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <ChalkFilter />
        <WodProvider>{children}</WodProvider>
      </body>
    </html>
  );
}
