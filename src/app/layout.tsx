import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dinastia · Estruturação de Patrimônio",
  description: "Simulação e estruturação patrimonial com consórcio.",
  applicationName: "Dinastia",
  icons: { icon: [{ url: "/icon.svg", type: "image/svg+xml" }, { url: "/icon-192.png", sizes: "192x192" }], apple: "/apple-icon.png" },
  appleWebApp: { capable: true, title: "Dinastia", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  themeColor: "#0d0540",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&family=Manrope:wght@400;500;600;700&display=swap"
        />
      </head>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
