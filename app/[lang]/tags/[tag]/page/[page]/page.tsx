import { setRequestLocale } from "next-intl/server";
import { slug } from "github-slugger";
import { allCoreContent, sortPosts } from "pliny/utils/contentlayer";
import ListLayout from "@/layouts/ListLayoutWithTags";
import { allBlogs } from "contentlayer/generated";
import tagData from "app/tag-data.json";
import { notFound } from "next/navigation";

const POSTS_PER_PAGE = 5;

export const generateStaticParams = async () => {
  const tagDataRecord = tagData as Record<string, Record<string, number>>;
  const allTags = new Set<string>();

  Object.values(tagDataRecord).forEach((langTags) => {
    Object.keys(langTags).forEach((tag) => allTags.add(tag));
  });

  return Array.from(allTags).flatMap((tag) => {
    // 这里的逻辑稍微复杂，因为我们需要为每个语言生成路径
    // 但 generateStaticParams 是在根部运行的，它需要返回完整的 params 对象
    return ["en", "zh"].flatMap((lang) => {
      const postCount = tagDataRecord[lang]?.[tag] || 0;
      if (postCount === 0) return [];

      const totalPages = Math.max(1, Math.ceil(postCount / POSTS_PER_PAGE));
      return Array.from({ length: totalPages }, (_, i) => ({
        lang,
        tag: encodeURI(tag),
        page: (i + 1).toString(),
      }));
    });
  });
};

export default async function TagPage(props: {
  params: Promise<{ lang: string; tag: string; page: string }>;
}) {
  const params = await props.params;
  const { lang } = params;
  setRequestLocale(lang);
  const tag = decodeURI(params.tag);
  const title = tag[0].toUpperCase() + tag.split(" ").join("-").slice(1);
  const pageNumber = parseInt(params.page);
  const filteredPosts = allCoreContent(
    sortPosts(
      allBlogs.filter(
        (post) =>
          post.language === lang &&
          post.tags &&
          post.tags.map((t) => slug(t)).includes(tag),
      ),
    ),
  );
  const totalPages = Math.ceil(filteredPosts.length / POSTS_PER_PAGE);

  // Return 404 for invalid page numbers or empty pages
  if (pageNumber <= 0 || pageNumber > totalPages || isNaN(pageNumber)) {
    return notFound();
  }
  const initialDisplayPosts = filteredPosts.slice(
    POSTS_PER_PAGE * (pageNumber - 1),
    POSTS_PER_PAGE * pageNumber,
  );
  const pagination = {
    currentPage: pageNumber,
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
