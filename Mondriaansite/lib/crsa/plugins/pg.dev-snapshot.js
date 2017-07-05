$(function () {
    $('body').one('pinegrow-ready', function (e, pinegrow) {//Wait for Pinegrow to start-up

        var f = new PgFramework('pg.dev-snapshot', 'PG Dev Snapshot');
        pinegrow.addFramework(f);

        f.default = true;
        f.show_in_manager = false;

        var fs = require('fs');
        var path = require('path');

        var snap = function() {

            var html = '<!DOCTYPE html>\n<html>' + $('html').html() + '</html>';
            var p = new pgParser();
            p.assignIds = false;
            p.parse(html);

            var scripts = p.rootNode.find('script');
            for(var i = 0; i < scripts.length; i++) {
                scripts[i].remove();
            }

            var ifs = p.rootNode.find('iframe');
            for(var i = 0; i < ifs.length; i++) {
                ifs[i].setAttr('src', pinegrow.getOriginalUrl(ifs[i].getAttr('src')));
            }

            p.rootNode.findOne('head').prepend(pgCreateNodeFromHtml('<base href="' + window.location.href.replace('edit.html','') + '">'));

            html = p.rootNode.toStringOriginal(true, pinegrow.getFormatHtmlOptions());

            crsaChooseFile(function(url, file) {
                fs.writeFileSync(file, html, {encoding: "utf8"});

                pinegrow.showQuickMessage('UI snap saved!');
            }, 'snap.html');

            /*
            var dir = path.join(path.dirname(crsaMakeFileFromUrl(window.location.href)), 'ui');

            pinegrow.showPrompt('Snapshot name', 'Give me a name!', null, 'snap', null, function(val) {
                val = val + '.html';
                var file = path.join(dir, val);

                fs.writeFileSync(file, html, {encoding: "utf8"});

                pinegrow.showQuickMessage('UI snap saved!');
            })

*/
        }

        var $button = $('<a href="#" class="news-box-button"><i class="fa fa-camera"></i></a>');
        $button.appendTo($('.news-button-container'));

        $button.on('click', function(e) {
            e.preventDefault();
            snap();
        })
    });
});