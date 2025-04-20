const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
    mode: 'production',
    entry: {
        popup: './src/popup/index.tsx',
        content: './src/content/content.ts',
        background: './src/background/background.ts',
        options: './src/options/index.tsx'
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: '[name].js',
        clean: true
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/
            },
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader']
            }
        ]
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js']
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: './src/popup/popup.html',
            filename: 'popup.html',
            chunks: ['popup']
        }),
        new HtmlWebpackPlugin({
            template: './src/options/options.html',
            filename: 'options.html',
            chunks: ['options']
        }),
        new CopyWebpackPlugin({
            patterns: [
                { from: 'src/icons', to: 'icons' },
                { from: 'manifest.json', to: 'manifest.json' }
            ]
        })
    ]
};