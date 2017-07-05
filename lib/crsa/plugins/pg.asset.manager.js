$(function () {
    $('body').one('pinegrow-ready', function (e, pinegrow) {//Wait for Pinegrow to start-up
        var f = new PgFramework('pg.asset.manager', 'Asset manager');
        pinegrow.addFramework(f);

        f.default = true;
        f.show_in_manager = false;

        var PgGoogleFontManager = function () {
            var GOOGLE_FONT_KEY = 'AIzaSyCTphlYszhVyhJKDwKgUDdl64PfPaXxXUI';
            var DEFAULT_TEXT_PREVIEW = "Pinegrow web editor, asset manager.";

            var previewText = DEFAULT_TEXT_PREVIEW;
            var $chached_fonts_ul = null;

            var $advance_settings;

            var getFullOptionGoogleFontLinkURLFor = function (gFont) {
                var apiUrl = [];
                apiUrl.push('http://fonts.googleapis.com/css?family=');
                apiUrl.push(gFont.family.replace(/ /g, '+'));
                var variants = gFont.variants.map(function (variant) {
                    var fontSetting = getFontSettingFromVariant(variant);
                    return fontSetting['font-weight'] + (fontSetting['font-style'] == "italic" ? 'italic' : '');
                })
                apiUrl.push(':' + variants.join(','));
                apiUrl.push('&subset=' + gFont.subsets.join(','));

                return apiUrl.join('');
            }

            var getGoogleFontLinkURLFor = function (gFont) {
                var apiUrl = [];
                apiUrl.push('http://fonts.googleapis.com/css?family=');
                apiUrl.push(gFont.family.replace(/ /g, '+'));
                if (gFont.wanted_weights_and_style && gFont.wanted_weights_and_style.length > 0) {
                    apiUrl.push(":" + gFont.wanted_weights_and_style.join(','));
                }

                if (gFont.wanted_subsets && gFont.wanted_subsets.length > 0) {
                    apiUrl.push("&subset=" + gFont.wanted_subsets.join(','));
                }

                return apiUrl.join('');
            }

            var choosed_fonts = {};

            var page_number = 1;
            var fonts_array = [];
            var final_fonts_array = [];
            var hasNoMorePages = false;
            var checkbox_changed = function () {
                var $li = $(this).closest('li');
                var google_font = final_fonts_array[ parseInt($li.attr('data-index')) ];

                if ($(this).is(':checked')) {
                    choosed_fonts[google_font.family] = google_font;
                    $li.addClass('checked');
                }
                else {
                    if (choosed_fonts[google_font.family]) {
                        delete choosed_fonts[google_font.family];
                    }
                    $li.removeClass('checked');
                }
            }

            var getFontSettingFromVariant = function (variant) {
                var matched = variant.match(/([0-9]+)([a-z]*)/);
                var fontSetting = {};
                if (matched) {
                    fontSetting['font-weight'] = matched[1];
                    fontSetting['font-style'] = (matched[2] ? matched[2] : 'normal');
                }
                else {
                    fontSetting['font-weight'] = "400";
                    if (variant == 'regular') {
                        fontSetting['font-style'] = 'normal';
                    }
                    else if (variant == 'italic') {
                        fontSetting['font-style'] = 'italic';
                    }
                }
                return fontSetting;
            }

            var getSubsetString = function (subset) {
                var subsetWithExt = subset.split('-');
                return crsaCamelize(subsetWithExt[0]) + (subsetWithExt[1] == 'ext' ? ' Extended' : '' );
            }

            var show_advance_settings = function (e) {
                var choosedWeightsAndStyle = [];
                var choosedCharset = [];

                var $li = $(this).closest('li');
                var index = parseInt($li.attr('data-index'));
                var $gfonts_modal = $advance_settings.closest('.gfonts-modal');

                var top = $(this).position().top - 50;
                var left = ($gfonts_modal.width() / 2) - ($advance_settings.width() / 2);

                $advance_settings.css("top", top);
                $advance_settings.css("left", left);
                $advance_settings.html('');

                $advance_settings.addClass('open');
                var google_font = final_fonts_array[ index ];
                var $container = $('<div class="advance-settings-content"></div>').appendTo($advance_settings);

                var $fontStyleSettings = $('<div class="font-style"><h3>Styles</h3></div>').appendTo($container);
                var $table = $('<table width="100%" style="font-family:' + google_font.family + ';"><tbody></tbody></table>').appendTo($fontStyleSettings);
                var $tbody = $table.find('> tbody');

                var variants = google_font.variants;
                for (var i = 0; i < variants.length; i++) {
                    var fontSetting = getFontSettingFromVariant(variants[i]);

                    var $tr = $('<tr style="font-weight:' + fontSetting['font-weight'] + ';font-style:' + fontSetting['font-style'] + ';"></tr>').appendTo($tbody);
                    var $td = $('<td width="30%"></td>').appendTo($tr);
                    $checkbox = $('<input data-font-weight="' + fontSetting['font-weight'] + '" data-font-style="' + fontSetting['font-style'] + '" type="checkbox">').appendTo($td);
                    $('<span> ' + fontSetting['font-weight'] + ' ' + crsaCamelize(fontSetting['font-style']) + '</span>').appendTo($td);
                    var $td = $('<td width="70%">' + previewText + '</td>').appendTo($tr);

                    $checkbox.change(function (argument) {
                        var fontSettingString = $(this).attr('data-font-weight') + ($(this).attr('data-font-style') == 'italic' ? 'italic' : '');

                        if ($(this).is(':checked')) {
                            if (choosedWeightsAndStyle.indexOf(fontSettingString) < 0) {
                                choosedWeightsAndStyle.push(fontSettingString);
                            }
                        }
                        else {
                            var index = choosedWeightsAndStyle.indexOf(fontSettingString);
                            if (index > -1 && index < choosedWeightsAndStyle.length) {
                                choosedWeightsAndStyle.splice(index, 1);
                            }
                        }
                    });

                    var fontSettingString = fontSetting['font-weight'] + (fontSetting['font-style'] == 'italic' ? 'italic' : '');

                    if (google_font.wanted_weights_and_style && google_font.wanted_weights_and_style.indexOf(fontSettingString) > -1) {
                        $checkbox.prop("checked", true).change();
                    }

                    if (fontSetting['font-weight'] == "400" && fontSetting['font-style'] == "normal") {
                        $checkbox.prop("checked", true).change();
                    }
                }

                var $fontCharsetSettings = $('<div class="font-charset"><h3>Character sets</h3></div>').appendTo($container);

                var updateAndGetChoosedCharset = function () {
                    var accepted = [];
                    var $checkboxes = $fontCharsetSettings.find('[type="checkbox"]');
                    $checkboxes.each(function (i, checkbox) {
                        if (!$(checkbox).is(':disabled') && $(checkbox).is(':checked')) {
                            accepted.push($(checkbox).attr('data-subset'));
                        }
                    });

                    var $latinCheckbox = $fontCharsetSettings.find('[data-subset="latin"]');
                    if (accepted.length > 0) {
                        if (accepted.length == 1 && accepted[0] == 'latin') {
                            $latinCheckbox.attr('disabled', '');
                            accepted = [];
                        }
                        else if ($latinCheckbox.is(':disabled')) {
                            $latinCheckbox.removeAttr('disabled');
                            if ($latinCheckbox.is(':checked')) {
                                accepted.push('latin');
                            }
                        }
                    }
                    else {
                        $latinCheckbox.prop("checked", true).attr('disabled', '');
                    }

                    return accepted;
                }

                var subsets = google_font.subsets;
                for (var i = 0; i < subsets.length; i++) {
                    var subset = subsets[i];
                    var $span = $('<span class="subset-option"></span>').appendTo($fontCharsetSettings);
                    var $checkbox = $('<input data-subset="' + subset + '" type="checkbox">').appendTo($span);
                    var $desc = $('<span> ' + getSubsetString(subset) + '</span>').appendTo($span);

                    if (subset == "latin") {
                        $checkbox.prop("checked", true);
                        $checkbox.attr('disabled', '');
                    }

                    $checkbox.change(function () {
                        choosedCharset = updateAndGetChoosedCharset();
                    });

                    if (google_font.wanted_subsets && google_font.wanted_subsets.indexOf(subset) > -1) {
                        $checkbox.prop("checked", true).change();
                    }
                }

                var $control_container = $('<div class="footer-control clearfix"></div>').appendTo($advance_settings);
                var $accept = $('<button type="button" class="btn btn-primary btn-sm">Accept</button>').appendTo($control_container);
                var $cancel = $('<button type="button" class="btn btn-sm">Cancel</button>').appendTo($control_container);


                $accept.click(function (e) {
                    e.preventDefault();
                    google_font.wanted_weights_and_style = choosedWeightsAndStyle;
                    google_font.wanted_subsets = choosedCharset;
                    $li.find('[type="checkbox"]').prop("checked", true).change();
                    $advance_settings.removeClass('open');
                });

                $cancel.click(function (e) {
                    e.preventDefault();
                    $advance_settings.removeClass('open');
                });

                e.preventDefault();
            }

            var updateGoogleFont = function ($ul) {
                var $modal_body = $ul.closest('.modal-body');
                var $modal_body_div = $modal_body.find('> div');
                var $loading_gif = $modal_body.find('.loading-icon');

                var nextPage = function () {
                    if (hasNoMorePages) return;
                    $loading_gif.show();

                    var start = 20 * (page_number - 1);
                    var end = (20 * page_number);

                    if (start >= final_fonts_array.length) {
                        hasNoMorePages = true;
                        $loading_gif.hide();
                        return;
                    }

                    if (end >= final_fonts_array.length) {
                        end = final_fonts_array.length;
                        hasNoMorePages = true;
                        $loading_gif.hide();
                    }

                    for (var i = start; i < end; i++) {
                        var $li = $('<li data-index="' + i + '"></li>').appendTo($ul);

                        var $input = $('<input type="checkbox">').appendTo($li);
                        var $head = $('head');
                        $head.append('<link href="'+ getFullOptionGoogleFontLinkURLFor(final_fonts_array[i]) +'" rel="stylesheet">');
                        var $h3 = $("<h3 class='font-preview' style='font-family:" + final_fonts_array[i].family + ";'>" + previewText + "</h3>").appendTo($li);
                        var $advance_settings_icon = $('<i class="advance-settings-icon pull-right glyphicon glyphicon-cog"></i>').appendTo($h3);
                        $("<p class='more-info'><b>" + final_fonts_array[i].family + "</b>, category: " + final_fonts_array[i].category + "</p>").appendTo($li);

                        $input.change(checkbox_changed);
                        $advance_settings_icon.click(show_advance_settings);
                    }
                    $chached_fonts_ul = $ul;
                }

                $modal_body.on('scroll', function () {
                    if ($modal_body_div.height() + $modal_body_div.offset().top < 750 && !hasNoMorePages) {
                        page_number++;
                        nextPage();
                    }
                });

                // if ($chached_fonts_ul && $chached_fonts_ul.length > 0) {
                //     $ul.replaceWith($chached_fonts_ul);
                //     $ul = $chached_fonts_ul;
                //     $ul.find('[type="checkbox"]').prop("checked", false);
                //     $ul.find('[type="checkbox"]').change(checkbox_changed);
                //     $ul.find('li').removeClass('checked');
                // }

                if (!fonts_array || fonts_array.length == 0) {
                    $.ajax({
                        type: 'GET',
                        url: 'https://www.googleapis.com/webfonts/v1/webfonts',
                        data: { key : GOOGLE_FONT_KEY },
                        success: function(data) {
                            fonts_array = data.items;
                            final_fonts_array = fonts_array;
                            nextPage();
                        },
                        error: function() {
                            pinegrow.showQuickMessage('There is a problem with calling google fonts');
                        }
                    });
                }
                else if (!$chached_fonts_ul) {
                    nextPage();
                }
            }

            var getFontNameFromURL = function (url) {
                var matched = url.match(/family=([a-zA-Z\+]*)/);
                if (matched && matched.length > 0) {
                    return matched[1].replace(/\+/g, ' ');
                }
                else {
                    return null;
                }
            }

            var addCopyNameIcon = function (data, $el) {
                var name = getFontNameFromURL(data.url);
                if (name) {
                    var $copyIcon = $('<i class="glyphicon glyphicon-copy" title="Copy family name to clipboard"></i>').appendTo($el);
                    $copyIcon.click(function (e) {
                        e.preventDefault();
                        crsaCopyToClipboard(name);
                        pinegrow.showQuickMessage("Font name copied to your clipboard...");
                    })
                }
            }

            var resetAllVariable = function () {
                page_number = 1;
                hasNoMorePages = false;
                $chached_fonts_ul = null;
                final_fonts_array = fonts_array;
                // previewText = DEFAULT_TEXT_PREVIEW;
            }

            this.show = function (done) {
                choosed_fonts = {};
                var $b = $('<div class="gfonts-modal"><p>Choose fonts you want to add to your page</p></div>');

                var $row = $('<div class="row"></div>').appendTo($b);
                var $col1 = $('<div class="col-sm-6 col-xs-12"></div>').appendTo($row);
                var $col2 = $('<div class="col-sm-6 col-xs-12"></div>').appendTo($row);

                var $searchForm = $('<form class="form-inline font-search"><div class="form-group"><label for="search-for-font">Search:</label><input type="search" class="form-control" placeholder="Search by font name..." style="margin: 10px 2px; min-width: 250px" id="search-for-font"></div></form>').appendTo($col1);
                var $searchInput = $searchForm.find('input');

                var $previewTextForm = $('<form class="form-inline font-preview-text"><div class="form-group"><label for="font-preview-text">Preview text:</label><input type="text" class="form-control" placeholder="Preview text..." style="margin: 10px 2px; min-width: 250px" id="font-preview-text"></div></form>').appendTo($col2);
                var $previewTextInput = $previewTextForm.find('input');

                makeAndShowDialog("Google fonts", "Close", "Save", $b, function () {
                    if (done) done([]);
                }, function () {
                    if (done) {
                        var final_choosed_fonts = [];
                        for(var fontName in choosed_fonts) {
                            final_choosed_fonts.push({
                                url: getGoogleFontLinkURLFor(choosed_fonts[fontName]),
                                name: choosed_fonts[fontName].family,
                                action: addCopyNameIcon
                            })
                        }
                        done(final_choosed_fonts);
                    }
                }, null, true);

                var $ul = $('<ul class="gfonts-list"></ul>').appendTo($b);
                $('<center class="loading-icon"><img src="lib/crsa/images/loading.GIF"></center>').appendTo($b);
                $advance_settings = $('<div class="advance-settings"><div class="advance-settings-content"></div></div>').appendTo($b);
                resetAllVariable();
                updateGoogleFont($ul);

                $searchInput.keyup(function () {
                    if (!$searchInput.val()) {
                        resetAllVariable();

                        final_fonts_array = fonts_array;
                    }
                    else {
                        page_number = 1;
                        hasNoMorePages = false;
                        $chached_fonts_ul = null;

                        final_fonts_array = fonts_array.filter(function(font) {
                            if (font.family) return font.family.toLowerCase().match($searchInput.val().toLowerCase());
                        });
                    }
                    $ul.html('');
                    updateGoogleFont($ul);
                });

                $previewTextInput.keyup(function () {
                    if (!$previewTextInput.val()) {
                        previewText = DEFAULT_TEXT_PREVIEW;
                        $ul.find('h3').html(previewText);
                    }
                    else {
                        previewText = $previewTextInput.val();
                        $ul.find('h3').html(previewText);
                    }
                })
            }

            this.checkForLinks = function (page) {
                var existFonts = [];
                pinegrow.goThroughAllForAttribute(page, 'href', function (el, attr, url) {
                    var matched = url.match(/fonts.googleapis.com\/css/);
                    if (el.is('link') && (matched && matched.length > 0)) {
                        var name = getFontNameFromURL(url);
                        if (name) {
                            existFonts.push({
                                url: url,
                                name: getFontNameFromURL(url),
                                action: addCopyNameIcon
                            });
                        }
                    }
                });
                return existFonts;
            }

            this.addNotes = function ($container) {
                $('<span>Click on <i class="glyphicon glyphicon-copy"></i> icon to copy the family name to clipboard. Then paste it into the Font family property of the CSS rule.</span>').appendTo($container);
            }
        }

        var PgAssetManager = function () {
            var DIALOG_TITLE = "Manage Google Fonts";
            var googleFontManager = new PgGoogleFontManager();

            var assetsList = [];
            var removedAssets = [];

            var uniqueBy = function (arr, fn) {
              var unique = {};
              var distinct = [];
              arr.forEach(function (x) {
                var key = fn(x);
                if (!unique[key]) {
                  distinct.push(x);
                  unique[key] = true;
                }
              });
              return distinct;
            }

            var removeFromAssets = function (index) {
                if (index > -1 && index < assetsList.length) {
                    removedAssets.push(assetsList[index]);
                    assetsList.splice(index, 1);
                    return true;
                }
                return false;
            }

            var mergeGoogleFontWithAssetsList = function (entered_gooogle_font) {
                var google_fonts = entered_gooogle_font.map(function (font) {
                    return {
                        url: font.url,
                        type: 'CSS',
                        from: 'Google font',
                        info: font.name,
                        action: font.action
                    };
                });

                var newList = [];
                for (var i = 0; i < assetsList.length; i++) {
                    var found = false;
                    var foundFont;
                    for (var j = 0; j < google_fonts.length; j++) {
                        if (assetsList[i].info == google_fonts[j].info) {
                            found = true;
                            foundFont = google_fonts[j];
                            google_fonts.splice(j, 1);
                            break;
                        }
                    }
                    if (!found) {
                        newList.push(assetsList[i]);
                    }
                    else {
                        removedAssets.push(assetsList[i]);
                        newList.push(foundFont);
                    }
                }

                assetsList = $.merge(newList, google_fonts);
            }

            var saveChangesToThePage = function () {
                var selectedPage = pinegrow.getSelectedPage();
                if (!selectedPage) {
                    pinegrow.showAlert('There is no open page');
                    return;
                }
                var $html = selectedPage.get$Html();
                pinegrow.makeChanges(selectedPage, $html, "Add/Remove assets to/from page", function() {
                    // Remove assets
                    for (var i = 0; i < removedAssets.length; i++) {
                        if (removedAssets[i].type == 'CSS') {
                            var $el = $html.find('[href*="' + removedAssets[i].url + '"]');
                            new pgQuery($el).remove();
                        }
                    }

                    // Add assets
                    for (var i = 0; i < assetsList.length; i++) {
                        if (assetsList[i].type == 'CSS') {
                            selectedPage.addStylesheet(assetsList[i].url);
                        }
                    }
                    $.fn.crsa("setNeedsUpdate", true, selectedPage.get$Html());
                });
            }

            this.show = function () {
                var $b = $("<div></div>");
                var $table = $('<table class="assets-manager file-chooser table table-striped table-condensed table-hover"><thead><tr><td style="width:60%;"><label>Asset name</label></td><td><label>Type</label></td><td style="width:100px;"><label>More Info</label></td><td style="width:30px;"></td><td style="width:30px;"></td></tr></thead><tbody></tbody></table>').appendTo($b);
                var $tbody = $table.find('tbody');

                var updateAssetsList = function (skip_save) {
                    $tbody.html('');

                    for (var i = 0; i < assetsList.length; i++) {
                        var url = crsaGetSummaryStr(assetsList[i].url, 60);

                        var $tr = $('<tr data-index="' + i + '"></tr>').appendTo($tbody);
                        $td = $('<td class="elm-url"><label>' + url + '</label></td>').appendTo($tr);
                        $td = $('<td class="elm-type">' + assetsList[i].type + (assetsList[i].from ? '/' + assetsList[i].from : '') + '</td>').appendTo($tr);
                        $td = $('<td class="more-info">' + assetsList[i].info + '</td>').appendTo($tr);
                        $td = $('<td class="elm-action"></td>').appendTo($tr);
                        if (assetsList[i].action) assetsList[i].action(assetsList[i], $td);
                        $td = $('<td class="elm-delete"><i class="glyphicon glyphicon-trash"></i></td>').appendTo($tr);
                        var $delete_icon = $td.find('> .glyphicon');

                        $delete_icon.click(function (e) {
                            e.preventDefault();
                            $tr = $(this).closest('tr');

                            if (removeFromAssets(parseInt($tr.attr('data-index')))) {
                                updateAssetsList();
                            }
                        })
                    }

                    // Save changes
                    if (!skip_save) {
                        saveChangesToThePage();
                    }
                }

                var $notes = $('<p class="assets-notes"></p>').appendTo($b);
                var $form = $('<form class="form-inline load-files-folders" role="form"></form>').appendTo($b);
                var $add_google_font = $('<button type="submit" class="btn btn-default add-google-font">Add Google font</button>').appendTo($form);

                if (googleFontManager.addNotes) {
                    googleFontManager.addNotes($notes)
                }

                $add_google_font.click(function (e) {
                    e.preventDefault();
                    googleFontManager.show(function (choosed_fonts) {
                        mergeGoogleFontWithAssetsList(choosed_fonts);
                        updateAssetsList();
                    });
                });

                var getDefaultPageAssets = function () {
                    assetsList = [];
                    var selectedPage = pinegrow.getSelectedPage();
                    if (selectedPage) {
                        var existedFonts = googleFontManager.checkForLinks(selectedPage);
                        mergeGoogleFontWithAssetsList(existedFonts);
                        updateAssetsList(true);
                    }
                }

                getDefaultPageAssets();
                f.on_page_refreshed = getDefaultPageAssets;

                makeAndShowDialog(DIALOG_TITLE, "Close", null, $b, function () {
                    // do nothing
                }, null, null, true);
            }
        }

        var assetManager = new PgAssetManager();

        if(!pinegrow.isContributorMode()) {
            f.on_page_menu = function(page, items) {
                items.push({
                    label: 'Manage Google Fonts...',
                    kbd: null,
                    func: function() {
                        assetManager.show();
                    }
                })
            };
        }
    });
});