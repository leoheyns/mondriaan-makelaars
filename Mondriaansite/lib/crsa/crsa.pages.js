var crsaPageUid = 1;

var CrsaPageTemplate = function() {

    this.type = null;
    this.header = null;
    this.html = null;

    this.detect = function(source) {
        //check liquid
        if(source.indexOf('---') != 0) return false;

        var a = source.split('---');
        if(a.length < 3) return false;

        this.type = 'liquid';
        this.header = '---' + a[1] + '---';
        a.splice(0,2);

        this.html = a.length == 1 ? a[0] : a.join('---');
        return true;
    }

    this.getTemplateSource = function(full_html) {
        if(!this.type) return full_html;
        return this.header + "\n" + full_html;
    }

    this.getHtml = function() {
        return this.html;
    }

}

var CrsaPage = function(not_interactive) {
    this.url = null;
    this.wrapper_url = null;
    //this.wrapper_url = 'file:///Users/Matjaz/Dropbox/Development/DVWeb/DV/Pinegrow/package/frameworks/bootstrap3.3.5/template/jumbotron.html';
    this.wrapper_selector = null;
    this.name = null;
    this.localFile = null;
    this.localFileWatcher = null;
    this.lastSavedAt = 0;
    this.$iframe = null;
    this.$page = null;
    this.visible = true;
    this.loading = false;
    this.changed = true;
    this.force_close = false;
    this.live_update = null;
    this.save_parent = false;
    this.uid = crsaPageUid++;
    this.undoStack = new CrsaPageUndoStack(this);
    this.undoSetFlag = false;
    this.exists = false;
    this.crsaProjectTemplate = null;
    this.allowReload = false;
    this.readOnly = false;
    this.treeTop = null;
    this.treeRepaintOnShow = null;
    this.treeCurrentRoot = null;
    this.load_source = null;
    this.frameworks_added = false;
    this.breakpoints = [];
    this.openedInEditor = true;
    this.onlyCode = false;
    this.code = null;

    this.currentFrameworkHandlerReturnValues = {};

    this.sourceNode = null;
    this.selected_element_pgid = null;

    this.scrollMode = true; //crsaGetCustomLogic().scrollMode;
    this.deviceWidth = 1024;

    this.template = new CrsaPageTemplate();
    this.frameworks = [];
    this.animationsStopped = false;
    this.javascriptEnabled = pinegrow.getSetting('javascript-enabled', '1') == '1';

    this.assetsCache = {};

    this.show_head_in_tree = false;
    this.externalWindow = null;

    this.showInExternalWindow = function() {
        var gui = require('nw.gui');

        this.externalWindow = gui.Window.open('empty.html', {
            focus: true
        });

        this.externalWindow.on('close', function () {
            _this.externalWindow.close(true);
            _this.externalWindow = null;
        });
        this.externalWindow.setAlwaysOnTop(true);

        var loaded = false;
        this.externalWindow.on('loaded', function() {
            if(!loaded) {
                //debugger;
                _this.allowReload = true;
                var $win_body = $(_this.externalWindow.window.document.body);
                _this.$page.appendTo($win_body.find('#win-content'));
                loaded = true;
            }
        });
    }

    this.fromFile = function(file, only_code) {

        if(typeof only_code == 'undefined') only_code = false;

        this.url = crsaMakeUrlFromFile( file );
        this.name = crsaGetNameFromUrl( this.url );
        this.localFile = file;
        this.visible = false;
        this.changed = false;
        this.exists = true;
        this.openedInEditor = false;
        this.onlyCode = only_code;

        var profile = new CrsaProfile(true);

        var fs = require('fs');

        var data = fs.readFileSync(file);
        var html = data.toString('utf8');

        if(only_code) {
            this.code = html;
        } else {
            var p = new pgParser();
            p.assignIds = false;
            p.nodeCatalogue = null;
            p.parse(html);
            this.sourceNode = p.rootNode;

            this.callGlobalFrameworkHandler('on_page_parsed_in_proxy', this.sourceNode, this.url);

            profile.show('FROM FILE PARSE ' + this.localFile);
        }
    }

    this.getCode = function() {
        return this.onlyCode ? this.code : this.sourceNode.toStringOriginal(true, pinegrow.getFormatHtmlOptions());
    }

    this.setLocalFile = function(file) {
        if(isApp()) {
            this.stopWatchingFileForChanges();
        }

        this.localFile = file;

        if(isApp()) {
            this.watchFileForChanges();
        }
    }

    this.scrollToPage = function() {
        scrollCanvasToPage(this.$iframe);
    }

    this.setJavascriptEnabled = function(value) {
        if(this.javascriptEnabled != value) {
            this.javascriptEnabled = value;
            //pinegrow.setSetting('javascript-enabled', value ? '1' : '0');
            this.refresh();
        }
    }

    this.hasScripts = function(at_least) {
        if(typeof at_least == 'undefined') at_least = 4;
        var list = this.sourceNode.find('script');
        return list.length >= at_least;
    }

    this.makeRelativeUrl = function(url) {
        return crsaMakeLinkRelativeTo(url, crsaMakeUrlAbsolute(_this.url));
    }

    this.makeAbsoluteUrl = function(relative_url) {
        if(crsaIsAbsoluteUrl(relative_url)) return relative_url;
        return require('url').resolve(this.url, relative_url);
        //return crsaGetBaseForUrl(this.url) + '/' + relative_url;
    }


    this.watchFileOnFileChanged = function(curr, prev) {
        //console.log('ccccccccc');
        //return;
        var fs = require('fs');

        var updatePage = function(v) {
            var ret = _this.applyChangesToSource(v, false, false, true);

            if(ret.updated) {
                crsaQuickMessage("Auto refreshed!");
                if(ret.changes && ret.changes.length == 1) {
                    var $el = _this.getElementWithPgId(ret.changes[0].changed.getId());
                    if($el) {
                        pinegrow.selectElement($el);
                        pinegrow.scrollCanvasToElement($el);
                    }
                }
            } else if(ret.changes && !ret.update) {
                //whole document is changed
                _this.refresh();
            }
            _this.setPageChanged(false);

            _this.callFrameworkHandler('on_page_loaded_from_external');
        }

        if(curr.mtime > prev.mtime && !_this.live_update && pinegrow.getSetting('auto-reloading', '1') == '1') {
            var ct = (new Date()).getTime();
            if(ct - _this.lastSavedAt > 5000) {
                console.log(_this.localFile + ' changed');

                var code = fs.readFileSync(_this.localFile, {encoding: "utf8"});

                pinegrow.codeEditors.isCodeForUrlSameInExternalEditor(_this.url, code, function(same) {

                    if(_this.watchReloadDialog) {
                        try {
                            _this.watchReloadDialog.modal('hide');
                            _this.watchReloadDialog = null;
                        } catch(err) {}
                    }

                    if(same) return;

                    if(_this.changed) {

                        _this.watchReloadDialog = showAlert('<p><b>' + _this.name + '</b> was modified outside of Pinegrow. The file has unsaved changes. Do you want to reload it?</p><p><em>You can disable auto-reloading in Support -&gt; Settings.</em></p>',  "Unsaved file modified outside of Pinegrow", "Don't reload", "Reload", function() {
                            _this.watchReloadDialog = null;
                        }, function() {
                            _this.watchReloadDialog = null;
                            updatePage(code);
                        });
                    } else {
                        updatePage(code);
                    }
                })

            } else {
               // console.log(_this.localFile + ' changed in PG');
            }
        }
    }

    this.isWatchingFileForChanges = false;
    this.watchReloadDialog = null;

    this.watchFileForChanges = function() {
        if(this.localFile && pinegrow.getSetting('auto-reloading', '1') == '1') {
            var fs = require('fs');
            this.localFileWatcher = fs.watchFile(this.localFile, {persistent: true, interval: 1102}, this.watchFileOnFileChanged);
            this.isWatchingFileForChanges = true;
        }
    }

    this.stopWatchingFileForChanges = function() {
        if(this.localFile && this.isWatchingFileForChanges) {
            var fs = require('fs');
            fs.unwatchFile(this.localFile, this.watchFileOnFileChanged);
            this.isWatchingFileForChanges = false;
        }
    }

    this.getAsset = function(url) {
        if(url in this.assetsCache) return this.assetsCache[url];
        return null;
    }

    this.addAsset = function(url, data) {
        this.assetsCache[url] = data;
    }

    this.clearAssetsCache = function() {
        this.assetsCache = {};
    }

    var _this = this;
    var pageChangedTimer = null;
    var cssid = 'crsa-inline-styles';

    var componentTypes = null;
    var componentTypesDict = {};
    var libSections = null;
    var actionsSections = null;

    var onServerPageLoaded = function(event, obj) {
        var pageid = obj.pageId;
        if(pageid == _this.uid) {
            console.log('Source loaded ' + obj.url);
            _this.sourceNode = obj.rootNode;
        }
        return;

        var m = obj.url.match(/pgid=([0-9]+)/);
        if(m) {
            var pageid = parseInt(m[1]);
            if(pageid == _this.uid) {
                console.log('Source loaded ' + obj.url);
                _this.sourceNode = obj.rootNode;
            }
        }
    }

    if(pinegrow.sourceParser && !not_interactive) {
        $('body').on('crsa-server-page-loaded', onServerPageLoaded);
    }

    this.onClose = function() {
        $('body')
            .off('crsa-server-page-loaded', onServerPageLoaded)
            .off('.page' + this.uid);

        this.setPageChanged(false, true);
        this.setLocalFile(null); //will remove file watchers

        var doc = this.getDocument();
        $(doc).off('.crsa');

        this.$iframe.get(0).contentWindow.ondragover = null;
        this.$iframe.get(0).contentWindow.ondrop = null;
        this.$iframe.get(0).contentWindow.onbeforeunload = null;

        $(this.$iframe.get(0).contentWindow).off('.crsa');

        addScrollHandlerToFrame(this.$iframe, true /* remove */);

        this.undoStack = null;

        var ps = this.$iframe.data('crsa-page-styles');
        if(ps) {
            ps.destroy();
        }
        this.$iframe.data('crsa-page-styles', null);

        this.$iframe.off('.crsa');


        this.$iframe.remove();
        this.$iframe = null;
        this.$page.find('.device-menu').remove();
        this.$page = null;


        //pgParserNodeCatalogueInstance.logStat();
        this.sourceNode.remove();
        //pgParserNodeCatalogueInstance.logStat();

        //.attr('src','about:blank');

        //_this = null;
    }

    this.close = function () {
        $.fn.crsapages('closePage', this);
    }

    this.refreshDisplay = function() {
/*
        var t = this.$iframe.css('transform');
        this.$iframe.css('transform', 'none');

        var h = this.$iframe.get(0).offsetHeight;
        this.$iframe.css('transform', t);
        */

        var $contents = this.$iframe.contents();
        var o = $contents.scrollTop();
        $(this.getBody()).redraw();
        $contents.scrollTop(o);
/*
        var element = this.getBody();
        var disp = element.style.display;
        element.style.display = 'none';
        var trick = element.offsetHeight;
        element.style.display = disp;*/
    }

    this.getPageUrlFromLoadedUrl = function(url) {
        url = pinegrow.getOriginalUrl(url);
        url = url.replace(/&*pgid=[0-9]+/, '');
        url = url.replace('?pgedit=1', '').replace('&pgedit=1', '').replace('pgedit=1', '');
        if(url.length && url.charAt(url.length-1) == '?') {
            url = url.substr(0, url.length-1);
        }
        return url;
    }

    this.getPreviewUrl = function(noids) {
        var url = crsaMakeUrlAbsolute(this.url);

        var a = ['pgid=' + this.uid, 'pglive=1'];
        if(noids) a.push('pgnoids=1');

        //url += 'pgid=' + this.uid + '&pglive=1';
        url = crsaAppendQueryToUrl(url, a);
        url = pinegrow.getProxyUrl(url);

        return url;
    }

    var resetFrameworksCache = function() {
        componentTypes = null;
        libSections = null;
        actionsSections = null;
        componentTypesDict = null;
    }

    this.getComponentTypes = function() {
        if(!componentTypes) {
            componentTypes = [];

            for(var i = 0; i < this.frameworks.length; i++) {
                var f = this.frameworks[i];
                if(f.not_main_types) continue;
                $.each(f.getComponentTypes(), function(key, def) {
                    componentTypes.push(def);
                });
            }
            componentTypes.sort(function(a,b) {
                return a.priority - b.priority;
            });
            componentTypesDict = {};
            $.each(componentTypes, function(i, def) {
                if(!componentTypesDict[def.type]) {
                    componentTypesDict[def.type] = def;
                }
            });
        }
        return componentTypes;
    }

    this.setComponentTypesInformation = function(info) {
        componentTypes = info.list;
        componentTypesDict = info.dict;
        this.frameworks = info.frameworks;
    }

    this.getComponentTypesInformation = function() {
        this.getComponentTypes();
        return {list: componentTypes, dict: componentTypesDict, frameworks: this.frameworks};
    }

    this.getPageStylesheets = function() {
        return getCrsaPageStylesForPage(this.$iframe);
    }

    this.getPageStylesheet = function(re) {
        var list = this.getPageStylesheets().stylesheets;
        for(var i = 0; i < list.length; i++) {
            if(typeof re == 'string') {
                if(list[i].url == re) return list[i];
            } else {
                if (list[i].url.match(re)) return list[i];
            }
        }
        return null;
    }

    this.hasLinkedStylesheet = function(url) {
        var links = this.sourceNode.find('link');
        for(var i = 0; i < links.length; i++) {
            if(links[i].getAttr('href') == url) return links[i];
        }
        return null;
    }

    this.getViewHTMLForElement = function(pgel, disable_js) {
        disable_js = true;
        var origjs = this.javascriptEnabled;
        if(disable_js) this.javascriptEnabled = false;
        pinegrow.httpServer.setCurrentRequestContext(this.url, this.sourceNode);
        var html = pgel.toStringWithIds(true, pinegrow.getFormatHtmlOptions(), pinegrow.httpServer.createProxyUrlNodeOutputFilter);
        this.javascriptEnabled = origjs;
        return html;
    }

    this.getViewInnerHTMLForElement = function(pgel, disable_js) {
        disable_js = true;
        var origjs = this.javascriptEnabled;
        if(disable_js) this.javascriptEnabled = false;
        pinegrow.httpServer.setCurrentRequestContext(this.url, this.sourceNode);
        var html = pgel.toStringWithIds(true, pinegrow.getFormatHtmlOptions(), pinegrow.httpServer.createProxyUrlNodeOutputFilter, true);
        this.javascriptEnabled = origjs;
        return html;
    }

    this.addStylesheet = function(url, update_list, done) {
        var cs = this.getPageStylesheet(url);
        if(cs) {
            if(done) done(cs);
            return false;
        }
        url = this.makeRelativeUrl(url);
        if(this.hasLinkedStylesheet(url)) {
            if(done) done();
            return false;
        }
        var code = '<link rel="stylesheet" href="' + url + '">';
        var head_pgel = this.sourceNode.findOne('head');
        var css_el = pgCreateNodeFromHtml(code);

        head_pgel.append(css_el);

        if(this.openedInEditor) {
            var $head = this.get$Html().find('head');
            code = this.getViewHTMLForElement(css_el);
            var $css = $(code);
            $head.append($css);
        }
        if(update_list) this.updateStylesheetsList(function() {
            cs = this.getPageStylesheet(url);
            if(done) done(cs);
        });
        return true;
    }

    this.updateStylesheetsList = function(done) {
        $.fn.crsacss('loadLessStyles', _this.$iframe.get(0), function() {
            $('body').trigger('crsa-stylesheets-changed');
            _this.addCrsaStyles();
            if(done) done();
        });
    }

    this.hasScriptInHeaderOrFooter = function(url, footer) {
        var node = this.sourceNode.findOne(footer ? 'body' : 'head');
        if(!node) return null;
        var list = node.find('script');
        for(var i = 0; i < list.length; i++) {
            if(list[i].getAttr('src') == url) return list[i];
        }
        return null;
    }

    this.addScript = function(url, footer) {
        url = this.makeRelativeUrl(url);

        if(footer === undefined) footer = false;

        var has_in_wrong_place = this.hasScriptInHeaderOrFooter(url, !footer);
        if(has_in_wrong_place) {
            has_in_wrong_place.remove();
        }

        if(this.hasScriptInHeaderOrFooter(url, footer)) return false;

        var code = '<script type="text/javascript" src="' + url + '"></script>';
        var body = this.sourceNode.findOne('body');
        var head = this.sourceNode.findOne('head');
        var script = pgCreateNodeFromHtml(code);

        if(footer) {
            body.append(script);
        } else {
            head.append(script);
        }

        if(this.openedInEditor) {
            code = this.getViewHTMLForElement(script);
            var $script = $(code);
            if(footer) {
                this.get$Html().find('body').append($script);
            } else {
                this.get$Html().find('head').append($script);
            }
        }
        return true;
    }

    this.getTypeDefinition = function(type) {
        if(componentTypesDict == null) {
            this.getComponentTypes();
        }
        return componentTypesDict[type] ? componentTypesDict[type] : null;
    }

    this.hasStylesheet = function(re) {
        var doc = this.$iframe.get(0).contentDocument || this.$iframe.get(0).contentWindow.document;

        for(var i=0; i<doc.styleSheets.length; i++) {
            var sheet = doc.styleSheets[i];

            if(sheet.href) {
                if(sheet.href.match(re)) return true;
            }
        }
        return false;
    }

    this.hasScript = function(re) {
        var doc = this.$iframe.get(0).contentDocument || this.$iframe.get(0).contentWindow.document;

        var found = false;
        $(doc).find('script[src]').each(function(i, s) {
            var src = $(s).attr('src');
            if(src && src.match(re)) {
                found = true;
                return false;
            }
        })
        return found;
    }

    this.getLibSections = function() {
        if(!libSections) {
            libSections = [];
            for(var i = 0; i < this.frameworks.length; i++) {
                var f = this.frameworks[i];
                $.each(f.getLibSections(), function(i, section) {
                    libSections.push(section);
                });
            }
        }
        return libSections;
    }

    this.getActionsSections = function() {
        if(!actionsSections) {
            actionsSections = [];
            for(var i = 0; i < this.frameworks.length; i++) {
                var f = this.frameworks[i];
                $.each(f.getActionsSections(), function(i, section) {
                    actionsSections.push(section);
                });
            }
        }
        return actionsSections;
    }

    this.getAllTypes = function($el, pgel, skip_actions, only_auto_updatable) {
        var s = new Date().getTime();
        var r = [];
        for(var i = 0; i < this.frameworks.length; i++) {
            var f = this.frameworks[i];
            if(only_auto_updatable && !f.auto_updatable) continue;
            var a = f.getTypes($el, pgel, skip_actions);
            if(a.length) {
                r = r.concat(a);
            }
        }
        total_in_get_type += new Date().getTime() - s;
        return r;
    }

    var total_in_get_type = 0;

   /*
    setInterval(function() {
        if(total_in_get_type > 0) console.log('total_in_get_type = ' + total_in_get_type + 'ms');
    }, 10000);
*/

    this.getMainType = function($el, pgel, skip_actions, only_auto_updatable) {
        //var s = new Date().getTime();

        for(var i = 0; i < this.frameworks.length; i++) {
            var f = this.frameworks[i];
            if(only_auto_updatable && !f.auto_updatable) continue;
            var def = f.getType($el, pgel, skip_actions);
            //total_in_get_type += new Date().getTime() - s;
            if(def) return def;
        }
        //total_in_get_type += new Date().getTime() - s;
        return null;
    }

    this.getAllActionTypes = function($el, pgel) {
        var r = [];
        for(var i = 0; i < this.frameworks.length; i++) {
            var f = this.frameworks[i];
            if(f.has_actions) {
                var a = f.getActionTypes($el, pgel);
                if(a.length) {
                    r = r.concat(a);
                }
            }
        }
        return r;
    }

    this.editCode = function() {
        $('body').crsa('editCode', this.$iframe);
    }

    this.exitEditCode = function() {
        if(pinegrow.codeEditor.isInEdit(this.$iframe)) {
            pinegrow.codeEditor.exitEdit(false);
        }
    }

    this.toggleEditCode = function() {
        if(pinegrow.codeEditor.isInEdit(this.$iframe)) {
            pinegrow.codeEditor.exitEdit(false);
        } else {
            this.editCode();
        }
    }

    this.getActionTag = function($el) {
        var a = [];
        for(var i = 0; i < this.frameworks.length; i++) {
            var f = this.frameworks[i];
            if(f.has_actions) {
                var s = f.getActionTag($el);
                if(s) a.push(s);
            }
        }
        return a.length ? a.join(', ') : null;
    }

    this.detectAndAddFrameworks = function() {

        var project_info = this.getProjectInfo();

        var info = project_info.getSettingsForFile( this.localFile );

        var added_types = [];

        var template_frameworks = [];

        if(this.crsaProjectTemplate) {
            template_frameworks = this.crsaProjectTemplate.frameworks;
        }

        this.frameworks = [];

        var addFramework = function(f, index) {
            if (_this.canAddFramework(f)) {
                if(_this.frameworks.indexOf(f) < 0) {
                    if (index) {
                        _this.frameworks.splice(index, 0, f);
                    }
                    else {
                        _this.frameworks.unshift(f);
                    }
                    if(f.on_plugin_activated) {
                        f.on_plugin_activated(_this);
                    }
                    if(f.type) added_types.push(f.type);

                    if(!f.default) {
                        pinegrow.stats.using(f.key);
                    }
                }
            }
        }

        if(template_frameworks.length > 0) {
            $.each(pinegrow.getFrameworks(), function(key, f) {
                if(template_frameworks.indexOf(key) >= 0) {
                    addFramework(f);
                }
            });
        }

        if(this.crsaProjectTemplate && this.crsaProjectTemplate.framework) {
            addFramework(this.crsaProjectTemplate.framework);
        }

        //add project framework
        var project = pinegrow.getCurrentProject();
        if(project && project.framework) {
            addFramework(project.framework);
        }

        $.each(pinegrow.getFrameworks(), function(key, f) {
            var auto_detect = true;
            if(info && info.frameworks) {
                var infoFrameworkIndex = info.frameworks.indexOf(f.key);
                if(infoFrameworkIndex >= 0) {
                    addFramework(f, infoFrameworkIndex);
                }
                auto_detect = false;
            } else if(f.default) {
                addFramework(f);
                auto_detect = false;

            }
            if(!f.show_in_manager) auto_detect = true;

            if(auto_detect && f.detect && _this.sourceNode) {
                if(f.detect(_this)) {
                    if(f.type && added_types.indexOf(f.type) >= 0) {
                        return true;
                    }
                    addFramework(f);
                    crsaQuickMessage(f.name + " detected.", 2000);
                }
            }
            if(!f.show_in_manager && f.default) {
                addFramework(f);
            }
        });

        if(info && info.frameworks) {
            var missing = [];
            for(var i = 0; i < info.frameworks.length; i++) {
                var found = false;
                for(var j = 0; j < _this.frameworks.length; j++) {
                    if(_this.frameworks[j].key == info.frameworks[i]) {
                        found = true;
                        break;
                    }
                }
                if(!found) {
                    missing.push(info.frameworks[i]);
                }
            }
            if(missing.length) {
                //showAlert('<p>The following Pinegrow plugins that are used on this page were not found: <b>' + missing.join(', ') + '.</b></p><p>The most likely cause is that the plugin was upgraded to the new version in this release of Pinegrow.</p><p>Please use <b>Page -&gt; Manage frameworks</b> to activate appropriate plugins.</p>', 'Some plugins are missing');
                $.each(pinegrow.getFrameworks(), function(key, f) {
                    if(f.default) {
                        addFramework(f);

                    } else if(f.detect && _this.sourceNode) {
                        if(f.detect(_this)) {
                            if(f.type && added_types.indexOf(f.type) >= 0) {
                                return true;
                            }
                            addFramework(f);
                            crsaQuickMessage(f.name + " detected.", 2000);
                        }
                    }
                });
            }
        }

        sortFrameworksByOrder();

        resetFrameworksCache();
        this.frameworks_added = true;
        //$('body').trigger('crsa-frameworks-changed');

        //read breakpoints
        if(project_info) {
            if (this.localFile) {
                var saved_breakpoint = project_info.getSettingForFile(this.localFile, 'last_page_width')
                if (saved_breakpoint) {
                    this.deviceWidth = saved_breakpoint;
                    methods.refresh();
                }
            }

            var widthChanged = false;

            var custom_width = project_info.getSetting('custom_width');
            if(custom_width) {
                this.custom_width = custom_width;
                widthChanged = true;
            }

            var breakpoints = project_info.getSetting('breakpoints');
            if(breakpoints && breakpoints.length) {
                breakpoints = $.unique( breakpoints );
                for(var i = 0; i < breakpoints.length; i++) {
                    if(String(breakpoints[i]).match(/^[0-9\.]*$/)) breakpoints[i] = String(breakpoints[i]) + 'px';
                }
                this.breakpoints = breakpoints;
                widthChanged = true;
            }

            if (widthChanged) $('body').trigger('crsa-breakpoints-changed');
        }
    }

    var sortFrameworksByOrder = function() {
        _this.frameworks = _this.frameworks.sort(function (a, b) {
            if (a.order > b.order) return 1;
            if (a.order < b.order) return -1;
            return 0;
        });
    }

    this.setResourceNamespaceForFramework = function(f, res_namespace) {
        //hardcode for now, not used
        var project_info = this.getProjectInfo();
        var resources = project_info.getSetting('resources') || {};
        resources[f.type] = res_namespace;
        project_info.setSetting('resources', resources);
        project_info.save();
    }

    this.getResourceNamespaceForFramework = function(f, detect) {
        if(!this.localFile) return '';

        //detect
        if(detect) {
            var folder = this.getProjectOrFileDir();
            var namespace = 'components/' + f.type + '/';

            if(folder) {
                var path = require('path').join(folder, namespace);
                try {
                    var stat = require('fs').statSync(path);
                    //exists
                    return namespace;
                }
                catch(err) {
                    //doesn't exist
                    return '';
                }
            }
        }

        var project_info = this.getProjectInfo();
        var template_id = project_info.getSetting('template_framework_id');

        if(template_id && template_id == f.type) return ''; //same project

        return 'components/' + f.type + '/';

        //hardcode for now
        var project_info = this.getProjectInfo();
        var resources = project_info.getSetting('resources') || {};
        return (f.type) in resources ? resources[f.type] : '';
    }

    this.findFrameworkOfType = function(type) {
        for(var i = 0; i < this.frameworks.length; i++) {
            if(this.frameworks[i].type === type) return this.frameworks[i];
        }
        return null;
    }

    this.hasFramework = function(f) {
        return this.frameworks.indexOf(f) >= 0;
    }

    this.canAddFramework = function(fm) {
        if(fm.allow_single_type && fm.type) {
            var efm = this.findFrameworkOfType(fm.type);
            if(efm) return false;
        }
        return true;
    }

    this.getFrameworks = function() {
        return this.frameworks;
    }

    this.addFramework = function(fm, skip_changed, init_done_func) {
        var changed = false;
        var idx = this.frameworks.indexOf(fm);
        if(idx < 0) {
            if(!this.canAddFramework(fm)) return false;
            this.frameworks.unshift(fm);
            sortFrameworksByOrder();
            changed = true;
            //this.callFrameworkHandler('on_plugin_activated');
            if(fm.on_plugin_activated) {
                fm.on_plugin_activated(this, init_done_func);
            } else {
                if(init_done_func) init_done_func(fm);
            }
            this.addCrsaStyles();
        }
        if(changed && !skip_changed) {
            pinegrow.frameworksChanged();
        }
        return true;
    }

    this.frameworksChanged = function() {
        resetFrameworksCache();
    }

    this.removeFramework = function(fm) {
        var idx = this.frameworks.indexOf(fm);
        if(idx >= 0) {
            this.frameworks.splice(idx, 1);
            resetFrameworksCache();
            $('body').trigger('crsa-frameworks-changed');
            this.addCrsaStyles();
        }
    }

    var arraysEqual = function(a, b) {
        var i = a.length;
        if (i != b.length) return false;
        while (i--) {
            if (a[i] !== b[i]) return false;
        }
        return true;
    }

    this.copyContentOfPage = function(crsaPage, skip_refresh) {

        var ret = this.applyChangesToSource(crsaPage.sourceNode, false, true, pinegrow.getSelectedPage() == this);

        if(ret.changes && !ret.updated && !skip_refresh) {
            this.refresh();
        }
    }

    var copyContentFromPage = function(crsaPage) {
        if(pageChangedTimer) {
            clearTimeout(pageChangedTimer);
        }
        pageChangedTimer = setTimeout(function() {
            _this.copyContentOfPage(crsaPage);

            if(!_this.readOnly) {
                $.fn.crsa('buildTree', _this.$iframe);
                _this.treeRepaintOnShow = true;
            }
            pageChangedTimer = null;

            if(!arraysEqual(_this.breakpoints, crsaPage.breakpoints)) {
                _this.setAllBreakpoints(crsaPage.breakpoints);
                $('body').trigger('crsa-breakpoints-changed');
            }

            _this.autoSize();
            _this.setPageChanged(true);
        }, 500);
    }

    this.onPageChanged = function(crsaPage) {
        //if(_this.live_update == crsaPage) {
            copyContentFromPage(crsaPage);
        //}
    }

    this.setSyntaxErrorIndicator = function(has_errors, fileNode, project) {
        if(has_errors) {
            //this.setFileNodeTag(new CrsaFileTag('syntax', 'danger', 'The page has HTML syntax errors. Right-click -&gt; Validate HTML for info.', 'code'), fileNode, project);
        } else {
            //this.removeFileNodeTag('syntax', fileNode, project);
        }
    }

    this.refreshPageChangedStatus = function(force) {
        var val = this.changed || this.hasCssChanges();
        this.setPageChanged(val, force);
    }

    this.setPageChanged = function(val, force) {

        if(this.live_update && this.save_parent) val = false;

        if(this.changed != val || force) {
            this.changed = val;

            if(this.openedInEditor) {
                var p = this.$page.find('.page-changed');
                if(this.changed) {
                    p.show();
                } else {
                    p.hide();
                }

                pinegrow.pageTabs.updateHasChangesStatus(this);
            }

            if(this.changed) {
                this.setFileNodeTag(new CrsaFileTag('Save', 'info', 'Save changes.', 'asterisk'))
            } else {
                this.removeFileNodeTag('Save');
            }
        }
    }

    this.getProject = function() {
        var p = pinegrow.getCurrentProject();
        if(p && (!p.localFile || p.isPageInProject(this))) return p;
        return null;
    }

    this.getProjectOrFileDir = function() {
        var p = pinegrow.getCurrentProject();
        if(p && (!p.localFile || p.isPageInProject(this))) return p.getDir();
        if(!this.localFile) return null;
        return require('path').dirname(this.localFile);
    }

    this.getFileNode = function() {
        var project = pinegrow.getCurrentProject();
        if(project) {
            return project.getFileForUrl(this.url);
        }
    }

    this.setFileNodeTag = function(tag_obj, file, project) {
        if(!project) project = pinegrow.getCurrentProject();
        if(project) {
            if(!file) file = project.getFileForUrl(this.url);
            if(file) {
                file.addTag(tag_obj);
                project.updateTagsForFile(file);
            }
        }
    }

    this.removeFileNodeTag = function(tag, file, project) {
        if(!project) project = pinegrow.getCurrentProject();
        if(project) {
            if(!file) file = project.getFileForUrl(this.url);
            if(file) {
                file.removeTag(tag);
                project.updateTagsForFile(file);
            }
        }
    }

    this.getMirroredPages = function() {
        var r = [];
        for(var i = 0; i < crsaPages.length; i++) {
            if(crsaPages[i] != this && crsaPages[i].live_update == this) {
                r.push(crsaPages[i]);
            }
        }
        return r;
    }

    this.elementWasSelected = function($el) {
        if(!this.scrollMode) return;

        var start_ms = (new Date()).getTime();

        var pages = this.getMirroredPages();

        if(this.live_update) pages.push(this.live_update);

        if(pages.length > 0) {
            var all = this.$iframe.get(0).contentDocument.querySelectorAll("*");
            if(all) {
                var idx = -1;
                var elnode = $el.get(0);
                for(var n = 0; n < all.length; n++) {
                    if(all[n] == elnode) {
                        idx = n;
                        break;
                    }
                }

                if(idx >= 0) {
                    for(var i = 0; i < pages.length; i++) {
                        var cp = pages[i];
                        var cp_all = cp.$iframe.get(0).contentDocument.querySelectorAll("*");
                        if(cp_all && cp_all.length > idx) {
                            var $cpel = $(cp_all[idx]);
                            scrollToElementInIframe($cpel, cp.$iframe);
                        }
                    }
                }
            }
        }
        var elapsed_ms = (new Date()).getTime() - start_ms;
        //console.log('El pos synchro '+ elapsed_ms + ' ms');
    }

    this.pageLoaded = function() {
        var pages = this.getMirroredPages();
        for(var i = 0; i < pages.length; i++) {
            var cp = pages[i];
            if(cp.url != this.url) {
                cp.rename(this.url);
                cp.reload();
            }
        }
    }

    this.hasCssChanges = function() {
        if(this.force_close) return false;
        var ps = getCrsaPageStylesForPage(this.$iframe);
        var has = false;
        if(ps) {
            $.each(ps.stylesheets, function(i, cs) {
                if(cs.inline) return true;
                if(!cs.loaded) return true;
                has = has || cs.changed;
            });
        }
        return has;
    }

    this.hasChanges = function() {
        return this.changed || (!this.onlyCode && this.hasCssChanges());
    }

    this.getBreakpointsFromCss = function(done) {
        var ps = getCrsaPageStylesForPage(this.$iframe);
        var has = false;
        var r = [];

        var doDone = function() {
            var list = [];
            for(var i = 0; i < r.length; i++) {
                var cv = crsaSplitCSSValue(r[i]);
                var cvup = crsaOneUpCSSValue(cv);
                if(cv.value == 0 || r.indexOf(cvup.value + cvup.unit) >= 0) {
                    r[i] = -1;
                } else {
                    list.push(r[i]);
                }
            }
            /*
            for(var i = 0; i < r.length; i++) {
                if(list.indexOf(r[i]) < 0) {
                    list.push(r[i]);
                }
            }
            */
            list.sort(function (a, b) {
                var cva = crsaSplitCSSValue(a);
                var cvb = crsaSplitCSSValue(b);
                return cva.value - cvb.value;
            });

            done(list);
        }

        if(ps) {
            var c = 0;
            $.each(ps.stylesheets, function(i, cs) {
                //if(cs.inline) return true;
                c++;
                if(!cs.loaded) {
                    cs.ignore = false;
                    cs.load(cs.url, function() {
                        r = $.unique( r.concat(cs.getBreakpoints()) );
                        cs.ignore = true;
                        c--;
                        if(c == 0) doDone();
                    });
                } else {
                    setTimeout(function() {
                        r = $.unique( r.concat(cs.getBreakpoints()) );
                        c--;
                        if(c == 0) doDone();
                    }, 100);
                }
            });
            if(c == 0) doDone();
        } else {
            doDone();
        }
    }

    this.changeBreakpoint = function(old, b, done) {
        if(old == b) return;
        for(var i = 0; i < this.breakpoints.length; i++) {
            if(b == this.breakpoints[i]) {
                throw "Breakpoint " + b + " is already set.";
            }
        }
        for(var i = 0; i < this.breakpoints.length; i++) {
            if(old == this.breakpoints[i]) {
                this.breakpoints[i] = b;
            }
        }

        this.setPageChanged(true);
        describeMediaQueryCache = {};

        var ps = getCrsaPageStylesForPage(this.$iframe);
        var has = false;
        var r = [];
        var changed = false;

        var doDone = function() {
            done(changed);
        }

        if(ps) {
            var c = 0;
            $.each(ps.stylesheets, function(i, cs) {
                //if(cs.inline) return true;
                c++;
                if(!cs.loaded) {
                    cs.ignore = false;
                    cs.load(cs.url, function() {
                        cs.changeBreakpoint(old, b, function(ch) {
                            c--;
                            changed = changed || ch;
                            _this.setPageChanged(true);
                            cs.ignore = !ch;
                            if(c == 0) doDone();
                        });
                    });
                } else {
                    setTimeout(function() {
                        cs.changeBreakpoint(old, b, function(ch) {
                            c--;
                            changed = changed || ch;
                            _this.setPageChanged(true);
                            if(c == 0) doDone();
                        });
                    }, 40);
                }

            });
            if(c == 0) doDone();
        } else {
            doDone();
        }
    }

    this.addBreakpoint = function(b) {
        b = parseInt(b);
        for(var i = 0; i < this.breakpoints.length; i++) {
            if(b == this.breakpoints[i]) {
                throw "Breakpoint " + b + " is already set.";
            }
        }
        this.breakpoints.push(b);
        this.breakpoints.sort(function(a, b){return a-b});
        this.setPageChanged(true);
        describeMediaQueryCache = {};
    }

    this.removeBreakpoint = function(b) {
        var r = [];
        for(var i = 0; i < this.breakpoints.length; i++) {
            if(b != this.breakpoints[i]) {
                r.push(this.breakpoints[i]);
            }
        }
        this.breakpoints = r;
        this.setPageChanged(true);
        describeMediaQueryCache = {};
    }


    this.setAllBreakpoints = function(list) {
        this.breakpoints = list;
        this.breakpoints.sort(function(a, b){return a-b});
        //this.setPageChanged(true);
        describeMediaQueryCache = {};
    }

    this.showManageBreakpoints = function() {

        var showEditBox = function($el, old) {
            var eid = getUniqueId();
            if($el.data('popover-active')) {
                $el.popover('destroy');
                $el.data('popover-active', null);
                return;
            }

            var ensureRemove = function($e) {
                setTimeout(function() {
                    $e.closest('.popover').remove();
                }, 750);
            }

            var pop = $el.popover({
                html: true,
                placement: 'right',
                trigger: 'manual',
                title: old ? 'Edit breakpoint' : 'Add new breakpoint',
                container: 'body',
                content: '<form id="' + eid + '"><form><input class="form-control" placeholder="width with unit" style="margin-bottom:8px;"/><button class="ok btn">' + (old ? "Set" : "Add") + '</button><button class="useit btn btn-link">Use current width</button><button class="closeit btn btn-link">Cancel</button></form>'
            })
                .on('shown.bs.popover', function() {
                    var $d = $('#' + eid);
                    var $i = $d.find('input').focus();
                    var $b = $d.find('button.ok');
                    var $bc = $d.find('button.closeit');
                    var $bu = $d.find('button.useit');

                    if(old) {
                        $i.val(old);
                    }

                    var doAdd = function() {
                        var val = $.trim($i.val());
                        if(val.length > 0) {
                            //val = val.replace(/[^0-9]/g, '');

                            var cv = crsaSplitCSSValue(val);
                            val = cv.value + cv.unit;

                            try {
                                if(!old) {
                                    _this.addBreakpoint(val);
                                } else {
                                    if($el) {
                                        $el.html('Please wait...').addClass('disabled');
                                    }
                                    _this.undoStack.add("Change breakpoint");
                                    _this.changeBreakpoint(old, val, function(changed) {
                                        $el.html('Edit').removeClass('disabled');
                                        if(changed) {
                                            setTimeout(function() {
                                                crsaQuickMessage("Stylesheets were updated!", 3000);
                                            }, 250);
                                            setTimeout(function() {
                                                $('body').trigger('crsa-stylesheets-changed');
                                            }, 50);
                                        }
                                    });

                                }
                                didMakeChange(_this.$iframe);
                                $el.popover('hide');
                                ensureRemove($d);
                                updateList();
                                $('body').trigger('crsa-breakpoints-changed');
                            }
                            catch(err) {
                                pinegrow.alert(err);
                            }
                        }
                    }

                    $b.on('click', function(e) {
                        e.preventDefault();
                        doAdd();
                    });

                    $d.on('submit', function(e) {
                        e.preventDefault();
                        doAdd();
                    });

                    $bu.on('click', function (e) {
                        e.preventDefault();
                        $i.val(_this.deviceWidth + 'px');
                        //doAdd();
                    })

                    $bc.on('click', function(e) {
                        $el.popover('hide');
                        e.preventDefault();
                        ensureRemove($d);
                    });
                })
                .on('hidden.bs.popover', function() {
                    setTimeout(function() {
                        $el.popover('destroy').data('popover-active', null);
                    },10);
                });
            $el.popover('show').data('popover-active', true);
        }

        var $container_div = $('<div/>');

        var updateList = function() {
            $container_div.html('');
            var $ul = $('<ul/>', {style: 'margin-bottom: 0px'}).appendTo($container_div);
            var $custom_ul = $('<ul/>', {style: 'margin-bottom: 0px'}).appendTo($container_div);

            var addNewWidth = function (width, $container) {
                var $button = $('<a href="#" class="btn btn-sm btn-link">Edit</a>');
                var $del = $('<a href="#" class="btn btn-sm btn-link">Delete</a>');
                $('<li></li>').html(width).appendTo($container).append($button).append($del).data('breakpoint', width);
                $button.on('click', function(e) {
                    var $li = $(e.delegateTarget).closest('li');
                    e.preventDefault();
                    showEditBox($(e.delegateTarget), $li.data('breakpoint'));
                });
                $del.on('click', function(e) {
                    var $li = $(e.delegateTarget).closest('li');
                    e.preventDefault();
                    if(confirm('Are you sure? Existing CSS rules will not be affected.')) {
                        _this.removeBreakpoint($li.data('breakpoint'));
                        updateList();
                        $('body').trigger('crsa-breakpoints-changed');
                        didMakeChange(_this.$iframe);
                    }
                });
            }

            for(var i = 0; i < _this.breakpoints.length; i++) {
                addNewWidth(_this.breakpoints[i], $ul);
            }

        }

        updateList();

        var $b = $container_div;

        var $main = $('<div class="manager"><p>Breakpoints:</p></div>').append($b);

        var msg = '';

        $('<a href="#" class="btn btn-link add">Add breakpoint...</a>').appendTo($main)
            .on('click', function(e) {
                e.preventDefault();
                showEditBox($(this));
            });

        $('<a href="#" class="btn btn-link add">Get from stylesheets</a>').appendTo($main)
            .on('click', function(e) {
                e.preventDefault();
                var $b = $(e.delegateTarget);
                $b.html('Please wait...').addClass('disabled');

                _this.getBreakpointsFromCss(function(list) {
                    if(list.length) {

                        var dofunc = function() {
                            _this.setAllBreakpoints(list);
                            didMakeChange(_this.$iframe);
                            crsaQuickMessage("Done!", 2000);
                        }

                        if(_this.breakpoints.length) {
                            var msg = 'Breakpoints [' + list.join(', ') + '] were found in CSS. Do you want to use them instead of current breakpoints? This can\'t be undone.';
                            if(confirm(msg)) {
                                dofunc();
                            }
                        } else {
                            dofunc();
                        }

                    } else {
                        crsaQuickMessage("No breakpoints found!", 2000);
                    }
                    updateList();
                    $('body').trigger('crsa-breakpoints-changed');
                    $b.html('Get from stylesheets').removeClass('disabled');
                });
            });

        $('<a href="http://docs.pinegrow.com/styling/creating-responsive-layouts" target="_blank" class="btn btn-link add external">Help</a>').appendTo($main);

        crsaHandleExternalLinks($main);

        var updateMetaAdd = function() {
            var $ma = $main.find('.meta-add');
            if(!$ma.length) {
                $ma = $('<div class="meta-add well" style="margin-top:12px;"></div>').appendTo($main);
            }
            var $head = _this.get$Html().find('head');
            var $m = $head.find('meta[name="viewport"]');
            if($m.length) {
                $ma.hide();
            } else {
                $ma.html('<p>Document needs <code>&lt;meta name=&quot;viewport&quot; ... &gt;</code> directive to enable responsive behaviour on mobile devices. <a href="#" class="">Add it!</a></p>');
                var $add = $ma.find('a');

                $ma.show();
                $add.on('click', function(e) {
                    e.preventDefault();
                    _this.undoStack.add("Meta viewport directive added");
                    $head.append('<meta name="viewport" content="width=device-width, initial-scale=1.0">');
                    _this.setPageChanged(true);
                    didMakeChange(_this.$iframe, $head);
                    updateMetaAdd();
                    crsaQuickMessage("Viewport declaration added!", 2000);
                });
            }
        }

        updateMetaAdd();


        var $d = makeModalDialog("Manage breakpoints", "Close", null, $main);
        $d.removeAttr('tabindex');
        $d.find('.modal-dialog').css('width', '500px');
    }

    var describeMediaQueryCache = {};

    this.describeMediaQuery = function(q) {
        var rule = null;

        if(q in describeMediaQueryCache) {
            return describeMediaQueryCache[q];
        }

        var idx = q.indexOf('(');
        if(idx >= 0) {
            rule = q.substr(idx);
            if(q.indexOf('only') >= 0) {
                rule = rule.replace('only ','');
            }
            $.each(['screen', 'print'], function(i,t) {
                if(q.indexOf(t) >= 0) {
                    type = t;
                    rule = rule.replace(t,'');
                }
            });
        } else {
            rule = q;
        }
        rule = rule.replace(/\s/g,'');

        var res = null;
        if(_this.breakpoints.length) {
            for(var i = 0; i < _this.breakpoints.length; i++) {
                var cv = crsaSplitCSSValue(_this.breakpoints[i]);
                var x = cv.value;
                var cvdown = crsaOneUpCSSValue(cv, -1); //one down

                var mq = '(max-width:' + (cvdown.value) + cv.unit + ')';
                if(rule == mq) {
                    res = '<span class="line"></span><span class="excluding">' + x + '</span>';
                    break;
                }
                mq = '(min-width:' + (x) + cv.unit + ')';
                if(rule == mq) {
                    res = '<span class="including">' + x + '</span><span class="line"></span>';
                    break;
                }
                if(i < _this.breakpoints.length -1) {

                    var ncv = crsaSplitCSSValue(_this.breakpoints[i+1]);
                    var nx = ncv.value;
                    var ncvdown = crsaOneUpCSSValue(ncv, -1); //one down

                    mq = '(min-width:' + (x) + 'px)and(max-width:' + (ncvdown.value) + cv.unit + ')';
                    if(rule == mq) {
                        res = '<span class="including">' + x + '</span><span class="line"></span><span class="excluding">' + (nx) + '</span>';
                        break;
                    }
                }
            }
        }
        describeMediaQueryCache[q] = res ? res : q;
        return res ? res : q;
    }

    this.showMediaQueryHelper = function($el) {
        var offset = $el.offset();
        var place = offset.left > $(window).width()/2 ? 'left' : 'right';
        //place = 'auto';
        var eid = getUniqueId();
        if($el.data('tool-active')) {
            $el.data('tool-active', null);

            return;
        }
        var ensureRemove = function($e) {
            $dialog.hide();
            $el.data('tool-active', null);
            tool.closed = true;
            setTimeout(function() {
                $dialog.remove();
            }, 500);
        }

        var original = $.trim($el.val());
        var original_just_rule = '';
        var has_only = localStorage.mediaToolOnly ? true : false;
        var type = localStorage.mediaToolType ? localStorage.mediaToolType : null;
        var strange = true;

        if(original) {
            var idx = original.indexOf('(');
            if(idx >= 0) {
                original_just_rule = original.substr(idx);
                if(original.indexOf('only') >= 0) {
                    has_only = true;
                    original_just_rule = original_just_rule.replace('only ','');
                }
                $.each(['screen', 'print'], function(i,t) {
                    if(original.indexOf(t) >= 0) {
                        type = t;
                        original_just_rule = original_just_rule.replace(t,'');
                    }
                });
                original_just_rule = original_just_rule.replace(/\s\s+/g,' ');
                strange = false;
            } else {
                original_just_rule = original;
            }
        } else {
            strange = false;
        }

        var done = false;

        var s = '';
        if(_this.breakpoints.length) {
            for(var i = 0; i < _this.breakpoints.length; i++) {

                var cv = crsaSplitCSSValue(_this.breakpoints[i]);
                var x = cv.value;
                var cvdown = crsaOneUpCSSValue(cv, -1); //one down

                var mq = '(max-width:' + (cvdown.value) + cv.unit + ')';
                s += '<li class="media-query" data-media="' + mq + '"><i class="fa fa-check"></i><span class="line"></span><span class="excluding">' + x + '</span><small>smaller than ' + x + ' ' + cv.unit + '</small></li>';
                mq = '(min-width:' + (x) + cv.unit + ')';
                s += '<li class="media-query" data-media="' + mq + '"><i class="fa fa-check"></i><span class="including">' + x + '</span><span class="line"></span><small>' + x + ' ' + cv.unit + ' and up</small></li>';
                if(i < _this.breakpoints.length -1) {

                    var ncv = crsaSplitCSSValue(_this.breakpoints[i+1]);
                    var nx = ncv.value;
                    var ncvdown = crsaOneUpCSSValue(ncv, -1); //one down

                    mq = '(min-width:' + (x) + cv.unit + ') and (max-width:' + (ncvdown.value) + cv.unit + ')';
                    s += '<li class="media-query submedia-last" data-media="' + mq + '"><i class="fa fa-check"></i><span class="including">' + x + '</span><span class="line"></span><span class="excluding">' + (nx) + '</span><small>from ' + x + ' ' + cv.unit + ' to ' + (ncv.value) + ' ' + cv.unit + '</small></li>';
                }
            }
        } else {
            s += '<li>No breakpoints are defined. Use &quot;Manage breakpoints&quot; to define them.</li>';
        }

        var triggerTimeout = null;

        var triggerChange = function($el) {
            if(triggerTimeout) {
                clearTimeout(triggerTimeout);
            }
            triggerTimeout = setTimeout(function() {
                $el.focus();
                $el.trigger('change');
                triggerTimeout = null;
            }, 50);
        }

        var form = '<form role="form" class="form-inline">\
            <div class="form-group" style="margin-right:10px;">\
            <label class="control-label sr-only" for="formInput1">Field label</label>\
            <select id="formInput1" class="form-control input-sm">\
            <option></option>\
            <option>screen</option>\
            <option>print</option>\
        </select>\
        </div>\
            <div class="checkbox">\
                <label class="control-label">\
                    <input type="checkbox"> Ignore in old browsers</label>\
                </div>\
            </form>';

        var $c = $('<div id="' + eid + '" class="media-tool"><ul class="media-list">' + s + '</ul>' + form + '</div>');

        var $body = $('body');
        var $dialog = makeDialog("Select media query", "Cancel", "Ok", $c).css('width','400px');
        $body.append($dialog);

        $dialog.find('.modal-footer').prepend('<a href="#" class="pull-left manage btn btn-link">Manage breakpoints...</a>').css('margin-top', '0px');

        $dialog.find('.modal-body').css('padding-bottom', '0px');

        $dialog.on('keydown', function(e) {
            if(e.which == 27) {
                $dialog.find('button.cancel').trigger('click');
                e.preventDefault();
            }
        });

        var elo = $el.offset();
        var bw = $body.width();
        var bh = $body.height();

        var x,y;

        if(elo.left < bw / 2) {
            x = elo.left + $el.width() + 35;
        } else {
            x = elo.left - $dialog.width() - 10;
        }
        y = elo.top - $dialog.height()/2;

        x = localStorage.mediaToolX ? parseInt(localStorage.mediaToolX) : x;
        y = localStorage.mediaToolY ? parseInt(localStorage.mediaToolY) : y;

        if(y < 10) y = 10;
        if(y + $dialog.height() > bh) {
            y = bh - 10 - $dialog.height();
        }
        if(x < 10) x = 10;
        if(x + $dialog.width() > bw) {
            x = bw - 10 - $dialog.width();
        }


        $dialog.css('top', y + 'px').css('left', x + 'px');
        $dialog.draggable({handle: '.modal-header'})
            .on('dragstart', function() {
                $.fn.crsapages('showOverlays');
            })
            .on('dragstop', function() {
                $.fn.crsapages('showOverlays', true);
                var ofs = $dialog.offset();
                localStorage.mediaToolX = ofs.left;
                localStorage.mediaToolY = ofs.top;
            });

        var $d = $('#' + eid);
        var $ul = $d.find('ul');
        var $b = $dialog.find('button.ok');
        var $bc = $dialog.find('button.close,button.cancel');

        var $select = $d.find('select');
        var $only = $d.find('input[type="checkbox"]');

        if(strange) {
            $select.attr('disabled', 'disabled');
            $only.attr('disabled', 'disabled');
        } else {
            $select.val(type);
            if(has_only) {
                $only.attr('checked', 'checked');
            }
            $select.on('change', function(e) {
                apply(original_just_rule);
                localStorage.mediaToolType = $select.val();
            });
            $only.on('change', function(e) {
                apply(original_just_rule);
                localStorage.mediaToolOnly = $only.is(':checked') ? '1' : '0';
            });
        }

        var apply = function(q) {
            var s = $select.val();
            var has_and = false;
            if(s) {
                if(q.length) {
                    q = s + ' and ' + q;
                    has_and = true;
                } else {
                    q = s;
                }
            }
            if($only.is(':checked')) {
                q = 'only ' + (!s ? 'screen and ' : '') + (!has_and ? '' : '') + q;
            }
            $el.val(q);
            triggerChange($el);
        }

        var current = original_just_rule.replace(/\s/g, '');

        $ul.find('li').each(function(i,e) {
            var $li = $(e);
            var q = $li.attr('data-media');
            if(q) {
                if(q.replace(/\s/g,'') == current) {
                    $li.addClass('media-current');
                }
                var win = _this.getWindow();
                if(win && win.matchMedia(q).matches) {
                    $li.addClass('media-match');
                }
            }
        });

        $ul.find('i.fa-check:visible').tooltip({container: 'body', title: 'Matches current window size (' + _this.deviceWidth + 'px).'});

        $ul.find('li')
            .on('mouseover', function(e) {
                if(!done) {
                    var $e = $(e.delegateTarget);
                    var q = $e.attr('data-media');
                    if(q) {
                        apply(q);
                    }
                }
            })
            .on('mouseout', function(e) {
                if(!done) {
                    var q = $(e.delegateTarget).attr('data-media');
                    if(q) {
                        if(strange) {
                            $el.val(original);
                            triggerChange($el);
                        } else {
                            apply(original_just_rule);
                        }
                    }
                }
            })
            .on('click', function(e) {
                done = true;
                e.preventDefault();
                var $e = $(e.delegateTarget);
                var q = $e.attr('data-media');
                if(q) {
                    $ul.find('li.media-current').removeClass('media-current');
                    $e.addClass('media-current');
                    apply(q);
                    ensureRemove($d);
                }
            });

        $b.on('click', function(e) {
            e.preventDefault();
            done = true;
            ensureRemove($d);
        });

        $bc.on('click', function(e) {
            done = true;
            $el.val(original);
            triggerChange($el);
            e.preventDefault();
            ensureRemove($d);
        });

        $dialog.find('.manage').on('click', function(e) {
            done = true;
            $el.val(original);
            triggerChange($el);
            e.preventDefault();
            ensureRemove($d);
            _this.showManageBreakpoints();
        });

        $el.data('tool-active', true);

        var tool = {
            closed: false,
            close: function() {
                ensureRemove();
            }
        }
        return tool;
    }

    this.getProjectInfo = function() {
        return new pgProjectInfo(_this.localFile);
    }

    this.getDocument = function() {
        return this.$iframe.get(0).contentDocument;
    }

    this.getWindow = function() {
        return this.$iframe.get(0).contentWindow;
    }

    this.getBody = function() {
        return getIframeBody(this.$iframe.get(0));
    }

    this.get$Html = function() {
        var doc = this.getDocument();
        return $(doc).find('> html');
    }

    this.getElementWithPgId = function(pgid) {
        var $el = this.get$Html().find('[data-pg-id="' + pgid + '"]');
        return $el.length ? $el : null;
    }

    this.getElementFromPgParserNode = function(pgel) {
        return this.getElementWithPgId(pgel.getId());
    }

    this.getData = function($el, key) {
        try {
            var id = getUniqueId('crsa');
            $el.attr('data-tmp', id);
            var windowjQuery = this.$iframe[0].contentWindow.$;
            var f = this.$iframe.contents().find('[data-tmp="' + id + '"]');
            $el.removeAttr('data-tmp');
            return f.length > 0 ? windowjQuery.data(f.get(0), key) : null;
        } catch(err) {}
        return null;
    }

    this.saveHTML = function() {
        this.save(function() {}, true, false, false, false);
    }

    this.saveAs = function(done) {
        if(pinegrow.codeEditor) pinegrow.codeEditor.refreshBeforeSaveIfNeeded();
        this.save(function(err) {
            if(!err) {
                pinegrow.recentFiles.add(_this.url);
                pinegrow.pageTabs.updateDisplay();
                if(done) done(_this);
            }
        }, true, true, true);
    }


    this.save = function(done, save_html, save_css, save_as, save_project, first_save, ask_css_overwrite) {

        if(isApp()) {

            if(!this.openedInEditor || this.onlyCode) {
                save_css = false;
                save_project = false;
                save_html = true;
            }

            if(typeof save_project == 'undefined') save_project = true;

            var proxyUrl = pinegrow.httpServer.url + '/';
            var proxyRe = new RegExp(escapeRegExp(proxyUrl), 'g');
            var removeCollapsed = / data\-pg\-collapsed(="[^"]*")?/g;
            var removeHidden = / data\-pg\-hidden(="[^"]*")?/g;

            if(pinegrow.getSetting('keep-collapsed', '0') == '1') {
                removeCollapsed = null;
                removeHidden = null;
            }
            var html;

            if(this.onlyCode) {
                html = this.code;
            } else {
                html = this.sourceNode.toStringOriginal(true, pinegrow.getFormatHtmlOptions(), function(node, str, type) {
                    if(type == 'attrs') {
                        str = str.replace(proxyRe, '');
                        if(removeCollapsed) {
                            str = str.replace(removeCollapsed, '');
                        }
                        if(removeHidden) {
                            str = str.replace(removeHidden, '');
                        }
                    }
                    return str;
                });
            }

            var fs = require('fs');
            var pm = require('path');
            var project = pinegrow.getCurrentProject();

            if(this.localFile && !save_as) {
                try {
                    if(this.live_update && this.save_parent) {
                        if(done) done();
                        showAlert("The page was not saved because it is a mirrored page. You should save the parent page " + this.live_update.name + " instead.", "Page was not saved");
                        return;
                    }

                    var dir = crsaGetFileDir(this.localFile);

                    //create only project dirs
                    if (!project || (project && !project.isPageInProject(this))) {
                        if(this.crsaProjectTemplate && save_project) {
                            this.crsaProjectTemplate.copyRequiredFilesTo(dir, null, null, true);
                        }
                    }


                    var notice = [];

                    var saveDone = function(err, saved_csss) {
                        if (!project || (project && !project.isPageInProject(_this))) {
                            if(_this.crsaProjectTemplate && save_project) {
                                _this.crsaProjectTemplate.copyRequiredFilesTo(dir);
                            }
                        }

                        var url = crsaMakeUrlFromFile(_this.localFile);
                        if(url != _this.url && crsaIsFileUrl(_this.url)) _this.rename(url);
                        if(done) done(err);

                        if(save_html) {
                            _this.setPageChanged(false);
                        }

                        _this.callFrameworkHandler('on_page_saved', saved_csss, first_save);

                        var b = '';
                        if((!isFile && first_save)) {

                            b += isFile ? '</ul>' : '</ul><p>Images, scripts and other resources were not saved.</p><p>If you want to save all changes it is recommended to first save the whole webpage to your computer (Save As Complete page in your browser) and then open it in Pinegrow.</p>';
                        }
                        if(notice.length > 0) {
                            b += isFile ? "<p>The following stylesheets were not saved because they have syntax errors or are located on remote servers:</p><ul>" : "<p>The following stylesheets were not saved because they have syntax errors or their paths would place them outside of the folder selected for saving the HTML file:</p><ul>";
                            for(var i = 0; i < notice.length; i++) {
                                b += '<li>' + notice[i].url + ' - ' + (notice[i].error == 'syntax' ? 'Syntax error (check CSS panel for more)' : 'Invalid url') + '</li>';
                            }
                        }



                        if(b.length > 0) {
                            showAlert(b, 'Some files were not saved');
                        } else {
                            crsaQuickMessage((save_css || _this.onlyCode) ? _this.name + " was saved." : _this.name + " (HTML only) was saved.")
                        }
                    }

                    var isFile = crsaIsFileUrl(this.url);

                    if(save_html) {
                        //fs.writeFileSync(this.localFile, html, "utf8");
                        this.lastSavedAt = (new Date()).getTime();
                        crsaWriteFileWithBackup(fs, this.localFile, html, "utf8");


                        var project = pinegrow.getCurrentProject();
                        if(project) {
                            project.removeBackgroundPageForUrl(this.url);
                        }

                        //save components
                        /*
                        if (this.$iframe) {
                            var $body = $(getIframeBody(this.$iframe.get(0)));
                            var $components = $body.find('[data-pg-component]').each(function(i,c) {
                                var $c = $(c);
                                var name = $c.data('pg-component');
                                if(name) {
                                    var html = $c.get(0).outerHTML;
                                    html = removeCrsaClassesFromHtml(html);
                                    html = html_beautify(html);
                                    var file = crsaGetFileDir(_this.localFile) + 'components' + pm.sep + name + '.html';
                                    crsaWriteFileWithBackup(fs, file, html, "utf8");
                                }
                            });
                        }*/

                        if(save_project) {

                            var file_or_project_dir = _this.localFile;
                            var project = pinegrow.getCurrentProject();
                            if(project && project.isFileInProject(_this.localFile)) {
                                file_or_project_dir = project.getDir();
                            }

                            var project_info = new pgProjectInfo(file_or_project_dir, first_save /* don't search for parent project info if this is the new file */);

                            var pageinfo = {frameworks: []};
                            for(var i = 0; i < _this.frameworks.length; i++) {
                                pageinfo.frameworks.push(_this.frameworks[i].key);
                            }
                            project_info.setSettingForFile(_this.localFile, 'frameworks', pageinfo.frameworks);
                            project_info.setSetting('breakpoints', _this.breakpoints);
                            project_info.setSetting('custom_width', _this.custom_width);
                            project_info.setSettingForFile(_this.localFile, 'last_page_width', _this.$iframe.width());

                            project_info.setSetting('frameworks', pageinfo.frameworks);

                            //moved this here, we're saving page info already
                            if (_this.source_framework) {
                                project_info.setSetting('template_framework_id', _this.source_framework.type)
                            }

                            project_info.save();
                        }
                    }


                    //debugger;
                    if(save_css) {
                        var saved_csss = [];
                        var cp = getCrsaPageStylesForPage(this.$iframe);
                        var count = 0;
                        var fileWriter = null;

                        if(ask_css_overwrite) {
                            fileWriter = new CrsaOverwriteProtectionFileWriter('dummy_source', null);
                            fileWriter.use_export_cache = false;
                            if(first_save) {
                                fileWriter.skip_existing_files = true; //don't ask to overwrite existing files. just skip them.
                            }
                        }
                        $.each(cp.getAllCrsaStylesheets(), function(i, cs) {
                            if(cs.inline) return true;
                            if(!cs.loaded) return true;
                            var rel_url = crsaMakeLinkRelativeTo(cs.url, crsaMakeUrlAbsolute(_this.url));
                            rel_url = crsaRemoveUrlParameters(rel_url);
                            var path;

                            if(cs.genGetError()) {
                                notice.push({url: cs.url, error: 'syntax'});
                            } else {
                                if((rel_url.indexOf('://') >= 0 && !crsaIsFileUrl(rel_url)) || (!isFile && rel_url.indexOf('..') >= 0)) {
                                    if(cs.changed) {
                                        notice.push({url: cs.url, error: 'url'});
                                    }
                                } else {
                                    if(rel_url.indexOf('://') >= 0) {
                                        path = crsaMakeFileFromUrl(rel_url);
                                    } else {
                                        path = dir + rel_url;
                                    }
                                    count++;
                                    cs.save(path, function(err) {
                                        if(err) throw(err);
                                        count--;
                                        saved_csss.push({cs: cs, path: path});
                                        if(count == 0) {
                                            if(fileWriter) {
                                                fileWriter.askIfNeeded(function() {
                                                    saveDone(null, saved_csss);
                                                })
                                            } else {
                                                saveDone(null, saved_csss);
                                            }
                                        }

                                        //_this.callFrameworkHandler('on_css_saved', cs, path);
                                    }, fs, function(source) {
                                        return source;
                                        return source.replace(proxyRe, '');
                                    }, fileWriter);
                                }
                            }
                        });
                        if(count == 0) {
                            if(fileWriter) {
                                fileWriter.askIfNeeded(function() {
                                    saveDone();
                                })
                            } else {
                                saveDone();
                            }
                        }
                    } else {
                        saveDone();
                    }
                }
                catch(err) {
                    if(done) done(err);
                    var hint = '<p>A HINT: By default, Save dialog will select the root folder of your computer. Files can\'t be written there of course. Select the folder where you have write access and it will be ok.</p>';
                    showAlert("<p>Could not save file: " + err.message + '</p>' + hint, "Error");
                }
            } else {
                crsaChooseFile(function(url, file) {

                    var dofunc = function() {
                        var origLocalFile = _this.localFile;
                        var origSaveParent = _this.save_parent;
                        _this.setLocalFile(file);
                        _this.save_parent = false;
                        _this.save(function(err) {

                            if(!err) {
                                if(crsaIsFileUrl(_this.url)) {
                                    _this.rename(url);
                                    $.fn.crsapages('updateFilesName');
                                    _this.reload();
                                }
                            } else {
                                _this.setLocalFile(_this.localFile);
                                _this.save_parent = origSaveParent;
                            }
                            $('.canvas').trigger('crsa-page-saved-as', _this);
                            done();
                        }, save_html, save_css, false, true, true, true /* ask css overwrite */);
                    }

                    if(url.indexOf('.htm') < 0) {

                        showAlert("Do you want to use the file without the <b>.html</b> extension? Some browsers will not recognize it.", "No .html extension", "Use as is", "Add .html extension", function() {
                            dofunc();
                        }, function() {
                            file = file + '.html';
                            url = url + '.html';
                            dofunc();
                        });
                    } else {
                        dofunc();
                    }

                }, this.name);
            }
        } else {
            //browser save
            var store = new CrsaBrowserStorage();
            if(save_html) {
                store.save(this.url, html);
                this.setPageChanged(false);
            }

            if(save_css) {
                var cp = getCrsaPageStylesForPage(this.$iframe);
                var count = 0;
                $.each(cp.getAllCrsaStylesheets(), function(i, cs) {
                    if(cs.inline) return true;
                    var less = cs.getLessSource();
                    store.save(cs.url, less);
                    cs.changed = false;
                });
            }
            if(done) done();
        }
    }


    this.saveChangedFrameworks = function(done) {
        for(var i = 0; i < this.frameworks.length; i++) {
            var f = this.frameworks[i];

            (function(f) {
                if(f.user_lib && f.changed) {
                    if(f.pluginUrl) {
                        f.save(f.pluginUrl, function() {
                            crsaQuickMessage("Library " + f.name + " saved.");
                            pinegrow.frameworksChanged();
                            if(done) done();
                        });
                    } else {
                        crsaChooseFile(function(url, file) {
                            f.save(file, function() {
                                crsaQuickMessage("Library " + f.name + " saved.");
                                pinegrow.frameworksChanged();
                                if(done) done();
                            });
                        }, f.getFileName());
                    }
                }
            })(f);
        };
    }


    this.rename = function(new_url) {
        this.url = new_url;
        this.name = getPageName(new_url);
        this.updateNameDisplay();
  }

    this.updateNameDisplay = function() {
        this.$page.find('.name').html(this.name);
        this.$page.find('a.crsa-preview').attr('href', this.url);
    }

    this.duplicate = function() {
        var cp = new CrsaPage();
        cp.url = this.url;
        cp.wrapper_url = this.wrapper_url;
        cp.wrapper_selector = this.wrapper_selector;
        cp.scrollMode = this.scrollMode;
        cp.javascriptEnabled = this.javascriptEnabled;

        cp.frameworks = this.frameworks.slice(0);
        cp.frameworks_added = this.frameworks.length > 0;
        cp.frameworksChanged();

        cp.breakpoints = this.breakpoints.slice(0);
        var skip = [];
        for(var j = 0; j < crsaPages.length; j++) {
            skip.push(crsaPages[j].name);
        }

        cp.name = crsaDuplicateName(this.name, this.localFile, skip);
        if(this.localFile) {
            cp.setLocalFile(crsaGetFileDir(this.localFile) + cp.name);
        }
        return cp;
    }

    this.loadingStart = function(onCancel) {
        $.fn.crsapages('showLoadingOverlay', this.$page, false, function() {
            if(onCancel) onCancel(_this);
        });
    }

    this.loadingDone = function() {
        $.fn.crsapages('showLoadingOverlay', this.$page, true);
    }

    this.reload = function() {
        $('.canvas').trigger('crsa-page-reload', this);
    }

    this.refresh = function(done) {
        if(done) {
            var onDone = function(page) {
                done(page);
                setTimeout(function() {
                    pinegrow.removeEventHandler('on_page_shown_in_live_view', onDone);
                }, 0);
            }
            pinegrow.addEventHandler('on_page_shown_in_live_view', onDone);
        }
        $('.canvas').trigger('crsa-page-refresh', this);
    }

    this.autoSize = function() {
        $.fn.crsapages('autoSizePage', this.$iframe, this.scrollMode);
    }

    this.updatePageMenus = function() {
        $.fn.crsapages('updatePageMenus', this);
    }

    this.setLiveUpdate = function(crsaPage) {
        var $body = $('body');
        if(!crsaPage) {
            if(this.live_update) {
                //$body.off('crsa-page-changed', onPageChanged);
            }
            this.$page.removeClass('mirrored');
            this.live_update = null;
        } else {
            //$body.on('crsa-page-changed', onPageChanged);
            this.$page.addClass('mirrored');
            var source = crsaPage.live_update ? crsaPage.live_update : crsaPage;
            this.live_update = source;
        }
    }

    this.getCurrentFrameworkHandlerReturnValue = function(handler) {
        return this.currentFrameworkHandlerReturnValues[handler] || null;
    }

    this.callFrameworkHandler = function(name, a, b, c, d, e, f) {
        /*
        this.currentFrameworkHandlerReturnValues[name] = null;
        for(var i = 0; i < _this.frameworks.length; i++) {
            var f = _this.frameworks[i];
            if(name in f && f[name]) {
                this.currentFrameworkHandlerReturnValues[name] = f[name](_this, a, b, c, d, e, f);
            }
        }
        */
        //will also dispatch to page framework handlers
        return pinegrow.dispatchEvent(name, this, a, b, c, d, e, f);
/*
        var ret = this.currentFrameworkHandlerReturnValues[name];
        this.currentFrameworkHandlerReturnValues[name] = null;
        return ret;*/
    }

    this.callGlobalFrameworkHandler = function(name, a, b, c) {
        return pinegrow.callGlobalFrameworkHandler(name, a, b, c, this);
    }

    this.getSource = function(full_source, skip_beautify) {

        var addHtml = function(src) {
            var h = '<html';
            $.each(getIframeHtmlElement(_this.$iframe.get(0)).attributes, function(idx, attr) {
                h += ' ' + attr.nodeName + '="' + attr.nodeValue + '"';
            });
            h += '>';

            return "<!DOCTYPE html>\n" + h + "\n" + src + "\n</html>";
        }

        var str;

        if(this.sourceNode) {
            //console.log(this.sourceNode.toDebug());

            str = this.sourceNode.toStringOriginal(true, pinegrow.getFormatHtmlOptions());
            //console.log(str);

            //console.log(this.sourceNode.toStringWithIds());

            if(!skip_beautify) {
                //str = html_beautify(str);
            }
        } else {
            this.doWithoutCrsaStyles(function() {

                var doc = _this.getDocument();
                var $html = $(doc).find('> html').clone(true);

                _this.callFrameworkHandler('on_get_source', $html);

                str = $html.length > 0 ? $html[0].innerHTML : '';
                str = str.replace(/(<[^>]*)\s*contenteditable="true"/ig, '$1');
                str = str.replace(/(<[^>]*)\s*style=""/ig, '$1');
                str = removeCrsaClassesFromHtml(str);

            });
            if(full_source) {
                str = addHtml(str);
                if(!skip_beautify) {
                    str = html_beautify(str);
                }
                return this.template.getTemplateSource(str);
            }
        }
        return str;
    }

    this.applyChangesToSource = function(html_or_node, abort_on_errors, skip_was_changed, update_stylesheets, event_type) {
        /* returns
            true - updated
            array - errors
            false - whole doc changed, not updated
            previewUpdated
         */
        var ret = {changes: null, errors: null, updated: false, stylesheets_changed: false, scripts_changed: false, whole_changed: false};

        var rootNode;
        var clone = false;

        var parser = null;

        if(this.onlyCode) {
            var code = typeof html_or_node == 'string' ? html_or_node : html_or_node.toStringOriginal(true);
            if(code != this.code) {
                this.code = code;
                this.setPageChanged(true);
            }
            ret.updated = true;
            return ret;
        }

        if(typeof html_or_node == 'string') {
            parser = new pgParser();
            parser.assignIds = false;
            parser.parse(html_or_node);
            rootNode = parser.rootNode;
        } else {
            rootNode = html_or_node;
            clone = true;
        }

        ret.errors = rootNode.validateTree();
        if(ret.errors.length && abort_on_errors) {
            //debugger;
            //console.log('ERRORS');
            //console.log(ret.errors);
            return ret;
        }

        var changes = pgFindChangedNodesInPage(this.sourceNode, rootNode);
        ret.changes = changes;

        var $update_els = $([]);

        var done = false;
        var stylesheets_changed = false;

        var css_tags = ['style', 'html', 'head'];

        if(changes.length && this.openedInEditor) {
            pinegrow.httpServer.setCurrentRequestContext(this.url, rootNode);

            var whole = false;
            for(var i = 0; i < changes.length; i++) {
                var ch = changes[i];
                if(ch.original.parent == null) {
                    whole = true;
                    ret.whole_changed = true;
                    break;
                }
            }
            if(!whole) {
                for(var i = 0; i < changes.length; i++) {
                    var ch = changes[i];

                    var pgid = ch.original.getId();

                    var $el = this.getElementWithPgId(pgid);

                    if(clone) {
                        ch.changed = ch.changed.clone(true);
                    }
                    ch.changed.assignIdAndAddToCatalog(true);
                    ch.original.replaceWith(ch.changed);

                    if(css_tags.indexOf(ch.original.tagName) >= 0 || css_tags.indexOf(ch.changed.tagName) >= 0 ||
                        (ch.original.tagName == 'link' && ch.original.getAttr('rel') == 'stylesheet') ||
                        (ch.changed.tagName == 'link' && ch.changed.getAttr('rel') == 'stylesheet')) {

                        stylesheets_changed = true;
                    }
                    if(ch.original.tagName == 'script' || ch.changed.tagName == 'script') {
                        ret.scripts_changed = true;
                    }

                    if($el) {
                        var tree_id = $el.attr('data-pg-tree-id');
                        var str = ch.changed.toStringWithIds(true, null, pinegrow.httpServer.createProxyUrlNodeOutputFilter);
                        $el.get(0).outerHTML = str;

                        var $el = this.getElementWithPgId(ch.changed.getId());

                        if(tree_id && $el) {
                            $el.attr('data-pg-tree-id', tree_id);
                            $update_els = $update_els.add($el.get(0));
                        }

                    }
                    done = true;
                }
            }
            if(done) {
                if($update_els.length && this == pinegrow.getSelectedPage() && this.openedInEditor) {
                    $.fn.crsa('updateStructureAndWireAllElemets', this.$iframe, $update_els, true);
                }

                if(stylesheets_changed && update_stylesheets) {
                    _this.updateStylesheetsList();
                }
                this.setPageChanged(true);
                if(!skip_was_changed && this.openedInEditor) {
                    didMakeChange(this.$iframe, null, null, null, event_type);
                }
                ret.updated = true;
                ret.stylesheets_changed = stylesheets_changed;
                return ret;
            }
        } else {
            //console.log('no changes');
            ret.updated = true;
            return ret;
        }
        this.sourceNode.remove();
        this.sourceNode = clone ? rootNode.clone(true) : rootNode;
        this.sourceNode.assignIdAndAddToCatalog(true);
        //console.log('whole document is changed.');
        //this.refresh();
        return ret;
    }


    this.setSource = function(html, done, no_init, skip_dom_update) {

        var parser = new pgParser();
        parser.parse(html, function() {
            _this.sourceNode = parser.rootNode;
            var htmlNodes = parser.rootNode.find('>html');
            if(htmlNodes && htmlNodes.length) {
                var htmlCode = htmlNodes[0].html(null, true);

                var doc = getIframeDocument(_this.$iframe.get(0));
                var $html = $(doc).find('> html');

                $html[0].innerHTML = htmlCode;

                var attributes = $.map($html[0].attributes, function(item) {
                    return item.name;
                });
                $.each(attributes, function(i, item) {
                    $html.removeAttr(item);
                });

                var attrs = htmlNodes[0].getAttrList();
                for(var i = 0; i < attrs.length; i++) {
                    $html.attr(attrs[i].name, attrs[i].value);
                }

                if(!no_init) {
                    setTimeout(function() {
                        $.fn.crsacss('loadLessStyles', _this.$iframe.get(0), function() {
                            $.fn.crsa('updateStructureAndWireAllElemets', _this.$iframe);
                            $('body').trigger('crsa-stylesheets-changed');
                            _this.addCrsaStyles();
                            if(done) done();
                        });
                    }, 500);
                } else {
                    if(done) done();
                }
            } else {
                if(done) done();
            }
        });
    }

    this.runScripts = function(done) {
        if(done) done();
        return; //disable for now

        var crsaPage = this;
        setTimeout(function() {

            try {
                /*
                var highestTimeoutId = setTimeout(function() {}, 1000);
                for (var i = 0 ; i <= highestTimeoutId ; i++) {
                    clearTimeout(i);
                }
                var highestIntervalId = setInterval(function() {}, 1000);
                for (var i = 0 ; i <= highestIntervalId ; i++) {
                    clearInterval(i);
                }
                */
            }
            catch(err) {}

            var evalInlineScripts = function() {
                var scripts = crsaPage.getDocument().getElementsByTagName('script');
                for (var ix = 0; ix < scripts.length; ix++) {
                    var s = scripts[ix];
                    if(s.text) {
                        var scr = document.createElement('script');
                        scr.async = false;
                        scr.text = s.text;
                        $.each(s.attributes, function(idx, attr) {
                            scr.setAttribute(attr.nodeName, attr.nodeValue);
                        });
                        s.parentNode.replaceChild(scr, s);
                        //eval.call(crsaPage.getWindow(), s.text);
                    }
                }
                if(done) done();
            }

            var count = 0;
            var scripts = crsaPage.getDocument().getElementsByTagName('script');
            for (var ix = 0; ix < scripts.length; ix++) {
                var s = scripts[ix];
                if(s.src) {
                    var scr = document.createElement('script');
                    scr.async = false;
                    $(scr).on('load', function(e) {
                        setTimeout(function() {
                            count--;
                            if(count == 0) {
                                evalInlineScripts();
                            }
                        },1);
                    });
                    count++;
                    $.each(s.attributes, function(idx, attr) {
                        scr.setAttribute(attr.nodeName, attr.nodeValue);
                    });

                    s.parentNode.replaceChild(scr, s);
                }
            }
            if(count == 0) {
                evalInlineScripts();
            }
        }, 500);
    }

    this.addCrsaStyles = function() {
        var o = {css: '.crsa-highlighted {\
            box-shadow: 0 0 10px rgba(0, 255, 0, 0.9) !important;\
        }\
        .crsa-selected {\
            box-shadow: 0 0 0px 2px rgba(0, 180, 255, 1) !important;\
        }\
        .crsa-edit {\
            cursor: default;\
        }\
        .pg-partial-container {\
            box-shadow: 0 0 0px 1px rgba(0, 236, 255, 1) !important;\
        }\
        [data-pg-hidden] {display: none !important;}\
        script-disabled {display: none !important;}\
        *[contenteditable="true"] {\
            outline: rgb(255, 215, 0) dotted 4px !important;\
        }\
        .crsa-disable-hover {\
            pointer-events: none;\
        }\
        [data-pg-preview-ref] {\
            box-shadow: 0 0 0px 1px rgba(0, 236, 255, 1) !important;\
        }\
        '};

        if(pinegrow.getSetting('show-placeholders', '1') == '1') {
            o.css += '.pg-empty-placeholder {\
            min-height: 100px;\
            box-shadow: 0 0 0 1px rgba(0,0,0,0.15);\
            background-image:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAADklEQVQIW2NgQAXGZHAAGioAza6+Hk0AAAAASUVORK5CYII=);\
        }\
        ';
            o.css += '*.pg-no-placeholder:empty {\
            min-height: inherit;\
        }\
        ';
        }
        //, div:empty, section:empty, nav:empty, article:empty, aside:empty, header:empty, footer:empty, iframe:empty, embed:empty, object:empty, video:empty, source:empty, table:empty, form:empty, fieldset:empty, menu:empty, ul:empty, ol:empty {\

        o.css += '\
        .crsa-placed {\
            opacity: 0.5 !important;\
        }\
        html.crsa-stop-animations * {\
            -webkit-transition-property: none !important;\
            transition-property: none !important;\
            -webkit-transform: none !important;\
            transform: none !important;\
            -webkit-animation: none !important;\
            animation: none !important;\
        }';




        this.callFrameworkHandler('on_set_inline_style', o);

        var css = '<style id="' + cssid + '">' + o.css + '</style>';

        var $head = $(getIframeHead(this.$iframe.get(0)));
        var $cssel = $head.find('#' + cssid);
        if($cssel.length == 0) {
            $head.append(css);
        } else {
            $cssel.replaceWith($(css));
        }
    }

    this.stopAnimations = function() {
        var $html = $(getIframeHtmlElement(this.$iframe.get(0)));
        $html.addClass('crsa-stop-animations');
        this.animationsStopped = true;
    }

    this.startAnimations = function() {
        var $html = $(getIframeHtmlElement(this.$iframe.get(0)));
        $html.removeClass('crsa-stop-animations');
        this.animationsStopped = false;
    }

    this.hasStoppedAnimations = function() {
        var $html = $(getIframeHtmlElement(this.$iframe.get(0)));
        return $html.hasClass('crsa-stop-animations');
    }

    this.doWithoutCrsaStyles = function(func) {
        var $head = $(getIframeHead(this.$iframe.get(0)));
        var $c = $head.find('#' + cssid);
        $c.detach();
        func();
        $head.append($c);
    }

    this.removeCrsaStyles = function() {
        var $head = $(getIframeHead(this.$iframe.get(0)));
        var $c = $head.find('#' + cssid);
        $c.detach();
    }

    this.getCompatibleUrl = function(url) {
        if(crsaIsFileUrl(url)) {
            if(pinegrow.sourceParser) {
                url = pinegrow.httpServer.makeUrl(url);
            }
        } else {
            url = pinegrow.httpServer.makeProxyUrl(url);
        }
        return url;
    }

    this.hide = function() {
        this.$page.hide();
        this.visible = false;
    }

    this.show = function() {
        this.$page.show();
        this.visible = true;
    }
}

