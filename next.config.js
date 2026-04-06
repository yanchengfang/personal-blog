const path = require("path");
// pnpm 下 kbar 常在根 node_modules，不一定存在 pliny/node_modules/kbar
const kbarRoot = (() => {
  try {
    return path.dirname(require.resolve("kbar/package.json"));
  } catch {
    return path.resolve(__dirname, "node_modules/pliny/node_modules/kbar");
  }
})();
const { withContentlayer } = require("next-contentlayer2");
const createNextIntlPlugin = require("next-intl/plugin");
const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
});

// You might need to insert additional domains in script-src if you are using external services
const ContentSecurityPolicy = `
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline' giscus.app analytics.umami.is;
  style-src 'self' 'unsafe-inline';
  img-src * blob: data:;
  media-src *.s3.amazonaws.com;
  connect-src *;
  font-src 'self';
  frame-src giscus.app
`;

const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: ContentSecurityPolicy.replace(/\n/g, ""),
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
];

// STATIC_EXPORT/EXPORT：CI 或显式静态发布时启用 output: export（此时无 redirects，由 nginx 处理根路径）
// 本地 next dev / 默认 next build：不设 output，保留 redirects（/ → /zh/）
// Docker 镜像：NEXT_OUTPUT_STANDALONE=true → standalone
const isStaticExport =
  process.env.STATIC_EXPORT === "true" || process.env.EXPORT === "true";

const output =
  process.env.NEXT_OUTPUT_STANDALONE === "true"
    ? "standalone"
    : isStaticExport
      ? "export"
      : undefined;
const isExport = output === "export";
const isStandalone = output === "standalone";

const basePath = process.env.BASE_PATH || undefined;
const unoptimized = process.env.UNOPTIMIZED
  ? true
  : isExport
    ? true
    : undefined;

// 与 i18n/routing.ts 中 defaultLocale 保持一致（无 middleware 时根路径依赖此重定向）
const DEFAULT_LOCALE = "zh";

/**
 * @type {import('next/dist/next-server/server/config').NextConfig}
 **/
module.exports = () => {
  const plugins = [withContentlayer, withBundleAnalyzer, withNextIntl];
  return plugins.reduce((acc, next) => next(acc), {
    output,
    basePath,
    reactStrictMode: true,
    trailingSlash: true,
    // 静态导出（output: export）不支持 redirects；根路径 / 请在 nginx 重定向到 /zh/
    ...(isExport
      ? {}
      : {
          async redirects() {
            return [
              {
                source: "/",
                destination: `/${DEFAULT_LOCALE}/`,
                permanent: false,
              },
            ];
          },
        }),
    turbopack: {
      root: process.cwd(),
      resolveAlias: {
        kbar: kbarRoot,
      },
      rules: {
        "*.svg": {
          loaders: ["@svgr/webpack"],
          as: "*.js",
        },
      },
    },
    pageExtensions: ["ts", "tsx", "js", "jsx", "md", "mdx"],
    ...(isStandalone
      ? {
          // standalone 构建时显式纳入动态 import / contentlayer 生成物
          outputFileTracingIncludes: {
            "/:path*": ["./i18n/**/*", "./.contentlayer/**/*"],
          },
        }
      : {}),
    images: {
      remotePatterns: [
        {
          protocol: "https",
          hostname: "picsum.photos",
        },
      ],
      unoptimized,
    },
    // 静态导出不支持通过 next.config 的 headers 注入 CSP，请在 nginx 配置
    ...(isExport
      ? {}
      : {
          async headers() {
            return [
              {
                source: "/(.*)",
                headers: securityHeaders,
              },
            ];
          },
        }),
    webpack: (config, options) => {
      // 与 pliny 共用 kbar；路径随包管理器变化，用解析结果而非写死嵌套目录
      config.resolve.alias = {
        ...config.resolve.alias,
        kbar: kbarRoot,
      };

      config.module.rules.push({
        test: /\.svg$/,
        use: [
          {
            loader: "@svgr/webpack",
            options: {
              typescript: true,
              icon: true,
            },
          },
        ],
      });

      return config;
    },
  });
};
