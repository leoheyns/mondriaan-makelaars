function createBlocksPlugin(wp, pinegrow) {
    //Create new Pinegrow framework object
    var type_prefix = wp ? 'pg.blocks.wp' : 'pg.blocks';

    var f = new PgFramework(type_prefix, 'Bootstrap Blocks' + (wp ? ' for WP' : ''));

    //This will prevent activating multiple versions of the plugin, provided that other versions set the same type
    f.allow_single_type = true;
    f.type = type_prefix;

    var terms = '<br><small class="text-muted">TERMS OF USE: <b>You can use Blocks</b> to build and deploy websites for yourself and your clients, free or paid, as many as you want. <b>You can NOT use Blocks</b> to create templates and themes that you then sell in template marketplaces or give away for free.</small>';

    f.description = (wp ? 'Ready-made Bootstrap blocks for building WordPress themes. Requires WordPress edition of Pinegrow. <a href="http://docsbeta.pinegrow.com/bootstrap-blocks-for-wordpress">Watch Video tutorials.</a>' : 'Ready-made website blocks for Bootstrap. <a href="http://docsbeta.pinegrow.com/bootstrap-blocks">Watch Video tutorials.</a>') + ' ' + terms;
    f.author = 'Pinegrow';
    f.author_link = 'http://pinegrow.com';
    //f.info_badge = 'New';

    f.setScriptFileByScriptTagId('plugin-pg-blocks');

    //Don't show these files in CSS tab
    f.ignore_css_files = [/font\-awesome/i];

    f.detect = function(pgPage) {
        return false;
    }

    f.on_plugin_activated = function(crsaPage, init_done_func) {
        if(wp) {
            var wpplugin = pinegrow.findFrameworkByKey('wordpress.pinegrow');
            setTimeout(function() {
                if(wpplugin) crsaPage.addFramework(wpplugin);
            }, 100);
            if(crsaPage.sourceNode) {
                var html = crsaPage.sourceNode.findOne('html');
                if(html && !html.hasAttr('wp-site')) {
                    html.setAttr('wp-site');
                    html.setAttr('wp-site-is-master-page');
                    //$.fn.crsa('updateStructureAndWireAllElemets', crsaPage.$iframe);
                    //pinegrow.setNeedsUpdate(null, true);
                }
            }
        }
        if(init_done_func) init_done_func(f);
    }

    f.on_can_save_page = function(crsaPage, replyObject) {
        if(!crsaIsBig()) {
            replyObject.save = false;
            replyObject.reason += '<p>Saving pages based on <b>Bootstrap Blocks</b> is <b>disabled in trial mode</b>.</p><p>To save the Blocks page, please purchase a license and activate Pinegrow. You can do that without quiting Pinegrow, so your current work will not be lost.</p><p>If you\'re using Bootstrap Blocks for WordPress you can still export the theme using WordPress -&gt; Export theme.</p>';
        }
    }

    var fs = require('fs');
    var path = require('path');

    var source_relative = 'code/';

    //Tell Pinegrow about the framework
    pinegrow.addFramework(f);

    var combined_css = '';
    var combined_css_file_included = {};

    var res_owl = [
        new PgComponentTypeResource('css', 'css/owl.carousel.css'),
        new PgComponentTypeResource('css', 'css/owl.transitions.css'),
        new PgComponentTypeResource('js', 'js/owl.carousel.min.js')
    ]

    var res_magnificent_popup = [
        new PgComponentTypeResource('css', 'css/magnific-popup.css'),
        new PgComponentTypeResource('js', 'js/jquery.magnific-popup.min.js')
    ]

    var res_headroom = [
        new PgComponentTypeResource('js', 'js/headroom.js'),
        new PgComponentTypeResource('js', 'js/jquery.headroom.js')
    ]

    var res_countdown = [
        new PgComponentTypeResource('js', 'js/count.down.min.js')
    ]

    var res_counter = [
        new PgComponentTypeResource('js', 'js/jquery.counterup.min.js'),
        new PgComponentTypeResource('js', 'js/waypoints.min.js')
    ]

    var res_gallery = [
        new PgComponentTypeResource('js', 'js/jquery.isotope.min.js'),
        new PgComponentTypeResource('js', 'js/jquery.magnific-popup.min.js')
    ]

    var res_contact = [
        new PgComponentTypeResource('js', 'js/sendmail.js')
    ]

    var res_map = [
        new PgComponentTypeResource('js', 'https://maps.google.com/maps/api/js?sensor=true')
    ]

    var components_map = {};

    var getComponent = function(type) {
        return components_map[type_prefix + '.' + type];
    }

    var ifType = function(type, c, func) {
        if(c.type == type_prefix + '.' + type) func(c);
    }

    var showRefreshMessage = function(what, single) {
        if(!what) what = 'the element';
        pinegrow.showQuickMessage('<b>Refresh page (CMD + R)</b> to activate ' + what + '.', 3000, single);
    }

    var removeWPActions = function(pgel) {
        var remove = [];
        pgel.walkSelfAndChildren(function(node) {
            node.removeAttrIfStartsWith('wp-');
            if(node.tagName == 'php') {
                remove.push(node);
            }
            return true;
        });
        for(var i = 0; i < remove.length; i++) {
            remove[i].remove();
        }
    }

    f.pgbCreateComponent = function(source_url, selector, name, transform_code) {
        var clist = [];
        var sourceNode = pgbGetSourceNode(source_url);
        var list = sourceNode.find(selector);
        for(var i = 0; i < list.length; i++) {
            var pgel = list[i];
            var suff = list.length > 1 ? '-' + (i+1) : '';
            var key = selector.replace('.', '') + suff;
            var type = type_prefix + '.' + key;
            var c = new PgComponentType(type, name + suff);
            c.selector = selector;

            if(list.length > 1) {
                c.selector += suff;
                pgel.addClass(c.selector.replace('.',''));
            }
            c.parent_selector = 'body';
            c.sections = {};

            if(transform_code) transform_code(pgel, c, i);

            if(!wp) removeWPActions(pgel);

            c.code = pgel.toStringOriginal(true);

            c.code = c.code.replace(/Bootstrap Starter Kit/ig, 'Pinegrow Blocks').replace(/bskit/ig, 'pgblocks').replace(/bootstrapstarterkit\.com/ig, 'example.com').replace(/bskit\-/ig, 'pgblocks-').replace(/in london/ig,'on Planet Earth').replace(/Bootstrap Startup Kit/ig, 'Bootstrap Blocks').replace('https://creativemarket.com/theme_spirit', '#').replace(/exclusively at Creative Market/ig, 'in Pinegrow Web Editor');
            c.preview_image = c.type.replace('.wp.', '.') + '.png';
            c.button_image = c.preview_image;

            c.tags = 'block';

            var bck_el = pgel.findOne('.background-image-holder');
            if(bck_el) {
                addBackgroundControl(c, '.background-image-holder');
            }

            f.addComponentType(c);

            clist.push(c);

            components_map[c.type] = c;
        }
        var a = source_url.split('/');
        processCSSFile(a[0], a[1].replace('.html', '.css'));

        return clist;
    }

    var processCSSFile = function(dir, name) {
        var css_file = f.getResourceFile(source_relative + dir + '/css/' + name);
        if(!(css_file in combined_css_file_included)) {
            try {
                var css = fs.readFileSync( css_file, {encoding: 'utf8'});
                combined_css += css;
                combined_css_file_included[ css_file ] = true;
            } catch(err) {}
        }
    }

    var addTo = function(list, new_list) {
        for(var i = 0; i < new_list.length; i++) {
            list.push(new_list[i]);
        }
    }

    var addBackgroundControl = function(c, selector) {
        c.sections[c.type + '.bck'] = {
            name : 'Background image',
            fields : {
                'pg.blocks.bck.image' : {
                    type : 'image',
                    name: 'Image',
                    action : 'custom',
                    get_value: function(obj) {
                        var $el = obj.data;
                        if(selector) $el = $el.find(selector);
                        var pgel = new pgQuery($el);
                        var style = pgel.attr('style');
                        if(style) {
                            var m = style.match(/background\-image\:\s*url\(([^\)]*)\)\;?/);
                            if(m) {
                                var url = m[1].replace(/['"]/g, '');
                                return url;
                            }
                        }
                        return null;
                    },
                    set_value: function(obj, value, values, oldValue, eventType) {
                        var $el = obj.data;
                        if(selector) $el = $el.find(selector);
                        var pgel = new pgQuery($el);
                        var style = pgel.attr('style') || '';
                        style = style.replace(/background\-image\:\s*url\([^\)]*\)\;?/, '');
                        if(value) {
                            style += 'background-image:url(\'' + value + '\');';
                        }
                        pgel.attr('style', style);
                        return value;
                    }
                },
                'pg.blocks.bck.cover' : {
                    type: 'checkbox',
                    name: 'Image covers area',
                    action: 'apply_class',
                    value: 'bg-image-cover'
                }
            }
        }
    }

    var source_base = f.getResourceUrl(source_relative);

    var pgbGetSourceFileUrl = function( fn ) {
        return source_base + fn;
    }

    var source_cache = {};

    var pgbGetSourceNode = function(fn) {
        if(!(fn in source_cache)) {
            source_cache[fn] = pinegrow.getSourceNodeOfUrl( pgbGetSourceFileUrl( fn ), true);
        }
        return source_cache[fn];
    }

    var pgbAddSection = function(key, name, list) {
        var section = new PgFrameworkLibSection(type_prefix + '.' + key, name);
        section.setComponentTypes(list);
        f.addLibSection(section);
    }

    //====================
    //Headers
    var headers = [];

    for(var i = 1; i <= 3; i++) {
        (function(i) {
            addTo(headers, f.pgbCreateComponent( '1-header/header-' + i + '.html', 'header', 'Header ' + i, function(pgel, c) {
                pgel.addClass('header-' + i);
                c.selector = '.header-' + i;
                c.type += '-' + i;
                c.name = 'Header ' + i;

                if(i == 3) {
                    addBackgroundControl(c, '.hero');

                    c.on_inserted = function($el, crsaPage) {
                        pinegrow.executeScriptInPage(crsaPage, 'initHeader3();');
                    }
                }
            } ));
        })(i);
    }
    pgbAddSection('headers', 'Headers', headers);
    //End headers


    //====================
    //Promos
    var promos = [];

    for(var i = 1; i <= 3; i++) {
        (function(i) {
            addTo(promos, f.pgbCreateComponent( '2-promo/promo-1.html', '.promo-' + i, 'Promo ' + i, function(pgel, c) {
                addBackgroundControl(c);

                ifType('promo-2', c, function() {
                    c.sections['pg.blocks.promo2'] = {
                        name : 'Countdown options',
                        fields : {
                            'pg.blocks.promo2.enddate' : {
                                'type' : 'text',
                                'name' : 'End date',
                                'action' : 'element_attribute',
                                live_update: true,
                                attribute: 'data-end-date',
                                placeholder: f.textForExample('Jan 20, 2016'),
                                on_changed : function(obj, prop, value, oldValue, fieldDef, $field, eventType, values, crsaPage) {
                                    showRefreshMessage(' the countdown', true);
                                }
                            }
                        }
                    }
                })

            } ));
        })(i);
    }
    //countdown
    getComponent('promo-2').on_inserted = function($el, cp) {
        cp.refresh();
    }

    pgbAddSection( 'promos', 'Promos', promos);


    //====================
    //Content
    var contents = [];

    var content_counts = [9, 10, 11];

    for(var n = 0; n < content_counts.length; n++) {
        for(var i = 1; i <= content_counts[n]; i++) {
            (function(i) {
                addTo(contents, f.pgbCreateComponent( '3-content-blocks/content-blocks-' + (n + 1) + '.html', '.content-' + (n + 1) + '-' + i, 'Content ' + (n + 1) + '-' + i, function(pgel, c) {
                    addBackgroundControl(c);

                    ifType('content-2-4', c, function() {
                        var slider = pgel.findOne('#quote-carousel');
                        slider.addClass('quote-carousel');
                        slider.removeAttr('id');
                    })
                } ));
            })(i);
        }
    }
    //testimonials slider
    getComponent('content-2-4').on_inserted = function($el, cp) {
        //showRefreshMessage('the slider');
        cp.refresh();
    }

    pgbAddSection( 'content', 'Content blocks', contents);


    //====================
    //Gallery
    var galleries = [];

    var galleries_keys = ['1-1', '1-2', '1-3', '2'];

    var c = new PgComponentType(type_prefix + '.gallery.item', 'Gallery item');
    c.selector = '.gallery-item-wrapper';
    c.parent_selector = '.gallery-container';
    c.sections = {};

    c.sections['pg.blocks.gallery.item'] = {
        name : 'Gallery item options',
        fields : {
            'pg.blocks.gallery.item.thumb' : {
                type : 'image',
                name: 'Thumbnail',
                action : 'custom',
                get_value: function(obj) {
                    var $el = obj.data;
                    var pgel = new pgQuery($el);
                    return pgel.find('img').attr('src');
                },
                set_value: function(obj, value, values, oldValue, eventType) {
                    var $el = obj.data;
                    var pgel = new pgQuery($el);
                    pgel.find('img').attr('src', value);
                    return value;
                }
            },
            'pg.blocks.gallery.item.image' : {
                type : 'image',
                name: 'Image',
                action : 'custom',
                get_value: function(obj) {
                    var $el = obj.data;
                    var pgel = new pgQuery($el);
                    return pgel.find('.gallery-zoom').attr('href');
                },
                set_value: function(obj, value, values, oldValue, eventType) {
                    var $el = obj.data;
                    var pgel = new pgQuery($el);
                    pgel.find('.gallery-zoom').attr('href', value);
                    return value;
                }
            },
            'pg.blocks.gallery.item.link' : {
                type : 'text',
                name: 'Link',
                action : 'custom',
                get_value: function(obj) {
                    var $el = obj.data;
                    var pgel = new pgQuery($el);
                    return pgel.find('.gallery-link').attr('href');
                },
                set_value: function(obj, value, values, oldValue, eventType) {
                    var $el = obj.data;
                    var pgel = new pgQuery($el);
                    pgel.find('.gallery-link').attr('href', value);
                    return value;
                }
            },
            'pg.blocks.gallery.item.alt' : {
                type : 'text',
                name: 'Caption',
                action : 'custom',
                get_value: function(obj) {
                    var $el = obj.data;
                    var pgel = new pgQuery($el);
                    return pgel.find('h5').html();
                },
                set_value: function(obj, value, values, oldValue, eventType) {
                    var $el = obj.data;
                    var pgel = new pgQuery($el);
                    pgel.find('img').attr('alt', value);
                    pgel.find('h5').html(value);
                    return value;
                }
            }
        }
    }

    c.code = '<div></div>';

    c.tags = 'block';
    f.addComponentType(c);


    for(var i = 1; i <= 3; i++) {
        (function(i) {
            addTo(galleries, f.pgbCreateComponent( '4-gallery/gallery-1-' + i + '.html', '.gallery-1', 'Gallery 1', function(pgel, c) {
                pgel.addClass('gallery-1-' + i);
                c.selector = '.gallery-1-' + i;
                c.type += '-' + i;
                c.name = 'Gallery 1-' + i;

                c.on_inserted = function($el, cp) {
                    cp.refresh();
                }

                var iso = pgel.findOne('#isotope-gallery-container');
                if(iso) {
                    iso.addClass('gallery-container');
                }
                /*
                 c.action_menu = {
                 'add' : ['pg.blocks.gallery.item'],
                 'on_add' : function($el, $new, newdef, prepend) {
                 var pgel = new pgQuery($el);
                 var pgli = pgel.find('.gallery-container');
                 var pgnew = new pgQuery($new);

                 if(prepend) {
                 pgli.prepend(pgnew);
                 } else {
                 pgli.append(pgnew);
                 }
                 }
                 },*/
                addBackgroundControl(c);
            } ));
        })(i);
    }
    addTo(galleries, f.pgbCreateComponent( '4-gallery/gallery-2.html', '.gallery-2', 'Gallery 2', function(pgel, c) {
        c.on_inserted = function($el, cp) {
            cp.refresh();
        }
        addBackgroundControl(c);
    } ))

    processCSSFile('4-gallery', 'gallery-1.css');
    processCSSFile('4-gallery', 'gallery-2.css');

    pgbAddSection( 'gallery', 'Galleries', galleries);

    //=================
    //Teams

    var teams = [];

    (function(i) {
        addTo(teams, f.pgbCreateComponent( '5-team/team-1.html', '.team-1', 'Team 1', function(pgel, c) {
            //addBackgroundControl(c);
        } ));
    })(1);

    (function(i) {
        addTo(teams, f.pgbCreateComponent( '5-team/team-2.html', '.team-2', 'Team 2', function(pgel, c) {
            //addBackgroundControl(c);
        } ));
    })(2);

    pgbAddSection( 'teams', 'Team', teams);


    //=================
    //Pricing tables

    var pricing = [];

    addTo(pricing, f.pgbCreateComponent( '6-pricing-tables/pricing-tables-1.html', '.pricing-table-1', 'Pricing table 1', function(pgel, c) {
        //addBackgroundControl(c);
    } ));

    addTo(pricing, f.pgbCreateComponent( '6-pricing-tables/pricing-tables-2.html', '.pricing-table-2', 'Pricing table 2', function(pgel, c) {
        //addBackgroundControl(c);
    } ));

    var c = new PgComponentType(type_prefix + '.pricing.block', 'Price block');
    c.selector = '.price-block';
    c.sections = {};

    var ribbons = ['best-value','exclusive','five-stars','new','popular','premium','red-hot','super-cool'];

    var get_ribbon = function($el) {
        for(var i = 0; i < ribbons.length; i++) {
            if($el.hasClass(ribbons[i])) return ribbons[i];
        }
        return null;
    }

    var ribbons_options = [];
    for(var i = 0; i < ribbons.length; i++) {
        ribbons_options.push({key: ribbons[i], name: ribbons[i]});
    }

    c.sections['pg.blocks.pricing.block'] = {
        name : 'Price block options',
        fields : {
            'pg.blocks.pricing.block.ribbon' : {
                'type' : 'select',
                'name' : 'Ribbon',
                'action' : 'custom',
                options: ribbons_options,
                show_empty: true,
                get_value: function(obj) {
                    var $el = obj.data;
                    $el = $el.find('.ribbon');
                    if($el.length) {
                        return get_ribbon($el);
                    }
                    return null;
                },
                set_value: function(obj, value, values, oldValue, eventType) {
                    var $el = obj.data;
                    var pgel = new pgQuery($el);
                    var $r = $el.find('.ribbon');
                    var rel;
                    if(value) {
                        if($r.length) {
                            rel = new pgQuery($r);
                            var cls = get_ribbon($r);
                            if(cls) rel.removeClass(cls);
                        } else {
                            rel = new pgQuery().create('<div class="ribbon"></div>');
                            pgel.prepend(rel);
                        }
                        rel.addClass(value);
                    } else {
                        if($r.length) {
                            rel = new pgQuery($r);
                            rel.remove();
                        }
                    }
                    return value;
                }
            }
        }
    }

    c.code = '<div></div>';

    c.tags = 'block';
    f.addComponentType(c);

    pgbAddSection( 'pricing', 'Pricing tables', pricing);


    //=================
    //Contact

    var contacts = [];

    for(var i = 1; i <= 3; i++) {
        if(i == 2) continue;
        (function(i) {
            addTo(contacts, f.pgbCreateComponent( '7-contact/contact-' + i + '.html', '.contact-' + i, 'Contact ' + i, function(pgel, c) {
                addBackgroundControl(c);
                var map = pgel.findOne('.map');
                if(map) map.remove();
            } ));
        })(i);
    }
    var c = new PgComponentType(type_prefix + '.map', 'Map');
    c.selector = '.map';
    c.parent_selector = 'body,.container,div[class*="col-"]';
    c.sections = {};

    c.sections['pg.blocks.map'] = {
        name : 'Map options',
        fields : {
            'pg.blocks.map.latitude' : {
                'type' : 'text',
                'name' : 'Latitude',
                'action' : 'element_attribute',
                attribute: 'data-map-lat',
                placeholder: f.textForExample('51.5111507'),
                on_changed : function(obj, prop, value, oldValue, fieldDef, $field, eventType, values, crsaPage) {
                    showRefreshMessage(' the map', true);
                }
            },
            'pg.blocks.map.longitude' : {
                'type' : 'text',
                'name' : 'Longitude',
                'action' : 'element_attribute',
                attribute: 'data-map-long',
                placeholder: f.textForExample('-0.1239844'),
                on_changed : function(obj, prop, value, oldValue, fieldDef, $field, eventType, values, crsaPage) {
                    showRefreshMessage(' the map', true);
                }
            },
            'pg.blocks.map.zoom' : {
                'type' : 'text',
                'name' : 'Zoom',
                'action' : 'element_attribute',
                attribute: 'data-map-zoom',
                placeholder: 'from 0 to 20',
                on_changed : function(obj, prop, value, oldValue, fieldDef, $field, eventType, values, crsaPage) {
                    showRefreshMessage(' the map', true);
                }
            }
        }
    }
    c.on_inserted = function($el, crsaPage) {
        pinegrow.executeScriptInPage(crsaPage, 'initMaps();');
        pinegrow.showAlert('<p>Google Maps require Google Maps API key. You can get the key from Google for free and encode it into &lt;script&gt; tag where Google Maps Javascript is linked to the page.</p><p><a href="https://developers.google.com/maps/documentation/javascript/get-api-key#key" class="external">Get the key and learn how to use it.</a></p>');
        //showRefreshMessage(' the map', true);
    }

    c.code = '<div class="map min-height-500px"' + (wp ? ' wp-cz-section="blocks_map" wp-cz-section-title="Map" wp-cz-control="blocks_map_lat" wp-cz-control-label="Latitude" wp-cz-control-input-placeholder="51.5111507" wp-cz-control-section="blocks_map" wp-cz-theme-mod="blocks_map_lat" wp-cz-theme-mod-set="attr" wp-cz-theme-mod-set-attr="data-map-lat" wp-cz-control-2="blocks_map_long" wp-cz-control-label-2="Longitude" wp-cz-control-section-2="blocks_map" wp-cz-control-input-placeholder-2="-0.123" wp-cz-theme-mod-attr="blocks_map_long" wp-cz-theme-mod-attr-set-attr="data-map-long" wp-cz-control-3="blocks_map_zoom" wp-cz-control-label-3="Zoom" wp-cz-control-section-3="blocks_map" wp-cz-control-input-placeholder-3="15" wp-cz-theme-mod-style="blocks_map_zoom" wp-cz-theme-mod-style-set="attr" wp-cz-theme-mod-style-set-attr="data-map-zoom" wp-call-function="esc_url( get_template_directory_uri().\'/images/map-pin.png\' )" wp-call-function-echo="true" wp-call-function-set="attr" wp-call-function-set-attr="data-marker-image"' : '') + '></div>';

    c.preview_image = c.type.replace('.wp.', '.') + '.png';
    c.button_image = c.preview_image;

    c.tags = 'block';
    c.take_photo_script = 'initMaps();';
    c.take_photo_delay = 4000;

    f.addComponentType(c);

    contacts.push(c);


    pgbAddSection( 'contact', 'Contacts', contacts);



    //==================
    //Blog

    var blogs = [];

    addTo(blogs, f.pgbCreateComponent( '8-blog/blog-1.html', '.blog-1', 'Blog 1', function(pgel, c) {
        //addBackgroundControl(c);
    } ));

    pgbAddSection( 'blogs', 'Blogs', blogs);



    //==================
    //Footer

    var footers = [];

    addTo(footers, f.pgbCreateComponent( '9-footer/footer-1.html', 'section', 'Footer 1', function(pgel, c, i) {
        i = i + 1;
        pgel.addClass('footer-wrap-1-' + i);
        pgel.removeClass('section-' + i);
        c.selector = '.footer-wrap-1-' + i;
        //addBackgroundControl(c);
    } ));

    addTo(footers, f.pgbCreateComponent( '9-footer/footer-1.html', '.copyright-bar', 'Copyright 1', function(pgel, c, i) {
        //addBackgroundControl(c);
    } ));

    addTo(footers, f.pgbCreateComponent( '9-footer/footer-1.html', '.copyright-bar-2', 'Copyright 2', function(pgel, c, i) {
        //addBackgroundControl(c);
    } ));

    pgbAddSection( 'footers', 'Footers', footers);



    //=================
    //Shop

    /*
     var shops = [];

     for(var i = 1; i <= 7; i++) {
     (function(i) {
     addTo(shops, f.pgbCreateComponent( '10-shop/shop-1.html', '.shop-1-' + i, 'Shop ' + i, function(pgel, c) {
     //addBackgroundControl(c);
     } ));
     })(i);
     }

     pgbAddSection( 'shops', 'Shop', shops);
     */


    var body = {
        'type' : 'pgblocks.body',
        'selector' : 'body',
        'name' : 'Body',
        //'display_name' : 'tag',
        //'priority' : 1000,
        not_main_type: true,
        'sections' : {
        }
    }
    addBackgroundControl(body);
    f.addComponentType(body);

    //Add common sections to all elements

    var colors = [ 'black', 'white', 'offwhite', 'clouds', 'silver', 'concrete', 'asbestos', 'tan', 'pewter', 'moonlight', 'deepocean', 'turquoise', 'aqua', 'sunflower', 'orange', 'sienna', 'milanored', 'river', 'marina', 'deco', 'crete', 'guardsman', 'pomegranate', 'finn', 'tamarind'];

    var colors_options = [];
    var bck_options = [{key: 'bg-transparent', name: 'transparent'}];
    var hover_colors_options = [];
    var hover_bck_options = [{key: 'bg-transparent-hover', name: 'transparent'}];

    for(var i = 0; i < colors.length; i++) {
        colors_options.push({key: colors[i], name: colors[i]});
        bck_options.push({key: 'bg-' + colors[i], name: colors[i]});
        hover_colors_options.push({key: colors[i] + '-hover', name: colors[i]});
        hover_bck_options.push({key: 'bg-' + colors[i] + '-hover', name: colors[i]});
    }
    var tag = {
        'type' : 'tag',
        'selector' : function($el) { return true },
        'name' : 'Div',
        'display_name' : 'tag',
        'priority' : 1000,
        not_main_type: true,
        'sections' : {
            'pg.blocks.common' : {
                name : 'Blocks options',
                fields : {
                    'pg.blocks.common.color' : {
                        'type' : 'select',
                        'name' : 'Text color',
                        'action' : 'apply_class',
                        show_empty: true,
                        options: colors_options
                    },
                    'pg.blocks.common.colorhover' : {
                        'type' : 'select',
                        'name' : 'Text color (hovered)',
                        'action' : 'apply_class',
                        show_empty: true,
                        options: hover_colors_options
                    },
                    'pg.blocks.common.bgcolor' : {
                        'type' : 'select',
                        'name' : 'Background color',
                        'action' : 'apply_class',
                        show_empty: true,
                        options: bck_options
                    },
                    'pg.blocks.common.bgcolorhover' : {
                        'type' : 'select',
                        'name' : 'Background color (hovered)',
                        'action' : 'apply_class',
                        show_empty: true,
                        options: hover_bck_options
                    },
                    'pg.blocks.common.padtop' : {
                        'type' : 'select',
                        'name' : 'Padding top',
                        'action' : 'apply_class',
                        show_empty: true,
                        options: [
                            {key: 'pad0', name: '0px'},
                            {key: 'pad5', name: '5px'},
                            {key: 'pad10', name: '10px'},
                            {key: 'pad15', name: '15px'},
                            {key: 'pad20', name: '20px'},
                            {key: 'pad25', name: '25px'},
                            {key: 'pad30', name: '30px'},
                            {key: 'pad45', name: '45px'},
                            {key: 'pad60', name: '60px'},
                            {key: 'pad90', name: '90px'}
                        ]
                    },
                    'pg.blocks.common.padbottom' : {
                        'type' : 'select',
                        'name' : 'Padding bottom',
                        'action' : 'apply_class',
                        show_empty: true,
                        options: [
                            {key: 'pad-bottom0', name: '0px'},
                            {key: 'pad-bottom5', name: '5px'},
                            {key: 'pad-bottom10', name: '10px'},
                            {key: 'pad-bottom15', name: '15px'},
                            {key: 'pad-bottom20', name: '20px'},
                            {key: 'pad-bottom25', name: '25px'},
                            {key: 'pad-bottom30', name: '30px'},
                            {key: 'pad-bottom45', name: '45px'},
                            {key: 'pad-bottom60', name: '60px'},
                            {key: 'pad-bottom90', name: '90px'}
                        ]
                    },
                    'pg.blocks.common.margintop' : {
                        'type' : 'select',
                        'name' : 'Margin top',
                        'action' : 'apply_class',
                        show_empty: true,
                        options: [
                            {key: 'margin-top0', name: '0px'},
                            {key: 'margin-top5', name: '5px'},
                            {key: 'margin-top10', name: '10px'},
                            {key: 'margin-top15', name: '15px'},
                            {key: 'margin-top20', name: '20px'},
                            {key: 'margin-top25', name: '25px'},
                            {key: 'margin-top30', name: '30px'},
                            {key: 'margin-top45', name: '45px'},
                            {key: 'margin-top60', name: '60px'},
                            {key: 'margin-top90', name: '90px'}
                        ]
                    },
                    'pg.blocks.common.marginbottom' : {
                        'type' : 'select',
                        'name' : 'Margin bottom',
                        'action' : 'apply_class',
                        show_empty: true,
                        options: [
                            {key: 'margin-bottom0', name: '0px'},
                            {key: 'margin-bottom5', name: '5px'},
                            {key: 'margin-bottom10', name: '10px'},
                            {key: 'margin-bottom15', name: '15px'},
                            {key: 'margin-bottom20', name: '20px'},
                            {key: 'margin-bottom25', name: '25px'},
                            {key: 'margin-bottom30', name: '30px'},
                            {key: 'margin-bottom45', name: '45px'},
                            {key: 'margin-bottom60', name: '60px'},
                            {key: 'margin-bottom90', name: '90px'}
                        ]
                    },
                    'pg.blocks.common.minheight' : {
                        'type' : 'select',
                        'name' : 'Min height',
                        'action' : 'apply_class',
                        show_empty: true,
                        options: [
                            {key: 'min-height-100px', name: '100px'},
                            {key: 'min-height-200px', name: '200px'},
                            {key: 'min-height-300px', name: '300px'},
                            {key: 'min-height-400px', name: '400px'},
                            {key: 'min-height-500px', name: '500px'},
                            {key: 'min-height-600px', name: '600px'},
                            {key: 'min-height-700px', name: '700px'},
                            {key: 'min-height-800px', name: '800px'}
                        ]
                    },
                    'pg.blocks.common.minheight-xs' : {
                        'type' : 'select',
                        'name' : 'Min height on mobile',
                        'action' : 'apply_class',
                        show_empty: true,
                        options: [
                            {key: 'min-height-xs-100px', name: '100px'},
                            {key: 'min-height-xs-200px', name: '200px'},
                            {key: 'min-height-xs-300px', name: '300px'},
                            {key: 'min-height-xs-400px', name: '400px'},
                            {key: 'min-height-xs-500px', name: '500px'},
                            {key: 'min-height-xs-600px', name: '600px'},
                            {key: 'min-height-xs-700px', name: '700px'},
                            {key: 'min-height-xs-800px', name: '800px'}
                        ]
                    },
                    'pg.blocks.common.noshadow' : {
                        type: 'checkbox',
                        name: 'No shadow',
                        action: 'apply_class',
                        value: 'no-shadow'
                    },
                    'pg.blocks.common.softscroll' : {
                        type: 'checkbox',
                        name: 'Soft scroll #links',
                        action: 'apply_class',
                        value: 'soft-scroll'
                    }
                }
            }
        }
    }
    f.addComponentType(tag);



    var takePhotos = function(list) {

        var resizeImage = function(file, w, h, new_file) {
            crsaResizeImage(file, w, h, new_file);
        }

        var url = f.getResourceUrl('../BootstrapStarterKit/HTML Files/Skeleton File/photo.html');

        var gui = require('nw.gui');


        var current = 0;

        var preview_win = gui.Window.open(url, {
            width: 1024,
            height: 600
        });

        var chrome_width;
        var chrome_height;
        var $body;
        var $photo;

        var loaded = false;

        preview_win.on('loaded', function() {
            if(loaded) return;
            loaded = true;

            $body = $(preview_win.window.document.body);
            $photo = $body.find('#photo');

            var width = $body.width();
            chrome_width = preview_win.width - width;
            chrome_height = preview_win.height - $body.height();

            $body.removeAttr('style');
            $body.closest('html').removeAttr('style');

            var takePhoto = function() {
                $photo.html(list[current].code);
                console.log('SET - ' + list[current].type);

                if(list[current].take_photo_script) {
                    var scr = preview_win.window.document.createElement('script');
                    scr.async = false;
                    scr.text = list[current].take_photo_script;
                    $body.get(0).appendChild(scr);

                }

                setTimeout(function() {
                    var w = $photo.outerWidth(true);
                    w = 1024;
                    var h = $photo.outerHeight();
                    //preview_win.width = w + chrome_width;
                    preview_win.height = h + chrome_height;

                    console.log('PHOTO - ' + list[current].type);

                    preview_win.capturePage(function(buffer){
                        var big_file = f.getResourceFile('images/' + list[current].type + '.png');
                        fs.writeFileSync( big_file, buffer);

                        resizeImage(big_file, parseInt(w/1), parseInt(h/1), big_file);
                        console.log('DONE - ' + list[current].type);
                        current++;
                        if(current < list.length) {
                            takePhoto();
                        }
                    }, { format : 'png', datatype : 'buffer'} );

                }, list[current].take_photo_delay || 1000);
            }

            takePhoto();
        })
    }
    //takePhotos( contacts );

    if(!wp && false) {
        var photo_list = [];
        for(var t in f.component_types) {
           photo_list.push( f.component_types[t] );
        }


        takePhotos( photo_list );
    }

    //takePhotos([ getComponent('header-3')]);

    /*
     var css_file = f.getResourceFile(source_relative + '../Skeleton File/css/style-library-1.css');
     combined_css = fs.readFileSync( css_file, {encoding: 'utf8'});

     var colors = combined_css.match(/#[0-9abcdef]+/ig);
     //console.log(colors);
     var col = new less.tree.Color('FFFFFF');
     console.log(less.tree.functions.darken(col, {value: 0.5}));

     var colors_map = {};
     for(var i = 0; i < colors.length; i++) {
     if(colors[i].length > 3) {
     colors[i] = colors[i].toUpperCase();
     if(colors[i].length == 4) colors[i] += colors[i].substr(1);
     colors_map[colors[i]] = colors_map[colors[i]] ? colors_map[colors[i]] + 1 : 1;
     }
     }
     console.log(colors_map);

     colors = [];

     while(true) {
     var max = 0;
     var max_color = null;
     for(var color in colors_map) {
     if(colors_map[color] > max) {
     max = colors_map[color];
     max_color = color;
     }
     }
     if(max_color !== null) {
     delete colors_map[max_color];
     if(max_color != '#FFFFFF') {
     colors.push(max_color);
     }
     } else {
     break;
     }
     }

     console.log(colors);

     var less_code = combined_css;
     var less_vars = '';

     for(var i = 0; i < colors.length; i++) {
     less_code = less_code.replace(new RegExp(colors[i], 'ig'), '@color' + (i+1));
     less_vars += '@color' + (i+1) + ': ' + colors[i] + ';\n'
     }

     less_code = less_vars + '\n\n' + less_code;
     */

    combined_css = combined_css.replace(/bskit\-/ig, 'pgblocks-');

    combined_css = combined_css.replace(/\/\* DEMO PAGE STYLES [\s\S]*? DEMO STYLES \*\//ig, '');

    var css_file = f.getResourceFile(source_relative + '../template/css/blocks.css');
    //fs.writeFileSync( css_file, combined_css, {encoding: 'utf8'});

    //var less_file = f.getResourceFile(source_relative + '../Skeleton File/css/style-library-1.less');
    //fs.writeFileSync( less_file, less_code, {encoding: 'utf8'});

    //Register starting page template
    f.addTemplateProjectFromResourceFolder('template', null, 1, function(node) {
        if(node.name == 'inc' && !wp) {
            node.required = false;
            return false;
        }
    });

    var toLocalPath = function(p) {
        return p.replace(/\//g, path.sep);
    }

    //add resources
    var res_files = ['css/blocks.css', 'css/plugins.css', 'css/style-library-1.css', 'images', 'js/plugins.js', 'js/bskit-scripts.js'];
    for(var i = 0; i < res_files.length; i++) {
        var file = f.getResourceFile('template/' + res_files[i]);
        var r = new PgComponentTypeResource(file);
        r.relative_url = res_files[i];
        r.source = toLocalPath(file);
        r.footer = res_files[i].indexOf('.js') >= 0;
        f.resources.add(r);
    }
    var res = new PgComponentTypeResource('http://fonts.googleapis.com/css?family=Open+Sans:300italic,400italic,600italic,700italic,400,300,600,700');
    res.type = 'text/css';
    f.resources.add(res);

    res = new PgComponentTypeResource('http://fonts.googleapis.com/css?family=Lato:300,400,700,300italic,400italic,700italic');
    res.type = 'text/css';
    f.resources.add(res);
    
    res = new PgComponentTypeResource('https://maps.google.com/maps/api/js?sensor=true');
    res.type = 'application/javascript';
    res.footer = true;
    f.resources.add(res);
    
    

    f.resources.description = "CSS and JS files needed for Blocks to work. Placeholder images.";

    if(wp) {
        var res_files = ['inc'];
        for(var i = 0; i < res_files.length; i++) {
            var file = f.getResourceFile('template/' + res_files[i]);
            var r = new PgComponentTypeResource(file);
            r.relative_url = res_files[i];
            r.source = toLocalPath(file);
            r.footer = res_files[i].indexOf('.js') >= 0;
            f.resources.add(r);
        }
        f.on_wp_write_functions_php_section = function(crsaPage, section, obj) {
            switch(section) {
                case 'Include Resources':
                    var res_namespace = crsaPage.getResourceNamespaceForFramework(f, true /* detect */) || '';
                    obj.code = 'require_once "' + res_namespace + 'inc/blocks/wp_blocks.php";\n' + obj.code;
                    break;
                case 'Customizer Controls':
                    var res_namespace = crsaPage.getResourceNamespaceForFramework(f, true /* detect */) || '';
                    obj.code = '\n    require_once "' + res_namespace + 'inc/blocks/wp_blocks_customizer_controls.php";\n' + obj.code;
                    break;
            }
        }
    }
    
    source_cache = {};
}

$(function() {

    //Wait for Pinegrow to wake-up
    $('body').one('pinegrow-ready', function(e, pinegrow) {

        createBlocksPlugin(true, pinegrow);
        createBlocksPlugin(false, pinegrow);

    });
});