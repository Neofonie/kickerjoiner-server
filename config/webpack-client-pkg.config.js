import webpack from 'webpack';
import path from "path";

//--------------//

const config = {
    target: "node",
    mode: 'production',
    entry: './scripts/websocket-client.js',
    output: {
        filename: 'dist/client.js',
        path: path.resolve(process.env.PWD),
        publicPath: '/',
    },
    node: {
        __dirname: false,
        __filename: false
    },
    plugins: [
        new webpack.DefinePlugin({ "global.GENTLY": false }), // hack for formidable
        {
            apply: (compiler) => {
                compiler.hooks.afterEmit.tap('Complete', (compilation) => {
                    console.log('>>> BUNDLING COMPLETE');
                });
            }
        }
    ],
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /(node_modules|bower_components)/,
                use: {
                    loader: "babel-loader",
                    options: {
                        presets: ["@babel/preset-env"]
                    }
                }
            }
        ]
    }
};

//--------------//

const bundler = webpack(config, (err, stats) => {
    if (err || stats.hasErrors()) {
        console.log('>>> ERROR: ', err, stats);
    }
});
