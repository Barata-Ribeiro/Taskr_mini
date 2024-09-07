import { minify, Options } from "html-minifier-terser"
import { Plugin }          from "vite"

export function htmlMinifyPlugin(options?: Options): Plugin {
    return {
        name: "html-minify-plugin",
        apply: "build",
        transformIndexHtml(html) {
            return minify(html, {
                removeComments: true,
                collapseWhitespace: true,
                collapseBooleanAttributes: true,
                removeAttributeQuotes: false,
                removeEmptyAttributes: true,
                minifyCSS: true,
                minifyJS: true,
                minifyURLs: true,
                ...options,
            })
        },
    }
}