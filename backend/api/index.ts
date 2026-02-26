/**
 * Vercel Serverless 薄入口 — 仅 re-export 预打包产物，避免 Vercel 直接打包带 @/ 的源码。
 * 所有流量通过 vercel.json 的 rewrite 指向本函数。
 */
// @ts-expect-error 预打包产物为 .mjs，无类型声明
export { default, config } from '../dist/index.mjs';
