var webpack = require("webpack");

module.exports = {
    entry:  ['./src/index.js'],
    output: {
        path:     '../dicoogle-wholeslide-plugin/src/main/resources/viewer/js',
        filename: 'bundle.js',
    },
    plugins: [
        new webpack.optimize.UglifyJsPlugin({
    		compress: {
        			warnings: false
    			}
	})
    ],
};


