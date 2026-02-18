import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'TimeOS - Workspace Operations Platform',
  description: 'La capa operativa de tu empresa, sin límites por usuario.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
