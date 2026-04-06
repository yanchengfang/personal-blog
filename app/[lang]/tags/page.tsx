import { setRequestLocale } from "next-intl/server";
import Link from "@/components/Link";
import Tag from "@/components/Tag";
import { slug } from "github-slugger";
import tagData from "app/tag-data.json";
import { genPageMetadata } from "app/seo";
import { getTranslations } from "next-intl/server";

export const metadata = genPageMetadata({
  title: "Tags",
  description: "Things I blog about",
});

export default async function Page({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  setRequestLocale(lang);
  const tNav = await getTranslations("nav");
  const tl = await getTranslations("list");
  const a11y = await getTranslations("a11y");
  const tagDataRecord = tagData as Record<string, Record<string, number>>;
  const tagCounts = tagDataRecord[lang] || {};
  const tagKeys = Object.keys(tagCounts);
  const sortedTags = tagKeys.sort((a, b) => tagCounts[b] - tagCounts[a]);

  return (
    <>
      <div className="flex flex-col items-start justify-start divide-y divide-gray-200 md:mt-24 md:flex-row md:items-center md:justify-center md:space-x-6 md:divide-y-0 dark:divide-gray-700">
        <div className="space-x-2 pt-6 pb-8 md:space-y-5">
          <h1 className="text-3xl leading-9 font-extrabold tracking-tight text-gray-900 sm:text-4xl sm:leading-10 md:border-r-2 md:px-6 md:text-6xl md:leading-14 dark:text-gray-100">
            {tNav("tags")}
          </h1>
        </div>
        <div className="flex max-w-lg flex-wrap">
          {tagKeys.length === 0 && tl("no-tags")}
          {sortedTags.map((tag) => {
            return (
              <div key={tag} className="mt-2 mr-5 mb-2">
                <Tag text={tag} />
                <Link
                  href={`/tags/${slug(tag)}`}
                  className="-ml-2 text-sm font-semibold text-gray-600 uppercase dark:text-gray-300"
                  aria-label={a11y("view-tagged", { tag })}
                >
                  {` (${tagCounts[tag]})`}
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
