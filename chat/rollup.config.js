//import { nodeResolve } from '@rollup/plugin-node-resolve';
//import { commonjs } from '@rollup/plugin-commonjs';

export default {
  // the entry point file described above
  input: 'src/index.js',
  // the output for the build folder described above
  output: {
    file: __dirname + '../public/chat_bundle.js',
    // Optional and for development only. This provides the ability to
    // map the built code back to the original source format when debugging.
    sourcemap: 'inline',
    // Configure Rollup to convert your module code to a scoped function
    // that "immediate invokes". See the Rollup documentation for more
    // information: https://rollupjs.org/guide/en/#outputformat
    format: 'iife',
    name: 'MyBundle' ,
  },
  // Add the plugin to map import paths to dependencies
  // installed with npm
  plugins: [ 
//        nodeResolve(),  // so Rollup can find `ms`
//        commonjs(), // so Rollup can convert `ms` to an ES module
 ],
};
