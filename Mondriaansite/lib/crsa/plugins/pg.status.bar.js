var PgStatusBarView = function() {

    var $element = $('<div class="status-bar"><ul class="status-bar-crumbs"></ul><i class="fa fw fa-minus"></i></div>').appendTo($('body'));

    var view;

    this.$element = $element;

    var open = true;

    if(typeof PgUIView !== 'undefined') {
        view = new PgUIView($element);
    }

    this.view = view;

    var _this = this;

    var shown_nodes = [];

    var resized = function() {
        var w = $element.width();
        $element.find('>.status-bar-crumbs > li').css('max-width', Math.floor(w / (shown_nodes.length || 1) - 5) + 'px');
    }

    var pos_right = 0;
    var pos_left = 0;

    this.onResize = function(left, right) {
        pos_right = right;
        pos_left = left;

        if(open) {
            $element.css({
                left: left + 'px',
                right: right + 'px'
            })
        } else {
            $element.css({
                right: right + 'px',
                left: 'auto'
            })
        }

        resized();
    }

    this.setOpen = function(o) {
        open = o;

        if(open) {
            $element.removeClass('closed');
            $open.removeClass('fa-plus').addClass('fa-minus');
        } else {
            $element.addClass('closed');
            $open.removeClass('fa-minus').addClass('fa-plus');
        }
        this.onResize(pos_left, pos_right);
    }

    var $open = $element.find('i');

    $open.on('click', function(e) {
        e.preventDefault();
        _this.setOpen(!open);
    })

    var in_resize = false;

    var triggerResize = function() {
        if(!in_resize) {
            in_resize = true;
            $(window).trigger('resize');
            in_resize = false;
        }
    }

    var updateCrumbs = function(obj) {
        var $el = (obj && obj.data) ? obj.data : null;

        var $desc = $element.find('>.status-bar-crumbs');

        var idx = -1;
        if($el && !isAnyElementDeleted() && (idx = isNodeOnTheList($el.get(0))) >= 0) {
            var $lis = $desc.find('li');
            $lis.each(function(i, e) {
                var $e = $(e);
                if(i != idx) {
                    $e.removeClass('selected');
                    if(i < idx) {
                        $e.removeClass('child-of-selected');
                    } else if(i > idx) {
                        $e.addClass('child-of-selected');
                    }
                } else {
                    $e.addClass('selected');
                    $e.removeClass('child-of-selected');
                }
            })
            $($lis.get(idx)).addClass('selected');
            return;
        }

        $desc.html('');

        shown_nodes = [];

        if(!obj || !obj.data) {
            $element.hide();
            triggerResize();
            return;
        }

        //$('<li/>').html(getObjectName(obj, def, true, true, false, true)).appendTo($desc);

        var i = 0;

        if(!obj.data.is('html')) {
            var $pel = obj.data;
            while($pel.length > 0 && !$pel.is('html')) {
                var $li = $('<li/>', {class: 'parent'}).html(getElementName($pel, null, true, true, false, false)).prependTo($desc);
                $li.data('pg-id', $pel.attr('data-pg-id')).data('pg-idx', i);

                if(i === 0) {
                    $li.addClass('selected');
                }
                i++;

                shown_nodes.unshift($pel.get(0));
                $pel = $pel.parent();
            }
        }
        $desc.find('li')
            .on('click', function(e) {
                e.preventDefault();
                var $li = $(e.delegateTarget);
                var pgid = $li.data('pg-id');
                var pgel = getPgNodeByPgId(pgid);
                if(pgel) {
                    var $el = pgel.get$DOMElement();
                    if($el) {
                        pinegrow.selectElement($el);
                        pinegrow.scrollToElement($el);
                    }
                }
            })
            .on('mouseover', function(e) {
                var $el = get$Element($(e.delegateTarget));
                pinegrow.highlightElement($el);
            })
            .on('mouseout', function(e) {
                pinegrow.highlightElement(null);
            })
            .on('contextmenu', function(e) {
                pinegrow.showContextMenuForElement(get$Element($(e.delegateTarget)), e);
            })

        if(!$element.is(':visible') && !in_resize) {
            $element.show();
            triggerResize();
        }
        resized();
    }

    this.showIfNeeded = function() {
        if(shown_nodes.length) $element.show();
    }

    this.getHeight = function() {
        return $element.is(':visible') ? 0 : 0;
    }

    var get$Element = function($li) {
        var idx = shown_nodes.length - 1 - ($li.data('pg-idx') || 0);
        return shown_nodes.length > idx ? $(shown_nodes[idx]) : null;
    }

    var isNodeOnTheList = function(node) {
        return shown_nodes.indexOf(node);
    }

    var isAnyElementDeleted = function() {
        for(var i = 0; i < shown_nodes.length; i++) {
            if(!shown_nodes[i].parentNode) return true;
        }
        return false;
    }

    if(view) {
        //will be auto-offed on destroy
        view.on('crsa-element-selected', function (event, obj) {
            view.whenVisible(function () {
                updateCrumbs(obj);
            })
        })
    } else {
        $('body').on('crsa-element-selected', function (event, obj) {
            updateCrumbs(obj);
        })

        $('body').on('crsa-page-selected', function (event, page) {
            if(!page) {
                updateCrumbs(null);
                $element.hide();
            }
        })
    }
}