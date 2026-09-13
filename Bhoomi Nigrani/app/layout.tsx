import { ClerkProvider } from "@clerk/nextjs";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import { ThemeProvider } from "@/lib/theme/ThemeProvider";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bhoomi Sanket — Predictive Analytics for Land Acquisition Delays",
  description:
    "Early warning intelligence system for infrastructure governance under RFCTLARR Act 2013.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <head>
          {/* Inline script to prevent theme flash before hydration */}
          <script
            dangerouslySetInnerHTML={{
              __html: `
                try {
                  var t = localStorage.getItem('bhoomi_sanket_theme');
                  if (t === 'dark') {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch(e) {}
              `,
            }}
          />
        </head>
        <body className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased font-sans">
          <ThemeProvider>
            <LanguageProvider>
              <div className="gov-app-root">{children}</div>
            </LanguageProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
