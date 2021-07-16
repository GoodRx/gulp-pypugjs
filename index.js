var cp = require('child_process');
var Stream = require('stream');

var gutil = require('gulp-util');
var Duplexer = require('plexer');

var pypugjs = function(options) {
    options = options || {};

    var stream = new Stream.PassThrough({ objectMode: true });

    stream._transform = function(file, _, cb) {
        if (file.isNull()) {
            stream.push(file);
            return cb();
        }

        var spawnOpts = ['-c'].concat(options.engine ? options.engine.split(' ') : ['django']);
        var program = cp.spawn('pypugjs', spawnOpts, { cwd: '.' });

        if (file.contents instanceof Buffer) {
            var newBuffer = new Buffer(0);

            program.stdout.on('readable', function () {
                var chunk;
                while ((chunk = program.stdout.read())) {
                    newBuffer = Buffer.concat(
                      [newBuffer, chunk],
                      newBuffer.length + chunk.length
                    );
                }
            });

            program.stdout.on('end', function () {
                if (options.newline) {
                    newBuffer = Buffer.concat([newBuffer, new Buffer('\n')]);
                }

                file.path = gutil.replaceExtension(file.path, (options.extension || '.html'));
                file.contents = newBuffer;
                stream.push(file);
                cb();
            });

            program.stdin.write(file.contents, function () {
                program.stdin.end();
            });
        } else {
            file.contents = file.contents.pipe(
              new Duplexer(program.stdin, program.stdout)
            );

            stream.push(file);
            cb();
        }
    }

    return stream;
}

module.exports = pypugjs;
