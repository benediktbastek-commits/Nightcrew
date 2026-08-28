import type { Metadata, Viewport } from 'next';
import './globals.css';
import { RegisterServiceWorker } from './register-sw';

export const metadata: Metadata = {
  title: 'Nightcrew',
  description: 'Die App für DJs, Producer und Eventfotograf:innen: Bookings, Content, Releases, Finanzen und Tour-Logistik an einem Ort.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Nightcrew',
  },
};

export const viewport: Viewport = {
  themeColor: '#0e0f0e',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="de">
      <body>
        {children}
        <RegisterServiceWorker />
      </body>
    </html>
  );
}