import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'LeetCode Daily Analyzer | Student Performance Dashboard',
  description:
    'Comprehensive daily LeetCode tracking and analytics system with department hierarchies, leaderboards, and immutable snapshot comparisons.',
  keywords: ['LeetCode', 'Student Tracker', 'Daily Snapshot', 'Performance Analyzer', 'Department Analytics'],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`dark ${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="min-h-screen bg-[#080A0A] text-[#F2F5F2] font-sans antialiased selection:bg-[#B6FF00] selection:text-[#080A0A]">
        {children}
      </body>
    </html>
  );
}
