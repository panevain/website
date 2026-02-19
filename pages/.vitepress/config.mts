import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "panevain.dev",
  description: "Matt Newcomer's Personal Site",
  lang: 'en-US',
  base: '/',
  head: [],
  cleanUrls: true, 
  lastUpdated: true,
  outDir: '../dist',
  cacheDir: '../cache',
  markdown: {},
  vite: {}, vue: {},
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home', link: '/' },
    ],


    socialLinks: [
      { icon: 'github', link: 'https://github.com/panevain/website' }
    ]
  }
})
