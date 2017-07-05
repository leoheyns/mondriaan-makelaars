jQuery.fn.redraw = function() {
    return this.hide(0, function() {
        $(this).show();
    });
};

var CrsaPanel = function($el, full_height) {
    this.$el = $el;

    this.shown = false;

    this.onHide = null;

    if(full_height === undefined) full_height = true;

    this.fullHeight = full_height;

    $el.data('panel', this);

    var _this = this;
    var $w = $(window);

    var $head = $el.find('> .panel-head');
    var $content = $el.find('> .panel-content');

    var content_top = $content.position().top;

    var $close = $('<a/>', {href: '#', class: 'panel-close'}).html('<i class="fa fa-times" />').appendTo(this.$el).on('click', function(e) {
        _this.hide();
        e.preventDefault();
    });

    $el.addClass('panel');

    this.autoSize = function(offset) {
        if(!this.fullHeight) return;
        if(!offset) offset = this.$el.offset();
        var h = this.$el.height();
        var bh = $w.height();
        var nh = bh - offset.top;
        this.$el.css('height', nh + 'px');
        $content.css('height', (nh - content_top) + 'px');
    }

    this.autoSize();


    $el.draggable({
        handle: '.panel-head',
        scroll: false
    })
        .on('dragstart', function(e, ui) {
            if(ui) {
                var bh = $w.height();
                $.fn.crsapages('showOverlays');
            }
        })
        .on('drag', function(e, ui) {
            if(ui) {
                _this.autoSize(ui.offset);
            }
        })
        .on('dragstop', function(e, ui) {
            if(ui) {
                $.fn.crsapages('showOverlays', true);
            }
        });

    this.show = function() {
        var $body = $(window);
        this.$el.show();
        this.autoSize();
        $el.draggable( "option", "containment", [-200, 0, $body.width() - 100, $body.height() - 100] );
        this.shown = true;
    }

    this.hide = function() {
        this.$el.hide();
        this.shown = false;
        if(this.onHide) this.onHide(this);
    }
}


//Modals
function makeDialog(title, cancel, ok, body) {
    if(typeof body == 'undefined') body = '';
    var bstr = typeof body == 'string' ? body : '';

    var html = '<div class="modal-content">\
                <div class="modal-header">\
                    <button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>\
                    <h4 class="modal-title">' + title + '</h4>\
                </div>\
                <div class="modal-body">' + bstr + '\
                </div>\
                <div class="modal-footer"><p class="pull-left"></p>';
    if(cancel) {
        html += '<button type="button" class="btn btn-default btn-sm cancel">' + cancel + '</button>';
    }
    if(ok) {
        html += '<button type="button" class="btn btn-primary btn-sm ok">' + ok + '</button>';
    }
    html += '</div>\
            </div>';

    var $d = $('<div/>', {class: "modal-dialog crsa-dialog-nonmodal"}).html(html);
    if(typeof body == 'object') {
        $d.find('.modal-body').append(body);
    }
    return $d;
}

function makeAndShowDialog(title, cancel, ok, body, onCancel, onOk, validate, show_in_center) {
    var $dialog = makeDialog(title, cancel, ok, body);
    $('body').append($dialog);
    var x = 100;//$body.width() - $dialog.width() - 100;
    var y = 100;//$body.height() - $dialog.height() - 100;
    if (show_in_center) {
        x = ($('body').width()/2) - ($('.modal-dialog').width() / 2 )
        y = 10;
    }
    $dialog.css('top', y + 'px').css('left', x + 'px');
    $dialog.draggable({handle: '.modal-header'})
        .on('dragstart', function(e, ui) {
            $.fn.crsapages('showOverlays');
        })
        .on('dragstop', function() {
            $.fn.crsapages('showOverlays', true);
        });

    $dialog.find('button.close,button.cancel').click(function() {
        if(onCancel) onCancel();
        $dialog.remove();
    });
    $dialog.find('button.ok').click(function() {
        if(!validate || validate()) {
            if(onOk) onOk();
            $dialog.remove();
        }
    });
    $dialog.on('hidden.bs.modal', function () {
        $dialog.remove();
    });
    return $dialog;
}

function setDialogNotice($d, text, cls) {
    var $p = $d.find('.modal-footer > p');
    $p.html(text).attr('class','pull-left ' + cls);
}

function makeModalDialog(title, cancel, ok, body, onCancel, onOk, onBeforeShow) {
    if(typeof body == 'function') body = body();
    var $d = makeDialog(title, cancel, ok, body);
    $d.removeClass('crsa-dialog-nonmodal');

    var userChosed = false;

    var $o = $('<div/>', {class: 'modal fade', tabIndex: "-1", role: "dialog"}).append($d);
    $o.find('button.close,button.cancel').click(function() {
        if(onCancel) onCancel();
        onCancel = null;
        $o.modal('hide');
    });
    $o.find('button.ok').click(function() {
        if(onOk) onOk();
        $o.modal('hide');
        userChosed = true;
    });
    $o.on('hidden.bs.modal', function () {
        if(!userChosed && onCancel) onCancel();
        $o.remove();
    })
    if(onBeforeShow) onBeforeShow($o);
    $o.modal({backdrop: true});
    return $o;
}

function makeModalDialogWhole(body) {
    if(typeof body == 'function') body = body();
    var $d = $(body);
    var $o = $('<div/>', {class: 'modal fade', tabIndex: "-1", role: "dialog"}).append($d);
    $o.modal({backdrop: 'static', keyboard: false});
    return $o;
}


function showAlert(body, title, cancel, ok, onCancel, onOk) {
    if(!title) title = "Notice";
    if(!ok && !cancel) ok = "OK";
    var $d = makeModalDialog(title, cancel, ok, body, onCancel, onOk);
    crsaHandleExternalLinks($d);
    return $d;
}

function crsaHandleExternalLinks($d, func) {
    if(isApp()) {
        $d.find('a.external').on('click', function(e) {
            e.preventDefault();

            var gui = require('nw.gui');
            var url = $(e.delegateTarget).attr('href');
            gui.Shell.openExternal(url);

            if(func) func(url);
        });
    }
}

function showNotice(message, title, key, done, only_once, force) {
    var key = 'notice_hide_' + key;
    if(!force) {
        if(key in localStorage && localStorage[key] == '1') {
            if(done) done(false);
            return;
        }
        if(only_once && key in localStorage) {
            if(done) done(false);
            return;
        }
    }
    var $chk = $('<label class="pull-left control-label"><input type="checkbox"> Don\'t show this notice again</label>');

    var onClose = function() {
        if(done) done(true);
        if($chk.find('input').is(':checked')) {
            localStorage[key] = '1';
        } else {
            localStorage[key] = '0';
        }
    }

    var $d = showAlert(message, title, null, null, onClose, onClose);
    if(!only_once) {
        $d.find('.modal-footer').prepend($chk);
    }
    return $d;
}

