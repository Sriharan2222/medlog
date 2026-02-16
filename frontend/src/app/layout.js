import './globals.css';

export const metadata = {
  title: 'MedLog — Medication Logger',
  description: 'Secure medication logging and access system for patients and doctors',
  manifest: '/manifest.json',
  themeColor: '#1a365d',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'MedLog',
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.svg" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body>
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js').catch(() => {});
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
