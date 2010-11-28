/**
 * Image map Widget
 *
 * @copyright Copyright 2010
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
(function($) { // hide namespace

$.widget("ooo.mapWidget", $.ui.mouse, {
    options: {
        'class': '',
        'hintclass':'mapWidget-hint',
        maps: {},
        width: 100,
        height: 100
    },
    _create: function() {
        this._setOption('distance', 0);
        this._mouseInit();
        this._maps = {};
        this._editing = false;
        this._editmode = {
            box:null,
            maps: null,
            region: null,
            points: null
        };
        this._value = {};
        this._hintbox = null;

        // setup UI
        var self = this;
        this._MWmouseMoveDelegate = function(event) {
			return self._MWmouseMove(event);
		};
        this._MWmouseOutDelegate = function(event) {
			return self._MWmouseOut(event);
		};
        this.element
            .addClass('mapWidget '+this.options['class'])
            .bind('mousemove.mapWidget',this._MWmouseMoveDelegate)
            .bind('mouseout.mapWidget',this._MWmouseOutDelegate);
        var maps = this.options.maps;
        for (var m in maps) {
            var c = maps[m].config;
            this._maps[m] = $('<div/>')
                        .addClass('mapWidget-overlay '+c.image);
            if (c.bgoffset) {
                this._maps[m].css('backgroundPosition',c.bgoffset.toBgOffset());
            }
            if (c.position) {
                this._maps[m].css({
                    left:c.position.x,
                    top:c.position.y});
            }
            if (c['default']) {
                //this._value[m] = c['default'];
                this.setValue(m,c['default']);
            } else if (maps[m].areas) {
                this.setValue(m,false);
            }

            this._maps[m].appendTo(this.element);
        }
    },

    _MWmouseMove: function(e) {
        var offset = this.element.offset();
        var p = new Point(e.pageX-offset.left,e.pageY-offset.top);
        var hit = this._hitFromPoint(p);
        this.element.toggleClass('mapWidget-point', !!hit.map);
        if (hit.map) {
            var map = this.options.maps[hit.map];
            var region = map.areas[hit.region];
            this._setHint(region.hint || map.config.hint || null, region.map.getBounds());
        } else {
            this._setHint(); // Unset the hint
        }
    },

    _MWmouseOut: function(e) {
        this._setHint(); // Unset the hint when mouse leaves the control
    },

    _getHintBox: function(create) {
        if (!this._hintbox && create) {
            this._hintbox = {
                text:'',
                control:$('<div/>')
                    .addClass(this.options.hintclass)
                    .hide()
                    .appendTo(document.body)
                    .mouseover(function(e) {$(this).hide()})
            }
        }
        return this._hintbox;
    },
    _setHint: function(hint, bounds) {
        var _hb;
        if (hint) {
            _hb = this._getHintBox(true);
            if (_hb.text==hint) return;
            var off = this.element.offset();
            _hb.text = hint;
            _hb.control
                .stop(true,true)
                .hide()
                .text(hint)
                .css({
                    left: bounds.r+off.left,
                    top: bounds.b+off.top
                })
                .show();
        } else {
            _hb = this._getHintBox(false);
            if (_hb) {
                _hb.text = '';
                _hb.control.stop(true,true).hide();
            }
        }
    },

    _hitFromPoint: function(p) {
        var hit = {map:null,region:null};
        var maps = this.options.maps;
        for (var m in maps) {
            if (maps[m].areas) {
                for (var region in maps[m].areas) {
                    var poly = maps[m].areas[region].map;
                    if (poly.containsPoint(p)) {
                        hit.map = m;
                        hit.region = region;
                        break;
                    }
                }
            }
        }
        return hit;
    },
    _mouseStop: function(e) {
        var offset = this.element.offset();
        var p = new Point(e.pageX-offset.left,e.pageY-offset.top);
        if (this._editing) {
            this._editmode_addpoint(p);
        } else {
            var hit = this._hitFromPoint(p);
            var ret = this._trigger('validate', e, hit);

            if ((ret !== false) && hit.map) {
                if (this.options.maps[hit.map].areas[hit.region].toggle) {
                    var hidden = this._maps[hit.map].is(':hidden');
                    this.setValue(hit.map, hidden ? hit.region : false);
                } else {
                    this.setValue(hit.map, hit.region);
                }
                this._trigger('click', e, hit);
            }
        }
    },

    setValue: function(aMap, aRegion) {
        if (aRegion) {
            if (aRegion === true) {
                // Anyone have a better way of getting the first key in an object?
                for (var a in this.options.maps[aMap].areas) {
                    aRegion = a;
                    break;
                }
            }
            var r = this.options.maps[aMap].areas[aRegion];
            this._maps[aMap].show();
            if (r.offset) {
                // set the background position
                this._maps[aMap].css('backgroundPosition',r.offset.toBgOffset());
            }
            this._value[aMap] = aRegion;
        } else {
            this._maps[aMap].hide();
            this._value[aMap] = false;
        }
    },

    editmode: function(v) {
        if (this._editing === !!v) return;
        this._editing = !!v;
        if (this._editing) {
            this.element.addClass('mapWidget-editing');
            this._editmode.box = $('<div/>').appendTo('body');
            this._editmode_populate();
            var self = this;
            this._editmode.box.dialog({
                    title:"Editing Map Widget",
                    autoOpen: true,
                    buttons: {
                        "Generate":function () {
                            var m = self._editmode.region;
                            if (m) {
                                var s = JSON.stringify(m.toArray(1));
                                console.log(s);
                            }
                        },
                        "Dismiss":function () {
                            $(this).dialog('close');
                        }
                    },
                    close: function() {
                        self.editmode(false);
                    }
                });
        } else {
            this.element.removeClass('mapWidget-editing');
            this._editmode.box.dialog('destroy');
            this._editmode.box.remove();
            this._editmode.maps = null;
            this._editmode.region = null;
            this._editmode.box = null;
            this._editmode_clearpoints();
            this._editmode.points = null;
        }
    },

    _editmode_hoverin: function() {
        $(this).addClass('ui-state-hover');
    },
    _editmode_hoverout: function() {
        $(this).removeClass('ui-state-hover');
    },

    _editmode_add:function(aMap) {
        var i =0;
        while (this._editmode.maps[aMap]['new_'+i] !== undefined) {
            ++i;
        }
        console.log('Start Polygon ','new_'+i);
        this._editmode_clearpoints();
    },

    _editmode_edit:function(aMap, aRegion){
        var map = this._editmode.maps[aMap][aRegion].map;
        this._editmode_clearpoints();
        for (var i=0,l=map.getPointCount(); i<l; i++) {
            this._editmode_addpoint(map.getPoint(i));
        }
    },
    _editmode_remove:function(aMap, aRegion){

    },
    _editmode_addpoint: function(aPoint) {
        this._editmode.region.addPoint(aPoint);
        this._editmode.points.push($('<span/>')
            .addClass('mapWidget-dot')
            .css({left:aPoint.x, top:aPoint.y})
            .appendTo(this.element));
    },

    _editmode_clearpoints: function() {
        if (this._editmode.points) {
            while (this._editmode.points.length) {
                this._editmode.points.shift().remove();
            }
        }
        this._editmode.points = [];
        this._editmode.region = new Polygon();
    },
    _editmode_populate: function() {
        // add maps to dialog
        var self = this;
        this._editmode.maps = {};
        var addfunc = function() {
            self._editmode_add($(this).attr('map'));
            return false;
        };
        var editfunc = function() {
            self._editmode_edit($(this).attr('map'),$(this).attr('region'));
            return false;
        };
        var removefunc = function() {
            self._editmode_remove($(this).attr('map'),$(this).attr('region'));
            return false;
        };
        var maps = this.options.maps;
        for (var m in maps) {
            this._editmode.maps[m] = {};
            var mWMapHeader = $('<div/>')
                .text(m)
                .addClass('mapWidget-editmap')
                .appendTo(this._editmode.box);
            var mWMapHeaderAdd = $('<a href="#"/>')
                .addClass('mapWidget-editmap-add ui-corner-all')
                .attr({role:'button',map:m})
                .hover(this._editmode_hoverin, this._editmode_hoverout)
                .click(addfunc)
                .appendTo(mWMapHeader);
            $('<span/>')
                .addClass("ui-icon ui-icon-plusthick")
                .appendTo(mWMapHeaderAdd);

            if (maps[m].areas) {
                for (var region in maps[m].areas) {
                    this._editmode.maps[m][region] = {
                        offset: maps[m].areas[region].offset,
                        map: maps[m].areas[region].map
                    };
                    var mWRegionHeader = $('<div/>')
                        .addClass('mapWidget-editregion')
                        .appendTo(this._editmode.box);
                    $('<span/>')
                        .addClass('mapWidget-editregion-indent ui-icon ui-icon-triangle-1-e')
                        .appendTo(mWRegionHeader);
                    $('<a href="#"/>')
                        .addClass('mapWidget-editregion-edit')
                        .attr({map:m, region:region})
                        .text(region)
                        .click(editfunc)
                        .appendTo(mWRegionHeader);
                    var mWRegionHeaderMinus = $('<a href="#"/>')
                        .addClass('mapWidget-editregion-remove ui-corner-all')
                        .attr({role:'button',map:m, region:region})
                        .hover(this._editmode_hoverin, this._editmode_hoverout)
                        .click(removefunc)
                        .appendTo(mWRegionHeader);
                    $('<span/>')
                        .addClass('ui-icon ui-icon-minusthick')
                        .appendTo(mWRegionHeaderMinus);
                }
            }
        }
    },

    value: function() {
        return this._value;
    },
    destroy: function() {
        this._mouseDestroy();
        this.editmode(false);

        this.element.unbind('mousemove.mapWidget',this._MWmouseMoveDelegate);
        this.element.unbind('mouseout.mapWidget',this._MWmouseMoveOut);
        this.element.find('div.mapWidget-overlay').remove();
        this.element.removeClass('mapWidget mapWidget-editing '+this.options['class']);

        $.Widget.prototype.destroy.apply(this, arguments);
    }
});

$.extend($.ooo.mapWidget, {
    version: "0.2"
});

})(jQuery);