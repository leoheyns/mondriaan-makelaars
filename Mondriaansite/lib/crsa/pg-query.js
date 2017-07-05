/**
 * Created by Matjaz on 25/06/14.
 */

function getElementPgId($el) {
    return $el.attr('data-pg-id');
}

function getElementPgNode($el) {
    var pgid = getElementPgId($el);
    if(pgid) {
        return getPgNodeByPgId(pgid);
    }
    return null;
}

function getDomElementPgNode(el) {
    var pgid = el.getAttribute('data-pg-id');
    if(pgid) {
        return getPgNodeByPgId(pgid);
    }
    return null;
}

function getPgNodeByPgId(pgid) {
    return pgParserNodeCatalogueInstance.get(pgid);
}

function pgFindUniqueSelectorForElement(pgel, doc, opts) {
    opts = opts || {id: true, tag: true, class: true, path: true};
    //try id

    if(opts.id) {
        var id = pgel.getAttr('id');
        if(id) return '#' + id;
    }

    //self?
    if(pgel == doc) return 'self';

    //try tag
    if(opts.tag && doc.findIncludingSelf(pgel.tagName).length == 1) return pgel.tagName;

    //try class
    if(opts.class) {
        var classes = pgel.getClasses();
        for(var i = 0; i < classes.length; i++) {
            if(classes[i].match(/col\-|text\-|[0-9]/)) continue;
            if(doc.findIncludingSelf('.' + classes[i]).length == 1) return '.' + classes[i];
        }
    }

    //try path
    if(opts.path) {
        var path = '';
        var el = pgel;
        while(el && el != doc) {
            var list = el.parent.find(el.tagName, false, true /* only kids */);
            if(list.length == 1) {
                path = '>' + el.tagName + path;
            } else {
                var idx = el.parent.getChildPos(el, true /* skip text nodes */);
                path = '>' + el.tagName + ':nth-child(' + (idx+1) + ')' + path;
            }
            el = el.parent;
        }
        if(path) return path;
    }
    
    return null;

}

function pgRemovePgIdsFromCode(code) {
    return code.replace(/\s*data\-pg\-id="[^"]*"/g, '');
    return code.replace(/(<[^>]*?)(\s*data\-pg\-id="[0-9]*")/g, '$1');
}

function pgCompareNodes(a, b) {
    if(a.toStringOriginal(true) != b.toStringOriginal(true)) {
        return false;
    }
    return true;
}


function pgFindChangedNodes(a, b, list) {
  /*  if(a.tagName == 'base') {
        a = a;
        console.log(a.getAttributesString(pgGetAttributesStringFilterOutPgIds));
        console.log(b.getAttributesString(pgGetAttributesStringFilterOutPgIds));
    }
*/
    if(pgCompareNodes(a, b)) return null; //no changes

    //filter out empty text nodes
    var cha = [];
    var chb = [];
    for(var i = 0; i < a.children.length; i++) {
        if(a.children[i].textNode && a.children[i].content.match(pgWhiteSpaceRegExp)) continue;
        //if(a.children[i].comment) continue;
        cha.push(a.children[i]);
    }
    for(var i = 0; i < b.children.length; i++) {
        if(b.children[i].textNode && b.children[i].content.match(pgWhiteSpaceRegExp)) continue;
        //if(b.children[i].comment) continue;
        chb.push(b.children[i]);
    }
    //different, lets check which children node is diff
    if(cha.length != chb.length) {
        list.push({original: a, changed: b});
        return true;
    }

    var changed_children = false;
    for(var i = 0; i < cha.length; i++) {
        if(pgFindChangedNodes(cha[i], chb[i], list)) {
            changed_children = true;
        }
    }
    if(changed_children) {
        if(a.tagName == b.tagName && a.closingTag == b.closingTag && a.content == b.content && a.getAttributesString(pgGetAttributesStringFilterOutPgIds) == b.getAttributesString(pgGetAttributesStringFilterOutPgIds)) {
            //only children are changed. the parent tags are the same
            return true;
        }
    }
    list.push({original: a, changed: b});
    return true;
}

