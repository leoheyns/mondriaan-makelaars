/*
Humane technologies d.o.o.
 */

var PgPowerBar = function($container) {

    var $p = $('<div class="power-bar"></div>').appendTo($container);

    var $input = $('<input type="text" class="power-bar-input"/>').appendTo($p);

    var $b = $('<button class="btn btn-primary">Go</button>').appendTo($p);

    var $list = $('<div class="power-bar-list"></div>').appendTo($p);

    var api = new PgApi();
    var preview_ref = 'pg-preview-1';
    /*
    Modes for input
    - Code
    - Search element
    - Element
    - Component
     */

    var getHtmlForVal = function(val) {

        var p = new pgParser();
        p.assignIds = false;
        p.parse(val);

        if(p.validate().length) return null;

        //p.text

        return val;
    }

    $input.on('input', function(e) {
        var val = $input.val();

        var code = getHtmlForVal(val);

        if(code) {
            api.previewCodeInPage(preview_ref, code, 'append', null);
        }
    })

    $input.on('blur', function(e) {
        api.clearPreviewCodeInPage(preview_ref);
    })

    $b.on('click', function(e) {
        var val = $input.val();

        var code = getHtmlForVal(val);

        if(code) {
            api.append(code, null /* to selected element */);
        }
    })
}


var PgClipboardItem = function(code, source, type) {
    
    type = type || 'code';
    
    this.name = null;
    this.valid = false;
    this.code = code;
    this.source = source || 'pg';
    this.sticky = false;
    this.type = type;

    if(type == 'code') {
        var p = new pgParser();
        p.assignIds = false;
        p.parse(code);

        if(p.validate().length == 0) {
            var names = [];
            for (var i = 0; i < p.rootNode.children.length; i++) {
                if(p.rootNode.children[i].textNode) {
                    var t = $.trim(p.rootNode.children[i].content);
                    if(t.length) {
                        names.push( '<nametext>"' + crsaGetSummaryStr(escapeHtmlCode(t), 30, true) + '"</nametext>');
                    }
                } else {
                    names.push(p.rootNode.children[i].getName(true));
                    var count = 0;
                    for (i = i + 1; i < p.rootNode.children.length; i++) {
                        if(p.rootNode.children[i].isElement) {
                            count++;
                        }
                    }
                    if(count > 0) {
                        names.push('<small> + ' + count + ' more</small>');
                    }
                    break;
                }
            }
            this.name = names.join(' ');
            this.valid = true;
        } else {
            this.name = '<nametext>"' + crsaGetSummaryStr(escapeHtmlCode(code), 30, true) + '"</nametext>';
        }
    } 
}