function showPrompt(notice, title, value, placeholder, onCancel, onOk) {
    var $b = $('<form role="form">\
        <div class="form-group">\
        <label for="dlgInput">' + notice + '</label>\
        <input type="text" class="form-control" id="dlgInput" placeholder="' + placeholder + '">\
        </div>\
        </form>');
    var $input = $b.find('input');
    var $form = $b;
    $form.on('submit', function(e) {
        e.preventDefault();
        if(onOk) onOk($input.val());
        $modal.modal('hide');
    });
    if(value) $input.val(value);
    var $modal = showAlert($b, title, "Cancel", "Ok", onCancel, function() {
        if(onOk) onOk($input.val());
    });
    $modal.on('shown.bs.modal', function() {
        $input.focus();
    })
    return $modal;
}

var CrsaCollapsibleSections = function ($list) {
    function slideToggle(el, callback){
      var $el = $(el), height = $el.data("originalHeight"), visible = $el.is(":visible");
      bShow = !visible;
      if( bShow == visible ) return false;
      if( !height ){
        height = $el.show().height();
        $el.data("originalHeight", height);
        if( !visible ) $el.hide().css({height: 0});
      }

      if( bShow ){
        $el.show().animate({height: height}, {duration: 250, complete:function (){
            $el.height('auto');
            if (callback) callback();
          }
        });
      } else {
        $el.animate({height: 0}, {duration: 250, complete:function (){
            $el.hide();
            if (callback) callback();
          }
        });
      }
    }

    this.show = function (getSectionDef, updateUsage) {
        $list.find('li.section > div').on('click', function(e) {
            var $section = $(e.delegateTarget).parent();
            var sec_def = getSectionDef($section);
            var $ul = $section.find('>ul');

            if($section.hasClass('section-closed')) {
                slideToggle($ul, function () {
                    $section.removeClass('section-closed');
                    if(sec_def) {
                        sec_def.closed = false;
                        var k = 'sec_open_' + sec_def.key;
                        localStorage[k] = '1'; //open
                    }
                })
            } else {
                slideToggle($ul, function () {
                    $section.addClass('section-closed');
                    if(sec_def) {
                        sec_def.closed = true;
                        var k = 'sec_open_' + sec_def.key;
                        localStorage[k] = '0'; //closed
                    }
                });
            }
            if (updateUsage) updateUsage($section);
        });

        if(pinegrow.getSelectedElement() && updateUsage) {
            updateUsage();
        }
    }
}