function pgFindChangedNodesInPage(original, changed) {

    var cp = new CrsaProfile(true);

    //null - same
    //topA, topB - everything is different
    //nodeA, nodeB - replace node a with b

    var topA, topB;
    var p = new pgParser();
    if(typeof original == 'string') {
        p.parse(original);
        topA = p.rootNode;
    } else {
        topA = original;
    }
    if(typeof changed == 'string') {
        p.parse(changed);
        topB = p.rootNode;
    } else {
        topB = changed;
    }
    cp.show('Find nodes parse');

    var list = [];
    pgFindChangedNodes(topA, topB, list);
    if(list.length) {
        for(var i = 0; i < list.length; i++) {
            r = list[i];
            if((!r.original.isElement || !r.changed.isElement) && (r.original.parent && r.changed.parent)) {
                r.original = r.original.parent;
                r.changed = r.changed.parent;
            }
        }
    }
    cp.show('Find nodes');
    //remove subs
    var nl = [];
    for(var i = 0; i < list.length; i++) {
        var r = list[i];
        var sub = false;
        var found = false;
        for(var ii = 0; ii < nl.length; ii++) {
            if(r.original == nl[ii].original) {
                found = true;
                break;
            }
        }
        if(found) continue;

        for(var jj = 0; jj < list.length; jj++) {
            if(r.original.isDescendantOf(list[jj].original)) {
                sub = true;
                break;
            }
        }
        if(!sub) {
            nl.push(r);
        }
    }
    list = nl;
    for(var i = 0; i < list.length; i++) {
        var r = list[i];
        //var s1 = r.original.toStringOriginal(true);
        //var s2 = r.changed.toStringOriginal(true);
        //console.log(r.original.tagName + '-' + r.original.getId(), [s1], r.changed.tagName + '-' + r.changed.getId(), [s2]);

        //console.log(s1);
        //console.log(s2);
        //console.log(describeDiffStrings(s1, s2));
    }
    return list;
}


function pgNodeContainsDynamic($el) {
    var node = getElementPgNode($el);
    if(!node) return true;
    var has = false;
    $el.find('*').each(function(i, e) {
        if(!getElementPgId($(e))) {
            has = true;
            return false;
        }
    });
    return has;
}

function pgFindDynamicDiffs(node, $el) {
    var html = $el.get(0).outerHTML;
    html = removeCrsaClassesFromHtml(html);
    var p = new pgParser();
    p.assignIds = false;

    var map = {};
    node.walkSelfAndChildren(function(n) {
        var id = n.getId();
        if(id) map[id] = n;
        return true;
    })
    var has = false;
    p.parse(html);
    p.rootNode.walk(function(n) {
        n.dynamic = false;
        n.dynamic_attributes = [];
        n.dynamic_content = false;

        if(n.shouldHaveId()) {
            var id = n.getId();
            if(!id || !map[id]) {
                n.dynamic = true;
                has = true;
            } else {
                var co = map[id].html();
                var so = n.html();
                if(co != so) {
                    n.dynamic_content = true;
                    has = true;
                }
            }
        }
        return true;
    })

    return has ? p : null;
}

