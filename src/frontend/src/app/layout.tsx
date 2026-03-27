import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'MCPForge',
  description: 'Convert REST API specs into production-ready MCP server code',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="bg-gray-950">
      <body className="min-h-screen bg-gray-950 text-gray-100 font-sans">{children}</body>
    </html>
  );
}