var PgClipboard = function() {

    var _this = this;

    var list = [];

    var current = 0;

    var placement = 'insertAfter';
        
    var hiddenText = 'pinegrowisthebesteditorintheuniverse';

    this.getPlacement = function() {
        return placement;
    }

    this.setPlacement = function(p) {
        placement = p;
    }

    var find = function(code) {
        for(var i = 0; i < list.length; i++) {
            if(list[i].code == code) return i;
        }
        return -1;
    }
    
    var reorderListAfterAddingItem = function() {

	    var r = [];
	    var sticky = [];
	    
	    for(var i = 0; i < list.length; i++) {
			if(list[i].sticky) {
				sticky.push(list[i]);
				list[i].position = i > 1 ? Math.max(i - 1, 0) : i;
			} else {
				if(r.length < 100) {
					r.push(list[i]);
				}
			}   
	    }
	    
	    for(var i = 0; i < sticky.length; i++) {
		    r.splice(Math.min(sticky[i].position, r.length), 0, sticky[i]);
	    }
	    list = r;
    }

    this.add = function(code, source) {
        if(!code || !$.trim(code).length) return;

        var idx = find(code);
        if(idx >= 0) {
            list.splice(idx, 1);
        }
              
        var item = new PgClipboardItem(code, source);
        list.unshift(item);

        current = 0
        
        reorderListAfterAddingItem();

        if(typeof pinegrow != 'undefined') pinegrow.callGlobalFrameworkHandler('on_clipboard_changed', item);
    }

    this.select = function(idx) {
        if(idx < list.length) {
            current = idx;
            setClipboardContent(list[current].code);
        }
        if(typeof pinegrow != 'undefined') pinegrow.callGlobalFrameworkHandler('on_clipboard_item_selected', current);     
    }

    this.getCurrentItem = function() {
        if(current < list.length) return list[current];
        return null;
    }

    this.getCurrentIndex = function() {
        return current;
    }

    this.getAll = function() {
        return list;
    }

    this.onPageMouseUp = function(event) {
        focusHiddenArea(event.currentTarget);
    }
    
    this.onPagePaste = function(event) {
        if(!shouldHandlePaste()) return;
		handlePaste();
    }

    var getClipboardContent = function() {
        var gui = require('nw.gui');
        var clipboard = gui.Clipboard.get();
        return clipboard.get('text');
    }

    var setClipboardContent = function(c) {
        setTimeout(function() {
            var gui = require('nw.gui');
            var clipboard = gui.Clipboard.get();
            clipboard.set(c, 'text');
        }, 100);
    }

    var addFromClipboard = function(source) {
        var text = getClipboardContent();
        if(text && text != hiddenText) {
            _this.add(text, source);
        }
    }
    
    this.addFromClipboard = function(source) {
	    addFromClipboard(source);
    }

    addFromClipboard();

    document.addEventListener('copy', function(e) {
        if(isInInput()) {
            setTimeout(addFromClipboard, 100);
        } else if(hasSelection()) {
	        setTimeout(addFromClipboard, 100);
        } else {
            var pgel = pinegrow.getSelectedPgNode();
            if(pgel) {
	            var c = pgel.toStringOriginal(true, pinegrow.getFormatHtmlOptions());
                _this.add(c);
                setClipboardContent(c);
            }
        }
        if(typeof pinegrow != 'undefined') pinegrow.callGlobalFrameworkHandler('on_clipboard_copy');
    })
    
    document.addEventListener('cut', function(e) {
        if(isInInput()) {
            setTimeout(addFromClipboard, 100);
        } else if(hasSelection()) {
	        setTimeout(addFromClipboard, 100);
        } else {
            var pgel = pinegrow.getSelectedPgNode();
            if(pgel) {
	            var c = pgel.toStringOriginal(true, pinegrow.getFormatHtmlOptions());
                _this.add(c);
                var api = new PgApi();
                api.remove(pgel.getId());
                setClipboardContent(c);
            }
        }
        if(typeof pinegrow != 'undefined') pinegrow.callGlobalFrameworkHandler('on_clipboard_cut');
    })

	var handlePaste = function(item) {
		item = item || _this.getCurrentItem();
        if(item) {
	        if(!item.valid) {
		        pinegrow.showNotice('<p>The code has syntax errors (like unclosed tags) and so it can\'t be pasted to the page.</p><p>If you really want to add it to the page go to Edit code and paste it there.</p>', 'Can\'t insert invalid HTML', 'paste-invalid', function(shown) {
			        if(!shown) {
				        pinegrow.showQuickMessage('Can\'t insert invalid HTML!', 3000, false, 'error');
			        }
		        })
		        return;
	        }
            var api = new PgApi();
            var pgel = pinegrow.getSelectedPgNode();
            if(pgel) {
                api.insert(item.code, pgel.getId(), placement);
            } else {
	            pinegrow.showQuickMessage('Please select the destination element first.');
            }
        }

	}
	
	this.paste = function(item) {
		handlePaste(item);
	}

    document.addEventListener('paste', function(e) {
        //debugger;
        if(!shouldHandlePaste()) return;
		handlePaste();
    });

    var isInInput = function() {
	    if(crsaIsInEdit()) return true;
        try {
            var $a = $(document.activeElement);
            if (document.activeElement && document.activeElement.contentDocument) {
                $a = $(document.activeElement.contentDocument.activeElement);
            }
            return $a.is('input,select,textarea,[contenteditable="true"]') && !$a.is('#crsa-dummy-field');
        } catch(err) {

        }
        return false;
    }

    var shouldHandlePaste = function() {
        return !isInInput();
        /*
	    if(crsaIsInEdit()) return false;
        var $a = $(document.activeElement);
        return !($a.is('input,textarea,[contenteditable="true"]') && !$a.is('#crsa-dummy-field'));
        */
    }

    var hiddenInput = $('#crsa-dummy-field');
    
    var hasSelection = function() {
		var s = window.getSelection();
		var sel = s.toString();
		if(sel == hiddenText) return false;
		return sel.length;  
    }

    var focusHiddenArea = function() {

        if(isInInput()) {
            return;
        }
        if(hasSelection()) {
	        return;
        }
        hiddenInput.val(hiddenText);
        hiddenInput.get(0).focus();
        hiddenInput.get(0).select();
    };

    $(document).mouseup(focusHiddenArea);

    var gui = require('nw.gui');
    var clip_on_blur = null;
    gui.Window.get().on('blur', function() {
        clip_on_blur = getClipboardContent();
    })
    gui.Window.get().on('focus', function() {
        if(clip_on_blur != getClipboardContent()) {
            addFromClipboard('system');
        }
    })
/*
    ['cut', 'copy', 'paste'].forEach(function(event) {
        document.addEventListener(event, function(e) {
            console.log(event);
            //focusHiddenArea();
            e.preventDefault();
        });
    });
    */
}

