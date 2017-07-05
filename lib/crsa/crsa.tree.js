/**
 * Created by Matjaz on 12/24/13.
 */

var CrsaTree = function($dest) {

    this.$dest = $dest;
    this.$iframe = null;

    this.onSortStart = null;
    this.onSortStop = null;
    this.onSortReceive = null;
    this.currentCrsaPage = null;

    this.ready = false;

    var _this = this;

    var treeFilter = '';
    var incremental = false;
    var $filter = null;
    var max_tree_level;
    var $top_ul = null;
    var $tree_container;
    var selectedElement;
    var $leftHider;

    var openSize = 300;

    var $allTreeNodes = null;

    var fast_def = {
        name: 'dummy',
        display_name: 'tag'
    }


    var filterNode = function($li, re, selected_ids, force_sel) {

        //var p = new CrsaProfile();
        //incremental = false;

        var child_has = false;
        var found = false;
        var $ul = $li.find('>ul');

        var has_found_kids = false;

        $ul.find('>li').each(function(i, li) {
            var $li = $(li);
            if(!incremental || $li.hasClass('child-found') || $li.hasClass('found')) {
                var f = filterNode($li, re, selected_ids, force_sel);
                found = found || f;
                if(f) has_found_kids = true;
            }
        });

        child_has = found;
        var treeid = $li.get(0).getAttribute('data-pg-tree-id');
        if(/*(!force_sel && $li.find('>div').text().match(re)) ||*/ (treeid && (treeid in selected_ids))) {
            $li.removeClass('not-found').addClass('found');
            found = true;
        } else {
            $li.removeClass('found').addClass('not-found');

            if(child_has) {
                $li.addClass('child-found').removeClass('no-child-found');
            } else {
                $li.removeClass('child-found').addClass('no-child-found');
            }
        }

        if(!has_found_kids) {
            $li.addClass('has-no-child-found');
        } else {
            $li.removeClass('has-no-child-found');
        }
        //console.log(found, $li);
        //p.show('serach');
        return found;

    }

    var previous_selector_was_invalid = false;

    var updateFilter = function() {
        var filter = $filter.val();
        var re = filter.length > 0 ? new RegExp(escapeRegExp(filter), 'i') : null;
        incremental = (treeFilter.length > 0 && filter.indexOf(treeFilter) == 0 && filter != treeFilter && !previous_selector_was_invalid);

        incremental = false;

        var force_sel = false;
        var new_filter = filter;
        if(filter.startsWith('$')) {
            filter = filter.substr(1);
            force_sel = true;
        }

        //try searching for selector
        var selected_ids = {};
        var custom_ids = {};

        ////
        var obj = {
            selected_ids : custom_ids,
            changed: false
        }

        _this.currentCrsaPage.callFrameworkHandler('on_custom_tree_filter', obj);


        var custom_filter = obj.changed;

        //find selector
        if(filter) {
            try {
                _this.currentCrsaPage.get$Html().find(filter).each(function (i, e) {
                    var treeid = e.getAttribute('data-pg-tree-id');
                    if (treeid) {
                        selected_ids[treeid] = true;
                    }
                })
                previous_selector_was_invalid = false;
            } catch (err) {
                previous_selector_was_invalid = true;
            }
        }

        if(!force_sel && re) {
            //find texts
            $top_ul.find('li').each(function(i, li) {
                if($(li).find('>div').text().match(re)) {
                    var treeid = li.getAttribute('data-pg-tree-id');
                    if(treeid) {
                        selected_ids[treeid] = true;
                    }
                }
            })
        }

        if(custom_filter) {
            if(filter) {
                var matched_ids = {};
                $.each(custom_ids, function(key, val) {
                    if(key in selected_ids) {
                        matched_ids[key] = true;
                    }
                })
                selected_ids = matched_ids;
            } else {
                selected_ids = custom_ids;
            }
        }


        if(!incremental && (treeFilter.length > 0 || custom_filter)) {
            $top_ul.find('li').removeClass('not-found found child-found has-no-child-found');
        }
        if(re || custom_filter) {
            $top_ul.find('>li').each(function(i, li) {
                filterNode($(li), re, selected_ids, force_sel);
            });
        }
        treeFilter = new_filter;

        /////


    }

    this.getElementOfTreeNode = function($li) {
        return getElementOfTreeNode($li);
    }

    var getElementOfTreeNode = function($li, $html) {
        var $el;
        var liid = $li.attr('data-pg-tree-id');
        if(liid) {
            if(!$html) $html = _this.currentCrsaPage.get$Html();
            if($html.is('[data-pg-tree-id="' + liid + '"]')) return $html;
            $el = $html.find('[data-pg-tree-id="' + liid + '"]');
            if($el.length == 0) return $li.data('crsa-element');
        } else {
            return null;
        }
        return $el.length ? $el : null;
    }

    var getElementOfTreeNodeFast = function(li, html) {
        var el;
        var liid = li.getAttribute('data-pg-tree-id');
        if(liid && html) {
            if(html.getAttribute('data-pg-tree-id') == liid) return html;
            el = html.querySelector('[data-pg-tree-id="' + liid + '"]');
        }
        return el;
    }

    var highlight_on_mouseover = true;

    var wireTreeElements = function($te) {
        if($te.data('has-events')) {
            console.log('has events');
            return;
        }

        $te
            .on('contextmenu', function(event){
                event.preventDefault();
                var $li = $(event.delegateTarget).closest('li');
                var $el = getElementOfTreeNode($li);

                pinegrow.showContextMenuForElement($el, event, $li.find('> div'), $('.tree-container'));
                /*
                var pgel = getElementPgNode($el);
                var def_actions = $.fn.crsa('getActionsMenuFor', $el);

                var selectedPage = pinegrow.getSelectedPage();
                selectedPage.callFrameworkHandler('on_build_actions_menu', def_actions, pgel, $el);

                var contextMenu = new CrsaContextMenu();
                contextMenu.actions = def_actions;
                contextMenu.$target = $el;
                contextMenu.$clicked = $li.find('> div');

                contextMenu.showAt(event.pageX, event.pageY, $('.tree-container'));
                contextMenu.updatePosition();
                return false;
                */
            })
            .on('mouseover', function(event) {
                var $t = $(event.delegateTarget);
                var $li = $t.closest('ul');
                if(highlight_on_mouseover) {
                    $dest.find('ul.hl').removeClass('hl');
                    $li.addClass('hl');
                }
                var $el = getElementOfTreeNode($t);
                $.fn.crsa('highlightElement', $el);
                event.stopImmediatePropagation();
            })
            .on('mouseout', function(event) {
                var $t = $(event.delegateTarget);
                var $li = $t.closest('ul');
                if(highlight_on_mouseover) $li.removeClass('hl');
                var $el = getElementOfTreeNode($t);
                $.fn.crsa('highlightElement', null);
                event.stopImmediatePropagation();
            })
            .on('click', function(event) {
                var $li = $(event.delegateTarget).closest('li');
                var $div = $li.find('> div');
                var $el = getElementOfTreeNode($li);

                $('#crsa-dummy-field').focus();

                if($el) {
                    $.fn.crsa('selectElement', $el, 'tree');
                    $.fn.crsa('scrollCanvasToElement', $el);
                }

                event.stopImmediatePropagation();
                event.preventDefault();

                $('body').trigger('click');
                // return false;
            });
        $te.find('> div > i.crsa-collapse').on('click', function(event) {
            var $i = $(event.delegateTarget);
            var $li = $i.closest('li');
            var $ul = $li.find('> ul');
            var $el = getElementOfTreeNode($li);

            var is_collapsed = $.fn.crsa('isCollapsed', $el);
            if(event.altKey) {
                $.fn.crsa('collapseChildren', $el.parent(), !is_collapsed);
            } else {
                $.fn.crsa('collapseElement', $el, !is_collapsed);
            }

            //$.fn.crsa('collapseElement', $el, null);
            event.preventDefault();
            event.stopPropagation();


        });
        $te.find('> div > i.crsa-visible').on('click', function(event) {
            var $i = $(event.delegateTarget);
            var $li = $i.closest('li');
            var $ul = $li.find('> ul');
            var $el = getElementOfTreeNode($li);

            var hide = false;
            if($li.hasClass('crsa-tree-node-hidden')) {
                $li.removeClass('crsa-tree-node-hidden');
                $i.addClass('fa-eye').removeClass('fa-eye-slash');
                $el.data('crsa-tree-hidden', null);
            } else {
                $li.addClass('crsa-tree-node-hidden');
                $i.addClass('fa-eye-slash').removeClass('fa-eye');
                $el.data('crsa-tree-hidden', true);
                hide = true;
            }
            //var original_style = $el.get(0).crsaOriginalStyle;
            //if(original_opacity === null) original_opacity = 1.0;
            var pgel = getElementPgNode($el);
            if(hide) {
                $el.attr('data-pg-hidden', '');
                if(pgel) pgel.setAttr('data-pg-hidden', null);
            } else {
                $el.removeAttr('data-pg-hidden');
                if(pgel) pgel.removeAttr('data-pg-hidden');
            }
            var selectedPage = pinegrow.getSelectedPage();
            selectedPage.setPageChanged(true);
            event.preventDefault();

            $li.redraw();
        });
        $te.data('has-events', true);
    }

    var wireTree = function($tree_top_ul) {

        $tree_top_ul.nestedSortable({
            forcePlaceholderSize: true,
            helper:	'clone',
            placeholder: 'tree-placeholder',
            handle: 'div',
            tabSize: 20,
            tolerance: 'pointer',
            //protectRoot: true,
            isTree : true,
            items: 'li.sort',
            //items: 'li',
            listType: 'ul',
            toleranceElement: '> div'
        }).on('sortreceive', function(event, ui) {
                console.log('received ' + ui.item.text());
                var $branch = ui.item.parent().closest('li');
                var $el = getElementOfTreeNode(ui.item);
                var $dest = getElementOfTreeNode($branch);
                var pos = $branch.find('> ul > li').index(ui.item);

                if($el && $dest && _this.onSortReceive) _this.onSortReceive($el, $dest, pos, ui);

            }).on('sortupdate', function(event, ui) {
            }).on('sortstop', function(event, ui) {
                highlight_on_mouseover = true;
                var $branch = ui.item.parent().closest('li');
                var $el = getElementOfTreeNode(ui.item);
                var $dest = getElementOfTreeNode($branch);
                var pos = $branch.find('> ul > li').index(ui.item);

                if($el && $dest && _this.onSortStop) _this.onSortStop($el, $dest, pos, ui);

            }).on('sortstart', function(event, ui) {
                highlight_on_mouseover = false;
                var $el = getElementOfTreeNode(ui.item);
                if($el && _this.onSortStart) _this.onSortStart($el);
            });
    }

    var hider_icon_shown = 'fa-minus';
    var hider_icon_hiden = 'fa-plus';

    this.hideTree = function() {
        var $divs = $dest.find('> div.tree-container');
        openSize = _this.$dest.width();
        _this.$dest.addClass('closed');
        _this.$dest.animate({width: 30}, 150, function() {
            $leftHider.removeClass(hider_icon_shown).addClass(hider_icon_hiden);
            $divs.hide();
            $dest.css('overflow', 'hidden');
            $(window).trigger('resize');
        });
    }

    this.showTree = function(skip_resize) {
        var $divs = $dest.find('> div.tree-container');
        if(openSize < 300) openSize = 300;
        _this.$dest.removeClass('closed');
        $divs.show();
        if(!skip_resize) {
            _this.$dest.animate({width: openSize}, 150, function() {
                $leftHider.addClass(hider_icon_shown).removeClass(hider_icon_hiden);
                $dest.css('overflow', 'auto');
                $(window).trigger('resize');

                if(_this.currentCrsaPage && _this.currentCrsaPage.treeRepaintOnShow) {
                    _this.showTreeForIframe(_this.currentCrsaPage.$iframe);
                }
            });
        } else {
            $leftHider.addClass(hider_icon_shown).removeClass(hider_icon_hiden);
            $dest.css('overflow', 'auto');
            if(_this.currentCrsaPage && _this.currentCrsaPage.treeRepaintOnShow) {
                _this.showTreeForIframe(_this.currentCrsaPage.$iframe);
            }
        }
    }



    this.initUI = function() {
        this.$dest.html('');
        max_tree_level = 0;

        var $th = $('<div/>', {class: 'header'}).html('<i class="hider fa ' + hider_icon_shown + '"></i>').appendTo($dest);

        $filter = $('<input/>', {placeholder: 'find text or selector', class: 'form-control filter-form'}).appendTo($th).on('input', updateFilter);

        $filter.on('focus', function() {
            $filter.attr('placeholder', 'find text or selector ($... to force sel)');
        });

        $filter.on('blur', function() {
            $filter.attr('placeholder', 'find text or selector');
        });

        $filter.tooltip({container: 'body', placement: 'left', title: 'Tree Drag & Drop is disabled when filter is set.', trigger: 'manual'});
        crsaAddCancelSearch($filter, 'top: 11px;right:18px;');

        $leftHider = $th.find('i.hider').on('click', function(e) {
         var w = _this.$dest.width();

            if(!_this.$dest.hasClass('closed')) {
                _this.hideTree();
            } else {
                _this.showTree();
            }
            e.preventDefault();
        });
        addTooltip($leftHider, 'Hide / show the panel');

        $tree_container = $('<div/>', {class: 'tree-container'}).appendTo(this.$dest);

        var populate_timer = null;
        var refresh_timer = null;

        var populateTreeInBckBatch = function(start) {
            if(typeof start == 'undefined') start = 0;
            var start_ms = (new Date()).getTime();

            if(!$allTreeNodes && $top_ul) {
                //$allTreeNodes = $top_ul.find('li');
                $allTreeNodes = $top_ul.find('li');
            }

            var changes = 0;

            if(!_this.currentCrsaPage) return;

            var html = _this.currentCrsaPage.get$Html().get(0);

            var $lis = $allTreeNodes;

            for(var i = start; i < $lis.length; i++) {
                var li = $lis.get(i);

                start++;

                if(!li.getAttribute('data-li-populated')) {
                    populateLine(li, html);
                    li.setAttribute('data-li-populated', 'true');
                    changes++;

                    //break;

                    if(i % 10 == 0) {
                        var ms = (new Date()).getTime();
                        if(ms - start_ms > 50) break;
                    }
                }
            }
            return start < $lis.length ? start : -1;
        }

        var populateTreeInBck = function(start) {

            if(typeof start == 'undefined') start = 0;

            if(populate_timer) {
                clearTimeout(populate_timer);
                //window.cancelAnimationFrame(populate_timer);
            }
            populate_timer = setTimeout(function() {
            //populate_timer = window.requestAnimationFrame(function() {

                populate_timer = null;

                start = populateTreeInBckBatch(start);
                if(start >= 0) {
                    populateTreeInBck(start);
                } else {
                    //done
                    updateFilter();
                }
            }, 75);
        }

        var populateVisibleTreeNodes = function() {
            if(!$allTreeNodes && $top_ul) {
                $allTreeNodes = $top_ul.find('li');
            }

            var changes = 0;

            var top = $tree_container.scrollTop();
            var bottom = top + $tree_container.height();
            var itemHeight = 19;
            var topItem = Math.floor(top / itemHeight);
            var bottomItem = Math.ceil(bottom / itemHeight);

            if(!_this.currentCrsaPage) return;

            var html = _this.currentCrsaPage.get$Html().get(0);

            if(!html) return changes;

            var $lis = $allTreeNodes;

            if(topItem < $lis.length - 1) {
                if(bottomItem >= $lis.length) {
                    bottomItem = $lis.length - 1;
                }
                for(var i = topItem; i <= bottomItem; i++) {
                    var li = $lis.get(i);

                    if(!li.getAttribute('data-li-populated')) {
                        populateLine(li, html);
                        li.setAttribute('data-li-populated', 'true');
                        changes++;
                        //li.style.cssText = 'display:block;' + li.style.cssText;
                        //$(li).hide().show(0);
                    }
                    // $(li).hide().show(0);
                }
            }
            return changes;
        }

        $tree_container.on('treeUpdated', function(event) {
            populateVisibleTreeNodes();
            populateTreeInBck();
        });

        $tree_container.on('scroll', function(event) {

            if(populateVisibleTreeNodes() > 0) {
                if(refresh_timer) {
                    clearTimeout(refresh_timer);
                }
                refresh_timer = setTimeout(function() {
                    $top_ul.hide().show(0);
                    refresh_timer = null;
                }, 100);
            }
        });

        var $resizer = $('<div/>', {class: 'tree-resizer'}).appendTo(this.$dest)
            .on('mousedown', function(e) {
                e.preventDefault();
                $.fn.crsapages('showOverlays');
                $('body')
                    .on('mousemove.tree', function(m) {
                        var w;
                        if(_this.$dest.hasClass('left-side')) {
                            w = m.pageX - _this.$dest.offset().left;
                            //_this.$dest.css('width', w + 'px');
                        } else {
                            w = (_this.$dest.offset().left + _this.$dest.width()) - m.pageX;// $(window).width() - (m.pageX < 500 ? 500 : m.pageX) - 12;
                        }
                        if(w <= 30) {
                            w = 30;
                            if(!_this.$dest.hasClass('closed')) {
                                _this.hideTree();
                            }
                        } else {
                            if(_this.$dest.hasClass('closed')) {
                                _this.showTree(true);
                            }
                        }
                        _this.$dest.css('width', w + 'px');
                    })
                    .on('mouseup.tree', function(e) {
                        e.preventDefault();
                        $('body').off('.tree');
                        $.fn.crsapages('showOverlays', true);
                        $(window).trigger('resize');
                        //$.fn.crsapages('canvasResized');
                    });
            });


        return false;
    }

    var isHidden = function() {
        return _this.$dest.hasClass('closed')
    }

    var createTreeLineForElement = function($e) {
        //var $li = $('<li/>');

        var li = document.createElement('li');
        var $li = $(li);

        //return $li.html('<div></div>');

        var def = getType($e, false, false, _this.currentCrsaPage);

        if(!$e.is('body')) {
            //$li.addClass('sort');
            li.className = 'sort';
        } else {
            //$li.addClass('no-sort');
            li.className = 'no-sort';
        }

        var name;

        if(def) {
            name = getElementName($e, def, true, false, true);
        } else {
            name = getElementName($e, fast_def, true, false, false);
        }

        var eye = 'fa-eye';

        if($e.get(0).crsaOriginalStyle) {
            //$li.addClass('crsa-tree-node-hidden');
            li.className += ' crsa-tree-node-hidden'
            eye = 'fa-eye-slash';
        }

        var tags = def && def.tags ? ' tag-' + def.tags : '';

        //var msg =  '<div class="crsa-tree-node-name' + tags + '"><i class="crsa-collapse fa fa-fw fa-angle-down"></i><i class="crsa-visible fa fa-fw ' + eye + '"></i>' + name + '</div>';


        var msg = document.createElement('div');
        msg.className = 'crsa-tree-node-name' + tags;

        var i = document.createElement('i');
        i.className = 'crsa-collapse fa fa-fw fa-angle-down';
        msg.appendChild(i);

        i = document.createElement('i');
        i.className = 'crsa-visible fa fa-fw ' + eye;
        msg.appendChild(i);

        var text = document.createTextNode(name);
        msg.appendChild(text);

        li.appendChild(msg);


        //$li.html(msg).data('crsa-element', $e);

        $e.data('crsa-tree-node', $li);

        var pgid = $e.get(0).getAttribute('data-pg-id');
        if(!pgid) {
            //$li.addClass('dyn');
            li.className += ' dyn';
            //$li.removeClass('sort');
        } else {
            li.setAttribute('data-pg-id', pgid);
        }

        if(def && def.paint_tree_node) def.paint_tree_node($li, $e);

        return $li;
    }

    var li_id_count = 0;

    this.getTreeNodeId = function() {
        return ++li_id_count;
    }

    this.assignTreeNodeToElement = function($treeNode, $el, data) {
        var liid = this.getTreeNodeId();
        $el.attr('data-pg-tree-id', liid);
        $treeNode.attr('data-pg-tree-id', liid);
        if(data) $treeNode.data('crsa-element', $el);
    }

    this.populateLineForElement = function($el) {
        var $li = getTreeNodeForElement($el);
        var $html = $el.closest('html');
        if($li && $html.length) {
            populateLine($li.get(0), $html.get(0));
        }
    }

    var populateLine = function(li, html) {
        var el = getElementOfTreeNodeFast(li, html);
        if(el) {
            var $el = $(el);
            var div = li.childNodes[0];
            var nameNode = div.childNodes[2];

            if(!nameNode) return;
/*
            if(el.tagName == 'PHP') {
                debugger;
            }*/
            var def;
            def = getType($el, false, false, _this.currentCrsaPage);
            if(def) {

                var action_tag = _this.currentCrsaPage.getActionTag($el);
                var name = getElementName($el, def, true, true /* cls */, true, false, action_tag, _this.currentCrsaPage);

                nameNode.innerHTML = name;
                //div.innerHTML = "<b>" + name + "</b>";

                if(def.tags) {
                    div.className += ' tag-' + def.tags;
                }

                //li.style.display = 'none';
                //li.style.display = 'list-item';
                //$(li).hide().show(0);
            }
        }
    }

    var createTreeLineForElementAsString = function(e, only_kids, level) {
        if(!level) level = 0;
        var def = null;//getType($e, false, true, _this.currentCrsaPage);

        if(max_tree_level < level) max_tree_level = level;

        var ch = '';
        var ch = '';

        var children = e.childNodes;
        if(children.length > 0) {
            for(var i = 0; i < children.length; i++) {
                var node = children.item(i);
                if(node.nodeType == 1 /* && node.tagName != 'BR' */) {
                    ch += createTreeLineForElementAsString(node, false, level + 1);
                }
            }
        }
        if(only_kids) return ch;


        /*
        if(e.hasAttribute('data-pg-no-tree')) {
            if(e.getAttribute('data-pg-no-tree') == 'all') return '';
            return ch;
        }
*/
        var cls = 'sort';

        if((e.tagName == 'BODY' && $(e).children().length > 0) || e.tagName == 'HEAD' || e.tagName == 'HTML') {
            cls = 'no-sort';
        }

        var tags = '';//def && def.tags ? ' tag-' + def.tags : '';

        var eye = 'fa-eye';
        var i_class = '';
        var name = e.tagName;

        /*
        if(def) {
            name = getElementName($e, def, true, false, true);
        } else {
            name = getElementName($e, fast_def, true, false, false);
        }
        */

        if(name == 'STYLE') {
            if(e.id == 'crsa-inline-styles') return '';
        }

        if(isElementHidden(e)) {
            cls += ' crsa-tree-node-hidden'
            eye = 'fa-eye-slash';
        }


        //$e.data('crsa-tree-node', $li);

        var lid = ++li_id_count;
        //e.dataset.pgTreeNodeId = lid;
        e.setAttribute('data-pg-tree-id', lid);

        var attr = 'data-pg-tree-id="' + lid + '"';

        var pgid = e.getAttribute('data-pg-id');
        if(!pgid) {
            cls += ' dyn';
        } else {
            attr += ' data-pg-id="' + pgid + '" ';
        }

        var ul_class = '';
        if(isCollapsed(e)) {
            i_class = 'fa-angle-right';
            cls += ' collapsed';
            ul_class = ' crsa-tree-node-closed';
        } else {
            i_class = 'fa-angle-down';
        }
        if(ch.length) {
            ch = '<ul class="crsa-tree-branch' + ul_class + '">' + ch + '</ul>';
            cls += ' has-children';
        }

        if(name == 'HTML') {
            name = _this.currentCrsaPage.name;
            tags += ' tag-block';
            i_class = 'fa-file-o';
            eye += ' hide';
            attr += ' aadata-li-populated="true"';
            cls += ' doc-root';
        }

        var li =  '<li ' + attr + 'class="' + cls + '"><div class="crsa-tree-node-name' + tags + '"><i title="ALT + Click to collapse / uncollapse the whole level." class="crsa-collapse fa fa-fw ' + i_class + '"></i><i class="crsa-visible fa fa-fw ' + eye + '"></i><name>' + name + '</name></div>' + ch + '</li>';

        //if(def && def.paint_tree_node) def.paint_tree_node($li, $e);

        return li;
    }

    var createLevelsWaitingList = [];


    var createCrsaTreeLevel = function($dest, $e, level, only_kids) {

        var $li = null;
        var $ul = null;

        if(!only_kids) {
            try {
                if(max_tree_level < level) max_tree_level = level;
                $li = createTreeLineForElement($e);
                //console.log($li.html());
                $dest.append($li);
                $li.data('menu-level', level);

            } catch(err) {
                console.log(err);
            }
        } else {
            $ul = $dest;
        }

        var children = $e.get(0).childNodes;//('> .crsa-element');
        if(children.length > 0) {
            for(var i = 0; i < children.length; i++) {
                var node = children.item(i);
                if(node.nodeType == 1) {
                    var $node = $(node);
                    var def = getType($node, false, false, _this.currentCrsaPage);
                    if(def) {
                        if(!$ul) {
                            var ul = document.createElement('ul');
                            $ul = $(ul);
                            $li.append($ul);
                            $li.get(0).className = 'has-children crsa-tree-branch';
                            //$li.addClass('has-children');
                            //$ul.addClass('crsa-tree-branch');
                        }
                        createLevelsWaitingList.push({ul: $ul, node: $node, level: level+1, only_kids: false});
                    }
                    //createCrsaTreeLevel($ul, $(node), level + 1);
                }
            }
        }

        if(isCollapsed($e.get(0))) {
            if($ul) $ul.addClass('crsa-tree-node-closed');
            $li.find('i.crsa-collapse').addClass('fa-angle-right').removeClass('fa-angle-down');
            $li.addClass('collapsed');
        }
        if(isElementHidden($e.get(0))) {
            $li.addClass('crsa-tree-node-hidden');
            $li.find('i.crsa-visible').addClass('fa-eye-slash').removeClass('fa-eye');
        }
        return $li;
    }

    var isCollapsed = function(e) {
        if(e.tagName == 'HEAD') return !_this.currentCrsaPage.show_head_in_tree;
        return e.getAttribute('data-pg-collapsed') == '';
    }

    var isElementHidden = function(e) {
        return e.getAttribute('data-pg-hidden') == '';
    }

    var batchTimer = null;

    var activateTreeForCrsaPage = function(cp) {
        var wire = false;
        if(!cp.treeTop) {
            cp.treeTop = $('<ul/>').addClass('crsa-tree-branch');
            cp.treeRepaintOnShow = true;
            wire = true;
        }
        if(_this.currentCrsaPage != cp) {
            if($top_ul) {
                $top_ul.detach();
            }

            $top_ul = cp.treeTop;
            $tree_container.append($top_ul);
            if(wire) {
                wireTree(cp.treeTop);
            }
            _this.currentCrsaPage = cp;
            $tree_container.trigger('treeUpdated');
        }
    }

    this.showTreeForIframe = function($iframe, skip_repaint) {
        if(!$iframe) {
            if($top_ul) {
                $top_ul.detach();
            }
            this.currentCrsaPage = null;
        } else {
            var cp = getCrsaPageForIframe($iframe);
            activateTreeForCrsaPage(cp);
            if(cp.treeRepaintOnShow && !skip_repaint) {
                this.paintTree(cp.$iframe, cp.treeRepaintOnShow === true ? getTreeRootForElement(null, cp.$iframe) : cp.treeRepaintOnShow);
                cp.treeRepaintOnShow = null;
            }
        }
        $allTreeNodes = null;
    }

    this.closeTreeForPage = function(cp) {
        if(cp == this.currentCrsaPage) {
            cp.treeTop.remove();//detach();
            if(batchTimer) {
                window.cancelAnimationFrame(batchTimer);
                batchTimer = null;
            }
            this.currentCrsaPage = null;
            this.$iframe = null;
            $top_ul = null;
        }
        cp.treeTop = null;
        cp.treeCurrentRoot = null;
        cp.treeRepaintOnShow = null;

        $allTreeNodes = null;
    }

    this.updateTreeAfterPainting = function() {
        var w = max_tree_level*20+150;
        if(w < 300) w = 300;
        $top_ul.css('min-width', w + 'px');
        showSelectedElement();
        $filter.val(treeFilter);
        updateFilter();

        $tree_container.trigger('treeUpdated');
    }

    this.paintTree = function($iframe, $element, done, skip_update_after_painting) {

        var treeRoot = ($iframe && $element) ? getTreeRootForElement($element, $iframe) : null;

        var cp;
        if($iframe) {
            cp = getCrsaPageForIframe($iframe);
            if(cp != this.currentCrsaPage || isHidden()) {
                cp.treeRepaintOnShow = cp.treeRepaintOnShow == null ? $element : treeRoot;
                return;
            }
        }

        if(!$iframe || !$element || !treeRoot) {
            //this.currentCrsaPage = null;
            $top_ul.html('');
            this.$iframe = null;
            return;
        }

        cp.treeCurrentRoot = treeRoot;

        //$top_ul.hide();

        //$element = null;
        this.$iframe = $iframe;
        if(!$ul) $ul = $top_ul;
        var $ul = $top_ul;
        var $b;
        var only_kids = false;

        var current_max_tree_level = max_tree_level;

        max_tree_level = 0;

        var test = false;

        var $elements = $element ? $element : treeRoot;

        var profile = new CrsaProfile(true);

        //console.log('TREE repainting');

        $elements.each(function(i, el) {

            var start_level = 0;

            $b = $(el);
            var $li = getTreeNodeForElement($b, $top_ul);
            if(!$li || $b.get(0) == treeRoot.get(0) || batchTimer || $top_ul.get(0).childNodes.length == 0) {
                $b = treeRoot;
                $ul = $top_ul;
            } else {
                $ul = $li.closest('ul.crsa-tree-branch');
                if($ul.length > 0) {
                    only_kids = true;
                    $b = $b.parent();
                    start_level = $li.data('menu-level');
                    max_tree_level = current_max_tree_level;
                    //test = true;
                } else {
                    $ul = $top_ul;
                    $b = treeRoot;
                }
            }
            if($b.length == 0) {
                $b = treeRoot;
                $ul = $top_ul;
                only_kids = false;
            }

            var html = createTreeLineForElementAsString($b.get(0), only_kids);
            profile.show('simple tree 1');

            $ul.get(0).innerHTML = html;
            profile.show('simple tree 2');

            var $lis = $ul.find('li');
            wireTreeElements($lis);

            $allTreeNodes = null;

            profile.show('simple tree 3');
        });

        if(!skip_update_after_painting) {
            this.updateTreeAfterPainting();
        }
        if(done) done();


    }

    var showSelectedElement = function() {
        if(!selectedElement) return;
        var $li = getTreeNodeForElement(selectedElement, $top_ul);
        if($li) {
            $li.addClass('crsa-tree-node-selected');

            var lip = $li.position();
            var $tree = $('#crsa-tree > div.tree-container');

            var tree_h = $tree.height();
            var li_h = 20;//$li.height();
            var tree_st = $tree.scrollTop();

            if(lip.top >= 0 && lip.top < tree_h - li_h) {

            } else {
                var y = lip.top + tree_st - 100;
                if(y < 0) y = 0;
                $tree.animate({scrollTop: y}, 150);
            }
        }
    }

    this.setSelectedElement = function($e, skip_show) {
        $top_ul.find('li.crsa-tree-node-selected').removeClass('crsa-tree-node-selected');
        if(selectedElement) {
            var $li = getTreeNodeForElement(selectedElement, $top_ul);
            if($li) {
                $li.removeClass('crsa-tree-node-selected');
            }
        }
        selectedElement = $e;
        if(!skip_show && !isHidden()) {
            showSelectedElement();
        }
    }

    this.initUI();
    this.ready = true;
}

