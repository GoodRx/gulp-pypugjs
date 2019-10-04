var gulp = require('gulp');
var gutil = require('gulp-util');
var through = require('through2');
var exec = require('child_process').exec;

var pypugjs = function(options) {
    if(options === undefined) {
        options = {};
    }
    return through.obj(function(file, enc, callback) {
        var stream = this;
        if(file.isNull()) {
            stream.push(file);
            callback();
            return;
        }
        if(file.isStream()) {
            stream.emit('error', new gutil.PluginError('gulp-pypugjs', 'Streams are not supported'));
            callback();
            return;
        }
        var command = exec('pypugjs -c ' + (options.engine || 'django'), function(error, stdout, stderr) {
            if(error) {
                stream.emit('error', new gutil.PluginError('gulp-pypugjs', error));
                callback();
                return;
            }
            var buffer = new Buffer(stdout);
            if (options.newline) {
                buffer = Buffer.concat([buffer, new Buffer('\n')]);
            }
            file.contents = buffer;
            file.path = gutil.replaceExtension(file.path, (options.extension || '.html'));
            stream.push(file);
            callback();
        });
        command.stdin.write(file.contents);
        command.stdin.end();
    });
}

module.exports = pypugjs;
