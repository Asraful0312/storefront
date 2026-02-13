import type { Metadata } from "next";
import { Work_Sans } from "next/font/google";
import "./globals.css";
import ConvexClientProvider from "@/components/ConvexClientProvider";
import { ClerkProvider } from "@clerk/nextjs";
import { ActivePresence } from "@/components/ActivePresence";
import { NuqsAdapter } from "@fobos531/nuqs/adapters/next/app";

const workSans = Work_Sans({
  variable: "--font-work-sans",
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
});

export const metadata: Metadata = {
  title: "Lumina | Modern Home & Living",
  description: "Curated styles for a cozy, modern life. Discover furniture, decor, and home essentials designed to bring warmth and comfort to every corner.",
  icons: {
    icon: "/convex.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${workSans.variable} font-sans antialiased min-h-screen flex flex-col`}>
        <ClerkProvider dynamic>
          <ConvexClientProvider>
            <NuqsAdapter>
              <ActivePresence />
              {children}
            </NuqsAdapter>
          </ConvexClientProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
