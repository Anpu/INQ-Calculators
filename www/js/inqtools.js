/*
 * Main Javascript code
 * @copyright Copyright 2010
 * @author Xia
 * @author Edward Rudd <urkle at outoforder.cc>
 */
/*
 * This file is part of INQ Calculators.
 *
 * INQ Calculators is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * INQ Calculators is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with INQ Calculators.  If not, see <http://www.gnu.org/licenses/>.
 */
// Compatibility for "older browsers"
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

if (!Object.keys)
{
  Object.keys = function(obj)
  {
      var ret = [];
      for (var a in obj) {
          ret.push(a);
      }
      return ret;
  }
}

if (!Array.range)
{
    Array.range = function(low, high)
    {
        var ret = [];
        var i = low;
        var plus = ( ( i > high ) ? false : true );
        if ( plus ) {
            while ( i <= high ) {
                ret.push( i.toString() );
                i ++;
            }
        } else {
            while ( i >= high ) {
                ret.push( i.toString() );
                i --;
            }
        }

        return ret;
    }

}

/** For users w/o firebug/a real browser */
if (window.console == undefined) {
    window.console = {
        log: function() {},
        dir: function() {},
        error: function() {}
    };
}

function prefixNumber(number, prefix, digits) {
    var n = parseInt(number).toString();
    var ret = '';
    for (var i=0,l=digits-n.length; i<l; i++) {
        ret += prefix;
    }
    return ret + n;
}

