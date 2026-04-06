import { setRequestLocale } from "next-intl/server";
import { slug } from "github-slugger";
import { allCoreContent, sortPosts } from "pliny/utils/contentlayer";
import siteMetadata from "@/data/siteMetadata";
import ListLayout from "@/layouts/ListLayoutWithTags";
import { allBlogs } from "contentlayer/generated";
import tagData from "app/tag-data.json";
import { genPageMetadata } from "app/seo";
import { locales } from "@/i18n/routing";
import { Metadata } from "next";

const POSTS_PER_PAGE = 5;

export async function generateMetadata(props: {
  params: Promise<{ lang: string; tag: string }>;
}): Promise<Metadata> {
  const params = await props.params;
  const tag = decodeURI(params.tag);
  return genPageMetadata({
    title: tag,
    description: `${siteMetadata.title} ${tag} tagged content`,
    alternates: {
      canonical: "./",
      types: {
        "application/rss+xml": `${siteMetadata.siteUrl}/tags/${tag}/feed.xml`,
      },
    },
  });
}

// 按语言从 tag-data 展开真实标签名，与 /tags/[tag]/page/[page] 中 encodeURI(tag) 约定一致
export const generateStaticParams = async () => {
  const tagDataRecord = tagData as Record<string, Record<string, number>>;
  return locales.flatMap((lang) => {
    const langTags = tagDataRecord[lang] || {};
    return Object.keys(langTags)
      .filter((tagKey) => (langTags[tagKey] ?? 0) > 0)
      .map((tagKey) => ({
        lang,
        tag: encodeURI(tagKey),
      }));
  });
};

export default async function TagPage(props: {
  params: Promise<{ lang: string; tag: string }>;
}) {
  const params = await props.params;
  const { lang } = params;
  setRequestLocale(lang);
  const tag = decodeURI(params.tag);
  const title = tag[0].toUpperCase() + tag.split(" ").join("-").slice(1);
  const filteredPosts = allCoreContent(
    sortPosts(
      allBlogs
        .filter(
          (post) => post.tags && post.tags.map((t) => slug(t)).includes(tag),
        )
        .filter((post) => post.language === lang),
    ),
  );
  const totalPages = Math.ceil(filteredPosts.length / POSTS_PER_PAGE);
  const initialDisplayPosts = filteredPosts.slice(0, POSTS_PER_PAGE);
  const pagination = {
    currentPage: 1,
    totalPages: totalPages,
  };

  return (
    <ListLayout
      posts={filteredPosts}
      initialDisplayPosts={initialDisplayPosts}
      pagination={pagination}
      title={title}
    />
  );
}