var getCrsaPageForIframe = function($iframe) {
    if(!$iframe) return null;
    return $iframe.data('crsa-page');
}


var getPageName = function(url) {
    var n = url.split(/[\\\/]/).pop();
    if(n.length == 0) n = 'index.html';
    var a = n.split('?');
    n = a.length > 1 ? a[0] : n;
    if(!n.length) n = 'index.html';
    return n;
}

//(function( $ ) {

    $.fn.crsapages = function( method ) {

        //var opts = $.extend( {}, $.fn.hilight.defaults, options );
        if ( methods[method] ) {
            return methods[method].apply( this, Array.prototype.slice.call( arguments, 1 ));
        } else if ( typeof method === 'object' || ! method ) {
            return methods.init.apply( this, arguments );
        } else {
            $.error( 'Method ' +  method + ' does not exist on jQuery.crsacss' );
        }
    };

    var options;
    var pages;
    var crsaPages = [];
    var currentZoom = 1;
    var centerLeft = 300;
    var centerRight = 300;
    var fitZoom = false;

    var $body = $('body');

    var $empty;
    var customPageActions = [];

    var s_ajaxListener = new Object();

    var handleXMLHTTPOpen = function(a,b,async,user,pass) {
        console.log('Sync AJAX call to ' + b + ' changed to async. PG would block otherwise.');
        s_ajaxListener.tempOpen.call(this, a, b, true, user, pass);
    }

