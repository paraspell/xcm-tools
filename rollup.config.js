import typescript from 'rollup-plugin-typescript2'
import json from '@rollup/plugin-json'
import dts from 'rollup-plugin-dts'
import { babel } from '@rollup/plugin-babel'

export default [
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
        plugins: ['@babel/plugin-syntax-import-assertions'],
        babelHelpers: 'bundled',
        presets: ['@babel/preset-env']
      })
    ]
  },
  {
    input: './src/index.ts',
    output: [{ file: './dist/index.d.ts', format: 'es' }],
    plugins: [dts()]
  }
]
