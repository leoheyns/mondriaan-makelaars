$(function () {
    $('body').one('pinegrow-ready', function (e, pinegrow) {//Wait for Pinegrow to start-up

        // Create new Pinegrow framework object
        var f = new PgFramework('pg.project.items', 'Project items');
        pinegrow.addFramework(f);

        f.default = true;
        f.show_in_manager = false;

        var requireSelectedElement = function(callback) {
            f.requireSelectedElement(callback);
        }

        var openTeamplateBrowser = function (projectTemplates, selectedProjcetTemplate, callback) {
            if(projectTemplates) {
                crsaTemplateBrowser = new CrsaProjectBrowser();
                crsaTemplateBrowser.title = "Add a page to your project";
                crsaTemplateBrowser.intro = '<p>Choose a page to add to your project:</p>';
                crsaTemplateBrowser.setProjects(projectTemplates);
                crsaTemplateBrowser.selectedProject = selectedProjcetTemplate;
                crsaTemplateBrowser.onFileSelected = function(cf, selectedProject) {
                    callback(cf, selectedProject);
                };
                crsaTemplateBrowser.show();
            }
        }

        var addNewFolderTo = function (destPath, folderName) {
            folderName = folderName || "";
            pinegrow.showPrompt('Name of the new folder', 'New folder', folderName, 'Folder name', null, function(name) {
                if (name.length) {
                    var path = require('path');
                    var folder_path = path.join(destPath, name);
                    if (!crsaIsFileExist(folder_path)) {
                        crsaCreateDirs(folder_path);
                        pinegrow.refreshCurrentProject();
                    } else {
                        pinegrow.showAlert("Folder/File with the same name (<b>" + name + "</b>) exists. Please choose a different name.", "Folder/File with Same Name Found", null, "Ok", null, function () {
                            addNewFolderTo(destPath, name);
                        });
                    }
                } else {
                    pinegrow.showAlert('Folder name should not be blank', 'Error', null, "Ok", null, function () {
                        addNewFolderTo(destPath, '');
                    });
                }
            })
        }

        var showPromptForFile = function (destUrl, cf, project, selectedProject, selectedProjcetTemplate, fileName) {
            if (!fileName) {
                if (!selectedProject.master_page) fileName = cf.name;
            }

            pinegrow.showPrompt('Name of the new page', 'New page', fileName, 'Page name', null, function(name) {
                if (name.length) {
                    var file_url = crsaCombineCurrentUrlWith(destUrl, name);
                    if(!project.getFileForUrl(file_url)) {
                        try {
                            var new_file = cf.copyFileToNewPath(crsaMakeFileFromUrl(file_url));

                            pinegrow.openPage(new_file.url, function (cp) {
                                pinegrow.fixLinks(project, cp, cf.url, new_file.url, function () {
                                    if (selectedProject == project) {
                                        cp.crsaProjectTemplate = selectedProjcetTemplate;
                                        var comp = pinegrow.findFrameworkByKey('pg.components');
                                        comp.useMasterPage(cp, project, cf);
                                        comp.updateEditableAreas(cp);
                                    }
                                    else {
                                        cp.crsaProjectTemplate = selectedProject;
                                    }

                                    cp.detectAndAddFrameworks();
                                    cp.save(function () {
                                        pinegrow.refreshCurrentProject(function () {
                                            cp.refresh();
                                        });
                                    }, true, false, false, true, true /* first save */);
                                }, true);
                            });
                        }
                        catch(err) {
                            pinegrow.showAlert(err, 'Error');
                        }
                    } else if (name) {
                        pinegrow.showAlert("The page <b>" + name + "</b> already exists. Please choose a different name.", "File with Same Name Found", null, "Ok", null, function () {
                            showPromptForFile(destUrl, cf, project, selectedProject, selectedProjcetTemplate, name);
                        });
                    }
                } else {
                    pinegrow.showAlert('Filename should not be blank', 'Error', null, "Ok", null, function () {
                        showPromptForFile(destUrl, cf, project, selectedProject, selectedProjcetTemplate, '');
                    });
                }
            });
        }

        var addNewFileTo = function (destUrl) {
            var project = pinegrow.getCurrentProject();
            project.master_page = true;
            project.show_only_master_pages = true;

            var pi = project.getProjectInfo();
            var template_id = pi.getSetting('template_framework_id');
            var selectedProjcetTemplate = pinegrow.projectTemplates.filter(function(temp){ return temp.framework.type == template_id; });
            if (selectedProjcetTemplate.length > 0)
                selectedProjcetTemplate = selectedProjcetTemplate[0];
            else
                selectedProjcetTemplate = pinegrow.projectTemplates[0];

            var projectTemplates = [project];

            if(!pinegrow.isContributorMode()) {
                projectTemplates = projectTemplates.concat(pinegrow.projectTemplates);
            }

            openTeamplateBrowser(projectTemplates, selectedProjcetTemplate, function (cf, selectedProject) {
                showPromptForFile(destUrl, cf, project, selectedProject, selectedProjcetTemplate)
            });
        }

        f.on_project_menu = function(page, project) {
            var items = [];

            items.push({
                label: 'Reload project',
                func: function() {
                    pinegrow.refreshCurrentProject();
                }
            })
            items.push({
                label: 'Add new folder...',
                func: function () {
                    addNewFolderTo(project.getDir());
                }
            })
            items.push({
                label: 'Add new page...',
                func: function () {
                    addNewFileTo(crsaMakeUrlFromFile(project.getDir()));
                }
            })
            items.push({
                label: 'Delete backups...',
                func: function() {
                    pinegrow.showAlert("<p>Are you sure you want to delete all <b>_pgbackup</b> folders in the project?</p><p>_pgbackup folders contain backup copies of changed files, if backup is enabled in Settings.</p>", "Delete all backups?", "No", "Yes", null, function() {

                        project.findFilesByName('_pgbackup').forEach(function(file) {
                            file.delete();
                        })
                        pinegrow.showQuickMessage('Backups deleted!');
                        pinegrow.refreshCurrentProject();
                    });
                    pinegrow.stats.using('prj.deletebackups');
                }
            })
            items.push({
                label: 'Close project',
                func: function () {
                    pinegrow.closeCurrentProject();
                }
            })
            return items;
        }

        f.on_project_item_preview = function(page, file) {
            var mimeType = pinegrow.getMimeType(file.name);
            if(mimeType && mimeType.startsWith('image/')) {
                return '<img src="' + file.url + '" />';
            }
        }


        f.on_project_item_get_context_menu = function(page, file, project) {
            var closeFilePage = function (fileURL) {
                var filePage = pinegrow.getCrsaPageByUrl(fileURL);
                if (filePage){
                    filePage.close();
                    return true;
                }
                return false;
            }

            var items = [];

            items.push({
                divider: true,
                header: 'Pages'
            })

            if(!file.isFile) {
                items.push({
                    label: "Add new folder...",
                    func: function() {
                        addNewFolderTo(file.path);
                        pinegrow.stats.using('prj.newfolder');
                    }
                })
                items.push({
                    label: "Add new page...",
                    func: function() {
                        addNewFileTo(file.url);
                        pinegrow.stats.using('prj.newpage');
                    }
                })
            }



            if(file.isEditable) {
                items.push({
                    label: 'Open',
                    func: function() {
                        pinegrow.openOrShowPage(file.url);
                        pinegrow.stats.using('prj.openfile');
                    }
                })
            }

            if(file.isEditable) {
                items.push({
                    label: 'Open as partial...',
                    func: function() {
                        var openPartial = new pgOpenPartialInContainer(file.url, null, true);
                        pinegrow.stats.using('prj.openpartial');
                    }
                })
            }

            if(file.isFile) {
                items.push({
                    label: 'Open in code editor',
                    func: function() {
                        pinegrow.openFileInCodeEditor(file.path);
                        pinegrow.stats.using('prj.editcode');
                    }
                })
            }

            var file_page = pinegrow.getCrsaPageByUrl(file.url) || project.getBackgroundPageForUrl(file.url);
            if(file_page) {
                items.push({
                    label: 'Save',
                    func: function() {
                        if(canSavePage(file_page)) {
                            file_page.save(null, true, true, false, true);
                        }
                    }
                })
            }

            items.push({
                label: 'Duplicate...',
                func: function() {
                    pinegrow.stats.using('prj.duplicate');
                    pinegrow.showPrompt('Name of the new file', 'Duplicate file', file.name, null, null, function(name) {
                        if(name.length && name != file.name) {
                            try {
                                var project_info = project.getProjectInfo();
                                var page_info = project_info.getSettingsForFile( file.path );

                                var new_file = file.duplicate( name );
                                for (var key in page_info) {
                                    project_info.setSettingForFile(new_file.path, key, page_info[key]);
                                }
                                project_info.save();

                                var onDone = function() {
                                    pinegrow.refreshCurrentProject();
                                }

                                //this would fit better with comps
                                var new_cp = pinegrow.getCrsaPageForUrl(new_file.url);
                                if(new_cp) {
                                    var defs = new_cp.sourceNode.find('[data-pgc-define]');
                                    if(defs.length > 0) {
                                        var names = [];
                                        for(var i = 0; i < defs.length; i++) {
                                            names.push(defs[i].getAttr('data-pgc-define'));
                                        }
                                        pinegrow.showAlert('<p>The page contains <b>component definitions</b> for components: ' + names.join(', ') + '.</p><p>Do you want to:<ul><li><b>Keep these definitions in the new page</b> (and have duplicate definitions, which you would need to fix later)<br />- or -</li><li><b>Replace component definitions with component instances in the new page</b>?</li></ul></p>', 'What to do with component definitions?', 'Keep definitions', 'Replace with instances', function() {
                                            //keep
                                            onDone();
                                        }, function() {
                                            //replace
                                            pinegrow.findFrameworkByKey('pg.components').changeComponentDefinitionsToComponentInstances(new_cp.sourceNode);
                                            new_cp.save();
                                            onDone();
                                        })
                                    } else {
                                        onDone();
                                    }
                                } else {
                                    onDone();
                                }
                            }
                            catch(err) {
                                pinegrow.showAlert(err, 'Error');
                            }
                        } else {
                            pinegrow.showQuickMessage('Nothing to do...');
                        }

                    })
                }
            })

   /*         items.push({
                label: 'Reload project',
                func: function() {
                    pinegrow.refreshCurrentProject();
                }
            })
*/
            items.push({
                label: 'Delete...',
                func: function() {
                    pinegrow.showAlert("Are you sure you want to delete <b>"+file.name+"</b>?", "Delete file/folder", "No", "Yes", null, function() {
                        if (file.delete()) {
                            closeFilePage(file.url);
                            pinegrow.showQuickMessage('<b>'+file.name+'</b> deleted successfuly.');
                            pinegrow.refreshCurrentProject();
                        }
                        else {
                            pinegrow.showQuickMessage('Failed to delete <b>'+file.name+'</b>.');
                        }
                    });
                    pinegrow.stats.using('prj.delete');
                }
            })

            items.push({
                label: 'Rename...',
                func: function() {
                    pinegrow.stats.using('prj.rename');
                    pinegrow.showPrompt('Enter the new file name', 'Rename file/folder', file.name, "New file name", null, function(name) {
                        if(name.length && name != file.name) {
                            var filePage = pinegrow.getCrsaPageByUrl(file.url);
                            if (filePage) filePage.save(null, true);

                            var renameFile = function () {
                                try {
                                    var project_info = project.getProjectInfo();
                                    var page_info = project_info.getSettingsForFile( file.path );

                                    var new_file = file.rename(name);
                                    for (var key in page_info) {
                                        project_info.setSettingForFile(new_file.path, key, page_info[key]);
                                    }
                                    project_info.save();
                                    pinegrow.showQuickMessage('<b>'+file.name+'</b> renamed successfuly.');
                                    if (closeFilePage(file.url)) {
                                        if (new_file) {
                                            pinegrow.openOrShowPage(new_file.url, function (cp) {
                                                cp.detectAndAddFrameworks();
                                                pinegrow.updatePluginControlsForSelectedPage(cp);
                                            });
                                        }
                                    }
                                    pinegrow.refreshCurrentProject();
                                }
                                catch(err) {
                                    pinegrow.showQuickMessage('Failed to rename <b>'+file.name+'</b>.');
                                }
                            }

                            if (file.doesFileExistInSameDir(name)) {
                                if (!file.isDirectoryInTheSameDir(name)) {
                                    pinegrow.showQuickMessage("You can't overwrite directory");
                                }
                                else {
                                    pinegrow.showAlert("Are you sure you want to overwrite <b>"+name+"</b>?", "overwrite file", "No", "Yes", null, function() {
                                        renameFile();
                                    });
                                }
                            }
                            else {
                                renameFile();
                            }

                        }
                        else {
                            pinegrow.showQuickMessage('Nothing to do...');
                        }
                    });
                }
            })
            items.push({
                label: 'Fix links...',
                func: function () {
                    pinegrow.stats.using('prj.fixlinks');
                    willMakeChange(page.$iframe, 'Fixing links');
                    pinegrow.fixLinks(project, page, null, page.url, function () {
                        page.refresh();
                        didMakeChange(page.$iframe);
                    });
                }
            })

            var selectedElementName = pinegrow.getSelectedElementName() || 'selected element';
            var mimeType = pinegrow.getMimeType(file.name);

            if(mimeType && mimeType.startsWith('image/')) {
                items.push({
                    divider: true,
                    header: 'Images'
                })
                items.push({
                    label: 'Insert image after <b>' + selectedElementName + '</b>',
                    func: function() {
                        requireSelectedElement(function(cp, $el, pgel) {
                            var url = cp.makeRelativeUrl(file.url);

                            var code = '<img src="' + url + '" />';
                            var imgel = (new pgQuery()).create(code);

                            pinegrow.makeChanges(cp, $el.parent(), 'Insert image', function() {
                                imgel.insertAfter(pgel);
                                pinegrow.setNeedsUpdate($el.parent());
                            })
                            pinegrow.showQuickMessage('Image inserted.');
                        });
                    }
                })
                items.push({
                    label: 'Append image to <b>' + selectedElementName + '</b>',
                    func: function() {
                        requireSelectedElement(function(cp, $el, pgel) {
                            var url = cp.makeRelativeUrl(file.url);

                            var code = '<img src="' + url + '" />';
                            var imgel = (new pgQuery()).create(code);

                            pinegrow.makeChanges(cp, $el, 'Append image', function() {
                                pgel.append(imgel);
                                pinegrow.setNeedsUpdate($el);
                            })
                            pinegrow.showQuickMessage('Image appended.');
                        });
                    }
                })
            }

            //Link to
            items.push({
                divider: true,
                header: 'Links'
            })
            items.push({
                label: 'Set href/src of <b>' + selectedElementName + '</b>',
                func: function() {
                    requireSelectedElement(function(cp, $el, pgel) {
                        var url = cp.makeRelativeUrl(file.url);
                        var src_tags = 'img,script,iframe';
                        var attr;
                        if(pgel.is(src_tags)) {
                            attr = 'src';
                        } else {
                            attr = 'href';
                        }
                        pinegrow.makeChanges(cp, $el, 'Set ' + attr, function() {
                            pgel.attr(attr, url);
                        })
                        pinegrow.showQuickMessage('<b>' + attr + '</b> set to ' + url);
                    });
                }
            })

            items.push({
                label: 'Append link to <b>' + selectedElementName + '</b>',
                func: function() {
                    requireSelectedElement(function(cp, $el, pgel) {
                        var url = cp.makeRelativeUrl(file.url);

                        var code = '<a href="' + url + '">' + file.name + '</a>';
                        var linkel = (new pgQuery()).create(code);

                        pinegrow.makeChanges(cp, $el, 'Insert link', function() {
                            pgel.append(linkel);
                        })
                        pinegrow.updateTree($el);
                        pinegrow.showQuickMessage('Link appended.');
                    });
                }
            })

            items.push({
                label: 'Insert link after <b>' + selectedElementName + '</b>',
                func: function() {
                    requireSelectedElement(function(cp, $el, pgel) {
                        var url = cp.makeRelativeUrl(file.url);

                        var code = '<a href="' + url + '">' + file.name + '</a>';
                        var linkel = (new pgQuery()).create(code);

                        pinegrow.makeChanges(cp, $el.parent(), 'Insert link', function() {
                            linkel.insertAfter(pgel);
                        })
                        pinegrow.updateTree($el.parent());
                        pinegrow.showQuickMessage('Link inserted.');
                    });
                }
            })

            return items;
        }

        f.aaaon_project_loaded = function(selectedPage, project) {
            var links_count = 0;

            project.forEachEditableFile( function( page, pageDone, status ) {
                //on page
                var links = page.sourceNode.find('[href]');
                links_count += links.length;
                status.errors.push('Oh no!');
                pageDone(page, status);

            }, function() {
                //on done
                pinegrow.showQuickMessage('Found ' + links_count + ' links.');
            }, 'Just fooling around...')
        }

    });

});