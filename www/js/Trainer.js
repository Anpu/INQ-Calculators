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

/**
 * RO Class Trainer
 * @copyright Copyright 2010
 * @author Edward Rudd <urkle at outoforder.cc>
 */
(function($) {
/** @todo make these more "global" as they are used in trainer and armory */
function lookup(aTable, aKey, aDefault) {
    return aTable[aKey] || aDefault;
}
function verifyLookup(aTable, aKey, aDefault) {
    return aTable.indexOf(aKey)!=-1 ? aKey : aDefault;
}
function rangeLimit(value, min, max) {
    if (value < min) {
        return min;
    } else if (value > max) {
        return max;
    } else {
        return value;
    }
}
function findMaxOf(ary, value) {
    for (var i=0,l=ary.length; i<l; ++i) {
        if (ary[i] >= value) {
            return i;
        }
    }
    return -1;
}

var l_classTypeMasks = {
        'Archer':0x10,
        'Hunter':0x11,
        'Marksman':0x12,
        'Mage':0x20,
        'Conjurer':0x21,
        'Warlock':0x22,
        'Warrior':0x40,
        'Barbarian':0x41,
        'Knight':0x42
}
var l_classTypes = Object.keys(l_classTypeMasks);
var l_classMask = 0xF0;

var TrainerData = null;

$.fn.qtip.styles.TrainerSpell = {
    classes: {tooltip: 'qtip-TrainerSpell'},
    background: $.fn.qtip.styles.dark.background,
    border: $.fn.qtip.styles.dark.border,
    width: {
        min: 200,
        max: 400
    },
    name: 'dark'
};

function Trainer(aElem) {
    this.element = $(aElem);
    this._class = '';
    this._viewClass = '';
    this._elems = {};
    this._elems.status = $('<div/>')
        .appendTo(this.element);
    this._elems.wrapper = $('<div/>')
        .appendTo(this.element);
    this._values = {};
    this._hoveredSpell = null;
    this._iconsize = 48;
    /** @todo Kludgy.. Should use rooted jquery search $('div.spell',this.element[0]).live() in jQuery 1.4 */
    var self = this;
    $(this.element.selector+' div.spell')
        .live('click',function(e) {
            self._spellClick(this, e);
        });
    this._elems.wrapper.mousewheel(function (event, delta) {
        var o = $(event.target).closest('.spell');
        if (o.length) {
            var data = o.data('spell');
            if (data.level <= self.spellLevel(data.discipline)) {
                var val = self.spellPowerLevel(data.discipline, data.level);
                self.spellPowerLevel(data.discipline, data.level, val + (delta <0 ? -1 : 1));
                return false;
            }
        }
    }).mouseover(function (event) {
        var o = $(event.target).closest('.spell');
        if (o.length) {
            o.stopTime("power");
            self._spellPowerButtons(o, true);
        }
    })
    .mouseout(function (event) {
        var o = $(event.target).closest('.spell');
        if (o.length) {
            o.oneTime(50,"power",function() {
                self._spellPowerButtons(o, false);
            });
        }
    });
    // qTip wrappers
    this.qtip = {
        beforeShowSpell: function(event) {
            self._spellTooltip(this);
        },
        beforeRenderSpell: function(event) {
            self._spellTooltipCreate(this);
        },
        onRenderSpell: function(event) {
            // Add in our own "button"
            var self = this;
            this.elements.button =
                $('<a class="' + this.options.style.classes.button + '" role="button" style="float:right; position: relative"></a>')
                    //.css(jQueryStyle(this.options.style.button, true))
                    .text("pin").prependTo(this.elements.title).click(function (event) {
                        self.disable(!self.status.disabled);
                        if (self.status.disabled) {
                            $(this).text('unpin');
                        } else {
                            $(this).text('pin');
                        }
                    });

            this.elements.tooltip.draggable();
        }
    }
}

var encodeChars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJ";

$.extend(Trainer.prototype, {
    characterClass: function(v) {
        if (v === undefined) {
            return this._class;
        } else {
            this._class = verifyLookup(l_classTypes, v, '');
            this.updateView();
            return this;
        }
    },
    updateView: function() {
        this._checkData();
        if (this._class != this._viewClass) {
            this._values = {};
            this._elems.wrapper.find('.spell').qtip('destroy');
            this._elems.wrapper.empty();
            var i,l;
            var disc = this._getDisciplines();
            for (i=0,l=disc.length; i<l; ++i) {
                this._values[disc[i]] = {
                    level: 1,
                    power: [0,1,1,1,1,1,1,1,1,1,1]
                };
                this._generateDisciplineRow(disc[i]);
                this.spellLevel(disc[i],1);
            }

            this._viewClass = this._class;
        }
        return this;
    },
    loadData: function(cb) {
        var self = this;
        var args = $.makeArray(arguments).slice(1);
        $.getJSON("data/Trainer.json",undefined,function(data, textStatus) {
            TrainerData = data;
            if ($.isFunction(cb)) {
                cb.apply(self, args);
            }
        });
    },
    encode: function() {
        var disc = this._getDisciplines();

        var ret = $.inArray(this._class, l_classTypes);

        for (var d=0,l=disc.length; d<l; ++d) {
            var level = this._values[disc[d]].level;
            for (var s=1; s<=10; s+=2) {
                var num = 0;
                if (s <= level) {
                    num += this._values[disc[d]].power[s] * 6;
                }
                if ((s+1) <= level) {
                    num += (this._values[disc[d]].power[s+1]);
                }
                ret += encodeChars.charAt(num);
            }
        }
        return ret;
    },
    decode: function(text) {
        // Load class
        this.characterClass(l_classTypes[text[0]]);
        // Set powers and levels
        var disc = this._getDisciplines();
        var c = 1;
        for (var d=0,l=disc.length; d<l; ++d) {
            var level = 0;
            var spells = [];
            var s;
            for (s=1; s<=10; s+=2,++c) {
                var num = encodeChars.indexOf(text[c]);
                spells[s] = Math.floor(num / 6);
                spells[s+1] = num % 6;
                if (spells[s]>0) {
                    level = s;
                }
                if (spells[s+1]>0) {
                    level = s+1;
                }
            }
            this.spellLevel(disc[d],level);
            for (s=1; s<=10; ++s) {
                this.spellPowerLevel(disc[d],s,spells[s]);
            }
        }
    },
    _getDisciplines: function() {
        this._checkData();
        var chex = lookup(l_classTypeMasks, this._class, 0);
        var base = chex & l_classMask;

        var disc = lookup(TrainerData.class_disciplines,base,[]);
        if (base != chex) {
            disc = disc.concat(lookup(TrainerData.class_disciplines,chex,[]));
        }
        return disc;
    },
    spellData: function(discipline, level) {
        this._checkData();
        return TrainerData.disciplines[discipline].spells[level-1];
    },
    spellLevel: function(discipline, level) {
        if (! discipline in this._values) {
            throw new RangeError('Unknown Discpline '+discipline);
        }
        if (level!==undefined) {
            level = rangeLimit(level, 1, 10);
            this._values[discipline].level = level;
            var o = $('*[discipline="'+discipline+'"]');
            for (var i=1; i<=10; ++i) {
                var o2 = o.find('.spell_'+i);
                if (o2.length) {
                    //o2.toggleClass('active',i <= level);
                    if (i <= level) {
                        o2.addClass('active');
                        o2.find('.power').text(this._values[discipline].power[i]);
                    } else {
                        o2.removeClass('active');
                        o2.find('.power').text('');
                    }
                    var q = o2.qtip('api');
                    if (q.elements.tooltip && q.elements.tooltip.is(':visible')) {
                        this._spellTooltip(q);
                    }
                    // any deactivated spells set power level to 1
                    if (i > level) {
                        this._values[discipline].power[i] = 1;
                    }
                }
            }
            this._updateDisciplineData(discipline);

            return this;
        } else {
            return this._values[discipline].level;
        }
    },
    _spellPowerEffect: function(elem, newvalue) {
        elem
            .stop(true)
            .animate(
                {fontSize:0},
                {
                    complete:function() {elem.text(newvalue);},
                    queue:true,
                    duration:'fast'})
            .animate({fontSize:this._iconsize/2},{
                queue:true,
                duration:'fast',
                easing:'easeOutBack'});
    },
    spellPowerLevel: function(discipline, level, power) {
        this._checkData();
        if (! discipline in this._values) {
            throw new RangeError('Unknown Discpline '+discipline);
        }
        if (rangeLimit(level, 1, 10)!==level) {
            throw new RangeError('Invalid Level Passed:'+level);
        }
        if (power!==undefined) {
            if (level > this.spellLevel(discipline)) {
                return this;
            }
            // Make sure we have a high enough Level to handle this power level
            var disc_level = this._values[discipline].level * 2 - 2;
            if (TrainerData.required.power[disc_level] < power) {
                return this;
            }
            var old = this._values[discipline].power[level];
            this._values[discipline].power[level] = rangeLimit(power, 1, 5);
            if (old != this._values[discipline].power[level]) {
                this._updateDisciplineData(discipline);
                var elem = $('*[discipline="'+discipline+'"] .spell_'+level);
                this._spellTooltip(elem.qtip('api'));
                this._spellPowerEffect(elem.find('.power'), this._values[discipline].power[level]);
            }
            return this;
        } else {
            return this._values[discipline].power[level];
        }
    },
    _checkData: function(func) {
        if (TrainerData === null) {
            throw new Error("No Data Loaded");
        }
    },
    _generateDisciplineRow: function(discipline) {
        var div = $('<div class="ui-helper-clearfix discipline"/>')
                .attr('discipline',discipline)
                .addClass('discipline_'+discipline.replace(/ /g,''));
        $('<label/>').text(discipline).appendTo(div);
        $('<div class="info"/>').appendTo(div);
        for (var i=1; i<=10; ++i) {
            var s = $('<div class="spell pointer"/>')
                .addClass('spell_'+i)
                .css('backgroundPosition',(-i*this._iconsize)+'px 0px')
                .data('spell',{discipline:discipline,level:i})
                .append('<div class="power"/>');
            $('<div class="spell_wrapper"/>')
                .append(s)
                .disableSelection()
                .appendTo(div);
        }
        div.appendTo(this._elems.wrapper);
        div.find('.spell').qtip({
                content: {
                    text: "No Spell Information Available",
                    title: {text: "Unknown Spell"}
                },
                show: {
//                    solo: true,
//                    delay: 0
                },
                hide: {
                    delay: 250,
                    fixed: true,
                    when: 'mouseout'
                },
                position: {
                    corner: {
                        target: 'rightTop',
                        tooltip: 'leftBottom'
                    },
                    adjust: {
                        x: 5,
                        screen: true
                    }
                },
                style: {
                    name:'TrainerSpell',
                    tip: 'leftBottom'
                },
                api: {
                    beforeRender:this.qtip.beforeRenderSpell,
                    onRender: this.qtip.onRenderSpell,
                    beforeShow:this.qtip.beforeShowSpell
                }
            });
    },
    _updateDisciplineData: function(discipline) {
        this._checkData();
        var level = this._values[discipline].level;
        var points = 0;
        for (var i=1; i<=10; ++i) {
            points += (this._values[discipline].power[i] - 1);
        }
        $('*[discipline="'+discipline+'"] .info')
            .text(
                'L:'+(level * 2 - 1)
                +' D:'+TrainerData.required.points[level*2-2]
                +' P:'+points);
        this._updateData();
    },
    _updateData: function() {
        this._checkData();
        var power = 0;
        var points = 0;
        var level = 1;
        for (var d in this._values) {
            var disc_level = this._values[d].level*2-2;
            points += TrainerData.required.points[disc_level];
            if (TrainerData.required.level[disc_level] > level) {
                level = TrainerData.required.level[disc_level];
            }
            for (var i=1; i<=10; ++i) {
                power += (this._values[d].power[i] -1);
            }
        }
        // calc required level
        var ltest, b;
        var chex = lookup(l_classTypeMasks, this._class, 0);
        for (b in TrainerData.points.discipline) {
            if ((parseInt(b) & chex) > 0) {
                ltest = findMaxOf(TrainerData.points.discipline[b], points);
                if ((ltest+1) > level) {
                    level = ltest+1;
                } else if (ltest < 0) {
                    level = 51;
                }
            }
        }
        for (b in TrainerData.points.power) {
            if ((parseInt(b) & chex) > 0) {
                ltest = findMaxOf(TrainerData.points.power[b], power);
                if ((ltest+1) > level) {
                    level = ltest+1;
                } else if (ltest < 0) {
                    level = 51;
                }
            }
        }
        if (level == 51) {
            level = "Impossible";
        }
        this._elems.status.text('D:'+points+' P:'+power+' L:'+level);
    },
    _spellClick: function(elem, event) {
        var o = $(elem).offset();
        var data = $(elem).data('spell');
        if (data.level > this.spellLevel(data.discipline) || (event.pageX - o.left)  < 32) {
            this.spellLevel(data.discipline,data.level);
            this._spellPowerButtons($(elem), true);
        } else {
            var y = event.pageY - o.top;
            var val = this.spellPowerLevel(data.discipline, data.level);
            this.spellPowerLevel(data.discipline, data.level, val + (y< 24 ? 1 : -1));
        }
    },
    __spellMap: function(a, i) {
        return '<span power="'+(i+1)+'">'+a+'</span>';
    },
    __spellTooltipAttrib: function(data) {
        var ret = []
        for (var k in data) {
            if (data[k]===true) {
                ret.push(k);
            } else {
                ret.push(k+': '+
                    ($.isArray(data[k])
                        ? $.map(data[k],this.__spellMap).join(',')
                        : data[k])
                );
            }
        }
        return ret.join('<br/>');
    },
    _spellTooltipCreate: function(qtip) {
        var elem = qtip.elements.target;
        var data = elem.data('spell');
        var spell = this.spellData(data.discipline, data.level);
        if (!spell) return;

        var content = [
            '<div class="wrapper">',
            '<div class="description">',
            spell.description,
            '</div>'];
        if (spell.damage) {
            content.push('<div class="damage">Damage:');
            if ($.isArray(spell.damage)) {
                content.push($.map(spell.damage,this.__spellMap).join(','));
            } else if (typeof spell.damage == 'string') {
                content.push(spell.damage);
            } else {
                content.push('<br/>',this.__spellTooltipAttrib(spell.damage));
            }
            content.push('</div>');
        }
        content.push('<div class="specs">',
            'Type: ',
                spell.type || 'Unknown',
                '<br/>');
        if (spell.type && spell.type != 'Passive') {
            if (spell.duration) {
                content.push('Duration: ',
                    ( $.isArray(spell.duration)
                        ? $.map(spell.duration,this.__spellMap).join(',')
                        : spell.duration
                    ),
                    ' secs<br/>'
                );
            }
            content.push(
                'Cost: ',
                    $.map(spell.mana,this.__spellMap).join(','),
                '<br/>Casting: ',
                    (spell.cast || 0),
                    ' secs',
                '<br/>Cooldown: ',
                    (spell.cooldown || 0),
                    ' secs'
            );
            if (spell.range) {
                content.push('<br/>Range: ',spell.range);
            }
        }
        if (spell.buffs) {
            content.push(
                '<div class="buffs">',
                this.__spellTooltipAttrib(spell.buffs),
                '</div>');
        }
        if (spell.debuffs) {
            content.push(
                '<div class="debuffs">',
                this.__spellTooltipAttrib(spell.debuffs),
                '</div>');
        }
        content.push('</div></div>');

        qtip.options.content.title.text = spell.name;
        qtip.options.content.text = content.join('');
    },
    _spellTooltip: function(qtip) {
        var elem = qtip.elements.target;
        var data = elem.data('spell');

        var activePower = 0;
        if (data.level <= this.spellLevel(data.discipline)) {
            activePower = this.spellPowerLevel(data.discipline,data.level);
        }
        if (qtip.elements.content) {
            qtip.elements.content
                .find('*[power]')
                .removeClass('active')
                .filter('*[power="'+activePower+'"]')
                .addClass('active');
        }
    },
    _spellPowerButtons:function(target, show) {
        var data = target.data('spell');
        if (data.level <= this.spellLevel(data.discipline) && show) {
            if (target.find('.powerbutton').length == 0) {
                target.append(
                    $('<div class="powerbutton"/>')
                );
            }
        } else {
            target.find('.powerbutton').remove();
        }
    }
});

window.cTrainer = Trainer;

})(jQuery);