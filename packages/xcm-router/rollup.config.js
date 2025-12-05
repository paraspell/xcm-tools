import typescript from '@rollup/plugin-typescript';
import json from '@rollup/plugin-json';
import dts from 'rollup-plugin-dts';
import { babel } from '@rollup/plugin-babel';
import { codecovRollupPlugin } from '@codecov/rollup-plugin';
import { config } from 'dotenv';

config({ path: '../../.env' });

export default [
  {
    input: './src/index.ts',
    external: ['ms'],
    output: [{ file: './dist/index.mjs', format: 'es' }],
    plugins: [
      typescript(),
      json(),
      babel({
        extensions: ['.ts'],
        plugins: ['@babel/plugin-syntax-import-attributes'],
        babelHelpers: 'bundled',
        presets: ['@babel/preset-env'],
      }),
      codecovRollupPlugin({
        enableBundleAnalysis: process.env.CODECOV_TOKEN !== undefined,
        bundleName: 'xcm-router',
        uploadToken: process.env.CODECOV_TOKEN,
        uploadOverrides: {
          sha: process.env.GH_COMMIT_SHA,
        },
      }),
    ],
  },
  {
    input: './src/index.ts',
    output: [{ file: './dist/index.d.ts', format: 'es' }],
    plugins: [dts()],
  },
];
