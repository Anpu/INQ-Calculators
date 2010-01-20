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
        getTameableMobs($('#pets_player_level').val() || 1);
    });
});

function getTameableMobs(player_level, tame_powers) {
    tame_powers = tame_powers || {};
    var args = {
        player_level: player_level,
        lesser_power: tame_powers.lesser || 5,
        beast_power: tame_powers.beast || 5,
        monster_power: tame_powers.monster || 5
    };
    $.getJSON(ajaxRoot + 'getTameable',args, loadTameableMobs);
}

function loadTameableMobs(json, textStatus) {
    $('#pets_results').html(json.data);
}