var CrsaActionsPanel = function(tabName) {

    var currnetTabName = tabName || "ACT";
    var currentFactoryLibSections = null;
    var selectedPgel = null;
    var selected$el = null;
    var selectedElement = null;
    var $container;

    this.showAssignedActions = true;
    var _this = this;

    var hasAction = function(pgel, def) {
        if(def.has_action) {
            return def.has_action(pgel);
        }
        return def.attribute && pgel.hasAttr(def.attribute);
    }

    this.show = function($lib) {
        $container = $lib;
        var filter = null;
        var $header = $lib.find('>.header');
        var $input = $('<input/>', {class: 'form-control filter-form', placeholder: 'search'}).appendTo($header);
        crsaAddCancelSearch($input, 'top: 16px;right: 47px;');

        var $tags = $('<div/>', {class: 'form-tags'});//.appendTo($header);

        /* var $cancel = $('<a/>', {class: 'btn btn-link', href: '#'}).html('&times;').appendTo($lib).on('click', function(e) {
         e.preventDefault();
         $input.val('').trigger('input');
         })*/
        var $manage = $('<a href="#" class="icon-action"><i class="fa fa-cog"></i></a>').appendTo($header);
        $manage
            .on('click', function(e) {
                var selectedCrsaPage = pinegrow.getSelectedPage();
                if(selectedCrsaPage || true) {
                    $.fn.crsacss('showFrameworkManager', selectedCrsaPage);
                    e.preventDefault();
                } else {
                    showAlert("Open a page first!");
                }
            })
            .tooltip({container: 'body', placement: 'bottom', title: 'Manage libraries and plugins for the selected page.', trigger: 'hover'});


        var $content = $lib.find('>.content');

        var $obj_desc = $('<ul/>', {class: 'props-desc-obj'}).appendTo($content);

        $('<ul class="selected-insert"><li class="section"><div><h2></h2></div><ul></ul><div class="insert-help">Right click for options.</div></li></ul>').appendTo($content).hide();

        var $list = $('<ul/>').appendTo($content);

        var $showhelp = $('<label class="css-opt-label actions-show-help-label"><input class="control-label" type="checkbox" value="1">&nbsp;<span>Show help texts</span></label>').appendTo($header);
        $showhelp.find('input').on('change', function(e) {
            var $ch = $(e.delegateTarget);
            if($ch.is(':checked')) {
                $list.addClass('show-help-text');
                pinegrow.setSetting('actions-show-help-text', '1');
            } else {
                $list.removeClass('show-help-text');
                pinegrow.setSetting('actions-show-help-text', '0');
            }
        });

        if(pinegrow.getSetting('actions-show-help-text', '1') == '1') {
            $list.addClass('show-help-text');
            $showhelp.find('input').attr("checked", "checked");
        }

        var preview = null;

        var currentPage = null;

        var pageChanged = function(crsaPage) {
            var sections = null;
            var changed = false;
            selected$el = null;
            selectedPgel = null;

            currentPage = crsaPage;

            if(!crsaPage) {
                changed = true;
                //$manage.hide();
            } else {
                sections = crsaPage.getActionsSections();
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
            }
            if(changed) {
                updateList(sections);
            } else {
                updateUsage();
            }
        }

        $('body').on('crsa-page-selected', function(e, crsaPage) {
            pageChanged(crsaPage);
        });

        $('body').on('crsa-element-selected', function(e, crsaPage) {
            var selectedCrsaPage = pinegrow.getSelectedPage();
            selectedElement = pinegrow.getSelectedElement();
            var was_empty = false;
            if(selectedElement) {
                was_empty = selectedPgel == null;
                selected$el = selectedElement.data;
                selectedPgel = getElementPgNode(selected$el);
            } else {
                selected$el = null;
                selectedPgel = null;
            }
            if(currentPage != selectedCrsaPage) {
                pageChanged(selectedCrsaPage);
            } else {
                if(was_empty || !selectedElement) {
                    updateList();
                } else {
                    //updateList();
                    updateAssignedActions();
                    updateUsage();
                }
                //updateUsage();
                //updateList();
            }
            $.fn.crsa('showElementDescription', $obj_desc, selectedElement);
        });

        $('body').on('crsa-frameworks-changed', function(e) {
            updateList();
        });

        var matchTags = function(tags, selected_tags) {
            if(!selected_tags || selected_tags.length == 0) return true;
            if(!tags || tags.length == 0) return false;
            for(var i = 0; i < selected_tags.length; i++) {
                var found = false;
                for(var j = 0; j < selected_tags[i].length; j++) {
                    if(tags.indexOf(selected_tags[i][j]) >= 0) {
                        found = true;
                        break;
                    }
                }
                if(!found) return false;
            }
            return true;
        }

        var selected_tags = [];

        var updateTags = function() {
            var tags = [
                {
                    cat: 'change',
                    text: 'changes',
                    values : [
                        { value: 'element', text: 'Replaces element.'},
                        { value: 'content', text: 'Replaces content.'},
                        { value: 'href', text: 'Replaces href attribute.'}
                    ]
                },
                {
                    cat: 'returns',
                    text: 'returns',
                    values : [
                        { value: 'string', text: 'Returns string.'},
                        { value: 'html', text: 'Returns html.'},
                        { value: 'url', text: 'Returns url.'}
                    ]
                }
            ]
            var html = '';

            for(var i = 0; i < tags.length; i++) {
                html += '<div><b>' + tags[i].text + '</b>';
                for(var j = 0; j < tags[i].values.length; j++) {
                    html += '<a href="' + tags[i].cat + ':' + tags[i].values[j].value + '">' + tags[i].values[j].value + '</a>';
                }
                html += '</div>';
            }
            $tags.html(html);

        }

       // updateTags();
        var assigned_actions_section = {
            name: 'Assigned actions',
            framework : {
                name: 'Shortcuts',
                show_in_action_tab: currnetTabName
            },
            getComponentTypes : function() {
                return [];
            }
        }

        function showFields(selectedElement, def, $item, $scrollParent) {
            var sections = def.sections ? Object.values(def.sections) : [];

            if(def.on_before_show_fields) {
                def.on_before_show_fields(currentPage, sections, selectedElement, def);
            }

            var values = {};

            try {
                values = selectedElement ? getValuesForObject(selectedElement, sections) : {};
            }
            catch(err) {
                console.log(err);
            }

            var $props = $('<div/>', {class: 'action-fields'});

            var count = sections.length;

            var on_fields_created = [];

            $.each(sections, function(i ,s) {
                if((s.hasOwnProperty("show") && !s.show) || !s.name) return true;

                if(i > 0) {
                    $('<div class="crsa-field crsa-field-label"><label>' + s.name + '</label></div>').appendTo($props);
                    //$('<h3/>').html(s.name).appendTo($props);
                }

                var $c = $('<div/>').appendTo($props);

                var createFields = function(fields) {
                    $.each(fields, function(fn, fdef) {
                        var $field;
                        if(fdef.type == 'custom') {
                            $field = fdef.show($c, selectedElement, fn, fdef, values);
                        } else {
                            $field = $.fn.crsa('addInputField', $c, selectedElement, fn, fdef, values, false, $scrollParent);
                        }
                        if(fdef.on_fields_created) {
                            on_fields_created.push({func: fdef.on_fields_created, obj: selectedElement, field: $field, def: fdef, name: fn, default_value: fdef.default_value || null});
                        }
                        pinegrow.validateField(selectedElement, fn, values.hasOwnProperty(fn) ? values[fn] : null, fdef, $field, values);
                    });
                }

                createFields(s.fields);

                var dynamic_fields = {};
                currentPage.callFrameworkHandler("on_show_action_fields", dynamic_fields, def, selectedElement);

                createFields(dynamic_fields);

                // Use selectize
                // UseSelectize();
                // Use select2
                //useSelete2();
            });

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

            $props.insertAfter($item.find('>name'));
            //$item.append($props);
            return $props;
        }

        var removeFields = function($item) {
            $item.find('>.action-fields').remove();
        }



        var sections_map = [];
        var actions_map = [];

        var getSectionDef = function($li) {
            return sections_map[parseInt($li.attr('data-section-index'))];
        }

        var getActionDef = function($li) {
            return actions_map[parseInt($li.attr('data-action-index'))];
        }

        var getHTMLForAction = function(def, cat_match) {
            var html = '';
            var extraname = '';
            var helptext = '';
            var tags = '';
            var tags_array = null;
            var icons = '';

            icons = '<icons>';

            if(def.framework && def.framework.get_preview_for_action) {
                icons += '<i class="fa fa-magic action-magic only-active"></i>&nbsp;<i class="fa fa-code show-code"></i>';
            }
            icons += '<i title="Remove action from the element" class="fa fa-times remove-action only-active"></i>&nbsp;</icons>';

            if(def.meta) {
                extraname = def.meta.extra_name ? '<small> / ' + def.meta.extra_name + '</small>' : '';
                helptext = def.meta.helptext ? def.meta.helptext : '';
                if(def.meta.helplink) {
                    helptext += '<a href="' + def.meta.helplink + '" class="external"><i class="fa fa-question-circle"></i></a>';
                }
                if(def.meta.tags && def.meta.tags.length) {
                    tags = def.meta.tags.join(' ');
                    tags_array = tags;
                }
            }

            if(filterRegEx) {
                if(!cat_match && !def.name.match(filterRegEx) && !extraname.match(filterRegEx) && !tags.match(filterRegEx)) {
                    return '';
                }
            }
            if(!matchTags(tags_array, selected_tags)) return '';

            //var $item = $('<li/>', { 'class' : 'crsa-action crsa-action-on'}).html('<name>' + def.name + extraname + icons + '</name>');

            //$item.data('crsa-factory-def', def); //!!!!!

            actions_map.push(def);

            html += '<li data-action-index="' + (actions_map.length - 1) + '" class="crsa-action crsa-action-on"><name>' + def.name + extraname + icons + '</name>';

            var has_this_action = false;

            if(selectedPgel) {
                if(hasAction(selectedPgel, def)) {
                    has_this_action = true;
                }
            }

            if(tags.length) {
                //html += '<div class="action-tags">' + tags + '</div>';
            }
            if(helptext.length) {
                html += '<p class="help-text">' + helptext + '</p>';
            }

            html += '</li>';
            //$item.appendTo($dest);
            return html;
        }

        var filterRegEx;

        var updateAssignedActions = function() {
            if(!_this.showAssignedActions) return;

            var selectedCrsaPage = pinegrow.getSelectedPage();
            if(!selectedCrsaPage || !selectedPgel) return;
            var used_actions = selectedCrsaPage.getAllActionTypes(selected$el, selectedPgel);
            var html = '';
            var $as = $list.find('> .assigned-actions');
            if(used_actions.length) {
                for(var i = 0; i < used_actions.length; i++) {
                    if (used_actions[i].framework.show_in_action_tab == currnetTabName) {
                        html += getHTMLForAction(used_actions[i], false);
                    }
                }
                $as.show();
            } else {
                $as.hide();
            }
            pgRemoveMultiselects($as);
            $as.find('>ul').html(html);
            crsaHandleExternalLinks($as);
        }

        var updateList = function(sections) {
            var selectedCrsaPage = pinegrow.getSelectedPage();

            pgRemoveMultiselects($list);
            $list.html('');
            //return;
            filter = $input.val();
            filterRegEx = filter && filter.length > 0 ? new RegExp(escapeRegExp(filter),'i') : null;

            var selected_tags = null;//[['t:post', 'comment'], ['settings']];

            /*   if(filterRegEx) {
             $cancel.show();
             } else {
             $cancel.hide();
             }*/

            if(!selectedCrsaPage) {
                currentFactoryLibSections = null;
                return;
            }
            sections_map = [];
            actions_map = [];

            if(!sections) sections = selectedCrsaPage.getActionsSections();
            currentFactoryLibSections = sections;

            var selectedElement = pinegrow.getSelectedElement();

            if(!selectedElement) {
                $list.html('<div class="alert alert-info">Click on any element on the page to edit its actions or to add new HTML elements to the page.</div>');
                return;
            }



            var displayed_sections = sections;

            if(selectedPgel) {
                /*var used_actions = selectedCrsaPage.getAllActionTypes(selected$el, selectedPgel);
                if(used_actions.length) {
                    assigned_actions_section.getComponentTypes = function() {
                        return [];
                    }

                }*/

            }
            if(_this.showAssignedActions) {
                displayed_sections = [assigned_actions_section].concat(sections);
            }

            var html = '';

            $.each(displayed_sections, function(i, sec_def) {
                if (sec_def.framework.show_in_action_tab != currnetTabName) return;
                var cat_match = true;
                if(filterRegEx) cat_match = sec_def.name.match(filterRegEx);

                var section_icons = '<i class="fa fa-caret-right closed"></i><i class="fa fa-caret-down opened"></i>';

                if(!sec_def.hasOwnProperty('closed') && sec_def != assigned_actions_section) {
                    var k = 'sec_open_' + sec_def.key;
                    if(localStorage[k]) {
                        sec_def.closed = localStorage[k] != '1'; //not open
                    } else if('default_closed' in sec_def) {
                        sec_def.closed = sec_def.default_closed;
                    } else {
                        sec_def.closed = true;
                    }
                }

                var $tit;
                //$tit = $('<li/>', {class: 'section' + (sec_def.closed ? ' section-closed' : '')}).html('<div><h2>' + sec_def.name + '<small> / ' + sec_def.framework.name + '</small>' + section_icons + '</h2></div>').appendTo($list);

                sections_map.push(sec_def);

                var inner_html = '';
                $.each(sec_def.getComponentTypes(), function(i, eltype) {

                    var def = eltype;
                    if(def) {
                        inner_html += getHTMLForAction(def, cat_match);
                    }

                });
                if(inner_html.length || true) {

                    html += '<li data-section-index="' + (sections_map.length - 1) + '" class="' + 'section' + (sec_def.closed ? ' section-closed' : '') + (sec_def == assigned_actions_section ? ' assigned-actions' : '') + '"><div><h2>' + sec_def.name + '<small> / ' + sec_def.framework.name + '</small>' + section_icons + '</h2></div>';

                    //$tit.data('section-def', sec_def); //!!!!

                    //var $dest = $('<ul/>', {class:  ''}).appendTo($tit);

                    html += '<ul>';

                    html += inner_html;

                    html += '</ul></li>';
                }
            });

            $list.get(0).innerHTML = html;

            var dbl_timer = null;
            var tooltip_active = false;

            var last_previewed_def = null;

            updateAssignedActions();
            // updateUsage();

            crsaHandleExternalLinks($list);

            var collapsibleSections = new CrsaCollapsibleSections($list);
            collapsibleSections.show(getSectionDef, updateUsage);
        }

        var updateUsage = function($div) {
            if(!$div) $div = $container;
            //$container.
            var $crsaPanel = $div;
            if (!$div.hasClass('crsa-panel')) {
                $crsaPanel = $div.closest('.crsa-panel');
            }
            $div.find('li.has-data').removeClass('has-data');
            $div.find('li.crsa-action').each(function(i, a) {
                var $li = $(a);
                pgRemoveMultiselects($li);
                $li.find('.action-fields').remove();
                var def = getActionDef($li);//$li.data('crsa-factory-def');
                if(selectedPgel) {
                    if(hasAction(selectedPgel, def)) {
                        $li.addClass('crsa-action-on');
                        showFields(selectedElement, def, $li, $crsaPanel.children('.content'));
                        $li.closest('.section').addClass('has-data');
                    } else {
                        $li.removeClass('crsa-action-on');
                        removeFields($li);
                    }
                } else {
                    $li.removeClass('crsa-action-on');
                }
            });
            $div.find('.section').each(function(i, sec) {
                var $sec = $(sec);
                var $ul = $sec.find('>ul');
                if($ul.get(0).childNodes.length) {
                    $sec.show();
                } else {
                    $sec.hide();
                }
            });
        }

        var addEventsToList = function() {
            var list = $list.get(0);
            list.addEventListener('mouseenter', function(event) {
                var $target = $(event.target);
                if($target.is('i.show-code')) {
                    if(selectedPgel) {
                        var $li = $target.closest('li');
                        var def = getActionDef($li); //$li.data('crsa-factory-def');
                        var code = def.framework.get_preview_for_action(selectedPgel, def);
                        //var $c = $('<pre>' + code + '</pre>');

                        var $el = crsaFuncs.createPreviewElementFromDefinition(def);
                        if(!$el) {
                            pinegrow.showPreview($li, $('<pre>' + escapeHtmlCode(code) + '</pre>'), 'cm-preview actions-preview', 300);
                        } else {
                            pinegrow.showPreview($li, $el, 'actions-preview', 300, code);
                        }
                    }
                }
            }, true);

            list.addEventListener('mouseleave', function(event) {
                var $target = $(event.target);
                if($target.is('i.show-code')) {
                    pinegrow.hidePreview();
                }
            }, true);

            list.addEventListener('contextmenu', function(e) {
                var $target = $(e.target);
                if($target.is('name') || $target.parent().is('name')) {
                    e.stopPropagation();
                    e.preventDefault();

                    var $li = $target.closest('li');
                    var def = getActionDef($li);

                    var $menu = new CrsaContextMenu();

                    var name = getElementName(selected$el);
                    var action_name = '<b>' + def.name + '</b>';

                    if (selected$el && selectedPgel) {

                        if(hasAction(selectedPgel, def)) {
                            $menu.add("Remove action from selected element", null, null, 'header');
                            $menu.add("Remove " + action_name + " from <b>" + name + "</b>", null, function () {
                                //$target.closest('name').click();
                                addAndRemoveAction($target);
                            });
                        } else {
                            $menu.add("Add action to selected element", null, null, 'header');
                            $menu.add("Add " + action_name + " to <b>" + name + "</b>", null, function () {
                                $target.closest('name').click();
                            });
                            if(def.not_placeable) {

                                $menu.add("", null, null, 'divider');
                                $menu.add("Can\'t create new HTML element: " + def.not_placeable, null, null, 'header');

                            }
                        }
                        if(def.not_placeable || !def.code) {

                        } else {
                            var am = crsaFuncs.findActionMenuForInsertingDefIntoEl(def, selected$el);

                            $menu.add("", null, null, 'divider');
                            $menu.add("Create new HTML element with this action", null, null, 'header');

                            $menu.add("Prepend to <b>" + name + "</b>", null, function () {
                                crsaFuncs.insertThroughActionMenu(am, selected$el, def, false, true);
                            });
                            $menu.add("Append to <b>" + name + "</b>", null, function () {
                                crsaFuncs.insertThroughActionMenu(am, selected$el, def, false, false);
                            });
                            $menu.add("Insert before <b>" + name + "</b>", null, function () {
                                crsaFuncs.insertBeforeOrAfter(selected$el, def, false, false);
                            });
                            $menu.add("Insert after <b>" + name + "</b>", null, function () {
                                crsaFuncs.insertBeforeOrAfter(selected$el, def, false, true);
                            });
                            $menu.add("Replace <b>" + name + "</b>", null, function () {
                                crsaFuncs.replaceElement(selected$el, def);
                            });
                        }

                    } else {
                        $menu.add('First select an existing element on the page and then use the right click to place the new element.', null, function () {
                        }, 'header');
                    }

                    $menu.showAt(e.pageX, e.pageY);
                }

            }, true);

            var addAndRemoveAction = function($target, only_add) {
                var $li = $target.closest('li');
                var def = getActionDef($li);//$li.data('crsa-factory-def');
                var pos_top = $li.position().top;

                //event.preventDefault();
                //event.stopImmediatePropagation();

                if(selected$el) {
                    var elname = getElementName(selected$el);
                    var problems = new pgParserSourceProblem(selectedPgel, selected$el, def.ignore_lock ? true : false);
                    var selectedCrsaPage = pinegrow.getSelectedPage();

                    if(!selectedPgel) {
                        problems.add('element', elname, 'change');
                    }
                    if(!problems.ok()) {
                        showAlert(problems.toString(), "Can't edit this element");
                        return;
                    }
                    if(!hasAction(selectedPgel, def)) {
                        var can_add = true;
                        if(def.on_can_add_action) {
                            if(!def.on_can_add_action(selectedPgel, selectedCrsaPage, def, selected$el)) {
                                can_add = false;
                            }
                        }
                        if(can_add) {
                            if(!canMakeChange(selectedPgel, 'add_action', def)) return;

                            willMakeChange(selectedCrsaPage.$iframe, "Add action / " + elname);
                            var modified_pgel = $.fn.crsa('addActionToElement', selectedPgel, def, selectedCrsaPage, selected$el);
                            pinegrow.showQuickMessage('Action <b>' + def.name + '</b> was added to <b>' + elname + '</b>');
                            if(modified_pgel == selectedPgel || true) {
                                showFields(selectedElement, def, $li, $li.closest('.content'));
                                $li.addClass('crsa-action-on');
                            }

                            pinegrow.stats.using('action.' + (def.type) || 'unknown');
                        }
                    } else {
                        if(only_add) {
                            pinegrow.showQuickMessage('Use <i class="fa fa-times"></i> icon to remove the action from the element.', 4000, false, 'error');
                            return;
                        }

                        if(!canMakeChange(selectedPgel, 'remove_action', def)) return;

                        willMakeChange(selectedCrsaPage.$iframe, "Remove action / " + elname);
                        var modified_pgel = $.fn.crsa('removeActionFromElement', selectedPgel, def, selectedCrsaPage, selected$el);
                        pinegrow.showQuickMessage('Action <b>' + def.name + '</b> was removed from <b>' + elname + '</b>');
                        if(modified_pgel == selectedPgel || true) {
                            removeFields($li);
                            $li.removeClass('crsa-action-on');
                        }
                    }
                    if($li.closest('.assigned-actions').length) {
                        //clicked on assigned actions, update list
                        updateUsage();
                    } else {
                        //click on list, update assigned
                        updateAssignedActions();
                        updateUsage($list.find('.assigned-actions'));
                    }
                    var new_top = $li.position().top;
                    var $content = $li.closest('.content');
                    var st = $content.scrollTop();
                    st = st - (pos_top - new_top);
                    $content.scrollTop(st);

                    $.fn.crsa('updateStructureAndWireAllElemets', selectedCrsaPage.$iframe, selected$el, true);
                    didMakeChange(selectedCrsaPage.$iframe, selected$el);
                }

                //pinegrow.showNotice('<p>A couple of tips on using actions:</p><ul><li><b>Click on the action name</b> to add or remove the action from the selected element.</li><li><b>Right-click on the action name</b> to insert a new HTML element with the action into or before / after the selected element.</li></ul>', 'Actions', 'actions-click-name');
            }

            list.addEventListener('click', function(event) {
                var $target = $(event.target);

                if($target.is('i.show-code')) {
                    if(selectedPgel) {
                        var selectedCrsaPage = pinegrow.getSelectedPage();
                        var $li = $target.closest('li');
                        var def = getActionDef($li);//$li.data('crsa-factory-def');
                        pinegrow.hidePreview();
                        event.preventDefault();
                        event.stopImmediatePropagation();
                        selectedCrsaPage.callFrameworkHandler('on_action_show_code_clicked', selectedPgel, def, $li);
                    }
                } else if($target.is('i.remove-action')) {
                    addAndRemoveAction($target);
                    event.preventDefault();
                    event.stopImmediatePropagation();
                } else if($target.is('i.action-magic')) {
                    if(selectedPgel) {
                        var selectedCrsaPage = pinegrow.getSelectedPage();
                        var $li = $target.closest('li');
                        var def = getActionDef($li);//$li.data('crsa-factory-def');
                        event.preventDefault();
                        event.stopImmediatePropagation();
                        if(selectedPgel && hasAction(selectedPgel, def)) {
                            selectedCrsaPage.callFrameworkHandler('on_action_magic_clicked', selectedPgel, def, $li);
                        } else {
                            var code = selectedCrsaPage.callFrameworkHandler('on_action_magic_preview_clicked', selectedPgel, def, function(code) {
                                if(code) {
                                    pinegrow.showPreview($li, code, 'actions-preview', 300);
                                }
                            });
                        }
                    }
                } else if($target.is('name') || $target.parent().is('name')) {
                    event.preventDefault();
                    event.stopImmediatePropagation();
                    addAndRemoveAction($target, true);
                }
            }, true);

            /*
             $list.find('li.crsa-action name')
             .on('contextmenu', function(e) {


             var $li = $(e.delegateTarget);
             var def = $li.data('crsa-factory-def');
             var fm = def.framework;

             e.stopPropagation();
             e.preventDefault();
             methods.hidePreview();

             var $menu = new CrsaContextMenu();

             var selectedElement = pinegrow.getSelectedElement();

             if(selectedElement && selectedElement.type == 'element') {
             var am = findActionMenuForInsertingDefIntoEl(def, selectedElement.data);

             var name = getElementName(selectedElement.data);

             $menu.add("Insert after <b>" + name + "</b>", null, function() {
             insertBeforeOrAfter(selectedElement.data, def, false, true);
             last_previewed_def = def;
             });
             }
             $menu.showAt(e.pageX, e.pageY);

             });*/
        }



        var def = null;

        var active_$el = null;

        addEventsToList();

        updateList();

        $input.on('input', function() {
            updateList();
        });

    }

}

