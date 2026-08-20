// 代理 @typescript-eslint/parser，注入 TS 相容 parser 執行環境，讓 ESLint 在 TypeScript 7.0+ 專案下無瑕運作
const legacyTs = require('typescript-legacy-parser');

// 將 typescript 模組快取替換為相容 parser，供 @typescript-eslint AST 解析
const tsPath = require.resolve('typescript');
require.cache[tsPath] = {
  id: tsPath,
  filename: tsPath,
  loaded: true,
  exports: legacyTs,
};

module.exports = require('@typescript-eslint/parser');
