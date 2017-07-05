/**
 * Created by Matjaz on 12/9/13.
 */



var CrsaProjectBrowser = function(opts) {

    var _this = this;
    var activeIndex = 0;



    this.options = null;
    this.crsaProjects = null;
    this.onFileSelected = null;
    this.title = null;
    this.intro = null;
    this.selectedProject = null;

    var def = {
        modal: true
    }

    this.opts = $.extend( {}, def, opts );

    this.setProjects = function(cp) {
        this.crsaProjects = cp;
    }


    this.show = function(justSelected) {
        justSelected = justSelected || false;

        var selectedItem = null;//this.getSelectedItem();
        var selectedLi = null;

        var $div = $('<div/>', {class: 'project-browser'}).html('<div class="clearfix"><div class="pills"></div><div class="tabs"></div></div>');
        var $pills = $('<ul class="nav nav-pills nav-stacked"></ul>').appendTo($div.find('.pills'));
        var $tabs = $('<div class="tab-content"></div>').appendTo($div.find('.tabs'));

        var showProject = function (i, project) {
            if (!project.framework) return;
            if (project.show_only_master_pages && $.isEmptyObject(project.framework.master_pages)) return;

            var id = 'project-browser-tab-' + i;
            var $pill = $('<li><a href="#' + id + '" data-toggle="pill">' + project.name + (project.info_badge ? ' <span class="info-badge">' + project.info_badge + '</span>' : '') + '</a></li>').appendTo($pills);

            var $b = $('<div class="tab-pane fade" id="' + id + '"><div class="project-info"></div><ul></ul></div>').appendTo($tabs);
            var $ul = $b.find('ul');

            var children = [];
            if (project.show_only_master_pages) {
                _this.selectedProject = project;
                var master_pages = project.framework.master_pages;
                for (var name in master_pages) {
                    var master_page = jQuery.extend(true, {}, master_pages[name]);
                    master_page.tag = "master_page";
                    children.push(master_page);
                }
            }
            else {
                for(var n = 0; n < project.root.children.length; n++) {
                    if(project.root.children[n].order === undefined) {
                        project.root.children[n].order = n;
                    }
                }
                children = project.root.children.sort(function (a, b) {
                    if (a.order > b.order) return 1;
                    if (a.order < b.order) return -1;
                    if (b.order === undefined) return -1;
                    if (a.order === undefined) return 1;
                });
            }

            for(var n = 0; n < children.length; n++) {
                var cf = children[n];
                var $li = null;
                if (cf.tag == "master_page") {
                    var node = cf;
                    var src = node.image + "?v=" + pinegrow.cache_breaker;
                    cf = cf.file;

                    if (cf) {
                        $li = $('<li/>', {'class': 'item'}).html('<h3>' + cf.name + '</h3>').data('file', cf).data('project', project).appendTo($ul);
                        $('<img/>', {src: src }).prependTo($li);
                    }
                    else {
                        $li = $('<li/>', {'class': 'item reload-master-page'}).html('<h3>Master Page</h3><p>Reload & update components first</p>').data('file', '').data('project', project).appendTo($ul);
                    }
                }
                else if(cf.isFile && cf.tag == 'page') {
                    $li = $('<li/>', {'class': 'item'}).html('<h3>' + cf.name + '</h3>').data('file', cf).data('project', project).appendTo($ul);

                    if(cf.image) {
                        var $img = $('<img/>', {src: cf.image}).prependTo($li);
                        if(cf.image_class) {
                            $img.addClass(cf.image_class);
                        }
                    }

                    if(cf.description) {
                        $('<div class="description">' + cf.description + '</div>').appendTo($li);
                        $li.addClass('with-description');
                    }
                    if(selectedItem == cf) {
                        $li.addClass('selected');
                        selectedLi = $li;
                    }
                }
                if($li) crsaHandleExternalLinks($li);
            }

            var info = '';
            if(project.description) {
                info += project.description;
            }
            if(project.author) {
                info += (info.length ? ' | ' : '') + 'By <a href="' + project.author_link + '">' + project.author + '</a>';
            }
            if(info.length) {
                var $info = $b.find('.project-info');
                $info.html('<p>' + info + '</p>');
                $info.find('a').addClass('external');
                crsaHandleExternalLinks($info);
            }
            if(_this.selectedProject ? _this.selectedProject == project : i == 0) {
                $pill.addClass('active');
                $b.addClass('active in');
            }
            $pill.tab();
        }

        if (justSelected) {
            showProject(0, this.selectedProject)
        }
        else {
            $.each(this.crsaProjects, function(i, project) {
                showProject(i, project);
            })
        }

        if(this.intro) {
            var $i = $(this.intro).prependTo($div);
            if(isApp()) {
                $i.find('a').on('click', function(e) {
                    e.preventDefault();
                    var gui = require('nw.gui');
                    var url = $(e.delegateTarget).attr('href');
                    gui.Shell.openExternal(url);
                });
            }
        }

        var $d = makeModalDialog(this.title ? this.title : "Select item", "Close", null, $div, function() {
            //cancel
        }, function() {
            //ok
        }, function($d) {
            $d.find('.modal-dialog').css('width', '890px');
        });

        $tabs.find('li.item').not('.reload-master-page').on('click', function(e) {
            var $li = $(e.delegateTarget);
            var cf = $li.data('file');

            if(selectedLi) {
                selectedLi.removeClass('selected');
                selectedLi = null;
            }
            if(selectedItem == cf) {
                selectedItem = null;
            } else {
                selectedItem = cf;
                selectedLi = $li;
                $li.addClass('selected');
            }
            if(_this.onFileSelected) _this.onFileSelected(cf, $li.data('project'));
            $d.modal('hide');
            e.preventDefault();
        });

    }

}


