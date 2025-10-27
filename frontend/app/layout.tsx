import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Quirk Trade Tool - Vehicle Valuation',
  description: 'Multi-source vehicle valuation powered by industry data providers',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
