const path = require('path');

module.exports = {
  entry: './client/index.js',
  watch: true,
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, 'dist'),
  },
  // optimization: {
  //   minimize: false
  // },
  // mode: 'development',
};