var pgWindowManager = function(win, name, no_prefs_func) {

    var _this = this;
    this.win = win;
    this.name = name;

    var getKey = function(key) {
        return 'win_' + _this.name + '_' + screen.width + 'x' + screen.height + '_' + key;
    }

    var x = localStorage[getKey('x')] || null;
    var y = localStorage[getKey('y')] || null;
    var w = localStorage[getKey('w')] || null;
    var h = localStorage[getKey('h')] || null;

    //if(no_prefs_func) no_prefs_func(win);

    //console.log('RESTORE WIN: ' + x + ', ' + y + ', ' + w + ', ' + h);

    try {
        var move = true;
        if(x === null && y === null && w === null && h === null) {
            if(no_prefs_func) no_prefs_func(win);
        } else {
            if(x !== null && y !== null) {
                x = parseInt(x);
                y = parseInt(y);
                if(x < 0) x = 0;
                if(y < 0) y = 0;
                move = true;
                //win.moveTo(x, y);
            }
            if(w !== null && h !== null) {
                w = parseInt(w);
                h = parseInt(h);
                if(w < 400) w = 400;
                if(h < 300) h = 300;

                if(x + 100 > screen.width) {
                    x = 0;
                    w = screen.width - x;
                    move = false;
                }
                if(y + 100 > screen.height) {
                    y = 80;
                    h = screen.height - y;
                    move = false;
                }
                if(move) {
                    win.moveTo(x, y);
                    win.resizeTo(w, h);
                } else {
                    if(no_prefs_func) no_prefs_func(win);
                }


            }
        }
    } catch(err) {}

    var save = function() {
        //debugger;
        if(_this.win.height > 100 && _this.win.x > -1000 && _this.win.y >= -20) {
            localStorage[getKey('x')] = _this.win.x;
            localStorage[getKey('y')] = _this.win.y;
            localStorage[getKey('w')] = _this.win.width;
            localStorage[getKey('h')] = _this.win.height;
        }
    }

    win.on('move', function(x, y) {
        save();
    })

    win.on('resize', function(w, h) {
        save();
    })

    win.on('closed', function() {
        win = null;
        _this.win = null;
    })
}


