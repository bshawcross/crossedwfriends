import './globals.css'
import type { Metadata } from 'next'
import Script from 'next/script'

export const metadata: Metadata = {
  title: 'Crossed with Friends — Demo',
  description: 'Mobile-first crossword UI demo'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {process.env.NODE_ENV !== 'production' && (
          <Script id="strip-grammarly" strategy="beforeInteractive">
            {`document.body.removeAttribute('data-new-gr-c-s-check-loaded'); document.body.removeAttribute('data-gr-ext-installed');`}
          </Script>
        )}
      </head>
      <body className="min-h-screen antialiased">
        <div className="mx-auto max-w-md">{children}</div>
      </body>
    </html>
  )
}
