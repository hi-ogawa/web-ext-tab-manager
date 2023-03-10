import path from "node:path";
import react from "@vitejs/plugin-react";
import unocss from "unocss/vite";
import { IndexHtmlTransform, defineConfig } from "vite";
import type { Plugin } from "vite";

export default defineConfig({
  appType: "mpa",
  build: {
    sourcemap: true,
    rollupOptions: {
      input: {
        options: path.resolve(__dirname, "src/options/index.html"),
        popup: path.resolve(__dirname, "src/popup/index.html"),
      },
    },
  },
  plugins: [unocss(), react(), injectThemeScriptPlugin()],
});

function injectThemeScriptPlugin(): Plugin {
  return {
    name: injectThemeScriptPlugin.name,
    transformIndexHtml: (html) => {
      return html;
      // return html.replace("<inject-theme-script />", "");
    },
  };
}