var pgPageTabs = function($dest) {

    var _this = this;
    var list = [];

    var $me = $('<div class="file-tabs"><ul></ul></div>');
    var $me_ul = $me.find('ul');
    var $lis;
    var visible = false;

    var show_tooltips = true;

    $me.prependTo($dest).hide();

    this.addPage = function(crsaPage) {
        //debugger;
        list.push(crsaPage);
        updateDisplay();
    }

    this.removePage = function(crsaPage) {
        var idx = list.indexOf(crsaPage);
        list.splice(idx, 1);
        var vis = null;
        for(var n = 0; n < list.length; n++) {
            if(list[n].visible) {
                vis = true;
                break;
            }
        }
        if(!vis && list.length) {
            showPage(list[0], 0);
        }
        updateDisplay();
    }

    this.updateDisplay = function() {
        updateDisplay();
    }

    this.getHeight = function() {
        return visible ? 39 : 0;
    }

    this.updateHasChangesStatus = function(cp) {
        var has = cp.hasChanges() ? ' *' : '';
        var $li = $me_ul.find('li[data-url="' + cp.url + '"]').each(function(i, li) {
            $(li).find('>span').html(has);
        })
    }

    var updateDisplay = function() {
        $me_ul.html('');
        for(var n = 0; n < list.length; n++) {
            var cp = list[n];
            var $li = $('<li data-url="' + cp.url + '">' + cp.tab_name + '<span>' + (cp.hasChanges() ? ' *' : '') + '</span></li>').appendTo($me_ul).data('page-index', n);
            if(cp.visible) {
                $li.addClass('active');
            }
            if(cp.live_update) {
                $li.addClass('view');
            }
        }
        $lis = $me_ul.find('li');

        $lis.on('click', function(e) {
            e.preventDefault();
            var $li = $(e.delegateTarget);
            var cp = list[$li.data('page-index')];

            var multi = true;
            if(!e.ctrlKey && !e.metaKey) {
                multi = false;
                hideAll(cp);

                if(show_tooltips) {
                    crsaQuickMessage('CMD/CTRL + Click to show multiple pages', 3000);
                    show_tooltips = false;
                }
            }
            if(multi && cp.visible) {
                hidePage(cp);
            } else {
                showPage(cp);
            }
            if (!cp.rememberWidth) $.fn.crsapages('refresh');
        })
        var old_visible = visible;
        if(list.length > 1) {
            $me.show();
            visible = true;
        } else {
            $me.hide();
            visible = false;
        }
        if(old_visible != visible) {
            $.fn.crsapages('refresh');
        }
    }

    var showPage = function(crsaPage, idx) {
        if(typeof idx == 'undefined') idx = list.indexOf(crsaPage);
        if(!$lis) return;
        var $li = $($lis.get(idx));
        $li.addClass('active');
        crsaPage.show();
        //debugger;
        var $selected_el = null;
        if(crsaPage.selected_element_pgid) {
            $selected_el = crsaPage.getElementWithPgId(crsaPage.selected_element_pgid);
        }
        pinegrow.selectElement($selected_el);
        //crsaPage.treeRepaintOnShow = crsaPage.treeRepaintOnShow;
        pinegrow.setSelectedPage(crsaPage);
    }

    var hidePage = function(crsaPage, idx) {
        if(typeof idx == 'undefined') idx = list.indexOf(crsaPage);
        if(!$lis) return;
        var $li = $($lis.get(idx));
        $li.removeClass('active');
        crsaPage.hide();
    }

    var hideAll = function(except) {
        for(var n = 0; n < list.length; n++) {
            var cp = list[n];
            if(cp != except) {
                hidePage(cp, n);
            }
        }
    }

    this.showPage = function(crsaPage, hide_others) {
        if(hide_others) {
            hideAll(crsaPage);
        }
        showPage(crsaPage);
        $.fn.crsapages('refresh');
    }

    this.hidePage = function(crsaPage) {
        hidePage(crsaPage);
        $.fn.crsapages('refresh');
    }

    this.hideAll = function() {
        hideAll();
        $.fn.crsapages('refresh');
    }
}