function pgDescribeDynamicDiffs(p) {

    var s = p.rootNode.toString(null, true, false, function(n, str, op) {
        if(op == 'node') {
            if(n.dynamic) {
                str = '_###span class="dynamic"###_' + str + '_###/span###_';
            } else {
                str = '_###span class="static"###_' + str + '_###/span###_';
            }
        } else if(op == 'content') {
            if(n.dynamic_content) {
                str = '_###span class="dynamic_content"###_' + str + '_###/span###_';
            }
        }
        return str;
    });

    s = pinegrow.formatHtml(s);
    s = escapeHtmlCode(s).replace(/_###/g, '<').replace(/###_/g, '>');
    return s;
}

function pgInsertNodeAtDOMElementLocation(node, $el) {

    var $prev = $el.prev();
    if($prev.length == 0) {

        var $p = $el.parent();
        var pgParent = getElementPgNode($p);
        if(pgParent) {
            pgParent.prepend(node);
        } else {
            var $next = $el.next();
            if($next.length) {
                var pgNext = getElementPgNode($next);
                if(!pgNext) return false;
                node.insertBefore(pgNext);
            } else {
                return false;
            }
        }

    } else {
        var pgPrev = getElementPgNode($prev);
        if(!pgPrev) return false;
        node.insertAfter(pgPrev);
    }
    return true;

    var idx = 0;
    var p = $p.get(0);
    var el = $el.get(0);
    if(p.hasChildNodes()) {
        for(var i = 0; i < p.childNodes.length; i++) {
            if(p.childNodes[i] == el) break;
            if(p.childNodes[i].nodeType != 1) {
                idx++;
            } else {
                var $ch = $(p.childNodes[i]);
                var pgCh = getElementPgNode($ch);
                if(pgCh) {
                    idx++;
                }
            }
        }
    }
    node.insertAtIndex(pgParent, idx, false);
    return true;
}

var pgReindentText = function(text, indent, last_line_indent) {

    if(!indent) indent = '';
    if(last_line_indent === undefined) last_line_indent = indent;
    var lines = text.split("\n");
    var space_re = /^\s+/;
    var min_space = 999999999;
    for(var i = 0; i < lines.length; i++) {
        var m = lines[i].match(space_re);
        if(m) {
            var len = m[0].length;
            if(len == lines[i].length) {
                //empty line
                lines[i] = '';
            } else {
                if(len < min_space) min_space = len;
            }
        } else if(lines[i].length > 0) {
            min_space = 0;
            break;
        }
    }
    var multiline = lines.length > 1;
    var last_idx = lines.length - 1;
    for(var i = 0; i < lines.length; i++) {
        if(multiline && i == last_idx) {
            lines[i] = last_line_indent + lines[i].substr(min_space);
        } else if(i > 0) {
            lines[i] = indent + lines[i].substr(min_space);
        }
    }
    text = lines.join("\n");

    return text;
}

var pgNodeDomElementPair = function($el, pgel) {
    if($el && $el.length) {
        this.el = $el.get(0);
        this.pgel = pgel ? pgel : ($el ? getElementPgNode($el) : null);
    }
    this.equal = function(to) {
        return this.el == to;
    }
}

var pgQuery = function(els) {
    var _this = this;

    if(typeof els == 'array') {
        this.list = els;
    } else if(els) {
        if(els instanceof pgNodeDomElementPair) {
            this.list = [els];
        } else {
            this.list = [];
            els.each(function(i, el) {
                _this.add(new pgNodeDomElementPair($(el)));
            });
        }
    } else {
        this.list = [];
    }
//    this.list = typeof els == 'array' ? els : (els ? [(els instanceof pgNodeDomElementPair ? els : new pgNodeDomElementPair(els))] : []);
    this.length = this.list.length;
}

pgQuery.prototype.create = function(html, page) {
    var pgel = pgCreateNodeFromHtml(html);
    this.createFromPgNode(pgel, page);
    return this;
}

pgQuery.prototype.createFromPgNode = function(pgel, page) {
    var html = page ? page.getViewHTMLForElement(pgel) : pgel.toStringWithIds();
    var $el = $(html);
    if(!$el.length && html.length) {
        $el = $(document.createTextNode(html));
    }
    this.add(new pgNodeDomElementPair($el, pgel));
    return this;
}

pgQuery.prototype.add = function(pair) {
    this.list.push(pair);
    this.length = this.list.length;
    return this;
}

pgQuery.prototype.get = function(idx) {
    return idx >= this.list.length ? null : this.list[idx];
}

pgQuery.prototype.$get = function(idx) {
    return idx >= this.list.length ? $() : $(this.list[idx].el);
}

pgQuery.prototype.each = function(func) {
    for(var i = 0; i < this.list.length; i++) {
        if(func(i, this.list[i]) === false) break;
    }
    return this;
}

pgQuery.prototype.indexOfElement = function(el) {
    for(var i = 0; i < this.list.length; i++) {
        if(this.list[i].el == el) return i;
    }
    return -1;
}

pgQuery.prototype.find = function(sel) {
    var result = new pgQuery();
    this.each(function(i, pair) {
        $(pair.el).find(sel).each(function(i, el) {
            if(result.indexOfElement(el) < 0) {
                result.add(new pgNodeDomElementPair($(el)));
            }
        });
    });
    return result;
}

pgQuery.prototype.is = function(sel) {
    return this.length > 0 && this.$get(0).is(sel);
}

pgQuery.prototype.closest = function(sel) {
    var result = new pgQuery();
    this.each(function(i, pair) {
        $(pair.el).closest(sel).each(function(i, el) {
            if(result.indexOfElement(el) < 0) {
                result.add(new pgNodeDomElementPair($(el)));
            }
        });
    });
    return result;
}

pgQuery.prototype.parent = function() {
    var result = new pgQuery();
    this.each(function(i, pair) {
        $(pair.el).parent().each(function(i, el) {
            if(result.indexOfElement(el) < 0) {
                result.add(new pgNodeDomElementPair($(el)));
            }
        });
    });
    return result;
}

pgQuery.prototype.requireNode = function(pair) {
    if(!pair.pgel) {
        throw new pgParserException("DOM Element has no PG node", pair.el);
    }
}

pgQuery.prototype.attr = function(attr, value) {
    for(var i = 0; i < this.list.length; i++) {
        if(typeof value == 'undefined') {
            this.requireNode(this.list[i]);
            return pgDecodeAttribute( this.list[i].pgel.getAttr(attr) );
        } else {
            this.requireNode(this.list[i]);
            //value = pgEncodeAttribute( value );
            value = this.list[i].pgel.setAttr(attr, value); //returns value, potentially encoded
            this.list[i].el.setAttribute(attr, value);
        }
    }
    return typeof value == 'undefined' ? null : this;
}

pgQuery.prototype.removeAttr = function(attr) {
    for(var i = 0; i < this.list.length; i++) {
        this.requireNode(this.list[i]);
        this.list[i].pgel.removeAttr(attr);
        this.list[i].el.removeAttribute(attr);
    }
    return this;
}

pgQuery.prototype.hasAttr = function(attr) {
    for(var i = 0; i < this.list.length; i++) {
        this.requireNode(this.list[i]);
        return this.list[i].pgel.hasAttr(attr);
    }
    return false;
}

pgQuery.prototype.getInlineStylePropertyValue = function(prop, is_url) {
    for(var i = 0; i < this.list.length; i++) {
        this.requireNode(this.list[i]);

        return this.list[i].pgel.getInlineStylePropertyValue(prop, is_url);
    }
    return null;
}

pgQuery.prototype.setInlineStylePropertyValue = function(prop, value, is_url) {
    var dom_value = is_url ? pinegrow.getProxyUrl(value) : value;
    for(var i = 0; i < this.list.length; i++) {
        this.requireNode(this.list[i]);

        this.list[i].pgel.setInlineStylePropertyValue(prop, value, is_url);

        var dom_value = is_url ? pinegrow.getProxyUrl(value) : value;
        var dom_style = crsaSetInlineStylePropertyValue(this.list[i].el.getAttribute('style'), prop, dom_value, is_url);
        if(dom_style) {
            this.list[i].el.setAttribute('style', dom_style);
        } else {
            this.list[i].el.removeAttribute('style');
        }
    }
    return this;
}

pgQuery.prototype.val = function(value) {
    for(var i = 0; i < this.list.length; i++) {
        if(typeof value == 'undefined') {
            return $(this.list[i].el).val();
        } else {
            $(this.list[i].el).val(value);
        }
    }
    return this;
}

pgQuery.prototype.html = function(value) {
    for(var i = 0; i < this.list.length; i++) {
        if(typeof value == 'undefined') {
            return this.list[i].pgel.html();
        } else {
            this.requireNode(this.list[i]);
            this.list[i].pgel.html(value);
            $(this.list[i].el).html(this.list[i].pgel.html(null, true));
        }
    }
    return this;
}

pgQuery.prototype.text = function(value) {
    for(var i = 0; i < this.list.length; i++) {
        if(typeof value == 'undefined') {
            return this.list[i].pgel.text();
        } else {
            this.list[i].pgel.html(value);
            $(this.list[i].el).text(this.list[i].pgel.toStringWithIds());
        }
    }
    return this;
}

pgQuery.prototype.append = function(pairs) {
    for(var i = 0; i < this.list.length; i++) {
        this.requireNode(this.list[i]);
        for(var j = 0; j < pairs.length; j++) {
            this.requireNode(pairs.list[j]);
            this.list[i].pgel.append(pairs.list[j].pgel);
            $(this.list[i].el).append(pairs.list[j].el);
        }
    }
    return this;
}

pgQuery.prototype.prepend = function(pairs) {
    for(var i = 0; i < this.list.length; i++) {
        this.requireNode(this.list[i]);
        for(var j = 0; j < pairs.length; j++) {
            this.requireNode(pairs.list[j]);
            this.list[i].pgel.prepend(pairs.list[j].pgel);
            $(this.list[i].el).prepend(pairs.list[j].el);
        }
    }
    return this;
}

pgQuery.prototype.insertBefore = function(pairs) {
    for(var i = 0; i < this.list.length; i++) {
        this.requireNode(this.list[i]);
        for(var j = 0; j < pairs.length; j++) {
            this.requireNode(pairs.list[j]);
            this.list[i].pgel.insertBefore(pairs.list[j].pgel);
            $(this.list[i].el).insertBefore(pairs.list[j].el);
        }
    }
    return this;
}

pgQuery.prototype.insertAfter = function(pairs) {
    for(var i = 0; i < this.list.length; i++) {
        this.requireNode(this.list[i]);
        for(var j = 0; j < pairs.length; j++) {
            this.requireNode(pairs.list[j]);
            this.list[i].pgel.insertAfter(pairs.list[j].pgel);
            $(this.list[i].el).insertAfter(pairs.list[j].el);
        }
    }
    return this;
}

pgQuery.prototype.hasClass = function(cls) {
    for(var i = 0; i < this.list.length; i++) {
        this.requireNode(this.list[i]);
        return this.list[i].pgel.hasClass(cls);
    }
    return false;
}

pgQuery.prototype.addClass = function(cls) {
    for(var i = 0; i < this.list.length; i++) {
        this.requireNode(this.list[i]);
        this.list[i].pgel.addClass(cls);
        $(this.list[i].el).addClass(cls);
    }
    return this;
}

pgQuery.prototype.removeClass = function(cls) {
    for(var i = 0; i < this.list.length; i++) {
        this.requireNode(this.list[i]);
        this.list[i].pgel.removeClass(cls);
        $(this.list[i].el).removeClass(cls);
    }
    return this;
}

pgQuery.prototype.replaceTag = function(tag) {
    var result = new pgQuery();
    for(var i = 0; i < this.list.length; i++) {
        this.requireNode(this.list[i]);

        this.list[i].pgel.replaceTag(tag);

        var $el = $(this.list[i].el);
        var attrs = { };

        $.each(this.list[i].el.attributes, function(idx, attr) {
            attrs[attr.nodeName] = attr.nodeValue;
        });
        var $n;
        $el.replaceWith(function () {
            $n = $("<" + tag + "/>", attrs).append($el.contents());
            return $n;
        });
        result.add(new pgNodeDomElementPair($n));
    }
    return result;
}

pgQuery.prototype.replaceWith = function(pair, detach) {
    if(pair instanceof pgQuery) {
        pair = pair.get(0);
    }
    for(var i = 0; i < this.list.length; i++) {
        this.requireNode(this.list[i]);

        this.list[i].pgel.replaceWith(pair.pgel, detach);
        $(this.list[i].el).replaceWith(pair.el);
        return this;
    }
    return this
}

pgQuery.prototype.remove = function() {
    for(var i = 0; i < this.list.length; i++) {
        this.requireNode(this.list[i]);
        this.list[i].pgel.remove();
        $(this.list[i].el).remove();
    }
    return this;
}

pgQuery.prototype.detach = function() {
    for(var i = 0; i < this.list.length; i++) {
        this.requireNode(this.list[i]);
        this.list[i].pgel.detach();
        $(this.list[i].el).detach();
    }
    return this;
}

pgQuery.prototype.contents = function() {
    var result = new pgQuery();
    for(var i = 0; i < this.list.length; i++) {
        var pair = this.list[i];
        $(pair.el).children().each(function(i, el) {
            if(result.indexOfElement(el) < 0) {
                result.add(new pgNodeDomElementPair($(el)));
            }
        });
    }
    return result;
}
