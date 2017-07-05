/**
 * Created by Matjaz on 12/6/13.
 */

var CrsaProfile = function(enab) {
    var enabled = false;
    var start_ms;
    var elapsed = 0;
    var paused = false;

    if(enabled) {
        start_ms = (new Date()).getTime();
    }

    this.pause = function() {
        elapsed += (new Date()).getTime() - start_ms;
        paused = true;
    }

    this.resume = function() {
        start_ms = (new Date()).getTime();
        paused = false;
    }

    this.show = function(name) {
        if(enabled) {
            var elapsed_ms = paused ? elapsed : elapsed + (new Date()).getTime() - start_ms;
            console.log(name + ' took ' + elapsed_ms + ' ms');
        }
    }
}

function crsaRunExternalCommand(cmd, params, onClose) {
    var spawn = require('child_process').spawn;
    var prc = spawn(cmd,  params);

    prc.stdout.setEncoding('utf8');
    prc.stdout.on('data', function (data) {
    });

    prc.on('close', function (code) {
        console.log('process exit code ' + code);
        if(onClose) onClose();
    });
}

function crsaRemoveScripts(str, replace_with) {
    if(str && str.indexOf('<?') >= 0) {
        str = str.replace(/<\?.*?\?>/g, replace_with || '');
    }
    return str;
}

function crsaSplitCSSValue(v) {
    if(v === null) return v;
    if(typeof v != 'string') v += 'px';

    var m = v.match(/^([0-9\.]+)([a-z\%]*)$/);
    return m ? {value: parseFloat(m[1]), unit: m[2].toLowerCase() || 'px'} : null;
}

function crsaOneUpCSSValue(cv, down) {
    if(typeof down == 'undefined') down = 1;
    var breakpoints_units = {
        'px': 1,
        'em': 0.0625,
        'rem': 0.0625,
        'pt': 1
    }
    if(cv) {
        var a = cv.unit in breakpoints_units ? breakpoints_units[cv.unit] : 1;
        return {value: cv.value + down * a, unit: cv.unit};
    }
    return cv;
}

var crsaConvertCSSValueToPx_el = null;

function crsaConvertCSSValueToPx(cv, $iframe) {
    var s = typeof cv != 'object' ? cv + "" : (cv.value + cv.unit);
    if(s.match(/^[0-9\.]*$/)) s += 'px';

    var d;
    var $d;
    if(!$iframe) {
        if(!crsaConvertCSSValueToPx_el) {
            crsaConvertCSSValueToPx_el = $('#crsa-dummy-div').get(0);
        }
        d = crsaConvertCSSValueToPx_el;
    } else {
        var body = $(getIframeBody($iframe.get(0)));
        $d = body.find('#crsa-dummy-div');
        if($d.length == 0) {
            $d = $('<div id="crsa-dummy-div" style="position:absolute;top:-1000px;"></div>');
            body.append($d);
        }
        d = $d.get(0);
    }

    var px = Length.toPx(d, s);
    if($iframe) $d.remove();
    return px;
}

/*
//fileWatcher
var fs = require('fs');
var pgWatchFile = null;

var crsaTestWatchFile = function() {
    var tmp = require('tmp');
    tmp.file(function(err, path, fd) {
        if (err) {
            console.log(err);
            return;
        };
        var watchIsWorking = false;
        var watcher = fs.watch(path, {persistent: true}, function() {
            watchIsWorking = true;
        });
        fs.writeFileSync(path, "test data");

        var check = function() {
            if(checkTimeout) {
                clearTimeout(checkTimeout);
                checkTimeout = null;
            }
            pgWatchFile = watchFileIsWorking ? fs.watchFile
        }
        var checkTimeout = setTimeout()
    });
}
*/

function diffStrings(s1, s2) {
    //if(s1.length != s2.length) return s1.length > s2.length ? s1.length : s2.length;
    for(var i = 0; i < s1.length; i++) {
        if(i >= s2.length) return i;
        if(s1.charAt(i) != s2.charAt(i)) return i;
    }
    return -1;
}

function describeDiffStrings(s1, s2) {
    var i = diffStrings(s1, s2);
    if(i < 0) {
        return 'Strings are EQUAL';
    } else {
        var si = i - 20;
        if(si < 0) si = 0;
        return 'Strings are DIFFERENT at ' + i + ' s1[' + s1.length + ']="' + escapeHtmlCode(s1.substr(si, 25)) + '" s2[' + s2.length + ']="' + escapeHtmlCode(s2.substr(si, 25)) + '"';
    }
}