// JQuery on ready event
$(function() {
    $.ajaxSetup({
        error: function(aXHR, textStatus, errorThrown) {
            if ($.isFunction(this.success)) {
                if (this.dataType == 'json') {
                    this.success({response:'error',error:textStatus||errorThrown},textStatus||errorThrown);
                }
            } else {
                ShowError("Error Occured Fetching Data:"+(textStatus || errorThrown));
            }
        }
    });

    function locationHashChanged() {
        if (locationHashChanged.UPDATE_TO == location.hash) {
            return;
        }
        if (location.hash.length > 0) {
            var parts = location.hash.substr(2).split('/');
            if (parts.length && $('#'+parts[0]).length > 0) {
                $('#main').tabs('select','#'+parts[0]);
            }
        } else {
            // has is empty load home tab
            $('#main').tabs('select','#home');
        }
    }
    locationHashChanged.UPDATE_TO = null;
    if ("onhashchange" in window) {
        window.onhashchange = locationHashChanged;
    }

    $("#main").data('tool_args',[]).data('results',{length:0}).tabs({
        selected: -1,
        show: function(event, ui) {
            var loadcb = $(ui.tab).attr('load') || '';
            // Magic to allow scrolling to get more results
            $('#main').data('results',$(ui.panel).find('div.results'));
            $(window).scroll();
            // Trigger the on-load callback if set
            if ($.isFunction(window[loadcb])) {
                window[loadcb].apply($(ui.tab),$('#main').data('tool_args'));
                // Only load tool args ONCE
                $('#main').data('tool_args',[]);
            }
        },
        select:function (event, ui) {
            trackEvent('Tools', 'Select', ui.tab.hash.substr(1));
            var o = $(ui.tab);
            switchTool(o, false);
            if (ui.tab.hash.length > 0) {
                locationHashChanged.UPDATE_TO = '#/'+ui.tab.hash.substr(1);
                location.hash = '/'+ui.tab.hash.substr(1);
            }
        }
    });

    $('#helpmenu')
        .addClass('ui-helper-reset ui-helper-clearfix')
        .children().addClass('ui-state-default')
        .hover(
            function() {$(this).addClass('ui-state-hover');},
            function() {$(this).removeClass('ui-state-hover');}
        );
    $('#helpmenu .btn-feedback').click(function(event) {
        trackEvent('Dialogs', 'Open', 'Feedback');
        event.preventDefault();
        $('#feedbackDialog').wizarddialog('open');
    });
    $('#helpmenu .btn-help').click(function(event) {
        trackEvent('Dialogs', 'Open', 'Help');
        event.preventDefault();
        $('#helpDialog')
            .dialog('option','height',$(window).height() * 0.9)
            .dialog('open');
    });


    $('ul.navigation li:first-child').addClass('first-item');
    $('ul.navigation li:last-child').addClass('last-item');

    $('a.tablink').live('click',function(e) {
        if (e.button !=0) return false;
        $('#main').tabs('select',this.hash);
        return false;
    });

    $('.search_result_row').live('click', function(e) {
        $(this).toggleClass('expanded')
        .next('.search_result_detail').find('div.detail_content').slideToggle('fast');
        });

    $('.search_result_detail').live('click', function(e) {
        $(this).prev('.search_result_row').toggleClass('expanded');
        $(this).find('div.detail_content').slideToggle('fast');
        });

    $('table.search_results > .moreresults > tr').live('click', function(e) {
       var fetchCall = $(this).closest('div.results').data('fetchCall');
       if (fetchCall && $.isFunction(fetchCall.func)) {
           if ($(this).data('isLoading')) return;
           $(this).data('isLoading',true);
           showLoading($(this).find('td'));
           var offset = parseInt($(this).closest('tbody').attr('offset')) || 0;
           fetchCall.args.push(offset);
           fetchCall.func.apply(window,fetchCall.args);
           trackEvent('Tools', 'Fetch More', fetchCall.tool, offset);
       }
    });

    function toolPopupGlobalClick(e) {
        var test = $(e.target).closest('.tool_popup_wrapper,.tool_popup_button, .tool_option > label').length;
        if (!test) {
            $('.tool_popup_wrapper').stop(true,true).slideUp();
            $(document).unbind('click',toolPopupGlobalClick);
        }
    }

    $('.tool_option > label, .tool_popup_button').live('click',function(e) {
        if (e.button !=0) return;
        var o = $(this);
        // if it's a label fetch the span after it'
        if (o.is('label')) o = o.next();
        if (!o.attr('popup')) return;
        var popup = $('#'+o.attr('popup'));
        var v = popup.is(':visible');
        $('.tool_popup_wrapper').stop(true,true).slideUp();
        $(document).unbind('click',toolPopupGlobalClick);

        if (!v) {
            $(document).bind('click',toolPopupGlobalClick);
            //Position
            var ooff = o.offset();
            var toolbox = o.closest('div');
            var toff = toolbox.offset();
            switch (o.attr('side')) {
            case 'full':
                popup
                    .parent()
                    .css({
                        width:toolbox.innerWidth(),
                        left:toff.left,
                        top:toff.top + toolbox.height()
                    })
                    .slideDown();
                break;
            case 'right':
                popup.parent()
                    .css({
                        left:ooff.left + o.width() - popup.parent().outerWidth(),
                        top:toff.top + toolbox.height()
                    })
                    .slideDown();
                break;
            default:
                popup.parent()
                    .css({
                        left:ooff.left,
                        top:toff.top + toolbox.height()
                    })
                    .slideDown();
            }
        }

    });

    // Begin tool widgets
    $('.tool_popup')
        .wrap('<div class="tool_popup_wrapper"/>')
        .show();

    $('#player_level').slider({
        orientation: 'horizontal',
        min: 1,
        max: 50,
        animate: true,
        value: 1,
        slide: function(e, ui) {
            $('#player_level_display').text(prefixNumber(ui.value,'0',2));
            var o = $('#level_range');
            var v = o.slider('values');
            var d = ui.value - v[0];
            var n = v[0]+d;
            var a = o.is(':visible');
            if (!a) {
                o.slider('option','animate',false);
            }
            if (n > 58) n = 58;
            o.slider('values',0,n);
            n = v[1]+d;
            if (n > 58) n = 58;
            o.slider('values',1,n);
            if (!a) {
                o.slider('option','animate',true);
            }
        },
        change: function(e, ui) {
            trackEvent('Option', 'Set Player Level', ui.value);
        }
    });
    $('#player_level_display').text('01');

    $('#level_range').slider({
        orientation: 'horizontal',
        min: 1,
        max: 58,
        animate: true,
        range: true,
        values: [1,3],
        slide: function(e, ui) {
            $('#level_range_display').text(
                    prefixNumber(ui.values[0],'0',2)
                        +'-'
                        +prefixNumber(ui.values[1],'0',2));
        },
        change: function(e, ui) {
            if (e.originalEvent) {
                trackEvent('Option', 'Set Mob Level Range', ui.value, ui.values[1] - ui.value[0]);
            }
            $('#level_range_display').text(
                    prefixNumber(ui.values[0],'0',2)
                        +'-'
                        +prefixNumber(ui.values[1],'0',2));
        }
    });
    $('#level_range_display').text('01-03');

    $('#max_power').slider({
        orientation: 'horizontal',
        min: 1,
        max: 5,
        animate: true,
        value: 5,
        slide: function(e, ui) {
            $('#max_power_display').text(ui.value);
        },
        change: function(e, ui) {
            trackEvent('Option', 'Set Tame Power Level', ui.value);
            $('#max_power_display').text(ui.value);
        }
    });
    $('#max_power_display').text('05');

    $('#profession').change(function(e) {
        trackEvent('Option', 'Set Profession', $(this).val());
    });

    $('#realm_crests > li').live('click',function(e) {
        var o = $(this);
        var sel =  !o.hasClass('selected');
        var realm = o.attr('realm');
        $('#region_map')
                .mapWidget('setValue',realm+'-iz',sel)
                .mapWidget('setValue',realm+'-ir',sel)
                .mapWidget('setValue',realm+'-wz',sel);
        trackEvent('Option', 'Set Region Map', locationLabel.labels[locationLabel.bitmap[realm]]);
        updateQuickMap();
        locationLabel();
    });
    $('#realm_wz').click(function(e) {
        var o = $(this);
        var sel = !o.hasClass('selected');
        $('#region_map')
                .mapWidget('setValue','alsius-wz',sel)
                .mapWidget('setValue','ignis-wz',sel)
                .mapWidget('setValue','syrtis-wz',sel);
        trackEvent('Option', 'Set Region Map', 'Warzone');
        updateQuickMap();
        locationLabel();
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
        },
        click:function(e, hit) {
            trackEvent('Option', 'Set Region Map', locationLabel.labels[locationLabel.bitmap[hit.map]]);
            updateQuickMap();
            locationLabel();
        }
    });
    $('#location_map_display').text('Anywhere');

    $('#tool_options input[type="text"]').keypress(function(e) {
        if (e.keyCode==13) {
            doSearch();
            if ($(this).is(':ooo-basecomplete')) {
                $(this).basecomplete('close');
            }
        }
    });

    $('#tool_options button.go').button().click(function() {
       doSearch();
    });
    $('#tool_options button.goalt').click(function() {
       doSearch(true);
    }).parent().buttonset().children()
            .first().addClass('ui-corner-left').end()
            .last().addClass('ui-corner-right');

    /** Interactive Map */
    $('#RO_InteractiveMap').interactiveMap({
        map: 'images/map/map.xml'
    });

    $('#errorDialog').dialog({
        autoOpen: false,
        modal: true,
        open: function(event, ui) {
            var p = $(this).data('error');
            $(this).find('.message').text(p.message);
        },
        buttons:{
            'Ok':function(event,ui) {
                $(this).dialog('close');
            }
        }
    }).prev().addClass('ui-state-error');

    $('#helpDialog').dialog({
        autoOpen: false,
        modal: true,
        width: '90%',
        open: function(event, ui) {
            if (!$(this).data('loaded')) {
                showLoading(this,true,true);
                $(this).load('help');
                $(this).data('loaded',true);
            }
        }
    });
    $('#licenseDialog').dialog({
        autoOpen: false,
        modal: true,
        show: 'scale',
        hide: 'scale',
        width: '80%',
        open: function(event, ui) {
            if (!$(this).data('loaded')) {
                showLoading(this,true,true);
                $(this).load('license *:not(meta,title,link,head)');
                $(this).data('loaded',true);
            }
        }
    });
    $('#license').click(function(e) {
        trackEvent('Dialogs', 'Open', 'License');
        e.preventDefault();
        $('#licenseDialog')
            .dialog('option','height',$(window).height() * 0.8)
            .dialog('open');
    });

/** Auto complete formatters */
    var autoCompleteRenderers = {
        withZone: function(ul, item) {
           return $('<li></li>')
                .append('<a>'+item.label + '<br/><span class="subtitle">'+item.realm +' '+item.region+'</span></a>')
                .appendTo(ul);
        }
    };

    $('#feedbackDialog').wizarddialog({
        autoOpen: false,
        resizable: false,
        minWidth: 400,
        loadingclass: 'loading loading-black-big',
        open: function() {
            $(this).find('input[type="checkbox"],input[type="radio"]').attr('checked',false);
            $(this).find('input[type="text"]').val('');
            $(this).find('textarea').val('');
            // do this so we don't have to use an each'
            $(this).find('select').attr('selectedIndex',0);
        },
        callbacks: {
            finish_start: function(e, ui) {
                var val = $(ui.current).find('input[name="fb_requesttype"]:checked').val();
                if (val == 'new' || val == 'update') {
                    val = 'itemtype';
                }
                return val || false;
            },
            finish_itemtype: function(e, ui) {
                var type = $(ui.current).find('input[name="fb_itemtype"]:checked').val();
                if (!type) return false;
                var report = $(this).find('input[name="fb_requesttype"]:checked').val();
                return type+'info';
            },
            enter_mobinfo: function(e, ui) {
                var report = $(this).find('input[name="fb_requesttype"]:checked').val();
                if (report == 'update') {
                    $(ui.current).find('input[name="fb_mob_name"]').basecomplete('enable');
                } else {
                    $(ui.current).find('input[name="fb_mob_name"]').basecomplete('disable');
                }
            },
            finish_mobinfo: function(e, ui) {
                if ($(ui.current).find('input[name="fb_mob_name"]').val()=='') {
                    return false;
                } else {
                    SubmitFeedback(ui.finish, ui.fail);
                    return true;
                }
            },
            enter_npcinfo: function(e, ui) {
                var report = $(this).find('input[name="fb_requesttype"]:checked').val();
                if (report == 'update') {
                    $(ui.current).find('input[name="fb_npc_name"]').basecomplete('enable');
                } else {
                    $(ui.current).find('input[name="fb_npc_name"]').basecomplete('disable');
                }
            },
            finish_npcinfo: function(e, ui) {
                if ($(ui.current).find('input[name="fb_npc_name"]').val()=='') {
                    return false;
                } else {
                    SubmitFeedback(ui.finish, ui.fail);
                    return true;
                }
            },
            enter_areainfo: function(e, ui) {
                var report = $(this).find('input[name="fb_requesttype"]:checked').val();
                if (report == 'update') {
                    $(ui.current).find('input[name="fb_area_name"]').basecomplete('enable');
                } else {
                    $(ui.current).find('input[name="fb_area_name"]').basecomplete('disable');
                }
            },
            finish_areainfo: function(e, ui) {
                if ($(ui.current).find('input[name="fb_area_name"]').val()==''
                        || $(ui.current).find('select[name="fb_area_realm').val()=='') {
                    return false;
                } else {
                    SubmitFeedback(ui.finish, ui.fail);
                    return true;
                }
            },
            enter_feedback: function(e, ui) {
                $(ui.current).find('select[name="fb_feedbacktype"]').change();
            },
            finish_feedback: function(e, ui) {
                if ($(ui.current).find('select[name="fb_feedbacktype"]').val()==""
                        || $(ui.current).find('textarea[name="fb_feedback"]').val()=='') {
                    return false;
                } else {
                    SubmitFeedback(ui.finish, ui.fail);
                    return true;
                }
            }
        }
    });
    $('#feedbackDialog select[name="fb_feedbacktype"]').change(function() {
        $('#fb_feedback_help').html($(this).children('option:selected').attr('title'));
    });
    $('#feedbackDialog *[name="fb_mob_areas"]').multicomplete({
       source: function(request, response) {
           $.getJSON(ajaxRoot + 'suggestZones',
                request, function(json) {response(json.data)});
       },
       renderItem: autoCompleteRenderers.withZone
    });
    $('*[name="fb_npc_area"],*[name="fb_area_name"]').basecomplete({
       source: function(request, response) {
           $.getJSON(ajaxRoot + 'suggestZones',
                request, function(json) {response(json.data)});
       },
       renderItem: autoCompleteRenderers.withZone
    });
    $('#npc_search, *[name="fb_npc_name"]').basecomplete({
       source: function(request, response) {
           $.getJSON(ajaxRoot + 'suggestNPCs',
                request, function(json) {response(json.data)});
       }
    });
    $('#mob_search, *[name="fb_mob_name"]').basecomplete({
       source: function(request, response) {
           $.getJSON(ajaxRoot + 'suggestMobs',
                request, function(json) {response(json.data)});
       }
    });
    $('*[name="fb_reporter_server"]').basecomplete({
        source: ['Horus','Ra','Muspell','Niflheim','Nemon'],
        minLength: 0
    });

    window.Trainer = new cTrainer('#trainer_tool');

    $(window).scroll(function() {
        if ($(window).scrollTop() >= ($(document).height() - $(window).height() - 5)) {
            if ($('#main').data('results').length) {
                $('#main').data('results').find('.moreresults tr').click();
            }
        }
    });

    // Do this AFTER all widgets are setup to insure they "hide" correctly
    var curpage = '#home';
    if (location.hash.length > 0) {
        var parts = location.hash.substr(2).split('/');
        if (parts.length && $('#'+parts[0]).length > 0) {
            curpage = '#'+parts[0];
        }
        $('#main').data('tool_args', parts.slice(1));
    }
    $('#main').tabs('option','fx',{opacity:'toggle'});

    $('#main,#footer').delay(100).fadeIn('normal',function() {
        $('#main').tabs('select',curpage);
    });
});

