import { defineRouting } from "next-intl/routing";
import { createNavigation } from "next-intl/navigation";

/** 与 generateStaticParams、next.config redirects 共用，修改时需同步 */
export const defaultLocale = "zh" as const;

/** 与 generateStaticParams 共用，避免语言列表多处硬编码 */
export const locales = ["zh", "en"] as const;

export const routing = defineRouting({
  locales: [...locales],
  defaultLocale,
  // 已去掉 middleware，不再根据 Accept-Language / cookie 自动改语言
  localeDetection: false,
});

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
