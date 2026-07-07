import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import './globals.css'
import RootLayoutServer from '@/components/layout/root-layout-server'

export const metadata: Metadata = {
  title: 'CRM - Customer Relationship Management',
  description: 'Manage your sales pipeline, contacts, and deals in one place',
  icons: {
    icon: [
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  colorScheme: 'dark',
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#1c1c1c' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        {/*
          Inline script runs BEFORE React hydrates — reads pref_theme from
          localStorage and applies the dark class immediately, preventing a
          white flash on dark-mode users.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function(){
                try {
                  var t = localStorage.getItem('pref_theme');
                  if (t === 'light') {
                    document.documentElement.classList.remove('dark');
                  } else if (t === 'dark' || !t) {
                    document.documentElement.classList.add('dark');
                  } else {
                    // system
                    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                      document.documentElement.classList.add('dark');
                    } else {
                      document.documentElement.classList.remove('dark');
                    }
                  }
                } catch(e){}
              })();
            `,
          }}
        />
      </head>
      <body className="font-sans antialiased">
        <RootLayoutServer>
          {children}
        </RootLayoutServer>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