// Magic help interaction
$('#helpDialog area').live('mouseover',function() {
    $('#help_layout').addClass('pointer');
}).live('mouseout',function() {
    $('#help_layout').removeClass('pointer');
}).live('click',function(e) {
    e.preventDefault();
    var o = $( $(this).attr('href') );
    if (o.length) o[0].scrollIntoView(false);
    o.effect('pulsate',{times:2},200);
});

function trackEvent(category, action, label, value) {
    window._gaq && _gaq.push(['_trackEvent',category, action, label && label.toString(), value]);
}

function updateQuickMap() {
    var v = $('#region_map').mapWidget('value');
    $('#realm_wz').toggleClass("selected",!!(v['alsius-wz'] && v['ignis-wz'] && v['syrtis-wz']));
    for (var realm in {alsius:0,ignis:0,syrtis:0}) {
        $('#realm_crests > li[realm="'+realm+'"]')
            .toggleClass('selected',!!(v[realm+'-iz'] && v[realm+'-ir'] && v[realm+'-wz']));
    }
}

function locationLabel() {
    var v = $('#region_map').mapWidget('value');
    var bm = 0;
    for (var i in v) {
        if (v[i]) bm |= locationLabel.bitmap[i];
    }
    // Label
    var label = locationLabel.labels[bm] || "Custom";
    $('#location_map_display').text(label);
}
locationLabel.bitmap = {
    'alsius':0x007,
    'alsius-iz':0x001,
    'alsius-ir':0x002,
    'alsius-wz':0x004,
    'ignis':0x070,
    'ignis-iz':0x010,
    'ignis-ir':0x020,
    'ignis-wz':0x040,
    'syrtis':0x700,
    'syrtis-iz':0x100,
    'syrtis-ir':0x200,
    'syrtis-wz':0x400
};
locationLabel.labels = {
    0x000: "Anywhere",
    0x777: "Anywhere",
    0x444: "Warzone",
    0x007: "Alsius",
    0x447: "Alsius + WZ",
    0x070: "Ignis",
    0x474: "Ignis + WZ",
    0x700: "Syrtis",
    0x744: "Syrtis + WZ",

    0x001: "Alsius Initiation",
    0x002: "Alsius Inner",
    0x004: "Alsius Warzone",
    0x010: "Ignis Initiation",
    0x020: "Ignis Inner",
    0x040: "Ignis Warzone",
    0x100: "Syrtis Initiation",
    0x200: "Syrtis Inner",
    0x400: "Syrtis Warzone"
}

