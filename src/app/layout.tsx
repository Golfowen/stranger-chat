import type { Metadata, Viewport } from "next";
import "./globals.css";
import Providers from "@/components/Providers";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#11110B",
};

export const metadata: Metadata = {
  title: "StrangerChat — Chat with Strangers",
  description: "Connect with strangers anonymously or openly. Make new friends, find matches, and chat freely. Free forever, no ads.",
  keywords: "chat, strangers, anonymous, social, friends, dating, random chat, meet people",
  authors: [{ name: "StrangerChat" }],
  creator: "StrangerChat",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "StrangerChat",
  },
  openGraph: {
    type: "website",
    title: "StrangerChat — Chat with Strangers",
    description: "Connect with strangers anonymously or openly. Make new friends, find matches, and chat freely.",
    siteName: "StrangerChat",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "StrangerChat — Chat with Strangers",
    description: "Connect with strangers anonymously or openly. Free forever.",
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/icons/icon-192.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      </head>
      <body className="min-h-full flex flex-col antialiased" style={{ backgroundColor: '#11110B' }}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
