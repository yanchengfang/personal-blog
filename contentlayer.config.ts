import {
  defineDocumentType,
  ComputedFields,
  makeSource,
} from "contentlayer2/source-files";
import { readFileSync, writeFileSync } from "fs";
import readingTime from "reading-time";
import { slug } from "github-slugger";
import path from "path";
import { fromHtmlIsomorphic } from "hast-util-from-html-isomorphic";
// Remark packages
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import { remarkAlert } from "remark-github-blockquote-alert";
import {
  remarkExtractFrontmatter,
  remarkCodeTitles,
  remarkImgToJsx,
  extractTocHeadings,
} from "pliny/mdx-plugins/index.js";
// Rehype packages
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeKatex from "rehype-katex";
import rehypeKatexNoTranslate from "rehype-katex-notranslate";
import rehypeCitation from "rehype-citation";
import rehypePrismPlus from "rehype-prism-plus";
import rehypePresetMinify from "rehype-preset-minify";
import siteMetadata from "./data/siteMetadata";
import { allCoreContent, sortPosts } from "pliny/utils/contentlayer.js";
import prettier from "prettier";
import fs from "fs-extra";


const root = process.cwd();
const isProduction = process.env.NODE_ENV === "production";

const readJsonFn = (filePath: string) => {
  const relativePath = filePath.startsWith("/") ? filePath.substring(1) : filePath;
  const absolutePath = path.join(root, relativePath);
  return JSON.parse(readFileSync(absolutePath, "utf8"));
};

// heroicon mini linkl
const icon = fromHtmlIsomorphic(
  `
  <span class="content-header-link">
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 linkicon">
  <path d="M12.232 4.232a2.5 2.5 0 0 1 3.536 3.536l-1.225 1.224a.75.75 0 0 0 1.061 1.06l1.224-1.224a4 4 0 0 0-5.656-5.656l-3 3a4 4 0 0 0 .225 5.865.75.75 0 0 0 .977-1.138 2.5 2.5 0 0 1-.142-3.667l3-3Z" />
  <path d="M11.603 7.963a.75.75 0 0 0-.977 1.138 2.5 2.5 0 0 1 .142 3.667l-3 3a2.5 2.5 0 0 1-3.536-3.536l1.225-1.224a.75.75 0 0 0-1.061-1.06l-1.224 1.224a4 4 0 1 0 5.656 5.656l3-3a4 4 0 0 0-.225-5.865Z" />
  </svg>
  </span>
`,
  { fragment: true },
);

const computedFields: ComputedFields = {
  readingTime: { type: "json", resolve: (doc) => readingTime(doc.body.raw) },
  slug: {
    type: "string",
    resolve: (doc) => {
      if (doc.type === 'Authors') {
        return doc._raw.flattenedPath.split('/').slice(1).join('/');
      }
      // 对于 Blog，路径通常是 blog/zh/posts/slug，所以我们需要去掉前三部分
      return doc._raw.flattenedPath.split("/").slice(3).join("/");
    },
  },
  path: {
    type: "string",
    resolve: (doc) => doc._raw.flattenedPath,
  },
  filePath: {
    type: "string",
    resolve: (doc) => doc._raw.sourceFilePath,
  },
  toc: { type: "json", resolve: (doc) => extractTocHeadings(doc.body.raw) },
};

/**
 * Count the occurrences of all tags across blog posts and write to json file
 */
async function createTagCount(allBlogs) {
  const tagCount: Record<string, Record<string, number>> = {};
  allBlogs.forEach((file) => {
    if (file.tags && (!isProduction || file.draft !== true)) {
      const lang = file.language || 'zh'; // 默认语言为 zh
      if (!tagCount[lang]) {
        tagCount[lang] = {};
      }
      file.tags.forEach((tag) => {
        const formattedTag = slug(tag);
        if (formattedTag in tagCount[lang]) {
          tagCount[lang][formattedTag] += 1;
        } else {
          tagCount[lang][formattedTag] = 1;
        }
      });
    }
  });
  const formatted = await prettier.format(JSON.stringify(tagCount, null, 2), {
    parser: "json",
  });
  writeFileSync("./app/tag-data.json", formatted);
}

