import typescript from 'rollup-plugin-typescript2'
import json from '@rollup/plugin-json'
import { dts } from 'rollup-plugin-dts'
import { babel } from '@rollup/plugin-babel'
import { codecovRollupPlugin } from '@codecov/rollup-plugin'
import { config } from 'dotenv'

config({ path: '../../.env' })

export default [
  // Main SDK build
  {
    input: './src/index.ts',
    external: ['ms'],
    output: [
      { file: './dist/index.cjs', format: 'cjs' },
      { file: './dist/index.mjs', format: 'es' }
    ],
    plugins: [
      typescript(),
      json(),
      babel({
        extensions: ['.ts'],
        plugins: ['@babel/plugin-syntax-import-attributes'],
        babelHelpers: 'bundled',
        presets: ['@babel/preset-env']
      }),
      codecovRollupPlugin({
        enableBundleAnalysis: process.env.CODECOV_TOKEN !== undefined,
        bundleName: 'sdk',
        uploadToken: process.env.CODECOV_TOKEN,
        debug: true,
        uploadOverrides: {
          sha: process.env.GH_COMMIT_SHA
        }
      })
    ]
  },
  {
    input: './src/index.ts',
    output: [{ file: './dist/index.d.ts', format: 'es' }],
    plugins: [dts()]
  },
  // Papi folder build
  {
    input: './src/papi/index.ts',
    external: ['ms'],
    output: [
      { file: './dist/papi/index.cjs', format: 'cjs' },
      { file: './dist/papi/index.mjs', format: 'es' }
    ],
    plugins: [
      typescript(),
      json(),
      babel({
        extensions: ['.ts'],
        plugins: ['@babel/plugin-syntax-import-attributes'],
        babelHelpers: 'bundled',
        presets: ['@babel/preset-env']
      })
    ]
  },
  {
    input: './src/papi/index.ts',
    output: [{ file: './dist/papi/index.d.ts' }],
    plugins: [
      dts({
        compilerOptions: {
          preserveSymlinks: false
        }
      })
    ]
  }
]
