/**
 * Created by Matjaz on 2/3/14.
 */

var Pinegrow = function() {

    var components = {};
    var frameworks = {};

    var framework_urls = [];
    var _this = this;

    this.projectTemplates = [];

    this.sourceParser = true;
    this.httpServer = null;

    var ignore_clicks = false;

    var count = 0;

    var current_project = null;

    this.cache_breaker = 0;

    this.stats = new PgStats();

    this.code_editors = new PgCodeEditors();

    this.insight = new PgInsight();

    this.event_conductor = new PgEventConductor();

    this.clipboard = new PgClipboard();

    this.getClipboard = function() {
        return this.clipboard;
    }


    this.isContributorMode = function() {
        var p = crsaStorage.getValue('activatedProduct');
        if(p && p.indexOf('CMSUSER') >= 0) return true;
        return pinegrow.getSetting('contributor-mode', 'false') == 'true';
    }

    this.openProject = function(dir, page) {
        var project = new CrsaProject();
        project.fromFolder(dir, function(p) {
            pinegrow.setCurrentProject(p);
            pinegrow.recentFiles.add(p.root.path, true);
            crsaQuickMessage('Project was loaded.');
            pinegrow.showTab('project');

            if(page && p.framework) {
                page.addFramework(p.framework);
            }

        }, true);
    }

    this.setCurrentProject = function(p) {
        if(current_project && current_project != p) {
            $('body').trigger('crsa-project-closed', current_project);
        }
        current_project = p;
        if(p) {
            p.showProjectExplorer($('#crsa-project'));
            _this.callGlobalFrameworkHandler('on_project_loaded', current_project);

            $('#crsa-left-plane').show();
            $('.empty-canvas').hide();
            $(window).trigger('resize');

             if(!p.framework) {
                //not yet loaded as framework
                p.framework = pinegrow.loadProjectAsLibrary(p.getDir());
            }
        }
        //updatePagesList();
        //$(window).trigger('resize');
    }

    this.getCurrentProject = function() {
        return current_project;
    }

    this.closeCurrentProject = function() {
        if(current_project) {
            pinegrow.closeAllPages(function(closed) {
                if(closed) {
                    var p = current_project;
                    current_project.closeProjectExplorer($('#crsa-project'));
                    pinegrow.setCurrentProject(null);

                    _this.callGlobalFrameworkHandler('on_project_closed', p);

                    $('#crsa-left-plane').hide();
                    $('#crsa-tree').hide();
                    $('.empty-canvas').show();
                    $(window).trigger('resize');
                }
            })
        }
    }

    this.refreshCurrentProject = function(done) {
        if(current_project) {
            current_project.fromFolder(current_project.root.path, function(p) {
                current_project.showProjectExplorer($('#crsa-project'));
                _this.callGlobalFrameworkHandler('on_project_refreshed', current_project);
                if(done) done();
            }, true /* show pg files */)
        }
    }

    this.refreshAllPages = function () {
        var pages = this.getAllPages();
        for (var i=0; i < pages.length; i++) {
            pages[i].refresh();
        }
    }

    this.getComponent = function(name, done) {
        if(name in components && false) {
            done(components[name]);
        } else {
            components[name] = new PgComponent(name, done);
        }
    }

    this.getProxyUrl = function(url, live) {
        if(this.sourceParser && this.httpServer) {
            return this.httpServer.makeProxyUrl(url, live);
        }
        return url;
    }

    this.getOriginalUrl = function(url) {
        if(this.httpServer) {
            return this.httpServer.getOriginalUrl(url);
        }
        return url;
    }

    this.getApiUrl = function() {
        return this.httpServer.url;
    }

    // Set editable file types
    var editable_types = null;

    this.resetEditableFileTypes = function() {
        editable_types = null;
    }

    this.editCode = function(page) {
        $.fn.crsa('editCode', page.$iframe, page.onlyCode ? page : null);
    }

    this.openFileInCodeEditor = function(file) {
        var url = crsaMakeUrlFromFile(file);
        var page = pinegrow.getCrsaPageByUrl(url);
        var ext = crsaGetExtFromUrl(url);
        if(page) {
            this.editCode(page);
        } else {
            //var cs = pinegrow.getStylesheetByUrl(url);
            if(['jpg', 'jpeg', 'gif', 'png'].indexOf(ext) >= 0) {
                pinegrow.showQuickMessage('Images can\'t be edited in the code editor.', 4000, false, 'error');
                return false;
            } else if(['css', 'less', 'scss'].indexOf(ext) >= 0) {
                pinegrow.showAlert('<p>To edit the CSS code of a stylesheet, select a page that is using the stylesheet and use <b>Page -&gt; Edit code -&gt; CSS</b> to edit the CSS code with live preview.</p>', 'Edit stylesheet code through Page -&gt; Edit code');
                return false;
            } else {
                page = new CrsaPage();
                page.fromFile(file, true /* only code */);
                var project = this.getCurrentProject();
                if(project) project.addBackgroundPage(page);
                this.editCode(page);
            }
        }
        return true;
    }

    this.isFileEditable = function(file) {
        if(editable_types === null) {
            var editable = (pinegrow.getSetting('file-types', '') || '') + ',.html,.htm';
            editable_types = [];
            editable = editable.split(',');
            pinegrow.callGlobalFrameworkHandler('on_get_editable_file_types', editable);
            $.each(editable, function(i, ext) {
                try {
                    ext = $.trim(ext);
                    if(ext.length) {
                        editable_types.push(new RegExp('\\' + ext + '$', 'i' ));
                    }
                } catch(err) {
                    console.log('File type error: ' + err);
                }
            })
        }

        for(var i = 0; i < editable_types.length; i++) {
            if(file.match(editable_types[i])) return true;
        }
        return false;
    }
    //End editable file types

    this.getMimeType = function(file) {
        return this.httpServer.getMimeType(file);
    }

    this.getPlaceholderImage = function() {
        var path;
        if(isApp()) {
            path = this.getProxyUrl(crsaMakeUrlFromFile(crsaGetAppDir() + 'placeholders/img'));
        } else {
            path = "http://pinegrow.com/placeholders/img";
        }
        var r = Math.round(Math.random() * 8) + 1;
        return path + r + '.jpg';
    }

    this.getThumbnailForPlaceholderImage = function(img) {
        return img.replace('.jpg', '_thumb.jpg');
    }

    this.getPageForElement = function($el) {
        var $if = getIframeOfElement($el);
        if($if) {
            return getCrsaPageForIframe($if);
        }
        return null;
    }
    //Styles

    this.getStylesheets = function() {
        return $.fn.crsacss('getAllCrsaStylesheets');
    }

    this.getStylesheetByUrl = function(url) {
        var list = this.getStylesheets();
        for(var i = 0; i < list.length; i++) {
            if(url == list[i].url) return list[i];
        }
        return null;
    }

    this.getStylesheetByFileName = function(name) {
        var list = this.getStylesheets();
        for(var i = 0; i < list.length; i++) {
            if(name == list[i].getLocalFileName()) return list[i];
        }
        return null;
    }

    //Frameworks

    this.getCodeFromDefinition = function(def) {
        return getCodeFromDefinition(def);
    }

    this.addFramework = function(f, weight) {
        if(typeof weight == 'undefined') weight = 0;
        frameworks[f.key] = f;
        frameworks[f.key].order = weight;
        if(framework_urls.length > 0) {
            f.pluginUrl = framework_urls[framework_urls.length-1];
        }
        $('body').trigger('crsa-framework-loaded', f);
    }

    this.getFrameworks = function() {
        return frameworks;
    }

    this.getComponentType = function(type) {
       // for(var i = )
    }

    this.findFrameworkWithUrl = function(url) {
        var f = null;
        $.each(frameworks, function(i, fm) {
            if(fm.pluginUrl && fm.pluginUrl == url) {
                f = fm;
                return false;
            }
        });
        return f;
    }

    this.findFrameworkByKey = function(key) {
        var f = null;
        $.each(frameworks, function(i, fm) {
            if(fm.key == key) {
                f = fm;
                return false;
            }
        });
        return f;
    }

    this.findFrameworkByType = function(type) {
        var f = null;
        $.each(frameworks, function(i, fm) {
            if(fm.type == type) {
                f = fm;
                return false;
            }
        });
        return f;
    }

    this.loadAllFrameworksFromFile = function() {
        var flist = pinegrow.getFrameworksListFromStorage();
        //debugger;
        var elist = '';
        var idx = 0;

        var not_found = [];

        var loadOne = function() {
            if(idx >= flist.length) {
                if(elist.length > 0) {
                    showAlert(elist, "Not all frameworks could be loaded");
                }
                if(not_found.length) {
                    for(var i = 0; i < not_found.length; i++) {
                        var n = flist.indexOf(not_found[i]);
                        if(n >= 0) {
                            flist.splice(n, 1);
                        }
                    }
                    crsaStorage.setValue('frameworks', flist);
                }
            } else {
                var url = flist[idx];
                var file = crsaMakeFileFromUrl(url);
                var what = crsaIsFileOrDir(file);
                if(what == 'file') {
                    _this.loadFrameworkFromUrl(url, true, function(e) {
                        if(e) {
                            elist += '<p>Unable to load ' + url + ': ' + e + '</p>';
                            if(e == 'FILE_NOT_FOUND') {
                                not_found.push(url);
                            }
                        }
                        idx++;
                        loadOne();
                    });
                } else if(what == 'dir') {
                    pinegrow.loadProjectAsLibrary(file, function() {
                        idx++;
                        loadOne();
                    });
                }
                else {
                    idx++;
                    loadOne();
                }
            }
        }
        loadOne();
    }

    this.fileLoaded = function() {
        if(framework_urls.length > 0) framework_urls.pop();
    }

    this.addScriptToPage = function(page, code, skip_source) {
        var body = page.getBody();
        var scr = page.getDocument().createElement('script');
        scr.async = false;
        scr.text = code;
        body.appendChild(scr);

        if(!skip_source) {
            var pgBody = getElementPgNode($(body));
            if(pgBody) {
                var n = pgCreateNodeFromHtml("<script>\n    " + code + "\n</script>");
                pgBody.append(n);
            }
        }
        return scr;
    }

    this.executeScriptInPage = function(page, code) {
        if(!page.javascriptEnabled) return;
        var scr = this.addScriptToPage(page, code, true);
        setTimeout(function() {
            scr.parentNode.removeChild(scr);
        }, 500);
    }

    this.loadFrameworkFromUrl = function(url, ret, done) {
        var e = null;
        if(isApp()) {
            var fs = require('fs');

            if(crsaIsFileUrl(url)) {
                var file = crsaMakeFileFromUrl(url);
                if(crsaIsFileOrDir(file) != 'file') {
                    if(done) done('FILE_NOT_FOUND');
                    return false;
                }
            }
            try {
                var z = (new Date().getTime());
                var scr = '<script async="false" src="' + url + '?z=' + z + '"></script>';
                var $body = $('body');

                var scr = document.createElement('script');
                scr.async = false;
                $(scr).on('load', function(e) {
                    $(function() {
                        framework_urls.push(url);
                        try{ $('body').trigger('pinegrow-ready',pinegrow);
                            pinegrow.fileLoaded();
                            if(done) done();
                        } catch(err) {
                            pinegrow.fileLoaded();
                            if(done) done(err);
                        }});
                });

                scr.setAttribute('src',url);
                $body.get(0).appendChild(scr);

// var run = '<script async="false">$(function() { try{ $(\'body\').trigger(\'pinegrow-ready\',pinegrow); pinegrow.fileLoaded(); } catch(err) { pinegrow.fileLoaded(); throw err; }});</script>';
/*
                $.getScript( url )
                    .done(function( script, textStatus ) {
                        try{
                            $('body').trigger('pinegrow-ready',pinegrow);
                            pinegrow.fileLoaded();
                        } catch(err)
                        {
                            console.log(err);
                            pinegrow.fileLoaded();
                            //throw err;
                        }
                    })
                    .fail(function( jqxhr, settings, exception ) {
                        console.log(exception);
                    });
*/
                //$body.append(scr);



                var flist = pinegrow.getFrameworksListFromStorage();
                if(flist.indexOf(url) < 0) {
                    flist.push(url);
                    crsaStorage.setValue('frameworks', flist);
                }
            }
            catch(err) {
                e = err;
                if(!ret) {
                    showAlert('Unable to load ' + url + '. ' + err, "Unable to load framework");
                }
                console.log(err);
                if(done) done(err);
            }
        }
        return e;
    }

    this.saveFrameworksList = function() {
        var flist = [];
        $.each(frameworks, function(key, fm) {
            if(fm.pluginUrl) {
                flist.push(fm.pluginUrl);
            }
        });
        crsaStorage.setValue('frameworks', flist);
    }

    this.getFrameworksListFromStorage = function() {
        var flist = crsaStorage.hasValue('frameworks') ? crsaStorage.getValue('frameworks') : [];
        for(var i = 0; i < flist.length; i++) {
            if(!crsaIsAbsoluteUrl(flist[i])) {
                flist[i] = crsaMakeUrlFromFile(flist[i]);
            }
        }
        return flist;
    }

    this.unloadFramework = function(f) {
        var pages = $.fn.crsapages('getAllPages');
        $.each(pages, function(i, cp) {
            cp.removeFramework(f);
        });
        if(f.key in frameworks) {
            delete frameworks[f.key];
        }
        var idx = -1;
        var flist = pinegrow.getFrameworksListFromStorage();
        if(f.pluginUrl) {
            idx = flist.indexOf(f.pluginUrl);
        }
        if(idx >= 0) flist.splice(idx, 1);

        crsaStorage.setValue('frameworks', flist);
    }

    this.hasUnsavedFrameworks = function() {
        var b = false;
        $.each(frameworks, function(i, fm) {
            if(fm.changed && fm.user_lib) b = true;
        });
        return b;
    }

    this.activateFrameworkInCurrentContext = function(f) {
        var current_project = pinegrow.getCurrentProject();
        var page = pinegrow.getSelectedPage();

        if(!page) {
            pinegrow.showAlert('<p>The library is loaded. Now open a page and <b>Activate ' + f.name + '</b> in <b>Page -&gt; Manage libraries &amp; framewors</b>.</p>', 'Activate the library');
        } else {
            if(current_project && current_project.isPageInProject(page)) {
                //activate on all open pages in project
                pinegrow.getAllPages().forEach(function(cp) {
                    if(current_project.isPageInProject(cp)) {
                        cp.addFramework(f, true /* skip update */);
                    }
                });
                //update
                pinegrow.frameworksChanged();
                pinegrow.showQuickMessage('<b>' + f.name + '</b> activated for <b>project ' + current_project.getName() + '</b>');
            } else {
                //activate on the current page only
                page.addFramework(f);
                pinegrow.showQuickMessage('<b>' + f.name + '</b> activated for <b>page ' + page.name + '</b>');
            }
        }
    }



    this.frameworksChanged = function() {
        $.each($.fn.crsapages('getAllPages'), function(i,cp) {
            cp.frameworksChanged();
        });
        $('body').trigger('crsa-frameworks-changed');
    }

    var event_handlers = {};

    this.addEventHandler = function(event, func) {
        if(!event_handlers[event]) {
            event_handlers[event] = [];
        }
        event_handlers[event].push(func);
    }

    this.removeEventHandler = function(event, func) {
        if(event_handlers[event]) {
            var idx = event_handlers[event].indexOf(func);
            if(idx >= 0) {
                event_handlers[event].splice(idx, 1);
            }
        }
    }

    this.dispatchEvent = function(event, a, b, c, d, e, f) {
        
        var page = a instanceof CrsaPage ? a : null;
        
        var getHandlers = function() {
            var list = [];
            if(page) {
                for(var i = 0; i < a.frameworks.length; i++) {
                    var f = a.frameworks[i];
                    if (f.hasOwnProperty(event)) {
                        list.push(f[event]);
                    }
                }
            }
            if (event_handlers[event]) {
                list = list.concat(event_handlers[event]);
            }
            return list;
        }

        var list = getHandlers();
        
        if(event.endsWith('_async')) {
            //a = page
            //b = info/result
            //c = done
            
            if (list.length) {
                var idx = 0;

                var doEvent = function() {
                    if(idx < list.length) {
                        list[idx](a, b, function(new_b) {
                            b = new_b;
                            idx++;
                            doEvent();
                        })
                    } else {
                        if(c) c(b);
                    }
                }

                doEvent();
            } else {
                if(c) c(b)
            }
        } else {
            if(page) page.currentFrameworkHandlerReturnValues[event] = null;
            var r = null;
            if (list.length) {
                for (var i = 0; i < list.length; i++) {
                    r = list[i](a, b, c, d, e, f);
                    if(page) page.currentFrameworkHandlerReturnValues[event] = r;
                }
            }
            if(page) page.currentFrameworkHandlerReturnValues[name] = null;
            return r;
        }
    }

    this.callGlobalFrameworkHandler = function(name, a, b, c, cp) {
        if(!cp) cp = this.getSelectedPage();
        var ret = null;
        $.each(this.getFrameworks(), function(key, f) {
            if(name in f && f[name]) {
                ret = f[name](cp, a, b, c);
            }
        });
        if (event_handlers[name]) {
            event_handlers[name].forEach(function(h) {
                ret = h(name, cp, a, b, c);
            })
        }
        return ret;
    }

    this.showUpdateResourcesDialog = function(page, project, f_list) {
        var frameworks = [];
        var folder;
        var name;
        if(project) {
            //project
            frameworks = project.getFrameworks();
            name = project.getName();
            folder = project.getDir();
        }
        if(page) {
            //page
            for(var i = 0; i < page.frameworks.length; i++) {
                if(frameworks.indexOf(page.frameworks[i]) < 0) {
                    frameworks.push(page.frameworks[i]);
                }
            }
            name = page.name;
            folder = page.localFile ? require('path').dirname(page.localFile) : null;
        }
        var f_with_r = [];
        var current_project = pinegrow.getCurrentProject();
        var current_project_pi = null;
        if(current_project) {
            current_project_pi = current_project.getProjectInfo();
        }

        for(var i = 0; i < frameworks.length; i++) {
            if(f_list && f_list.indexOf(frameworks[i]) < 0) continue; //skip this one
            if(frameworks[i].resources.has()) {
                f_with_r.push(frameworks[i]);
            }
        }

        var isSameProject = function(f) {
            if(current_project && f.project && current_project.getDir() == f.project.getDir()) return true;
            if(current_project_pi && current_project_pi.getSetting('template_framework_id') == f.type) return true;
            return false;
        }

        var updateDisplay = function($d) {
            $d.html('');
            for(var i = 0; i < f_with_r.length; i++) {
                var f = f_with_r[i];
                var $li = $('<li style="margin-bottom:15px;"><b>' + f.name + '</b></li>');
                if(f.pluginUrl && false) {
                    $li.append('<div><small class="text-muted">' + f.pluginUrl + '</small></div>');
                }
                if(f.resources.description) {
                    $li.append('<p class="text-muted" style="margin-bottom:0;">Resources: ' + f.resources.description + '</p>');
                }
                var same_project = isSameProject(f);

                if(folder && !same_project) {
                    $li.append('<p class="text-muted" style="margin-bottom:0;">Will be copied to: <b>./' + f.getResourceNamespace() + '</b></p>');
                }
                if(same_project) {
                    $li.append('<p style="margin-bottom:0;">These resources are already a part of the current project.</p>');
                }
                var $wrap = $li.append('<div class="files-list-wrapper"></div>');

                if(!same_project || true) {
                    if(page) {
                        $wrap.append('<a href="#" class="copy btn btn-sm btn-primary">Add to or update ' + page.name + '</a>');
                    }
                    if(project) {
                        $wrap.append('<a href="#" class="copy project btn btn-sm btn-primary" style="margin-left: 10px;">Add to or update all files in ' + project.getName() + '</a>');
                    }
                }
                $wrap.append('<a href="#" class="show-list btn btn-sm btn-link">Show files and folders</a>');

                var $list = $('<ul/>', {'class' : 'files-list'}).appendTo($li.find('.files-list-wrapper'));
                for(var j = 0; j < f.resources.list.length; j++) {
                    $('<li>' + (f.resources.list[j].relative_url || f.resources.list[j].url) + '</li>').appendTo($list);
                }
                $list.hide();
                $li.data('framework', f);
                $d.append($li);

            }
            $d.find('a.copy').on('click', function(e) {
                e.preventDefault();
                var $li = $(e.delegateTarget).closest('li');
                var f = $li.data('framework');
                var is_project = $(e.delegateTarget).hasClass('project');
                var same_project = isSameProject(f);

                if(is_project) {
                    f.addResourcesToProject(project, function() {
                        onDone(f);
                    }, true /* overwrite existing */, same_project);
                } else {
                    if(!page.localFile) {
                        pinegrow.showAlert('<p>Please save the page before adding resources to it.</p><p>After saving the page go to <b>Page -&gt; Add or update resources</b> to copy and add resources to the page.</p>', 'New page is not saved yet');
                    } else {
                        f.addResourcesToPage(page, function() {
                            onDone(f);
                        }, true /* overwrite existing */, same_project);
                    }
                }
            })
            $d.find('a.show-list')
                .on('click', function(e) {
                    e.preventDefault();
                    var $li = $(e.delegateTarget).closest('li');
                    var f = $li.data('framework');
                    var $list = $li.find('ul.files-list');
                    if($list.is(':visible')) {
                        $list.hide();
                        $(this).html('Show the list of files and folders')
                    } else {
                        $list.show();
                        $(this).html('Hide the list of files and folders:')
                    }
                });
        }

        var onDone = function(f) {
            pinegrow.refreshAllPages();
            pinegrow.showQuickMessage('<b>' + f.name + '</b> resources copied to <b>' + name + '</b>');
        }

        var html = '';
        if(f_with_r.length == 0) {
            html += '<div><p>No libraries or plugins that are activated on this page/project have any resources that can be copied to your page or project.</p></div>';
        } else {
            html += '<div><p>The following libraries and plugins have resources (CSS &amp; JS files, images...) that can be copied to your page or project. These resources are often necessary for components to display and behave properly.</p></div>';
        }
        var $b = $(html);
        var $ul = $('<ul/>').appendTo($b);
        pinegrow.showAlert($b, 'Update resources in page or project', null, 'Close');

        updateDisplay($ul);
    }

    this.goThroughAllForAttribute = function (page, attr, callback) {
        var list = page.sourceNode.findIncludingSelf('[' + attr + ']');
        for(var j = 0; j < list.length; j++) {
            var el = list[j];
            var url = el.getAttr(attr);
            if (callback) callback(el, attr, url);
        }
    }

    //Starting projects
    this.goThroughAllLinkedResources = function (page, callback) {
        var attrs = ['src', 'data-src', 'href', 'action'];

        for(var i = 0; i < attrs.length; i++) {
            this.goThroughAllForAttribute(page, attrs[i], callback);
        }
    }

    var getFixedUrl = function (currnet_url, target_url, file_url, callback) {
        crsaGetRelativeDistanceForUrls(target_url, file_url, function (distance, new_url) {
            if (distance < 0) {
                var backward = "";
                for (i = distance; i < 0; i++)
                    backward += "../";
                if (callback) callback(backward + currnet_url);
            }
            else if (distance > 0) {
                var backward = new_url;
                for (i = 0; i < distance; i++)
                    backward = "../" + backward;
                if (callback) callback(backward);
            }
            else if (distance == 0) {
                if (callback) callback(new_url);
            }
        });
    }

    this.fixLinks = function (project, page, sourceUrl, destUrl, done, copy_external_files, skip_asking_user) {
        var overwriteFiles = {};
        this.goThroughAllLinkedResources(page, function (el, attr, url) {
            url = crsaCleanUpUrl(url);
            if(url && !crsaIsAbsoluteUrl(url)) {

                var newUrl = crsaGetUrlToSmartCombine(destUrl, url);
                var new_file_url = crsaCombineUrlWith(destUrl, newUrl);
                if (!project.getFileForUrl(new_file_url) && !crsaIsFileOrDir(crsaMakeFileFromUrl(new_file_url))) {

                    var new_file_name = crsaGetNameFromUrl(new_file_url);
                    var currectPath = project.getFilesWithName(new_file_name);
                    if (currectPath.length > 0) {
                        if (currectPath.length == 1) {
                            getFixedUrl(url, currectPath[0].url, destUrl, function (fixedUrl) {
                                el.setAttr(attr, fixedUrl);
                            });
                        }
                        else {
                            var useFiles = [];
                            var breakLoop = false;
                            for (var i=0; i < currectPath.length; i++) {
                                crsaGetRelativeDistanceForUrls(currectPath[i].url, new_file_url, function (distance, new_url) {
                                    new_url = (distance < 0) ? url : new_url;

                                    if (!overwriteFiles[url]) {
                                        overwriteFiles[url] = {urls: []};
                                    }

                                    overwriteFiles[url]['name'] = new_file_name;
                                    overwriteFiles[url]['el'] = el;
                                    overwriteFiles[url]['attr'] = attr;
                                    overwriteFiles[url]['urls'].push(currectPath[i].path);
                                    useFiles.push({
                                        distance: distance,
                                        url: new_url
                                    });

                                    if (currectPath[i].url == crsaCombineUrlWith(sourceUrl, url)) {
                                        useFiles = [{
                                            distance: distance,
                                            url: new_url
                                        }];
                                        overwriteFiles[url]['urls'] = useFiles;
                                        breakLoop = true;
                                    }
                                });
                                if (breakLoop) break;
                            }

                            var currentFileNameArray = useFiles.sort(function (a, b) {
                                if (a.distance > b.distance) return 1;
                                if (a.distance < b.distance) return -1;
                                if (b.distance == undefined) return -1;
                                if (a.distance == undefined) return 1;
                            });

                            if (currentFileNameArray[0].distance < 0 || currentFileNameArray.length == 1) {
                                var backward = "";
                                for (var i = currentFileNameArray[0].distance; i < 0; i++)
                                    backward += "../";
                                var final_url = backward + currentFileNameArray[0].url;
                                el.setAttr(attr, final_url);
                                delete overwriteFiles[url];
                            }
                        }
                    }
                    else {
                        if (copy_external_files) {
                            if (el.tagName == "a" && attr == "href") return;

                            var fs = require('fs');
                            var source_file_url = crsaCombineUrlWith(sourceUrl, url);

                            var source_file_path = crsaMakeFileFromUrl(source_file_url);
                            var new_file_path = crsaMakeFileFromUrl(new_file_url);

                            if (crsaIsFileExist(source_file_path)) {
                                crsaCreateDirs(crsaGetFileDir(new_file_path), fs);
                                crsaCopyFileSync(fs, source_file_path, new_file_path);
                            }
                        }
                    }
                }
                else if (newUrl != url) {
                    el.setAttr(attr, newUrl);
                }
            }
        });


        var hasBadLinks = !$.isEmptyObject(overwriteFiles);
        if (skip_asking_user) {
            if (done) done(hasBadLinks);
        }
        else {
            var cmc = new CrsaMultiChooser();
            for (file in overwriteFiles) {
                cmc.addItem(
                    "<b>"+file+"</b> missing. Use:",
                    file,
                    overwriteFiles[file].urls
                );
            }
            cmc.show(null, function (chosenFiles) {
                if (chosenFiles) {
                    for (var key in chosenFiles) {
                        var chosenFile = chosenFiles[key];
                        var fileObj = overwriteFiles[key];

                        getFixedUrl(null, crsaMakeUrlFromFile(chosenFile), page.url, function (fixedUrl) {
                            fileObj.el.setAttr(fileObj.attr, fixedUrl);
                        });
                    }
                }
                if (done) done(hasBadLinks);
            });
        }
    }

    this.addTemplateProject = function(project, index) {
        if(typeof index == 'undefined' || index === null) {
            this.projectTemplates.push(project);
        } else {
            this.projectTemplates.splice(index, 0, project);
        }
        $.fn.crsa('addTemplateProject', project, index);
    }

    this.addTemplateProjectFromTemplateDefinition = function(def) {
        var p = new CrsaProject();
        p.fromSimpleTemplate(def);
        this.addTemplateProject(p);
    }

    this.addTemplateProjectFromFolder = function(folder, done, index) {
        var p = new CrsaProject();
        p.fromFolder(folder, function(p) {
            p.sortItems();
            _this.addTemplateProject(p, index);
            done(p);
        })
    }
    //Pages

    this.openPage = function(url, done, select_page, on_css_done, options) {
        if(this.isFileEditable(crsaMakeFileFromUrl(url))) {
            $.fn.crsa('openPage', url, /* null,*/ function(cp) {
                scrollCanvasToPage(cp.$iframe);
                if(select_page) {
                    setTimeout(function() {
                        _this.pageTabs.showPage(cp, false);
                    }, 200);
                }

                if(done) done(cp);
            }, function(cp) {
                //on source loaded
                if(crsaIsFileUrl(url)) {
                    cp.setLocalFile(crsaMakeFileFromUrl(url));
                }
            }, null, null, options);
        } else {
            pinegrow.showQuickMessage('Files of this type can not be edited in Pinegrow.');
        }
    }

    this.openOrShowPage = function(url, done, hide_others, select_page) {
        var cp = this.getCrsaPageByUrl(url);
        if(!cp) {
            this.openPage(url, function(cp) {
                if(select_page || hide_others) {
                    setTimeout(function() {
                        _this.pageTabs.showPage(cp, hide_others);
                    }, 200);
                }
                if(done) done(cp);
            });
        } else {
            this.pageTabs.showPage(cp, hide_others);
            scrollCanvasToPage(cp.$iframe);
            if(done) done(cp);
        }
    }

    this.showPage = function(cp, hide_others) {
        this.pageTabs.showPage(cp, hide_others);
        scrollCanvasToPage(cp.$iframe);
    }

    this.getAllPages = function() {
        return $.fn.crsapages('getAllPages');
    }

    this.getCrsaPageById = function(id) {
        var pages = $.fn.crsapages('getAllPages');
        for(var i = 0; i < pages.length; i++) {
            if(pages[i].uid == id) return pages[i];
        }
        return null;
    }

    this.getCrsaPageByUrl = function(url) {
        var pages = $.fn.crsapages('getAllPages');
        var m = url.match(/pgid=([0-9]+)/);
        if(m) {
            var pageid = parseInt(m[1]);
            var cp = this.getCrsaPageById(pageid);
            if(cp) return cp;
        }
        for(var i = 0; i < pages.length; i++) {
            if(pages[i].url == url && !pages[i].live_update) return pages[i];
        }
        for(var i = 0; i < pages.length; i++) {
            if(pages[i].url == url) return pages[i];
        }
        return null;
    }

    this.getSourceNodeOfUrl = function(url, clone, assign_ids) {
        var assignIdsIfNeeded = function(node) {
            if(assign_ids) {
                node.assignIdAndAddToCatalog(true);
            }
            return node;
        }
        //only for file at the moment
        var cp = this.getCrsaPageByUrl(url);
        if(cp && cp.sourceNode) {
            return assignIdsIfNeeded(clone ? cp.sourceNode.clone(true) : cp.sourceNode);
        }

        var project = pinegrow.getCurrentProject();
        if(project) {
            var bck_page = project.getBackgroundPageForUrl(url);
            if(bck_page) {
                if(bck_page.onlyCode) {
                    var p = new pgParser();
                    p.assignIds = assign_ids;
                    p.parse(bck_page.getCode());
                    return p.rootNode;
                } else {
                    return assignIdsIfNeeded(clone ? bck_page.sourceNode.clone() : bck_page.sourceNode);
                }
            }
        }

        var fullPath = crsaMakeFileFromUrl(url);
        var fs = require('fs');
        try {
            if(fs.existsSync(fullPath)) {
                var data = fs.readFileSync(fullPath);
                var html = data.toString('utf8');
                var p = new pgParser();
                p.assignIds = assign_ids;
                p.parse(html);
                return p.rootNode;
            }
        } catch(err) {
            return null;
        }
    }

    this.getCrsaPageForUrl = function(url) {
        //only for file at the moment
        var cp = this.getCrsaPageByUrl(url);
        if(!cp) {
            cp = new CrsaPage(true /* not interactive */);
            cp.fromFile(crsaMakeFileFromUrl(url));
        }
        return cp;
    }


    this.getWorkingDir = function() {
        var project = pinegrow.getCurrentProject();
        if(project) return project.currentWorkingDir || project.getDir();
        var page = pinegrow.getSelectedPage();
        if(page && page.localFile) {
            return require('path').dirname(page.localFile);
        }
        return null;
    }
    
    this.setWorkingDir = function(dir) {
        var project = pinegrow.getCurrentProject();
        if(project) {
            project.currentWorkingDir = dir;
        }
    }

    this.getCrsaPageOfPgParserNode = function(pgel) {
        var pages = $.fn.crsapages('getAllPages');
        for(var i = 0; i < pages.length; i++) {
            if(pages[i].sourceNode == pgel.document) return pages[i];
        }
        return null;
    }

    this.isElementLocked = function(pgel, cp) {
        if(!cp) cp = this.getCrsaPageOfPgParserNode(pgel);
        return cp.callFrameworkHandler('on_is_element_locked', pgel);
    }

    this.willChangeDom = function() {
        crsaWillChangeDom();
    }

    this.setNeedsUpdate = function($el, now) {
        $.fn.crsa('setNeedsUpdate', now, $el);
    }

    this.updateTree = function($el) {
        //this.setNeedsUpdate($el, true);

        this.updateTreeMultiple([$el]);
    }

    /*
    Update tree for multiple elements
    @list: array of $el elements for which to update the tree

    $el is a jQuery object with one element on the page that was changed

    Updating the tree is expensive. Should work in optimal way, update as few elements as possible
     */
    this.updateTreeMultiple = function(list) {
        var newList = list.slice();
        if (list.length > 1) {
            tmpList = [];
            for (var i = 0; i < list.length; i++) {

                var childrenNumber = 0; //var was missing
                var siblingsLength = list[i].siblings().length; //reuse this

                var mayHaveTheSameParent = false; //spelling mayHas... -> mayHave
                if (siblingsLength + 1 <= list.length) {
                    mayHaveTheSameParent = true;
                }

                for (var j = 0; j < list.length; j++) {
                    if (list[i] != list[j]) {
                        if (list[j].find(list[i]).length != 0 && newList.indexOf(list[i]) != -1) {
                            newList.splice(newList.indexOf(list[i]), 1);
                        }
                    }
                    if (j > i) {
                        if (mayHaveTheSameParent) {
                            if (list[i].parent()[0] == list[j].parent()[0]) {
                                tmpList.push(list[j]);
                                childrenNumber += 1;
                            }
                        }
                    }
                }
                if (siblingsLength == childrenNumber && siblingsLength > 0) { //reuse stored value
                    tmpList.push(list[i]);
                    newList = newList.filter(function(i) {return tmpList.indexOf(i) < 0;});
                    newList.push(list[i].parent());
                }

                tmpList = [];
            }
        }
        if(newList.length) {
            //each open page in pg is in an iframe. get the one for this page
            var $iframe = getIframeOfElement(newList[0]); //all elements must be on the same page

            var $tree = $('#crsa-tree'); //here's the tree
            var scrollTop = $tree.scrollTop(); //remember tree scroll position.

            for(var i = 0; i < newList.length; i++) {
                //let's call low level tree paint function
                pinegrow.treePanel.paintTree($iframe, newList[i], null, true /* skip update */);
            }
            pinegrow.treePanel.updateTreeAfterPainting(); //let the tree do some updatin after we're done painting
            $tree.scrollTop(scrollTop); //restore scroll
        }
    }

    this.repaintTree = function() {
        var page = this.getSelectedPage();
        var $iframe = page ? page.$iframe : null;
        if(page) page.treeRepaintOnShow = true;
        pinegrow.treePanel.showTreeForIframe($iframe);
    }

    this.getSelectedPage = function() {
        return $.fn.crsa('getSelectedCrsaPage');
    }

    this.setSelectedPage = function(crsaPage) {
        return $.fn.crsa('setSelectedPage', crsaPage.$iframe);
    }

    this.isElementSelected = function($el) {
        var sel = this.getSelectedElement();
        return sel && sel.data && $el.get(0) == sel.data.get(0);
    }

    this.isElementOrDescendantSelected = function($el) {
        if(this.isElementSelected($el)) return true;
        var sel = this.getSelectedElement();
        if(sel && sel.data) {
            if($el.has(sel.data)) return true;
        }
        return false;
    }

    this.getSelectedElement = function() {
        return $.fn.crsa('getSelectedElement');
    }

    this.getSelectedPgNode = function() {
        var el = $.fn.crsa('getSelectedElement');
        return el ? getElementPgNode(el.data) : null;
    }

    this.getSelectedElementName = function() {
        var el = this.getSelectedElement();
        if(el) {
            return getElementName(el.data);
        }
    }

    this.selectElement = function($el, user_action) {
        if($el instanceof pgParserNode) {
            $el = $el.get$DOMElement();
        }
        $.fn.crsa('selectElement', $el, user_action);
    }

    this.reselectElement = function($if_el) {
        var obj =  this.getSelectedElement();
        if(obj && obj.data) {
            if($if_el && $if_el.get(0) != obj.data.get(0)) return;
            this.selectElement(obj.data);
        }
    }

    this.highlightElement = function($el) {
        $.fn.crsa('highlightElement', $el);
    }

    this.showCSSRules = function($el, filter, active) {
        $.fn.crsa('showCSSRules', $el, filter, active);
    }

    this.scrollCanvasToElement = function($el) {
        $.fn.crsa('scrollCanvasToElement', $el);
    }

    this.scrollToElement = function($el) {
        $.fn.crsa('scrollCanvasToElement', $el);
    }

    this.addPageAction = function(name, func) {
        $.fn.crsapages('addCustomPageAction', name, func);
    }

    this.showTab = function(tab) {
        $.fn.crsa('showTab', tab);
    }

    this.formatHtml = function(src) {
        return html_beautify(src, {
            'wrap_line_length': 0,
            'indent_size': parseInt(pinegrow.getSetting('html-indent-size', '4'))
        });
    }

    this.getFormatHtmlOptions = function() {
        return {
            indent: new Array(parseInt(pinegrow.getSetting('html-indent-size', '4')) + 1).join(' ')
        }
    }

    this.getHtmlIndentForLevel = function(level, options) {
        if(!options) options = this.getFormatHtmlOptions();
        var s = '';
        for(var i = 0; i < level; i++) {
            s += options.indent;
        }
        return s;
    }

    this.setIgnoreClicks = function(val) {
        ignore_clicks = val;
    }

    this.getIgnoreClicks = function() {
        return ignore_clicks;
    }

    this.getUniqueId = function(prefix) {
        return getUniqueId(prefix);
    }

    this.showNotice = function(msg, title, key, done) {
        showNotice(msg, title, key, done);
    }

    this.showAlert = function(msg, title, cancel, ok, onCancel, onOk) {
        return showAlert(msg, title, cancel, ok, onCancel, onOk);
    }


    this.showPrompt = function(notice, title, value, placeholder, onCancel, onOk) {
        showPrompt(notice, title, value, placeholder, onCancel, onOk);
    }

    this.showQuickMessage = function(msg, duration, single, context) {
        return crsaQuickMessage(msg, duration, single, context);
    }

    var showOrHideLeftPanel = function(show) {
        var $leftPlane = $('#crsa-left-plane');
        var shown = !$leftPlane.hasClass('closed');
        var $leftHider = $leftPlane.find('i.hider');
        if(show != shown) $leftHider.trigger('click');
    }

    this.showLeftPanel = function() {
        showOrHideLeftPanel(true);
    }

    this.hideLeftPanel = function() {
        showOrHideLeftPanel(false);
    }

    this.getSetting = function(key, def) {
        key = 'settings-' + key;
        if(key in window.localStorage) {
            return window.localStorage[key];
        }
        if(typeof def == 'undefined') def = null;
        return def;
    }

    this.setSetting = function(key, value) {
        key = 'settings-' + key;
        window.localStorage[key] = value;
    }

    this.openExternalUrl = function(url) {
        var gui = require('nw.gui');
        gui.Shell.openExternal(url);
    }

    this.addActionToElementForPreview = function(pgel, action_def, remove_other) {
        $.fn.crsa('addActionToElementForPreview', pgel, action_def, remove_other);
    }

    this.hasElementAction = function(pgel, action_def) {
        $.fn.crsa('hasElementAction', pgel, action_def);
    }

    this.showPreview = function($target, $content, cls, fixedX, code) {
        $.fn.crsa('showPreview', $target, $content, cls, fixedX, code);
    }

    this.hidePreview = function() {
        $.fn.crsa('hidePreview');
    }

    this.getValidationError = function(name, err) {
        switch(err) {
            case 'req':
                return name + ' is required.';
            default:
                return name + ' has invalid value';
        }
        return null;
    }

    this.validateField = function(selectedElement, fn, value, fdef, $field, values) {
        if(fdef && fdef.validate) {
            var err = fdef.validate(selectedElement, fn, value, fdef, $field, values);
            //setTimeout(function() {
                var $msg = $field.find('> p.error-message');
                if(err) {
                    //debugger;
                    if($msg.get(0).innerHTML != err) {
                        $msg.get(0).innerHTML = err;
                    }
                    if(!$msg.is(':visible')) {
                        $field.addClass('error');
                        $msg.show();
                    }
                    //$field.find('p.error-message').remove();

                } else {
                    if($msg.is(':visible')) {
                        $field.removeClass('error');
                        $msg.hide();
                    }
                    //$field.find('p.error-message').remove();
                }
            //}, 1);
        }
    }

    this.validateAllFields = function($div, selectedElement, values) {
        $div.find('.crsa-field').each(function(i, f) {
            var $field = $(f);
            var fn = $field.data('crsa-field');
            pinegrow.validateField(selectedElement, fn, values.hasOwnProperty(fn) ? values[fn] : null, $field.data('crsa-field-def'), $field, values);
        });
    }

    this.willMakeChange = function(page, $el, action) {
        willMakeChange(page.$iframe, $el ? (action + " / " + getElementName($el)) : action);
    }

    this.makeChanges = function(page, $el, action, func) {
        if(page.openedInEditor) this.willMakeChange(page, $el, action);
        func();
        if(page.openedInEditor) {
            didMakeChange(page.$iframe, $el);
            $.fn.crsa('updateIfNeeded');
        }
    }

    //PLUGIN CONTROLS

    var plugin_controls = [];

    this.addPluginControlToTopbar = function(f, $control, show_always) {
        var $c = $('#main-navbar .plugin-controls');
        $c.append($control);
        plugin_controls.push({framework: f, control: $control, show_always: show_always});
        if(!show_always) $control.hide();
    }

    this.updatePluginControlsForSelectedPage = function (cp) {
        showPluginControlsForSelectedPage(cp);
    }

    var showPluginControlsForSelectedPage = function(cp) {
        for(var i = 0; i < plugin_controls.length; i++) {
            if(plugin_controls[i].show_always) continue;
            if(!cp || !cp.hasFramework(plugin_controls[i].framework)) {
                plugin_controls[i].control.css('display', 'none');
            } else {
                plugin_controls[i].control.css('display', '');
            }
        }
    }

    $('body').on('crsa-page-selected crsa-frameworks-changed', function(e, crsaPage) {
        if(!crsaPage) crsaPage = pinegrow.getSelectedPage();
        showPluginControlsForSelectedPage(crsaPage);
    });

    //END PLUGIN CONTROLS





    this.showBuyProductScreen = function(p) {
        $.fn.crsa('showIntroScreen', p);
    }

    //Screenshots
    this.takePhotoOfPage = function (page, filename, done, img_width) {
        if (!page.$page) return;

        var gui = require('nw.gui');
        var win = gui.Window.get();

        var $page = page.$page;
        var $content = $page.find('>.content');

        var content_offset = $content.offset();

        var $menu = $page.find('.crsa-inline-menu').hide();
        var $overlay = $page.find('.crsa-hl-overlay').hide();

        var ui_zoom = window.screen.width / document.body.clientWidth;

        page.removeCrsaStyles();

        //wait for menu to close
        setTimeout(function() {

            var left = content_offset.left * ui_zoom;
            var top = content_offset.top * ui_zoom;
            var width = $content.width() * ui_zoom;
            var height = $content.height() * ui_zoom;

            var scale = 1.0;

            if(img_width && img_width < width) {
                scale = 1.0 * img_width / width;
            }

            win.capturePage(function(datauri){

                page.addCrsaStyles();

                var canvas = document.createElement('canvas');
                canvas.setAttribute('width',width);
                canvas.setAttribute('height',height);
                var ctx = canvas.getContext('2d');
                var img = new window.Image();
                img.addEventListener("load", function() {
                    ctx.drawImage(img, left, top, width, height, 0, 0, width,height);

                    var smallCanvas = scale < 1.0 ? downScaleCanvas(canvas, scale) : canvas;

                    if(filename) {
                        crsaCreateDirs(crsaGetDir(filename));
                        var image = smallCanvas.toDataURL('image/png');
                        image = image.replace('data:image/png;base64,', '');
                        var buffer = new Buffer(image, 'base64');
                        require('fs').writeFileSync(filename, buffer);
                    }

                    if(done) done(smallCanvas);
                    //resizeImage(big_file, parseInt(w/1), parseInt(h/1), big_file);
                    //var $d = $('<div style="position:fixed;top:0;left:0;z-index:10000;"></div>');
                    //$d.append(smallCanvas);
                    //$('body').append($d);

                }, false);
                img.src = datauri;

                //var big_file = f.getResourceFile('images/' + list[current].type + '.png');
                //fs.writeFileSync( big_file, buffer);



                $menu.show();

            }, { format : 'png', datatype : 'datauri'} );

        }, 100);
    }

    this.takePhotoOfElement = function($el, max_width, filename, done) {
        var gui = require('nw.gui');
        var win = gui.Window.get();

        var $iframe = getIframeOfElement($el);
        var $page = $iframe.closest('.page');

        pinegrow.scrollToElement($el);

        var pos = getElementPositionOnScreen($el, $iframe);

        var $menu = $page.find('.crsa-inline-menu').hide();
        var $overlay = $page.find('.crsa-hl-overlay').hide();

        var crsaPage = getCrsaPageForIframe($iframe);

        var ui_zoom = window.screen.width / document.body.clientWidth;
        //var ui_zoom = 1;

        crsaPage.removeCrsaStyles();

        //wait for menu to close
        setTimeout(function() {

            var left = pos.left * ui_zoom;
            var top = pos.top * ui_zoom;
            var width = pos.width * ui_zoom;
            var height = pos.height * ui_zoom;

            var scale = 1.0;
            if(max_width && width > max_width) scale = 1.0 * max_width / width;

            win.capturePage(function(datauri){

                crsaPage.addCrsaStyles();

                var canvas = document.createElement('canvas');
                canvas.setAttribute('width',width);
                canvas.setAttribute('height',height);
                var ctx = canvas.getContext('2d');
                var img = new window.Image();
                img.addEventListener("load", function() {
                    ctx.drawImage(img, left, top, width, height, 0, 0, width,height);

                    var smallCanvas = scale < 1.0 ? downScaleCanvas(canvas, scale) : canvas;

                    if(filename) {
                        var image = smallCanvas.toDataURL('image/png');
                        image = image.replace('data:image/png;base64,', '');
                        var buffer = new Buffer(image, 'base64');
                        require('fs').writeFileSync(filename, buffer);
                    }

                    if(done) done(smallCanvas);
                    //resizeImage(big_file, parseInt(w/1), parseInt(h/1), big_file);
                    //var $d = $('<div style="position:fixed;top:0;left:0;z-index:10000;"></div>');
                    //$d.append(smallCanvas);
                    //$('body').append($d);

                }, false);
                img.src = datauri;

                //var big_file = f.getResourceFile('images/' + list[current].type + '.png');
                //fs.writeFileSync( big_file, buffer);



                $menu.show();

            }, { format : 'png', datatype : 'datauri'} );

        }, 250);
    }
}

