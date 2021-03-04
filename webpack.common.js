const HtmlWebpackPlugin = require('html-webpack-plugin')
const webpack = require('webpack')
const path = require('path')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')
const CopyPlugin = require('copy-webpack-plugin')
const dotenv = require('dotenv')

const dotenvConfig = dotenv && dotenv.config && dotenv.config()
const env = (dotenvConfig && dotenvConfig.parsed) || process.env
const clientEnvKeys = ['BASENAME']
const envKeys = Object.keys(env).reduce((prev, next) => {
  if (clientEnvKeys.indexOf(next) > -1) {
    prev[`process.env.${next}`] = JSON.stringify(env[next])
  }
  return prev
}, {})

module.exports = {
  entry: './client/index.tsx',
  output: {
    filename: 'bundle.[fullhash].js',
    path: path.resolve(__dirname, 'dist'),
    publicPath: '/',
  },
  performance: { hints: false },
  plugins: [
    new webpack.DefinePlugin(envKeys),
    new CleanWebpackPlugin(),
    new CopyPlugin(['./public']),
    new HtmlWebpackPlugin({ template: './public/index.html' }),
  ],
  resolve: {
    modules: [__dirname, 'client', 'node_modules'],
    extensions: ['*', '.js', '.jsx', '.tsx', '.ts'],
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        loader: require.resolve('babel-loader'),
      },
      {
        test: /\.(png|svg|jpg|gif)$/,
        use: ['file-loader'],
      },
    ],
  },
}
