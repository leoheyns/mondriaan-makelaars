(function( $ ) {

    $.fn.crsastorage = function( method ) {

        if ( methods[method] ) {
            return methods[method].apply( this, Array.prototype.slice.call( arguments, 1 ));
        } else if ( typeof method === 'object' || ! method ) {
            return methods.init.apply( this, arguments );
        } else {
            $.error( 'Method ' +  method + ' does not exist on jQuery.crsastorage' );
        }
    };


    var options;
    var pages;
    var client;
    var projects = [];
    var load_count = 0;
    var serviceUrl = "service/index.php";
    var project = null;

    var methods = {
        init : function( opts ) {
            options = $.extend( {}, $.fn.crsastorage.defaults, opts );
        },
        auth : function() {
        },
        authDone : function() {
            loadProjects();
        },
        createProject : function(name) {
            client.mkdir("/" + name, function(error, stat) {
                if (error) {
                    showError(error);
                    return;
                }
                projects.push(stat);
                client.makeUrl(stat.path, {long : true}, function(error, share) {
                    if (error) {
                        showError(error);
                        return;
                    }
                    console.log(share);
                });
            });
        },
        openProject : function(pid) {

            project = null;

            var onDone = function() {
                methods.openProjectBrowser(project);
            }
            callService('getProject', {pid : pid}, function(error, data) {
                if(handleError(error)) return;
                console.log(data);
                project = data;
                methods.openProjectBrowser(project);
            });
        },
        openProjectBrowser : function(p) {
            if(typeof p == 'undefined' || !p) p = project;
            var $b = $('<div/>', {'class' : 'crsa-project-browser'}).appendTo($('body'));
            var $title = $('<h2/>').html(p.name).appendTo($b);
            var $tree = $('<div/>', {'class' : 'crsa-project-tree'}).appendTo($b);
            var $grid = $('<div/>', {'class' : 'crsa-project-grid'}).appendTo($b);
            var $upload = $('<a/>', {'href' : '#', 'class' : 'crsa-project-upload'}).html('Upload').appendTo($b);

            $upload.on('click', function() {
                var nodeData = selectedNode.data('crsa-node');
                filepicker.pickAndStore({
                    multiple : true,
                    services:['COMPUTER']
                }, {
                    location:"S3",
                    path: nodeData.storagePrefix
                }, function(InkBlobs){
                    console.log(InkBlobs);

                    $.each(InkBlobs, function(i, blob) {

                        callService('addFile', {
                            pid : p.pid,
                            filePickerUrl : blob.url,
                            key : blob.key,
                            fileName : blob.filename,
                            mimeType : blob.mimetype
                        }, function(error, data) {
                            if(handleError(error)) return;
                            console.log(data.file);
                            var found = -1;
                            $.each(nodeData.children, function(i,n) {
                                if(n.relativeUrl == data.file.relativeUrl) {
                                    found = i;
                                    return false;
                                }
                            });
                            if(found >= 0) {
                                nodeData.children[found] = data.file;
                            } else {
                                nodeData.children.push(data.file);
                                selectNode(selectedNode);
                            }
                        });
                    });
                }, function(error) {
                    console.log(error);
                });
                return false;
            });
            var makeTreeLevel = function(node, $dest) {
                var $li = $('<li/>').html('<div>' + node.name + '</div>').appendTo($dest);
                $li.data('crsa-node', node);
                if(node.children) {
                    var $ul = $('<ul/>').appendTo($li);
                    $.each(node.children, function(i,sn) {
                        if(sn.isFolder) {
                            makeTreeLevel(sn, $ul);
                        }
                    });
                }
            }

            function sortNodes(a, b){
                var aName = a.name.toLowerCase();
                var bName = b.name.toLowerCase();
                return ((aName < bName) ? -1 : ((aName > bName) ? 1 : 0));
            }

            var showGrid = function(node) {
                $grid.html('');
                if(!node.children) return;

                node.children.sort(sortNodes);
                $.each(node.children, function(i,s) {
                    if(s.isFile) {
                        var $e = $('<div/>').html(s.name).appendTo($grid);
                    }
                });
            }

            var selectNode = function($li) {
                var node = $li.data('crsa-node');
                showGrid(node);
                if(selectedNode) selectedNode.removeClass('active');
                $li.addClass('active');
                selectedNode = $li;
            }

            var selectedNode = null;

            var $root = $('<ul/>').appendTo($tree);
            makeTreeLevel(p.files, $root);

            selectNode($root.find('>li'));

            $root.find('li').on('click', function(event) {
                var $li = $(event.delegateTarget);
                selectNode($li);
                return false;
            });

            return $b;
        }
    };

    var saveProjectCache = function(project) {
        var pf = null;
        $.each(project.crsa_files, function(i,s) {
            if(s.name == 'pinegrow.json') {
                pf = s;
                return true;
            }
        });

        var name = project.crsa_project_name;

        client.writeFile("/" + name + "/pinegrow.json", JSON.stringify(project), {lastVersionTag : (pf ? pf.versionTag : null)}, function(error, stat) {
            if(error) {
                showError(error);
            } else {
                console.log("Project cache saved");
            }
        });
    }

    var getPublicUrl = function(path, func, onDone) {
        load_count++;
        client.makeUrl(path, {downloadHack : true}, function(error, share) {
            if (error) {
                //showError(error);
                load_count--;
                if(onDone && load_count <= 0) onDone();
                return;
            }
            func(share);
            load_count--;
            if(onDone && load_count <= 0) onDone();
        });
    }

    var loadProjectFolder = function(path, node, onDone) {
        load_count++;
        client.readdir(path, {}, function(error, names, currentStat, stats) {
            if(error) {

            } else {
                $.each(stats, function(i,s) {
                    node.crsa_files.push(s);

                    if(s.isFolder) {
                        s.crsa_files = [];
                        loadProjectFolder(s.path, s, onDone);
                    }
                    if(s.isFile && !s.crsa_share) {
                        getPublicUrl(s.path, function(share) {
                            s.crsa_share = share;
                        }, onDone);
                    }
                });
            }
            load_count--;

            if(load_count <= 0) {
                onDone();
            }
        });
    }

    var loadProjects = function() {
        projects = [];
        client.readdir("/", {}, function(error, names, currentStat, stats) {
            if (error) {
                showError(error);
                return;
            }
            console.log(stats);
            $.each(stats, function(i,s) {
                if(s.isFolder) {
                    var p = s;
                    projects.push(p);
                    console.log('Project ' + p.name);
                }
            });
        });
    }


    var handleError = function(error) {
        return error ? true : false;
    }

    var callService = function(cmd, data, func) {
        var url = serviceUrl + '?cmd=' + cmd;
        var req = $.ajax(url, {
            data : data,
            type : 'POST'
        });
        req.done(function(msg) {
            if(msg.status && msg.status == "OK") {
                func(null, msg);
            } else {
                func(msg.status, msg);
            }
        });
        req.fail(function(jqXHR, textStatus) {
            if(!textStatus) textStatus = "Unknown error";
            func(textStatus);
        });
    }


    var updatePagesList = function($el) {
        return $el.each(function(i,e){
            pages = $(e).find('div.page');
        });
    }

    // Plugin defaults – added as a property on our plugin function.
    $.fn.crsastorage.defaults = {
    };



})( jQuery );
