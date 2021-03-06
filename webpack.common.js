const path = require("path");
const glob = require("glob");
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CopyPlugin = require("copy-webpack-plugin");
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const globImporter = require("node-sass-glob-importer");

const generateHtmlPlugins = () =>
    glob.sync("./src/views/pages/*.twig").map(
        (dir) =>
            new HtmlWebpackPlugin({
                filename: path.basename(dir).replace(".twig", ".html"), // Output
                template: dir, // Input
                title: "Custom template using Handlebars",
                chunks: true,
            })
    );

const config = {
    devServer: {},
    entry: {
        styles: "./src/scss/styles.scss",
        script: "./src/js/script.js",
    },
    output: {
        path: path.resolve(__dirname, "dist"),
        filename: "./js/script.js",
        chunkFilename: "[id].[hash:8].js",
    },
    module: {
        rules: [{
            test: /\.twig$/,
            use: [
                "raw-loader",
                {
                    loader: "twig-html-loader",
                    options: {
                        data: {},
                    },
                },
            ],
        },
        {
            test: /\.(scss|css)$/,
            use: [
                {
                    loader: MiniCssExtractPlugin.loader
                },
                {
                    loader: "css-loader",
                    options: {},
                },
                {
                    loader: "sass-loader",
                    options: {
                        sassOptions: {
                            importer: globImporter(),
                        },
                    },
                },
            ],
        },
        {
            test: /\.(woff|woff2|ttf|otf|eot|svg)(\?v=\d+\.\d+\.\d+)?$/,
            use: [
                {
                    loader: 'file-loader',
                    options: {
                        limit: false,
                        // name: '[name].[ext]',
                        // outputPath: '../assets/fonts/'
                        name: '[name].[ext]',
                        outputPath: "assets/fonts",
                        publicPath: '../assets/fonts'
                    }
                }
            ]
        },

        {
            test: /\.(png|jpg|gif)$/,
            use: [{
                loader: "url-loader",
                options: {
                    limit: false,
                    // name: "../assets/images/[name].[ext]",
                    name: "[name].[ext]",
                    outputPath: "assets/images",
                    publicPath: '../assets/images'
                },
            },],
        },
        ],
    },
    plugins: [
        new MiniCssExtractPlugin({
            filename: "./css/[name].css",
        }),
        new CopyPlugin({
            patterns: [{
                from: "src/assets/libs",
                to: "assets/libs"
            },
            {
                from: "src/assets/images",
                to: "assets/images"
            },
                // {
                //     from: "src/js",
                //     to: "js"
                // },
            ],
        }),
        ...generateHtmlPlugins(),
    ],
};

module.exports = (env, argv) => {

    console.log('argv.mode:', argv.mode);

    if (argv.mode === 'development') {
        config.devtool = 'source-map';
        config.devServer = {
            contentBase: "./dist",
            writeToDisk: true,
            port: 9000,
            host: argv.mode ? argv.mode.host : 'localhost',
        }
    }

    if (argv.mode === 'production') {
        config.optimization = {
            minimize: true,
            minimizer: [
                new CssMinimizerPlugin(),
                new UglifyJsPlugin({
                    minify(file, sourceMap) {
                        // https://github.com/mishoo/UglifyJS2#minify-options
                        const uglifyJsOptions = {
                            /* your `uglify-js` package options */
                        };

                        if (sourceMap) {
                            uglifyJsOptions.sourceMap = {
                                content: sourceMap,
                            };
                        }

                        return require('terser').minify(file, uglifyJsOptions);
                    },
                })
            ]
        }
    }

    return config;
};
