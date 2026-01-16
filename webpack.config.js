const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const TerserPlugin = require("terser-webpack-plugin");

module.exports = (env, arg) => {
  const mode = arg.mode;

  return {
    mode: mode === 'production' ? mode : 'development',
    devtool: mode === 'development' ? 'inline-source-map' : false,
    entry: {
      'pop-up': './src/pop-up/modules/script.ts',
      background: './src/extension/modules/background.ts',
      'content-script': './src/extension/modules/content-script.ts',
    },
    resolve: { extensions: ['.ts', '.js'], modules: [path.resolve(__dirname, 'src'), 'node_modules'] },
    module: {
      rules: [
        {
          test: /\.ts$/,
          exclude: /node_modules/,
          use: 'ts-loader',
        },
        {
          test: /\.(scss|css)$/,
          use: [
            MiniCssExtractPlugin.loader,
            'css-loader',
            {
              loader: 'sass-loader',
              options: {
                api: 'modern',
              },
            },
          ],
        },
      ],
    },
    optimization: {
      minimize: mode === 'production',
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            compress: { drop_console: true, drop_debugger: true },
          },
        }),
      ],
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: 'src/pop-up/index.html',
        filename: 'pop-up.html',
        minify: mode === 'production',
        inject: false,
        scriptLoading: 'blocking',
      }),
      new CopyPlugin({
        patterns: [
          {
            from: './src/extension/manifest.json',
          },
          {
            from: './src/pop-up/img/',
            to: './img/',
          },
        ],
      }),
      new MiniCssExtractPlugin({
        filename: 'css/[name].css',
      }),
    ],
    output: {
      filename: 'js/[name].js',
      path: path.resolve(__dirname, 'dist'),
      clean: true,
    },
  };
};
