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

$.widget('ui.interactiveMap', $.extend({}, $.ui.mouse, {
    _init: function() {
        this._mouseInit();
        this._elems = {};
        var self = this;
        this.element
            .addClass('interactiveMap')
            .disableSelection()
            .mousewheel(function(event,delta) { self._mouseWheel(event,delta); });
        this._elems.view = $('<div class="viewPort"/>')
            .appendTo(this.element);
        this._elems.container = $('<div class="container"/>')
            .appendTo(this._elems.view);
        this._elems.tileCache = $('<div class="tileCache"/>')
            .appendTo(this._elems.container);
        this.loadMap();
    },
    destroy: function() {
        this._mouseDestroy();
        this.element.empty();
        this.element
            .removeClass('interactiveMap')
            .enableSelection();

        $.widget.prototype.destroy.apply(this, arguments);
    },
    loadMap: function(map) {
        if (map) {
            this._setData('map',map);
        }
        var self = this;
        $.get(this._getData('map'),undefined,function(xml) {
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
                scale: parseScale(_l.attr('scale')),
                path: dirname(this._getData('map'))+'/'+_l.attr('path')+'/',
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
        this.loadLayer(0);
    },
    loadLayer: function(layer, center) {
        var cur_scale;
        if (layer === this._activeLayerNum) return;
        // Grab current layer scale
        if (this._activeLayer && center) {
            cur_scale = this._activeLayer.scale;
        }
        this._activeLayer = this._map.layers[layer];
        this._activeLayerNum = layer;
        var left = this._elems.container[0].offsetLeft;
        var top = this._elems.container[0].offsetTop;
        if (cur_scale) {
            var new_scale = this._activeLayer.scale;
            var mult = (cur_scale.den * new_scale.num) / (cur_scale.num * new_scale.den);
            var hw = this._elems.view.width() / 2;
            var hh = this._elems.view.height() / 2;
            left = (left - hw) * mult + hw;
            top = (top - hh) * mult + hh;
            this._elems.container.css({left:left,top:top});
        }
        this.checkTiles(left, top);
    },
    _sortLayers: function(a, b) {
        // Sort Ascending
        return (a.scale.num / a.scale.den) - (b.scale.num / b.scale.den);
    },
    _setupTiles: function() {
        var _viewwidth = this.element.innerWidth()
            || this._getData('width') || 400;
        var _viewheight = this.element.innerHeight()
            || this._getData('height') || 400;
        this._elems.tileCache.empty();
        this._tileCache = {};
        this._tiles = [];
        var tiles_x = Math.ceil(_viewwidth / this._map.tilesize) + 1;
        var tiles_y = Math.ceil(_viewheight / this._map.tilesize) + 1;
        this._view = {
            w: (tiles_x + 1) * this._map.tilesize,
            h: (tiles_y + 1) * this._map.tilesize
        };
        this._elems.container.css({left:0,top:0});
    },
    _createTile: function(x, y) {
        var tile = $('<div class="tile"/>')
            .css({left:x,top:y,
                width:this._map.tilesize,height:this._map.tilesize})
            .appendTo(this._elems.tileCache)
        $('<img/>')
            .attr('src',this._getImageForTile(x,y))
            .css({
                width:this._map.tilesize,
                height: this._map.tilesize
            })
            .appendTo(tile);
        if (!this._tileCache[x]) {
            this._tileCache[x] = {};
        }
        this._tileCache[x][y] = tile;
        this._tiles.push(tile);
    },
    _moveTile: function(tile, x, y) {
        // Remove from Cache
        this._tileCache[tile[0].offsetLeft][tile[0].offsetTop] = undefined;
        var img = tile.children();
        // Set blank image
        //img.attr('src',this._getData('blankImage'));
        // Move Tile
        tile.css({left:x,top:y});
        // Update Image
        img.attr('src',this._getImageForTile(x,y));
        // update layer for tile
        tile.data('layer',this._activeLayerNum);
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
        return this._getData('blankImage');
    },
    checkTiles: function(aX, aY) {
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
                        || tile.data('layer')!=this._activeLayerNum) {
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
        $.extend(this.offset, {
            click: { //Where click happened, relative to the element
                x:aEvt.pageX - this.offset.left,
                y:aEvt.pageY - this.offset.top
            },
            view: {
                x:this._elems.container[0].offsetLeft,
                y:this._elems.container[0].offsetTop
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
        this.loadLayer(layer, true);
    },
    _mouseStop: function(aEvt) {

    }
}));

$.extend($.ui.interactiveMap, {
    version: "0.0.1",
    getter: "",
    defaults: $.extend({}, $.ui.mouse.defaults, {
        map:'',
        blankImage:'images/blank.gif'
    })
});

})(jQuery);