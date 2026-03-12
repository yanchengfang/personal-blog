import { setRequestLocale } from 'next-intl/server';
import { allCoreContent, sortPosts } from "pliny/utils/contentlayer";
import { allBlogs } from "contentlayer/generated";
import { genPageMetadata } from "app/seo";
import ListLayout from "@/layouts/ListLayoutWithTags";

const POSTS_PER_PAGE = 5;

export const metadata = genPageMetadata({ title: "Blog" });

export default async function BlogPage(props: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ page: string }>;
}) {
  const { lang } = await props.params;
  setRequestLocale(lang);
  const posts = allCoreContent(sortPosts(allBlogs)).filter(i => i.language === lang);
  const pageNumber = 1;
  const totalPages = Math.ceil(posts.length / POSTS_PER_PAGE);
  const initialDisplayPosts = posts.slice(0, POSTS_PER_PAGE * pageNumber);
  const pagination = {
    currentPage: pageNumber,
    totalPages: totalPages,
  };
  return (
    <ListLayout
      posts={posts}
      initialDisplayPosts={initialDisplayPosts}
      pagination={pagination}
      title="All Posts"
    />
  );
}
