import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'LeetCode Daily Analyzer | Production Dashboard',
  description: 'Production-ready LeetCode Daily Student Analyzer and Snapshot Dashboard',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-[#080A0A] text-[#F2F5F2] antialiased selection:bg-[#B6FF00]/20 selection:text-[#B6FF00]">
        {children}
      </body>
    </html>
  );
}
