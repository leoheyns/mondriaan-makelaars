var PgSass = function() {

    var sass = new Sass();

    var fs = require('fs');
    var path = require('path');

    var sourceFile = '/Users/Matjaz/Desktop/FD6/Miskolin/bower_components/foundation-sites/scss/foundation.scss';
    var sourceDir = path.dirname(sourceFile);

    var code = fs.readFileSync(sourceFile, {encoding: "utf8"});

    var options = {

    }

    var map = {};

    var log = function(msg) {
        //console.log(msg);
    }

    sass.importer(function(request, done) {
        log(request);

        if (request.path) {
            // Sass.js already found a file,
            // we probably want to just load that
            done();
        } else if(request.current) {

            if(request.previous != 'stdin') {
                request.current = path.join(path.dirname(request.previous), request.current);
                log('REMAP ' + request.current);
            }
            if(request.current in map) {
                done({
                    content: map[request.current]
                })
                return;
            }
            
            var currentPath = path.resolve(sourceDir, request.current + '.scss');
            var currentDir = path.dirname(currentPath);
            var currentFile = path.basename(currentPath);

            var files = [currentPath, path.join(currentDir, '_' + currentFile)];

            for(var i = 0; i < files.length; i++) {
                try {
                    var file = files[i];
                    var stat = fs.statSync(file);
                    log('SASS loading ' + file);
                    fs.readFile(file, {encoding: 'utf8'}, function(err, code) {
                        log('SASS LOADED ' + file);
                        if(err) {
                            log('LOAD ERROR ' + err);
                        } else {
                            log('LOADED ' + code.length + ' chars');
                            map[request.current] = code;
                            done({
                                content: code
                            })
                        }
                    })
                    break;
                }
                catch(err) {
                    log('Not found: ' + file);
                }
            }
        } else {
            // let libsass handle the import
            done();
        }
    });

    /*
    setInterval(function() {
        console.log('START SASS...');
        sass.compile(code, options, function callback(result) {
            console.log(result.text.length);
        })
    }, 20000)
*/

}

var pgSassTest = new PgSass();
