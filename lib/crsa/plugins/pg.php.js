/**
 * Created by Matjaz on 06/11/15.
 */
$(function () {
    $('body').one('pinegrow-ready', function (e, pinegrow) {//Wait for Pinegrow to start-up

        var f = new PgFramework('pg.php', 'Server-side Scripts');
        pinegrow.addFramework(f);

        f.default = false;
        f.show_in_manager = true;
        f.no_type_maps = true; //disable fast tag matching because php <> ?php

        var fs = require('fs');
        var path = require('path');

        f.detect = function(page) {
            var ext = crsaGetExtFromUrl(page.url);
            if(hasScripts(page.sourceNode) || (ext && page.localFile && ['php', 'php5', 'asp', 'aspx'].indexOf(ext.toLowerCase()) >= 0)) {
                return true;
            }
            return false;
        }

        var hasScripts = function(node) {
            var has = false;
            node.walk(function(n) {
                if(n.script_info) {
                    has = n.script_info;
                    return false;
                }
                return true;
            })
            if(has) {
                //$phpmenu.find('>a>span').text(has.name);
            }
            return has;
        }


        var prepareForEditing = function(page, file) {
            var php_code = fs.readFileSync(file.path, {encoding: "utf8"});
            var p = new pgParser();
            p.assignIds = true;
            p.replaceExistingIds = true;
            p.nodeCatalogue = null;
            p.idPrefix = 'php';
            p.parse(php_code);
            var opts = pinegrow.getFormatHtmlOptions();
            opts.php_ids = true;
            var php_code_with_ids = p.rootNode.toStringOriginal(true, opts);
//            var php_code_with_ids = p.rootNode.toStringWithIds(true, opts);
            fs.writeFileSync(file.path, php_code_with_ids, {encoding: "utf8"});
            pinegrow.showQuickMessage(file.name + ' prepared for PHP editing.');
        }

        /*
        f.on_project_item_get_context_menu = function(page, file, project) {


            var items = [];

            items.push({
                divider: true,
                header: 'PHP'
            })
            if(file.isEditable) {
                items.push({
                    label: "Prepare for editing...",
                    func: function() {
                        prepareForEditing(page, file);
                    }
                })
            }
            return items;

        }
        */

        f.on_set_inline_style = function(page, o) {
            o.css += 'php {display:none !important; }\
            html.crsa-php-mark-areas php {\
            display: inline-block !important;\
            background-color: #FFF9BA;\
            color: #555;\
            }';
        }

        pinegrow.resetEditableFileTypes();

        f.on_get_editable_file_types = function(page, list) {
            list.push('.php');
            list.push('.php4');
            list.push('.php5');
            list.push('.ctp');
            list.push('.asp');
            list.push('.aspx');
            list.push('.erb');
        }

        f.on_can_make_change = function(page, pgel, action, data) {
            //another framework already prevented it
            if(page.getCurrentFrameworkHandlerReturnValue('on_can_make_change')) return page.getCurrentFrameworkHandlerReturnValue('on_can_make_change');

            if(pgel.script) {
                switch(action) {
                    case 'insert_element':
                        return new PgEditException('Script elements can\'t have nested elements.');
                }
            }
            return null;
        }

        var $phpmenu = $('<li class="dropdown phc-menu"><a href="#" class="dropdown-toggle" data-toggle="dropdown"><span>PHP, ASP, ERB</span><b class="caret"></b></a>\
    <ul class="dropdown-menu with-checkboxes">\
        <li><a href="#" class="php-menu-mark"><i class="fa fa-check"></i>Show server-side code</a></li>\
    </ul></li>');

        pinegrow.addPluginControlToTopbar(f, $phpmenu);

        var $mark_areas = $phpmenu.find('.php-menu-mark');
        var $mark_areas_checkbox = $mark_areas.find('i');

        var set_mark_areas = function(value) {
            $.each(pinegrow.getAllPages(), function(i, cp) {
                var $html = cp.get$Html();
                if($html) {
                    if(value) {
                        $html.addClass('crsa-php-mark-areas');
                    } else {
                        $html.removeClass('crsa-php-mark-areas');
                    }
                }
            })
            if(value) {
                $mark_areas_checkbox.show();
            } else {
                $mark_areas_checkbox.hide();
            }
        }

        set_mark_areas(pinegrow.getSetting('php-mark-areas', '1') == '1');

        $mark_areas
            .on('click', function(e) {
                e.preventDefault();
                var value = pinegrow.getSetting('php-mark-areas', '1') == '1';
                value = !value;
                set_mark_areas(value);
                pinegrow.setSetting('php-mark-areas', value ? '1' : '0');
            });

        f.on_page_loaded = function(crsaPage) {
            set_mark_areas(pinegrow.getSetting('php-mark-areas', '1') == '1');

            var good_code = '<div class="col <?php echo $active;?>">\n\
    <p><?php echo $title;?></p>\n\
</div>';
            good_code = escapeHtmlCode(good_code);

            var bad_code = '<?php if($active) {?>\n\
    <div class="col active">\n\
<?php } else { ?>\n\
    <div class="col">\n\
<?php } ?>\n\
    ...\n\
</div>';

            bad_code = escapeHtmlCode(bad_code);

            var msg = '<p>Server-side tags editing mode (in <b>BETA</b> at the moment) is designed for editing <b>HTML code with PHP, ASP and ERB tags</b>, not for general server-side code editing.</p><p>For best results the HTML layout should be valid, with all tags properly closed.</p><p>For example, this is OK:</p><pre>' + good_code + '</pre><p>...but code like this will NOT display nicely in Pinegrow and editing &amp; saving it might lead to unintended results:</p><pre>' + bad_code + '</pre><p>Use <b>PHP, ASP, ERB -&gt; Show server-side code</b> in the toolbar menu to toggle PHP code display in page view.</p>';

            if(crsaPage.sourceNode.validateTree().length) {
                msg = '<p><b>Looks like the HTML code has some tags that are not closed properly.</b></p>' + msg;
                pinegrow.showAlert(msg, 'About PHP, ASP and ERB editing');
            } else {
                pinegrow.showNotice(msg, 'About PHP, ASP and ERB editing', 'about-php-editing');

            }
        }

        f.on_page_refreshed = function(crsaPage) {
            set_mark_areas(pinegrow.getSetting('php-mark-areas', '1') == '1');
        }

        var php_def = new PgComponentType('php.tag', 'PHP Tag');
        php_def.selector = 'php';
        php_def.code = '<?php mmmm ?>';
        php_def.get_name = function($e) {
            switch($e.attr('data-pg-script-type')) {
                case 'asp':
                    return '&lt;%';
                default:
                    return 'php';
            }
        }

        f.addComponentType(php_def);

        var lib = [
            ['<?php', '<?php //code ?>'],
            ['<?=', '<?= $variable ?>'],
            ['<?', '<? //code ?>'],
            ['<%', '<% //code %>'],
            ['<%=', '<%= //code %>'],
            ['<%:', '<%: //code %>'],
            ['<%#', '<%# //code %>']
        ]

        var a = [];

        lib.forEach(function(d, i) {
            var def = new PgComponentType('php.tag.' + 1, escapeHtmlCode(d[0]));
            def.selector = null;
            def.code = d[1];
            def.preview = escapeHtmlCode(d[1]);
            a.push(def);
        })

        var section = new PgFrameworkLibSection('php.tags', 'PHP, ASP, ERB');
        //Pass components in array
        section.setComponentTypes(a);
        f.addLibSection(section);


    })
});