var methods = {
        init : function( opts ) {
            options = $.extend( {}, $.fn.crsapages.defaults, opts );
            $empty = $('.empty-canvas');
            updatePagesList(this);

            if(isApp()) {
                var gui = require('nw.gui');
                gui.Window.get().on('document-start', function(frame) {
                    if(frame) {
                        var cp = getCrsaPageForIframe($(frame));
                        if(cp) {
                            ///
                            var win = frame.contentWindow;

                            s_ajaxListener.tempOpen = win.XMLHttpRequest.prototype.open;
                            win.XMLHttpRequest.prototype.open = handleXMLHTTPOpen;

                            $(frame.contentDocument).on('DOMContentLoaded.crsa', function() {
                                $.fn.crsa('buildTree', $(frame));
                            });

                        }
                        $(frame).trigger('frame-document-start');
                    }
                });
                gui.Window.get().on('document-end', function(frame) {
                    //console.log('document-end');
                });
                gui.Window.get().on('new-win-policy', function(frame, url, policy) {
                    console.log('Win open: ' + url);
                    if(url != window.location.href) {
                        policy.ignore();
                        /*if(url.indexOf('autopilothq') > 0) {
                            require('nw.gui').Shell.openExternal(url);
                        }*/
                    }
                });
            }

        },
        getAllPages : function() {
            return crsaPages;
        },
        clearUndoSetFlag : function() {
            $.each(crsaPages, function(i,p) {
                p.undoSetFlag = false;
            })
        },
        saveAll : function(close_on_save) {
            var savedProjects = [];
            $.each(crsaPages, function(i,cp) {
                cp.saveChangedFrameworks();
                if(cp.live_update && cp.save_parent) return true;

                if(cp.changed || cp.hasCssChanges()) {
                    var do_proj = false;
                    if(cp.crsaProjectTemplate && savedProjects.indexOf(cp.crsaProjectTemplate) < 0) {
                        do_proj = true;
                        savedProjects.push(cp.crsaProjectTemplate);
                    }
                    cp.save(function() {
                        if(close_on_save) {
                            cp.force_close = true;
                            cp.$page.find('.crsa-close').trigger('click');
                        }
                    }, true, true, false, do_proj);
                }
            })
            //background pages
            var project = pinegrow.getCurrentProject();
            if(project) {
                project.getAllBackgroundPages().forEach(function(cp) {
                    if(cp.changed) {
                        cp.save(function() {
                        });
                    }
                })
            }
        },
        downloadAllPages : function() {
            crsaLoadScript('lib/jszip/jszip.js', function() {
                var $b = $('<p><i class="fa fa-refresh fa-spin"></i> Preparing the Zip file. Please wait...</p>');
                showAlert($b, "Download project");

                var zip = new JSZip();

                var doneAll = function() {
                    $b.html('<a download="PinegrowProject.zip">Download the project Zip file</a></p><p>The zip file contains .html sources of all open pages, stylesheets in .css and .less format as well as Bootstrap files.');
                    $a = $b.find('a');
                    $a.attr('href', window.URL.createObjectURL(zip.generate({type:"blob"})));
                }

                var doneCss = function() {
                    if(project) {
                        project.copyRequiredFilesToZip(zip, doneAll);
                    } else {
                        doneAll();
                    }
                }

                var project = null;

                $.each(crsaPages, function(i, cp) {
                    zip.file(cp.name, cp.getSource(true));
                    if(cp.crsaProjectTemplate) project = cp.crsaProjectTemplate;
                    cp.setPageChanged(false);
                });

                var cslist = $.fn.crsacss('getAllCrsaStylesheets');

                var count = 0;
                $.each(cslist, function(i, cs) {
                    count++;
                    var less = cs.getLessSource();
                    cs.getCssSource(function(css) {
                        setTimeout(function() {
                            zip.file(cs.name, css);
                            var less_name = cs.name.replace(/\.css$/i, '.less');
                            if(less_name == cs.name) less_name += '.less';
                            zip.file(less_name, less);
                            count--;
                            if(count == 0) doneCss();
                        }, 10);
                    });
                });
                if(count == 0) {
                    doneCss();
                }
            });
        },
        addCustomPageAction : function(name, func) {
            //depreceated
            customPageActions.push({label: name, func: func});
        },
        addPage : function(src, loaded, providedCrsaPage, onLoadCanceled, options) {
            var name = getPageName(src);
            var _this = this;

            var $page = $('<div/>', { class : 'page'}).html('<span class="name">' + name + '</span><span class="page-changed">*</span><div class="content content-size-tablet-landscape"><iframe class="content-iframe" frameborder="0"></iframe></div>').appendTo(this);

            var $content = $page.find('div.content');

            //debugger;

            $('<i class="fa fa-times crsa-icon crsa-close-icon"></i>').appendTo($page)
                .on('click', function(e) {
                    e.preventDefault();
                    $page.find('.crsa-close').trigger('click');
                });
/*
            $('<i class="fa fa-expand crsa-icon crsa-expand-icon"></i>').appendTo($page)
                .on('click', function(e) {
                    e.preventDefault();
                    crsaPage.showInExternalWindow();
                });
*/
            var crsaPage;
            if(!providedCrsaPage) {
                crsaPage = new CrsaPage();
                crsaPage.name = name;
                crsaPage.url = src;
            } else {
                crsaPage = providedCrsaPage;
            }
            crsaPage.loading = true;
            crsaPage.$page = $page;
            crsaPage.$iframe = $page.find('iframe');
            crsaPage.setPageChanged(false, true);

            if(options) {
                if(options.wrapper_url) crsaPage.wrapper_url = options.wrapper_url;
                if(options.wrapper_selector) crsaPage.wrapper_selector = options.wrapper_selector;
            }

            if(isApp()) {
                crsaPage.$iframe.attr('nwdisable','nwdisable').attr('nwfaketop', 'nwfaketop');
            }

            crsaPages.push(crsaPage);

            crsaPage.$iframe.data('crsa-page', crsaPage);

            methods.reloadPage(crsaPage, function(a, b) {
                if(loaded) loaded(a, b);
            }, onLoadCanceled);

            methods.updateFilesName();
            methods.updatePageMenus(crsaPage);

            updatePagesList(this);

            methods.refresh();
            methods.addResizingOption($page);
            return this;
        },
        closePage: function(crsaPage, leave_css) {
            var $page = crsaPage.$page;
            var $iframe = $page.find('iframe');
            var $canvas = $('div.canvas');
            methods.updateFilesName(crsaPage);

            $page.trigger('crsa-page-closed', crsaPage);

            var ps = getCrsaPageStylesForPage($iframe);
            if(ps && !leave_css) {
                ps.removeAllExclusiveSheets();
            }
            var idx = crsaPages.indexOf(crsaPage);
            if(idx >= 0) crsaPages.splice(idx, 1);

            for(var i = 0; i < crsaPages.length; i++) {
                if(crsaPages[i].live_update == crsaPage) {
                    crsaPages[i].setLiveUpdate(null);
                }
            }
            crsaPage.onClose();

            $page.remove();

            updatePagesList($canvas);
            methods.refresh();
            pinegrow.httpServer.releaseRequestContextForPage(crsaPage);
            $('body').trigger('crsa-stylesheets-changed');
            $canvas.trigger('crsa-page-closed-removed', crsaPage);
        },
        updatePageMenus : function(crsaPage) {

            var $page = crsaPage.$page;
            var name = crsaPage.name;
            var src = crsaPage.url;

            var _this = this;

            _this = $page;

            var customPageActions = [];

            if(crsaPage.sourceNode) {
                crsaPage.callFrameworkHandler('on_page_menu', customPageActions);
            }

            var $device = $page.find('.device-menu');

            if($device.length == 0) {
                $device = $('<div/>', {class: 'dropdown device-menu btn-group'}).html('<button type="button" class="btn btn-link btn-xs dropdown-toggle" data-toggle="dropdown">Page </button>\
                <ul class="dropdown-menu" role="menu">\
                </ul>').insertAfter($page.find('.page-changed'));
            }

            var $code = $page.find('.edit-code');
            if($code.length == 0 && !pinegrow.isContributorMode()) {
                $code = $('<div/>', {class: 'edit-code btn-group'}).html('<button type="button" class="btn btn-link btn-xs"><i class="fa fa-code edit-code-icon"></i></button>').insertAfter($device);
                $code.on('click', function(e) {
                    e.preventDefault();
                    crsaPage.toggleEditCode();
                })
                addTooltip($code, 'Show/hide code editor');
            }

            var updateDeviceButtonList = function() {
                var $ul = $device.find('ul').empty();

                $.each(options.sizes, function(key, size) {
                    $('<li/>').html('<a href="#">' + key + ' / ' + size + ' px</a>').appendTo($ul).data('device-width', size);
                });
                var $custom_li = $('<li/>').appendTo($ul);
                var $custom_ul = $('<ul/>', { class: "custom-size-menu"}).appendTo($ul);

                $('<li class="divider"></li>').appendTo($ul);
                $('<li class="dropdown-header">Responsive breakpoints</li>').appendTo($ul);
                var $breakpoint_li = $('<li/>').appendTo($ul);
                var $breakpoints_ul = $('<ul/>', { class: 'custom-size-menu' }).appendTo($breakpoint_li);

                var $li = $('<li/>').html('<a href="#">Manage breakpoints...</a>').appendTo($ul);
                $li.get(0).addEventListener('click', function(e) {
                        e.preventDefault();
                        crsaPage.showManageBreakpoints();
                    });


                $device.find('.btn').button();



                var updatePageBreakpoints = function () {

                    var showItem = function(b, prefix, scale) {
                        scale = scale || 1;
                        prefix = prefix || '';

                        var cv = crsaSplitCSSValue(b);
                        var first_px = crsaConvertCSSValueToPx(cv, crsaPage.$iframe);
                        var first = parseInt(first_px * scale);
                        var first_str = cv.value + ' ' + cv.unit;
                        if(cv.unit != 'px') first_str += ' (' + first_px + ' px)';

                        $('<li/>').html('<a href="#">' + prefix + first_str + '</a>').appendTo($breakpoints_ul).data('device-width', first);
                    }

                    $breakpoints_ul.html('');
                    crsaPage.breakpoints.sort(function (a, b) {
                        var cva = crsaSplitCSSValue(a);
                        var cvb = crsaSplitCSSValue(b);
                        return cva.value - cvb.value;
                    });
                    if(crsaPage.breakpoints.length > 0) {

                        showItem(crsaPage.breakpoints[0], '&lt; ', 0.75);

                        for(var i = 0; i < crsaPage.breakpoints.length; i++) {
                            showItem(crsaPage.breakpoints[i]);
                        }

                        showItem(crsaPage.breakpoints[crsaPage.breakpoints.length-1], '&gt; ', 1.25);
                    }
                }
                updatePageBreakpoints();

                var updatePageCustomWidth = function () {
                    $custom_ul.html('');
                    if (crsaPage.custom_width) {
                        $('<li/>').html('<a href="#">custom / ' + crsaPage.custom_width + ' px</a>').appendTo($custom_ul).data('device-width', crsaPage.custom_width);
                    } else {
                        $('<li/>').html('<a href="#">custom / <em>resize page</em></a>').appendTo($custom_ul).on('click', function(e) {
                            e.preventDefault();
                            pinegrow.showQuickMessage('Resize the page (drag the right edge) for custom width.', 3000);
                        });
                    }
                }
                updatePageCustomWidth();

                $device.find('a').off('click').on('click', function(e) {
                    e.preventDefault();
                    var w = $(e.delegateTarget).closest('li').data('device-width');
                    if(w) {
                        w = parseInt(w);
                        if(w > 5000) w = 5000;
                        crsaPage.deviceWidth = w;
                        methods.showDeviceValue(crsaPage);
                        methods.refresh();
                        $('body').trigger('crsa-window-changed', crsaPage);
                    }
                });
            }

            updateDeviceButtonList();

            $('body').on('crsa-breakpoints-changed.page' + crsaPage.uid, function() {
                updateDeviceButtonList();
            });

            var setDeviceSize = function(w) {
                w = parseInt(w);
                if(w > 5000) w = 5000;
                crsaPage.deviceWidth = w;
            }

            setDeviceSize(crsaPage.deviceWidth);

            // var showDeviceValue = function() {
            //     var done = false;
            //     $.each(options.sizes, function(key, size) {
            //         if(crsaPage.deviceWidth == size) {
            //             $device.find('>button').html(size + 'px <span class="caret"></span>');
            //             done = true;
            //             return false;
            //         }
            //     });
            //     if(!done) {
            //         $device.find('>button').html(crsaPage.deviceWidth + 'px <span class="caret"></span>');
            //     }
            // }

            methods.showDeviceValue(crsaPage);

            /*
             $page.on('click', function(e) {
             $.fn.crsa('selectElement', null);
             e.preventDefault();
             });*/


            var $action_menu = $page.find('.page-menu');

            if($action_menu.length == 0) {
                $action_menu = $('<div/>', {class: 'dropdown page-menu btn-group'}).html('<button type="button" class="btn btn-link btn-xs dropdown-toggle" data-toggle="dropdown">Page <span class="caret"></span></button>\
                    <ul class="dropdown-menu with-checkboxes" role="menu">\
                    </ul>').insertAfter($device);
            }

            var $ul = $action_menu.find('ul').html('');

            $('<li/>').html('<a href="#" class="crsa-view">Open another view</a>').appendTo($ul);
            $('<li/>').html('<a href="#" class="crsa-clone">Duplicate</a>').appendTo($ul);
            //$('<li/>').html('<a href="#" class="crsa-mirror">Duplicate &amp; Mirror</a>').appendTo($ul);
            $('<li/>').html('<a href="#" class="crsa-reload">Revert to saved</a>').appendTo($ul);
            var $refa =$('<li/>').html('<a href="#" class="crsa-refresh">Refresh</a>').appendTo($ul);
            //$('<li/>').html('<a href="#" class="crsa-refresh">Refresh</a>').appendTo($ul);
            crsaAddKbd($refa.find('a'), 'CMD R');

            if(!isApp()) {
                $('<li/>').html('<a href="#" class="crsa-rename">Rename</a>').appendTo($ul);
            }

            if(!pinegrow.isContributorMode()) {
                $('<li/>').html('<a href="#" class="crsa-manage-ss">Manage stylesheets...</a>').appendTo($ul);
                $('<li/>').html('<a href="#" class="crsa-manage-fm">Manage libraries &amp; plugins...</a>').appendTo($ul);
                var $edit = $('<li/>').html('<a href="#" class="crsa-code">Edit code</a>').appendTo($ul);
                crsaAddKbd($edit.find('a'), 'CMD E');
            }

            if(isApp()) {

                var $openPreview = $('<li/>').html('<a href="#" target="_blank" class="crsa-preview"><i class="fa fa-link"></i>Preview in browser</a>').appendTo($ul);
                var $savepreview = $('<li/>').html('<a href="#" target="_blank" class="crsa-save-preview">Save &amp; Open in browser</a>');//.appendTo($ul);

                $ul.find('a.crsa-preview i').on('click', function(e) {
                    if(isApp()) {
                        var gui = require('nw.gui');
                        var clipboard = gui.Clipboard.get();
                        var $link = $(e.delegateTarget).closest('a');
                        clipboard.set( crsaPage.getPreviewUrl(), 'text');

                        $link.tooltip({container: 'body', placement: 'left', title: 'Link to the page was copied to the clipboard.', trigger: 'manual'});
                        $link.tooltip('show');
                        setTimeout(function() {
                            $link.tooltip('destroy');
                        }, 2500);
                        e.stopPropagation();
                        e.preventDefault();
                    }
                });

                var openInBrowser = function(url) {
                    var gui = require('nw.gui');
                    var url = crsaPage.getPreviewUrl(true);

                    if(url.indexOf('file://') == -10) {
                        url = url.replace('file://', '');
                        gui.Shell.openItem(url);
                    } else {
                        gui.Shell.openExternal(url);
                    }
                    pinegrow.showNotice('<p>The page was opened in your default browser. Click on <b>the link icon</b> next to Page -&gt; Preview in Browser to <b>copy the preview link to clipboard</b> from where you can use it to open the preview in any browser.</p><p>The preview link will work as long as the page is opened in Pinegrow.</p>', 'About the preview link', 'page-preview-link');
                }

                $ul.find('a.crsa-preview').attr('href', src).on('click', function(e) {
                    if(isApp()) {
                        if(!crsaPage.localFile) {
                            pinegrow.showAlert('<p>After creating a new page, you have to <b>save the page</b> first, before using Preview in browser. After the page is saved on disk, you can use Preview in browser without saving the page.</p>', 'Page needs a home first');
                        } else {
                            openInBrowser($(e.delegateTarget).attr('href'));
                        }
                        e.preventDefault();
                    }
                });

                crsaAddKbd($openPreview.find('a'), 'CMD B');
                $ul.find('a.crsa-save-preview').attr('href', src).on('click', function(e) {
                    e.preventDefault();
                    if(isApp()) {
                        var cp = pinegrow.getSelectedPage();

                        if(cp.live_update && cp.save_parent) cp = cp.live_update;

                        cp.save(function(err) {
                            openInBrowser(cp.url);
                        }, true, true);
                    }
                });
            }

            if(customPageActions && customPageActions.length > 0) {
               // $('<li/>', {class: 'divider'}).appendTo($ul);
                $.each(customPageActions, function(i, pa) {
                    (function(pa){
                        var header = false;
                        if(pa.divider) {
                            $('<li/>', {class: 'divider'}).appendTo($ul);
                            header = true;
                        }
                        if(pa.header) {
                            $('<li/>', {class: 'dropdown-header'}).html(pa.header).appendTo($ul);
                            header = true;
                        }
                        if(!header) {
                            var $i = $('<li/>').html('<a href="#" class="crsa-custom-action">' + pa.label + '</a>').appendTo($ul)
                                .on('click', function(e) {
                                    e.preventDefault();
                                    if(pa.func) {
                                        pa.func(crsaPage);
                                    }
                                });
                            if(pa.kbd) {
                                crsaAddKbd($i.find('a'), pa.kbd);
                            }
                        }

                    })(pa);
                })
            }

            $('<li/>', {class: 'divider'}).appendTo($ul);
            //$('<li/>').html('<a href="#" class="crsa-page-scroll"><i class="fa fa-check"></i>Scrollbars</a>').appendTo($ul);
            $('<li/>').html('<a href="#" class="crsa-page-no-anim"><i class="fa fa-check"></i>Disable CSS animations</a>').appendTo($ul);
            $('<li/>').html('<a href="#" class="crsa-page-js-enabled"><i class="fa fa-check"></i>JavaScript enabled</a>').appendTo($ul);
            $('<li/>', {class: 'divider'}).appendTo($ul);
            $('<li/>').html('<a href="#" class="crsa-close">Close</a>').appendTo($ul);
            $('<li/>').html('<a href="#" class="crsa-close-leave-css">Close HTML, keep CSS</a>').appendTo($ul);
            //$('<li/>').html('<a href="#" class="crsa-clone">Clone</a>').appendTo($ul);

            $action_menu.find('.btn').button();

            $page.find('.dropdown').on('shown.bs.dropdown', function (e) {
                var pageHeight = $(e.target).closest('.page').height();
                var $ul = $(e.target).find('> ul');
                $ul.css('height', 'auto');

                if ($ul.height() + $ul.offset().top > pageHeight) {
                    $ul.css('height', pageHeight - 5);
                }
            })

            $page.find('span.name').html(crsaPage.tab_name);

            $page.find('.crsa-code').on('click', function(e) {
                crsaPage.editCode();
                e.preventDefault();
            });


            var updateCheckbox = function($li, value) {
                var $i = $li.find('i');
                if(value) {
                    $i.css('opacity', 1);
                } else {
                    $i.css('opacity', 0);
                }
            }

            var $scroll = $page.find('.crsa-page-scroll').on('click', function(e) {
                crsaPage.scrollMode = !crsaPage.scrollMode;
                updateCheckbox($(e.delegateTarget), crsaPage.scrollMode);
                crsaPage.autoSize();
                e.preventDefault();
            });

            var $anim = $page.find('.crsa-page-no-anim').on('click', function(e) {
                if(crsaPage.hasStoppedAnimations()) {
                    crsaPage.startAnimations();
                } else {
                    crsaPage.stopAnimations();
                }
                updateCheckbox($(e.delegateTarget), crsaPage.hasStoppedAnimations());
                crsaPage.autoSize();
                e.preventDefault();
            });

            var $js_enabled = $page.find('.crsa-page-js-enabled').on('click', function(e) {
                //debugger;
                if(crsaPage.javascriptEnabled) {
                    crsaPage.setJavascriptEnabled(false);
                    crsaQuickMessage("JavaScript disabled.", 3000);
                } else {
                    crsaPage.setJavascriptEnabled(true);
                    crsaQuickMessage("JavaScript enabled.", 3000);
                }
                updateCheckbox($(e.delegateTarget), crsaPage.javascriptEnabled);
                e.preventDefault();
            });

            updateCheckbox($js_enabled, crsaPage.javascriptEnabled);
            updateCheckbox($scroll, crsaPage.scrollMode);
            updateCheckbox($anim, crsaPage.animationsStopped);

            var ask_close_html = "This page has unsaved changes. Are you sure you want to close it?";
            var ask_close_css = "Stylesheets attached to this page have unsaved changes. Are you sure you want to proceed?";

            var askOnCloseDialog = function(ask, leave_css) {
                var $alert = showAlert(ask,  "Page has unsaved changes", "Cancel", "Save & Close", null, function() {
                    if(canSavePage(crsaPage)) {
                        crsaPage.save(function() {
                            $.fn.crsapages('closePage', crsaPage, leave_css);
                        }, true, true);
                    }
                })
                $('<a href="#" class="btn pull-left">Don\'t save</a>').appendTo($alert.find('.modal-footer')).on('click', function(e) {
                    e.preventDefault();
                    $.fn.crsapages('closePage', crsaPage, leave_css);
                    $alert.modal('hide');
                });
            }

            $page.find('.crsa-close').on('click', function(e) {
                var ask = null;
                if(crsaPage.hasCssChanges()) {
                    ask = ask_close_css;
                }
                if(crsaPage.changed && !crsaPage.force_close) {
                    ask = ask_close_html;
                }
                if(ask) {
                    askOnCloseDialog(ask);
                } else {
                    $.fn.crsapages('closePage', crsaPage);
                }
                e.preventDefault();
            });

            $page.find('.crsa-close-leave-css').on('click', function(e) {
                var ask = null;
                if(crsaPage.changed) {
                    ask = ask_close_html;
                }
                if(ask) {
                    askOnCloseDialog(ask, true);
                } else {
                    $.fn.crsapages('closePage', crsaPage, true);
                }
                e.preventDefault();
            });

            $page.find('.crsa-manage-ss').on('click', function(e) {
                var $iframe = $page.find('iframe');
                $.fn.crsa('setSelectedPage', $iframe);
                $.fn.crsacss('showStylesheetsManager');
                e.preventDefault();
            });

            $page.find('.crsa-manage-fm').on('click', function(e) {
                $.fn.crsacss('showFrameworkManager', crsaPage);
                e.preventDefault();
            });

            $page.find('.crsa-clone').on('click', function(e) {
                _this.trigger('crsa-page-clone', crsaPage);
                e.preventDefault();
            });

            $page.find('.crsa-view').on('click', function(e) {
                _this.trigger('crsa-page-view', crsaPage);
                e.preventDefault();
            });

            $page.find('.crsa-mirror').on('click', function(e) {
                _this.trigger('crsa-page-mirror', crsaPage);
                e.preventDefault();
            });

            $page.find('.crsa-reload').on('click', function(e) {
                _this.trigger('crsa-page-reload', crsaPage);
                e.preventDefault();
            });

            $page.find('.crsa-refresh').on('click', function(e) {
                _this.trigger('crsa-page-refresh', crsaPage);
                e.preventDefault();
            });

            $page.find('.crsa-rename').on('click', function(e) {
                _this.trigger('crsa-page-rename', crsaPage);
                e.preventDefault();
            });

            $page.find('.crsa-preview').on('click', function(e) {
                //_this.trigger('crsa-page-preview', crsaPage);
                //e.preventDefault();
            });
        },
        updateFilesName : function (excludePage) {
            var pagesObj = {};
            for (var i=0; i<crsaPages.length; i++) {
                if (crsaPages[i] == excludePage) continue;
                crsaPages[i].tab_name = crsaPages[i].name;
              if (!pagesObj[crsaPages[i].name]) pagesObj[crsaPages[i].name] = [];
              pagesObj[crsaPages[i].name].push(crsaPages[i]);
            }

            for (name in pagesObj) {
              if (pagesObj[name].length > 1) {
                var pagesWithSameName = pagesObj[name];
                for (var i=0; i < pagesWithSameName.length; i++) {
                  var fileName = pagesWithSameName[i].name;
                  var dirUrl = crsaGetBaseForUrl(pagesWithSameName[i].url);
                  var dirName = crsaGetNameFromUrl(dirUrl);
                  pagesWithSameName[i].tab_name = path.join(dirName, fileName);
                  pagesWithSameName[i].$page.find('span.name').html(pagesWithSameName[i].tab_name);
                }
              }
              else {
                pagesObj[name][0].$page.find('span.name').html(pagesObj[name][0].tab_name);
              }
            }
        },
        checkIfPageExists : function(url, done) {
            if(isApp() && crsaIsFileUrl(url))
            {
                var file = crsaMakeFileFromUrl(url, true);

                try {
                    var fs = require('fs');
                    var stat = fs.statSync(file);
                    if(stat.isFile()) {
                        done(true);
                    } else {
                        done(false, 'NOT A FILE - Path is a folder');
                    }
                } catch(err) {
                    done(false, err);
                }
                return;

                //console.log('Checking file ' + file);
                if(crsaIsFileOrDir(file) == 'file') {
                    //console.log('File ' + file + ' found');
                    done(true);
                } else {
                    console.log('File ' + file + ' not found.');
                    done(false);
                }
            } else {
                $.ajax({
                    url: url,
                    data: null,
                    dataType: 'html'
                })
                    .done(function(data) {
                        done(true);
                    }).fail(function(a, b, c) {
                        done(false);
                    });
            }
        },
        reloadPage : function(crsaPage, done, onCancel, refresh) {

            if(!refresh) crsaPage.loadingStart(onCancel);

            var onPageLoaded = function() {
                var page_loaded_called = false;

                if(crsaPage.load_source) {
                    page_loaded_called = true;
                    crsaPage.setSource(crsaPage.load_source, null, true);
                    crsaPage.load_source = null;
                    crsaPage.runScripts(function() {
                        crsaPage.callFrameworkHandler('on_page_loaded');
                        $.fn.crsa('updateIfNeeded');
                    });
                }

                crsaPage.loaded = true;

                if(!refresh) {
                    crsaPage.setPageChanged(false);

                    var loaded_url = crsaPage.$iframe.get(0).contentDocument.location.href;
                    loaded_url = crsaPage.getPageUrlFromLoadedUrl(loaded_url);
                    if(loaded_url != crsaPage.url && loaded_url != crsaPage.wrapper_url) {
                        crsaPage.rename(loaded_url);
                        crsaPage.pageLoaded();
                    }
                }

                if(done) done(crsaPage.$iframe, crsaPage, refresh);

                if(!page_loaded_called) {
                    if(refresh) {
                        crsaPage.callFrameworkHandler('on_page_refreshed');
                    } else {
                        crsaPage.callFrameworkHandler('on_page_loaded');
                    }
                }

                crsaPage.addCrsaStyles();

                setTimeout(function() {
                    methods.autoSizePage(crsaPage.$iframe, crsaPage.scrollMode);
                }, 1);

                if(crsaPage.animationsStopped) {
                    crsaPage.stopAnimations();
                    if(!refresh) crsaQuickMessage("CSS Animations stopped.", 2000);
                } else {
                    crsaPage.startAnimations();
                    //if(!refresh) crsaQuickMessage("CSS Animations resumed.", 2000);
                }

                crsaPage.$iframe.get(0).contentWindow.onbeforeunload = function (e) {
                    return (crsaPage.allowReload) ? null : 'Please click CANCEL. Clicking on Ok will DISABLE Pinegrow.';
                };

                crsaPage.allowReload = false;

                $(crsaPage.getDocument()).off('click.crsa').on('click.crsa', function() {
                    $('body').trigger('click'); //close menus, etc...
                });
            }

            var doWithExists = function(exists, error) {

                if(!refresh) {
                    crsaPage.$iframe
                        .off('load.crsa').on('load.crsa', function(event) {
                            console.log('iframe load');
                            if(!exists) {
                                crsaPage.setSource('<head><meta http-equiv="Content-Type" content="text/html; charset=UTF-8"></head><body><p>Document can not be read.</p></body>', null, false);
                                pinegrow.showAlert('<p>The file <code>' + crsaPage.url + '</code> could not be read. The error reported was <b>' + error + '</b>.</p><p>Reasons for the file not being found could be:</p><ul><li>Pinegrow doesn\'t have permissions to access the file.</li><li>The file is located on a network share with strange access path (tell us if that\'s the case)</li><li>Using <b>semicolons ;</b>, <b>?</b> or <b>#</b> in file path is not supported.</li></ul>', 'File was not found');
                            }
                            onPageLoaded();
                            crsaPage.callFrameworkHandler('on_page_shown_in_live_view');
                        });
                    crsaPage.$iframe.off('frame-document-start.crsa');

                } else {
                    crsaPage.$iframe
                        .off('load.crsa').on('load.crsa', function(event) {
                            //console.log('iframe loaded');
                            crsaPage.addCrsaStyles();
                            crsaPage.callFrameworkHandler('on_page_shown_in_live_view');
                        });
                    crsaPage.$iframe.off('frame-document-start.crsa').on('frame-document-start.crsa', function() {
                        console.log('frame-document-start');
                        onPageLoaded();
                        //crsaPage.$iframe.off('frame-document-start.crsa');////mtch
                    })
                }

                var pgurl;// = crsaPage.url + (crsaPage.url.indexOf('?') >= 0 ? '&pgedit=1' : '?pgedit=1');
                //pgurl = pgurl + '&pgid=' + crsaPage.uid;

                var args = ['pgid=' + crsaPage.uid, 'pgedit=1'];
                if(refresh) args.push('pglive=1');

                var url_to_load = crsaPage.wrapper_url || crsaPage.url;//partials

                pgurl = crsaPage.getCompatibleUrl(url_to_load);
                pgurl = crsaAppendQueryToUrl(pgurl, args);

                crsaPage.allowReload = true;

                console.log('Loading ' + pgurl);
                crsaPage.$iframe.attr('src', pgurl);
            }
            if(!refresh) {
                methods.checkIfPageExists(crsaPage.url, function(exists, error) {
                    doWithExists(exists, error);

                });
            } else {
                doWithExists(true);
            }
        },
        showOverlays : function(hide) {
            pages.each(function(i,p) {
                var $p = $(p);
                var $if = $p.find('.content-iframe');
                var $c = $p.find('.content');
                var $o = $p.find('.iframe-overlay');
                if(!hide) {
                    if($o.length == 0) {
                        $o = $('<div/>', {'class' : 'iframe-overlay'}).appendTo($c).data('iframe_element',$if).css('top',$if.position().top + 'px');
                    }
                } else {
                    $o.remove();
                }
            });
        },
        showLoadingOverlay : function($p, hide, onCancel) {
            var $if = $p.find('.content-iframe');
            var $c = $p.find('.content');
            var $o = $p.find('.iframe-loading-overlay');
            if(!hide) {
                if($o.length == 0) {
                    $o = $('<div/>', {'class' : 'iframe-loading-overlay'}).html('<div><i class="fa fa-refresh fa-spin"></i>Loading, please wait...<p style="padding-left:40px;padding-right:40px;"><small>If the page doesn\'t load check your firewall settings or / and try changing the internal web server port in Support -&gt; Settings.</small></p></div>').appendTo($c).css('top',$if.position().top + 'px');
                    $o.find('a').on('click', function(e) {
                        e.preventDefault();
                        methods.showLoadingOverlay($p, true);
                        if(onCancel) onCancel();
                    })
                }
            } else {
                $o.remove();
            }
        },
        showDeviceValue: function (crsaPage) {
            var $device = crsaPage.$page.find('> .device-menu');
            if (!$device) return;

            var done = false;
            $.each(options.sizes, function(key, size) {
                if(crsaPage.deviceWidth == size) {
                    $device.find('>button').html(size + 'px <span class="caret"></span>');
                    done = true;
                    return false;
                }
            });
            if(!done) {
                $device.find('>button').html(crsaPage.deviceWidth + 'px <span class="caret"></span>');
            }
        },
        getZoom : function() {
            return currentZoom;
        },
        refresh : function() {
            //debugger;
            var cw = 0;
            var $code = $("#textedit");
            if($code.is(':visible')) {
                cw = $code.width() + 5;
            }
            //methods.centerPages($('#crsa-left-plane').is(':visible') ? centerLeft : 10, ($('#crsa-tree').is(':visible') ? $('#crsa-tree').width() : 10) + cw);

            methods.centerPages(centerLeft, centerRight);

            if(fitZoom) {
                methods.zoom(getFitZoomScale());
            } else {
                methods.zoom(currentZoom);
            }
        },
        addResizingOption: function ($page) {
            var $sizeNotice;
            var $overlay = $page.find('> .resizer-overlay');
            var $canvas = $('.canvas');
            var $content = $page.find('> .content');
            var $iframe = $page.find('iframe');

            if (!$overlay.length)
                $overlay = $('<div/>', {class:"resizer-overlay"}).appendTo($page);


            var $resizer = $('<div/>', {class: 'canvas-resizer'}).appendTo($page)
            .on('mousedown', function(e) {
                $overlay.show();

                $sizeNotice = $('<div class="quick-message page-size-notice" style="display:none;"><p>Width: <span>0</span>px</p></div>').appendTo($('body'));
                var $sizeInNotice = $sizeNotice.find('> p > span');
                $sizeNotice.fadeIn();

                var startRight = e.pageX;
                var startContentWidth = $content.width();
                var startIframeWidth = $iframe.width() * $.fn.crsapages('getZoom');

                $sizeInNotice.html($iframe.width());

                $overlay.css('width', startContentWidth + 'px');
                $overlay.css('height', $content.height() + 'px');

                e.preventDefault();

                $('body')
                    .on('mousemove.editResizer', function(m) {
                        var right = m.pageX;

                        var ContentWidth = startContentWidth - (startRight - right);
                        $content.css('width', ContentWidth + 'px');
                        $overlay.css('width', ContentWidth + 'px');

                        var iframeWidth = startIframeWidth - (startRight - right);
                        if (iframeWidth < 170)
                            $iframe.css('width', '170px');
                        else
                            $iframe.css('width', (iframeWidth / $.fn.crsapages('getZoom')) + 'px');

                        $sizeInNotice.html($iframe.width());
                    })
                    .on('mouseup.editResizer', function(e) {
                        e.preventDefault();
                        $overlay.hide();

                        $sizeNotice = $('.page-size-notice');
                        $sizeNotice.fadeOut(function () {
                            $sizeNotice.remove()
                        });

                        var selectedPage = pinegrow.getSelectedPage();
                        selectedPage.deviceWidth = $iframe.width();
                        methods.showDeviceValue(selectedPage);

                        selectedPage.custom_width = selectedPage.deviceWidth;
                        $('body').trigger('crsa-breakpoints-changed');

                        if ($page.width() > $canvas.width() || $content.width() < 150) {
                            methods.refresh();
                        }

                        selectedPage.rememberWidth = true;
                        $('body').off('.editResizer');

                        pinegrow.stats.using('edit.pageresizer');
                    });
            }).css('top', 0);
        },
        autoSizePage : function($if, scroll_mode) {
            sizePage($if, currentZoom, scroll_mode);
        },
        setFit : function(fit) {
            fitZoom = fit;
            methods.refresh();
        },
        getFit : function(fit) {
            return fitZoom;
        },
        canvasResized : function() {

            methods.refresh();
            return;
            if(fitZoom) {
                methods.zoom(getFitZoomScale());
            }
        },
        zoom : function(zoom) {
            var $pages = pages.find('> div.content');
            var $iframes = pages.find('iframe');
            var w = 800;

            currentZoom = zoom;
           // methods.centerPages(centerLeft, $('#crsa-tree').width());

            $pages.each(function(i,e) {
                var $e = $(e);

                var $if = $e.find('iframe');
                var cp = getCrsaPageForIframe($if);

                w = cp.deviceWidth;
                var cw = Math.ceil(w * zoom);

                //.css('height', '') leave it out
                $if.css('width',w + 'px').css('transform','scale(' + zoom + ', ' + zoom + ')').css('transform-origin', '0 0');

                sizePage($if, zoom, cp.scrollMode, w);

                 /*
                var h = Math.ceil($if[0].contentWindow.document.body.scrollHeight * 1.05);
                $if.css('height', h + 'px');


                $e.css('width', cw + 'px').css('height', Math.ceil(h * zoom) + 'px' );
                */
                $if.data('zoom', zoom);
            });
            repositionSelectedElementMenu();
            //$.fn.crsa('refreshSelectElement'); maybe dont need this
            return this;
        },
        centerPages : function(leftp, rightp) {
            //debugger;
            centerLeft = leftp;
            centerRight = rightp;
            var $canvas = $('div.canvas');
            var w = $(window).width();// $canvas.outerWidth();
            var space = w - leftp - rightp;
            var margin = 20;
            var $pages = $canvas.find('div.page');
            var pagew = $pages.width() + margin;
            var pagesPerLine = Math.floor(space / pagew);
            if(pagesPerLine < 1) pagesPerLine = 1;
            if(pagesPerLine > $pages.length) pagesPerLine = $pages.length;
            var pagesWidth = pagew * pagesPerLine;
            var paddingLeft = leftp + (space - pagesWidth)/2 - 20;
            var paddingRight = rightp + (space - pagesWidth)/2 - 20;

            paddingLeft = centerLeft;
            paddingRight = centerRight;
            //$canvas.css('padding-left', paddingLeft + 'px').css('padding-right', paddingRight + 'px');
            $canvas.css('overflow-y', 'auto').css('overflow-x', 'auto').css('margin-left', paddingLeft + 'px').css('margin-right', (paddingRight + 0) + 'px');
          /*  if(pagesWidth < space) {
                $canvas.css('overflow-x', 'hidden');
            } */

        }
    };

