const path = require('path');
const webpack = require('webpack');
const { LimitChunkCountPlugin } = require('webpack').optimize;

module.exports = {
    mode: 'production', // "production" | "development" | "none"
    target: 'node', // extensions run in a node context
    entry: {
        extension: './src/extension.ts',
        'server/server': './src/server/server.ts'
    },
    output: {
        // the bundle is stored in the 'dist' folder (check package.json), 
        path: path.resolve(__dirname, 'dist'),
        filename: '[name].js',
        libraryTarget: 'commonjs',
        devtoolModuleFilenameTemplate: '../[resource-path]'
    },
    devtool: 'source-map',
    externals: {
        vscode: 'commonjs vscode', // the vscode-module is created on-the-fly and must be excluded.
    },
    resolve: {
        // support reading TypeScript and JavaScript files, 
        extensions: ['.ts', '.js']
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                exclude: /node_modules/,
                use: [
                    {
                        loader: 'ts-loader'
                    }
                ]
            }
        ]
    },
    plugins: [
        new LimitChunkCountPlugin({
            maxChunks: 1, // disable code splitting
        }),
    ]
};
