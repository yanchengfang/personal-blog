import { setRequestLocale } from 'next-intl/server';
import { sortPosts, allCoreContent } from "pliny/utils/contentlayer";
import { allBlogs } from "contentlayer/generated";
import Main from "./Main";

export default async function Page({
  params
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  setRequestLocale(lang);
  const sortedPosts = sortPosts(allBlogs);
  const posts = allCoreContent(sortedPosts).filter(i => i.language === lang);

  return <Main posts={posts} />;
}
