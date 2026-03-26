import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'MCPForge',
  description: 'Convert REST API specs into production-ready MCP server code',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
