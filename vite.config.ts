import camelCase        from "camelcase"
import { resolve }      from "node:path"
import { defineConfig } from "vite"
import dts              from "vite-plugin-dts"
import packageJson      from "./package.json"

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
                                },
                                plugins: [ dts({ rollupTypes: true }) ],
                            })
