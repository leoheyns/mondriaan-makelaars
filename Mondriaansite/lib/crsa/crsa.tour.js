/**
 * Created by Matjaz on 1/3/14.
 */

//this.add = function(el, title, html, hl, other, on, off) {

function crsaPlayTour() {

    var t = new AppExplainer();

    //show tour menu
    t.add('.menu-support-tour', 'Welcome to Pinegrow!', 'This short tour will show you how Pinegrow can help you build Bootstrap sites.', null, null, function() {
        if(!$('.menu-support-tour').is(':visible')) $('.menu-support').trigger('click');
    }, function() {
        if($('.menu-support-tour').is(':visible')) $('.menu-support').trigger('click');
    }, 500);

    //LIB
    var lib_link = $('#crsa-left-plane a[href="#tab1"]');
    var lib = $('#tab1');
    var lib_c = lib.find('.content');
    var tree = $('#crsa-tree');
    var page = $('.page');

    t.add(lib_link, 'Library', 'Library contains various Bootstrap and Html elements. Use them to build your site.', 'bck', lib, function() {
       lib_link.tab('show');
    }, function() {
    });

    t.add('.crsa-factory-element-bs-button', 'Library', 'Drag elements to the page or to the tree. Dragging to the tree gives you more control over the drop target.', 'bck', tree.add(page), function() {
        lib_link.tab('show');
        lib_c.scrollTop(0);
    }, function() {
    });


    //$('#crsa-left-plane a[href="#tab3"]')
    t.play();
}