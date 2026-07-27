import typescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

const production = !process.env.ROLLUP_WATCH;

export default {
  input: 'src/main.ts',
  output: {
    file: 'main.js',
    sourcemap: true,
    format: 'cjs'
  },
  plugins: [
    nodeResolve({ browser: true }),
    commonjs(),
    typescript()
  ],
  external: ['obsidian']
};