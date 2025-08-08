import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Crossed with Friends — Demo',
  description: 'Mobile-first crossword UI demo'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <div className="mx-auto max-w-md">{children}</div>
      </body>
    </html>
  )
}
