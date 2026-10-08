import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  // ESLint 9's flat config only lints .js/.mjs/.cjs unless a config names
  // other extensions. Most of this app is .jsx, which `next lint` used to
  // skip with "File ignored because no matching configuration was supplied".
  { files: ["**/*.{js,jsx,mjs}"] },
  ...compat.extends("next/core-web-vitals"),
];

export default eslintConfig;
