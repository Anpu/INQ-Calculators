$(function() {
    $("#main").tabs().bind('tabsshow',function (event, ui) {
        if (ui.tab.hash.length > 0) {
            location.hash = '/'+ui.tab.hash.substr(1);
        }
    });
    if (location.hash.length > 0 && $(location.hash.substr(2))) {
        $('#main').tabs('select',location.hash.substr(2));
    }
    $('#main').tabs('option','fx',{opacity:'toggle'});

    $('#pets_go').click(function () {
        var selected_regions = [];
        var values = $('#pets_region_map').mapWidget('value');
        for (var k in values) {
            if (values[k]) {
                selected_regions.push(k);
            }
        }
        getTameableMobs(
            $('#pets_level').digitPicker('value'),
            $('#pets_maxpower').mapWidget('value')['level'],
            selected_regions
        );
    });

    /** Pet Character Level Chooser */
    $('#pets_level').digitPicker({
        'min':1,
        'max':50,
        'defaultValue':1
    });
    $('#pets_maxpower').mapWidget({
        maps: {
            bg:{config:{image:'MAXPower',bgoffset:new Point(0,0)}},
            level:{
                config:{image:'MAXPower','default':'5'},
                areas:{
                    '1':{
                        map:new Polygon([[0,148],[25,148],[25,186],[0,186]]),
                        offset:new Point(-25,0)
                    },
                    '2':{
                        map:new Polygon([[0,111],[25,111],[25,148],[0,148]]),
                        offset:new Point(-50,0)
                    },
                    '3':{
                        map:new Polygon([[0, 74],[25, 74],[25,111],[0,111]]),
                        offset:new Point(-75,0)
                    },
                    '4':{
                        map:new Polygon([[0, 37],[25, 37],[25, 74],[0, 90]]),
                        offset:new Point(-100,0)
                    },
                    '5':{
                        map:new Polygon([[0,  0],[25,  0],[25, 37],[0, 37]]),
                        offset:new Point(-125,0)
                    }
                }
            },
            num:{config:{image:'MAXPower',bgoffset:new Point(-150,0)}}
        }
    });
    /** Pet Region Map Magic */
    $('input[name="pets_regions"]')
        .change(function () {
            $('#pets_region_map').mapWidget('setValue',$(this).val(),$(this).is(':checked'));
        })
        .next('label')
        .disableSelection();
    $('#pets_region_map').mapWidget({
        init: function() {
            // Initialize the values
            var self = $(this);
            $('input[name="pets_regions"]:checked').each(function() {
                self.mapWidget('setValue',$(this).val(),true);
            });
        },
        click: function(e, hit) {
            if (hit.map) {
                var value = $(this).mapWidget('value')[hit.map];
                $('input[name="pets_regions"][value="'+hit.map+'"]')
                    .attr('checked',!!value);
            }
        },
        'class':'ROMap',
        maps: {
            'map':{config:{image:'ROMapImage map'}},
            'syrtis-iz':{
                config:{image:'ROMapImage syrtis-iz',hint:"Syrtis Initiation Zone"},
                areas:{
                  'main': {toggle:true,map:new Polygon([[17.2,158.2],[24.2,153.2],[30.2,154.2],[32.2,158.2],[37.2,153.2],[45.2,155.2],[52.2,161.2],[57.2,159.2],[62.2,163.2],[63.2,174.2],[52.2,175.2],[44.2,173.2],[32.2,176.2],[23.2,173.2],[18.2,168.2]])}
                }
            },
            'syrtis-ir':{
                config:{image:'ROMapImage syrtis-ir',hint:"Syrtis Inner Realm"},
                areas:{
                    'main': {toggle:true,map:new Polygon([[46.2,151.2],[43.2,148.2],[43.2,145.2],[35.2,137.2],[37.2,129.2],[39.2,126.2],[41.2,121.2],[45.2,118.2],[51.2,116.2],[52.2,111.2],[60.2,110.2],[64.2,114.2],[71.2,115.2],[81.2,121.2],[94.2,126.2],[98.2,133.2],[99.2,142.2],[96.2,149.2],[94.2,155.2],[95.2,158.2],[98.2,157.2],[102.2,160.2],[100.2,164.2],[97.2,166.2],[94.2,162.2],[93.2,159.2],[87.2,161.2],[81.2,166.2],[72.2,166.2],[66.2,161.2],[65.2,157.2],[62.2,154.2],[61.2,148.2],[63.2,144.2],[66.2,142.2],[65.2,139.2],[62.2,139.2],[57.2,141.2],[55.2,147.2],[51.2,151.2]])}
                }
            },
            'syrtis-wz':{
                config:{image:'ROMapImage syrtis-wz',hint:"Syrtis War Zone"},
                areas:{
                    'main': {toggle:true,map:new Polygon([[61.2,111.2],[62.2,110.2],[62.2,106.2],[59.2,104.2],[59.2,102.2],[56.2,102.2],[52.2,101.2],[51.2,97.2],[57.2,91.2],[63.2,89.2],[68.2,87.2],[75.2,88.2],[82.2,88.2],[86.2,91.2],[93.2,91.2],[101.2,95.2],[105.2,95.2],[109.2,101.2],[111.2,104.2],[116.2,104.2],[118.2,108.2],[116.2,112.2],[120.2,117.2],[117.2,123.2],[117.2,129.2],[114.2,132.2],[115.2,134.2],[122.2,134.2],[125.2,137.2],[126.2,141.2],[125.2,146.2],[120.2,151.2],[113.2,151.2],[109.2,148.2],[105.2,145.2],[102.2,142.2],[101.2,137.2],[105.2,134.2],[106.2,128.2],[101.2,124.2],[98.2,123.2],[95.2,126.2],[83.2,121.2],[73.2,117.2]])}
                }
            },
            'ignis-iz':{
                config:{image:'ROMapImage ignis-iz',hint:"Ignis Initiation Zone"},
                areas:{
                    'main': {toggle:true,map:new Polygon([[133.2,27.2],[139.2,26.2],[145.2,12.2],[183.2,11.2],[182.2,68.2],[173.2,58.2],[161.2,57.2],[155.2,54.2],[150.2,49.2],[146.2,42.2],[141.2,35.2]])}
                }
            },
            'ignis-ir':{
                config:{image:'ROMapImage ignis-ir',hint:"Ignis Inner Realm"},
                areas:{
                    'main': {toggle:true,map:new Polygon([[114.2,43.2],[118.2,38.2],[121.2,33.2],[125.2,29.2],[129.2,27.2],[136.2,27.2],[143.2,34.2],[151.2,43.2],[159.2,49.2],[169.2,59.2],[171.2,61.2],[166.2,61.2],[163.2,64.2],[168.2,68.2],[170.2,73.2],[166.2,77.2],[165.2,83.2],[165.2,89.2],[159.2,90.2],[151.2,88.2],[149.2,83.2],[139.2,81.2],[134.2,80.2],[130.2,70.2],[129.2,63.2],[127.2,59.2]])}
                }
            },
            'ignis-wz':{
                config:{image:'ROMapImage ignis-wz',hint:"Ignis War Zone"},
                areas:{
                    'main': {toggle:true,map:new Polygon([[116.2,122.2],[119.2,119.2],[118.2,115.2],[115.2,112.2],[118.2,107.2],[115.2,104.2],[111.2,104.2],[105.2,96.2],[106.2,90.2],[103.2,85.2],[101.2,81.2],[96.2,72.2],[96.2,63.2],[97.2,56.2],[101.2,52.2],[107.2,50.2],[109.2,46.2],[113.2,43.2],[126.2,57.2],[129.2,67.2],[135.2,79.2],[132.2,84.2],[130.2,92.2],[132.2,96.2],[135.2,94.2],[138.2,91.2],[135.2,87.2],[138.2,85.2],[144.2,85.2],[148.2,87.2],[149.2,96.2],[149.2,101.2],[145.2,103.2],[141.2,101.2],[134.2,101.2],[132.2,105.2],[133.2,110.2],[130.2,117.2],[123.2,120.2],[120.2,124.2]])}
                }
            },
            'alsius-iz':{
                config:{image:'ROMapImage alsius-iz',hint:"Alsius Initiation Zone"},
                areas:{
                    'main': {toggle:true,map:new Polygon([[17.2,16.2],[21.2,13.2],[29.2,14.2],[35.2,13.2],[39.2,14.2],[41.2,22.2],[43.2,19.2],[49.2,18.2],[56.2,19.2],[58.2,24.2],[53.2,27.2],[50.2,35.2],[45.2,37.2],[40.2,36.2],[37.2,39.2],[34.2,41.2],[31.2,40.2],[29.2,43.2],[27.2,45.2],[23.2,46.2],[22.2,43.2],[19.2,38.2],[24.2,34.2],[21.2,30.2],[17.2,26.2]])}
                }
            },
            'alsius-ir':{
                config:{image:'ROMapImage alsius-ir',hint:"Alsius Inner Realm"},
                areas:{
                    'main': {toggle:true,map:new Polygon([[50.2,35.2],[54.2,35.2],[61.2,33.2],[66.2,28.2],[73.2,42.2],[74.2,54.2],[69.2,58.2],[68.2,62.2],[61.2,67.2],[54.2,72.2],[46.2,83.2],[42.2,82.2],[36.2,84.2],[27.2,89.2],[22.2,89.2],[19.2,86.2],[19.2,80.2],[18.2,69.2],[19.2,62.2],[19.2,56.2],[22.2,53.2],[29.2,51.2],[28.2,45.2],[31.2,41.2],[35.2,42.2],[37.2,38.2],[41.2,36.2],[44.2,37.2]])}
                }
            },
            'alsius-wz':{
                config:{image:'ROMapImage alsius-wz',hint:"Alsius War Zone"},
                areas:{
                    'main': {toggle:true,map:new Polygon([[74.2,54.2],[78.2,54.2],[81.2,49.2],[91.2,51.2],[91.2,48.2],[87.2,46.2],[85.2,40.2],[88.2,36.2],[99.2,35.2],[104.2,40.2],[103.2,46.2],[100.2,42.2],[97.2,44.2],[95.2,49.2],[99.2,52.2],[97.2,57.2],[96.2,63.2],[95.2,71.2],[100.2,77.2],[102.2,83.2],[94.2,84.2],[89.2,83.2],[80.2,87.2],[74.2,87.2],[70.2,87.2],[62.2,88.2],[58.2,89.2],[54.2,92.2],[50.2,91.2],[50.2,88.2],[46.2,83.2],[52.2,76.2],[57.2,70.2],[65.2,65.2],[70.2,59.2]])}
                }
            }
        }
    });

    /** NPC Search */
    $('#npcs_name').keypress(function(e) {
        // Handle Enter to auto search
        if (e.keyCode==13) {
            $('#npcs_go').click();
        }
    });
    $('#npcs_go').click(function() {
        findNPCs($('#npcs_name').val());
    });

    /** Mob Search */
    $('#mobs_name').keypress(function(e) {
        // Handle Enter to auto search
        if (e.keyCode==13) {
            $('#mobs_go').click();
        }
    });
    $('#mobs_go').click(function() {
        findMobs($('#mobs_name').val());
    });
});

function getTameableMobs(player_level, maxpower, regions, offset) {
    var args = {
        player_level: player_level || 1,
        max_power: maxpower || 5,
        regions: regions instanceof Array ? regions.join(',') : regions || '',
        offset: offset || 0
    };
    $.getJSON(ajaxRoot + 'getTameable',args, loadTameableMobs);
}

function findNPCs(name, behavior, profession, realm, offset) {
    var args = {
        name: name || '',
        behavior: behavior || '',
        profession: profession || '',
        realm: realm || '',
        offset: offset || 0
    };
    $.getJSON(ajaxRoot + 'findNPCs',args, loadNPCs);
}

function findMobs(name, realm, offset) {
    var args = {
        name: name || '',
        realm: realm || '',
        offset: offset || 0
    };
    $.getJSON(ajaxRoot + 'findMobs',args, loadMobs);
}

function loadTameableMobs(json, textStatus) {
    $('#pets_results').html(json.data);
}

function loadNPCs(json, textStatus) {
    $('#npcs_results').html(json.data);
}

function loadMobs(json, textStatus) {
    $('#mobs_results').html(json.data);
}