function switchTool(optObj, animate) {
    $('#header')
        .data('logo',optObj.data('logo') || 'side')
        .delay(100)
        .queue(animateLogo);

    animate = (animate === false) ? false : true;
    var aWidgets = optObj.attr('widgets') || '';
    var w = aWidgets.split(/[, ]+/); // Split on space or comma
    $('.tool_popup_wrapper').stop(true,true).slideUp({queue:false});
    $('#tool_options *[widget]').each(function() {
        var o = $(this);
        if (w.indexOf(o.attr('widget')) > -1) {
            if (animate) {
                o.slideDown('fast');
            } else {
                o.show();
            }
        } else {
            if (animate) {
                o.slideUp('fast');
            } else {
                o.hide();
            }
        }
    });
    var unloadcb = $('#tool_options').data('unloadcb');
    if ($.isFunction(window[unloadcb])) {
        window[unloadcb].call(optObj);
    }
    $('#tool_options').data('unloadcb',optObj.attr('unload') || '');
    $('#tool_options').data('callback',optObj.attr('callback') || '');
}

function doSearch(alt) {
    var cb = $('#tool_options').data('callback');
    if ($.isFunction(window[cb])) {
        window[cb](alt);
    }
}

function animateLogo() {
    var o = $(this).data('logo');
    if (o == 'center') {
        animateLogoToCenter();
    } else {
        animateLogoToSide();
    }
    $(this).dequeue();
}

