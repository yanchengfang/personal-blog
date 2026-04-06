import "css/tailwind.css";
import "pliny/search/algolia.css";
import "remark-github-blockquote-alert/alert.css";

import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { Space_Grotesk } from "next/font/google";
import { Analytics, AnalyticsConfig } from "pliny/analytics";
import type { SearchConfig } from "pliny/search";
import AppSearchProvider from "@/components/search/AppSearchProvider";
import Header from "@/components/Header";
import SectionContainer from "@/components/SectionContainer";
import Footer from "@/components/Footer";
import siteMetadata from "@/data/siteMetadata";
import { locales } from "@/i18n/routing";
import { ThemeProviders } from "./theme-providers";
import { Metadata } from "next";

/** 为 `[lang]` 段枚举所有语言，子路由共享静态生成（首页 /about /projects /blog /tags 等） */
export async function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

const space_grotesk = Space_Grotesk({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-space-grotesk",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteMetadata.siteUrl),
  title: {
    default: siteMetadata.title,
    template: `%s | ${siteMetadata.title}`,
  },
  description: siteMetadata.description,
  openGraph: {
    title: siteMetadata.title,
    description: siteMetadata.description,
    url: "./",
    siteName: siteMetadata.title,
    images: [siteMetadata.socialBanner],
    locale: "en_US",
    type: "website",
  },
  alternates: {
    canonical: "./",
    types: {
      "application/rss+xml": `${siteMetadata.siteUrl}/feed.xml`,
    },
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  twitter: {
    title: siteMetadata.title,
    card: "summary_large_image",
    images: [siteMetadata.socialBanner],
  },
};

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const basePath = process.env.BASE_PATH || "";

  // 启用静态渲染
  setRequestLocale(lang);

  // 获取当前语言的翻译消息
  const messages = await getMessages();

  return (
    <html
      lang={lang}
      className={`${space_grotesk.variable} scroll-smooth`}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <link
        rel="apple-touch-icon"
        sizes="76x76"
        href={`${basePath}/static/favicons/favicon.png`}
      />
      <link
        rel="icon"
        type="image/png"
        sizes="32x32"
        href={`${basePath}/static/favicons/favicon.png`}
      />
      <link
        rel="icon"
        type="image/png"
        sizes="16x16"
        href={`${basePath}/static/favicons/favicon.png`}
      />
      <link
        rel="manifest"
        href={`${basePath}/static/favicons/site.webmanifest`}
      />
      <link
        rel="mask-icon"
        href={`${basePath}/static/favicons/safari-pinned-tab.svg`}
        color="#5bbad5"
      />
      <meta name="msapplication-TileColor" content="#000000" />
      <meta
        name="theme-color"
        media="(prefers-color-scheme: light)"
        content="#fff"
      />
      <meta
        name="theme-color"
        media="(prefers-color-scheme: dark)"
        content="#000"
      />
      <link
        rel="alternate"
        type="application/rss+xml"
        href={`${basePath}/feed.xml`}
      />
      <body className="bg-white pl-[calc(100vw-100%)] text-black antialiased dark:bg-gray-950 dark:text-white">
        <NextIntlClientProvider messages={messages}>
          <ThemeProviders>
            <Analytics
              analyticsConfig={siteMetadata.analytics as AnalyticsConfig}
            />
            <SectionContainer>
              <AppSearchProvider
                searchConfig={siteMetadata.search as SearchConfig}
              >
                <Header />
                <main className="mb-auto">{children}</main>
              </AppSearchProvider>
              <Footer />
            </SectionContainer>
          </ThemeProviders>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