var PgFramework = function(key, name) {
    this.key = key;
    this.name = name;
    this.show_in_action_tab = "ACT";
    this.detect = null;
    this.component_types = {};
    this.default = false;
    this.lib_sections = [];
    this.actions_sections = [];
    this.ignore_css_files = [];
    this.type = key; //default
    this.allow_single_type = false;
    this.pluginUrl = null;
    this.on_get_source = null; //function crsaPage
    this.user_lib = false;
    this.changed = false;
    this.not_main_types = false;
    this.product = null;
    this.trial = false;
    this.trial_start_message = '7 day trial was started.';
    this.trial_expired_message = 'The trial expired. Please purchase the product to continue using it.';
    this.common_sections = {};
    this.script_url = null;
    this.description = null;
    this.author = null;
    this.author_link = null;
    this.has_actions = false;
    this.info_badge = null;
    this.auto_updatable = false;
    this.order = 0;

    this.show_in_manager = true;
    this.preview_images_base = 'images';

    this.resources = new PgResourcesList();

    var ordered_list = [];
    var ordered = false;
    var types_map = null;

    var _this = this;

    this.removeAllComponents = function() {
        this.component_types = {};
        this.lib_sections = [];
        this.actions_sections = [];
        ordered = false;
        ordered_list = [];
    }

    this.isTrialActive = function() {
        return pinegrow.isProductTrialActive(this.key, this.trial_start_message, this.trial_expired_message);
    }

    this.addComponentType = function(def) {
        if(def.selector && typeof def.selector == 'string') {
            if(def.selector.match(/^[a-z]+$/i)) {
                def.selector_tag = def.selector.toUpperCase();
            }
        }
        this.component_types[def.type] = def;
        if(!def.priority) def.priority = 1000;
        def.framework = this;

        if(this.common_sections) {
            if(!def.sections) {
                def.sections = {};
            }
            $.each(this.common_sections, function(key, sdef) {
                def.sections[key] = sdef;
            });
        }
        ordered_list.push(def);
        ordered = false;
    }

    this.removeComponentType = function(def) {
        if(def.type in this.component_types) {
            delete this.component_types[def.type];
            var idx = ordered_list.indexOf(def);
            if(idx >= 0) {
                ordered_list.splice(idx, 1);
            }
            ordered = false;

            for(var n = 0; n < this.lib_sections.length; n++) {
                var s = this.lib_sections[n];
                var idx = s.components.indexOf(def);
                if(idx >= 0) {
                    s.components.splice(idx, 1);
                }
            }
            for(var n = 0; n < this.actions_sections.length; n++) {
                var s = this.actions_sections[n];
                var idx = s.components.indexOf(def);
                if(idx >= 0) {
                    s.components.splice(idx, 1);
                }
            }

        }
    }

    this.replaceComponent = function(old_c, new_c) {
        this.component_types[old_c.type] = new_c;
        var idx = ordered_list.indexOf(old_c);
        if(idx >= 0) {
            ordered_list[idx] = new_c;
        }
        for(var n = 0; n < this.lib_sections.length; n++) {
            var s = this.lib_sections[n];
            var idx = s.components.indexOf(old_c);
            if(idx >= 0) {
                s.components[idx] = new_c;
            }
        }
        for(var n = 0; n < this.actions_sections.length; n++) {
            var s = this.actions_sections[n];
            var idx = s.components.indexOf(old_c);
            if(idx >= 0) {
                s.components[idx] = new_c;
            }
        }
        new_c.framework = this;
    }

    var isType = function(def, $el, pgel, skip_actions) {
        var isType = false;
        if(skip_actions && def.action) return false;
        if(typeof def.selector == 'function') {
            if($el) {
                isType = def.selector($el);
            }
        } else if(def.selector) {
            isType = $el ? $el.is(def.selector) : pgel.isSelector(def.selector);
        } else if(def.selector_tag) {
            isType = $el ? $el.get(0).tagName === def.selector_tag : pgel.tagName === def.selector_tag;
        }
        return isType;
    }

    this.isType = function(def, $el, pgel, skip_actions) {
        return isType(def, $el, pgel, skip_actions);
    }

    var orderTypesIfNeeded = function() {
        if(!ordered) {
            ordered_list.sort(function(a,b) {
                return a.priority - b.priority;
            });
            ordered = true;

            //return;

            var tags = 0;
            var selectors = 0;
            var funcs = 0;
            var match = 0;
            var no_sel = 0;

            var map = {
                tags: {},
                check_all: []
            };

            types_map = map;

            var re = /^([a-z0-9]*)?(\.[a-z0-9\-\_]*)?(\[[a-z\-]*\])?(\[[a-z\-]*="(.*)"\])?$/i;

            for(var i = 0; i < ordered_list.length; i++) {
                if(ordered_list[i].selector) {
                    var info = {index: i, def: ordered_list[i]};

                    if(typeof ordered_list[i].selector == 'function') {
                        map.check_all.push(info);
                        funcs++;
                    } else {

                        var m = ordered_list[i].selector.match(re);
                        if(m) {
                            var tag = m[1];
                            if(tag) {
                                if(!map.tags[tag]) map.tags[tag] = [];
                                map.tags[tag].push(info);
                            } else {
                                map.check_all.push(info);
                            }
                        } else {
                            map.check_all.push(info);
                        }
                        /*
                        var m = true;
                        var ss = ordered_list[i].selector.split(',');
                        var matches = [];
                        for(var n = 0; n < ss.length; n++) {
                            var match = ss[n].trim().match(re);
                            if(!match) {
                                m = false;
                                break;
                            } else {
                                matches.push(match);
                            }
                        }
                        if(m) {
                            match++;
                            var branch = map;
                            for(var n = 0; n < matches.length; n++) {
                                var parts = matches[n];
                                var tag = parts[1];
                                if(tag) {
                                    if(!map.tags[tag]) map.tags[tag] = [];
                                    branch = map.tags[tag];
                                } else {
                                    branch = map.no_tag;
                                }

                            }
                        } else {
                            console.log(ordered_list[i].selector);
                        }*/
                    }
                } else {
                    no_sel++;
                }
            }
            if(ordered_list.length) {
                //console.log(types_map);
                //console.log('Selector stats for ' + _this.key + ': match=' + match + ' no_sel=' + no_sel + ' tags=' + tags + ' sels=' + selectors + ' funcs=' + funcs + ' total=' + ordered_list.length);
            }
        }

    }

    this.getType = function($el, pgel, skip_actions) {
        orderTypesIfNeeded();

        var types = this.getTypes($el, pgel, skip_actions, true);
        for(var i = 0; i < types.length; i++) {
            if(!types[i].not_main_type) {
                return types[i];
            }
        }
        return null;
        /*
        return types.length ? types[0] : null;


        for(var i = 0; i < ordered_list.length; i++) {
            var def = ordered_list[i];
            if(def.not_main_type) continue;
            if(isType(def, $el, pgel, skip_actions)) return def;
        }
        return null;
        */
    }

    this.getTypes = function($el, pgel, skip_actions, single) {
        orderTypesIfNeeded();


        if(single === undefined) single = false;
        var r = [];
        var info_list = [];
        var tag = pgel ? pgel.tagName : $el[0].tagName.toLowerCase();
        if(tag && types_map.tags[tag]) {
            for(var i = 0; i < types_map.tags[tag].length; i++) {
                if(isType(types_map.tags[tag][i].def, $el, pgel, skip_actions)) {
                    info_list.push(types_map.tags[tag][i]);
                    if(single) break;
                }
            }
        }
        for(var i = 0; i < types_map.check_all.length; i++) {
            if(isType(types_map.check_all[i].def, $el, pgel, skip_actions)) {
                info_list.push(types_map.check_all[i]);
                if(single) break;
            }
        }
        info_list.sort(function(a,b) {
            return a.index - b.index;
        });
        for(var i = 0; i < info_list.length; i++) {
            r.push(info_list[i].def);
            if(info_list[i].def.last_type) break;
        }
        return r;


        var r = [];

        for(var i = 0; i < ordered_list.length; i++) {
            var def = ordered_list[i];
            if( isType(def, $el, pgel, skip_actions)) {
                r.push(def);
                if(def.last_type) break;
                //return def;
            }
        }
        return r;
    }

    this.getComponentTypes = function() {
        return this.component_types;
    }

    this.getComponentType = function(type) {
        return this.component_types[type] ? this.component_types[type] : null;
    }

    this.addLibSection = function(section) {
        this.lib_sections.push(section);
        section.framework = this;
    }

    this.getLibSections = function() {
        return this.lib_sections;
    }

    this.getLibSection = function(key) {
        for(var s in this.lib_sections) {
            if(this.lib_sections[s].key == key) return this.lib_sections[s];
        }
        return null;
    }

    this.addActionsSection = function(section) {
        this.actions_sections.push(section);
        section.framework = this;
    }

    this.getActionsSections = function() {
        return this.actions_sections;
    }

    this.getAutoId = function(prefix) {
        var c = 0;
        var t;
        do {
            c++;
            t = prefix + (c > 0 ? c : '');
        }
        while((t in this.component_types));

        return {count: c, type: t};
    }

    this.getFileName = function() {
        if(this.pluginUrl) {
            return getPageName(this.pluginUrl);
        } else {
            return this.name.replace(/\s/ig,'') + '.js';
        }
    }

    this.getImagePreviewBaseUrl = function() {
        return this.getBaseUrl() + '/' + this.preview_images_base + '/';
    }

    this.getBaseUrl = function() {
        if(this.project) return crsaMakeUrlFromFile(this.project.getDir());
        return crsaGetBaseForUrl(this.pluginUrl ? this.pluginUrl : this.script_url);
    }

    this.getResourceUrl = function(relative_path) {
        return this.getBaseUrl() + '/' + relative_path;
    }

    this.getResourceFile = function(relpath) {
        return crsaMakeFileFromUrl(this.getResourceUrl(relpath)) ;
    }

    this.setScriptFileByScriptTagId = function(id, def_value) {
        var script = $('#' + id);
        if(script.length) {
            this.script_url = script.get(0).src; //get url if script is included directly into edit.html
        } else if(def_value) {
            var path = require('path');
            this.script_url = crsaMakeUrlFromFile( path.join( process.cwd(), def_value ));
        }
    }

    this.addTemplateProjectFromResourceFolder = function(folder, done, index, filter_func) {
        var path = require('path');
        var base_url = this.getBaseUrl();
        if(!base_url) return;
        var full_path = path.join(crsaMakeFileFromUrl(base_url), folder);
        pinegrow.addTemplateProjectFromFolder(full_path, function(p) {
            p.name = _this.name;
            p.description = _this.description;
            p.author = _this.author;
            p.author_link = _this.author_link;
            p.info_badge = _this.info_badge || null;
            p.framework = _this;

            p.root.walkThroughFiles(function(node) {
                if(node.name == 'screenshots') {
                    return false;
                } else if(node.name.indexOf('.html') >= 0) {
                    node.tag = 'page';
                    node.image = p.root.url + '/screenshots' + '/' + node.name.replace('html', 'jpg');
                } else {
                    node.required = true;
                }
                if(filter_func) return filter_func(node, p);
            })

            if(done) {
                done(p);
            }
        }, index);
    }

    this.save = function(url, done) {
        if(url != this.pluginUrl) {
            this.name = getPageName(url).replace(/\.js$/i,'');
            this.key = this.name;
        }
        var s = '';
        var comp_list = [];

        $.each(this.component_types, function(i, def) {
            var type = def.type;
            var vn = "comp_" + type.replace(/-/g,'_');
            s += def.toJSCode(vn);
            comp_list.push(vn);
        });

        var source = '\
$(function() {\n\
\n\
    //Wait for Pinegrow to wake-up\n\
    $("body").one("pinegrow-ready", function(e, pinegrow) {\n\
\n\
        //Create new Pinegrow framework object\n\
        var f = new PgFramework("' + this.key + '", "' + this.name + '");\n\
\n\
        //This will prevent activating multiple versions of this framework being loaded\n\
        f.type = "' + this.key + '";\n\
        f.allow_single_type = true;\n\
        f.user_lib = ' + (this.user_lib ? 'true' : 'false') + '\
\n\
' + s + '\n\
        //Tell Pinegrow about the framework\n\
        pinegrow.addFramework(f);\n\
            \n\
        var section = new PgFrameworkLibSection("' + this.key + '_lib", "Components");\n\
        //Pass components in array\n\
        section.setComponentTypes([' + comp_list.join(', ') + ']);\n\
\n\
        f.addLibSection(section);\n\
   });\n\
});';

        try {
            var file = crsaMakeFileFromUrl(url);
            var fs = require('fs');
            crsaWriteFileWithBackup(fs, file, source, "utf8");
            this.pluginUrl = url;
            pinegrow.saveFrameworksList();
            this.changed = false;
        }
        catch(err) {
            showAlert("File " + url + " could not be saved. " + err, "Error");
        }

        if(done) done();
    }

    this.getActionTypes = function($el, pgel) {
        return this.getTypes($el, pgel);
    }

    this.getActionTag = function($el) {
        var types = this.getActionTypes($el);
        if(types.length) {
            var at = '';
            for(var i = 0;i < types.length; i++) {
                var t;
                if(types[i].get_action_tag) {
                    t = types[i].get_action_tag($el, types[i]);
                } else {
                    t = (types[i].short_name || types[i].name);
                }
                at += (at.length ? ', ' : '') + t;
            }
            return at;
        }
        return null;
    }


    this.textForExample = function(what) {
        return 'for example, ' + what;
    }

    this.textDefaultValue = function(what) {
        return 'default, ' + what;
    }

    this.textUse = function(what) {
        return 'use ' + what;
    }

    this.fieldIsRequired = function(obj, prop, value, fieldDef, $field, values) {
        if(!value) {
            return pinegrow.getValidationError(fieldDef.name, 'req');
        }
        return null;
    }

    //CSS helpers
    this.setCSSProperty = function(page, css_url, selector, prop, value) {

    }


    this.requireSelectedElement = function(callback) {
        var cp = pinegrow.getSelectedPage();
        if(!cp) {
            pinegrow.showQuickMessage('A page must be open for this to work.');
        } else {
            var el = pinegrow.getSelectedElement();
            if(!el) {
                pinegrow.showQuickMessage('An element must be selected.');
            } else {
                var $el = el.data;
                var pgel = new pgQuery($el);
                callback(cp, $el, pgel);
            }
        }
    }


    this.on_element_inserted = function(page, pgel, $el, def) {

        if(def.framework && def.framework == this) {
            //that's us
            if(def.framework.resources.has()) {
                var res_namespace = page.getResourceNamespaceForFramework(def.framework);

                //skip this if framework is source framework for this project: TODO

                if(res_namespace) {
                    var fs = require('fs');

                    var $html = page.get$Html();
                    //we should map urls
                    var attrs = ['src', 'data-src', 'href', 'action'];
                    for(var i = 0; i < attrs.length; i++) {
                        var attr = attrs[i];
                        var list = pgel.findIncludingSelf('[' + attr + ']');
                        for(var j = 0; j < list.length; j++) {
                            var el = list[j];
                            var url = el.getAttr(attr);
                            if(url && !crsaIsAbsoluteUrl(url)) {

                                url = res_namespace + url;
                                var file = crsaMakeFileFromUrl( page.makeAbsoluteUrl(url) );
                                if(crsaIsFileOrDir(file, fs) == 'file') {
                                    //resource file exists at new location, lets update url
                                    el.setAttr(attr, url);
                                    var $domel = el.get$DOMElement($html);
                                    if($domel) {
                                        $domel.attr(attr, url);
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    this.addResourcesToPage = function(page, done, overwrite_existing, same_project) {
        var path = require('path');
        var wasChanged = function() {
            var $head = page.get$Html().find('head');
            pinegrow.setNeedsUpdate($head, true);
        }

        var project = pinegrow.getCurrentProject();

        var resource_folder = null;
        var changed = false;
        if(project && project.isFileInProject(page.localFile)) {
            resource_folder = project.getDir();
        } else if(page.localFile) {
            resource_folder = path.dirname( page.localFile );
        }

        if(resource_folder) {

            var res_namespace = this.getResourceNamespacePath();
            if(same_project) {
                //
            } else {
                resource_folder = path.join(resource_folder, res_namespace);
            }
            //page.setResourceNamespaceForFramework(this, res_namespace);

            this.resources.copyFilesToFolder( resource_folder, function( errors ) {
                if(_this.resources.addToPage(page, resource_folder)) {
                    //changed
                    wasChanged();
                    changed = true;
                    if(done) done();
                }
            }, overwrite_existing /* dont overwrite existing */)
        } else {
            if(_this.resources.addToPage(page)) {
                //changed
                wasChanged();
                changed = true;
                if(done) done();
            }
        }
        if (!changed)
            pinegrow.refreshAllPages();
    }

    this.addResourcesToProject = function(project, done, overwrite_existing, same_project) {
        var path = require('path');

        var wasChanged = function() {
            var $head = page.get$Html().find('head');
            pinegrow.setNeedsUpdate($head, true);
        }

        var resource_folder = project.getDir();

        var res_namespace = this.getResourceNamespacePath();

        if(same_project) {
            resource_folder += path.sep;
        } else {
            resource_folder = resource_folder + path.sep + res_namespace;
        }

        /*var project_info = project.getProjectInfo();
        var resources = project_info.getSetting('resources') || {};
        resources[this.type] = res_namespace;
        project_info.setSetting('resources', resources);
        project_info.save();*/

        this.resources.copyFilesToFolder( resource_folder, function( errors ) {
            //add to pages

            project.forEachEditableFile( function( page, pageDone, status ) {
                //on page
                if(_this.resources.addToPage(page, resource_folder)) {
                    status.changed = true;
                }
                pageDone(page, status);

            }, function() {
                //on done
                if(done) done();
            }, 'Updating resources...')

        }, overwrite_existing);
    }

    this.getResourceNamespace = function() {
        return 'components/' + (this.type || this.key) + '/';
    }

    this.getResourceNamespacePath = function() {
        return this.getResourceNamespace().replace(/\//g, require('path').sep);
    }

}

var PgFrameworkLibSection = function(key, name) {
    this.key = key;
    this.name = name;
    this.components = [];
    this.framework = null;

    this.addComponentType = function(pgComponentType) {
        this.components.push(pgComponentType);
    }

    this.setComponentTypes = function(list) {
        this.components = list;
    }

    this.getComponentTypes = function() {
        return this.components;
    }
}

var PgComponentTypeResource = function(url, code) {
    this.type = pinegrow.getMimeType(url);
    this.url = url;
    this.code = code;
    this.footer = false;
    this.project = null;
    this.isFolder = false;
    this.source = null;
    this.relative_url = null;

    this.isEqual = function(r) {
        return this.url == r.url || (this.code && this.code == r.code);
    }

    this.addToPage = function(crsaPage, folder) {
        var url = this.url;

        if(this.relative_url && !crsaIsAbsoluteUrl(this.relative_url) && this.relative_url && folder) {
            url = crsaMakeUrlFromFile( require('path').join(folder, this.relative_url));
        }

        if(this.type == 'text/css') {
            return crsaPage.addStylesheet(url, false);
        } else if(this.type == 'application/javascript') {
            return crsaPage.addScript(url, this.footer);
        } else if(this.isFolder) {

        }
        return false; //not changed
    }

    this.copyFilesToPage = function(crsaPage, done) {
        this.copyFilesToFolder( require('path').dirname( crsaPage.localFile ), done);
    }

    this.copyFilesToProject = function(project, done) {
        this.copyFilesToFolder(project.getDir(), done);
    }

    this.copyFilesToFolder = function(folder, done, overwrite_existing) {
        //copy to project
        var path = require('path');

        var relative_to_source_project = crsaMakeFileFromUrl(this.relative_url);
        if (crsaIsAbsoluteUrl(this.relative_url || this.url)) {
            if (done) done();
            return;
        }

        var source_path = crsaMakeFileFromUrl(this.url);
        var dest_path = path.join(folder, relative_to_source_project);

        console.log('RESOURCES - COPY ' + source_path + ' -> ' + dest_path);

        if(source_path == dest_path) {
            if(done) done();
            return;
        }

        this.copy(dest_path, done, overwrite_existing);
    }

    /*
    this.existsInFolder = ===function(folder) {
        //copy to project
        var path = require('path');

        var relative_to_source_project = crsaMakeFileFromUrl(this.relative_url);
        if (crsaIsAbsoluteUrl(this.relative_url || this.url)) {
            return true;
        }

        var source_path = crsaMakeFileFromUrl(this.url);
        var dest_path = path.join(folder, relative_to_source_project);


        this.copy(dest_path, done, overwrite_existing);
    }

*/

    this.copy = function(dest, done, overwrite_existing, file_writter) {
        var path = require('path');
        var fs = require('fs');

        try {
            crsaCreateDirs(path.dirname(dest), fs);

            var type = crsaIsFileOrDir(crsaMakeFileFromUrl(this.source), fs);

            if(type == 'dir') {
                crsaCopyFolder(crsaMakeFileFromUrl(this.source), dest, function(errors) {
                    if(done) done(errors);
                }, true /* quick, overwrite newer */ )
            } else if(type == 'file') {
                //console.log("RES " + this.source + ' -> ' + dest);

                var dest_exists = false;
                try {
                    var stat_dest = fs.statSync(dest);
                    var stat_source = fs.statSync(crsaMakeFileFromUrl(this.source));
                    //exists
                    dest_exists = (stat_source.isFile() && stat_dest.mtime >= stat_source.mtime);
                } catch(err) {
                    dest_exists = false;
                }

                if(!dest_exists || overwrite_existing) {
                    if(file_writter) {
                        file_writter.copyFile(dest, crsaMakeFileFromUrl(this.source));
                    } else {
                        crsaCopyFileSync(fs, crsaMakeFileFromUrl(this.source), dest);
                    }
                } else {
                    //console.log('SKIP ' + dest);
                }

                if(done) done();
            } else {
                if(done) done(crsaMakeFileFromUrl(this.source) + ' does not exist.');
            }
        } catch(err) {
            console.log('COPY ERROR ' + err);
            if(done) done(err);
        }
    }
}

var PgResourcesList = function() {

    this.list = [];
    var _this = this;

    var description = null;

    this.clear = function () {
        this.list = [];
    }

    this.has = function() {
        return this.list.length > 0;
    }

    this.add = function(r) {
        for(var i = 0; i < this.list.length; i++) {
            if(this.list[i].isEqual(r)) return;
        }
        this.list.push(r);
    }

    /*
    @crsaPage: page to add to
    @folder: location of resource, either project dir or file dir
     */
    this.addToPage = function(crsaPage, folder, done) {
        var changed = false;
        for(var i = 0; i < this.list.length; i++) {
            changed = this.list[i].addToPage(crsaPage, folder) || changed;
        }
        if(done) done(crsaPage, this);
        return changed;
    }

    this.copyFilesToFolder = function(folder, done, overwrite_existing) {
        var idx = 0;

        var copyItem = function() {
            if(idx == _this.list.length) {
                if(done) done();
            } else {
                _this.list[idx].copyFilesToFolder(folder, function(errors) {
                    idx++;
                    copyItem();
                }, overwrite_existing);
            }
        }

        copyItem();
    }

}

var PgComponentType = function(type, name) {
    this.type = type;
    this.name = name;
    this.short_name = name;
    this.selector = null;
    this.code = null;
    this.preview = null;
    this.sections = null;
    this.priority = 1000;
    this.attribute = null; //for actions
    this.attribute_default = null;
    this.parameter_attributes = []; //array of {name, default}
    this.parent_selector = null;
    this.inherit_from = null;
    this.empty_placeholder = null;
    this.display_name = null;
    this.live_update = true;
    this.framework = null;
    this.set_value = null;//set_value(obj, value, values, oldValue, eventType);
    this.resources = [];

    this.toJSCode = function(vn) {
        var escapeCode = function(code) {
            code = html_beautify(code);
            code = code.replace(/\r\n|\r|\n/g, '\\\n');
            return code.replace(/'/g,'\\\'');
        }

        var c = '\n\
        var ' + vn + ' = new PgComponentType(\'' + this.type + '\', \'' + escapeCode(this.name) + '\');\n\
        ' + vn + '.code = \'' + escapeCode(this.code) + '\';\n\
        ' + vn + '.parent_selector = ' + (this.parent_selector ? '\'' + this.parent_selector + '\'' : 'null') + ';\n\
        f.addComponentType(' + vn + ');\n\
        ';
        return c;
    }

    this.addResource = function(res) {
        if(this.resources.indexOf(res) < 0) this.resources.push(res);
    }

    this.addResources = function(res_list) {
        for(var i = 0; i < res_list.length; i++) {
            this.addResource(res_list[i]);
        }
    }



    this.addRequireCSS = function(res) {
        if(this.require_css.indexOf(res) < 0) this.require_css.push(res);
    }

    this.getActionParameters = function() {
        var r = [];
        $.each(this.sections, function(skey, sdef) {
            if(sdef.fields) {
                $.each(sdef.fields, function(fkey, fdef) {
                    if(fdef.attribute) {
                        r.push({name: fdef.attribute, 'default': fdef.default ? fdef.default : null});
                    }
                });
            }
        });
        return r;
    }

}

var PgPropertiesSection = function(key, name) {
    this.key = key;
    this.name = name;
    this.fields = {};

    this.addProperty = function(pgProp, key) {
        if(!key) key = pgProp.key;
        this.fields[pgProp.key] = pgProp;
    }
}

var PgProperty = function(key, name) {
    this.name = name;
    this.key = key;
    this.type = null;
    this.action = null;
    this.get_value = null;
    this.set_value = null;
    this.value = null;
    this.show_empty = null;
    this.attribute = null;
    this.options = null;
}

var PgComponent = function(name, done) {

    this.html = null;
    this.error = null;
    this.url = null;

    var _this = this;

    this.url = "components/" + name + '.html';

    if(isApp()) {
        var fs = require('fs');
        try {
            this.html = fs.readFileSync(crsaMakeFileFromUrl(this.url), {encoding: "utf8"});
            if(done) done(this);
        }
        catch(err) {
            this.error = err;
            if(done) done(this);
        }
    } else {
        $.ajax({
            url: this.url,
            data: null,
            dataType: 'text'
        })
            .done(function(data) {
                _this.html = data;
                if(done) done(_this);
            })
            .fail(function(a) {
                _this.error = a;
                if(done) done(_this);
            });
    }
}

var PgStats = function() {

    var events = [];
    var usage = {};
    var has_usage = false;

    var test = true;
    var _this = this;

    var install_id = crsaStorage.getValue('install_id');

    if(!install_id) {
        install_id = 'id' + new Date().getTime() + Math.round(Math.random() * 100000);
        crsaStorage.setValue('install_id', install_id);
    }

    setInterval(function() {
        _this.send();
    }, 1000*60*10);

    var version = crsaGetVersion();

    var app_run = parseInt(localStorage.app_run || "0");

    var fillUserData = function(e) {
        e.trialEmail = crsaStorage.getValue('userEmail');
        e.userEmail = crsaStorage.getValue('activatedUserEmail');
        e.serial = crsaStorage.getValue('activatedSerial');
        e.version = version;
        e.product = crsaStorage.getValue('activatedProduct');
        e.appRun = app_run;
        e.installId = install_id;
    }

    this.event = function(event, data, force) {
        var disable_stats = pinegrow && pinegrow.getSetting('disable-stats', '0') == '1';

        if(disable_stats && !force) return;

        var e = {};

        e.event = event;
        e.data = data || '';
        e.time = parseInt(new Date().getTime()/1000);
        fillUserData(e);

        events.push(e);

        if(test) this.send();
    }

    this.using = function(what) {
        if(!(what in usage)) {
            usage[what] = 0;
        }
        usage[what]++;
        has_usage = true;
    }

    var in_progress = false;

    this.send = function(done) {

        var disable_stats = pinegrow && pinegrow.getSetting('disable-stats', '0') == '1';

        //debugger;
        if(in_progress) {
            if(done) done();
            return;
        }

        if(events.length == 0 && (!has_usage || disable_stats)) {
            if(done) done();
            return;
        }

        var salt = 'jhuyuy575rhgty';

        var d = {};
        fillUserData(d);

        d.events = events;

        if(!disable_stats) {
            d.usage = usage;
        }

        var str = JSON.stringify(d);
        str = window.btoa(str);

        var url = 'http://shop.pinegrow.com/PinegrowEvents/event.php';

        //url = 'http://pinegrow/PinegrowEvents/event.php';

        in_progress = true;

        //console.log('sending stats...' + str);

        $.ajax({
            url: url,
            data: {str: str, id: md5(str + salt)},
            dataType: 'text',
            method: 'POST'
        }).done(function(data) {
            events = [];
            usage = {};
            has_usage = false;
            in_progress = false;

            //console.log('Got reply: ' + data);

            try {
                data = JSON.parse(data);
                if(data.msg_title) {
                    var delay = data.msg_delay || 10000;
                    setTimeout(function() {
                        pinegrow.showAlert(data.msg_text || '', data.msg_title);
                    }, delay);

                }
            } catch(err) {}

        }).fail(function(a, b, c) {
            in_progress = false;
        });

        setTimeout(function() {
            if(done) done();
        }, 1000);
    }
}
