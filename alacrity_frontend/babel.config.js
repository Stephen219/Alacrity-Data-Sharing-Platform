// // {
// //   "presets": [
// //     ["@babel/preset-env", { "targets": { "node": "current" } }],
// //     "@babel/preset-react",
// //     "@babel/preset-env",
// //     "@babel/preset-typescript",
// //     ["@babel/preset-react", { "runtime": "automatic" }]
// //   ]
// // }



// // module.exports = {
// //   presets: [
// //     ['@babel/preset-env', {targets: {node: 'current'}}],
// //     '@babel/preset-typescript',
// //     '@babel/preset-react',
// //     ['@babel/preset-react', {runtime: 'automatic'}],
// //   ],
// // };


// // babel.config.js
// // module.exports = {
// //   presets: [
// //     ['@babel/preset-env', { targets: { node: 'current' } }],
// //     '@babel/preset-typescript',
// //     ['@babel/preset-react', { runtime: 'automatic' }],
// //     'next/babel'
// //   ],
// //   plugins: []
// // };


// module.exports = {
//   presets: [
//     ['@babel/preset-env', { 
//       targets: { node: 'current' },
//       modules: 'commonjs', // Ensure CommonJS modules for Jest compatibility
//     }],
//     '@babel/preset-typescript',  // For TypeScript support
//     ['@babel/preset-react', { runtime: 'automatic' }],  // For React JSX transformation
//     'next/babel',  // Use Next.js Babel preset for general compatibility
//   ],
//   plugins: [
//     '@babel/plugin-transform-modules-commonjs',  // Transform ES modules to CommonJS for Jest
//   ],
// };