function animateLogoToCenter() {
    if (!$('#logo').data('moved')) {
        return;
    }
    // Animation
    $('#logo-moved').animate({
        width: $('#logo').width(),
        height: $('#logo').height()
    });
    $('#header').animate({
        height:$('#header').data('oldheight')
    },function() {
        $('#logo-moved')
            .animate({
                left: $('#logo').offset().left
            },function() {
                $('#logo').css({
                    visibility:'visible'
                }).data('moved',false);
                $('#logo-moved').css({
                    visibility:'hidden'
                })
            });
    });
}

function animateLogoToSide() {
    if ($('#logo').data('moved')) {
        return;
    }
    if ($('#logo-moved').length==0) {
        $('#logo')
            .clone()
            .attr('id','logo-moved')
            .css({
                position:'absolute',
                left: $('#logo').offset().left,
                top: $('#logo').offset().top
            })
            .insertAfter('#logo');
    }
    // Animation
    $('#logo').data('moved',true);
    $('#logo-moved')
        .css({
            visibility:'visible'
        })
        .delay(50)
        .queue(function() {
            $('#logo').css({
                visibility:'hidden'
            });
            $(this).dequeue();
        })
        .animate({
            left:0
        })
        .queue(function() {
            $('#header').data('oldheight',$('#header').height());
            $('#header').animate({
                height:0
            });
            $(this).dequeue();
        })
        .animate({
            width:$('#logo').width()*0.7,
            height:$('#logo').height()*0.7
        });
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

function showLoading(aParent, aCenter, aReplace) {
    var span = $('<span class="loading loading-black"/>');

    if (aCenter) {
        span = $('<div/>').addClass("loading-center").append(span);
    }

    if (aReplace) $(aParent).empty();

    $(aParent).append(span);
}

function cbPets() {
    trackEvent('Tools', 'Search', 'Pets');
    showLoading('#pets_results', true, true);
    getTameableMobs(
        $('#player_level').slider('value'),
        $('#max_power').slider('value'),
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
    if (args.player_level < 10) {
        ShowError('Must choose Level 10 or greater.','#pets_results');
        return;
    }
    $('#pets_results').data('fetchCall',{
        func: getTameableMobs,
        tool: 'Pets',
        args: [player_level, maxpower, regions]
    });
    $.getJSON(ajaxRoot + 'getTameable', args, loadIntoDIV('#pets_results'));
}

function cbNPCs() {
    trackEvent('Tools', 'Search', 'NPCs');
    var b = $('#profession').val().split(':');
    showLoading('#npcs_results', true, true);
    findNPCs(
        $('#npc_search').val(),
        b[0],
        b[1],
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
    if (args.name.length == 0 && args.behavior.length ==0
                && args.profession.length ==0) {
        ShowError('Must enter a Name OR choose a Profession','#npcs_results');
        return;
    }
    $('#npcs_results').data('fetchCall',{
        func: findNPCs,
        tool: 'NPCs',
        args: [name, behavior, profession, regions]
    });
    $.getJSON(ajaxRoot + 'findNPCs',args, loadIntoDIV('#npcs_results'));
}

function cbMobs() {
    trackEvent('Tools', 'Search', 'Mobs');
    showLoading('#mobs_results', true, true);
    findMobs(
        $('#mob_search').val(),
        regionsFromMap()
    );
}

function findMobs(name, regions, offset) {
    var args = {
        name: name || '',
        regions: regions instanceof Array ? regions.join(',') : regions || '',
        offset: offset || 0
    };
    if (args.name.length == 0) {
        ShowError('Must enter a Name', '#mobs_results');
        return;
    }
    $('#mobs_results').data('fetchCall',{
        func: findMobs,
        tool: 'Mobs',
        args: [name, regions]
    });
    $.getJSON(ajaxRoot + 'findMobs',args, loadIntoDIV('#mobs_results'));
}

function cbGrinding(alt) {
    showLoading('#grinding_results', true, true);
    var v = $('#level_range').slider('values');
    if (alt) {
        trackEvent('Tools', 'Search', 'Grinding By Area');
        getKillsToLevelByArea(
            $('#player_level').slider('value'),
            0,
            v[0],
            v[1],
            regionsFromMap()
        );
    } else {
        trackEvent('Tools', 'Search', 'Grinding');
        getKillsToLevel(
            $('#player_level').slider('value'),
            0,
            v[0],
            v[1],
            regionsFromMap()
        );
    }
}

function getKillsToLevel(player_level, player_xp, min_level, max_level, regions, offset) {
    if (!player_level && !player_xp) {
        ShowError('Must pick a Level', '#grinding_results');
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
    $('#grinding_results').data('fetchCall',{
        func: getKillsToLevel,
        tool: 'Grinding',
        args: [player_level, player_xp, min_level, max_level, regions]
    });
    $.getJSON(ajaxRoot + 'getKillsToLevel', args, loadIntoDIV('#grinding_results'));
}

function getKillsToLevelByArea(player_level, player_xp, min_level, max_level, regions, offset) {
    if (!player_level && !player_xp) {
        ShowError('Must pick a Level', '#grinding_results');
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
    $('#grinding_results').data('fetchCall',{
        func: getKillsToLevelByArea,
        tool: 'Grinding By Area',
        args: [player_level, player_xp, min_level, max_level, regions]
    });
    $.getJSON(ajaxRoot + 'getKillsToLevelByArea', args, loadIntoDIV('#grinding_results'));
}

function cbTrainer() {
    var v = $('#char_class').val();
    Trainer.characterClass(v);
}

function cbInitTrainer(loadSetup) {
    var temp;
    if (loadSetup) {
        temp = function() {
            Trainer.decode(loadSetup, function(trainer) {
                $('#char_class').val(trainer.characterClass());
            });
        };
    }
    Trainer.loadData(temp);
}
function refreshMaps() {
    $('#RO_InteractiveMap').interactiveMap('render');
}

function CreditsAnimation() {
    var o = $('#credit_scroller');
    var credits = o.children('.credit');
    var data = CreditsData();
    if (data.stop) {
        data.stop = false;
        return;
    }
    // queue up the credits
    var topstart = o.height();
    credits.eq(data.position)
        .css({top: topstart, left: 0})
        .show()
        .animate({top: 0},1500)
        .delay(1500)
        .animate({left: "-100%"},1000)
        .queue(function() {
            CreditsAnimation();
            $(this).dequeue();
        });

    ++data.position;
    if (data.position >= credits.length) {
        data.position = 0;
    }
}
function CreditsData() {
    var o = $('#credit_scroller');
    var data = o.data('credits');
    if (!data) {
        data = {
            position: 0,
            stop: false
        };
        o.data('credits',data);
    }
    return data;
}
function cbCreditsStart() {
    $('#credit_scroller > *').stop(true,true).hide();
    CreditsData().stop = false;
    CreditsAnimation();
}

function cbCreditsStop() {
    CreditsData().stop = true;
}

function loadIntoDIV(aDiv) {
    if (loadIntoDIV.funcs[aDiv]===undefined) {
        loadIntoDIV.funcs[aDiv] = function(json, textStatus) {
            if (json.response == 'error') {
                ShowError('Error fetching Results',aDiv);
            } else if (json.data.offset) {
                // find the first table
                var table = $(aDiv).find('table');
                var tbody = table.find('tbody[offset="'+json.data.offset+'"]');
                if (tbody.length) {
                    tbody.replaceWith(json.data.html);
                } else {
                    table.append(json.data.html);
                }
            } else {
                $(aDiv).html(json.data.html);
            }
        };
    }
    return loadIntoDIV.funcs[aDiv];
}
loadIntoDIV.funcs = {};

function SubmitFeedback(cbSuccess, cbError) {
    var post = {
       request:$('*[name="fb_requesttype"]:checked').val(),
       name:$('*[name="fb_reporter_name"]').val(),
       server:$('*[name="fb_reporter_server"]').val(),
       email:$('*[name="fb_reporter_email"]').val()
    };
    if (post.request == "feedback") {
        post.feedback = {
            type:$('*[name="fb_feedbacktype"]').val(),
            notes:$('*[name="fb_feedback"]').val()
        };
    } else {
        post.item = $('*[name="fb_itemtype"]:checked').val();
        if (post.item == "mob") {
            post.mob = {
                name: $('*[name="fb_mob_name"]').val(),
                level: $('*[name="fb_mob_level"]').val(),
                type: $('*[name="fb_mob_type"]').val(),
                tameable: $('*[name="fb_mob_tameable"]').val(),
                areas: $('*[name="fb_mob_areas"]').val(),
                notes: $('*[name="fb_mob_notes"]').val()
            };
        } else if (post.item == "npc") {
            post.npc = {
                name: $('*[name="fb_npc_name"]').val(),
                area: $('*[name="fb_npc_area"]').val(),
                location: $('*[name="fb_npc_location"]').val(),
                profession: $('*[name="fb_npc_profession"]').val(),
                notes: $('*[name="fb_npc_notes"]').val()
            };
        } else if (post.item == "area") {
            post.area = {
                name: $('*[name="fb_area_name"]').val(),
                realm: $('*[name="fb_area_realm"]').val(),
                bounds: $('*[name="fb_area_bounds"]').val(),
                notes: $('*[name="fb_area_notes"]').val()
            };
        }
    }
    $.ajax({
        url: ajaxRoot+'addFeedback',
        type:"POST",
        dataType: "json",
        contentType: 'application/json',
        data: $.JSON.encode(post),
        context: {success: cbSuccess, error: cbError},
        processData: false,
        success: SubmitFeedback.callback,
        error: SubmitFeedback.error
    });
}

SubmitFeedback.error = function(xhr, textStatus, errorThrown) {
    if ($.isFunction(this.error)) this.error();
    ShowError('Error Submitting Feedback');
}

SubmitFeedback.callback = function (json, textStatus, xhr) {
    if (json.response == 'error') {
        if ($.isFunction(this.error)) this.error();
        ShowError('Error Submitting Feedback');
    } else {
        if ($.isFunction(this.success)) this.success();
    }
};

/**
 * aParent  the element to put the error message inside of.  If empty load an error dialog instead
 * aMessage the actual error message
 * aReplace whether to replace the contents of aParent (default true)
 */
function ShowError(aMessage, aParent, aReplace) {
    if (aParent) {
        if (aReplace === undefined || aReplace) {
            $(aParent).empty();
        }
        var p = $('<p/>')
            .append('<span class="ui-icon ui-icon-alert" style="float:left; margin-right: .3em;"/>')
            .append(aMessage);
        $('<div class="ui-state-error ui-corner-all" style="padding: 0.7em;"/>')
            .append(p).appendTo(aParent);
    } else {
        $('#errorDialog')
            .data('error',{message:aMessage})
            .dialog('open');
    }
}
