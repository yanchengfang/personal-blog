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
};

type KBarSearchProps = {
  searchDocumentsPath: string | false;
  defaultActions?: Action[];
  onSearchDocumentsLoad?: (json: PostDoc[]) => Action[];
};

function buildActions(
  posts: PostDoc[],
  sectionLabel: string,
  dateLocale: string,
  navigate: (href: string) => void,
  customMap?: (json: PostDoc[]) => Action[],
): Action[] {
  if (customMap) {
    return customMap(posts);
  }
  const actions: Action[] = [];
  for (const post of posts) {
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
  const t = useTranslations("search");
  const { searchDocumentsPath, defaultActions, onSearchDocumentsLoad } =
    kbarConfig;

  const dateLocale = locale === "zh" ? "zh-CN" : "en-US";
  const sectionLabel = t("content");

  const [rawPosts, setRawPosts] = useState<PostDoc[]>([]);
  const [fetchDone, setFetchDone] = useState(() => !searchDocumentsPath);

  useEffect(() => {
    if (!searchDocumentsPath) {
      return;
    }
    let cancelled = false;
    async function load() {
      const url =
        searchDocumentsPath.indexOf("://") > 0 ||
        searchDocumentsPath.indexOf("//") === 0
          ? searchDocumentsPath
          : new URL(searchDocumentsPath, window.location.origin);
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

  const searchActions = useMemo(
    () =>
      rawPosts.length
        ? buildActions(
            rawPosts,
            sectionLabel,
            dateLocale,
            (href) => router.push(href),
            onSearchDocumentsLoad,
          )
        : [],
    [rawPosts, sectionLabel, dateLocale, router, onSearchDocumentsLoad],
  );

  return (
    <KBarProvider actions={defaultActions}>
      <KBarIntlModal actions={searchActions} isLoading={!fetchDone} />
      {children}
    </KBarProvider>
  );
}
