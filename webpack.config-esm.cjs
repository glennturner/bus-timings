const path = require('path');
const { library } = require('webpack');

module.exports = {
  mode: "production",
  resolve: {
    extensions: [".js"]
  },
  entry: "./src/index.js",
  output: {
    filename: "main.js",
    library: "BusTimeService",
    path: path.resolve(__dirname, 'dist')
  },
};
