"use client";

import type { Action } from "kbar";
import { KBarProvider } from "kbar";
import { useRouter } from "@/i18n/routing";
import { useLocale, useTranslations } from "next-intl";
import { formatDate } from "pliny/utils/formatDate";
import { useEffect, useMemo, useState } from "react";
import { KBarIntlModal } from "./KBarIntlModal";

type PostDoc = {
  path: string;
  title: string;
  summary?: string;
  date: string;
  slug: string;
  language?: string;
};

type KBarSearchProps = {
  searchDocumentsPath: string | false;
  defaultActions?: Action[];
  onSearchDocumentsLoad?: (json: PostDoc[]) => Action[];
};

function buildActions(
  posts: PostDoc[],
  sectionLabelByLanguage: Record<string, string>,
  locale: string,
  dateLocale: string,
  navigate: (href: string) => void,
  customMap?: (json: PostDoc[]) => Action[],
): Action[] {
  if (customMap) {
    return customMap(posts);
  }
  const actions: Action[] = [];
  for (const post of posts) {
    const language = post.language === "zh" ? "zh" : "en";
    const sectionLabel =
      sectionLabelByLanguage[language] ?? sectionLabelByLanguage[locale];
    actions.push({
      id: post.path,
      name: post.title,
      keywords: post.summary ?? "",
      section: sectionLabel,
      subtitle: formatDate(post.date, dateLocale),
      perform: () => navigate(`/blog/${post.slug}`),
    });
  }
  return actions;
}

export function KBarIntlProvider({
  kbarConfig,
  children,
}: {
  kbarConfig: KBarSearchProps;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const locale = useLocale();
  const tSearch = useTranslations("search");
  const tLang = useTranslations("lang");
  const { searchDocumentsPath, defaultActions, onSearchDocumentsLoad } =
    kbarConfig;

  const dateLocale = locale === "zh" ? "zh-CN" : "en-US";
  const sectionLabelByLanguage = useMemo(
    () => ({
      zh: `${tSearch("content")} · ${tLang("label-zh")}`,
      en: `${tSearch("content")} · ${tLang("label-en")}`,
    }),
    [tSearch, tLang],
  );

  const [rawPosts, setRawPosts] = useState<PostDoc[]>([]);
  const [fetchDone, setFetchDone] = useState(() => !searchDocumentsPath);

  useEffect(() => {
    if (!searchDocumentsPath) {
      return;
    }
    const docPath = searchDocumentsPath;
    let cancelled = false;
    async function load() {
      const url =
        docPath.indexOf("://") > 0 || docPath.indexOf("//") === 0
          ? docPath
          : new URL(docPath, window.location.origin);
      const res = await fetch(url);
      const json = (await res.json()) as PostDoc[];
      if (!cancelled) {
        setRawPosts(json);
        setFetchDone(true);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [searchDocumentsPath]);

  const searchActions = useMemo(() => {
    if (!rawPosts.length) {
      return [];
    }
    const filteredPosts = rawPosts.filter(
      (post) => (post.language === "zh" ? "zh" : "en") === locale,
    );
    return buildActions(
      filteredPosts,
      sectionLabelByLanguage,
      locale,
      dateLocale,
      (href) => router.push(href),
      onSearchDocumentsLoad,
    );
  }, [
    rawPosts,
    sectionLabelByLanguage,
    locale,
    dateLocale,
    router,
    onSearchDocumentsLoad,
  ]);

  return (
    <KBarProvider actions={defaultActions}>
      <KBarIntlModal actions={searchActions} isLoading={!fetchDone} />
      {children}
    </KBarProvider>
  );
}