function crsaGetInlineStylePropertyValue(style, prop, is_url) {
    if(style) {
        var re = new RegExp( escapeRegExp(prop) + '\\:\\s*' + (is_url ? 'url\\(([^\\)]*)\\)' : '([^\\;]*)') + '\\;?')
        var m = style.match(re);
        if(m) {
            var url = m[1].replace(/['"]/g, '');
            return url;
        }
    }
    return null;
}

function crsaSetInlineStylePropertyValue(style, prop, value, is_url) {
    style = style || '';
    var re = new RegExp( escapeRegExp(prop) + '\\:\\s*' + (is_url ? 'url\\(([^\\)]*)\\)' : '([^\\;]*)') + '\\;?', 'g');
    style = style.replace(re, '');
    if(value) {
        if(style.length && !style.endsWith(';')) style += ';';
        style += prop + ':' + (is_url ? 'url(\'' + value + '\')' : value) + ';';
    }
    return style;
}

function escapeRegExp( value ) {
    if(typeof value != 'string') value = String(value);
    return value.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g, "\\$&");
}

function escapeHtmlCode(t) {
    return t.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

var cssHelperLink = document.createElement('a');

var crsaAppendQueryToUrl = function(url, queries) {
    cssHelperLink.href = url;
    if(cssHelperLink.search) cssHelperLink.search += '&';
    cssHelperLink.search += queries.join('&');
    return cssHelperLink.href;
}
/*
 ['href','protocol','host','hostname','port','pathname','search','hash'].forEach(function(k) {
 console.log(k+':', a[k]);
 });
 */
var crsaMakeLinkRelativeTo = function(link, parent) {
    var re = /^[a-z:]*\/+/i;

    var m_link = link.match(re);
    if(!m_link) return link;
    var link_prot = m_link[0];

    var m_parent = parent.match(re);
    if(!m_parent) return link;
    var parent_prot = m_parent[0];

    if(link_prot.toLowerCase() != parent_prot.toLowerCase()) return link;

    var a = link.replace(re, '').split('/');
    var p = parent.replace(re, '').split('/');

    var i = 0;
    while(i < a.length && i < p.length && a[i] == p[i]) {
        i++;
    }
    if(i == 0) {
        //cant make relative
        return link;
    } else {
        a.splice(0, i);
        if(p.length > i+1) {
            for(var n = 0; n < p.length - i - 1; n++) {
                a.unshift('..');
            }
        }
        var rel = a.join('/');
        if(rel.indexOf('../..') >= 0) {
            return link; //too many backpaddles
        }
        return rel;
    }
}

function crsaMakeUrlAbsolute(url) {
    if(url.match(/^[a-z]*:\/\//i)) return url;
    return crsaMakeUrlFromFile(crsaGetAppDir() + url);
}

function crsaDuplicateName(orig_name, local_file, skip) {
    var a = orig_name.split('.');
    var i = a.length > 1 ? a.length - 2 : a.length-1;
    var c = 0;
    var found;
    var name;
    var localBase = local_file ? crsaGetFileDir(local_file) : null;
    var fs = isApp() ? require('fs') : null;

    do {
        a[i] = a[i].replace(/\([0-9]+\)$/i, '');
        a[i] = c == 0 ? a[i] : a[i] + '(' + c + ')';
        name = a.join('.');
        found = false;
        if(skip) {
            if(skip.indexOf(name) >= 0) found = true;
        }
        if(!found && fs && localBase) {
            var newFile = localBase + name;
            if(fs.existsSync(newFile)) {
                found = true;
            }
        }
        c++;
    }
    while(found);

    return name;
}


function crsaGetFileDir(file) {
    if(isApp()) {
        var path = require('path');
        var dir = path.dirname(file);
        if(dir.charAt(dir.length-1) != path.sep) dir += path.sep;
        return dir;
    }
    var a = file.split('/');
    var dir = '';
    if(a.length > 1) {
        a.splice(a.length-1,1);
        dir = a.join('/');
    }
    if(dir.charAt(dir.length-1) != '/') dir += '/';
    return dir;
}

function crsaGetAppDir() {
    if(isApp()) {
        return crsaGetFileDir(crsaMakeFileFromUrl(window.location.href));
    } else {
        return null;
    }
}

function crsaIsFileOrDir(path, fs) {
    if(!isApp()) return false;

    try {
        if(!fs) fs = require('fs');
        var stat = fs.statSync(path);
        if(stat.isFile()) return 'file';
        if(stat.isDirectory()) return 'dir';
        return null;
    } catch(err) {
        return null;
    }
}

function crsaGetDir(file, path, fs) {
    if(!path) path = require('path');
    if(crsaIsFileOrDir(file, fs) == 'dir') return file;
    return path.dirname(file);
}

function crsaCopyFileSync(fs, source, dest, filter_func) {
    if(!fs) fs = require('fs');
    if(filter_func) {
        var text = fs.readFileSync(source, {encoding: 'utf8'});
        text = filter_func(text);
        fs.writeFileSync(dest, text, {encoding: 'utf8'});
    } else {
        var data = fs.readFileSync(source);
        fs.writeFileSync(dest, data);
    }
}

function crsaCopyFile(fs, source, target, cb) {
    var cbCalled = false;

    var rd = fs.createReadStream(source);
    rd.on("error", function(err) {
        done(err);
    });
    var wr = fs.createWriteStream(target);
    wr.on("error", function(err) {
        done(err);
    });
    wr.on("close", function(ex) {
        done();
    });
    rd.pipe(wr);

    function done(err) {
        if (!cbCalled) {
            cb(err);
            cbCalled = true;
        }
    }
}

function crsaCopyFolder(source, dest, done, quick, overwrite_existing) {
    var ncp = require('ncp').ncp;
    var path = require('path');
    var fs = require('fs');

    ncp.limit = 4;

    ncp(source, dest, {filter: function(filename) {

        if(quick) {
            var rel_name = filename.replace(source, '');
            var dest_name = path.join(dest, rel_name);
            var dest_exists = false;
            try {
                var stat_dest = fs.statSync(dest_name);
                var stat_source = fs.statSync(filename);
                //exists
                dest_exists = stat_source.isFile() && stat_dest.mtime >= stat_source.mtime;
            } catch(err) {}

            if(dest_exists && !overwrite_existing) {
                //console.log('NCP SKIP ' + filename);

                return false;
            }
        }
        //console.log('NCP ' + filename);
        return true;
    }}, function (err) {
        if(done) done(err);
    });
}

function crsaWriteFileWithBackup(fs, file, data, enc) {

    if(!fs) fs = require('fs');
    var path = require('path');

    if(crsaIsFileOrDir(file, fs) == 'file') {

        if(pinegrow.getSetting('backup', '1') == '1') {
            var path = require('path');
            var dir = crsaGetFileDir(file) + '_pgbackup';

            var project = pinegrow.getCurrentProject();
            if(project && project.isFileInProject(file)) {
                var rel = project.getRelativePath(file);
                dir = path.dirname(path.join(project.getDir(), '_pgbackup', rel));
            }
            if(!crsaIsFileOrDir(dir, fs)) {
                //fs.mkdirSync(dir);
                crsaCreateDirs(dir, fs);
            }
            //dir += path.sep;
            var name = getPageName(file);
            var a = name.split('.');
            var mark = '_' + Math.floor((new Date()).getTime() / 1000);
            if(a.length > 1) {
                a[a.length-2] += mark;
            } else {
                a[0] += mark;
            }
            var bckfile = path.join(dir, a.join('.'));
            crsaCopyFileSync(fs, file, bckfile);

            fs.readdir(dir, function(err, files) {
                if(!err) {
                    var ext = path.extname(name);
                    var base = path.basename(name, ext);
                    var re = new RegExp('^' + escapeRegExp(base + '_') + '([0-9]+)' + escapeRegExp(ext) + '$');
                    var list = [];
                    for(var i = 0; i < files.length; i++) {
                        var m;
                        if(m = files[i].match(re)) {
                            list.push(parseInt(m[1]));
                        }
                    }
                    list.sort();
                    var max = parseInt(pinegrow.getSetting('backup-revisions', '20'));
                    if(!max) max = 9999999;

                    if(list.length > max) {

                        console.log('Deleting ' + (list.length - max) + ' ' + name + ' old backup files...');

                        var doDelete = function(err) {
                            if(!err && list.length > max) {
                                var file = path.join(dir, base + '_' + list.shift() + ext);
                                fs.unlink(file, doDelete);
                            }
                        }
                        doDelete();
                    }
                }
            })
        }
    } else {
        var paths = crsaGetFileDir(file);
        crsaCreateDirs(paths, fs);
    }
    //console.log('writing file ' + file);
    fs.writeFileSync(file, data, enc);
}

function crsaGetUrlParameters (url) {
    var a;
    var res = '';

    a = url.split('?');
    var params = a[1];

    a = a[0].split('#');
    var hashes = a[1];

    if (params) res  = '?' + params;
    if (hashes) res += '#' + hashes;

    return res;
}

function crsaRemoveUrlParameters(url) {
    var a = url.split(/[\?\#]/);
    return a.length > 0 ? a[0] : url;
}

function crsaCreateDirs(path, fs) {
    if(crsaIsFileOrDir(path, fs)) return false;
    var mkdirp = require('mkdirp');
    mkdirp.sync(path);
    return true;

    var pm = require('path');
    if (!fs) fs = require('fs');
    if(crsaIsFileOrDir(path, fs)) return false;
    var a = path.split(pm.sep);
    var p = '';
    for(var i = 0; i < a.length; i++) {
        if(a[i].length == 0) {
            p += pm.sep;
            continue;
        }
        p += a[i] + pm.sep;
        if(!crsaIsFileOrDir(p, fs)) {
            fs.mkdirSync(p);
        }
    }
    return true;
}

function crsaMakeUrlFromFile(file) {
    var f = 'file://';
    if(isApp()) {
        var path = require('path');
        if(file.match(/^[a-z]\:/i)) {
            //win, c://ppp
            file = '/' + file
        } else if(file.startsWith('\\\\')) {
            //win, //sfp/aaa/aaa
            file = file.substr(2);
        }
    }
    return f + encodeURI(file.replace(/\\/g, "/"));
}

function crsaMakeFileFromUrl(url, skip_remove_params) {
    if (!url) return '';
    if(isApp()) {
        var path = require('path');
        var f = path.sep == '/' ? 'file://' : 'file://';

        if(!skip_remove_params) {
            url = crsaRemoveUrlParameters(url);
        }
        if(!url.startsWith(f)) {
            //relative url
            return path.normalize(decodeURI(url.replace(/\//g, path.sep)));
        }
        url = url.replace(f, '');
        if(path.sep == '\\') {
            //win stuff
            if(url.startsWith('/')) {
                //win, c://ppp
                url = url.substr(1);
            } else {
                //win, \\spf\sdsd
                url = '//' + url;
            }
        }
        return path.normalize(decodeURI(url.replace(/\//g, path.sep)));
    } else {
        return crsaRemoveUrlParameters(url).replace('file://', '');
    }
}

function crsaIsFileUrl(url) {
    return url.indexOf('file:') == 0;
}

function crsaCleanUpUrl (url) {
    url = crsaRemoveUrlParameters(url);
    if (url[url.length-1] == '/')
        url = url.substr(0, url.length-1);

    return url;
}

function crsaGetExtFromUrl(url) {
    url = crsaCleanUpUrl(url);

    var name = crsaGetNameFromUrl(url);
    if (name.indexOf('.') > -1) {
        var nameArr = name.split('.');
        return nameArr[nameArr.length-1].toLowerCase();
    }
    return null;
}

function crsaGetNameFromUrl(url, def) {
    url = crsaRemoveUrlParameters(url);
    var n = url.split(/[\\\/]/).pop();
    if(n.length == 0) n = (def || '');
    var a = n.split('?');
    return a.length > 1 ? a[0] : n;
}

function crsaGetBaseForUrl(url) {
    if(!url) return url;
    url = crsaRemoveUrlParameters(url);
    var a = url.split(/[\/]/);
    a.pop();
    return a.join('/');
}

function crsaGeneralCombineUrlWith(url, doc) {
    if(doc.length == 0) return url;
    while (doc.startsWith('../')) {
      url = crsaGetBaseForUrl(url);
      doc = doc.substr(3, doc.length);
    }
    if(doc.charAt(0) != '/') {
        doc = '/' + doc;
    }
    return url + doc;
}

function crsaCombineCurrentUrlWith(url, doc) {
    return crsaGeneralCombineUrlWith(url, doc);
}

function crsaCombineUrlWith(url, doc) {
    url = crsaGetBaseForUrl(url);
    return crsaGeneralCombineUrlWith(url, doc);
}

function crsaGetUrlToSmartCombine(url, doc) {
    var newUrl = doc;

    var docBase = crsaGetBaseForUrl(newUrl);
    var urlBase = crsaGetBaseForUrl(url);
    while (true) {
        var docPosition = urlBase.indexOf(docBase);
        if (docPosition > -1) {
            if (urlBase.substr(docPosition, urlBase.length) == docBase) {
                doc = doc.substr(newUrl.length, doc.length);
                if (doc == "") doc = crsaGetNameFromUrl(newUrl);
                break;
            }
        }
        var docArr = newUrl.split('/');
        if (docArr.length == 1) break;
        docArr.pop();
        newUrl = docArr.join('/');
    }
    return doc;
}

function crsaIsAbsoluteUrl(url) {
    return url.indexOf('://') >= 0 || url.indexOf('//') === 0;
}

function crsaIsFileExist (file_path) {
    var fs = require('fs');
    return fs.existsSync(file_path);
}

function crsaRemoveExtFromUrl (fileUrl) {
    var filename = crsaGetNameFromUrl(fileUrl);
    var filenameArr = filename.split('.');
    filenameArr.splice(filenameArr.length-1, 1);
    return filenameArr.join('.');
}

function crsaSplitAndTrimList(cls) {
    return (cls && cls.length) ? cls.split(',').map(function(cls_item) {
        return $.trim(cls_item);
    }) : [];
}

function crsaGetSummaryStr (str, n, front) {
    n = n || 40;
    if (str.length <= n) return str;
    if(front) {
        return str.substr(0, n) + '...';
    } else {
        return '...' + str.substr(str.length - n, n);
    }
    //MT2MHD: the middle part is more importnt than beginning
    if (str.length < n*2) return str;
    return str.substr(0, n) + '...' + str.substr(str.length - n, str.length-1);
}
/*
var test = [
    {link: 'http://cnn.com/image.jpg', parent: 'http://cnn.com/page.html'},
    {link: 'http://bbc.com/image.jpg', parent: 'http://cnn.com/page.html'},
    {link: 'http://cnn.com/images/image.jpg', parent: 'http://cnn.com/page.html'},
    {link: 'http://cnn.com/page.html/image.jpg', parent: 'http://cnn.com/page.html'},
    {link: 'http://cnn.com/image.jpg', parent: 'http://cnn.com/pages/sub/page.html'},
    {link: 'file:///Users/Matjaz/images/image.jpg', parent: 'file:///Users/Matjaz/pages/sub/page.html'},
    {link: 'file:///Users/Matjaz/images/image.jpg', parent: 'http://Users/Matjaz/pages/sub/page.html'}
]

for(var i = 0; i < test.length; i++) {
    console.log(test[i].link + ' to ' + test[i].parent + ' = ' + crsaMakeLinkRelativeTo(test[i].link, test[i].parent));
}
*/
function crsaGetRelativeDistanceForUrls (existUrl, currentUrl, callback) {
    var path = require('path');

    var currentDirArr = currentUrl.split('/');
    var existDirArr = existUrl.split('/');

    var newCrrent = currentDirArr.slice(0);
    var newExist = existDirArr.slice(0);
    for(var i = 0; i < currentDirArr.length; i++) {
        if (currentDirArr[i] == existDirArr[i]) {
            newCrrent.splice(newCrrent.indexOf(currentDirArr[i]), 1);
            newExist.splice(newExist.indexOf(existDirArr[i]), 1);
        }
        else break;
    }
    var newCrrentStr = newCrrent.join('/');
    var newExistStr = newExist.join('/');

    var newRelativeUrl = newCrrentStr.replace(newExistStr, '');
    if (newRelativeUrl == newCrrentStr) {
        newRelativeUrl = newExistStr.replace(newCrrentStr, '');

        var finalRelativeUrl;
        if (newRelativeUrl[newRelativeUrl.length-1] == "/")
            finalRelativeUrl = newRelativeUrl + newCrrentStr;
        else
            finalRelativeUrl = newRelativeUrl;

        if (newRelativeUrl == newExistStr) {
            var newPathArr = newCrrentStr.split('/');
            if (callback) callback(newPathArr.length - 1, finalRelativeUrl);
        }
        else {
            if (callback) callback(0, finalRelativeUrl);
        }
    }
    else {
        var newPathArr = newRelativeUrl.split('/');
        var distance = -1 * (newPathArr.length - 1);
        if (callback) callback(distance, null);
    }
}

var splitCssValue = function(v, comma_as_token) {
    var r = [];
    if(!v || v.length == 0) return r;
    v = v + " \n";
    var token = '';
    var in_exp = false;
    var operands = "+-/*";
    var space = false;
    var par_level = 0;
    var quote_level = 0;

    for(var i = 0; i < v.length; i++) {
        var ch = v.charAt(i);
        if(ch == ' ') {
            space = true;
        } else {
            if(comma_as_token && ch == ',' && par_level == 0 && quote_level == 0) {
                r.push($.trim(token));
                space = false;
                token = '';
                r.push(',');
                continue;
            } else if(space && par_level == 0 && quote_level == 0) {
                r.push($.trim(token));
                space = false;
                token = '';
            }
            if(ch == '(') {
                par_level++;
            } else if(ch == ')') {
                par_level--;
            } else if(ch == '"' || ch == '\'') {
                quote_level = quote_level == 0 ? 1 : 0;
            }
        }
        token = token + ch;
    }
    token = $.trim(token);
    if(token.length > 0 && token != "\n") {
        r.push(token);
    }
    return r;
}

/*
 var tests = ["", "10px, 20px", "10+20 20px", "@a+@b @c-@d", "(10 + 20 + 30) 50", "func(10 20 (40 + 40), 40) 30px 40px 50px"];
 $.each(tests, function(i,t) {
 console.log(t);
 console.log(splitCssValue(t, true));
 });
*/

var getUrlFromCssUrlValue = function(url) {
    url = url.replace(/[\'\"]/g, '');
    var m = url.match(/url\(([^\)]*)\)/i);
    return m ? m[1] : url;
}

//console.log(getUrlFromCssUrlValue("url('aaaaaaaa')"));

var CssBackgroundParser = function(css) {

    var _this = this;

    this.parse = function(bg) {
        this.css = bg;

        this.color = '';
        this.image = '';
        this.repeat = '';
        this.attachment = '';
        this.position = '';
        this.important = false;

        //background:#ffffff url('img_tree.png') no-repeat right top;

        var def = ['transparent', 'none', 'repeat', 'scroll', '0%', '0%'];

        var idx = -1;
        var a = splitCssValue(bg, true);
        a.push(',');

        var bcka = [];
        for(var i = 0; i < a.length; i++) {
            if(a[i].match(/\!important/i)) {
                this.important = true;
                continue;
            } else if(a[i] == ',') {
                if(this.color.length > 0) this.color += ', ';
                this.color += bcka.length >= 1 ? bcka[0] : def[0];

                if(this.image.length > 0) this.image += ', ';
                this.image += bcka.length >= 2 ? bcka[1] : def[1];

                if(this.repeat.length > 0) this.repeat += ', ';
                this.repeat += bcka.length >= 3 ? bcka[2] : def[2];

                if(this.attachment.length > 0) this.attachment += ', ';
                this.attachment += bcka.length >= 4 ? bcka[3] : def[3];

                if(this.position.length > 0) this.position += ', ';
                this.position += bcka.length >= 5 ? bcka[4] : def[4];
                this.position += ' '
                this.position += bcka.length >= 6 ? bcka[5] : def[5];

                bcka = [];
            } else {
                bcka.push(a[i]);
            }
        }
        this.color = apply_important(this.color);
        this.image = apply_important(this.image);
        this.repeat = apply_important(this.repeat);
        this.attachment = apply_important(this.attachment);
        this.position = apply_important(this.position);
    }

    var apply_important = function(prop)
    {
        return prop + (_this.important ? ' !important' : '');
    }

    this.getValue = function(prop) {
        switch(prop.toLowerCase()) {
            case 'background-color': return this.color;
            case 'background-image': return this.image;
            case 'background-repeat': return this.repeat;
            case 'background-attachment': return this.attachment;
            case 'background-position': return this.position;
            default: return null;
        }
    }

    if(css) this.parse(css);
}

/*
tests = ["#ffffff url('img_tree.png') no-repeat scroll right top,#123456 url('img.png') no-repeat !important"];

var cp = new CssBackgroundParser();

$.each(tests, function(i,t) {
    cp.parse(t);
    console.log(t);
    console.log(cp.color, cp.image, cp.repeat, cp.attachment, cp.position);
});
*/

function crsaAddCancelSearch($input, style) {
    var $cancel = $('<a/>', {class: 'cancel-search', href: '#'}).html('&times;').appendTo($input.parent()).on('click', function(e) {
        e.preventDefault();
        $input.val('').trigger('input');
    });
    $input.on('input', function() {
        var val = $input.val();
        if(val && val.length) {
            $cancel.show();
            $input.addClass('has-value');
        } else {
            $cancel.hide();
            $input.removeClass('has-value');
        }
    })
    $cancel.hide();
    if(style) $cancel.attr('style', style);
}

function crsaShowDate(date) {
    var monthNames = [
        "January", "February", "March",
        "April", "May", "June", "July",
        "August", "September", "October",
        "November", "December"
    ];
    var day = date.getDate();
    var monthIndex = date.getMonth();
    var year = date.getFullYear();

    return day + '. ' + monthNames[monthIndex] + ' ' + year;
}







/*
 * JavaScript MD5 1.0.1
 * https://github.com/blueimp/JavaScript-MD5
 *
 * Copyright 2011, Sebastian Tschan
 * https://blueimp.net
 *
 * Licensed under the MIT license:
 * http://www.opensource.org/licenses/MIT
 *
 * Based on
 * A JavaScript implementation of the RSA Data Security, Inc. MD5 Message
 * Digest Algorithm, as defined in RFC 1321.
 * Version 2.2 Copyright (C) Paul Johnston 1999 - 2009
 * Other contributors: Greg Holt, Andrew Kepert, Ydnar, Lostinet
 * Distributed under the BSD License
 * See http://pajhome.org.uk/crypt/md5 for more info.
 */

/*jslint bitwise: true */
/*global unescape, define */

(function ($) {
    'use strict';

    /*
     * Add integers, wrapping at 2^32. This uses 16-bit operations internally
     * to work around bugs in some JS interpreters.
     */
    function safe_add(x, y) {
        var lsw = (x & 0xFFFF) + (y & 0xFFFF),
            msw = (x >> 16) + (y >> 16) + (lsw >> 16);
        return (msw << 16) | (lsw & 0xFFFF);
    }

    /*
     * Bitwise rotate a 32-bit number to the left.
     */
    function bit_rol(num, cnt) {
        return (num << cnt) | (num >>> (32 - cnt));
    }

    /*
     * These functions implement the four basic operations the algorithm uses.
     */
    function md5_cmn(q, a, b, x, s, t) {
        return safe_add(bit_rol(safe_add(safe_add(a, q), safe_add(x, t)), s), b);
    }
    function md5_ff(a, b, c, d, x, s, t) {
        return md5_cmn((b & c) | ((~b) & d), a, b, x, s, t);
    }
    function md5_gg(a, b, c, d, x, s, t) {
        return md5_cmn((b & d) | (c & (~d)), a, b, x, s, t);
    }
    function md5_hh(a, b, c, d, x, s, t) {
        return md5_cmn(b ^ c ^ d, a, b, x, s, t);
    }
    function md5_ii(a, b, c, d, x, s, t) {
        return md5_cmn(c ^ (b | (~d)), a, b, x, s, t);
    }

    /*
     * Calculate the MD5 of an array of little-endian words, and a bit length.
     */
    function binl_md5(x, len) {
        /* append padding */
        x[len >> 5] |= 0x80 << (len % 32);
        x[(((len + 64) >>> 9) << 4) + 14] = len;

        var i, olda, oldb, oldc, oldd,
            a =  1732584193,
            b = -271733879,
            c = -1732584194,
            d =  271733878;

        for (i = 0; i < x.length; i += 16) {
            olda = a;
            oldb = b;
            oldc = c;
            oldd = d;

            a = md5_ff(a, b, c, d, x[i],       7, -680876936);
            d = md5_ff(d, a, b, c, x[i +  1], 12, -389564586);
            c = md5_ff(c, d, a, b, x[i +  2], 17,  606105819);
            b = md5_ff(b, c, d, a, x[i +  3], 22, -1044525330);
            a = md5_ff(a, b, c, d, x[i +  4],  7, -176418897);
            d = md5_ff(d, a, b, c, x[i +  5], 12,  1200080426);
            c = md5_ff(c, d, a, b, x[i +  6], 17, -1473231341);
            b = md5_ff(b, c, d, a, x[i +  7], 22, -45705983);
            a = md5_ff(a, b, c, d, x[i +  8],  7,  1770035416);
            d = md5_ff(d, a, b, c, x[i +  9], 12, -1958414417);
            c = md5_ff(c, d, a, b, x[i + 10], 17, -42063);
            b = md5_ff(b, c, d, a, x[i + 11], 22, -1990404162);
            a = md5_ff(a, b, c, d, x[i + 12],  7,  1804603682);
            d = md5_ff(d, a, b, c, x[i + 13], 12, -40341101);
            c = md5_ff(c, d, a, b, x[i + 14], 17, -1502002290);
            b = md5_ff(b, c, d, a, x[i + 15], 22,  1236535329);

            a = md5_gg(a, b, c, d, x[i +  1],  5, -165796510);
            d = md5_gg(d, a, b, c, x[i +  6],  9, -1069501632);
            c = md5_gg(c, d, a, b, x[i + 11], 14,  643717713);
            b = md5_gg(b, c, d, a, x[i],      20, -373897302);
            a = md5_gg(a, b, c, d, x[i +  5],  5, -701558691);
            d = md5_gg(d, a, b, c, x[i + 10],  9,  38016083);
            c = md5_gg(c, d, a, b, x[i + 15], 14, -660478335);
            b = md5_gg(b, c, d, a, x[i +  4], 20, -405537848);
            a = md5_gg(a, b, c, d, x[i +  9],  5,  568446438);
            d = md5_gg(d, a, b, c, x[i + 14],  9, -1019803690);
            c = md5_gg(c, d, a, b, x[i +  3], 14, -187363961);
            b = md5_gg(b, c, d, a, x[i +  8], 20,  1163531501);
            a = md5_gg(a, b, c, d, x[i + 13],  5, -1444681467);
            d = md5_gg(d, a, b, c, x[i +  2],  9, -51403784);
            c = md5_gg(c, d, a, b, x[i +  7], 14,  1735328473);
            b = md5_gg(b, c, d, a, x[i + 12], 20, -1926607734);

            a = md5_hh(a, b, c, d, x[i +  5],  4, -378558);
            d = md5_hh(d, a, b, c, x[i +  8], 11, -2022574463);
            c = md5_hh(c, d, a, b, x[i + 11], 16,  1839030562);
            b = md5_hh(b, c, d, a, x[i + 14], 23, -35309556);
            a = md5_hh(a, b, c, d, x[i +  1],  4, -1530992060);
            d = md5_hh(d, a, b, c, x[i +  4], 11,  1272893353);
            c = md5_hh(c, d, a, b, x[i +  7], 16, -155497632);
            b = md5_hh(b, c, d, a, x[i + 10], 23, -1094730640);
            a = md5_hh(a, b, c, d, x[i + 13],  4,  681279174);
            d = md5_hh(d, a, b, c, x[i],      11, -358537222);
            c = md5_hh(c, d, a, b, x[i +  3], 16, -722521979);
            b = md5_hh(b, c, d, a, x[i +  6], 23,  76029189);
            a = md5_hh(a, b, c, d, x[i +  9],  4, -640364487);
            d = md5_hh(d, a, b, c, x[i + 12], 11, -421815835);
            c = md5_hh(c, d, a, b, x[i + 15], 16,  530742520);
            b = md5_hh(b, c, d, a, x[i +  2], 23, -995338651);

            a = md5_ii(a, b, c, d, x[i],       6, -198630844);
            d = md5_ii(d, a, b, c, x[i +  7], 10,  1126891415);
            c = md5_ii(c, d, a, b, x[i + 14], 15, -1416354905);
            b = md5_ii(b, c, d, a, x[i +  5], 21, -57434055);
            a = md5_ii(a, b, c, d, x[i + 12],  6,  1700485571);
            d = md5_ii(d, a, b, c, x[i +  3], 10, -1894986606);
            c = md5_ii(c, d, a, b, x[i + 10], 15, -1051523);
            b = md5_ii(b, c, d, a, x[i +  1], 21, -2054922799);
            a = md5_ii(a, b, c, d, x[i +  8],  6,  1873313359);
            d = md5_ii(d, a, b, c, x[i + 15], 10, -30611744);
            c = md5_ii(c, d, a, b, x[i +  6], 15, -1560198380);
            b = md5_ii(b, c, d, a, x[i + 13], 21,  1309151649);
            a = md5_ii(a, b, c, d, x[i +  4],  6, -145523070);
            d = md5_ii(d, a, b, c, x[i + 11], 10, -1120210379);
            c = md5_ii(c, d, a, b, x[i +  2], 15,  718787259);
            b = md5_ii(b, c, d, a, x[i +  9], 21, -343485551);

            a = safe_add(a, olda);
            b = safe_add(b, oldb);
            c = safe_add(c, oldc);
            d = safe_add(d, oldd);
        }
        return [a, b, c, d];
    }

    /*
     * Convert an array of little-endian words to a string
     */
    function binl2rstr(input) {
        var i,
            output = '';
        for (i = 0; i < input.length * 32; i += 8) {
            output += String.fromCharCode((input[i >> 5] >>> (i % 32)) & 0xFF);
        }
        return output;
    }

    /*
     * Convert a raw string to an array of little-endian words
     * Characters >255 have their high-byte silently ignored.
     */
    function rstr2binl(input) {
        var i,
            output = [];
        output[(input.length >> 2) - 1] = undefined;
        for (i = 0; i < output.length; i += 1) {
            output[i] = 0;
        }
        for (i = 0; i < input.length * 8; i += 8) {
            output[i >> 5] |= (input.charCodeAt(i / 8) & 0xFF) << (i % 32);
        }
        return output;
    }

    /*
     * Calculate the MD5 of a raw string
     */
    function rstr_md5(s) {
        return binl2rstr(binl_md5(rstr2binl(s), s.length * 8));
    }

    /*
     * Calculate the HMAC-MD5, of a key and some data (raw strings)
     */
    function rstr_hmac_md5(key, data) {
        var i,
            bkey = rstr2binl(key),
            ipad = [],
            opad = [],
            hash;
        ipad[15] = opad[15] = undefined;
        if (bkey.length > 16) {
            bkey = binl_md5(bkey, key.length * 8);
        }
        for (i = 0; i < 16; i += 1) {
            ipad[i] = bkey[i] ^ 0x36363636;
            opad[i] = bkey[i] ^ 0x5C5C5C5C;
        }
        hash = binl_md5(ipad.concat(rstr2binl(data)), 512 + data.length * 8);
        return binl2rstr(binl_md5(opad.concat(hash), 512 + 128));
    }

    /*
     * Convert a raw string to a hex string
     */
    function rstr2hex(input) {
        var hex_tab = '0123456789abcdef',
            output = '',
            x,
            i;
        for (i = 0; i < input.length; i += 1) {
            x = input.charCodeAt(i);
            output += hex_tab.charAt((x >>> 4) & 0x0F) +
                hex_tab.charAt(x & 0x0F);
        }
        return output;
    }

    /*
     * Encode a string as utf-8
     */
    function str2rstr_utf8(input) {
        return unescape(encodeURIComponent(input));
    }

    /*
     * Take string arguments and return either raw or hex encoded strings
     */
    function raw_md5(s) {
        return rstr_md5(str2rstr_utf8(s));
    }
    function hex_md5(s) {
        return rstr2hex(raw_md5(s));
    }
    function raw_hmac_md5(k, d) {
        return rstr_hmac_md5(str2rstr_utf8(k), str2rstr_utf8(d));
    }
    function hex_hmac_md5(k, d) {
        return rstr2hex(raw_hmac_md5(k, d));
    }

    function md5(string, key, raw) {
        if (!key) {
            if (!raw) {
                return hex_md5(string);
            }
            return raw_md5(string);
        }
        if (!raw) {
            return hex_hmac_md5(key, string);
        }
        return raw_hmac_md5(key, string);
    }

    if (typeof define === 'function' && define.amd) {
        define(function () {
            return md5;
        });
    } else {
        $.md5 = md5;
    }
}(this));


// scales the canvas by (float) scale < 1
// returns a new canvas containing the scaled image.
function downScaleCanvas(cv, scale) {
    if (!(scale < 1) || !(scale > 0)) throw ('scale must be a positive number <1 ');
    var sqScale = scale * scale; // square scale = area of source pixel within target
    var sw = cv.width; // source image width
    var sh = cv.height; // source image height
    var tw = Math.ceil(sw * scale); // target image width
    var th = Math.ceil(sh * scale); // target image height
    var sx = 0, sy = 0, sIndex = 0; // source x,y, index within source array
    var tx = 0, ty = 0, yIndex = 0, tIndex = 0; // target x,y, x,y index within target array
    var tX = 0, tY = 0; // rounded tx, ty
    var w = 0, nw = 0, wx = 0, nwx = 0, wy = 0, nwy = 0; // weight / next weight x / y
    // weight is weight of current source point within target.
    // next weight is weight of current source point within next target's point.
    var crossX = false; // does scaled px cross its current px right border ?
    var crossY = false; // does scaled px cross its current px bottom border ?
    var sBuffer = cv.getContext('2d').
        getImageData(0, 0, sw, sh).data; // source buffer 8 bit rgba
    var tBuffer = new Float32Array(4 * sw * sh); // target buffer Float32 rgb
    var sR = 0, sG = 0,  sB = 0; // source's current point r,g,b
    // untested !
    var sA = 0;  //source alpha

    for (sy = 0; sy < sh; sy++) {
        ty = sy * scale; // y src position within target
        tY = 0 | ty;     // rounded : target pixel's y
        yIndex = 4 * tY * tw;  // line index within target array
        crossY = (tY != (0 | ty + scale));
        if (crossY) { // if pixel is crossing botton target pixel
            wy = (tY + 1 - ty); // weight of point within target pixel
            nwy = (ty + scale - tY - 1); // ... within y+1 target pixel
        }
        for (sx = 0; sx < sw; sx++, sIndex += 4) {
            tx = sx * scale; // x src position within target
            tX = 0 |  tx;    // rounded : target pixel's x
            tIndex = yIndex + tX * 4; // target pixel index within target array
            crossX = (tX != (0 | tx + scale));
            if (crossX) { // if pixel is crossing target pixel's right
                wx = (tX + 1 - tx); // weight of point within target pixel
                nwx = (tx + scale - tX - 1); // ... within x+1 target pixel
            }
            sR = sBuffer[sIndex    ];   // retrieving r,g,b for curr src px.
            sG = sBuffer[sIndex + 1];
            sB = sBuffer[sIndex + 2];
            sA = sBuffer[sIndex + 3];

            if (!crossX && !crossY) { // pixel does not cross
                // just add components weighted by squared scale.
                tBuffer[tIndex    ] += sR * sqScale;
                tBuffer[tIndex + 1] += sG * sqScale;
                tBuffer[tIndex + 2] += sB * sqScale;
                tBuffer[tIndex + 3] += sA * sqScale;
            } else if (crossX && !crossY) { // cross on X only
                w = wx * scale;
                // add weighted component for current px
                tBuffer[tIndex    ] += sR * w;
                tBuffer[tIndex + 1] += sG * w;
                tBuffer[tIndex + 2] += sB * w;
                tBuffer[tIndex + 3] += sA * w;
                // add weighted component for next (tX+1) px
                nw = nwx * scale
                tBuffer[tIndex + 4] += sR * nw; // not 3
                tBuffer[tIndex + 5] += sG * nw; // not 4
                tBuffer[tIndex + 6] += sB * nw; // not 5
                tBuffer[tIndex + 7] += sA * nw; // not 6
            } else if (crossY && !crossX) { // cross on Y only
                w = wy * scale;
                // add weighted component for current px
                tBuffer[tIndex    ] += sR * w;
                tBuffer[tIndex + 1] += sG * w;
                tBuffer[tIndex + 2] += sB * w;
                tBuffer[tIndex + 3] += sA * w;
                // add weighted component for next (tY+1) px
                nw = nwy * scale
                tBuffer[tIndex + 4 * tw    ] += sR * nw; // *4, not 3
                tBuffer[tIndex + 4 * tw + 1] += sG * nw; // *4, not 3
                tBuffer[tIndex + 4 * tw + 2] += sB * nw; // *4, not 3
                tBuffer[tIndex + 4 * tw + 3] += sA * nw; // *4, not 3
            } else { // crosses both x and y : four target points involved
                // add weighted component for current px
                w = wx * wy;
                tBuffer[tIndex    ] += sR * w;
                tBuffer[tIndex + 1] += sG * w;
                tBuffer[tIndex + 2] += sB * w;
                tBuffer[tIndex + 3] += sA * w;
                // for tX + 1; tY px
                nw = nwx * wy;
                tBuffer[tIndex + 4] += sR * nw; // same for x
                tBuffer[tIndex + 5] += sG * nw;
                tBuffer[tIndex + 6] += sB * nw;
                tBuffer[tIndex + 7] += sA * nw;
                // for tX ; tY + 1 px
                nw = wx * nwy;
                tBuffer[tIndex + 4 * tw    ] += sR * nw; // same for mul
                tBuffer[tIndex + 4 * tw + 1] += sG * nw;
                tBuffer[tIndex + 4 * tw + 2] += sB * nw;
                tBuffer[tIndex + 4 * tw + 3] += sA * nw;
                // for tX + 1 ; tY +1 px
                nw = nwx * nwy;
                tBuffer[tIndex + 4 * tw + 4] += sR * nw; // same for both x and y
                tBuffer[tIndex + 4 * tw + 5] += sG * nw;
                tBuffer[tIndex + 4 * tw + 6] += sB * nw;
                tBuffer[tIndex + 4 * tw + 7] += sA * nw;
            }
        } // end for sx
    } // end for sy

    // create result canvas
    var resCV = document.createElement('canvas');
    resCV.width = tw;
    resCV.height = th;
    var resCtx = resCV.getContext('2d');
    var imgRes = resCtx.getImageData(0, 0, tw, th);
    var tByteBuffer = imgRes.data;
    // convert float32 array into a UInt8Clamped Array
    var pxIndex = 0; //
    for (sIndex = 0, tIndex = 0; pxIndex < tw * th; sIndex += 4, tIndex += 4, pxIndex++) {
        tByteBuffer[tIndex] = Math.ceil(tBuffer[sIndex]);
        tByteBuffer[tIndex + 1] = Math.ceil(tBuffer[sIndex + 1]);
        tByteBuffer[tIndex + 2] = Math.ceil(tBuffer[sIndex + 2]);
        tByteBuffer[tIndex + 3] = Math.ceil(tBuffer[sIndex + 3]);
    }
    // writing result to canvas.
    resCtx.putImageData(imgRes, 0, 0);
    return resCV;
}


var crsaResizeImage = function(file, w, h, new_file) {
    var fs = require('fs');
    var tempCanvas = document.createElement('canvas');
    tempCanvas.width = w;
    tempCanvas.height = h;
    var ctx = tempCanvas.getContext('2d');
    var img = new Image();
    img.src = crsaMakeUrlFromFile(file);
    img.onload = function () {
        ctx.drawImage(this, 0, 0, w, h);

        var smallCanvas = downScaleCanvas(tempCanvas, 0.5);

        var image = smallCanvas.toDataURL('image/png');
        image = image.replace('data:image/png;base64,', '');
        var buffer = new Buffer(image, 'base64');
        fs.writeFileSync(new_file, buffer);
    };
}

function UseSelectize () {
    $('select[can-create-new="false"]').selectize({
        plugins: ['remove_button'],
        create: false
    });
    $('select[can-create-new="true"]').selectize({
        plugins: ['remove_button'],
        create: true
    });
    var currentItem;
    var selectedOption;
    var dbClick = false;

    $('.selectize-control').dblclick(function (event) {
        event.preventDefault();
        var $select = $(this).siblings('select');
        if ($select.attr('multiple')) return;

        var selectize = $select[0].selectize;
        currentItem = selectize.items[0];
        selectedOption = selectize.options[currentItem];

        if (selectedOption) {
            selectize.setValue();
            $(this).find('.selectize-input input').css('width', '100%');
            $(this).find('.selectize-input input').val(selectedOption.text).change().select();
        }
        selectize.open();
        dbClick = true;
    });

    $('.selectize-control').on('blur', '.selectize-input input', function () {
        var $select = $(this).siblings('select');
        if ($select.attr('multiple')) return;

        var selectize = $select[0].selectize;
        if (dbClick && selectedOption) {
            var inputVal = $(this).val();
            if (inputVal == selectedOption.text) {
                selectize.setValue(selectedOption.value);
            }
            dbClick = false;
        }
    });
}

function takeElementPhoto ($el, filename, comp) {
    var fs = require('fs');

    pinegrow.takePhotoOfElement($el, 400.0, filename, function() {
        pinegrow.showQuickMessage('Screenshot has been taken.');
        pinegrow.cache_breaker++;

        var gui = require('nw.gui');
        gui.App.clearCache();

        comp.preview_image = comp.type + '.png';

        pinegrow.frameworksChanged();
    });
}

function useSelete2 () {
    $('select').select2({
        allowClear: true
    });
}

// for dev only
function addTakePreviewImage (f) {
    f.on_build_actions_menu = function(page, menus, pgel, $el) {
        menus.push({
            label: "Take preview image",
            kbd: null,
            action: function($el) {

                var selectedComp = null;
                for (var comp in f.component_types) {
                    var currentComp = f.component_types[comp];

                    if (currentComp.selector) {
                        var selector = currentComp.selector;
                        if (typeof(currentComp.selector) == "function") {
                            selector = currentComp.selector($el);
                        }
                        else {
                            selector = pgel.is(selector)
                        }

                        if (selector) {
                            selectedComp = currentComp;
                            break;
                        }
                    }
                }

                if (selectedComp) {
                    var filename = crsaCombineCurrentUrlWith(crsaCleanUpUrl(f.getImagePreviewBaseUrl()), selectedComp.type) + '.png';
                    takeElementPhoto ($el, crsaMakeFileFromUrl(filename), selectedComp);
                }
                else {
                    pinegrow.showQuickMessage('Component not found!');
                }
            }
        });
    };
}


// CSS helpers
function styleToObject (style) {
    if (style) {
        styleArr = style.split(';');
        var styleObj = {};
        for (var i=0; i<styleArr.length; i++) {
            if (styleArr[i] != "") {
            var keyVal = styleArr[i].split(':');
            styleObj[keyVal[0]] = keyVal[1];
        }
    }
    return styleObj;
    }
    else {
        return {};
    }
}

function objectToStyle (styleObj) {
    var style = "";
    for (var key in styleObj) {
        style += key+":"+styleObj[key]+";";
    }
    return style;
}

function getNewStyle (currentStyle, newStyle, oldStyle) {
    var currentStyleObj = styleToObject(currentStyle);
    var newStyleObj = styleToObject(newStyle);
    var oldStyleObj = styleToObject(oldStyle);

    for (var key in oldStyleObj) {
        var value = currentStyleObj[key];
        if (value)
           delete currentStyleObj[key]
    }

    for (var key in newStyleObj) {
        currentStyleObj[key] = newStyleObj[key];
    }

    return objectToStyle(currentStyleObj);
}

function getStyleFor (attr, value) {
    return attr + ":" + value + ";";
}

function setStyle (pgel, newStyle, oldStyle) {
    if (!pgel) return;
    var currentStyle = pgel.attr('style');
    pgel.attr('style', getNewStyle(currentStyle, newStyle, oldStyle));
}

function crsaCopyToClipboard (text) {
  var $temp = $("<input>");
  $("body").append($temp);
  $temp.val(text).select();
  document.execCommand("copy");
  $temp.remove();
}

function crsaGetNextElement (currElement, selector) {
    var elements = $(selector);
    var currentIndex = elements.index(currElement);
    return elements[currentIndex + 1];
}

function crsaGetPrevElement (currElement, selector) {
    var elements = $(selector);
    var currentIndex = elements.index(currElement);
    return elements[currentIndex - 1];
}

function crsaCamelize(str) {
  return str.replace(/^([a-z])/, function(letter, index) {
    return index == 0 ? letter.toLowerCase() : letter.toUpperCase();
  }).replace(/\s+/g, '');
}

function crsaHtmlEncode(s) {
  var el = document.createElement("div");
  el.innerText = el.textContent = s;
  s = el.innerHTML;
  return s;
}

function pgRemoveMultiselects($el) {
    $el.find('.crsa-input[data-autocomplete]').each(function (i, elm) {
        var autoComplete = $(elm).data('pg-autocomplete')
        autoComplete.remove(true);
        $(elm).data('pg-autocomplete', autoComplete = null);
    });
}

// End CSS helpers

//Length
//https://raw.githubusercontent.com/heygrady/Units/master/Length.js

(function(window, document, undefined){
    "use strict";

// create a test element
    var testElem = document.createElement('test'),
        docElement = document.documentElement,
        defaultView = document.defaultView,
        getComputedStyle = defaultView && defaultView.getComputedStyle,
        computedValueBug,
        runit = /^(-?[\d+\.\-]+)([a-z]+|%)$/i,
        convert = {},
        conversions = [1/25.4, 1/2.54, 1/72, 1/6],
        units = ['mm', 'cm', 'pt', 'pc', 'in', 'mozmm'],
        i = 6; // units.length

// add the test element to the dom
    docElement.appendChild(testElem);

// test for the WebKit getComputedStyle bug
// @see http://bugs.jquery.com/ticket/10639
    if (getComputedStyle) {
        // add a percentage margin and measure it
        testElem.style.marginTop = '1%';
        computedValueBug = getComputedStyle(testElem).marginTop === '1%';
    }

// pre-calculate absolute unit conversions
    while(i--) {
        convert[units[i] + "toPx"] = conversions[i] ? conversions[i] * convert.inToPx : toPx(testElem, '1' + units[i]);
    }

// remove the test element from the DOM and delete it
    docElement.removeChild(testElem);
    testElem = undefined;

// convert a value to pixels
    function toPx(elem, value, prop, force) {
        // use width as the default property, or specify your own
        prop = prop || 'width';

        var style,
            inlineValue,
            ret,
            unit = (value.match(runit)||[])[2],
            conversion = unit === 'px' ? 1 : convert[unit + 'toPx'],
            rem = /r?em/i;

        if (conversion || rem.test(unit) && !force) {
            // calculate known conversions immediately
            // find the correct element for absolute units or rem or fontSize + em or em
            elem = conversion ? elem : unit === 'rem' ? docElement : prop === 'fontSize' ? elem.parentNode || elem : elem;

            // use the pre-calculated conversion or fontSize of the element for rem and em
            conversion = conversion || parseFloat(curCSS(elem, 'fontSize'));

            // multiply the value by the conversion
            ret = parseFloat(value) * conversion;
        } else {
            // begin "the awesome hack by Dean Edwards"
            // @see http://erik.eae.net/archives/2007/07/27/18.54.15/#comment-102291

            // remember the current style
            style = elem.style;
            inlineValue = style[prop];

            // set the style on the target element
            try {
                style[prop] = value;
            } catch(e) {
                // IE 8 and below throw an exception when setting unsupported units
                return 0;
            }

            // read the computed value
            // if style is nothing we probably set an unsupported unit
            ret = !style[prop] ? 0 : parseFloat(curCSS(elem, prop));

            // reset the style back to what it was or blank it out
            style[prop] = inlineValue !== undefined ? inlineValue : null;
        }

        // return a number
        return ret;
    }

// return the computed value of a CSS property
    function curCSS(elem, prop) {
        var value,
            pixel,
            unit,
            rvpos = /^top|bottom/,
            outerProp = ["paddingTop", "paddingBottom", "borderTop", "borderBottom"],
            innerHeight,
            parent,
            i = 4; // outerProp.length

        if (getComputedStyle) {
            // FireFox, Chrome/Safari, Opera and IE9+
            value = getComputedStyle(elem)[prop];
        } else if (pixel = elem.style['pixel' + prop.charAt(0).toUpperCase() + prop.slice(1)]) {
            // IE and Opera support pixel shortcuts for top, bottom, left, right, height, width
            // WebKit supports pixel shortcuts only when an absolute unit is used
            value = pixel + 'px';
        } else if (prop === 'fontSize') {
            // correct IE issues with font-size
            // @see http://bugs.jquery.com/ticket/760
            value = toPx(elem, '1em', 'left', 1) + 'px';
        } else {
            // IE 8 and below return the specified style
            value = elem.currentStyle[prop];
        }

        // check the unit
        unit = (value.match(runit)||[])[2];
        if (unit === '%' && computedValueBug) {
            // WebKit won't convert percentages for top, bottom, left, right, margin and text-indent
            if (rvpos.test(prop)) {
                // Top and bottom require measuring the innerHeight of the parent.
                innerHeight = (parent = elem.parentNode || elem).offsetHeight;
                while (i--) {
                    innerHeight -= parseFloat(curCSS(parent, outerProp[i]));
                }
                value = parseFloat(value) / 100 * innerHeight + 'px';
            } else {
                // This fixes margin, left, right and text-indent
                // @see https://bugs.webkit.org/show_bug.cgi?id=29084
                // @see http://bugs.jquery.com/ticket/10639
                value = toPx(elem, value);
            }
        } else if ((value === 'auto' || (unit && unit !== 'px')) && getComputedStyle) {
            // WebKit and Opera will return auto in some cases
            // Firefox will pass back an unaltered value when it can't be set, like top on a static element
            value = 0;
        } else if (unit && unit !== 'px' && !getComputedStyle) {
            // IE 8 and below won't convert units for us
            // try to convert using a prop that will return pixels
            // this will be accurate for everything (except font-size and some percentages)
            value = toPx(elem, value) + 'px';
        }
        return value;
    }

// expose the conversion function to the window object
    window.Length = {
        toPx: toPx
    };
}(this, this.document));


if(!Object.values) {
    Object.values = function(obj) {
        var vals = [];

        for (var key in obj) {
            if (obj.hasOwnProperty(key)) {
                vals.push(obj[key]);
            }
        }
        return vals;
    }
}
