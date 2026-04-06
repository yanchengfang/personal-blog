import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

type Locale = (typeof routing.locales)[number];

function isValidLocale(value: string): value is Locale {
  return (routing.locales as readonly string[]).includes(value);
}

export default getRequestConfig(async ({ requestLocale }) => {
  // 无 middleware 时 locale 主要来自 URL 段 [lang]；requestLocale 由 next-intl 与路由对齐
  let locale = await requestLocale;

  // 确保使用受支持的语言，非法值回退到默认语言
  if (!locale || !isValidLocale(locale)) {
    locale = routing.defaultLocale;
  }

  return {
    locale,
    messages: (await import(`./${locale}.json`)).default,
  };
});
