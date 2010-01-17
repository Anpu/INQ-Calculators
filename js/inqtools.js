$(function() {
    $("#main").tabs().bind('tabsshow',function (event, ui) {
        if (ui.tab.hash.length > 0) {
            location.hash = ui.tab.hash;
        }
    });
    if (location.hash.length > 0 && $(location.hash)) {
        $('#main').tabs('select',location.hash);
    }
    $('#main').tabs('option','fx',{opacity:'toggle'});

    $('#pets_go').click(function () {
        var args = {
           player_level:    $('#pets_player_level').val(),
           lesser_power:    $('#pets_lesser_power').val(),
           beast_power:     $('#pets_beast_power').val(),
           monster_power:   $('#pets_monster_power').val()
        };
        console.log(args);
        $.getJSON(ajaxRoot + 'getTameable',args, loadTameableMobs);
    });
});

function loadTameableMobs(json, textStatus) {
    $('#pets_results').html(json.data);
}