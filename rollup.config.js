/* eslint-disable import/no-extraneous-dependencies */
/* eslint no-console: 0 */
import { rollup } from 'rollup';
import { babel } from '@rollup/plugin-babel';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import cleanup from 'rollup-plugin-cleanup';

rollup({
  input: 'src/fifo.js',
  external: [
    'react',
    'react-dom',
    'react-datepicker',
    'react-bootstrap-typeahead',
    '@babel/runtime',
  ],
  plugins: [
    nodeResolve({
      mainFields: ['module', 'jsnext', 'browser', 'main'],
    }),
    commonjs(),
    json({
      compact: true,
      exclude: ['node_modules/**'],
    }),
    babel({
      // babelHelpers: 'runtime',
      exclude: 'node_modules/**',
      plugins: [],
    }),
    cleanup({
      comments: 'none',
    }),
  ],
}).then((bundle) => (
  bundle.write({
    file: 'lib/fifo.js',
    format: 'cjs',
    name: 'fifo',
    sourcemap: true,
    exports: 'named',
  })
)).then(() => {
  console.log('Bundle created');
}).catch((e) => {
  console.log(e);
});
