import typescript from '@rollup/plugin-typescript';
import dts from 'rollup-plugin-dts';
import { babel } from '@rollup/plugin-babel';
import { codecovRollupPlugin } from '@codecov/rollup-plugin';
import { config } from 'dotenv';

config({ path: '../../.env' });

export default [
  {
    input: './src/index.ts',
    external: ['ms'],
    output: [
      { file: './dist/index.mjs', format: 'es' },
      { file: './dist/index.cjs', format: 'cjs' },
    ],
    plugins: [
      typescript(),
      babel({
        extensions: ['.ts'],
        babelHelpers: 'bundled',
        presets: ['@babel/preset-env'],
      }),
      codecovRollupPlugin({
        enableBundleAnalysis: process.env.CODECOV_TOKEN !== undefined,
        bundleName: 'xcm-analyser',
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