var PgClipboardView = function($container, $head_container) {

    if(!$head_container) $head_container = $container;

    var clipboard = pinegrow.getClipboard();

    var $c = $('<div class="clipboard-view"></div>').appendTo($container);

    var placement_field = new PgInputField('clipboard-placement', {
        type: 'select',
        show_empty: false,
        name: 'On paste',
        //system_field: true,
        options: [
            {key: 'append', name: 'append'},
            {key: 'prepend', name: 'prepend'},
            {key: 'insertBefore', name: 'insert before'},
            {key: 'insertAfter', name: 'insert after'}
        ]
    });

    placement_field.setValue(clipboard.getPlacement());

    placement_field.on('change', function(e) {
        clipboard.setPlacement( placement_field.getValue());
    })

    placement_field.appendTo($c);

    var $list = $('<ul class="clipboard-list"></ul>').appendTo($c);

    var onClipboardChanged = function(page, item) {
        paint();
    }

    var onClipboardItemSelected = function(page, current) {
        highlightCurrent(current);
    }

    pinegrow.addEventHandler('on_clipboard_changed', onClipboardChanged);
    pinegrow.addEventHandler('on_clipboard_item_selected', onClipboardItemSelected);

    var close = function() {
        pinegrow.removeEventHandler('on_clipboard_changed', onClipboardChanged);
        pinegrow.removeEventHandler('on_clipboard_item_selected', onClipboardItemSelected);
    }

    var highlightCurrent = function(idx) {
        $list.find('li.current').removeClass('current');
        var $items = $list.children();
        if($items.length > idx) {
            $($items.get(idx)).addClass('current');
        }
    }

    var paint = function() {
        var list = clipboard.getAll();
        var current = clipboard.getCurrentIndex();

        $list.html('');
        
        var getItem = function(e) {
	        var $item = $(e.delegateTarget).closest('li');
            var idx = $item.data('item-index');
            if(idx >= 0 && idx < list.length) {
                return {$item: $item, item: list[idx], idx: idx};
            }
            return null;
        }

        for(var i = 0; i < list.length; i++) {
            var $item = $('<li><div class="selector"></div>' + list[i].name + '</li>').data('item-index', i).appendTo($list);


			var $paste = $('<i class="control paste-control fa fa-arrow-right"></i>')
				.appendTo($item)
				.on('click', function(e) {
					e.preventDefault();
					e.stopPropagation();
					e.stopImmediatePropagation();
					var d = getItem(e);
	                if(d) {
		                clipboard.paste(d.item);
	                }
				});
				
			addTooltip($paste, 'Paste the item');
				
			var $sticky = $('<i class="control sticky-control fa fa-thumb-tack"></i>')
				.appendTo($item)
				.on('click', function(e) {
					e.preventDefault();
					e.stopPropagation();
					e.stopImmediatePropagation();
					var d = getItem(e);
	                if(d) {
	                    d.item.sticky = !d.item.sticky;
	                    if(d.item.sticky) {
		                    d.$item.addClass('sticky');
	                    } else {
		                    d.$item.removeClass('sticky');
	                    }
	                }
				});
				
			addTooltip($sticky, 'Keep the clipboard item in the same position.');
				
			if(list[i].sticky) {
				$item.addClass('sticky');
			}
			
			
            if(i == current) $item.addClass('current');

            $item.on('click', function(e) {
                e.preventDefault();
                var d = getItem(e);
                if(d) {
                    $list.find('li.current').removeClass('current');
                    d.$item.addClass('current');
                    clipboard.select(d.idx);
                }
            })
        }
    }

    paint();
}

