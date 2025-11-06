import './globals.css'
import type { Metadata } from 'next'
import { Providers } from './providers'
import Script from 'next/script'
import Footer from '@/components/Footer'  // <-- add

export const metadata: Metadata = {
  title: 'Quirk Trade Tool - Vehicle Valuation',
  description: 'Multi-source vehicle valuation powered by industry data providers',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
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
      <body className="min-h-screen flex flex-col">
        <Providers>
          <div className="flex-1">{children}</div>
          <Footer /> {/* <-- global footer */}
        </Providers>
      </body>
    </html>
  )
}
