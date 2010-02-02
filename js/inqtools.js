// Compatability for "older browsers"
if (!Array.prototype.indexOf)
{
  Array.prototype.indexOf = function(elt /*, from*/)
  {
    var len = this.length >>> 0;

    var from = Number(arguments[1]) || 0;
    from = (from < 0)
         ? Math.ceil(from)
         : Math.floor(from);
    if (from < 0)
      from += len;

    for (; from < len; from++)
    {
      if (from in this &&
          this[from] === elt)
        return from;
    }
    return -1;
  };
}
// JQuery on ready event
$(function() {
    $("#main").tabs().bind('tabsshow',function (event, ui) {
        var o = $(ui.tab);
        switchTool(o.attr('callback') || '', o.attr('widgets') || '');
        if (ui.tab.hash.length > 0) {
            location.hash = '/'+ui.tab.hash.substr(1);
        }
    });

    // Begin tool widgets
    $('#player_level').digitPicker({
        min:1,
        max:50,
        defaultValue:1,
        change: function(e, value) {
            $('#min_level').digitPicker('setValue',value);
            $('#max_level').digitPicker('setValue',value+3);
        }
    });
    $('#min_level').digitPicker({
        min:1,
        max:58,
        defaultValue:1,
        change: function(e, value) {
            $('#max_level').digitPicker('setValue',value+3);
        }
    });
    $('#max_level').digitPicker({
        min:1,
        max:58,
        defaultValue:3
    });
    $('#maxpower').digitPicker({
        min:1,
        max:5,
        defaultValue:5
    });
    $('#region_map').mapWidget({
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

    $('#search').keypress(function(e) {
        // Handle Enter to auto search
        if (e.keyCode==13) {
            doSearch();
        }
    });

    $('#go').click(function() {
       doSearch();
    });

    // Do this AFTER all widgets are setup to insure they "hide" correctly
    if (location.hash.length > 0 && $('#'+location.hash.substr(2))) {
        $('#main').tabs('select','#'+location.hash.substr(2));
        var o = $('#main li > a[href="#'+location.hash.substr(2)+'"]');
        switchTool(o.attr('callback') || '', o.attr('widgets') || '');
    }
    $('#main').tabs('option','fx',{opacity:'toggle'});
});

function switchTool(aCallback, aWidgets) {
    var w = aWidgets.split(/[, ]+/); // Split on space or comma
    if (aWidgets.length > 0) w.push('go');
    $('#tool_options *[widget]').each(function() {
        var o = $(this);
        if (w.indexOf(o.attr('widget')) > -1) {
            o.slideDown('fast');
        } else {
            o.slideUp('fast');
        }
    });
    $('#tool_options').data('callback',aCallback);
}

function doSearch() {
    var cb = $('#tool_options').data('callback');
    if ($.isFunction(window[cb])) {
        window[cb]();
    }
}

function regionsFromMap() {
    var selected_regions = [];
    var values = $('#region_map').mapWidget('value');
    for (var k in values) {
        if (values[k]) {
            selected_regions.push(k);
        }
    }
    return selected_regions;
}
function cbPets() {
    getTameableMobs(
        $('#player_level').digitPicker('value'),
        $('#maxpower').digitPicker('value'),
        regionsFromMap()
    );
}
function getTameableMobs(player_level, maxpower, regions, offset) {
    var args = {
        player_level: player_level || 1,
        max_power: maxpower || 5,
        regions: regions instanceof Array ? regions.join(',') : regions || '',
        offset: offset || 0
    };
    $.getJSON(ajaxRoot + 'getTameable',args, loadIntoDIV('#pets_results'));
}

function cbNPCs() {
    findNPCs(
        $('#search').val(),
        undefined,
        undefined,
        regionsFromMap()
    );
}

function findNPCs(name, behavior, profession, regions, offset) {
    var args = {
        name: name || '',
        behavior: behavior || '',
        profession: profession || '',
        regions: regions instanceof Array ? regions.join(',') : regions || '',
        offset: offset || 0
    };
    $.getJSON(ajaxRoot + 'findNPCs',args, loadIntoDIV('#npcs_results'));
}

function cbMobs() {
    findMobs(
        $('#search').val(),
        regionsFromMap()
    );
}

function findMobs(name, regions, offset) {
    var args = {
        name: name || '',
        regions: regions instanceof Array ? regions.join(',') : regions || '',
        offset: offset || 0
    };
    $.getJSON(ajaxRoot + 'findMobs',args, loadIntoDIV('#mobs_results'));
}

function cbLevels() {
    getKillsToLevel(
        $('#player_level').digitPicker('value'),
        0,
        $('#min_level').digitPicker('value'),
        $('#max_level').digitPicker('value'),
        regionsFromMap()
    );
}

function getKillsToLevel(player_level, player_xp, min_level, max_level, regions, offset) {
    if (!player_level && !player_xp) {
        return;
    }
    var args = {
        player_level: player_level,
        player_xp: player_xp,
        min_level: min_level || 1,
        max_level: max_level || 4,
        regions: regions instanceof Array ? regions.join(',') : regions || '',
        offset: offset || 0
    };
    $.getJSON(ajaxRoot + 'getKillsToLevel', args, loadIntoDIV('#levels_results'));
}

function loadIntoDIV(aDiv) {
    if (loadIntoDIV.funcs[aDiv]===undefined) {
        loadIntoDIV.funcs[aDiv] = function(json, textStatus) {
            $(aDiv).html(json.data);
        };
    }
    return loadIntoDIV.funcs[aDiv];
}
loadIntoDIV.funcs = {};
