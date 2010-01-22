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
        var selected_regions = [];
        $('input[name="pets_regions"]:checked').each(
          function() {
            selected_regions.push($(this).val());
          });
        getTameableMobs(
            $('#pets_player_level').val(),
            $('#pets_player_realm').val(),
            selected_regions
        );
    });
});

function getTameableMobs(player_level, player_realm, regions, tame_powers) {
    tame_powers = tame_powers || {};
    var args = {
        player_level: player_level || 1,
        player_realm: player_realm || 'Syrtis',
        regions: regions.join(','),
        lesser_power: tame_powers.lesser || 5,
        beast_power: tame_powers.beast || 5,
        monster_power: tame_powers.monster || 5
    };
    $.getJSON(ajaxRoot + 'getTameable',args, loadTameableMobs);
}

function loadTameableMobs(json, textStatus) {
    $('#pets_results').html(json.data);
}
