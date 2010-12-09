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

// Overlay objects
function OverlaySVGPath(aPath) {
    this.path = aPath;
}
$.extend(OverlaySVGPath.prototype, {
    drawSVG: function(svg, g, aColor) {
        svg.path(g,this.path,{fill:aColor,stroke:aColor,strokeWidth: 1});
    }
});

function OverlayCustom(drawSVG, draw)
{
    this.drawSVG = drawSVG;
    this.draw = draw;
}

// Main overlay Management

function OverlayContainer(elem) {
    this.element = elem;
    // The starting scale
    this._scale = {num: 1, den: 1};
    // List of contained overlay elements
    this._elems = [];
    this._toDraw = [];
    this.svgReady = false;
    this.element.svg({onLoad:$.proxy(this._loadSVG,this)});
}
$.extend(OverlayContainer.prototype, {
    _loadSVG: function(svg) {
        svg.root().setAttribute('width','100%');
        svg.root().setAttribute('height','100%');
        this.svg = svg;
        this.svgReady = true;
        if (this._toDraw.length) {
            this.draw();
        }
    },
    scale: function(scale) {
        if (scale) {
            if (this._scale.num != scale.num || this._scale.den != scale.den) {
                this._scale.num = scale.num;
                this._scale.den = scale.den;
                if (this.svgReady) {
                    var g = this.svg.getElementById('SVGScale');
                    this.svg.change(g, {transform:'scale('+(this._scale.num/this._scale.den)+')'});
                }
            }
            return this;
        } else {
            return this._scale;
        }
    },
    _applyScale: function(val) {
        return val * this._scale.num / this._scale.den;
    },
    draw: function(force) {
        if (this.svgReady === false) {
            return this;
        }
        var svg = this.svg;

        var o, g;
        if (svg) {
            g = svg.getElementById('SVGScale');
            if (!g || force) {
                svg.clear();
                g = svg.group('SVGScale',{transform:'scale('+(this._scale.num/this._scale.den)+')'});
                force = true;
            }
        }
        if (force) {
            this._toDraw = [];
            for (var i=0,l=this._elems.length; i<l; ++i) {
                o = this._elems[i];
                this._draw_object(o,g);
            }
        } else {
            while (this._toDraw.length) {
                o = this._elems[this._toDraw.shift()];
                this._draw_object(o,g);
            }
        }
        return this;
    },
    _draw_object: function(o, svgG) {
        if (this.svgReady && o.data.drawSVG) {
            o.data.drawSVG(this.svg, this.svg.group(svgG), this.nextColor());
        } else if (o.data.draw) {
            if (!o.wrapper) {
                o.wrapper = $('<div/>').appendTo(this.element);
            }
            o.wrapper.empty();
            o.data.draw(o.wrapper, this._scale, this.nextColor());
        } else {
            throw new TypeError("No Draw Routine for object");
        }
    },
    // Big set of colors to pick from.
    colors: [
        '#00cc00','#0f2d89','#32994c','#d82652','#3df43d','#c10ac1','#d87f26','#00ff00','#4770ea','#999932','#e519b2',
        '#897ab7','#914c07','#59cc32','#7fcc32','#654784','#e5194c','#ad1ead','#890f0f','#92a559','#9900cc','#a55959',
        '#e05199','#7f26d8','#6b0f89','#848447','#4798ea','#b2e519','#65cbcc','#2626d8','#828216','#e5e519','#7098c1',
        '#076e91','#91072a','#ea4799','#7ab789','#0f0f89','#634c35','#5175e0','#990026','#a5597f','#009972','#d85226',
        '#cc9965','#3259cc','#262672','#1e7a4c','#2d6b3d','#311682','#1e7a35','#668e3d','#b75bd6','#351e7a','#002699',
        '#ea9947','#59a592','#ff32cb','#7ff20c','#bf3f3f','#3d8e3d','#0f6b89','#7ad65b','#267226','#b77a89','#65b2cc',
        '#1919e5','#9847ea','#ff0000','#bf3f7f','#00ffbf','#b71466','#5b5bd6','#5b7ad6','#f4993d','#635735','#3d8e7a',
        '#5f3fbf','#b7b77a','#2652d8','#ccb265','#0c0cf2','#329999','#66c10a','#3d98f4','#a559a5','#7a1e4c','#5b2d6b',
        '#0ac166','#421ead','#59a57f','#65cc65','#b265cc','#596ca5','#844756','#0a38c1','#4c2672','#7551e0','#4c0099',
        '#3232cc','#d8ac26','#32ff99','#a36628','#b24cb2','#891ead','#cc657f','#993232','#26d852','#00994c','#cc7f32',
        '#5bd6d6','#c10a0a','#f2b80c','#845647','#19b2e5','#99cc65','#6bf43d','#ff3299','#f20c46','#d8267f','#00ff3f',
        '#844775','#912a07','#1e4c7a','#99f43d','#826716','#890f89','#8e14b7','#f2f20c','#4747ea','#727226','#4c9932',
        '#4c1682','#894c0f','#f43d3d','#ff3265','#7a1e1e','#c1380a','#161682','#990000','#003fff','#072a91','#32a5cc',
        '#b24c4c','#b7a87a','#00cbcc','#89890f','#669932','#65cc7f','#cc9900','#ea4770','#194ce5','#ac26d8','#32cc32',
        '#3d3d8e','#7a1e7a','#8e3d8e','#3df4f4','#d65bb7','#feff32','#754784','#ad661e','#66b714','#ccff32','#bf7f3f',
        '#1ead66','#6500cc','#5f7226','#7f3fbf','#5f2672','#267239','#59a559','#4c3299','#3f00ff','#892d0f','#47ea47',
        '#99c170','#3f5fbf','#bc51e0','#91076e','#844747','#7a7a1e','#653299','#28a366','#573563','#000099','#0ac1c1',
        '#47eac1','#3f9fbf','#b2cc65','#263972','#c170c1','#7aa8b7','#634135','#0ac10a','#997200','#990098','#32997f',
    ],
    nextColor: function() {
        this.color = ((this.color || 0) + 1) % this.colors.length;
        return this.colors[this.color];
    },
    addPolygon: function(polygon, offset) {
        if (!(polygon instanceof Polygon)) {
            throw new TypeError('Must pass in an instance of a Polygon object');
        }
        return this.addObject('polygon', polygon, offset, true);
    },
    addCustom: function(draw, drawSVG, offset) {
        return this.addObject('custom', new OverlayCustom(drawSVG, draw), offset, true);
    },
    addSVGPath: function(path, offset) {
        if (!path || typeof path != 'string') {
            throw new TypeError('Must pass in a string containing the SVG Path');
        }
        return this.addObject('svgpath', new OverlaySVGPath(path), offset, true);
    },
    addObject: function(type, data, offset, toDraw) {
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

$.widget('ooo.interactiveMap', $.ui.mouse, {
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
        this.overlay();
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
            .scale(this._activeLayer.scale);
    },
    /** Overlays */
    overlay: function(cmd) {
        if (!this._overlay) {
            this._overlay = new OverlayContainer(this._elems.overlay);
            if (this._activeLayer) {
                this._overlay.scale(this._activeLayer.scale);
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

$.extend($.ooo.interactiveMap, {
    version: "0.2"
});

})(jQuery);