var CrsaContextMenu = function() {

    var _this = this;

    this.actions = [];
    this.$target;
    this.$clicked;

    this.add = function(label, kbd, func, type) {
        if(!type) type = 'link';
        this.actions.push({label: label, kbd: kbd, action: func, type: type});
    }

    var $menu_ul;
    var $backdrop;
    var $scroll_parent;
    var start_scroll_top;
    var start_y;
    var scroll_offset;
    var menu_h;
    var menu_w;

    this.close = function() {
        if (_this.$clicked) _this.$clicked.removeClass('has-menu');

        if($menu_ul) $menu_ul.remove();
        $menu_ul = null;
        $(document).off('.crsamenu');
        if($scroll_parent) {
            $scroll_parent.off('.crsamenu');
        }
        if($backdrop) {
            $backdrop.remove();
            $backdrop = null;
        }
    }

    this.showAt = function(x, y, $scroll) {
        if(this.actions.length == 0) return;

        if (_this.$clicked) _this.$clicked.addClass('has-menu');

        $(document).trigger('click');

        $menu_ul = $('<ul class="dropdown-menu context-menu" role="menu"></ul>');
        $.fn.crsa('buildActionsDropDownMenu', this.actions, this.$target, $menu_ul, this.close);

        $('body').append($menu_ul);

        $menu_ul.css('top', y + 'px').css('left', x + 'px');

        var start_y = y;
        var start_x = x;

        if ('ontouchstart' in document.documentElement) {
            $backdrop = $('<div class="dropdown-backdrop"/>').insertBefore($menu_ul).on('click', this.close);
        }

        $(document)
            .off('.crsamenu')
            .on('click.crsamenu', this.close);

        if($scroll) {
            $scroll
                .off('.crsamenu')
                .on('scroll.crsamenu', function(event) {
                    var ny = (start_y + (start_scroll_top - $scroll.scrollTop()));
                    $menu_ul.css('top', ny + 'px');
                    var cy = 0;
                    if(ny < scroll_offset) {
                        cy = scroll_offset - ny - 2;
                        if(cy < 0) cy = 0;
                    }
                    $menu_ul.css('clip', 'rect(' + cy + 'px, ' + menu_w + 'px, ' + menu_h + 'px, 0px)');
                });
            start_scroll_top = $scroll.scrollTop();
            scroll_offset = $scroll.offset().top;
        }
        $scroll_parent = $scroll;

        $menu_ul.data('menu', this);
        $menu_ul.show();

        menu_h = $menu_ul.outerHeight();
        menu_w = $menu_ul.outerWidth();

        if($scroll) {
            if(start_y + menu_h > $(window).height()) {
                start_y = start_y - menu_h;
                if(start_y < 0) {
                    start_y = 0;
                }
                $menu_ul.css('top', start_y + 'px')
            }
            if(start_x + menu_w > $(window).width()) {
                start_x = start_x - menu_w;
                $menu_ul.css('left', start_x + 'px')
            }
        }

        return $menu_ul;
    }

    this.updatePosition = function (insidePage) {
        var $parent, topOffset = 0, leftOffset = 0;
        if (insidePage) {
            $parent = $menu_ul.parent();
            topOffset = $parent.offset().top;
            leftOffset = $parent.offset().left;
        }
        else {
            $parent = $(window);
        }

        if ($menu_ul.height() + $menu_ul.offset().top > $parent.height() + topOffset) {
            var offset = ($menu_ul.offset().top + $menu_ul.height()) - (topOffset + $parent.height());
            var newTop = parseInt($menu_ul.css('top'), 10) - offset;
            if (newTop < 10) {
                var $page = $menu_ul.closest('.page');
                var height = $(window).height() - 10;
                if ($page.length > 0) {
                    height = $page.height();
                    insidePage = false;
                }

                if (insidePage) height -= topOffset;
                $menu_ul.css({
                    'height': height,
                    'overflow-y': 'auto',
                    'top': '0'
                });
            }
            else {
                $menu_ul.css({
                    'top': newTop
                });
            }
        }
        if ($menu_ul.width() + $menu_ul.offset().left > $parent.width() + leftOffset) {
            var offset = ($menu_ul.offset().left + $menu_ul.width()) - (leftOffset + $parent.width());
            var newLeft = parseInt($menu_ul.css('left'), 10) - offset;
            $menu_ul.css('left', newLeft);
        }
    }
}