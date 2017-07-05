
var CrsaOverwriteProtectionFileWriter = function(root_source, root_dest) {

    var fs = require('fs');
    var path = require('path');
    var mkdirp = require('mkdirp');

    var dir_exist = {};

    var _this = this;

    var ask_overwrite = [];

    this.use_export_cache = true;
    this.skip_existing_files = false;
    this.overwrite_existing_files_without_asking = false;

    this.root_source = path.join(root_source, path.sep);
    this.root_dest = root_dest ? path.join(root_dest, path.sep) : null;
    this.export_cache = path.join(this.root_source, '_pgexport');

    this.getDestNameFromSource = function(source) {
        if(source.indexOf(this.root_source) < 0) return null; //not under the same path
        var local = source.replace(this.root_source, '');
        return path.join(this.root_dest, local);
    }

    var canWrite = function(dest, content, source) {
        if(_this.overwrite_existing_files_without_asking) return true; //write
        if(!fs.existsSync(dest)) return true; //no dest, write
        if(!_this.use_export_cache) return false;//ask
        //compare dest and cachefile
        var cacheFile = getCacheFileForDest(dest);
        if(areFilesSame(cacheFile, dest)) {
            //dest and last exported file are the same
            return true;
        } else {
            //dest and last exported file are not the same. ASK
            return false;
        }
    }

    var copyToCache = function(dest) {
        if(!_this.use_export_cache) return false;
        var file = getCacheFileForDest(dest);
        var dir = path.dirname(file);
        if(!dir_exist[dir]) {
            mkdirp.sync(dir);
            dir_exist[dir] = true;
        }
        crsaCopyFileSync(fs, dest, file);
        //console.log('EXPORT CACHE - ' + file);
    }

    this.copyFileToCache = function(file) {
        copyToCache(file);
    }

    var getCacheFileForDest = function(dest) {
        var name = getFileName(dest);
        return path.join(_this.export_cache, name);
    }

    var areFilesSame = function(f1, f2, content) {
        try {
            var data1 = fs.readFileSync(f1);
            var data2 = !content ? fs.readFileSync(f2) : (typeof content == 'string' ? new Buffer(content, 'utf8') : content);
            return Buffer.compare(data1, data2) === 0;
        }
        catch(err) {
            return false;
        }
    }

    var write = function(dest, content) {
        var dir = path.dirname(dest);
        if(!dir_exist[dir]) {
            mkdirp.sync(dir);
            dir_exist[dir] = true;
        }
        if(typeof content == 'string') {
            fs.writeFileSync(dest, content, {encoding: 'utf8'});
        } else {
            fs.writeFileSync(dest, content);
        }
        copyToCache(dest);
    }

    var copy = function(dest, source, filter_func) {
        var dir = path.dirname(dest);
        if(!dir_exist[dir]) {
            mkdirp.sync(dir);
            dir_exist[dir] = true;
        }

        crsaCopyFileSync(fs, source, dest, filter_func);
        //console.log('COPY ' + source + ' -> ' + dest);
        copyToCache(dest);
    }

    var addToAskWrite = function(dest, content, done) {
        ask_overwrite.push({file: dest, content: content, done: done});
    }

    var addToAskCopy = function(dest, source, done, filter_func) {
        ask_overwrite.push({file: dest, source: source, done: done, filter_func: filter_func});
    }

    var getFileName = function(dest) {
        return dest.replace(_this.root_dest, '');
    }

    this.writeFile = function(dest, content, done) {
        if(!canWrite(dest, content)) {
            addToAskWrite(dest, content, done);
        } else {
            write(dest, content);
            if(done) done(dest, content);
        }
    }

    this.copyFile = function(dest, source, done, filter_func) {
        if(!canWrite(dest, null, source)) {
            addToAskCopy(dest, source, done, filter_func);
        } else {
            copy(dest, source, filter_func);
            if(done) done(dest, null, source);
        }
    }

    var copyOrWriteAskItem = function(file) {
        if(file.source) {
            copy(file.file, file.source, file.filter_func || null);
            if(file.done) file.done(file.file, null, file.source);
        } else {
            write(file.file, file.content);
            if(file.done) file.done(file.file, file.content);
        }
    }

    this.askIfNeeded = function(done) {
        if(ask_overwrite.length && !this.skip_existing_files) {
            var $b = $('<div><p>Do you want to overwrite the following files' + (this.root_dest ? (' in folder <b>' + this.root_dest + '</b>') : '') + '?</p>' + (_this.use_export_cache ? '<p>It looks like these files were modified since you last exported them.</p>' : '') + '</div>');
            var $table = $('<table class="file-writer table table-striped table-condensed table-hover"><thead><tr><td><label><input type="checkbox" class="check-all" value="1" />&nbsp; Select all</label></td></tr></thead><tbody></tbody></table>').appendTo($b);
            var $tbody = $table.find('tbody');
            var $checkall = $table.find('input.check-all');

            for(var j = 0; j < 1; j++) {
                for (var i = 0; i < ask_overwrite.length; i++) {
                    var name = getFileName(ask_overwrite[i].file);
                    var $tr = $('<tr data-index="' + i + '"><td><label><input type="checkbox" value="1" />&nbsp;' + name + '</label></td></tr>').appendTo($tbody);
                }
            }
            var $modal = makeModalDialog('Confirm file overwrite', 'Cancel', 'Save selected', $b, function() {
                //cancel
                if(done) done(true);

            }, function() {
                //save selected
                $checks.each(function(i, ch) {
                    var $ch = $(ch);
                    var $tr = $ch.closest('tr');
                    var file = ask_overwrite[parseInt($tr.attr('data-index'))];
                    if($ch.is(':checked')) {
                        copyOrWriteAskItem(file);
                    }
                });

                if(done) done();
            });

            var $checks = $tbody.find('input[type="checkbox"]');
            $checks.on('change', function(e) {
                var $ch = $(e.delegateTarget);
                var $tr = $ch.closest('tr');
                var file = ask_overwrite[parseInt($tr.attr('data-index'))];
            });
            $checkall.on('change', function(e) {
                if($checkall.is(':checked')) {
                    $checks.prop('checked', true);
                } else {
                    $checks.prop('checked', false);
                }
            });
        } else {
            if(done) done();
        }
    }
}
