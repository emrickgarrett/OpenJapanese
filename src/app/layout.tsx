import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { Noto_Sans_JP } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import { ProfileProvider } from '@/providers/ProfileProvider';
import { ThemeProvider } from '@/providers/ThemeProvider';
import { MascotProvider } from '@/providers/MascotProvider';
import { AudioProvider } from '@/providers/AudioProvider';
import { MascotWidget } from '@/components/mascot/MascotWidget';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

const notoSansJP = Noto_Sans_JP({
  variable: '--font-noto-sans-jp',
  subsets: ['latin'],
  weight: ['400', '500', '700'],
});

export const metadata: Metadata = {
  title: 'OpenJapanese - Learn Japanese the Fun Way',
  description:
    'Master Japanese with smart SRS, fun mini-games, and detailed progress tracking. From JLPT N5 to N1, learn kanji, vocabulary, and grammar the engaging way.',
};

// Blocking script that applies the theme before first paint to prevent FOUC
const themeScript = `
(function() {
  try {
    var theme = localStorage.getItem('oj_theme') || 'light';
    var dark = theme === 'dark' || (theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (dark) document.documentElement.classList.add('dark');
  } catch(e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${notoSansJP.variable} antialiased`}
      >
        <ThemeProvider>
          <ProfileProvider>
            <MascotProvider>
              <AudioProvider>
                {children}
                <MascotWidget />
                <Toaster
                  position="top-right"
                  toastOptions={{
                    duration: 3000,
                    style: {
                      borderRadius: '12px',
                      background: 'var(--card)',
                      color: 'var(--card-foreground)',
                      border: '1px solid var(--border)',
                    },
                  }}
                />
              </AudioProvider>
            </MascotProvider>
          </ProfileProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