//w * z + space = cw
//z = (cw - space)/w

    var getFitZoomScale = function() {
        var spc = 24;
        var w = 0,
            sw = spc;
        $.each(crsaPages, function(i,cp) {
            if(cp.visible) {
                w += cp.deviceWidth;
                sw += spc;
            }
        });
        var space = $('div.canvas').width();// - 12;// - centerLeft - centerRight;
        //console.log('fit ' + w + ' ' + space);
        var z = (space - sw) / w;
        var min = 200;//230;//214;


        w = 0;
        sw = spc;
        do {
            var all_min = true;
            var len = sw;
            $.each(crsaPages, function(i,cp) {
                if(cp.visible) {
                    if(cp.deviceWidth * z < min) {
                        len += min;
                    } else {
                        len += cp.deviceWidth * z;
                        all_min = false;
                    }
                    len += spc;
                }
            });
            if(len > space) z = z * 0.95;
        } while(!all_min && len > space);

        if(z > 1.0) z = 1.0;
        return z;
    }

    var sizePage = function($if, zoom, scroll_mode, w) {
        var $e = $if.closest('.content');
        if(!w) w = $if.width();
        var cw = Math.ceil(w * zoom);
        //$if.css('height', ''); disable scroll_mode
        var h;
        var eh;
        var $canvas = $('div.canvas');
        if(scroll_mode) {
            var bh = /*$body.height() - 90 */ $canvas.height() - 50 - $.fn.crsa('getPageTabs').getHeight() - pinegrow.statusBar.getHeight() /* status bar */;
            h = bh / zoom;
            eh = bh;
        } else {
            h = Math.ceil($if[0].contentWindow.document.body.scrollHeight * 1.05);
            eh = Math.ceil(h * zoom);
        }
        $if.css('height', h + 'px').css('width',w + 'px');
        $e.css('width', cw + 'px').css('height', eh + 'px' );

        var $p = $e.parent();
        if(cw < 225) {
            $p.addClass('narrow');
        } else {
            $p.removeClass('narrow');
        }

    }

    var panels_hidden = true;

    var updatePagesList = function($el) {

        $el.each(function(i,e){
            pages = $(e).find('div.page');
        });
        if(pages.length == 0 && !pinegrow.getCurrentProject()) {
            $empty.show();
            pinegrow.statusBar.$element.hide();
            alignEmptyCanvas();
            if(!pinegrow.getCurrentProject()) {
                $('#crsa-left-plane').hide();
                $('#crsa-tree').hide();
                $(window).trigger('resize');
                panels_hidden = true;
            }
            //pinegrow.hideLeftPanel();
        } else {
            $empty.hide();

           // if(panels_hidden) {
                $('#crsa-left-plane').show();
                $('#crsa-tree').show();
                panels_hidden = false;
                $(window).trigger('resize');
            //pinegrow.statusBar.$element.show();
           // }
        }
    }
    // Plugin defaults – added as a property on our plugin function.
    $.fn.crsapages.defaults = {
        title : 'crsa',
        sizes : {
            'desktop' : 1600,
            'laptop' : 1280,
            'tablet-landscape' : 1024,
            'tablet-portrait' : 768,
            'phone' : 320
        }
    };


    function getIframeBody(iframe) {
        var doc = iframe.contentDocument || iframe.contentWindow.document;
        return doc.body;
    }

    function getIframeHtmlElement(iframe) {
        var doc = iframe.contentDocument || iframe.contentWindow.document;
        var head  = doc.getElementsByTagName('html')[0];
        return head;
    }

    function getIframeHead(iframe) {
        var doc = iframe.contentDocument || iframe.contentWindow.document;
        var head  = doc.getElementsByTagName('head')[0];
        return head;
    }

function getIframeTag(iframe, tag) {
    var doc = iframe.contentDocument || iframe.contentWindow.document;
    var head  = doc.getElementsByTagName(tag)[0];
    return head;
}

//})( jQuery );
