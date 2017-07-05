$(function() {

    $('body').one('pinegrow-ready', function(e, pinegrow) {
        var f = new PgFramework('foundation.6.0.5', 'Foundation 6.0.5');
        f.type = "foundation";
        f.allow_single_type = true;

        f.description = '<a href="http://foundation.zurb.com/">Foundation</a> starting pages and components.';
        f.author = 'Pinegrow';
        f.author_link = 'http://pinegrow.com';

        f.ignore_css_files = [/(^|\/)foundation\.css/i, /(^|\/)foundation\.min\.css/i, /(^|\/)normalize(\.min|)\.css/i];
        f.detect = function(crsaPage) {
            return crsaPage.hasStylesheet(/(^|\/)foundation(\.min|)\.css/i);
        }

        f.setScriptFileByScriptTagId('plugin-foundation-6-0-5'); //get url if script is included directly into edit.html
        pinegrow.addFramework(f, 4);


        // Helper methods
            var getPlaceholderImage = function() {
                return pinegrow.getPlaceholderImage();
            }

            var reflowPage = function($el, what) {
            }

            var setDataOption = function(obj, key, type, value, on_value) {
                if(typeof on_value == 'undefined') on_value = '1';
                var $el = obj.data;
                var pgel = new pgQuery($el);

                var v;
                switch(type) {
                    case 'as_is':
                        v = value;
                        break;
                    default:
                        v = value == on_value ? 'true' : 'false';
                }
                var d = pgel.attr('data-options');
                if(!d) {
                    d = key + ':' + v + ';';
                } else {
                    var find = new RegExp(key + '\\s*:\\s*([^;]*)', 'i');
                    if(d.match(find)) {
                        var re = new RegExp(key + '\\s*:\\s*([^;]*)','i');
                        d = d.replace(re, key + ':' + v);
                    } else {
                        if(d.charAt(d.length-1) != ';') d += ';';
                        d += key + ':' + v + ';';
                    }
                }
                pgel.attr('data-options', d);
                return value;
            }

            var getDataOption = function(obj, key, type, value) {
                if(typeof value == 'undefined') value = '1';
                var $el = obj.data;
                var pgel = new pgQuery($el);
                var d = pgel.attr('data-options');
                var re = new RegExp(key + '\\s*:\\s*([^;]*)', 'i');
                if(d) {
                    var m = d.match(re);
                    if(m) {
                        switch(type) {
                            case 'as_is':
                                return $.trim(m[1]);
                                break;
                            default:
                                return m[1] == 'true' ? value : null;
                        }
                    }
                }
                return null;
            }

            var crsaAddStandardSections = function(addTo) {
                var bsAlign = {
                    'type' : 'select',
                    'name' : 'Text align',
                    'action' : 'apply_class',
                    'show_empty' : true,
                    'options' : [
                        { 'key' : 'text-left', 'name' : 'Left' },
                        { 'key' : 'text-right', 'name' : 'Right' },
                        { 'key' : 'text-center', 'name' : 'Center' },
                        { 'key' : 'text-justify', 'name' : 'Justify' }
                    ]
                };

                var rules_section = {
                    name : 'CSS Rules',
                    fields : {
                        'rules' : {
                            'type' : 'rules',
                            'name' : null,
                            'action' : 'rules'
                        }
                    }
                };

                var s = {
                    'fdtext' : {
                        name: 'Text &amp; Context',
                        fields: {
                            fdtextalign : bsAlign,
                            fdtextalignsmall : createResponsiveTextAlign('Small', 'small'),
                            fdtextalignmedium : createResponsiveTextAlign('Medium', 'medium'),
                            fdtextalignlarge : createResponsiveTextAlign('Large', 'large'),
                            // fdtextalignxlarge : createResponsiveTextAlign('XLarge', 'xlarge'),
                            // fdtextalignxxlarge : createResponsiveTextAlign('XXlarge', 'xxlarge'),
                            fdantialiased : { //ok
                                'type' : 'checkbox',
                                'name' : 'Antialiased',
                                'action' : 'apply_class',
                                'value' : 'antialiased'
                            },
                            fdlead : {
                                'type' : 'checkbox',
                                'name' : 'Lead',
                                'action' : 'apply_class',
                                'value' : 'lead'
                            },
                            fdstat : {
                                'type' : 'checkbox',
                                'name' : 'Statistics',
                                'action' : 'apply_class',
                                'value' : 'stat'
                            }
                        }
                    },
                    'fdlayout' : {
                        name: 'Layout',
                        fields: {
                            fdfloat : {
                                'type' : 'select',
                                'name' : 'Float',
                                'action' : 'apply_class',
                                'show_empty' : true,
                                'options' : [
                                    {
                                        'key' : 'float-center',
                                        'name' : 'Center'
                                    },
                                    {
                                        'key' : 'float-left',
                                        'name' : 'Left'
                                    },
                                    {
                                        'key' : 'float-right',
                                        'name' : 'Right'
                                    }
                                ]
                            },
                            fdclearfix : { //ok
                                'type' : 'checkbox',
                                'name' : 'Clear floats',
                                'action' : 'apply_class',
                                'value' : 'clearfix'
                            }
                            // fdcorners : {
                            //     'type' : 'select',
                            //     'name' : 'Corners',
                            //     'action' : 'apply_class',
                            //     'show_empty' : true,
                            //     'options' : [
                            //         {
                            //             'key' : 'radius',
                            //             'name' : 'Radius'
                            //         },
                            //         {
                            //             'key' : 'round',
                            //             'name' : 'Round'
                            //         }
                            //     ]
                            // }
                        }
                    },
                    'fdvisible' : {
                        name: 'Visibility & Responsiveness',
                        fields: {
                            fdhide : { //ok
                                'type' : 'checkbox',
                                'name' : 'Hide',
                                'action' : 'apply_class',
                                'value' : 'hide'
                            },
                            'fdresponsive-small' : createResponsiveSelect('Small', 'small'),
                            'fdresponsive-medium' : createResponsiveSelect('Medium', 'medium'),
                            'fdresponsive-large' : createResponsiveSelect('Large', 'large'),
                            fdorientation : {
                                'type' : 'select',
                                'name' : 'Show for orientation',
                                'action' : 'apply_class',
                                'show_empty' : true,
                                'options' : [
                                    {
                                        'key' : 'show-for-landscape',
                                        'name' : 'Landscape'
                                    },
                                    {
                                        'key' : 'show-for-portrait',
                                        'name' : 'Portrait'
                                    }
                                ]
                            },
                            // fdtouch : {
                            //     'type' : 'select',
                            //     'name' : 'Show for touch',
                            //     'action' : 'apply_class',
                            //     'show_empty' : true,
                            //     'options' : [
                            //         {
                            //             'key' : 'show-for-touch',
                            //             'name' : 'Show'
                            //         },
                            //         {
                            //             'key' : 'hide-for-touch',
                            //             'name' : 'Hide'
                            //         }
                            //     ]
                            // },
                            fdinvisible : {
                                'type' : 'checkbox',
                                'name' : 'Invisible',
                                'action' : 'apply_class',
                                'value' : 'invisible'
                            },
                            fdinterchange : {
                                'type' : 'text',
                                'name' : 'Interchange',
                                'action' : 'custom',
                                live_update : false,
                                set_value : function(obj, value, values, oldValue, eventType) {
                                    var $el = obj.data;
                                    var pgel = new pgQuery($el);
                                    pgel.attr('data-interchange', value);
                                    showOrbitMessage();
                                    return value;
                                },
                                get_value: function(obj) {
                                    var $el = obj.data;
                                    var pgel = new pgQuery($el);
                                    return pgel.attr('data-interchange');
                                }
                            },
                            fddataoptions : {
                                'type' : 'text',
                                'name' : 'Data options',
                                'action' : 'custom',
                                set_value : function(obj, value, values, oldValue, eventType) {
                                    var $el = obj.data;
                                    var pgel = new pgQuery($el);
                                    pgel.attr('data-options', value);
                                    reflowPage($el);
                                    return value;
                                },
                                get_value: function(obj) {
                                    var $el = obj.data;
                                    var pgel = new pgQuery($el);
                                    return pgel.attr('data-options');
                                }
                            },
                            fddataopen : {
                                'type' : 'text',
                                'name' : 'Data open',
                                'action' : 'custom',
                                live_update : false,
                                set_value : function(obj, value, values, oldValue, eventType) {
                                    var $el = obj.data;
                                    var pgel = new pgQuery($el);
                                    pgel.attr('data-open', value);
                                    reflowPage($el);
                                    return value;
                                },
                                get_value: function(obj) {
                                    var $el = obj.data;
                                    var pgel = new pgQuery($el);
                                    return pgel.attr('data-open');
                                }
                            },
                            fddatatoggle : {
                                'type' : 'text',
                                'name' : 'Data toggle',
                                'action' : 'custom',
                                live_update : false,
                                set_value : function(obj, value, values, oldValue, eventType) {
                                    var $el = obj.data;
                                    var pgel = new pgQuery($el);
                                    pgel.attr('data-toggle', value);
                                    reflowPage($el);
                                    return value;
                                },
                                get_value: function(obj) {
                                    var $el = obj.data;
                                    var pgel = new pgQuery($el);
                                    return pgel.attr('data-toggle');
                                }
                            },
                            fddatatoggler : {
                                'type' : 'text',
                                'name' : 'Data toggler',
                                'action' : 'custom',
                                live_update : false,
                                set_value : function(obj, value, values, oldValue, eventType) {
                                    var $el = obj.data;
                                    var pgel = new pgQuery($el);
                                    pgel.attr('data-toggler', value);
                                    reflowPage($el);
                                    return value;
                                },
                                get_value: function(obj) {
                                    var $el = obj.data;
                                    var pgel = new pgQuery($el);
                                    return pgel.attr('data-toggler');
                                }
                            },
                            fddatatoggler : {
                                'type' : 'text',
                                'name' : 'Data animation',
                                'action' : 'custom',
                                live_update : false,
                                set_value : function(obj, value, values, oldValue, eventType) {
                                    var $el = obj.data;
                                    var pgel = new pgQuery($el);
                                    pgel.attr('data-animate', value);
                                    reflowPage($el);
                                    return value;
                                },
                                get_value: function(obj) {
                                    var $el = obj.data;
                                    var pgel = new pgQuery($el);
                                    return pgel.attr('data-animate');
                                }
                            },
                            fdmagellandest : {
                                'type' : 'text',
                                'name' : 'Magellan target',
                                'action' : 'custom',
                                live_update : false,
                                set_value : function(obj, value, values, oldValue, eventType) {
                                    var $el = obj.data;
                                    var pgel = new pgQuery($el);
                                    pgel.attr('data-magellan-target', value);
                                    reflowPage($el);
                                    return value;
                                },
                                get_value: function(obj) {
                                    var $el = obj.data;
                                    var pgel = new pgQuery($el);
                                    return pgel.attr('data-magellan-target');
                                }
                            },
                            fdcloseable : {
                                'type' : 'text',
                                'name' : 'Closeable',
                                'action' : 'element_attribute',
                                'attribute' : 'data-closable'
                            },
                            fdclose : {
                                'type' : 'checkbox',
                                'name' : 'Close',
                                'value' : '1',
                                'action' : 'element_attribute',
                                'attribute' : 'data-close',
                                get_value : function (obj) {
                                    var $el = obj.data;
                                    var pgel = new pgQuery($el);
                                    return pgel.hasAttr('data-close') ? '1' : null;
                                },
                                set_value : function(obj, value, values, oldValue, eventType) {
                                    var $el = obj.data;
                                    var pgel = new pgQuery($el);
                                    if (value == '1') {
                                        pgel.attr('data-close', '');
                                    }
                                    else {
                                        pgel.removeAttr('data-close');
                                    }
                                    return value;
                                }
                            },
                            fdequalizer : {
                                'type' : 'checkbox',
                                'name' : 'Equalizer watch',
                                'action' : 'custom',
                                'value' : '1',
                                get_value : function (obj) {
                                    var $el = obj.data;
                                    return new pgQuery($el).hasAttr('data-equalizer');
                                },
                                set_value: function(obj, value, values, oldValue, eventType) {
                                    var $el = obj.data;
                                    var pgel = new pgQuery($el);

                                    if (value == '1') {
                                        pgel.attr('data-equalizer', '');
                                    }
                                    else {
                                        pgel.removeAttr('data-equalizer');
                                    }

                                    return value;
                                }
                            },
                            fdequalizerfor : {
                                'type' : 'text',
                                'name' : 'Equalize for',
                                'action' : 'element_attribute',
                                'attribute' : 'data-equalizer'
                            },
                            fdequalizerwatcher : {
                                'type' : 'checkbox',
                                'name' : 'Equalizer watch',
                                'action' : 'custom',
                                'value' : '1',
                                get_value : function (obj) {
                                    var $el = obj.data;
                                    return new pgQuery($el).hasAttr('data-equalizer-watch');
                                },
                                set_value: function(obj, value, values, oldValue, eventType) {
                                    var $el = obj.data;
                                    var pgel = new pgQuery($el);

                                    if (value == '1') {
                                        pgel.attr('data-equalizer-watch', '');
                                    }
                                    else {
                                        pgel.removeAttr('data-equalizer-watch');
                                    }

                                    return value;
                                }
                            },
                            fdequalizerwatcherfor : {
                                'type' : 'text',
                                'name' : 'Equalizer watch for',
                                'action' : 'element_attribute',
                                'attribute' : 'data-equalizer-watch'
                            },
                            fdstickycontainer : {
                                'type' : 'checkbox',
                                'name' : 'Sticky container',
                                'value' : '1',
                                'action' : 'custom',
                                get_value : function (obj) {
                                    var $el = obj.data;
                                    var pgel = new pgQuery($el);

                                    return pgel.hasAttr('data-sticky-container');
                                },
                                set_value : function(obj, value, values, oldValue, eventType) {
                                    var $el = obj.data;
                                    var pgel = new pgQuery($el);

                                    if (value == '1') {
                                        pgel.attr('data-sticky-container', '');
                                    }
                                    else {
                                        pgel.removeAttr('data-sticky-container');
                                    }
                                    return value;
                                }
                            },
                            fdsticky : {
                                'type' : 'checkbox',
                                'name' : 'Sticky',
                                'action' : 'custom',
                                'value' : '1',
                                get_value : function (obj) {
                                    var $el = obj.data;
                                    var pgel = new pgQuery($el);

                                    return pgel.hasAttr('data-sticky');
                                },
                                set_value : function(obj, value, values, oldValue, eventType) {
                                    var $el = obj.data;
                                    var pgel = new pgQuery($el);

                                    if (value == '1') {
                                        pgel.attr('data-sticky', '');
                                        pgel.addClass('data-sticky');
                                    }
                                    else {
                                        pgel.removeAttr('data-sticky');
                                        pgel.removeClass('data-sticky');
                                    }
                                    return value;
                                }
                            }
                        }
                    },
                    'fdaccessible' : {
                        name: 'Accessibility',
                        fields: {
                            fdscreenonly : { //ok
                                'type' : 'checkbox',
                                'name' : 'Show only for screen readers',
                                'action' : 'apply_class',
                                'value' : 'show-for-sr'
                            },
                            fdhideforscreen : { //ok
                                'type' : 'checkbox',
                                'name' : 'Hide for screen readers',
                                'action' : 'element_attribute',
                                attribute: 'aria-hidden',
                                'value' : 'true'
                            },
                            fdshowonfocus : { //ok
                                'type' : 'checkbox',
                                'name' : 'Show on focus',
                                'action' : 'apply_class',
                                'value' : 'show-on-focus'
                            },
                            'fdrprint-small' : createResponsiveSelect('Print', 'pint', 'visible-for-', 'Visible ', 'hidden-for-', 'Hidden '),
                            'fdraccess-medium' : createResponsiveSelect('Medium', 'medium', 'visible-for-', 'Visible ', 'hidden-for-', 'Hidden '),
                            'fdraccess-large' : createResponsiveSelect('Large', 'large', 'visible-for-', 'Visible ', 'hidden-for-', 'Hidden '),
                            'fdresponsivetoggle' : {
                                'type' : 'text',
                                'name' : 'Responsive toggle',
                                'action' : 'element_attribute',
                                'attribute' : 'data-responsive-toggle'
                            }
                        }
                    }
                };

                var before = {
                    css : {
                        //inherit this from html framework
                        inherit: true
                    }
                }

                var list = {};

                $.each(addTo, function(k,v) {
                    list[k] = v;
                });

                $.each(before, function(k,v) {
                    list[k] = v;
                });



                $.each(s, function(k,v) {
                    list[k] = v;
                });
                return list;
            }

            var showOrbitMessage = function() {
                crsaQuickMessage('Refresh the page (Page -&gt; Refresh / CMD + R) to activate changes.', 2000, true);
            }
        // End Helper methods


        // Row & Columns
            // Columns helpers
            var createColumnSpans = function(name, base, empty) {
                var span_select = {
                    'type' : 'select',
                    'name' : null,
                    'action' : 'apply_class',
                    'show_empty' : empty,
                    'options' : []
                }
                for(var n = 1; n <= 12; n++) {
                    span_select.options.push({key: base + '-' + n, name: n});
                }
                return span_select;
            }

            var createResponsiveSelect = function(name, size, prefix, prefix_name, prefix_hide, prefix_hide_name) {
                if(!prefix) prefix = 'show-for-';
                if(!prefix_name) prefix_name = 'Show ';
                if(!prefix_hide) prefix_hide = 'hide-for-';
                if(!prefix_hide_name) prefix_hide_name = 'Hide ';
                var span_select = {
                    'type' : 'select',
                    'name' : name,
                    'action' : 'apply_class',
                    'show_empty' : true,
                    'options' : [
                        {key: prefix + size, name: prefix_name + size + ' & up'},
                        {key: prefix + size + '-only', name: prefix_name + size + ' only'},
                        {key: prefix_hide + size, name: prefix_hide_name + size + ' & up'},
                        {key: prefix_hide + size + '-only', name: prefix_hide_name + size + ' only'}
                    ]
                }
                if(size == 'small') {
                    span_select.options.splice(0,1);
                    span_select.options.splice(1,1);
                }
                return span_select;
            }

            var createResponsiveTextAlign = function(name, size) {
                var span_select = {
                    'type' : 'select',
                    'name' : name,
                    'action' : 'apply_class',
                    'show_empty' : true,
                    'options' : [
                        {key: size + '-text-left', name: 'Left'},
                        {key: size + '-text-right', name: 'Right'},
                        {key: size + '-text-center', name: 'Center'},
                        {key: size + '-text-justify', name: 'Justify'},
                        {key: size + '-only-text-left', name: 'Left (only ' + size + ')'},
                        {key: size + '-only-text-right', name: 'Right (only ' + size + ')'},
                        {key: size + '-only-text-center', name: 'Center (only ' + size + ')'},
                        {key: size + '-only-text-justify', name: 'Justify (only ' + size + ')'}
                    ]
                }
                if(size == 'xxlarge') {
                    span_select.options.splice(4,4);
                }
                return span_select;
            }

            function getGridPreview(t) {
                return '<div class="container preview-' + t + '">\
                <div class="row sel">\
                    <div class="col-xs-4 sel"><div></div></div>\
                    <div class="col-xs-4"><div></div></div>\
                    <div class="col-xs-4"><div></div></div>\
                </div>\
                <div class="row">\
                    <div class="col-xs-4"><div></div></div>\
                    <div class="col-xs-4"><div></div></div>\
                    <div class="col-xs-4"><div></div></div>\
                </div>\
                </div>';
            };

            // Row
            f.addComponentType({
                'type' : 'fd-row',
                'selector' : '.row',
                tags: 'major',
                preview: getGridPreview('row'),
                'code' : '<div class="row"></div>',
                'drag_helper' : '<div class="row pg-empty-placeholder"></div>',
                empty_placeholder : true,
                'name' : 'Row',
                action_menu : {
                    add: ['fd-column', 'fd-clear']
                },
                'sections' : crsaAddStandardSections({
                    'fdrow' : {
                        name : 'Row options',
                        fields : {
                            'fdinline' : {
                                'type' : 'checkbox',
                                'name' : 'Collapse',
                                'value' : 'collapse',
                                'action' : 'apply_class'
                            },
                            fdsmallcollapse : {
                                'type' : 'select',
                                'name' : 'Small collapse',
                                'action' : 'apply_class',
                                'show_empty' : true,
                                'options' : [
                                    {key: 'small-collapse', name: 'Collapsed'},
                                    {key: 'small-uncollapse', name: 'Uncollapse'}
                                ]
                            },
                            fdmediumcollapse : {
                                'type' : 'select',
                                'name' : 'Medium collapse',
                                'action' : 'apply_class',
                                'show_empty' : true,
                                'options' : [
                                    {key: 'medium-collapse', name: 'Collapsed'},
                                    {key: 'medium-uncollapse', name: 'Uncollapse'}
                                ]
                            },
                            fdlargecollapse : {
                                'type' : 'select',
                                'name' : 'Large collapse',
                                'action' : 'apply_class',
                                'show_empty' : true,
                                'options' : [
                                    {key: 'large-collapse', name: 'Collapsed'},
                                    {key: 'large-uncollapse', name: 'Uncollapse'}
                                ]
                            }
                        }
                    }
                })
            });

            // Column clear
            f.addComponentType({
                'type' : 'fd-clear',
                'selector' : 'div.clear-columns',
                'code' : '<div class="clearfix clear-columns"></div>',
                'drag_helper' : '<div class="pg-empty-placeholder"></div>',
                'name' : 'Clear columns',
                'sections' : crsaAddStandardSections({})
            });

            // Column
            f.addComponentType({
                'type' : 'fd-column',
                tags: 'major',
                'selector' : function($el) {
                    if($el.is('.column,.columns')) return true;
                    return false;
                },
                preview: getGridPreview('column'),
                parent_selector: '.row',
                invalid_drop_msg : 'Put <b>Column</b> in a <b>Row</b>. If you want to put it somewhere else, drop it on the tree.',
                'code' : '<div class="medium-4 columns"><h3>Column title</h3>\
                    <p>Cras justo odio, dapibus ac facilisis in, egestas eget quam. Donec id elit non mi porta gravida at eget metus. Nullam id dolor id nibh ultricies vehicula ut id elit.</p>\
                </div>',
                'empty_placeholder' : true,
                action_menu : {
                    add: ['fd-row', 'html-h3', 'html-p', 'html-img']
                },
                'name' : 'Column',
                'inline_edit' : true,
                'sections' : crsaAddStandardSections({
                    fdcollayout : {
                        name : "Grid",
                        fields : {
                            fdcollayout_control: {
                                type: 'custom',
                                name: 'layout_control',
                                action: 'none',
                                show: function($dest, obj, fn, fdef, values) {
                                    var sizes = ["small", "medium", "large"];
                                    var fields = ["", "-offset", "-push", "-pull"];
                                    var field_names = ["Span&nbsp;", "Offs&nbsp;", "Push&nbsp;", "Pull&nbsp;"];
                                    var field_keys = ["span_", "offset_", "push_", "pull_"];
                                    var $table = $("<table/>", {class: 'grid-control columns-control'}).appendTo($dest);
                                    var $row = $("<tr/>").html("<td></td><td><label>Sm</label></td><td><label>Md</label></td><td><label>Lg</label></td>").appendTo($table);

                                    for(var n = 0; n < fields.length; n++) {
                                        $row = $("<tr/>").appendTo($table);
                                        var $td = $("<td/>").html('<label>' + field_names[n] + '</label>').appendTo($row);
                                        for(var m = 0; m < sizes.length; m++) {
                                            $td = $("<td/>").appendTo($row).css('width', '56px');

                                            var field = field_keys[n] + sizes[m];
                                            $.fn.crsa("addInputField", $td, obj, field, createColumnSpans(field_names[n], sizes[m] + fields[n], true), values);
                                            //$td.append('&nbsp;');
                                        }
                                    }
                                }
                            },
                            fdlast : {
                                'type' : 'checkbox',
                                'name' : 'Last in row',
                                'action' : 'apply_class',
                                'value' : 'end'
                            },
                            fdsmallcenter : {
                                'type' : 'select',
                                'name' : 'Small centered',
                                'action' : 'apply_class',
                                'show_empty' : true,
                                'options' : [
                                    {key: 'small-centered', name: 'Centered'},
                                    {key: 'small-uncenter', name: 'Uncenter'}
                                ]
                            },
                            fdlargecenter : {
                                'type' : 'select',
                                'name' : 'Large centered',
                                'action' : 'apply_class',
                                'show_empty' : true,
                                'options' : [
                                    {key: 'large-centered', name: 'Centered'},
                                    {key: 'large-uncenter', name: 'Uncentered'}
                                ]
                            }
                        }
                    },
                    layout_phone : {
                        name : 'Phone',
                        show : false,
                        fields : {
                            span_small : createColumnSpans("Span", "small", true),
                            offset_small : createColumnSpans("Offs", "small-offset", true),
                            push_small : createColumnSpans("Push", "small-push", true),
                            pull_small : createColumnSpans("Pull", "small-pull", true),
                            span_medium : createColumnSpans("Span", "medium", true),
                            offset_medium : createColumnSpans("Offs", "medium-offset", true),
                            push_medium : createColumnSpans("Push", "medium-push", true),
                            pull_medium : createColumnSpans("Pull", "medium-pull", true),
                            span_large : createColumnSpans("Span", "large", true),
                            offset_large : createColumnSpans("Offs", "large-offset", true),
                            push_large : createColumnSpans("Push", "large-push", true),
                            pull_large : createColumnSpans("Pull", "large-pull", true)
                        }
                    }
                })
            });

            // Block columns item
            f.addComponentType({
                'type' : 'fd-block-column-item',
                'code' : '<div class="column">\
                    <img src="' + getPlaceholderImage() + '" class="thumbnail" alt="">\
                </div>',
                'name' : 'Block column item',
                'sections' : crsaAddStandardSections({
                })
            });

            // Block columns
            f.addComponentType({
                'type' : 'fd-block-column',
                tags: 'major',
                'selector' : function($el) {
                    var cls = $el.attr('class');
                    if(cls) {
                        if(cls.match(/\-up\-/i)) return true;
                    }
                    return false;
                },
                'code' : '<div class="row small-up-3">\
                    <div class="column">\
                      <img src="' + getPlaceholderImage() + '" class="thumbnail" alt="">\
                    </div>\
                    <div class="column">\
                      <img src="' + getPlaceholderImage() + '" class="thumbnail" alt="">\
                    </div>\
                    <div class="column">\
                      <img src="' + getPlaceholderImage() + '" class="thumbnail" alt="">\
                    </div>\
                </div>',
                'empty_placeholder' : false,
                priority: 100,
                'name' : 'Block columns',
                'inline_edit' : true,
                action_menu : {
                    add: ['fd-block-column-item']
                },
                'sections' : crsaAddStandardSections({
                    layout : {
                        name : "Layout",
                        fields : {
                            fdlayout_control: {
                                type: 'custom',
                                name: 'layout_control',
                                action: 'none',
                                show: function($dest, obj, fn, fdef, values) {
                                    var sizes = ["small", "medium", "large"];
                                    var $table = $("<table/>", {class: 'grid-control columns-control'}).appendTo($dest);
                                    var $row = $("<tr/>").html("<td></td><td><label>Sm</label></td><td><label>Md</label></td><td><label>Lg</label></td>").appendTo($table);

                                    $row = $("<tr/>").appendTo($table).html('<td><label>Items / Row&nbsp;</label></td>');
                                    for(var m = 0; m < sizes.length; m++) {
                                        var $td = $("<td/>").appendTo($row);

                                        var field = 'fdblockgrid_' + sizes[m];
                                        $.fn.crsa("addInputField", $td, obj, field, createColumnSpans('name', sizes[m] + '-up', true), values);
                                    }

                                }
                            }
                        }
                    },
                    layout_phone : {
                        name : 'Phone',
                        show : false,
                        fields : {
                            fdblockgrid_small : createColumnSpans("Span", "small-up", true),
                            fdblockgrid_medium : createColumnSpans("Span", "medium-up", true),
                            fdblockgrid_large : createColumnSpans("Span", "large-up", true)
                        }
                    }
                })
            });
        // End Row & Columns


        // Offcanvas
            // Offcanvas content
            f.addComponentType({
                'type' : 'fd-offcanvas-content',
                'selector' : '.off-canvas-content',
                'code' : '<div class="off-canvas-content" data-off-canvas-content></div>',
                'name' : 'Offcanvas content',
                'tags' : 'major',
                on_inserted : function() {
                    showOrbitMessage();
                },
                'sections' : crsaAddStandardSections({})
            });

            // Offcanvas inner wraper
            f.addComponentType({
                'type' : 'fd-offcanvas-inner-wraper',
                'selector' : '.off-canvas-wrapper-inner',
                'code' : '<div class="off-canvas-wrapper-inner" data-off-canvas-wrapper>\
                    <div class="off-canvas position-left" id="offCanvas" data-off-canvas>\
                        <ul>\
                            <li>Lorem ipsum dolor sit amet</li>\
                            <li>Phasellus iaculis neque</li>\
                            <li>Purus sodales ultricies</li>\
                        </ul>\
                    </div>\
                    <div class="off-canvas-content" data-off-canvas-content></div>\
                </div>',
                'name' : 'Offcanvas inner wrapper',
                'tags' : 'major',
                action_menu : {
                    add: ['fd-offcanvas-content', 'fd-offcanvas']
                },
                on_inserted : function() {
                    showOrbitMessage();
                },
                'sections' : crsaAddStandardSections({})
            });

            // Offcanvas
            f.addComponentType({
                'type' : 'fd-offcanvas',
                'selector' : '.off-canvas',
                'code' : function ($el) {
                    var id = getUniqueId("offcanvas");
                    return '<div class="off-canvas position-left" id="' + id + '" data-off-canvas></div>';
                },
                'tags' : 'major',
                'name' : 'Offcanvas',
                on_inserted : function() {
                    showOrbitMessage();
                },
                'sections' : crsaAddStandardSections({
                    'fdstyle' : {
                        'name' : 'Offcanvas options',
                        'fields' : {
                            'fdposition': {
                                'type' : 'select',
                                'name' : 'Position',
                                'options' : [
                                    { 'key' : 'left', 'name' : 'Left' },
                                    { 'key' : 'right', 'name' : 'Right' }
                                ],
                                'action' : 'custom',
                                get_value : function (obj) {
                                    var $el = obj.data;

                                    if ($el.hasClass('position-left')) {
                                        return 'left';
                                    }
                                    else if ($el.hasClass('position-right')) {
                                        return 'right';
                                    }
                                },
                                set_value : function(obj, value, values, oldValue, eventType) {
                                    var $el = obj.data;
                                    var pgel = new pgQuery($el);

                                    pgel.removeClass('position-left');
                                    pgel.removeClass('position-right');

                                    if (value) {
                                        pgel.addClass('position-'+value);
                                        pgel.attr('data-position', value);
                                    }
                                    else {
                                        pgel.removeAttr('data-position');
                                    }

                                    return value;
                                }
                            },
                            'fdreveal' : {
                                'type' : 'select',
                                'name' : 'Reveal',
                                'show_empty' : true,
                                'options' : [
                                    { 'key' : 'reveal-for-medium', 'name' : 'Reveal for medium' },
                                    { 'key' : 'reveal-for-large', 'name' : 'Reveal for large' }
                                ],
                                'action' : 'apply_class'
                            }
                        }
                    }
                })
            });

            // Offcanvas wrapper
            f.addComponentType({
                'type' : 'fd-offcanvas-wraper',
                'selector' : '.off-canvas-wrapper',
                'code' : function ($el) {
                    var id = getUniqueId("offcanvas");
                    return '<div class="off-canvas-wrapper">\
                        <div class="off-canvas-wrapper-inner" data-off-canvas-wrapper>\
                            <div class="off-canvas position-left" id="' + id + '" data-off-canvas></div>\
                            <div class="off-canvas-content" data-off-canvas-content>\
                                <ul>\
                                    <li>Lorem ipsum dolor sit amet</li>\
                                    <li>Phasellus iaculis neque</li>\
                                    <li>Purus sodales ultricies</li>\
                                </ul>\
                            </div>\
                        </div>\
                    </div>';
                },
                'tags' : 'major',
                action_menu : {
                    add: ['fd-offcanvas-inner-wraper']
                },
                'name' : 'Offcanvas wrapper',
                tags: 'major',
                on_inserted : function() {
                    showOrbitMessage();
                },
                'sections' : crsaAddStandardSections({})
            });

            // Offcanvas wrapper topbar
            f.addComponentType({
                'type' : 'fd-offcanvas-wraper-topbar',
                'code' : function ($el) {
                    var id1 = getUniqueId("offcanvas");
                    var id2 = getUniqueId("offcanvas");

                    return '<div class="off-canvas-wrapper">\
                        <div class="off-canvas-wrapper-inner" data-off-canvas-wrapper>\
                            <div class="off-canvas position-left" id="' + id1 + '" data-off-canvas data-position="left">\
                                <ul>\
                                    <li>Lorem ipsum dolor sit amet</li>\
                                    <li>Phasellus iaculis neque</li>\
                                    <li>Purus sodales ultricies</li>\
                                </ul>\
                            </div>\
                            <div class="off-canvas position-right" id="' + id2 + '" data-off-canvas data-position="right">\
                                <ul>\
                                    <li>Lorem ipsum dolor sit amet</li>\
                                    <li>Phasellus iaculis neque</li>\
                                    <li>Purus sodales ultricies</li>\
                                </ul>\
                            </div>\
                            <div class="off-canvas-content" data-off-canvas-content>\
                            <div class="title-bar">\
                                <div class="title-bar-left">\
                                    <button class="menu-icon" type="button" data-open="' + id1 + '"></button>\
                                    <span class="title-bar-title">Foundation</span>\
                                </div>\
                                <div class="title-bar-right">\
                                    <button class="menu-icon" type="button" data-open="' + id2 + '"></button>\
                                </div>\
                            </div>\
                        </div>\
                    </div>';
                },
                'name' : 'Offcanvas topbar',
                tags: 'major',
                on_inserted : function() {
                    showOrbitMessage();
                },
                'sections' : crsaAddStandardSections({})
            });

            // Offcanvas toggle
            f.addComponentType({
                'type' : 'fd-offcanvas-toggle',
                'selector' : '[data-toggle]',
                'code' : '<button type="button" class="button" data-toggle="offCanvas">Open Menu</button>',
                'name' : 'Offcanvas button',
                tags: 'major',
                on_inserted : function() {
                    showOrbitMessage();
                },
                'sections' : crsaAddStandardSections({})
            });
        // End Offcanvas


        // Topbar
            // Topbar form
            f.addComponentType({
                'type' : 'fd-topbar-form',
                'selector' : null,
                'code' : '<li class="has-form">\
                    <div class="row collapse">\
                <div class="large-8 small-9 columns">\
                    <input type="text" placeholder="Find Stuff">\
                    </div>\
                    <div class="large-4 small-3 columns">\
                        <a href="#" class="alert button expanded">Search</a>\
                    </div>\
                </div>\
                </li>',
                'name' : 'Top bar form',
                'sections' : crsaAddStandardSections({
                })
            });

            // Topbar button
            f.addComponentType({
                'type' : 'fd-topbar-button',
                'selector' : null,
                'code' : '<li class="has-form">\
                    <a href="#" class="button">Get Lucky</a>\
                </li>',
                'name' : 'Button',
                'sections' : crsaAddStandardSections({
                })
            });

            // Topbar link
            f.addComponentType({
                'type' : 'fd-topbar-link',
                'selector' : null,
                'code' : '<li>\
                    <a href="#">Get Lucky</a>\
                </li>',
                'name' : 'Link',
                'sections' : crsaAddStandardSections({
                })
            });

            // Topbar dropdown
            f.addComponentType({
                'type' : 'fd-topbar-dropdown',
                'selector' : null,
                'code' : '<li>\
                    <ul class="dropdown menu" data-dropdown-menu>\
                        <li class="has-submenu">\
                            <a href="#">Dropdown</a>\
                            <ul class="submenu menu vertical" data-submenu>\
                                <li><a href="#">One</a></li>\
                                <li><a href="#">Two</a></li>\
                                <li><a href="#">Three</a></li>\
                            </ul>\
                        </li>\
                    </ul>\
                </li>',
                'name' : 'Dropdown',
                'sections' : crsaAddStandardSections({
                })
            });

            // Topbar content (onAdd helper)
            var onNewElmAddedToTopbarContent = function($el, $new, newdef, prepend) {
                var pgel = new pgQuery($el);
                var getSection = function() {
                    var $s = $el.find('>ul');
                    var pgs = new pgQuery($s);
                    if($s.length == 0) {
                        pgs = new pgQuery().create('<ul class="menu"></ul>');
                        pgel.append(pgs);
                    }
                    return pgs;
                }

                if(newdef.type == 'fd-topbar-form' ||
                   newdef.type == 'fd-topbar-link' ||
                   newdef.type == 'fd-topbar-button') {
                    var pgnew = new pgQuery($new);

                    if(prepend) {
                        getSection().prepend(pgnew);
                    } else {
                        getSection().append(pgnew);
                    }
                }
                else if (newdef.type == 'fd-topbar-dropdown') {
                    var pgDropdown = pgel.find('>[data-dropdown-menu]');
                    var pgnew;
                    if (pgDropdown.length > 0) {
                        pgnew = new pgQuery($new.find('li.has-submenu'));
                    }
                    else {
                        pgnew = new pgQuery($new);
                    }

                    if(prepend) {
                        getSection().prepend(pgnew);
                    } else {
                        getSection().append(pgnew);
                    }

                    showOrbitMessage();
                }
            }

            // Topbar left content
            f.addComponentType({
                'type' : 'fd-topbar-left-content',
                'selector' : '.top-bar-left',
                priority: 100,
                'code' : '<div class="top-bar-left">\
                    <ul class="menu">\
                        <li><a href="#">Left Nav Button</a></li>\
                    </ul>\
                </div>',
                name : "Top bar left content",
                tags : 'major',
                action_menu: {
                    add: ['fd-topbar-form', 'fd-topbar-link', 'fd-topbar-button', 'fd-topbar-dropdown'],
                    on_add : onNewElmAddedToTopbarContent
                },
                'sections' : crsaAddStandardSections({
                    layout : {
                        name : "Layout",
                        fields : {
                            fdposition: {
                                type: 'select',
                                name: 'Position',
                                action: 'apply_class',
                                show_empty : true,
                                options : [
                                    {key: 'top-bar-left', name: 'Left'},
                                    {key: 'top-bar-right', name: 'Right'}
                                ]
                            }
                        }
                    }
                })
            });

            // Topbar right content
            f.addComponentType({
                'type' : 'fd-topbar-right-content',
                'selector' : '.top-bar-right',
                priority: 100,
                'code' : '<div class="top-bar-right">\
                    <ul class="menu">\
                        <li><a href="#">Left Nav Button</a></li>\
                    </ul>\
                </div>',
                name : "Top bar right content",
                tags : 'major',
                action_menu: {
                    add: ['fd-topbar-form', 'fd-topbar-link', 'fd-topbar-button', 'fd-topbar-dropdown'],
                    on_add : onNewElmAddedToTopbarContent
                },
                'sections' : crsaAddStandardSections({
                    layout : {
                        name : "Layout",
                        fields : {
                            fdposition: {
                                type: 'select',
                                name: 'Position',
                                action: 'apply_class',
                                show_empty : true,
                                options : [
                                    {key: 'top-bar-left', name: 'Left'},
                                    {key: 'top-bar-right', name: 'Right'}
                                ]
                            }
                        }
                    }
                })
            });

            // Topbar title
            f.addComponentType({
                'type' : 'fd-topbar-title',
                'selector' : function($el) {
                    return $el.is('.title-area');
                },
                'code' : '<div class="top-bar-left">\
                    <ul class="menu">\
                        <li class="menu-text">Site Title</li>\
                    </ul>\
                </div>',
                'name' : 'Title area',
                'sections' : crsaAddStandardSections({
                })
            });

            // Topbar
            f.addComponentType({
                'type' : 'fd-topbar',
                'selector' : '.top-bar',
                'code' : '<div class="top-bar">\
                    <div class="top-bar-left">\
                        <ul class="dropdown menu" data-dropdown-menu>\
                            <li class="menu-text">Site Title</li>\
                            <li class="has-submenu">\
                                <a href="#">One</a>\
                                <ul class="submenu menu vertical" data-submenu>\
                                    <li><a href="#">One</a></li>\
                                    <li><a href="#">Two</a></li>\
                                    <li><a href="#">Three</a></li>\
                                </ul>\
                            </li>\
                            <li><a href="#">Two</a></li>\
                            <li><a href="#">Three</a></li>\
                        </ul>\
                    </div>\
                    <div class="top-bar-right">\
                        <ul class="menu">\
                            <li><input type="search" placeholder="Search"></li>\
                            <li><button type="button" class="button">Search</button></li>\
                        </ul>\
                    </div>\
                </div>',
                'name' : 'Top bar',
                tags: 'major',
                action_menu: {
                    add: ['fd-topbar-title', 'fd-topbar-left-content', 'fd-topbar-right-content']
                },
                'sections' : crsaAddStandardSections({
                })
            });
        // End Topbar


        // Sticky
            f.addComponentType({
                'type' : 'fd-sticky',
                'selector' : '[data-sticky]',
                'name' : 'Sticky',
                'priority' : 99,
                'sections' : crsaAddStandardSections({
                    'fdstyle' : {
                        'name' : 'Sticky options',
                        'fields' : {
                            'fdanchortop' : {
                                'type' : 'text',
                                'name' : 'Data anchor top',
                                'action' : 'element_attribute',
                                'attribute' : 'data-top-anchor'
                            },
                            'fdanchorbottom' : {
                                'type' : 'text',
                                'name' : 'Data anchor bottom',
                                'action' : 'element_attribute',
                                'attribute' : 'data-btm-anchor'
                            }
                        }
                    }
                })
            })
        // End Sticky


        // Iconbar
            f.addComponentType({
                'type' : 'fd-iconbar',
                'code' : '<ul class="menu icon-top">\
                  <li><a href="#"><i class="fi-list"></i> <span>One</span></a></li>\
                  <li><a href="#"><i class="fi-list"></i> <span>Two</span></a></li>\
                  <li><a href="#"><i class="fi-list"></i> <span>Three</span></a></li>\
                  <li><a href="#"><i class="fi-list"></i> <span>Four</span></a></li>\
                </ul>',
                'name' : 'Icon bar',
                tags: 'major',
                'sections' : crsaAddStandardSections({
                })
            });
        // End Iconbar


        // Breadcrumbs
            // Breadcrumb item
            f.addComponentType({
                'type' : 'fd-bc-item',
                'selector' : function($el) {
                    if($el.parent().is('.breadcrumbs')) {
                        return true;
                    }
                    return false;
                },
                'code' : '<li><a href="#">Item</a></li>',
                'name' : 'Breadcrumbs item',
                priority: 99,
                'sections' : crsaAddStandardSections({
                    'fdbcstyle' : {
                        name : 'Status',
                        fields : {
                            'percent' : {
                                'type' : 'select',
                                'name' : 'Status',
                                'action' : 'custom',
                                'show_empty' : true,
                                'options' : [
                                    {
                                        'key' : 'current',
                                        'name' : 'Current'
                                    },
                                    {
                                        'key' : 'disabled',
                                        'name' : 'Disabled'
                                    }
                                ],
                                'get_value' : function (obj) {
                                    var $el = obj.data;
                                    if ($el.attr('class')) {
                                        var classArr = $el.attr('class').split(' ');
                                        if (classArr.indexOf('current') > -1) {
                                            return 'current';
                                        } else if (classArr.indexOf('disabled') > -1) {
                                            return 'disabled';
                                        } else {
                                            return '';
                                        }
                                    }
                                },
                                'set_value' : function(obj, value, values, oldValue, eventType) {
                                    var $el = obj.data;
                                    var pgel = new pgQuery($el);

                                    if (value == oldValue) return value;

                                    pgel.removeClass('current');
                                    pgel.removeClass('disabled');


                                    if (value) {
                                        pgel.addClass(value);
                                        var link = pgel.find('a');
                                        var text;
                                        if (link.length > 0)
                                            text = pgel.find('a').html()
                                        else
                                            text = pgel.html();
                                        pgel.html(text);
                                    }
                                    else {
                                        var text = pgel.html();
                                        var link = pgel.find('a');
                                        if (link.length == 0) {
                                            link = new pgQuery().create('<a href="#"></a>');
                                            pgel.html('');
                                            pgel.append(link);
                                        }
                                        link.html(text);
                                    }

                                    $.fn.crsa("setNeedsUpdate", false, obj.data);

                                    return value;
                                }
                            }
                        }
                    }
                })
            });

            // Breadcrumbs
            f.addComponentType({
                'type' : 'fd-breadcrumbs',
                'selector' : '.breadcrumbs',
                priority: 100,
                'code' : '<ul class="breadcrumbs">\
                    <li><a href="#">Home</a></li>\
                    <li><a href="#">Features</a></li>\
                    <li class="disabled">Gene Splicing</li>\
                </ul>',
                'name' : 'Breadcrumbs',
                tags: 'major',
                action_menu: {
                    add: ['fd-bc-item'],
                    on_add : function($el, $new, newdef, prepend) {
                        var pgel = new pgQuery($el);
                        var pgnew = new pgQuery($new);
                        if($el.is('nav')) {
                            var $a = $new.find('a');
                            var pga = new pgQuery($a);
                            if(prepend) {
                                pgel.prepend(pga);
                            } else {
                                pgel.append(pga);
                            }
                        } else {
                            if(prepend) {
                                pgel.prepend(pgnew);
                            } else {
                                pgel.append(pgnew);
                            }
                        }
                    }
                },
                'sections' : crsaAddStandardSections({
                })
            });
        // End Breadcrumbs

        // Pagination
            // Pagination item
            f.addComponentType({
                'type' : 'fd-pag-item',
                'selector' : function($el) {
                    if($el.parent().is('.pagination')) {
                        return true;
                    }
                    return false;
                },
                'code' : '<li><a href="#">Item</a></li>',
                'name' : 'Pagination item',
                priority: 99,
                'sections' : crsaAddStandardSections({
                    'fdbcstyle' : {
                        name : 'Status',
                        fields : {
                            'percent' : {
                                'type' : 'select',
                                'name' : 'Status',
                                'action' : 'custom',
                                'show_empty' : true,
                                'options' : [
                                    { 'key' : 'current', 'name' : 'Current' },
                                    { 'key' : 'disabled', 'name' : 'Disabled' }
                                ],
                                'get_value' : function (obj) {
                                    var $el = obj.data;
                                    if ($el.attr('class')) {
                                        var classArr = $el.attr('class').split(' ');
                                        if (classArr.indexOf('current') > -1) {
                                            return 'current';
                                        } else if (classArr.indexOf('disabled') > -1) {
                                            return 'disabled';
                                        } else {
                                            return '';
                                        }
                                    }
                                },
                                'set_value' : function(obj, value, values, oldValue, eventType) {
                                    var $el = obj.data;
                                    var pgel = new pgQuery($el);

                                    if (value == oldValue) return value;

                                    pgel.removeClass('current');
                                    pgel.removeClass('disabled');

                                    if (value) {
                                        pgel.addClass(value);
                                        var link = pgel.find('a');
                                        var text;
                                        if (link.length > 0)
                                            text = pgel.find('a').html()
                                        else
                                            text = pgel.html();
                                        pgel.html(text);
                                    }
                                    else {
                                        var text = pgel.html();
                                        var link = pgel.find('a');
                                        if (link.length == 0) {
                                            link = new pgQuery().create('<a href="#"></a>');
                                            pgel.html('');
                                            pgel.append(link);
                                        }
                                        link.html(text);
                                    }

                                    $.fn.crsa("setNeedsUpdate", false, obj.data);

                                    return value;
                                }
                            }
                        }
                    }
                })
            });

            // Pagination
            f.addComponentType({
                'type' : 'fd-pagination',
                'selector' : '.pagination',
                priority: 100,
                'code' : '<ul class="pagination" role="navigation" aria-label="Pagination">\
                    <li class="pagination-previous disabled">Previous <span class="show-for-sr">page</span></li>\
                    <li class="current"><span class="show-for-sr">You\'re on page</span> 1</li>\
                    <li><a href="#" aria-label="Page 2">2</a></li>\
                    <li><a href="#" aria-label="Page 3">3</a></li>\
                    <li><a href="#" aria-label="Page 4">4</a></li>\
                    <li class="ellipsis" aria-hidden="true"></li>\
                    <li><a href="#" aria-label="Page 12">12</a></li>\
                    <li><a href="#" aria-label="Page 13">13</a></li>\
                    <li class="pagination-next"><a href="#" aria-label="Next page">Next <span class="show-for-sr">page</span></a></li>\
                </ul>',
                'name' : 'Pagination',
                tags: 'major',
                action_menu: {
                    add: ['fd-pag-item']
                },
                'sections' : crsaAddStandardSections({
                    'fdbcstyle' : {
                        name : 'Layout',
                        fields : {
                            'percent' : {
                                'type' : 'checkbox',
                                'name' : 'Centered',
                                'value' : 'text-center',
                                'action' : 'apply_class'
                            }
                        }
                    }
                })
            });
        // End Pagination


        // Orbit slider
            // Orbit slider helper
            var addOrbitSlide = function ($el, prepend) {
                var $orbit = $el.closest('.orbit');
                var $bullets = $orbit.find('> .orbit-bullets');

                var pgBulletList = new pgQuery($bullets);
                var pgBullet = new pgQuery().create('<button data-slide="' + $bullets.children().length + '">\
                    <span class="show-for-sr">Fourth slide details.</span>\
                </button>');
                if(prepend) {
                    pgBulletList.prepend(pgBullet);
                } else {
                    pgBulletList.append(pgBullet);
                }
            }

            f.addComponentType({
                'type' : 'fd-orbit-slide',
                'selector' : '.orbit-slide',
                'name' : 'Orbit slide',
                'priority' : 99,
                'sections' : crsaAddStandardSections({
                })
            })

            // Orbit slider image item
            f.addComponentType({
                'type' : 'fd-orbit-item-image',
                priority: 100,
                'code' : '<li class="orbit-slide">\
                    <img class="orbit-image" src="' + pinegrow.getPlaceholderImage() + '" alt="slide">\
                    <figcaption class="orbit-caption">Caption One.</figcaption>\
                </li>',
                'name' : 'Orbit slide image',
                tags: 'major',
                'sections' : crsaAddStandardSections({
                })
            });

            // Orbit slider non-image item
            f.addComponentType({
                'type' : 'fd-orbit-item-nonimage',
                priority: 100,
                'code' : '<li class="orbit-slide">\
                    <div>\
                        <h3 class="text-center">You can also throw some text in here!</h3>\
                        <p class="text-center">Lorem ipsum dolor sit amet, consectetur adipisicing elit. Unde harum rem, beatae ipsa consectetur quisquam. Rerum ratione, delectus atque tempore sed, suscipit ullam, beatae distinctio cupiditate ipsam eligendi tempora expedita.</p>\
                        <h3 class="text-center">This Orbit slide has chill</h3>\
                    </div>\
                </li>',
                'name' : 'Orbit slide nonimage',
                tags: 'major',
                'sections' : crsaAddStandardSections({
                })
            });

            // Orbit slider
            f.addComponentType({
                'type' : 'fd-orbit',
                'selector' : function($el) {
                    return $el.attr('data-orbit') != null;
                },
                priority: 100,
                'code' : '<div class="orbit" role="region" aria-label="Favorite Space Pictures" data-orbit>\
                    <ul class="orbit-container">\
                        <button class="orbit-previous" aria-label="previous"><span class="show-for-sr">Previous Slide</span>&#9664;</button>\
                        <button class="orbit-next" aria-label="next"><span class="show-for-sr">Next Slide</span>&#9654;</button>\
                        <li class="is-active orbit-slide">\
                            <div>\
                                <h3 class="text-center">You can also throw some text in here!</h3>\
                                <p class="text-center">Lorem ipsum dolor sit amet, consectetur adipisicing elit. Unde harum rem, beatae ipsa consectetur quisquam. Rerum ratione, delectus atque tempore sed, suscipit ullam, beatae distinctio cupiditate ipsam eligendi tempora expedita.</p>\
                                <h3 class="text-center">This Orbit slide has chill</h3>\
                            </div>\
                        </li>\
                        <li class="orbit-slide">\
                            <div>\
                                <h3 class="text-center">You can also throw some text in here!</h3>\
                                <p class="text-center">Lorem ipsum dolor sit amet, consectetur adipisicing elit. Unde harum rem, beatae ipsa consectetur quisquam. Rerum ratione, delectus atque tempore sed, suscipit ullam, beatae distinctio cupiditate ipsam eligendi tempora expedita.</p>\
                                <h3 class="text-center">This Orbit slide has chill</h3>\
                            </div>\
                        </li>\
                        <li class="orbit-slide">\
                            <div>\
                                <h3 class="text-center">You can also throw some text in here!</h3>\
                                <p class="text-center">Lorem ipsum dolor sit amet, consectetur adipisicing elit. Unde harum rem, beatae ipsa consectetur quisquam. Rerum ratione, delectus atque tempore sed, suscipit ullam, beatae distinctio cupiditate ipsam eligendi tempora expedita.</p>\
                                <h3 class="text-center">This Orbit slide has chill</h3>\
                            </div>\
                        </li>\
                        <li class="orbit-slide">\
                            <div>\
                                <h3 class="text-center">You can also throw some text in here!</h3>\
                                <p class="text-center">Lorem ipsum dolor sit amet, consectetur adipisicing elit. Unde harum rem, beatae ipsa consectetur quisquam. Rerum ratione, delectus atque tempore sed, suscipit ullam, beatae distinctio cupiditate ipsam eligendi tempora expedita.</p>\
                                <h3 class="text-center">This Orbit slide has chill</h3>\
                            </div>\
                        </li>\
                    </ul>\
                    <nav class="orbit-bullets">\
                        <button class="is-active" data-slide="0"><span class="show-for-sr">First slide details.</span><span class="show-for-sr">Current Slide</span></button>\
                        <button data-slide="1"><span class="show-for-sr">Second slide details.</span></button>\
                        <button data-slide="2"><span class="show-for-sr">Third slide details.</span></button>\
                        <button data-slide="3"><span class="show-for-sr">Fourth slide details.</span></button>\
                    </nav>\
                </div>',
                'name' : 'Orbit slider',
                on_changed : function($el, page) {
                    showOrbitMessage();
                },
                on_inserted : function() {
                    showOrbitMessage();
                },
                tags: 'major',
                last_type: true,
                action_menu: {
                    add: ['fd-orbit-item-image', 'fd-orbit-item-nonimage'],
                    on_add : function($el, $new, newdef, prepend) {
                        var pgel = new pgQuery($el);
                        var pgOrbitContainer = pgel.find('> .orbit-container');

                        var pgnew = new pgQuery($new);
                        if(prepend) {
                            pgOrbitContainer.prepend(pgnew);
                        } else {
                            pgOrbitContainer.append(pgnew);
                        }

                        addOrbitSlide($el, prepend);
                        showOrbitMessage();
                    }
                },
                'sections' : crsaAddStandardSections({
                })
            });
        // End Orbit slider


        // Thumbnail
            f.addComponentType({
                'type' : 'fd-thumbnail',
                'selector' : 'img.thumbnail',
                priority: 100,
                'code' : function() {
                    var img = pinegrow.getPlaceholderImage();
                    var thumb = pinegrow.getThumbnailForPlaceholderImage(img);
                    return '<img class="thumbnail" src="' + thumb + '"/>';
                },
                'name' : 'Thumbnail',
                tags: 'major',
                'sections' : crsaAddStandardSections({
                })
            });
        // End Thumbnail


        // Flex video
            f.addComponentType({
                'type' : 'fd-flexvideo',
                'selector' : '.flex-video',
                priority: 100,
                'code' : '<div class="flex-video">\
                    <iframe src="http://player.vimeo.com/video/60122989" width="400" height="225" frameborder="0" webkitAllowFullScreen mozallowfullscreen allowFullScreen></iframe>\
                </div>',
                'drag_helper' : '<div class="flex-video pg-empty-placeholder"></div>',
                empty_placeholder : false,
                'name' : 'Flex video',
                tags: 'major',
                'sections' : crsaAddStandardSections({
                    fdlightbox : {
                        name : 'Video options',
                        fields : {
                            'fdcode' : {
                                'type' : 'text',
                                'name' : 'Embed code',
                                'action' : 'element_html',
                                live_update: false
                            },
                            'fdwidescreen' : {
                                'type' : 'checkbox',
                                'name' : 'Widescreen',
                                'value' : 'widescreen',
                                'action' : 'apply_class'
                            },
                            'fdvimeo' : {
                                'type' : 'checkbox',
                                'name' : 'Vimeo',
                                'value' : 'vimeo',
                                'action' : 'apply_class'
                            }
                        }
                    }
                })
            });
        // End Flex video


        // Forms
            // Form
            var form = {
                'type' : 'fd-form',
                tags: 'major',
                priority: 100,
                'selector' : 'form',
                'code' : '<form>\
                    <div class="row">\
                        <div class="large-12 columns">\
                            <label>Input Label\
                                <input type="text" placeholder="large-12.columns" />\
                            </label>\
                        </div>\
                    </div>\
                    <div class="row">\
                        <div class="large-4 columns">\
                            <label>Input Label\
                                <input type="text" placeholder="large-4.columns" />\
                            </label>\
                        </div>\
                        <div class="large-4 columns">\
                            <label>Input Label\
                                <input type="text" placeholder="large-4.columns" />\
                            </label>\
                        </div>\
                        <div class="large-4 columns">\
                            <div class="collapse">\
                                <label>Input Label</label>\
                                <div class="input-group">\
                                    <input class="input-group-field" type="url">\
                                    <span class="input-group-label">.com</span>\
                                </div>\
                            </div>\
                        </div>\
                    </div>\
                    <div class="row">\
                        <div class="large-12 columns">\
                            <label>Select Box\
                                <select>\
                                    <option value="husker">Husker</option>\
                                    <option value="starbuck">Starbuck</option>\
                                    <option value="hotdog">Hot Dog</option>\
                                    <option value="apollo">Apollo</option>\
                                </select>\
                            </label>\
                        </div>\
                    </div>\
                    <div class="row">\
                        <div class="large-6 columns">\
                            <label>Choose Your Favorite</label>\
                            <input type="radio" name="pokemon" value="Red" id="pokemonRed">\
                            <label for="pokemonRed">Red</label>\
                            <input type="radio" name="pokemon" value="Blue" id="pokemonBlue">\
                            <label for="pokemonBlue">Blue</label>\
                        </div>\
                        <div class="large-6 columns">\
                            <label>Check these out</label>\
                            <input id="checkbox1" type="checkbox">\
                            <label for="checkbox1">Checkbox 1</label>\
                            <input id="checkbox2" type="checkbox">\
                            <label for="checkbox2">Checkbox 2</label>\
                        </div>\
                    </div>\
                    <div class="row">\
                        <div class="large-12 columns">\
                            <label>Textarea Label\
                                <textarea placeholder="small-12.columns"></textarea>\
                            </label>\
                        </div>\
                    </div>\
                </form>',
                'name' : 'Form',
                action_menu: {
                    add: ['fd-row']
                },
                'sections' : crsaAddStandardSections({
                    attributes : {
                        //inherit this from html framework
                        inherit: true
                    }
                })
            }
            f.addComponentType(form);

            // inputs
            var defineInputField = function(type) {
                var code;
                var name;
                switch(type) {
                    case 'input':
                        code = '<input type="text" placeholder="input fiels" />';
                        name = 'Input';
                        break;
                    case 'textarea':
                        code = '<textarea></textarea>';
                        name = 'Textarea';
                        break;
                    case 'select':
                        code = '<select />';
                        name = 'Select';
                        break;
                    case 'button':
                        code = '<button value="Button" />';
                        name = 'Button';
                        break;
                }

                var enableForField = function($field, req) {
                    var pgfield = new pgQuery($field);
                    new pgQuery($field.closest('form')).attr("data-abide", '');
                    var $lab = $field.parent();
                    if(req) {
                        if($lab.is('label') && $lab.find('small').length == 0) {
                            new pgQuery().create('<small>required</small>').insertBefore(pgfield);
                        }
                    }
                    if($lab.is('label') && $lab.find('> .form-error').length == 0) {
                        new pgQuery().create('<span class="form-error">Field is required.</span>').insertAfter(pgfield);
                    }

                    $.fn.crsa('setNeedsUpdate', false, $lab);
                }

                f.addComponentType({
                    'type' : 'fd-' + type,
                    'selector' : type,
                    priority: 100,
                    'code' : '<label>Input Label' + code + '</label>',
                    'name' : name,
                    'sections' : crsaAddStandardSections({
                        attributes : {
                            //inherit this from html framework
                            inherit: true
                        },
                        'fdvalidation' : {
                            name : 'Validation',
                            fields : {
                                'fdrequired' : {
                                    'type' : 'checkbox',
                                    'name' : 'Required',
                                    'value' : '1',
                                    'action' : 'custom',
                                    get_value: function(obj) {
                                        var $el = obj.data;
                                        var pgel = new pgQuery($el);
                                        return pgel.hasAttr('required') ? '1' : null;
                                    },
                                    set_value: function(obj, value, values, oldValue, eventType) {
                                        var $el = obj.data;
                                        var pgel = new pgQuery($el);
                                        if(value) {
                                            enableForField($el, true);
                                            pgel.attr('required', '');
                                            showOrbitMessage();
                                        } else {
                                            pgel.removeAttr('required');
                                        }
                                        return value;
                                    }
                                },
                                'fdpattern' : {
                                    'type' : 'select',
                                    'name' : 'Pattern',
                                    'show_empty' : true,
                                    options: [
                                        {key: 'alpha', name: 'alpha'},
                                        {key: 'alpha_numeric', name: 'alpha_numeric'},
                                        {key: 'integer', name: 'integer'},
                                        {key: 'number', name: 'number'},
                                        {key: 'password', name: 'password'},
                                        {key: 'card', name: 'card'},
                                        {key: 'cvv', name: 'cvv'},
                                        {key: 'email', name: 'email'},
                                        {key: 'url', name: 'url'},
                                        {key: 'domain', name: 'domain'},
                                        {key: 'datetime', name: 'datetime'},
                                        {key: 'date', name: 'date'},
                                        {key: 'time', name: 'time'},
                                        {key: 'dateISO', name: 'dateISO'},
                                        {key: 'month_day_year', name: 'month_day_year'},
                                        {key: 'color', name: 'color'}
                                    ],
                                    'action' : 'custom',
                                    get_value: function(obj) {
                                        var $el = obj.data;
                                        var pgel = new pgQuery($el);
                                        return pgel.attr('pattern');
                                    },
                                    set_value: function(obj, value, values, oldValue, eventType) {
                                        var $el = obj.data;
                                        var pgel = new pgQuery($el);
                                        if(value) {
                                            enableForField($el)
                                            pgel.attr('pattern', value);
                                            showOrbitMessage();
                                        } else {
                                            pgel.removeAttr('pattern');
                                        }
                                        return value;
                                    }
                                },
                                'fdcustompat' : {
                                    'type' : 'text',
                                    'name' : 'Custom pattern',
                                    'value' : '1',
                                    'action' : 'custom',
                                    get_value: function(obj) {
                                        var $el = obj.data;
                                        var pgel = new pgQuery($el);
                                        return pgel.attr('pattern');
                                    },
                                    set_value: function(obj, value, values, oldValue, eventType) {
                                        var $el = obj.data;
                                        var pgel = new pgQuery($el);
                                        if(value) {
                                            enableForField($el)
                                            pgel.attr('pattern', value);
                                            showOrbitMessage();
                                        } else {
                                            pgel.removeAttr('pattern');
                                        }
                                        return value;
                                    }
                                },
                                'fderrortext' : {
                                    'type' : 'text',
                                    'name' : 'Error text',
                                    'action' : 'custom',
                                    get_value : function (obj) {
                                        var $el = obj.data;
                                        var $error = $el.siblings('.form-error');
                                        if ($error.length > 0) {
                                            return $error.html();
                                        }
                                        else {
                                            return '';
                                        }
                                    },
                                    set_value: function(obj, value, values, oldValue, eventType) {
                                        if (value == oldValue) return value;

                                        var $el = obj.data;
                                        var $error = $el.siblings('.form-error');
                                        if ($error.length == 0) {
                                            showAlert("Can't find form error with next to input. Add a form error first.", "Element not found");
                                            return '';
                                        }
                                        else {
                                            new pgQuery($error).html(value);
                                        }

                                        return value;
                                    }
                                }
                            }
                        }
                    })
                });
            }
            defineInputField('input');
            defineInputField('textarea');
            defineInputField('select');
            defineInputField('button');

            // Form label
            f.addComponentType({
                'type' : 'fd-label-only',
                'selector' : null,
                priority: 100,
                'code' : '<label>Input Label</label>',
                'name' : 'Label'
            });

            // Form column
            f.addComponentType({
                'type' : 'fd-form-column',
                'selector' : function($el) {
                    return $el.is('.columns,.column') && $el.closest('form').length;
                },
                tags: 'major',
                priority: 100,
                'code' : '<div class="columns">\
                    <label>Input Label\
                        <input type="text" placeholder="text" />\
                    </label>\
                </div>',
                'name' : 'Form column',
                action_menu: {
                    add: ['fd-input', 'fd-textarea', 'fd-select', 'fd-button', 'fd-range-slider', 'fd-switch', 'fd-fieldset', 'fd-input-group']
                },
                'sections' : crsaAddStandardSections({
                    fdcollayout : {
                        inherit: true
                    }
                })
            });

            // Form label with input
            f.addComponentType({
                'type' : 'fd-label',
                'selector' : 'label',
                priority: 100,
                'code' : '<label>Input Label\
                    <input type="text" placeholder="input fiels" />\
                </label>',
                'name' : 'Label + Field',
                'sections' : crsaAddStandardSections({
                    'data' : {
                        name : 'Label options',
                        fields : {
                            'fdmiddle' : {
                                'type' : 'checkbox',
                                'name' : 'Middle',
                                'value' : 'middle',
                                'action' : 'apply_class'
                            }
                        }
                    }
                })
            });

            // Range slider options
            var rangeSliderOptions = {
                'fdvertical' : {
                    'type' : 'checkbox',
                    'name' : 'Vertical',
                    'value' : '1',
                    'action' : 'custom',
                    get_value: function(obj) {
                        var $el = obj.data;
                        var pgel = new pgQuery($el);
                        return pgel.hasClass('vertical') ? 1 : 0;
                    },
                    set_value: function(obj, value, values, oldValue, eventType) {
                        var $el = obj.data;
                        var pgel = new pgQuery($el);

                        if (value == '1') {
                            pgel.addClass('vertical');
                            pgel.attr('data-vertical', 'true');
                        }
                        else {
                            pgel.removeClass('vertical');
                            pgel.removeAttr('data-vertical');
                        }

                        if (value != oldValue) {
                            showOrbitMessage();
                        }
                        return value;
                    }
                },
                'fdstartvalue' : {
                    type: 'text',
                    name: 'Inital start value',
                    action: 'element_attribute',
                    live_update: false,
                    attribute : 'data-initial-start',
                    on_changed: function () {
                        showOrbitMessage();
                    }
                },
                'fdendvalue' : {},
                'fdlength' : {
                    type: 'text',
                    name: 'Length',
                    action: 'element_attribute',
                    live_update: false,
                    attribute : 'data-end',
                    on_changed: function () {
                        showOrbitMessage();
                    }
                },
                'fddisabled' : {
                    'type' : 'checkbox',
                    'name' : 'Disabled',
                    'value' : 'disabled',
                    'action' : 'apply_class'
                },
                'fddatabinding' : {
                    'type' : 'text',
                    'name' : 'Data binding',
                    'live_update' : false,
                    'action' : 'custom',
                    get_value: function (obj) {
                        var $el = obj.data;
                        var $sliderHandle = $el.find('[data-slider-handle]')
                        var pgHandel = new pgQuery($sliderHandle);
                        return pgHandel.attr('aria-controls');
                    },
                    set_value: function(obj, value, values, oldValue, eventType) {
                        var $el = obj.data;
                        var pgel = new pgQuery($el);
                        var $sliderHandle = $el.find('[data-slider-handle]')
                        var pgHandel = new pgQuery($sliderHandle);
                        pgHandel.attr('aria-controls', value);

                        if (pgHandel.attr('aria-controls')) {
                            var $input = $el.find('input[type="hidden"]');
                            if ($input.length > 0) {
                                var pgInput = new pgQuery($input);
                                pgInput.remove();
                            }
                        }
                        else {
                            var $input = $el.find('input[type="hidden"]');
                            if ($input.length == 0) {
                                pgel.append(new pgQuery().create('<input type="hidden">'));
                            }
                        }

                        if (value != oldValue) {
                            showOrbitMessage();
                        }

                        return value;
                    }
                }
            }

            // Range slider
            f.addComponentType({
                'type' : 'fd-range-slider',
                'selector' : function ($el) {
                    return ($el.hasClass('slider') && $el.find('input').length < 2);
                },
                priority: 100,
                'code' : '<div class="slider" data-slider data-initial-start="50" data-end="200">\
                    <span class="slider-handle"  data-slider-handle role="slider" tabindex="1"></span>\
                    <span class="slider-fill" data-slider-fill></span>\
                    <input type="hidden">\
                </div>',
                'name' : 'Range Slider',
                'sections' : crsaAddStandardSections({
                    'data' : {
                        name : 'Range slider options',
                        fields : rangeSliderOptions
                    }
                })
            });

            // Range slider
            f.addComponentType({
                'type' : 'fd-two-handles-range-slider',
                'selector' : function ($el) {
                    return ($el.hasClass('slider') && $el.find('input').length > 1);
                },
                priority: 100,
                'code' : '<div class="slider" data-slider data-initial-start="25" data-initial-end="75">\
                    <span class="slider-handle" data-slider-handle role="slider" tabindex="1"></span>\
                    <span class="slider-fill" data-slider-fill></span>\
                    <span class="slider-handle" data-slider-handle role="slider" tabindex="1"></span>\
                    <input type="hidden">\
                    <input type="hidden">\
                </div>',
                'name' : 'Range Slider (two handles)',
                on_inserted: function () {
                    showOrbitMessage();
                },
                'sections' : crsaAddStandardSections({
                    'data' : {
                        name : 'Range two handles slider options',
                        fields : $.extend({}, rangeSliderOptions, {
                            'fdendvalue': {
                                type: 'text',
                                name: 'Inital end value',
                                action: 'element_attribute',
                                live_update: false,
                                attribute : 'data-initial-end',
                                on_changed: function () {
                                    showOrbitMessage();
                                }
                            }
                        })
                    }
                })
            });

            // Switch
            f.addComponentType({
                'type' : 'fd-switch',
                'selector' : 'div.switch',
                priority: 100,
                'preview' : function() {
                    var id = "previewSwitch";
                    return '<div class="switch">\
                      <input class="switch-input" id="' + id + '" type="checkbox" name="exampleSwitch">\
                      <label class="switch-paddle" for="' + id + '">\
                        <span class="show-for-sr">Download Kittens</span>\
                      </label>\
                    </div>';
                },
                'code' : function() {
                    var id = getUniqueId("switch");
                    return '<div class="switch">\
                      <input class="switch-input" id="'+id+'" type="checkbox" name="exampleSwitch">\
                      <label class="switch-paddle" for="'+id+'">\
                        <span class="show-for-sr">Download Kittens</span>\
                      </label>\
                    </div>';
                },
                'name' : 'Switch',
                'sections' : crsaAddStandardSections({
                    'data' : {
                        name : 'Switch options',
                        fields : {
                            'fdtype' : {
                                'type' : 'select',
                                'name' : 'Type',
                                'show_empty' : false,
                                action: 'custom',
                                options: [
                                    {key: 'checkbox', name: 'Checkbox'},
                                    {key: 'radio', name: 'Radio'}
                                ],
                                get_value: function(obj) {
                                    var $el = obj.data;
                                    var pgel = new pgQuery($el);
                                    return new pgQuery($el.find('input')).attr('type');
                                },
                                set_value: function(obj, value, values, oldValue, eventType) {
                                    var $el = obj.data;
                                    var pgel = new pgQuery($el);
                                    new pgQuery($el.find('input')).attr('type', value);
                                    pinegrow.setNeedsUpdate($el);
                                    return value;
                                }
                            },
                            'fdsize' : {
                                'type' : 'select',
                                'name' : 'Size',
                                'show_empty' : true,
                                action: 'apply_class',
                                options: [
                                    {key: 'tiny', name: 'Tiny'},
                                    {key: 'small', name: 'Small'},
                                    {key: 'large', name: 'Large'}
                                ]
                            },
                            'fdchecked' : {
                                'type' : 'checkbox',
                                'name' : 'Checked',
                                'value' : 1,
                                'action' : 'custom',
                                get_value : function (obj) {
                                    var $el = obj.data;
                                    var $input = $el.find('.switch-input');

                                    var pgel = new pgQuery($el);
                                    var pgInput = new pgQuery($input);

                                    return pgInput.hasAttr('checked');
                                },
                                set_value : function(obj, value, values, oldValue, eventType) {
                                    var $el = obj.data;
                                    var $input = $el.find('.switch-input');

                                    var pgel = new pgQuery($el);
                                    var pgInput = new pgQuery($input);

                                    if (value == '1') {
                                        pgInput.attr('checked', 'checked');
                                    }
                                    else {
                                        pgInput.removeAttr('checked');
                                    }

                                    return value;
                                }
                            },
                            'fdswitchactive' : {
                                'type' : 'text',
                                'name' : 'Switch active text',
                                'action' : 'custom',
                                'live_update' : false,
                                get_value : function (obj) {
                                    var $el = obj.data;
                                    var $active = $el.find('.switch-active');

                                    if ($active.length == 0) return '';

                                    var pgActive = new pgQuery($active);
                                    return pgActive.html();
                                },
                                set_value : function(obj, value, values, oldValue, eventType) {
                                    var $el = obj.data;
                                    var $active = $el.find('.switch-active');
                                    var $label = $el.find('.switch-paddle')
                                    var pgLabel = new pgQuery($label);

                                    if (value) {
                                        var pgActive;
                                        if ($active.length == 0) {
                                            pgActive = new pgQuery().create('<span class="switch-active" aria-hidden="true"></span>');
                                            pgLabel.append(pgActive);
                                            $.fn.crsa('setNeedsUpdate', false, $label);
                                        }
                                        else {
                                            pgActive = new pgQuery($active);
                                        }

                                        pgActive.html(value);
                                    }
                                    else {
                                        if ($active.length > 0) {
                                            var pgActive = new pgQuery($active);
                                            pgActive.remove();
                                            $.fn.crsa('setNeedsUpdate', false, $label);
                                        }
                                    }

                                    return value;
                                }
                            },
                            'fdswitchinactive' : {
                                'type' : 'text',
                                'name' : 'Switch inactive text',
                                'action' : 'custom',
                                'live_update' : false,
                                get_value : function (obj) {
                                    var $el = obj.data;
                                    var $active = $el.find('.switch-inactive');

                                    if ($active.length == 0) return '';

                                    var pgActive = new pgQuery($active);
                                    return pgActive.html();
                                },
                                set_value : function(obj, value, values, oldValue, eventType) {
                                    var $el = obj.data;
                                    var $active = $el.find('.switch-inactive');
                                    var $label = $el.find('.switch-paddle')
                                    var pgLabel = new pgQuery($label);

                                    if (value) {
                                        var pgActive;
                                        if ($active.length == 0) {
                                            pgActive = new pgQuery().create('<span class="switch-inactive" aria-hidden="true"></span>');
                                            pgLabel.append(pgActive);
                                            $.fn.crsa('setNeedsUpdate', false, $label);
                                        }
                                        else {
                                            pgActive = new pgQuery($active);
                                        }

                                        pgActive.html(value);
                                    }
                                    else {
                                        if ($active.length > 0) {
                                            var pgActive = new pgQuery($active);
                                            pgActive.remove();
                                            $.fn.crsa('setNeedsUpdate', false, $label);
                                        }
                                    }

                                    return value;
                                }
                            }
                        }
                    }
                })
            });

            // Fieldset
            f.addComponentType({
                'type' : 'fd-fieldset',
                'selector' : 'fieldset',
                priority: 100,
                'code' : '<fieldset>\
                    <legend>Fieldset Legend</legend>\
                    <label>Input Label\
                        <input type="text" placeholder="Inputs and other form elements go inside...">\
                    </label>\
                </fieldset>',
                'name' : 'Fieldset',
                'sections' : crsaAddStandardSections({
                    fdlightboxitem : {
                        name : 'Fieldset options',
                        fields : {
                            'fdlegend' : {
                                'type' : 'text',
                                'name' : 'Legend',
                                'action' : 'custom',
                                get_value: function(obj) {
                                    var $el = obj.data;
                                    var pgel = new pgQuery($el);
                                    return new pgQuery($el.find('legend')).html();
                                },
                                set_value: function(obj, value, values, oldValue, eventType) {
                                    var $el = obj.data;
                                    var pgel = new pgQuery($el);
                                    new pgQuery($el.find('legend')).html(value);
                                    return value;
                                }
                            }
                        }
                    }

                })
            });

            // Input Group
            f.addComponentType({
                'type' : 'fd-input-group',
                'selector' : '.input-group',
                priority: 100,
                'code' : '<div class="input-group">\
                    <span class="input-group-label">$</span>\
                    <input class="input-group-field" type="url">\
                    <a class="input-group-button button">Submit</a>\
                </div>',
                'name' : 'Input group',
                action_menu: {
                    add: ['fd-input-group-field', 'fd-input-group-label', 'fd-input-group-button']
                }
            });

            // Input group field
            f.addComponentType({
                'type' : 'fd-input-group-field',
                'selector' : '.input-group-field',
                priority: 100,
                'code' : '<input class="input-group-field" type="url">',
                'name' : 'Input group field'
            });

            // Input group helpers
            var getInputGroupAddonCode = function (what) {
                var tag = (what == "button" ? "a" : "span");
                var classes = (what == "button" ? what+" button" : what);
                var content = (what == "button" ? "Submit" : "$");
                return '<' + tag + ' class="input-group-' + classes + '">' + content + '</' + tag + '>';
            }

            var addInputGroupAddon = function(what, name) {
                f.addComponentType({
                    'type' : 'fd-input-group-' + what,
                    'selector' : '.input-group-' + what,
                    priority: 100,
                    'code' : getInputGroupAddonCode(what),
                    'name' : name,
                    'parent' : '.input-group',
                    'sections' : crsaAddStandardSections({
                        fdlightboxitem : {
                            name : name + ' options',
                            fields : {
                                'fdtype' : {
                                    'type' : 'select',
                                    'name' : 'Type',
                                    show_empty: false,
                                    options: [
                                        {key: 'span', name: 'Text'},
                                        {key: 'a', name: 'Button'}
                                    ],
                                    'action' : 'custom',
                                    get_value: function(obj) {
                                        var $el = obj.data;
                                        return $el.is('span') ? "span" : 'a';
                                    },
                                    set_value: function(obj, value, values, oldValue, eventType) {
                                        var $el = obj.data;
                                        var pgel = new pgQuery($el);
                                        if(value == 'span') {
                                            var pgnew = pgel.replaceTag('span');
                                            obj.data = $(pgnew.get(0).el);

                                            pgnew.removeClass('input-group-button');
                                            pgnew.removeClass('button');
                                            pgnew.removeAttr('href');

                                            pgnew.addClass('input-group-label');
                                        } else {
                                            var pgnew = pgel.replaceTag('a');
                                            obj.data = $(pgnew.get(0).el);
                                            pgnew.removeClass('input-group-label');

                                            pgnew.addClass('input-group-button');
                                            pgnew.addClass('button');
                                        }
                                        return value;
                                    }
                                },
                                'fdcaption' : {
                                    'type' : 'text',
                                    'name' : 'Caption',
                                    'action' : 'element_html'
                                }
                            }
                        }

                    })
                });
            }
            addInputGroupAddon('label', 'Input group label');
            addInputGroupAddon('button', 'Input group button');


            // Form field error
            f.addComponentType({
                'type' : 'fd-error',
                'selector' : '.error',
                parent_selector: '.columns,.column',
                priority: 100,
                'code' : '<small class="error">Invalid entry</small>',
                'name' : 'Error',
                'sections' : crsaAddStandardSections({
                    'data' : {
                        name : 'Error options',
                        fields : {
                            'fdinline' : {
                                'type' : 'text',
                                'name' : 'Message',
                                'action' : 'element_html'
                            }
                        }
                    }
                })
            });
        // End Forms


        // Buttons
            // Link options
            var linkOptionsSection = {
                name : 'Link options',
                fields : {
                    fdlabel : {
                        'type' : 'text',
                        'name' : 'Text',
                        'action' : 'custom',
                        get_value : function (obj) {
                            var $el = obj.data;
                            return new pgQuery($el).html();
                        },
                        set_value: function(obj, value, values, oldValue, eventType) {
                            var $el = obj.data;
                            new pgQuery($el).html((value ? value : ''));
                            return value;
                        }
                    }
                }
            }

            // Link button
            f.addComponentType({
                'type' : 'fd-a-button',
                'selector' : '.button',
                priority: 100,
                'code' : '<a href="#" class="button">Button</a>',
                'name' : 'Button',
                'sections' : crsaAddStandardSections({
                    'data' : {
                        name : 'Button options',
                        fields : {
                            'fdsize' : {
                                'type' : 'select',
                                'name' : 'Size',
                                'show_empty' : true,
                                action: 'apply_class',
                                options: [
                                    {key: 'tiny', name: 'Tiny'},
                                    {key: 'small', name: 'Small'},
                                    {key: 'large', name: 'Large'}
                                ]
                            },
                            'fdbuttonarraow' : {
                                'type' : 'checkbox',
                                'name' : 'Arrow only',
                                'value' : 'arrow-only',
                                'action' : 'apply_class'
                            },
                            'fdcolor' : {
                                'type' : 'select',
                                'name' : 'Color',
                                'show_empty' : true,
                                action: 'apply_class',
                                options: [
                                    {key: 'secondary', name: 'Secondary'},
                                    {key: 'success', name: 'Success'},
                                    {key: 'alert', name: 'Alert'},
                                    {key: 'warning', name: 'Warning'},
                                    {key: 'info', name: 'Info'}
                                ]
                            },
                            'fddisabled' : {
                                'type' : 'checkbox',
                                'name' : 'Disabled',
                                'value' : 'disabled',
                                'action' : 'apply_class'
                            },
                            'fdexpand' : {
                                'type' : 'checkbox',
                                'name' : 'Expand',
                                'value' : 'expanded',
                                'action' : 'apply_class'
                            },
                            'fdhollow' : {
                                'type' : 'checkbox',
                                'name' : 'Hollow',
                                'value' : 'hollow',
                                'action' : 'apply_class'
                            },
                            'fddropdown' : {
                                'type' : 'checkbox',
                                'name' : 'Dropdown',
                                'value' : 'dropdown',
                                'action' : 'apply_class'
                            }
                        }
                    },
                    fdlink : linkOptionsSection
                })
            });

            // Button group
            f.addComponentType({
                'type' : 'fd-button-group',
                'selector' : '.button-group',
                priority: 100,
                'code' : '<div class="button-group">\
                    <a class="button">One</a>\
                    <a class="button">Two</a>\
                    <a class="button">Three</a>\
                </div>',
                'name' : 'Button group',
                tags: 'major',
                action_menu: {
                    add: ['fd-a-button'],
                    on_add : function($el, $new, newdef, prepend) {
                        var pgel = new pgQuery($el);
                        var pgnew = new pgQuery($new);
                        var pgli = new pgQuery().create('<li></li>').append(pgnew);
                        if(prepend) {
                            pgel.prepend(pgli);
                        } else {
                            pgel.append(pgli);
                        }
                    }
                },
                'sections' : crsaAddStandardSections({
                    'fdbuttongroup' : {
                        name : 'Button group options',
                        fields : {
                            'fdsize' : {
                                'type' : 'select',
                                'name' : 'Size',
                                'show_empty' : true,
                                action: 'apply_class',
                                options: [
                                    {key: 'tiny', name: 'Tiny'},
                                    {key: 'small', name: 'Small'},
                                    {key: 'large', name: 'Large'}
                                ]
                            },
                            'fdcolor' : {
                                'type' : 'select',
                                'name' : 'Color',
                                'show_empty' : true,
                                action: 'apply_class',
                                options: [
                                    {key: 'secondary', name: 'Secondary'},
                                    {key: 'success', name: 'Success'},
                                    {key: 'alert', name: 'Alert'},
                                    {key: 'warning', name: 'Warning'},
                                    {key: 'info', name: 'Info'}
                                ]
                            },
                            'fdexpand' : {
                                'type' : 'checkbox',
                                'name' : 'Expand',
                                'value' : 'expanded',
                                'action' : 'apply_class'
                            },
                            'fdbuttonstacking' : {
                                'type' : 'checkbox',
                                'name' : 'Stack small',
                                'value' : 'stacked-for-small',
                                'action' : 'apply_class'
                            }
                        }
                    }
                })
            });

            // Split button
            f.addComponentType({
                'type' : 'fd-split-button',
                priority: 99,
                'code' : '<div class="button-group">\
                  <a class="button">Primary Action</a>\
                  <a class="dropdown button arrow-only">\
                    <span class="show-for-sr">Show menu</span>\
                  </a>\
                </div>',
                'name' : 'Split button'
            });

            // Close button
            f.addComponentType({
                'type' : 'fd-close-button',
                'code' : '<button class="close-button" aria-label="Close alert" type="button">\
                    <span aria-hidden="true">&times;</span>\
                </button>',
                'name' : 'Close button'
            })
        // End Buttons


        // Dropdown
            // Dropdown helpers
            var getDropdownPanelForButton = function ($el) {
                var id = $el.attr('data-toggle');
                return $el.closest('body').find('#' + id);
            }

            // Dropdown button
            f.addComponentType({
                'type' : 'fd-dropdown-button',
                priority: 99,
                'code' : function() {
                    var id = getUniqueId('drop');
                    return '<button class="button" type="button" data-toggle="' + id + '">Toggle Dropdown</button>';
                },
                'name' : 'Dropdown button',
                tags: 'major',
                action_menu: {
                    add: ['fd-dropdown-panel'],
                    on_add : function($el, $new, newdef, prepend) {
                        var pgel = new pgQuery($el);
                        var pgnew = new pgQuery($new);

                        var id = pgel.attr('data-toggle');
                        if(id) {
                            pgnew.attr('id', id);
                            pgnew.insertAfter(pgel);
                            showOrbitMessage();
                        }
                        crsaQuickMessage("Dropdown content not found!");
                    }
                },
                on_inserted : function($el) {
                    var id = $el.attr('data-toggle');
                    var c = '<div class="dropdown-pane" id="' + id + '" data-dropdown>\
                        Just some junk that needs to be said. Or not. Your choice.\
                    </div>';
                    var pgel = new pgQuery($el);
                    var pgbr = new pgQuery().create('<br/>').insertAfter(pgel);
                    var pgc = new pgQuery().create(c).insertAfter(pgbr);
                    showOrbitMessage();
                    setTimeout(function() {
                        $.fn.crsa("setNeedsUpdate", true, $el.parent());
                    }, 500);
                },
                'sections' : crsaAddStandardSections({
                    'fdbutton': {
                        'name': 'Dropdown options',
                        'fields' : {
                            'fdhover' : {
                                'type' : 'checkbox',
                                'name' : 'Show on hover',
                                'value' : 'true',
                                'negvalue' : 'false',
                                'action' : 'custom',
                                'live_update' : true,
                                get_value : function (obj) {
                                    var $el = obj.data;
                                    var $panel = getDropdownPanelForButton($el);
                                    if ($panel.length == 0) {
                                        return 'false';
                                    }
                                    else {
                                        return $panel.attr('data-hover');
                                    }
                                },
                                set_value: function(obj, value, values, oldValue, eventType) {
                                    var $el = obj.data;
                                    var $panel = getDropdownPanelForButton($el);
                                    if ($panel.length == 0) {
                                        showAlert("Can't find dropdown panel with this element id. Add a Reveal dropdown panel first.", "Element not found");
                                        return 'false';
                                    }
                                    else {
                                        new pgQuery($panel).attr('data-hover', value);
                                    }

                                    return value;
                                }
                            },
                            'fdalign' : {
                                'type' : 'select',
                                'name' : 'Align',
                                'action' : 'custom',
                                'show_empty' : true,
                                'options' : [
                                    { 'key' : 'top', 'name' : 'Top'},
                                    { 'key' : 'right', 'name' : 'Right'},
                                    { 'key' : 'left', 'name' : 'Left'},
                                ],
                                get_value : function (obj) {
                                    var $el = obj.data;
                                    var $panel = getDropdownPanelForButton($el);
                                    if ($panel.length == 0) {
                                        return '';
                                    }
                                    else {
                                        var arr = ['top', 'right', 'left'];
                                        var classes = [];
                                        if ($panel.attr('class')) {
                                            classes = $panel.attr('class').split(' ');

                                            var commonValues = arr.filter(function(value) {
                                                return classes.indexOf(value) > -1;
                                            });

                                            if (commonValues.length > 0) {
                                                return commonValues[0];
                                            }
                                        }
                                        return '';
                                    }
                                },
                                set_value: function(obj, value, values, oldValue, eventType) {
                                    var $el = obj.data;
                                    var $panel = getDropdownPanelForButton($el);
                                    if ($panel.length == 0) {
                                        showAlert("Can't find dropdown panel with this element id. Add a Reveal dropdown panel first.", "Element not found");
                                        return '';
                                    }
                                    else {
                                        var arr = ['top', 'right', 'left'];
                                        var classes = [];
                                        if ($panel.attr('class')) {
                                            classes = $panel.attr('class').split(' ');

                                            var commonValues = arr.filter(function(value) {
                                                return classes.indexOf(value) > -1;
                                            });

                                            var pgPanel = new pgQuery($panel);

                                            pgPanel.removeClass(commonValues.join(' '));
                                            pgPanel.addClass(value);

                                            return value;
                                        }
                                    }
                                }
                            }
                        }
                    }
                })
            });

            // Dropdown panel
            f.addComponentType({
                'type' : 'fd-dropdown-panel',
                'selector' : '.dropdown-pane[data-dropdown]',
                priority: 99,
                'code' : function() {
                    var id = getUniqueId('drop');
                    return '<div class="dropdown-pane" id="' + id + '" data-dropdown>\
                        Just some junk that needs to be said. Or not. Your choice.\
                    </div>';
                },
                'name' : 'Dropdown panel',
                tags: 'major',
                'sections' : crsaAddStandardSections({
                    'fdpanel' : {
                        'name' : 'Dropdown panel',
                        'fields' : {
                            'fdhover': {
                                'type' : 'checkbox',
                                'name' : 'Show on hover',
                                'action' : 'element_attribute',
                                'attribute' : 'data-hover',
                                'value' : 'true',
                                'negvalue' : 'false'
                            },
                            'fdalign': {
                                'type' : 'select',
                                'name' : 'Align',
                                'action' : 'apply_class',
                                'show_empty' : true,
                                'options' : [
                                    { 'key' : 'top', 'name' : 'Top'},
                                    { 'key' : 'right', 'name' : 'Right'},
                                    { 'key' : 'left', 'name' : 'Left'},
                                ]
                            }
                        }
                    }
                })
            });

            // Dropdown list item
            f.addComponentType({
                type : 'fd-dropdown-list-item',
                selector : null,
                code : '<li><a href="#">This is a link</a></li>',
                'name' : 'Dropdown list item',
                'sections' : crsaAddStandardSections({
                })
            });

            // Dropdown list (list)
            f.addComponentType({
                type : 'fd-dropdown-list',
                selector : function ($el) {
                    return $el.parents('[data-dropdown-menu]').length > 0 && $el.hasClass('menu');
                },
                name : 'Dropdown list',
                code: '<li>\
                    <a href="#">Dropdown link</a>\
                    <ul class="menu">\
                        <li><a href="#">This is a link</a></li>\
                        <li><a href="#">This is another</a></li>\
                        <li><a href="#">Yet another</a></li>\
                    </ul>\
                </li>',
                priority: 100,
                last_type: true,
                action_menu: {
                    add: ['fd-dropdown-list-item']
                },
                tags: 'major',
                on_inserted: function() {
                    showOrbitMessage();
                },
                sections : crsaAddStandardSections({
                })
            });

            // Dropdown list
            f.addComponentType({
                type : 'fd-list-dropdown',
                selector : '.dropdown[data-dropdown-menu]',
                name : 'Dropdown menu',
                code: '<ul class="dropdown menu" data-dropdown-menu>\
                    <li>\
                        <a>Item 1</a>\
                        <ul class="menu">\
                            <li><a href="#">Item 1A Loooong</a></li>\
                            <li>\
                                <a href="#"> Item 1 sub</a>\
                                <ul class="menu">\
                                    <li><a href="#">Item 1 subA</a></li>\
                                    <li><a href="#">Item 1 subB</a></li>\
                                    <li>\
                                        <a href="#"> Item 1 sub</a>\
                                        <ul class="menu">\
                                            <li><a href="#">Item 1 subA</a></li>\
                                            <li><a href="#">Item 1 subB</a></li>\
                                        </ul>\
                                    </li>\
                                    <li>\
                                        <a href="#"> Item 1 sub</a>\
                                        <ul class="menu">\
                                            <li><a href="#">Item 1 subA</a></li>\
                                        </ul>\
                                   </li>\
                                </ul>\
                            </li>\
                            <li><a href="#">Item 1B</a></li>\
                        </ul>\
                    </li>\
                </ul>',
                priority: 101,
                on_inserted: function () {
                    showOrbitMessage();
                },
                action_menu: {
                    add: ['fd-dropdown-list']
                },
                tags: 'major',
                sections : crsaAddStandardSections({
                    fddropbox : {
                        name : 'Dropdown options',
                        fields : {
                            'fdexpand' : {
                                'type' : 'checkbox',
                                'name' : 'Expand',
                                'value' : 'expanded',
                                'action' : 'apply_class'
                            },
                            'fdright-alignment' : {
                                'type' : 'checkbox',
                                'name' : 'Right alignment',
                                'value' : 'align-right',
                                'action' : 'apply_class'
                            },
                            'fdvertical' : {
                                'type' : 'checkbox',
                                'name' : 'Vertical',
                                'value' : 'vertical',
                                'action' : 'apply_class'
                            }
                        }
                    }
                })
            });
        // End Dropdown


        // Media object
            // Media object section
            var mediaObjSectionFields = {
                'name' : 'Media object section options',
                'fields' : {
                    'fdalign': {
                        'type' : 'select',
                        'name' : 'Align',
                        'action' : 'apply_class',
                        'show_empty' : true,
                        'options' : [
                            { 'key' : 'middle', 'name' : 'Middle' },
                            { 'key' : 'bottom', 'name' : 'Bottom' }
                        ]
                    }
                }
            }

            // Media object content
            f.addComponentType({
                'type' : 'fd-media-object-section-content',
                'selector' : '.media-object-section',
                priority: 99,
                'code' : '<div class="media-object-section">\
                    <h4>Dreams feel real while we\'re in them.</h4>\
                    <p>I\'m going to improvise. Listen, there\'s something you should know about me... about inception. An idea is like a virus, resilient, highly contagious. The smallest seed of an idea can grow. It can grow to define or destroy you.</p>\
                </div>',
                'name' : 'Media object section',
                action_menu: {
                    add: ['fd-media-object']
                },
                'sections' : crsaAddStandardSections({
                    'fdstyle' : mediaObjSectionFields
                })
            });

            // Media object image
            f.addComponentType({
                'type' : 'fd-media-object-section-image',
                priority: 99,
                'code' : '<div class="media-object-section">\
                    <div class="thumbnail">\
                        <img src= "' + getPlaceholderImage() + '" width="200">\
                    </div>\
                </div>',
                'name' : 'Media image section'
            });

            // Media object
            f.addComponentType({
                'type' : 'fd-media-object',
                'selector' : '.media-object',
                priority: 100,
                'code' : '<div class="media-object">\
                    <div class="media-object-section">\
                        <div class="thumbnail">\
                            <img src= "' + getPlaceholderImage() + '" width="200">\
                        </div>\
                    </div>\
                    <div class="media-object-section">\
                        <h4>Dreams feel real while we\'re in them.</h4>\
                        <p>I\'m going to improvise. Listen, there\'s something you should know about me... about inception. An idea is like a virus, resilient, highly contagious. The smallest seed of an idea can grow. It can grow to define or destroy you.</p>\
                    </div>\
                </div>',
                'name' : 'Media object',
                tags: 'major',
                action_menu: {
                    add: ['fd-media-object-section-content', 'fd-media-object-section-image']
                },
                'sections' : crsaAddStandardSections({
                    'fdstyle' : {
                        'name' : 'Media object options',
                        'fields' : {
                            'fdstack': {
                                'type' : 'checkbox',
                                'name' : 'Stack for small',
                                'action' : 'apply_class',
                                'value' : 'stack-for-small'
                            }
                        }
                    }
                })
            });
        // End Media object


        // Main comp
            // Type
            var hoptions = [
                {key: 'h1', name: 'Heading 1'},
                {key: 'h2', name: 'Heading 2'},
                {key: 'h3', name: 'Heading 3'},
                {key: 'h4', name: 'Heading 4'},
                {key: 'h5', name: 'Heading 5'},
                {key: 'h6', name: 'Heading 6'}
            ];

            // Headers
            var headings = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
            $.each(headings, function(i,h) {
                var hdef = {
                    'type' : 'fd-' + h,
                    'selector' : h,
                    'code' : '<' + h + '>Heading ' + (i+1) + '</' + h + '>',
                    'name' : h,
                    action_menu: {
                        add: ['fd-small']
                    },
                    'sections' : crsaAddStandardSections({
                        'fdstyle' : {
                            name : 'Heading',
                            fields : {
                                fdtext : {
                                    'type' : 'text',
                                    'name' : 'Caption',
                                    'action' : 'custom',
                                    get_value: function(obj) {
                                        var $el = obj.data;
                                        //var $p = $el.clone(true).find('small').remove();
                                        var $p = $el.find('small');
                                        return $p.html();
                                    },
                                    set_value: function(obj, value, values, oldValue, eventType) {
                                        crsaWillChangeDom();
                                        var $el = obj.data;
                                        var pgel = new pgQuery($el);
                                        var pgsmall = new pgQuery($el.find('small')).detach();
                                        pgel.html(value);
                                        pgel.append(pgsmall);
                                        return value;
                                    }
                                },
                                fdlevel : {
                                    'type' : 'select',
                                    'name' : 'Level',
                                    'action' : 'custom',
                                    'show_empty' : false,
                                    options: hoptions,
                                    get_value: function(obj) {
                                        var $el = obj.data;
                                        for(var i = 0; i < hoptions.length; i++) {
                                            if($el.is(hoptions[i].key)) {
                                                return hoptions[i].key;
                                            }
                                        }
                                        return null;
                                    },
                                    set_value: function(obj, value, values, oldValue, eventType) {
                                        crsaWillChangeDom();
                                        var $el = obj.data;
                                        var $p = $el.parent();
                                        var pgel = new pgQuery($el);
                                        var pgnewel = pgel.replaceTag(value);
                                        $.fn.crsa('setNeedsUpdate', false, $p);
                                        $.fn.crsa('setSelectElementOnUpdate', $(pgnewel.get(0).el));
                                        return value;
                                    }
                                },
                                fdsubheading : {
                                    'type' : 'checkbox',
                                    'name' : 'Subheader',
                                    'value' : 'subheader',
                                    'action' : 'apply_class'
                                }
                            }
                        }
                    })
                }
                f.addComponentType(hdef);
            });

            // Secondary text
            var secondaryText = {
                'type' : 'fd-small',
                'selector' : function($el) {
                    return $el.is('small') && $el.parent().is('h1,h2,h3,h4,h5,h6');
                },
                'code' : '<small>Secondary text</small>',
                'preview' : '<h1>Title<small>Secondary text</small></h1>',
                'name' : 'Secondary text',
                priority : 100,
                'sections' : crsaAddStandardSections({
                    'fdstyle' : {
                        name : 'Secondary text options',
                        fields : {
                            content : {
                                'type' : 'text',
                                'name' : 'Caption',
                                'action' : 'element_html'
                            }
                        }
                    }
                })
            }
            f.addComponentType(secondaryText);

            // paragraph
            f.addComponentType({
                'type' : 'fd-p',
                'selector' : 'p',
                'code' : '<p>Paragraph</p>',
                'name' : 'p',
                'sections' : crsaAddStandardSections({
                })
            });

            // Link
            f.addComponentType({
                'type' : 'fd-a',
                'selector' : 'a',
                'code' : '<a href="#">Link</a>',
                'name' : 'a',
                'sections' : crsaAddStandardSections({
                    'fdlink' : linkOptionsSection
                })
            });
        // End Main comp


        // Blockquote
            // Blockquote set_value
            var blockQuoteCitationSetValue = function(obj, value, values, oldValue) {
                var $el = obj.data;
                var pgel = new pgQuery($el);
                var source = values.source;
                var $small = $el.find('cite');
                var pgsmall = new pgQuery($small);
                if(!value || value.length == 0) {
                    crsaWillChangeDom();
                    pgsmall.remove();
                } else {
                    if($small.length == 0) {
                        crsaWillChangeDom();
                        pgsmall = new pgQuery().create('<cite></cite>');
                        pgel.append(pgsmall);
                    }
                    pgsmall.html(value);
                }
                return value;
            };

            f.addComponentType({
                'type' : 'fd-blockquote-item',
                'code' : '<cite>Source Title</cite>',
                'name' : 'Cite',
                'sections' : crsaAddStandardSections({
                })
            });

            // Blockquote
            var blockquote = {
                'type' : 'fd-blockquote',
                'selector' : 'blockquote',
                tags: 'major',
                'code' : '<blockquote>\
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer posuere erat a ante.\
                    <cite>Source Title</cite>\
                </blockquote>',
                'name' : 'Blockquote',
                action_menu: {
                    add: ['fd-blockquote-item']
                },
                'sections' : crsaAddStandardSections({
                    'data' : {
                        name: "Blockquote options",
                        fields: {
                            citation: {
                                type: 'text',
                                name: 'Citation',
                                action: 'custom',
                                live_update: true,
                                get_value: function(obj) {
                                    var $el = obj.data;
                                    var pgel = new pgQuery($el);
                                    var $small = $el.find('cite');
                                    if($small.length == 0) return null;
                                    var s = new pgQuery($small).html();
                                    return s;
                                },
                                set_value: blockQuoteCitationSetValue
                            }
                        }
                    }
                })
            }
            f.addComponentType(blockquote);
        // End Blockquote


        // Span label
            f.addComponentType({
                'type' : 'fd-span-label',
                'selector' : '.label',
                'code' : '<span class="label">Regular Label</span>',
                'name' : 'Label',
                priority: 100,
                'sections' : crsaAddStandardSections({
                    'fdcontent' : {
                        name : 'Label options',
                        fields : {
                            content : {
                                'type' : 'text',
                                'name' : 'Text',
                                'action' : 'element_html'
                            },
                            'fdcolor' : {
                                'type' : 'select',
                                'name' : 'Color',
                                'show_empty' : true,
                                action: 'apply_class',
                                options: [
                                    {key: 'secondary', name: 'Secondary'},
                                    {key: 'info', name: 'Info'},
                                    {key: 'success', name: 'Success'},
                                    {key: 'alert', name: 'Alert'},
                                    {key: 'warning', name: 'Warning'}
                                ]
                            }
                        }
                    }
                })
            });
        // End Span label


        // Reveal modal
            // Reveal modal helpers
            var removeDisplayStyle = function($m) {
                var s = $m.attr('style');
                if(s) {
                    s = s.replace(/display\:\s*[a-z]*;/i,'');
                    s = s.replace(/visibility\:\s*[a-z]*;/i,'');
                    s = s.replace(/opacity\:\s*[a-z0-9\.]*;/i,'');
                    s = s.replace(/top\:\s*[a-z0-9\.\-]*;/i,'');
                    s = $.trim(s);
                    if(s.length > 0) {
                        $m.attr('style', s);
                    } else {
                        $m.removeAttr('style');
                    }
                }
            }

            // Reveal modal
            f.addComponentType({
                'type' : 'fd-reveal-modal',
                'selector' : '.reveal',
                'code' : function() {
                    var id = getUniqueId('modal');
                    return '<button value="Button" class="button" data-open="' + id + '">Open modal</button>';
                },
                'name' : 'Reveal modal',
                tags: 'major',
                on_inserted : function($el) {
                    var pgel = new pgQuery($el);
                    var id = $el.attr('data-open');
                    var modal = new pgQuery().create('<div class="reveal" id="' + id + '" data-reveal>\
                      <h1>Awesome. I Have It.</h1>\
                      <p class="lead">Your couch. It is mine.</p>\
                      <p>I\'m a cool paragraph that lives inside of an even cooler modal. Wins!</p>\
                      <button class="close-button" data-close aria-label="Close reveal" type="button">\
                        <span aria-hidden="true">&times;</span>\
                      </button>\
                    </div>');

                    modal.insertAfter(pgel);
                    showOrbitMessage();
                },
                priority: 100,
                'sections' : crsaAddStandardSections({
                    'fdcontent' : {
                        name : 'Reveal modal options',
                        fields : {
                            'fdsize' : {
                                'type' : 'select',
                                'name' : 'Size',
                                'show_empty' : true,
                                action: 'apply_class',
                                options: [
                                    {key: 'tiny', name: 'Tiny'},
                                    {key: 'small', name: 'Small'},
                                    {key: 'medium', name: 'Medium'},
                                    {key: 'large', name: 'Large'},
                                    {key: 'xlarge', name: 'Xlarge'},
                                    {key: 'full', name: 'Full'}
                                ]
                            },
                            'fdoverlay' : {
                                'type' : 'checkbox',
                                'name' : 'Hide overlay',
                                'value' : 'false',
                                'negvalue' : 'true',
                                'action' : 'element_attribute',
                                'attribute' : 'data-overlay'
                            },
                            'fdanimationin': {
                                'type' : 'text',
                                'name' : 'Aimation in',
                                'action' : 'element_attribute',
                                'attribute' : 'data-animation-in'
                            },
                            'fdanimationout': {
                                'type' : 'text',
                                'name' : 'Aimation out',
                                'action' : 'element_attribute',
                                'attribute' : 'data-animation-out'
                            },
                            fdeditshow : {
                                'type' : 'checkbox',
                                'name' : 'Show during editing',
                                'value' : 'pg-show-modal',
                                'action' : 'custom',
                                get_value: function(obj) {
                                    var $el = obj.data;
                                    var pgel = new pgQuery($el);
                                    return pgel.hasClass('pg-show-modal') ? 'pg-show-modal' : null;
                                },
                                set_value: function(obj, value, values, oldValue, eventType) {
                                    var $el = obj.data;
                                    var pgel = new pgQuery($el);
                                    if(value) {
                                        pgel.addClass(value);
                                    } else {
                                        pgel.removeClass('pg-show-modal');
                                    }
                                    removeDisplayStyle($el);
                                    return value;
                                }
                            }
                        }
                    }
                })
            });
        // End Reveal modal


        // Tooltip
            f.addComponentType({
                'type' : 'fd-tooltip',
                'selector' : '*[data-tooltip]',
                'code' : '<span data-tooltip class="has-tip" title="Tooltips are awesome, you should totally use them!">extended information</span>',
                'name' : 'Tooltip',
                tags: 'major',
                priority: 100,
                on_changed : function() {
                    showOrbitMessage();
                },
                on_inserted : function() {
                    showOrbitMessage();
                },
                'sections' : crsaAddStandardSections({
                    'fdcontent' : {
                        name : 'Tooltip options',
                        fields : {
                            'fdtiptext' : {
                                'type' : 'text',
                                'name' : 'Tip text',
                                action: 'custom',
                                set_value : function(obj, value, values, oldValue, eventType) {
                                    var $el = obj.data;
                                    var pgel = new pgQuery($el);
                                    if(value) {
                                        pgel.attr('title', value);
                                    } else {
                                        pgel.removeAttr('title');
                                    }
                                    return value;
                                },
                                get_value: function(obj) {
                                    var $el = obj.data;
                                    var pgel = new pgQuery($el);
                                    return pgel.attr('title');
                                }
                            },
                            'fdtargettext' : {
                                'type' : 'text',
                                'name' : 'Target text',
                                action: 'element_html'
                            },
                            // 'fddisabletouch' : {
                            //     'type' : 'checkbox',
                            //     'name' : 'Disable touch',
                            //     value:'1',
                            //     action: 'custom',
                            //     set_value : function(obj, value, values, oldValue, eventType) {
                            //         var $el = obj.data;
                            //         var pgel = new pgQuery($el);
                            //         if(value) {
                            //             pgel.attr('data-options', 'disable_for_touch:true');
                            //         } else {
                            //             pgel.removeAttr('data-options');
                            //         }
                            //         showOrbitMessage();
                            //         return value;
                            //     },
                            //     get_value: function(obj) {
                            //         var $el = obj.data;
                            //         var pgel = new pgQuery($el);
                            //         var opts = pgel.attr('data-options');
                            //         return opts && opts.indexOf('disable_for_touch:true') >= 0 ? '1' : null;
                            //     }
                            // },
                            'fdposition' : {
                                'type' : 'select',
                                'name' : 'Position',
                                'show_empty' : true,
                                action: 'apply_class',
                                options: [
                                    {key: 'top', name: 'Top'},
                                    {key: 'right', name: 'Right'},
                                    {key: 'bottom', name: 'Bottom'},
                                    {key: 'left', name: 'Left'}
                                ]
                            }
                        }
                    }
                })
            });
        // End Tooltip


        // Magellan
            // Magellan item
            f.addComponentType({
                type : 'fd-magellan-item',
                selector : function ($el) {
                    return $el.is('li') && $el.parent('ul[data-magellan]').length > 0;
                },
                name : 'Magellan list item',
                code: '<li><a href="#destination">Destination</a></li>',
                priority: 99,
                sections : crsaAddStandardSections({
                })
            });

            // Magellan
            f.addComponentType({
                type : 'fd-magellan',
                selector : '[data-magellan]',
                name : 'Magellan list',
                code: '<ul class="horizontal menu" data-magellan>\
                    <li><a href="#first">First Arrival</a></li>\
                    <li><a href="#second">Second Arrival</a></li>\
                    <li><a href="#third">Third Arrival</a></li>\
                </ul>',
                priority: 101,
                on_inserted: function () {
                    showOrbitMessage();
                },
                action_menu: {
                    add: ['fd-magellan-item']
                },
                tags: 'major',
                sections : crsaAddStandardSections({
                })
            });
        // End Magellan


        // Drilldown
            f.addComponentType({
                type : 'fd-drilldown',
                selector : '[data-drilldown]',
                name : 'Drilldown',
                code: '<ul class="vertical menu" data-drilldown>\
                    <li>\
                        <a>Item 1</a>\
                        <ul class="vertical menu">\
                            <li><a href="#">Item 1A</a></li>\
                            <li><a href="#">Item 1B</a></li>\
                            <li><a href="#">Item 1C</a></li>\
                        </ul>\
                    </li>\
                    <li>\
                        <a>Item 2</a>\
                        <ul class="vertical menu">\
                            <li><a href="#">Item 2A</a></li>\
                            <li><a href="#">Item 2B</a></li>\
                            <li><a href="#">Item 2C</a></li>\
                        </ul>\
                    </li>\
                    <li>\
                        <a>Item 3</a>\
                        <ul class="vertical menu">\
                            <li><a href="#">Item 3A</a></li>\
                            <li><a href="#">Item 3B</a></li>\
                            <li><a href="#">Item 3C</a></li>\
                        </ul>\
                    </li>\
                    <li>\
                        <a>Item 4</a>\
                        <ul class="vertical menu">\
                            <li><a href="#">Item 4A</a></li>\
                            <li><a href="#">Item 4B</a></li>\
                            <li><a href="#">Item 4C</a></li>\
                        </ul>\
                    </li>\
                </ul>',
                priority: 101,
                on_inserted: function () {
                    showOrbitMessage();
                },
                tags: 'major',
                sections : crsaAddStandardSections({
                    fddropbox : {
                        name : 'Drilldown options',
                        fields : {
                            'fdexpand' : {
                                'type' : 'checkbox',
                                'name' : 'Expand',
                                'value' : 'expanded',
                                'action' : 'apply_class'
                            },
                            'fdvertical' : {
                                'type' : 'checkbox',
                                'name' : 'Vertical',
                                'value' : 'vertical',
                                'action' : 'apply_class'
                            }
                        }
                    }
                })
            });
        // End Drilldown


        // Progress bar
            f.addComponentType({
                'type' : 'fd-progress-bar',
                'selector' : 'div.progress',
                'code' : '<div class="progress" role="progressbar" tabindex="0" aria-valuenow="50" aria-valuemin="0" aria-valuetext="50 percent" aria-valuemax="100">\
                  <div class="progress-meter" style="width: 50%"></div>\
                </div>',
                'name' : 'Progress bar',
                'sections' : crsaAddStandardSections({
                    'fdstyle' : {
                        name : 'Progress bar options',
                        fields : {
                            'fdtext' : {
                                'type' : 'text',
                                'name' : 'Meter text',
                                'action': 'custom',
                                get_value : function (obj) {
                                    var $el = obj.data;
                                    var $meterText = $el.find('.progress-meter-text');
                                    var pgMeterText;
                                    if ($meterText.length == 0) {
                                        return '';
                                    }
                                    else {
                                        return new pgQuery($meterText).html();
                                    }
                                },
                                set_value : function(obj, value, values, oldValue, eventType) {
                                    if (value == oldValue) return value;

                                    var $el = obj.data;
                                    var pgel = new pgQuery($el);
                                    var $meter = $el.find('> .progress-meter');
                                    var $meterText = $meter.find('> .progress-meter-text');
                                    var pgMeterText = new pgQuery($meterText);

                                    if (pgMeterText.length == 0) {
                                        var pgMeter = new pgQuery($meter);
                                        if (pgMeter.length == 0) {
                                            pgMeter = new pgQuery().create('<span class="progress-meter"></span>');
                                            pgel.append(pgMeter);
                                        }
                                        pgMeterText = new pgQuery().create('<p class="progress-meter-text">text</p>');
                                        pgMeter.append(pgMeterText);

                                        $.fn.crsa('setNeedsUpdate', false, $el);
                                    }
                                    pgMeterText.html(value);

                                    return value;
                                }
                            },
                            // 'fdpercent' : {
                            //     'type' : 'text',
                            //     'name' : 'Completed %',
                            //     'action': 'element_attribute',
                            //     'attribute' : 'aria-valuetext'
                            // },
                            // 'fdminvalue' : {
                            //     'type' : 'text',
                            //     'name' : 'Min',
                            //     'action': 'element_attribute',
                            //     'attribute' : 'aria-valuemin'
                            // },
                            // 'fdmaxvalue' : {
                            //     'type' : 'text',
                            //     'name' : 'Max',
                            //     'action': 'element_attribute',
                            //     'attribute' : 'aria-valuemax'
                            // },
                            'fdvaluenow' : {
                                'type' : 'text',
                                'name' : 'Current',
                                'action' : 'custom',
                                get_value : function (obj) {
                                    var $el = obj.data;
                                    return new pgQuery($el).attr('aria-valuenow');
                                },
                                set_value : function(obj, value, values, oldValue, eventType) {
                                    var $el = obj.data;
                                    var pgel = new pgQuery($el);
                                    var pgmeter = pgel.find('>.progress-meter');

                                    pgel.attr('aria-valuenow', value);
                                    pgmeter.attr('style', 'width:' + value + '%');
                                    return value;
                                }
                            },
                            'fdcolor' : {
                                'type' : 'select',
                                'name' : 'Color',
                                'action' : 'apply_class',
                                'show_empty' : true,
                                'options' : [
                                    { 'key' : 'success', 'name' : 'Success' },
                                    { 'key' : 'warning', 'name' : 'Warning' },
                                    { 'key' : 'alert', 'name' : 'Alert' }
                                ]
                            }
                        }
                    }
                })
            });
        // End Progress bar


        // List
            // List helpers
            var getValueForResponsive = function (pgel, arr) {
                var resultArr = [];
                if (pgel.attr('data-responsive-menu')) {
                    var arrRes = pgel.attr('data-responsive-menu').split(' ');

                    resultArr = arr.filter(function(el) {
                        return arrRes.indexOf(el) != -1
                    });
                }

                if (resultArr.length > 0) {
                    return resultArr[0];
                }
                else {
                    return '';
                }
            }

            var setValueForResponsive = function (pgel, value, arr) {
                var arrRes = [];
                var resultArr = [];
                if (pgel.attr('data-responsive-menu')) {
                    arrRes = pgel.attr('data-responsive-menu').split(' ');
                    resultArr = arr.filter(function(el) {
                        return arrRes.indexOf(el) != -1
                    });
                }

                if (resultArr.length > 0) {
                    for (var i = 0; i < resultArr.length; i++) {
                        var toRemove = resultArr[i];

                        var index = arrRes.indexOf(toRemove);
                        if (index > -1) {
                            arrRes.splice(index, 1);
                        }
                    }
                }
                if (value) {
                    arrRes.push(value);
                }

                pgel.attr('data-responsive-menu', arrRes.join(' '));
            }

            // List item
            f.addComponentType({
                'type' : 'fd-list-item',
                'selector' : 'li',
                'code' : '<li><a href="#">Link</a></li>',
                'name' : 'List item',
                'sections' : crsaAddStandardSections({
                    fdstatus : {
                        name : "List item options",
                        fields : {
                            fdactive: {
                                type: 'checkbox',
                                name: 'Has submenu',
                                action: 'apply_class',
                                value: 'has-submenu'
                            }
                        }
                    }
                })
            });

            // List
            var list = {
                'type' : 'fd-list',
                tags: 'major',
                'selector' : 'ul,ol',
                'code' : '<ul>\
                    <li>Lorem ipsum dolor sit amet</li>\
                    <li>Phasellus iaculis neque</li>\
                    <li>Purus sodales ultricies</li>\
                </ul>',
                'name' : 'List',
                action_menu: {
                    add: ['fd-list', 'fd-list-item']
                },
                'sections' : crsaAddStandardSections({
                    'fdstyle' : {
                        name : 'List options',
                        fields : {
                            'fdordered' : {
                                'type' : 'checkbox',
                                'name' : 'Ordered',
                                'action' : 'custom',
                                'value' : '1',
                                get_value: function(obj) {
                                    var $el = obj.data;
                                    return $el.get(0).nodeName == "OL" ? "1" : null;
                                },
                                set_value: function(obj, value, values) {
                                    crsaWillChangeDom();
                                    var $el = obj.data;
                                    var pgel = new pgQuery($el);
                                    var tag = value == "1" ? 'ol' : 'ul';
                                    pgel = pgel.replaceTag(tag);
                                    obj.data = $(pgel.get(0).el);

                                    $.fn.crsa("setNeedsUpdate", false, obj.data);
                                    return value;
                                }
                            },
                            'fdstyle' : {
                                'type' : 'checkbox',
                                'name' : 'No bullet',
                                'action' : 'apply_class',
                                'value' : 'no-bullet'
                            },
                            'fdmenu' : {
                                'type' : 'checkbox',
                                'name' : 'Menu',
                                'action' : 'apply_class',
                                'value' : 'menu'
                            },
                            'fdexpand' : {
                                'type' : 'checkbox',
                                'name' : 'Expand',
                                'value' : 'expanded',
                                'action' : 'apply_class'
                            },
                            'fdright-alignment' : {
                                'type' : 'checkbox',
                                'name' : 'Right alignment',
                                'value' : 'align-right',
                                'action' : 'apply_class'
                            },
                            'fdsimple' : {
                                'type' : 'checkbox',
                                'name' : 'Simple',
                                'value' : 'simple',
                                'action' : 'apply_class'
                            },
                            'fdvertical' : {
                                'type' : 'checkbox',
                                'name' : 'Vertical',
                                'value' : 'vertical',
                                'action' : 'apply_class'
                            },
                            'fdnested' : {
                                'type' : 'checkbox',
                                'name' : 'Nested',
                                'value' : 'nested',
                                'action' : 'apply_class'
                            },
                            'fdsubmenu' : {
                                'type' : 'checkbox',
                                'name' : 'Sub-menu',
                                'value' : 'submenu',
                                'action' : 'apply_class'
                            },
                            'fdicontop' : {
                                'type' : 'checkbox',
                                'name' : 'Icon top',
                                'value' : 'icon-top',
                                'action' : 'apply_class'
                            }
                        }
                    },
                    'fdresponsive' : {
                        name : 'Responsive options',
                        fields : {
                            'fdverticalhorizontal' : {
                                'type' : 'select',
                                'show_empty' : true,
                                'name' : 'Responsive',
                                'options' : [
                                    { key: 'large-vertical', name: 'Large vertical' },
                                    { key: 'large-horizontal', name: 'Large horizontal' },
                                    { key: 'medium-horizontal', name: 'Medium horizontal' },
                                    { key: 'medium-vertical', name: 'Medium vertical' }
                                ],
                                'action' : 'apply_class'
                            },
                            'fddropdown' : {
                                'type' : 'select',
                                'name' : 'Responsive dropdown',
                                'show_empty' : true,
                                'action' : 'custom',
                                'options' : [
                                    { key: 'dropdown', name: 'Dropdown' },
                                    { key: 'medium-dropdown', name: 'Medium dropdown' },
                                    { key: 'large-dropdown', name: 'Large dropdown' }
                                ],
                                'get_value' : function (obj) {
                                    var $el = obj.data;
                                    var pgel = new pgQuery($el);

                                    var arr = ['dropdown', 'medium-dropdown', 'large-dropdown'];
                                    return getValueForResponsive(pgel, arr);
                                },
                                'set_value' : function(obj, value, values, oldValue, eventType) {
                                    var $el = obj.data;
                                    var pgel = new pgQuery($el);

                                    if (value == oldValue) return value;

                                    var arr = ['dropdown', 'medium-dropdown', 'large-dropdown'];
                                    setValueForResponsive(pgel, value, arr);
                                    return value;
                                }
                            },
                            'fddrilldown' : {
                                'type' : 'select',
                                'name' : 'Responsive drilldown',
                                'show_empty' : true,
                                'action' : 'custom',
                                'options' : [
                                    { key: 'drilldown', name: 'Drilldown' },
                                    { key: 'medium-drilldown', name: 'Medium drilldown' },
                                    { key: 'large-drilldown', name: 'Large drilldown' }
                                ],
                                'get_value' : function (obj) {
                                    var $el = obj.data;
                                    var pgel = new pgQuery($el);

                                    var arr = ['drilldown', 'medium-drilldown', 'large-drilldown'];
                                    return getValueForResponsive(pgel, arr);
                                },
                                'set_value' : function(obj, value, values, oldValue, eventType) {
                                    var $el = obj.data;
                                    var pgel = new pgQuery($el);

                                    if (value == oldValue) return value;

                                    var arr = ['drilldown', 'medium-drilldown', 'large-drilldown'];
                                    setValueForResponsive(pgel, value, arr);
                                    return value;
                                }
                            }
                        }
                    }
                })
            }
            f.addComponentType(list);
        // End List


        // Description
            var description = {
                'type' : 'fd-description',
                'selector' : 'dl',
                'code' : '<dl>\
                    <dt>Description lists</dt>\
                    <dd>A description list is perfect for defining terms.</dd>\
                    <dt>Euismod</dt>\
                    <dd>Vestibulum id ligula porta felis euismod semper eget lacinia odio sem nec elit.</dd>\
                </dl>',
                'name' : 'Description list',
                tags: 'major',
                action_menu: {
                    add: ['fd-description-term', 'fd-description-def']
                },
                'sections' : crsaAddStandardSections({
                })
            }
            f.addComponentType(description);


            var description_term = {
                'type' : 'fd-description-term',
                'selector' : 'dt',
                parent_selector: 'dl',
                'code' : '<dt>Term</dt>',
                'name' : 'Description term',
                'sections' : crsaAddStandardSections({
                    'fdcontent' : {
                        name : 'Term options',
                        fields : {
                            content : {
                                'type' : 'text',
                                'name' : 'Text',
                                'action' : 'element_html'
                            }
                        }
                    }
                })
            }
            f.addComponentType(description_term);

            var description_def = {
                'type' : 'fd-description-def',
                'selector' : 'dd',
                parent_selector: 'dl',
                'code' : '<dd>Term definition.</dd>',
                'name' : 'Description definition',
                'sections' : crsaAddStandardSections({
                    'fdcontent' : {
                        name : 'Definition options',
                        fields : {
                            content : {
                                'type' : 'text',
                                'name' : 'Text',
                                'action' : 'element_html'
                            }
                        }
                    }
                })
            }
            f.addComponentType(description_def);
        // End Description


        // Table
            // Tables helpers
            var isTableRowEmpty = function($tr) {
                var empty = true;
                $tr.find(">td").each(function(i,td) {
                    if($.trim(td.innerHTML).length > 0) {
                        empty = false;
                        return false;
                    }
                });
                return empty;
            }

            var countNonEmptyTableRows = function($tbody) {
                var c = 0;
                $tbody.find(">tr").each(function(i,tr) {
                    if(isTableRowEmpty($(tr))) c++;
                });
                return c;
            }

            var getTablePreviewCode = function(t) {
                return '<table class="table preview-' + t + '">\
                    <thead>\
                        <tr>\
                            <th>#</th>\
                            <th>First Name</th>\
                            <th>Last Name</th>\
                            <th>Username</th>\
                        </tr>\
                    </thead>\
                    <tbody>\
                        <tr class="sel">\
                            <td>1</td>\
                            <td class="sel">Mark</td>\
                            <td>Otto</td>\
                            <td>@mdo</td>\
                        </tr>\
                        <tr>\
                            <td>2</td>\
                            <td>Jacob</td>\
                            <td>Thornton</td>\
                            <td>@fat</td>\
                        </tr>\
                        <tr>\
                            <td>3</td>\
                            <td>Larry</td>\
                            <td>the Bird</td>\
                            <td>@twitter</td>\
                        </tr>\
                    </tbody>\
                </table>';
            }

            // Table
            var table = {
                'type' : 'fd-table',
                'selector' : 'table',
                tags: 'major',
                'code' : '<table>\
                    <thead>\
                        <tr>\
                            <th width="200">Table Header</th>\
                            <th>Table Header</th>\
                            <th width="150">Table Header</th>\
                            <th width="150">Table Header</th>\
                        </tr>\
                    </thead>\
                    <tbody>\
                        <tr>\
                            <td>Content Goes Here</td>\
                            <td>This is longer content Donec id elit non mi porta gravida at eget metus.</td>\
                            <td>Content Goes Here</td>\
                            <td>Content Goes Here</td>\
                        </tr>\
                        <tr>\
                            <td>Content Goes Here</td>\
                            <td>This is longer Content Goes Here Donec id elit non mi porta gravida at eget metus.</td>\
                            <td>Content Goes Here</td>\
                            <td>Content Goes Here</td>\
                        </tr>\
                        <tr>\
                            <td>Content Goes Here</td>\
                            <td>This is longer Content Goes Here Donec id elit non mi porta gravida at eget metus.</td>\
                            <td>Content Goes Here</td>\
                            <td>Content Goes Here</td>\
                        </tr>\
                    </tbody>\
                </table>',
                preview: getTablePreviewCode('table'),
                'name' : 'Table',
                'sections' : crsaAddStandardSections({
                    'data' : {
                        name: "Table options",
                        fields: {
                            rows: {
                                type: 'text',
                                name: 'Rows',
                                action: 'custom',
                                get_value: function(obj) {
                                    var $el = obj.data;
                                    var $tbody = $el.find('>tbody');
                                    var $rows = $tbody.find('>tr');
                                    return $rows.length;
                                },
                                set_value: function(obj, value, values, oldValue, eventType) {

                                    crsaWillChangeDom();

                                    value = parseInt(value) || 0;
                                    var $el = obj.data;
                                    var pgel = new pgQuery($el);
                                    var $tbody = $el.find('>tbody');
                                    var pgtbody = new pgQuery($tbody);
                                    if($tbody.length == 0) {
                                        //$tbody = $('<tbody/>').appendTo($el);
                                        pgtbody = new pgQuery().create('<tbody></tbody>');
                                        pgel.append(pgtbody);
                                        $tbody = $(pgtbody.get(0).el);
                                    }
                                    var $rows = $tbody.find('>tr');

                                    var cols = values.columns;
                                    var change = false;
                                    var empty_count = countNonEmptyTableRows($tbody);
                                    var new_value = value;

                                    if($rows.length < value) {
                                        for(var n = 0; n < value - $rows.length; n++) {
                                            //var $tr = $('<tr/>').appendTo($tbody);
                                            var pgtr = new pgQuery().create('<tr></tr>');
                                            pgtbody.append(pgtr);
                                            var $tr = $(pgtr.get(0).el);
                                            for(var c = 0; c < cols; c++) {
                                                pgtr.append(new pgQuery().create('<td></td>'));
                                                //$('<td/>').appendTo($tr);
                                            }
                                        }
                                        change = true;
                                    } else if($rows.length > value) {
                                        var remove = $rows.length - value;
                                        $rows.each(function(i,tr) {
                                            var $tr = $(tr);
                                            var pgtr = new pgQuery($tr);
                                            if(isTableRowEmpty($tr)) {
                                                pgtr.remove();
                                                remove--;
                                                if(remove == 0) return false;
                                            }
                                        });
                                        new_value = value + remove;
                                    } else {

                                    }
                                    if(eventType == "change") {
                                        $.fn.crsa("setNeedsUpdate", false, $el);
                                        value = new_value;
                                    }
                                    return value;
                                }
                            },
                            columns: {
                                type: 'text',
                                name: 'Columns',
                                action: 'custom',
                                get_value: function(obj) {
                                    var $el = obj.data;
                                    var $tbody = $el.find('>tbody');
                                    var $rows = $tbody.find('>tr');
                                    var max_c = 0;
                                    $rows.each(function(i, tr) {
                                        var c = $(tr).find('>td').length;
                                        if(c > max_c) max_c = c;
                                    });
                                    $el.find('>thead >tr').each(function(i, tr) {
                                        var c = $(tr).find('>th').length;
                                        if(c > max_c) max_c = c;
                                    });
                                    return max_c;
                                },
                                set_value: function(obj, value, values, oldValue, eventType) {

                                    crsaWillChangeDom();

                                    value = parseInt(value) || 0;
                                    var $el = obj.data;
                                    var $tbody = $el.find('>tbody,>thead');
                                    var $rows = $tbody.find('>tr');
                                    var new_value = value;
                                    if(value) {
                                        var max_c = 0;
                                        $rows.each(function(i, tr) {
                                            var cells = $(tr).find('>td,>th');
                                            if(cells.length > value) {
                                                var remove = cells.length - value;
                                                cells.each(function(n, td) {
                                                    var $td = $(td);
                                                    if($.trim(td.innerHTML) == '') {
                                                        //$td.remove();
                                                        new pgQuery($td).remove();
                                                        remove--;
                                                        if(remove == 0) return false;
                                                    }
                                                });
                                            } else if(cells.length < value) {
                                                for(var n = cells.length; n < value; n++) {
                                                    var tag = $(tr).parent().is('thead') ? 'th' : 'td';
                                                    new pgQuery($(tr)).append(new pgQuery().create('<' + tag + '></' + tag + '>'));
                                                    //$('<' + tag +'/>').appendTo($(tr));
                                                }
                                            }
                                            var c = $(tr).find('>td,>th');
                                            if(c > max_c) max_c = c;
                                        });
                                        new_value = max_c;
                                    }
                                    if(eventType == "change") {
                                        $.fn.crsa("setNeedsUpdate", false, $el);
                                        value = new_value;
                                    }
                                    return value;
                                }
                            },
                            'fdtabletype' : {
                                'type' : 'select',
                                'name' : 'Type',
                                'show_empty': true,
                                'options' : [
                                    { 'key' : 'hover', 'name' : 'Hover' },
                                    { 'key' : 'stack', 'name' : 'Stack' },
                                    { 'key' : 'scroll', 'name' : 'Scroll' }
                                ],
                                'action' : 'apply_class'
                            }
                        }
                    }
                })
            }
            f.addComponentType(table);
        // End Table


        // Accordion
            // Accordion item
            f.addComponentType({
                'type' : 'fd-accordion-item',
                'selector' : '.accordion-item',
                'code' : function() {
                    var id1 = getUniqueId('panel');

                    return '<li class="accordion-item">\
                        <a href="#' + id1 + '" role="tab" class="accordion-title" id="' + id1 + '-heading" aria-controls="' + id1 + '">Accordion</a>\
                        <div id="' + id1 + '" class="accordion-content" role="tabpanel" data-tab-content aria-labelledby="' + id1 + '-heading">\
                            Panel. Lorem ipsum dolor\
                        </div>\
                    </li>';
                },
                'name' : 'Accordion item',
                tags: 'major',
                priority: 100,
                'sections' : crsaAddStandardSections({
                    'fdacc' : {
                        name: 'Item options',
                        fields: {
                            'fdname' : {
                                'type' : 'text',
                                'name' : 'Name',
                                'action' : 'custom',
                                live_update : true,
                                set_value : function(obj, value, values, oldValue, eventType) {
                                    var $el = obj.data;
                                    new pgQuery($el.find('>a')).html(value);
                                    return value;
                                },
                                get_value: function(obj) {
                                    var $el = obj.data;
                                    return new pgQuery($el.find('>a')).html();
                                }
                            },
                            'fdid' : {
                                'type' : 'text',
                                'name' : 'id',
                                'action' : 'custom',
                                live_update : true,
                                set_value : function(obj, value, values, oldValue, eventType) {
                                    var $el = obj.data;
                                    var pgel = new pgQuery($el);
                                    var title = pgel.find('>a');
                                    var content = pgel.find('>.accordion-content');

                                    title.attr('href', '#' + value);
                                    title.attr('id', '#' + value + '-heading');
                                    title.attr('aria-controls', value);

                                    content.attr('id', value);
                                    content.attr('aria-labelledby', value + '-heading');

                                    return value;
                                },
                                get_value: function(obj) {
                                    var $el = obj.data;
                                    return new pgQuery($el.find('>a')).attr('aria-controls');
                                }
                            },
                            'fdbuttonstacking' : {
                                'type' : 'checkbox',
                                'name' : 'Active',
                                'value' : 'is-active',
                                'action' : 'apply_class',
                                on_changed : function () {
                                    showOrbitMessage();
                                }
                            }
                        }
                    }
                })
            });

            // Accordion
            f.addComponentType({
                'type' : 'fd-accordion',
                'selector' : '[data-accordion-menu], [data-accordion]',
                'code' : function() {
                    var id1 = getUniqueId('panel');
                    var id2 = getUniqueId('panel');
                    var id3 = getUniqueId('panel');

                    return '<ul class="accordion" data-accordion role="tablist">\
                        <li class="accordion-item is-active">\
                            <a href="#' + id1 + '" role="tab" class="accordion-title" id="' + id1 + '-heading" aria-controls="' + id1 + '">Accordion 1</a>\
                            <div id="' + id1 + '" class="accordion-content" role="tabpanel" data-tab-content aria-labelledby="' + id1 + '-heading">\
                                Panel 1. Lorem ipsum dolor\
                            </div>\
                        </li>\
                        <li class="accordion-item">\
                            <a href="#' + id2 + '" role="tab" class="accordion-title" id="' + id2 + '-heading" aria-controls="' + id2 + '">Accordion 2</a>\
                            <div id="' + id2 + '" class="accordion-content" role="tabpanel" data-tab-content aria-labelledby="' + id2 + '-heading">\
                                Panel 2. Lorem ipsum dolor\
                            </div>\
                        </li>\
                        <li class="accordion-item">\
                            <a href="#' + id3 + '" role="tab" class="accordion-title" id="' + id3 + '-heading" aria-controls="' + id3 + '">Accordion 3</a>\
                            <div id="' + id3 + '" class="accordion-content" role="tabpanel" data-tab-content aria-labelledby="' + id3 + '-heading">\
                                Panel 3. Lorem ipsum dolor\
                            </div>\
                        </li>\
                    </ul>';
                },
                'name' : 'Accordion',
                last_type: true,
                tags: 'major',
                priority: 100,
                on_inserted : function() {
                    showOrbitMessage();
                    showOrbitMessage();
                },
                on_changed : function() {
                    showOrbitMessage();
                },
                action_menu: {
                    add: ['fd-accordion-item']
                },
                'sections' : crsaAddStandardSections({
                    'fdaccordion': {
                        'name' : 'Accordion options',
                        'fields' : {
                            'fdexpand' : {
                                'type' : 'checkbox',
                                'value' : 'true',
                                'negvalue' : 'false',
                                'action' : 'element_attribute',
                                'attribute' : 'data-multi-expand',
                                'name' : 'Multi expand'
                            },
                            'fdclose' : {
                                'type' : 'checkbox',
                                'value' : 'true',
                                'negvalue' : 'false',
                                'action' : 'element_attribute',
                                'attribute' : 'data-allow-all-closed',
                                'name' : 'Allow closing'
                            }
                        }
                    }
                })
            });
        // End Accordion


        // Callout
            f.addComponentType({
                'type' : 'fd-callout',
                'selector' : '.callout',
                'code' : '<div class="callout">\
                    <h5>This is a callout.</h5>\
                    <p>It has an easy to override visual style, and is appropriately subdued.</p>\
                    <a href="#">It\'s dangerous to go alone, take this.</a>\
                </div>',
                'name' : 'Callout',
                priority: 100,
                'sections' : crsaAddStandardSections({
                    'fdstyle': {
                        'name' : 'Callout options',
                        'fields' : {
                            'fdcolor' : {
                                'type' : 'select',
                                'action' : 'apply_class',
                                'name' : 'Color',
                                'show_empty' : true,
                                'options' : [
                                    { key: 'secondary', name: 'Secondary' },
                                    { key: 'primary', name: 'Primary' },
                                    { key: 'success', name: 'Success' },
                                    { key: 'warning', name: 'Warning' },
                                    { key: 'alert', name: 'Alert' }
                                ]
                            },
                            'fdsize' : {
                                'type' : 'select',
                                'action' : 'apply_class',
                                'name' : 'Size',
                                'show_empty' : true,
                                'options' : [
                                    { key: 'small', name: 'Small' },
                                    { key: 'large', name: 'Large' }
                                ]
                            },
                            'fdcloseable' : {
                                'type' : 'checkbox',
                                'action' : 'custom',
                                'value' : '1',
                                'name' : 'Closeable',
                                get_value : function (obj) {
                                    var $el = obj.data;
                                    var pgel = new pgQuery($el);

                                    return pgel.attr('data-closable') ? '1' : null;
                                },
                                set_value : function(obj, value, values, oldValue, eventType) {
                                    var $el = obj.data;
                                    var pgel = new pgQuery($el);

                                    if (value == 1) {
                                        pgel.attr('data-closable', 'true');
                                        var button = pgel.find('>.close-button');
                                        if (button.length == 0) {
                                            button = new pgQuery().create('<button class="close-button" aria-label="Dismiss alert" type="button"><span aria-hidden="true">&times;</span></button>')
                                            pgel.append(button);
                                        }
                                    }
                                    else {
                                        pgel.removeAttr('data-closable');
                                        var button = pgel.find('>.close-button');
                                        button.remove();
                                    }

                                    return value;
                                }
                            }
                        }
                    }
                })
            });
        // End Callout


        // Tabs
            f.addComponentType({
                'type' : 'fd-tabs',
                'selector' : '.tabs',
                'code' : function() {
                    var idContent = getUniqueId('panel-content');
                    var id1 = getUniqueId('panel');
                    var id2 = getUniqueId('panel');
                    var id3 = getUniqueId('panel');
                    var id4 = getUniqueId('panel');

                    return '<ul class="tabs" data-tabs id="' + idContent + '">\
                      <li class="tabs-title is-active"><a href="#' + id1 + '" aria-selected="true">Tab 1</a></li>\
                      <li class="tabs-title"><a href="#' + id2 + '">Tab 2</a></li>\
                      <li class="tabs-title"><a href="#' + id3 + '">Tab 3</a></li>\
                      <li class="tabs-title"><a href="#' + id4 + '">Tab 4</a></li>\
                    </ul>';
                },
                'name' : 'Tabs',
                tags: 'major',
                last_type: true,
                priority: 100,
                on_inserted : function($el) {
                    var pgel = new pgQuery($el);
                    var idContent = $el.attr('id');
                    var pgtc = new pgQuery().create('<div class="tabs-content" data-tabs-content="' + idContent + '">').insertAfter(pgel);

                    $el.children().each(function(i, t) {
                        var id = $(t).find('>a').attr('href');
                        if(id) id = id.replace('#', '');
                        var pgp = new pgQuery().create('<div class="tabs-panel"><p>Tab ' + (i+1) + ' content goes here...</p></div>');
                        if(id) pgp.attr('id', id);
                        if(i == 0) pgp.addClass('is-active');
                        pgtc.append(pgp);
                    });
                    showOrbitMessage();
                },
                on_changed : function() {
                    showOrbitMessage();
                },
                action_menu: {
                    add: ['fd-tabs-item'],
                    on_add : function($el, $new, newdef, prepend) {
                        var pgel = new pgQuery($el);
                        var pgnew = new pgQuery($new);
                        var id = $new.find('>a').attr('href').replace('#','');
                        var pgdiv = new pgQuery().create('<div class="tabs-panel" id="' + id + '"><p>Tab content goes here...</p></div>');
                        var $tabs = $el.next('.tabs-content');
                        var pgtabs = new pgQuery($tabs);
                        if(prepend) {
                            pgtabs.prepend(pgdiv);
                            pgel.prepend(pgnew);
                        } else {
                            pgtabs.append(pgdiv);
                            pgel.append(pgnew);
                        }
                    }
                },
                'sections' : crsaAddStandardSections({
                    'fdtabs' : {
                        name: 'Tabs options',
                        fields: {
                            fddest : {
                                'type' : 'checkbox',
                                'name' : 'Vertical',
                                value : '1',
                                'action' : 'custom',
                                set_value : function(obj, value, values, oldValue, eventType) {
                                    var $el = obj.data;
                                    var pgel = new pgQuery($el);
                                    if(value) {
                                        pgel.addClass('vertical');
                                        var $tabs = $el.next('.tabs-content');
                                        new pgQuery($tabs).addClass('vertical');
                                    } else {
                                        pgel.removeClass('vertical');
                                        var $tabs = $el.next('.tabs-content');
                                        new pgQuery($tabs).removeClass('vertical');
                                    }
                                    return value;
                                },
                                get_value: function(obj) {
                                    var $el = obj.data;
                                    var pgel = new pgQuery($el);
                                    return pgel.hasClass('vertical');
                                }
                            }
                        }
                    }
                })
            });

            // Tab content
            f.addComponentType({
                'type' : 'fd-tabs-content',
                'selector' : '.tabs-content',
                'name' : 'Tabs content',
                priority: 99,
                'sections' : crsaAddStandardSections({
                })
            });

            // Tab item
            f.addComponentType({
                'type' : 'fd-tabs-item',
                'selector' : '.tabs-title',
                'code' : function() {
                    var id1 = getUniqueId('panel');
                    return '<li class="tabs-title"><a href="#' + id1 + '">Tab</a></li>';
                },
                'name' : 'Tabs item',
                tags: 'major',
                priority: 100,
                'sections' : crsaAddStandardSections({
                    'fdacc' : {
                        name: 'Item options',
                        fields: {
                            fddest : {
                                'type' : 'text',
                                'name' : 'Panel id',
                                'action' : 'custom',
                                live_update : false,
                                set_value : function(obj, value, values, oldValue, eventType) {
                                    var $el = obj.data;
                                    var pgel = new pgQuery($el);
                                    new pgQuery($el.find('>a')).attr('href', '#' + value);
                                    var $tabs = $el.parent().next('.tabs-content');
                                    if($tabs.find('#' + value).length == 0) {
                                        showAlert('Can not find tab content with this id.', 'No tab content');
                                    } else {
                                        showOrbitMessage();
                                    }
                                    return value;
                                },
                                get_value: function(obj) {
                                    var $el = obj.data;
                                    var pgel = new pgQuery($el);
                                    var h = new pgQuery($el.find('>a')).attr('href');
                                    return h ? h.replace('#','') : null;
                                }
                            },
                            fdname : {
                                'type' : 'text',
                                'name' : 'Name',
                                'action' : 'custom',
                                live_update : true,
                                set_value : function(obj, value, values, oldValue, eventType) {
                                    var $el = obj.data;
                                    var pgel = new pgQuery($el);
                                    new pgQuery($el.find('>a')).html(value);
                                    return value;
                                },
                                get_value: function(obj) {
                                    var $el = obj.data;
                                    return new pgQuery($el.find('>a')).html();
                                }
                            },
                            fdactive: {
                                'type' : 'checkbox',
                                'name' : 'Active',
                                'action' : 'custom',
                                'value' : '1',
                                set_value : function(obj, value, values, oldValue, eventType) {
                                    var $el = obj.data;
                                    var id = new pgQuery($el.find('>a')).attr('href');
                                    var idContent = $el.parent().attr('id');
                                    var $tabs = $el.closest('body').find('[data-tabs-content="' + idContent + '"]');
                                    if ($tabs.length == 0) {
                                        showAlert("Can't find tabs content with this element id. Add a tab content first.", "Tab content not found");
                                    }
                                    else {
                                        var $tabContent = $tabs.find(id);
                                        if (value == '1') {
                                            new pgQuery($el).addClass('is-active');
                                            new pgQuery($tabContent).addClass('is-active');
                                        }
                                        else {
                                            new pgQuery($el).removeClass('is-active');
                                            new pgQuery($tabContent).removeClass('is-active');
                                        }
                                        return value;
                                    }
                                },
                                get_value: function(obj) {
                                    var $el = obj.data;
                                    var pgel = new pgQuery($el);
                                    return pgel.hasClass('is-active') ? '1' : null;
                                }
                            }
                        }
                    }
                })
            });

            // Tab panel
            f.addComponentType({
                'type' : 'fd-tab-panel',
                'selector' : '.tabs-panel',
                'name' : 'Tab panel',
                priority: 99,
                'sections' : crsaAddStandardSections({
                })
            });
        // EndTabs


        // Badge
            f.addComponentType({
                'type' : 'fd-badge',
                'selector' : '.badge',
                'name' : 'Badge',
                'code' : '<span class="badge">1</span>',
                priority: 99,
                'sections' : crsaAddStandardSections({
                    'fdstyle' : {
                        'name' : 'Badge options',
                        'fields' : {
                            'fdcolor' : {
                                'type' : 'select',
                                'action' : 'apply_class',
                                'show_empty' : true,
                                'name' : 'Color',
                                'options' : [
                                    { 'key' : 'secondary', 'name' : 'Secondary' },
                                    { 'key' : 'info', 'name' : 'Info' },
                                    { 'key' : 'success', 'name' : 'Success' },
                                    { 'key' : 'alert', 'name' : 'Alert' },
                                    { 'key' : 'warning', 'name' : 'Warning' }
                                ]
                            }
                        }
                    }
                })
            });
        // End Badge


        // Tags
            var tag = {
                'type' : 'tag',
                'selector' : function($el) { return true },
                'name' : 'Div',
                'display_name' : 'tag',
                'priority' : 2001,
                'sections' : crsaAddStandardSections({
                    attributes : {
                        inherit: true
                    }
                })
            }
            f.addComponentType(tag);
        // End Tags


        // Section Definition
            // Section helpers
            var getTypes = function(list) {
                var r = [];
                for(var i = 0; i < list.length; i++) {
                    if(typeof list[i] == 'string') {
                        var def = f.getComponentType(list[i]);
                        if(def) {
                            r.push(def);
                        }
                    } else {
                        r.push(list[i]);
                    }
                }
                return r;
            }

            var section = new PgFrameworkLibSection('fdgrid', 'Grid');
            section.setComponentTypes(getTypes(['fd-row','fd-column','fd-block-column', 'fd-clear']));
            f.addLibSection(section);

            section = new PgFrameworkLibSection('fdnavigation', 'Navigation');
            section.setComponentTypes( getTypes(['fd-offsite', 'fd-topbar', 'fd-iconbar', 'fd-sidenav', 'fd-sticky','fd-breadcrumbs', 'fd-pagination']));
            f.addLibSection(section);

            section = new PgFrameworkLibSection('fdmedia', 'Media');
            section.setComponentTypes( getTypes(['fd-orbit', 'fd-thumbnail', 'fd-badge', 'fd-lightbox', 'fd-flexvideo']));
            f.addLibSection(section);

            section = new PgFrameworkLibSection('fdforms', 'Forms');
            section.setComponentTypes( getTypes(['fd-form', 'fd-form-column', 'fd-label', 'fd-label-only', 'fd-input', 'fd-range-slider', 'fd-two-handles-range-slider', 'fd-switch', 'fd-textarea', 'fd-select', 'fd-input-group', 'fd-input-group-field', 'fd-input-group-label', 'fd-input-group-button', 'fd-button', 'fd-fieldset', 'fd-postfix', 'fd-error']));
            f.addLibSection(section);

            section = new PgFrameworkLibSection('fdbuttons', 'Buttons');
            section.setComponentTypes( getTypes(['fd-a-button', 'fd-button-group', 'fd-button-bar', 'fd-split-button', 'fd-close-button']));
            f.addLibSection(section);

            section = new PgFrameworkLibSection('fdtype', 'Type');
            section.setComponentTypes( getTypes(['fd-h1','fd-h2','fd-h3','fd-h4','fd-h5','fd-h6','fd-small', 'fd-p', 'fd-a', 'fd-list', 'fd-list-item', 'fd-description', 'fd-description-term', 'fd-description-def', 'fd-blockquote', 'fd-vcard', 'fd-span-label','fd-kbd' ]));
            f.addLibSection(section);

            section = new PgFrameworkLibSection('fdcallouts', 'Callouts &amp; Prompts');
            section.setComponentTypes( getTypes(['fd-reveal-modal', 'fd-alert', 'fd-panel', 'fd-tooltip', 'fd-joyride']));
            f.addLibSection(section);

            section = new PgFrameworkLibSection('fdcontent', 'Content');
            section.setComponentTypes( getTypes(['fd-dropdown-button', 'fd-list-dropdown', 'fd-magellan', 'fd-drilldown', 'fd-callout', 'fd-media-object', 'fd-pricing', 'fd-progress-bar', 'fd-table','fd-accordion','fd-tabs', 'fd-offcanvas-wraper', 'fd-offcanvas-wraper-topbar', 'fd-offcanvas-toggle']));
            f.addLibSection(section);
        // End Section Definition

        f.pppon_page_loaded = function(crsaPage) {
            /*
            var $html = crsaPage.get$Html();

            if($html.find('ul.clearing-thumbs').length > 0) {
                pinegrow.setNeedsUpdate($(crsaPage.getBody()));
            }

            $html.find('[data-orbit]').each(function(i,e) {
                crsaQuickMessage("Orbit slider detected. It is recommended to pause the slider for better performance.", 2000);

            });
            */
        }

        f.on_set_inline_style = function(page, o) {
            o.css += '\
            .pg-show-modal {\
            visibility: visible;\
            display: block;\
            position: relative;\
            opacity: 1;\
            }';
        }

        var templatesOrder = ["blank.html", "branded.html", "blog.html", "feed.html", "grid.html", "orbit-home.html", "banner-home.html", "sidebar.html", "contact.html", "marketing.html", "reality.html", "so-boxy.html", "store.html", "workspace.html"];

        //Register starting page template
        f.addTemplateProjectFromResourceFolder('template', null, 3, function (node) {
            var nodeIndex = templatesOrder.indexOf(node.name);
            if (nodeIndex >= 0) node.order = nodeIndex;
        });

    });
});