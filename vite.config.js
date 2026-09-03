import { defineConfig } from "vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import babel from "@rolldown/plugin-babel";

// ................ Vite configuration ................
export default defineConfig({
  base: "/github-pr-dashboard/",
  plugins: [react(), babel({ presets: [reactCompilerPreset()] })],
});
