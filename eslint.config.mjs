import next from "eslint-config-next/core-web-vitals";
import ts from "eslint-config-next/typescript";
const config = [...next, ...ts, { ignores: ["out/**", ".next/**", "next-env.d.ts"] }];
export default config;
