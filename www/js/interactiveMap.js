/**
 * Interactive Map Widget
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
(function($) { //hide namespace

function parseScale(val) {
    var p = val.split(':');
    return {
        num: parseInt(p[0]),
        den: parseInt(p[1])
    };
}

function dirname (path) {
    // Modified from http://phpjs.org/functions/dirname
    return path.replace(/\/[^\/]*\/?$/, '');
}

function OverlayContainer(elem) {
    this.element = elem;
    // The starting scale
    this._scale = { num: 1, den: 1 };
    // List of jsGraphics wrappers
    this._elems = [];
    this._toDraw = [];
}
$.extend(OverlayContainer.prototype, {
    setScale: function(scale) {
        if (this._scale.num != scale.num || this._scale.den != scale.den) {
            this._scale.num = scale.num;
            this._scale.den = scale.den;
        }
        return this;
    },
    draw: function(force) {
        if (force) {
            this._toDraw = [];
            for (var i=0,l=this._elems.length; i<l; ++i) {
                var o = this._elems[i];
                var f = this['_draw_'+o.type];
                if ($.isFunction(f)) {
                    f.call(this,o);
                }
            }
        } else {
            while (this._toDraw.length) {
                var o = this._elems[this._toDraw.shift()];
                var f = this['_draw_'+o.type];
                if ($.isFunction(f)) {
                    f.call(this,o);
                }
            }
        }
        return this;
    },
    _draw_polygon: function(o) {
        if (!o.wrapper) {
            o.wrapper = $('<div/>').appendTo(this.element);
        }
        o.wrapper.empty();
        o.data.draw(o.wrapper, this._scale, this.nextColor());
    },
    colors: [
        '#ffffff',
        '#ff00ff',
        '#00ffff',
        '#ffff00',
        '#ff0000',
        '#00ff00',
        '#0000ff',
        '#000000',
    ],
    nextColor: function() {
        this.color = ((this.color || 0) + 1) % this.colors.length;
        return this.colors[this.color];
    },
    addPolygon: function(polygon, offset) {
        var id = this._addObject('polygon', polygon, offset, true);
        return id;
    },
    _addObject: function(type, data, offset, toDraw) {
        var o = {
            type: type,
            data: data,
            offset: offset
        };
        this._elems.push(o);
        var id = this._elems.length-1;
        if (toDraw) {
            this._toDraw.push(id);
        }
        return id;
    }
});

$.widget('ui.interactiveMap', $.ui.mouse, {
    options: {
        map:'',
        blankImage:'images/blank.gif'
    },

    _create: function() {
        this._mouseInit();
        this._elems = {};
        var self = this;
        this.element
            .addClass('interactiveMap')
            .disableSelection()
            .mousewheel(function(event,delta) {self._mouseWheel(event,delta);});
        this._elems.view = $('<div class="viewPort"/>')
            .appendTo(this.element);
        this._elems.container = $('<div class="container"/>')
            .appendTo(this._elems.view);
        this._elems.tileCache = $('<div class="tileCache"/>')
            .appendTo(this._elems.container);
        this._elems.overlay = $('<div class="overlay"/>')
            .appendTo(this._elems.container);
        this.loadMap();
    },
    render: function() {
        if (this.element.is(':hidden') || !this._map) {
            // nothing to see here move along
            return;
        }
        // Called when the display needs to be recalculated (resize or show when previously hidden)
        var _viewwidth = this.element.innerWidth()
            || this.options.width || 400;
        var _viewheight = this.element.innerHeight()
            || this.options.height || 400;
        var tiles_x = Math.ceil(_viewwidth / this._map.tilesize) + 1;
        var tiles_y = Math.ceil(_viewheight / this._map.tilesize) + 1;
        this._view = {
            w: (tiles_x + 1) * this._map.tilesize,
            h: (tiles_y + 1) * this._map.tilesize
        };
        if (this._activeLayerNum !== undefined) {
            var p = this._elems.container.position();
            this.checkTiles(p.left, p.top);
            this.overlay().draw();
        }
    },
    destroy: function() {
        this._mouseDestroy();
        this.element.empty();
        this.element
            .removeClass('interactiveMap')
            .enableSelection();

        $.Widget.prototype.destroy.apply(this, arguments);
    },
    loadMap: function(map) {
        if (map) {
            this._setOption('map',map);
        }
        var self = this;
        $.get(this.options.map,undefined,function(xml) {
            self._loadXML(xml);
        },'xml');
    },
    _loadXML: function(xml) {
        var layers = $(xml).find("layer");
        var map = $(xml).find('map');
        this._map = {};
        this._map.tilesize = parseInt(map.attr('tilesize'));
        this._map.width = parseInt(map.attr('width'));
        this._map.height = parseInt(map.attr('height'));
        this._map.layers = [];
        for (var layer_itr=0,layer_len=layers.length; layer_itr<layer_len;
                ++layer_itr) {
            var _l = layers.eq(layer_itr);
            var _ll = {
                width: parseInt(_l.attr('width')),
                height: parseInt(_l.attr('height')),
                scale: parseScale(_l.attr('scale')),
                path: dirname(this.options.map)+'/'+_l.attr('path')+'/',
                pieces: {}
            }
            // Parse Pieces
            var pieces = _l.find('piece');
            for (var piece_itr=0,piece_len=pieces.length; piece_itr<piece_len;
                    ++piece_itr) {
                var _p = pieces.eq(piece_itr);
                var left = _p.attr('left'), top = _p.attr('top');
                if (!_ll.pieces[left]) {
                    _ll.pieces[left] = {};
                }
                _ll.pieces[left][top] = _p.attr('file');
            }
            this._map.layers.push(_ll);
        }
        this._map.layers.sort(this._sortLayers);
        this._setupTiles();
    },
    /** Need to toggle a Loading/notile graphic when changing zoom levels */
    loadLayer: function(layer, center) {
        var cur_scale;
        if (layer === this._activeLayerNum) return;
        // Grab current layer scale
        if (this._activeLayer && center) {
            cur_scale = this._activeLayer.scale;
        }
        this._activeLayer = this._map.layers[layer];
        this._activeLayerNum = layer;
        var p = this._elems.container.position();
        if (cur_scale) {
            var new_scale = this._activeLayer.scale;
            var mult = (cur_scale.den * new_scale.num) / (cur_scale.num * new_scale.den);
            p.left = (p.left - center.x) * mult + center.x;
            p.top = (p.top - center.y) * mult + center.y;
            this._elems.container.css({left:p.left,top:p.top});
        }
        this.checkTiles(p.left, p.top);
        this._elems.overlay.css({width:this._activeLayer.width,height:this._activeLayer.height});
        this.overlay()
            .setScale(this._activeLayer.scale)
            .draw(true);
    },
    /** Overlays */
    overlay: function(cmd) {
        if (!this._overlay) {
            this._overlay = new OverlayContainer(this._elems.overlay);
            if (this._activeLayer) {
                this._overlay.setScale(this._activeLayer.scale);
            }
        }
        if (cmd) {
            if ($.isFunction(this._overlay[cmd])) {
                return this._overlay[cmd].apply(this._overlay, Array.prototype.slice.call(arguments, 1));
            }
        }
        return this._overlay;
    },
    _sortLayers: function(a, b) {
        // Sort Ascending
        return (a.scale.num / a.scale.den) - (b.scale.num / b.scale.den);
    },
    _setupTiles: function() {
        this._elems.tileCache.empty();
        this._tileCache = {};
        this._tiles = [];
        this._elems.container.css({left:0,top:0});
        this.loadLayer(0);
    },
    _createTile: function(x, y) {
        var tile = $('<div class="tile"/>')
            .css({left:x,top:y,
                width:this._map.tilesize,height:this._map.tilesize})
            .appendTo(this._elems.tileCache);
        $('<img/>')
            .attr('src',this._getImageForTile(x,y))
            .css({
                width:this._map.tilesize,
                height: this._map.tilesize
            })
            .appendTo(tile);
        $.data(tile,'position',{left:x, top:y});
        if (!this._tileCache[x]) {
            this._tileCache[x] = {};
        }
        this._tileCache[x][y] = tile;
        this._tiles.push(tile);
    },
    _moveTile: function(tile, x, y) {
        // Remove from Cache
        var p = $.data(tile,'position');
        this._tileCache[p.left][p.top] = undefined;
        var img = tile.children();
        // Set blank image
        img.attr('src',this.options.blankImage);
        // Move Tile
        p = {left:x,top:y};
        tile.css(p);
        $.data(tile,'position',p);
        // Update Image
        img.attr('src',this._getImageForTile(x,y));
        // update layer for tile
        $.data(tile,'layer',this._activeLayerNum);
        // Add back into cache
        if (!this._tileCache[x]) {
            this._tileCache[x] = {};
        }
        this._tileCache[x][y] = tile;
    },
    _getTileForPoint: function(x,y) {
        if (this._tileCache[x] && this._tileCache[x][y]) {
            return this._tileCache[x][y];
        }
        return false;
    },
    _getImageForTile: function(x,y) {
        if (this._activeLayer.pieces[x] && this._activeLayer.pieces[x][y]) {
            return this._activeLayer.path + this._activeLayer.pieces[x][y];
        }
        return this.options.blankImage;
    },
    checkTiles: function(aX, aY) {
        if (this.element.is(':hidden')) {
            return;
        } else if (this._view === undefined) {
            this.render();
            return;
        }
        var l = (Math.floor(-aX / this._map.tilesize) * this._map.tilesize)
                - this._map.tilesize,
            t = (Math.floor(-aY / this._map.tilesize) * this._map.tilesize)
                - this._map.tilesize,
            r = l + this._view.w,
            b = t + this._view.h;

        //figure out where we have no tiles in our map rectangle
        var needed = [];
        var good = [];
        for (var y=t; y < b; y+=this._map.tilesize) {
            for (var x=l; x < r; x+=this._map.tilesize) {
                var tile = this._getTileForPoint(x, y);
                if (tile === false
                        || $.data(tile,'layer')!=this._activeLayerNum) {
                    needed.push([x,y]);
                } else {
                    good.push(tile);
                }
            }
        }
        var free = [];
        for (var idx=0, idx_l=this._tiles.length; idx<idx_l; ++idx) {
            if (good.indexOf(this._tiles[idx]) == -1) {
                free.push(this._tiles[idx]);
            }
        }
        for (idx=0,idx_l=needed.length; idx<idx_l; ++idx) {
            if (free[idx]) {
                this._moveTile(free[idx], needed[idx][0], needed[idx][1]);
            } else {
                // Create new Tile
                this._createTile(needed[idx][0],needed[idx][1]);
            }
        }
    },
    _mouseStart: function(aEvt) {
        this.offset = this.element.offset();
        var p = this._elems.container.position();
        $.extend(this.offset, {
            click: { //Where click happened, relative to the element
                x:aEvt.pageX - this.offset.left,
                y:aEvt.pageY - this.offset.top
            },
            view: {
                x:p.left,
                y:p.top
            }
        });
    },
    _mouseDrag: function(aEvt) {
        if ((this._ctr++ % 20)> 0 ) return;
        var o = {
            x:aEvt.pageX - this.offset.left,
            y:aEvt.pageY - this.offset.top
        };
        var p = {
            x:o.x - this.offset.click.x + this.offset.view.x,
            y:o.y - this.offset.click.y + this.offset.view.y
        };
        this._elems.container.css({left:p.x, top: p.y});
        this.checkTiles(p.x, p.y);
    },
    _mouseWheel: function(event, delta) {
        var layer = this._activeLayerNum + (delta < 0 ? -1 : 1);
        event.preventDefault();
        if (layer < 0 || layer >= this._map.layers.length) {
            return; // max zoom
        }
        var offset = this.element.offset();
        this.loadLayer(layer, {x:event.pageX - offset.left, y:event.pageY - offset.top});
    },
    _mouseStop: function(aEvt) {

    }
});

$.extend($.ui.interactiveMap, {
    version: "0.2"
});

})(jQuery);