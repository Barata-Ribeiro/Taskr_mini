import camelCase            from "camelcase"
import { resolve }          from "node:path"
import { defineConfig }     from "vite"
import dts                  from "vite-plugin-dts"
import packageJson          from "./package.json"
import { htmlMinifyPlugin } from "./src/html-minify-plugin"

const packageName = packageJson.name.split("/").pop() ?? packageJson.name

export default defineConfig({
                                publicDir: "public",
                                build: {
                                    lib: {
                                        entry: resolve(__dirname, "src/index.ts"),
                                        formats: [ "es", "cjs", "umd", "iife" ],
                                        name: camelCase(packageName, { pascalCase: true }),
                                        fileName: packageName,
                                    },
                                    rollupOptions: {
                                        input: {
                                            main: resolve(__dirname, "index.html"),
                                        },
                                    },
                                    minify: "terser",
                                    terserOptions: {
                                        maxWorkers: 1,
                                        ecma: 5,
                                        enclose: false,
                                        keep_classnames: false,
                                        keep_fnames: false,
                                        ie8: true,
                                        module: true,
                                        safari10: true,
                                        toplevel: true,
                                    },
                                    
                                },
                                plugins: [ dts({ rollupTypes: true }), htmlMinifyPlugin() ],
                            })