function createSearchIndex(allBlogs) {
  if (
    siteMetadata?.search?.provider === "kbar" &&
    siteMetadata.search.kbarConfig.searchDocumentsPath
  ) {
    writeFileSync(
      `public/${path.basename(siteMetadata.search.kbarConfig.searchDocumentsPath)}`,
      JSON.stringify(allCoreContent(sortPosts(allBlogs))),
    );
    console.log("Local search index generated...");
  }
}

export const Blog = defineDocumentType(() => ({
  name: "Blog",
  filePathPattern: "blog/**/posts/*.mdx",
  contentType: "mdx",
  fields: {
    title: { type: "string", required: true },
    date: { type: "date", required: true },
    tags: { type: "list", of: { type: "string" }, default: [] },
    lastmod: { type: "date" },
    draft: { type: "boolean" },
    summary: { type: "string" },
    images: { type: "json" },
    authors: { type: "list", of: { type: "string" } },
    layout: { type: "string" },
    bibliography: { type: "string" },
    canonicalUrl: { type: "string" },
  },
  computedFields: {
    ...computedFields,
    // 从文件路径中提取语言 (en 或 zh)
    language: {
      type: 'string',
      resolve: (doc) => {
        // 文件路径格式: content/en/posts/hello-world.mdx
        const pathParts = doc._raw.sourceFilePath.split('/')
        return pathParts[1] // 返回 'en' 或 'zh'
      },
    },
    structuredData: {
      type: "json",
      resolve: (doc) => ({
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        headline: doc.title,
        datePublished: doc.date,
        dateModified: doc.lastmod || doc.date,
        description: doc.summary,
        image: doc.images ? doc.images[0] : siteMetadata.socialBanner,
        url: `${siteMetadata.siteUrl}/${doc._raw.flattenedPath}`,
      }),
    },
  },
}));

// 定义标签文档类型（处理 JSON 文件）
export const Tags = defineDocumentType(() => {
  const tagObj = readJsonFn("/data/blog/zh/tags.json");
  const tagsList = Object.keys(tagObj);
  return {
    name: 'Tags',
    filePathPattern: `blog/**/tags.json`, // 匹配所有语言目录下的 tags.json
    contentType: 'data', // 指定为 JSON 数据文件
    fields: tagsList.reduce((acc, tag) => {
      acc[tag] = { type: 'string' };
      return acc;
    }, {}),
    computedFields: {
      // 同样从路径中提取语言
      language: {
        type: 'string',
        resolve: (doc) => {
          const pathParts = doc._raw.sourceFilePath.split('/')
          return pathParts[1] // 返回 'en' 或 'zh'
        },
      },
      // 获取所有标签的映射
      tagsMap: {
        type: 'json',
        resolve: (doc) => {
          // 在 contentType: 'data' 中，字段直接映射到 doc 对象上
          // 我们可以通过过滤掉内部字段来获取原始数据
          const { _id, _raw, type, ...data } = doc;
          return data;
        },
      },
    },
  }
})

export const Authors = defineDocumentType(() => ({
  name: "Authors",
  filePathPattern: "authors/**/*.mdx",
  contentType: "mdx",
  fields: {
    name: { type: "string", required: true },
    avatar: { type: "string" },
    occupation: { type: "string" },
    company: { type: "string" },
    email: { type: "string" },
    twitter: { type: "string" },
    bluesky: { type: "string" },
    linkedin: { type: "string" },
    github: { type: "string" },
    layout: { type: "string" },
  },
  computedFields,
}));

export default makeSource({
  contentDirPath: "data",
  documentTypes: [Blog, Tags, Authors],
  mdx: {
    cwd: process.cwd(),
    remarkPlugins: [
      remarkExtractFrontmatter,
      remarkGfm,
      remarkCodeTitles,
      remarkMath,
      remarkImgToJsx,
      remarkAlert,
    ],
    rehypePlugins: [
      rehypeSlug,
      [
        rehypeAutolinkHeadings,
        {
          behavior: "prepend",
          headingProperties: {
            className: ["content-header"],
          },
          content: icon,
        },
      ],
      rehypeKatex,
      rehypeKatexNoTranslate,
      [rehypeCitation, { path: path.join(root, "data") }],
      [rehypePrismPlus, { defaultLanguage: "js", ignoreMissing: true }],
      rehypePresetMinify,
    ],
  },
  onSuccess: async (importData) => {
    const { allBlogs } = await importData();
    createTagCount(allBlogs);
    createSearchIndex(allBlogs);
  },
});
