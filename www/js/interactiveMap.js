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
function OverlayPath(aPath) {
    this.path = aPath;
}
$.extend(OverlayPath.prototype, {
    drawSVG: function(svg, aParent, aColor, props) {
        var g = svg.group(aParent, $.extend({fill:aColor},props || {}));
        svg.path(g,this.path);
        return g;
    }
});

function OverlayReference(reference) {
    this.ref = reference;
}
$.extend(OverlayReference.prototype, {
    drawSVG: function(svg, aParent, aColor, offset) {
        var g = svg.use(aParent, this.ref);
        svg.change(g, offset);
        return g;
    }
});


function OverlayCustom(drawSVG)
{
    this.drawSVG = drawSVG;
}

// Main overlay Management

function OverlayContainer(elem) {
    this.element = elem;
    // The starting scale
    this._scale = {num: 1, den: 1};
    // List of contained overlay elements
    this._preElems = {};
    this._elems = {};
    this._toPreDraw = [];
    this._toDraw = [];
    this.svgReady = false;
    this.drawCalled = false;
    this.element.svg({onLoad:$.proxy(this._loadSVG,this)});
}
$.extend(OverlayContainer.prototype, {
    _loadSVG: function(svg, error) {
        if (error) alert(error);
        svg.root().setAttribute('width','100%');
        svg.root().setAttribute('height','100%');
        this._svg = svg;
        this.svgReady = true;
        if (this.drawCalled) {
            this.draw();
        }
    },
    scale: function(scale) {
        if (scale) {
            if (this._scale.num != scale.num || this._scale.den != scale.den) {
                this._scale.num = scale.num;
                this._scale.den = scale.den;
                if (this.svgReady) {
                    var g = this._svg.getElementById('SVGScale');
                    this._svg.change(g, {transform:'scale('+(this._scale.num/this._scale.den)+')'});
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
            this.drawCalled = true;
            return this;
        }
        var svg = this._svg;

        var g, d;
        if (svg) {
            g = svg.getElementById('SVGScale');
            d = svg.getElementById('SVGDefs');
            if (!g || !d || force) {
                svg.clear();
                d = svg.defs('SVGDefs');
                g = svg.group('SVGScale',{transform:'scale('+(this._scale.num/this._scale.den)+')'});
                force = true;
            }
        }
        if (force) {
            this._toPreDraw = Object.keys(this._preElems);
            this._toDraw = Object.keys(this._elems);
        }
        var o,n;
        while (this._toPreDraw.length) {
            n = this._toPreDraw.shift();
            if (n in this._preElems) {
                o = this._preElems[n];
                this._draw_object(o,d);
            }
        }
        while (this._toDraw.length) {
            n = this._toDraw.shift();
            if (n in this._elems) {
                o = this._elems[n];
                this._draw_object(o,g);
            }
        }
        return this;
    },
    _draw_object: function(o, svgParent) {
        if (this.svgReady && o.data.drawSVG) {
            var g = o.data.drawSVG(this._svg, svgParent, this.nextColor(), o.offset);
            this._svg.change(g,{id:o.name});
//        } else if (o.data.draw) {
            // Disable non SVG fallback for now
//            if (!o.wrapper) {
//                o.wrapper = $('<div/>').appendTo(this.element);
//            }
//            o.wrapper.empty();
//            o.data.draw(o.wrapper, this._scale, this.nextColor());
        } else {
            throw new TypeError("No Draw Routine for object");
        }
    },
    // Big set of colors to pick from.
    colors: [
        '#00cc00','#0f2d89','#32994c','#d82652','#3df43d','#c10ac1','#d87f26','#00ff00','#4770ea','#999932','#e519b2',
        '#897ab7','#914c07','#59cc32','#7fcc32','#654784','#e5194c','#ad1ead','#890f0f','#92a559','#9900cc','#a55959',
        '#e05199','#7f26d8','#6b0f89','#8484FF','#4798ea','#b2e519','#65cbcc','#2626d8','#8282FF','#e5e519','#7098c1',
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
    svg: function() {
        return this._svg;
    },
    svgChange: function(e, o) {
        return this._svg.change(e, o);
    },
    addPolygon: function(name, polygon, offset) {
        if (!(polygon instanceof Polygon)) {
            throw new TypeError('Must pass in an instance of a Polygon object');
        }
        return this.addObject(name, 'polygon', polygon, offset, true);
    },
    addCustom: function(name, drawSVG, offset) {
        return this.addObject(name, 'custom', new OverlayCustom(drawSVG), offset, true);
    },
    addSymbol: function(name, drawSVG) {
        return this.addObject(name, 'symbol', new OverlayCustom(drawSVG),true);
    },
    addPath: function(name, path, offset) {
        if (!path || typeof path != 'string') {
            throw new TypeError('Must pass in a string containing the SVG Path');
        }
        return this.addObject(name, 'path', new OverlayPath(path), offset, true);
    },
    addReference: function(name, reference, offset) {
        return this.addObject(name, 'use', new OverlayReference(reference), offset, true);
    },
    addObject: function(name, type, data, offset, toDraw) {
        var o = {
            name: name,
            type: type,
            data: data,
            offset: offset
        };
        if (type=='symbol') {
            this._preElems[name] = o;
            if (toDraw) {
                this._toPreDraw.push(name);
            }
        } else {
            this._elems[name]= o;
            if (toDraw) {
                this._toDraw.push(name);
            }
        }
    },
    removeObject: function(name) {
        if (name in this._preElems) {
            delete this._preElems[name];
        }
        if (name in this._elems) {
            delete this._elems[name];
        }
        if (this.svgReady) {
            var e = this._svg.getElementById(name);
            if (e) this._svg.remove(e);
        }
    },
    objectNames: function(pre) {
        return Object.keys(pre ? this._preElems : this._elems);
    },
    clear: function() {
        // Clear all objects
        if (this.svgReady) {
            this._svg.clear();
        }
        this._preElems = {};
        this._toPreDraw = [];
        this._elems = {};
        this._toDraw = [];
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
        this.element
            .addClass('interactiveMap')
            .disableSelection()
            .mousewheel($.proxy(this._mouseWheel,this));
        this._elems.view = $('<div class="viewPort"/>')
            .appendTo(this.element);
        this._elems.container = $('<div class="container"/>')
            .appendTo(this._elems.view);
        this._elems.tileCache = $('<div class="tileCache"/>')
            .appendTo(this._elems.container);
        this._elems.overlay = $('<div class="overlay"/>')
            .appendTo(this._elems.container);
        this._elems.navigator = $('<div class="navigation"><div class="navigationBase"/></div>')
            .appendTo(this._elems.view)
            .mousemove($.proxy(this._mouseNavigationHover,this))
            .mousedown($.proxy(this._mouseNavigationDown,this))
            .mouseup($.proxy(this._mouseNavigationUp,this));
        this._navigatorHit = true;
        this._elems.navigatorOverlay = $('<div class="navigateNone"/>')
            .appendTo(this._elems.navigator);
        this._navigatorFadeDone = $.proxy(this._navigatorFadeDoneEvt,this);
        this.overlay();
        if (!this.element.is(':hidden')) {
            this.loadMap();
        }
    },
    render: function() {
        if (this.element.is(':hidden') || !this.options.map) {
            // nothing to see here move along
            return;
        }
        if (!this._map) {
            this.loadMap();
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
            rw: _viewwidth,
            rh: _viewheight,
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
        for (var a in this._elems) {
            this._elems[a] = null;
        }
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
        $.get(this.options.map,undefined,$.proxy(this._loadXML,this),'xml');
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
        if (layer < 0 || layer >= this._map.layers.length) {
            return; // max zoom
        }
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
    // Center on the specified X and Y coords
    center: function(aX, aY, adjustScale) {
        if (adjustScale) {
            var s = this._activeLayer.scale;
            aX = aX * s.num / s.den;
            aY = aY * s.num / s.den;
        }
        var p = {
            left: -aX + (this._view.rw / 2),
            top: -aY + (this._view.rh / 2)
        }
        this.checkTiles(p.left,p.top);
        this._elems.container.animate({top:p.top, left:p.left},'fast');
    },
    _mouseStart: function(aEvt) {
        this._navigatorHit = false;
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
        this._elems.container.css({left:Math.floor(p.x), top: Math.floor(p.y)});
        this.checkTiles(p.x, p.y);
    },
    _mouseWheel: function(event, delta) {
        var layer = this._activeLayerNum + (delta < 0 ? -1 : 1);
        event.preventDefault();
        var offset = this.element.offset();
        this.loadLayer(layer, {x:event.pageX - offset.left, y:event.pageY - offset.top});
    },
    _mouseStop: function(aEvt) {
        this._navigatorHit = true;
    },
    _navigatorFindButton: function(posX, posY) {
        var x = posX - 50;
        var y = posY - 50;
        var r = Math.sqrt(Math.pow(x,2)+Math.pow(y,2));
        var t = 360 - (Math.atan2(x,y)*(180/Math.PI)+180);
        var btn = null;

        if (r < 50) {
            if (r <= 30) {
                if (posX < 50) {
                    btn = 'Minus';
                } else if (posX > 50) {
                    btn = 'Plus';
                }
            } else {
                if (t > 330 || t < 30) {
                    btn = 'Up';
                } else if (t < 300 && t > 240) {
                    btn = 'Left';
                } else if (t < 210 && t > 150) {
                    btn = 'Down';
                } else if (t < 120 && t > 60) {
                    btn = 'Right';
                }
            }
        }
        return btn;
    },
    _mouseNavigationHover: function(aEvt) {
        if (!this._navigatorHit) {
            return;
        }
        var offset = this._elems.navigator.offset();
        var posX = aEvt.pageX - offset.left;
        var posY = aEvt.pageY - offset.top;
        var btn = this._navigatorFindButton(posX, posY);

        var cls = 'navigate'+(btn || 'None');
        if (!this._elems.navigatorOverlay.hasClass(cls)) {
            this._elems.navigatorOverlay.attr('class',cls);
        }
    },
    _mouseNavigationDown: function(aEvt) {
        var offset = this._elems.navigator.offset();
        var posX = aEvt.pageX - offset.left;
        var posY = aEvt.pageY - offset.top;
        var btn = this._navigatorFindButton(posX, posY);
        if (btn) {
            aEvt.stopPropagation();
            this._navigatorHit = true;
        } else {
            this._navigatorHit = false;
        }
    },
    _mouseNavigationUp: function(aEvt) {
        if (!this._navigatorHit) {
            this._navigatorHit = true;
            return;
        }
        this._navigatorHit = true;
        var offset = this._elems.navigator.offset();
        var posX = aEvt.pageX - offset.left;
        var posY = aEvt.pageY - offset.top;
        var btn = this._navigatorFindButton(posX, posY);
        if (!btn) {
            return;
        }
        var DIST = 50;
        var p = this._elems.container.position();
        this._elems.navigatorOverlay.attr('class','navigate'+btn);
        switch (btn) {
            case 'Up':
                p.top += DIST;
                this.checkTiles(p.left,p.top);
                this._elems.container.animate({top:p.top},'fast');
                break;
            case 'Down':
                p.top -= DIST;
                this.checkTiles(p.left,p.top);
                this._elems.container.animate({top:p.top},'fast');
                break;
            case 'Left':
                p.left += DIST;
                this.checkTiles(p.left,p.top);
                this._elems.container.animate({left:p.left},'fast');
                break;
            case 'Right':
                p.left -= DIST;
                this.checkTiles(p.left,p.top);
                this._elems.container.animate({left:p.left},'fast');
                break;
            case 'Minus':
                this.loadLayer(this._activeLayerNum - 1, {
                    x:this._elems.container.width()/2,
                    y:this._elems.container.height()/2});
                break;
            case 'Plus':
                this.loadLayer(this._activeLayerNum + 1, {
                    x:this._elems.container.width()/2,
                    y:this._elems.container.height()/2});
                break;
        }
        this._elems.navigatorOverlay.fadeOut('fast',this._navigatorFadeDone);
    },
    _navigatorFadeDoneEvt: function() {
        this._elems.navigatorOverlay.attr('class','').show();
    }
});

$.extend($.ooo.interactiveMap, {
    version: "0.2"
});

})(jQuery);