var PgEditException = function(msg, reason, on_display) {
    this.msg = msg;
    this.reason = reason;
    this.on_display = on_display;

    this.toString = function() {
        return this.msg;
    }
}


var PgBoxWithButton = function($button_dest, icon, title, content, tooltip) {

    var $button = $('<a href="#" class="news-box-button"><i class="fa fa-fw fa-' + icon + '"></i></a>');

    var $box = $('<div class="news-box"><h3>' + title + '<i class="fa fa-times close"></i></h3>' + content + '</div>');

    var $popover = null;
    var $box_list = $box.find('div.list');

    var is_open = false;
    var _this = this;

    $button_dest.append($button);

    crsaHandleExternalLinks($box);

    if(tooltip) {
        addTooltip($button, tooltip);
        /*
        $button.tooltip({
            container: 'body',
            trigger: 'hover',
            title: tooltip,
            placement: 'bottom',
            delay: { "show": 800, "hide": 100 }
        });
        */
    }

    var close = function() {
        $box.animate({opacity: 0.0}, 200, function() {
            $box.detach();
            is_open = false;
        });
    }

    $button.on('click', function(e) {
        e.preventDefault();

        if(is_open) {
            close();
        } else {
            $('body').append($box);
            $box.css('left', ($button.offset().left + $button.outerWidth() - $box.width()) + 'px').css('right', 'auto');
            $box.css('opacity', 0).animate({opacity: 1.0}, 200);
            is_open = true;
            _this.opened();
        }
    })

    $box.find('.close').on('click', function(e) {
        e.preventDefault();
        close();
        _this.closed();
    })

    this.get$Button = function() {
        return $button;
    }

    this.get$Box = function() {
        return $box;
    }

    this.opened = function() {

    }

    this.closed = function() {

    }
}


