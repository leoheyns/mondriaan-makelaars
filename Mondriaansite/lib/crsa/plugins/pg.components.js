$(function () {
    $('body').one('pinegrow-ready', function (e, pinegrow) {//Wait for Pinegrow to start-up

        // Create new Pinegrow framework object
        var f = new PgFramework('pg.components', 'Components');
        pinegrow.addFramework(f);

        f.setScriptFileByScriptTagId('plugin-pg-components', 'lib/crsa/plugins/pg.components.js');

        var path = require('path');
        var fs = require('fs');

        var canUse = function() {
            return pinegrow.isPRO() || pinegrow.isProTrialActive()
        }

        f.detect = function(crsaPage) {
            return false;
        }

        f.default = true;
        f.has_actions = true;
        f.show_in_manager = false;
        //f.not_main_types = true;
        f.order = 1000; //show at the end of ACT panel

        var actions = [];
        var use_actions = [];

        var select_element_after_update = null;

        //Add insight handlers
        pinegrow.insight.addHandler(
            function(insight) { //begin
                insightext.master_pages = [];
                insightext.master_pages_changed = true;
                insightext.component_types_map = {};
                insightext.component_types_list = [];
            },
            function(insight, page) { //page
                //inspect nodes
                return function(insight, page, node) {
                    if(node.tagName == 'html') {
                        if(node.hasAttr('data-pgc-set-master')) {
                            insightAddMasterPage(page.name);
                        }
                    }
                }
            },
            function(insight) { //end
                if(insightext.master_pages_changed) {
                    insightext.master_pages.sort();
                    insightext.master_pages_changed = false;
                }
            }
        )
        var insightext = {
            getMasterPages : function() {
                var r = [];
                insightext.master_pages.forEach(function(name) {
                    r.push({key: name, name: name});
                })
                return r;
            },
            getComponents : function() {
                var r = [];
                var page = pinegrow.getSelectedPage();
                if(page) {
                    page.getFrameworks().forEach(function(f) {
                        if(f.components_loaded) {
                            $.each(f.getComponentTypes(), function(key, def) {
                                if(def.is_smart_component) {
                                    r.push({key: def.type, name: def.type, html: def.type + (def.type != def.name ? (' (' + def.name + ')') : '') + ' <small>' + f.name + '</small>'});
                                }
                            })
                        }
                    })
                }
                pinegrow.insight.sortOptionsList(r);
                return r;
            },
            getEditableFieldsForElement : function($el) {
                var r = [];
                var pgel = getElementPgNode($el);

                var addFields = function(c, text) {
                    if(c.component_fields) {
                        $.each(c.component_fields, function(key, field) {
                            r.push({key: field.name, name: field.name, html: field.name + ' <small>' + (text || '') + c.name + '</small>'});
                        });
                    }
                }

                if(pgel) {
                    var page = pinegrow.getCrsaPageOfPgParserNode(pgel);
                    var c = getComponentInstance(pgel, page);
                    if(c) {
                        addFields(c);
                    } else {
                        //has master page?
                        var project = pinegrow.getCurrentProject();
                        if(project) {
                            var master_def = getMasterPage(page, project);
                            if(master_def) {
                                addFields(master_def, 'master page ');
                            } else {
                                r.push({key: '', name: '', html: '<small>Assign component or master page to see editable fields.</small>'})
                            }
                        }
                    }
                    pinegrow.insight.sortOptionsList(r);
                }
                return r;
            }
        }
        pinegrow.insight.ext.components = insightext;

        var insightAddMasterPage = function(name) {
            if(insightext.master_pages.indexOf(name) < 0) {
                insightext.master_pages.push(name);
                insightext.master_pages_changed = true;
            }
        }
        //end insight

        var pgc = new PgComponentType('pgc.define', 'Define component');
        pgc.short_name = 'Define comp.';
        pgc.selector = "[data-pgc-define]";
        pgc.attribute = 'data-pgc-define';
        pgc.action = true;
        pgc.not_main_type = true;
        pgc.sections = {
            'pgc.define.parameters' : {
                name : 'Options',
                fields : {
                    'data-pgc-define' : {
                        type : 'text',
                        name : 'Id',
                        action : "element_attribute",
                        attribute : 'data-pgc-define',
                        attribute_keep_if_empty : true,
                        validate : f.fieldIsRequired,
                        placeholder: f.textForExample('my.poster'),
                        options: function() {
                            return pinegrow.insight.ext.components.getComponents();
                        }
                    },
                    'data-pgc-define-name' : {
                        type : 'text',
                        name : 'Display name',
                        action : "element_attribute",
                        attribute : 'data-pgc-define-name',
                        placeholder: f.textForExample('Poster')
                    },
                    'data-pgc-define-auto-update' : {
                        type : 'checkbox',
                        name : 'Update instances',
                        action : "element_attribute",
                        attribute: 'data-pgc-define-auto-update',
                        value: 'true',
                        negvalue: 'false',
                        default_value: 'true',
                        on_changed : function(obj, prop, value, oldValue, fieldDef, $field, eventType, values, crsaPage) {
                            if(value == 'false') {
                                pinegrow.showQuickMessage('Component instances <b>will not</b> be updated when you run Components -&gt; Update.', 3000);
                            } else {
                                pinegrow.showQuickMessage('Be careful, running Components -&gt; Update <b>will change</b> component instances.', 4000, false, true /* highlight */);
                            }
                        }
                    },
                    'data-pgc-define-description' : {
                        type : 'text',
                        name : 'Description',
                        action : "element_attribute",
                        attribute : 'data-pgc-define-description'
                    },
                    'data-pgc-define-photo-preview-only' : {
                        type : 'checkbox',
                        name : 'Use photo only for preview',
                        action : "element_attribute",
                        attribute: 'data-pgc-define-photo-preview-only',
                        empty_attribute: true,
                        value: 'true'
                    },
                    /*, DISABLED for now,
                    'data-pgc-define-selector' : {
                        type : 'text',
                        name : 'Selector',
                        action : "element_attribute",
                        attribute : 'data-pgc-define-selector',
                        placeholder: f.textForExample('.poster')
                    }, *//*
                    'data-pgc-define-advanced-label' : {
                        type : 'label',
                        name : 'Advanced',
                        action : "element_attribute",
                        attribute: 'dummy'
                    },
                    'data-pgc-define-parent' : {
                        type : 'text',
                        name : 'Parent selector',
                        action : "element_attribute",
                        attribute : 'data-pgc-define-parent',
                        placeholder: f.textForExample('.row')
                    }*/
                }
            }
        };
        f.addComponentType(pgc);
        actions.push(pgc);

        pgc.meta = {
            helptext: 'Define Pinegrow component.<span class="more"> Disable <b>Update instances</b> if you don\'t want component instances to be updated with Components -&gt; Update. In that case you can update them manually with Actions -&gt; Update component.</span>'
        }

        var max_fields = 1;

        var getEditableActionTag = function($el, def) {
            var i = pgcVarParseValue($el.attr('data-pgc-field') || $el.attr('data-pgc-edit'));
            return '<i class="fa fa-pencil"></i> ' + (i.name || '');
        }

        var pgcvar = new PgComponentType('pgc.edit', 'Define editable area');
        pgcvar.short_name = 'Editable';
        pgcvar.selector = "[data-pgc-edit]";
        pgcvar.attribute = 'data-pgc-edit';
        pgcvar.action = true;
        pgcvar.not_main_type = true;
        pgcvar.get_action_tag = getEditableActionTag;

        var pgcVarParseValue = function(val) {
            var r = {name: null, attrs: [], content: true, repeat: false};
            if(!val) return r;
            var m = val.match(/^([^\[]*)(\[.*\]|)$/);
            if(m) {
                r.name = $.trim(m[1]);
                if(m[2].length > 0) {
                    var items = m[2].replace('[','').replace(']','').split(',');
                    for(var i = 0; i < items.length; i++) {
                        var item = $.trim(items[i]).toLowerCase();
                        if(item == 'no_content') {
                            r.content = false;
                        } else {
                            r.attrs.push(item);
                        }
                    }
                }
            }
            return r;
        }

        var pgcVarConstructValue = function(r) {
            var val = r.name;
            var params = r.attrs;
            if(!r.content) params.push('no_content');
            if(params.length) {
                val += '[' + params.join(', ') + ']';
            }
            return val;
        }

        var pgcVarSetAttr = function(pgel, name, content, attr_str, values) {
            if(name === -1) name = values['data-pgc-edit'];
            if(content === -1) content = values['data-pgc-edit-content'];
            if(attr_str === -1) attr_str = values['data-pgc-edit-attrs'];

            var r = {name: name, content: content != '1', attrs: null};
            r.attrs = attr_str ? attr_str.split(',') : [];
            for(var i = 0; i < r.attrs.length; i++) {
                r.attrs[i] = $.trim(r.attrs[i]);
            }
            //if(r.attrs == 0) r.content = true;
            var val = pgcVarConstructValue(r);
            pgel.attr(pgcvar.attribute, val);
        }

        f.getFieldDefinitionStringForEditableAttribute = function(current_val, attr, name) {
            var val = null;
            if(current_val) {
                var r = pgcVarParseValue(current_val);
                if(r.attrs.indexOf(attr) < 0) {
                    r.attrs.push(attr);
                }
                val = pgcVarConstructValue(r);
            } else {
                val = name + '[' + attr + ',no_content]';
            }
            return val;
        }

        pgcvar.sections = {
            'pgc.edit.parameters' : {
                name : 'Options',
                fields : {
                    'data-pgc-edit' : {
                        type : 'text',
                        name : 'Field Id',
                        action : "custom",
                        options: function() {
                            var list = pinegrow.insight.getValuesForAttribute('data-pgc-edit');
                            list.forEach(function(item) {
                                var i = pgcVarParseValue(item.key);
                                if(i) {
                                    item.name = i.name;
                                    item.key = i.name;
                                }
                            })
                            return list;
                        },
                        get_value: function(obj, fn, values, fv) {
                            var pgel = new pgQuery(obj.data);
                            var val = pgel.attr(pgcvar.attribute);
                            if(val) {
                                var r = pgcVarParseValue(val);
                                return r.name;
                            }
                            return null;
                        },
                        set_value: function(obj, value, values, oldValue, eventType, fieldDef) {
                            var pgel = new pgQuery(obj.data);
                            if(!value) {
                                pgel.removeAttr(pgcvar.attribute);
                            } else {
                                pgcVarSetAttr(pgel, value, -1, -1, values);
                            }
                            return value;
                         },
                         validate : f.fieldIsRequired,
                         placeholder: f.textForExample('block_title')
                    },
                    'data-pgc-edit-attrs' : {
                        type : 'select',
                        multiple: true,
                        can_add_items: true,
                        options: function(fdef, obj) {
                            var r = [];
                            $.each( obj.data[0].attributes, function( index, attr ) {
                                if(!attr.name.startsWith('data-pg')) {
                                    r.push({key: attr.name, name: attr.name});
                                }
                            } );
                            pinegrow.insight.sortOptionsList(r);
                            return r;
                        },
                        name : 'Editable attributes',
                        action : "custom",
                        get_value: function(obj, fn, values, fv) {
                            var pgel = new pgQuery(obj.data);
                            var val = pgel.attr(pgcvar.attribute);
                            if(val) {
                                var r = pgcVarParseValue(val);
                                return r.attrs.length ? r.attrs.join(', ') : null;
                            }
                            return null;
                        },
                        set_value: function(obj, value, values, oldValue, eventType, fieldDef) {
                            var pgel = new pgQuery(obj.data);
                            pgcVarSetAttr(pgel, -1, -1, value, values);
                            return value;
                        }
                    },
                    'data-pgc-edit-classes' : {
                        type : 'select',
                        multiple: true,
                        can_add_items: true,
                        name : 'Editable classes',
                        action : "element_attribute",
                        attribute : 'data-pgc-edit-classes',
                        placeholder: f.textForExample('active, inactive'),
                        options: function(fdef, obj) {
                            var r = [];
                            $.each( (obj.data.attr('class')||'').split(/\s+/), function( index, cls ) {
                                if(!cls.startsWith('crsa-')) {
                                    r.push({key: cls, name: cls});
                                }
                            } );
                            pinegrow.insight.sortOptionsList(r);
                            return r;
                        },
                    },
                    'data-pgc-edit-content' : {
                        type : 'checkbox',
                        name : 'Do NOT edit content',
                        action : "custom",
                        value: '1',
                        get_value: function(obj, fn, values, fv) {
                            var pgel = new pgQuery(obj.data);
                            var val = pgel.attr(pgcvar.attribute);
                            if(val) {
                                var r = pgcVarParseValue(val);
                                return r.content ? null : '1';
                            }
                            return null;
                        },
                        set_value: function(obj, value, values, oldValue, eventType, fieldDef) {
                            var pgel = new pgQuery(obj.data);
                            pgcVarSetAttr(pgel, -1, value, -1, values);
                            return value;
                        }
                    },
                    'data-pgc-edit-bckimage' : {
                        type : 'checkbox',
                        name : 'Bck. image',
                        action : "element_attribute",
                        attribute: 'data-pgc-edit-bckimage',
                        value: '1',
                        empty_attribute: true
                    },
                    'data-pgc-edit-types' : {
                        type : 'select',
                        multiple: true,
                        can_add_items: false,
                        options: function(fdef, obj) {
                            return pinegrow.insight.ext.components.getComponents();
                        },
                        name : 'Allowed components in content',
                        action : "element_attribute",
                        attribute: 'data-pgc-edit-types'
                    }
                    /*, DISABLED for now,
                    'data-pgc-edit-advanced-label' : {
                        type : 'label',
                        name : 'Advanced',
                        action : "element_attribute",
                        attribute: 'dummy'
                    },
                    'data-pgc-edit-selector' : {
                        type : 'text',
                        name : 'Selector (based on comp. root)',
                        action : "element_attribute",
                        attribute : 'data-pgc-edit-selector',
                        placeholder: f.textForExample('>p.desc or self')
                    } */
                }
            }
        };
        pgcvar.meta = {
            helptext: 'Make the element editable. Inner content of the element is editable by default.'
        }
        f.addComponentType(pgcvar);
        use_actions.push(pgcvar);


        var pgcrepeat = new PgComponentType('pgc.repeat', 'Define repeatable area');
        pgcrepeat.short_name = 'Repeat';
        pgcrepeat.selector = "[data-pgc-repeat]";
        pgcrepeat.attribute = 'data-pgc-repeat';
        pgcrepeat.action = true;
        pgcrepeat.not_main_type = true;
        pgcrepeat.sections = {
            'pgc.repeat.parameters' : {
                name : 'Options',
                fields : {
                    'data-pgc-repeat' : {
                        type : 'text',
                        name : 'Field Id',
                        action : "element_attribute",
                        attribute : 'data-pgc-repeat',
                        attribute_keep_if_empty : true,
                        //validate : f.fieldIsRequired,
                        placeholder: f.textDefaultValue('editable field id')
                    } /*, DISABLED for now,
                    'data-pgc-repeat-advanced-label' : {
                        type : 'label',
                        name : 'Advanced',
                        action : "element_attribute",
                        attribute: 'dummy'
                    },
                    'data-pgc-repeat-selector' : {
                        type : 'text',
                        name : 'Selector (based on comp. root)',
                        action : "element_attribute",
                        attribute : 'data-pgc-repeat-selector',
                        placeholder: f.textForExample('.item or self')
                    } */
                }
            }
        };
        pgcrepeat.meta = {
            helptext: 'The editable area can be repeated by duplicating it as many times as needed.'
        }
        f.addComponentType(pgcrepeat);
        use_actions.push(pgcrepeat);



        var pgcoptional = new PgComponentType('pgc.optional', 'Define optional area');
        pgcoptional.short_name = 'Optional';
        pgcoptional.selector = "[data-pgc-optional]";
        pgcoptional.attribute = 'data-pgc-optional';
        pgcoptional.action = true;
        pgcoptional.not_main_type = true;
        pgcoptional.sections = {
            'pgc.optional.parameters' : {
                name : 'Options',
                fields : {
                    'data-pgc-optional' : {
                        type : 'text',
                        name : 'Field Id',
                        action : "element_attribute",
                        attribute : 'data-pgc-optional',
                        attribute_keep_if_empty : true,
                        //validate : f.fieldIsRequired,
                        placeholder: f.textDefaultValue('editable field id')
                    },
                    'data-pgc-optional-restore' : {
                        type : 'checkbox',
                        name : 'Restore on update',
                        action : "element_attribute",
                        attribute: 'data-pgc-optional-restore',
                        empty_attribute : true,
                        value: 'true'
                    }
                }
            }
        };
        pgcoptional.meta = {
            helptext: 'The element can be deleted from component instances.<span class="more">To get back deleted optional areas use <b>Actions -&gt; Restore optional areas</b> on instances / child pages - or - check <b>Restore on update</b>, update and then uncheck it (that will restore that field in all updated instances).</span>'
        }
        f.addComponentType(pgcoptional);
        use_actions.push(pgcoptional);




        var pgcparam = new PgComponentType('pgc.param', 'Parameter');
        pgcparam.short_name = 'Parameter';
        pgcparam.selector = 'pgcparam';
        f.addComponentType(pgcparam);

/*
        var pgcrequire = new PgComponentType('pgc.require', 'Require file or folder');
        pgcrequire.short_name = 'Require';
        pgcrequire.selector = "[data-pgc-require]";
        pgcrequire.attribute = 'data-pgc-require';
        pgcrequire.action = true;
        pgcrequire.not_main_type = true;
        pgcrequire.sections = {
            'pgc.require.parameters' : {
                name : 'Options',
                fields : {
                    'data-pgc-require' : {
                        type : 'text',
                        name : 'Path relative to project',
                        action : "element_attribute",
                        attribute : 'data-pgc-require',
                        attribute_keep_if_empty : false,
                        validate : f.fieldIsRequired,
                        placeholder: f.textForExample('assets/css/style.css')
                    },
                    'data-pgc-require-global' : {
                        type : 'checkbox',
                        name : 'All components require this file',
                        action : "element_attribute",
                        attribute : 'data-pgc-require-global',
                        attribute_keep_if_empty : false,
                        value: "true"
                    }
                }
            }
        };
        f.addComponentType(pgcrequire);
        actions.push(pgcrequire);
*/

        var pgcinstance = new PgComponentType('pgc.use', 'Use component');
        pgcinstance.short_name = 'Use comp.';
        pgcinstance.selector = "[data-pgc]";
        pgcinstance.attribute = 'data-pgc';
        pgcinstance.action = true;
        pgcinstance.not_main_type = true;
        pgcinstance.sections = {
            'pgc.parameters' : {
                name : 'Options',
                fields : {
                    'data-pgc' : {
                        type : 'select',
                        name : 'Id',
                        action : "element_attribute",
                        attribute : 'data-pgc',
                        attribute_keep_if_empty : true,
                        validate : f.fieldIsRequired,
                        placeholder: f.textForExample('my.poster'),
                        can_add_items: true,
                        options: function() {
                            return pinegrow.insight.ext.components.getComponents();
                        }
                    },
                    'data-pgc-no-update' : {
                        type : 'checkbox',
                        name : 'Don\'t update',
                        action : "element_attribute",
                        attribute: 'data-pgc-no-update',
                        empty_attribute : true,
                        value: '1',
                        on_changed : function(obj, prop, value, oldValue, fieldDef, $field, eventType, values, crsaPage) {
                            if(!value) {
                                var pgel = getElementPgNode(obj.data);
                                if(pgel) {
                                    if(wouldUpdateChangeComponentInstance(pgel.clone(true /* no ids */), crsaPage)) {
                                        pinegrow.showQuickMessage('Be careful, updating components <b>will change</b> this component instance.', 4000, false, true /* highlight */);
                                    }
                                }
                            } else {
                                pinegrow.showQuickMessage('The component <b>will not</b> be updated when component definition changes.', 3000);
                            }
                        }
                    }
                }
            }
        };
        f.addComponentType(pgcinstance);
        actions.push(pgcinstance);

        pgcinstance.meta = {
            helptext: 'Set element to be an instance of a component.'
        }


        var pgcsection = new PgComponentType('pgc.section', 'Define section');
        pgcsection.short_name = 'Section';
        pgcsection.selector = "[data-pgc-section]";
        pgcsection.attribute = 'data-pgc-section';
        pgcsection.action = true;
        pgcsection.not_main_type = true;
        pgcsection.sections = {
            'pgc.section.parameters' : {
                name : 'Options',
                fields : {
                    'data-pgc-section' : {
                        type : 'text',
                        name : 'Name',
                        action : "element_attribute",
                        attribute : 'data-pgc-section',
                        attribute_keep_if_empty : false,
                        validate : f.fieldIsRequired,
                        placeholder: f.textForExample('My section')
                    }
                }
            }
        }
        pgcsection.on_action_added = pgcsection.on_action_removed = function() {
            pinegrow.showQuickMessage('Update whole project to activate sections changes.', 3000);
        }
        f.addComponentType(pgcsection);
        actions.push(pgcsection);

        pgcsection.meta = {
            helptext: 'Components defined within the section element are listed under this section in LIB panel.'
        }


        var pgcfield = new PgComponentType('pgc.field', 'Use editable area');
        pgcfield.short_name = 'Editable';
        pgcfield.selector = "[data-pgc-field]";
        pgcfield.attribute = 'data-pgc-field';
        pgcfield.action = true;
        pgcfield.not_main_type = true;
        pgcfield.get_action_tag = getEditableActionTag;

        pgcfield.sections = {
            'pgc.field.parameters' : {
                name : 'Options',
                fields : {
                    'data-pgc-field' : {
                        type : 'select',
                        name : 'Field Id',
                        action : "element_attribute",
                        attribute : 'data-pgc-field',
                        attribute_keep_if_empty : false,
                        validate : f.fieldIsRequired,
                        placeholder: f.textForExample('title'),
                        can_add_items: true,
                        options: function(fdef, obj) {
                            return pinegrow.insight.ext.components.getEditableFieldsForElement(obj.data);
                        }
                    }
                }
            }
        };
        f.addComponentType(pgcfield);
        use_actions.push(pgcfield);

        pgcfield.meta = {
            helptext: 'Use component field. This action is added automatically when components are used. <b>Removing this action will cause edits to be lost.</b>'
        }

        var pgclock = new PgComponentType('pgc.lock', 'Lock area');
        pgclock.short_name = 'Lock';
        pgclock.selector = "[data-pgc-lock]";
        pgclock.attribute = 'data-pgc-lock';
        pgclock.action = true;
        pgclock.not_main_type = true;
        pgclock.get_action_tag = function() { return '<i class="fa fa-lock"></i>'; };


        f.addComponentType(pgclock);
        use_actions.push(pgclock);

        pgclock.meta = {
            helptext: 'Lock all elements inside the element, expect editable areas. This is similar to Content contributor mode.'
        }

        var master_actions = [];

        var pgcmaster = new PgComponentType('pgc.master', 'Set as master page');
        pgcmaster.short_name = 'Master';
        pgcmaster.selector = "[data-pgc-set-master]";
        pgcmaster.attribute = 'data-pgc-set-master';
        pgcmaster.action = true;
        pgcmaster.not_main_type = true;

        pgcmaster.on_action_added = function(pgel, cp, action_def, $el) {
            var fileNode = cp.getFileNode();
            var project = cp.getProject();
            if(project) {
                if(fileNode) {
                    project.updateTagsForFile( fileNode );
                }
            } else {
                masterPagesRequireProjectNotice();
            }
        }
        pgcmaster.on_action_removed = function(pgel, cp, action_def, $el) {
            var fileNode = cp.getFileNode();
            if(fileNode) {
                // setFileNodeTagMaster(false, fileNode);
                var project = cp.getProject();
                if(project) {
                    project.updateTagsForFile( fileNode );
                }
            }
        }

        pgcmaster.on_can_add_action = function(pgel, cp, action_def, $el) {
            if(pgel.tagName != 'html') {
                pinegrow.showQuickMessage('<b>Wrong element!</b> Set master page actions on <b>the TOP node of the page</b> in the tree.', 5000, false, true /* error */);
                return false;
            }
            if((action_def == pgcmaster && pgel.hasAttr('data-pgc-master')) || (action_def == pgcusemaster && pgel.hasAttr('data-pgc-set-master'))) {
                pinegrow.showQuickMessage('The page can\'t BE A MASTER and USE A MASTER at the same time.', 5000, false, true /* error */);
                return false;
            }
            return true;
        }

        pgcmaster.meta = {
            helptext: 'Define the page as a master page that is used as a template for other pages.'
        }

        f.addComponentType(pgcmaster);
        master_actions.push(pgcmaster);

        var masterPagesRequireProjectNotice = function() {
            pinegrow.showAlert('<p>Master pages work with Projects. To use Master pages open the folder where your pages are located with <b>File -&gt; Open project</b>.</p>', 'Master pages and components require projects');
        }

        var pgcusemaster = new PgComponentType('pgc.master.use', 'Use master page');
        pgcusemaster.short_name = 'Use master';
        pgcusemaster.selector = "[data-pgc-master]";
        pgcusemaster.attribute = 'data-pgc-master';
        pgcusemaster.action = true;
        pgcusemaster.not_main_type = true;
        pgcusemaster.sections = {
            'pgc.master.use.parameters' : {
                name : 'Options',
                fields : {
                    'data-pgc-master' : {
                        type : 'select',
                        name : 'Master page',
                        action : "element_attribute",
                        attribute : 'data-pgc-master',
                        attribute_keep_if_empty : false,
                        validate : f.fieldIsRequired,
                        placeholder: f.textForExample('master.html'),
                        can_add_items: true,
                        options: function() {
                            return pinegrow.insight.ext.components.getMasterPages();
                        }
                    }
                }
            }
        };
        pgcusemaster.on_action_added = function(pgel, cp, action_def, $el) {
            var project = cp.getProject();
            if(project) {
                var fileNode = cp.getFileNode();
                if(fileNode) {
                    // setFileNodeTagUseMaster(true, fileNode);
                    project.updateTagsForFile( fileNode );
                }
            } else {
                masterPagesRequireProjectNotice();
            }
            setHasUpdates(true);
        }
        pgcusemaster.on_action_removed = function(pgel, cp, action_def, $el) {
            var fileNode = cp.getFileNode();
            if(fileNode) {
                // setFileNodeTagUseMaster(false, fileNode);
                var project = cp.getProject();
                if(project) {
                    project.updateTagsForFile( fileNode );
                }
            }
            setHasUpdates(true);
        }
        pgcusemaster.on_can_add_action = pgcmaster.on_can_add_action;
        pgcusemaster.meta = {
            helptext: 'Select which master page will be used as the template for this page.'
        }
        f.addComponentType(pgcusemaster);
        master_actions.push(pgcusemaster);

        var partials = [];

        var pgcsavepartial = new PgComponentType('pgc.partial.save', 'Save partial');
        pgcsavepartial.short_name = 'Partial';
        pgcsavepartial.selector = "[data-pgc-save-partial]";
        pgcsavepartial.attribute = 'data-pgc-save-partial';
        pgcsavepartial.action = true;
        pgcsavepartial.not_main_type = true;
        pgcsavepartial.sections = {
            'pgc.save.partial.parameters' : {
                name : 'Options',
                fields : {
                    'data-pgc-save-partial' : {
                        type : 'text',
                        name : 'File',
                        action : "element_attribute",
                        attribute : 'data-pgc-save-partial',
                        attribute_keep_if_empty : false,
                        validate : f.fieldIsRequired,
                        file_picker : true,
                        file_picker_save : true,
                        file_picker_no_url : true,
                        file_picker_no_proxy : true
                    },
                    'data-pgc-save-partial-content' : {
                        type : 'checkbox',
                        name : 'Save only element\'s content',
                        action : "element_attribute",
                        attribute: 'data-pgc-save-partial-content',
                        empty_attribute : true,
                        value: '1'
                    }
                }
            }
        }
        f.addComponentType(pgcsavepartial);
        partials.push(pgcsavepartial);

        pgcsavepartial.meta = {
            helptext: 'Save the element HTML code into a specified file when the page is saved.'
        }




        if(canUse()) {
            var section = new PgFrameworkLibSection('pg.components.master', 'Master pages');
            section.setComponentTypes( master_actions );
            //section.closed = false; //open by default
            f.addActionsSection(section);

            section = new PgFrameworkLibSection('pg.components', 'Components');
            section.setComponentTypes( actions );
            //section.closed = false; //open by default
            f.addActionsSection(section);

            section = new PgFrameworkLibSection('pg.components.editable', 'Editable areas');
            section.setComponentTypes( use_actions );
            //section.closed = false; //open by default
            f.addActionsSection(section);

            section = new PgFrameworkLibSection('pg.components.partials', 'Partials');
            section.setComponentTypes( partials );
            //section.closed = false; //open by default
            f.addActionsSection(section);
        }


        var resourceEditor;

        var showResourceEditorForProject = function(project) {
            if (!resourceEditor || (resourceEditor && !resourceEditor.getProject())) {
                resourceEditor = new PgResourceEditor(project);
            }
            resourceEditor.show();
        }

        f.on_project_menu = function(page, project) {
            var items = [];


/*
            items.push({
                label: 'Edit resources...',
                func: function() {
                    showResourceEditorForProject(project);
                }
            })

            items.push({
                label: 'Reload &amp; update components',
                key: 'SHIFT CMD U',
                func: function() {
                    f.reloadProjectAndUpdateComponents();
                }
            })

            items.push({
                label: 'Add or update resources...',
                kbd: null,
                func: function() {
                    pinegrow.showUpdateResourcesDialog(page, project);
                }
            })*/
            /*
            items.push({
                label: 'Reload components',
                func: function() {
                    refreshComponents(project);
                }
            })
            items.push({
                label: 'Update components',
                func: function() {
                    updateComponents(project);
                }
            })
            */
            return items;
        }

        var setFileNodeTagMaster = function(master, fileNode) {
            if(master) {
                fileNode.addTag(new CrsaFileTag('Master', 'primary', 'This is a master page.', 'clone'));
            } else {
                fileNode.removeTag('Master');
            }
        }

        var setFileNodeTagUseMaster = function(use_master, fileNode) {
            if(use_master) {
                fileNode.addTag(new CrsaFileTag('UseMaster', 'info', 'This page uses the master page ' + use_master + '.', 'clone'));
            } else {
                fileNode.removeTag('UseMaster');
            }
        }

        var setFileNodeTagDefinesComponents = function(defines, fileNode) {
            if(defines) {
                fileNode.addTag(new CrsaFileTag('DefC', 'primary', 'Components are defined on this page', 'cube'));
            } else {
                fileNode.removeTag('DefC');
            }
        }

        var setFileNodeTagUsesComponents = function(uses, fileNode) {
            if(uses) {
                fileNode.addTag(new CrsaFileTag('UseC', 'info', 'Components are used on this page', 'cube'));
            } else {
                fileNode.removeTag('UseC');
            }
        }

        var requireAtLeastOneOpenPage = function(project, func) {
            var found = null;
            project.forEachOpenPage(function(page) {
                found = page;
                if(func) func(page);
                func = null;
            })
            if(!found) {
                pinegrow.showAlert('<p>Updating the whole project needs at least one page from the project to be open in Pinegrow.</p><p><b>Open any editable page from the project</b> and run this action again.</p>', 'At least one page needs to be open.');
            }
        }

        var updateProjectResources = function (project) {
            if (!project || !project.framework) return;

            var info = project.getProjectInfo();
            var resources = info.getSetting("project_resources");
            var pf = project.framework;

            pf.resources.clear();
            if (resources) {
                for (var j=0; j < resources.length; j++) {
                    var url = resources[j].url;
                    var file = url;
                    if (!crsaIsAbsoluteUrl(url))
                        file = project.getAbsoluteUrl( url );
                    var footer = resources[j].footer || false;
                    var type = (resources[j].type == 'auto') ? '' : resources[j].type;

                    if (file) {
                        var res = new PgComponentTypeResource(file);
                        res.footer = footer;
                        res.relative_url = url;
                        res.source = file;
                        if (type)
                            res.type = type;

                        pf.resources.add(res);
                    }
                }
            }
        }

        var refreshComponents = function(project, done, skip_frameworks_changed) {

            var all = [];
            var all_map = {};

            var global_resources = [];
            var master_pages = {};

            var sections = {'default': []};
            var sections_order = ['default'];

            project.forEachEditableFile( function( page, pageDone, status, fileNode ) {
                //on page
                var info = readComponentsInPage(page, global_resources, project);
                for(var i = 0; i < info.components.length; i++) {
                    if(info.components[i].type in all_map) {
                        status.warnings.push('Component <b>' + info.components[i].type + '</b> is <b>already defined</b> in ' + project.getRelativePath(all_map[info.components[i].type].sourceFile) + '.');
                    } else {
                        all.push(info.components[i]);
                        all_map[info.components[i].type] = info.components[i];

                        var sec = info.components[i].add_to_section || 'default';
                        if(!sections[sec]) {
                            sections[sec] = [];
                            sections_order.push(sec);
                        }
                        sections[sec].push(info.components[i]);
                    }
                }
                if(info.master) {
                    info.master.file = page.getFileNode();
                    info.master.image = getImagePathForPage(page, project);
                    master_pages[info.master.type] = info.master;
                }

                setFileNodeTagUsesComponents(info.used_component_types.length, fileNode);
                setFileNodeTagDefinesComponents(info.components.length, fileNode);
                setFileNodeTagMaster(info.master, fileNode);
                setFileNodeTagUseMaster(info.use_master, fileNode);


                page.setSyntaxErrorIndicator(page.sourceNode.validateTree().length > 0, fileNode, project);
                //fileNode.addTag(new CrsaFileTag('Ok', 'success', 'Something dangerous'));
                //fileNode.addTag(new CrsaFileTag('Hmm', 'warning', 'Something dangerous'));

                project.updateTagsForFile( fileNode );

                pageDone(page, status);

            }, function() {
                //on done
                var f_key = project.getName();
                var pf = pinegrow.findFrameworkByKey(f_key);
                var new_f = false;
                if(!pf) {
                    pf = new PgFramework( f_key, f_key);
                    new_f = true;
                }
                pf.auto_updatable = true;
                pf.removeAllComponents();
                pf.master_pages = master_pages;

                pf.preview_images_base = 'previews';

                for(var i = 0; i < all.length; i++) {
                    pf.addComponentType(all[i]);
                }

                for(var i = 0; i < sections_order.length; i++) {
                    var section = new PgFrameworkLibSection(project.getName() + '.' + sections_order[i], sections_order[i] == 'default' ? project.getName() : sections_order[i]);
                    section.setComponentTypes( sections[sections_order[i]] );
                    pf.addLibSection(section);
                }

                if(new_f) {
                    pinegrow.addFramework(pf, -1000);
                }

                project.framework = pf;
                pf.project = project;

                updateProjectResources(project);

                if(!skip_frameworks_changed) {
                    pinegrow.frameworksChanged();
                }

                pf.components_loaded = true;

                pinegrow.showQuickMessage('Found ' + all.length + ' components in ' + project.getName() + '.');

                if(done) done(project, pf);

            }, 'Looking for components...')
        }

        var areComponentsEqual = function(a, b) {
            return (a.definition_code == b.definition_code && a.code == b.code) && areComponentsEqualExceptCode(a, b);
        }

        var areComponentsEqualExceptCode = function(a, b) {
            return !(a.type != b.type || a.name != b.name || a.selector != b.selector || a.parent_selector != b.parent_selector || a.preview_image != b.preview_image || a.button_image != b.button_image || a.auto_update != b.auto_update || a.description != b.description);
        }



        var copyComponentToComponent = function(source, dest) {
            //type must be the same
            dest.name = source.name;
            dest.selector = source.selector;
            dest.parent_selector = source.parent_selector;
            dest.code = source.code;
            dest.definition_code = source.definition_code;
            dest.definition_attributes = source.definition_attributes;
            dest.preview_image = source.preview_image;
            dest.button_image = source.button_image;
            dest.description = source.description;
            dest.component_fields = source.component_fields;
            dest.component_repeat_fields = source.component_repeat_fields;
            dest.auto_update = source.auto_update;
        }

        var quickRefreshComponentsInPage = function(page, project) {
            var f_key = project.getName();
            var pf = pinegrow.findFrameworkByKey(f_key);
            var new_f = false;
            if(!pf) {
                throw "No framework!";
            }

            var global_resources = [];
            var changed = false;

            var info = readComponentsInPage(page, global_resources, project);
            for(var i = 0; i < info.components.length; i++) {
                var c = info.components[i];
                var current = pf.getComponentType(c.type);
                if(!current) {
                    pf.addComponentType(c);
                    var section_key = project.getName() + '.' + (c.add_to_section || 'default');
                    var section = pf.getLibSection(section_key);
                    if(!section) {
                        section = new PgFrameworkLibSection(section_key, (c.add_to_section || project.getName()));
                        pf.addLibSection(section);
                    }
                    section.addComponentType(c);
                    changed = true;
                    pinegrow.showQuickMessage('Component ' + c.name + ' added.');
                } else {
                    //changed?
                    if(!areComponentsEqual(current, c)) {
                        copyComponentToComponent(c, current);
                        //pf.replaceComponent(current, c);
                        changed = changed || !areComponentsEqualExceptCode(current, c); //no need to refresh libs
                        pinegrow.showQuickMessage('Component ' + c.name + ' changed.');
                    }
                }
            }
            if(info.master) {
                pf.master_pages[info.master.type] = info.master;
            }
            if(changed) {
                pinegrow.frameworksChanged();
            }
        }

        var quickUpdateComponentsInPage = function(page, project, return_status, done) {
            updateComponentsInPage(page, project, null, false, return_status, done);
        }

        f.changeComponentDefinitionsToComponentInstances = function(pgel) {
            pgel.walkSelfAndChildren(function(node) {
                var comp_def = node.getAttr('data-pgc-define');
                if(comp_def) {
                    node.removeAttrIfStartsWith('data-pgc-define'); //remove def
                    node.setAttr('data-pgc', comp_def); //add use
                }
                var edit_area = node.getAttr('data-pgc-edit')
                var field_id = null;
                if(edit_area) {
                    var field_info = pgcVarParseValue(edit_area);
                    node.removeAttrIfStartsWith('data-pgc-edit');
                    node.setAttr('data-pgc-field', field_info.name);
                    field_id = field_info.name;
                }
                if(node.hasAttr('data-pgc-repeat')) {
                    var repeat = node.getAttr('data-pgc-repeat') || field_id;
                    node.removeAttrIfStartsWith('data-pgc-repeat');
                    if(!field_id) {
                        node.setAttr('data-pgc-field', repeat);
                    }
                }
                if(node.hasAttr('data-pgc-optional')) {
                    var optional = node.getAttr('data-pgc-optional') || field_id;
                    node.removeAttrIfStartsWith('data-pgc-optional');
                    if(!field_id) {
                        node.setAttr('data-pgc-field', optional);
                    }
                }
                if(node.hasAttr('data-pgc-section')) {
                    node.removeAttr('data-pgc-section');
                }

                return true;
            })
        }

        var getComponentDefinitionAttributes = function(cel) {
            var list = cel.getAttrList();
            var r = {};
            list.forEach(function(a) {
                if(a.name.startsWith('data-pgc-define')) {
                    r[a.name] = a.value;
                }
            })
            return r;
        }

        var readComponentsInPage = function(page, global_resources, project, only_def_type) {
            var list = [];

            var r = {components: [], master: null, use_master: null, used_component_types: []};

            var getSection = function(pgel) {
                var secel = pgel.closest('[data-pgc-section]');
                if(secel) {
                    return secel.getAttr('data-pgc-section');
                }
            }

            //var elements = page.sourceNode.find('[data-pgc-define]');

            var html = page.sourceNode.findOne('html');
            if(html) {
                r.master = html.hasAttr('data-pgc-set-master');
                r.use_master = html.getAttr('data-pgc-master');
            }

            var elements = [];

            if(r.master && !only_def_type) {
                elements.push(page.sourceNode); //master is a special whole-page component
            }

            page.sourceNode.walk(function(node) {
                var c = node.getAttr('data-pgc-define');
                if(c !== null && (!only_def_type || only_def_type == c)) {
                    elements.push(node);
                }
                var used_c = node.getAttr('data-pgc');
                if(used_c) {
                    if(r.used_component_types.indexOf(used_c) < 0) {
                        r.used_component_types.push(used_c);
                    }
                }
                return true;
            })

            for(var i = 0; i < elements.length; i++) {

                var is_master = elements[i] == page.sourceNode;

                var cel = elements[i].clone(true /* no pg ids */);
                var type = is_master ? ('master.' + page.name) : cel.getAttr('data-pgc-define');
                var name = is_master ? page.name : (cel.getAttr('data-pgc-define-name') || type);
                var custom_selector = cel.getAttr('data-pgc-define-selector');

                var definition_attributes = getComponentDefinitionAttributes(cel);

                if(is_master) {
                    var comp_defs = cel.find('[data-pgc-define]');
                    for(var j = 0; j < comp_defs.length; j++) {
                        f.changeComponentDefinitionsToComponentInstances(comp_defs[j]);
                    }
                    cel.removeAttrIfStartsWith('data-pgc-section', true /* in children also */);
                }

                cel.removeAttrIfStartsWith('data-pgc-define', false /* not in children also */);//mtch

                var params = cel.find('pgcparam');
                for(var j = 0; j < params.length; j++) {
                    params[j].remove();
                }

                if(type) {
                    var c = new PgComponentType(type, name);

                    c.definition_code = cel.toStringOriginal(true); //remember comp def so that we can see if def changed in quick update
                    c.definition_attributes = definition_attributes;

                    if(!custom_selector) {
                        cel.setAttr('data-pgc', type);
                    }

                    if(is_master) {
                        var cel_html = cel.findOne('html');
                        cel_html.removeAttr('data-pgc-set-master');
                        cel_html.setAttr('data-pgc-master', page.name);
                        c.master_page_source_node = cel;
                        c.master_page_url = page.url;
                    }

                    c.sourceFile = page.localFile || page.url;
                    c.sourceUrl = page.url;

                    c.selector = custom_selector || '[data-pgc="' + type + '"],[data-pgc-define="' + type + '"]';
                    c.tags = 'block';
                    c.priority = 10;
                    c.is_smart_component = true;

                    c.auto_update = elements[i].getAttr('data-pgc-define-auto-update') != 'false';

                    c.add_to_section = getSection(elements[i]);

                    var preview_image = path.join( project.getDir(), 'previews', type + '.png');
                    if(crsaIsFileOrDir(preview_image, fs) == 'file') {
                        c.preview_image = type + '.png';
                        if(!elements[i].hasAttr('data-pgc-define-photo-preview-only')) {
                            c.button_image = c.preview_image;
                        } else {
                            c.button_image = null;
                        }
                    }

                    c.description = elements[i].getAttr('data-pgc-define-description');

                    c.component_fields = {};
                    c.component_repeat_fields = {};

                    var skipSubcomponents = function(node) {
                        return node.hasAttr('data-pgc-define');
                    }

                    //to make things less verbose replace the actuall field def in component code with field_id that will be used to lookup the field definition
                    var fields = cel.findIncludingSelf('[data-pgc-edit]', false, skipSubcomponents);
                    for(var m = 0; m < fields.length; m++) {
                        var field_def = fields[m].getAttr('data-pgc-edit');
                        var field_info = pgcVarParseValue(field_def);
                        field_info.selector = fields[m].getAttr('data-pgc-edit-selector');
                        var cls = fields[m].getAttr('data-pgc-edit-classes');
                        field_info.classes = crsaSplitAndTrimList(cls);
                        field_info.bckimage = fields[m].hasAttr('data-pgc-edit-bckimage');

                        var types = fields[m].getAttr('data-pgc-edit-types');
                        if(types) {
                            field_info.types = crsaSplitAndTrimList(types);
                        }

                        if(field_info.name) {
                            fields[m].setAttr('data-pgc-field', field_info.name);
                            //remember field def
                            c.component_fields[field_info.name] = field_info;
                        }
                        fields[m].removeAttrIfStartsWith('data-pgc-edit');
                    }

                    var repeatable = cel.findIncludingSelf('[data-pgc-repeat]', false, skipSubcomponents);
                    for(var m = 0; m < repeatable.length; m++) {
                        var field_id = repeatable[m].getAttr('data-pgc-field') || repeatable[m].getAttr('data-pgc-repeat');
                        if(field_id) {
                            repeatable[m].setAttr('data-pgc-field', field_id);
                            repeatable[m].removeAttrIfStartsWith('data-pgc-repeat');
                            c.component_repeat_fields[field_id] = true;
                            if(!(field_id in c.component_fields)) {
                                c.component_fields[field_id] = {name: field_id, content: false, attrs: [], classes: [], repeat: true};
                            } else {
                                c.component_fields[field_id].repeat = true;
                            }
                        }
                    }

                    var optional = cel.findIncludingSelf('[data-pgc-optional]', false, skipSubcomponents);
                    for(var m = 0; m < optional.length; m++) {
                        if(optional[m].hasAttr('data-pgc-optional-restore')) continue;

                        var field_id = optional[m].getAttr('data-pgc-field') || optional[m].getAttr('data-pgc-optional');
                        if(field_id) {
                            optional[m].setAttr('data-pgc-field', field_id);
                            optional[m].removeAttrIfStartsWith('data-pgc-optional');

                            if(!(field_id in c.component_fields)) {
                                c.component_fields[field_id] = {name: field_id, content: false, attrs: [], classes: [], repeat: true, optional: true};
                            } else {
                                c.component_fields[field_id].optional = true;
                            }
                        }
                    }

                    if(!is_master) {
                        f.changeComponentDefinitionsToComponentInstances(cel);
                    }


                    //find and remember advanced editable areas
                    /*
                    c.editable_areas = [];
                    var editable = cel.findIncludingSelf('[data-pgc-edit-selector]');
                    for(var m = 0; m < editable.length; m++) {
                        var sel = editable[m].getAttr('data-pgc-edit-selector');
                        if(sel) {
                            var edit_def = pgcVarParseValue(editable[m].getAttr('data-pgc-edit'));
                            edit_def.selector = sel;
                            edit_def.classes = editable[m].getAttr('data-pgc-edit-classes');
                            c.editable_areas.push(edit_def);
                            editable[m].removeAttrIfStartsWith('data-pgc-edit');
                        }
                    }
                    */
                    //done advanced editable areas

                    //advanced repeats
                    /*
                    c.repeatable_areas = [];
                    var repeatable = cel.findIncludingSelf('[data-pgc-repeat-selector]');
                    for(var m = 0; m < repeatable.length; m++) {
                        var sel = repeatable[m].getAttr('data-pgc-repeat-selector');
                        if(sel) {
                            c.repeatable_areas.push({id: repeatable[m].getAttr('data-pgc-repeat'), selector: sel});
                            repeatable[m].removeAttrIfStartsWith('data-pgc-repeat');
                        }
                    }
*/

                    //data-pgc-define-auto-update

                    c.code = cel.toStringOriginal(true);

                    if(is_master) {
                        r.master = c;
                    } else {
                        r.components.push(c);
                    }

                    var info = project.getProjectInfo();
                    var resources = info.getSetting("project_resources");

                    if (resources) {
                        for (var j=0; j < resources.length; j++) {
                            var url = resources[j].url;
                            var file = url;
                            if (!crsaIsAbsoluteUrl(url))
                                file = project.getAbsoluteUrl( url );
                            var footer = resources[j].footer || false;

                            if (file) {
                                var res = new PgComponentTypeResource(file);
                                res.footer = footer;
                                res.relative_url = url;
                                res.source = file;

                                c.addResource(res);
                            }
                        }
                    }

                    // var reqs = elements[i].find('[data-pgc-require]');
                    // for(var j = 0; j < reqs.length; j++) {
                    //     var relative_url = reqs[j].getAttr('data-pgc-require');
                    //     var file = project.getAbsoluteUrl( relative_url );
                    //     var global = reqs[j].getAttr('data-pgc-require-global') == 'true';
                    //     var footer = reqs[j].getAttr('data-pgc-require-footer') == 'true';

                    //     if(file) {
                    //         var res = new PgComponentTypeResource(file);
                    //         res.footer = footer;
                    //         res.relative_url = relative_url; //'components/' + project.getName() + '/' + relative_url;
                    //         res.source = project.getAbsolutePath(relative_url);

                    //         if(global) {
                    //             global_resources.push(res);
                    //         } else {
                    //             c.addResource(res);
                    //         }
                    //     }
                    // }
                }
            }
            return r;
        }

        var updateComponents = function(project, done, reference_page) {
            var return_status = new PgComponentsUpdateStatus();

            var component_types_info = reference_page.getComponentTypesInformation();

            project.forEachEditableFile( function( page, pageDone, status ) {
                //on page
                if(!page.openedInEditor) {
                    page.setComponentTypesInformation(component_types_info);
                }
                if(updateComponentsInPage(page, project, null, false, return_status)) {
                    status.changed = true;
                }
                pageDone(page, status);

            }, function() {
                //on done
                if(done) done();

                showSavedDataNotice(return_status);

                return_status.show();

            }, 'Updating components...')
        }

        var getClassRegEx = function(cls) {
            if(cls.startsWith('/')) {
                try {
                    return new RegExp(cls.replace(/\//g, ''), '');
                }
                catch(err) {}
            }
            return null;
        }

        var getEditableData = function(node, field_info, fields) {
            var field_id = field_info.name;

            if(!fields[field_id]) fields[field_id] = {items: [], count: 0};
            var values = {restored: false};
            if(field_info.content) {
                values.html_content = node.html();
            }
            for(var ai = 0; ai < field_info.attrs.length; ai++) {
                values[field_info.attrs[ai]] = node.getAttr(field_info.attrs[ai]);
            }
            values.classes = {};
            var classes = /* node.getAttr('data-pgc-edit-classes') || */ field_info.classes;

            var cls_list = node.getClasses();

            for(var j = 0; j < field_info.classes.length; j++) {
                var clsre = getClassRegEx(field_info.classes[j]);
                if(clsre) {
                    for(var i = 0; i < cls_list.length; i++) {
                        if(cls_list[i].match(clsre)) {
                            values.classes[cls_list[i]] = true;
                        }
                    }
                } else {
                    values.classes[field_info.classes[j]] = node.hasClass(field_info.classes[j]);
                }
            }

            if(field_info.bckimage) {
                values.bckimage = node.getInlineStylePropertyValue('background-image', true);
            }
            fields[field_id].items.push(values);
        }


        var fillSavedDataIntoComponent = function(node, field_info, fields) {
            var field_id = field_info.name;
            if(field_id && fields[field_id]) {
                var c = fields[field_id].count;
                if(c >= fields[field_id].items.length) c = 0;
                var values = fields[field_id].items[c];

                if(field_info.content && values.html_content) {
                    node.html(values.html_content);
                }
                for(var ai = 0; ai < field_info.attrs.length; ai++) {
                    if(values[field_info.attrs[ai]]) {
                        node.setAttr(field_info.attrs[ai], values[field_info.attrs[ai]]);
                    }
                }
                var classes = /* node.getAttr('data-pgc-edit-classes') || */ field_info.classes;

                var cls_list = node.getClasses();
                var clsres = [];

                for(var j = 0; j < field_info.classes.length; j++) {
                    var clsre = getClassRegEx(field_info.classes[j]);
                    if(clsre) {
                        for(var i = 0; i < cls_list.length; i++) {
                            if(cls_list[i].match(clsre)) {
                                node.removeClass(cls_list[i]);
                            }
                        }
                        clsres.push(clsre);
                    } else {
                        if(values.classes[field_info.classes[j]]) {
                            node.addClass(field_info.classes[j]);
                        } else {
                            node.removeClass(field_info.classes[j]);
                        }
                    }
                }
                if(clsres.length) {
                    for(var i = 0; i < clsres.length; i++) {
                        $.each(values.classes, function(cls, has) {
                            if(cls.match(clsres[i])) {
                                if(has) {
                                    node.addClass(cls);
                                } else {
                                    //already removed above
                                }
                            }
                        })
                    }
                }

                if(field_info.bckimage) {
                    if(values.hasOwnProperty('bckimage')) {
                        node.setInlineStylePropertyValue('background-image', values.bckimage, true);
                    }
                }

                values.restored = true;
                c++;
                fields[field_id].count = c;
            }
        }

        var getUnrestoredFields = function(fields) {
            var list = [];
            $.each(fields, function(id, data) {
                for(var i = 0; i < data.items.length; i++) {
                    if(!data.items[i].restored) {
                        data.items[i].field_id = id;
                        list.push(data.items[i]);
                    }
                }
            })
            return list;
        }

        var getSavedDataForElement = function(pgel, remove) {
            var data = null;
            for(var i = 0; i < pgel.children.length; i++) {
                if(pgel.children[i].comment) {
                    if(pgel.children[i].attributes.indexOf('[Pinegrow components saved data') >= 0) {
                        data = $.trim(pgel.children[i].attributes.replace(/\[Pinegrow components saved data[^\]]*\]/, '').replace(/\-\-$/,''));
                        data = data.replace(/\[\[\[\-\-/g, '<!--').replace(/\-\-\]\]\]/g, '-->');
                        if(remove) pgel.children[i].remove();
                    }
                }
            }
            return data;
        }

        var removeSavedDataFromElement = function(node) {
            var r = [];
            node.walkSelfAndChildren(function(pgel) {
                if(pgel.comment) {
                    if(pgel.attributes.indexOf('[Pinegrow components saved data') >= 0) {
                        r.push(pgel);
                    }
                }
                return true; //continue
            })
            for(var i = 0; i < r.length; i++) {
                r[i].remove();
            }
            return r.length;
        }

        var clearSavedDataFromPage = function(page) {
            var count;
            pinegrow.makeChanges(page, null, 'Clear saved unused edits', function() {
                count = removeSavedDataFromElement(page.sourceNode);
            })
            return count;
        }

        //Get field_info for field_id from component def c
        var getFieldInfo = function(field_id, c) {
            if(c.component_fields && (field_id in c.component_fields)) return c.component_fields[field_id];
            return null;
        }

        var walkSelfAndChildrenButDontGoInComponents = function(start_node, func, master) {
            start_node.walkSelfAndChildren(function(node) {
                //why !master ???
                //if(!master && node != start_node && (node.hasAttr('data-pgc') || node.hasAttr('data-pgc-define'))) return 'skip_children';
                //try without
                if(node != start_node && (node.hasAttr('data-pgc') || node.hasAttr('data-pgc-define'))) return 'skip_children';
                return func(node);
            });
        }

        /* node - old element, pgel - new element, c - component definition */
        var copyEditableDataFromOldElementToNew = function(node, pgel, c, restore_optional, status, dont_save_unused) {
            var fields = {};
            var repeated = {};
            var optional_present = {};
            var detached_editable_areas = 0;
            var detached_editable_areas_list = [];
            var detached_editable_areas_html = '';

            status = status || {saved: 0, deleted: []};


            var saved_data_html = getSavedDataForElement(node, true);
            var saved_nodes = [];
            var append_nodes = [];

            if(saved_data_html) {
                var p = new pgParser();
                p.assignIds = false;
                p.parse(saved_data_html);
                for(var i = 0; i < p.rootNode.children.length; i++) {
                    var n = p.rootNode.children[i];
                    var field_id = n.getAttr('data-pgc-field');
                    if(field_id) {
                        var field_info = getFieldInfo(field_id, c);
                        if(field_info && field_info.optional) {
                            continue; //skip optional
                        }
                    }
                    saved_nodes.push(n);
                }
            }

            for(var i = 0; i < saved_nodes.length; i++) {
                node.append(saved_nodes[i]);
            }

            //get data out of standard editable area
            walkSelfAndChildrenButDontGoInComponents(node, function(node) {

                for(var i = 0; i < max_fields; i++) {
                    var key = 'data-pgc-field' + (i == 0 ? '' : '-' + i);
                    var field_id = node.getAttr(key);
                    if(field_id) {
                        var field_info = getFieldInfo(field_id, c);
                        if(field_info) {
                            getEditableData(node, field_info, fields);

                            if(field_info.optional) {
                                optional_present[field_id] = true;
                            }
                        } else {
                            detached_editable_areas_html += node.toStringOriginal(true);
                            detached_editable_areas++;
                            detached_editable_areas_list.push({field_id: field_id, node: node});
                        }

                        //standard repeats
                        var repeat_id = (c.component_repeat_fields && c.component_repeat_fields[field_id]) ? field_id : null;
                        if(repeat_id) {
                            if(!repeated[repeat_id]) repeated[repeat_id] = 0;
                            repeated[repeat_id]++;
                        }
                    }
                }
                return true;
            }, c.master_page_url || false)

            for(var i = 0; i < saved_nodes.length; i++) {
                saved_nodes[i].remove();
            }


            //get data from advanced editable areas
            /*
            for(var i = 0; i < c.editable_areas.length; i++) {
                var elements = node.find(c.editable_areas[i].selector);

                var field_info = c.editable_areas[i];
                var field_id = field_info.name;

                for(var j = 0; j < elements.length; j++) {
                    getEditableData(elements[j], field_info, fields);
                }
            }
            */
            //ok, got data from editable areas

            //advanced repeats
            /*
            for(var i = 0; i < c.repeatable_areas.length; i++) {
                var elements = node.find(c.repeatable_areas[i].selector);
                var repeated_id = c.repeatable_areas[i].id;
                repeated[repeat_id] = elements.length;
            }

            */
            //node is the existing component

            //repeat advanced repeats
            /*
            for(var i = 0; i < c.repeatable_areas.length; i++) {
                var elements = pgel.find(c.repeatable_areas[i].selector);
                var repeated_id = c.repeatable_areas[i].id;
                if(repeated[repeat_id]) {
                    for(var i = elements.length; i < repeated[repeat_id]; i++) {
                        var new_el = elements[elements.length-1].clone();
                        new_el.insertAfter(elements[elements.length-1]);
                    }
                }
            }
            */
            //advanced repeats done

            var remove_optional_elements = [];

            walkSelfAndChildrenButDontGoInComponents(pgel, function(node) {

                var repeat_id = node.getAttr('data-pgc-field');
                if(repeat_id && repeated[repeat_id]) {
                    for(var i = 1; i < repeated[repeat_id]; i++) {
                        var new_el = node.clone();
                        new_el.insertAfter(node);
                    }
                    repeated[repeat_id] = 0;
                }

                //fill standard data
                for(var i = 0; i < max_fields; i++) {
                    var key = 'data-pgc-field' + (i == 0 ? '' : '-' + i);
                    var field_id = node.getAttr(key);
                    if(field_id) {
                        var field_info = getFieldInfo(field_id, c);
                        if(field_info) {
                            fillSavedDataIntoComponent(node, field_info, fields);

                            if(field_info.optional) {
                                if(!optional_present[field_id] && !restore_optional) {
                                    remove_optional_elements.push(node);
                                }
                            }
                        }
                    }
                }
                return true;
            }, c.master_page_url || false)

            for(var i = 0; i < remove_optional_elements.length; i++) {
                remove_optional_elements[i].remove();
            }

            //var unrestored = getUnrestoredFields(fields);

            if(detached_editable_areas && !dont_save_unused) {
                //console.log(unrestored);
                //pinegrow.showQuickMessage(unrestored.length + ' fields were lost');

                var key = '[Pinegrow components saved data - this data is no longer used in the component. We\'re saving it just in case. Clear this with Components -> Clear saved unused edits]';
                //var json = JSON.stringify(unrestored);

                var c = '<!--' + key + detached_editable_areas_html.replace(/\<\!\-\-/g,'[[[--').replace(/\-\-\>/g, '--]]]') + '-->';
                pgel.append(pgCreateNodeFromHtml(c));

                status.saved = detached_editable_areas;
                status.deleted_areas = detached_editable_areas_list;
            }


            //fill advanced data
            /*
            for(var i = 0; i < c.editable_areas.length; i++) {
                var elements = pgel.find(c.editable_areas[i].selector);

                var field_info = c.editable_areas[i];

                for(var j = 0; j < elements.length; j++) {
                    fillSavedDataIntoComponent(elements[j], field_info, fields);
                }
            }
            */
            //end adv data

            return status;
        }

        //returns null or "changed" or "refresh"
        var updateComponent = function(node, c, page, update_tree_list, restore_optional_areas, test, ignore_auto_update, dont_save_unused) {

            var status = {refresh_page: false, changed: false, saved:0, $new_el: null, deleted_areas: null};

            if(!c.auto_update && !ignore_auto_update) return status;

            //create new component instance
            var code = pinegrow.getCodeFromDefinition(c);
            var pgel = pgCreateNodeFromHtml(code);

            //console.log('Updating COMP ' + c.name + ' - ' + node.getOpeningTag() + '...' + node.getClosingTag());

            copyEditableDataFromOldElementToNew(node, pgel, c, restore_optional_areas, status, dont_save_unused);

            if(page) {
                page.callFrameworkHandler('on_component_updated', pgel, null, c);
            }

            //if changed
            var new_code = pgel.toStringOriginal(true);
            if(node.toStringOriginal(true) != new_code) {
                status.changed = true;

                if(!test) {
                    node.replaceWith( pgel, true /* detach */ );
                    //update $element
                    var $el = null;
                    var $new_el = null;

                    if(page && page.openedInEditor) {
                        $el = node.get$DOMElement( page.get$Html());
                        if($el) {
                            var html = page.getViewHTMLForElement(pgel);

                            $new_el = $(html);

                            if(pinegrow.isElementSelected($el)) {
                                select_element_after_update = $new_el;
                            }

                            var select_new = pinegrow.isElementOrDescendantSelected($el);

                            $el.replaceWith($new_el);

                            $new_el.attr('data-pg-tree-id', $el.attr('data-pg-tree-id'))
                            update_tree_list.push($new_el);

                            status.$new_el = $new_el;

                            if(select_new) {
                                pinegrow.selectElement($new_el);
                            }

                        } else {
                            status.refresh_page = true;
                        }
                    }

                    node.remove();
                } else {
                    pgel.remove();
                }
            } else {
                pgel.remove(); //throw it away
            }
            return status;
        }

        var wouldUpdateChangeComponentInstance = function(node, page) {
            var comp_type = node.getAttr('data-pgc');
            if(comp_type) {
                var c = page.getTypeDefinition(comp_type);
                if(c) {
                    return updateComponent(node, c, null, [], false, true /* test */).changed;
                }
            }
            return false;
        }

        var updateComponentsInPage = function(page, project, subtree, restore_optional_areas, return_status, done) {
            var changed = false;
            var refresh_page = false;
            var saved = 0;
            var components_on_the_page = 0;

            select_element_after_update = null;

            if(!restore_optional_areas && pinegrow.getSetting('pgc-ignore-optional', '0') == '1') {
                restore_optional_areas = true;
                pinegrow.showQuickMessage('Optional areas are ignored.');
            }

            var update_tree_list = [];

            return_status = return_status || new PgComponentsUpdateStatus();

            if(page.openedInEditor) {
                //will create undo point
                willMakeChange(page.$iframe, 'Update components');
            }

            var interactive = return_status.on_before_update || return_status.on_before_update_master || false;


            completion_status = 'done';

            var onDone = function () {
                if (changed) {
                    if (page.openedInEditor) {
                        didMakeChange(page.$iframe);
                        if (refresh_page) {
                            page.refresh();
                        } else {
                            if (update_tree_list.length) {
                                pinegrow.updateTreeMultiple(update_tree_list);
                            }
                            if (select_element_after_update) {
                                pinegrow.selectElement(select_element_after_update);
                            }
                        }
                        page.refreshDisplay();
                    }
                } else {
                    if (page.openedInEditor) {
                        //undo undo restore point
                        page.undoStack.remove();
                    }
                }
                if (done) done(changed, completion_status);
            }

            var doUpdateComponents = function() {

                if (!subtree) subtree = page.sourceNode;

                var node_list = [];

                subtree.walkSelfAndChildren(function (node) {
                    if (node.isElement) {
                        var c = null;
                        var comp_type = node.getAttr('data-pgc');
                        if (!node.hasAttr('data-pgc-define')) {
                            if (comp_type) {
                                if (node.hasAttr('data-pgc-no-update')) return true; //do not update
                                c = page.getTypeDefinition(comp_type);
                            } else {
                                //c = page.getMainType(null, node, true, true);
                            }
                        }
                        if (c) {
                            node_list.push({c: c, node: node, comp_type: comp_type});
                        }
                    }
                    return true;
                });



                var doNode = function (idx) {

                    if (idx < node_list.length) {
                        var node = node_list[idx].node;
                        var c = node_list[idx].c;
                        var comp_type = node_list[idx].comp_type;

                        components_on_the_page++;

                        var do_update = true;

                        var doUpdate = function (dont_save_unused) {
                            var status = updateComponent(node, c, page, update_tree_list, restore_optional_areas, null, null, dont_save_unused);
                            changed = changed || status.changed;
                            saved += status.saved;

                            return_status.saved += saved;

                            if (status.refresh_page) {
                                refresh_page = true;
                            }
                        }

                        var test_status = updateComponent(node, c, page, update_tree_list, restore_optional_areas, true);
                        if (!test_status.changed) {
                            do_update = false;
                            if(interactive) {
                                doNode(idx + 1);
                            }
                        } else {
                            if (interactive) {
                                var callback = false;
                                if (return_status.on_before_update) {
                                    callback = true;
                                    return_status.on_before_update(node, c, test_status, function (action) {
                                        switch (action) {
                                            case 'update':
                                            case 'update-delete':
                                                doUpdate(true /* dont save unused */);
                                                break;
                                            case 'update-save':
                                                doUpdate();
                                                break;
                                            case 'skip':

                                                break;
                                            case 'stop':
                                                completion_status = 'stop';
                                                onDone();
                                                return;
                                                break;
                                        }
                                        doNode(idx + 1);
                                    });
                                }
                                if (!callback) {
                                    doUpdate();
                                    doNode(idx + 1);
                                }
                            }
                            else {
                                doUpdate();
                            }
                        }
                    } else {
                        onDone();
                    }
                }

                if (interactive) {
                    doNode(0);
                } else {
                    for (var i = 0; i < node_list.length; i++) {
                        doNode(i);
                    }
                    onDone();
                }
            }

            var doApplyMasterPage = function() {
                if (applyMasterPage(page, project, return_status)) {
                    changed = true;
                    refresh_page = true;
                }
            }

            //update master page
            if(!subtree) {
                if(!interactive) {
                    doApplyMasterPage();
                } else {
                    if(return_status.on_before_update_master) {
                        var test_status = applyMasterPage(page, project, return_status, false, true /* test */);
                        if(test_status) {
                            return_status.on_before_update_master(page, test_status.master_def, test_status, function (action) {
                                switch (action) {
                                    case 'update':
                                        //Update master
                                        doApplyMasterPage();
                                        doUpdateComponents();
                                        break;

                                    case 'skip':
                                        doUpdateComponents();
                                        break;
                                    case 'stop':
                                        completion_status = 'stop';
                                        onDone();
                                        return
                                        break;
                                }
                            });
                        } else {
                            //nothing to update, no mp or master page would not change
                            doUpdateComponents();
                        }
                    } else {
                        doApplyMasterPage();
                        doUpdateComponents();
                    }
                }
            }

            //update components
            if(!interactive) {
                doUpdateComponents();
            }

            return changed;
        }

        var updatePageScreenshot = function (page, project, force) {
            if (!page) {
                pinegrow.showQuickMessage("You have to open the page in order to update the screenshot");
                return false;
            }

            var file_path = getImagePathForPage(page, project);
            if (force || !crsaIsFileExist(file_path)) {
                pinegrow.takePhotoOfPage(page, file_path, function () {
                    pinegrow.showQuickMessage("Screenshot updated successfuly");
                });
                return true;
            }
            else {
                pinegrow.showQuickMessage("Screenshot not updated");
                return false;
            }
        }

        var isMasterPage = function (page) {
            if (!page) return;

            var html = page.sourceNode.findOne('html');
            if(html) {
                if (html.hasAttr('data-pgc-set-master'))
                    return true;
                else
                    return false;
            }
            return false;
        }

        /*

        var getMasterPage = function(url) {
            var page = pinegrow.getCrsaPageForUrl( url );
            return page;
        }
        */

        var getMasterPage = function(page, project, status) {
            var html = page.sourceNode.findOne('html');
            if(html) {
                if(!project.framework) return null;

                var master_pages = project.framework.master_pages;

                var use_master = html.getAttr('data-pgc-master');
                if(use_master) {
                    var key = 'master.' + use_master;
                    if(key in master_pages) {
                        return master_pages[key];
                    } else {
                        if(status) {
                            status.addError('Page <b>' + page.name + '</b>: master page <b>' + use_master + '</b> not found.');
                        }
                    }
                }
            }
            return null;
        }

        var applyMasterPage = function(page, project, return_status, restore_optional_areas, test) {
            var master_def = getMasterPage(page, project, return_status);
            if(master_def) {

                var new_page_source_node = master_def.master_page_source_node.clone();

                //f.changeComponentDefinitionsToComponentInstances(new_page_source_node);

                new_page_source_node.setDocument(new_page_source_node);

                var status = copyEditableDataFromOldElementToNew(page.sourceNode, new_page_source_node, master_def, restore_optional_areas);

                if(status) {
                    status.master_def = master_def;
                }

                if(page.sourceNode.toStringOriginal(true) != new_page_source_node.toStringOriginal(true)) {

                    if(test) {
                        new_page_source_node.remove(); //throw it away
                        return status;
                    }

                    page.sourceNode.remove();
                    page.sourceNode = new_page_source_node;

                    pinegrow.fixLinks(project, page, master_def.master_page_url, page.url, function (badLinksFound) {
                        if (badLinksFound) {
                            pinegrow.showQuickMessage("This page has broken links");
                        }
                    }, false, true);

                    return status; //changed
                }

            }
            return false;
        }


        f.on_project_loaded = function(selectedPage, project) {

            if(pinegrow.getSetting('pgc-auto-reload', '1') == '1') {
                refreshComponents(project);
            } else {
                showReloadComponentsManuallyNotice();
            }

        }

        f.on_project_refreshed = function(selectedPage, project) {

            if(pinegrow.getSetting('pgc-auto-reload', '1') == '1') {
                refreshComponents(project);
            } else {
                showReloadComponentsManuallyNotice();
            }
        }

        f.on_project_closed = function() {
            setHasUpdates(false);
        }

        f.reloadProjectAndUpdateComponents = function() {

            pinegrow.stats.using('components.updateproject');

            setHasUpdates(false);
            requireProject(function(project) {
                requireAtLeastOneOpenPage(project, function(reference_page) {
                    project.reload(function() {
                        project.showProjectExplorer($('#crsa-project'));

                        pinegrow.showNotice('<p><b>Update whole project</b> will go through <b>ALL</b> editable files (HTML, HTM, or file types listed in Editable file types in Support -&gt; Settings) in your project and apply changes to these files.</p><p><b>Changed files will not be saved.</b> Changed files will be marked in the <b>Project view</b> with <b><i class="fa fa-asterisk" style="color:#444;"></i></b> icon.<ul><li><b>Click on file</b> in PRJ view to open the changed file</li><li><b>Right-click</b> on the file and choose <b>Save</b></li><li>Use <b>File -&gt; Save all</b> to save all changed files.</li></ul></p><p><b>Be careful:</b> this action can change lots of your files. It is strongly <b>recommended</b> that you use a <b>source versioning system</b> (like Git) for this project.</p>', 'About updating project', 'comps-update-project', function() {
                            refreshComponents(project, function() {
                                updateComponents(project, null, reference_page);
                            });
                        });
                    })
                })
            })
        }



        if(canUse()) {
            f.on_key_pressed = function(page, event, status) {

                if(event.which == 85 && event.pgCtrlKey) {
                    if(event.shiftKey) {
                        f.reloadProjectAndUpdateComponents();
                    } else {
                        quickRefreshAndUpdate();
                    }
                    status.done = true;
                }
            }
        }

        var getImagePathForPage = function (page, project) {
            var path = require('path');
            var name = crsaRemoveExtFromUrl(page.name) + ".png";

            var file_path = path.join(project.getDir(), "screenshots");
                file_path = path.join(file_path, name);

            return file_path;
        }

        var PgComponentsUpdateStatus = function() {
            this.saved = 0;
            this.errors = [];

            this.addError = function(msg) {
                this.errors.push(msg);
            }

            this.getErrors = function() {
                if(this.errors.length) {
                    return '<ul><li>' + this.errors.join('</li><li>') + '</li></ul>';
                }
                return null;
            }

            this.hasErrors = function() {
                return this.errors.length > 0;
            }

            this.show = function(completion_status) {
                if(!this.hasErrors()) {
                    if(completion_status == 'stop') {
                        pinegrow.showQuickMessage('Components update was stopped.');
                    } else {
                        pinegrow.showQuickMessage('Components refreshed and updated.');
                    }
                } else {
                    pinegrow.showAlert('<p>The following problems happened during the ' + (completion_status == 'stop' ? 'stopped ' : '') + 'update:</p>' + this.getErrors(), 'Oops, the update didn\'t go smoothly');
                }
            }
        }

        var showSavedDataNotice = function(status) {
            if(status.saved) {
                pinegrow.showNotice('<p>Some editable areas were removed from component definitions (or their field ids were changed). To prevent the corresponding edits from being lost, the edits were saved in component instances in the form of special invisible HTML comments.</p><p><b>To show this data again</b> restore editable areas in component definition.</p><p><b>To remove saved data</b> on the selected page use <b>Components -&gt; Clear saved data</b>.</p>', 'Unused editable areas', 'pgc-saved-data', function(showed) {
                    if(!showed) {
                        pinegrow.showQuickMessage(status.saved + ' unused edits were saved in components.', 3000);
                    }
                })
            }
        }

        var quickRefreshAndUpdate = function(done) {

            pinegrow.stats.using('components.quickupdate');

            requireProject(function(project) {
                var pages = pinegrow.getAllPages();
                for(var i = 0; i < pages.length; i++) {
                    if(project.isPageInProject(pages[i])) {
                        quickRefreshComponentsInPage(pages[i], project);
                    }
                }
                var status = new PgComponentsUpdateStatus();

                status.on_before_update_master = status.on_before_update = function(pgel_or_page, comp_def, status, response_func) {
                    var is_master = pgel_or_page instanceof CrsaPage;
                    var pgel = is_master ? pgel_or_page.sourceNode.findOne('html') : pgel_or_page;

                    if(status.deleted_areas) {
                        var str = '<ul>';
                        status.deleted_areas.forEach(function (a) {
                            var field_el = findEditableElementInComponent(pgel, a.field_id);
                            str += field_el ? '<li><b><a href="#" data-pg-select-element="' + field_el.getId() + '">' + a.field_id + '</a></b>' : '<li><b>' + a.field_id + '</b>';
                            var t = a.node.html();
                            if (t.length) {
                                t = crsaGetSummaryStr(escapeHtmlCode(t), 60, true);
                                str += ' | ' + t;
                            }
                            str += '</li>';
                        })
                        str += '</ul>';

                        var onSelect = function (action) {
                            response_func(action);
                        }

                        var title = is_master ? 'Master page and Child page have different editable areas' : 'Some information will be lost after update';

                        var msg = is_master ? '<p>Applying master page <b>' + comp_def.name + '</b> to the child page <b>' + pgel_or_page.name + '</b> will delete the information in some of its editable areas because these editable areas don\'t exist in the master page anymore (did you rename field ids or select a different master page?):</p>' + str + '<p>How would you like to proceed?</p>' : '<p>Updating this <b>' + comp_def.name + '</b> component instance (see selected element) will delete the information in some of its editable areas because these editable areas don\'t exist in the new component definition anymore (did you rename field ids or change component types?):</p>' + str + '<p>How would you like to proceed?</p>';

                        var buttons = null;

                        if(is_master) {
                            buttons = [
                                {
                                    label: 'Do not update',
                                    action: 'skip',
                                    func: onSelect,
                                    tooltip: 'Don\'t update this child page.',
                                    primary: true
                                },
                                {
                                    label: 'Update and discard',
                                    action: 'update',
                                    func: onSelect,
                                    tooltip: 'Update the page and discard the unused information'
                                },
                                {
                                    label: 'Stop update',
                                    action: 'stop',
                                    func: onSelect,
                                    tooltip: 'Stop the process of updating components.'
                                }

                            ]
                        } else {
                            buttons = [
                                {
                                    label: 'Do not update',
                                    action: 'skip',
                                    func: onSelect,
                                    tooltip: 'Don\'t update this component instance.',
                                    primary: true
                                },
                                {
                                    label: 'Update and save',
                                    action: 'update-save',
                                    func: onSelect,
                                    tooltip: 'Deleted areas will be saved as HTML comment inside the instance. The information will be restored if the editable area comes back to the component. Use <b>Components -&gt; Clear saved data</b> to remove saved information.',
                                    primary: true
                                },
                                {
                                    label: 'Update and discard',
                                    action: 'update-delete',
                                    func: onSelect,
                                    tooltip: 'Update the component and discard the unused information'
                                },
                                {
                                    label: 'Stop update',
                                    action: 'stop',
                                    func: onSelect,
                                    tooltip: 'Stop the process of updating components.'
                                }

                            ]
                        }

                        var ask = new PgAskAboutElements([pgel], msg, title, buttons);
                        ask.show();
                    } else {
                        response_func('update');
                    }

                }

                pages = pinegrow.getAllPages().concat([]);

                var completion_status = 'done';

                var doPage = function() {
                    if(pages.length) {
                        quickUpdateComponentsInPage(pages.shift(), project, status, function(changed, status) {
                            if(status == 'stop') {
                                completion_status = 'stop';
                                pages = [];
                            }
                            doPage();
                        });
                    } else {
                        status.show(completion_status);

                        showSavedDataNotice(status);

                        if(done) done(completion_status);
                    }
                }

                doPage();
            })
            setHasUpdates(false);
        }

        if(canUse()) {
            f.on_page_changed = function(page, $el) {

                var $c = $el.closest('[data-pgc-define]');

                if($c.length || $el.closest('[data-pgc-set-master]').length) {
                    setHasUpdates(true);
                }
            }

            f.on_duplicate_element_async = function(page, pgel, done) {
                var comp_type;
                if(comp_type = isComponentDefinition(pgel, page)) {
                    var name = getComponentTypeName(comp_type, page);
                    pinegrow.showAlert('<p>This element is the definition of the component <b>' + name + '</b>.</p><p>Would you like to duplicate the component definition - or - make the duplicated element an instance of this component?</p>', 'Duplicating component definition', 'Duplicate definition', 'Create instance', function() {
                        //nothing to do
                        done(pgel);
                        pinegrow.showQuickMessage('Definition duplicated. Change component id if you want to keep both.');
                    }, function() {
                        //change to instance
                        f.changeComponentDefinitionsToComponentInstances(pgel);
                        done(pgel);
                    })
                } else {
                    done(pgel);
                }
            }

            f.on_before_delete_element_async = function(page, pgel, done) {
                var comp_type;
                if(comp_type = isComponentDefinition(pgel, page)) {
                    var name = getComponentTypeName(comp_type, page);
                    pinegrow.showAlert('<p>This element is the definition of the component <b>' + name + '</b>.</p><p>Deleting the component definition will break all instances of this component.</p><p>Would you like to delete it?</p>', 'Deleting component definition', 'Do not delete', 'Delete definition', function() {
                        //nothing to do
                        done(null); //cancel delete
                    }, function() {
                        //delete
                        done(pgel);
                        pinegrow.showQuickMessage('Component definition was deleted.');
                    })
                } else {
                    done(pgel);
                }
            }
        }

        var getComponentTypeName = function(comp_type, page) {
            var c = page.getTypeDefinition(comp_type);
            return c ? c.name : comp_type;
        }

        var isComponentDefinition = function(pgel, page) {
            //just quick check
            return pgel.getAttr('data-pgc-define');
            if(comp_type) {
                if(!page) page = pinegrow.getCrsaPageOfPgParserNode(pgel);
                return page.getTypeDefinition(comp_type);
            }
            return null;
        }

        var restoreOptionalAreasOnMasterPage = function(page, project) {
            willMakeChange(page.$iframe, 'Restore master page optional areas');
            var return_status = new PgComponentsUpdateStatus();
            if(applyMasterPage(page, project, return_status, true /* restore optional areas */)) {
                didMakeChange(page.$iframe);
                page.refresh();
            } else {
                page.undoStack.remove();
            }
            pinegrow.showQuickMessage('Optional areas restored');
        }


        f.on_page_menu = function(page, items) {
            var project = pinegrow.getCurrentProject();
            if(project && project.isPageInProject(page) && getMasterPage(page, project)) {
                items.push({
                    divider: true
                    //header: 'Components'
                })

                items.push({
                    label: 'Restore optional areas',
                    func: function() {
                        restoreOptionalAreasOnMasterPage(page, project);
                    }
                })
            }
        }

        var goToDefinition = function(c) {
            pinegrow.stats.using('components.gotodefinition');

            if(c.sourceUrl) {
                pinegrow.openOrShowPage(c.sourceUrl, function(def_page) {
                    pinegrow.setSelectedPage(def_page);
                    var defel = def_page.sourceNode.findOneWithAttrValue('data-pgc-define', c.type);
                    if(defel) {
                        var $el = defel.get$DOMElement(def_page.get$Html());
                        if($el) {
                            pinegrow.selectElement($el, true);
                            pinegrow.scrollToElement($el);
                        }
                    }
                }, false, true);
            } else {
                pinegrow.showQuickMessage('Sorry, don\'t know where the component is defined.', 4000, false, 'error');
            }
        }

        var duplicateDefinition = function(c, insert_after) {
            f.requireSelectedElement(function(page, $el, pgel) {

                var duplicateIt = function(new_id) {
                    var code = c.definition_code;
                    var new_el = new pgQuery().create(code, page);
                    new_el.attr('data-pgc-define', new_id);

                    var elpgq = new pgQuery($el);

                    if(canMakeChange(insert_after ? pgel.parent : pgel, 'insert_element')) {
                        pinegrow.makeChanges(page, $el, 'Duplicate definition', function() {
                            if(insert_after) {
                                new_el.insertAfter(elpgq);
                            } else {
                                elpgq.append(new_el);
                            }
                            pinegrow.setNeedsUpdate(insert_after ? $el.parent() : $el);
                        })
                    }
                    pinegrow.selectElement(new_el.$get(0), true);
                    pinegrow.showQuickMessage('Component definition duplicated.');
                    setHasUpdates(true);
                }

                pinegrow.showPrompt('<p>Enter the new component\'s id:</p>', 'Choose the unique id for the component', c.type, '', null, function(val) {
                    var existing = page.getTypeDefinition(val);
                    if(existing) {
                        pinegrow.showAlert('Component definition with the id <b>' + val + '</b> already exists. Are you sure you want to use this id?', 'The id is not unique', 'Cancel', 'Use it!', function() {
                            //cancel
                        }, function() {
                            //use it
                            duplicateIt(val);
                        })
                    } else {
                        duplicateIt(val);
                    }
                })
            })
        }

        var makeInstanceOf = function(c) {
            f.requireSelectedElement(function(page, $el, pgel) {

                //pgel is pgQuery

                pinegrow.makeChanges(page, $el, "Make instance of", function() {
                    pgel = pgel.get(0).pgel;

                    if(pgel) {
                        var cel = pgCreateNodeFromHtml(c.code);

                        var fields = cel.findIncludingSelf('[data-pgc-field]');
                        for(var i = 0; i < fields.length; i++) {

                            var field_id = fields[i].getAttr('data-pgc-field');
                            var sel = pgFindUniqueSelectorForElement(fields[i], cel, {tag: true, path: true});

                            if(sel) {
                                var els = pgel.find(sel);
                                console.log('Selector = ' + sel + ' - found ' + els.length);
                                for(var j = 0; j < els.length; j++ ) {
                                    els[j].setAttr('data-pgc-field', field_id);
                                    console.log(els[j].getOpeningTag());
                                }
                            }
                        }

                        pgel.setAttr('data-pgc', c.type);

                        pgel.setAttr('data-pgc-dummy', 'hello'); //will force update because new code will differ

                        var update_tree_list = [];

                        var status = updateComponent(pgel, c, page, update_tree_list, false);
                        pinegrow.updateTreeMultiple(update_tree_list);

                        if(status.$new_el) {
                            pinegrow.selectElement(status.$new_el);
                        }
                    }
                })
            })
        }

        var isProjectComponent = function(def) {
            return def.framework.project ? true : false;
        }

        if(canUse()) {
            f.on_build_lib_actions_menu = function(page, actions, def) {

                if(isProjectComponent(def) && !isContributorModeOrTest()) {
                   actions.push(
                        {label: "Make selected an instance of <b>" + def.name + "</b>", class: 'action-make-instance-of', kbd: null, manage_change: true, action: function() {
                            makeInstanceOf(def);
                        }});
                    actions.push(
                        {label: "Go to definition", class: 'action-go-to-definition', kbd: null, manage_change: true, action: function() {
                            goToDefinition(def);
                        }});

                    actions.push(
                        {label: "Duplicate definition...", class: 'duplicate-definition', kbd: null, manage_change: true, action: function() {
                            duplicateDefinition(def, true);
                        }});
                }
            }

            f.on_project_item_get_context_menu = function(page, file) {
                var items = [];

                if (!resourceEditor || (resourceEditor && !resourceEditor.getProject())) {
                    var project = pinegrow.getCurrentProject();
                    resourceEditor = new PgResourceEditor(project);
                }

                items.push({
                    divider: true,
                    header: 'Components'
                })


                var addRequireFile = function(global) {
                    f.requireSelectedElement(function(cp, $el, pgel) {

                        if(pgel.hasAttr('data-pgc-define')) {
                            var url = cp.makeRelativeUrl(file.url);

                            var code = '<pgcparam data-pgc-require="' + url + '"';
                            if(global) {
                                code += ' data-pgc-require-global="true"';
                            }
                            code += '></pgcparam>';
                            var param = (new pgQuery()).create(code);

                            pinegrow.makeChanges(cp, $el, 'Insert component parameter', function() {
                                pgel.prepend(param);
                                pinegrow.setNeedsUpdate($el);
                            })
                            pinegrow.showQuickMessage('Parameter added.');
                        } else {
                            pinegrow.showAlert('<p><b>A component definition must be selected.</b></p><p>Select a component definition and then set which files and folders are required by that component or by the whole library.</p>', 'This only works on component definitions');
                        }
                    });
                }

                items.push({
                    label: 'Add to resources...',
                    func: function() {
                        //addRequireFile(false);
                        // pinegrow.showQuickMessage('Not yet supported. Use <b>Required by all</b>.', 5000);
                        resourceEditor.requireFileFromUrl(file.url);
                    }
                })

                /*
                items.push({
                    label: 'Required ' + (file.isFile ? 'file' : 'folder') + ' by all: ' + file.name,
                    func: function() {
                        addRequireFile(true);
                    }
                })
    */
                if (isMasterPage(page)) {
                    items.push({
                        label: 'Update screenshot',
                        func: function () {
                            var project = pinegrow.getCurrentProject();
                            updatePageScreenshot(page, project, true);
                            pinegrow.cache_breaker++;
                        }
                    })
                }

                return items;
            }
        }

        if(canUse()) {
            f.on_build_actions_menu = function(page, menus, pgel, $el) {
                if(!isContributorModeOrTest()) {
                    var project = pinegrow.getCurrentProject();
                    if (pgel.tagName == 'html' && project && project.isPageInProject(page) && getMasterPage(page, project)) {
                        menus.push({
                            type: 'divider'
                        })
                        menus.push({
                            type: 'header',
                            label: 'Master page'
                        })

                        menus.push({
                            label: 'Restore optional areas',
                            manage_change: true,
                            action: function () {
                                restoreOptionalAreasOnMasterPage(page, project);
                            }
                        })
                    }

                    var comp_type = pgel.getAttr('data-pgc') || pgel.getAttr('data-pgc-define');
                    if (comp_type) {
                        var c = page.getTypeDefinition(comp_type);
                        if (c) {
                            if (c.framework.project) {

                                menus.push({
                                    type: 'divider'
                                })
                                menus.push({
                                    type: 'header',
                                    label: 'Components'
                                })

                                if (pgel.getAttr('data-pgc') && (!c.auto_update || pgel.hasAttr('data-pgc-no-update'))) {
                                    menus.push(
                                        {
                                            label: "Update component instance",
                                            class: 'action-update-component',
                                            kbd: null,
                                            manage_change: true,
                                            action: function ($el) {
                                                willMakeChange(page.$iframe, 'Update component instance');
                                                var update_tree_list = [];
                                                var status = updateComponent(pgel, c, page, update_tree_list, false, false, true /* force update */);
                                                if (status.changed) {
                                                    didMakeChange(page.$iframe);
                                                    if (update_tree_list.length) {
                                                        pinegrow.updateTreeMultiple(update_tree_list);
                                                    }
                                                    page.refreshDisplay();
                                                    pinegrow.showQuickMessage('Component instance updated!');
                                                } else {
                                                    page.undoStack.remove();
                                                    pinegrow.showQuickMessage('Component was not changed.');
                                                }
                                            }
                                        });
                                }

                                menus.push(
                                    {
                                        label: "Go to definition",
                                        class: 'action-go-to-definition',
                                        kbd: null,
                                        manage_change: true,
                                        action: function ($el) {
                                            goToDefinition(c);
                                        }
                                    });

                                menus.push(
                                    {
                                        label: "Duplicate definition...",
                                        class: 'duplicate-definition',
                                        kbd: null,
                                        manage_change: true,
                                        action: function () {
                                            duplicateDefinition(c, true);
                                        }
                                    });

                                menus.push(
                                    {
                                        label: "Restore optional areas",
                                        class: 'action-restore-optional',
                                        kbd: null,
                                        manage_change: true,
                                        action: function ($el) {
                                            updateComponentsInPage(page, c.framework.project, pgel, true);
                                        }
                                    });

                                menus.push(
                                    {
                                        label: "Take component photo",
                                        class: 'action-take-photo',
                                        kbd: null,
                                        manage_change: true,
                                        action: function ($el) {
                                            var preview_dir = path.join(c.framework.project.getDir(), 'previews');
                                            var filename = path.join(preview_dir, comp_type + '.png');
                                            crsaCreateDirs(preview_dir, fs);

                                            //some links have no dimension
                                            if ($el.outerWidth() == 0 && $el.children().length) {
                                                $el = $($el.children().get(0));
                                            }

                                            pinegrow.takePhotoOfElement($el, 400.0, filename, function () {
                                                pinegrow.showQuickMessage('&lt;project&gt;/previews/<b>' + comp_type + '.png</b> saved.');
                                                pinegrow.cache_breaker++;

                                                var gui = require('nw.gui');
                                                gui.App.clearCache();

                                                c.preview_image = comp_type + '.png';
                                                c.button_image = c.preview_image;

                                                if (c.definition_attributes && 'data-pgc-define-photo-preview-only' in c.definition_attributes) {
                                                    c.button_image = null;
                                                }

                                                $('body').trigger('crsa-update-lib-display');
                                                //pinegrow.frameworksChanged();
                                            });
                                        }
                                    });
                            }
                        }
                    }
                }
            }
        }

        pinegrow.loadProjectAsLibrary = function(folder, done, done_activated) {
            //Create empty framework
            var f_key = path.basename(folder);

            var pf = pinegrow.findFrameworkByKey(f_key);

            var folder_url = crsaMakeUrlFromFile(folder);

            if(pf) {
                if(pf.pluginUrl == folder_url) {
                    //same project already loaded, use it
                } else {
                    pinegrow.showAlert('<p>Library <b>' + f_key + '</b> is already loaded.</p><p>Note that the library folder name is used as the name of the library. This name must be unique - only one library with a certain name can be loaded.</p>', f_key + ' is already loaded');
                    if(done) done();
                    return;
                }
            }

            if(!pf) pf = new PgFramework( f_key, f_key);

            pf.pluginUrl = folder_url;

            pinegrow.addFramework(pf, -1000);
            pinegrow.frameworksChanged();

            pf.components_loaded = pf.components_loaded || false;

            pf.on_init_plugin = function(init_done_func) {
                //Load it when first activated
                if(!pf.components_loaded) {
                    var project;

                    pinegrow.stats.using('components.loadprojectaslibrary');

                    var onProjectLoaded = function(project) {

                        refreshComponents( project, function(project, framework) {
                            if(done_activated) done_activated(project, framework);
                            if(init_done_func) init_done_func(framework);
                        })
                    }

                    var current_project = pinegrow.getCurrentProject();

                    if(current_project && current_project.getDir() == folder) {
                        project = current_project;
                        project.framework = pf;
                        onProjectLoaded(project);
                    } else {
                        project = new CrsaProject();
                        project.framework = pf;

                        project.fromFolder(folder, function(project) {
                            onProjectLoaded(project);
                        }, true);
                    }

                    pf.components_loaded = true;
                } else {
                    if(init_done_func) init_done_func(pf);
                }
            }

            pf.on_plugin_activated = function(page, init_done_func) {
                pf.on_init_plugin(init_done_func);
            }

            var flist = pinegrow.getFrameworksListFromStorage();
            if(flist.indexOf(folder_url) < 0) {
                flist.push(folder_url);
                crsaStorage.setValue('frameworks', flist);
            }

            if(done) done(pf);
            return pf;
        }

        pinegrow.selectAndLoadLibrary = function(done) {
            crsaChooseFile(function(url, file) {
                pinegrow.loadProjectAsLibrary(file, function(f) {

                    pinegrow.activateFrameworkInCurrentContext(f);
                    if(done) done(f);
                })
            }, false, false, null, true);
        }

        var findEditableElementInComponent = function(pgel, field_id, index) {
            index = index || 0;
            var r = findAllEditableElementsInComponent(pgel, field_id);
            return index < r.length ? r[index] : null;
        }

        var findAllEditableElementsInComponent = function(pgel, field_id) {
            var r = [];
            walkSelfAndChildrenButDontGoInComponents(pgel, function(node) {
                if(node.isElement) {
                    var editable = node.getAttr('data-pgc-edit');
                    if(editable) {
                        var info = pgcVarParseValue(editable);
                        if(info && info.name == field_id) {
                            r.push(node);
                        }
                    } else if(node.getAttr('data-pgc-field') == field_id) {
                        r.push(node);
                    }
                }
                return true;
            })
            return r;
        }

        var test_contributor_mode = false;

        var setTestContributorMode = function(val) {
            test_contributor_mode = val;
            pinegrow.reselectElement();
            pinegrow.repaintTree();
        }

        var isContributorModeOrTest = function() {
            if(test_contributor_mode) return true;
            return pinegrow.isContributorMode();
        }

        f.on_show_properties = function(page, sections, $el, pgel, defs, $dest) {
            var locked_desc = null;
            var locked_reason = null;
            if(locked_reason = isElementInLockedArea(pgel)) {
                if(f.on_can_make_change(page, pgel, 'edit') === null) {
                    //is in editable field with editable content
                    locked_desc = 'The element is fully editable';
                } else {
                    sections.splice(0, sections.length);
                    locked_desc = locked_reason == 'cc_mode' ? 'The element is not editable.' : 'The element is not editable because it is in the locked area.';
                }
            }
            var new_sections = [];

            if(defs) {
                for(var i = 0; i < defs.length; i++) {
                    if(defs[i].component_fields) {

                        var c = defs[i];
                        var s = {
                            framework : c.framework,
                            name : c.name,
                            fields : {},
                            component_fields: c.component_fields
                        }
                        new_sections.push(s);

                        if(locked_desc) {
                            locked_desc = 'Only certain properties of this element are editable.';
                        }
                    }
                }
            }
            if(!new_sections.length) {
                //look for plain editable area without component
                var field_info = getEditableAreaInfoOfElement(pgel, isContributorModeOrTest() || true /* include definition */, page /* include master page fields */);

                //how about master page fields?

                if(field_info) {
                    var cf = {};
                    cf[field_info.name] = field_info;

                    var s = {
                        framework : f,
                        name : 'Editable properties',
                        fields : {},
                        component_fields: cf
                    }
                    new_sections.push(s);

                    if(locked_reason) {
                        locked_desc = locked_reason == 'cc_mode' ? 'Only certain properties of this element are editable.' : 'Only certain properties of this element are editable because it is in the locked area.';
                    }
                }
            }
            if(new_sections.length) {
                for(var i = 0; i < new_sections.length; i++) {
                    if(new_sections[i].component_fields) {

                        var has_props = false;

                        var s = new_sections[i];
                        $.each(s.component_fields, function(key, field) {

                            var all = findAllEditableElementsInComponent(pgel, field.name);

                            $.each(all, function(index, el) {
                                var index_str = all.length == 1 ? '' : (' ' + (index+1));
                                var index_key = '.' + (index+1);

                                if(field.content) {
                                    if(field.types && field.types.length) {
                                        var fdef = {};
                                        fdef.name = field.name + index_str + ' content';
                                        fdef.type = 'custom';
                                        fdef.show = function($c, obj, fn, fdef, values, $scrollParent) {
                                            var $d = $('<div class="crsa-field"><label class="full-width">Add <nocap>to</nocap> ' + field.name + ':</label></div>');
                                            field.types.forEach(function(t) {
                                                var tname = getComponentTypeName(t, page);
                                                var $b = $('<button class="btn btn-primary btn-sm"><i class="fa fa-plus"></i> ' + tname + '</button>').on('click', function(e) {
                                                    e.preventDefault();
                                                    var cdef = page.getTypeDefinition(t);
                                                    var pgel = getElementPgNode(obj.data);
                                                    var code = getCodeFromDefinition(cdef);
                                                    var api = new PgApi();
                                                    var inserted_ids = api.insert(code, pgel.getId(), 'append', {scroll: true, highlight: true});
                                                    if(inserted_ids.length) {
                                                        pinegrow.showQuickMessage(tname + ' was appended to ' + field.name);
                                                    }
                                                })
                                                $d.append($b);
                                            })
                                            $d.appendTo($c);
                                        }
                                    } else {
                                        var fdef = {};
                                        fdef.name = field.name + index_str + ' content';
                                        fdef.type = 'text';
                                        fdef.action = 'custom';
                                        fdef.get_value = function (obj) {
                                            var $el = obj.data;
                                            var pgel = getElementPgNode($el);
                                            var fel = findEditableElementInComponent(pgel, field.name, index);
                                            return fel ? fel.html() : null;
                                        }
                                        fdef.set_value = function (obj, value, values, oldValue, eventType) {
                                            pinegrow.willChangeDom();
                                            var $el = obj.data;
                                            var pgel = getElementPgNode($el);
                                            var fel = findEditableElementInComponent(pgel, field.name, index);
                                            if (fel) {
                                                fel.html(value || '');
                                                var $fel = fel.get$DOMElement();
                                                if ($fel) {
                                                    $fel.html(fel.html(null, true));
                                                    if (eventType == 'change') {
                                                        //pinegrow.setNeedsUpdate($fel);
                                                        pinegrow.updateTree($fel);
                                                    }
                                                }
                                            }
                                            return value;
                                        }
                                    }
                                    fdef.on_can_make_change = function() { return true; };

                                    s.fields['pg.components.field.' + field.name + index_key + '.content'] = fdef;
                                    has_props = true;
                                }
                                for(var ai = 0; ai < field.attrs.length; ai++) {
                                    var attr = field.attrs[ai];

                                    if(attr == 'wp-include-template-part-set') continue;

                                    (function(attr) {

                                        var fdef = {};
                                        fdef.name = field.name + index_str + ' ' + attr;
                                        fdef.type = 'text';
                                        fdef.action = 'custom';
                                        fdef.options = function(fdef, obj) {
                                            var pgel = getElementPgNode(obj.data);
                                            var fel = findEditableElementInComponent(pgel, field.name, index);
                                            return pinegrow.insight.getValuesForAttribute(attr, ['img','script','link','iframe'].indexOf(fel.tagName) >= 0 ? fel.tagName : null);
                                        },
                                        fdef.get_value = function(obj) {
                                            var $el = obj.data;
                                            var pgel = getElementPgNode($el);
                                            var fel = findEditableElementInComponent(pgel, field.name, index);
                                            return fel ? fel.getAttr(attr) : null;
                                        }
                                        fdef.set_value = function(obj, value, values, oldValue, eventType) {
                                            var $el = obj.data;
                                            var pgel = getElementPgNode($el);
                                            var fel = findEditableElementInComponent(pgel, field.name, index);
                                            if(fel) {
                                                fel.setAttr(attr, value);
                                                var $fel = fel.get$DOMElement();
                                                if($fel) {
                                                    var dom_val = value;
                                                    if((attr == 'src' || attr == 'href') && dom_val) {
                                                        dom_val = pinegrow.getProxyUrl(dom_val);
                                                    }
                                                    $fel.attr(attr, dom_val);
                                                }
                                            }
                                            return value;
                                        }
                                        fdef.on_can_make_change = function() { return true; };

                                        if(attr == 'src' || attr == 'href') {
                                            fdef.file_picker = true;
                                        }

                                        s.fields['pg.components.field.' + field.name + index_key + '.' + attr] = fdef;
                                    })(attr);
                                    has_props = true;
                                }
                                var classes = [];
                                for(var ci = 0; ci < field.classes.length; ci++) {
                                    var clsre = getClassRegEx(field.classes[ci]);
                                    if(!clsre) {
                                        classes.push({key: field.classes[ci], name: field.classes[ci]});
                                    }
                                }

                                if(classes.length) {
                                    var fdef = {};
                                    fdef.name = field.name + index_str + ' classes';
                                    fdef.type = 'select';
                                    fdef.options = classes;
                                    fdef.show_empty = true;
                                    fdef.action = 'custom';
                                    fdef.multiple = classes.length > 1;
                                    fdef.get_value = function(obj) {
                                        //debugger;
                                        var $el = obj.data;
                                        var pgel = getElementPgNode($el);
                                        var fel = findEditableElementInComponent(pgel, field.name, index);
                                        var r = [];
                                        if(fel) {
                                            for(var ii = 0; ii < classes.length; ii++) {
                                                if(fel.hasClass(classes[ii].key)) {
                                                    r.push(classes[ii].key);
                                                }
                                            }
                                            if(r.length) return r.join(',');
                                        }
                                        return null;
                                    }
                                    fdef.set_value = function(obj, value, values, oldValue, eventType) {
                                        var $el = obj.data;
                                        var pgel = getElementPgNode($el);
                                        var fel = findEditableElementInComponent(pgel, field.name, index);
                                        if(fel) {
                                            var $fel = fel.get$DOMElement();

                                            for(var ii = 0; ii < classes.length; ii++) {
                                                if(fel.hasClass(classes[ii].key)) {
                                                    fel.removeClass(classes[ii].key);
                                                    if($fel) $fel.removeClass(classes[ii].key);
                                                }
                                            }
                                            if(value) {
                                                var list = value.split(',');
                                                list.forEach(function(cls) {
                                                    fel.addClass(cls);
                                                    if($fel) $fel.addClass(cls);
                                                })
                                            }
                                        }
                                        return value;
                                    }
                                    fdef.on_can_make_change = function() { return true; };

                                    s.fields['pg.components.field.' + field.name + index_key + '.classes'] = fdef;
                                    has_props = true;
                                }

                                //bckimage
                                if(field.bckimage) {
                                    var fdef = {};
                                    fdef.name = field.name + index_str + ' Bck. Image';
                                    fdef.type = 'text';
                                    fdef.action = 'custom';

                                    fdef.get_value = function(obj) {
                                        var $el = obj.data;
                                        var pgel = getElementPgNode($el);
                                        var fel = findEditableElementInComponent(pgel, field.name, index);
                                        return fel ? fel.getInlineStylePropertyValue('background-image', true) : null;
                                    }
                                    fdef.set_value = function(obj, value, values, oldValue, eventType) {
                                        var $el = obj.data;
                                        var pgel = getElementPgNode($el);
                                        var fel = findEditableElementInComponent(pgel, field.name, index);
                                        if(fel) {
                                            fel.setInlineStylePropertyValue('background-image', value, true);
                                            var $fel = fel.get$DOMElement();
                                            if($fel) {
                                                var dom_val = pinegrow.getProxyUrl(value);
                                                dom_val = crsaSetInlineStylePropertyValue($fel.attr('style'), 'background-image', dom_val, true);
                                                if(dom_val) {
                                                    $fel.attr('style', dom_val);
                                                } else {
                                                    $fel.removeAttr('style');
                                                }
                                            }
                                        }
                                        return value;
                                    }
                                    fdef.on_can_make_change = function() { return true; };
                                    fdef.file_picker = true;

                                    s.fields['pg.components.field.' + field.name + index_key + '.bckimage'] = fdef;
                                    has_props = true;
                                }
                            })
                        })
                        if(has_props) sections.unshift(s);
                    }
                }
            }
            if(locked_desc /*&& isContributorModeOrTest()*/) {
                $dest.append('<div class="alert alert-info">' + (test_contributor_mode ? 'Content contributor mode is ON.<br><br>' : '') + locked_desc + '</div>');
            }
        }

        f.on_set_inline_style = function(page, o) {
            o.css += '\
            html.pgc-mark-areas [data-pgc-define] {\
            box-shadow: 0 0 0px 1px rgba(0, 236, 255, 1);\
            }\
            html.pgc-mark-areas [data-pgc] {\
            box-shadow: 0 0 0px 1px rgba(255, 214, 0, 1);\
            }\
            html.pgc-mark-areas [data-pgc-field], html.pgc-mark-areas [data-pgc-edit] {\
            box-shadow: 0 0 0px 1px rgba(255, 214, 0, 0.3);\
            }\
            html.pgc-mark-areas[data-pgc-set-master] [data-pgc-edit] {\
            box-shadow: 0 0 0px 1px rgba(255, 214, 0, 1);\
            }\
            ';
        }

        var $pgcmenu = $('<li class="dropdown pgc-menu"><a href="#" class="dropdown-toggle" data-toggle="dropdown">Components<b class="caret"></b></a>\
                        <ul class="dropdown-menu with-checkboxes">\
                            <li><a href="#" class="pgc-menu-quick-update">Quick update (only open pages)</a></li>\
                            <li><a href="#" class="pgc-menu-update-project">Update the whole project</a></li>\
                            <li><a href="#" class="pgc-menu-reload">Reload components from project</a></li>\
                            <li class="divider"></li>\
                            <li class="dropdown-header">Libraries</li>\
                            <li><a href="#" class="pgc-menu-edit-resources">Edit resources...</a></li>\
                            <li><a href="#" class="pgc-menu-refresh-libs">Refresh loaded libraries</a></li>\
                            <li><a href="#" class="pgc-menu-resources">Add/update resources from libraries...</a></li>\
                            <li class="divider"></li>\
                            <li class="dropdown-header">Tools</li>\
                            <li><a href="#" class="pgc-menu-auto-reload"><i class="fa fa-check"></i>Auto reload on project refresh</a></li>\
                            <li><a href="#" class="pgc-menu-mark"><i class="fa fa-check"></i>Mark components</a></li>\
                            <li><a href="#" class="pgc-menu-test-cm"><i class="fa fa-check"></i>Test Content contributor mode</a></li>\
                        <!--<li><a href="#" class="pgc-menu-ignore-optional"><i class="fa fa-check"></i>Ignore optional areas on update</a></li>-->\
                            <li><a href="#" class="pgc-menu-clear-saved-edits">Clear unused edits...</a></li>\
                            <li><a href="#" class="pgc-menu-help">Documentation</a></li>\
            </ul></li>');

        crsaAddKbd($pgcmenu.find('.pgc-menu-quick-update'), 'CMD U');
        crsaAddKbd($pgcmenu.find('.pgc-menu-update-project'), 'SHIFT CMD U');

        $pgcmenu.find('.pgc-menu-quick-update')
            .on('click', function(e) {
                e.preventDefault();
                quickRefreshAndUpdate();
            });

        $pgcmenu.find('.pgc-menu-update-project')
            .on('click', function(e) {
                e.preventDefault();
                f.reloadProjectAndUpdateComponents();
            });

        $pgcmenu.find('.pgc-menu-reload')
            .on('click', function(e) {
                e.preventDefault();
                requireProject(function(project) {
                    //setHasUpdates(false);
                    refreshComponents(project, function() {
                        //updateComponents(project);
                    });
                })
            });

        $pgcmenu.find('.pgc-menu-resources')
            .on('click', function(e) {
                e.preventDefault();
                pinegrow.showUpdateResourcesDialog(pinegrow.getSelectedPage(), pinegrow.getCurrentProject());
            });

        $pgcmenu.find('.pgc-menu-edit-resources')
            .on('click', function(e) {
                e.preventDefault();
                showResourceEditorForProject(pinegrow.getCurrentProject());
            });



        $pgcmenu.find('.pgc-menu-refresh-libs')
            .on('click', function(e) {
                e.preventDefault();
                var list = [];

                var current_project = pinegrow.getCurrentProject();

                $.each(pinegrow.getFrameworks(), function(key, f) {
                    if(f.project && f.components_loaded) {
                        if(f.project != current_project) {
                            list.push(f);
                        }
                    }
                });

                var doOne = function() {
                    if(list.length) {
                        var f = list.shift();
                        f.project.reload(function(project) {
                            refreshComponents(project, function() {
                                doOne();
                            }, true /* skip frameworks changed */);
                        })
                    } else {
                        pinegrow.frameworksChanged();
                    }
                }
                doOne();
            });

        $pgcmenu.find('.pgc-menu-help')
            .on('click', function(e) {
                e.preventDefault();
                pinegrow.openExternalUrl(pinegrow.pro_info_url);
            });

        $pgcmenu.find('.pgc-menu-apply-master')
            .on('click', function(e) {
                e.preventDefault();
                var project = pinegrow.getCurrentProject();
                var page = pinegrow.getSelectedPage();
                if(project && page) {
                    applyMasterPage(page, project);
                }
            });

        $pgcmenu.find('.pgc-menu-clear-saved-edits')
            .on('click', function(e) {
                e.preventDefault();
                requireProject(function(project) {

                    var $d = pinegrow.showAlert('Would you like to clear saved unused edits in <b>the selected page</b> or from <b>the whole project</b>?', 'Where to clear?', 'Cancel', 'Selected page only', null, function() {
                        var page = pinegrow.getSelectedPage();
                        if(page) {
                            clearSavedDataFromPage(page);
                            pinegrow.showQuickMessage('Saved data cleared!');
                        }
                    })
                    var $b = $('<button class="btn btn-primary btn-sm">Whole project</button>');
                    $d.find('.modal-footer').append($b);
                    $b.on('click', function(e) {
                        e.preventDefault();
                        $d.modal('hide');

                        project.forEachEditableFile( function( page, pageDone, status ) {
                            //on page
                            if(clearSavedDataFromPage(page)) {
                                status.changed = true;
                            }
                            pageDone(page, status);

                        }, function() {
                            pinegrow.showQuickMessage('Saved data cleared!');
                        }, 'Clearing saved unused edits...')

                    });
                });
            });

        var $mark_areas = $pgcmenu.find('.pgc-menu-mark');
        var $mark_areas_checkbox = $mark_areas.find('i');

        var set_mark_areas = function(value) {
            $.each(pinegrow.getAllPages(), function(i, cp) {
                var $html = cp.get$Html();
                if($html) {
                    if(value) {
                        $html.addClass('pgc-mark-areas');
                    } else {
                        $html.removeClass('pgc-mark-areas');
                    }
                }
            })
            if(value) {
                $mark_areas_checkbox.show();
            } else {
                $mark_areas_checkbox.hide();
            }
        }

        set_mark_areas(pinegrow.getSetting('pgc-mark-areas', '1') == '1');

        $mark_areas
            .on('click', function(e) {
                e.preventDefault();
                var value = pinegrow.getSetting('pgc-mark-areas', '1') == '1';
                value = !value;
                set_mark_areas(value);
                pinegrow.setSetting('pgc-mark-areas', value ? '1' : '0');
            });



        //auto reload
        var $auto_reload = $pgcmenu.find('.pgc-menu-auto-reload');
        var $auto_reload_checkbox = $auto_reload.find('i');

        var set_auto_reload = function(value) {
            if(value) {
                $auto_reload_checkbox.show();
            } else {
                $auto_reload_checkbox.hide();
            }
        }

        var showReloadComponentsManuallyNotice = function() {
            pinegrow.showQuickMessage('Use <b>Components -&gt; Reload components from project</b> to reload components.', 4000);
        }

        set_auto_reload(pinegrow.getSetting('pgc-auto-reload', '1') == '1');

        $auto_reload
            .on('click', function(e) {
                e.preventDefault();
                var value = pinegrow.getSetting('pgc-auto-reload', '1') == '1';
                value = !value;
                set_auto_reload(value);
                pinegrow.setSetting('pgc-auto-reload', value ? '1' : '0');

                if(!value) {
                    showReloadComponentsManuallyNotice();
                }
            });
        //end reload



        //test contributor mode
        var $test_cm = $pgcmenu.find('.pgc-menu-test-cm');
        var $test_cm_checkbox = $test_cm.find('i');

        var set_test_cm = function(value, show_msg) {
            if(value) {
                $test_cm_checkbox.show();
                if(show_msg) {
                    pinegrow.showNotice('<p>In <b>Content contributor mode</b> only editable areas can be edited, the rest of the page is locked.</p><p>Learn more about <a href="http://docs.pinegrow.com/editing/use-pinegrow-static-website-cms" class="external">using Pinegrow as CMS</a>.</p>', 'About content contributor mode', 'pgc-content-contributor', function(shown) {
                        if(!shown) {
                            pinegrow.showQuickMessage('Content contributor test mode is ON. Only editable areas can be edited.');
                        }
                    })
                }
            } else {
                if(show_msg) {
                    pinegrow.showQuickMessage('Content contributor test mode is OFF.');
                }
                $test_cm_checkbox.hide();
            }
        }

        set_test_cm(test_contributor_mode);

        $test_cm
            .on('click', function(e) {
                e.preventDefault();
                var value = test_contributor_mode;
                value = !value;
                set_test_cm(value, true);
                setTestContributorMode(value);
            });
        //end reload


/*
        //ignore optional on update
        var $ignore_optional = $pgcmenu.find('.pgc-menu-ignore-optional');
        var $ignore_optional_checkbox = $ignore_optional.find('i');

        var set_ignore_optional = function(value) {
            if(value) {
                $ignore_optional_checkbox.show();
            } else {
                $ignore_optional_checkbox.hide();
            }
        }

        set_ignore_optional(pinegrow.getSetting('pgc-ignore-optional', '0') == '1');

        $ignore_optional
            .on('click', function(e) {
                e.preventDefault();
                var value = pinegrow.getSetting('pgc-ignore-optional', '0') == '1';
                value = !value;
                set_ignore_optional(value);
                pinegrow.setSetting('pgc-ignore-optional', value ? '1' : '0');

                if(value) {
                    pinegrow.showQuickMessage('Optional areas will be ignored on update.', 4000);
                }
            });
        //end ignore optional on update
        */

        if((pinegrow.isPRO() || pinegrow.isProTrialActive()) && !pinegrow.isContributorMode()) {
            pinegrow.addPluginControlToTopbar(f, $pgcmenu, true);
        }

        var $updateButton = $('<span class="update-components">Update ' + crsaGetKbdDisplay('CMD U') + '</span>')
            .on('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                quickRefreshAndUpdate();
            })

        //pinegrow.addPluginControlToTopbar(f, $updateButton);

        $updateButton.insertBefore($pgcmenu.find('>a>b'));

        var setHasUpdates = function(has) {
            if(has) {
                $updateButton.removeClass('update-components-hide');
            } else {
                $updateButton.addClass('update-components-hide');
            }
        }

        f.setHasUpdates = setHasUpdates;

        setHasUpdates(false);


        f.useMasterPage = function (page, project, master_page_file) {
            var html = page.sourceNode.findOne('html');
            html.hasAttr('data-pgc-set-master');
            html.removeAttr('data-pgc-set-master');
            html.setAttr('data-pgc-master', master_page_file.name);

            applyMasterPage(page, project);
        }

        f.updateEditableAreas = function (page) {
            f.changeComponentDefinitionsToComponentInstances(page.sourceNode);
        }

        f.on_page_loaded = function(crsaPage) {
            set_mark_areas(pinegrow.getSetting('pgc-mark-areas', '1') == '1');
        }

        f.on_page_refreshed = function(crsaPage) {
            set_mark_areas(pinegrow.getSetting('pgc-mark-areas', '1') == '1');
        }

        f.on_page_saved = function(crsaPage, saved_csss, first_save) {
            var partials = crsaPage.sourceNode.find('[data-pgc-save-partial]');
            for(var i = 0; i < partials.length; i++) {
                var filename = partials[i].getAttr('data-pgc-save-partial');
                try {
                    var c = partials[i].clone(true /* no ids */);
                    c.removeAttrIfStartsWith('data-pgc-save-partial', true);
                    var html;
                    if(partials[i].hasAttr('data-pgc-save-partial-content')) {
                        html = c.toStringContent(true, pinegrow.getFormatHtmlOptions());
                    } else {
                        html = c.toStringOriginal(true, pinegrow.getFormatHtmlOptions());
                    }
                    crsaWriteFileWithBackup(null, filename, html, "utf8");
                    pinegrow.showQuickMessage('Partial <b>' + crsaGetSummaryStr(filename, 50) + '</b> saved!');
                } catch(err) {
                    pinegrow.showAlert('<p>Partial file ' + filename + ' could not be saved: ' + err + '</p>', 'Error saving partial file');
                }
            }
        }

        //Only editable areas
        var getComponentInstance = function(pgel, page, extras) {
            var cel = pgel.closest('[data-pgc]');
            if(cel) {
                if(extras) extras.element = cel;
                return page.getTypeDefinition(cel.getAttr('data-pgc'));
            }
        }

        var getComponentInstanceOrDefinition = function(pgel, page, extras) {
            var cel = pgel.closest('[data-pgc],[data-pgc-define]');
            if(cel) {
                if(extras) extras.element = cel;
                return page.getTypeDefinition(cel.getAttr('data-pgc') || cel.getAttr('data-pgc-define'));
            }
        }



        var describeEditableArea = function(i, page) {
            if(!i) return '';
            var s = '<p>The following parts of <b>' + i.name + '</b> are editable:</p><ul>';
            if(i.content) {
                if(i.types && i.types.length) {
                    var names = i.types.map(function(t) {
                        var c = page.getTypeDefinition(t);
                        return '<b>' + (c ? c.name : t) + '</b>';
                    })
                    s += '<li>Component instances of ' + names.join(', ') + ' can be added and deleted from the content</li>';
                } else {
                    s += '<li>The content</li>';
                }
            }
            if(i.attrs.length) {
                s += '<li>Attributes: <b>' + i.attrs.join('</b>, <b>') + '</b></li>';
            }
            if(i.classes.length) {
                s += '<li>Classes: <b>' + i.classes.join('</b>, <b>') + '</b></li>';
            }
            if(i.bckimage) {
                s += '<li>Background image</li>';
            }
            s += '</ul>';
            return s;
        }

        var isElementInLockedArea = function(pgel) {
            if(isContributorModeOrTest()) return "cc_mode";
            return pgel.closest('[data-pgc-lock]') ? "locked" : false;
            return false;
        }
        
        f.on_custom_tree_filter = function(page, obj) {

            if(!isContributorModeOrTest()) return;

            try {
                page.get$Html().find('[data-pgc],[data-pgc-define],[data-pgc-edit],[data-pgc-field]').each(function(i, e) {
                    var treeid = e.getAttribute('data-pg-tree-id');
                    if(treeid) {
                        obj.selected_ids[treeid] = true;
                        if(!obj.changed) obj.changed = true;

                        //check if editable content area

                        var field_el = getDomElementPgNode(e);
                        var info = getEditableAreaInfoOfElement(field_el, true);
                        if(info && info.content) {
                            var sel = '*';
                            if(info.types && info.types.length) {
                                sel = info.types.map(function(t) {
                                    return '[data-pgc="' + t + '"],[data-pgc-define="' + t + '"]';
                                }).join(',');
                            }
                            $(e).find(sel).each(function(idx, el) {
                                var treeid = el.getAttribute('data-pg-tree-id');
                                if(treeid) {
                                    obj.selected_ids[treeid] = true;
                                }
                            })
                        }
                    }
                })
            } catch(err) {
                debugger;
            }
            /////
        }

        f.on_can_make_change = function(page, pgel, action, data) {
            //another framework already prevented it
            if(page.getCurrentFrameworkHandlerReturnValue('on_can_make_change')) return page.getCurrentFrameworkHandlerReturnValue('on_can_make_change');

            var lock_non_editable = isElementInLockedArea(pgel);

            var can_edit = false;
            var error_msg = '';

            var project = pinegrow.getCurrentProject();
            var extras = {};
            var field_info = null;
            var c = lock_non_editable ? getComponentInstanceOrDefinition(pgel, page, extras) : getComponentInstance(pgel, page, extras); //mtch

            //prevent comp def deletes in cc mode
            if(isContributorModeOrTest() && isComponentDefinition(pgel) && action == 'delete_element') {
                return new PgEditException('<p>The element can\'t be deleted because it is the definition of the <b>' + c.name + '</b> component.</p><p>Deleting the component definition would break all instances of this component.</p>', 'This element can\'t be deleted');
            }

            var parent_actions = ['delete_element', 'duplicate_element'];

            if(c && extras.element == pgel && parent_actions.indexOf(action) >= 0) {
                //this concerns the parent
                c = lock_non_editable ? getComponentInstanceOrDefinition(pgel.parent, page, extras) : getComponentInstance(pgel.parent, page, extras); //mtch
            }

            if (project && action == "add_action" && data.attribute == "data-pgc-set-master")
                updatePageScreenshot(page, project);

            var canEditField = function(field_info, field_el) {
                var is_field = pgel == field_el;

                //classes
                if(is_field && (action == 'add_class' || action == 'remove_class')) {
                    //check if class attr is editable, first
                    if(field_info.attrs.indexOf('class') >= 0) {
                        can_edit = true;
                    } else {
                        for(var i = 0; i < field_info.classes.length; i++) {
                            var clsre = getClassRegEx(field_info.classes[i]);
                            if(clsre) {
                                if(data.match(clsre)) {
                                    can_edit = true;
                                    break;
                                }
                            } else {
                                if(data == field_info.classes[i]) {
                                    can_edit = true;
                                    break;
                                }
                            }
                        }
                    }
                }

                //attributes
                if(is_field && action == 'attr') {
                    if(field_info.attrs.indexOf(data) >= 0) {
                        can_edit = true;
                    } else {
                        error_msg = field_info.attrs.length == 1 ? 'Only the attribute <b>' + field_info.attrs[0] + '</b> is editable.' : 'Only attributes <b>' + field_info.attrs.join(', ') + '</b> are editable.';
                    }
                }

                var isAllowedType = function(pgel) {
                    var types = page.getAllTypes(null, pgel, true /* skip actions */);
                    for(var i = 0; i < types.length; i++) {
                        if(field_info.types.indexOf(types[i].type) >= 0) {
                            return true;
                        }
                    }
                    return false;
                }

                //content
                if(field_info.content) {
                    if(is_field) {
                        if(field_info.types && field_info.types.length) {
                            //if only specific types are allowed
                            if(action == 'insert_element' && data && data.inserted && isAllowedType(data.inserted)) {
                                can_edit = true;
                            }
                        } else {
                            var allowed = ['insert_element', 'edit_content', 'edit_code'];
                            if (allowed.indexOf(action) < 0) {
                                error_msg = 'Content of the element can\'t be changed.';
                            } else {
                                can_edit = true;
                            }
                        }
                    } else {
                        //if types specified, only that types can be deleted from top content
                        if(field_info.types && pgel.parent == field_el) {
                            var allowed = ['delete_element', 'duplicate_element'];
                            if(allowed.indexOf(action) >= 0 && isAllowedType(pgel)) {
                                can_edit = true;
                            }
                        } else {
                            can_edit = true; //everything should be ok inside the field
                        }
                    }
                }

                //bckimage
                if(field_info.bckimage && is_field && action == 'element_bckimage') {
                    can_edit = true;
                }

                if(field_info.repeat && is_field) {
                    if(action == 'duplicate_element' || action == 'delete_element' || action == 'move_element') {
                        can_edit = true;
                    }
                }

                if(field_info.optional && is_field) {
                    if(action == 'delete_element') {
                        can_edit = true;
                    }
                }

                //is this reordening of repeatable element?
                if(action == 'insert_element' && data && data.moved) {
                    var movedel = data.moved;
                    var moved_info = getEditableAreaInfoOfElement(movedel);
                    if(moved_info && moved_info.repeat) {
                        //are next or prev same field type?
                        var isType = function(type, el) {
                            if(el) {
                                var i = getEditableAreaInfoOfElement(el);
                                return i && i.name == type;
                            }
                            return false;
                        }

                        if(isType(moved_info.name, data.prev) || isType(moved_info.name, data.next)) {
                            can_edit = true;
                        }
                    }
                }
            }

            if(!c) {
                //maybe a master page?
                if(project) {
                    c = getMasterPage(page, project);
                }
            }
            if(c) {

                var comp_el = extras.element || null;
                var field_el = lock_non_editable ? pgel.closest('[data-pgc-field],[data-pgc-edit]', comp_el) : pgel.closest('[data-pgc-field]', comp_el);
                var is_comp = pgel == comp_el;

                if(!c.auto_update) {
                    can_edit = true;
                } else if(comp_el && comp_el.hasAttr('data-pgc-no-update')) {
                    can_edit = true;
                } else if(field_el) {
                    var field_id = field_el.getAttr('data-pgc-field');
                    if(!field_id && lock_non_editable) {
                        var info = pgcVarParseValue(field_el.getAttr('data-pgc-edit'));
                        if(info) field_id = info.name;
                    }
                    field_info = (field_id && c.component_fields) ? (c.component_fields[field_id] || null) : null;
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
                    attr
   */
                    if(field_info) {
                        canEditField(field_info, field_el);
                    } else {
                        can_edit = true;
                        //pinegrow.showQuickMessage('Warning: Field <b>' + field_id + '</b> is not defined in component <b>' + c.name + '</b>', 5000);
                    }
                }
                if(!can_edit && is_comp) {
                    can_edit = ['delete_element', 'duplicate_element', 'move_element'].indexOf(action) >= 0;
                }


                if(!can_edit && action == 'edit_code') {
                    can_edit = true;
                    pinegrow.showQuickMessage('Be carefull - you\'re editing a component instance!', 3000);
                }
                if(!can_edit && pgel.tagName == 'html') {
                    if(action == 'add_action' || action == 'remove_action') {
                        if(data == pgcmaster || data == pgcusemaster) {
                            can_edit = true;
                        }
                    } else if(action == 'attr' && data.startsWith('data-pgc-master')) {
                        can_edit = true;
                    }
                }
                if(!can_edit) {
                    if(is_comp && (action == 'add_action' || action == 'remove_action')) {
                        if(data == pgc || data == pgcinstance) {
                            can_edit = true;
                        }
                    }
                }
                if(!can_edit && is_comp && action == 'attr' && (data == 'data-pgc-no-update' || data == 'data-pgc')) {
                    can_edit = true;
                }


                if(!can_edit) {
                    if(!isContributorModeOrTest()) {
                        return new PgEditException('<p>The element can\'t be changed because it is defined in component <b>' + c.name + '</b>.</p>' + describeEditableArea(field_info, page) + '<p>Choose "Go to component definition" to edit the component definition.</p>', 'This element is locked', function ($dialog) {
                            var $b = $('<button class="btn btn-default btn-sm" type="button">Go to component definition</button>').on('click', function (e) {
                                e.preventDefault();
                                goToDefinition(c);
                                $dialog.modal('hide');
                            }).insertBefore($dialog.find('.btn.ok'));
                        });
                    } else {
                        return new PgEditException('<p>This element is not editable.</p>' + describeEditableArea(info, page), 'This element is locked');
                    }
                }
            } else {
                //not component, not master page
                if(lock_non_editable) {
                    var field_el = pgel.closest('[data-pgc-edit]');
                    if(field_el) {
                        var info = getEditableAreaInfoOfElement(field_el, true);
                        if(info) {

                            canEditField(info, field_el);

                            if(!can_edit) {
                                return new PgEditException('<p>This element is not editable.</p>' + describeEditableArea(info, page), 'This element is locked');
                            }
                            return null;
                        }
                    }

                }
            }
            //
            if(lock_non_editable && !field_info && !can_edit) {
                if(action == 'remove_action' && data == pgclock) {
                    //ok
                } else {
                    return new PgEditException((test_contributor_mode ? '<p><b>Test Content contributor mode is ON.</b></p>' : '') + '<p>The element is not editable.</p><p>Only elements marked with <i class="fa fa-pencil" style="color:#6cadd6;"></i> in the tree are editable.</p>', 'This element is locked');
                }
            }

            //

            return null;
        }

        var getEditableAreaInfoOfElement = function(field_el, include_definition, child_page) {
            var info = null;
            var field_id = field_el.getAttr('data-pgc-field');
            if(field_id) {
                //look for component
                var extras = {};
                var c = getComponentInstance(field_el, field_el.getPage(), extras);
                if(c) {
                    var info = getFieldInfo(field_id, c);
                    if(info) return info;
                }
            }
            if(include_definition) {
                info = pgcVarParseValue(field_el.getAttr('data-pgc-edit'));
                if(!info.name) info = null;
                if(info) {
                    var cls = field_el.getAttr('data-pgc-edit-classes');
                    info.classes = crsaSplitAndTrimList(cls);
                    info.bckimage = field_el.hasAttr('data-pgc-edit-bckimage');
                    var types = field_el.getAttr('data-pgc-edit-types');
                    if(types) {
                        info.types = crsaSplitAndTrimList(types);
                    }
                }
            }
            if(field_id && child_page) {
                var project = pinegrow.getCurrentProject();
                if(project && project.isPageInProject(child_page)) {
                    var master = getMasterPage(child_page, project);
                    if(master) {
                        return getFieldInfo(field_id, master);
                    }
                }
            }
            return info;
        }

        var requireProject = function(func) {
            var p = pinegrow.getCurrentProject();
            if(p) {
                func(p);
            } else {
                pinegrow.showAlert('<p>Components work with <b>Projects</b>. To use components open the folder where your pages are located with <b>File -&gt; Open project</b>.</p>', 'Components work with Projects');
            }
        }

        /*
        f.on_is_element_locked = function(page, pgel) {
            return true;
        }
*/
        //test
        //pinegrow.loadProjectAsLibrary('/Users/Matjaz/Dropbox/Development/DVWeb/DV/Pinegrow/lab/ComponentsDemo');

    });


});
