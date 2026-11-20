const fs = require("fs");
const path = require("path");
const { minify: minifyHtml } = require("html-minifier-terser");
const CleanCSS = require("clean-css");
const { minify: minifyJs } = require("terser");

const ROOT_DIR = __dirname;
const DIST_DIR = path.join(ROOT_DIR, "dist");

const IGNORE_NAMES = new Set([
  ".git",
  ".github",
  "node_modules",
  "dist",
  "package.json",
  "package-lock.json",
  "build.js",
  ".gitignore"
]);

const cleanCss = new CleanCSS({ level: 1 });

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

async function processFile(srcPath, destPath) {
  const ext = path.extname(srcPath).toLowerCase();
  ensureDir(path.dirname(destPath));

  if (ext === ".html") {
    const rawHtml = fs.readFileSync(srcPath, "utf8");
    const minifiedHtml = await minifyHtml(rawHtml, {
      collapseWhitespace: true,
      removeComments: true,
      minifyCSS: true,
      minifyJS: true
    });
    fs.writeFileSync(destPath, minifiedHtml, "utf8");
    return;
  }

  if (ext === ".css") {
    const rawCss = fs.readFileSync(srcPath, "utf8");
    const result = cleanCss.minify(rawCss);
    fs.writeFileSync(destPath, result.styles || rawCss, "utf8");
    return;
  }

  if (ext === ".js") {
    const rawJs = fs.readFileSync(srcPath, "utf8");
    try {
      const result = await minifyJs(rawJs, {
        compress: true,
        mangle: true
      });
      fs.writeFileSync(destPath, result.code || rawJs, "utf8");
    } catch (err) {
      // কোনো বিশেষ সিনট্যাক্স বা মডিউলে সমস্যা হলে আসল JS কপি রাখবে যাতে বিল্ড না ভাঙে
      console.warn(`Warning minifying ${srcPath}:`, err.message);
      fs.copyFileSync(srcPath, destPath);
    }
    return;
  }

  // বাকি সব ফাইল (JSON, SVG, PNG, XML, Worker/Function ফাইল ইত্যাদি) অপরিবর্তিত কপি হবে
  fs.copyFileSync(srcPath, destPath);
}

async function walkAndBuild(currentDir) {
  const entries = fs.readdirSync(currentDir, { withFileTypes: true });

  for (const entry of entries) {
    if (IGNORE_NAMES.has(entry.name)) {
      continue;
    }

    const srcPath = path.join(currentDir, entry.name);
    const relPath = path.relative(ROOT_DIR, srcPath);
    const destPath = path.join(DIST_DIR, relPath);

    if (entry.isDirectory()) {
      await walkAndBuild(srcPath);
    } else if (entry.isFile()) {
      await processFile(srcPath, destPath);
    }
  }
}

async function main() {
  fs.rmSync(DIST_DIR, { recursive: true, force: true });
  ensureDir(DIST_DIR);
  await walkAndBuild(ROOT_DIR);
  console.log("Build completed successfully into ./dist");
}

main().catch((err) => {
  console.error("Build failed:", err);
  process.exit(1);
});
