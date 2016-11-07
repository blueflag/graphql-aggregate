require('./environment.js');
var jasmine = require('jasmine');
var testRunner = new jasmine();
var reporters = require('jasmine-reporters');

testRunner.loadConfig({
    spec_dir: './src/',
    spec_files: [
        '**/__tests__/*-spec.js'
    ]
});

testRunner.execute();

