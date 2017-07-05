$(function() {

    //Wait for Pinegrow to wake-up
    $('body').one('pinegrow-ready', function(e, pinegrow) {

        //Create new Pinegrow framework object
        var f = new PgFramework('angular', 'AngularJS');

        //This will prevent activating multiple versions of 960 grid framework, provided that other versions set the same type
        f.type = "angular";
        f.allow_single_type = true;

        f.description = '<a href="https://angularjs.org/">AngularJS</a> starting pages and components.';
        f.author = 'Pinegrow';
        f.author_link = 'http://pinegrow.com';

        f.not_main_types = true; //comps will not be used in getType()
        f.has_actions = true;

        //Don't show these files in CSS tab
        f.ignore_css_files = [];

        //Auto detect 960 grid. It can also be manually added / removed from a page with Framework Manager
        f.detect = function(pgPage) {
            return pgPage.hasScript(/(^|\/)angular.*\.js/i);
        }

        //get url if script is included directly into edit.html
        f.setScriptFileByScriptTagId('plugin-pg-angular');

        var directives_actions = []; // Will be shown in ACT tab
        var events_actions = [];
        var input_actions = [];
        var other_actions = [];

        //Tell Pinegrow about the framework
        pinegrow.addFramework(f);

        //Add properties common to all components of this framework
        //Properties are arranged in sections
        var application_action = new PgComponentType('ng-app-action', 'ng-App');
        application_action.selector = "[ng-app]";
        application_action.attribute = 'ng-app';
        application_action.action = true;
        application_action.not_main_type = true;
        application_action.helplink = '1.2.29/docs/api/ng/directive/ngApp';
        application_action.sections = {
            'ng.app.parameters' : {
                'name' : 'App name',
                'fields' : {
                    'ng.app.text': {
                        'type' : 'text',
                        'name' : 'App',
                        'action' : 'element_attribute',
                        'attribute' : 'ng-app',
                        'attribute_keep_if_empty' : true
                    }
                }
            }
        };
        directives_actions.push(application_action);

        var init_action = new PgComponentType('ng-init-action', 'ng-Init');
        init_action.selector = "[ng-init]";
        init_action.attribute = 'ng-init';
        init_action.action = true;
        init_action.not_main_type = true;
        init_action.helplink = '1.2.29/docs/api/ng/directive/ngInit';
        init_action.sections = {
            'ng.init.parameters' : {
                'name' : 'Init name',
                'fields' : {
                    'ng.init.text': {
                        'type' : 'text',
                        'name' : 'Init',
                        'action' : 'element_attribute',
                        'attribute' : 'ng-init',
                        'attribute_keep_if_empty' : true
                    }
                }
            }
        };
        directives_actions.push(init_action);

        var bind_action = new PgComponentType('ng-bind-action', 'ng-Bind');
        bind_action.selector = "[ng-bind]";
        bind_action.attribute = 'ng-bind';
        bind_action.action = true;
        bind_action.not_main_type = true;
        bind_action.helplink = '1.2.29/docs/api/ng/directive/ngBind';
        bind_action.sections = {
            'ng.bind.parameters' : {
                'name' : 'Bind',
                'fields' : {
                    'ng.bind.text': {
                        'type' : 'text',
                        'name' : 'Bind',
                        'action' : 'element_attribute',
                        'attribute' : 'ng-bind',
                        'attribute_keep_if_empty' : true
                    },
                }
            }
        };
        directives_actions.push(bind_action);

        var bind_html_action = new PgComponentType('ng-bind-html-action', 'ng-Bind HTML');
        bind_html_action.selector = "[ng-bind-html]";
        bind_html_action.attribute = 'ng-bind-html';
        bind_html_action.action = true;
        bind_html_action.not_main_type = true;
        bind_html_action.helplink = '1.2.29/docs/api/ng/directive/ngBindHtml';
        bind_html_action.sections = {
            'ng.binghtml.parameters' : {
                'name' : 'Bind',
                'fields' : {
                    'ng.binghtml.text': {
                        'type' : 'text',
                        'name' : 'Bind HTML',
                        'action' : 'element_attribute',
                        'attribute' : 'ng-bind-html',
                        'attribute_keep_if_empty' : true
                    }
                }
            }
        };
        directives_actions.push(bind_html_action);

        var bind_template_action = new PgComponentType('ng-bind-template-action', 'ng-Bind template');
        bind_template_action.selector = "[ng-bind-template]";
        bind_template_action.attribute = 'ng-bind-template';
        bind_template_action.action = true;
        bind_template_action.not_main_type = true;
        bind_template_action.helplink = '1.2.29/docs/api/ng/directive/ngBindTemplate';
        bind_template_action.sections = {
            'ng.bingtemplate.parameters' : {
                'name' : 'Bind',
                'fields' : {
                    'ng.bingtemplate.text': {
                        'type' : 'text',
                        'name' : 'Bind template',
                        'action' : 'element_attribute',
                        'attribute' : 'ng-bind-template',
                        'attribute_keep_if_empty' : true
                    }
                }
            }
        };
        directives_actions.push(bind_template_action);

        var non_bindable_action = new PgComponentType('ng-non-bindable-action', 'ng-NonBindable');
        non_bindable_action.selector = "[ng-non-bindable]";
        non_bindable_action.attribute = 'ng-non-bindable';
        non_bindable_action.action = true;
        non_bindable_action.not_main_type = true;
        non_bindable_action.helplink = '1.2.29/docs/api/ng/directive/ngNonBindable';
        non_bindable_action.sections = {
            'ng.bingtemplate.parameters' : {
                'name' : 'Bind',
                'fields' : {
                    'ng.bingtemplate.checkbox': {
                        'type' : 'checkbox',
                        'name' : 'NonBindable',
                        'action' : 'element_attribute',
                        'attribute' : 'ng-non-bindable',
                        'attribute_keep_if_empty' : false,
                        'on_changed' : function ($el) {
                            $('body').trigger('crsa-element-selected');
                        }
                    }
                }
            }
        };
        directives_actions.push(non_bindable_action);

        var class_action = new PgComponentType('ng-class-action', 'ng-Class');
        class_action.selector = "[ng-class]";
        class_action.attribute = 'ng-class';
        class_action.action = true;
        class_action.not_main_type = true;
        class_action.helplink = '1.2.29/docs/api/ng/directive/ngClass';
        class_action.sections = {
            'ng.class.parameters' : {
                'name' : 'Class',
                'fields' : {
                    'ng.class.text': {
                        'type' : 'text',
                        'name' : 'Class',
                        'action' : 'element_attribute',
                        'attribute' : 'ng-class',
                        'attribute_keep_if_empty' : true
                    }
                }
            }
        };
        directives_actions.push(class_action);

        var class_even_action = new PgComponentType('ng-class-even-action', 'ng-Class even');
        class_even_action.selector = "[ng-class-even]";
        class_even_action.attribute = 'ng-class-even';
        class_even_action.action = true;
        class_even_action.not_main_type = true;
        class_even_action.helplink = '1.2.29/docs/api/ng/directive/ngClassEven';
        class_even_action.sections = {
            'ng.classeven.parameters' : {
                'name' : 'Class',
                'fields' : {
                    'ng.class.text': {
                        'type' : 'text',
                        'name' : 'Class even',
                        'action' : 'element_attribute',
                        'attribute' : 'ng-class-even',
                        'attribute_keep_if_empty' : true
                    }
                }
            }
        };
        directives_actions.push(class_even_action);

        var class_odd_action = new PgComponentType('ng-class-odd-action', 'ng-Class odd');
        class_odd_action.selector = "[ng-class-odd]";
        class_odd_action.attribute = 'ng-class-odd';
        class_odd_action.action = true;
        class_odd_action.not_main_type = true;
        class_odd_action.helplink = '1.2.29/docs/api/ng/directive/ngClassOdd';
        class_odd_action.sections = {
            'ng.classodd.parameters' : {
                'name' : 'Class',
                'fields' : {
                    'ng.class.text': {
                        'type' : 'text',
                        'name' : 'Class odd',
                        'action' : 'element_attribute',
                        'attribute' : 'ng-class-odd',
                        'attribute_keep_if_empty' : true
                    }
                }
            }
        };
        directives_actions.push(class_odd_action);

        var cloak_action = new PgComponentType('ng-cloak-action', 'ng-Cloak');
        cloak_action.selector = "[ng-cloak]";
        cloak_action.attribute = 'ng-cloak';
        cloak_action.action = true;
        cloak_action.not_main_type = true;
        cloak_action.helplink = '1.2.29/docs/api/ng/directive/ngCloak';
        cloak_action.sections = {
            'ng.cloak.parameters' : {
                'name' : 'Cloak',
                'fields' : {
                    'ng.cloak.text': {
                        'type' : 'text',
                        'name' : 'Cloak',
                        'action' : 'element_attribute',
                        'attribute' : 'ng-cloak',
                        'attribute_keep_if_empty' : true
                    }
                }
            }
        };
        directives_actions.push(cloak_action);

        var controller_action = new PgComponentType('ng-controller-action', 'ng-Controller');
        controller_action.selector = "[ng-controller]";
        controller_action.attribute = 'ng-controller';
        controller_action.action = true;
        controller_action.not_main_type = true;
        controller_action.helplink = '1.2.29/docs/api/ng/directive/ngController';
        controller_action.sections = {
            'ng.controller.parameters' : {
                'name' : 'Controller',
                'fields' : {
                    'ng.controller.text': {
                        'type' : 'text',
                        'name' : 'Controller',
                        'action' : 'element_attribute',
                        'attribute' : 'ng-controller',
                        'attribute_keep_if_empty' : true
                    }
                }
            }
        };
        directives_actions.push(controller_action);

        var form_action = new PgComponentType('ng-form-action', 'ng-Form');
        form_action.selector = "[ng-form]";
        form_action.attribute = 'ng-form';
        form_action.action = true;
        form_action.not_main_type = true;
        form_action.helplink = '1.2.29/docs/api/ng/directive/ngForm';
        form_action.sections = {
            'ng.form.parameters' : {
                'name' : 'Form',
                'fields' : {
                    'ng.form.text': {
                        'type' : 'text',
                        'name' : 'Form',
                        'action' : 'element_attribute',
                        'attribute' : 'ng-form',
                        'attribute_keep_if_empty' : true
                    }
                }
            }
        };
        directives_actions.push(form_action);

        var if_action = new PgComponentType('ng-if-action', 'ng-If');
        if_action.selector = "[ng-if]";
        if_action.attribute = 'ng-if';
        if_action.action = true;
        if_action.not_main_type = true;
        if_action.helplink = '1.2.29/docs/api/ng/directive/ngIf';
        if_action.sections = {
            'ng.if.parameters' : {
                'name' : 'If',
                'fields' : {
                    'ng.if.text': {
                        'type' : 'text',
                        'name' : 'If',
                        'action' : 'element_attribute',
                        'attribute' : 'ng-if',
                        'attribute_keep_if_empty' : true
                    }
                }
            }
        };
        directives_actions.push(if_action);

        var show_action = new PgComponentType('ng-show-action', 'ng-Show');
        show_action.selector = "[ng-show]";
        show_action.attribute = 'ng-show';
        show_action.action = true;
        show_action.not_main_type = true;
        show_action.helplink = '1.2.29/docs/api/ng/directive/ngShow';
        show_action.sections = {
            'ng.show.parameters' : {
                'name' : 'Show',
                'fields' : {
                    'ng.show.text': {
                        'type' : 'text',
                        'name' : 'Show',
                        'action' : 'element_attribute',
                        'attribute' : 'ng-show',
                        'attribute_keep_if_empty' : true
                    }
                }
            }
        };
        directives_actions.push(show_action);

        var hide_action = new PgComponentType('ng-hide-action', 'ng-Hide');
        hide_action.selector = "[ng-hide]";
        hide_action.attribute = 'ng-hide';
        hide_action.action = true;
        hide_action.not_main_type = true;
        hide_action.helplink = '1.2.29/docs/api/ng/directive/ngHide';
        hide_action.sections = {
            'ng.hide.parameters' : {
                'name' : 'Hide',
                'fields' : {
                    'ng.hide.text': {
                        'type' : 'text',
                        'name' : 'Hide',
                        'action' : 'element_attribute',
                        'attribute' : 'ng-hide',
                        'attribute_keep_if_empty' : true
                    }
                }
            }
        };
        directives_actions.push(hide_action);

        var repeat_action = new PgComponentType('ng-repeat-action', 'ng-Repeat');
        repeat_action.selector = "[ng-repeat]";
        repeat_action.attribute = 'ng-repeat';
        repeat_action.action = true;
        repeat_action.not_main_type = true;
        repeat_action.helplink = '1.2.29/docs/api/ng/directive/ngRepeat';
        repeat_action.sections = {
            'ng.repeat.parameters' : {
                'name' : 'Repeat',
                'fields' : {
                    'ng.repeat.text': {
                        'type' : 'text',
                        'name' : 'Repeat',
                        'action' : 'element_attribute',
                        'attribute' : 'ng-repeat',
                        'attribute_keep_if_empty' : true
                    }
                }
            }
        };
        directives_actions.push(repeat_action);

        var repeat_start_action = new PgComponentType('ng-repeat-start-action', 'ng-Repeat start');
        repeat_start_action.selector = "[ng-repeat-start]";
        repeat_start_action.attribute = 'ng-repeat-start';
        repeat_start_action.action = true;
        repeat_start_action.not_main_type = true;
        repeat_start_action.helplink = '1.2.29/docs/api/ng/directive/ngRepeat';
        repeat_start_action.sections = {
            'ng.repeatstart.parameters' : {
                'name' : 'Repeat start',
                'fields' : {
                    'ng.repeatstart.text': {
                        'type' : 'text',
                        'name' : 'Repeat start',
                        'action' : 'element_attribute',
                        'attribute' : 'ng-repeat-start',
                        'attribute_keep_if_empty' : true
                    }
                }
            }
        };
        directives_actions.push(repeat_start_action);

        var repeat_end_action = new PgComponentType('ng-repeat-end-action', 'ng-Repeat end');
        repeat_end_action.selector = "[ng-repeat-end]";
        repeat_end_action.attribute = 'ng-repeat-end';
        repeat_end_action.action = true;
        repeat_end_action.not_main_type = true;
        repeat_end_action.helplink = '1.2.29/docs/api/ng/directive/ngRepeat';
        repeat_end_action.sections = {
            'ng.repeatend.parameters' : {
                'name' : 'Repeat end',
                'fields' : {
                    'ng.repeatend.text': {
                        'type' : 'text',
                        'name' : 'Repeat end',
                        'action' : 'element_attribute',
                        'attribute' : 'ng-repeat-end',
                        'attribute_keep_if_empty' : true
                    }
                }
            }
        };
        directives_actions.push(repeat_end_action);

        var include_action = new PgComponentType('ng-include-action', 'ng-Include');
        include_action.selector = "[ng-include]";
        include_action.attribute = 'ng-include';
        include_action.action = true;
        include_action.not_main_type = true;
        include_action.helplink = '1.2.29/docs/api/ng/directive/ngInclude';
        include_action.sections = {
            'ng.include.parameters' : {
                'name' : 'Include',
                'fields' : {
                    'ng.include.text': {
                        'type' : 'text',
                        'name' : 'Include',
                        'action' : 'element_attribute',
                        'attribute' : 'ng-include',
                        'attribute_keep_if_empty' : true
                    },
                    'ng.include.onload': {
                        'type' : 'text',
                        'name' : 'Onload',
                        'action' : 'element_attribute',
                        'attribute' : 'onload',
                        'attribute_keep_if_empty' : false
                    },
                    'ng.include.autoscroll': {
                        'type' : 'text',
                        'name' : 'Autoscroll',
                        'action' : 'element_attribute',
                        'attribute' : 'autoscroll',
                        'attribute_keep_if_empty' : false
                    }
                }
            }
        };
        directives_actions.push(include_action);

        var pluralize_action = new PgComponentType('ng-pluralize-action', 'ng-Pluralize');
        pluralize_action.selector = "[ng-pluralize]";
        pluralize_action.attribute = 'ng-pluralize';
        pluralize_action.action = true;
        pluralize_action.not_main_type = true;
        pluralize_action.helplink = '1.2.29/docs/api/ng/directive/ngPluralize';
        pluralize_action.sections = {
            'ng.pluralize.parameters' : {
                'name' : 'Pluralize',
                'fields' : {
                    'ng.pluralize.count': {
                        'type' : 'text',
                        'name' : 'Count',
                        'action' : 'element_attribute',
                        'attribute' : 'count',
                        'attribute_keep_if_empty' : false
                    },
                    'ng.pluralize.when': {
                        'type' : 'text',
                        'name' : 'When',
                        'action' : 'element_attribute',
                        'attribute' : 'when',
                        'attribute_keep_if_empty' : false
                    },
                    'ng.pluralize.offset': {
                        'type' : 'text',
                        'name' : 'Offset',
                        'action' : 'element_attribute',
                        'attribute' : 'offset',
                        'attribute_keep_if_empty' : false
                    }
                }
            }
        };
        directives_actions.push(pluralize_action);

        var readonly_action = new PgComponentType('ng-readonly-action', 'ng-Readonly');
        readonly_action.selector = "[ng-readonly]";
        readonly_action.attribute = 'ng-readonly';
        readonly_action.action = true;
        readonly_action.not_main_type = true;
        readonly_action.helplink = '1.2.29/docs/api/ng/directive/ngReadonly';
        readonly_action.sections = {
            'ng.readonly.parameters' : {
                'name' : 'Readonly',
                'fields' : {
                    'ng.readonly.text': {
                        'type' : 'text',
                        'name' : 'Readonly',
                        'action' : 'element_attribute',
                        'attribute' : 'ng-readonly',
                        'attribute_keep_if_empty' : true
                    }
                }
            }
        };
        directives_actions.push(readonly_action);

        var style_action = new PgComponentType('ng-style-action', 'ng-Style');
        style_action.selector = "[ng-style]";
        style_action.attribute = 'ng-style';
        style_action.action = true;
        style_action.not_main_type = true;
        style_action.helplink = '1.2.29/docs/api/ng/directive/ngStyle';
        style_action.sections = {
            'ng.style.parameters' : {
                'name' : 'Style',
                'fields' : {
                    'ng.style.text': {
                        'type' : 'text',
                        'name' : 'Style',
                        'action' : 'element_attribute',
                        'attribute' : 'ng-style',
                        'attribute_keep_if_empty' : true
                    }
                }
            }
        };
        directives_actions.push(style_action);

        var switch_action = new PgComponentType('ng-switch-action', 'ng-Switch');
        switch_action.selector = "[ng-switch]";
        switch_action.attribute = 'ng-switch';
        switch_action.action = true;
        switch_action.not_main_type = true;
        switch_action.helplink = '1.2.29/docs/api/ng/directive/ngSwitch';
        switch_action.sections = {
            'ng.switch.parameters' : {
                'name' : 'Switch',
                'fields' : {
                    'ng.switch.text': {
                        'type' : 'text',
                        'name' : 'Switch',
                        'action' : 'element_attribute',
                        'attribute' : 'ng-switch',
                        'attribute_keep_if_empty' : true
                    }
                }
            }
        };
        directives_actions.push(switch_action);

        var switch_when_action = new PgComponentType('ng-switch-when-action', 'ng-Switch when');
        switch_when_action.selector = "[ng-switch-when]";
        switch_when_action.attribute = 'ng-switch-when';
        switch_when_action.action = true;
        switch_when_action.not_main_type = true;
        switch_when_action.helplink = '1.2.29/docs/api/ng/directive/ngSwitch';
        switch_when_action.sections = {
            'ng.switchwhen.parameters' : {
                'name' : 'Switch when',
                'fields' : {
                    'ng.switchwhen.text': {
                        'type' : 'text',
                        'name' : 'Switch when',
                        'action' : 'element_attribute',
                        'attribute' : 'ng-switch-when',
                        'attribute_keep_if_empty' : true
                    }
                }
            }
        };
        directives_actions.push(switch_when_action);

        var switch_default_action = new PgComponentType('ng-switch-default-action', 'ng-Switch default');
        switch_default_action.selector = "[ng-switch-default]";
        switch_default_action.attribute = 'ng-switch-default';
        switch_default_action.action = true;
        switch_default_action.not_main_type = true;
        switch_default_action.helplink = '1.2.29/docs/api/ng/directive/ngSwitch';
        switch_default_action.sections = {
            'ng.switchdefault.parameters' : {
                'name' : 'Switch default',
                'fields' : {
                    'ng.switchdefault.text': {
                        'type' : 'text',
                        'name' : 'Switch default',
                        'action' : 'element_attribute',
                        'attribute' : 'ng-switch-default',
                        'attribute_keep_if_empty' : true
                    }
                }
            }
        };
        directives_actions.push(switch_default_action);

        var transclude_action = new PgComponentType('ng-transclude-action', 'ng-Transclude');
        transclude_action.selector = "[ng-transclude]";
        transclude_action.attribute = 'ng-transclude';
        transclude_action.action = true;
        transclude_action.not_main_type = true;
        transclude_action.helplink = '1.2.29/docs/api/ng/directive/ngTransclude';
        transclude_action.sections = {
            'ng.transclude.parameters' : {
                'name' : 'Transclude',
                'fields' : {
                    'ng.transclude.checkbox': {
                        'type' : 'checkbox',
                        'name' : 'Transclude',
                        'action' : 'element_attribute',
                        'attribute' : 'ng-transclude',
                        'attribute_keep_if_empty' : false,
                        'on_changed' : function ($el) {
                            $('body').trigger('crsa-element-selected');
                        }
                    }
                }
            }
        };
        directives_actions.push(transclude_action);

        var blur_action = new PgComponentType('ng-blur-action', 'ng-Blur');
        blur_action.selector = "[ng-blur]";
        blur_action.attribute = 'ng-blur';
        blur_action.action = true;
        blur_action.not_main_type = true;
        blur_action.helplink = '1.2.29/docs/api/ng/directive/ngBlur';
        blur_action.sections = {
            'ng.blur.parameters' : {
                'name' : 'Blur',
                'fields' : {
                    'ng.blur.text': {
                        'type' : 'text',
                        'name' : 'Blur',
                        'action' : 'element_attribute',
                        'attribute' : 'ng-blur',
                        'attribute_keep_if_empty' : true
                    }
                }
            }
        };
        events_actions.push(blur_action);

        var change_action = new PgComponentType('ng-change-action', 'ng-Change');
        change_action.selector = "[ng-change]";
        change_action.attribute = 'ng-change';
        change_action.action = true;
        change_action.not_main_type = true;
        change_action.helplink = '1.2.29/docs/api/ng/directive/ngChange';
        change_action.sections = {
            'ng.change.parameters' : {
                'name' : 'Change',
                'fields' : {
                    'ng.change.text': {
                        'type' : 'text',
                        'name' : 'Change',
                        'action' : 'element_attribute',
                        'attribute' : 'ng-change',
                        'attribute_keep_if_empty' : true
                    }
                }
            }
        };
        events_actions.push(change_action);

        var click_action = new PgComponentType('ng-click-action', 'ng-Click');
        click_action.selector = "[ng-click]";
        click_action.attribute = 'ng-click';
        click_action.action = true;
        click_action.not_main_type = true;
        click_action.helplink = '1.2.29/docs/api/ng/directive/ngClick';
        click_action.sections = {
            'ng.click.parameters' : {
                'name' : 'Click',
                'fields' : {
                    'ng.click.text': {
                        'type' : 'text',
                        'name' : 'Click',
                        'action' : 'element_attribute',
                        'attribute' : 'ng-click',
                        'attribute_keep_if_empty' : true
                    }
                }
            }
        };
        events_actions.push(click_action);

        var submit_action = new PgComponentType('ng-submit-action', 'ng-Submit');
        submit_action.selector = "[ng-submit]";
        submit_action.attribute = 'ng-submit';
        submit_action.action = true;
        submit_action.not_main_type = true;
        submit_action.helplink = '1.2.29/docs/api/ng/directive/ngSubmit';
        submit_action.sections = {
            'ng.submit.parameters' : {
                'name' : 'Submit',
                'fields' : {
                    'ng.submit.text': {
                        'type' : 'text',
                        'name' : 'Submit',
                        'action' : 'element_attribute',
                        'attribute' : 'ng-submit',
                        'attribute_keep_if_empty' : true
                    }
                }
            }
        };
        events_actions.push(submit_action);

        var copy_action = new PgComponentType('ng-copy-action', 'ng-Copy');
        copy_action.selector = "[ng-copy]";
        copy_action.attribute = 'ng-copy';
        copy_action.action = true;
        copy_action.not_main_type = true;
        copy_action.helplink = '1.2.29/docs/api/ng/directive/ngCopy';
        copy_action.sections = {
            'ng.copy.parameters' : {
                'name' : 'Copy',
                'fields' : {
                    'ng.copy.text': {
                        'type' : 'text',
                        'name' : 'Copy',
                        'action' : 'element_attribute',
                        'attribute' : 'ng-copy',
                        'attribute_keep_if_empty' : true
                    }
                }
            }
        };
        events_actions.push(copy_action);

        var paste_action = new PgComponentType('ng-paste-action', 'ng-Paste');
        paste_action.selector = "[ng-paste]";
        paste_action.attribute = 'ng-paste';
        paste_action.action = true;
        paste_action.not_main_type = true;
        paste_action.helplink = '1.2.29/docs/api/ng/directive/ngPaste';
        paste_action.sections = {
            'ng.paste.parameters' : {
                'name' : 'Paste',
                'fields' : {
                    'ng.paste.text': {
                        'type' : 'text',
                        'name' : 'Paste',
                        'action' : 'element_attribute',
                        'attribute' : 'ng-paste',
                        'attribute_keep_if_empty' : true
                    }
                }
            }
        };
        events_actions.push(paste_action);

        var cut_action = new PgComponentType('ng-cut-action', 'ng-Cut');
        cut_action.selector = "[ng-cut]";
        cut_action.attribute = 'ng-cut';
        cut_action.action = true;
        cut_action.not_main_type = true;
        cut_action.helplink = '1.2.29/docs/api/ng/directive/ngCut';
        cut_action.sections = {
            'ng.cut.parameters' : {
                'name' : 'Cut',
                'fields' : {
                    'ng.cut.text': {
                        'type' : 'text',
                        'name' : 'Cut',
                        'action' : 'element_attribute',
                        'attribute' : 'ng-cut',
                        'attribute_keep_if_empty' : true
                    }
                }
            }
        };
        events_actions.push(cut_action);

        var dblclick_action = new PgComponentType('ng-dblclick-action', 'ng-Dblclick');
        dblclick_action.selector = "[ng-dblclick]";
        dblclick_action.attribute = 'ng-dblclick';
        dblclick_action.action = true;
        dblclick_action.not_main_type = true;
        dblclick_action.helplink = '1.2.29/docs/api/ng/directive/ngDblclick';
        dblclick_action.sections = {
            'ng.dblclick.parameters' : {
                'name' : 'Dblclick',
                'fields' : {
                    'ng.dblclick.text': {
                        'type' : 'text',
                        'name' : 'Dblclick',
                        'action' : 'element_attribute',
                        'attribute' : 'ng-dblclick',
                        'attribute_keep_if_empty' : true
                    }
                }
            }
        };
        events_actions.push(dblclick_action);

        var focus_action = new PgComponentType('ng-focus-action', 'ng-Focus');
        focus_action.selector = "[ng-focus]";
        focus_action.attribute = 'ng-focus';
        focus_action.action = true;
        focus_action.not_main_type = true;
        focus_action.helplink = '1.2.29/docs/api/ng/directive/ngFocus';
        focus_action.sections = {
            'ng.focus.parameters' : {
                'name' : 'Focus',
                'fields' : {
                    'ng.focus.text': {
                        'type' : 'text',
                        'name' : 'Focus',
                        'action' : 'element_attribute',
                        'attribute' : 'ng-focus',
                        'attribute_keep_if_empty' : true
                    }
                }
            }
        };
        events_actions.push(focus_action);

        var keydown_action = new PgComponentType('ng-keydown-action', 'ng-Keydown');
        keydown_action.selector = "[ng-keydown]";
        keydown_action.attribute = 'ng-keydown';
        keydown_action.action = true;
        keydown_action.not_main_type = true;
        keydown_action.helplink = '1.2.29/docs/api/ng/directive/ngKeydown';
        keydown_action.sections = {
            'ng.keydown.parameters' : {
                'name' : 'Keydown',
                'fields' : {
                    'ng.keydown.text': {
                        'type' : 'text',
                        'name' : 'Keydown',
                        'action' : 'element_attribute',
                        'attribute' : 'ng-keydown',
                        'attribute_keep_if_empty' : true
                    }
                }
            }
        };
        events_actions.push(keydown_action);

        var keypress_action = new PgComponentType('ng-keypress-action', 'ng-Keypress');
        keypress_action.selector = "[ng-keypress]";
        keypress_action.attribute = 'ng-keypress';
        keypress_action.action = true;
        keypress_action.not_main_type = true;
        keypress_action.helplink = '1.2.29/docs/api/ng/directive/ngKeypress';
        keypress_action.sections = {
            'ng.keypress.parameters' : {
                'name' : 'Keypress',
                'fields' : {
                    'ng.keypress.text': {
                        'type' : 'text',
                        'name' : 'Keypress',
                        'action' : 'element_attribute',
                        'attribute' : 'ng-keypress',
                        'attribute_keep_if_empty' : true
                    }
                }
            }
        };
        events_actions.push(keypress_action);

        var keyup_action = new PgComponentType('ng-keyup-action', 'ng-Keyup');
        keyup_action.selector = "[ng-keyup]";
        keyup_action.attribute = 'ng-keyup';
        keyup_action.action = true;
        keyup_action.not_main_type = true;
        keyup_action.helplink = '1.2.29/docs/api/ng/directive/ngKeyup';
        keyup_action.sections = {
            'ng.keyup.parameters' : {
                'name' : 'Keyup',
                'fields' : {
                    'ng.keyup.text': {
                        'type' : 'text',
                        'name' : 'Keyup',
                        'action' : 'element_attribute',
                        'attribute' : 'ng-keyup',
                        'attribute_keep_if_empty' : true
                    }
                }
            }
        };
        events_actions.push(keyup_action);

        var mousedown_action = new PgComponentType('ng-mousedown-action', 'ng-Mousedown');
        mousedown_action.selector = "[ng-mousedown]";
        mousedown_action.attribute = 'ng-mousedown';
        mousedown_action.action = true;
        mousedown_action.not_main_type = true;
        mousedown_action.helplink = '1.2.29/docs/api/ng/directive/ngMousedown';
        mousedown_action.sections = {
            'ng.mousedown.parameters' : {
                'name' : 'Mousedown',
                'fields' : {
                    'ng.mousedown.text': {
                        'type' : 'text',
                        'name' : 'Mousedown',
                        'action' : 'element_attribute',
                        'attribute' : 'ng-mousedown',
                        'attribute_keep_if_empty' : true
                    }
                }
            }
        };
        events_actions.push(mousedown_action);

        var mouseup_action = new PgComponentType('ng-mouseup-action', 'ng-Mouseup');
        mouseup_action.selector = "[ng-mouseup]";
        mouseup_action.attribute = 'ng-mouseup';
        mouseup_action.action = true;
        mouseup_action.not_main_type = true;
        mouseup_action.helplink = '1.2.29/docs/api/ng/directive/ngMouseup';
        mouseup_action.sections = {
            'ng.mouseup.parameters' : {
                'name' : 'Mouseup',
                'fields' : {
                    'ng.mouseup.text': {
                        'type' : 'text',
                        'name' : 'Mouseup',
                        'action' : 'element_attribute',
                        'attribute' : 'ng-mouseup',
                        'attribute_keep_if_empty' : true
                    }
                }
            }
        };
        events_actions.push(mouseup_action);

        var mouseenter_action = new PgComponentType('ng-mouseenter-action', 'ng-Mouseenter');
        mouseenter_action.selector = "[ng-mouseenter]";
        mouseenter_action.attribute = 'ng-mouseenter';
        mouseenter_action.action = true;
        mouseenter_action.not_main_type = true;
        mouseenter_action.helplink = '1.2.29/docs/api/ng/directive/ngMouseenter';
        mouseenter_action.sections = {
            'ng.mouseenter.parameters' : {
                'name' : 'Mouseenter',
                'fields' : {
                    'ng.mouseenter.text': {
                        'type' : 'text',
                        'name' : 'Mouseenter',
                        'action' : 'element_attribute',
                        'attribute' : 'ng-mouseenter',
                        'attribute_keep_if_empty' : true
                    }
                }
            }
        };
        events_actions.push(mouseenter_action);

        var mouseleave_action = new PgComponentType('ng-mouseleave-action', 'ng-Mouseleave');
        mouseleave_action.selector = "[ng-mouseleave]";
        mouseleave_action.attribute = 'ng-mouseleave';
        mouseleave_action.action = true;
        mouseleave_action.not_main_type = true;
        mouseleave_action.helplink = '1.2.29/docs/api/ng/directive/ngMouseleave';
        mouseleave_action.sections = {
            'ng.mouseleave.parameters' : {
                'name' : 'Mouseleave',
                'fields' : {
                    'ng.mouseleave.text': {
                        'type' : 'text',
                        'name' : 'Mouseleave',
                        'action' : 'element_attribute',
                        'attribute' : 'ng-mouseleave',
                        'attribute_keep_if_empty' : true
                    }
                }
            }
        };
        events_actions.push(mouseleave_action);

        var mousemove_action = new PgComponentType('ng-mousemove-action', 'ng-Mousemove');
        mousemove_action.selector = "[ng-mousemove]";
        mousemove_action.attribute = 'ng-mousemove';
        mousemove_action.action = true;
        mousemove_action.not_main_type = true;
        mousemove_action.helplink = '1.2.29/docs/api/ng/directive/ngMousemove';
        mousemove_action.sections = {
            'ng.mousemove.parameters' : {
                'name' : 'Mousemove',
                'fields' : {
                    'ng.mousemove.text': {
                        'type' : 'text',
                        'name' : 'Mousemove',
                        'action' : 'element_attribute',
                        'attribute' : 'ng-mousemove',
                        'attribute_keep_if_empty' : true
                    }
                }
            }
        };
        events_actions.push(mousemove_action);

        var mouseover_action = new PgComponentType('ng-mouseover-action', 'ng-Mouseover');
        mouseover_action.selector = "[ng-mouseover]";
        mouseover_action.attribute = 'ng-mouseover';
        mouseover_action.action = true;
        mouseover_action.not_main_type = true;
        mouseover_action.helplink = '1.2.29/docs/api/ng/directive/ngMouseover';
        mouseover_action.sections = {
            'ng.mouseover.parameters' : {
                'name' : 'Mouseover',
                'fields' : {
                    'ng.mouseover.text': {
                        'type' : 'text',
                        'name' : 'Mouseover',
                        'action' : 'element_attribute',
                        'attribute' : 'ng-mouseover',
                        'attribute_keep_if_empty' : true
                    }
                }
            }
        };
        events_actions.push(mouseover_action);

        var model_action = new PgComponentType('ng-model-action', 'ng-Model');
        model_action.selector = "[ng-model]";
        model_action.attribute = 'ng-model';
        model_action.action = true;
        model_action.not_main_type = true;
        model_action.helplink = '1.2.29/docs/api/ng/directive/ngModel';
        model_action.sections = {
            'ng.model.parameters' : {
                'name' : 'Model',
                'fields' : {
                    'ng.model.text': {
                        'type' : 'text',
                        'name' : 'Model',
                        'action' : 'element_attribute',
                        'attribute' : 'ng-model',
                        'attribute_keep_if_empty' : true
                    }
                }
            }
        };
        input_actions.push(model_action);

        var required_action = new PgComponentType('ng-required-action', 'ng-Required');
        required_action.selector = "[ng-required]";
        required_action.attribute = 'ng-required';
        required_action.action = true;
        required_action.not_main_type = true;
        required_action.sections = {
            'ng.required.parameters' : {
                'name' : 'Required',
                'fields' : {
                    'ng.required.text': {
                        'type' : 'text',
                        'name' : 'Required',
                        'action' : 'element_attribute',
                        'attribute' : 'ng-required',
                        'attribute_keep_if_empty' : true
                    }
                }
            }
        };
        input_actions.push(required_action);

        var minlength_action = new PgComponentType('ng-minlength-action', 'ng-MinLength');
        minlength_action.selector = "[ng-minlength]";
        minlength_action.attribute = 'ng-minlength';
        minlength_action.action = true;
        minlength_action.not_main_type = true;
        minlength_action.sections = {
            'ng.minlength.parameters' : {
                'name' : 'MinLength',
                'fields' : {
                    'ng.minlength.text': {
                        'type' : 'text',
                        'name' : 'MinLength',
                        'action' : 'element_attribute',
                        'attribute' : 'ng-minlength',
                        'attribute_keep_if_empty' : true
                    }
                }
            }
        };
        input_actions.push(minlength_action);

        var maxlength_action = new PgComponentType('ng-maxlength-action', 'ng-MaxLength');
        maxlength_action.selector = "[ng-maxlength]";
        maxlength_action.attribute = 'ng-maxlength';
        maxlength_action.action = true;
        maxlength_action.not_main_type = true;
        maxlength_action.sections = {
            'ng.maxlength.parameters' : {
                'name' : 'MaxLength',
                'fields' : {
                    'ng.maxlength.text': {
                        'type' : 'text',
                        'name' : 'MaxLength',
                        'action' : 'element_attribute',
                        'attribute' : 'ng-maxlength',
                        'attribute_keep_if_empty' : true
                    }
                }
            }
        };
        input_actions.push(maxlength_action);

        var pattern_action = new PgComponentType('ng-pattern-action', 'ng-Pattern');
        pattern_action.selector = "[ng-pattern]";
        pattern_action.attribute = 'ng-pattern';
        pattern_action.action = true;
        pattern_action.not_main_type = true;
        pattern_action.sections = {
            'ng.pattern.parameters' : {
                'name' : 'Pattern',
                'fields' : {
                    'ng.pattern.text': {
                        'type' : 'text',
                        'name' : 'Pattern',
                        'action' : 'element_attribute',
                        'attribute' : 'ng-pattern',
                        'attribute_keep_if_empty' : true
                    }
                }
            }
        };
        input_actions.push(pattern_action);

        var trim_action = new PgComponentType('ng-trim-action', 'ng-Trim');
        trim_action.selector = "[ng-trim]";
        trim_action.attribute = 'ng-trim';
        trim_action.action = true;
        trim_action.not_main_type = true;
        trim_action.sections = {
            'ng.trim.parameters' : {
                'name' : 'Trim',
                'fields' : {
                    'ng.trim.text': {
                        'type' : 'text',
                        'name' : 'Trim',
                        'action' : 'element_attribute',
                        'attribute' : 'ng-trim',
                        'attribute_keep_if_empty' : true
                    }
                }
            }
        };
        input_actions.push(trim_action);

        var truevalue_action = new PgComponentType('ng-true-value-action', 'ng-Ture value');
        truevalue_action.selector = "[ng-true-value]";
        truevalue_action.attribute = 'ng-true-value';
        truevalue_action.action = true;
        truevalue_action.not_main_type = true;
        truevalue_action.sections = {
            'ng.truevalue.parameters' : {
                'name' : 'Ture value',
                'fields' : {
                    'ng.truevalue.text': {
                        'type' : 'text',
                        'name' : 'Ture value',
                        'action' : 'element_attribute',
                        'attribute' : 'ng-true-value',
                        'attribute_keep_if_empty' : true
                    }
                }
            }
        };
        input_actions.push(truevalue_action);

        var falsevalue_action = new PgComponentType('ng-false-value-action', 'ng-False value');
        falsevalue_action.selector = "[ng-false-value]";
        falsevalue_action.attribute = 'ng-false-value';
        falsevalue_action.action = true;
        falsevalue_action.not_main_type = true;
        falsevalue_action.sections = {
            'ng.falsevalue.parameters' : {
                'name' : 'False value',
                'fields' : {
                    'ng.falsevalue.text': {
                        'type' : 'text',
                        'name' : 'False value',
                        'action' : 'element_attribute',
                        'attribute' : 'ng-false-value',
                        'attribute_keep_if_empty' : true
                    }
                }
            }
        };
        input_actions.push(falsevalue_action);

        var value_action = new PgComponentType('ng-value-action', 'ng-Value');
        value_action.selector = "[ng-value]";
        value_action.attribute = 'ng-value';
        value_action.action = true;
        value_action.not_main_type = true;
        value_action.helplink = '1.2.29/docs/api/ng/directive/ngValue';
        value_action.sections = {
            'ng.value.parameters' : {
                'name' : 'Value',
                'fields' : {
                    'ng.value.text': {
                        'type' : 'text',
                        'name' : 'Value',
                        'action' : 'element_attribute',
                        'attribute' : 'ng-value',
                        'attribute_keep_if_empty' : true
                    }
                }
            }
        };
        input_actions.push(value_action);

        var checked_action = new PgComponentType('ng-checked-action', 'ng-Checked');
        checked_action.selector = "[ng-checked]";
        checked_action.attribute = 'ng-checked';
        checked_action.action = true;
        checked_action.not_main_type = true;
        checked_action.helplink = '1.2.29/docs/api/ng/directive/ngChecked';
        checked_action.sections = {
            'ng.checked.parameters' : {
                'name' : 'Checked',
                'fields' : {
                    'ng.checked.text': {
                        'type' : 'text',
                        'name' : 'Checked',
                        'action' : 'element_attribute',
                        'attribute' : 'ng-checked',
                        'attribute_keep_if_empty' : true
                    }
                }
            }
        };
        input_actions.push(checked_action);

        var disabled_action = new PgComponentType('ng-disabled-action', 'ng-Disabled');
        disabled_action.selector = "[ng-disabled]";
        disabled_action.attribute = 'ng-disabled';
        disabled_action.action = true;
        disabled_action.not_main_type = true;
        disabled_action.helplink = '1.2.29/docs/api/ng/directive/ngDisabled';
        disabled_action.sections = {
            'ng.disabled.parameters' : {
                'name' : 'Disabled',
                'fields' : {
                    'ng.disabled.text': {
                        'type' : 'text',
                        'name' : 'Disabled',
                        'action' : 'element_attribute',
                        'attribute' : 'ng-disabled',
                        'attribute_keep_if_empty' : true
                    }
                }
            }
        };
        input_actions.push(disabled_action);

        var list_action = new PgComponentType('ng-list-action', 'ng-List');
        list_action.selector = "[ng-list]";
        list_action.attribute = 'ng-list';
        list_action.action = true;
        list_action.not_main_type = true;
        list_action.helplink = '1.2.29/docs/api/ng/directive/ngList';
        list_action.sections = {
            'ng.list.parameters' : {
                'name' : 'List',
                'fields' : {
                    'ng.list.text': {
                        'type' : 'text',
                        'name' : 'List',
                        'action' : 'element_attribute',
                        'attribute' : 'ng-list',
                        'attribute_keep_if_empty' : true
                    }
                }
            }
        };
        input_actions.push(list_action);

        var options_action = new PgComponentType('ng-options-action', 'ng-Options');
        options_action.selector = "[ng-options]";
        options_action.attribute = 'ng-options';
        options_action.action = true;
        options_action.not_main_type = true;
        options_action.helplink = '1.2.29/docs/api/ng/directive/select';
        options_action.sections = {
            'ng.options.parameters' : {
                'name' : 'Options',
                'fields' : {
                    'ng.options.text': {
                        'type' : 'text',
                        'name' : 'Options',
                        'action' : 'element_attribute',
                        'attribute' : 'ng-options',
                        'attribute_keep_if_empty' : true
                    }
                }
            }
        };
        input_actions.push(options_action);

        var href_action = new PgComponentType('ng-href-action', 'ng-Href');
        href_action.selector = "[ng-href]";
        href_action.attribute = 'ng-href';
        href_action.action = true;
        href_action.not_main_type = true;
        href_action.helplink = '1.2.29/docs/api/ng/directive/ngHref';
        href_action.sections = {
            'ng.href.parameters' : {
                'name' : 'Href',
                'fields' : {
                    'ng.href.text': {
                        'type' : 'text',
                        'name' : 'Href',
                        'action' : 'element_attribute',
                        'attribute' : 'ng-href',
                        'attribute_keep_if_empty' : true
                    }
                }
            }
        };
        other_actions.push(href_action);

        var open_action = new PgComponentType('ng-open-action', 'ng-Open');
        open_action.selector = "[ng-open]";
        open_action.attribute = 'ng-open';
        open_action.action = true;
        open_action.not_main_type = true;
        open_action.helplink = '1.2.29/docs/api/ng/directive/ngOpen';
        open_action.sections = {
            'ng.open.parameters' : {
                'name' : 'Open',
                'fields' : {
                    'ng.open.text': {
                        'type' : 'text',
                        'name' : 'Open',
                        'action' : 'element_attribute',
                        'attribute' : 'ng-open',
                        'attribute_keep_if_empty' : true
                    }
                }
            }
        };
        other_actions.push(open_action);

        var selected_action = new PgComponentType('ng-selected-action', 'ng-Selected');
        selected_action.selector = "[ng-selected]";
        selected_action.attribute = 'ng-selected';
        selected_action.action = true;
        selected_action.not_main_type = true;
        selected_action.helplink = '1.2.29/docs/api/ng/directive/ngSelected';
        selected_action.sections = {
            'ng.selected.parameters' : {
                'name' : 'Selected',
                'fields' : {
                    'ng.selected.text': {
                        'type' : 'text',
                        'name' : 'Selected',
                        'action' : 'element_attribute',
                        'attribute' : 'ng-selected',
                        'attribute_keep_if_empty' : true
                    }
                }
            }
        };
        other_actions.push(selected_action);

        var src_action = new PgComponentType('ng-src-action', 'ng-Src');
        src_action.selector = "[ng-src]";
        src_action.attribute = 'ng-src';
        src_action.action = true;
        src_action.not_main_type = true;
        src_action.helplink = '1.2.29/docs/api/ng/directive/ngSrc';
        src_action.sections = {
            'ng.src.parameters' : {
                'name' : 'Src',
                'fields' : {
                    'ng.src.text': {
                        'type' : 'text',
                        'name' : 'Src',
                        'action' : 'element_attribute',
                        'attribute' : 'ng-src',
                        'attribute_keep_if_empty' : true
                    }
                }
            }
        };
        other_actions.push(src_action);

        var srcset_action = new PgComponentType('ng-srcset-action', 'ng-Srcset');
        srcset_action.selector = "[ng-srcset]";
        srcset_action.attribute = 'ng-srcset';
        srcset_action.action = true;
        srcset_action.not_main_type = true;
        srcset_action.helplink = '1.2.29/docs/api/ng/directive/ngSrcset';
        srcset_action.sections = {
            'ng.src.parameters' : {
                'name' : 'Srcset',
                'fields' : {
                    'ng.src.text': {
                        'type' : 'text',
                        'name' : 'Srcset',
                        'action' : 'element_attribute',
                        'attribute' : 'ng-srcset',
                        'attribute_keep_if_empty' : true
                    }
                }
            }
        };
        other_actions.push(srcset_action);


        var addComponentTypesToPG = function(list) {
            for(var i = 0; i < list.length; i++) {
                f.addComponentType(list[i]);
            }
        }

        addComponentTypesToPG(directives_actions);
        addComponentTypesToPG(events_actions);
        addComponentTypesToPG(input_actions);
        addComponentTypesToPG(other_actions);


        //Now, lets define sections and elements shown in LIB tab
        //Actions
        var section = new PgFrameworkLibSection('ngdirectivesactions', 'Directives');
        section.setComponentTypes( directives_actions );
        section.closed = true;
        f.addActionsSection(section);

        section = new PgFrameworkLibSection('ngeventsactions', 'Events');
        section.setComponentTypes( events_actions );
        section.closed = true;
        f.addActionsSection(section);

        section = new PgFrameworkLibSection('nginputactions', 'Input');
        section.setComponentTypes( input_actions );
        section.closed = true;
        f.addActionsSection(section);

        section = new PgFrameworkLibSection('ngotheractions', 'Misc');
        section.setComponentTypes( other_actions );
        section.closed = true;
        f.addActionsSection(section);

        //Register starting page template
        f.addTemplateProjectFromResourceFolder('template', null, 6);
    });
});