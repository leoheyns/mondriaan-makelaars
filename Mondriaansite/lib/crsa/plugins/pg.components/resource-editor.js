/**
 * Created by Matjaz on 16/10/15.
 */

/*
 We need a way to specify which CSS, JS files and folders are resources that need to be copied to a project which is using this as a library.

 Check addRequireFile in pg.components.js for how it is done now. That's not good.

 We should store resource list in ProjectInfo.

 JS files need to have Include in footer checkbox.

 Order of resources is also important.

 ResourceEditor should be a dialog with a list of resources and a way to reorder, add, remove them.

 Resource can also be a remote URL.

 Adding files/urls:
 - type url in input box
 - use select file, select folder to choose
 - right click on PRJ item, choose Require

 */

var PgResourceEditor = function (project) {

    var getAllResources = function () {
        var info = project.getProjectInfo();
        var resources = info.getSetting("project_resources");

        if (resources) return resources;
        return [];
    }

    var saveAllResources = function () {
        var info = project.getProjectInfo();
        info.setSetting("project_resources", resourcesList);
        info.save();
    }

    this.getResources = function () {
        return getAllResources();
    }

    this.getProject = function () {
        return project;
    }

    var $tbody;
    var $dialog;
    var _this = this;
    var showed = false;
    var keyNameTypeOpttions = {
        "Auto": "auto",
        "CSS": "text/css",
        "Javascript": "application/javascript"
    }
    var typeOptions = [{'key': keyNameTypeOpttions['Auto'], 'name': 'Auto'}, {'key': keyNameTypeOpttions['CSS'], 'name': 'CSS'}, {'key': keyNameTypeOpttions['Javascript'], 'name': 'Javascript'}];
    var resourcesList = getAllResources();

    var askToAddFileToFooter = function (callback) {
        makeAndShowDialog("Add to footer?", "No", "Yes", "Do you want to add this file to the footer", function () {
            if (callback) callback(false);
        }, function () {
            if (callback) callback(true);
        })
    }

    var saveNewResource = function (resource) {
        var info = project.getProjectInfo();
        var resources = info.getSetting("project_resources");

        if (!resources) resources = [];

        resources.push(resource);
        info.setSetting("project_resources", resources);

        info.save();
    }

    var removeItemFromList = function (index) {
        if (index > -1 && index < resourcesList.length) {
            resourcesList.splice(index, 1);
            return true;
        }
        return false;
    }

    var removeLinkClicked = function (e) {
        e.preventDefault();
        var $tr = $(this).parents('tr');
        if (removeItemFromList(parseInt($tr.attr('data-index')))) {
            updateList();
        }
    }

    var checkboxInputChanged = function (e) {
        e.preventDefault();
        var $tr = $(this).parents('tr');
        var resource = resourcesList[parseInt($tr.attr('data-index'))];
        if ($(this).is(':checked')) {
            resource.footer = true;
        }
        else {
            resource.footer = false;
        }
    }

    var selectboxInputChanged = function (e) {
        e.preventDefault();

        var $tr = $(this).parents('tr');
        var resource = resourcesList[parseInt($tr.attr('data-index'))];

        resource.type = $(this).val();

        var $checkbox = $tr.find('input[type="checkbox"]');
        if (resource.type == keyNameTypeOpttions['Javascript'])
            $checkbox.removeAttr('disabled');
        else
            $checkbox.attr('disabled', 'disabled');
    }

    var addNewItemToDialog = function (item, index) {
        var attr = '';
        var url = item.url;
        var footer = item.footer;
        var type = item.type || 'auto';

        var ext = crsaGetExtFromUrl(url);
        if (!ext || ext.toLowerCase() != "js")
            attr += ' disabled="disabled"';
        if (footer)
            attr += ' checked="checked"';

        var absolutePath = crsaMakeFileFromUrl(url);
        if (!crsaIsAbsoluteUrl(url)) {
            absolutePath = project.getAbsolutePath(crsaMakeFileFromUrl(url));
        }

        url = crsaGetSummaryStr(url, 60);
        if (crsaIsFileOrDir(absolutePath) == "dir") {
            url += " [Folder]";
        }

        var optionsStr = "";
        for (var i = 0; i < typeOptions.length; i++) {
            var option = typeOptions[i]
            optionsStr += '<option value="'+option.key+'"'+ ((option.key == type) ? 'selected' : '') +'>'+option.name+'</option>';
        }

        var $tr = $('<tr data-index="' + index + '"></tr>').appendTo($tbody);
        var $td = $('<td><label>' + url + '</label></td>').appendTo($tr);
        $td = $('<td><select class="url-type">' + optionsStr + '</select></td>').appendTo($tr);
        $td = $('<td style="text-align:center;"><input type="checkbox" value="1" ' + attr + '/></td>').appendTo($tr);
        $td = $('<td><a href="#" class="remove-url fa fa-fw fa-trash"></a></td>').appendTo($tr);
        $td = $('<td><a href="#" class="fa fa-fw fa-reorder"></a></td>').appendTo($tr);
    }

    var updateList = function () {
        $tbody.html('');
        if (resourcesList.length == 0) {
            var $tr = $('<tr></tr>').appendTo($tbody);
            var $td = $('<td><b>No files/folders added yet</b></td><td></td><td></td><td></td><td></td>').appendTo($tr);
        }
        else {
            for (var i = 0; i < resourcesList.length; i++) {
                var item = resourcesList[i];
                addNewItemToDialog(item, i);
            }
        }

        var $remove_urls = $tbody.find('.remove-url');
        $remove_urls.click(removeLinkClicked);

        var $checkboxes = $tbody.find('input[type="checkbox"]');
        $checkboxes.change(checkboxInputChanged);

        var $selectboxes = $tbody.find('select.url-type');
        $selectboxes.change(selectboxInputChanged);

        $tbody.sortable({
            update: function (event, ui) {
                var trArray = $(this).find('tr');

                var newResourceList = [];
                trArray.each(function (i, tr) {
                    newResourceList[i] = resourcesList[parseInt($(tr).attr('data-index'))];
                });
                resourcesList = newResourceList;
            }
        });
    }

    var openFileDialog = function (openFolder) {
        crsaChooseFile(function (url) {
            _this.requireFileFromUrl(url);
        }, false, false, false, openFolder)
    }

    var isUrlExist = function (url) {
        var res = resourcesList.filter(function (resource) {
            return resource.url == url
        });
        return (res.length > 0);
    }

    this.show = function () {
        showed = true;
        var title = "Resources of project " + project.getName();
        var $b = $("<div><p>Resources are CSS, JavaScript and media files required by the components from the project library. Individual files and folders can be added to the list:</p></div>");
        var $table = $('<table class="file-chooser table table-striped table-condensed table-hover"><thead><tr><td style="width:65%;"><label>File/Folder name</label></td><td><label>Type</label></td><td style="text-align:center;width:130px;"><label>Include in footer</label></td><td style="width:30px;"></td><td style="width:30px;"></td></tr></thead><tbody></tbody></table>').appendTo($b);
        $tbody = $table.find('tbody');

        updateList();

        var $form = $('<form class="form-inline load-files-folders" role="form"></form>').appendTo($b);
        var $title = $('<h5>Add url, file or folder as a resource:</h5>').appendTo($form);
        var $container = $('<div class="form-group" style="width:65%;"></div>').appendTo($form);
        var $input_container = $('<div class="input-group" style="width:98%;"></div>').appendTo($container);
        var $input = $('<input type="url" class="form-control url" placeholder="External url">').appendTo($input_container);
        var $add_url = $('<span class="input-group-addon"><i class="fa fa-plus"></i></span>').appendTo($input_container);
        var $select_file = $('<button type="submit" class="btn btn-default select-file">Select File</button>').appendTo($form);
        var $select_folder = $('<button type="submit" class="btn btn-default select-folder">Select Folder</button>').appendTo($form);

        $add_url.click(function (e) {
            e.preventDefault();
            if ($input.val()) {
                _this.requireFileFromUrl($input.val());
                $input.val('');
            }
        });

        $select_file.click(function (e) {
            e.preventDefault();
            openFileDialog(false);
        });

        $select_folder.click(function (e) {
            e.preventDefault();
            openFileDialog(true);
        });

        $dialog = makeAndShowDialog(title, "Close", "Save", $b, function () {
            resourcesList = getAllResources();
            showed = false;
        }, function () {
            saveAllResources();
            showed = false;
        })
    }

    this.isShown = function () {
        return showed;
    }

    this.requireFileFromUrl = function (url) {
        if (!showed) this.show();

        var params = crsaGetUrlParameters(url);
        url = crsaCleanUpUrl(url);

        var relativeUrl;
        if (project.getFileForUrl(url))
            relativeUrl = project.getRelativeUrl(url);
        else
            relativeUrl = url;

        relativeUrl += params;

        if (!isUrlExist(relativeUrl)) {
            var newResource = {
                url: relativeUrl,
                footer: false,
                type: 'auto'
            };

            resourcesList.push(newResource);
            addNewItemToDialog(newResource, resourcesList.length - 1);
            updateList();
        }
        else {
            pinegrow.showQuickMessage("File already added");
        }
    }

    var resetVariables = function (save) {
        if (save) saveAllResources();

        resourcesList = [];
        project = null;
        showed = false;
        if ($dialog) $dialog.remove();
    }

    $('body').on('crsa-project-closed', function (event, project) {
        if (showed) {
            makeAndShowDialog("Save cahnges", "No", "Yes", "Do you want to save changes?", function () {
                resetVariables(false);
            }, function () {
                resetVariables(true);
            })
        }
        else {
            resetVariables(false);
        }
    })

}