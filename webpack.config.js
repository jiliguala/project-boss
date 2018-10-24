'use strict';
//加载依赖
const del = require('del');
const webpack = require('webpack');
const path = require('path');
const shell = require('shelljs');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const extractLESS = new ExtractTextPlugin('app.[chunkhash:8].min.css');
const HtmlWebpackPlugin = require('html-webpack-plugin');

del.sync(['app/public/**']);

const env = /-p/.test(process.argv[2]) ? '"production"' : '"development"'; //开发环境设置为development,运营环境设置为production
const pkg = require('./package.json');

// 复制lib目录到静态文件夹
const libPath = 'app/public/static-local/' + pkg.name + '/';
shell.mkdir('-p', libPath);
shell.cp('-R', 'app/build/lib/', libPath);

module.exports = {
    entry: './app/build/app.jsx',
    output: {
        path: path.resolve(__dirname, './app/public/static/' + pkg.name + '/'),
        filename: 'app.[chunkhash:8].min.js',
        chunkFilename: 'chunk.[name].[chunkhash:8].min.js',
        publicPath: '/' + pkg.name + '/'
    },
    module: {
        loaders: [
            {
                test: /\.js?$/,
                exclude: /(node_modules)/,
                loader: 'babel-loader'
            },
            {
                test: /\.jsx?$/,
                exclude: /(node_modules)/,
                loader: 'babel-loader',
                query: {
                    presets: ['react']
                }
            },
            {
                test: /\.(less|css)$/,
                loader: extractLESS.extract([ 'css-loader', 'less-loader'])
            }
        ]
    },
    plugins: [
        new webpack.DefinePlugin({
            'process.env': {
                'NODE_ENV': env
            }
        }),
        new HtmlWebpackPlugin({
            inject: false,
            filename: '../../views/index.html',
            template: './app/build/views/index.html'
        }),
        extractLESS
    ]
};