var PgApi = function() {

    var preview_elements = {};

    var getPgEl = function(pgid) {
        return pgid ? getPgNodeByPgId(pgid) : pinegrow.getSelectedPgNode();
    }

    this.previewCodeInPage = function(ref, code, placement, pgid) {
        this.clearPreviewCodeInPage(ref);
        var pgel = getPgEl(pgid);
        if(pgel) {
            var $el = pgel.get$DOMElement();
            if($el) {
                var $pel = $(code).attr('data-pg-preview-ref', ref);

                switch(placement) {
                    case 'append':
                        $el.append($pel);
                        break;
                    case 'prepend':
                        $el.prepend($pel);
                        break;
                    case 'insertAfter':
                        $pel.insertAfter($el);
                        break;
                    case 'insertBefore':
                        $pel.insertBefore($pel);
                        break;
                }
                preview_elements[ref] = $pel;
            }
        }
    }

    this.clearPreviewCodeInPage = function(ref) {
        if(preview_elements[ref]) {
            preview_elements[ref].remove();
            delete preview_elements[ref];
        }
    }
    
    this.remove = function(pgid) {
        var pgel = getPgEl(pgid);
        if(pgel) {
            var page = pinegrow.getCrsaPageOfPgParserNode(pgel);
            var $el = pgel.get$DOMElement();
            var $changed = $el ? $el.parent() : null;
            
            if(!canMakeChange(pgel, 'delete_element')) return;
            
            pinegrow.makeChanges(page, $el, "Remove element", function() {
                pgel.remove();
                if($el) $el.remove();
                pinegrow.setNeedsUpdate($changed);
            });
        }
    } 

    this.insert = function(code, pgid, placement, options) {
        options = options || {select: false, scroll: false, highlight: false};
        placement = placement || 'append';
        var pgel = getPgEl(pgid);
        var inserted_ids = [];

        if(pgel) {
            var page = pinegrow.getCrsaPageOfPgParserNode(pgel);
            var $el = pgel.get$DOMElement();

            var change_inside = placement == 'append' || placement == 'prepend';
            var $changed = (change_inside || !$el) ? $el : $el.parent();

            var p = new pgParser();
            p.parse(code);

            for(var i = 0; i < p.rootNode.children.length; i++) {
                if (p.rootNode.children[i].isElement && !canMakeChange(change_inside ? pgel : pgel.parent, 'insert_element', {inserted: p.rootNode.children[i]})) return inserted_ids;
            }

            var first_el = null;
            
            pinegrow.makeChanges(page, $el, "Insert element", function() {

                while(p.rootNode.children.length) {
                    var idx = placement == 'insertAfter' ? p.rootNode.children.length-1 : 0;

                    var pgid = p.rootNode.children[idx].getId();
                    if(pgid) inserted_ids.push(pgid);
                    
                    if(!first_el && p.rootNode.children[idx].isElement) {
                        first_el = p.rootNode.children[idx];
                    }
                    
                    var view_html, $view_el;
                    if(p.rootNode.children[idx].textNode) {
                        view_html = $(document.createTextNode(p.rootNode.children[idx].toStringOriginal(true)));
                    } else {
                        view_html = page.getViewHTMLForElement(p.rootNode.children[idx]);
                        try {
                            $view_el = $(view_html);
                        } catch(err) {}
                    }
                    switch(placement) {
                        case 'append':
                            //console.log('appending ' + p.rootNode.children[idx].toStringOriginal(true));
                            pgel.append(p.rootNode.children[idx]);
                            if($el) $el.append($view_el || view_html);
                            break;
                        case 'prepend':
                            pgel.prepend(p.rootNode.children[idx]);
                            if($el) $el.prepend($view_el || view_html);
                            break;
                        case 'insertAfter':
                            p.rootNode.children[idx].insertAfter(pgel);
                            if($el) $($view_el || view_html).insertAfter($el);
                            break;
                        case 'insertBefore':
                            p.rootNode.children[idx].insertBefore(pgel);
                            if($el) $($view_el || view_html).insertBefore($el);
                            break;
                    }
                    if($view_el) {
                        crsaFuncs.elementWasInserted($view_el, null, true /* skip highlight */);
                    }
                }
                pinegrow.setNeedsUpdate($changed);
            });
            
            if(first_el) {
                var $first_el = first_el.get$DOMElement(page.get$Html());
                if($first_el) {
                    if (options.select) {
                        pinegrow.selectElement($first_el);
                    } else if (options.scroll) {
                        pinegrow.scrollToElement($first_el);
                    }
                    if(options.highlight) {
                        setTimeout(function(){
                            pinegrow.highlightElement($first_el);
                        }, 250);
                    }
                }
            }
        }
        return inserted_ids;
    }


}

/*

 var getClipboardContent = function() {
 var gui = require('nw.gui');
 var clipboard = gui.Clipboard.get();
 return clipboard.get('text');
 }

 <p>Hi,</p><p>Matjaz here, from Pinegrow.</p><p>The last payment for your Pinegrow subscription failed. The payment will be retried in the next few days.</p><p>Please use this link if you need to update your payment information, so that you can continue to use Pinegrow:</p><p><a href="{$link}">{$link}</a></p><p>Let me know if I can help you with anything.</p><p>Thanks &amp; all the best,<br>Matjaz</p>

 */

var PgInputField = function(key, def) {

    this.$field = $.fn.crsa('addInputField', null, null, key, def, {}, true);
    this.$input = this.$field.find('.crsa-input');

    this.on = function(event, func) {
        this.$input.on(event, func);
    }

    this.setValue = function(value) {
        this.$input.val(value);
    }

    this.getValue = function() {
        return this.$input.val();
    }

    this.appendTo = function($c) {
        this.$field.appendTo($c);
    }

}