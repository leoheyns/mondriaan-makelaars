/**
 * Created by Matjaz on 06/11/15.
 */
$(function () {
    $('body').one('pinegrow-ready', function (e, pinegrow) {//Wait for Pinegrow to start-up

        var f = new PgFramework('pg.code-validator', 'Code validator');
        pinegrow.addFramework(f);

        f.default = true;
        f.show_in_manager = false;


        f.validateHTML = function(node) {
            var error_nodes = node.validateTree();

            if(error_nodes.length == 0) {
                pinegrow.showQuickMessage('Everything looks fine!');
            } else {
                var msg = '<p>The following HTML elements look broken:</p><ul>';
                for(var i = 0; i < error_nodes.length; i++) {
                    var close = error_nodes[i].closed ? error_nodes[i].getClosingTag() : '(not closed, or errors inside)';
                    msg += '<li><pre>' + escapeHtmlCode(error_nodes[i].getOpeningTag() + '...' + close) + '</pre></li>';
                }
                msg += '</ul><p>Go to code view (Page -&gt; Edit code) and look for <span style="color:red;">red tags</span> there.</p><p>At the moment this tool is not very advanced. It will get better when it grows up.</p>';

                pinegrow.showAlert(msg, 'HTML syntax errors');
            }
        }
/*
        f.on_project_item_get_context_menu = function(page, file, project) {

            var items = [];

            items.push({
                divider: true,
                header: 'Tools'
            })
            if(file.isEditable) {
                items.push({
                    label: "Validate HTML...",
                    func: function() {
                        var root = pinegrow.getSourceNodeOfUrl(file.url);
                        f.validateHTML(root);
                    }
                })
            }
            return items;
        }*/
/*
        f.on_page_menu = function(page, items) {

            items.push({
                label: 'Validate HTML...',
                kbd: null,
                func: function() {
                    f.validateHTML(page.sourceNode);
                }
            })

            return items;
        }*/

    })
});