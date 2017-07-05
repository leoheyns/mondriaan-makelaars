/**
 * Created by Matjaz on 12/9/13.
 */


var CrsaSelect = function($input, $val, options, opts) {

    var _this = this;

    this.$input = $input;
    this.options = null;
    this.$val = $val;
    this.val_dict = {};

    var def = {
        modal: true,
        title: 'Select an item',
        multiple: false,
        class: 'rich-select'
    }
    this.opts = $.extend( {}, def, opts );

    this.setOptions = function(options) {
        this.val_dict = {};
        for(var n = 0; n < options.length; n++) {
            var i = options[n];
            this.val_dict[i.key] = i;
        }
        this.options = options;
    }

    this.setOptions(options);

    this.getSelectedItem = function() {
        var key = this.$input.val();
        var item = null;
        if(key && key in this.val_dict) item = this.val_dict[key];
        return item;
    }

    this.paintVal = function() {
        var item = this.getSelectedItem();
        this.$val.html('');
        if(item) this.$val.html(item.html);
    }

    this.paintVal();

    this.showSelect = function() {
        if(this.opts.modal) {
            var selectedItem = this.getSelectedItem();
            var selectedLi = null;

            var $container = $('<div/>');

            var $searchForm = $('<form class="form-inline search-icon"><div class="form-group"><label for="search-for-icon">Search:</label><input type="search" class="form-control" placeholder="Search for an icon..." style="margin: 10px 2px; min-width: 250px" id="search-for-icon"></div></form>').appendTo($container);
            var $searchInput = $searchForm.find('input');
            var $b = $('<ul/>').addClass(opts.class).appendTo($container);

            var updateDisplay = function () {
                $b.html('');
                for(var n = 0; n < _this.finalOptions.length; n++) {
                    var i = _this.finalOptions[n];
                    var $iconContainer = $('<li/>', {class:"icon-container", title: i.name}).data('item', i).appendTo($b);
                    var $li = $(i.html).appendTo($iconContainer);
                    var $name = $('<span/>').html(i.name).appendTo($iconContainer);
                    if(selectedItem == i) {
                        $iconContainer.addClass('selected');
                        selectedLi = $iconContainer;
                    }
                }

                $b.find('>li').on('click', function(e) {
                    var $li = $(e.delegateTarget);
                    var item = $li.data('item');

                    if(selectedLi) {
                        selectedLi.removeClass('selected');
                        selectedLi = null;
                    }

                    if(selectedItem == item) {
                        selectedItem = null;
                    } else {
                        selectedItem = item;
                        selectedLi = $li;
                        $li.addClass('selected');
                    }
                    selectionDone();
                    $d.modal('hide');
                    e.preventDefault();
                });
            }
            this.finalOptions = this.options;
            updateDisplay();

            var selectionDone = function() {
                if(_this.getSelectedItem() != selectedItem) {
                    if(!selectedItem) {
                        _this.$input.val('');
                    } else {
                        _this.$input.val(selectedItem.key);
                    }
                    _this.paintVal();
                    _this.$input.trigger('change');
                }
            }

            var $d = makeModalDialog(this.opts.title, "Cancel", "Select", $container, function() {
                //cancel
            }, function() {
                //ok
                selectionDone();
            });


            $searchInput.keyup(function () {
                if (!$searchInput.val()) {
                    _this.finalOptions = _this.options;
                }
                else {
                    _this.finalOptions = _this.options.filter(function(i) {
                        if (i.name) return i.name.match($searchInput.val());
                    });
                }
                updateDisplay();
            });
        }
    }

    $val.on('click', function(e) {
        _this.$input.trigger('crsa-select-show');
        _this.showSelect();
        e.preventDefault();
    });


}