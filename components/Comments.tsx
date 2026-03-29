"use client";

import { useMemo } from "react";
import { useLocale } from "next-intl";
import { useTheme } from "next-themes";
import Giscus from "@giscus/react";
import type { GiscusProps } from "@giscus/react";
import { Comments as CommentsComponent } from "pliny/comments";
import siteMetadata from "@/data/siteMetadata";

// pliny 依赖内嵌了另一份 next-themes，与根项目 ThemeProvider 非同一会话，内层 useTheme 读不到亮暗；此处直接用 @giscus/react + 根目录 useTheme

const giscusLangByLocale: Record<string, string> = {
  zh: "zh-CN",
  en: "en",
};

export default function Comments({ slug }: { slug: string }) {
  const locale = useLocale();
  const { theme: nextTheme, resolvedTheme } = useTheme();

  const giscusProps = useMemo((): GiscusProps | null => {
    const base = siteMetadata.comments;
    if (!base?.provider || base.provider !== "giscus") return null;
    const cfg = base.giscusConfig;
    if (!cfg.repo || !cfg.repositoryId) return null;

    const themeURL = cfg.themeURL ?? "";
    const isDark = nextTheme === "dark" || resolvedTheme === "dark";
    const commentsTheme =
      themeURL === "" ? (isDark ? cfg.darkTheme : cfg.theme) : themeURL;

    const lang = (giscusLangByLocale[locale] ?? "en") as GiscusProps["lang"];

    return {
      repo: cfg.repo as GiscusProps["repo"],
      repoId: cfg.repositoryId,
      category: cfg.category,
      categoryId: cfg.categoryId,
      mapping: cfg.mapping as GiscusProps["mapping"],
      reactionsEnabled: cfg.reactions as GiscusProps["reactionsEnabled"],
      emitMetadata: cfg.metadata as GiscusProps["emitMetadata"],
      inputPosition: cfg.inputPosition as
        | GiscusProps["inputPosition"]
        | undefined,
      theme: commentsTheme as GiscusProps["theme"],
      lang,
    };
  }, [locale, nextTheme, resolvedTheme]);

  const baseComments = siteMetadata.comments;

  if (!baseComments?.provider) {
    return null;
  }

  if (baseComments.provider !== "giscus") {
    return <CommentsComponent commentsConfig={baseComments} slug={slug} />;
  }

  if (!giscusProps) {
    return null;
  }

  return (
    <Giscus
      key={`giscus-${slug}-${locale}-${resolvedTheme ?? nextTheme ?? "light"}`}
      id="giscus-comments"
      loading="lazy"
      {...giscusProps}
    />
  );
}