var CrsaMultiChooser = function (list) {
    var _this = this;
    list = list || [];
    var resultList = [];


    this.addItem = function (question, key, choices) {
        list.push({
            question: question,
            key: key,
            choices: choices
        });
    }

    var addToChosenList = function (chosen, key) {
        resultList[key] = chosen;
    }

    var removeFromChosenList = function (chosen, key) {
        if (resultList[key]) {
            delete resultList[key];
            return true;
        }
        return false;
    }

    this.show = function (message, done) {
        if(list.length) {
            message = message || "Please choose files";
            var $b = $("<div><p>" + message + "</p></div>");
            var $table = $('<table class="file-writer table table-striped table-condensed table-hover"><tbody></tbody></table>').appendTo($b);
            var $tbody = $table.find('tbody');

            for (var i = 0; i < list.length; i++) {
                var choices = list[i].choices;
                var $title_tr = $('<tr><td><b>&nbsp;' + list[i].question + '</b></td></tr>').appendTo($tbody);
                for (var j = 0; j < choices.length; j++) {
                    var url = crsaGetSummaryStr(choices[j], 100);
                    var $tr = $('<tr data-index="' + i + '" data-chosen-item="' + j + '"><td><label title="' + choices[j] + '"><input type="radio" value="1" name="file-' + i + '" />&nbsp;' + url + '</label></td></tr>').appendTo($tbody);
                }
            }

            var $modal = makeModalDialog('Choose Files', 'Cancel', 'Ok', $b, function() {
                //cancel
                if(done) done();

            }, function() {
                //save selected
                $checks.each(function(i, ch) {
                    var $ch = $(ch);
                    var $tr = $ch.closest('tr');
                    var listIndex = parseInt($tr.attr('data-index'));
                    var choosenItemIndex = parseInt($tr.attr('data-chosen-item'));
                    var chosen = list[listIndex].choices[choosenItemIndex];
                    if($ch.is(':checked')) {
                        addToChosenList(chosen, list[listIndex].key);
                    }
                    // else {
                    //     removeFromChosenList(chosen, list[listIndex].key);
                    // }
                });

                if(done) done(resultList);
            });

            var $checks = $tbody.find('input[type="radio"]');
        }
        else {
            if (done) done();
        }
    }
}