var PgNewsBox = function($button_dest) {

    var pgbox = new PgBoxWithButton($button_dest, 'coffee', 'Articles &amp; News', '<div class="list"></div><div class="news-box-item"><a href="http://docsbeta.pinegrow.com" class="external" style="font-size: 12px;">More articles »</a></div><div class="news-box-item"  style="font-size: 12px;"><a href="https://www.getdrip.com/forms/8855293/submissions/new" class="external">Get new articles in your inbox »</a></div>', 'Read news and articles');

    var $box = pgbox.get$Box();
    var $button = pgbox.get$Button().addClass('hide');

    var $box_list = $box.find('div.list');

    pgbox.opened = function() {
        localStorage.last_news_version = news_data.news_version;
        $button.removeClass('has-news');
        pinegrow.stats.using('news.show');
    }

    var updateBox = function(list) {
        $box_list.html('');
        for(var i = 0; i < list.length; i++) {
            var $li = $('<div class="news-box-item"><a class="external" href="' + list[i].url + '">' + list[i].name + '<small>' + list[i].tag + '</small></a></div>');
            $box_list.append($li);
        }
        crsaHandleExternalLinks($box, function() {
            pinegrow.stats.using('news.click');
        });
    }

    var news_data = null;

    this.setData = function(data) {
        news_data = data;

        updateBox(news_data.list);

        if(news_data.news_version != (localStorage.last_news_version || 0)) {
            $button.addClass('has-news');
        }

        $button.removeClass('hide').css('opacity', 0).animate({opacity: 1.0}, 1000);
    }
}

var pgGetOpenPartialInContainerInfo = function(partial_file) {
    var project = pinegrow.getCurrentProject();

    if(project) {
        return project.getProjectInfo().getSettingForFile(partial_file, 'open_partial_wrapper');
    }
    return null;
}

var pgOpenPartialInContainer = function(partial_url, done, force_interactive) {

    var $dialog;
    var $url;
    var $selector;
    var $remember;
    var url;
    var selector;
    var auto_open = false;

    var cp = pinegrow.getCrsaPageByUrl(partial_url);

    if(cp) {
        pinegrow.showQuickMessage('Page is already open.');
        pinegrow.pageTabs.showPage(cp, true);
        scrollCanvasToPage(cp.$iframe);
        return;
    }

    var partial_file = crsaMakeFileFromUrl(partial_url);

    var info = pgGetOpenPartialInContainerInfo(partial_file);
    if(info) {
        url = info.url || '';
        selector = info.selector || '';
        auto_open = info.auto_open || false;
    }

    var showError = function($field, msg) {
        var $p = $field.closest('.form-group').find('.error');
        if(msg) {
            $p.html(msg).removeClass('hide');
        } else {
            $p.html('').addClass('hide');
        }
    }

    var getAbsoluteUrl = function() {
        var curl = $url ? $url.val() : url;
        if(!curl) return null;
        var urllib = require('url');
        return urllib.resolve(partial_url, curl);
    }

    var onElementSelected = function() {

    }

    var onClose = function() {
        $('body').off('crsa-element-selected.openpartial');
    }

    var onOpen = function() {
        var opts = {
            wrapper_url : getAbsoluteUrl(),
            wrapper_selector : selector
        }
        pinegrow.openPage(partial_url, done, true, null, opts);
    }

    if(!force_interactive && auto_open) {
        if(url && selector) {
            pinegrow.showQuickMessage('Opening as a partial file in a container. Use Right-click -&gt; Open as partial... to override.', 4000);
            onOpen();
            return;
        }
    }

    pinegrow.getComponent('open-partial', function(pc) {
        var html = pc.html;

        $dialog = makeAndShowDialog("Open partial in container", "Cancel", "Open", html, function() {
            onClose();
        }, function() {
            //open
            var project = pinegrow.getCurrentProject();

            if(project) {
                var project_info = project.getProjectInfo();
                project_info.setSettingForFile(partial_file, 'open_partial_wrapper', {url: url, selector: selector, auto_open: $remember.is(':checked')});
                project_info.save();
            }

            onOpen();

            onClose();

        }, function() {
            //validate
            var ok = true;
            url = $.trim($url.val());
            selector = $.trim($selector.val());

            showError($url, null);
            showError($selector, null);

            if(!url) {
                showError($url, 'File url or remote url is required.');
                ok = false;
            }
            if(!selector) {
                showError($selector, 'Selector is required. Use <b>body</b> if you have no other idea.');
                ok = false;
            }
            return ok;
        })

        $url = $dialog.find('.input-url').val(url);
        $selector = $dialog.find('.input-selector').val(selector);
        $remember = $dialog.find('.auto-open');

        if(auto_open) $remember.prop('checked', 'checked');

        showError($url, null);
        showError($selector, null);

        $url.closest('.form-group').find('a').on('click', function(e) {
            e.preventDefault();
            crsaChooseFile(function(url, file) {
                url = crsaMakeLinkRelativeTo(url, partial_url);
                $url.val(url);
            }, null, null, null, false);
        });

        $selector.closest('.form-group').find('a').on('click', function(e) {
            e.preventDefault();
            var page_url = getAbsoluteUrl();
            if(!page_url) {
                pinegrow.showQuickMessage('Set the url first!', 3000, false, 'error');
            } else {
                //pinegrow.showQuickMessage(page_url);
                pinegrow.openOrShowPage(page_url);

                $('body').off('crsa-element-selected.openpartial').on('crsa-element-selected.openpartial', function(e, selectedElement) {
                    if(selectedElement && selectedElement.data) {
                        var $el = selectedElement.data;
                        var pgel = getElementPgNode($el);
                        if(pgel) {
                            var s = pgFindUniqueSelectorForElement(pgel, pgel.document);
                            if(s) {
                                $selector.val(s);
                            } else {
                                pinegrow.showQuickMessage('Sorry, can\'t guess a unique selector.');
                            }
                        }
                    }
                })
            }
        });

    });


}

var PgUILayoutControl = function($dest) {

    var code = '<ul class="ui-lc"></ul>';
    var $c = $(code).appendTo($dest);

    var layout = pinegrow.getSetting('ui-panel-layout', "L,P,C,T").split(',');

    var content = {L: 'Lib', P: 'Page', /* C: 'Code', */ T: 'Tree'};

    layout.forEach(function(i) {
        if(i && i != 'C') {
            $c.append($('<li data-panel="' + i + '">' + content[i] + '</li>'));
        }
    })

    $c.sortable().on( "sortupdate", function( event, ui ) {
        var r = [];
        $c.children().each(function(i,el) {
            var p = $(el).attr('data-panel');
            if(p) r.push(p);
        })
        var new_layout = r.join(',');

        pinegrow.setSetting('ui-panel-layout', new_layout);
        $(window).trigger('resize');
    });

}

var PgUILayoutControlBox = function($button_dest, onSettings) {

    var pgbox = new PgBoxWithButton($button_dest, 'th-large', 'Drag panels to rearrange them:', '<div class="control"></div>', 'Rearrange UI panels');

    //<div class="news-box-item"><a href="#" class="settings" style="font-size: 12px;">More settings »</a></div>

    var $box = pgbox.get$Box().addClass('ui-lc-box');
    var $button = pgbox.get$Button().addClass('ui-lc-button');//.css('padding', '5px 5px 3px');

    var $box_content = $box.find('div.control');

    var control = null;

    pgbox.opened = function() {
        if(!control) control = new PgUILayoutControl($box_content);
    }

    $box.find('a.settings').on('click', function(e) {
        e.preventDefault();
        onSettings();
    })
}

