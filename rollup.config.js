import {nodeResolve} from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

export default {
  input: 'main.js',
  output: {
    file: "build/main.js",
    format: 'iife',
    globals: {
      'clipping-edges':'clippingEdges',
      'web-ifc-viewer' :'webIfcViewer'
    },
    inlineDynamicImports: true, //Necessary for jspdf
  },
  plugins: [ nodeResolve(), commonjs() ]
};
