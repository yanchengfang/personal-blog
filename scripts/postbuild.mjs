import rss from "./rss.mjs";
import path from "node:path";
import fs from "fs-extra";

async function ensureRootIndexForStaticExport() {
  const isStaticExport =
    process.env.STATIC_EXPORT === "true" || process.env.EXPORT === "true";

  if (!isStaticExport) return;

  const outDir = path.resolve(process.cwd(), "out");
  const rootIndexPath = path.join(outDir, "index.html");
  const redirectHtml = `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Redirecting...</title>
    <meta http-equiv="refresh" content="0; url=/zh/" />
    <script>
      window.location.replace("/zh/");
    </script>
  </head>
  <body>
    <p>正在跳转到中文站点：<a href="/zh/">/zh/</a></p>
  </body>
</html>
`;

  await fs.ensureDir(outDir);
  await fs.writeFile(rootIndexPath, redirectHtml, "utf8");
}

async function postbuild() {
  await rss();
  await ensureRootIndexForStaticExport();
}

postbuild();
