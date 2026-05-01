import Script from 'next/script'

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <Script
        async
        src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1518135456295859"
        crossOrigin="anonymous"
        strategy="afterInteractive"
      />
      {children}
    </>
  )
}
