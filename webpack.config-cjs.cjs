const path = require('path');
const { library } = require('webpack');

module.exports = {
	"entry": "./src/index.js",
	"mode": "none",
	"optimization": {
		"concatenateModules": true
	},
	"output": {
		"clean": true,
    "filename": "main.cjs",
    "library": "BusTimeService",
    "libraryTarget": "umd",
    "globalObject": "this",
    path: path.resolve(__dirname, 'dist')
	}
};
