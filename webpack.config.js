const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const FileManagerPlugin = require('filemanager-webpack-plugin');

module.exports = (env, arg) => {
    const mode = arg.mode;

    return {
        mode: mode === 'production' ? mode : 'development',
        devtool: mode === 'development' ? 'inline-source-map' : false,
        entry: {
            'pop-up': './src/pop-up/modules/script.js',
            background: './src/extension/modules/background.js',
            'content-script': './src/extension/modules/content-script.js',
        },
        resolve: { extensions: ['.js'], modules: [path.resolve(__dirname, 'src'), 'node_modules'] },
        optimization: {
            minimize: mode === 'production',
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
                    {
                        from: './src/pop-up/css/styles.css',
                        to: './css/pop-up.css',
                    },
                ],
            }),
            new FileManagerPlugin({
                events: {
                    onEnd: [
                        {
                            copy: [
                                {
                                    source: './dist/pop-up.js',
                                    destination: './dist/js/pop-up.js',
                                },
                                {
                                    source: './dist/content-script.js',
                                    destination: './dist/js/content-script.js',
                                },
                                {
                                    source: './dist/background.js',
                                    destination: './dist/js/background.js',
                                },
                            ],
                        },
                        {
                            delete: ['./dist/pop-up.js', './dist/content-script.js', './dist/background.js'],
                        },
                    ],
                },
            }),
        ],
        output: {
            filename: '[name].js',
            path: path.resolve(__dirname, 'dist'),
            clean: true,
        },
    };
};
