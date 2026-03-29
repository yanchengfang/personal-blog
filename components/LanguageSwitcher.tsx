"use client";

import { usePathname, useRouter } from "@/i18n/routing";
import { useParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";

export default function LanguageSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const locale = useLocale();
  const t = useTranslations("lang");

  const switchLanguage = (nextLocale: string) => {
    if (nextLocale === locale) return;
    router.replace(
      // @ts-expect-error pathname 与 params 保持不变，仅切换 locale
      { pathname, params },
      { locale: nextLocale },
    );
  };

  return (
    <label className="flex items-center gap-1.5">
      <span className="sr-only">{t("language-select")}</span>
      <select
        value={locale}
        aria-label={t("language-select")}
        onChange={(e) => switchLanguage(e.target.value)}
        className="focus:border-primary-500 focus:ring-primary-500 h-9 cursor-pointer rounded-md border border-gray-300 bg-white py-1 pr-8 pl-2 text-sm text-gray-900 focus:ring-1 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
      >
        <option value="zh">{t("label-zh")}</option>
        <option value="en">{t("label-en")}</option>
      </select>
    </label>
  );
}
