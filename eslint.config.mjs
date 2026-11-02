import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  // Next.js 16 removed `next lint`; ignore build output the way next lint did.
  { ignores: [".next/**", "node_modules/**", "out/**", "build/**", "REPORT/**"] },
  ...compat.extends("next/core-web-vitals"),
];

export default eslintConfig;
