import '@/app/globals.css'
import { Header } from '@/components/Header'
import { Providers } from '@/components/Providers'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import '@rainbow-me/rainbowkit/styles.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'AAutoBridge',
  description: 'Auto cross rollup bridge with Account Abstraction',
  icons: {
    icon: '/images/favicon.ico',
  },
  openGraph: {
    title: 'AAutoBridge',
    description: 'Auto cross rollup bridge with Account Abstraction',
    images: ['https://aauto-bridge-monorepo.vercel.app/images/cover.png'],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <Header />
          {children}
        </Providers>
      </body>
    </html>
  )
}
