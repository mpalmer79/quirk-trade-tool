import './globals.css'
import type { Metadata } from 'next'
import { Providers } from './providers'
import Script from 'next/script'

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
      <head>
        {/* SPA redirect for GitHub Pages */}
        <Script id="spa-redirect" strategy="beforeInteractive">
          {`
            (function(){
              var redirect = sessionStorage.redirect;
              delete sessionStorage.redirect;
              if (redirect && redirect != location.href) {
                history.replaceState(null, null, redirect);
              }
            })();
          `}
        </Script>
      </head>
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
