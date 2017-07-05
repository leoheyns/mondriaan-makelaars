var gen_id_count = 1;

window.requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame ||
    window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;

window.cancelAnimationFrame = window.cancelAnimationFrame || window.mozCancelAnimationFrame ||
    window.webkitCancelAnimationFrame || window.msCancelAnimationFrame;

console.log(process.version);

(function( $ ) {

    $.fn.crsa = function( method ) {

        //var opts = $.extend( {}, $.fn.hilight.defaults, options );
        if ( methods[method] ) {
            return methods[method].apply( this, Array.prototype.slice.call( arguments, 1 ));
        } else if ( typeof method === 'object' || ! method ) {
            return methods.init.apply( this, arguments );
        } else {
            $.error( 'Method ' +  method + ' does not exist on jQuery.crsa' );
        }
    };

    var options;
    var editor = null;
    var editorElement = null;
    var codeEditor = null;
    var activeIFrame = null;
    var draggedFactoryElement = null;
    var selectedPage = null;
    var selectedCrsaPage = null;
    var needsUpdate = false;
    var needsUpdateElement = null;
    var selectElementOnUpdate = null;
    var canvas = null;
    var inlineMenu = null;
    var elementUnderMouse = null;
    var elementUnderMouseData = null;
    var draggedOverInvalidParent = false;
    var draggedPlaceholderElement = null;
    var selectedElement = null;
    var $rule_edit = null;
    var max_tree_level = 0;
    var updateTimer = null;
    var treeFilter = '';
    var skip_tree_scroll = false;
    var currentTreeRoot = null;

    var mainWindowManager = null;

    var app_start_time = new Date().getTime();

    window.pg_is_beta = false;

    var is_windows = false;
    window.is_mac = false;

    var limit_trial_extension_if_version_eq_or_lg_than = "3.0";

    var emptyVal = '__EMPTY__';

    var rules = [];
    var less_parser  = new(less.Parser);
    var less_variables = '';

    var code_mode = 'html';
    var code_ignore_change = false;
    var selected_cs = null;

    var editor = new CrsaEditor();
    var pageTabs;

    var trial_no_save = true; //will be enabled after exit trial intro

    var classManager = null;
    var preview = false;
    var previewView = null;
    var $body = $('body');

    var crsaTree;
    var crsaProjectBrowser = null;

    var crsaTemplateProjects = [];
    var crsaTemplateBrowser = null;
    var selectedCrsaProjectTemplate = null;
    var highlightedElements = null;
    var customLogic = null;

    var currentFactoryLibSections = null;
    var recentFiles = null;
    var clipboardPanel = null;

    var httpServer;

    var isMacApp = false;
    var homeDir = null;
    var dataDir = null;
    var comFileTimer = null;

    var inputFieldId = 0;

    var last_previewed_def = null;

    var setLastPreviewedDef = function(def) {
        last_previewed_def = def;
        //console.log('setLastPreviewedDef', def);
    }

    var methods = {
        init : function( opts ) {
            //var evt=document.createEvent("CustomEvent");
            //evt.initCustomEvent("koli", true, true, "kkkkk");
            //document.dispatchEvent(evt);

            //test
            //console.log(html_beautify('<input type="radio "" = " " "  name="1-9b " id="1-9-4b " value="4">'));
            var gui;
            if(isApp()) {
                console.log("Running as standalone app on " + navigator.platform);

                gui = require('nw.gui');

                process.on('uncaughtException', function (err) {
                    if(err instanceof PgEditException) {
                        var a = pinegrow.showAlert(err.msg, err.reason);
                        //debugger;
                        if(err.on_display) err.on_display(a);
                    } else {
                        console.log('node exception ' + err);
                    }
                });

                dataDir = gui.App.dataPath;
                $.each(gui.App.argv, function(i, arg) {
                    if(arg.indexOf('--pg-home-dir') >= 0) {
                        homeDir = arg.replace('--pg-home-dir=', '');
                        isMacApp = true;
                        console.log('Nice, I\'m a Mac App!');
                    }
                });

            } else {
                console.log("Running as web app...");
            }

            if(navigator.platform.indexOf('Win') >= 0) {
                is_windows = true;
            }
            if(navigator.platform.indexOf('Mac') >= 0) {
                is_mac = true;
            }

            options = $.extend( {}, $.fn.crsa.defaults, opts );

            if(options.custom_logic) {
                customLogic = options.custom_logic;
            } else {
                customLogic = new PgCustomLogic();
            }

            if(options.templates) {
                $.each(options.templates, function(i,t) {
                    var p = new CrsaProject();
                    p.fromSimpleTemplate(t);
                    crsaTemplateProjects.push(p);
                });
            }
            //sort defs by priority
            var tmp = [];
            $.each($.fn.crsa.defaults.types, function(t, v) {
                tmp.push(v);
            });
            tmp.sort(function(a,b) {
                if(a.priority == b.priority) return 0;
                if(a.priority < b.priority) return -1;
                return 1;
            });
            $.fn.crsa.defaults.types = {};
            $.each(tmp, function(i, v) {
                $.fn.crsa.defaults.types[v.type] = v;
            });

            createUI();


            $trial = $('#crsa-topbar .trial');
            if(isApp()) {
                //if(crsaIsBig())
                $trial.hide();
            } else {
                $trial.html('<span>You\'re playing in the online playground.</span> <a href="#">Download Mac / Windows app for more.</a>');
            }
            $trial.find('a').on('click', function(e) {
                if(isApp()) {
                    //showBuyScreen();
                    showIntroScreen();
                } else {
                    showDownloadsScreen();
                }
                e.preventDefault();

            });
            window.pinegrow = new Pinegrow();

            pinegrow.getActivatedProducts = function() {
                var p = crsaStorage.getValue('activatedProduct');
                var r = [];
                if(p) {
                    r.push('PG');
                    if(p.indexOf('PGWP') == 0) {
                        r.push('WP');
                    }
                    if(p.indexOf('PRO') >= 0) {
                        r.push('PRO');
                    }
                }
                return r;
            }

            pinegrow.hasActivatedProduct = function(p) {
                return this.getActivatedProducts().indexOf(p) >= 0;
            }

            pinegrow.getProductName = function(p) {
                if(!p) {
                    p = crsaStorage.getValue('activatedProduct');
                }
                switch(p) {
                    case 'PG_PERSONAL':
                        return 'Standard Personal';
                    case 'PG_COMPANY':
                        return 'Standard Company';
                    case 'PG_STUDENT':
                        return 'Standard Student';
                    case 'PGPRO_PERSONAL':
                        return 'PRO Personal';
                    case 'PGPRO_COMPANY':
                        return 'PRO Company';
                    case 'PGPRO_STUDENT':
                        return 'PRO Student';
                    case 'PGWP_PERSONAL':
                        return 'Standard WordPress Personal';
                    case 'PGWP_COMPANY':
                        return 'Standard WordPress Company';
                    case 'PGWP_STUDENT':
                        return 'Standard WordPress Student';
                    case 'PGWPPRO_PERSONAL':
                        return 'PRO WordPress Personal';
                    case 'PGWPPRO_COMPANY':
                        return 'PRO WordPress Company';
                    case 'PGWPPRO_STUDENT':
                        return 'PRO WordPress Student';
                    case 'PGPRO_CMSUSER':
                        return 'PRO Content Contributor';
                }
                return 'Unknown';
            }

            pinegrow.isProductTrialActive = function(product, trial_start_message, trial_expired_message, no_message) {
                if(pinegrow.hasActivatedProduct(product)) return false;
                var max_trial = 7*24*3600*1000;
                var trial_key = product + '_' + crsaGetVersion() + '_trial_start_date';
                //var trial_key = this.key + '_trial_start_date';
                var trial_start_date = crsaStorage.getValue(trial_key);
                if(!trial_start_date) {
                    //let's start trial
                    trial_start_date = (new Date()).getTime();
                    crsaStorage.setValue(trial_key, trial_start_date);
                    //alert(trial_start_message);
                    if(!no_message) {
                        pinegrow.showAlert(trial_start_message, product + ' trial started');
                    }
                }

                var days_test = 0;

                if(((new Date()).getTime() + days_test*(max_trial + 1)) - trial_start_date > max_trial) {
                    var exp_notice_shown_key = trial_key + '_exp_notice_shown';
                    if(!crsaStorage.getValue(exp_notice_shown_key)) {
                        crsaStorage.setValue(exp_notice_shown_key, true);
                        pinegrow.showAlert(trial_expired_message, product + ' trial ended', 'Close', 'Upgrade', null, function() {
                            if(product) {
                                pinegrow.showBuyProductScreen(product);
                            }
                        });
                    }
                    return false;
                }
                return true;
            }

            pinegrow.isProTrialActive = function() {
                return pinegrow.isProductTrialActive('PRO', 'The 7 day trial of PRO features (projects, master pages and components) started!', 'The trial of PRO features just ended. Please upgrade to the PRO edition to continue using projects, master pages and components.', true);
            }

            pinegrow.isPRO = function() {
                return pinegrow.hasActivatedProduct('PRO');
            }

            if(pinegrow.isContributorMode()) {
                $('#crsa-left-plane > .nav-tabs li:nth-child(3)').hide();
                $('#tab4').hide();

                $('#crsa-left-plane > .nav-tabs li:nth-child(4)').hide();
                $('#tab5').hide();

                $('#crsa-left-plane > .nav-tabs li:nth-child(5)').hide();
                $('#tab2').hide();
            }


            pinegrow.pro_info_url = ' http://docs.pinegrow.com/misc/pinegrow-pro';
            pinegrow.pro_upgrade_url = 'http://pinegrow.com/upgrade-to-wp.html';

            codeEditor = new CrsaCodeEdit();
            codeEditor.setFontSize( pinegrow.getSetting('code-size', '12px'), pinegrow.getSetting('code-font', '') );
            pinegrow.codeEditor = codeEditor;

            clipboardPanel = new CrsaPanel($('#crsa-clipboard-panel'), false);
            new PgClipboardView($('#crsa-clipboard-panel .panel-content'));
            clipboardPanel.hide();

            clipboardPanel.onHide = function() {
	            highlightUIElement($('.menu-clipboard'));
	            pinegrow.showNotice('<p>Click on the <i style="color:black;" class="fa fa-fw fa-clipboard"></i> icon in the top menu bar to show Clipboard again.</p>', 'Show clipboard', 'show-clipboard');
            }

            recentFiles = new pgRecentFiles();
            pinegrow.recentFiles = recentFiles;

            //var powerBar = new PgPowerBar($('body'));

            if(isApp()) {
                try {

                    httpServer = new CrsaHttpServer(function(status, msg, server) {
                        console.log('Internal server status: ' + status);
                        if(status != 'OK') {
                            pinegrow.showAlert('<p>Ups... we have a problem! <b>Pinegrow was unable to start its internal webserver</b>. The server is <b>required</b> for Pinegrow to function correctly.</p><p>This is just a small technical issue. Let\'s fix it so that you can enjoy Pinegrow! Details and suggested solutions:</p>' + msg + '<p>If this doesn\'t help please check the <a class="external" href="http://docs.pinegrow.com/misc/troubleshooting">troubleshooting docs</a> or <a class="external" href="http://pinegrow.com/#about">contact support</a>.</p>', 'Pinegrow can\'t function without its internal webserver');
                        } else {
                            //Start api server
                            pinegrow.apiServer = new PgApiServer(server.port + 1);
                            pinegrow.dispatchEvent('on_api_server_created', pinegrow.apiServer);
                        }
                    });
                    pinegrow.httpServer = httpServer;
                    console.log('Internal http server running on ' + httpServer.url);
                } catch(err) {
                    console.log('Could not start internal http server: ' + err);
                }
            }

            $('body').trigger('pinegrow-ready', pinegrow);

            if(isApp()) {
                pinegrow.loadAllFrameworksFromFile();
            }


            crsaAddKbd($('.menu-file-save'), 'CMD S');
            crsaAddKbd($('.menu-file-save-as'), 'SHIFT CMD S');

            if(!is_windows) {
                crsaAddKbd($('.menu-file-save-all'), 'ALT CMD S');
            }
            //crsaAddKbd($('.menu-file-close'), 'CMD X');
            //crsaAddKbd($('.menu-file-save-project'), 'CMD R');

            if(!isApp()) {
                //$('.menu-file-open-file').remove();
                //$('.menu-file-open-url').remove();
                $('.menu-file-save').remove();
                $('.menu-file-save-html').remove();
                $('.menu-file-save-as').remove();
                $('.menu-file-save-all').remove();
                $('.menu-file-cache').remove();
                $('.menu-save-divider').remove();
                $('.menu-file-new-window').remove();
                $('.menu-dev-tools').remove();

                window.onbeforeunload = function (e) {
                    return crsaHasChanges() ? 'Some of the pages and stylesheets are changed. Changes will be lost if you leave this page.' : null;
                };

            } else {
                $('.menu-project-divider').remove();
                $('.menu-file-save-project').remove();
                $('.menu-file-load-project').remove();
                $('.menu-file-download').remove();

                if(!crsaIsBig() || pinegrow.isContributorMode()) {
                    $('.menu-dev-tools').remove();
                    $('.menu-file-manage-ss').remove();
                }
                if(!crsaIsBig()) {
                    var giftTrialBox = new PgTrialUpgradeBox($('.news-button-container'));
                }


                var uiLayoutControl = new PgUILayoutControlBox($('.news-button-container'), function() {
                    showSettingsScreen();
                });

                if(!pinegrow.isContributorMode()) {
                    var newsBox = new PgNewsBox($('.news-button-container'));
                    $('.remove-in-not-cm').remove();
                } else {
                    $('.remove-in-cm').remove();
                }

                var checkVersion = function() {
                    crsaCheckForNewVersion(function(info) {
                        if(info) {
                            var $v = $('.version-info').html('');
                            $v.append('<h4>An update is available for download</h4>');
                            $v.append('<p>' + info.desc + '</p>');
                            $v.append('<a href="' + info.url + '">Learn more &amp; download</a>');

                            $v.find('a').on('click', function(e) {
                                e.preventDefault();
                                var gui = require('nw.gui');
                                var url = $(e.delegateTarget).attr('href');
                                gui.Shell.openExternal(url);
                            });

                            $v = $('#crsa-topbar .trial li');
                            var $a = $('<a href="http://pinegrow.com" data-toggle="tooltip" data-placement="bottom" title="' + info.desc + '" target="_blank">Update is available for download</a>');

                            $v.html('');
                            $v.append($a);
                            $v.parent().show();
                            $a.tooltip();

                            $a.on('click', function(e) {
                                e.preventDefault();
                                var gui = require('nw.gui');
                                var url = $(e.delegateTarget).attr('href');
                                gui.Shell.openExternal(url);
                            });
                        }
                    }, /* on_data */ function(data) {
                        //update articles
                        //debugger;
                        if(newsBox) {
                            newsBox.setData(data.news || null);
                        }
                    });
                }
                checkVersion();

                setInterval(function() {
                    checkVersion();
                }, 1000*60*60); //check once per hour

                if(process.platform == 'darwin') {
                    var gui = require('nw.gui');
                    var mb = new gui.Menu({type:"menubar"});
                    mb.createMacBuiltin("Pinegrow");

                    var zoom = new gui.MenuItem({ label: 'Zoom' });
                    zoom.click = function() {
                        gui.Window.get().maximize();
                    }
                    mb.items[2].submenu.insert(zoom, 1);

                    mb.items[1].submenu.removeAt(0);
                    mb.items[1].submenu.removeAt(0);
                    mb.items[1].submenu.removeAt(0);

                    gui.Window.get().menu = mb;
                }

                //$('.menu-file-download').remove();
                //$('.menu-file-save-project').remove();
                //$('.menu-file-load-project').remove();

                /*
                 var gui = require('nw.gui');
                 var menu = new gui.Menu({ type: 'menubar' });

                 var fileMenu = new gui.Menu();

                 fileMenu.append(new gui.MenuItem({
                 label: "New...",
                 click: function() {

                 crsaTemplateBrowser = new CrsaProjectBrowser();
                 crsaTemplateBrowser.setProject(crsaTemplateProject);
                 crsaTemplateBrowser.onFileSelected = function(cf) {
                 methods.openPage(cf.url, null, function(cp) {
                 scrollCanvasToPage(cp.$iframe);
                 });
                 }
                 crsaTemplateBrowser.show();
                 }
                 }));

                 fileMenu.append(new gui.MenuItem({
                 label: "Open file...",
                 click: function() {

                 crsaChooseFile(function(url) {
                 methods.openPage(url, null, function(cp) {
                 scrollCanvasToPage(cp.$iframe);
                 });
                 });
                 }
                 }));

                 fileMenu.append(new gui.MenuItem({
                 label: "Open url...",
                 click: function() {
                 showPrompt("Page url:", "Open page from url", null, "http://pinegrow.com", null, function(url) {
                 methods.openPage(url, null, function(cp) {
                 scrollCanvasToPage(cp.$iframe);
                 });
                 });
                 }
                 }));

                 var editMenu = new gui.Menu();
                 editMenu.append(new gui.MenuItem({
                 label: "Cut"
                 , click: function() {
                 document.execCommand("cut");
                 console.log('Menu:', 'cutted to clipboard');
                 }
                 }));

                 editMenu.append(new gui.MenuItem({
                 label: "Copy"
                 , click: function() {
                 document.execCommand("copy");
                 console.log('Menu:', 'copied to clipboard');
                 }
                 }));

                 editMenu.append(new gui.MenuItem({
                 label: "Paste"
                 , click: function() {
                 document.execCommand("paste");
                 console.log('Menu:', 'pasted to textarea');
                 }
                 }));

                 var win = gui.Window.get();
                 win.menu = menu;

                 win.menu.insert(new gui.MenuItem({ label: 'File', submenu: fileMenu}), 1);
                 win.menu.insert(new gui.MenuItem({ label: 'Edit', submenu: editMenu}), 2);


                 //gui.Window.get().menu.insert(fileMenuItem, 0);
                 */
                var gui = require('nw.gui');

                mainWindowManager = new pgWindowManager(gui.Window.get(), 'main', function(win) {
                    win.maximize();
                })
                //gui.Window.get().maximize();

                var win = gui.Window.get();
                win.setMaxListeners(0);
                win.title = 'Pinegrow Web Editor' + (pinegrow.hasActivatedProduct('WP') ? ' - WP' : '');
                //win.zoomLevel = 3;
                //win.isFullscreen = true;

                setUIZoom(pinegrow.getSetting('ui-zoom', '0'));

                var getRunTime = function() {
                    return parseInt((new Date().getTime() - app_start_time) / 1000.0);
                }

                win.on('close', function() {
                    if(crsaHasChanges()) {
                        showAlert('One or more pages or component libraries (see File -> Manage libraries and plugins) have unsaved changes. Are you sure you want to quit the app?',  "Unsaved changes", "Don't quit", "Quit", null, function() {
                            pinegrow.stats.event('app.close', getRunTime(), true);
                            pinegrow.stats.send(function() {
                                codeEditor.closeExternalWindow();
                                win.close(true);
                            });
                        });
                    } else {
                        pinegrow.stats.event('app.close', getRunTime(), true);
                        pinegrow.stats.send(function() {
                            codeEditor.closeExternalWindow();
                            win.close(true);
                        });
                    }
                });

                $('.menu-file-quit').on('click', function(e) {
                    e.preventDefault();
                    win.close();
                })
            }

            classManager = new CrsaClassManager($('#crsa-rules'));

            canvas = this.find('.canvas');
            pageTabs = new pgPageTabs(canvas);

            pinegrow.pageTabs = pageTabs;

            /*
             var canvasNode = canvas.get(0),
             scrollTimer;

             canvasNode.addEventListener('scroll', function() {
             clearTimeout(scrollTimer);
             if(!canvasNode.classList.contains('disable-hover')) {
             canvasNode.classList.add('disable-hover')
             }

             scrollTimer = setTimeout(function(){
             canvasNode.classList.remove('disable-hover')
             },500);
             }, false);
             */

            $rule_edit = $("#crsa-rule-edit");

            var browser_quality = 0;

            if (navigator.userAgent.match(/msie/i)) {
                browser_quality = 0;
            } else if (navigator.userAgent.match(/webkit/i)) {
                browser_quality = 2;
            } else if(navigator.userAgent.match(/mozilla/i)) {
                browser_quality = 1;
            }

            if(browser_quality == 0) {
                alert("Sorry, Internet explorer is not supported at the moment. Pinegrow Web Designer works in Chrome, Safari and FireFox. Or you can download the Pinegrow desktop app for Windows.");
            } else {

                if(pinegrow.sourceParser) {
                    //crsaQuickMessage("Source Parser ACTIVE!", 4000);
                }
                if(is_windows) {
                    $('body').addClass('win');
                } else if(is_mac) {
                    $('body').addClass('osx');
                }
                if(isApp()) {
                    $('body').addClass('app');
                }

                $('body').crsastorage();
                $('div.canvas').crsapages();
                canvas.crsacss();

                crsaTree = new CrsaTree($('#crsa-tree'));
                pinegrow.treePanel = crsaTree;

                updateTrialProNotices();

                crsaTree.onSortReceive = function($el, $dest, pos, ui) {

                    factoryCopyHelper = null;

                    if(draggedPlaceholderElement) {
                        draggedPlaceholderElement.remove();
                        draggedPlaceholderElement = null;
                    }

                    //var $oldParent = null;
                    var orig_def = draggedFactoryElement.data('crsa-factory-def');;
                    if(!$el) {
                        var def = orig_def;
                        if(def) {
                            orig_def = def;
                            $el = createElementFromDefinition(def);
                            $el.data('crsa-def', null);
                            def = getType($el);
                            ui.item.html('').append('<div class="crsa-tree-node-name">' + def.name + '</div>');
                            crsaTree.assignTreeNodeToElement(ui.item, $el, true);

                            //     methods.wireTreeElements(ui.item, $iframe);
                        }
                    } else {
                        //$oldParent = getClosestCrsaElement($el.parent()); //cech
                    }
                    setLastPreviewedDef(orig_def);

                    var $dest_inner = getInnerContainer($dest);
                    if(pos < 1) {
                        $dest_inner.prepend($el);
                    } else {
                        var $prevTree = ui.item.prev();
                        var $prev = crsaTree.getElementOfTreeNode($prevTree);
                        $el.insertAfter($prev);
                    }

                    var iframe = getIframeOfElement($el);
                    var $parent = $el.parent();

                    var pgEl = getElementPgNode($el);

                    if(canMakeChange(getElementPgNode($parent), 'insert_element', {inserted: pgEl})) {
                        willMakeChange(selectedPage, "Added to tree / " + getElementName($el));

                        if(!pgEl || !pgInsertNodeAtDOMElementLocation(pgEl, $el)) {
                            showAlert("The element can't be placed here because the destination is a dynamic element, created by Javascript code.", "Can't put it here");
                            $el.remove();
                        } else {

                            didMakeChange(selectedPage, $el);
                            elementWasInserted($el, orig_def);
                            selectElement($el);
                        }
                    } else {
                        $el.remove();
                    }
                    window.requestAnimationFrame(function() {
                        methods.updateStructureAndWireAllElemets(iframe, $parent);
                    });
                }

                crsaTree.onSortStart = function($el) {
                    canvas.crsapages('showOverlays');
                    willMakeChange(selectedPage, "Tree Drag & Drop / " + getElementName($el));
                }

                crsaTree.onSortStop = function($el, $dest, pos, ui) {
                    var move = true;
                    if(!$el) {
                        var def = draggedFactoryElement.data('crsa-factory-def');
                        if(def) {
                            $el = createElementFromDefinition(def);
                        }
                        move = false;
                    }
                    canvas.crsapages('showOverlays', true);

                    var $dest_inner = getInnerContainer($dest);

                    var pgEl = getElementPgNode($el);
                    var pgDestInner = getElementPgNode($dest_inner);

                    var problems = new pgParserSourceProblem(pgEl, $el);

                    if(!pgEl) {
                        problems.add('element', getElementName($el), 'find');
                    }
                    var pgPrev = null;
                    var $prev = null;
                    var $next = null;
                    var pgNext = null;

                    var $prevTree = ui.item.prev();
                    if($prevTree.length) $prev = crsaTree.getElementOfTreeNode($prevTree);

                    var $nextTree = ui.item.next();
                    if($nextTree.length) {
                        $next = crsaTree.getElementOfTreeNode($nextTree);
                        if($next) {
                            pgNext = getElementPgNode($next);
                        }
                    }

                    if(pos >= 1) {

                        pgPrev = getElementPgNode($prev);
                        if(!pgPrev) {
                            problems.add('element', getElementName($prev), 'find');
                        }
                    } else {
                        if(pgNext) {
                            //we'll insert if before next
                        } else {
                            if(!pgDestInner) {
                                problems.add('element', getElementName($dest), 'find');
                            }
                        }
                    }
                    if(!problems.ok()) {
                        showAlert(problems.toString(), "Can't move this element");

                        //skip_tree_scroll = true;
                        methods.updateStructureAndWireAllElemets(getIframeOfElement($el));
                        //skip_tree_scroll = false;

                        return;
                    }

                    if(!canMakeChange(pgDestInner, 'insert_element', {inserted: pgEl, moved: pgEl, prev: pgPrev, next: pgNext}) || (move && !canMakeChange(pgEl, 'move_element'))) {
                        methods.updateStructureAndWireAllElemets(getIframeOfElement($el));
                        return;
                    }

                    if(pos < 1) {
                        if(pgNext) {
                            $el.insertBefore($next);
                            pgEl.insertBefore(pgNext);
                        } else if(pgDestInner) {
                            $dest_inner.prepend($el);
                            pgDestInner.prepend(pgEl);
                        } else {
                            ///
                        }
                    } else {
                        $el.insertAfter($prev);
                        pgEl.insertAfter(pgPrev)
                    }

                    elementWasMoved($el, selectedCrsaPage, selectedCrsaPage);

                    didMakeChange(selectedPage, $el);


                }

                var less_loaded = false;

                $.each(options.pages, function(i,e) {
                    methods.openPage(e.src);
                });

                if(options.pages.length == 0 && isApp() && !crsaIsBig()) {
                    setTimeout(function() {
                        showIntroScreen();
                    }, 1000);
                } else {
                    showNewVersionScreen();
                }



                var openFiles = function(list) {
                    var files = list;
                    var files_idx = 0;

                    var openFile = function() {
                        var file = files[files_idx];
                        var url = crsaMakeUrlFromFile(file);

                        var ocp = pinegrow.getCrsaPageByUrl(url);
                        if(ocp) {
                            crsaQuickMessage(ocp.name + ' is already open.');
                            if(!ocp.changed) {

                            }
                            return;
                        }
                        methods.openPage(url, null, function(cp) {
                            cp.setLocalFile(file);
                            scrollCanvasToPage(cp.$iframe);

                            files_idx++;
                            if(files_idx < files.length) {
                                openFile();
                            }
                        });

                        recentFiles.add(url);
                    }
                    if(files.length > 0) {
                        openFile();
                    }
                }

                if(isApp()) {
                    //drop files to PG
                    window.ondragover = function(e) { e.preventDefault(); return false };
                    window.ondrop = function(e) { e.preventDefault(); return false };

                    var holder = $('body').get(0);
                    holder.ondragover = function () { return false; };
                    holder.ondragend = function () { return false; };
                    holder.ondrop = function (e) {
                        e.preventDefault();

                        var files = [];

                        if(e.dataTransfer.files) {
                            for (var i = 0; i < e.dataTransfer.files.length; ++i) {
                                files.push(e.dataTransfer.files[i].path)
                            }
                            openFiles(files);
                        }
                        return false;
                    };

                    gui.App.on('open', function(cmdline) {
                        console.log('command line: ' + cmdline);
                        setTimeout(function() {
                            openFiles([cmdline]);
                        }, 200);
                    });

                    var files = ['/Users/Matjaz/Dropbox/Development/DVWeb/DV/Pinegrow/lab/PartialsDemo/index.html'];
                    files = [];
                    //console.log(gui.App.argv);

                    $.each(gui.App.argv, function(i, arg) {
                        if(arg.indexOf('--') == 0) {
                        } else {
                            files.push(arg);
                        }
                    });
                    if(files.length) {
                        setTimeout(function() {
                            openFiles(files);
                        }, 200);
                    }

                    if(localStorage.openProjectOnLoad) {
                        pinegrow.openProject(localStorage.openProjectOnLoad);
                        delete localStorage.openProjectOnLoad;
                    }

                    window.mixpanel = false;

                    var app_run = parseInt(localStorage.app_run || "0") + 1;
                    localStorage.app_run = app_run;

                    pinegrow.stats.event('app.start', null, true);

                }

                $('.dropdown').on('shown.bs.dropdown', function (e) {
                    var $ul = $(e.target).find('> ul');
                    $ul.css('height', 'auto');

                    if ($ul.height() + $ul.offset().top > $(window).height()) {
                        $ul.css('height', $(window).height() - $ul.offset().top - 10);
                    }
                })

                $('.menu-file-open-file').on('click', function(e) {

                    e.preventDefault();
                    gaSendPageView("FileOpen");
                    if(!isApp()) {
                        showDownloadsScreen('<div class="alert alert-info">Use <b>File - New page</b> to add a page to your project. Or download Pinegrow desktop app to open your local files.</div>', 'to open your files');
                        return;
                    }


                    crsaChooseFile(function(url, file) {

                        openFiles(file.split(';'));
                    }, null, true);

                    pinegrow.stats.using('app.openfile');
                });

                $('.menu-file-open-url').on('click', function(e) {
                    e.preventDefault();
                    gaSendPageView("FileOpenUrl");
                    if(!isApp()) {
                        showDownloadsScreen('<div class="alert alert-info">Use <b>File - New page</b> to add a page to your project. Or download Pinegrow desktop app to open files from the Internet.</div>', 'to open remote files');
                        return;
                    }
                    /*
                     if(!crsaIsEmailActivated()) {
                     showActivateEmailScreen();
                     return;
                     }
                     */
                    var $modal = showPrompt("Page url:", "Open page from url", null, "http://pinegrow.com", null, function(url) {
                        if(url) {
                            if(url.indexOf('://') < 0) {
                                url = 'http://' + url;
                            }
                            //if(url.replace(/^[a-z]+:\/\//i, '').indexOf('/') < 0) url += '/';

                            var a = document.createElement('a');
                            a.href = url;
                            url = a.href;
                            a = null;

                            /*
                             ['href','protocol','host','hostname','port','pathname','search','hash'].forEach(function(k) {
                             console.log(k+':', a[k]);
                             });
                             */


                            methods.openPage(url, null, function(cp) {
                                scrollCanvasToPage(cp.$iframe);
                            });
                            recentFiles.add(url);
                        }
                    });
                    $modal.find('.modal-body').append('<p>NOTE: <b>If you want to save changes</b> it is recommended to first save the page locally (for example, with &quot;Save as complete page&quot; in your browser) and then open it with <b>Open file</b>.</p>');

                    pinegrow.stats.using('app.openurl');
                });

                var openFromTemplate = function() {

                    if(crsaTemplateProjects) {
                        crsaTemplateBrowser = new CrsaProjectBrowser();
                        crsaTemplateBrowser.title = "Add a page to your project";
                        crsaTemplateBrowser.intro = '<p>Choose a page to add to your project:</p>';
                        crsaTemplateBrowser.setProjects(crsaTemplateProjects);
                        crsaTemplateBrowser.selectedProject = selectedCrsaProjectTemplate;
                        crsaTemplateBrowser.onFileSelected = function(cf, project) {

                            var url = crsaIsAbsoluteUrl(cf.url) ? cf.url : crsaGetBaseForUrl(window.location.href) + '/' + cf.url;
                            methods.openPage(url, null, function(cp) {
                                cp.crsaProjectTemplate = project;
                                scrollCanvasToPage(cp.$iframe);
                                selectedCrsaProjectTemplate = project;
                                cp.source_framework = project.framework;
                            });
                        }
                        crsaTemplateBrowser.show();
                    }

                }

                $('.menu-file-template').on('click', function(e) {
                    e.preventDefault();
                    gaSendPageView("FileOpenTemplate");
                    if(isApp()) {
                        /*
                         if(!crsaIsEmailActivated()) {
                         showActivateEmailScreen();
                         return;
                         }
                         */
                    }
                    openFromTemplate();
                    pinegrow.stats.using('app.newfile');

                });

                window.canOpenProject = function() {
                    if(pinegrow.isProTrialActive() || pinegrow.isPRO()) return true;
                    pinegrow.showAlert('<p>Projects, master pages and components are available in <b>Pinegrow PRO edition</b>.</p><p>The PRO edition is great for efficiently editing multi-page websites. <a href="' + pinegrow.pro_info_url + '" class="external">Learn more »</a></p>', 'Projects are a part of Pinegrow PRO edition', 'Close', 'Upgrade', null, function() {
                        var gui = require('nw.gui');
                        var url = pinegrow.pro_upgrade_url;
                        gui.Shell.openExternal(url);
                    });
                    return false;
                }

                $('.menu-file-open-project').on('click', function(e) {
                    e.preventDefault();
                    gaSendPageView("FileOpenProject");
                    if(canOpenProject()) {
                        var project = new CrsaProject();
                        project.openProjectBySelectingFolder(function(p) {
                            pinegrow.setCurrentProject(p);
                            recentFiles.add(p.root.path, true);
                            crsaQuickMessage('Project was loaded.');
                            pinegrow.showTab('project');
                        });
                        pinegrow.stats.using('app.openproject');
                    }
                });

                $('.menu-file-open-project-win').on('click', function(e) {
                    e.preventDefault();
                    if(canOpenProject()) {
                        crsaChooseFile(function(url, file) {
                            localStorage.openProjectOnLoad = file;
                            var new_win = gui.Window.get(
                                window.open(window.location.href)
                            );
                        }, false, false, null, true);
                    }
                    pinegrow.stats.using('app.openprojectnewwin');
                });




                $('.menu-file-load-project-lib').on('click', function(e) {
                    e.preventDefault();
                    pinegrow.selectAndLoadLibrary(function(project, f) {
                    });
                    pinegrow.stats.using('app.loadprojectlib');
                });

                var showBackupNotice = function() {
                    if(pinegrow.getSetting('backup', '1') == '1') {
                        showNotice('<p>When you save a file Pinegrow saves a <b>backup copy of the original file</b> into the _pgbackup folder, located in the same location as the saved file. A current timestamp is appended to the backup file name.</p><p>This feature is useful when you are still experimenting with Pinegrow and want to make sure that you don\'t accidentally corrupt your source files in case Pinegrow can\'t handle them correctly (like templates, PHP, JSP...). But this can create a lot of backup files.</p><p>You can <b>disable backups</b> in <b>Support -&gt; Settings</b>.</p>', 'About file backups', 'save-backup');
                    }
                }

                $('.menu-file-save').on('click', function(e) {

                    e.preventDefault();

                    var saveSelectedPage = function() {
                        if(!selectedPage) return;

                        if(isApp()) {

                            var cp = getCrsaPageForIframe(selectedPage);

                            if(!canSaveFiles(cp)) return;

                            if(codeEditor) codeEditor.refreshBeforeSaveIfNeeded();

                            if(cp.live_update && cp.save_parent) cp = cp.live_update;
                            var first_save = cp.localFile == null;
                            cp.save(function(err) {
                                if(!err) {
                                    //console.log('File saved!');
                                    if(first_save) {
                                        recentFiles.add(cp.url);
                                        if(pinegrow.isPRO() || pinegrow.isProTrialActive()) {
                                            if(!pinegrow.getCurrentProject()) {
                                                var path = require('path');
                                                var folder = path.dirname(cp.localFile);
                                                var folder_name = path.basename(folder);
                                                pinegrow.showAlert('<p>Would you like to open folder <b>' + folder_name + '</b> as a project?</p>', 'Open project?', 'No', 'Yes', null, function() {
                                                    pinegrow.openProject(folder, cp);
                                                });
                                            }
                                        }
                                    }
                                }
                            }, true, true);

                            showBackupNotice();
                        } else {
                            showDownloadsScreen('<div class="alert alert-info">Use <b>File - Download your project</b> to download a Zip file with your project.</div>', 'to save files');
                        }
                    }

                    //is code edit?
                    if(codeEditor.isEditingCodeOnlyPage()) {
                        if(!selectedPage || codeEditor.isEditorFocused()) {
                            codeEditor.currentCodePage.save();
                            return;
                        }
                        if(selectedPage) {
                            var cp = getCrsaPageForIframe(selectedPage);
                            if(cp.hasChanges() && codeEditor.currentCodePage.hasChanges()) {
                                //ask
                                var $d = showAlert('<p>Which document do you wish to save?</p>',  "Which document to save?", cp.name, codeEditor.currentCodePage.name, function() {
                                    //cancel
                                    saveSelectedPage();

                                }, function() {
                                    codeEditor.currentCodePage.save();
                                });
                                $('<a href="#" class="btn pull-left">Don\'t save any</a>').appendTo($d.find('.modal-footer')).on('click', function(e) {
                                    e.preventDefault();
                                    $d.modal('hide');
                                });
                                return;

                            } else if(codeEditor.currentCodePage.hasChanges()) {
                                codeEditor.currentCodePage.save();
                                return;
                            }
                        }
                    }

                    saveSelectedPage();


                });

                $('.menu-file-save-as').on('click', function(e) {

                    e.preventDefault();
                    if(!selectedPage) return;

                    var cp = getCrsaPageForIframe(selectedPage);

                    if(!canSaveFiles(cp)) return;

                    if(codeEditor) codeEditor.refreshBeforeSaveIfNeeded();
                    cp.save(function(err) {
                        if(!err) {
                            recentFiles.add(cp.url);
                            pageTabs.updateDisplay();
                        }
                    }, true, true, true);

                    showBackupNotice();
                });

                $('.menu-file-save-html').on('click', function(e) {
                    e.preventDefault();
                    if(!selectedPage) return;

                    var cp = getCrsaPageForIframe(selectedPage);

                    if(!canSaveFiles(cp)) return;

                    if(codeEditor) codeEditor.refreshBeforeSaveIfNeeded();

                    if(cp.live_update && cp.save_parent) cp = cp.live_update;

                    cp.save(function(err) {
                        if(!err) {
                            console.log('File HTML saved!');
                        }
                    }, true, false);

                    showBackupNotice();
                });

                $('.menu-file-save-all').on('click', function(e) {
                    e.preventDefault();
                    if(!selectedPage) return;

                    if(!canSaveFiles()) return;

                    if(codeEditor) codeEditor.refreshBeforeSaveIfNeeded();
                    $.fn.crsapages('saveAll');
                    e.preventDefault();

                    showBackupNotice();
                });

                pinegrow.closeAllPages = function(done) {
                    var closeAll = function(only_saved) {
                        var cps = $.fn.crsapages('getAllPages').slice();
                        $.each(cps, function(i, cp) {
                            if(only_saved && cp.hasChanges()) return true;
                            cp.force_close = true;
                            cp.$page.find('.crsa-close').trigger('click');
                        });
                    }

                    if(crsaHasChanges()) {
                        var $d = showAlert('One or more pages have unsaved changes. Do you want to save changes before closing?',  "Unsaved changes", "Cancel", "Save all &amp; Close", function() {
                            //cancel
                            if(done) done(false);

                        }, function() {

                            var pages = $.fn.crsapages('getAllPages');
                            var can_save = true;
                            for(var i = 0; i < pages.length; i++) {
                                if(pages[i].hasChanges()) {
                                    if(!canSavePage(pages[i], 1000)) {
                                        can_save = false;
                                        break;
                                    }
                                }
                            }
                            if(!can_save) return;

                            if(codeEditor) codeEditor.refreshBeforeSaveIfNeeded();
                            closeAll(true);
                            $.fn.crsapages('saveAll', true);
                            showBackupNotice();
                            if(done) done(true);
                        });
                        $('<a href="#" class="btn pull-left">Don\'t save</a>').appendTo($d.find('.modal-footer')).on('click', function(e) {
                            e.preventDefault();
                            closeAll();
                            $d.modal('hide');
                            if(done) done(true);
                        });
                    } else {
                        closeAll();
                        if(done) done(true);
                    }
                }

                $('.menu-file-close-all').on('click', function(e) {
                    e.preventDefault();

                    pinegrow.closeAllPages();
                });

                $('.menu-file-close-project').on('click', function(e) {
                    e.preventDefault();
                    pinegrow.closeCurrentProject();
                })

                $('.menu-file-download').on('click', function(e) {

                    e.preventDefault();
                    if(!selectedPage) return;

                    gaSendPageView("FileDownload");

                    if(isApp() && !crsaIsBig() && trial_no_save) {
                        showBuyScreen();
                        return;
                    }
                    /*
                     if(!crsaIsEmailActivated()) {
                     showActivateEmailScreen();
                     return;
                     }
                     */

                    $.fn.crsapages('downloadAllPages');
                });

                $('.menu-file-save-project').on('click', function(e) {
                    e.preventDefault();
                    if(!selectedPage) return;

                    gaSendPageView("FileSaveProject");
                    /*
                     if(!crsaIsEmailActivated()) {
                     showActivateEmailScreen();
                     return;
                     }
                     */

                    var store = new CrsaBrowserStorage();
                    if(!store.hasSavedProject()) {
                        if(isApp()) {
                            showAlert("<p>Your current project was saved. You can open it later with <b>File - Load project</b>.</p><p><b>Only one project can be saved in this way.</b> Use File - Open and File - Save to open and save any file you want.</p>");
                        } else {
                            showAlert("<p>Your current project was saved to browser storage. You can open it later with <b>File - Load project</b>.</p><p><b>Only one project can be saved in this way.</b> <a href=\"http://pinegrow.com#buy\" target=\"_blank\"><b>Get the Pinegrow desktop app</b></a> to open and save any file you want.</p>");
                        }
                    }
                    if(!store.saveProject()) {
                        showAlert("There is nothing to save. First add some pages to the project (<b>File - New page</b>).", "Nothing to save")
                    } else {
                        crsaQuickMessage("Project was saved.");
                    }

                });

                $('.menu-file-load-project').on('click', function(e) {
                    e.preventDefault();
                    gaSendPageView("FileLoadProject");
                    var store = new CrsaBrowserStorage();

                    if(store.hasSavedProject()) {
                        /*
                         if(!crsaIsEmailActivated()) {
                         showActivateEmailScreen();
                         return;
                         }*/

                        if(store.restoreProject()) {

                        } else {
                            showAlert("Ups... something went wrong.", "Couldn't load project")
                        }
                    } else {
                        showAlert("No saved project found. Choose <b>File - Remember project</b> to save a project first.", "Couldn't load project");
                    }

                });

                $('.menu-file-close').on('click', function(e) {
                    e.preventDefault();
                    if(selectedCrsaPage) {
                        selectedCrsaPage.$page.find('.crsa-close').trigger('click');
                    }
                });

                $('.menu-dev-tools').on('click', function(e) {
                    if(isApp()) {
                        var win = require('nw.gui').Window.get();
                        win.showDevTools();
                        e.preventDefault();

                        pinegrow.stats.using('app.devtools');
                    }
                });

                $('.menu-file-cache').on('click', function(e) {

                    pinegrow.cache_breaker++;
                    var gui = require('nw.gui');
                    gui.App.clearCache();
                    var pages = $.fn.crsapages('getAllPages');
                    for(var i = 0; i < pages.length; i++) {
                        pages[i].clearAssetsCache();
                    }
                    e.preventDefault();
                });

                $('.menu-file-manage-ss').on('click', function(e) {
                    $.fn.crsacss('showStylesheetsManager', null);
                    e.preventDefault();
                });

                $('.menu-file-manage-fm').on('click', function(e) {
                    $.fn.crsacss('showFrameworkManager', pinegrow.getSelectedPage());
                    e.preventDefault();
                });

                $('.menu-file-new-window').on('click', function(e) {
                    e.preventDefault();
                    if(isApp()) {
                        var new_win = gui.Window.get(
                            window.open(window.location.href)
                        );
                        pinegrow.stats.using('app.newwin');
                        //new_win.maximize();
                    }
                });

                $('.menu-support-about').on('click', function(e) {

                    showAboutScreen();
                    e.preventDefault();
                });

                $('.menu-support-settings').on('click', function(e) {

                    showSettingsScreen();
                    e.preventDefault();
                });

                $('.menu-support-buy').on('click', function(e) {

                    showIntroScreen();
                    e.preventDefault();
                });

                $('.menu-support-contact').on('click', function(e) {

                    showContactScreen();
                    e.preventDefault();
                });

                $('.menu-support-api').on('click', function(e) {
                    var url = pinegrow.getApiUrl();
                    pinegrow.showAlert('<p>Url for accessing Pinegrow API remotely is: <code>' + url + '</code>.</p><p>Replace localhost with computer name or IP address to access the url from another computer.</p>', 'Pinegrow API url');
                    e.preventDefault();
                });

                $('.menu-support-new').on('click', function(e) {

                    showNewVersionScreen(true);
                    e.preventDefault();
                });


                $('.menu-support-tour').on('click', function(e) {

                    crsaPlayTour();
                    e.preventDefault();
                });

                $('.menu-support-docs, .menu-support-portal, .menu-documentation, .menu-tips, .menu-video-tutorials').on('click', function(e) {
                    if(isApp()) {
                        var gui = require('nw.gui');
                        var url = $(e.delegateTarget).attr('href');
                        gui.Shell.openExternal(url);
                        e.preventDefault();
                    }
                });

                $('.menu-support-tutorial').on('click', function(e) {
                    e.preventDefault();
                    pinegrow.openPage(crsaGetBaseForUrl(window.location.href) + '/' + 'templates/learn/tutorial.html');
                });

                var $zoom = $('#crsa-zoom');

                var showZoomValue = function() {
                    var z;
                    if($.fn.crsapages('getFit')) {
                        z = 'Fit';
                    } else {
                        z = Math.ceil($.fn.crsapages('getZoom') * 100) + '%';
                    }
                    $zoom.find('button').html(z + ' <span class="caret"></span>');
                }

                var setZoom = function(z) {
                    if(z == 'fit') {
                        $('div.canvas').crsapages('setFit', true);
                    } else {
                        z = z / 100.0;
                        $('div.canvas').crsapages('setFit', false);
                        $('div.canvas').crsapages('zoom', z);
                    }
                    showZoomValue();
                }

                if(customLogic && customLogic.defaultZoom) {
                    setZoom(customLogic.defaultZoom);
                } else {
                    setZoom(1.0);
                }

                var $ul = $zoom.find('ul').html('');
                for(var z = 100; z > 0; z -= 10) {
                    var d = z + '%';
                    $('<li/>').html('<a href="#">' + d + '</a>').appendTo($ul).data('zoom', z);
                }
                $('<li/>').html('<a href="#">Fit</a>').appendTo($ul).data('zoom', 'fit');
                $zoom.find('a').on('click', function(e) {
                    e.preventDefault();
                    var z = $(e.delegateTarget).closest('li').data('zoom');
                    setZoom(z);
                })

                $zoom.find('.btn').button();

                $('#crsa-preview-switch').on('change', function(e) {
                    //var prop = $('#crsa-preview').prop('checked');
                    preview = $('#crsa-preview-switch').prop('checked');
                    if(preview) {
                        selectElement(null);
                        highlightElement(null);
                        crsaQuickMessage("You can also use SHIFT + CLICK to test clicks.", 3000);
                    }
                });

                methods.showFactory();
                methods.showProperties(null);
                methods.showActions();

                var $rules = $("#crsa-rules");

                var doClassSelected = function($el, cls, remove) {
                    cls = cls.replace('.','');
                    var name = getElementName($el);

                    var node = getElementPgNode($el);
                    var problems = new pgParserSourceProblem(node, $el);

                    if(node) {
                        if(remove) {
                            if($el.hasClass(cls)) {
                                if(node.canRemoveClass(cls)) {

                                } else {
                                    //element has class, but source doesn't
                                    //class was added by script

                                    //problems.add('class', cls, 'remove');
                                }
                            }
                        }
                    } else {
                        problems.add('element', getElementName($el), 'change');
                    }
                    if(!problems.ok()) {
                        showAlert(problems.toString(), "Can't edit this element");
                        selectElement($el);
                        return;
                    }

                    if(remove) {
                        if(!canMakeChange(node, 'remove_class', cls)) return;

                        willMakeChange(selectedPage, name + ' | Remove class ' + cls);
                        $el.removeClass(cls);
                        node.removeClass(cls);
                    } else {
                        if(!canMakeChange(node, 'add_class', cls)) return;

                        willMakeChange(selectedPage, name + ' | Add class ' + cls);
                        $el.addClass(cls);
                        node.addClass(cls);
                    }
                    //console.log(node.toStringWithIds());

                    crsaQuickMessage("Class <b>" + cls + "</b> " + (remove ? "removed from" : "assigned to") + " <b>" + name + "</b>.");
                    selectElement($el);
                    pinegrow.updateTree($el);
                    didMakeChange(selectedPage, $el);
                }


                $rules.on('crsa-cm-class-add', function(event, cls) {
                    if(selectedElement && selectedElement.type == 'element') {
                        doClassSelected(selectedElement.data, cls);
                    }
                });

                $rules.on('crsa-cm-class-remove', function(event, cls) {
                    if(selectedElement && selectedElement.type == 'element') {
                        doClassSelected(selectedElement.data, cls, true);
                    }
                });

                $rules.on('crsa-cm-edit', function(event, rule_info) {
                    var rule_obj = getObjectFromRule(rule_info);
                    methods.showProperties(rule_obj, $rule_edit);
                });
                /*
                 $rules.on('crsa-cm-new', function(event, sel) {
                 selectedPage.crsacss('addLessRule', sel, {}, function(rule) {
                 var rule_obj = getObjectFromRule(rule);
                 methods.showProperties(rule_obj, $rule_edit);
                 });
                 });
                 */



                resizeChrome();

                $(window).on('resize', function(e) {
                    if(e.target == window) {
                        resizeChrome();
                    }
                });

                $('#crsa-left-plane a[href="#tab4"]').on('show.bs.tab', function (e) {
                    var $rules_dom = $('#crsa-rules');
                    var $tab = $('#tab4');
                    $("#crsa-rules-out").data('panel').hide();
                    if($tab.find('#crsa-rules').length == 0) {
                        classManager.setReferenceElement((selectedElement && selectedElement.type == 'element') ? selectedElement.data : null, true);
                        classManager.setShowOnlyClasses(false, true);
                        classManager.setOnlyActive(classManager.only_active_user_choice, false);

                        if(classManager.filter_set_in_props_mode) {
                            classManager.setFilter(null, false);
                        }
                        classManager.refresh();
                        $tab.append($rules_dom);
                    }

                });

                $('#crsa-left-plane a[href="#tab4"]').on('shown.bs.tab', function (e) {
                    classManager.resizeRulesList();
                });

                addTooltip($('#crsa-left-plane [data-pg-tab="Lib"]'), 'Add Elements to page ' + crsaGetKbdDisplay('CMD 1', false));
                addTooltip($('#crsa-left-plane [data-pg-tab="Prop"]'), 'Edit Element properties ' + crsaGetKbdDisplay('CMD 2', false));
                addTooltip($('#crsa-left-plane [data-pg-tab="Css"]'), 'CSS Editor &amp; Variables ' + crsaGetKbdDisplay('CMD 3', false));
                addTooltip($('#crsa-left-plane [data-pg-tab="Act"]'), 'Element Actions ' + crsaGetKbdDisplay('CMD 4', false));
                addTooltip($('#crsa-left-plane [data-pg-tab="Wp"]'), 'WordPress Actions ' + crsaGetKbdDisplay('CMD 5', false));
                addTooltip($('#crsa-left-plane [data-pg-tab="Prj"]'), 'Project ' + crsaGetKbdDisplay('CMD 6', false));


                showTab(customLogic.openTab);


                var $leftPlane = $('#crsa-left-plane');

                $leftPlane.hide();
                $('#crsa-tree').hide();

                var hider_icon_shown = 'fa-minus';
                var hider_icon_hiden = 'fa-plus';

                var $leftHider = $leftPlane.find('i.hider').on('click', function(e) {
                    var w = $leftPlane.width();
                    if(!$leftPlane.hasClass('closed')) {
                        $leftPlane.addClass('closed');
                        $leftPlane.find('.nav-tabs').hide();
                        $leftPlane.animate({width: '30px'}, 150, function() {
                            $leftHider.removeClass(hider_icon_shown).addClass(hider_icon_hiden);
                            resizeChrome();
                        });
                        $leftPlane.find('.tab-content').animate({opacity:0}, 150, function() {
                            $(this).hide();
                        });

                    } else {
                        $leftPlane.removeClass('closed');
                        $leftPlane.find('.nav-tabs').show();
                        $leftPlane.animate({width: '300px'}, 150, function() {
                            $leftHider.addClass(hider_icon_shown).removeClass(hider_icon_hiden);
                            resizeChrome();
                        });
                        $leftPlane.find('.tab-content').show().animate({opacity:1}, 150, function() {

                        });
                    }

                    e.preventDefault();
                });
                addTooltip($leftHider, 'Hide / show the panel');

                var $body = $('body');

                $(window).on('scroll', function(e) {
                    if($body.scrollTop() != 0) {
                        $body.scrollTop(0);
                    }
                });

                $body.on('crsa-frameworks-changed', function() {
                    methods.showProperties(selectedElement, null);
                });

                $('#crsa-fullscreen').on('click', function(e) {
                    e.preventDefault();
                    $body.get(0).webkitRequestFullScreen();
                });

                $('#crsa-undo').on('click', function(e) {
                    //crsaundo.undo();
                    if(selectedPage) {
                        var crsaPage = getCrsaPageForIframe(selectedPage);
                        var us = crsaPage.undoStack;
                        if(us.isAtTheTip()) {
                            us.add("Undo", true);
                        }
                        us.undo(function(n) {
                            if(n) {
                                didMakeChange(selectedPage);
                                $body.trigger('crsa-stylesheets-changed');
                                $body.trigger('crsa-breakpoints-changed');
                                crsaPage.refresh();
                            } else {
                                crsaQuickMessage("Nothing to undo.");
                            }
                        });
                    }
                    e.preventDefault();
                });

                addTooltip($('#crsa-undo'), 'Undo');

                $('#crsa-redo').on('click', function(e) {
                    //crsaundo.redo();
                    if(selectedPage) {
                        var crsaPage = getCrsaPageForIframe(selectedPage);
                        crsaPage.undoStack.redo(function(n) {
                            if(n) {
                                didMakeChange(selectedPage);
                                $body.trigger('crsa-stylesheets-changed');
                                $body.trigger('crsa-breakpoints-changed');
                                crsaPage.refresh();
                            } else {
                                crsaQuickMessage("Nothing to redo.");
                            }
                        });
                    }
                    e.preventDefault();
                });

				addTooltip($('#crsa-redo'), 'Redo');

				$('#crsa-clipboard').on('click', function(e) {
					e.preventDefault();
					clipboardPanel.show();
				})

				var first_clipboard_activity = true;

                var showClipboardOnFirstCopyCut = function() {
                    if(!clipboardPanel.shown && first_clipboard_activity) {
						clipboardPanel.show();
						first_clipboard_activity = false;
					}
                }

				pinegrow.addEventHandler('on_clipboard_copy', function() {
					showClipboardOnFirstCopyCut();
				});

                pinegrow.addEventHandler('on_clipboard_cut', function() {
					showClipboardOnFirstCopyCut();
				});

				addTooltip($('#crsa-clipboard'), 'Show clipboard');

                canvas.on('crsa-page-closed', function(event, crsaPage) {

                    if(codeEditor.isInEdit(crsaPage.$iframe)) {
                        codeEditor.exitEdit(false);
                    }
                    if(selectedPage && selectedPage.get(0) == crsaPage.$iframe.get(0)) {
                        setSelectedPage(null);
                        selectedElement = null;
                        methods.showSelectedInsertFactory(null);
                        methods.showProperties(null);
                    }
                    crsaTree.closeTreeForPage(crsaPage);

                    pageTabs.removePage(crsaPage);

                    if(selectedPage == null) {
                        setTimeout(function() {
                            if(!selectedPage) {
                                var cps = $.fn.crsapages('getAllPages');
                                if(cps.length > 0) {
                                    setSelectedPage(cps[0].$iframe);
                                }
                            }
                        }, 100);
                    }
                });

                canvas.on('crsa-page-clone', function(event, crsaPage) {
                    methods.openPage(crsaPage.url, function(newCrsaPage) {

                    }, function(newCrsaPage) {
                        if(crsaPage.changed || true) {
                            newCrsaPage.copyContentOfPage(crsaPage, false /* dont skip refresh */);
                            newCrsaPage.callFrameworkHandler('on_page_cloned');
                            //newCrsaPage.refresh();
                            //var html = methods.getSourceOfPage(crsaPage.$iframe);
                            //methods.setSourceOfPage(newCrsaPage.$iframe, html);
                        }
                        scrollCanvasToPage(newCrsaPage.$iframe);
                    }, crsaPage.duplicate());
                });

                canvas.on('crsa-page-mirror', function(event, crsaPage) {
                    methods.openPage(crsaPage.url, function(newCrsaPage) {

                    }, function(newCrsaPage) {

                        if(crsaPage.changed || true) {
                            //var html = methods.getSourceOfPage(crsaPage.$iframe);
                            //methods.setSourceOfPage(newCrsaPage.$iframe, html);
                            newCrsaPage.copyContentOfPage(crsaPage);
                        }
                        scrollCanvasToPage(newCrsaPage.$iframe);
                        newCrsaPage.setLiveUpdate(crsaPage);

                        showNotice('Any changes done to the body of the original page will be <b>mirrored to the duplicated page</b>. And, any changes done to the duplicated page will be <b>mirrored back to the original page</b>.', 'Mirroring works both ways', 'mirror');
                    }, crsaPage.duplicate());
                });


                canvas.on('crsa-page-view', function(event, crsaPage) {
                    var cloned = crsaPage.duplicate();
                    cloned.deviceWidth = 320;

                    methods.openPage(crsaPage.url, function(newCrsaPage) {

                    }, function(newCrsaPage) {
                        newCrsaPage.save_parent = true;
                        if(crsaPage.changed || true) {
                            //var html = methods.getSourceOfPage(crsaPage.$iframe);
                            //methods.setSourceOfPage(newCrsaPage.$iframe, html);
                            newCrsaPage.copyContentOfPage(crsaPage);
                        }
                        scrollCanvasToPage(newCrsaPage.$iframe);
                        newCrsaPage.setLiveUpdate(crsaPage);

                        showNotice("Changes will be mirrored between views. Original page will be saved when you save a view. Use &quot;Save as&quot; on the view to start saving it as a separate file.", "Saving views", "view");
                    }, cloned);
                });


                canvas.on('crsa-page-reload', function(event, crsaPage) {
                    if(crsaPage.changed) {
                        showAlert("This page has unsaved changes. Are you sure you want to reload it?",  "Page has unsaved changes", "Cancel", "Reload", null, function() {
                            methods.reloadPage(crsaPage, false);
                        })
                    } else {
                        methods.reloadPage(crsaPage, false);
                    }
                });

                canvas.on('crsa-page-refresh', function(event, crsaPage) {
                    crsaQuickMessage("Refreshing page...", 1000);
                    methods.refreshPage(crsaPage);
                });

                canvas.on('crsa-page-rename', function(event, crsaPage) {
                    showPrompt("Page url", "Edit page name/url", crsaPage.url, "/page.html", null, function(val) {
                        crsaPage.rename(val);
                        crsaPage.setPageChanged(true);
                        pageTabs.updateDisplay();
                        if(isApp()) {
                            showAlert("Use \"File -> Save as\" to actually store it under the new name.", "Notice");
                        }
                    });
                });

                canvas.on('crsa-page-saved-as', function(event, crsaPage) {
                    pageTabs.updateDisplay();
                });

                canvas.on('click', function(e) {
                    if(e.target == canvas.get(0)) {
                        selectElement(null);
                        e.preventDefault();
                    }
                });

                //$(document).keypress(function(event){if (event.keyCode == 8) {return false;}});
                //$(document).keydown(function(event){if (event.keyCode == 8) {return false;}});


                $(document).on('keydown', function(e) {
                    return methods.processKeydownEvent(e);
                });



                ///INIT FINISHED

                //manualActivation();

                if(crsaIsBig()) {

                    //test
                    //crsaStorage.setValue('validDate', 0);

                    canUseThisVersion( function(can_use, last_version) {

                    });

                }

            }

            return this;
        },
        addTemplateProject : function(project, index) {
            if(typeof index == 'undefined' || index === null) {
                crsaTemplateProjects.push(project);
            } else {
                crsaTemplateProjects.splice(index, 0, project);
            }
        },
        getPageTabs : function() {
            return pageTabs;
        },
        clickOnMenu : function($m) {
            setTimeout(function() {
                $m.trigger('click');
            }, 20);
        },
        processKeydownEvent : function(e) {
            var $t = $(e.target);
            var input = $t.is('input,textarea,select') && !$t.is('#crsa-dummy-field');
            var edit = input && $t.closest('.CodeMirror').length > 0;
            var inline_edit = $t.closest('[contenteditable="true"]').length > 0;
            var edit = edit || inline_edit || crsaIsInEdit();

            var ctrl = is_mac ? e.metaKey : e.ctrlKey;
            e.pgCtrlKey = ctrl;

            if(is_windows && e.ctrlKey && e.altKey) {
                ctrl = false; //could be AltGR, chrome bug
            }

            if((e.which == 8 || e.which == 46) && !input && !edit) {
                methods.clickOnMenu( $('.crsa-inline-menu .crsa-inline-menu-delete'));
                return false; //STOP BACK WITH BACKSPACE

            } else if(e.which == 27) {
                if(crsaIsInEdit()) {
                    crsaEndEditModeIfActive();
                    return false;
                }
            } else if(e.which == 68 && !input && !edit) {
                methods.clickOnMenu( $('.crsa-inline-menu .crsa-inline-menu-duplicate'));
                return false; //DUPLICATE ELEMENT D

            } else if(e.which == 83 && ctrl) { //SAVE CTRL+S

                if(e.altKey) {
                    methods.clickOnMenu( $('#crsa-topbar .menu-file-save-all'));
                } else {
                    if(e.shiftKey) {
                        methods.clickOnMenu( $('#crsa-topbar .menu-file-save-as'));
                    } else {
                        methods.clickOnMenu( $('#crsa-topbar .menu-file-save'));
                    }
                }
                return false;

            } else if(e.which == 82 && ctrl) { // RELOAD PAGE CTRL + R
                if(selectedCrsaPage) {
                    if(codeEditor.isInEdit(selectedPage)) {
                        codeEditor.refreshPreview();
                    } else {
                        methods.clickOnMenu( selectedCrsaPage.$page.find('.crsa-refresh'));
                    }
                }
                return false;

            } else if(e.which == 66 && ctrl) { // Preview CTRL + B
                if(selectedCrsaPage) {
                    methods.clickOnMenu( selectedCrsaPage.$page.find('.crsa-preview'));
                }
                return false;

            } else if(e.which == 69 && ctrl) { // EDIT CODE CTRL + E
                if(selectedCrsaPage) {
                    if(codeEditor.isInEdit(selectedPage)) {
                        codeEditor.exitEdit(true);
                    } else {
                        methods.clickOnMenu( selectedCrsaPage.$page.find('.crsa-code'));
                    }
                }
                return false;

            } else if(e.which == 88 && ctrl && false) { // CLOSE PAGE CMD - X
                methods.clickOnMenu( $('#crsa-topbar .menu-file-close'));
                return false;

            } else if((e.which == 67 && !e.shiftKey && !input && !edit && !ctrl) || (e.which == 72 && ctrl && !e.shiftKey)) { //ELEMENT EDIT CODE C or CMD + H
                //console.log('edit code');
                methods.clickOnMenu( $('.crsa-inline-menu .action-edit-code'));
                return false;

            }  else if(e.which == 82 && !input && !edit && !ctrl) { //ELEMENT SHOW CSS RULES R
                //console.log('edit code');
                methods.clickOnMenu( $('.crsa-inline-menu .action-show-rules'));
                return false;

            } /*else if(e.which == 79 && !input && !edit && !ctrl) { //ELEMENT Add as component
             //console.log('edit code');
             methods.clickOnMenu( $('.crsa-inline-menu .action-add-comp'));
             return false;

             }*/ else if(e.which == 90 && ctrl) {
                if(codeEditor.isEditorFocused() && codeEditor.editorHandlesUndo) {
                    //let editor handle undo
                } else {
                    if($(document.activeElement).closest('.code-edit').length == 0) {
                        if(e.shiftKey) {
                            methods.clickOnMenu($('#crsa-redo'));
                        } else {
                            methods.clickOnMenu($('#crsa-undo'));
                        }
                    }
                }
                return false;
            } else if(ctrl && e.which == 49) {
                showTab('lib');
            } else if(ctrl && e.which == 50) {
                showTab('prop');
            } else if(ctrl && e.which == 51) {
                showTab('css');
            } else if(ctrl && e.which == 52) {
                showTab('act');
            } else if(ctrl && e.which == 53) {
                showTab('wp');
            } else if(ctrl && e.which == 54) {
                showTab('project');
            } else {
                var status = {done: false, input: input, edit: edit};
                pinegrow.callGlobalFrameworkHandler('on_key_pressed', e, status);
                if(status.done) {
                    return false;
                }
            }

            return true;
        },
        getEditor : function() {
            return editor;
        },
        reloadPage : function(crsaPage, set_source) {
            crsaPage.clearAssetsCache();
            selectElement(null);
            highlightElement(null);
            crsaPage.loadingStart(function() {
                onLoadDone(crsaPage);
            });
            if(set_source) {
                crsaPage.load_source = crsaPage.getSource();
            }

            $.fn.crsapages('reloadPage', crsaPage, function($iframe, crsaPage) {

                if(!crsaPage.frameworks_added) {
                    crsaPage.detectAndAddFrameworks();
                }

                methods.updateStructureAndWireAllElemets(crsaPage.$iframe);

                $.fn.crsacss('loadLessStyles', $iframe.get(0), function() {

                    if(crsaPage.breakpoints.length == 0) {
                        crsaPage.getBreakpointsFromCss(function(list) {
                            if(list.length) {
                                crsaPage.setAllBreakpoints(list);
                                crsaQuickMessage("Got responsive breakpoints from CSS.", 2000);
                                $('body').trigger('crsa-breakpoints-changed');
                            }
                            onLoadDone(crsaPage);
                            crsaPage.loadingDone();
                        });
                    } else {

                        onLoadDone(crsaPage);
                        crsaPage.loadingDone();
                    }
                });
                addScrollHandlerToFrame($iframe);

            });
        },
        refreshPage : function(crsaPage) {
            var sel_pgid = null;
            if(selectedElement && selectedElement.type == 'element') {
                sel_pgid = selectedElement.data.attr('data-pg-id');
            }
            var is_selected_page = crsaPage == pinegrow.getSelectedPage();

            if(is_selected_page) {
                selectElement(null);
                highlightElement(null);
            } else {
                sel_pgid = null;
            }

            var st = $(crsaPage.getBody()).scrollTop();
            //console.log('Scroll top = ' + st);

            /*crsaPage.loadingStart(function() {
             onLoadDone(crsaPage);
             });*/

            $.fn.crsapages('reloadPage', crsaPage, function($iframe, crsaPage) {

                //methods.updateStructureAndWireAllElemets(crsaPage.$iframe);

                var stop_check = false;

                var onCheck = function() {
                    if(stop_check && check_interval) {
                        clearInterval(check_interval);
                        //return;
                    }
                    if(sel_pgid) {
                        var $el = crsaPage.getElementWithPgId(sel_pgid);
                        if($el) {
                            selectElement($el);
                            sel_pgid = null;
                        }
                    }
                    if(st > 0) {
                        var cst = $(crsaPage.getBody()).scrollTop();
                        if(st > 0 && Math.abs(cst - st) > st*0.1) {
                            $(crsaPage.getBody()).scrollTop(st);
                        } else {
                            st = 0;
                        }
                    }

                    crsaPage.addCrsaStyles();

                    if(!sel_pgid && st == 0 && check_interval) {
                        clearInterval(check_interval);
                    }
                }

                $iframe.one('load', function() {
                    if (crsaPage == pinegrow.getSelectedPage()) {
                        methods.updateStructureAndWireAllElemets(crsaPage.$iframe);
                    } else {
                        crsaPage.treeRepaintOnShow = crsaPage.get$Html();
                    }

                    $.fn.crsacss('loadLessStyles', $iframe.get(0), function() {
                        onLoadDone(crsaPage);
                        //crsaPage.loadingDone();
                        onCheck();
                    }, crsaPage.wrapper_url ? true : false /* inc dynamic */);
                    stop_check = true;
                });
                addScrollHandlerToFrame($iframe);

                var check_interval = setInterval(onCheck, 200);

            }, null, true);
        },
        refreshSelectElement : function() {
            if(selectedElement && selectedElement.type == 'element') {
                selectElement(selectedElement.data);
            }
        },
        openPage : function(url, done, onSourceLoaded, providedCrsaPage, onCssLoaded, options) {
            var first = canvas.find('.page').length == 0;

            //mtch ---- url = crsaRemoveUrlParameters(url);

//providedCrsaPage, onLoadCanceled, options
            canvas.crsapages('addPage',url, function($iframe, crsaPage) {

                //  try {
                if(onSourceLoaded) onSourceLoaded(crsaPage);
                var start_ms = (new Date()).getTime();

                if(!crsaPage.frameworks_added) {
                    crsaPage.detectAndAddFrameworks();
                }

                crsaPage.updatePageMenus();

                $iframe.crsa('buildTree', $iframe);
                var elapsed_ms = (new Date()).getTime() - start_ms;
                //console.log('Doc tree built '+ elapsed_ms + ' ms');

                if(first) {
                    first = false;
                    setSelectedPage($iframe);
                    crsaTree.showTreeForIframe($iframe);
                    //$iframe.crsa('createTreeWidget', $iframe, $('#crsa-tree'), getTreeRootForElement(null, $iframe));

                }


                $('body').trigger('crsa-page-added', $iframe.get(0));

                pageTabs.addPage(crsaPage);
                // } catch(err) {
                //      console.log(err);
                //  }

                //check if we have a background page that was loaded
                var project = pinegrow.getCurrentProject();
                if(project) {
                    var bck_page = project.getBackgroundPageForUrl(crsaPage.url);
                    if(bck_page) {
                        crsaPage.setPageChanged(true, true);
                        project.removeBackgroundPageForUrl(crsaPage.url);
                    }
                }

                //is file currently open in Edit code only?
                if(codeEditor.isEditingCodeOnlyPage(crsaPage.url)) {
                    codeEditor.exitEdit(false);
                }

                $.fn.crsacss('loadLessStyles', $iframe.get(0), function() {

                    var doLoadDone = function() {
                        if(onCssLoaded) onCssLoaded(crsaPage);
                        onLoadDone(crsaPage);
                        crsaPage.loadingDone();
                        crsaPage.autoSize();

                        if(customLogic.onPageLoaded) {
                            customLogic.onPageLoaded(crsaPage);
                        }

                        $('body').trigger('crsa-page-loaded', $iframe.get(0));
                    }

                    if(crsaPage.breakpoints.length == 0) {
                        crsaPage.getBreakpointsFromCss(function(list) {
                            if(list.length) {
                                crsaPage.setAllBreakpoints(list);
                                crsaQuickMessage("Got responsive breakpoints from CSS.", 2000);
                                $('body').trigger('crsa-breakpoints-changed');
                            }
                            doLoadDone();
                        });
                    } else {
                        doLoadDone();
                    }

                    if(!crsaPage.javascriptEnabled && crsaPage.hasScripts(1)) {
                        crsaQuickMessage("Page has Javascript elements but Javascript is disabled.");
                    }

                }, crsaPage.wrapper_url ? true : false /* incl dynamic stylesheets */);

                addScrollHandlerToFrame($iframe);

                if(done) done(crsaPage);
            }, providedCrsaPage, onLoadDone, options);
        },
        getSourceOfPage : function($iframe) {
            var doc = getIframeDocument($iframe[0]);
            var $html = $(doc).find('> html');
            return $html.length > 0 ? $html[0].innerHTML : '';
        },
        setSourceOfPage : function($iframe, src) {
            var doc = getIframeDocument($iframe[0]);
            var $html = $(doc).find('> html');
            if($html.length > 0) $html[0].innerHTML = src;
        },
        resizeChrome : function() {
            resizeChrome();
        },
        editCode : function($iframe, codeOnlyPage) {
            var editor = $.trim(pinegrow.getSetting('code-editor', ''));
            if(!editor || true) {
                codeEditor.editCode($iframe, null, codeOnlyPage);
            } else {
                var cp = getCrsaPageForIframe($iframe);

                var spawnargs = require('spawn-args');

                var args = spawnargs(editor);

                crsaRunExternalCommand(editor, '', function() {

                });
            }
            return this;
        },
        getSelectedPage : function() {
            return selectedPage;
        },
        getSelectedElement : function() {
            return selectedElement;
        },
        getSelectedCrsaPage : function() {
            return selectedCrsaPage;
        },
        showSelectedInsertFactory : function($el, defs) {
            var $lib = $('#crsa-elements');
            var $main_ul = $lib.find('ul.selected-insert');
            var $dest = $main_ul.find('>li');

            if(!$el) {
                $main_ul.hide();
                return;
            }

            defs = defs ? defs : selectedCrsaPage.getAllTypes($el);

            var add = [];
            $.each(defs, function(i, def) {
                if(def.action_menu && def.action_menu.add) {
                    add.push(def.action_menu);
                }
            });

            if(!add.length) {
                $main_ul.hide();
                return;
            }

            var $h = $dest.find('> div > h2');
            $h.html('Insert into selected <small>' + getElementName($el) + '</small>');
            var $ul = $dest.find('>ul').html('');


            var tooltip_shown = false;

            $.each(add, function(i, action_menu) {
                $.each(action_menu.add, function(j, type) {
                    var def = selectedCrsaPage.getTypeDefinition(type);
                    if(def) {
                        var $item = $('<li/>', { 'class' : 'crsa-factory-element crsa-factory-element-' + def.type }).html('<div>' + def.name + ' »</div>').data('crsa-factory-def', def);
                        $item.data('action-menu', action_menu);
                        $item.appendTo($ul);
                    }
                });
            });
            $ul.find('li.crsa-factory-element').off('.sfactory')
                .on('mouseenter.sfactory', function(e) {
                    var $li = $(e.delegateTarget);
                    var def = $li.data('crsa-factory-def');
                    if(last_previewed_def && last_previewed_def == def) {
                        return;
                    }
                    if(!$li.data('in-air')) {
                        var $el = createPreviewElementFromDefinition(def);
                        if($el || true) {
                            methods.showPreview($li, $el, def.preview_image ? 'with-image' : null, getPreviewPosition, removeCrsaClassesFromHtml(getCodeFromDefinition(def)));
                        }
                        setLastPreviewedDef(def);
                    }
                    if(!tooltip_shown) {
                        tooltip_shown = true;
                        $li.tooltip({
                            container: 'body',
                            trigger: 'manual',
                            title: 'Click to append to the selected element. Right click for placement options.'
                        });
                        $li.tooltip('show');
                        setTimeout(function() {
                            $li.tooltip('destroy');
                        }, 4000);
                    }
                })
                .on('mouseleave.sfactory', function(e) {
                    methods.hidePreview();
                    setLastPreviewedDef(null);
                    $('.tooltip').remove();
                    console.log('mouseleave ' + e.which);
                })
                .on('mousedown.sfactory', function(e) {
                    var $li = $(e.delegateTarget);
                    var def = $li.data('crsa-factory-def');
                    methods.hidePreview();
                    setLastPreviewedDef(def);
                    $('.tooltip').remove();
                })
                .on('click.sfactory', function(e) {
                    var $el = $(e.delegateTarget);
                    e.preventDefault();
                    methods.hidePreview();
                    if(!selectedElement || selectedElement.type != 'element') return;
                    var am = $el.data('action-menu');
                    var def = $el.data('crsa-factory-def');
                    insertThroughActionMenu(am, selectedElement.data, def, false);
                })
                .on('contextmenu.sfactory', function(e) {
                    var $li = $(e.delegateTarget);
                    var def = $li.data('crsa-factory-def');
                    var am = $li.data('action-menu');
                    e.stopPropagation();
                    e.preventDefault();
                    methods.hidePreview();

                    if(!selectedElement || selectedElement.type != 'element') return;
                    var $menu = new CrsaContextMenu();

                    var name = getElementName(selectedElement.data);

                    $menu.add("Insert", null, null, 'header');

                    $menu.add("<b>Prepend</b> to selected <b>" + name + "</b>", null, function() {
                        insertThroughActionMenu(am, selectedElement.data, def, false, true);
                        setLastPreviewedDef(def);
                    });
                    $menu.add("<b>Append</b> to selected <b>" + name + "</b>", null, function() {
                        insertThroughActionMenu(am, selectedElement.data, def, false, false);
                        setLastPreviewedDef(def);
                    });

                    if(isApp()) {

                        $menu.add("", null, null, 'divider');
                        //$menu.add("Insert", null, null, 'header');

                        $menu.add("Copy code", null, function() {
                            var code = getCodeFromDefinition(def);
                            copyCodeToClipboard(code);
                            setLastPreviewedDef(def);
                        });
                    }

                    $menu.showAt(e.pageX, e.pageY);
                });


            $main_ul.show();
        },
        showIntroScreen : function() {
            showIntroScreen();
        },
        showElementDescription : function($desc, obj, def) {
            $desc.html('');
            if(!obj) return;
            if(obj.type == 'element') {
                $('<li/>').html(getObjectName(obj, def, true, true, false, true)).appendTo($desc);
                var level = 0;
                var showParents = crsaStorage.getValue('showElementParents') == 'true';
                var max_level = showParents ? 999 : 1;
                if(!obj.data.is('body,head,html')) {
                    var $pel = obj.data.parent();
                    while($pel.length > 0 && !$pel.is('body')) {
                        if(level >= max_level) {
                            $('<li/>', {class: 'parent'}).html('<i class="fa fa-angle-double-right"></i>').prependTo($desc);
                            break;
                        }
                        var $li = $('<li/>', {class: 'parent'}).html(getElementName($pel, null, true, true, false, true)).prependTo($desc);
                        $li.data('element', $pel);

                        $pel = $pel.parent();
                        level++;
                    }
                    if(showParents) {
                        $('<li/>', {class: 'parent'}).html('<i class="fa fa-angle-double-left"></i>').prependTo($desc);
                    }
                }
                $desc.find('li.parent').on('click', function(e) {
                    e.preventDefault();
                    var $el = $(e.delegateTarget).data('element');
                    if($el) {
                        selectElement($el);
                    } else {
                        crsaStorage.setValue('showElementParents', showParents ? 'false' : 'true');
                        methods.showElementDescription($desc, obj);
                    }
                })
            } else {
                $('<li/>').html(getObjectName(obj, def, true, true, false, true)).appendTo($desc);
            }
        },
        addActionToElement : function(pgel, action_def, cp, $el) {
            if(!cp) cp = pinegrow.getCrsaPageOfPgParserNode(pgel);
            if(!$el) $el = cp.getElementFromPgParserNode(pgel);

            if(action_def.get_element_for_action) {
                $el = action_def.get_element_for_action($el);
                pgel = getElementPgNode($el);
            }
            if(action_def.attribute) {
                pgel.setAttr(action_def.attribute, pgel.getData(action_def.attribute, action_def.attribute_default ? action_def.attribute_default : null));
                if($el) {
                    var val = pgel.getData(action_def.attribute, action_def.attribute_default ? action_def.attribute_default : '');
                    if(val === null) val = '';
                    $el.attr(action_def.attribute, val);
                }
            }
            var attrs = action_def.getActionParameters();
            $.each(attrs, function(i, p) {
                if(p.default || pgel.getData(p.name)) {
                    pgel.setAttr(p.name, pgel.getData(p.name, p.default));
                    if($el) {
                        var val = pgel.getData(p.name, p.default);
                        if(val === null) val = '';
                        $el.attr(p.name, val);
                    }
                }
            });
            if(action_def.on_action_added) {
                action_def.on_action_added(pgel, cp, action_def, $el);
            }
            return pgel;
        },
        addActionToElementForPreview : function(pgel, action_def, remove_other) {

            if(!methods.hasElementAction(pgel, action_def)) {
                if(action_def.attribute) {
                    pgel.setAttr(action_def.attribute, action_def.attribute_default ? action_def.attribute_default : null);
                }
                var attrs = action_def.getActionParameters();
                $.each(attrs, function(i, p) {
                    if(p.default) {
                        pgel.setAttr(p.name, p.default);
                    }
                });
            }
            if(remove_other) {
                var allow = [];
                if(action_def.attribute) allow.push(action_def.attribute);
                var attrs = action_def.getActionParameters();
                $.each(attrs, function(i, p) {
                    allow.push(p.name);
                });

                var remove = [];
                var list = pgel.getAttrList();
                for(var i = 0; i < list.length; i++) {
                    if(list[i].name.indexOf('wp-') == 0) { //hack
                        if(allow.indexOf(list[i].name) < 0) {
                            remove.push(list[i].name);
                        }
                    }
                }
                for(var i = 0; i < remove.length; i++) {
                    pgel.removeAttr(remove[i]);
                }
            }
        },
        removeActionFromElement : function(pgel, action_def, cp, $el) {
            if(!cp) cp = pinegrow.getCrsaPageOfPgParserNode(pgel);
            if(!$el) $el = cp.getElementFromPgParserNode(pgel);
            if(action_def.get_element_for_action) {
                $el = action_def.get_element_for_action($el);
                pgel = getElementPgNode($el);
            }

            if(action_def.attribute) {
                pgel.setData(action_def.attribute, pgel.getAttr(action_def.attribute));
                pgel.removeAttr(action_def.attribute);
                if($el) {
                    $el.removeAttr(action_def.attribute);
                }
            }
            var attrs = action_def.getActionParameters();
            $.each(attrs, function(i, p) {
                if(p.name != action_def.attribute) pgel.setData(p.name, pgel.getAttr(p.name));
                pgel.removeAttr(p.name);
                if($el) {
                    $el.removeAttr(p.name);
                }
            });
            if(action_def.on_action_removed) {
                action_def.on_action_removed(pgel, cp, action_def, $el);
            }
            return pgel;
        },
        hasElementAction : function(pgel, action_def) {
            if(action_def.has_action) {
                return action_def.has_action(pgel);
            }
            return action_def.attribute && pgel.hasAttr(action_def.attribute);
        },
        showActions : function() {
            var actions = new CrsaActionsPanel("ACT");
            actions.showAssignedActions = false;
            actions.show($('#crsa-actions'));
            var cms = new CrsaActionsPanel("CMS");
            cms.show($('#crsa-cms'));
        },
        showFactory : function() {
            var $lib = $('#crsa-elements');

            var filter = null;
            var $header = $lib.find('>.header');
            var $input = $('<input/>', {class: 'form-control filter-form', placeholder: 'search'}).appendTo($header);
            crsaAddCancelSearch($input, 'top: 16px;right: 47px;');

            /* var $cancel = $('<a/>', {class: 'btn btn-link', href: '#'}).html('&times;').appendTo($lib).on('click', function(e) {
             e.preventDefault();
             $input.val('').trigger('input');
             })*/
            var $manage = $('<a href="#" class="icon-action"><i class="fa fa-cog"></i></a>').appendTo($header);
            $manage
                .on('click', function(e) {
                    if(selectedCrsaPage || true) {
                        $.fn.crsacss('showFrameworkManager', selectedCrsaPage);
                        e.preventDefault();
                    } else {
                        showAlert("Open a page first!");
                    }
                })
                .tooltip({container: 'body', placement: 'bottom', title: 'Manage libraries and plugins.', trigger: 'hover'});
            ;

            var $content = $lib.find('>.content');

            $('<ul class="selected-insert"><li class="section"><div><h2></h2></div><ul></ul><div class="insert-help">Right click for options.</div></li></ul>').appendTo($content).hide();

            var $list = $('<ul/>').appendTo($content);

            var preview = null;

            var currentPage = null;

            var pageChanged = function(crsaPage) {
                var sections = null;
                var changed = false;

                currentPage = crsaPage;

                if(!crsaPage) {
                    changed = true;
                    //$manage.hide();
                } else {
                    sections = crsaPage.getLibSections();
                    if(currentFactoryLibSections == null || sections == null) {
                        changed = true;
                    } else {
                        if(currentFactoryLibSections.length != sections.length) {
                            changed = true;
                        } else {
                            for(var i = 0; i < sections.length; i++) {
                                if(sections[i] != currentFactoryLibSections[i]) {
                                    changed = true;
                                    break;
                                }
                            }
                        }
                    }
                    //$manage.show();
                }
                if(changed) {
                    updateList(sections);
                }
            }

            $('body').on('crsa-page-selected', function(e, crsaPage) {
                pageChanged(crsaPage);
            });

            $('body').on('crsa-update-lib-display', function(e) {
                updateList();
            });

            $('body').on('crsa-element-selected', function(e, crsaPage) {
                if(currentPage != selectedCrsaPage) {
                    pageChanged(selectedCrsaPage);
                }
            });

            $('body').on('crsa-frameworks-changed', function(e) {
                updateList();
                if(selectedCrsaPage && selectedCrsaPage.treeTop) {
                    var $body = $(getIframeBody(selectedCrsaPage.$iframe.get(0)));
                    $body.find('*').data('crsa-def', null);
                    $body.data('crsa-def', null);
                    methods.updateStructureAndWireAllElemets(selectedCrsaPage.$iframe);
                }
            });

            var updateList = function(sections) {
                $list.html('');

                filter = $input.val();
                var filterRegEx = filter && filter.length > 0 ? new RegExp(escapeRegExp(filter),'i') : null;
                /*   if(filterRegEx) {
                 $cancel.show();
                 } else {
                 $cancel.hide();
                 }*/

                if(!selectedCrsaPage) {
                    currentFactoryLibSections = null;
                    return;
                }

                if(!sections) sections = selectedCrsaPage.getLibSections();
                currentFactoryLibSections = sections;

                $.each(sections, function(i, sec_def) {

                    var cat_match = true;
                    if(filterRegEx) cat_match = sec_def.name.match(filterRegEx);

                    var $tit;
                    var classes = "section";
                    if (sec_def.closed) {
                        classes += " section-closed";
                    }
                    if(!sec_def.framework.user_lib) {
                        $tit = $('<li/>', {class: classes}).html('<div><h2 class="section-title">' + sec_def.name + '<small> / ' + sec_def.framework.name + '</small><i class="fa fa-caret-right closed"></i><i class="fa fa-caret-down opened"></i></h2></div>').appendTo($list);
                    } else {
                        var changed = sec_def.framework.changed ? '*' : '';
                        $tit = $('<li/>', {class: classes}).html('<div><h2 class="section-title"><a href="#" data-toggle="dropdown">' + sec_def.name + '<small> / ' + sec_def.framework.name + changed + ' <span class="caret"></span></small></a></h2></div>').appendTo($list);
                        var $a = $tit.find('h2 > a');
                        var id = getUniqueId('section');
                        $a.attr('data-target', '#' + id);
                        var $ul = $('<ul class="dropdown-menu context-menu" style="left:auto;right:0;" role="menu"></ul>');
                        var $div = $tit.find('>div');
                        $div.attr('id', id).css('position', 'relative');
                        $('<li><a href="#" class="add">Add as HTML snippet</a></li>').appendTo($ul);
                        $('<li><a href="#" class="save">Save</a></li>').appendTo($ul);
                        $('<li><a href="#" class="save-as">Save as...</a></li>').appendTo($ul);

                        (function(sec_def, $ul){
                            $ul.find('a.add').on('click', function(e) {
                                e.preventDefault();
                                if(selectedElement) {
                                    var $el = selectedElement.data;
                                    addAsComponent($el, sec_def.framework);
                                } else {
                                    showAlert("First select the element on the page than add it to the library as component.");
                                }
                            });

                            $ul.find('a.save').on('click', function(e) {
                                e.preventDefault();
                                if(!isApp()) {
                                    showDownloadsScreen("Please use the Pinegrow desktop app to work with component libraries.");
                                } else {
                                    if(sec_def.framework.pluginUrl) {
                                        sec_def.framework.save(sec_def.framework.pluginUrl, function() {
                                            crsaQuickMessage("Library saved.");
                                            pinegrow.frameworksChanged();
                                        });
                                    } else {
                                        $ul.find('a.save-as').trigger('click');
                                    }
                                }
                            });

                            $ul.find('a.save-as').on('click', function(e) {
                                e.preventDefault();
                                if(!isApp()) {
                                    showDownloadsScreen("Please use the Pinegrow desktop app to work with component libraries.");
                                } else {
                                    crsaChooseFile(function(url, file) {
                                        sec_def.framework.save(file, function() {
                                            crsaQuickMessage("Library saved.");
                                            pinegrow.frameworksChanged();
                                        });
                                    }, sec_def.framework.getFileName());
                                }
                            });
                        })(sec_def, $ul);

                        $div.append($ul);
                        $a.dropdown();
                    }
                    $tit.data('section_def', sec_def);
                    var $dest = $('<ul/>').appendTo($tit);
                    var empty = true;
                    $.each(sec_def.getComponentTypes(), function(i, eltype) {

                        var def = eltype;
                        if(def) {
                            if(filterRegEx) {
                                if(!cat_match && !def.name.match(filterRegEx)) {
                                    return true;
                                }
                            }
                            var $item;
                            if(def.button_image) {
                                var src = def.framework.getImagePreviewBaseUrl() + def.button_image + '?z=' + pinegrow.cache_breaker;
                                $item = $('<li/>', { 'class' : 'crsa-factory-element-image crsa-factory-element crsa-factory-element-' + def.type }).html('<div><figure><img alt="' + def.name + '" src="' + src + '"/></figure><name>' + def.name + '</name></div>').data('crsa-factory-def', def);
                            } else {
                                $item = $('<li/>', { 'class' : 'crsa-factory-element crsa-factory-element-' + def.type }).html('<div>' + def.name + '</div>').data('crsa-factory-def', def);
                            }
                            $item.appendTo($dest);
                            var defdata = $item.data();
                            empty = false;
                        }

                    });
                    if(empty && (!sec_def.framework.user_lib || filterRegEx)) $tit.remove();
                });

                $list.nestedSortable('refresh');

                var dbl_timer = null;
                var tooltip_active = false;

                $list.find('li.crsa-factory-element')
                    .on('mouseenter.factory', function(e) {

                        var $li = $(e.delegateTarget);
                        var def = $li.data('crsa-factory-def');
                         //console.log('mouseenter', last_previewed_def, def);
                        if(last_previewed_def && last_previewed_def == def) {
                            return;
                        }
                        if(!$li.data('in-air')) {
                            var $el = createPreviewElementFromDefinition(def);

                            if($el || true) {
                                methods.showPreview($li, $el, def.preview_image ? 'with-image' : null, getPreviewPosition, removeCrsaClassesFromHtml(getCodeFromDefinition(def)), def.description || null);
                            }
                            setLastPreviewedDef(def);
                        }
                    })
                    .on('mouseleave.factory', function(e) {
                        methods.hidePreview();
                        if(e.which == 0) {
                            setLastPreviewedDef(null);
                        }
                        $('.tooltip').remove();
                        //console.log('mouseleave ' + e.which);
                    })
                    .on('mousedown.factory', function(e) {
                        var $li = $(e.delegateTarget);
                        var def = $li.data('crsa-factory-def');
                        methods.hidePreview();
                        setLastPreviewedDef(def);
                        $('.tooltip').remove();
                    })
                    .on('dblclick.factory', function(e) {
                        e.preventDefault();
                    })
                    .on('click.factory', function(e) {
                        var $el = $(e.delegateTarget);
                        e.preventDefault();
                        methods.hidePreview();

                        if(!tooltip_active) {
                            $el.tooltip({
                                container: 'body',
                                trigger: 'manual',
                                title: 'Drag & Drop me on the page or on the tree. Right click to insert into the selected element.'
                            });
                            $el.tooltip('show');
                            setTimeout(function() {
                                $el.tooltip('destroy');
                                tooltip_active = false;
                            }, 4000);
                            dbl_timer = null;
                            tooltip_active = true;
                        }

                    })
                    .on('contextmenu', function(e) {

                        var $li = $(e.delegateTarget);
                        var def = $li.data('crsa-factory-def');
                        var fm = def.framework;

                        e.stopPropagation();
                        e.preventDefault();
                        methods.hidePreview();

                        var $menu = new CrsaContextMenu();

                        if(fm.user_lib) {
                            $menu.add("", null, null, 'divider');
                            $menu.add("Component", null, null, 'header');

                            $menu.add("Rename...", null, function() {
                                showPrompt("Enter the new name for the component:", "Rename component", def.name, null, null, function(name) {
                                    if(name && def.name != name) {
                                        def.name = name;
                                        fm.changed = true;
                                        pinegrow.frameworksChanged();
                                    }
                                });
                            });
                            $menu.add("Update", null, function() {
                                if(selectedElement) {
                                    var $el = selectedElement.data;
                                    showAlert("Do you want to update component <b>" + def.name + "</b> with the content of element <b>" + getElementName($el, null, false, true, true) + "</b>?", "Confirm update", "Cancel", "Update it", null, function() {
                                        copyElementToDef($el, def, selectedCrsaPage, false);
                                        fm.changed = true;
                                        pinegrow.frameworksChanged();
                                        crsaQuickMessage("Component updated");
                                    });
                                } else {
                                    showAlert("First select the element on the page that you'll use to update the component with.");
                                }
                            });

                            $menu.add("Delete", null, function() {
                                showAlert("Are you sure? Deleting component <b>" + def.name + "</b> can't be undone.", "Confirm delete", "Cancel", "Delete it", null, function() {
                                    fm.removeComponentType(def);
                                    fm.changed = true;
                                    pinegrow.frameworksChanged();
                                });
                            });
                        }
                        if(selectedElement && selectedElement.type == 'element') {
                            var am = findActionMenuForInsertingDefIntoEl(def, selectedElement.data);

                            var name = getElementName(selectedElement.data);

                            $menu.add("", null, null, 'divider');
                            $menu.add("Insert", null, null, 'header');

                            $menu.add("Prepend to <b>" + name + "</b>", null, function() {
                                insertThroughActionMenu(am, selectedElement.data, def, false, true);
                                setLastPreviewedDef(def);
                            });
                            $menu.add("Append to <b>" + name + "</b>", null, function() {
                                insertThroughActionMenu(am, selectedElement.data, def, false, false);
                                setLastPreviewedDef(def);
                            });
                            $menu.add("Insert before <b>" + name + "</b>", null, function() {
                                insertBeforeOrAfter(selectedElement.data, def, false, false);
                                setLastPreviewedDef(def);
                            });
                            $menu.add("Insert after <b>" + name + "</b>", null, function() {
                                insertBeforeOrAfter(selectedElement.data, def, false, true);
                                setLastPreviewedDef(def);
                            });
                        }


                        if(isApp()) {

                            $menu.add("", null, null, 'divider');
                            //$menu.add("Insert", null, null, 'header');

                            $menu.add("Copy code", null, function() {
                                var code = getCodeFromDefinition(def);
                                copyCodeToClipboard(code);
                                setLastPreviewedDef(def);
                            });
                        }

                        var actions = [];
                        selectedCrsaPage.callFrameworkHandler('on_build_lib_actions_menu', actions, def);

                        for(var i = 0; i < actions.length; i++) {
                            $menu.add(actions[i].label, null, actions[i].action);
                        }
                        $menu.showAt(e.pageX, e.pageY);
                    });

                var collapsibleSections = new CrsaCollapsibleSections($list);
                collapsibleSections.show(function ($section) {
                    return $section.data('section_def');
                });
            }

            var $this = $(this);
            var def = null;

            var active_$el = null;
            // $('#crsa-elements li.crsa-factory-element').sortable({
            $list.nestedSortable({
                helper: function(event, li) {
                    var $el = $(event.target).closest('li.crsa-factory-element');
                    def = $el.data('crsa-factory-def');

                    if(!def) return null;

                    factoryCopyHelper = li.clone(true).insertAfter(li);

                    //$el.off('.factory');
                    $el.data('in-air', true);
                    active_$el = $el;
                    draggedFactoryElement = $el;
                    draggedOverInvalidParent = false;
                    def = $el.data('crsa-factory-def');

                    var $del = createElementFromDefinition(def).data('crsa-factory-def', def);
                    draggedPlaceholderElement = createElementFromDefinition(def);

                    /*
                    var inline = ['inline','inline-block'].indexOf(draggedPlaceholderElement.css('display')) >= 0;

                    draggedPlaceholderElement = $('<div style="padding:0;margin-top:0;margin-bottom:0;min-height:8px;display:inline-block;width:100%;height:8px;background:blue;"></div>').data('crsa-def', def);

                    if(inline) {
                        draggedPlaceholderElement.css('width', '8px').css('height', '100%');
                    }
                    */
                    //$el.data('crsa-element', draggedPlaceholderElement);

                    crsaTree.assignTreeNodeToElement($el, draggedPlaceholderElement, true);

                    if(def.drag_helper) {
                        $del = $(def.drag_helper).data('crsa-factory-def', def);
                    } else if(def.preview_image) {
                        $del = createPreviewElementFromDefinition(def).data('crsa-factory-def', def);
                    }
                    //return $('<h1>aaaa</h1>').get(0);
                    return $del[0];
                },
                forcePlaceholderSize: false,
                aahelper:	'clone',
                placeholder: false,
                appendTo: document.body,
                handle: 'div',
                tabSize: 25,
                tolerance: 'pointer',
                scroll: false,
                isTree : false,
                items: 'li.crsa-factory-element',
                listType: 'ul',
                toleranceElement: '> div',
                aaacancel: ".section",
                //iframeFix: true,
                isAllowed: function(placeholder, placeholderParent, originalItem) {
                    if(!placeholderParent || placeholderParent.hasClass('crsa-factory-element')) return false;
                    //console.log(placeholder, placeholderParent, originalItem);
                    return true;
                },
                connectWith: '#crsa-tree > div.tree-container > ul'
            }).on( "sortremove", function( event, ui ) {

            }).on('sortstop', function(event, ui) {
                factoryCopyHelper && factoryCopyHelper.remove();

                canvas.crsapages('showOverlays', true);

                var orig_def;
                var remove = false;

                if(draggedPlaceholderElement) {
                    var def = getType(draggedPlaceholderElement);
                    orig_def = def;
                    draggedPlaceholderElement.data('crsa-def', null);

                    if(draggedOverInvalidParent && !getIframeOfElement(draggedPlaceholderElement)) {
                        if(def.invalid_drop_msg) {
                            showAlert(def.invalid_drop_msg, "Can't put it here");
                        } else if(def.parent_selector && typeof def.parent_selector == 'string') {
                            showAlert('The element can only be placed in containers of type <b>' + def.parent_selector + '</b>. Drag it to the tree if you want to place it elsewhere.', "Can't put it here");
                        }
                    } else {

                        var pgEl = getElementPgNode(draggedPlaceholderElement);

                        if(!remove) {
                            if(!canMakeChange(getElementPgNode( draggedPlaceholderElement.parent()) , 'insert_element', {inserted: pgEl})) {
                                remove = true;
                            }
                        }

                        if(!remove && (!pgEl || !pgInsertNodeAtDOMElementLocation(pgEl, draggedPlaceholderElement))) {
                            remove = true;
                            showAlert("The element can't be placed here because the destination is a dynamic element, created by Javascript code.", "Can't put it here");
                        }


                        if(!remove && elementUnderMouseData) {
                            var $p = draggedPlaceholderElement.parent();
                            methods.updateStructureAndWireAllElemets(elementUnderMouseData.iframe, $p && $p.length > 0 ? $p : null);
                        }
                        if(!remove) {
                            selectElement(draggedPlaceholderElement);
                        }
                    }
                }
                draggedOverInvalidParent = false;
                elementUnderMouse = null;

                $.fn.crsapages('clearUndoSetFlag');
                didMakeChange(selectedPage, draggedPlaceholderElement, draggedPlaceholderElement ? draggedPlaceholderElement.parent() : null);

                if(remove) {
                    selectedCrsaPage.undoStack.remove();
                }

                if(draggedPlaceholderElement) {
                    if(remove) {
                        draggedPlaceholderElement.remove();
                    } else {
                        elementWasInserted(draggedPlaceholderElement, orig_def);
                    }
                }
                if(!remove) {

                }


                draggedPlaceholderElement = null;

                active_$el.data('in-air', false);
                active_$el = null;

            }).on('sortstart', function(event, ui) {

                //willMakeChange('all', false);
                $.fn.crsapages('clearUndoSetFlag');

                canvas.crsapages('showOverlays');
                crsaEndEditModeIfActive();

            }).on('sort', function(event, ui) {

                elementMovedWithMouse(event);
            });

            updateList();

            $input.on('input', function() {
                updateList();
            });

        },
        setSelectedElementProperty : function(prop, value) {
            var $dest = $('#crsa-properties');
            $dest.find('.crsa-field').each(function(i,e) {
                var $e = $(e);
                var field = $e.data('crsa-field');
                if(field == prop) {
                    var $input = $e.find('> input');
                    $input.val(value);
                    $input.trigger('change', true);
                    return false;
                }
            });
        },
        getValuesForElement : function($el) {
            return getValuesForObject(getObjectFromElement($el));
        },
        showProperties : function(obj, $dest, def) {
            var profile = new CrsaProfile();

            var $scrollParent = null;
            if(typeof $dest == 'undefined' || !$dest) {
                $dest = $('#crsa-properties');
                $scrollParent = $dest.parent();
            }
            else {
                $scrollParent = $dest;
            }
            $dest.find('.crsa-input-color-picker').spectrum('destroy');

            pgRemoveMultiselects($dest);
            $dest.html('');

            if(!obj) {
                $dest.html('<div class="alert alert-info">' + customLogic.textPropsElementNotSelected + '</div>');
                return;
            }
            if(!def) def = getDefinitionForObject(obj, true);

            if(!def) return;

            //var sections = {};
            var sections_array = [];
            var pgel = null;

            var findSectionIndex = function(key) {
                for(var i = 0; i < sections_array.length; i++) {
                    if(sections_array[i].section_key == key) return i;
                }
                return -1;
            }

            var defs = null;

            if(obj.type == 'element') {
                pgel = getElementPgNode(obj.data);
                if(!def.sections) def.sections = {};
                defs = selectedCrsaPage.getAllTypes(obj.data, pgel, true); //skip actions
                if(defs) {
                    for(var i = 0; i < defs.length; i++) {
                        var d = defs[i];
                        if(d.sections) {
                            $.each(d.sections, function(seckey, secdef) {
                                secdef.section_key = seckey;
                                if(!secdef.framework) secdef.framework = d.framework;
                                var idx = findSectionIndex(seckey);
                                if(idx < 0) {
                                    if('position' in secdef && secdef.position < sections_array.length) {
                                        sections_array.splice(secdef.position, 0, secdef);
                                    } else {
                                        sections_array.push(secdef);
                                    }
                                } else {
                                    if(sections_array[idx].inherit) {
                                        sections_array[idx] = secdef;
                                    }
                                }
                                /*
                                if(!(seckey in sections) || sections[seckey].inherit) {
                                    sections[seckey] = secdef;
                                    if(!secdef.framework) secdef.framework = d.framework;
                                }*/
                            });
                        }
                    }
                }
            } else {
                //sections = def.sections ? def.sections : {};
                if(def.sections) {
                    $.each(def.sections, function(key, def) {
                        sections_array.push(def);
                        def.section_key = key;
                    })
                }
            }



            if(!def) return;

            var $desc = $('<ul/>', {class: 'props-desc-obj'}).appendTo($dest);

            methods.showElementDescription($desc, obj, def);

            if(obj.type == 'element') {

                var $el = obj.data;
                var pgEl = getElementPgNode($el);

                if(!pgEl) {
                    $('<div class="alert alert-info">This is a dynamic element created by JavaScript code. Edit that code to change the element.</div>').appendTo($dest);

                    return;
                }
                var locked = pinegrow.isElementLocked(pgEl);
                if(locked) {
                    $('<div class="alert alert-info">The element is locked: ' + locked + '</div>').appendTo($dest);

                    return;
                }

                selectedCrsaPage.callFrameworkHandler('on_show_properties', sections_array, $el, pgEl, defs, $dest);
            }


            var values = getValuesForObject(obj, sections_array);
            var on_fields_created = [];
            var $list = $('<ul/>').appendTo($dest);

            $.each(sections_array, function(i, s) {
                var key = s.section_key;
                if((s.hasOwnProperty("show") && !s.show) || !s.name) return true;

                var classes = "section";
                if (s.closed) classes += " section-closed";

                var $c;
                var $li;
                if (obj.selector) {
                    var $h = $('<h2/>').html(s.name + (s.framework ? '<small> / ' + s.framework.name + '</small>' : '')).appendTo($dest);
                    $c = $('<div/>').appendTo($dest);
                }
                else {
                    $li = $('<li/>', {class: classes}).appendTo($list);
                    var $container = $('<div/>').appendTo($li);
                    var $h = $('<h2/>', { class: 'section-title' }).html(s.name + (s.framework ? '<small> / ' + s.framework.name + '</small>' : '')).appendTo($container);
                    var $icon = $('<i class="fa fa-caret-right closed"></i><i class="fa fa-caret-down opened"></i>').appendTo($h);
                    var $ul = $('<ul/>').appendTo($li);
                    $c = $('<li/>').appendTo($ul);
                }

                $.each(s.fields, function(fn, fdef) {

                    var $field;
                    if(fdef.type == 'custom') {
                        $field = fdef.show($c, obj, fn, fdef, values, $scrollParent);
                    } else {
                        $field = methods.addInputField($c, obj, fn, fdef, values, false, $scrollParent);
                    }
                    if(s.icons) {
                        $field.addClass('with-icons');
                        $('<i class="field-icon icon-' + fn + '"></i>').insertAfter($field.find('>label'));
                    }
                    if(fdef.on_fields_created) {
                        on_fields_created.push({func: fdef.on_fields_created, obj: obj, field: $field, def: fdef, name: fn, default_value: fdef.default_value || null});
                    }
                    if(fdef.validate) {
                        pinegrow.validateField(obj, fn, values.hasOwnProperty(fn) ? values[fn] : null, fdef, $field, values);
                    }
                });
                if ($li) $li.data('section_def', s);
            });
            // Use selectize
            // UseSelectize();
            // Use select2
            //useSelete2();
            var updateUsage = function ($div) {
                if (!$div) {
                    $div = $dest;
                    $div.find('li.has-data').removeClass('has-data');
                }
                else {
                    $div.removeClass('has-data');
                }

                $div.find('input, checkbox, select').each(function(i, a) {
                    var $input = $(a);
                    if (($input.attr('type') == "checkbox" && $input.is(':checked')) ||
                        ($input.attr('type') != "checkbox" && $input.val())) {
                        $input.closest('.section').addClass('has-data');
                    }
                });
            }

            var collapsibleSections = new CrsaCollapsibleSections($list, $dest);
            collapsibleSections.show(function ($section) {
                return $section.data('section_def');
            }, updateUsage);

            for(var i = 0; i < on_fields_created.length; i++) {
                var val = values.hasOwnProperty(on_fields_created[i].name) ? values[on_fields_created[i].name] : null;
                if(val === null && on_fields_created[i].default_value) val = on_fields_created[i].default_value;
                on_fields_created[i].func(
                    on_fields_created[i].obj,
                    on_fields_created[i].name,
                    val,
                    on_fields_created[i].def,
                    on_fields_created[i].field,
                    values);
            }
            on_fields_created = null;

            profile.show('showProperties');
        },
        addInputField : function($c, obj, fn, fdef, values, skip_handle_events, $scrollParent) {

            var $fc = $('<div/>', { 'class' : 'crsa-field crsa-field-' + fdef.type + ' crsa-field-' + fn}).data('crsa-field', fn).data('crsa-field-def', fdef);

            if($c) $fc.appendTo($c);

            if(fdef.name && fdef.type != 'hidden') {
                $fc.append('<label>' + fdef.name + '</label>');
            }

            if(fdef.class) {
                $fc.addClass(fdef.class);
            }
            var $input = null;
            var crsaSelect = null;

            var pgAutoComplete = null;
            var $fieldParent = null;

            var multiselectOptions = {
                type: fdef.type
            }


            if ($scrollParent && $scrollParent.length > 0) {
                multiselectOptions['JQparent'] = $scrollParent;
            }

            if(fdef.placeholder) {
                multiselectOptions['placeholder'] = fdef.placeholder;
            }

            switch(fdef.type) {
                case 'select' :
                    if(fdef.system_field || fdef.name == "Icon") {
                        $input = $('<select/>', { 'class' : 'crsa-input' }).appendTo($fc);
                        if(fdef.show_empty) {
                            $('<option/>').html('').appendTo($input);
                        }
                        if(fdef.multiple) {
                            $input.attr('multiple', 'multiple');
                        }

                        var options = getFieldDefOptions(fdef, obj);
                        $.each(options, function(i,opt) {
                            var $opt = $('<option/>', { value : opt.key}).html(opt.name).appendTo($input);
                        });
                        if(values[fn]) {
                            if(!fdef.multiple) {
                                if (options.filter(function(opt) { return opt.key == values[fn]; }).length == 0) {
                                    $('<option/>', { value : values[fn]}).html(values[fn]).appendTo($input);
                                }
                            }
                            if(fdef.multiple) {
                                var val_array = values[fn].split(',');
                                for(var vali = 0; vali < val_array.length; vali++) {
                                    $input.find("option[value='" + val_array[vali] + "']").prop("selected", true);
                                }
                            } else {
                                $input.val(values[fn]);
                            }
                        } else {
                            if(fdef.show_empty) {
                                $input.val(emptyVal);
                            }
                            if(fdef.default_value) {
                                $input.val(fdef.default_value);
                            }

                        }
                        if(fdef.rich) {
                            var $val = $('<div/>', {class: 'crsa-select-val'}).appendTo($fc);
                            crsaSelect = new CrsaSelect($input, $val, options, fdef.rich);
                            $fc.addClass('rich-select');
                            //$input.on('crsa-select-show', function() {
                            //    if(fdef.rich.on_show) fdef.rich.on_show($input, crsaSelect);
                            //})
                        }

                        if (fdef.action == "apply_class")
                            $input.attr('can-create-new', "false");
                        else
                            $input.attr('can-create-new', "true");

                        break;

                    }

                    $input = $('<div/>', { 'class' : 'crsa-input' }).appendTo($fc);
                    multiselectOptions['empty'] = false;

                    if(fdef.multiple) {
                        multiselectOptions['multiple'] = true;
                    }

                    var selectOptions = getFieldDefOptions(fdef, obj);
                    if(fdef.show_empty) {
                        multiselectOptions['empty'] = true;
                    }
                    if(fdef.can_add_items) {
	                    multiselectOptions['newItem'] = true;
                    }

                    if(fdef.rich) {
                        var $val = $('<div/>', {class: 'crsa-select-val'}).appendTo($fc);
                        crsaSelect = new CrsaSelect($input, $val, selectOptions, fdef.rich);
                        $fc.addClass('rich-select');
                    }

                    multiselectOptions.getItems = function () {
                        return selectOptions;
                    }

                    pgAutoComplete = PgAutoComplete($input, multiselectOptions, 'select');

                    if(values[fn]) {
                        pgAutoComplete.val(values[fn]);
                    } else if (fdef.default_value) {
                        pgAutoComplete.val(fdef.default_value);
                    }

                    break;

                case 'rules' :
                    updateRulesList($fc, obj.data, values, fn);
                    break;

                case 'text':
                case 'hidden':
                case 'color':
                case 'slider' :
                case 'image' :
                case 'media-query':
                    var $container = $('<div/>', {'class' : 'crsa-input crsa-input-' + fdef.type }).appendTo($fc);

                    if(fdef.type == 'hidden') {
                        $container.addClass('hide');
                    }
                    var items = [];
                    if(fdef.action == 'element_attribute' && !fdef.options) {
                        var tagName = null;
                        if(fdef.autocomplete_same_tag && obj.data) {
                            tagName = obj.data.get(0).tagName.toLowerCase();
                        }
                        items = pinegrow.insight.getValuesForAttribute(fdef.attribute, tagName);
                    }
                    multiselectOptions['newItem'] = true;
                    multiselectOptions['mode'] = 'input';
                    multiselectOptions['getItems'] = function () {
                        return items;
                    };

                    if(fdef.options) {
                        if(typeof fdef.options == 'function') {
                            multiselectOptions['getItems'] = function() {
                                try {
                                    return fdef.options(fdef, obj);
                                } catch(err) {
                                     console.log('get auto complete options error: ' + err);
                                }
                            }
                        } else {
                            items = fdef.options;
                        }
                    }

                    pgAutoComplete = PgAutoComplete($container, multiselectOptions);
                    $input = pgAutoComplete.$input;

                    if (values[fn]) {
                        $input.val(values[fn]);
                    }

                    /*$input = $('<input/>', { 'type' : fdef.type == 'hidden' ? 'hidden' : 'text', 'class' : 'crsa-input crsa-input-' + fdef.type }).appendTo($fc);

                    //$input = $('<input/>', { 'type' : fdef.type == 'hidden' ? 'hidden' : 'text', 'class' : 'crsa-input crsa-input-' + fdef.type }).appendTo($fc);

                    //$input.data('start-width', $input.get(0).scrollWidth);
                    try {
                        if(values[fn]) {
                            $input.val(values[fn]);
                        }
                    } catch(err) {}*/
                    break;
                case 'checkbox' :
                    $input = $('<input/>', { 'type' : 'checkbox', 'value' : fdef.value, 'class' : 'crsa-input crsa-input-' + fdef.type }).appendTo($fc);
                    if(values[fn] == fdef.value || (!values[fn] && fdef.default_value && fdef.default_value == fdef.value)) {
                        $input.prop('checked', 'checked');
                    }
                    break;
                case 'label':
                    break;
            }
            if ($input && $input.length > 0) {
                $input.data('input-type', fdef.type);
            }
            if(fdef.type == 'image' || fdef.file_picker) {
                var $pick = $('<a/>', { href : '', class : 'crsa-pick-file'}).html('<i class="fa fa-folder-open"></i>').appendTo($fc);
                $fc.addClass('pick-file');
                $pick.on('click', function(event) {

                    var $input = $(event.delegateTarget).closest('.crsa-field').find('.crsa-input');

                    if(isApp()) {

                        PgChooseFile(function(url, file) {
                            if(fdef.file_picker_quotes && url) url = '"' + url + '"';

                            if(fdef.file_picker_no_url) url = file;

                            $input.val(url).trigger('change');
                        }, {
                            parent_url : crsaGetObjectParentUrl(obj),
                            save_as : fdef.file_picker_save || null,
                            folder : fdef.file_picker_folder || null,
                            no_proxy : fdef.file_picker_no_proxy || null,
                            no_url : fdef.file_picker_no_url || null
                        });
                        /*
                        crsaChooseFile(function(url, file) {
                            var setUrl = function() {
                                if(fdef.file_picker_quotes && url) url = '"' + url + '"';

                                if(fdef.file_picker_no_url) url = file;

                                $input.val(url).trigger('change');
                            }

                            var parent_url = crsaGetObjectParentUrl(obj);
                            if(parent_url) {
                                if(crsaIsFileUrl(parent_url)) {
                                    url = crsaMakeLinkRelativeTo(url, parent_url);
                                    if(!fdef.file_picker_no_proxy && !fdef.type == 'image') url = httpServer.makeUrl(url);
                                    if(crsaIsAbsoluteUrl(url) && !fdef.file_picker_no_url) {
                                        pinegrow.showAlert("<p>Location of the file doesn't let us use a relative url. This can cause url to break when you upload the page to a server or if you open the page in a browser while Pinegrow is not running.</p><p>Would you like to copy the file in the same folder (or subfolder of folder) where your HTML page is located? Then Pinegrow can create relative urls that will work from wherever you open the page.</p>", "The file is not located in the project folder", 'No, use absolute link', 'Yes, copy the file', function() {
                                          //use as is
                                            setUrl();
                                        }, function() {
                                            //copy
                                            var project = pinegrow.getCurrentProject();
                                            var folder = crsaMakeFileFromUrl(crsaGetBaseForUrl(parent_url));
                                            var project_info;
                                            if(project) {
                                                project_info = project.getProjectInfo();
                                                folder = project_info.getSetting('file-picker-copy-folder') || folder;
                                            }
                                            crsaChooseFile(function(new_url, new_file) {
                                                if(new_file != file) {
                                                    try {
                                                        crsaCopyFileSync(null, file, new_file);
                                                        file = new_file;
                                                        url = crsaMakeLinkRelativeTo(new_url, parent_url);
                                                        setUrl();

                                                        if(project_info) {
                                                            project_info.setSetting('file-picker-copy-folder', require('path').dirname(new_file));
                                                            project_info.save();
                                                        }
                                                    } catch(err) {
                                                        pinegrow.showAlert('Could not copy file: ' + err, 'Error');
                                                    }
                                                }
                                            }, crsaGetNameFromUrl(url), null,  folder);
                                        });
                                    } else {
                                        setUrl();
                                    }
                                } else {
                                    if(!fdef.file_picker_no_proxy && !fdef.type == 'image') url = httpServer.makeUrl(url);
                                    setUrl();
                                }
                            } else {
                                setUrl();
                            }
                        },  fdef.file_picker_save || null, null, null, fdef.file_picker_folder || false); */
                    } else {
                        crsaProjectBrowser = new CrsaProjectBrowser();
                        crsaProjectBrowser.setProjects([crsaProject]);
                        crsaProjectBrowser.title = "Select image";
                        crsaProjectBrowser.onFileSelected = function(cf) {
                            var url = cf.url;
                            if(fdef.file_picker_quotes && url) url = '"' + url + '"';
                            $input.val(url).trigger('change');
                        }
                        crsaProjectBrowser.show();
                    }

                    event.preventDefault();
                    return;


                    var $input = $(event.delegateTarget).closest('.crsa-field').find('.crsa-input');
                    var $field = $input.closest('.crsa-field');
                    var prop = $field.data('crsa-field');

                    filepicker.pick({
                            mimetypes: ['image/*']
                        },
                        function(InkBlob){
                            console.log(JSON.stringify(InkBlob));
                            $input.val(InkBlob.url);
                            $input.trigger('change');
                        },
                        function(FPError){
                            console.log(FPError.toString());
                        }
                    );
                    event.preventDefault();
                });
            }
            if(fdef.type == 'slider') {
                var $slider = $('<p/>', { 'class' : 'crsa-slider'}).appendTo($fc);

                $input.on('focus', function(e) {
                    showNotice('<p>Use <b>UP</b> and <b>DOWN arrow keys</b> to change value. Press <b>SHIFT</b> to increase or decrease by 10 units.</p>', 'A Tip', 'arrow-css-value', function() {
                        setTimeout(function() {
                            //$input.focus();
                        }, 100);

                    }, true);
                });
                $input.on('keydown', function(e) {
                    //console.log(e.which);

                    if(e.which == 38 || e.which == 40) {
                        e.preventDefault();
                        var val = $input.val();
                        var def_unit = ('slider_def_unit' in fdef) ? fdef.slider_def_unit : 'px';
                        if(!val) val = "0" + def_unit;
                        val = val.replace(/(\-?[0\.-9]+)(px|em|rm|pt|%|)/g, function(m) {
                            //console.log(m);
                            var unit = m.replace(/[\-0-9\.]/g,'');
                            var inc = 1;
                            var int = true;
                            if(m.indexOf('.') >= 0) {
                                inc = 0.1;
                                int = false;
                            }

                            var i = int ? parseInt(m) : parseFloat(m);

                            switch(e.which) {
                                case 38:
                                    if(e.shiftKey) {
                                        i = i + inc*10;
                                    } else {
                                        i = i + inc;
                                    }
                                    break;
                                case 40:
                                    if(e.shiftKey) {
                                        i = i - inc*10;
                                    } else {
                                        i = i - inc;
                                    }
                                    break;
                            }
                            return (int ? i : i.toFixed(2).replace('.00', '.0').replace(/(\.[0-9])0/,'$1')) + unit;
                        });
                        $input.val(val);
                        $input.trigger('input');
                    }
                });
            }
            if(fdef.type == 'media-query') {
                (function() {
                    var tool = null;
                    var $pick = $('<a/>', { href : '', class : 'crsa-pick-file'}).html('<i class="fa fa-magic"></i>').appendTo($fc);
                    $input.addClass('crsa-has-icon');

                    $pick.on('click', function(e) {
                        e.preventDefault();
                        if(tool && !tool.closed) {
                            tool.close();
                            tool = null;
                        } else {
                            tool = selectedCrsaPage.showMediaQueryHelper($input);
                        }
                    });
                })();
            }
            if(fdef.type == 'color') {
                var $picker =  $('<input/>', { 'type' : 'text', 'class' : 'crsa-input-color-picker' }).appendTo($fc);

                var noColor = 'rgba(0, 0, 0, 0)';
                if(!values[fn]) {
                    //$input.val(noColor);
                }
                var original_color;
                var ignore_change = false;

                $input.on('input change', function(e) {
                    if(!ignore_change) {
                        $picker.spectrum("set", $input.val());
                    }
                });

                var setInputValue = function(c) {
                    ignore_change = true;
                    var sel_start = $input.get(0).selectionStart;
                    var sel_end = $input.get(0).selectionEnd;
                    if(sel_start >= 0 && sel_end > sel_start) {
                        var val = $input.val();
                        var cval = val.substr(0, sel_start) + c + val.substr(sel_end, val.length - sel_end);
                        $input.val(cval);
                        $input.get(0).selectionEnd = sel_start + c.length;
                        $input.get(0).selectionStart = sel_start;
                    } else {
                        cval = c;
                        $input.val(cval);
                    }
                    $input.trigger('input');
                    //$input.trigger('change');
                    ignore_change = false;
                    return cval;
                }

                var colorToString = function(color) {
                    if(color.alpha != 1.0) {
                        return color.toRgbString();
                    } else {
                        var c = color.toString();
                        return c;
                    }
                }

                var trigger_change_on_end = false;

                $picker.spectrum({
                    showAlpha : true,
                    clickoutFiresChange : false,
                    showInitial : true,
                    showInput : true,
                    preferredFormat: "hex",
                    showPalette: true,
                    palette: [
                        //               []
                    ],
                    beforeShow : function(color) {
                        original_color = $input.val();
                        return true;
                    },
                    move : function(color) {
                        setInputValue(colorToString(color));
                    },
                    show : function(color) {
                        /*  if(color.toRgbString() == noColor) {
                         $input.data('crsa-original-value', color);
                         $input.spectrum("set", 'rgba(0,0,0,1)');
                         }*/
                    },
                    change : function(color) {
                        /*if(color.toRgbString() == noColor) {
                         color = null;
                         }*/
                        //  $input.val(color.toString());
                        //  $input.data('crsa-original-value', color);
                        //  $input.trigger('change');
                        original_color = setInputValue(colorToString(color));
                        trigger_change_on_end = true;
                    },
                    hide : function(color) {
                        if(original_color != $input.val()) {
                            ignore_change = true;
                            $input.val(original_color);
                            //$input.trigger('input');
                            $input.trigger('change');
                            ignore_change = false;
                        } else {
                            if(trigger_change_on_end) {
                                ignore_change = true;
                                $input.trigger('change');
                                ignore_change = false;
                                trigger_change_on_end = false;
                            }
                        }
                    }
                });
                $picker.spectrum("set", $input.val());
            }
            var undo_recorded = null;

            if($input && !skip_handle_events) {

                if(fdef.validate) {
                    $('<p class="error-message"></p>').appendTo($fc).hide();
                }

                var events = 'input change';

                $input.on(events, function(event, skip_undo) {
                    // debugger;
                    var $input = $(event.delegateTarget);

                    if (!$input.is('input') && pgAutoComplete) {
                        var $target = $(event.target);

                        if (pgAutoComplete.mode == "input") {
                            $input = $(event.target);
                        } else {
                            $input = $(event.target);
                        }
                    }

                    var $field = $input.closest('.crsa-field');
                    var prop = $field.data('crsa-field');
                    var field_def = $field.data('crsa-field-def');
                    var oldValue = values[prop] ? values[prop] : null;

                    var value;
                    if(field_def.type == 'checkbox') {
                        value = $input.prop('checked') ? field_def.value : null;
                    } else {
                        value = getValueFromInputField($input.val(), field_def, obj);
                    }

                    if(field_def.hasOwnProperty('live_update') && !field_def.live_update && event.type == 'input') {
                        return true;
                    }
                    var crsaPage = getCrsaPageForIframe(selectedPage);

                    if(obj.type == 'element') {
                        var can_change = true;
                        var pgel = getElementPgNode(obj.data);

                        var action = field_def.can_make_change_action || field_def.action || 'edit';

                        var check_pgel = pgel;

                        if(field_def.can_make_change_element) {
                            check_pgel = field_def.can_make_change_element(pgel) || pgel;
                        }

                        if(field_def.on_can_make_change) {
                            can_change = field_def.on_can_make_change(check_pgel, field_def);
                        } else if(action == 'element_attribute' && field_def.attribute) {
                            if(!canMakeChange(check_pgel, 'attr', field_def.attribute)) {
                                can_change = false;
                            }
                        } else if(action == 'apply_class') {
                            if((oldValue && !canMakeChange(check_pgel, 'remove_class', oldValue)) || (value && !canMakeChange(check_pgel, 'add_class', value))) {
                                can_change = false;
                            }
                        } else if(action == 'element_id') {
                            if(!canMakeChange(check_pgel, 'attr', 'id')) {
                                can_change = false;
                            }
                        } else if(action == 'element_html') {
                            if(!canMakeChange(check_pgel, 'edit_content')) {
                                can_change = false;
                            }
                        } else {
                            if(!canMakeChange(check_pgel, action)) {
                                can_change = false;
                            }
                        }
                        if(!can_change) {
                            if(field_def.type == 'checkbox') {
                                if(oldValue == field_def.value) {
                                    $input.prop('checked', true);
                                } else {
                                    $input.prop('checked', false);
                                }
                            } else {
                                $input.val(oldValue);
                            }
                            return true;
                        }
                    }


                    if((!undo_recorded || undo_recorded != prop) && !skip_undo) {
                        if(obj.type == 'rule' && obj.data.crsa_stylesheet) {
                            obj.data.crsa_stylesheet.changed = true;
                            //otherwise undo will not record the cs value
                        }
                        crsaPage.undoStack.add("Change " + field_def.name + ' / ' + getObjectName(obj));
                        //console.log('undo recorded');
                        undo_recorded = prop;
                    }
                    if(event.type == 'change') {
                        //was commented out, not sure why
                        undo_recorded = false;
                    }

                    if(value == emptyVal || value == '') value = null;

                    try {
                        values[prop] = methods.propertyChanged(obj, prop, value, oldValue, field_def, $field, event.type, values);

                        if(value != values[prop]) {
                            $input.val(values[prop]);
                        }

                        if(needsUpdate) {
                            if(!selectElementOnUpdate && obj.type == 'element') {
                                selectElementOnUpdate = obj.data;
                            }
                            methods.updateIfNeeded();
                        } else {
                            if(event.type == 'change' && selectedPage) {
                                setTimeout(function() {
                                    getCrsaPageForIframe(selectedPage).autoSize();
                                }, 100);
                            }
                        }
                        didMakeChange(selectedPage, obj.type == 'element' ? obj.data : null, null, null, event.type, {action: 'changeProperty', def: field_def, obj: obj});

                    } catch(problems) {
                        showAlert(problems.toString(), "Can't edit this element");
                        $input.val(oldValue);
                    }
                });
            }
            return $fc;
        },
        updateIfNeeded : function() {
            if(needsUpdate) {
                //var $focused = $( document.activeElement );
                //console.log($focused);
                methods.updateStructureAndWireAllElemets(selectedPage, needsUpdateElement, true);
                if(selectElementOnUpdate) {
                    selectElement(selectElementOnUpdate);
                    selectElementOnUpdate = null;
                }
                //$focused.focus();
            }
        },
        propertyChanged : function(obj, prop, value, oldValue, fieldDef, $field, eventType, values) {
            //log(prop + ' = ' + value);
            var sel = null;

            var crsaPage = obj.type == 'element' ? getCrsaPageOfElement(obj.data) : null;

            var action = fieldDef.action ? fieldDef.action : 'style';

            if(fieldDef.negvalue && value == null) {
                value = fieldDef.negvalue;
            }
            if(action == 'none') return;

            //var ss = $.rule.getStylesheetByTitle('crsa');
            //log(ss.innerHTML);

            if(fieldDef.set_value) {
                if(obj.type == 'element') {
                    var node = getElementPgNode(obj.data);
                    var problems = new pgParserSourceProblem(node, obj.data, fieldDef.ignore_lock ? true : false);

                    if(!node) {
                        problems.add('element', getElementName(obj.data), 'change');
                    }
                    if(!problems.ok()) {
                        throw problems;
                    }
                }
                try {

                    var new_value = fieldDef.set_value(obj, value, values, oldValue, eventType, fieldDef);
                    if(new_value != value) {
                        value = new_value;
                        $field.find('> input.crsa-input').val(value);
                    }
                }
                catch(err) {
                    console.log('set_value had an exception: ' + err);
                    //console.log(err);
                }
            } else if(action == 'style') {
                if(obj.type == 'element') {
                    var $el = obj.data;

                    var id = $el.attr('id');
                    if(!id) {
                        id = getUniqueId();
                        $el.attr('id', id);
                    }
                    sel = '#' + id;

                } else if(obj.type == 'rule') {

                    var rule = obj.data;
                    rule.crsa_stylesheet.genRuleValueChanged(rule, prop, value);

                    if(fieldDef.type == 'image') {
                        value = 'url(' + value + ')';
                    }

                }
                // var $rule = $iframe.crsacss('find', sel);


            } else if(action == 'apply_class') {
                if(obj.type == 'element') {
                    var $el = obj.data;
                    var options = getFieldDefOptions(fieldDef, obj);

                    var doDom = true;
                    if(crsaPage && crsaPage.sourceNode) {
                        //newpg
                        var node = getElementPgNode($el);
                        var problems = new pgParserSourceProblem(node, $el);

                        if(node) {
                            //check if can do
                            if(options) {
                                $.each(options, function(i,opt) {
                                    if(opt.key == value) return true;
                                    if($el.hasClass(opt.key)) {
                                        if(node.canRemoveClass(opt.key)) {

                                        } else {
                                            //element has class, but source doesn't
                                            //class was added by script
                                            problems.add('class', opt.key, 'remove');
                                        }
                                    }
                                });
                            } else {
                                if(oldValue && oldValue != value) {
                                    if($el.hasClass(oldValue)) {
                                        if(node.canRemoveClass(oldValue)) {

                                        } else {
                                            //element has class, but source doesn't
                                            //class was added by script
                                            problems.add('class', oldValue, 'remove');
                                        }
                                    }
                                }
                            }
                        } else {
                            problems.add('element', getElementName($el), 'change');
                        }
                        if(!problems.ok()) {
                            //oh no!
                            doDom = false;

                            throw problems; //let others worry about this :)
                        } else {
                            //do changes to source
                            if(options) {
                                $.each(options, function(i,opt) {
                                    if(opt.key == value) return true;
                                    if(node.hasClass(opt.key)) {
                                        node.removeClass(opt.key);
                                    }
                                });
                            } else {
                                if(oldValue && oldValue != value) {
                                    if(node.hasClass(oldValue)) {
                                        node.removeClass(oldValue);
                                    }
                                }
                            }
                            if(value) {
                                node.addClass(value);
                            }
                        }
                    }
                    if(doDom) {
                        //oldpg
                        if(options) {
                            $.each(options, function(i,opt) {
                                if($el.hasClass(opt.key)) $el.removeClass(opt.key);
                            });
                        } else if(fieldDef.value) {

                        }
                        if(oldValue && $el.hasClass(oldValue)) $el.removeClass(oldValue);
                        if(value) $el.addClass(value);
                    }
                }
            } else if(action == 'element_id') {
                if(obj.type == 'element') {
                    var $el = obj.data;
                    if(crsaPage && crsaPage.sourceNode) {
                        //newpg
                        var node = getElementPgNode($el);
                        var problems = new pgParserSourceProblem(node, $el);

                        if(!node) {
                            problems.add('element', getElementName($el), 'change');
                        }
                        if(!problems.ok()) {
                            throw problems;
                        }
                        node.setAttr('id', value);
                    }
                    $el.attr('id', value);
                }
            } else if(action == 'element_attribute') {
                if(obj.type == 'element') {
                    var $el = obj.data;

                    var encoded_value = pgEncodeAttribute(value);

                    if(crsaPage && crsaPage.sourceNode) {
                        //newpg
                        var node = getElementPgNode($el);
                        var problems = new pgParserSourceProblem(node, $el);

                        if(!node) {
                            problems.add('element', getElementName($el), 'change');
                        }
                        if(!problems.ok()) {
                            throw problems;
                        }

                        if(fieldDef.empty_attribute) {
                            if(value) {
                                node.setAttr(fieldDef.attribute, null);
                            } else {
                                node.removeAttr(fieldDef.attribute);
                            }
                        } else {
                            if((value === null && !fieldDef.attribute_keep_if_empty) || (fieldDef.default_value && value == fieldDef.default_value)) {
                                node.removeAttr(fieldDef.attribute);
                            } else {
                                node.setAttr(fieldDef.attribute, (encoded_value === null && !fieldDef.attribute_keep_if_empty) ? '' : encoded_value, true);
                                //node.setAttr(fieldDef.attribute, (encoded_value === null && !fieldDef.attribute_keep_if_empty) ? '' : value);
                            }
                        }
                    }

                    if(fieldDef.empty_attribute) {
                        if(value) {
                            $el.attr(fieldDef.attribute, '');
                        } else {
                            $el.removeAttr(fieldDef.attribute);
                        }
                    } else {
                        if((value === null && !fieldDef.attribute_keep_if_empty) || (fieldDef.default_value && value == fieldDef.default_value)) {
                            $el.removeAttr(fieldDef.attribute);
                        } else {
                            if(['src'].indexOf(fieldDef.attribute) >= 0) {
                                encoded_value = pinegrow.getProxyUrl(encoded_value);
                            }
                            $el.attr(fieldDef.attribute, encoded_value);
                        }
                    }
                }
            } else if(action == 'element_html') {
                if(obj.type == 'element') {
                    var $el = obj.data;

                    //newpg
                    var node = getElementPgNode($el);
                    var problems = new pgParserSourceProblem(node, $el);

                    if(!node) {
                        problems.add('element', getElementName($el), 'change');
                    }
                    if(!problems.ok()) {
                        throw problems;
                    }

                    node.html(value);

                    $el.html(value);
                }
            } else if(action == 'rules') {
                if(obj.type == 'element') {
                    var $el = obj.data;

                    //newpg
                    var node = getElementPgNode($el);
                    var problems = new pgParserSourceProblem(node, $el);

                    if(!node) {
                        problems.add('element', getElementName($el), 'change');
                    }
                    if(!problems.ok()) {
                        throw problems;
                    }
                    if(value) {
                        node.setAttr('class', value);
                    } else {
                        node.removeAttr('class');
                    }

                    $el.attr('class', value);
                }
            } else if(action == 'rule_name') {
                if(obj.type == 'rule') {
                    var rule = obj.data;
                    var old_class = rule.type == 'class' ? rule.class : null;
                    obj.selector = value;

                    selectedPage.crsacss('renameLessRule', rule, value, function(new_rule, changed_num) {
                        obj.data = new_rule;
                        if(changed_num) {
                            methods.updateStructureAndWireAllElemets(selectedPage);
                        }
                        if(selectedElement && selectedElement.type == 'element') {
                            selectElement(selectedElement.data);
                        }
                    });

                }
            } else if(action == 'rule_media') {
                var rule = obj.data;
                rule.crsa_stylesheet.genRuleValueChanged(rule, 'media', value);

                if(eventType == 'change') {
                    if(selectedElement && selectedElement.type == 'element') {
                        var newValues = getValuesForObject(selectedElement);
                        var $prop_field = $field.parent().closest('.crsa-field');
                        $prop_field.html('');
                        updateRulesList($prop_field, selectedElement.data, newValues, 'rules');
                        methods.showProperties(obj, $prop_field.find('> .crsa-rule-props'));
                    }
                    $('body').trigger('crsa-rules-changed');
                }


            }
            if(fieldDef.on_changed) {
                fieldDef.on_changed(obj, prop, value, oldValue, fieldDef, $field, eventType, values, crsaPage);
            }
            if(fieldDef.validate) {
                pinegrow.validateField(obj, prop, value, fieldDef, $field, values);
            }
            return value;
        },
        showVariables : function() {
            selectedPage.crsacss('showVariables');
        },
        showCSSRules : function($el, filter, active) {
            showClassManager($el, filter, active);
        },
        showTab : function(tab) {
            showTab(tab);
        },
        setSelectedPage : function(p) {
            setSelectedPage(p);
        },
        updateStructureAndWireAllElemets : function($iframe, $el, skip_select) {
            //$el = null;
            var $update_els = $el;
            if($el && $el.length > 0) {
                $el = $($el.get(0));
            }

            var start_ms = (new Date()).getTime();

            if($iframe) {
                methods.buildTree($iframe, $el);
            }

            var $tree = $('#crsa-tree');
            var scrollTop = $tree.scrollTop();

            var $repaintTreeBranch;

            var $treeRoot = getTreeRootForElement($el, $iframe);

            if($el) {
                if(customLogic.getTreeRootForElement) {
                    $repaintTreeBranch = $treeRoot;
                } else {
                    $repaintTreeBranch = $update_els;
                }
            } else {
                $repaintTreeBranch = $treeRoot;
            }

            methods.createTreeWidget($iframe, $tree, $treeRoot, $repaintTreeBranch, function() {
                $tree.scrollTop(scrollTop);
            });

            if(!$iframe) return;

            needsUpdate = false;
            needsUpdateElement = null;

            var cp = getCrsaPageForIframe($iframe);
            if(!cp.scrollMode && !skip_select) {
                canvas.crsapages('autoSizePage', $iframe, cp.scrollMode);
            }

            if(inlineMenu && !skip_select) {
                inlineMenu.remove();
                inlineMenu = null;
            }
            if(selectedElement && selectedElement.type == 'element' && !skip_select && selectedCrsaPage == cp) {
                selectElement(selectedElement.data);
            }
            var elapsed_ms = (new Date()).getTime() - start_ms;
            //console.log('Doc refresh took '+ elapsed_ms + ' ms');
            return this;
        },
        setNeedsUpdate : function(now, $el_to_update) {
            var page = $el_to_update ? getIframeOfElement($el_to_update) : selectedPage;

            if(page) {
                needsUpdate = true;
                needsUpdateElement = $el_to_update;
                if(now) {
                    if(updateTimer) {
                        clearTimeout(updateTimer);
                        updateTimer = null;
                    }
                    methods.updateStructureAndWireAllElemets(page, $el_to_update, true);
                    if(selectedElement && selectedElement.type == 'element') {
                        selectElement(selectedElement.data);
                    }
                }
            }
        },
        setNeedsUpdateDelayed : function($el_to_update) {
            if(updateTimer) {
                clearTimeout(updateTimer);
                updateTimer = null;
            }
            updateTimer = setTimeout(function() {
                methods.setNeedsUpdate(true, $el_to_update);
            }, 500);
        },
        setSelectElementOnUpdate : function($el) {
            selectElementOnUpdate = $el;
        },
        showPreview : function($target, $content, cls, fixedX, code, description) {
            if(!previewView) {
                previewView = $('<div/>', {id: "crsa-preview", class: 'preview'}).html('<div class="content clearfix"></div><div class="description"></div><div class="pre-holder"><pre></pre></div>').appendTo($('body'));
            }
            var $el = $content;
            var $c = previewView.find('>.content');
            var $desc = previewView.find('>.description');

            if(!$el) {
                $el = $('<div style="display:none;"></div>');
                $c.hide();
            } else {
                $c.show();
            }
            if(description) {
                $desc.show().html(description);
            } else {
                $desc.hide().html('');
            }
            if($el) {
                /*$el.find('script').remove();
                 if($el.find('body').length) {
                 $el = $el.find('body');
                 }*/
                $c.html('').append($el);
                //$c.attr('srcdoc', $el.html().replace());//.append($el);

                if(cls) {
                    previewView.addClass(cls).data('custom-class', cls);
                }

                var $pre = previewView.find('>div.pre-holder pre');
                if(code) {
                    code = pinegrow.formatHtml(code);
                    $pre.html(escapeHtmlCode(code));
                    $pre.parent().show();
                } else {
                    $pre.parent().hide();
                }

                var o = $target.offset();
                var wh = $(window).height();
                var ph = previewView.height();
                var y = o.top - ph/2;
                if(y + ph > wh) y = wh - ph;

                previewView.show();
                var x = fixedX ? (typeof fixedX == 'function' ? fixedX(previewView.width()) : fixedX) : getPreviewPosition(previewView.width());/*o.left + $target.outerWidth() + 5*/;
                previewView.css({left: x + 'px', top: y + 'px'});
            }
        },
        hidePreview : function() {
            //return;
            if(previewView) {
                previewView.hide().find('>div.content').html('');
                var cls = previewView.data('custom-class');
                if(cls) previewView.removeClass(cls).data('custom-class', null);
            }
        },
        isCollapsed : function($el) {
            if($el.is('head')) return !selectedCrsaPage.show_head_in_tree;
            return $el.attr('data-pg-collapsed') == '';
        },
        isHidden : function($el) {
            return $el.attr('data-pg-hidden') == '';
        },
        collapseElements : function($els, collapse) {
            $els.each(function(i, e) {
                methods.collapseElement($(e), collapse, false);
            })
        },
        collapseChildren : function($p, collapse) {
            methods.collapseElements($p.children(), collapse);
        },
        collapseElement : function($el, collapse, peak) {

            var $li = getTreeNodeForElement($el);
            if(!$li) return;

            if(typeof collapse == 'undefined' || collapse === null) {
                collapse = !methods.isCollapsed($el) || $li.hasClass('peek');
            }


            var $i = $li.find('>div .fa-angle-down, >div .fa-angle-right');
            if(!$li) return;
            var $ul = $li.find('> ul');
            $li.removeClass('peek');

            if($ul.length > 0) {
                if(!collapse) {


                    if(!peak) {
                        $i.addClass('fa-angle-down').removeClass('fa-angle-right');
                        $li.removeClass('collapsed');
                        //$el.data('crsa-tree-collapsed', null);

                        if($el.is('head')) {
                            selectedCrsaPage.show_head_in_tree = true;
                        } else {
                            var pgel = getElementPgNode($el);
                            $el.removeAttr('data-pg-collapsed');
                            if(pgel) {
                                pgel.removeAttr('data-pg-collapsed');
                            }
                        }
                    } else {
                        $li.addClass('peek');
                    }

                    $ul.removeClass('crsa-tree-node-closed');

                    //$ul.css('height', 0);

                    $ul.animate({height: $ul.get(0).scrollHeight}, 250, function() {
                        $ul.css('height', '');
                        if(selectedElement && selectedElement.type == 'element' && selectedElement.data.get(0) == $el.get(0)) {
                            selectElement(selectedElement.data);
                        }
                    });
                } else {
                    $i.addClass('fa-angle-right').removeClass('fa-angle-down');
                    //$el.data('crsa-tree-collapsed', true);

                    if($el.is('head')) {
                        selectedCrsaPage.show_head_in_tree = false;
                    } else {
                        $el.attr('data-pg-collapsed', '');
                        var pgel = getElementPgNode($el);
                        if(pgel) {
                            pgel.setAttr('data-pg-collapsed');
                        }
                    }
                    $li.addClass('collapsed');

                    $ul.animate({height: 0}, 250, function() {
                        $ul.addClass('crsa-tree-node-closed');
                        if(selectedElement && selectedElement.type == 'element' && selectedElement.data.get(0) == $el.get(0)) {
                            selectElement(selectedElement.data);
                        }
                    });
                }
            }
        },
        wireElement : function($el, $iframe, $oldParent, crsaPage) {
            var $n = $el;

            var def = getType($el, false, true, crsaPage);

            if(def && def.empty_placeholder) {
                var cls = typeof def.empty_placeholder == 'string' ? def.empty_placeholder : 'pg-empty-placeholder';
                var empty = $el.get(0).innerHTML.length < 10 && $.trim($el.html())== '';
                if(empty) {
                    //$el.addClass(cls);
                } else if($el.hasClass(cls)) {
                    //$el.removeClass(cls);
                    new pgQuery($el).removeClass(cls);
                }
            }
        },
        buildTree : function($iframe, $el) {
            return; //MT: I think we don't need this anymore

            //var start_ms = (new Date()).getTime();

            var b = getIframeBody($iframe[0]);
            var cp = getCrsaPageForIframe($iframe);

            if($el) b = $el.get(0);

            var filterFunc = (customLogic && customLogic.nodeFilter) ? customLogic.nodeFilter : null;

            walkDom(b, function(n) {
                if(n.nodeType == 1) {
                    var $n = $(n);
                    methods.wireElement($n, $iframe, null, cp);
                }
            }, filterFunc);

            //var elapsed_ms = (new Date()).getTime() - start_ms;
            //console.log('Build tree '+ elapsed_ms + ' ms');
        },
        traceTree : function($iframe) {
            var $b = $(getIframeBody($iframe[0]));
            walkCrsaTreeLevel($b, 0, function(level, $e) {
                var def = getType($e, false);
                var msg = '';
                for(var n = 0; n < level; n++) msg = msg + '----';
                msg = msg + ' ' + def.name + ' ' + $e[0].tagName;
                log(msg);
            });
        },
        createTreeWidget : function($iframe, $dest, $treeRoot, $el, done) {
            currentTreeRoot = $treeRoot;
            setSelectedPage($iframe);
            crsaTree.paintTree($iframe, $el ? $el : $treeRoot, function() {
                if(done) done();
            });

        },
        highlightElement : function($e) {
            return highlightElement($e)
        },
        selectElement : function($e, user_action) {
            selectElement($e, user_action);
        },
        scrollCanvasToElement : function($e) {
            scrollCanvasToElement($e);
        },
        willMakeChange : function(page, name) {
            willMakeChange(page, name);
        },
        didMakeChange : function(page) {
            didMakeChange(page);
        },
        getActionsMenu : function () {
            var def_actions = [
                {label: "Edit text", action: function($el) {
                    editor.startEdit($('.crsa-edit-toolbar'), $el);
                }},
                {label: "Remove tags", manage_change: true, action: function($el) {
                    var pgCurrent = getElementPgNode($el);
                    if(!canMakeChange(pgCurrent, 'remove_tags')) return;

                    var $iframe = getIframeOfElement($el);

                    willMakeChange(selectedPage, "Remove tags / " + getElementName($el));
                    detagElement($el, $iframe);
                    didMakeChange(selectedPage, $el);
                }},
                {label: "Edit code", class: 'action-edit-code', kbd: 'CMD H', manage_change: true, action: function($el) {
                    editElementSource($el);
                }},
                {label: "Delete", class: 'action-delete-element', manage_change: true, action: function ($el) {
                    deleteCurrnetElement($el);
                }},
                {label: "Duplicate", class: 'action-duplicate-element', manage_change: true, action: function ($el) {
                    duplicateCurrnetElement($el);
                }},
                {label: "Add as HTML snippet", class: 'action-add-comp', kbd: null, action: function($el) {
                    addAsComponent($el);
                }},
                {label: "Insert Lorem Ipsum", action: function($el) {
                    var selectedElement = getObjectFromElement($el)
                    var def = getDefinitionForObject(selectedElement, true);

                    var pgCurrent = getElementPgNode($el);
                    if(!canMakeChange(pgCurrent, 'edit_content')) return;

                    willMakeChange(selectedPage, "Insert Lorem Ipsum to / " + getElementName($el));
                    var text = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Phasellus pulvinar faucibus neque, nec rhoncus nunc ultrices sit amet. Curabitur ac sagittis neque, vel egestas est. Aenean elementum, erat at aliquet hendrerit, elit nisl posuere tortor, id suscipit diam dui sed nisi. Morbi sollicitudin massa vel tortor consequat, eget semper nisl fringilla. Maecenas at hendrerit odio. Sed in mi eu quam suscipit bibendum quis at orci. Pellentesque fermentum nisl purus, et iaculis lectus pharetra sit amet.';
                    var html = $el.html();
                    var tag = $el.get(0).tagName.toLowerCase();
                    if(['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'a'].indexOf(tag) >= 0) {
                        text = 'Lorem ipsum dolor sit amet';
                    }
                    if(createElementFromDefinition(def).html() == $el.html()) {
                        $el.html('');
                    } else if($el.html().length > 0) {
                        text = ' ' + text;
                    }
                    $el.append(text);
                    var pgel = getElementPgNode($el);
                    if(pgel) {
                        pgel.append(pgCreateNodeFromHtml(text));
                    }
                    didMakeChange(selectedPage, $el);
                }}
                /*   {label: "Trigger click", action: function($el) {
                 $el.trigger('click', true);
                 }}*/
            ];

            if(isApp()) {
                def_actions.push(
                    {label: "Copy code", class: 'action-copy-code', action: function($el) {
                        var pgel = getElementPgNode($el);
                        if(pgel) {
                            copyCodeToClipboard(pgel.toStringOriginal(true, pinegrow.getFormatHtmlOptions()));
                        } else {
                            copyCodeToClipboard($el.get(0).outerHTML);
                        }
                    }}
                );
            }


            if (def_actions.length) {
                def_actions.unshift({
                    label: "Actions",
                    type: "header"
                })
            }


            return def_actions
        },
        getActionsMenuFor : function ($el) {
            var def_actions = [];
            var selectedElement = getObjectFromElement($el);
            var def = getDefinitionForObject(selectedElement, true);

            if (def) {
                if (def.action_menu && def.action_menu.add) {
                    def_actions.push({
                        label: "Insert",
                        type: "header"
                    });
                    var action_menu = {};
                    if (def.action_menu.on_add) {
                        action_menu.on_add = def.action_menu.on_add;
                    }

                    $.each(def.action_menu.add, function(i, type) {
                        var tdef = selectedCrsaPage.getTypeDefinition(type);
                        if(tdef) {
                            def_actions.push({
                                label: tdef.name,
                                action: function ($el) {
                                    insertThroughActionMenu(action_menu, $el, tdef, false);
                                }
                            });
                        }
                    });
                }
                if(def.action_menu && def.action_menu.actions) {
                    def_actions.push({
                        label: def.name + " actions",
                        type: "header"
                    });
                    $.each(def.action_menu.actions, function(i, act) {
                        def_actions.push(act);
                    });
                }
            }

            def_actions = def_actions.concat(methods.getActionsMenu());

            if (pinegrow.getSelectedElement() && pinegrow.getSelectedElement().data[0] == selectedElement.data[0] && !pinegrow.isContributorMode()) {
                def_actions.push({label: "Show CSS Rules", class: 'action-show-rules', kbd: 'R', manage_change: true, action: function($el) {
                    pinegrow.showCSSRules($el, null, true);
                }});
            }

            def_actions.push({
                label: methods.isCollapsed($el) ? 'Uncollapse' : 'Collapse', action: function($el, event) {
                    var is_collapsed = methods.isCollapsed($el);
                    if(event.altKey) {
                        methods.collapseChildren($el.parent(), !is_collapsed);
                    } else {
                        methods.collapseElement($el, !is_collapsed);
                    }
                }});
            def_actions.push({
                label: methods.isCollapsed($el) ? 'Uncollapse level' : 'Collapse level', action: function($el, event) {
                    var is_collapsed = methods.isCollapsed($el);
                    methods.collapseChildren($el.parent(), !is_collapsed);
                    pinegrow.showNotice('<b>ALT + Click</b> on the collapse icon in the tree to collapse / uncollapse the whole level.', 'Level collapse shortcut', 'collapse-with-alt');
                }});

            return def_actions;
        },
        buildActionsDropDownMenu : function (actions, current, $ul, close) {
            $.each(actions, function(i, a) {
                var $li;
                if(a.type == 'divider') {
                    if(i > 0) {
                        $li = $('<li class="divider">' + a.label + '</li>');
                    }
                } else if(a.type == 'header') {
                    $li = $('<li class="dropdown-header">' + a.label + '</li>');
                } else {
                    $li = $('<li><a href="#">' + a.label + '</a></li>');
                }
                if($li) {
                    var $a = $li.find('a').data('action', a);
                    if(a.kbd) {
                        crsaAddKbd($a, a.kbd);
                        $a.addClass(a.class);
                    }
                    $a.on('click', function(e) {
                        e.preventDefault();
                        var a = $(e.delegateTarget).data('action');
                        a.action(current, e);
                        if (close) close();
                    });
                    $ul.append($li);
                }
            });
        }
    };

    var setSelectedPage = function(p) {
        if(selectedPage) {
            selectedPage.closest('.page').removeClass('active');
        }
        var changed = selectedPage == null || p == null || selectedPage.get(0) != p.get(0);
        selectedPage = p;
        editor.setSelectedPage(p);

        if(selectedPage) {
            selectedPage.closest('.page').addClass('active');
            selectedCrsaPage = getCrsaPageForIframe(selectedPage);
        } else {
            selectedCrsaPage = null;
        }
        if(changed) {

            try {
                classManager.setSelectedPage(selectedPage);
                methods.showVariables();
                if(selectedPage) {
                    selectedCrsaPage.autoSize();
                }
                crsaTree.showTreeForIframe(selectedPage);
            } catch(err) {}

            var win = require('nw.gui').Window.get();
            var title = 'Pinegrow Web Editor' + (pinegrow.hasActivatedProduct('WP') ? ' - WP' : '');
            if(selectedCrsaPage) {
                title = selectedCrsaPage.name + ' - ' + title;
            }
            win.title = title;

            $('body').trigger('crsa-page-selected', selectedCrsaPage);
        }
    }

    var deleteCurrnetElement = function ($el) {
        var $changed = getClosestCrsaElement($el.parent()); //cech );

        var pgCurrent = getElementPgNode($el);

        var problems = new pgParserSourceProblem(pgCurrent, $el);

        if(!pgCurrent) {
            problems.add('element', getElementName($el), 'remove');
        }
        if(!problems.ok()) {
            showAlert(problems.toString(), "Can't remove this element");
            return;
        }
        if(!canMakeChange(pgCurrent, 'delete_element')) return;

        var cp = pinegrow.getCrsaPageOfPgParserNode(pgCurrent);

        pinegrow.dispatchEvent('on_before_delete_element_async', cp, pgCurrent, function(delete_element) {

            if(delete_element) {
                var $iframe = getIframeOfElement($el);

                willMakeChange(selectedPage, "Delete element / " + getElementName($el), pgCurrent, 'delete');
                //debugger;
                var $select_next = $el.next();
                if ($select_next.length == 0) $select_next = $el.prev();
                if ($select_next.length == 0) $select_next = $changed;

                $el.remove();

                pgCurrent.remove();

                didMakeChange(selectedPage, $changed);
                elementWasDeleted($el, selectedCrsaPage);

                pinegrow.updateTree($changed);

                highlightElement(null);

                selectElement($select_next);
            }
        });
    }

    var duplicateCurrnetElement = function ($el) {
        var pgCurrent = getElementPgNode($el);

        var problems = new pgParserSourceProblem(pgCurrent, $el);

        if(!pgCurrent) {
            problems.add('element', getElementName($el), 'duplicate');
        }
        if(!problems.ok()) {
            showAlert(problems.toString(), "Can't duplicate this element");
            return;
        }

        if(!canMakeChange(pgCurrent, 'duplicate_element')) return;

        var cp = pinegrow.getCrsaPageOfPgParserNode(pgCurrent);
        var $iframe = cp.$iframe;

        willMakeChange(selectedPage, "Duplicate element / " + getElementName($el));

        var pgNew = pgCurrent.clone();
        pgNew.insertAfter(pgCurrent);
        
        pinegrow.dispatchEvent('on_duplicate_element_async', cp, pgNew, function(pgNew) {

            var $new = $(cp.getViewHTMLForElement(pgNew));

            var op = $el.css('opacity');
            var original_style = $new.attr('style');
            $new.css('opacity', '0');
            if(op == null) op = 1;

            $new.insertAfter($el);

            didMakeChange(selectedPage, $new, $new.parent());
            elementWasInserted($new);
            methods.updateStructureAndWireAllElemets($iframe, $new.parent());
            setUndoPointForCurrentPage($iframe);

            $new.animate({
                opacity: op
            }, 100, function() {
                if(original_style) {
                    $new.attr('style', original_style);
                } else {
                    $new.removeAttr('style');
                }
            });
        })

    }

    // Plugin defaults – added as a property on our plugin function.
    $.fn.crsa.defaults = {
        types : {},
        rulesDefintion : {},
        rules : {},
        variables : {},
        lib : {},
        frameworks : {}
    };

    $.fn.crsa.addFramework = function(pgFramework) {
        $.fn.crsa.defaults.frameworks[pgFramework.key] = pgFramework;
    }

    $.fn.crsa.addLibSection = function(key, name) {
        $.fn.crsa.defaults.lib[key] = {name : name, elements : []};
    }

    $.fn.crsa.addElementsToLibSection = function(section, types) {
        if(!(section in $.fn.crsa.defaults.lib)) {
            log('Lib section ' + section + ' not found.');
        }
        $.fn.crsa.defaults.lib[section].elements = $.fn.crsa.defaults.lib[section].elements.concat(types);
    }

    $.fn.crsa.addDefinition = function(def) {
        if(!('priority' in def)) def.priority = 1000;
        $.fn.crsa.defaults.types[def.type] = def;
        //log('Definition for ' + def.type + ' added.')
    }

    $.fn.crsa.addRulesDefinition = function(def) {
        $.fn.crsa.defaults.rulesDefinition = def;
        // log('Rules Definition for added.')
    }


    $.fn.crsa.addVariablesSection = function(key, name) {
        if(!(key in $.fn.crsa.defaults.variables)) {
            $.fn.crsa.defaults.variables[key] = {name : name, list : {}};
        }
        return $.fn.crsa.defaults.variables[key];
    }

    $.fn.crsa.addVariable = function(key, name, type, value, section) {
        var s = $.fn.crsa.addVariablesSection(section, section);
        s.list[key] = {name : name, type : type, value : value, key : key};
        return s.list[key];
    }

    $.fn.crsa.addRulesSection = function(key, name) {

    }

    $.fn.crsa.addRule = function(section, selector, name, values) {

    }


    var insertThroughActionMenu = function(action_menu, current, newdef, select, prepend) {

        var $newel = createElementFromDefinition(newdef);

        var name = getElementName($newel, newdef);

        var pgCurrent = getElementPgNode(current);
        var pgNew = getElementPgNode($newel);

        var problems = new pgParserSourceProblem(pgCurrent, current);

        if(!pgCurrent) {
            problems.add('element', getElementName(current), 'find');
        }
        if(!pgNew) {
            problems.add('element', getElementName($newel), 'find');
        }
        if(!problems.ok()) {
            showAlert(problems.toString(), "Can't edit this element");
            return;
        }

        if(!canMakeChange(pgCurrent, 'insert_element', {inserted: pgNew})) return;

        willMakeChange(selectedPage, "Add element / " + name);

        if(action_menu && action_menu.on_add) {
            action_menu.on_add(current, $newel, newdef, prepend)
        } else {
            if(prepend) {
                current.prepend($newel);
                pgCurrent.prepend(pgNew);
            } else {
                current.append($newel);
                pgCurrent.append(pgNew);
            }
        }
        $newel.data('crsa-def', null);
        if(select) {
            nt($newel);
        }
        elementWasInserted($newel, newdef);
        methods.updateStructureAndWireAllElemets(selectedPage, $newel.parent(), !select);
        didMakeChange(selectedPage, $newel, $newel.parent());


        crsaQuickMessage("Element <b>" + name + "</b> was inserted.");
        return $newel;
    }

    var insertBeforeOrAfter = function(current, newdef, select, after) {

        var $newel = createElementFromDefinition(newdef);

        var name = getElementName($newel, newdef);

        var pgCurrent = getElementPgNode(current);
        var pgNew = getElementPgNode($newel);

        var problems = new pgParserSourceProblem(pgCurrent, current);

        if(!pgCurrent) {
            problems.add('element', getElementName(current), 'find');
        }
        if(!pgNew) {
            problems.add('element', getElementName($newel), 'find');
        }
        if(!problems.ok()) {
            showAlert(problems.toString(), "Can't edit this element");
            return;
        }

        if(!canMakeChange(pgCurrent.parent, 'insert_element', {inserted: pgNew})) return;

        willMakeChange(selectedPage, "Add element / " + name);

        if(after) {
            $newel.insertAfter(current);
            pgNew.insertAfter(pgCurrent);
        } else {
            $newel.insertBefore(current);
            pgNew.insertBefore(pgCurrent);
        }

        $newel.data('crsa-def', null);
        if(select) {
            selectElement($newel);
        }
        elementWasInserted($newel, newdef);
        methods.updateStructureAndWireAllElemets(selectedPage, current.parent(), !select);
        didMakeChange(selectedPage, $newel, current.parent());


        crsaQuickMessage("Element <b>" + name + "</b> was inserted.");
        return $newel;
    }

    var replaceElement = function(current, newdef) {

        var $newel = createElementFromDefinition(newdef);

        var name = getElementName($newel, newdef);
        var update_el = current.parent();

        var pgCurrent = getElementPgNode(current);
        var pgNew = getElementPgNode($newel);

        var problems = new pgParserSourceProblem(pgCurrent, current);

        if(!pgCurrent) {
            problems.add('element', getElementName(current), 'find');
        }
        if(!pgNew) {
            problems.add('element', getElementName($newel), 'find');
        }
        if(!problems.ok()) {
            showAlert(problems.toString(), "Can't edit this element");
            return;
        }
        if(!canMakeChange(pgCurrent.parent, 'insert_element', {inserted: pgNew})) return;

        willMakeChange(selectedPage, "Add element / " + name);

        $newel.insertBefore(current);
        pgNew.insertBefore(pgCurrent);
        current.remove();
        pgCurrent.remove();

        $newel.data('crsa-def', null);

        selectElement($newel);

        elementWasInserted($newel, newdef);

        methods.updateStructureAndWireAllElemets(selectedPage, update_el, false);
        didMakeChange(selectedPage, $newel, update_el);


        crsaQuickMessage("Element <b>" + name + "</b> was inserted.");
        return $newel;
    }

    function elementMovedWithMouse(event) {
        var $el = null;
        var x = 0;
        var y = 0;

        try {
            var z = canvas.crsapages('getZoom');

            canvas.find('.content').each(function (i, e) {
                var $e = $(e);
                if(!$e.is(':visible')) return true; //next

                var o = $e.offset();
                var w = $e.width();
                var h = $e.height();

                if (event.pageX >= o.left && event.pageX <= o.left + w && event.pageY >= o.top && event.pageY <= o.top + h) {
                    $el = $e.find('> iframe');
                    x = event.pageX - o.left;
                    y = event.pageY - o.top;
                    //        console.log($el + ' ' + x + ' ' + y);
                    return false;
                }
            });

            // var def = draggedPlaceholderElement.data('crsa-def');
            var def = getType(draggedPlaceholderElement);

            //  console.log(event);
            draggedOverInvalidParent = false;

            if (!$el) {
                elementUnderMouse = null;
                if (draggedPlaceholderElement) {
                    draggedPlaceholderElement.detach();
                }
            } else {
                var $iframe = $el;
                var doc = getIframeDocument($iframe[0]);

                var $body = $(getIframeBody($iframe.get(0)));

                //  if(!z) z = 1;
                x = x / z;
                y = y / z;

                var scrollTop = doc.body.scrollTop;
                //debugger;

                var $pel = $(doc.elementFromPoint(x, y));

                if ($pel.length > 0 && $pel.get(0) === draggedPlaceholderElement.get(0)) return;

                if ($pel.has($body.get(0)).length > 0) $pel = $body;

                //check if pel contains dragged element
                while ($pel.length > 0 && draggedPlaceholderElement.has($pel.get(0)).length > 0 && !$pel.is('body')) {
                    $pel = $pel.parent();
                }
                if (draggedPlaceholderElement.has($pel.get(0)).length > 0) return;

                var $over_el = $pel;

                var $pel_inner;
                var $over_child = null;
                var do_over_child = false;

                var $selected_parent = $pel.closest('.crsa-selected');
                if ($selected_parent.length > 0 && false) {
                    $pel = $selected_parent;
                    do_over_child = true;
                } else {
                    if (def.parent_selector) {
                        $pel = $pel.closest(def.parent_selector);
                        do_over_child = true;
                    }
                }

                var skip = "img,iframe,script,embed,vide,audio,:hidden";

                var isInline = function ($e) {
                    return $e.css('display') == 'inline' && !$e.is('img');
                }

                while ((!$pel.is('body')) && ($pel.is(skip) || ((isInline($pel) || $pel.is('p')) && !isInline(draggedPlaceholderElement)))) {
                    $pel = $pel.parent();
                    do_over_child = true;
                }

                if (do_over_child) {
                    if ($pel.length > 0) {
                        $pel_inner = getInnerContainer($pel);
                        $over_el = getClosestCrsaElement($over_el); //cech
                        //$over_el.parentsUntil($pel_inner)
                        $pel_inner.children().each(function (i, child) {
                            if ($(child).find($over_el).length > 0 || child == $over_el.get(0)) {
                                $over_child = $(child);
                                //console.log($over_child);
                                return false;
                            }
                        });
                    } else {
                        draggedOverInvalidParent = true;
                    }
                } else {
                    $pel = getClosestCrsaElement($pel); //cech
                    if ($pel.length > 0) {
                        $pel_inner = getInnerContainer($pel);
                    }
                }

                if ($pel.length == 0 || !$pel_inner || $pel_inner.length == 0) return true;

                var pelo = $pel.offset();
                var xpel = x - pelo.left;
                var ypel = y - pelo.top;

                if (!elementUnderMouse || elementUnderMouse[0] !== $pel[0]) {
                    elementUnderMouse = $pel;
                    elementUnderMouseData = {inline: true, appended: null, iframe: $iframe};

                    if (elementUnderMouse && (draggedPlaceholderElement.find(elementUnderMouse).length > 0 || elementUnderMouse.get(0) === draggedPlaceholderElement.get(0))) {
                        return;
                        //elementUnderMouse = draggedPlaceholderElement.parent();
                    }
                    var style = draggedPlaceholderElement.attr('style');
                    draggedPlaceholderElement.hide();
                    var sw = $pel.width();
                    var sh = $pel.height();
                    draggedPlaceholderElement.show();
                    if (style) {
                        draggedPlaceholderElement.attr('style', style);
                    } else {
                        draggedPlaceholderElement.removeAttr('style');
                    }
                    var ew = $pel.width();
                    var eh = $pel.height();
                    elementUnderMouseData.inline = ew - sw > eh - sh;
                    highlightElement($pel);

                    /*
                    if(['inline','inline-block'].indexOf($pel.css('display')) >= 0) {
                        draggedPlaceholderElement.css('width', '8px').css('height', '100%');
                    } else {
                        draggedPlaceholderElement.css('width', '100%').css('height', '8px');
                    }
                    */
                }

                var cp = getCrsaPageForIframe($iframe);
                if (!cp.undoSetFlag) {
                    cp.undoSetFlag = true;
                    cp.undoStack.add("Drag & Drop / " + getElementName(draggedPlaceholderElement));
                }

                //console.log('over child', $over_child);
                if ($over_child) {
                    var childo = $over_child.offset();
                    var xchild = x - childo.left;
                    //console.log(y, childo.top - scrollTop, $over_child.height());
                    if (y - (childo.top - scrollTop) < $over_child.height() / 2) {//xchild < $over_child.width() / 2) {
                        draggedPlaceholderElement.insertBefore($over_child);
                    } else {
                        draggedPlaceholderElement.insertAfter($over_child);
                    }
                } else {
                    var sw = $pel.width();
                    var sh = $pel.height();
                    var append = elementUnderMouseData.inline ? xpel > sw / 2 : ypel > sh / 2;
                    if (elementUnderMouseData.appended !== append) {
                        if (append) {
                            //console.log('append');
                            var $children = $pel_inner.children();
                            if ($children.length) {
                                var $last_visible = null;
                                for (var i = $children.length - 1; i >= 0; i--) {
                                    var $lel = $($children.get(i));
                                    if ($lel.is(':visible')) {
                                        $last_visible = $lel;
                                        break;
                                    }
                                }
                                //console.log('last_visible', $last_visible);
                                if (!$last_visible) {
                                    $pel_inner.prepend(draggedPlaceholderElement);
                                } else {

                                    draggedPlaceholderElement.insertAfter($last_visible);
                                }
                            } else {
                                //console.log('append');
                                $pel_inner.append(draggedPlaceholderElement);
                            }
                        } else {
                            $pel_inner.prepend(draggedPlaceholderElement);
                        }
                        elementUnderMouseData.appended = append;
                    }
                }
                if (draggedPlaceholderElement.get(0).ownerDocument != doc) {
                    console.log('different iframe!');
                }
                highlightElement($pel);
            }
        } catch(err) { console.log(err);}

    }

    function getValueFromInputField(val, def, obj, options) {
        if(def.multiple) {
            if(val && typeof val == 'object') val = val.join(',');
        }
        return val;
        if(def.type == 'select' && def.options) {
            var vallc = val.toLowerCase();
            if(!options) options = getFieldDefOptions(def, obj);
            for(var i = 0; i < options.length; i++) {
                if(options[i].name.toLowerCase() == vallc) {
                    return options[i].key;
                }
            }
        }
        return val;
    }

    function getValueForInputField(val, def, obj, options) {
        if(def.multiple) {
            if(val && typeof val == 'object') val = val.split(',');
        }
        return val;
        if(def.type == 'select' && def.options) {
            if(!options) options = getFieldDefOptions(def, obj);
            for(var i = 0; i < options.length; i++) {
                if(options[i].key == val) {
                    return options[i].name;
                }
            }
        }
        return val;
    }


    function createPreviewElementFromDefinition(def) {
        if(def.preview_image) {
            var $img = $('<img/>');
            var src = def.framework.getImagePreviewBaseUrl() + def.preview_image + '?z=' + pinegrow.cache_breaker;
            $img.attr('src', src);
            $img.data('crsa-def', def);
            $img.get(0).crsaDef = def;
            return $img;
        }
        var code = def.preview ? (typeof def.preview == 'function' ? def.preview(getEnv()) : def.preview) : getCodeFromDefinition(def);
/*
        if(!def.preview) {
            return createElementFromDefinition(def, true);
        }
        */
        if(def.preview == 'none' || !code) return null;
        //var code = typeof def.preview == 'function' ? def.preview(getEnv()) : def.preview;
        code = code.replace(/<script/g, '<ascript').replace(/<\/script/g, '</ascript');
        code = code.replace(/<iframe/g, '<div').replace(/<\/iframe/g, '<span>iframe</span></div');
        var $el = $('<div/>').append(code).contents();
        $el.data('crsa-def', def);
        $el.get(0).crsaDef = def;
        return $el;
    }

    window.getCodeFromDefinition = function(def) {
        var code = $.trim(typeof def.code == 'function' ? def.code(getEnv()) : def.code);
        code = code.replace(/\$IMAGE_URL/g, pinegrow.getPlaceholderImage());
        return code;
    }

    window.createElementFromDefinition = function(def, preview) {
        var code = getCodeFromDefinition(def);
        if(!code || code.length == 0) return null;
        var pgel;

        if(preview) {
            code = code.replace(/<script/g, '<ascript').replace(/<\/script/g, '</ascript');
        }

        if(!preview) {
            pgel = pgCreateNodeFromHtml(code);
            var page = pinegrow.getSelectedPage();
            if(page) {
                pinegrow.httpServer.setCurrentRequestContext(page.url, page.sourceNode);
            }
            code = pgel.toStringWithIds(true, null, pinegrow.httpServer.createProxyUrlNodeOutputFilter);
        }

        var $el = $('<div/>').append(code).contents();

        if(!preview) {
            //pgel.mapIdsToDomElement($el.get(0));
        }

        //pgel.$el = $el;

        // if(!def.selector) def = null;//getType($el);
        var $one = $($el.get(0));
        $one.data('crsa-def', def);
        $one.get(0).crsaDef = def;
        //$el.data('crsa-tree-collapsed', $el.children().length > 0);

        if(def && def.empty_placeholder) {
            var cls = typeof def.empty_placeholder == 'string' ? def.empty_placeholder : 'pg-empty-placeholder';
            var empty = $one.get(0).innerHTML.length == 0 || $.trim($one.html())== '';
            if(empty) {
                if(!$one.hasClass(cls)) {
                    $one.addClass(cls);
                    if(pgel) pgel.addClass(cls);
                }
            } else {
                $one.removeClass(cls);
                if(pgel) pgel.removeClass(cls);
            }
        }

        return $el;
    }

    function getEnv() {
        return {body: selectedPage ? getIframeBody(selectedPage.get(0)) : null, page : selectedPage};
    }


    window.getValuesForObject = function(obj, sections /* array */) {
        if(obj.type == 'element') {
            var $el = obj.data;
            var pgEl = getElementPgNode($el);

            var problems = new pgParserSourceProblem(pgEl, $el, true);

            if(!pgEl) {
                problems.add('element', getElementName($el), 'change');
            }
            if(!problems.ok()) {
                throw problems;
            }

            var values = $el.data('crsa-values');

            if(values) return values;

            var $iframe = $('iframe.content-iframe');

            values = {};

            var def = getDefinitionForObject(obj);
            var $rule = null;

            if(!sections && def) {
                sections = def.sections ? Object.values(def.sections) : null;
            }

            var id = pgEl.getAttr('id');

            if(def && sections) {
                $.each(sections, function(i, sv) {
                    if(sv.fields) {
                        $.each(sv.fields, function(fn, fv) {
                            var action = fv.action ? fv.action : 'style';

                            if(fv.get_value) {
                                values[fn] = fv.get_value(obj, fn, values, fv);
                            } else if(action == 'none') {
                            } else if(action == 'style') {
                                if(!$rule) {
                                    var id = pgEl.getAttr('id');
                                    if(id) {
                                        var $rule = $iframe.crsacss('find', '#' + id);
                                    }
                                }
                                if($rule && $rule.length > 0) {
                                    var v = $iframe.crsacss('getCss', $rule, fn);
                                    if(v) {
                                        if(fv.type == 'image') {
                                            v = v.replace(/url\(/g, '').replace(/\"/g,'').replace(/\'/g, "").replace(/\)/g,'');
                                        }
                                        values[fn] = v;
                                    }
                                }
                            } else if(action == 'apply_class') {
                                var options = getFieldDefOptions(fv, obj);
                                if(options) {
                                    values[fn] = null;//fv.showEmpty ? null : emptyVal;
                                    $.each(options, function(i, opt) {
                                        if(pgEl.hasClass(opt.key)) {
                                            values[fn] = opt.key;
                                            return false;
                                        }
                                    });
                                } else if(fv.value) {
                                    values[fn] = pgEl.hasClass(fv.value) ? fv.value : null;
                                }
                            } else if(action == 'element_id') {
                                values[fn] = pgEl.getAttr('id');
                            } else if(action == 'element_attribute') {
                                if(fv.empty_attribute && fv.value) {
                                    if(pgEl.hasAttr(fv.attribute)) {
                                        values[fn] = fv.value;
                                    }
                                } else {
                                    values[fn] = pgEl.getAttr(fv.attribute);
                                }
                            } else if(action == 'element_html') {
                                values[fn] = $.trim(pgEl.html());
                            }else if(action == 'rules') {
                                // var list = selectedPage.crsacss('getRulesForElement', $el);
                                // var list = $el.get(0).className.split(/\s+/);
                                if(customLogic.showOnlyClassesInProperties) {
                                    var list = [];
                                    $.each($el.get(0).classList, function(i, cls) {
                                        list.push('.' + cls);
                                    });
                                    values[fn] = list;
                                } else {
                                    values[fn] = selectedPage.crsacss('getRulesForElement', $el, true);
                                }

                            }
                        });
                    }
                });
            }

            return values;
        } else if(obj.type == 'rule') {
            values = {};

            var def = getDefinitionForObject(obj);
            var rule = obj.data;
            var styles = rule.values;//selectedPage.crsacss('getLessRuleValues', obj.selector);

            if(def && def.sections) {
                $.each(def.sections, function(sn, sv) {
                    $.each(sv.fields, function(fn, fv) {
                        var action = fv.action ? fv.action : 'style';

                        if(fv.get_value) {
                            values[fn] = fv.get_value(obj, fn);
                        } else if(action == 'style' && styles) {
                            var vobj = styles[fn] ? styles[fn] : null;
                            var v;
                            if(vobj) {
                                v = vobj.value;
                                if(fv.type == 'image') {
                                    v = v.replace(/url\(/g, '').replace(/\"/g,'').replace(/\'/g, "").replace(/\)/g,'');
                                }
                                values[fn] = vobj.value;
                            }

                        } else if(action == 'rule_name') {
                            values[fn] = obj.selector;//.replace('.', '');
                        } else if(action == 'rule_media') {
                            values[fn] = rule.media ? rule.media : null;
                        }
                    });
                });
            }
            return values;
        }
        return {};
    }

    function getDefinitionForObject(obj, evaluate) {
        switch(obj.type) {
            case 'element' : return getType(obj.data, evaluate);
            case 'rule' : return $.fn.crsa.defaults.rulesDefinition;
        }
        return null;
    }

    function removeCurrentEditor($iframe) {
        var c = $iframe.data('crsa-current-editor');
        if(c) {

        }
    }

    window.crsaQuickMessage = function(msg, duration, single, error) {
        if(!duration) duration = 1500;
        var top = 100;
        var count = 0;

        var quick_messages = $('.quick-message');

        quick_messages.each(function(i,q) {
            var $q = $(q);
            var t = parseInt($q.css('top'));
            if(top <= t) top = t + $q.outerHeight() + 0;
            count++;
        });

        if(single && quick_messages.length > 0) return;

        var spinner = '';
        if(duration < 0) {
            spinner = '<i class="fa fa-refresh fa-spin"></i>&nbsp;';
        }

        var $return = null;

        (function() {
            var $msg = $('<div/>', {class: 'quick-message' + (error ? ' quick-message-error' : '')}).html('<p>' + spinner + msg + '</p>').appendTo($('body')).css('opacity', 0).css('top', top + 'px');
            $msg.animate({opacity:1}, error ? 100 : 250);

            $msg.removeMessage = function() {

                $msg.animate({opacity:0}, 500, function() {
                    $msg.remove();
                });

                setTimeout(function () {
                    $msg.remove();
                }, 1000);
            }
            if(duration > 0) {
                setTimeout(function () {
                    $msg.removeMessage();
                }, duration);
            }
            $return = $msg;
        })();

        return $return;
    }

    window.crsaGetCustomLogic = function() {
        return customLogic;
    }


    var onLoadDone = function(crsaPage) {
        try {
            if(crsaPage.loaded && (!selectedPage || selectedPage.get(0) == crsaPage.$iframe.get(0))) {
                classManager.refresh();
                methods.showVariables();
            }
        } catch(err) {
            //showAlert("Loading was done, but there was a problem: " + err, "Ups, something happened");
        }
    }

    function positionElementAbovePageAtLoc($im, $iframe, pos, zoom, cp, scrollLeft, scrollTop) {
        if(typeof scrollLeft == 'undefined') scrollLeft = $iframe.contents().scrollLeft();
        if(typeof scrollTop == 'undefined') scrollTop = $iframe.contents().scrollTop();
        if(!cp) cp = $iframe.position();
        var o = pos;
        var x =  o.left * zoom + cp.left - scrollLeft * zoom;
        var y =  o.top * zoom + cp.top - scrollTop * zoom;
        $im.css('left', x + 'px').css('top', y + 'px');
    }

    function highlightElement($e) {

        if(highlightedElements) {
            //highlightedElements.removeClass('crsa-highlighted');
            var $iframe = getIframeOfElement(highlightedElements);
            if($iframe) {
                $iframe.parent().find('.crsa-hl-overlay').hide();
            }
        }

        var zoom = $.fn.crsapages('getZoom');

        var getOverlay = function(cls, idx) {
            idx = idx || 0;
            var e = $page.find(cls+idx);
            if(!e || e.length == 0) {
                var cls = cls.replace(/\./g, ' ');
                e = $('<div/>', {class: 'crsa-hl-overlay ' + cls + ' ' + cls+idx}).appendTo($page);
            } else {
                e.show();
            }
            return e;
        }

        var $page;

        if($e && $e.length > 0) {
            window.requestAnimationFrame(function() {

                var $iframe = getIframeOfElement($e);
                if(!$iframe) return;
                $page = $iframe.parent();
                var cp = $iframe.position();

                highlightedElements = $e;

                var scrollLeft = $iframe.contents().scrollLeft();
                var scrollTop = $iframe.contents().scrollTop();

                $e.each(function(i, el) {
                    if(i == 6) return false;
                    var $e = $(el);

                    var pos = $e.offset();

                    var pl = parseInt($e.css('padding-left'));
                    var plz = pl * zoom;
                    var pr = parseInt($e.css('padding-right'));
                    var prz = pr * zoom;
                    var pt = parseInt($e.css('padding-top'));
                    var ptz = pt * zoom;
                    var pb = parseInt($e.css('padding-bottom'));
                    var pbz = pb * zoom;

                    var mt = parseInt($e.css('margin-top'));
                    var mtz = mt * zoom;
                    var mb = parseInt($e.css('margin-bottom'));
                    var mbz = mb * zoom;
                    var ml = parseInt($e.css('margin-left'));
                    var mlz = ml * zoom;
                    var mr = parseInt($e.css('margin-right'));
                    var mrz = mr * zoom;

                    var w = $e.innerWidth() - pl - pr;
                    var wz = w * zoom;
                    var h = $e.innerHeight() - pt - pb;
                    var hz = h * zoom;

                    //console.log('w:' + w + ', h:' + h + ', pt:' + pt + ', pr:' + pr + ', pb:' + pb + ', pl' + pl);


                    var isAlsoSelected = selectedElement && selectedElement.type == 'element' && selectedElement.data.get(0) == $e.get(0);

                    var $size = getOverlay('.crsa-hl-size', i);
                    $size.css({width: (wz + plz + prz) + 'px', height: (hz + ptz + pbz) + 'px'});
                    positionElementAbovePageAtLoc($size, $iframe, {left: pos.left, top: pos.top}, zoom, cp, scrollLeft, scrollTop);
                    $size.appendTo($page);

                    if(pinegrow.sourceParser) {
                        var pgNode = getElementPgNode($e);
                        if(pgNode) {
                            $size.removeClass('dyn');
                        } else {
                            $size.addClass('dyn');
                        }
                    }

                    if(isAlsoSelected) $size.hide();


                    var $pt = getOverlay('.crsa-hl-padding-top', i);
                    $pt.css({width: (wz + plz + prz) + 'px', height: ptz + 'px'});
                    positionElementAbovePageAtLoc($pt, $iframe, {left: pos.left, top: pos.top}, zoom, cp, scrollLeft, scrollTop);
                    $pt.appendTo($page);

                    var $pt = getOverlay('.crsa-hl-padding-bottom', i);
                    $pt.css({width: (wz + plz + prz) + 'px', height: pbz + 'px'});
                    positionElementAbovePageAtLoc($pt, $iframe, {left: pos.left, top: pos.top + pt + h}, zoom, cp, scrollLeft, scrollTop);
                    $pt.appendTo($page);

                    var $pt = getOverlay('.crsa-hl-padding-left', i);
                    $pt.css({width: (plz) + 'px', height: hz + 'px'});
                    positionElementAbovePageAtLoc($pt, $iframe, {left: pos.left, top: pos.top + pt}, zoom, cp, scrollLeft, scrollTop);
                    $pt.appendTo($page);

                    var $pt = getOverlay('.crsa-hl-padding-right', i);
                    $pt.css({width: (prz) + 'px', height: hz + 'px'});
                    positionElementAbovePageAtLoc($pt, $iframe, {left: pos.left + pl + w, top: pos.top + pt}, zoom, cp, scrollLeft, scrollTop);
                    $pt.appendTo($page);

                    var $pt = getOverlay('.crsa-hl-margin-top', i);
                    $pt.css({width: (wz + plz + prz) + 'px', height: mtz + 'px'});
                    positionElementAbovePageAtLoc($pt, $iframe, {left: pos.left, top: pos.top - mt}, zoom, cp, scrollLeft, scrollTop);
                    $pt.appendTo($page);

                    var $pt = getOverlay('.crsa-hl-margin-bottom', i);
                    $pt.css({width: (wz + plz + prz) + 'px', height: mbz + 'px'});
                    positionElementAbovePageAtLoc($pt, $iframe, {left: pos.left, top: pos.top + pt + h + pb}, zoom, cp, scrollLeft, scrollTop);
                    $pt.appendTo($page);

                    var $pt = getOverlay('.crsa-hl-margin-left', i);
                    $pt.css({width: (mlz) + 'px', height: (ptz + hz + pbz) + 'px'});
                    positionElementAbovePageAtLoc($pt, $iframe, {left: pos.left - ml, top: pos.top}, zoom, cp, scrollLeft, scrollTop);
                    $pt.appendTo($page);


                    var $pt = getOverlay('.crsa-hl-margin-right', i);
                    $pt.css({width: (mrz) + 'px', height: (ptz + hz + pbz) + 'px'});
                    positionElementAbovePageAtLoc($pt, $iframe, {left: pos.left + pl + w + pr, top: pos.top}, zoom, cp, scrollLeft, scrollTop);
                    $pt.appendTo($page);

                    var y = pos.top - mt - 16.0/zoom;

                    var $pt = getOverlay('.crsa-hl-name', i);
                    $pt.html(getElementName($e, null, false, true, false, true));

                    if(y < $iframe.scrollTop() + 20) {
                        y = pos.top + pt + h + pb;
                        pos.left = pos.left + pl + w + pr - $pt.outerWidth() / zoom;
                    } else {
                        if(isAlsoSelected) y = pos.top + pt + h + pb;
                    }

                    //$pt.css({width: (wz + plz + prz + mlz + mrz) + 'px', height: mtz + 'px'});
                    positionElementAbovePageAtLoc($pt, $iframe, {left: pos.left, top: y}, zoom, cp, scrollLeft, scrollTop);

                    $pt.appendTo($page);
                });

                //$page.find('> .crsa-hl-overlay').show();
            });
        } else {
            highlightedElements = null;

        }
    }


    window.getTreeRootForElement = function($el, $this) {
        if(customLogic && customLogic.getTreeRootForElement) return customLogic.getTreeRootForElement($el, $this);
        if(!$this) {
            return null;
        }
        return $(getIframeBody($this.get(0))).parent();
    }

    var collapse_on_select = [];

    function selectElement($e, user_action) {
        var profile = new CrsaProfile();

        var current = selectedElement ? selectedElement.data : null;
        var pgCurrent = null;

        if($e && $e.get(0).nodeType != 1) $e = null; //fix for #text getting selected somewhere

        var $this = $e ? getIframeOfElement($e) : (current ? getIframeOfElement(current) : null);
        if(!$this) return;

        if(current) {
            current.removeClass('crsa-selected');
        }
        $(getIframeBody($this.get(0))).find('.crsa-selected').removeClass('crsa-selected');

        var treeRoot = getTreeRootForElement($e, $this);

        var cp = getCrsaPageForIframe($this);

        //check if page view and source view are in sync for this element
        if($e && cp) {
            var pgel = getElementPgNode($e);
            if(pgel && pgel.document != cp.sourceNode) {
                //pinegrow.showQuickMessage("Perhaps you need to <b>Refresh (CMD + R) the page</b>.", 3000, true);
                return;
            }
        }

        if(cp.treeCurrentRoot == null || treeRoot == null || treeRoot.get(0) != cp.treeCurrentRoot.get(0)) {
            methods.createTreeWidget($this, $('#crsa-tree'), treeRoot);
        }

        if(selectedPage == null || selectedPage.get(0) != $this.get(0)) {
            setSelectedPage($this);
        }

        var new_collapse_on_select = [];
        for(var i = 0; i < collapse_on_select.length; i++) {
            if($e && (collapse_on_select[i].get(0) == $e.get(0) || collapse_on_select[i].has($e).length)) {
                new_collapse_on_select.push(collapse_on_select[i]);
                continue;
            }
            methods.collapseElement(collapse_on_select[i], true, true /* peak */);
        }
        collapse_on_select = new_collapse_on_select;

        var $li = null;
        var collapsed = false;
        if($e) {

            var $li = getTreeNodeForElement($e);
            var $uncollapsed_li = $li;
            var $uncollapsed_e = $e;

            var $elOfNode = $li ? crsaTree.getElementOfTreeNode($li) : null;
            if($uncollapsed_li && $elOfNode && $elOfNode.get(0) == $e.get(0)) {
                var $closedul = $uncollapsed_li.parent().closest('ul.crsa-tree-node-closed');
                while($closedul.length > 0) {
                    $uncollapsed_li = $closedul.closest('li');
                    $closedul = $uncollapsed_li.parent().closest('ul.crsa-tree-node-closed');
                    $uncollapsed_e = crsaTree.getElementOfTreeNode($uncollapsed_li);

                    if($uncollapsed_e) {
                        methods.collapseElement($uncollapsed_e, false, true /* peak */);

                        collapse_on_select.push($uncollapsed_e);
                    }
                }

                collapsed = $uncollapsed_li.find('>ul.crsa-tree-node-closed').length > 0;
            }


            if($e) {
                $e.addClass('crsa-selected');
            }
            current = $e;
        } else {
            current = null;
        }

        if($e) {
            current = $e;
            crsaTree.setSelectedElement($e, skip_tree_scroll);
        }


        if(inlineMenu) {
            inlineMenu.remove();
            inlineMenu = null;
        }
        var def = null;
        if(current) {
            //profile.show('se 2');
            selectedElement = getObjectFromElement(current);

            def = getDefinitionForObject(selectedElement, true);

            cp.selected_element_pgid = getElementPgId(current);

            var b = $this.closest('.page');
            var $im = $('<div/>', {'class' : 'crsa-inline-menu'}).appendTo($(b));

            /*     var $b_export = $('<a/>', {'class' : 'crsa-inline-menu-export', 'href' : '#'}).html('EXPORT').appendTo($im);
             $b_export.on('click', function(e) {
             exportElement(current, $this);
             return false;
             });
             */


            var $b_delete = $('<i/>', {'class' : 'fa fa-fw fa-trash-o crsa-inline-menu-delete'}).appendTo($im);
            $b_delete.on('click', function(e) {
                e.preventDefault();
                deleteCurrnetElement(current);
            });

            var $b_duplicate = $('<i/>', {'class' : 'fa fa-fw fa-copy crsa-inline-menu-duplicate'}).appendTo($im);
            $b_duplicate.on('click', function(e) {
                e.preventDefault();
                duplicateCurrnetElement(current);
            });

            var def_actions = methods.getActionsMenuFor(current);

            var pgCurrent = getElementPgNode(current);
            if(pgCurrent) {
                selectedCrsaPage.callFrameworkHandler('on_build_actions_menu', def_actions, pgCurrent, current);
            }

            var buildActionsMenu = function () {
                var $action_menu = $('<div/>', {class: 'btn-group'}).html('<button type="button" class="btn btn-link btn-xs dropdown-toggle" data-toggle="dropdown">Actions <span class="caret"></span></button>\
                    <ul class="dropdown-menu" role="menu">\
                    </ul>').appendTo($im);

                var $action_menu_ul = $action_menu.find('ul');
                methods.buildActionsDropDownMenu(def_actions, current, $action_menu_ul);
                $action_menu.find('.btn').button();

                $action_menu.on('shown.bs.dropdown', function (e) {
                    var $menu_ul = $(e.target).find('> ul');
                    $menu_ul.css('height', 'auto');
                    var topOffset = 0;
                    const navbarHeight = 70, itemHeight = 16, listPadding = 40;

                    var $parent = $im.parent();

                    if ($im.offset().top < $im.parent().height() - $im.offset().top + navbarHeight) {
                        if ($menu_ul.height() + $menu_ul.offset().top > $(window).height()) {
                            $menu_ul.css('height', $(window).height() - $menu_ul.offset().top - 10);
                        }
                    }
                    else if ($menu_ul.height() + $menu_ul.offset().top > $parent.height() + $parent.offset().top) {
                        var newTop = $menu_ul.height() + itemHeight;
                        if ($im.offset().top > newTop) {
                            $menu_ul.css({
                                'height': 'auto',
                                'overflow-y': 'auto',
                                'top': -(newTop)
                            });
                        }
                        else {
                            var height = $im.offset().top - listPadding;
                            $menu_ul.css({
                                'height': height,
                                'overflow-y': 'auto',
                                'top': -(height + 4)
                            });
                        }
                    }

                });
            }

            buildActionsMenu();

            if(collapsed) {
                $im.addClass('collapsed');
            }

            var $start_iframe = null;

            var $b_move = $('<i/>', {'class' : 'fa fa-bars crsa-inline-menu-move'}).appendTo($im);

            if(current && current.is('body')) $b_move.hide();



            var move_copy = false;
            var current_style = null;

            pgCurrent = getElementPgNode(current);

            if(!pgCurrent) {
                $b_move
                    .on('mousedown', function(e) {

                        var problems = new pgParserSourceProblem(pgCurrent, current);

                        if(!pgCurrent) {
                            problems.add('element', getElementName(current), 'change');
                        }
                        if(!problems.ok()) {
                            showAlert(problems.toString(), "Can't move this element");
                            return;
                        }

                        e.preventDefault();
                        e.stopImmediatePropagation();

                    })
            }

            if(crsaIsInEdit()) {
                $b_move
                    .on('mousedown', function(e) {
                        if(crsaIsInEdit()) {
                            showAlert("Go out of content editing mode before moving elements.", "Can't move during content editing")
                            e.preventDefault();
                            e.stopImmediatePropagation();
                        }
                        if(!canMakeChange(pgCurrent, 'move_element')) {
                            e.preventDefault();
                            e.stopImmediatePropagation();
                        }

                    })
            } else {
                $b_move
                    .draggable(({
                        helper: function(event, li) {

                            var $newel;
                            if(current.is('html,head,body,iframe')) {
                                $newel = $('<div class="pg-empty-placeholder">Element</div>');
                            } else {
                                $newel = current.clone(true);
                            }

                            $newel.css('opacity',0.5)
                                .css('min-width', 400)
                                .css('min-height', 200)
                                .css('transform','scale(' + 0.33 + ', ' + 0.33 + ')').css('transform-origin', '0 0');
                            $('body').append($newel);
                            return $newel.get(0);
                        }
                    })).on("dragstart", function(event) {

                        $.fn.crsapages('clearUndoSetFlag');

                        $start_iframe = getIframeOfElement(current);
                        draggedPlaceholderElement = current.clone(true, true).removeClass('crsa-selected').removeClass('crsa-highlighted');

                        var pgNew = pgCurrent.clone();

                        //draggedPlaceholderElement.attr('data-pg-id', pgNew.getId());
                        pgNew.mapIdsToDomElement(draggedPlaceholderElement.get(0));

                        willMakeChange($start_iframe, "Drag & Drop / " + getElementName(current));
                        getCrsaPageForIframe($start_iframe).undoSetFlag = true;

                        if(event.shiftKey) {
                            move_copy = true;
                        } else {
                            move_copy = false;
                            current_style = current.attr('style');
                            current.hide();
                        }
                        $im.hide();

                        canvas.crsapages('showOverlays');
                    }).on("dragstop", function(event, ui) {
                        canvas.crsapages('showOverlays', true);

                        var $end_iframe = getIframeOfElement(draggedPlaceholderElement);

                        var invalid_target = false;

                        ui.helper.remove();

                        var pgCurrent = getElementPgNode(current);
                        var pgEl = getElementPgNode(draggedPlaceholderElement);

                        if(!elementUnderMouse) {//event.toElement && $(event.toElement).closest('body').get(0) == $body.get(0)) {
                            //dropped on the tree
                            move_copy = false;
                            invalid_target = true;
                            showAlert('Move elements only <b>within the page</b> or <b>from page to page</b>. If you want to use the tree, move tree elements within the tree.', 'Invalid drop target');
                        }

                        var pgParent = getElementPgNode(draggedPlaceholderElement.parent());
                        if(pgParent) {
                            if(!canMakeChange(pgParent, 'insert_element', {inserted: pgEl})) {
                                invalid_target = true;
                            } else if(!move_copy) {
                                if(!canMakeChange(pgCurrent, 'delete_element')) {
                                    invalid_target = true;
                                }
                            }
                        }

                        if(!move_copy) {
                            current.show();
                            if(current_style) {
                                current.attr('style', current_style);
                            } else {
                                current.removeAttr('style');
                            }
                        }
                        if(!invalid_target && (!pgEl || !pgInsertNodeAtDOMElementLocation(pgEl, draggedPlaceholderElement))) {
                            showAlert("The element can't be placed here because the destination is a dynamic element, created by Javascript code.", "Can't put it here");
                            invalid_target = true;
                        }

                        if(!invalid_target) {

                            if($start_iframe.get(0) != $end_iframe.get(0)) {
                                methods.updateStructureAndWireAllElemets($start_iframe);
                                setSelectedPage($end_iframe);
                                didMakeChange($start_iframe);
                            } else {
                                if(!move_copy) {
                                    current.remove();
                                    pgCurrent.remove();
                                }
                            }

                            selectElement(draggedPlaceholderElement);

                            if(elementUnderMouse) {
                                methods.updateStructureAndWireAllElemets($end_iframe);
                                didMakeChange($end_iframe, draggedPlaceholderElement, draggedPlaceholderElement.parent());
                                elementWasMoved(draggedPlaceholderElement, getCrsaPageForIframe($start_iframe), getCrsaPageForIframe($end_iframe))
                                //console.log('dropped');
                            }
                        } else {
                            draggedPlaceholderElement.remove();
                            pgEl.remove();
                        }
                        elementUnderMouse = null;


                        $.fn.crsapages('clearUndoSetFlag');
                        draggedPlaceholderElement = null;

                    }).on("drag", function(event, ui) {
                        //console.log(ui);
                        // var o = $b_move.
                        elementMovedWithMouse(event);
                    });
            }
            /*
             var zoom = canvas.crsapages('getZoom');
             var cp = $this.position();
             var o = current.offset();
             var x =  o.left * zoom + cp.left;
             var y =  o.top * zoom + cp.top;
             var h = $im.outerHeight();
             y = y - h;
             if(y < 0) y = 0;
             */

            positionElementMenu($im, current, $this);
            inlineMenu = $im;

            var timer;
            inlineMenu
                .on('mousewheel', function(e) {
                    
                    var $ul = $(e.target).closest('ul');
                    if (!$ul.hasClass('dropdown-menu')) {
                        var im = inlineMenu.get(0);
                        if(!im.classList.contains('crsa-disable-hover')) {
                            im.classList.add('crsa-disable-hover')
                        }
                        timer = setTimeout(function(){
                            im.classList.remove('crsa-disable-hover')
                        },250);
                    }
                    
                })
                .on('mouseenter.crsa', function(event) {
                    inlineMenu.stop().animate({'opacity' : 1.0}, 250);
                })
                .on('mouseleave.crsa', function(event) {
                    inlineMenu.stop().animate({'opacity' : 0.25}, 250);
                })

            //highlightElement(highlightedElements);

            //hide menu for HTML
            if(current.is('html')) $im.hide();

            var def = getType(current);
            if(def && def.on_selected) {
                def.on_selected(current);
            }

            profile.show('se 2');

            //pinegrow.takePhotoOfElement(current);

        } else {
            selectedElement = null;
        }
        methods.showSelectedInsertFactory(current);



        // var rules = $this.get(0).contentWindow.getMatchedCSSRules(current.get(0));
        // console.log(rules);
        //window.requestAnimationFrame(function() {
        methods.showProperties(selectedElement, null, def);
        //});

        //profile.show('se prop');
        // showTab('prop');

        if(selectedElement) selectedElement.user_action = user_action;
        $('body').trigger('crsa-element-selected', selectedElement);
        if(selectedElement) selectedElement.user_action = null;

        if(selectedCrsaPage) {
            selectedCrsaPage.callFrameworkHandler('on_element_selected', pgCurrent, current);
        }
        //profile.show('se trigger sel');

        if(selectedPage && current) {
            getCrsaPageForIframe(selectedPage).elementWasSelected(current);
        }

        //profile.show('select element');
    }

    function pagePointToGlobalPoint(x, y, $this) {
        var zoom = canvas.crsapages('getZoom');
        var cp = $this.position();
        var cpp = $this.parent().position();
        cp.left += cpp.left;
        cp.top += cpp.top;
        var newX =  x * zoom + cp.left;
        var newY = y * zoom + cp.top - $this.contents().scrollTop() * zoom;
        return {
            x: newX,
            y: newY
        };
    }

    function positionElementMenu($im, current, $this) {
        var zoom = canvas.crsapages('getZoom');
        var cp = $this.position();
        var cpp = $this.parent().position();
        cp.left += cpp.left;
        cp.top += cpp.top;
        var o = current.offset();
        var x =  o.left * zoom + cp.left;
        var y =  o.top * zoom + cp.top - $this.contents().scrollTop() * zoom;
        var h = $im.outerHeight();
        var w = $im.outerWidth();
        y = y - h;
        if(y < 20) {
            y = (o.top + current.outerHeight()) * zoom + cp.top - $this.contents().scrollTop() * zoom;
            if(y > 100) {
                y = 100;
            } else if(y < 20) {
                y = -100;
            }
        }
        if(x + w > $this.width() * zoom - 100) {
            $im.find('.dropdown-menu').addClass('pull-right');
        }

        if(x + w > $this.width() * zoom) {
            x = $this.width() * zoom - w;
        }
        $im.css('left', x + 'px').css('top', y + 'px');
        return;

        var pos = getElementPositionInCanvas(current, $this);
        var h = $im.outerHeight();
        var y = pos.top - h -100;
        if(y < 0) y = 0;
        $im.css('left', pos.left + 'px').css('top', y + 'px');
    }

    function repositionSelectedElementMenu() {
        if(inlineMenu && selectedElement && selectedElement.type == 'element') {
            positionElementMenu(inlineMenu, selectedElement.data, selectedPage);
        }
    }

    function exportElement($el, $iframe) {
        $('body').crsastorage('auth');
    }


    function findActionMenuForInsertingDefIntoEl(newdef, $el, defs) {
        if(!defs) defs = selectedCrsaPage.getAllTypes($el);
        var f = null;
        $.each(defs, function(i, def) {
            if(def.action_menu && def.action_menu.add) {
                if(def.action_menu.add.indexOf(newdef.type) >= 0) {
                    f = def.action_menu;
                    return false;
                }
            }
        });
        return f;
    }

    function addAsComponent($el, fm) {

        if($el.is('body') || $el.find('body').length || $el.closest('body').length == 0) {
            showAlert('BODY and HEAD elements can\'t be added as snippet', 'Notice');
            return;
        }

        if(!fm) {
            $.each(selectedCrsaPage.frameworks, function(i, f) {
                if(f.user_lib) {
                    fm = f;
                    return false;
                }
            });
        }

        var section;
        if(!fm) {
            fm = new PgFramework("userlib" + Math.floor(Math.random()*100000), "User Lib");
            fm.user_lib = true;
            pinegrow.addFramework(fm);
            selectedCrsaPage.addFramework(fm);
        } else {

        }
        if(fm.lib_sections.length > 0) {
            section = fm.lib_sections[0];
        } else {
            section = new PgFrameworkLibSection(fm.key + "_components", "Snippets");
            fm.addLibSection(section);
        }

        var aid = fm.getAutoId("comp");

        var comp = new PgComponentType(aid.type, "Comp " + aid.count);

        copyElementToDef($el, comp, selectedCrsaPage, true);

        fm.addComponentType(comp);
        section.addComponentType(comp);

        fm.changed = true;

        pinegrow.frameworksChanged();

        crsaQuickMessage("Snippet was added to LIB.")
    }

    function copyElementToDef($el, comp, page, do_name) {
        var types = page.getAllTypes($el);

        var pgel = getElementPgNode($el);
        if(pgel) {
            comp.code = pgel.toStringOriginal(true, pinegrow.getFormatHtmlOptions());
        } else {
            comp.code = $el.get(0).outerHTML;
            comp.code = removeCrsaClassesFromHtml(comp.code.replace(/\s*data\-pg\-[a-z\-]+="[^"]*"/g, ''));
        }

        comp.parent_selector = null;
        comp.preview = null;

        var name_done = !do_name;
        $.each(types, function(i, def) {
            if(def.name && !name_done) {
                name_done = true;
                comp.name += ' / ' + def.name;
            }
            if(def.parent_selector) {
                comp.parent_selector = def.parent_selector;
                /*    if(def.invalid_drop_msg) {
                 comp.invalid_drop_msg = def.invalid_drop_msg;
                 }*/
                return false;
            }
        });
    }

    window.getElementPositionOnScreen = function($el, $iframe) {
        if(!$iframe) $iframe = getIframeOfElement($el);
        var p = getElementPositionOnPage($el, $iframe);
        var $page = $iframe.closest('.page');
        var pp = $page.offset();
        p.left = p.left + pp.left;
        p.top = p.top + pp.top + canvas.scrollTop();
        return p;
    }

    window.getElementPositionInCanvas = function($el, $iframe) {

        if(!$iframe) $iframe = getIframeOfElement($el);
        if(!$iframe) return;
        var zoom = canvas.crsapages('getZoom');
        var cp = $iframe.position();
        var $page = $iframe.closest('.page');
        var pp = $page.position();
        var o = $el ? $el.offset() : {top:0, left:0};
        var x =  o.left * zoom + cp.left + pp.left*0;
        var y =  o.top * zoom + cp.top + pp.top + canvas.scrollTop() - $iframe.contents().scrollTop() * zoom;
        return {left: x, top: y, width: $el ? $el.outerWidth() : 0, height: $el ? $el.outerHeight() : 0};
    }

    window.getElementPositionOnPage = function($el, $iframe) {

        if(!$iframe) $iframe = getIframeOfElement($el);
        if(!$iframe) return;
        var zoom = canvas.crsapages('getZoom');
        var cp = $iframe.position();
        var cpp = $iframe.parent().position();
        cp.left += cpp.left;
        cp.top += cpp.top;
        var o = $el ? $el.offset() : {left:0, top:0};
        var x =  o.left * zoom + cp.left;
        var y =  o.top * zoom + cp.top - $iframe.contents().scrollTop() * zoom;
        return {left: x, top: y, width: $el ? $el.outerWidth() * zoom : 0, height: $el ? $el.outerHeight() * zoom : 0};
    }


    window.scrollCanvasToElement = function($el, page) {
        var $iframe = page ? page : getIframeOfElement($el);
        if(!$iframe) return;
        if($el) {
            scrollToElementInIframe($el, $iframe);
        }

        var ep = getElementPositionInCanvas($el, $iframe);

        if(canvas.scrollTop() <= ep.top && canvas.scrollTop() + canvas.height() > ep.top) {
            //if($el) scrollToElement($iframe[0], $el);
        } else {
            var y = ep.top - 100;
            if(y < 0) y = 0;
            //canvas.scrollTop(y);
            canvas.animate({scrollTop: y}, 150, function() {
                //if($el) scrollToElement($iframe[0], $el);
            });
        }
    }

    window.scrollToElementInIframe = function($el, $iframe) {
        if(!$iframe) return;
        var $contents = $iframe.contents();
        //var win = $iframe.get(0).contentWindow;
        //var h = win.outerHeight;//$(win).height();
        var h = $iframe.get(0).clientHeight;
        var st = $contents.scrollTop();
        var y = $el.offset().top;
        if(y < st || y > st + h) {
            if(y >= h/3.0) y -= Math.floor(h/3.0);
            $contents.scrollTop(y);
        }
    }

    window.scrollCanvasToPage = function($iframe) {
        scrollCanvasToElement(null, $iframe);
    }


    window.showAutoCompleteOnInput = function(mirror) {
        var debounce;
        mirror.on("inputRead", function(cm) {
            clearTimeout(debounce);
            if (!cm.state.completionActive) debounce = setTimeout(function() {

                try {
                    //debugger;
                    if(pinegrow.getSetting('code-autocomplete','1') == '1') {
                        var cursor = cm.getDoc().getCursor();
                        var mode = cm.getModeAt(cursor);


                        if(mode && mode.name == 'xml') {
                            var line = cm.getDoc().getLine(cursor.line);
                            var steps = 0;
                            for(var i = cursor.ch - 1; i >= 0; i--) {
                                if(line.charAt(i) == '<') {
                                    cm.showHint(cm);
                                } else if(line.charAt(i) == '>' || steps > 1000) {
                                    break;
                                }
                                steps++;
                            }
                        } else {
                            //css
                            var line = cm.getDoc().getLine(cursor.line);
                            if(line.charAt(cursor.ch-1).match(/[a-z0-9\-]/)) {
                                cm.showHint(cm);
                            }
                        }
                    }
                }
                catch(err) {}

            }, 300);
        });
    }

    window.showCodeEditor = function(mode, title, settingsPrefix, onChange, onOk, onCancel) {

        var $body = $('body');

        var $dialog = makeDialog(title, "Cancel", "Close &amp; Keep changes [Esc]", "<div></div>").css('width','50%').addClass('crsa-dialog-edit');
        $body.append($dialog);

        $dialog.on('keydown', function(e) {
            if(e.which == 27) {
                $dialog.find('button.ok').trigger('click');
                e.preventDefault();
            }
        });

        $dialog.addClass('code-edit');

        var has_changes = false;
        var has_content = false;
        var has_errors = false;

        var h = 200;
        var w = 500;

        var $content = $dialog.find('.modal-body>div');

        var $editor_el = null;

        var mirror = CodeMirror(function(elt) {
            $editor_el = $(elt);
            $content.append($editor_el.css('height','100%'));
        }, {
            mode: mode,
            autoFocus: true,
            theme: pinegrow.getSetting('code-theme-cm', 'eclipse'),
            indentUnit: parseInt(pinegrow.getSetting('html-indent-size', '4')),
            lineWrapping: true,
            lineNumbers: true,
            matchBrackets: true,
            autoCloseBrackets: true,
            autoCloseTags: true,
            matchTags: true,
            //undoDepth: 0,
            extraKeys: {
                "Ctrl-Q": function(cm){ cm.foldCode(cm.getCursor()); },
                "Ctrl-Space": "autocomplete",
                //"Ctrl-Z": function(cm) {}
            },
            foldGutter: true,
            gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"],
            profile: 'xhtml',
            hintOptions : {
                completeSingle: false
            }
        });

        showAutoCompleteOnInput(mirror);

        setLightDarkClassForEditor($editor_el, pinegrow.getSetting('code-theme-cm', 'eclipse'));

        pinegrow.code_editors.register(mirror);

        $editor_el.attr('data-has-codemirror','').data('codeMirrorInstance', mirror);

        if(pinegrow.getSetting('editor-emmet', 'false') == 'true') {
            emmetCodeMirror(mirror);
        }



        var $chk = $('<label class="pull-left control-label" style="font-weight: normal;"><input type="checkbox" class="wrap"> Wrap lines</label>');
        $dialog.find('.modal-footer').prepend($chk);

        if(pinegrow.getSetting(settingsPrefix + '-wrap', '1') == '1') {
            $chk.find('input').attr('checked', 'checked');
            mirror.setOption('lineWrapping', true);
        } else {
            $chk.find('input').removeAttr('checked');
            mirror.setOption('lineWrapping', false);
        }

        $chk.on('change', function() {
            var checked = $chk.find('input').is(':checked');
            mirror.setOption('lineWrapping', checked);
            pinegrow.setSetting(settingsPrefix + '-wrap', checked ? '1' : '0');
        })

        setTimeout(function() {
            mirror.focus();
        }, 100);

        mirror.on('change', function() {
            has_errors = onChange();
            if(has_content) has_changes = true; //first change is initializing the content
            has_content = true;
        });

        $dialog.find('button.cancel').click(function() {
            var close = function() {
                onCancel();
                $dialog.hide();
                $dialog.remove();
                pinegrow.code_editors.unregister(mirror);
            }

            if(has_changes && !mirror.getOption('readOnly')) {
                showAlert('<p>Are you sure you want to cancel? Code changes will be lost.</p>', 'Confirmation', 'Don\'t close', 'Close it', function() {}, function() {
                    close();
                })
            } else {
                close();
            }

        });

        $dialog.find('button.close, button.ok').click(function() {
            var ok = function() {
                onOk();
                $dialog.hide();
                $dialog.remove();
                pinegrow.code_editors.unregister(mirror);
            }
            if(has_changes && has_errors && !mirror.getOption('readOnly')) {
                showAlert('<p>Are you sure you want to close the editor? The code has syntax errors and code changes were not applied to the document.</p>', 'Code has syntax errors', 'Don\'t close', 'Close it', function() {}, function() {
                    ok();
                })
            } else {
                ok();
            }
        });


        if(settingsPrefix) {
            h = parseInt(pinegrow.getSetting('editor_' + settingsPrefix + '_h', h));
            w = parseInt(pinegrow.getSetting('editor_' + settingsPrefix + '_w', w));
        }

        $content.css('height', h+'px');
        $dialog.css('width', w + 'px');

        var chrome_h = $dialog.height() - $content.height();

        var x = ($body.width() - $dialog.width() - 100);
        var y = $body.height() - $dialog.height() - 200;

        x = parseInt(pinegrow.getSetting('editor_' + settingsPrefix + '_x'));
        y = parseInt(pinegrow.getSetting('editor_' + settingsPrefix + '_y'));

        // console.log(y, h, $body.height(), chrome_h);
        if(x + w > $body.width()) x = $body.width() - w;
        if(x < 0) x = 0;
        if(y + h + chrome_h > $body.height()) y = $body.height() - h - chrome_h;
        if(y < 0) {
            y = 0;
            h = 200;
            $content.css('height', h+'px');
            pinegrow.setSetting('editor_' + settingsPrefix + '_h', h);
        }

        $dialog.css('top', y + 'px').css('left', x + 'px');
        $dialog.find('.modal-header').css('cursor', 'move');
        $dialog.draggable({handle: '.modal-header'})
            .on('dragstart', function() {
                $.fn.crsapages('showOverlays');
            })
            .on('dragstop', function() {
                $.fn.crsapages('showOverlays', true);
                mirror.refresh();
                pinegrow.setSetting('editor_' + settingsPrefix + '_y', $dialog.css('top').replace('px',''));
                pinegrow.setSetting('editor_' + settingsPrefix + '_x', $dialog.css('left').replace('px',''));
            });


        $dialog.resizable({
            minHeight: 200,
            minWidth: 400,
            resize: function(event, ui) {
                var ch = ui.size.height - chrome_h;
                $content.css('height', ch + 'px');
            },
            start: function(event, ui) {
                $.fn.crsapages('showOverlays');
            },
            stop: function(event, ui) {
                $.fn.crsapages('showOverlays', true);
                mirror.refresh();
                if(settingsPrefix) {
                    pinegrow.setSetting('editor_' + settingsPrefix + '_h', ui.size.height - chrome_h);
                    pinegrow.setSetting('editor_' + settingsPrefix + '_w', ui.size.width);
                }
            }
        });

        return {mirror: mirror, dialog: $dialog, editor_el: $editor_el};
    }


    function editElementSource($el) {

        pinegrow.stats.using('edit.elementcode');

        if($el.is('script') || $el.find('script').length > 0) {
            //showAlert("<p>Editing code blocks <strong>with scripts</strong> is not supported.</p><p>Use page code view instead (Page -&gt; Edit code).</p>", "Can't edit code here");
            //return;
        }


        if($el.is('body') || $el.is('head') || $el.find('body').length) {
            showAlert("<p>Use page code view to edit the code of the whole page including <b>body</b> and <b>head</b> (<b>Page -&gt; Edit code</b> or <b>CMD + E</b>).</p><p>Or edit the code of <b>individual elements within body or head</b>.</p>", "Can't edit code here");
            return;
        }

        var pgEl = getElementPgNode($el);

        var problems = new pgParserSourceProblem(pgEl, $el);

        if(!pgEl) {
            problems.add('element', getElementName($el), 'find');
        }
        if(!problems.ok()) {
            showAlert(problems.toString(), "Can't edit this element");
            return;
        }
        if(!canMakeChange(pgEl, 'edit_code')) return;

        var crsaPage = pinegrow.getCrsaPageOfPgParserNode(pgEl);

        var dynmirror = null;
        var change_happened = false;

        var $parent = $el.parent();

        willMakeChange(selectedPage, "Edit element code / " + getElementName($el));

        var editorData = showCodeEditor("application/x-httpd-php", /* "text/html",*/ "Edit element code", 'edit-element-html',
            function() {
                //onchange
                if(applySource(mirror.getDoc().getValue())) {
                    ignore_select_element = true;
                    methods.setNeedsUpdateDelayed($parent);
                    didMakeChange(selectedPage);
                }
                return has_error;
            },
            function() {
                //on ok
                removeEventHandlers();
                if(has_error) {
                    applySource(original_source, true);
                    ignore_select_element = true;
                    methods.setNeedsUpdate(true, $parent);
                    didMakeChange(selectedPage);
                }
                methods.setNeedsUpdate(true, $parent);

            }, function() {
                //on cancel
                removeEventHandlers();
                if(change_happened) {
                    applySource(original_source, true);
                    ignore_select_element = true;
                    methods.setNeedsUpdate(true, $parent);
                    didMakeChange(selectedPage);
                }
                getCrsaPageForIframe(selectedPage).undoStack.remove();

            });

        var mirror = editorData.mirror;
        var $dialog = editorData.dialog;
        var $chk = $dialog.find('.modal-footer label');

        mirror.on('contextmenu', function(instance, event) {
            codeEditor.selectClickedElement(mirror, event, crsaPage);
        });

        editorData.editor_el.on('copy', function() {
            var selectedText = mirror.getDoc().getSelection();

            if(selectedText && selectedText.length) {

                setTimeout(function() {
                    var gui = require('nw.gui');
                    var clipboard = gui.Clipboard.get();
                    selectedText = pgRemovePgIdsFromCode(selectedText);
                    //console.log(selectedText);
                    clipboard.set(selectedText, 'text');
                }, 50);
            }
        });

        var element = $el.get(0);

        var ignore_change = false;
        var ignore_select_element = false;

        var applySource = function(s, force) {
            if(ignore_change) return false;
            s = $.trim(s);

            change_happened = true;
            //debugger;
            try {
                var pgNewEl = pgCreateNodeFromHtml(s);
                pinegrow.httpServer.setCurrentRequestContext(selectedCrsaPage.url, selectedCrsaPage.sourceNode);
                var html = pgNewEl.toStringWithIds(true, pinegrow.getFormatHtmlOptions(), function(linkNode, str, type) {
                    if(type == 'node' && linkNode.tagName == 'script' && linkNode.getAttr('type') != 'php') {
                        return '<script data-pg-id="' + linkNode.getId() + '"></script>';
                    }
                    return pinegrow.httpServer.createProxyUrlNodeOutputFilter(linkNode, str, type);
                });

                if(pgNewEl.validateTree().length && !force) {
                    throw 'Syntax error - pgParser';
                }

                //console.log(html);
                var $newEl = $(getIframeDocument(selectedPage.get(0)).createElement('div')).append(html).contents();
                //console.log($newEl);

                if($newEl.length != 1 && !force) {
                    throw "Syntax error - DOM";
                }

                $el.replaceWith($newEl);
                if(selectedElement && selectedElement.type == 'element'
                    && (selectedElement.data.get(0) == $el.get(0)
                    || jQuery.contains($el.get(0), selectedElement.data.get(0)))
                    ) {
                    selectedElement = getObjectFromElement($newEl);
                }
                $el = $newEl;

                pgEl.replaceWith(pgNewEl);
                pgEl.remove();
                pgEl = pgNewEl;
                setDialogNotice($dialog, '');
                $chk.show();

                last_good_source = s;
                has_error = false;
                return true;
            }
            catch(err) {
                has_error = true;
                $chk.hide();
                setDialogNotice($dialog, 'Syntax error - or - You\'re editing more than one HTML element!', 'text-danger');
            }
            return false;
        }

        var code_ignore_change_timeout = null;

        var original_source;// = element.outerHTML;

        original_source = pgEl.toStringWithIds(true, pinegrow.getFormatHtmlOptions());

        var last_good_source = original_source;
        var has_error = false;

        /*
         pinegrow.httpServer.setCurrentRequestContext(selectedCrsaPage.url, selectedCrsaPage.sourceNode);
         var original_source = pgEl.toStringWithIds(true, pinegrow.getFormatHtmlOptions(), function(linkNode, str, type) {
         if(type == 'node' && linkNode.tagName == 'script') {
         return '<script data-pg-id="' + linkNode.getId() + '"></script>';
         }
         return pinegrow.httpServer.createProxyUrlNodeOutputFilter(linkNode, str, type);
         });
         */



        //source = pinegrow.formatHtml(source);
        var id_to_markers = {};

        var setCode = function(source) {
            var source = removeCrsaClassesFromHtml(source);

            ignore_change = true;

            if(code_ignore_change_timeout) {
                clearTimeout(code_ignore_change_timeout);
                code_ignore_change_timeout = null;
            }

            mirror.operation(function() {
                var si = mirror.getScrollInfo();
                mirror.getDoc().setValue(source);
                id_to_markers = codeEditor.findAndHideIds(mirror, id_to_markers);
                mirror.getDoc().clearHistory();
                mirror.scrollTo(si.left, si.top);

                code_ignore_change_timeout = setTimeout(function() {
                    ignore_change = false;
                    code_ignore_change_timeout = null;
                }, 100);
            });
        }

        setCode(original_source);

        var $modal_body = $dialog.find('.modal-body>div');

        var onPageChanged = function(event, changeObj) {
            if(changeObj.element) {
                var chpgel = getElementPgNode(changeObj.element);
                if(chpgel) {
                    if(chpgel == pgEl || chpgel.isDescendantOf(pgEl)) {
                        original_source = pgEl.toStringWithIds(true, pinegrow.getFormatHtmlOptions());
                        setCode(original_source);
                        if(selectedElement) {
                            //onElementSelected(null, selectedElement);
                        }

                    }
                }
            }
        }

        $body.on('crsa-page-changed', onPageChanged);

        var onElementSelected = function(e, element) {
            if(element && element.user_action) {
                setTimeout(function() {
                    if(!ignore_select_element && element && element.type == 'element') {
                        var $el = element.data;
                        codeEditor.selectElementInCodeMirror($el, mirror, id_to_markers);
                    }
                    ignore_select_element = false;
                }, 100); //delay so that we're called after crsa-page-changed event
            }
        }

        $body.on('crsa-element-selected', onElementSelected);

        var removeEventHandlers = function() {
            $body.off('crsa-page-changed', onPageChanged);
            $body.off('crsa-element-selected', onElementSelected);
        }

        return;

        var p = pgFindDynamicDiffs(pgEl, $el);
        if(p) {
            editorData.editor_el.css('height', '60%');

            var html = pgDescribeDynamicDiffs(p);

            html = $.trim(html);

            $modal_body.css('height', '300px');
            $modal_body.append('<div class="dynamic-info">This element contains <a href="#">dynamic content</a>:<pre>' + html + '</pre></div>');
            $modal_body.find('a').tooltip({container: 'body', placement: 'top', title: 'Dynamic elements are not present in source files. They are usually added or changed by Javascript code after the page is loaded. Edit the Javascript code if you want to change them.', trigger: 'hover'});
        }
    }




    function detagElement($el, $iframe) {
        $el.replaceWith($el.contents());
        var pgel = getElementPgNode($el);
        if(pgel) pgel.detag();
        methods.updateStructureAndWireAllElemets($iframe);
        setUndoPointForCurrentPage($iframe);
    }

    /*

     function walkCrsaTreeLevel($e, level, func) {
     func(level, $e);
     //var children = $e.data('crsa-children');
     var children = $e.children('.crsa-element');

     if(children && children.length > 0) {
     $.each(children, function(i, c) {
     walkCrsaTreeLevel($(c), level + 1, func);
     });
     }
     }
     */

    function getObjectName(obj, def, html, cls, get_text, show_tag) {
        if(obj.type == 'element') return getElementName(obj.data, def, html, cls, get_text, show_tag);
        if(obj.type == 'rule') return getRuleName(obj.data);
    }

    var measureInputWidthHelper = null;

    function measureInputWidth(str) {
        if(!measureInputWidthHelper) {
            measureInputWidthHelper = $('<div class="measure-input-width-helper"></div>').appendTo($('body'));
        }
        measureInputWidthHelper.text(str);
        return measureInputWidthHelper.width();
    }

    function showClassManager($el, filter, active) {
        var $cm = $("#crsa-rules-out .panel-content");
        var $rules_div = $('#crsa-rules');
        classManager.setReferenceElement($el, true);
        classManager.setShowOnlyClasses(false, true);
        if(typeof active != 'undefined') {
            classManager.setOnlyActive(active, false);
        }
        classManager.setFilter(filter ? filter : null);
        classManager.filter_set_in_props_mode = filter ? true : false;
        classManager.showListPanel(false);

        var $cssTab = $('#tab4');
        if(!$cssTab.hasClass('active')) {
            if($cm.find('#crsa-rules').length == 0) $cm.append($rules_div);
            $("#crsa-rules-out").data('panel').show();
        }
        classManager.resizeRulesList();
    }

    function updateRulesList($fc, $el, values, fn) {
        var selectors;
        if(customLogic.showOnlyClassesInProperties) {
            selectors = $.fn.crsacss('getClassesForElement', $el);
        } else {
            selectors = $.fn.crsacss('getRulesForElement', $el, true, true);
        }
        if(selectors) {
            var $ul = $('<ul/>', {class: 'clearfix'}).appendTo($fc);
            $.each(selectors, function(i,cls) {
                //  var cls = rule.selector;
                if(typeof cls == 'object') {
                    if(cls.selector) {
                        cls = cls.selector;
                    } else {
                        cls = null;
                    }
                }
                if(cls) {
                    var isClass = getClassFromSelector(cls) != null;
                    var $ric = $('<li/>', { 'class' : 'crsa-input-rule' + (isClass ? ' class' : '')}).appendTo($ul).data('class', cls).html(cls);
                    //var $ri = $('<a/>', {'class' : 'crsa-input-rule', 'href' : '#'}).html(cls).appendTo($ric);
                    if(isClass) {
                        var $remove = $('<i/>', {'class' : 'fa fa-times crsa-input-rule-remove'}).appendTo($ric);
                    }
                }
            });
        }
        var $addc = $('<li/>', { 'class' : 'link crsa-input-add-class'}).appendTo($ul).html('<a href="#">+ Add class</a>');

        $addc.find('a').on('click', function(e) {
            e.preventDefault();
            showAddClassBox($(e.delegateTarget));
        });




        //var $ric = $('<div/>', { 'class' : 'crsa-input-rule-c'}).appendTo($fc);
        if(!pinegrow.isContributorMode()) {
            var $ri = $('<a/>', {class: 'cm-prop-addrule', href:"#"}).html('CSS Rules...').appendTo($fc.closest('.section').find('h2')).on('click', function(event) {
                showClassManager($el);
                event.preventDefault();
                event.stopPropagation();
                //showAddClassBox($(event.delegateTarget));
            });
        }

        $fc.find('.crsa-input-rule-remove').on('click', function(event) {
            var $ri = $(event.delegateTarget);
            var $ric = $ri.parent();
            var cls = $ric.data('class');

            $('#crsa-rules').trigger('crsa-cm-class-remove', cls);
            /*
             var $el = selectedElement.data;
             willMakeChange(selectedPage, getElementName($el) + " | Remove class " + cls)
             $el.removeClass(cls.replace('.',''));
             selectElement($el);
             didMakeChange(selectedPage);
             */
            //var $el = selectedElement.data;
            //selectElement($el);

            event.preventDefault();
            event.stopPropagation();
        });

        var $cm = $("#crsa-rules-out .panel-content");
        var $el = selectedElement.data;

        if(!pinegrow.isContributorMode()) {

            $fc.find('.crsa-input-rule').on('click', function(event) {
                var $ri = $(event.delegateTarget);
                var cls = $ri.data('class');

                pinegrow.showCSSRules($el, cls);

                event.preventDefault();
            });
        }


        var showAddClassBox = function($el) {
            var offset = $el.offset();
            var place = offset.left > $(window).width()/2 ? 'left' : 'right';
            var eid = getUniqueId();
            if($el.data('popover-active')) {
                $el.popover('destroy');
                $el.data('popover-active', null);
                return;
            }
            var ensureRemove = function($e) {
                setTimeout(function() {
                    $e.closest('.popover').remove();
                }, 250);
            }

            var pop = $el.popover({
                html: true,
                placement: place,
                trigger: 'manual',
                title: 'Assign CSS class',
                container: 'body',
                content: '<form id="' + eid + '"><div class="form-group"><!--<input class="form-control" placeholder="class-name" style="margin-bottom:8px;"/>--><div class="class-field"></div><p class="help-block"></p></p><button class="ok assign btn">Assign</button><button class="ok show-css btn btn-link">Show CSS rules</button><button class="closeit btn btn-link">Cancel</button></div></form>'
            })
                .on('shown.bs.popover', function() {
                    var $d = $('#' + eid);

                    var multiselectOptions = {};
                    multiselectOptions['newItem'] = true;
                    multiselectOptions['mode'] = 'input';
                    multiselectOptions['getItems'] = function () {
                        return pinegrow.insight.getClasses();
                    };

                    pgAutoComplete = PgAutoComplete($d.find('.class-field'), multiselectOptions);
                    var $i = pgAutoComplete.get$input().focus().css('width','100%');
/*
                    var $classField = $d.find('.class-field');
                    new PgAutoComplete($classField, multiselectOptions);
                    pgAutoComplete = $classField.data('pg-autocomplete');
                    var $i = pgAutoComplete.$input.focus().css('width','100%');
*/

                    $i.attr('placeholder', 'class-name').addClass('form-control');

                    //var $i = $d.find('input').focus();

                    var $form = $d;
                    var $b = $d.find('button.assign');
                    var $a = $d.find('button.show-css');
                    var $help = $d.find('p.help-block').hide();
                    // $a.tooltip({container: 'body', placement: 'bottom', title: 'Create the class and assign it to the selected element.', trigger: 'hover'});
                    var $bc = $d.find('button.closeit');

                    var doAdd = function(e) {
                        var r = $.trim($i.val());
                        if(!r || r.length == 0) {
                            $d.addClass('has-error');
                            return;
                        }
                        r = r.replace('.','');
                        $('#crsa-rules').trigger('crsa-cm-class-add', r);
                        $el.popover('hide');
                        ensureRemove($d);
                    }

                    $form.on('submit', function(e) {
                        e.preventDefault();
                        doAdd(e);
                    });
                    $b.on('click', function(e) {
                        e.preventDefault();
                        doAdd(e);
                    });
                    $a.on('click', function(e) {
                        e.preventDefault();
                        showClassManager($el);
                        $el.popover('hide');
                        ensureRemove($d);
                    });

                    $bc.on('click', function(e) {
                        // $a.tooltip('destroy');
                        $el.popover('hide');
                        e.preventDefault();
                        ensureRemove($d);
                    });
                })
                .on('hidden.bs.popover', function() {
                    pgRemoveMultiselects($d);
                    setTimeout(function() {
                        pgRemoveMultiselects($el);
                        $el.popover('destroy').data('popover-active', null);
                    },10);
                });
            $el.popover('show').data('popover-active', true);
        }


    }


    var getFieldDefOptions = function(fdef, obj) {
        try {
            if(!fdef.options) return null;
            return typeof fdef.options == 'function' ? fdef.options(fdef, obj) : fdef.options;
        } catch(err) {
            console.log('get select options error: ' + err);
            return null;
        }
    }

    var walkDom = function walk(node, func, filter, active_parent) {
        var do_it = filter ? filter(node, active_parent) : true;
        if(node && do_it) {
            func(node);
        }
        if(!node) return;
        node = node.firstChild;
        while (node) {
            walk(node, func, filter, do_it || active_parent);
            node = node.nextSibling;
        }
    }

    function scrollToElement(doc, $e) {
        var o = $e.offset().top;
        doc.contentWindow.scrollTo(0,o);
        return;
        $container.scrollTop(300);
        return;
        $container.animate({
            scrollTop: $e.offset().top - $container.offset().top + $container.scrollTop()
        });
    }

    function getInnerContainer($el) {
        var def = getType($el, false);
        return def.inner_container ? $el.find(def.inner_container) : $el;
    }

    function log( msg ) {
        if ( window.console && window.console.log ) {
            window.console.log('CRSA - ' + msg);
        }
    }



    function getLessSourceForRules(rules) {
        var lessStr = '';
        $.each(rules, function(i, rd) {
            lessStr += rd.selector + "\n{";
            $.each(rd.styles, function(i,s) {
                lessStr += "    " + i + ": " + s + ";\n";
            });
            lessStr += "}\n\n";
        });
        return lessStr;
    }

    function showTab(tab) {
        var $left = $('#crsa-left-plane .nav-tabs');
        switch(tab) {
            case 'lib':
                $left.find('li:eq(0) a').tab('show');
                break;
            case 'prop':
                $left.find('li:eq(1) a').tab('show');
                break;
            case 'css':
                $left.find('li:eq(2) a').tab('show');
                break;
            case 'act':
                $left.find('li:eq(3) a').tab('show');
                break;
            case 'wp':
                $left.find('li:eq(4) a').tab('show');
                break;
            case 'project':
                $left.find('li:eq(5) a').tab('show');
                break;
        }
    }

    function setUndoPointForCss(name) {
        if(!name) name = 'Change';
        getCrsaPageForIframe(selectedPage).undoStack.add(name);
        //crsaundo.add('css', selectedPage.crsacss('getLessSource'), 'name');
    }

    function setUndoPointForCurrentPage($page) {
        if(!$page) $page = selectedPage;
        //crsaundo.add('page', {page : $page, html : getPageSource($page)}, 'name');
    }

    function setUndoPointForAll() {
        // crsaundo.add('all', {page : selectedPage, html : getPageSource(selectedPage), css: selectedPage.crsacss('getLessSource')}, 'name');
    }

    window.getPreviewPosition = function(preview_w, p) {
        p = p || $("#crsa-left-plane");
        var o = p.offset();
        var w = $(window).width();
        if(o.left > w - o.left - p.width()) {
            //more space on left
            return o.left - preview_w - 20;
        } else {
            return o.left + p.width() + 0;
        }
    }

    function resizeChrome() {
        var layout = pinegrow.getSetting('ui-panel-layout', "L,P,C,T").split(',');

        var $w = $(window);
        var w = $w.width();
        var h = $w.height();

        //canvas
        var o = canvas.offset();
        var ch = h - o.top;
        var canvasH = ch;

        //left plane
        var $leftPane = $("#crsa-left-plane");
        var $tree = $('#crsa-tree');
        var $code_wrapper = $("#textedit_wrapper");
        var $code = $("#textedit");
        var $code_bar = $("#textedit_bar");
        var codeMode = codeEditor.isInEdit() && !codeEditor.showInExternalWindow;

        var leftPaneOffset = $leftPane.offset();

        var leftPaneHeight = canvasH;//h - leftPaneOffset.top;
        $leftPane.css('height', leftPaneHeight + 'px');

        var $ruleProps = $('#crsa-rules-out');
        $ruleProps.data('panel').autoSize();

        var $tabContent = $leftPane.find('.tab-content');
        var tabContentPosition = $tabContent.position();
        var tabContentHeight = leftPaneHeight - tabContentPosition.top;
        $tabContent.css('height', tabContentHeight + 'px');



        //tree

        var treeOffset = $tree.offset();
        var treeHeight = canvasH;//h - treeOffset.top;
        $tree.css('height', treeHeight + 'px');
        //  $tree.perfectScrollbar('update');

        /////
        //$leftPane.css('left', 'auto');
        //$leftPane.css('right', ($tree.width() + 1) + 'px');
        //canvas.crsapages('centerPages', 10, ($tree.is(':visible') ? (w - $tree.offset().left + 10) : 10) + ($leftPane.is(':visible') ? ($leftPane.offset().left + $leftPane.width() + 10) : 10));




        var before_canvas = true;
        var x = 0;
        var canvas_left = 10;
        var canvas_right = 0;//10;

        var widths = {
            'L' : $leftPane.is(':visible') ? $leftPane.width() : 0,
            'T' : $tree.is(':visible') ? $tree.width() : 0,
            'C' : 0
        }

        var getRemainingWidth = function(i) {
            var w = 0;
            for(var j = i + 1; j < layout.length; j++) {
                w += (widths[layout[j]] + spacer) || 0;
            }
            return w;
        }

        var spacer = 1;

        layout.forEach(function(item, i) {

            switch(item) {
                case "P":
                    canvas_left = x + 10;
                    before_canvas = false;
                    break;

                case "C":
                    break;

                case "L":
                    if($leftPane.is(':visible')) {
                        if(before_canvas) {
                            $leftPane.css('left', x + 'px');
                            $leftPane.css('right', 'auto');
                            $leftPane.addClass('left-side');
                            x += widths[item] + spacer;
                        } else {
                            $leftPane.css('right', (getRemainingWidth(i)) + 'px');
                            $leftPane.css('left', 'auto');
                            canvas_right += widths[item] + spacer;
                            $leftPane.removeClass('left-side');
                        }
                    }
                    break;

                case "T":
                    if($tree.is(':visible')) {
                        if(before_canvas) {
                            $tree.css('left', x + 'px');
                            $tree.css('right', 'auto');
                            $tree.addClass('left-side');
                            x += widths[item] + spacer;
                        } else {
                            $tree.css('right', (getRemainingWidth(i)) + 'px');
                            $tree.css('left', 'auto');
                            $tree.removeClass('left-side');
                            canvas_right += widths[item] + spacer;
                        }
                    }
                    break;
            }
        })



        ///code
        if(codeMode) {
            //$leftPane.hide();

            //$tree.hide();

            var codeOffset = $code.offset();
            var codeHeight = h - codeOffset.top;
            var codeWidth = (w - $tree.width() - ($leftPane.width() + $leftPane.offset().left)) / 2;

            if(localStorage.crsaCodeEditWidth) {
                codeWidth = parseInt(localStorage.crsaCodeEditWidth);
                if(codeWidth < 200) codeWidth = 200;
            }
            var codeLeft = w - $tree.width() - 0 - codeWidth;//$leftPane.offset().left + $leftPane.width() + 5;

            if(codeLeft < 20) {
                codeWidth = codeWidth - (20 - codeLeft);
                codeLeft = 20;
            }
            codeHeight = parseInt(localStorage.crsaCodeEditHeight || (h * 0.4));

            if(codeHeight < 80) codeHeight = 80;
            if(codeHeight > h - 80) codeHeight = h - 80;

            var codeY = h - codeHeight;
            //var barH = 30;

            canvasH = codeY - 20;// - barH;

            var code_left = canvas_left - 10;
            var code_right = canvas_right;// - 10;

            $code_wrapper.css('height', codeHeight /* - barH */ + 'px').css('left', code_left + 'px').css('right', code_right + 'px').css('top', codeY /*+ barH*/ + 'px');

            //$code_bar.css('left', code_left + 'px').css('top',codeY + 'px').css('right', code_right + 'px').show();

            //var barOffset = $code_bar.offset();
            //$code_bar.css('width', codeWidth + 'px');

            //canvas.crsapages('centerPages', $leftPane.offset().left + $leftPane.width() + 10,  10 + $tree.width() + codeWidth);

            setTimeout(function() {
                codeEditor.editorSizeChanged();
            }, 100);

        } else {
            if(!$('.empty-canvas').is(':visible')) {
               // $leftPane.show();
               // $tree.show();
            }
            //$code_bar.hide();
            //canvas.crsapages('centerPages', $leftPane.is(':visible') ? ($leftPane.offset().left + $leftPane.width() + 10) : 10, $tree.is(':visible') ? (w - $tree.offset().left + 10) : 10);
        }
        canvas.css('height', canvasH + 'px');

        //code end
        alignEmptyCanvas();

        if(canvas_right > 0) canvas_right--;
        canvas.crsapages('centerPages', canvas_left, canvas_right);

        $tree.find('.filter-form').css('width', (widths['T'] - 46) + 'px');



        $.fn.crsapages('canvasResized');



        //  $('div.canvas').perfectScrollbar('update');
    }

    window.alignEmptyCanvas = function() {
        var $empty = $('.empty-canvas');
        //$empty.show();
        $empty.css('padding-top', '0px');
        var eh = $empty.height();
        var ch = $empty.parent().height();
        var ey = parseInt((ch - eh)/3);
        if(ey < 50) ey = 50;
        $empty.css('margin-top', ey + 'px');
    }

    window.canMakeChange = function(pgel, action, data) {
        /*
         edit_code
         insert_element
         move_element
         delete_element
         duplicate_element
         remove_tags
         edit_content
         remove_class
         add_class
         add_action
         remove_action
         edit

         */
        if(!pgel) return true;

        if(pgel.singleTag && action == 'insert_element') {
            pinegrow.showAlert('<p><b>' + pgel.tagName + '</b> can\'t have children elements.</p>', 'Can\'t insert element into ' + pgel.tagName);
            return false;
        }

        var cp = pinegrow.getCrsaPageOfPgParserNode(pgel);
        if(cp) {
            var err = cp.callFrameworkHandler('on_can_make_change', pgel, action, data);
            if(err) {
                var $dialog = pinegrow.showAlert(err.msg, err.reason);
                if(err.on_display) err.on_display($dialog);
                return false;
            }
        }
        return true;
    }

    window.willMakeChange = function(page, name) {
        var cp = getCrsaPageForIframe(page);
        if(crsaIsInEdit()) {
            editor.endEdit();
        }
        cp.undoStack.add(name);
    }

    window.didMakeChange = function(page, $el, changed_el, exclude, event_type, info) {
        var cp = getCrsaPageForIframe(page);
        cp.setPageChanged(true);

        if($el || changed_el) {
            var def;
            var $pel = changed_el ? changed_el : $el;

            do {
                def = getType($pel);
                if(def && def.on_changed) {
                    def.on_changed($pel, cp, def);
                }
                $pel = $pel.parent();
            }
            while($pel.length > 0 && !$pel.is('html'));

            cp.callFrameworkHandler('on_page_changed', changed_el ? changed_el : $el, event_type, info);
        }


        if(customLogic.onPageChanged) {
            customLogic.onPageChanged(page, $el);
        }
        //$body.trigger('crsa-page-changed', cp);

        var pages = $.fn.crsapages('getAllPages');
        $.each(pages, function(i, page) {
            if(page == exclude) return true;
            if(page.live_update == cp) {
                page.onPageChanged(cp);
            }
            if(cp.live_update == page) {
                page.onPageChanged(cp);

                didMakeChange(page.$iframe, null, null, cp);
            }
        });

        if(codeEditor.isInEdit(cp.$iframe)) {
            codeEditor.pageChanged(cp);
        }
        $body.trigger('crsa-page-changed', {page: cp, element: changed_el ? changed_el : $el, eventType: event_type, info: info});

        cp.refreshDisplay(); //force browser redraw

    }

    var removeEmptyPlaceholderFromParents = function($el) {
        var $pel = $el.parent();

        do {
            var parent_q = new pgQuery($pel);
            parent_q.removeClass('pg-empty-placeholder');
            $pel = $pel.parent();
        }
        while($pel.length > 0 && !$pel.is('html'));
    }

    var elementWasInserted = function($el, orig_def) {
        var cp = getCrsaPageForIframe(getIframeOfElement($el));
        if(!cp) return;

        var defs = cp.getAllTypes($el);
        var def;
        for(var i = 0; i < defs.length; i++) {
            def = defs[i];
            if(def && def.on_inserted) {
                def.on_inserted($el, cp);
            }
        }
        def = defs.length ? defs[0] : null;

        if(orig_def && orig_def != def) {
            if(orig_def.on_inserted) {
                orig_def.on_inserted($el, cp)
            }
        }

        cp.callFrameworkHandler('on_element_inserted', getElementPgNode($el), $el, def, defs);

        removeEmptyPlaceholderFromParents($el);

        var $pel = $el.parent();

        do {
            var parent_q = new pgQuery($pel);
            parent_q.removeClass('pg-empty-placeholder');

            def = getType($pel);
            if(def && def.on_child_inserted) {
                def.on_child_inserted($pel, $el, cp);
            }
            $pel = $pel.parent();
        }
        while($pel.length > 0 && !$pel.is('html'));

        if(orig_def && orig_def.empty_placeholder) {
            if(pinegrow.getSetting('show-placeholders', '1') == '1') {
                showNotice('<p><b>Empty ' + $el.get(0).tagName + ' </b>was just added to the page. Pinegrow added <b>pg-empty-placeholder</b> class to it, with <code>min-height:100px</code> so that you can see the element on the page. Once you add content to the element the class is removed. This does not affect how page looks like outside of Pinegrow - it\'s just a help to make editing easier.</p><p>You can enable or disable this behaviour in Support -&gt; Settings.</p>', 'A note about empty elements', 'empty-placeholder-2');
            } else {

            }
        }
    }

    var elementWasDeleted = function($el, cp) {
        var defs = cp.getAllTypes($el);
        var def;
        for(var i = 0; i < defs.length; i++) {
            def = defs[i];
            if(def && def.on_deleted) {
                def.on_deleted($el, cp);
            }
        }
    }

    var elementWasMoved = function($el, from_cp, to_cp) {
        removeEmptyPlaceholderFromParents($el);
        var def = getType($el);
        if(def && def.on_moved) {
            def.on_moved($el, from_cp, to_cp)
        }
    }

    var createUI = function() {
        var navBar = '<div id="crsa-topbar" class="navbar navbar-inverse">\
            <div class="navbar-header">\
                <a class="navbar-brand external-link" href="http://pinegrow.com" target="_blank"><img src="images/logo_white_120.png" height="18" /></a>\
            </div>\
            <div class="" id="main-navbar">\
                <ul class="nav navbar-nav">\
                    <li class="dropdown menu-file menu-file-parent"><a href="#" class="dropdown-toggle menu-file" data-toggle="dropdown"><span>File</span> <b class="caret"></b></a>\
                        <ul class="dropdown-menu">\
                            <li class="remove-in-cm"><a href="#" class="menu-file-template">New page...</a></li>\
                            <li><a href="#" class="menu-file-open-file">Open file...</a></li>\
                            <li class="remove-in-cm"><a href="#" class="menu-file-open-url">Open url...</a></li>\
                            <li><a href="#" class="menu-file-open-project">Open project...</a></li>\
                            <li class="remove-in-cm"><a href="#" class="menu-file-open-project-win">Open project in new win...</a></li>\
                            <li class="remove-in-cm"><a href="#" class="menu-file-load-project-lib">Load project as library...</a></li>\
                            <li class="dropdown menu-file-recent"><a href="#" class="dropdown-toggle" data-toggle="dropdown">Open recent...</a></li>\
                            <li class="divider menu-save-divider"></li>\
                            <li><a href="#" class="menu-file-save">Save</a></li>\
                            <li class="remove-in-cm"><a href="#" class="menu-file-save-html">Save HTML only</a></li>\
                            <li><a href="#" class="menu-file-save-as">Save as...</a></li>\
                            <li><a href="#" class="menu-file-save-all">Save all</a></li>\
                            <li class="divider"></li>\
                            <li><a href="#" class="menu-file-close">Close page</a></li>\
                            <li><a href="#" class="menu-file-close-all">Close all files</a></li>\
                            <li><a href="#" class="menu-file-close-project">Close project</a></li>\
                            <li class="divider menu-project-divider"></li>\
                            <li><a href="#" class="menu-file-save-project">Remember project</a></li>\
                            <li><a href="#" class="menu-file-load-project">Load project</a></li>\
                            <li><a href="#" class="menu-file-download">Download project Zip</a></li>\
                            <li class="divider"></li>\
                            <li><a href="#" class="menu-file-cache">Clear cache</a></li>\
                            <li><a href="#" class="menu-file-manage-ss">Manage stylesheets...</a></li>\
                            <li><a href="#" class="menu-file-manage-fm">Manage libraries &amp; plugins...</a></li>\
                            <li><a href="#" class="menu-dev-tools">Development tools</a></li>\
                            <li><a href="#" class="menu-file-new-window">Open new window</a></li>\
                            <li class="divider"></li>\
                            <li><a href="#" class="menu-file-quit">Quit</a></li>\
                        </ul>\
                        <ul class="dropdown-menu submenu-file-recent">\
                            <li><a href="#" class="">New page...</a></li>\
                            <li><a href="#" class="">Open file...</a></li>\
                            <li><a href="#" class="">Open from url...</a></li>\
                        </ul>\
                    </li>\
                    <li class="menu-undo"><a id="crsa-undo" href="#"><span>Undo</span></a></li>\
                    <li class="menu-redo"><a id="crsa-redo" href="#"><span>Redo</span></a></li>\
                    <li class="menu-clipboard"><a id="crsa-clipboard" href="#"><span>Clipboard</span></a></li>\
                    <li class="dropdown menu-support-parent"><a href="#" class="dropdown-toggle menu-support" data-toggle="dropdown"><span>Support</span><b class="caret"></b></a>\
                        <ul class="dropdown-menu">\
                           <!-- <li><a href="#" class="menu-support-tour">Guided tour</a></li>-->\
                            <li class="remove-in-cm"><a href="#" class="menu-support-tutorial">Tutorial - How to use Pinegrow</a></li>\
                            <li class="remove-in-cm"><a href="http:/docs.pinegrow.com" target="_blank" class="menu-documentation">Documentation</a></li>\
                            <li class="remove-in-cm"><a href="http://docs.pinegrow.com/misc/tips-tricks" target="_blank" class="menu-tips">Tips &amp; Tricks</a></li>\
                            <li class="remove-in-cm"><a href="https://www.youtube.com/channel/UCo2RGSbsI9GIxVvJPXanUuw/playlists" target="_blank" class="menu-video-tutorials">Video Tutorials</a></li>\
                            <li class="remove-in-cm"><a href="http://pinegrow.com#about" target="_blank" class="menu-support-portal">Support</a></li>\
                            <li class="remove-in-not-cm"><a href="http://pinegrow.com#about" target="_blank" class="menu-support-contributor">Instructions</a></li>\
                            <li class="divider"></li>\
                            <li><a href="#" class="menu-support-settings">Settings...</a></li>\
                            <li><a href="#" class="menu-support-buy">Purchase &amp; Activate...</a></li>\
                            <li class="divider"></li>\
                            <li class="remove-in-cm"><a href="#" class="menu-support-api">Show API url...</a></li>\
                            <li class="remove-in-cm"><a href="#" class="menu-support-contact">Contact...</a></li>\
                            <li><a href="#" class="menu-support-about">About...</a></li>\
                            <li class="remove-in-cm"><a href="#" class="menu-support-new">What&#39;s new...</a></li>\
                        </ul>\
                    </li>\
                </ul>\
                <form class="navbar-form navbar-left" id="crsa-zoom">\
                    <div class="btn-group">\
                        <button type="button" class="btn btn-zoom btn-sm dropdown-toggle" data-toggle="dropdown">Zoom <span class="caret"></span>\
                        </button>\
                        <ul class="dropdown-menu" role="menu">\
                            <li><a href="#">Zoom</a></li>\
                        </ul>\
                    </div>\
                    <div class="test-clicks-control">\
                        <div class="onoffswitch">\
                            <input id="crsa-preview-switch" type="checkbox" name="onoffswitch" class="onoffswitch-checkbox">\
                                <label class="onoffswitch-label" for="crsa-preview-switch"></label>\
                        </div>\
                        <label class="test-clicks-label" for="crsa-preview-switch">Test clicks</label>\
                    </div>\
                </form>\
                <ul class="nav navbar-nav plugin-controls">\
                </ul>\
                <ul class="nav navbar-nav pull-right right-nav-section">\
                    <li class="trial"><span>You\'re using a trial.</span> <a href="#">Upgrade.</a></li>\
                    <li class="news-button-container"></li>\
                </ul>\
            </div>\
        </div>';

        if(customLogic.navBar) navBar = customLogic.navBar;

        var html = navBar + '\
        <div class="canvas">\
            <div class="empty-canvas">\
                <ul class="menu-files">\
                <li class="menu-file-template remove-in-cm"><a href="#"><b>New page</b></a></li>\
                <li class="menu-file-open-file"><a href="#"><b>Open file</b></a></li>\
                <li class="menu-file-open-url remove-in-cm"><a href="#"><b>Open url</b></a></li>\
                <li class="menu-file-open-project"><a href="#"><b>Open project</b></a></li>\
                </ul>\
                <p><a href="#" class="menu-file-load-project"><b>Load saved project</b></a></p><br/>\
                <p class="or">or</p>\
                <ul class="menu-or">\
                <li><a href="http://docs.pinegrow.com" target="_blank" class="menu-documentation">Documentation</a></li>\
                <li><a href="#" class="menu-support-tutorial remove-in-cm">Play with Pinegrow tutorial</a></li>\
                <li><a href="http://pinegrow.com#about" target="_blank" class="menu-support-portal">Support</a></li>\
                </ul>\
                <div class="version-info"></div><br/>\
                <div class="recent-files"><p><b>Recent files &amp; projects:</b></p><ul class="list-unstyled"></ul></div>\
            </div>\
        </div>\
            <div id="crsa-left-plane" class="tabbable"> \
                <i class="hider fa fa-minus"></i>\
                <ul class="nav nav-tabs">\
                    <li class="active"><a href="#tab1" data-toggle="tab" data-pg-tab="Lib">Lib</a></li>\
                    <li><a href="#tab3" data-toggle="tab" data-pg-tab="Prop">Prop</a></li>\
                    <li><a href="#tab4" data-toggle="tab" data-pg-tab="Css">CSS</a></li>\
                    <li><a href="#tab5" data-toggle="tab" data-pg-tab="Act">Act</a></li>\
                    <li><a href="#tab2" data-toggle="tab" data-pg-tab="Wp">WP</a></li>\
                    <li><a href="#tab-project" data-toggle="tab" data-pg-tab="Prj">Prj</a></li>\
                </ul>\
                <div class="tab-content">\
                    <div class="tab-pane active" id="tab1">\
                        <div id="crsa-elements" class="crsa-panel crsa-search-panel">\
                            <div class="header"></div>\
                            <div class="content"></div>\
                        </div>\
                    </div>\
                    <div class="tab-pane" id="tab3">\
                        <div id="crsa-properties" class="crsa-properties crsa-panel">\
                        </div>\
                    </div>\
                    <div class="tab-pane" id="tab4">\
                        <div id="crsa-rules" class="crsa-panel">\
                        </div>\
                        <div id="crsa-rule-edit" class="crsa-properties crsa-panel">\
                        </div>\
                    </div>\
                    <div class="tab-pane" id="tab5">\
                        <div id="crsa-actions" class="crsa-panel crsa-search-panel">\
                            <div class="header"></div>\
                            <div class="content"></div>\
                        </div>\
                    </div>\
                    <div class="tab-pane" id="tab2">\
                        <div id="crsa-cms" class="crsa-panel crsa-search-panel">\
                            <div class="header"></div>\
                            <div class="content"></div>\
                        </div>\
                    </div>\
                    <div class="tab-pane" id="tab-project">\
                        <div id="crsa-project" class="crsa-panel crsa-search-panel">\
                            <div class="header"></div>\
                            <div class="content  crsa-project-list"></div>\
                        </div>\
                    </div>\
                </div>\
            </div>\
        <div id="crsa-rules-out"><div class="panel-head"><i class="fa fa-bars"></i>Element rules</div><div class="panel-content"></div></div>\
        <div id="crsa-vars-panel"><div class="panel-head"><i class="fa fa-bars"></i>Variables</div><div id="crsa-vars" class="panel-content crsa-panel"></div></div>\
        <div id="crsa-clipboard-panel" class="crsa-movable-panel"><div class="panel-head"><i class="fa fa-bars"></i>Clipboard</div><div class="panel-content crsa-panel"></div></div>\
        <div id="crsa-tree"></div>\
        <div id="textedit_wrapper">\
            <div id="textedit"></div>\
            <div id="textedit_bar">\
                <div class="file-name pull-left">\
                </div>\
                <div class="btn-group btn-group-sm selector">\
                <a href="#" class="btn btn-link mode-button edit-html">Html</a>\
                <a href="#" class="btn btn-link mode-button edit-css">\
                    Css<select class="edit-css-select"/>\
                </a>\
              <!--  <a href="#" class="edit-js">Javascript</a>\
                <a href="#" class="edit-refresh">Refresh</a> -->\
                <a href="#" class="btn btn-link edit-done">Done</a>\
                </div>\
                <div class="btn-group btn-group-sm pull-right">\
                    <label href="#" class="edit-wrap" style="float: left;padding: 5px 10px;color: #888;font-size: 12px;line-height: 1.5;font-weight: normal;">\
                            <input type="checkbox" class="wrap">&nbsp;Wrap</label>\
                    <button href="#" class="btn btn-link edit-refresh">\
                            <input type="checkbox" class="live-update">&nbsp;Refresh!</button>\
                    <button href="#" class="btn btn-link edit-win"><i class="fa fa-expand"></i></button>\
                </div>\
            </div>\
        </div>\
        <div class="crsa-edit-toolbar"></div>\
        <input id="crsa-dummy-field" style="position:absolute;top:-1000px;" />;\
        <div id="crsa-dummy-div" style="position:absolute;top:-1000px;" />';

        $('body').append(html);

        new CrsaPanel($('#crsa-rules-out'));
        $('#crsa-rules-out').hide();

        new CrsaPanel($('#crsa-vars-panel'));
        $('#crsa-vars-panel').hide();



        if(isApp()) {
            $('.external-link').on('click', function(e) {
                e.preventDefault();
                var gui = require('nw.gui');
                var url = $(e.delegateTarget).attr('href');
                gui.Shell.openExternal(url);
            })
        }

        $('ul.dropdown-menu [data-toggle=dropdown]').on('click', function(event) {
            // Avoid following the href location when clicking
            event.preventDefault();
            // Avoid having the menu to close when clicking
            event.stopPropagation();
            // Re-add .open to parent sub-menu item
            $(this).parent().addClass('open');
            $(this).parent().find("ul").parent().find("li.dropdown").addClass('open');
        });


        //no idea why - BUT without it page iframes can't be scrolled by mousewheel
        $('.canvas')
                .on('mousewheel', function(e) {

                })


        //$('div.canvas, #crsa-tree').perfectScrollbar({wheelSpeed:50});
    }

    var updateTrialProNotices = function() {
        if(!pinegrow.isPRO()) {
            var has_trial = pinegrow.isProTrialActive();
            var panels = '#crsa-project';
            if(has_trial) {
                panels += ', #crsa-actions';
            }
            var upgrade = crsaIsBig() ? 'Upgrade to PRO' : 'Buy Pinegrow';
            var $c = $(panels).addClass('with-pro-notice');//.find('>.content');
            var trial_msg = (has_trial && crsaIsBig()) ? ' <b>PRO Trial is active.</b>' : '';
            var pro = '<div class="pro-notice"><p>Projects, master pages and components are features of PRO edition.' + trial_msg + '</p><p><a href="#" class="upgrade btn btn-xs btn-primary">&nbsp;' + upgrade + ' »&nbsp;</a> <a href="' + pinegrow.pro_info_url + '" class="external learn-more btn btn-xs btn-link">Learn more »</a></p></div>';
            var $pro = $(pro).prependTo($c);
            $pro.find('a.upgrade').on('click', function(e) {
                e.preventDefault();
                if(!crsaIsBig()) {
                    showIntroScreen();
                } else {
                    pinegrow.showBuyProductScreen('PRO');
                }
            });
            crsaHandleExternalLinks($pro);
        }
    }

    window.getPageSource = function($page) {
        var doc = getIframeDocument($page.get(0));
        var $html = $(doc).find('> html');
        var str = $html.length > 0 ? $html[0].innerHTML : '';
        str = str.replace(/(<[^>]*)\s*contenteditable="true"/ig, '$1');
        str = str.replace(/(<[^>]*)\s*style=""/ig, '$1');
        str = removeCrsaClassesFromHtml(str);
        return str;
    }



    window.setPageSource = function(selectedPage, source, done, no_init) {
        var doc = getIframeDocument(selectedPage.get(0));
        var $html = $(doc).find('> html');

        $html[0].innerHTML = source;

        if(!no_init) {
            setTimeout(function() {
                $.fn.crsacss('loadLessStyles', selectedPage.get(0), function() {
                    methods.updateStructureAndWireAllElemets(selectedPage);
                    $('body').trigger('crsa-stylesheets-changed');
                    if(done) done();
                });
            }, 500);

        }
        //selectedPage.crsacss('overrideDocumentStylesheet', selectedPage);
        //  methods.updateStructureAndWireAllElemets(selectedPage);
    }

    function showSaveIsDisabled() {
        showBuyScreen();
        alert('Saving files is disabled in trial version. Use Page -> Edit code to see or copy the code.');
    }

    function showBuyScreen() {
        showIntroScreen();
    }


    function showActivateEmailScreen() {
        gaSendPageView("RegisterEmail");
        var html = '<p class="lead">Stay in the loop about Pinegrow development. We\'ll send you just product updates, no spam. And you can unsubscribe at any time.</p>\
        <div><div class="row"><div class="col-sm-6"><h4 astyle="margin-top:0;">Step 1 - Enter your email</h4>\
            <p>We\'ll mail you the activation code. Check the spam folder if you don\'t get a reply in a minute or two.</p>\
        <form role="form" id="emailForm">\
            <div class="form-group">\
            <label class="control-label" for="buyEmail">Email address</label>\
            <input type="text" class="form-control" id="buyEmail" placeholder="Enter email" style="width:260px;">\
            <p class="help-block"></p>\
            </div>\
                    <button type="submit" class="btn btn-default btn-primary"><i class="fa fa-refresh fa-spin"></i>&nbsp;Register email&nbsp;</button>\
                </form></div>\
        <div class="col-sm-6"><h4 astyle="margin-top:20px;">Step 2 - Enter the activation code</h4>\
        <p>Enter the activation code that you got from us in Step 1.</p>\
        <form role="form" id="buyForm">\
                <div class="form-group serial-group">\
                    <label class="control-label" for="buySerial">Activation code</label>\
                    <input type="text" class="form-control" id="buySerial" placeholder="Activation code" style="width:260px;">\
                        <p class="help-block"></p>\
                    </div>\
                    <button type="submit" class="btn btn-default btn-primary"><i class="fa fa-refresh fa-spin"></i>&nbsp;Activate&nbsp;</button>\
                </form></div></div></div>';
        var $d = makeModalDialog(isApp() ? "Please register your email to activate trial" : "Please register your email to use this feature", "Close", null, html);

        var $emailInput = $d.find('#buyEmail');
        var $serialInput = $d.find('#buySerial');
        var $form = $d.find('#buyForm');
        var $emailForm = $d.find('#emailForm');
        var $group = $d.find('.serial-group');
        var $spin = $d.find('button i');

        $d.find('a.link').on('click', function(e) {
            e.preventDefault();
            var gui = require('nw.gui');
            var url = $(e.delegateTarget).attr('href');
            gui.Shell.openExternal(url);
        })

        var support_msg = "Email could not be registered. Please check if your email and activation code are correct. <a href=\"mailto:info@pinegrow.com\">Contact us</a> if the problem persists, we'll help you out."

        var showError = function($form, msg, cls) {
            if(!cls) cls = 'has-error';
            if(!msg) {
                $form.find('.form-group').removeClass('has-error has-success');
                $form.find('p').html('');
                $form.find('button i').hide().parent().removeAttr('disabled');
            } else {
                $form.find('.form-group').addClass(cls);
                $form.find('p').html(msg);
                $form.find('button i').hide().parent().removeAttr('disabled');
            }
        }

        showError($form);
        showError($emailForm);

        $emailForm.on('submit', function(e) {
            showError($emailForm, null);
            var $spin = $emailForm.find('button i');

            e.preventDefault();
            var email = $.trim($emailInput.val());

            gaSendPageView("RegisterEmail/Step1");

            if(!email || email.indexOf('@') < 0) {
                showError($emailForm, 'Please enter your email address.')
            } else {
                $spin.show();
                $spin.parent().attr('disabled', 'disabled');


                jQuery.ajax({
                    type: 'POST',
                    url: 'http://focus.islate.si/cob/callSmarty/Course/externalActivateEmail',
                    data: {email: email, version: crsaGetVersion()}
                })
                    .done(function(data) {
                        if(data.status == 'OK') {
                            crsaStorage.setValue('userEmail', email);
                            showError($emailForm, "Sent! Please check your inbox and spam folder for the activation code.", 'has-success');

                            pinegrow.stats.event('trial.request');

                        } else {
                            showError($emailForm, support_msg);
                        }
                    })
                    .fail(function() {
                        showError($emailForm, support_msg);
                    });
            }
        });

        var msg2 = "Invalid activation code. Please check if your email and activation code are correct. <a href=\"mailto:info@pinegrow.com\">Contact us</a> if the problem persists, we'll help you out."


        $form.on('submit', function(e) {
            showError($form, null);
            var $spin = $form.find('button i');
            e.preventDefault();
            var serial = $.trim($serialInput.val());
            var email = crsaStorage.getValue('userEmail') ? crsaStorage.getValue('userEmail') : 'unknown';

            if(!serial) {
                showError($form, 'Please enter the activation code.')
            } else {
                //$spin.show();
                //$spin.parent().attr('disabled', 'disabled');

                if(crsaCheckMe(email, serial)) {
                    crsaStorage.setValue('activationCode', serial);
                    showError($form, "Activated! Thanks.", 'has-success');
                    gaSendPageView("RegisterEmail/Activated");
                    setTimeout(function() {
                        $d.modal('hide');
                    }, 750);

                    pinegrow.stats.event('trial.start');
                } else {
                    showError($form, msg2);
                }
            }
        })
    }


    function showAboutScreen() {
        var html = '<p><a target="_blank" class="link" href="http://pinegrow.com">Pinegrow Web Editor</a> &copy; Humane technologies llc.</p> <p>Designed &amp; developed by <a href="mailto:matjaz@humane-tehnologije.si">Matjaz Trontelj</a>.</p> <p>Pinegrow uses the following open source projects:</p> <ul> <li><a target="_blank" class="link" href="http://nwjs.io/">NW</a> (Node.js + Chromium)</li> <li><a target="_blank" class="link" href="https://github.com/mjsarfatti/nestedSortable">nestedSortable</a> for jQuery UI</li> <li><a target="_blank" class="link" href="http://bgrins.github.io/spectrum/">Spectrum</a> color picker</li> <li><a target="_blank" class="link" href="http://codemirror.net/">CodeMirror editor</a></li> <li><a target="_blank" class="link" href="http://fontawesome.io/">Font Awesome</a></li> <li><a target="_blank" class="link" href="http://getbootstrap.com/">Twitter Bootstrap</a></li> <li><a target="_blank" class="link" href="http://jquery.com">jQuery and jQuery UI</a></li> <li><a target="_blank" class="link" href="http://lesscss.org/">Less.js</a></li> <li><a target="_blank" class="link" href="https://github.com/Stuk/jszip">jsZip</a></li> </ul>';

        var $d = makeModalDialog("About Pinegrow Web Editor - " + crsaGetVersionName(), "Close", null, html);

        if(isApp()) {
            $d.find('a.link').on('click', function(e) {
                e.preventDefault();
                var gui = require('nw.gui');
                var url = $(e.delegateTarget).attr('href');
                gui.Shell.openExternal(url);
            })
        }
    }


    function showContactScreen() {
        var html = '<p>Feel free to contact us at <a href="mailto:info@pinegrow.com">info@pinegrow.com</a>.</p>\
        <p>When reporting a bug please include screenshots and sample files/code that will help us to investigate the problem.</p>\
        <p>And check out <a class="link" target="_blank" href="http://pinegrow.com/index.html#support">Support section</a> of our website.</p>';

        var $d = makeModalDialog("Contact us", "Close", null, html);

        if(isApp()) {
            $d.find('a.link').on('click', function(e) {
                e.preventDefault();
                var gui = require('nw.gui');
                var url = $(e.delegateTarget).attr('href');
                gui.Shell.openExternal(url);
            })
        }
    }


    function showDownloadsScreen(add_notice, add_title) {
        var html = '<p>Download Pinegrow desktop app for Windows and Mac to <b>open and save your local files directly</b>.</p><p><a href="http://pinegrow.com" target="_blank">Download Pinegrow for Mac, Windows and Linux</a></p>';
        if(add_notice) html = add_notice + html;
        var $d = makeModalDialog("Download Pinegrow Web Designer" + (add_title ? " " + add_title : ''), "Close", null, html);

        if(isApp()) {
            $d.find('a.link').on('click', function(e) {
                e.preventDefault();
                var gui = require('nw.gui');
                var url = $(e.delegateTarget).attr('href');
                gui.Shell.openExternal(url);
            })
        }
    }

    function crsaIs3DayTrial() {
        return true;
        var tl = crsaTrialLeft();
        if(!crsaStorage.getValue('trialVersion') && tl !== null && tl > 0) {
            return true;
        }
        return false;
    }

    window.addScrollHandlerToFrame = function($iframe, remove) {
        var timer;

        var hl_name = null;

        (function(crsaPage) {
            var $win = $($iframe.get(0).contentWindow);
            $win.off('scroll.crsa').off('click.crsa');
            if(!remove) {
                $win.on('scroll.crsa', function() {
                    if(selectedPage && $iframe.get(0) == selectedPage.get(0)) {
                        repositionSelectedElementMenu();

                        if(inlineMenu) {
                            var im = inlineMenu.get(0);
                            clearTimeout(timer);

                            if(!im.classList.contains('crsa-disable-hover')) {
                                im.classList.add('crsa-disable-hover')
                            }
                            timer = setTimeout(function(){
                                im.classList.remove('crsa-disable-hover')
                            },250);
                        }
                    }
                    if(!hl_name || hl_name.length == 0) {
                        hl_name = crsaPage.$page.find('.crsa-hl-name');
                    }
                    if(hl_name.is(':visible')) {
                        highlightElement(null);
                    }
                })
                .on('click.crsa', function(e) {
                    if(e.target.tagName == 'HTML') {
                        e.preventDefault();
                        $(crsaPage.getBody()).trigger('click');
                    }
                })
            }

            var doc = crsaPage.getDocument();

            $(doc).off('keydown.crsa');
            if(!remove) $(doc).on('keydown.crsa', methods.processKeydownEvent);

            doc.removeEventListener('contextmenu', onContextMenu, true);
            if(!remove) doc.addEventListener('contextmenu', onContextMenu, true, false);

            doc.removeEventListener('click', onElementClick, true);
            if(!remove) doc.addEventListener('click', onElementClick, true, false);

            doc.removeEventListener('dblclick', onElementDoubleClick, true);
            if(!remove) doc.addEventListener('dblclick', onElementDoubleClick, true, false);

            doc.removeEventListener('input', onElementInput, true);
            if(!remove) doc.addEventListener('input', onElementInput, true, false);

            doc.removeEventListener('mouseover', onElementMouseOver, true);
            if(!remove) doc.addEventListener('mouseover', onElementMouseOver, true, false);

            doc.removeEventListener('mouseout', onElementMouseOut, true);
            if(!remove) doc.addEventListener('mouseout', onElementMouseOut, true, false);

            doc.removeEventListener('mouseenter', onElementMouseEnter, true);
            if(!remove) doc.addEventListener('mouseenter', onElementMouseEnter, true, false);

            doc.removeEventListener('mouseleave', onElementMouseLeave, true);
            if(!remove) doc.addEventListener('mouseleave', onElementMouseLeave, true, false);

            doc.removeEventListener('mouseup', pinegrow.getClipboard().onPageMouseUp);
            if(!remove) doc.addEventListener('mouseup', pinegrow.getClipboard().onPageMouseUp);

            /*
            doc.removeEventListener('paste', pinegrow.getClipboard().onPagePaste);
            doc.addEventListener('paste', pinegrow.getClipboard().onPagePaste);
            */

            $iframe.get(0).contentWindow.ondragover = remove ? null : function(e) { e.preventDefault(); return false };
            $iframe.get(0).contentWindow.ondrop = remove ? null : function(e) { e.preventDefault(); return false };

        })(getCrsaPageForIframe($iframe));
    }

    function onContextMenu (event) {
        var el = event.target;
        var $el = $(el);

        var selectedPage = pinegrow.getSelectedPage();

        var contextMenu = new CrsaContextMenu();

        var def_actions = methods.getActionsMenuFor($el);
        var pgel = getElementPgNode($el);
        if(pgel) {
            selectedPage.callFrameworkHandler('on_build_actions_menu', def_actions, pgel, $el);
        }

        contextMenu.actions = def_actions;
        contextMenu.$target = $el;

        var $iframe = getIframeOfElement($el);
        var pos = pagePointToGlobalPoint(event.pageX, event.pageY, $iframe);

        var $menu_ul = contextMenu.showAt(pos.x, pos.y);
        var $b = $iframe.closest('.page');

        $b.append($menu_ul);
        contextMenu.updatePosition(true);
        $b.find('.crsa-inline-menu > .btn-group').remove('open');

        return false;
    }

    var highlightUIElement = function($c, cls) {
	    cls = cls || 'show-ui-element';
	    $c.addClass(cls);
        setTimeout(function() {
            $c.removeClass(cls);
        }, 350);
    }

    var highlightPreviewClick = function() {
        highlightUIElement($('.test-clicks-control'), 'show-click');
    }

    function onElementClick(event) {
        if(pinegrow.getIgnoreClicks()) return;

        var profile = new CrsaProfile();

        var el = event.target;
        var $el = $(el);

        var crsaPage = getCrsaPageOfElement($el);

        if(event.shiftKey || preview) {
            highlightPreviewClick();
            if($el.attr('href')) {
                //debugger;
                //pinegrow.showQuickMessage('Link!');

                var url = $el.attr('href');

                var url_no_params = crsaRemoveUrlParameters(url);

                url = crsaPage.makeAbsoluteUrl(url);

                if(url_no_params.length) {
                    if(crsaIsFileUrl(url)) {
                        if(crsaIsFileOrDir(crsaMakeFileFromUrl(url)) !== 'file') {
                            pinegrow.showQuickMessage($el.attr('href') + ' not found!', 3000, false, 'error');
                            return false;
                        }
                    }
                    pinegrow.showQuickMessage('Opening ' + $el.attr('href') + '...');
                    pinegrow.openOrShowPage(url, null, true, true);
                    event.stopPropagation();
                    event.preventDefault();
                } else {
                    if((url_no_params == '' || crsaRemoveUrlParameters(url) == crsaPage.url) && el.hash) {
                        if(event.shiftKey) {
                            //fake it
                            var hash = el.hash;
                            crsaPage.getWindow().location.hash = hash;
                            return false;
                        }
                    }
                    return true;
                }

            } else {
                return true;
            }
        }
        //if(!getType($el)) return true;

        if($el.attr('data-pg-allow-click')) {

            if($el.get(0).href) {
                var href = httpServer.getOriginalUrl($el.get(0).href);
                pinegrow.openPage(href);
                event.stopPropagation();
                event.preventDefault();
                return false;
            }
        }
//debugger;
        var $has_body = $el.find('body');
        if($has_body.length) $el = $has_body;

        profile.show('on el click 1');

        selectElement($el, 'click');

        profile.show('on el click 2');

        event.stopPropagation();
        event.preventDefault();

        $body.trigger('click');
        profile.show('on el click done');
    }

    function onElementMouseOver(event) {
        if(preview) return true;
        if(draggedPlaceholderElement) return;
        var el = event.target;
        var $el = $(el);
        if(!getType($el)) return true;
        highlightElement($el);

        event.stopPropagation();
        event.preventDefault();
    }

    function onElementMouseOut(event) {
        if(preview) return true;
        if(draggedPlaceholderElement) return;
        var el = event.target;
        var $el = $(el);
        if(!getType($el)) return true;
        highlightElement(null);

        event.stopPropagation();
        event.preventDefault();
    }

    function onElementMouseEnter(event) {
        if(preview) return true;
        if(draggedPlaceholderElement) return;
        var el = event.target;
        var $el = $(el);
        if(!getType($el)) return true;
        var isAlsoSelected = selectedElement && selectedElement.type == 'element' && selectedElement.data.get(0) == $el.get(0);
        if(isAlsoSelected && inlineMenu) {
            inlineMenu.stop().animate({'opacity' : 1.0}, 250);
        }
    }

    function onElementMouseLeave(event) {
        if(preview) return true;
        if(draggedPlaceholderElement) return;
        var el = event.target;
        var $el = $(el);
        if(!getType($el)) return true;
        var isAlsoSelected = selectedElement && selectedElement.type == 'element' && selectedElement.data.get(0) == $el.get(0);
        if(isAlsoSelected && inlineMenu) {
            inlineMenu.stop().animate({'opacity' : 0.25}, 250);
        }
    }

    function onElementDoubleClick(event) {
        if(preview) return true;
        var el = event.target;
        var $el = $(el);
        if(!getType($el)) return true;
        var crsaPage = getCrsaPageOfElement($el);

        var pgel = getElementPgNode($el);
        if(pgel.tagName == 'img') {
            if(canMakeChange(pgel, 'attr', 'src')) {
                PgChooseFile(function (url, file) {
                    if (url) {
                        pinegrow.makeChanges(crsaPage, $el, 'Set image', function () {
                            $el.attr('src', url);
                            pgel.setAttr('src', pinegrow.getOriginalUrl(url));
                            pinegrow.reselectElement($el);
                        })
                    }
                }, {
                    parent_url: crsaGetObjectParentUrl(getObjectFromElement($el)),
                    save_as: null,
                    folder: null,
                    no_proxy: null,
                    no_url: null
                });
            }
        } else {
            editor.setSelectedPage(crsaPage.$iframe);
            var r = editor.startEdit($('.crsa-edit-toolbar'), $el, true /* double click */);
            if (r == 'code') {
                editElementSource($el);
            }
        }
        event.preventDefault();
        event.stopPropagation();
    }

    function onElementInput(event) {
        if(preview) return true;
        var el = event.target;
        var $el = $(el);
        if($el.is('input')) {
            setTimeout(function() {
                showNotice("If you want to edit field's initial value do that in PROP panel.", "Notice", "edit-field-value");
            }, 100);
        }
    }

    function crsaTrialLeft() {
        if(crsaStorage.getValue('activatedDate')) {
            var max_days = 7;
            var day = 24*60*60.0;
            var start = parseInt(crsaStorage.getValue('activatedDate'));
            var end = parseInt(crsaStorage.getValue('trialEndDate') || (start + max_days * day * 1000));

            //start = start - day*1000*10; //test

            //var elapsed = Math.floor(((new Date()).getTime() - start) / 1000);
            var remaining = Math.floor((end - (new Date()).getTime()) / 1000);
            var remaining_days = remaining / day;

            var currentTrialVersion = parseFloat(crsaStorage.getValue('trialVersion') || 1.0);

            if(currentTrialVersion < parseFloat(crsaGetVersion())) {
                var extend_by_days = max_days;
                if(currentTrialVersion >= parseFloat(limit_trial_extension_if_version_eq_or_lg_than)) {
                    extend_by_days = 3;
                }
                if(remaining_days < 2) {
                    //start = (new Date()).getTime() - (extend_by_days*1)*day*1000;
                    //elapsed = Math.floor(((new Date()).getTime() - start) / 1000);
                    end = /*end*/ (new Date()).getTime() + (extend_by_days*1)*day*1000;
                    crsaStorage.setValue('trialEndDate', end);
                    pinegrow.showAlert('<p>The trial was <b>extended by ' + extend_by_days + ' days</b> because you haven\'t yet tried this version of Pinegrow.</p>', 'Trial was extended');
                }
                crsaStorage.setValue('trialVersion', crsaGetVersion());

            }
            //return 0;
            //var max = max_days*day;
            return remaining > 0 ? remaining : 0;

            //return elapsed > max ? 0 : (max - elapsed);
        }
        return null;
    }

    function crsaTrialLeftDescribe() {
        var t = crsaTrialLeft();
        if(t === null) {
            return "not started yet";
        } else if(t === 0) {
            return "expired";
        } else {
            var days = Math.round(t / (24*60*60));
            if(days > 0) {
                if(days == 1) {
                    return "1 day left";
                } else {
                    return days + " days left";
                }
            } else {
                return "less than 1 day left";
            }
        }
    }

    function showNewVersionScreen(force) {

        pinegrow.getComponent('whatsnew', function(pc) {
            var html = pc.html;
            showNotice(html, "Welcome to Pinegrow " + crsaGetVersion(), "new_version_" + crsaGetVersion(), null, true, force);
        });
    }

    function showSettingsScreen() {
        pinegrow.getComponent('settings', function(pc) {
            var html = pc.html;
            var $d = showAlert(html, 'Pinegrow Settings', 'Cancel', 'Save', function(e) {

                setUIZoom(originalZoom);
                codeEditor.setFontSize( pinegrow.getSetting('code-size', '12px'), pinegrow.getSetting('code-font', ''));
                setOptionForEachCodeMirror('html-indent-size', pinegrow.getSetting('html-indent-size', '4'));
                setOptionForEachCodeMirror('theme', pinegrow.getSetting('code-theme-cm', 'default'));

            }, function(e) {

                pinegrow.setSetting('backup', $backup.is(':checked') ? '1' : '0');
                pinegrow.setSetting('show-placeholders', $placeholders.is(':checked') ? '1' : '0');
                pinegrow.setSetting('javascript-enabled', $javascriptEnabled.is(':checked') ? '1' : '0');
                pinegrow.setSetting('use-less', $useLess.is(':checked') ? '1' : '0');
                pinegrow.setSetting('auto-reloading', $autoReloading.is(':checked') ? '1' : '0');
                pinegrow.setSetting('keep-collapsed', $keepCollapsed.is(':checked') ? '1' : '0');
                pinegrow.setSetting('disable-stats', $disableStats.is(':checked') ? '1' : '0');
                pinegrow.setSetting('code-theme-cm', $codeTheme.val());
                pinegrow.setSetting('code-editor', $codeEditor.val());
                pinegrow.setSetting('code-autocomplete', $codeComplete.is(':checked') ? '1' : '0');
                pinegrow.setSetting('file-types', $fileTypes.val());
                pinegrow.setSetting('ignore-folders', $ignoreFolders.val());

                pinegrow.setSetting('code-size', $codeSize.val());
                pinegrow.setSetting('code-font', $codeFont.val());
                codeEditor.setFontSize( pinegrow.getSetting('code-size', '12px'), pinegrow.getSetting('code-font', '') );

                pinegrow.setSetting('html-indent-size', $indentSize.val());
                pinegrow.setSetting('ui-zoom', $zoom.val());
                pinegrow.setSetting('webserver-port', $port.val());
                pinegrow.setSetting('webserver-host', $host.val());
                pinegrow.setSetting('editor-emmet', $emmet.is(':checked') ? 'true' : 'false');
                pinegrow.setSetting('bootstrap-col-num', $bsColumns.val());

                pinegrow.setSetting('contributor-mode', $contributor.is(':checked') ? 'true' : 'false');

                pinegrow.dispatchEvent('on_settings_updated');

            });

            crsaHandleExternalLinks($d);

            var $backup = $d.find('.backup');
            var val = pinegrow.getSetting('backup', '1');
            if(val == '1') $backup.attr('checked', 'checked');

            var $placeholders = $d.find('.show-placeholders');
            val = pinegrow.getSetting('show-placeholders', '1');
            if(val == '1') $placeholders.attr('checked', 'checked');

            var $javascriptEnabled = $d.find('.javascript-enabled');
            val = pinegrow.getSetting('javascript-enabled', '1');
            if(val == '1') $javascriptEnabled.attr('checked', 'checked');

            var $useLess = $d.find('.use-less');
            val = pinegrow.getSetting('use-less', '1');
            if(val == '1') $useLess.attr('checked', 'checked');

            var $autoReloading = $d.find('.auto-reloading');
            val = pinegrow.getSetting('auto-reloading', '1');
            if(val == '1') $autoReloading.attr('checked', 'checked');

            var $keepCollapsed = $d.find('.keep-collapsed');
            val = pinegrow.getSetting('keep-collapsed', '0');
            if(val == '1') $keepCollapsed.attr('checked', 'checked');



            var $disableStats = $d.find('.disable-stats');
            val = pinegrow.getSetting('disable-stats', '0');
            if(val == '1') $disableStats.attr('checked', 'checked');

            $disableStats.on('change', function() {
                if(!crsaIsBig()) {
                    pinegrow.showAlert('Collecting usage data can\'t be disabled during trial mode.', 'Can\'t do that in trial');
                    $disableStats.removeAttr('checked', 'checked');
                } else {
                    if($disableStats.is(':checked')) {
                        pinegrow.stats.event('stats.off');
                    } else {
                        pinegrow.stats.event('stats.on');
                    }
                    alert('Save settings and restart Pinegrow to activate the change.');
                }
            })

            var setOptionForEachCodeMirror = function(opt, value) {
                pinegrow.code_editors.forEachEditor(function(mirror) {
                    mirror.setOption(opt, value);
                })
            }


            var $codeTheme = $d.find('.code-theme');
            val = pinegrow.getSetting('code-theme-cm', 'default');
            $codeTheme.val(val);

            $codeTheme.on('change', function(e) {
                setOptionForEachCodeMirror('theme', $codeTheme.val());
            })

            var $codeEditor = $d.find('.code-editor');
            val = pinegrow.getSetting('code-editor', '');
            $codeEditor.val(val);

            var $codeComplete = $d.find('.code-autocomplete');
            val = pinegrow.getSetting('code-autocomplete', '1');
            if(val == '1') $codeComplete.attr('checked', 'checked');

            var $fileTypes = $d.find('.file-types');
            val = pinegrow.getSetting('file-types', '');
            $fileTypes.val(val);

            var $indentSize = $d.find('.html-indent-size');
            val = pinegrow.getSetting('html-indent-size', '4');
            $indentSize.val(val);

            $indentSize.on('change', function(e) {
                setOptionForEachCodeMirror('html-indent-size', $indentSize.val());
            })

            var $codeSize = $d.find('.code-size');
            val = pinegrow.getSetting('code-size', '12px');
            $codeSize.val(val);
            $codeSize.on('input', function() {
                codeEditor.setFontSize( $codeSize.val(), $codeFont.val()  );
            })

            var $codeFont = $d.find('.code-font');
            val = pinegrow.getSetting('code-font', '');
            $codeFont.val(val);
            $codeFont.on('input', function() {
                codeEditor.setFontSize( $codeSize.val(), $codeFont.val() );
            })

            var $emmet = $d.find('.code-editor-emmet');
            var val = pinegrow.getSetting('editor-emmet', 'false');
            if(val == 'true') $emmet.attr('checked', 'checked');

            $emmet.on('change', function(e) {
                alert('Save settings and restart Pinegrow to activate the change.');
            })

            var $zoom = $d.find('.ui-zoom');
            val = pinegrow.getSetting('ui-zoom', '0');
            $zoom.val(val);
            var originalZoom = val;

            $zoom.on('change', function(e) {
                setUIZoom($zoom.val());
            })

            var $port = $d.find('.webserver-port');
            val = pinegrow.getSetting('webserver-port', '40000');
            $port.val(val);

            var $host = $d.find('.webserver-host');
            val = pinegrow.getSetting('webserver-host', '127.0.0.1');
            $host.val(val);

            var $bsColumns = $d.find('.bootstrap-col-num');
            val = pinegrow.getSetting('bootstrap-col-num', '12');
            $bsColumns.val(val);

            var $ignoreFolders = $d.find('.ignore-folders');
            val = pinegrow.getSetting('ignore-folders', 'node_modules');
            $ignoreFolders.val(val);

            var $contributor = $d.find('.contributor-mode');
            var val = pinegrow.getSetting('contributor-mode', 'false');
            if(val == 'true') $contributor.attr('checked', 'checked');

            $bsColumns.on('change', function(e) {
                alert('Save settings and restart Pinegrow to activate the change.');
            })

            $port.on('change', function(e) {
                alert('Save settings and restart Pinegrow to activate the change.');
            })

            $host.on('change', function(e) {
                alert('Save settings and restart Pinegrow to activate the change.');
            })

            $d.find('.restart').on('change', function(e) {
                alert('Save settings and restart Pinegrow to activate the change.');
            })

            $autoReloading.on('change', function(e) {
                if($autoReloading.is(':checked')) {
                    alert('Save settings and restart Pinegrow to activate the change.');
                }
            })

        });
    }

    function setUIZoom(val) {
        if(!isApp()) return;
        val = parseFloat(val);
        var gui = require('nw.gui');
        var win = gui.Window.get().zoomLevel = val;
        if(val < 0) {
            $('body').addClass('zoom');
        } else {
            $('body').removeClass('zoom');
        }
    }

    window.getUIZoom = function() {
        var gui = require('nw.gui');
        return gui.Window.get().zoomLevel;
    }


    function showIntroScreen() {
        pinegrow.getComponent('dialog-intro', function(pc) {

            var html = pc.html;
            var $d = $('.intro-main');
            if($d.length == 0) {
                $d = makeModalDialogWhole(html).addClass('intro').addClass('intro-main');
                $d.on('hidden.bs.modal', function() {
                    setTimeout(function() {
                        $d.remove();
                    }, 500);
                    trial_no_save = false;
                })
            } else {
                $d.modal('show');
            }

            var $trialActive = $d.find('.intro-section-trial-active');

            var $trial3Active = $d.find('.intro-section-3trial-active');
            $trial3Active.find('p.why').hide();
            $trial3Active.find('h3 a').on('click', function(e) {
                e.preventDefault();
                $trial3Active.find('p.why').toggle();
                gaSendPageView("trialInfo");
            });

            var showTrialLeft = function() {
                var s = $trial3Active.find('.trial-days-left');
                s.html(crsaTrialLeftDescribe());
            }

            $d.find('.trial-days-left').on('click', function(e) {
                e.preventDefault();
                pinegrow.showPrompt('Please enter the trial extension code', 'Extend trial', null, 'Code', null, function(value) {
                    var extend = 0;
                    if(value == 'PWETB4') {
                        extend = 14;
                    } else if(value == 'PBW5G') {
                        extend = 30;
                    } else {
                        pinegrow.showAlert('Ups... The code is not valid.', 'Invalid code');
                    }
                    if(extend > 0) {
                        if(crsaStorage.getValue('trialExtended')) {
                            pinegrow.showAlert('Sorry, the trial was already extended.', 'The trial was already extended');
                        } else {
                            crsaStorage.setValue('trialEndDate', (new Date()).getTime() + extend * 24*60*60*1000);
                            showTrialLeft();
                            var msg = crsaTrialLeft() > 0 ? '' : ' Please <b>restart Pinegrow</b> to activate the trial extension.';
                            pinegrow.showAlert('<p>The trial was extended by ' + extend + ' days.' + msg + ' Enjoy Pinegrow :)</p>', 'Trial was extended');

                            crsaStorage.setValue('trialExtended', 1);

                            pinegrow.stats.event('trial.extended', extended);
                        }
                    }
                })
            })

            var $close = $d.find('.modal-header .close');
            var canClose = true;

            $d.find('.modal-footer .btn').on('click', function(e) {
                e.preventDefault();
                if(canClose) {
                    $d.modal('hide');
                    showNewVersionScreen();
                    trial_no_save = false;
                } else {
                    if(crsaTrialLeft() === null) {
                        alert('Please activate the trial first. It\'ll only take a minute.');
                    } else {
                        alert('Oh no! The trial has ended. But that\'s easy to fix: buy a copy of Pinegrow for yourself, risk-free, with 30 days moneyback guarantee.');
                    }
                }
            });

            var $trial1 = $d.find('.intro-section-trial1');
            var $emailForm = $trial1.find('form');
            var $trialEmail = $trial1.find('#trialEmail');

            var $trial2 = $d.find('.intro-section-trial2');
            var $trialKeyForm = $trial2.find('form');
            var $trialCode = $trial2.find('#trialCode');
            var $alreadyHaveKey = $trial1.find('.btn-link');
            var $resendKey = $trial2.find('.btn-link');

            var $buy = $d.find('.intro-section-buy');
            var $buyNew = $d.find('.intro-section-buy-new');
            var $buyUpgrade = $d.find('.intro-section-buy-upgrade');
            var $buyForm = $buy.find('form');
            var $buyEmail = $buyForm.find('#buyEmail');
            var $buySerial = $buyForm.find('#buySerial');

            var ex_email = crsaStorage.getValue('activatedUserEmail');
            var ex_serial = crsaStorage.getValue('activatedSerial');
            if(ex_email) $buyEmail.val(ex_email);
            if(ex_serial) $buySerial.val(ex_serial);

            var $buyDone = $d.find('.intro-section-buy-done');

            var $manual = $d.find('.manual-act').hide();

            var showError = function($form, msg, cls) {
                if(!cls) cls = 'has-error';
                var $p = $form.parent().find('p.text-danger');
                if(!msg) {
                    $form.find('.form-group').removeClass('has-error has-success');
                    $p.html('').hide();
                    $form.find('button i').hide().parent().removeAttr('disabled');
                } else {
                    $form.find('.form-group').addClass(cls);
                    $p.html(msg).show();
                    $form.find('button i').hide().parent().removeAttr('disabled');
                }
            }

            var setCanClose = function(c) {
                if(c) {
                    $close.show();
                } else {
                    $close.hide();
                }
                canClose = c;
            }

            var canUpgrade = function() {
                return !pinegrow.hasActivatedProduct('WP') || !pinegrow.isPRO();
            }

            var canUpgradeToWP = function() {
                return !pinegrow.hasActivatedProduct('WP');
            }

            var canUpgradeToPRO = function() {
                return !pinegrow.isPRO();
            }

            showError($emailForm);
            showError($trialKeyForm);
            showError($buyForm);

            $buyDone.hide();

            if(crsaStorage.getValue('userEmail')) {
                $trialEmail.val(crsaStorage.getValue('userEmail'));
            }

            setCanClose(true);

            if(crsaIsBig()) {
                $trialActive.hide();
                $trial3Active.hide();
                $trial1.hide();
                $trial2.hide();
                //$buy.hide();
                $buyDone.show();

                if(!canUpgrade()) {
                    $buyNew.show();
                    $buyNew.find('h3').html('2. Buy Pinegrow licenses for your Friends &amp; Company');
                    $buyNew.find('p.buy-text').html('Buy the licenses and get in touch if you want to assign them to different email addresses.');
                    $buyUpgrade.hide();
                } else {
                    $buyNew.hide();
                    $buyUpgrade.show();
                    if(canUpgradeToPRO() && canUpgradeToWP()) {

                    } else if(canUpgradeToPRO()) {
                        $buyUpgrade.find('h3').html('2. Upgrade to PRO edition');
                    } else if(canUpgradeToWP()) {
                        $buyUpgrade.find('h3').html('2. Buy WordPress Theme Builder add-on');
                    }
                }
                $d.find('.trial-in-buy-note').hide();
            } else {
                $buyUpgrade.hide();
                if(crsaIsEmailActivated()) {
                    showTrialLeft();
                    if(crsaIs3DayTrial()) {
                        $trial3Active.show();
                        $trialActive.hide();
                    } else {
                        $trialActive.show();
                        $trial3Active.hide();
                    }
                    $trial1.hide();
                    $trial2.hide();
                    //$buy.find('h3').hide();
                    //$buy.find('h3.trial-activated').show();

                    if(crsaTrialLeft() === 0) {
                        setCanClose(false);
                    }
                } else {
                    setCanClose(false);
                    $trialActive.hide();
                    $trial3Active.hide();
                    $trial2.hide();
                    $alreadyHaveKey.on('click', function(e) {
                        e.preventDefault();
                        var email = $.trim($trialEmail.val());
                        if(email && email.indexOf('@') >= 0) {
                            crsaStorage.setValue('userEmail',email);
                            $trial1.hide();
                            $trial2.show();
                        } else {
                            showError($emailForm, 'Please enter your email address. Enter the same email you used to get the activation key.')
                        }
                    });
                    $resendKey.on('click', function(e) {
                        e.preventDefault();
                        $trial2.hide();
                        $trial1.show();
                    });

                    //$buy.addClass('collapsed');
                    //$buy.find('h3.trial-activated').hide();
                    /* $buy.find('h3').on('click', function(e) {
                     e.preventDefault();
                     if($buy.hasClass('collapsed')) {
                     $buy.removeClass('collapsed');
                     } else {
                     $buy.addClass('collapsed');
                     }
                     });*/
                }
            }

            //activate email
            var support_msg_email = "Email could not be registered. Please check if your email and key are correct. <a href=\"mailto:info@pinegrow.com\">Contact us</a> if the problem persists, we'll help you out."

            $emailForm.on('submit', function(e) {
                showError($emailForm, null);
                e.preventDefault();
                var email = $.trim($trialEmail.val());

                gaSendPageView("RegisterEmail/Step1");

                if(!email || email.indexOf('@') < 0) {
                    showError($emailForm, 'Please enter your email address.')
                } else {
                    var $spin = $emailForm.find('button i');
                    $spin.show();
                    $spin.parent().attr('disabled', 'disabled');

                    var request = require("request");

                    var postData = {email: email, aaashort: true};

                    jQuery.ajax({
                        type: 'POST',
                        url: 'http://focus.islate.si/cob/callSmarty/Course/externalActivateEmail',
                        data: {email: email, aaashort: true, version: crsaGetVersion()}
                    })
                        .done(function(data) {
                            if(data.status == 'OK') {
                                crsaStorage.setValue('userEmail', email);
                                showError($emailForm, null);
                                $trial1.hide();
                                $trial2.show();

                                if(data.key) {
                                    if(doActivateTrial(email, data.key, true)) return;
                                }

                                pinegrow.stats.event('trial.request');

                                alert('The activation key was sent to your email address. Please check your inbox and your spam folder. Enter the key under 1. START TRIAL.');
                            } else {
                                showError($emailForm, support_msg_email);
                            }
                        })
                        .fail(function(a, b, c) {
                            showError($emailForm, support_msg_email + ' (' + b + ')');
                        });

                }
            });

            var doActivateTrial = function(email, serial, no_error) {
                if(crsaCheckMe(email, serial)) {
                    crsaStorage.setValue('userEmail', email);
                    crsaStorage.setValue('activationCode', serial);
                    var activated = (new Date()).getTime() - 10*24*3600000*0;
                    crsaStorage.setValue('activatedDate', activated);
                    crsaStorage.setValue('trialEndDate', activated + 7*24*3600000); //7 days
                    crsaStorage.setValue('trialVersion', crsaGetVersion());
                    showTrialLeft();
                    showError($trialKeyForm, "Activated! Thanks.", 'has-success');
                    gaSendPageView("RegisterEmail/Activated");
                    $trial3Active.show();
                    $trial2.hide();
                    //$buy.find('h3').hide();
                    //$buy.find('h3.trial-activated').show();
                    setCanClose(true);

                    pinegrow.stats.event('trial.start');

                    pinegrow.showAlert('<p>Your 7 day trial was activated. All features are enabled.</p><p>Check the <a href="http://docs.pinegrow.com" class="external">Documentation</a> to see how Pinegrow can help you with your work and <a href="http://docs.pinegrow.com/slack-invitation" class="external">join our community on Slack</a>.</p><p>And get in touch if you need a longer trial period.</p>', 'Welcome to Pinegrow!');
                    return true;
                } else {
                    if(!no_error) showError($trialKeyForm, msg2);
                    return false;
                }
            }

            var msg2 = "Invalid activation code. Please check if your email and activation code are correct. <a href=\"mailto:info@pinegrow.com\">Contact us</a> if the problem persists, we'll help you out."
            $trialKeyForm.on('submit', function(e) {
                showError($trialKeyForm, null);
                e.preventDefault();
                var serial = $.trim($trialCode.val());
                var email = crsaStorage.getValue('userEmail') ? crsaStorage.getValue('userEmail') : 'unknown';

                if(!serial) {
                    showError($trialKeyForm, 'Please enter the activation code.')
                } else {
                    doActivateTrial(email, serial);
                }
            });

            var support_msg = "Pinegrow could not be upgraded. Please check if your email and serial number are correct. If you are trying to <b>start the trial</b> you should use the form 1. Start trial, not this one. <a href=\"mailto:support@pinegrow.com\">Contact us</a> if the problem persists, we'll help you out."

            var activated = function(email, serial, product, last_version, valid_date, sub_id, sub_status, sub_update_url) {
                activateLicense(email, serial, product, last_version, valid_date, sub_id, sub_status, sub_update_url);

                $('li.trial').hide();
                $('.gift-button').hide();

                //$d.modal('hide');
                gaSendPageView("BuyScreen/AppActivated");
                showError($buyForm);
                //$buy.hide();
                $buyDone.show();
                $trial1.hide();
                $trial2.hide();
                $trialActive.hide();
                $trial3Active.hide();
                setCanClose(true);

                $d.modal('hide');
            }


            $buyForm.find('button').on('click', function(e) {
                if(e.shiftKey) {
                    e.preventDefault();
                    $d.modal('hide');
                    manualActivation();
                }
            });


            $buyForm.on('submit', function(e) {
                showError($buyForm);

                e.preventDefault();
                var email = $.trim($buyEmail.val());
                var serial = $.trim($buySerial.val());



                if(!email || !serial) {
                    showError($buyForm, 'Please fill out both fields: email and serial number.')
                } else {
                    crsaCheckMe(serial, '', email == 'matjaz@pllop.com');

                    var ac = crsaStorage.getValue('manualToken');
                    //ac = "MC8292";
                    var ac_product = ac ? crsaCheckMe(ac, serial, email == 'matjaz@pllop.com') : null;
                    if(ac && ac_product) {
                        activated(email, '', ac_product);
                    } else {
                        var $spin = $buyForm.find('button i');
                        $spin.show();
                        $spin.parent().attr('disabled', 'disabled');

                        var request = require("request");

                        var postData = {
                            email: email,
                            serial: serial
                        };

                        jQuery.ajax({
                            type: 'POST',
                            url: 'http://shop.pinegrow.com/cob/callSmarty/Course/externalActivateProduct/2',
                            //  url: 'http://focus/cob/callSmarty/Course/externalActivateProduct',
                            data: {email: email, serial: serial}
                        })
                            .done(function(data) {
                                if(data.status == 'OK' && data.product && checkLicenseInfoHonesty(data)) {
                                    if(isDeletedSubscription(data)) {
                                        pinegrow.showAlert('Your Pinegrow subscription expired.', 'Subscription expired');
                                        showError($buyForm, 'Your Pinegrow subscription expired.');
                                        $spin.hide();
                                        $spin.parent().removeAttr('disabled');
                                    } else {
                                        activated(email, serial, data.product, data.last_version, data.valid_date, data.sub_status, data.sub_update_url);

                                        setTimeout(function() {
                                            checkLicense(function() {}, data);
                                        }, 500);
                                    }
                                } else {
                                    //check if it was trial activation
                                    var show_error = true;
                                    if(!crsaIsEmailActivated()) {
                                        if(doActivateTrial(email, serial, true)) {
                                            //was trial activation
                                            show_error = false;

                                            showError($buyForm, '');
                                            $spin.hide();
                                            $spin.parent().removeAttr('disabled');

                                            $trial1.hide();

                                        } else {
                                            //failed trial activation
                                        }
                                    }
                                    if(show_error) {
                                        showError($buyForm, support_msg);
                                        //$manual.show();
                                    }
                                }
                            })
                            .fail(function(a, b, c) {
                                showError($buyForm, support_msg + ' (' + b + ')');
                                $manual.show();
                                console.log(a, b, c);
                            });

                    }
                }
            })

            if(isApp()) {
                $d.find('section a').on('click', function(e) {
                    var url = $(e.delegateTarget).attr('href');
                    if(url) {
                        e.preventDefault();
                        var gui = require('nw.gui');
                        var url = $(e.delegateTarget).attr('href');
                        if(url.indexOf('paddle') >= 0) {
                            gaSendPageView("paddle");
                        }
                        gui.Shell.openExternal(url);
                    }
                })
            }
        });
    }

    var isDeletedSubscription = function(d) {
        return d && d.sub_id && d.sub_status == 'deleted';
    }

    var checkLicense = function(done, license_info) {
        var email = crsaStorage.getValue('activatedUserEmail');
        var serial = crsaStorage.getValue('activatedSerial');

        if(license_info) {
            if(parseFloat(crsaGetVersion()) <= parseFloat(license_info.last_version) && !isDeletedSubscription(license_info)) {
                if(done) done(true);
                $trial.hide();
                return; //can use
            }
        }

        can_use_this_version_value = false;
        trial_no_save = true;
        showRenewLicenseTrialNotice();

        pinegrow.getComponent('dialog-email-serial', function(pc) {

            var html = pc.html;
            var $d = $('.check-license');
            if($d.length == 0) {
                $d = makeModalDialogWhole(html).addClass('intro').addClass('check-license');
                $d.on('hidden.bs.modal', function() {
                    setTimeout(function() {
                        $d.remove();
                    }, 500);
                })
            } else {
                $d.modal('show');
            }

            var $close = $d.find('.modal-header .close');
            var canClose = true;

            $d.find('.modal-footer .btn').on('click', function(e) {
                e.preventDefault();
                if(canClose) {
                    $d.modal('hide');
                    showNewVersionScreen();
                } else {
                    if(crsaTrialLeft() === null) {
                        alert('Please activate the trial first. It\'ll only take a minute.');
                    } else {
                        alert('Trial has expired. Get the full version to continue using Pinegrow.');
                    }
                }
            });

            var $buy = $d.find('.intro-section-buy');
            var $buyForm = $buy.find('form');
            var $buyEmail = $buyForm.find('#buyEmail');
            var $buySerial = $buyForm.find('#buySerial');

            var $renew = $d.find('.renew');
            var $renew_valid_date = $renew.find('.valid-date');
            var $renew_last_version = $renew.find('.last-version');

            var $wp = $d.find('.wp');
            var $manual = $d.find('.manual-act').hide();

            $renew.hide();

            if(email) $buyEmail.val(email);
            if(serial) $buySerial.val(serial);

            var showError = function($form, msg, cls) {
                if(!cls) cls = 'has-error';
                var $p = $form.parent().find('p.text-danger');
                if(!msg) {
                    $form.find('.form-group').removeClass('has-error has-success');
                    $p.html('').hide();
                    $form.find('button i').hide().parent().removeAttr('disabled');
                } else {
                    $form.find('.form-group').addClass(cls);
                    $p.html(msg).show();
                    $form.find('button i').hide().parent().removeAttr('disabled');
                }
            }

            var setCanClose = function(c) {
                if(c) {
                    $close.show();
                } else {
                    $close.hide();
                }
                canClose = c;
            }

            showError($buyForm);

            setCanClose(true);

            var onCheckLicense = function(info) {
                crsaStorage.setValue('validDate', info.valid_date);

                if(parseFloat(crsaGetVersion()) > parseFloat(info.last_version)) {
                    //expired
                    //done(false, info.last_version);
                    can_use_this_version_value = false;
                    trial_no_save = true; //disable save
                    //showError();
                    $renew_last_version.html( info.last_version );
                    $renew_valid_date.html( crsaShowDate( new Date(info.valid_date * 1000) ) );
                    if(pinegrow.hasActivatedProduct('WP')) $wp.hide();
                    $renew.show();

                    var rh = 'http://shop.pinegrow.com/renew?email=' + email + '&serial=' + serial;
                    $renew.find('a.renew-link').attr('href', rh);

                } else {
                    crsaStorage.setValue('currentVersion', crsaGetVersion());
                    can_use_this_version_value = true;
                    //done(true); //can use
                    $trial.hide();
                    alert('Good news! You can use this update for free.');
                    $d.modal('hide');
                    //showError();
                }
            }


            var support_msg = "Pinegrow could not be upgraded. Please check if your email and serial number are correct. If you are trying to <b>start the trial</b> you should use the form 1. Start trial, not this one. <a href=\"mailto:info@pinegrow.com\">Contact us</a> if the problem persists, we'll help you out."

            $buyForm.find('button').on('click', function(e) {

                if(e.shiftKey) {
                    e.preventDefault();

                }
            });

            if(license_info) {

                onCheckLicense( license_info );
            }

            $buyForm.on('submit', function(e) {
                showError($buyForm);

                e.preventDefault();
                email = $.trim($buyEmail.val());
                serial = $.trim($buySerial.val());



                if(!email || !serial) {
                    showError($buyForm, 'Please fill out both fields: email and serial code.')
                } else {
                    crsaStorage.setValue('activatedUserEmail', email);
                    crsaStorage.setValue('activatedSerial', serial);
                    //$d.modal('hide');
                    //done(email, serial);
                    //return;

                    var $spin = $buyForm.find('button i');
                    $spin.show();
                    $spin.parent().attr('disabled', 'disabled');

                    getLicenseInfo(function(data, error) {
                        $spin.hide();
                        $spin.parent().removeAttr('disabled');
                        //$d.modal('hide');
                        //done(email, serial, data);



                        if(error) {
                            showError($buyForm, 'We could not check the license: ' + error);
                            $manual.show();
                            $renew.hide();
                        } else {

                            onCheckLicense(data);
                        }

                    });
                }
            })

            if(isApp()) {
                $d.find('section a').on('click', function(e) {
                    var url = $(e.delegateTarget).attr('href');
                    if(url) {
                        e.preventDefault();

                        if($(e.delegateTarget).hasClass('manual')) {
                            $d.modal('hide');
                            manualActivation();
                        } else {
                            var gui = require('nw.gui');
                            var url = $(e.delegateTarget).attr('href');
                            if(url.indexOf('paddle') >= 0) {
                                gaSendPageView("paddle");
                            }
                            gui.Shell.openExternal(url);
                        }
                    }
                })
            }
        });
    }

    var manualActivation = function() {
        var email = crsaStorage.getValue('activatedUserEmail');

        pinegrow.stats.event('buy.manualshow');

        pinegrow.getComponent('dialog-manual-activation', function(pc) {

            var html = pc.html;
            var $d = $('.manual-activation');
            if($d.length == 0) {
                $d = makeModalDialogWhole(html).addClass('manual-activation').addClass('intro');
                $d.on('hidden.bs.modal', function() {
                    setTimeout(function() {
                        $d.remove();
                    }, 500);
                })
            } else {
                $d.modal('show');
            }

            var $close = $d.find('.modal-header .close');
            var canClose = true;

            $d.find('.modal-footer .btn').on('click', function(e) {
                e.preventDefault();
                $d.modal('hide');
            });

            var $buy = $d.find('.intro-section-buy');
            var $buyForm = $buy.find('form');
            var $buyEmail = $buyForm.find('#buyEmail');
            var $buyProductKey = $buyForm.find('#buySerial');

            if(email) $buyEmail.val(email);

            var showError = function($form, msg, cls) {
                if(!cls) cls = 'has-error';
                var $p = $form.parent().find('p.text-danger');
                if(!msg) {
                    $form.find('.form-group').removeClass('has-error has-success');
                    $p.html('').hide();
                    $form.find('button i').hide().parent().removeAttr('disabled');
                } else {
                    $form.find('.form-group').addClass(cls);
                    $p.html(msg).show();
                    $form.find('button i').hide().parent().removeAttr('disabled');
                }
            }

            showError($buyForm);

            var support_msg = "Pinegrow could not be upgraded. Please check if your email and product key are correct. <a href=\"mailto:info@pinegrow.com\">Contact us</a> if the problem persists, we'll help you out."

            $buyForm.on('submit', function(e) {
                showError($buyForm);

                e.preventDefault();
                var email = $.trim($buyEmail.val());
                var product_key = $.trim($buyProductKey.val());

                if(!email || !product_key) {
                    showError($buyForm, 'Please fill out both fields: email and product key.')
                } else {
                    crsaStorage.setValue('activatedUserEmail', email);
                    crsaStorage.setValue('activatedProductKey', product_key);

                    var info = getLicenseInfoFromProductKey(product_key);

                    if(!info) {
                        showError($buyForm, 'Invalid product key! Note, email is case sensitive.');
                    } else {
                        $d.modal('hide');
                        activateLicense(info.email, info.serial, info.product, info.last_version, info.valid_date);
                        checkLicense(function() {}, info);
                    }
                }
            })

            if(isApp()) {
                $d.find('section a').on('click', function(e) {
                    var url = $(e.delegateTarget).attr('href');
                    if(url) {
                        e.preventDefault();
                        var gui = require('nw.gui');
                        var url = $(e.delegateTarget).attr('href');
                        gui.Shell.openExternal(url);
                    }
                })
            }
        });
    }

    var activateLicense = function(email, serial, product, last_version, valid_date, sub_id, sub_status, sub_update_url) {

        crsaStorage.setValue('crsaBig',true);
        if(email) {
            crsaStorage.setValue('activatedUserEmail',email);
        }
        if(serial) {
            crsaStorage.setValue('activatedSerial',serial);
        }
        if(last_version) {
            crsaStorage.setValue('lastVersion',last_version);
        }
        if(valid_date) {
            crsaStorage.setValue('validDate',valid_date);
        }
        crsaStorage.setValue('subId',sub_id);
        crsaStorage.setValue('subStatus',sub_status);
        crsaStorage.setValue('subUpdateUrl',sub_update_url);

        var oldProduct = crsaStorage.getValue('activatedProduct');

        crsaStorage.setValue('activatedProduct',product);

        if(oldProduct != product) {
            var restart = '';
            if(product && product.indexOf('PRO') >= 0) {
                restart = '<p><b>Please RESTART PINEGROW for changes to take effect.</b></p>';
            }
            pinegrow.showAlert("<p>Pinegrow Web Editor was upgraded to " + pinegrow.getProductName(product) + ' edition.</p>' + restart, 'Upgrade done');
        } else {
            pinegrow.showAlert("Your Pinegrow Web Editor edition is " + pinegrow.getProductName(product) + '.', 'License ok');
        }

        var trialEmail = crsaStorage.getValue('userEmail');

        pinegrow.stats.event('buy.activate');
    }

    var deactivateLicense = function() {
        crsaStorage.setValue('crsaBig', false);
        crsaStorage.setValue('activatedSerial','');
        crsaStorage.setValue('lastVersion','');
        crsaStorage.setValue('validDate','');
        crsaStorage.setValue('subId','');
        crsaStorage.setValue('subStatus','');
        crsaStorage.setValue('subUpdateUrl','');
        crsaStorage.setValue('activatedProduct','');
        pinegrow.stats.event('buy.deactivate');
    }

    var showRenewLicenseTrialNotice = function() {
        $trial.html('<span>Your license expired or it is not checked.</span> <a href="#">Check or Renew now!</a>').show();
        $trial.find('a').on('click', function(e) {
            canUseThisVersion( function(can_use, last_version) {

            });
        });
    }

    var getLicenseInfo = function(done) {
        var email = crsaStorage.getValue('activatedUserEmail');
        var serial = crsaStorage.getValue('activatedSerial');

        jQuery.ajax({
            type: 'POST',
            url: 'http://shop.pinegrow.com/cob/callSmarty/Course/externalGetLicenseInfo/2',
            data: {email: email, serial: serial}
        })
            .done(function(data) {
                if(data.status == 'OK' && checkLicenseInfoHonesty(data)) {
                    done(data, null);
                } else {
                    done(null, data.status ? data.status : 'UNKNOWN ERROR');
                }
            })
            .fail(function(a, b, c) {
                done(null, 'License server is not accessible or is busy. Please try again. Accessing internet through Proxy can also cause this problem. In that case you can do Manual activation.', true);
            });
    }

    var checkLicenseInfoHonesty = function(info) {
        //debugger;
        var secret = 'HGS63fey&562';
        try {
            var id = md5(info.email + info.serial + info.product + info.valid_date + info.last_version + info.sub_id + info.sub_status + secret);
            if(id == info.msg_id) return true;
        }
        catch(err) {};
        return false;
    }

    var didVersionChange = function() {
        var last = crsaStorage.getValue('currentVersion');
        if(last != crsaGetVersion()) {
            return true;
        } else {
            return false;
        }
    }

    var can_use_this_version_value = true;

    var canUseThisVersionSync = function() {
        return can_use_this_version_value;
    }

    var canSaveFiles = function(cp, delay) {

        if(typeof delay == 'undefined') delay = 0;

        var pages = [];
        if(cp) {
            pages.push(cp);
        } else {
            pages = pinegrow.getAllPages();
        }

        var replyObject = {save: true, reason: ''};

        for(var i = 0; i < pages.length; i++) {
            var p = pages[i];
            p.callFrameworkHandler("on_can_save_page", replyObject);
        }
        if(!replyObject.save) {
            setTimeout(function() {
                pinegrow.showAlert(replyObject.reason, 'The page can\'t be saved', "Close", "Purchase &amp; Activate", null, function() {
                    showBuyScreen();
                });
            }, delay);
            return false;
        }

        var show = function(delay) {
            setTimeout(function() {
                showSaveIsDisabled();
            }, delay);
        }

        if(!crsaIsBig() && trial_no_save) {
            show();
            return false;
        }
        if(!canUseThisVersionSync()) {
            show();
            return false;
        }
        return true;
    }

    window.canSavePage = function(cp) {
        return canSaveFiles(cp);
    }

    var getLicenseInfoFromProductKey = function( key ) {
        var email = crsaStorage.getValue('activatedUserEmail');

        var a = key.split('-');
        if(a.length != 5) return null;

        //check
        var getHash = function(str) {
            var h = 0;
            for(var n = 0; n < str.length; n++) {
                h += str.charCodeAt(n) + (n * 17);
            }
            return h;
        }


        //$r.$email.$this->getStringHash($r) ), 12, 5);
        var code = a[0] + '-' + a[1] + '-' + a[2] + '-' + a[3];
        code = md5( code + email + getHash( code )).substr(12, 5);

        if(code.toUpperCase() != a[4]) return null;

        var product = a[0];

        var info = { product: 'PG_PERSONAL'};

        switch(product) {
            case 'HHTG':
                info.product = 'PG_PERSONAL';
                break;
            case 'GYKM':
                info.product = 'PG_COMPANY';
                break;
            case 'RKTS':
                info.product = 'PG_STUDENT';
                break;
            case 'KHGA':
                info.product = 'PGWP_PERSONAL';
                break;
            case 'RDEL':
                info.product = 'PGWP_COMPANY';
                break;
            case 'SHDK':
                info.product = 'PGWP_STUDENT';
                break;
            case 'QSFD':
                info.product = 'PGPRO_PERSONAL';
                break;
            case 'BGGF':
                info.product = 'PGPRO_COMPANY';
                break;
            case 'PYCZ':
                info.product = 'PGPRO_STUDENT';
                break;
            case 'NGTY':
                info.product = 'PGWPPRO_PERSONAL';
                break;
            case 'POWG':
                info.product = 'PGWPPRO_COMPANY';
                break;
            case 'BSFD':
                info.product = 'PGWPPRO_STUDENT';
                break;
            case 'URDF':
                info.product = 'PGPRO_CMSUSER';
                break;
        }
        info.valid_date = parseInt(a[1]) * 3600;
        info.last_version = a[2] == 'TBDV' ? '9999' : parseFloat(a[2]) / 100.0;
        info.serial = a[3];

        info.email = email;

        console.log(info);
        return info;
    }


    var canUseThisVersion = function(done) {

        var check = true;

        var valid_date = crsaStorage.getValue('validDate');
        if(valid_date) {
            if(parseFloat(valid_date) < (new Date()).getTime() / 1000) {
                //license expired
                check = true;
            } else {
                //looks like it is still valid
                check = false; //skip check for now, keep it simple
            }
        }
        if(check && didVersionChange()) {
            checkLicense();
            return;
        }
        //lets check it anyway

        getLicenseInfo(function(data, status, net_error) {
            if(data) {
                if(data.sub_id) {
                    if(data.sub_status == 'past_due') {
                        //show notice
                        if(data.sub_update_url) {
                            pinegrow.getComponent('payment-due', function(pc) {
                                var $d = pinegrow.showAlert(pc.html, "Notice");
                                $d.find('.update-url').attr('href', data.sub_update_url);
                            });
                        }
                    } else if(data.sub_status == 'deleted') {
                        can_use_this_version_value = false;
                        deactivateLicense();
                        pinegrow.showAlert('Your Pinegrow subscription expired.', 'Subscription expired', null, 'OK', null, showIntroScreen, showIntroScreen);
                    }
                }
            } else {
                if(!net_error) {
                    //ignore bad license for now
                    //checkLicense(); //force check license
                } else {
                    //net error
                    //can use for now
                }
            }
        })
    }


    window.crsaFuncs = {
        findActionMenuForInsertingDefIntoEl : findActionMenuForInsertingDefIntoEl,
        insertThroughActionMenu : insertThroughActionMenu,
        insertBeforeOrAfter : insertBeforeOrAfter,
        replaceElement : replaceElement,
        createPreviewElementFromDefinition : createPreviewElementFromDefinition
    }

})( jQuery );












function removeCrsaClasses($node) {
    var cls = $node.attr('class');
    if(cls) {
        cls = cls.replace(/(^|\W)crsa\-[a-z\-]*/ig,'');
        $node.attr('class', cls);
    }
}

function copyCodeToClipboard(code) {
    if(!isApp()) return;
    code = removeCrsaClassesFromHtml(code);
    code = pinegrow.formatHtml(code);
    var gui = require('nw.gui');
    var clipboard = gui.Clipboard.get();
    clipboard.set(code, 'text');
    crsaQuickMessage('Code copied to clipboard.');

    pinegrow.getClipboard().add(code);
}

function removeCrsaClassesFromHtml(str) {
    var rr = /\s*crsa\-[a-z\-]*/g;
    //.replace(/\sdata\-pg\-id="[0-9]*"/g,'')
    //str = str.replace(/\sdata\-pg\-tree\-id="[0-9]+"/g, '');
    return str.replace(/class=".*"/g, function(m) {
        return m.replace(rr, '')
    }).replace(/(<[^>]*?)\s*class\=['"]\s*['"]/ig, '$1');
    //return str.replace(/(<[^>]*?)\s*crsa\-[a-z\-]*/ig,'$1').
}



function getIframeBody(iframe) {
    var doc = iframe.contentDocument || iframe.contentWindow.document;
    return doc.body;
}

function getIframeHtml(iframe) {
    var doc = iframe.contentDocument || iframe.contentWindow.document;
    return doc.html;
}

function getIframeDocument(iframe) {
    return iframe.contentDocument || iframe.contentWindow.document;
}

function getIframeOfElement($el) {
    var r = null;
    if(!$el || $el.length == 0) return null;
    var od = $el.get(0).ownerDocument;
    $('iframe.content-iframe').each(function(i,iframe) {
        var doc = getIframeDocument(iframe);
        if(doc == od) {
            r = $(iframe);
            return false;
        }
    });
    return r;
}


function getCrsaPageOfElement($el) {
    var $iframe = getIframeOfElement($el);
    return $iframe ? getCrsaPageForIframe($iframe) : null;
}

function shortenString(str, maxlen, add) {
    if(typeof add == 'undefined') add = '...';
    if(!str || str.length <= maxlen) return str;
    return str.substr(0, maxlen) + add;
}


function getObjectFromElement($el) {
    return $el && $el.length > 0 ? {type : 'element', data : $el} : null;
}

function getObjectFromRule(rule) {
    return {type : 'rule', selector : rule.selector, data : rule};
}

function getUniqueId(pref, page, prev) {
    var start = 0;
    if(typeof prev != 'undefined') {
        prev = "" + prev;
        start = parseInt(prev.replace(/[a-z]*/i, ''));
    }
    if(!page) page = pinegrow.getSelectedPage();
    var $html = page ? page.get$Html() : null;
    if(!pref) pref = 'crsa_id_';
    var c = prev ? start : gen_id_count;
    while(true) {
        c++;
        var nid = pref + c;
        if($html) {
            if($html.find('#' + nid).length == 0) {
                if(!prev) gen_id_count = c;
                return nid;
            }
        } else {
            if($('#' + nid).length == 0) {
                if(!prev) gen_id_count = c;
                return nid;
            }
        }
    }
}

function getClosestCrsaElement($el) {
    var def = getType($el);
    while($el && $el.length > 0 && def === null) {
        $el = $el.parent();
        def = getType($el);
    }
    if(def) return $el;
    return $();
}

function getType($e, evaluate, fast, crsaPage, pgel) {
    if(typeof evaluate == 'undefined') evaluate = false;
    var t = null;

    //special case - pgel is set, no $e - happens in batch updates, in non editable files
    if(!$e && pgel) {
        $.each(crsaPage.getComponentTypes(), function(i,def) {
            var isType = false;

            if(def.not_main_type) return true;

            if(def.selector_tag) {
                isType = pgel.tagName === def.selector_tag;
            } else if(typeof def.selector == 'function') {
                //isType = def.selector($e); <-- skip this, these functions expect $e
            } else if(def.selector) {
                isType = pgel.isSelector(def.selector);
            }

            if(isType) {
                t = def;
                return false;
            }
            return true;
        });
        return t;
    }

    if(!evaluate) {
        t = $e.data('crsa-def');
        if(t) return t;
        if(t === false) return null;
    }
    if(fast) return null;

    if(!pgel) {
        pgel = getElementPgNode($e);
    }

    if(!crsaPage) {
        crsaPage = getCrsaPageForIframe(getIframeOfElement($e));
        //console.log('no crsapage');
    }

    if(!crsaPage) {
        //console.log("El has no page " + $e.get(0));
        return null;
    }
    t = crsaPage.getMainType($e, pgel, true, false);
    /*
     $.each(crsaPage.getComponentTypes(), function(i,def) {
     var isType = ;

     if(def.not_main_type) return true;

     if(def.selector_tag) {
     isType = $e.get(0).tagName === def.selector_tag;
     } else if(typeof def.selector == 'function') {
     isType = def.selector($e);
     } else if(def.selector) {
     isType = $e.is(def.selector, pgel);
     }

     if(isType) {
     t = def;
     return false;
     }
     return true;
     });
     */
    if(t) {
        $e.data('crsa-def', t !== null ? t : false);
    }

    return t;
}


function getElementName($e, def, html, get_cls, get_text, show_tag, action_tag, crsaPage) {
    var node = $e.get(0);

    if(!$e || !node) {
        return def ? def.name : "Element";
    }
    if(!def) def = getType($e);

    if(!def) {
        return node.tagName + ' (unknown)';
    }
    var name = null;
    if(def.display_name && typeof def.display_name == 'function') {
        name = def.display_name($e, def);
    } else {
        var t;
        if(get_text) {
            //t = $e.text().substring(0,30);
            t = '';
            var text_done = false;
            //debugger;
            if(node.tagName == 'META') {
                var meta_name = node.getAttribute('name');
                var meta_content = node.getAttribute('content');
                if(meta_name) {
                    t = meta_name + '="' + (meta_content || '') + '"';
                } else {
                    if(node.attributes.length) {
                        t = node.attributes[0].nodeName + '="' + node.attributes[0].nodeValue + '"';
                    }
                }
                text_done = true;
            } else if(node.tagName == 'LINK') {
                t = pinegrow.getOriginalUrl((node.getAttribute('href') || ''));
                text_done = true;
            }  else if(node.tagName == 'SCRIPT') {
                var src = node.getAttribute('src');
                if(src) {
                    t = pinegrow.getOriginalUrl(src);
                    text_done = true;
                } else {
                    t = node.innerText || '';
                }
            }
            if(!text_done) {
                for(var ci = 0; ci < node.childNodes.length; ci++) {
                    if(node.childNodes[ci].nodeType == 3) {
                        t += $.trim(node.childNodes[ci].textContent);
                        if(t.length) {
                            t = t.substring(0,30);
                            break;
                        }
                    }
                }
            }
            if(t.length) t = t.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
        }
        name = def.name;

        if(node.tagName == 'HTML' && crsaPage) {
            name = crsaPage.name;
        } else {

            var tag = node.nodeName.toLowerCase();
            if(show_tag || def.display_name == 'tag') {
                name = tag;
            } else if(show_tag && name.toLowerCase() != tag) {
                name += ' (' + tag + ')';
            }
        }
        var pg_name = node.getAttribute('data-pg-name');
        if(pg_name) name = pg_name;

        var id = node.id;
        if(id) name += html ? '<span class="name-id">' + "#" + escapeHtmlCode(id) + '</span>' : "#" + escapeHtmlCode(id);

        if(get_cls) {
            ///debugger;
            var cls_count = 0;
            var first_cls = null;
            var all_cls = '';

            if(node.classList.length > 0) {
                for(var i = 0; i < node.classList.length; i++) {
                    if(node.classList[i].startsWith('crsa') || node.classList[i].startsWith('pgc-') || node.classList[i].startsWith('pg-')) continue;
                    cls_count++;
                    var cls = escapeHtmlCode(node.classList[i]);
                    if(cls_count === 1) first_cls = cls;
                    all_cls += '.' + cls;

                }
                if(cls_count > 0) {
                    name += html ? '<span class="name-text"' + (cls_count > 1 ? ' title="' + all_cls  + '"' : '') + '>' + '.' + first_cls + (cls_count > 1 ? '&hellip;' : '') + '</span>' : '.' + first_cls + (cls_count > 1 ? '&hellip;' : '');
                }

            }
            /*
            var cls = node.className;
            if(cls) {
                //cls = cls.replace(/\s*crsa\-[a-z\-]*    /ig,'');
                cls = cls.replace(/\s\s+/g,'').replace(/\s/ig,'.');
                if(cls && cls.length > 0) name += html ? '<span class="name-text">' + '.' + escapeHtmlCode(cls) + '</span>' : '.' + escapeHtmlCode(cls);
            }
*/
        }
        if(action_tag) name = name + ' | ' + (html ? '<span class="name-at">' + action_tag + '</span>' : action_tag);
        if(t) name = name + ' | ' + (html ? '<span class="name-text">' + t + '</span>' : t);
    }
    return name;
}

function isInDOMTree(node) {
    // If the farthest-back ancestor of our node has a "body"
    // property (that node would be the document itself),
    // we assume it is in the page's DOM tree.
    return !!(findUltimateAncestor(node).body);
}
function findUltimateAncestor(node) {
    // Walk up the DOM tree until we are at the top (parentNode
    // will return null at that point).
    // NOTE: this will return the same node that was passed in
    // if it has no ancestors.
    var ancestor = node;
    while(ancestor.parentNode) {
        ancestor = ancestor.parentNode;
    }
    return ancestor;
}

function getTreeNodeForElement($el, $tree) {
    if(!$tree) {
        var page = pinegrow.getSelectedPage();
        if(!page) return null;
        $tree = page.treeTop;
    }
    var $tel = $el.data('crsa-tree-node');
    var node = ($tel && $tel.length > 0 && isInDOMTree($tel.get(0))) ? $tel : null;
    if(!node && $tree) {
        var pgid = $el.attr('data-pg-tree-id');
        if(pgid) {
            node = $tree.find('[data-pg-tree-id="' + pgid + '"]');
            if(node.length) return node;
            return null;
        }
    }
    return node;
}

function isApp() {
    return typeof process != 'undefined' && process.versions && ('node-webkit' in process.versions);
}

function crsaChooseFile(done, save_as, multiple, working_dir, folder) {
    //var save_as = save_as ? (typeof save_as == 'string' ? 'nwsaveas="' + save_as + '"' : 'nwsaveas') : '';
    var $fileInput = $('<input style="display:none;" type="file"/>').appendTo($('body'));
    if(multiple) {
        $fileInput.attr('multiple', '');
    }
    var using_project_working_dir = false;
    if(!working_dir) {
        working_dir = pinegrow.getWorkingDir();
        using_project_working_dir = true;
    }

    if(working_dir) {
        /*if(!working_dir.endsWith('\\')) {
            working_dir += '\\';
        }*/
        if(save_as) {
            save_as = require('path').join(working_dir, save_as);
        }
        $fileInput.attr('nwworkingdir', working_dir);
    }
    if(folder) {
        $fileInput.attr('nwdirectory', '');
    }

    if(save_as) {
        $fileInput.attr('nwsaveas', save_as);
    } else {
        $fileInput.removeAttr('nwsaveas');
    }
    $fileInput.on('change', function(evt) {
        var files = $(this).val();
        var url = !multiple ? crsaMakeUrlFromFile(files) : files;
        if(files && files.length > 0) {
            if(!multiple && using_project_working_dir) {
                pinegrow.setWorkingDir(require('path').dirname(files));
            }
            done(url, files);
        }
        $fileInput.remove();
    });

    $fileInput.trigger('click');
}

function crsaGetObjectParentUrl(obj) {
    if(obj.type == 'element') {
        var $el = obj.data;
        return getCrsaPageForIframe(getIframeOfElement($el)).url;
    } else if(obj.type == 'rule') {
        return obj.data.crsa_stylesheet.url;
    } else if(obj.type == 'stylesheet') {
        return obj.data.url;
    }
    return null;
}

function crsaGetVersion() {
    return "2.92";
}

function crsaCheckForNewVersion(func, on_data_func) {
    var url = "http://pinegrow.com/version.json?z=" + (new Date()).getTime();
    //url = "file:///Users/Matjaz/Dropbox/Development/DVWeb/DV/Pinegrow/PinegrowWeb/version.json";

    $.ajax({
        url: url,
        data: null,
        dataType: 'json'
    }).done(function(data) {
        if(on_data_func) on_data_func(data);

        if(data.version && parseFloat(data.version) > parseFloat(crsaGetVersion())) {
            func(data);
        } else {
            func(null);
        }
    }).fail(function() {
        func(null);
    });
}

function crsaGetVersionName() {
    var s = crsaGetVersion();// + ' ' + (isApp() ? 'App' : 'Web');
    if(isApp() && crsaIsBig()) {
        s += ' - ' + pinegrow.getProductName();
    }
    if(pg_is_beta) s += ' ' + pg_is_beta;
    return s;
}
function crsaIsBig() {
    //return 0;
    if(crsaStorage.getValue('crsaBig')) return true;
    if(!isApp()) return 1;
    return 0;
}

function crsaCheckMe(str, h, d) {

    var prod_key = h.substr(5);
    var h = h.substr(0,5);
    var nh = '';
    for(var i = 0; i < str.length; i++) {
        var ch = str.charCodeAt(i);
        nh += String.fromCharCode((ch * (i+11)) % 25 + 65);
        if(i == 4) break;
    }
    if(d) console.log(nh);
    if( h.toLowerCase() == nh.toLowerCase() ) {
        var product = 'PG_PERSONAL';
        switch(prod_key) {
            case 'A108':
                product = 'PG_COMPANY';
                break;
            case 'S21':
                product = 'PG_STUDENT';
                break;
            case 'WA1083':
                product = 'PGWP_COMPANY';
                break;
            case 'WP3':
                product = 'PGWP_PERSONAL';
                break;
            case 'S213':
                product = 'PGWP_STUDENT';
                break;
        }
        return product;
    }
    return false;
}

function crsaIsEmailActivated() {
    if(isApp() && crsaIsBig()) return true;
    if(!crsaStorage.getValue('userEmail')) return false;
    if(!crsaStorage.getValue('activationCode')) return false;
    var c = crsaCheckMe(crsaStorage.getValue('userEmail'), crsaStorage.getValue('activationCode'));
    //var c = true;
    if(c && !crsaStorage.getValue('activatedDate')) {
        crsaStorage.setValue('activatedDate', (new Date()).getTime());
    }
    return c;
}

function crsaGenCode(code, m) {
    if(!m) m = 0;
    var len = 8;
    var min = 65;
    var max = 65 + 25;
    var chp = 3;
    var s = 0;
    var str = '';
    if(!code) {
        for(var n = 0; n < len; n++) {
            var c;
            if(n % chp != chp-1) {
                c = Math.round(Math.random() * (max-min)) + min;
            } else {
                c = (s % (max-min + m)) + min;
            }
            str = str + String.fromCharCode(c);
            s += c;
        }
        return str;
    } else {
        code = $.trim(code.toUpperCase());
        if(code.length != len) return false;
        for(var n = 0; n < len; n++) {
            var c = code.charCodeAt(n);
            if(n % chp != chp-1) {
            } else {
                if(c != (s % (max-min)) + min) return false;
            }
            s += c;
        }
        return true;
    }
}

var crsaHasChanges = function() {
    var change = false;
    var pages = $.fn.crsapages('getAllPages');
    $.each(pages, function(i, cp) {
        change = change || cp.changed;
    });

    change = change || pinegrow.hasUnsavedFrameworks();
    return change;
}

var crsaLoadedScripts = {};

var crsaLoadScript = function( url, done ) {
    var options = {};
    if(url in crsaLoadedScripts) {
        done();
        return;
    }
    options = $.extend( options || {}, {
        dataType: "script",
        cache: true,
        url: url
    });
    return jQuery.ajax( options).done(function( script, textStatus ){
        crsaLoadedScripts[url] = true;
        done();
    });
};

var gaNoCookieSendHit = function(tid, t, data) {
    var z = parseInt(Math.random()*99999999);
    if(!localStorage.gaNoCookieUid) localStorage.gaNoCookieUid = 'uid' + Math.random() * 1000000000;
    var uid = localStorage.gaNoCookieUid;
    var url = 'http://www.google-analytics.com/collect?payload_data&v=1&aip=1&z=' + z + '&tid=' + tid + '&cid=' + uid + '&t=' + t + '&' + data;
    var img = document.createElement('img');
    img.setAttribute('src', url);
    img.style.position = 'absolute';
    img.style.height = '0px';
    document.body.appendChild(img);
    setTimeout(function() {
        $(img).remove();
    }, 1000);
}

var gaNoCookieSendPageView = function(tid, page, title) {
    var page = encodeURIComponent(page);
    var title = encodeURIComponent(title);
    var data = 'dp=' + page + '&dt=' + title + '&';
    gaNoCookieSendHit(tid, 'pageview', data);
}

var gaNoCookieSendEvent = function(tid, ec, ea, el) {
    if(typeof el == 'undefined') el = "";
    ec = encodeURIComponent(ec);
    ea = encodeURIComponent(ea);
    el = encodeURIComponent(el);
    var data = 'ec=' + ec + '&ea=' + ea + '&el=' + el + '&';
    gaNoCookieSendHit(tid, 'event', data);
}

var gaSendPageView = function(subpage) {
    if(typeof pinegrow == 'object' && pinegrow.getSetting('disable-stats', '0') == '1') return;

    var app = isApp() ? '/PinegrowApp/' : '/PinegrowWeb/';
    if(isApp()) {
        if(crsaIsBig() && !crsaStorage.getValue('activatedSerial')) {
            app += 'Banana/';
        }
        app += crsaIsBig() ? 'Pro/' : 'Demo/';
        if(subpage) app += subpage + '/';
        app += crsaGetVersion();
        if(pg_is_beta) app += pg_is_beta;
        gaNoCookieSendPageView('UA-344271-72', app, 'Pinegrow App Run');
    } else {
        if(subpage) app += subpage + '/';
        app += crsaGetVersion();
        ga('send', 'pageview', app);
    }
}

var crsaIsInEdit = function() {
    return $.fn.crsa('getEditor').isInEdit();
}

var crsaEndEditModeIfActive = function() {
    if(crsaIsInEdit()) {
        $.fn.crsa('getEditor').endEdit();
        return true;
    }
    return false;
}

var crsaWillChangeDom = function() {
    return crsaEndEditModeIfActive();
}

var crsaGetKbdDisplay = function(kbd, txt) {
    var shift = kbd.indexOf('SHIFT') >= 0;
    var cmd = kbd.indexOf('CMD') >= 0;
    var alt = kbd.indexOf('ALT') >= 0;

    var r = '';
    if(shift) {
        r += txt ? 'SHIFT' : '&#8679;';
        kbd = kbd.replace('SHIFT', '');
    }
    if(alt) {
        r += txt ? 'ALT' : (is_mac ? '&#8997;' : 'ALT ');
        kbd = kbd.replace('ALT','');
    }
    if(cmd) {
        r += (is_mac) ? (txt ? 'CMD' : '&#8984;') : (txt ? 'CTRL' : '^'/*'&#x2303'*/);
        kbd = kbd.replace('CMD','');
    }
    r += $.trim(kbd);
    return r;
}

var crsaAddKbd = function($a, kbd) {
    var r = crsaGetKbdDisplay(kbd);
    $a.append('<span class="kbdspacer"></span><span class="kbd">' + r + '</span>');
    $a.parent().addClass('haskbd');
}

var PgCustomLogic = function() {

    this.nodeFilter = null;//function(node, parent_status) { return status }
    this.getTreeRootForElement = null;// function($el)
    this.navBar = null;
    this.defaultZoom = 'fit';
    this.showOnlyClassesInProperties = false;
    this.openTab = 'lib';
    this.textPropsElementNotSelected = 'Click on any element on the page to show its properties.';
    this.onPageLoaded = null;//function(crsaPage)
    this.onPageChanged = null;//function(crsaPage, $el)
    this.scrollMode = true;
    this.warnOnUnloadPage = true;
}


/*
 for(var i = 0; i < 10; i++) {
 var c = crsaGenCode(null, i % 2);
 console.log(c);
 console.log(crsaGenCode(c));
 }
 */





var CrsaLocalStorage = function() {

    var fs = null;
    var data = {};

    var _this = this;

    var saveTimer = null;

    var saveData = function() {
        if(saveTimer) {
            clearTimeout(saveTimer);
        }
        saveTimer = setTimeout(function() {
            var str = JSON.stringify(data);
            str = window.btoa(encodeURIComponent( str ));
            localStorage.crsaInternal = str;
        }, 100);
    }



    this.setValue = function(key, val) {
        if(isApp()) {
            data[key] = val;
            saveData();
        } else {
            localStorage[key] = val;
        }
    }

    this.getValue = function(key) {
        if(isApp()) {
            return (key in data) ? data[key] : null;
        } else {
            return (key in localStorage) ? localStorage[key] : null;
        }
    }

    this.hasValue = function(key) {
        if(isApp()) {
            return (key in data) ? true : false;
        } else {
            return (key in localStorage) ? true : false;
        }
    }

    if(isApp()) {
        if(!localStorage.crsaInternal) {
            $.each(localStorage, function(key, val) {
                data[key] = val;
            });
            saveData();
        } else {
            try {
                data = JSON.parse(decodeURIComponent(window.atob( localStorage.crsaInternal )));
            } catch(err) {
                data = {};
            }
        }
    } else {
    }

}
