/**
 * Created by Matjaz on 2/3/14.
 */

$(function() {

    $('body').one('pinegrow-ready', function(e, pinegrow) {
        var f = new PgFramework('pg.html', 'Plain HTML');

        f.description = 'Plain HTML starting pages and components.';
        f.author = 'Pinegrow';
        f.author_link = 'http://pinegrow.com';

        f.setScriptFileByScriptTagId('plugin-html'); //get url if script is included directly into edit.html
        pinegrow.addFramework(f, 100); //show at the bottom

        //let every page use this framework
        f.default = true;

        //will generate definitions from data
        var html5 = [
            {'name' : 'Sections', key: 'html-sections', els: ['section/p','nav/p','article/p','aside/p','h1:Heading 1','h2:Heading 2','h3:Heading 3','h4:Heading 4','h5:Heading 5','h6:Heading 6','header/p','footer/p','address','main/p']},
            {'name' : 'Grouping elements', key: 'html-grouping', els: ['p:Paragraph','hr/e','pre:Preformated text','blockquote',
                {tag: 'ol/p', props: {start: {name: 'Start'}}},'ul/p',
                {
                    tag: 'li:List item',
                    parent_selector: 'ul,ol'
                },'dl','dt:Term','dd:Definition','figure','figcaption','div/p']},
            {'name' : 'Text', key: 'html-text', els: [
                {
                    tag:'a',
                    name: 'Anchor',
                    selector: 'a[name]',
                    drag_helper: '<div class="pg-empty-placeholder">Anchor</div>',
                    code: '<a name="anchor"></a>',
                    props: {
                        'name' : {name: 'Name'}
                    }
                },
                {
                    tag:'a',
                    name: 'Link',
                    code: '<a href="">Link</a>',
                    props: {
                        'href' : {name: 'Href', file_picker: true, file_picker_no_proxy: true},
                        'target' : {name: 'Target'},
                        'rel' : {name: 'Rel'}
                    }
                },
                'em','strong','small','s','cite','q','dfn','abbr','data','time','code','var','samp','kbd','sub','sup','i','b','u','mark','ruby','rt','rp','bdi','bdo','span','br','wbr']},
            {'name' : 'Edits', key: 'html-edits', els: ['ins','del']},
            {'name' : 'External content', key: 'html-embed', els: [
                {
                    tag: 'img/e',
                    code : function() {
                        return '<img src="' + pinegrow.getPlaceholderImage() + '"/>';
                    },
                    props: {
                        'src' : {name: 'Source url', type: 'image', autocomplete_same_tag: true},
                        'alt' : {name: 'Alt text'},
                        'width' : {name: 'Width'},
                        'height' : {name: 'Height'}
                    }
                },
                {
                    tag: 'link/e',
                    code : function() {
                        return '<link />';
                    },
                    props: {
                        'href' : {name: 'Href', file_picker: true, file_picker_no_proxy: true},
                        'rel' : {name: 'Rel'}
                    },
                    on_inserted : function($el, cp) {
                        if($el.attr('rel') == "stylesheet") {
                            cp.updateStylesheetsList();
                        }
                    },
                    on_deleted : function($el, cp) {
                        if($el.attr('rel') == "stylesheet") {
                            cp.updateStylesheetsList();
                        }
                    }
                },
                {
                    tag: 'iframe/e',
                    drag_helper: '<div class="pg-empty-placeholder">iframe</div>',
                    props: {
                        'src' : {name: 'Source url', file_picker: true, file_picker_no_proxy: true, autocomplete_same_tag: true},
                        'width' : {name: 'Width'},
                        'height' : {name: 'Height'}
                    }
                },
                {
                    tag: 'embed/e',
                    props: {
                        'src' : {name: 'Source url', file_picker: true, file_picker_no_proxy: true},
                        'width' : {name: 'Width'},
                        'height' : {name: 'Height'}
                    }
                },
                {
                    tag: 'object/e',
                    props: {
                        'data' : {name: 'Data'},
                        'type' : {name: 'Mime type'},
                        'width' : {name: 'Width'},
                        'height' : {name: 'Height'}
                    }
                },
                'param/e',
                {
                    tag: 'video',
                    name: 'Video',
                    code: '<video></video>',
                    props: {
                        'src' : {name: 'Src', file_picker: true, file_picker_no_proxy: true}
                    }
                },
                'audio/e','source/e','track/e','canvas/e','map/e','area/e','svg/e',
                    {
                        tag: 'math',
                        code: '<math><mrow><mi>a</mi><mo>⁢</mo><msup><mi>x</mi><mn>2</mn></msup><mo>+</mo><mi>b</mi><mo>⁢</mo><mi>x</mi><mo>+</mo><mi>c</mi></mrow></math>',
                        drag_helper: '<b>a + b</b>'
                    }
                ]},
            {'name' : 'Tables', key: 'html-tables', els: [
                {
                    tag:'table/p'
                },'caption','colgroup/p','col/p','tbody/p','thead/p','tfoot/p','tr/p','td/p','th']},
            {'name' : 'Forms', key: 'html-forms', els: [
                {
                    tag: 'form/p',
                    props: {
                        'action' : {name: 'Action', file_picker: true, file_picker_no_proxy: true},
                        'method' : {name: 'Method', type: 'select', options: [
                            {key: 'post', name: 'post'},
                            {key: 'get', name: 'get'}
                        ]},
                        'name' : {name: 'Name'},
                        'target' : {name: 'Target'}
                    }
                },'fieldset/p','legend','label',
                {
                    tag: 'input/e',
                    props: {
                        'name' : {name: 'Name'},
                        'type' : {name: 'Type', type: 'select',
                            'options' : [
                                {key: 'text', name: 'Text'},
                                {key: 'password', name: 'Password'},
                                {key: 'checkbox', name: 'Checkbox'},
                                {key: 'radio', name: 'Radio'},
                                {key: 'number', name: 'Number'},
                                {key: 'email', name: 'Email'},
                                {key: 'file', name: 'File'},
                                {key: 'url', name: 'Url'},
                                {key: 'search', name: 'Search'},
                                {key: 'tel', name: 'Tel'},
                                {key: 'color', name: 'Color'},
                                {key: 'datetime', name: 'Datetime'},
                                {key: 'datetime-local', name: 'Datetime local'},
                                {key: 'date', name: 'Date'},
                                {key: 'month', name: 'Month'},
                                {key: 'time', name: 'Time'},
                                {key: 'week', name: 'Week'},
                                {key: 'range', name: 'range'},
                                {key: 'submit', name: 'submit'},
                                {key: 'hidden', name: 'Hidden'}
                            ]
                        },
                        checked: {
                            type: 'checkbox',
                            name: 'Checked',
                            action: 'element_attribute',
                            attribute: 'checked',
                            value: 'checked'
                        },
                        value: {
                            type: 'text',
                            name: 'Value',
                            action: 'custom',
                            get_value: function(obj) {
                                var $el = obj.data;
                                var $input = $el;
                                var pgInput = new pgQuery($el);
                                return pgInput.attr('value');
                            },
                            set_value: function(obj, value, values, oldValue, eventType) {
                                var $el = obj.data;
                                var $input = $el;
                                var pgInput = new pgQuery($el);
                                pgInput.attr('value', value);
                                pgInput.val(value);
                                return value;
                            }
                        },
                        placeholder: {
                            type: 'text',
                            name: 'Placeholder',
                            action: 'element_attribute',
                            attribute: 'placeholder'
                        },
                        'value' : {name: 'Value'},
                        'size' : {name: 'Size'},
                        'maxlength' : {name: 'Max length'}
                    }
                },
                {
                    tag:'button/e',
                    props: {
                        'name' : {name: 'Name'},
                        'value' : {name: 'Value'},
                        'type' : {name: 'Type', type: 'select', show_empty: true, options: [
                            {key: 'submit', name: 'Submit'},
                            {key: 'button', name: 'Button'},
                            {key: 'reset', name: 'Reset'}
                        ]}
                    }
                },
                {
                    tag:'select/e',
                    props: {
                        'name' : {name: 'Name'},
                        'value' : {name: 'Value'},
                        multiple: {
                            type: 'checkbox',
                            name: 'Multiple',
                            action: 'element_attribute',
                            attribute: 'multiple',
                            value: 'multiple'
                        }
                    }
                },
                {
                    tag:'option/e',
                    props: {
                        'text' : {name: 'Text', action: 'element_html'},
                        'value' : {name: 'Value'}
                    }
                },
                'datalist/e','optgroup/e','textarea/e','keygen/e','output/e','progress/e','meter/e']},
            {'name' : 'Interactive elements', key: 'html-interactive', els: ['details','summary','menuitem','menu/p']},
            {'name' : 'Head elements', key: 'html-head', els: ['title',
                {tag: 'meta-author', 'name' : 'Meta author', code: '<meta name="author" content="name">', selector: 'meta[name="author"]'},
                {tag: 'meta-description', 'name' : 'Meta description', code: '<meta name="description" content="name">', selector: 'meta[name="description"]'},
                {tag: 'meta-keywords', 'name' : 'Meta keywords', code: '<meta name="keywords" content="name">', selector: 'meta[name="keywords"]'}
            ]},
            {'name' : 'Extras', skip_lib: true, key: 'html-extras', els:
                ['body',
                    {tag: 'tag', 'name' : 'Tag', selector: function($el) {return true}, display_name: 'tag', priority: 2001}]}
        ];
        var single = ['br', 'hr', 'wbr'];


        var bckimage = {
            type : 'image',
            name: 'Bck. image',
            action : 'custom',
            file_picker_no_proxy: true,
            can_make_change_action: 'element_bckimage',
            get_value: function(obj) {
                var $el = obj.data;
                var pgel = new pgQuery($el);
                return pgel.getInlineStylePropertyValue('background-image', true);
               
            },
            set_value: function(obj, value, values, oldValue, eventType) {
                var $el = obj.data;
                var pgel = new pgQuery($el);
                pgel.setInlineStylePropertyValue('background-image', value, true);
                
                return value;
            }
        }


        var html_sections = null;//crsaAddStandardSections({});

        $.each(html5, function(i, sec) {
            var section = new PgFrameworkLibSection(sec.key, sec.name);

            if(!sec.skip_lib) {
                f.addLibSection(section);
            }

            $.each(sec.els, function(j, tag) {

                var opts = {};
                if(typeof tag == 'object') {
                    opts = tag;
                    tag = opts.tag;
                }

                var a = tag.split(':');
                tag = a[0];
                opts.inner = a.length > 1 ? a[1] : null;

                var is_plc = tag.indexOf('/p') >= 0;
                var is_emp = tag.indexOf('/e') >= 0;
                if(is_plc) is_emp = true;
                tag = tag.replace('/e', '').replace('/p', '');
                var is_single = single.indexOf(tag) >= 0;

                var preview_code = is_single ? '<' + tag + '/>' : '<' + tag + '>' + tag + '</' + tag + '>';

                var cls = is_plc ? ' class="pg-empty-placeholder"' : '';
                var inner = is_emp ? '' : (opts.inner ? opts.inner : tag);

                var code = is_single ? '<' + tag + cls + '/>' : '<' + tag + cls + '>' + inner + '</' + tag + '>';

                var def = new PgComponentType('html-' + tag, opts.name ? opts.name : tag);

                def.selector = opts.selector ? opts.selector : tag;
                def.code = opts.code ? opts.code : code;
                def.preview = preview_code;
                def.empty_placeholder = is_plc;
                def.priority = opts.property ? opts.property : 2000;
                def.parent_selector = opts.parent_selector ? opts.parent_selector : null;

                if(opts.drag_helper) def.drag_helper = opts.drag_helper;

                def.display_name = opts.display_name ? opts.display_name : null;

                if(opts.on_inserted) def.on_inserted = opts.on_inserted;
                if(opts.on_deleted) def.on_deleted = opts.on_deleted;

                if(opts.file_picker) def.file_picker = true;

                def.sections = {
                    css : {
                        position: 1,
                        name: 'Style',
                        fields: {
                            'rules' : {
                                'type' : 'rules',
                                'name' : null,
                                'action' : 'rules'
                            },
                            'element_id' : {
                                'type' : 'text',
                                'name' : 'Id',
                                action: 'custom',
                                options: function() {
                                    return pinegrow.insight.getIds();
                                },
                                can_make_change_action : 'element_id',
                                live_update : false,
                                get_value: function(obj) {
                                    var $el = obj.data;
                                    var $$el = new pgQuery($el);
                                    return $$el.attr('id');
                                },
                                set_value: function(obj, value, values, oldValue, eventType) {
                                    var $el = obj.data;
                                    var $$el = new pgQuery($el);
                                    var same = false;
                                    var oldsame = false;
                                    if(!value) {
                                        $$el.removeAttr('id');
                                        $.fn.crsa('setNeedsUpdate', false, $el);
                                        return value;
                                    }
                                    if(value) {
                                        var $$ex = $$el.closest('body').find('#' + value);
                                        if($$ex.length > 0 && !$$ex.get(0).equal($$el.get(0))) {
                                            crsaQuickMessage("Another element already has the id <b>" + value + "</b>. Search the tree to find it.", 4000, false);
                                            same = true;
                                        }
                                    }
                                    if(oldValue) {
                                        var $$ex = $$el.closest('body').find('#' + oldValue);
                                        if($$ex.length > 0 && !$$ex.get(0).equal($$el.get(0))) {
                                            //crsaQuickMessage("Another element already has the id <b>" + value + "</b>. Search the tree to find it.", 4000, false);
                                            oldsame = true;
                                        }
                                    }
                                    $$el.attr('id', value);
                                    if($$el.is('input,select,textarea')) {
                                        if(!oldValue) oldValue = "";
                                        var $$lab = $$el.closest('label[for="' + oldValue + '"]');
                                        if($$lab.length == 0) {
                                            $$lab = $$el.parent().find('label[for="' + oldValue + '"]');
                                        }
                                        if($$lab.length == 0 && !same) {
                                            $$lab = $$el.closest('body').find('label[for="' + oldValue + '"]');
                                        }
                                        if($$lab.length == 1 && !same && !oldsame) {
                                            $$lab.attr('for', value);
                                            crsaQuickMessage("Label's <b>&quot;for&quot;</b> attribute updated to <b>" + value + "</b>", 4000);
                                        } else if($$lab.length > 1) {
                                            crsaQuickMessage("Multiple labels for <b>" + oldValue + "</b> exist. Please update <b>&quot;for&quot;</b> attributes manually.", 4000);
                                        }
                                    }
                                    $.fn.crsa('setNeedsUpdate', false, $el);
                                    return value;
                                }
                            },
                            'html.bck.image' : bckimage,
                            'style' : {
                                'type' : 'text',
                                'name' : 'Style',
                                'action' : 'element_attribute',
                                attribute: 'style'
                            }
                            
                            /*,
	                        'classes': {
		                        type: 'select',
		                        name: 'Classes',
		                        action: 'custom',
		                        multiple: true,
		                        can_add_items: true,
		                        options: function() {
			                        return pinegrow.insight.getClasses();
			                    },
                                get_value: function(obj) {
                                    var $el = obj.data;
                                    var pgel = new pgQuery($el);
                                    return (pgel.attr('class') || '').split(' ').join(',');
                                },
                                set_value: function(obj, value, values, oldValue, eventType) {
                                    var $el = obj.data;
                                    var pgel = new pgQuery($el);
                                    if(value) {
                                        pgel.attr('class', value.replace(/\,/g, ' '));
                                    } else {
                                        pgel.removeAttr('class');
                                    }
                                    return value;
                                }
	                        } */
                        }
                    }
                };

                if(opts.props) {
                    def.sections['attributes'] = {
                            name: 'Attributes',
                            fields : {}
                        }

                    $.each(opts.props, function(pkey, pdef) {
                        if(!pdef.type) pdef.type = 'text';
                        if(!pdef.action) {
                            pdef.action = 'element_attribute';
                            pdef.attribute = pkey;
                        }
                        def.sections.attributes.fields[pkey] = pdef;
                    });
                }

                def.sections['Info'] = {
                    name: 'Info',
                    fields: {
                        'title' : {
                            'type' : 'text',
                            'name' : 'Title',
                            'action' : 'element_attribute',
                            attribute: 'title'
                        },
                        'empty_placeholder' : {
                            'type' : 'checkbox',
                            'name' : 'Empty placeholder',
                            'action' : 'apply_class',
                            value: 'pg-empty-placeholder'
                        },
                        'pinegrow_name' : {
                            'type' : 'text',
                            'name' : 'Name in tree',
                            'action' : 'element_attribute',
                            attribute: 'data-pg-name',
                            placeholder: 'name shown in the tree',
                            update_tree: true
                        }
                    }
                };

                f.addComponentType(def);

                section.addComponentType(def);
            });
        });

        //body/root

        var body = {
            'type' : 'body',
            'selector' : 'body',
            'name' : 'Body',
            'paint_tree_node' : function($li, $el) {
                var $iframe = getIframeOfElement($el);
                var mycp = getCrsaPageForIframe($iframe);
                if(mycp.live_update) {
                    $li.addClass('live-update');
                } else {
                    $li.removeClass('live-update');
                }
            },
            'sections' : {
                css : {
                    name: 'Style',
                    fields: {
                        'rules' : {
                            'type' : 'rules',
                            'name' : null,
                            'action' : 'rules'
                        },
                        'element_id' : {
                            'type' : 'text',
                            'name' : 'Id',
                            'action' : 'element_id'
                        },
                        'html.bck.image' : bckimage,
                        'style' : {
                            'type' : 'text',
                            'name' : 'Style',
                            'action' : 'element_attribute',
                            attribute: 'style'
                        }
                    }
                }
            }
        }
        f.addComponentType(body);

        var head = {
            'type' : 'head',
            'selector' : 'head',
            'name' : 'Head',
        }
        f.addComponentType(head);

        var getPgQueryForHeadElement = function($el, sel, code) {
            var $e = $el.find(sel);
            if(!$e.length) {
                if(!code) return null;
                var pgel = new pgQuery().create(code);
                return new pgQuery(get$Head($el)).append(pgel);
            }
            return new pgQuery($e);
        }

        var get$Head = function($el) {
            return $el.find('head');
        }

        var getMetaValue = function($html, key) {
            var pgel = getPgQueryForHeadElement($html, 'meta[name="' + key + '"]');
            return pgel ? pgel.attr('content') : null;
        }

        var setMetaValue = function($html, key, value) {
            var pgel = getPgQueryForHeadElement($html, 'meta[name="' + key + '"]', '<meta name="' + key + '">');
            pgel.attr('content', value);
        }

        var html = {
            'type' : 'html',
            'selector' : 'html',
            'name' : 'Page',
            'sections' : {
                'html.page' : {
                    position: 0, //at the top of props
                    name: 'Page',
                    fields: {
                        'page.title' : {
                            'type' : 'text',
                            'name' : 'Page title',
                            'action' : 'custom',
                            can_make_change_action: 'element_html',
                            can_make_change_element: function(pgel) {
                                return pgel.findOne('title');
                            },
                            options : function() {
                                return pinegrow.insight.getContentsForTag('title');
                            },
                            get_value: function(obj) {
                                var pgel = getPgQueryForHeadElement(obj.data, 'title');
                                return pgel ? pgel.html() : null;
                            },
                            set_value: function(obj, value, values, oldValue, eventType) {
                                var pgel = getPgQueryForHeadElement(obj.data, 'title', '<title></title>');
                                pgel.html(value);
                                if(eventType == 'change') pinegrow.updateTree(get$Head(obj.data));
                                return value;
                            }
                        },
                        'page.description' : {
                            'type' : 'text',
                            'name' : 'Page description',
                            'action' : 'custom',
                            can_make_change_action: 'element_attribute',
                            attribute: 'content',
                            can_make_change_element: function(pgel) {
                                return pgel.findOneWithAttrValue('name', 'description', 'meta');
                            },
                            options : function() {
                                return pinegrow.insight.getMetaValuesForName('description');
                            },
                            get_value: function(obj) {
                                return getMetaValue(obj.data, 'description');
                            },
                            set_value: function(obj, value, values, oldValue, eventType) {
                                setMetaValue(obj.data, 'description', value);
                                if(eventType == 'change') pinegrow.updateTree(get$Head(obj.data));
                                return value;
                            }
                        },
                        'page.keywords' : {
                            'type' : 'select',
                            'multiple' : true,
                            can_add_items: true,
                            'name' : 'Page keywords',
                            'action' : 'custom',
                            can_make_change_action: 'element_attribute',
                            attribute: 'content',
                            can_make_change_element: function(pgel) {
                                return pgel.findOneWithAttrValue('name', 'keywords', 'meta');
                            },
                            'options' : function() {
                                return pinegrow.insight.getKeywords();
                            },
                            get_value: function(obj) {
                                return getMetaValue(obj.data, 'keywords');
                            },
                            set_value: function(obj, value, values, oldValue, eventType) {
                                setMetaValue(obj.data, 'keywords', value);
                                if(eventType == 'change') pinegrow.updateTree(get$Head(obj.data));
                                return value;
                            }
                        },
                        'page.author' : {
                            'type' : 'text',
                            'name' : 'Page author',
                            'action' : 'custom',
                            can_make_change_action: 'element_attribute',
                            attribute: 'content',
                            can_make_change_element: function(pgel) {
                                return pgel.findOneWithAttrValue('name', 'author', 'meta');
                            },
                            options : function() {
                                return pinegrow.insight.getMetaValuesForName('author');
                            },
                            get_value: function(obj) {
                                return getMetaValue(obj.data, 'author');
                            },
                            set_value: function(obj, value, values, oldValue, eventType) {
                                setMetaValue(obj.data, 'author', value);
                                if(eventType == 'change') pinegrow.updateTree(get$Head(obj.data));
                                return value;
                            }
                        }
                    }
                }
            }
        }
        f.addComponentType(html);

        //Register starting page template
        f.addTemplateProjectFromResourceFolder('template', null, 4);
    });

});
