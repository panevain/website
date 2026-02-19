import { defineConfig } from "vitepress";

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "panevain.dev",
  description: "Matt Newcomer's Personal Site",
  lang: "en-US",
  base: "/",
  head: [["link", { rel: "icon", href: "/favicon.ico" }]],
  cleanUrls: true,
  lastUpdated: true,
  outDir: "../dist",
  cacheDir: "../cache",
  markdown: {},
  vite: {},
  vue: {},
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [{ text: "Home", link: "/" }],
    editLink: {
      pattern: "https://github.com/panevain/website/edit/main/pages/:path",
    },
    socialLinks: [
      { icon: "github", link: "https://github.com/panevain/website" },
    ],
  },
});
