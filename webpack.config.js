const path = require('path')

module.exports = {
  mode: 'production',
  entry: {
    index: path.resolve(__dirname, 'dist', 'index.js'),
  },
  output: {
    path: path.resolve(__dirname, 'dist.umd'),
    filename: '[name].min.js',
    libraryTarget: 'umd',
    library: 'jssdk',
    umdNamedDefine: true,
    globalObject: 'this',
  },
}