var PgTrialUpgradeBox = function($button_dest) {

    var msg = "<p>Whether you’re a beginner or an advanced web developer / designer, Pinegrow will help you save time, expand your skills and make your workflow more efficient.</p><p>Get a copy of Pinegrow for yourself, risk-free, with our 30 days money-back guarantee.</p><p><a class=\"external btn btn-primary\" href=\"http://pinegrow.com#buy\">Buy Pinegrow</a></p>";

    var pgbox = new PgBoxWithButton($button_dest, 'rocket', 'Power-up with Pinegrow', msg, 'Power-up with Pinegrow');

    var $button = pgbox.get$Button().addClass('gift-button');
    pgbox.get$Box().addClass('powerup-pg');

    pgbox.opened = function() {
        pinegrow.stats.using('app.gift');
    }
}

var addTooltip = function($e, title) {
    $e.tooltip({container: 'body', placement: 'auto', html : true, title: title, trigger: 'hover', delay:{ "show": 800, "hide": 100 }});
    $e.on('mousedown', function(e) {
        $e.tooltip('hide');
    })
    //$e.tooltip('show');
}

var PgCodeEditors = function() {
    var list = [];

    this.register = function(cm) {
        if(cm && list.indexOf(cm) < 0) list.push(cm);
    }

    this.unregister = function(cm) {
        if(!cm) return;
        var idx = list.indexOf(cm);
        if(idx >= 0) {
            list.splice(idx, 1);
        }
    }

    this.forEachEditor = function(func) {
        list.forEach(func);
    }
}

var setLightDarkClassForEditor = function($editor, theme) {
    var dark = ['ambiance','blackboard','mbo','midnight','monokai'];
    $editor.removeClass('dark-theme');
    if(dark.indexOf(theme) >= 0) {
        $editor.addClass('dark-theme');
    }
}

var PgPositionElement = function($el, position_x, position_y, $parent) {

    if(!$parent) $parent = $el.parent();

    var position = function() {
        var $p = $parent;
        var pw = $p.outerWidth();
        var ph = $p.outerHeight();

        var ew = $el.outerWidth();
        var eh = $el.outerHeight();

        var x,y;
        var spacer = 4;

        switch(position_x) {
            case 'left':
                x = spacer;
                break;
            case 'right':
                x = pw - ew - spacer;
                break;
            case 'center':
                x = (pw - ew)/2;
                break;
        }
        switch(position_y) {
            case 'top':
                y = spacer;
                break;
            case 'bottom':
                y = ph - eh - spacer;
                break;
            case 'center':
                y = (ph - eh)/2;
                break;
        }
        $el.css({left: x + 'px', top: y + 'px', margin: 'auto'});
    }

    position();

    $el.addClass('reposition-on-resize');

    $el.on('reposition', function() {
        position();
    })
}


var PgPositionManager = function() {

    var t = null;

    $(window).on('resize', function () {
        if(t != null) clearTimeout(t);
        t = setTimeout(function() {
            $('.reposition-on-resize').trigger('reposition');
        }, 250);
    })
}

var pgPositionManagerInstance = new PgPositionManager();

var PgAskAboutElements = function(pgels, msg, title, buttons) {

    var $dialog = null;

    this.show = function() {
        $dialog = makeAndShowDialog(title, null, null, msg);
        var $footer_buttons = $dialog.find('.modal-footer');

        buttons.forEach(function(button) {
            var $b = $('<button class="btn btn-' + (button.primary ? 'primary' : 'default') + ' btn-sm" type="button">' + button.label + '</button>').on('click', function(e) {
                e.preventDefault();
                if(button.func) button.func(button.action);
                $dialog.remove();
            }).appendTo($footer_buttons);

            if(button.tooltip) {
                addTooltip($b, button.tooltip);
            }
        })

        var pos = new PgPositionElement($dialog, 'center', 'bottom', $('body'));

        var selectElement = function(pgel) {
            var page = pinegrow.getCrsaPageOfPgParserNode(pgel);

            if(pinegrow.getSelectedPage() != page) {
                pinegrow.showPage(page, true);
            }

            var $el = pgel.get$DOMElement();
            if (!$el) {
                page.refresh(function () {
                    pinegrow.selectElement(pgel);
                });
            } else {
                pinegrow.selectElement($el);
            }
        }

        selectElement(pgels[0]);

        var $list = $dialog.find('a[data-pg-select-element]');

        $list.on('click', function(e) {
            e.preventDefault();
            var pgel = pgParserNodeCatalogueInstance.get($(e.delegateTarget).attr('data-pg-select-element'));
            if(pgel) {
                selectElement(pgel);
                pinegrow.showQuickMessage('The element was selected in page view.');
            } else {
                pinegrow.showQuickMessage('Sorry, can\'t find this element in page view.');
            }

        })

        addTooltip($list, 'Click to select the element in page view.');

    }
}

var PgChooseFile = function(done, options) {
    options = options || {parent_url: null, save_as: null, folder: null, no_proxy: false, no_url: false};

    crsaChooseFile(function(url, file) {
        var setUrl = function() {
            if(fdef.file_picker_quotes && url) url = '"' + url + '"';

            if(fdef.file_picker_no_url) url = file;

            $input.val(url).trigger('change');
        }

        var parent_url = options.parent_url || null;
        if(parent_url) {
            if(crsaIsFileUrl(parent_url)) {
                var project = pinegrow.getCurrentProject();
                var outside_of_project = project && project.isUrlInProject(parent_url) && !project.isFileInProject(file);

                url = crsaMakeLinkRelativeTo(url, parent_url);

                if(!options.no_proxy) url = pinegrow.getProxyUrl(url);

                if((crsaIsAbsoluteUrl(url) || outside_of_project) && !options.no_url) {
                    pinegrow.showAlert("<p>Location of the file doesn't let us use a relative url. This can cause url to break when you upload the page to a server or if you open the page in a browser while Pinegrow is not running.</p><p>Would you like to copy the file in the same folder (or subfolder of folder) where your HTML page is located? Then Pinegrow can create relative urls that will work from wherever you open the page.</p>", "The file is not located in the project folder", 'No, use absolute link', 'Yes, copy the file', function() {
                        //use as is
                        done(url, file);
                    }, function() {
                        //copy
                        //debugger;

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
                                    if (crsaIsAbsoluteUrl(url)) {
                                        url = pinegrow.getProxyUrl(url);
                                    }
                                    done(url, file);

                                    if(project_info) {
                                        project_info.setSetting('file-picker-copy-folder', require('path').dirname(new_file));
                                        project_info.save();
                                    }
                                } catch(err) {
                                    pinegrow.showAlert('Could not copy file: ' + err, 'Error');
                                }
                            }
                        }, crsaGetNameFromUrl(url), null, /* folder */ folder);
                    });
                } else {
                    done(url, file);
                }
            } else {
                if(!options.no_proxy) url = pinegrow.getProxyUrl(url);
                done(url, file);
            }
        } else {
            done(url, file);
        }
    }, /* save as */ options.save_as || null, null, null, options.folder || false);
}