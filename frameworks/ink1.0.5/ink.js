$(function() {

    $('body').one('pinegrow-ready', function(e, pinegrow) {
        var f = new PgFramework('ink.1.0.5', 'Responsive email');
        f.type = "ink";
        f.allow_single_type = true;

        f.description = 'Responsive email builder.';
        f.author = 'Pinegrow';
        f.author_link = 'http://pinegrow.com';

        f.ignore_css_files = [/(^|\/)ink\.css/i];
        f.detect = function(crsaPage) {
            return crsaPage.hasStylesheet(/(^|\/)ink(\.min|)\.css/i);
        }

        f.setScriptFileByScriptTagId('plugin-ink-1-0-5');
        pinegrow.addFramework(f, 6);

        // Components

        // Helper methods
        var getStyleFor = function (attr, value) {
            return attr + ":" + value + ";";
        }
        // End helper methods

        // Container
            f.addComponentType({
                'type' : 'ink-container',
                'selector' : '.container',
                'name' : 'Container',
                'tags' : 'major',
                'priority' : 100,
                'parent_selector' : 'td',
                'code' : '<table class="container">\
                    <tbody>\
                        <tr>\
                            <td>\
                            </td>\
                        </tr>\
                    </tbody>\
                </table>',
                action_menu : {
                    add: ['ink-row', 'ink-block-grid'],
                    on_add : function($el, $new, newdef, prepend) {
                        var pgel = new pgQuery($el);
                        var pgnew = new pgQuery($new);

                        var pgtbody = pgel.find('> tbody');
                        if (pgtbody.length > 0) {
                            pgel = pgtbody;
                        }

                        var pgtr = new pgQuery().create('<tr><td></td></tr>');
                        var pgtd = pgtr.find('> td')
                        pgtd.append(pgnew);

                        if(prepend) {
                            pgel.prepend(pgtr);
                        } else {
                            pgel.append(pgtr);
                        }
                    }
                }
            });
        // End container


        // Row & column
            // Helper culomn methods
            var getColumnGridOption = function (options, extend) {
                options = options || {};
                var fields = $.extend({}, {
                    'span' : {
                        'type' : 'select',
                        'name' : 'Length',
                        'action' : 'apply_class',
                        'show_empty' : true,
                        'options' : [
                            { 'key' : 'one'    + ( extend ? '-' + extend : '' ), 'name' : '1' },
                            { 'key' : 'two'    + ( extend ? '-' + extend : '' ), 'name' : '2' },
                            { 'key' : 'three'  + ( extend ? '-' + extend : '' ), 'name' : '3' },
                            { 'key' : 'four'   + ( extend ? '-' + extend : '' ), 'name' : '4' },
                            { 'key' : 'five'   + ( extend ? '-' + extend : '' ), 'name' : '5' },
                            { 'key' : 'six'    + ( extend ? '-' + extend : '' ), 'name' : '6' },
                            { 'key' : 'seven'  + ( extend ? '-' + extend : '' ), 'name' : '7' },
                            { 'key' : 'eight'  + ( extend ? '-' + extend : '' ), 'name' : '8' },
                            { 'key' : 'nine'   + ( extend ? '-' + extend : '' ), 'name' : '9' },
                            { 'key' : 'ten'    + ( extend ? '-' + extend : '' ), 'name' : '10' },
                            { 'key' : 'eleven' + ( extend ? '-' + extend : '' ), 'name' : '11' },
                            { 'key' : 'twelve' + ( extend ? '-' + extend : '' ), 'name' : '12' }
                        ]
                    }
                }, options);
                var columnOption = {
                    'inkcolumn' : {
                        'name' : 'Column options',
                        'fields' : fields
                    }
                };

                return columnOption;
            }


            // Wrapper
            f.addComponentType({
                'type' : 'ink-wrapper',
                'selector' : '.wrapper',
                'name' : 'Wrapper',
                'tags' : 'major',
                'priority' : 100,
                'parent_selector' : 'tr',
                'code' : '<td class="wrapper"></td>',
                action_menu : {
                    add: ['ink-column'],
                },
                'sections' : {
                     'inkwrapper' : {
                        'name' : 'Wrapper options',
                        'fields' : {
                            'inkoffset' : {
                                'type' : 'select',
                                'name' : 'Offset',
                                'action' : 'apply_class',
                                'show_empty' : true,
                                'options' : [
                                    { 'key' : 'offset-by-one', 'name' : '1' },
                                    { 'key' : 'offset-by-two', 'name' : '2' },
                                    { 'key' : 'offset-by-three', 'name' : '3' },
                                    { 'key' : 'offset-by-four', 'name' : '4' },
                                    { 'key' : 'offset-by-five', 'name' : '5' },
                                    { 'key' : 'offset-by-six', 'name' : '6' },
                                    { 'key' : 'offset-by-seven', 'name' : '7' },
                                    { 'key' : 'offset-by-eight', 'name' : '8' },
                                    { 'key' : 'offset-by-nine', 'name' : '9' },
                                    { 'key' : 'offset-by-ten', 'name' : '10' },
                                    { 'key' : 'offset-by-eleven', 'name' : '11' },
                                    { 'key' : 'offset-by-twelve', 'name' : '12' }
                                ]
                            },
                            'inklast' : {
                                'type' : 'checkbox',
                                'name' : 'Last column',
                                'action' : 'apply_class',
                                'value' : 'last'
                            }
                        }
                    }
                }
            });

            // Row
            f.addComponentType({
                'type' : 'ink-row',
                'selector' : '.row',
                'name' : 'Row',
                'tags' : 'major',
                'priority' : 100,
                'parent_selector' : 'td',
                'code' : '<table class="row">\
                    <tbody>\
                        <tr>\
                            <td class="wrapper">\
                            </td>\
                        </tr>\
                    </tbody>\
                </table>',
                action_menu : {
                    add: ['ink-column', 'ink-wrapper'],
                    on_add : function($el, $new, newdef, prepend) {
                        var pgel = new pgQuery($el.find('> tbody'));
                        var pgnew = new pgQuery($new);

                        if (newdef.type == 'ink-column') {
                            pgel = new pgQuery($($el.find('tr').get(0)));
                            var pgwrapper = new pgQuery().create('<td class="wrapper"></td>');
                            pgwrapper.append(pgnew);
                            pgnew = pgwrapper;
                        } else if (newdef.type == 'ink-wrapper') {
                            pgel = new pgQuery($($el.find('tr').get(0)));
                        }

                        if(prepend) {
                            pgel.prepend(pgnew);
                        } else {
                            pgel.append(pgnew);
                        }
                     }
                },
            });

            // Column
            f.addComponentType({
                'type' : 'ink-column',
                'selector' : '.columns',
                'name' : 'Column',
                'tags' : 'major',
                'priority' : 100,
                'parent_selector' : 'td.wrapper',
                'code' : '<table class="four columns">\
                    <tbody>\
                        <tr>\
                            <td>Four Columns</td>\
                            <td class="expander"></td>\
                        </tr>\
                    </tbody>\
                </table>',
                action_menu : {
                    add: ['ink-row', 'ink-subcolumn'],
                    on_add : function($el, $new, newdef, prepend) {
                        var pgel = new pgQuery($el.find('> tbody'));
                        var pgnew = new pgQuery($new);

                        if (newdef.type == 'ink-row') {
                            var pgcenter = new pgQuery().create('<tr><td class="center" align="center"><center></center></td></tr>');
                            pgcenter.find('center').append(pgnew);
                            pgnew = pgcenter;
                        } else if (newdef.type == 'ink-subcolumn') {
                            pgel = new pgQuery($el.find('> tbody > tr'));
                        }

                        if(prepend) {
                            pgel.prepend(pgnew);
                        } else {
                            pgel.append(pgnew);
                        }
                    }
                },
                'sections' : getColumnGridOption()
            });

            // Sub column
            f.addComponentType({
                'type' : 'ink-subcolumn',
                'selector' : '.sub-columns',
                'name' : 'Sub column',
                'tags' : 'major',
                'priority' : 100,
                'parent_selector' : 'tr',
                parent_selector : function ($el) {
                    var pgparent =  new pgQuery($el).parent().parent();
                    return (
                        (pgparent.is('table') && pgparent.hasClass('columns')) ||
                        (pgparent.parent().is('td') && pgparent.parent().hasClass('sub-grid'))
                    );
                },
                'code' : '<td class="four sub-columns">.four.sub-columns</td>',
                'sections' : getColumnGridOption({
                    'inklast' : {
                        'type' : 'checkbox',
                        'name' : 'Last column',
                        'action' : 'apply_class',
                        'value' : 'last'
                    }
                }, '')
            });

            // Sub grid
            f.addComponentType({
                'type' : 'ink-subgrid',
                'selector' : '.sub-grid',
                'name' : 'Sub grid',
                'tags' : 'major',
                'priority' : 101,
                'parent_selector' : 'tr',
                action_menu : {
                    add: ['ink-subcolumn'],
                    on_add : function($el, $new, newdef, prepend) {
                        var pgel = new pgQuery($el.find('> table > tbody'));
                        var pgnew = new pgQuery($new);

                        if (newdef.type == 'ink-subcolumn') {
                            pgel = new pgQuery($el.find('> table > tbody > tr'));
                        }

                        if(prepend) {
                            pgel.prepend(pgnew);
                        } else {
                            pgel.append(pgnew);
                        }
                    }
                },
                parent_selector : function ($el) {
                    var pgparent =  new pgQuery($el).parent().parent();
                    return pgparent.is('table') && pgparent.hasClass('columns');
                },
                'code' : '<td class="sub-grid">\
                    <table>\
                        <tbody>\
                            <tr>\
                            </tr>\
                        </tbody>\
                    </table>\
                </td>',
                'sections' : {
                     'inksubgrid' : {
                        'name' : 'Sub grid options',
                        'fields' : {
                            'inkpanel' : {
                                'type' : 'checkbox',
                                'name' : 'Panel',
                                'value' : 'panel',
                                'action' : 'apply_class'
                            }
                        }
                    }
                }
            });

            // Expander
            f.addComponentType({
                'type' : 'ink-expander',
                'selector' : '.expander',
                'name' : 'Expander',
                'parent_selector' : 'tr',
                'code' : '<td class="expander"></td>'
            });

            // Block grid
            f.addComponentType({
                'type' : 'ink-block-grid',
                'selector' : '.block-grid',
                'name' : 'Block grid',
                'tags' : 'major',
                'priority' : 100,
                'parent_selector' : 'td',
                'code' : '<table class="block-grid two-up">\
                    <tbody>\
                        <tr>\
                            <td>Column #1</td>\
                            <td>Column #2</td>\
                        </tr>\
                    </tbody>\
                </table>',
                'sections' : getColumnGridOption({}, 'up')
            });
        // End row & column


        // Panel
            f.addComponentType({
                'type' : 'ink-panel',
                'selector' : '.panel',
                'name' : 'Panel',
                'tags' : 'major',
                'priority' : 99,
                'parent_selector' : 'tr',
                'code' : '<td class="panel">Panel</td>'
            });
        // End panel


        // Button
            f.addComponentType({
                'type' : 'ink-button',
                'selector' : '.button,.tiny-button,.small-button,.medium-button,.large-button',
                'name' : 'Button',
                'tags' : 'major',
                'priority' : 100,
                'parent_selector' : 'td',
                'code' : '<table class="button">\
                    <tbody>\
                        <tr>\
                            <td><a href="#">Button Label</a></td>\
                        </tr>\
                    </tbody>\
                </table>',
                'sections' : {
                    'inkbutton' : {
                        'name' : 'Button options',
                        'fields' : {
                            'inksize' : {
                                'type' : 'select',
                                'name' : 'Size',
                                'action' : 'apply_class',
                                'show_empty' : true,
                                'options' : [
                                    { 'key' : 'tiny-button', 'name' : 'Tiny' },
                                    { 'key' : 'small-button', 'name' : 'Small' },
                                    { 'key' : 'medium-button', 'name' : 'Medium' },
                                    { 'key' : 'large-button', 'name' : 'Large' }
                                ]
                            },
                            'inkcolor' : {
                                'type' : 'select',
                                'name' : 'Color',
                                'action' : 'apply_class',
                                'show_empty' : true,
                                'options' : [
                                    { 'key' : 'primary', 'name' : 'Primary' },
                                    { 'key' : 'secondary', 'name' : 'Secondary' },
                                    { 'key' : 'alert', 'name' : 'Alert' },
                                    { 'key' : 'success', 'name' : 'Success' }
                                ]
                            },
                            'inkradius' : {
                                'type' : 'select',
                                'name' : 'Radius',
                                'action' : 'apply_class',
                                'show_empty' : true,
                                'options' : [
                                    { 'key' : 'radius', 'name' : 'Radius' },
                                    { 'key' : 'round', 'name' : 'Round' }
                                ]
                            }
                        }
                    }
                }
            });
        // End button


        // Image
            f.addComponentType({
                'type' : 'ink-img',
                'selector' : 'img',
                'display_name' : 'tag',
                'sections' : {
                    'inkimage' : {
                        'name' : 'Image options',
                        'fields' : {
                            'inksize' : {
                                'type' : 'select',
                                'name' : 'Size',
                                'show_empty' : true,
                                'options' : [
                                    { 'key' : '1', 'name' : '1' },
                                    { 'key' : '2', 'name' : '2' },
                                    { 'key' : '3', 'name' : '3' },
                                    { 'key' : '4', 'name' : '4' },
                                    { 'key' : '5', 'name' : '5' },
                                    { 'key' : '6', 'name' : '6' },
                                    { 'key' : '7', 'name' : '7' },
                                    { 'key' : '8', 'name' : '8' },
                                    { 'key' : '9', 'name' : '9' },
                                    { 'key' : '10', 'name' : '10' },
                                    { 'key' : '11', 'name' : '11' },
                                    { 'key' : '12', 'name' : '12' }
                                ],
                                'action' : 'custom',
                                get_value : function (obj) {
                                    var $el = obj.data;
                                    var pgel = new pgQuery($el);
                                    var sizes = {
                                        '30' : '1',
                                        '80' : '2',
                                        '130' : '3',
                                        '180' : '4',
                                        '230' : '5',
                                        '280' : '6',
                                        '330' : '7',
                                        '380' : '8',
                                        '430' : '9',
                                        '480' : '10',
                                        '530' : '11',
                                        '580' : '12'
                                    }

                                    return sizes[pgel.attr('width')];
                                },
                                set_value : function(obj, value, values, oldValue, eventType) {
                                    var $el = obj.data;
                                    var pgel = new pgQuery($el);
                                    var sizes = {
                                        '1' : '30',
                                        '2' : '80',
                                        '3' : '130',
                                        '4' : '180',
                                        '5' : '230',
                                        '6' : '280',
                                        '7' : '330',
                                        '8' : '380',
                                        '9' : '430',
                                        '10' : '480',
                                        '11' : '530',
                                        '12' : '580'
                                    }

                                    pgel.attr('width', sizes[value]);
                                    return value;
                                }
                            }
                        }
                    }
                }
            });
        // End image


        // Table
            f.addComponentType({
                'type' : 'ink-tr',
                'selector' : 'tr',
                'name' : 'Table row',
            });

            f.addComponentType({
                'type' : 'ink-td',
                'selector' : 'td',
                'name' : 'Table column',
                'sections' : {
                    'inktablecolumn' : {
                        name : 'Table column options',
                        fields : {
                            'inkbcolor' : {
                                'type' : 'checkbox',
                                'name' : 'Center',
                                'action' : 'apply_class',
                                'value' : 'center'
                            },
                            'inktextpad' : {
                                'type' : 'select',
                                'name' : 'Text pad',
                                'action' : 'apply_class',
                                'show_empty' : true,
                                'options' : [
                                    { 'key' : 'text-pad', 'name' : 'Text pad' },
                                    { 'key' : 'left-text-pad', 'name' : 'Left text pad' },
                                    { 'key' : 'right-text-pad', 'name' : 'Right text pad' }
                                ]
                            }
                        }
                    }
                }
            });

            f.addComponentType({
                'type' : 'ink-table',
                'selector' : 'table',
                'name' : 'Table',
                'tags' : 'major',
                'sections' : {
                    'inktable' : {
                        name : 'Table options',
                        fields : {
                            'inkbcolor' : {
                                'type' : 'color',
                                'name' : 'Background color',
                                'action' : 'custom',
                                get_value : function (obj) {
                                    var $el = obj.data;
                                    var style = styleToObject(new pgQuery($el).attr('style'));
                                    return style['background'];
                                },
                                set_value : function(obj, value, values, oldValue, eventType) {
                                    var $el = obj.data;
                                    var pgel = new pgQuery($el);

                                    setStyle(pgel, getStyleFor('background', value), getStyleFor('background', oldValue));
                                    return value;
                                }
                            }
                        }
                    }
                }
            });
        // End table


        // All elements
            f.addComponentType({
                'type' : 'ink-body',
                'selector' : 'body',
                'display_name' : 'tag',
                'sections' : {
                    'inkbody' : {
                        'name' : 'Options',
                        'fields' : {
                            'inkoutlook' : {
                                'type' : 'checkbox',
                                'name' : 'Test outlook',
                                'action' : 'apply_class',
                                'value' : 'outlook'
                            }
                        }
                    }
                }
            });

            f.addComponentType({
                'type' : 'ink-elements',
                'selector' : '*',
                'display_name' : 'tag',
                'sections' : {
                    'inkoptions' : {
                        'name' : 'Visibility',
                        'fields' : {
                            'inksmall' : {
                                'type' : 'select',
                                'name' : 'Small',
                                'action' : 'apply_class',
                                'show_empty' : true,
                                'options' : [
                                    { 'key' : 'show-for-small', 'name' : 'Show for small' },
                                    { 'key' : 'hide-for-small', 'name' : 'Hide for small' }
                                ]
                            }
                        }
                    }
                }
            });
        // End all elements


        // Components
            // Navbar
            f.addComponentType({
                'type' : 'ink-navbar',
                'selector' : '.navbar',
                'name' : 'Navbar',
                'parent_selector' : 'center',
                'on_inserted' : function ($el) {
                    $el.parent().removeClass('pg-empty-placeholder');
                },
                'code' : '<table class="row navbar" style="background:#262526;">\
                    <tbody>\
                        <tr>\
                            <td class="center" align="center">\
                                <center>\
                                    <table class="container">\
                                        <tbody>\
                                            <tr>\
                                                <td class="wrapper last">\
                                                    <table class="twelve columns">\
                                                        <tbody>\
                                                            <tr>\
                                                                <td class="six sub-columns">\
                                                                    <img src="http://placehold.it/200x50">\
                                                                </td>\
                                                                <td class="six sub-columns last" style="text-align:right; vertical-align:middle;color:white">Navbar</td>\
                                                                <td class="expander"></td>\
                                                            </tr>\
                                                        </tbody>\
                                                    </table>\
                                                </td>\
                                            </tr>\
                                        </tbody>\
                                    </table>\
                                </center>\
                            </td>\
                        </tr>\
                    </tbody>\
                </table>'
            });

            // Promotion
            f.addComponentType({
                'type' : 'ink-promotion',
                'name' : 'Promotion',
                'parent_selector' : 'center',
                'on_inserted' : function ($el) {
                    $el.parent().removeClass('pg-empty-placeholder');
                },
                'code' : '<table class="container">\
                    <tbody>\
                        <tr>\
                            <td>\
                                <table class="row promotion" style="background:#CF3624;">\
                                    <tbody>\
                                        <tr>\
                                            <td class="center" align="center">\
                                                <center>\
                                                    <table class="container">\
                                                        <tbody>\
                                                            <tr>\
                                                                <td class="wrapper last">\
                                                                    <table class="twelve columns">\
                                                                        <tbody>\
                                                                            <tr>\
                                                                                <td class="six sub-columns" style="padding-left:10px;">\
                                                                                    <img src="http://placehold.it/100x50">\
                                                                                </td>\
                                                                                <td class="six sub-columns last" style="text-align:right; vertical-align:middle;color:white;padding-right:10px">CALL: 012-345-6789</td>\
                                                                                <td class="expander"></td>\
                                                                            </tr>\
                                                                        </tbody>\
                                                                    </table>\
                                                                </td>\
                                                            </tr>\
                                                        </tbody>\
                                                    </table>\
                                                </center>\
                                            </td>\
                                        </tr>\
                                    </tbody>\
                                </table>\
                            </td>\
                        </tr>\
                    </tbody>\
                </table>'
            });

            // Image
            f.addComponentType({
                'type' : 'ink-image',
                'name' : 'Image row',
                'parent_selector' : 'center',
                'on_inserted' : function ($el) {
                    $el.parent().removeClass('pg-empty-placeholder');
                },
                'code' : '<table class="container">\
                    <tbody>\
                        <tr>\
                            <td>\
                                <img src="http://placehold.it/600x400" />\
                            </td>\
                        </tr>\
                    </tbody>\
                </table>'
            });

            // two column
            f.addComponentType({
                'type' : 'ink-two-column',
                'name' : 'Tow column',
                'parent_selector' : 'center',
                'on_inserted' : function ($el) {
                    $el.parent().removeClass('pg-empty-placeholder');
                },
                'code' : '<table class="container">\
                    <tbody>\
                        <tr>\
                            <td>\
                                <table class="row promotion">\
                                    <tbody>\
                                        <tr>\
                                            <td class="center" align="center">\
                                                <center>\
                                                    <table class="container">\
                                                        <tbody>\
                                                            <tr>\
                                                                <td class="wrapper last">\
                                                                    <table class="twelve columns">\
                                                                        <tbody>\
                                                                            <tr>\
                                                                                <td class="six sub-columns" style="padding-left:10px;">\
                                                                                    <img src="http://127.0.0.1:40000/file:///home/mhdaljuboori/Projects/Pinegrow/PinegrowCode/placeholders/img5.jpg" />\
                                                                                    <h5 style="color:white;text-align:center">Image title</h5>\
                                                                                </td>\
                                                                                <td class="six sub-columns" style="padding-left:10px;">\
                                                                                    <img src="http://127.0.0.1:40000/file:///home/mhdaljuboori/Projects/Pinegrow/PinegrowCode/placeholders/img5.jpg" />\
                                                                                    <h5 style="color:white;text-align:center">Image title</h5>\
                                                                                </td>\
                                                                                <td class="expander"></td>\
                                                                            </tr>\
                                                                        </tbody>\
                                                                    </table>\
                                                                </td>\
                                                            </tr>\
                                                        </tbody>\
                                                    </table>\
                                                </center>\
                                            </td>\
                                        </tr>\
                                    </tbody>\
                                </table>\
                            </td>\
                        </tr>\
                    </tbody>\
                </table>'
            });

            // Empty line
            f.addComponentType({
                'type' : 'ink-empty',
                'name' : 'Empty line',
                'parent_selector' : 'center',
                'on_inserted' : function ($el) {
                    $el.parent().removeClass('pg-empty-placeholder');
                },
                'code' : '<table class="row">\
                    <tbody>\
                        <tr>\
                            <td class="wrapper"> </td>\
                        </tr>\
                    </tbody>\
                </table>'
            });

            // Footer
            f.addComponentType({
                'type' : 'ink-footer',
                'selector' : '.footer',
                'name' : 'Footer',
                'parent_selector' : 'center',
                'on_inserted' : function ($el) {
                    $el.parent().removeClass('pg-empty-placeholder');
                },
                'code' : '<table class="row footer" style="background:#262526;">\
                    <tbody>\
                        <tr>\
                            <td class="center" align="center">\
                                <center>\
                                    <table class="container">\
                                        <tbody>\
                                            <tr>\
                                                <td class="wrapper last">\
                                                    <table class="twelve columns">\
                                                        <tbody>\
                                                            <tr>\
                                                                <td style="color: white;">\
                                                                    <center style="padding: 10px 0;">\
                                                                        Don\'t want to recive email updates? <a href="#">Unsubscribe here</a>\
                                                                    </center>\
                                                                </td>\
                                                            </tr>\
                                                        </tbody>\
                                                    </table>\
                                                </td>\
                                            </tr>\
                                        </tbody>\
                                    </table>\
                                </center>\
                            </td>\
                        </tr>\
                    </tbody>\
                </table>'
            });
        // End components


        // Sections
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

            var section = new PgFrameworkLibSection('inkcomp', 'Components');
            section.setComponentTypes(getTypes(['ink-navbar', 'ink-promotion', 'ink-image', 'ink-two-column', 'ink-empty', 'ink-footer']));
            f.addLibSection(section);

            section = new PgFrameworkLibSection('inkgrid', 'Grid');
            section.setComponentTypes(getTypes(['ink-row', 'ink-column', 'ink-subgrid', 'ink-subcolumn', 'ink-block-grid', 'ink-expander']));
            f.addLibSection(section);

            section = new PgFrameworkLibSection('inkcontainers', 'Containers');
            section.setComponentTypes(getTypes(['ink-container', 'ink-panel']));
            f.addLibSection(section);

            section = new PgFrameworkLibSection('inkbutton', 'Buttons');
            section.setComponentTypes(getTypes(['ink-button']));
            f.addLibSection(section);
        // End sections

        // Page Menu
            var createInlinePage = function(crsaFile) {
                pinegrow.openOrShowPage(crsaFile.url, function(crsaPage) {
                    var specificity = require('specificity');
                    var cp = crsaPage.getPageStylesheets();

                    function styleToObject(style) {
                        if (style) {
                            styleArr = style.split(';');
                            var styleObj = {};
                            for (var i = 0; i < styleArr.length; i++) {
                                if (styleArr[i] != "") {
                                    var keyVal = styleArr[i].split(':');
                                    if (styleObj[keyVal[0]]) {
                                        if (styleObj[keyVal[0]].match('!important') && !keyVal[1].match('!important')) {
                                            continue;
                                        }
                                    }
                                    styleObj[keyVal[0]] = keyVal[1];
                                }
                            }
                            return styleObj;
                        } else {
                            return {};
                        }
                    }

                    function objectToStyle(styleObj) {
                        var style = "";
                        for (var key in styleObj) {
                            style += key + ":" + styleObj[key] + ";";
                        }
                        return style;
                    }

                    var removeStyleDuplication = function(style) {
                        return objectToStyle(styleToObject(style));
                    }

                    crsaPage.sourceNode.walk(function(node) {
                        var element = crsaPage.getElementFromPgParserNode(node);

                        if (!element) return node;

                        var $el = $(element[0]);
                        var pgel = new pgQuery($el);

                        var accepted_rules = [];

                        var stylesheets = cp.getAllCrsaStylesheets();
                        for (var sindex = 0; sindex < stylesheets.length; sindex++) {
                            var cs = stylesheets[sindex];
                            var rules = cs.getAllRules();
                            for (var i = 0; i < rules.length; i++) {
                                if (!rules[i].media && rules[i].selector && node.is(rules[i].selector)) {
                                    var selectors = rules[i].selector.split(',');
                                    for (var j = 0; j < selectors.length; j++) {
                                        if (node.is(selectors[j].trim())) {
                                            accepted_rules.push({
                                                specificity: specificity.calculate(selectors[j])[0].specificity,
                                                rule: rules[i]
                                            });
                                        }
                                    }
                                }
                            }
                        }

                        accepted_rules = accepted_rules.sort(function(a, b) {
                            var a_arr = a.specificity.split(',');
                            var b_arr = b.specificity.split(',');

                            var i = 0;
                            while (i < a_arr.length) {
                                var inta = parseInt(a_arr[i]);
                                var intb = parseInt(b_arr[i]);
                                if (inta > intb) {
                                    return 1;
                                } else if (inta < intb) {
                                    return -1;
                                } else {
                                    i++;
                                }
                            }
                            return 0;
                        });

                        var style = "";
                        for (var i = 0; i < accepted_rules.length; i++) {
                            var values = accepted_rules[i].rule.values;

                            for (value in values) {
                                style += values[value].name + ":" + values[value].value + ";";
                            }
                        }

                        if (style) {
                            if (pgel.attr('style')) {
                                style = style + pgel.attr('style');
                            }
                            pgel.attr('style', removeStyleDuplication(style));
                        }

                        return node;
                    });

                    var stylesheets = cp.getAllCrsaStylesheets();
                    var ps = getCrsaPageStylesForPage(crsaPage.$iframe);
                    while (stylesheets.length != 0) {
                        ps.detachFrom(stylesheets[0]);
                    }

                    crsaPage.save(null, true);
                    $.fn.crsa('setNeedsUpdate', false, crsaPage.get$Html());
                });
            };

            var inliner = function(selectedPage) {
                var nameArray = selectedPage.name.split('.');
                nameArray[nameArray.length - 2] += '-inline';
                var newFileName = nameArray.join('.');

                var crsaFile = new CrsaFile();
                crsaFile.isFile = true;
                crsaFile.name = selectedPage.name;
                crsaFile.url = selectedPage.url;
                crsaFile.path = crsaMakeFileFromUrl(selectedPage.url)
                var nameArray = crsaFile.name.split('.');
                nameArray[nameArray.length - 2] += '-inline';

                var newFileUrl = crsaCombineUrlWith(crsaFile.url, newFileName);

                if (crsaIsFileExist(crsaMakeFileFromUrl(newFileUrl))) {
                    pinegrow.showAlert('Overwrite <b>' + newFileName + '</b> file?<br><b>Make sure that all css file activated.</b>', 'Overwrite file', "No", "Yes", function() {}, function() {
                        var newFile = crsaFile.duplicate(newFileName, true);
                        createInlinePage(newFile);
                    });
                } else {
                    var newFile = crsaFile.duplicate(newFileName, true);
                    createInlinePage(newFile);
                }
            };

            f.on_page_menu = function(page, items) {
                items.push({
                    divider: true,
                    header: 'Responsive email'
                });

                items.push({
                    label: 'Export email',
                    kbd: null,
                    func: function() {
                        inliner(page);
                    }
                })
            };

            // For production only
            addTakePreviewImage(f);
        // End page menu

        // Update comp photo
            var updateCompImage = function () {
                for (var comp in f.component_types) {
                    var currentComp = f.component_types[comp];
                    if (!currentComp.preview_image) {
                        var filename = crsaCombineCurrentUrlWith(crsaCleanUpUrl(f.getImagePreviewBaseUrl()), currentComp.type) + '.png';
                        if (crsaIsFileExist(crsaMakeFileFromUrl(filename))) {
                            currentComp.preview_image = currentComp.type + '.png';
                        }
                    }
                }
            }
            updateCompImage();
        // End update comp photo

        var templatesOrder = ['blank.html', 'basic.html', 'sidebar.html', 'sidebar-hero.html', 'hero.html', 'newsletter.html'];

        //Register starting page template
        f.addTemplateProjectFromResourceFolder('template', null, 5, function (node) {
            var nodeIndex = templatesOrder.indexOf(node.name);
            if (nodeIndex >= 0) node.order = nodeIndex;
        });
    })
})