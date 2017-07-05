/**
 * Created by Matjaz on 1/3/14.
 */

/*
proc item = {
    el: '#tree',
    hl: 'border' | 'background'
    html: 'Explanation,
    other : [],
    on: func
*/
var AppExplainer = function(proc) {

    this.proc = proc ? proc : [];

    var current = 0;
    var $popover_el;
    var _this = this;

    this.add = function(el, title, html, hl, other, on, off, delay) {
        this.proc.push({el: el, title: title, html: html, hl: hl, other: other, on: on, off: off, delay: delay});
    }

    this.play = function() {
        showCurrent();
    }

    var getCurrent = function() {
        return _this.proc.length > current ? _this.proc[current] : null;
    }

    var next = function() {
        hideCurrent();
        if(_this.proc.length > current + 1) current++;
        showCurrent();
    }

    var prev = function() {
        hideCurrent();
        if(current > 0) current--;
        showCurrent();
    }

    var isFirst = function() {
        return current == 0;
    }

    var isLast = function() {
        return current == _this.proc.length - 1;
    }

    var hideCurrent = function() {
        var p = getCurrent();
        if(p.off) p.off(p);
        var els = getElements(p.el);
        var other = p.other ? getElements(p.other) : null;
        els.removeClass(p.cls);
        if(other) other.removeClass('appex-border');
    }

    var showCurrent = function(no_delay) {
        var p = getCurrent();

        if(p.delay && !no_delay) {
            setTimeout(function() {
                showCurrent(true);
            }, p.delay);
            return;
        }
        if(p.on) p.on(p);
        var els = getElements(p.el);
        var other = p.other ? getElements(p.other) : null;
        var cls = 'appex-' + (p.hl ? p.hl : 'border');
        p.cls = cls;
        els.addClass(cls);
        if(other) other.addClass('appex-border');

        var html = typeof p.html == 'function' ? p.html(p) : p.html;

        var $popover_el = els.first();

        var eid = 'appex-item-' + current;

        var pop = $popover_el.popover({
            html: true,
            placement: 'auto',
            trigger: 'manual',
            title: p.title,
            container: 'body',
            content: '<div id="' + eid + '"><div>' + html + '</div><button class="prev btn-link">Back</button><button class="next btn">Next</button><button class="closeit btn btn-link">Cancel</button></div>'
        })
            .on('shown.bs.popover', function() {
                var $d = $('#' + eid);
                var $prev = $d.find('button.prev');
                var $next = $d.find('button.next');
                var $close = $d.find('button.closeit');

                if(isFirst()) $prev.hide();
                if(isLast()) {
                    $next.html('Done');
                    $close.hide();
                }

                $prev.on('click', function(e) {
                    e.preventDefault();
                    hideCurrent();
                    prev();
                    $popover_el.popover('destroy');
                });

                $next.on('click', function(e) {
                    e.preventDefault();
                    hideCurrent();
                    if(!isLast()) {
                        next();
                    }
                    $popover_el.popover('destroy');
                });

                $close.on('click', function(e) {
                    hideCurrent();
                    $popover_el.popover('destroy');
                    e.preventDefault();
                });
            })
        $popover_el.popover('show');
    }

    var getElements = function(el) {
        switch(typeof el) {
            case 'string' :
                return $(el);
            case 'object' :
                return el;
            case 'function' :
                return el();
        }
    }

}