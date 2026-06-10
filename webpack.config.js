const path = require('path');
const webpack = require('webpack');
const { LimitChunkCountPlugin } = require('webpack').optimize;

const common = {
    mode: 'production',
    target: 'node',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: '[name].js',
        libraryTarget: 'commonjs',
        devtoolModuleFilenameTemplate: '../[resource-path]'
    },
    devtool: 'source-map',
    resolve: {
        extensions: ['.ts', '.js']
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                exclude: /node_modules/,
                use: [{ loader: 'ts-loader' }]
            }
        ]
    },
};

module.exports = [
    {
        ...common,
        entry: {
            extension: './src/extension.ts',
            'server/server': './src/server/server.ts'
        },
        externals: {
            vscode: 'commonjs vscode',
            sqlite3: 'commonjs sqlite3',
        },
        plugins: [
            new LimitChunkCountPlugin({ maxChunks: 1 }),
        ]
    },
    {
        ...common,
        entry: {
            'server/standalone': './src/server/standalone.ts'
        },
        externals: {
            sqlite3: 'commonjs sqlite3',
        },
        resolve: {
            ...common.resolve,
            alias: {
                vscode: path.resolve(__dirname, 'src/server/vscode.ts')
            }
        },
        plugins: [
            new LimitChunkCountPlugin({ maxChunks: 1 }),
        ]
    }
];