var pgRecentFiles = function() {

    this.list = [];
    var _this = this;

    var max_show = 10;

    this.add = function(file_or_url, project) {
        if(typeof project == 'undefined') project = false;
        var existing = this.remove(file_or_url, true);
        this.list.unshift({file: file_or_url, project: project, sticky: existing ? (existing.sticky || false) : false});
        if(this.list.length > max_show) {
            //this.list.splice(max_show, this.list.length - max_show);
            var r = [];
            var count_nonsticky = 0;
            for(var i = 0; i < this.list.length; i++) {
                if(!this.list[i].sticky) {
                    if(count_nonsticky < max_show) {
                        r.push(this.list[i]);
                        count_nonsticky++;
                    }
                } else {
                    r.push(this.list[i]);
                }
            }
            this.list = r;
        }
        update();
        save();
    }

    var findByFile = function(file) {
        for(var i = 0; i < _this.list.length; i++) {
            if(_this.list[i].file == file) return i;
        }
        return -1;
    }

    this.remove = function(file_or_url, skip_update) {
        var item = null;
        var idx = findByFile(file_or_url);
        if(idx >= 0) {
            item = this.list[idx];
            this.list.splice(idx, 1);
        }
        if(!skip_update) {
            update();
            save();
        }
        return item;
    }

    this.removeAll = function() {
        var r = [];
        for(var i = 0; i < this.list.length; i++) {
            if(this.list[i].sticky) {
                r.push(this.list[i]);
            }
        }
        this.list = r;
        update();
        save();
    }

    var save = function() {
        var str = JSON.stringify(_this.list);
        localStorage.pgRecentFiles = str;
    }

    var openRecentFileMenu = function (event) {
        var $parent = $(event.target).parent();
        if ($parent.hasClass('menu-file-recent')) {
            var $menu = $('.submenu-file-recent');
            if ($menu.is(':visible')) {
                $menu.css('display', 'none');
            }
            else {
                $menu.css('display', 'block');
                $menu.css('height', 'auto');
                $menu.css({
                    'display': 'block',
                    'height': 'auto',
                    'top': $parent.offset().top - 3,
                    'left': $parent.width()
                });

                var menuTopPos = $menu.offset().top;
                var menuPos = $menu.height() + menuTopPos;
                var winHeight = $(window).height();

                if (menuPos > winHeight) {
                    var overlayHeight = winHeight - menuPos;
                    var newTop = menuTopPos + overlayHeight - 10;
                    if (newTop > 0) {
                        $menu.css({
                            'top': newTop
                        });
                    }
                    else {
                        $menu.css({
                            'top': 0,
                            'height': winHeight
                        });
                    }

                }
            }
        }

        event.preventDefault();
    }

    var onclick = function(event) {
        var $a = $(event.delegateTarget);
        var file = $a.attr('href');
        var project = $a.attr('data-project') ? true : false;

        if(project) {
            if(canOpenProject()) {
                // file is path
                if (crsaIsFileOrDir(file) == "dir") {
                    var p = new CrsaProject();
                    p.fromFolder(file, function(p) {
                        pinegrow.setCurrentProject(p);
                        crsaQuickMessage('Project was loaded.');
                        pinegrow.showTab('project');
                    }, true /* show pg files */);

                    pinegrow.stats.using('app.openproject');
                }
                else {
                    pinegrow.showAlert('Project folder may be deleted or moved to another directory.', 'Project folder not found');
                }
            }
        } else {
            // file is url
            if (!crsaIsFileUrl(file) || crsaIsFileOrDir(crsaMakeFileFromUrl(file)) == "file") {
                pinegrow.openPage(file);
                pinegrow.stats.using('app.openfile');
            }
            else {
                pinegrow.showAlert('File may be deleted or moved to another directory.', 'File not found');
            }
        }

        setTimeout(function() {
            _this.add(file, project);
        }, 100);

        event.preventDefault();
    }

    var update = function() {
        var $recent_link = $('.menu-file-recent');
        var $menu = $('.submenu-file-recent').html('');
        var $canvas = $('.empty-canvas .recent-files');
        var $canvas_ul = $('.empty-canvas .recent-files ul').html('');

        $menu.css('display', 'none');
        for(var i = 0; i < _this.list.length; i++) {
            var str = _this.list[i].file;
            if(str.length > 50) {
                str = '&hellip;' + str.substr(str.length - 50);
            }
            if(_this.list[i].project) {
                str += '<small>prj</small>';
            }

            var li_menu = '<li><a href="' + _this.list[i].file + '"' + (_this.list[i].project ? ' data-project="true"' : '') + ' class="menu-file-recent-item">' + str + '</a></li>';
            var $li = $('<li class="recent-item"><a href="' + _this.list[i].file + '"' + (_this.list[i].project ? ' data-project="true"' : '') + ' class="menu-file-recent-item">' + str + '</a><i class="sticky-control fa fa-code"></i></li>').data('item', _this.list[i]);
            $menu.append(li_menu);
            $canvas_ul.append($li);

            var $sticky = $li.find('.sticky-control');
            if(_this.list[i].sticky) {
                $sticky.addClass('sticky');
            }
            $sticky.on('click', function(e) {
                e.preventDefault();
                var $i = $(e.delegateTarget);
                var item = $i.closest('li').data('item');
                item.sticky = !(item.sticky || false);
                if(item.sticky) {
                    $i.addClass('sticky');
                } else {
                    $i.removeClass('sticky');
                }
                save();
            })
            addTooltip($sticky, 'Make the item sticky to keep it on the list.');
        }

        $recent_link.find('> a')
            .off('click', openRecentFileMenu)
            .on('click', openRecentFileMenu);

        ('hide.bs.dropdown')

        $menu.find('li > a').on('click', onclick);
        $canvas_ul.find('li > a.menu-file-recent-item').on('click', onclick);

        var li = $('<li><a href="#" class="menu-file-clear-recent" style="opacity: 0.75;font-size: 12px;margin-top: 5px;display: block;">Clear the list</a></li>');
        $canvas_ul.append(li);
        li.find('a').on('click', function(e) {
            e.preventDefault();
            _this.removeAll();
        })

        if(_this.list.length) {
            $canvas.show();
        } else {
            $canvas.hide();
        }

        $('.menu-file-parent').on('hide.bs.dropdown', function () {
            $('.submenu-file-recent').css('display', 'none');
        });
    }


    if(localStorage.pgRecentFiles) {
        this.list = JSON.parse(localStorage.pgRecentFiles);

        //update from old format
        var r = [];
        for(var i = 0; i < this.list.length; i++) {
            if(typeof this.list[i] == 'string') {
                r.push( {file: this.list[i], project: false});
            } else {
                r.push(this.list[i]);
            }
        }
        this.list = r;
        //end update
    }

    update();
}
