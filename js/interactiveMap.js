(function($) { //hide namespace

$.widget('ui.interactiveMap', $.extend({}, $.ui.mouse, {
    _init: function() {
        this._mouseInit();
        this.element
            .addClass('interactiveMap')
            .disableSelection();
        this._view = $('<div class="viewPort"/>')
            .appendTo(this.element);
        this._container = $('<div class="container"/>')
            .appendTo(this._view);
        this._tileCache = $('<div class="tileCache"/>')
            .appendTo(this._container);
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
        $.get(this._getData('map')+'/map.xml',undefined,function(xml) {
            self._loadXML(xml);
        },'xml');
    },
    _loadXML: function(xml) {
        var pieces = $(xml).find("piece");
        this._tilesize = parseInt($(xml).find('map').attr('size'));
        this._map = [];
        for (var i=0,l=pieces.length; i<l; ++i) {
            var p = pieces.eq(i);
            var left = p.attr('left'), top = p.attr('top');
            if (!this._map[left]) {
                this._map[left] = [];
            }
            this._map[left][top] = this._getData('map')+'/'+p.attr('file');
        }
        this._setupTiles();
    },
    _setupTiles: function() {
        this._mapwidth = this.element.innerWidth() || this._getData('width') || 400;
        this._mapheight = this.element.innerHeight() || this._getData('height') || 400;
        this._tileCache.empty();
        this._tiles = [];
        var tiles_x = Math.ceil(this._mapwidth / this._tilesize) + 1;
        var tiles_y = Math.ceil(this._mapheight / this._tilesize) + 1;
        this._tileRect = new Rect(0,0,
            (tiles_x + 1) * this._tilesize,
            (tiles_y + 1) * this._tilesize
        );
        this._container.css({left:0,top:0});
        this.checkTiles(this._tileRect.TL());
    },
    _createTile: function(x, y) {
        var r = new Rect(x, y)
                    .setDimensions(this._tilesize,this._tilesize);
        var tile = $('<div class="tile"/>')
            .css(r.toCSSRect())
            .appendTo(this._tileCache)
            .data('rect',r);
        $('<img/>')
            .attr('src',this._getImageForTile(r.TL()))
            .css({
                width:this._tilesize,
                height: this._tilesize
            })
            .appendTo(tile);
        this._tiles.push(tile);
    },
    _getImageForTile: function(point) {
        if (this._map[point.x] && this._map[point.x][point.y]) {
            return this._map[point.x][point.y];
        }
        return this._getData('blankImage');
    },
    checkTiles: function(p) {
        var r = this._tileRect.moveTo(
                (Math.floor(-p.x / this._tilesize) * this._tilesize) - this._tilesize,
                (Math.floor(-p.y / this._tilesize) * this._tilesize) - this._tilesize);

        var free = this._checkFreeTiles(r);

        //figure out where we have no tiles in our map rectangle
        var needed = [];
        for (var y=r.t; y < r.b; y+=this._tilesize) {
            for (var x=r.l; x < r.r; x+=this._tilesize) {
                var tp = new Point(x,y);
                var t = this._getTileForPoint(tp);
                if (t === false) {
                    needed.push(tp);
                }
            }
        }
        for (var i=0,l=needed.length; i<l; ++i) {
            if (free[i]) {
                // Update tile Rectangle
                free[i].data('rect').moveTo(needed[i].x,needed[i].y);
                // Update Image and Move Tile
                free[i]
                    .css(needed[i].toOffset())
                    .children()
                    .attr('src',this._getImageForTile(needed[i]));
            } else {
                // Create new Tile
                this._createTile(needed[i].x,needed[i].y);
            }
        }
    },
    _getTileForPoint: function(p) {
        for (var i=0,l=this._tiles.length;i<l; ++i) {
            var t = this._tiles[i];
            if (t.data('rect').containsPoint(p)) {
                return t;
            }
        }
        return false;
    },
    _checkFreeTiles: function(r) {
        var ret = [];
        for (var i=0,l=this._tiles.length;i<l; ++i) {
            var t = this._tiles[i];
            if (!r.intersectsRect(t.data('rect'))) {
                ret.push(t);
            }
        }
        return ret;
    },
    _mouseStart: function(aEvt) {
        this.offset = this.element.offset();
        $.extend(this.offset, {
            click: new Point( //Where click happened, relative to the element
                aEvt.pageX - this.offset.left,
                aEvt.pageY - this.offset.top
            ),
            view: new Point(
                this._container[0].offsetLeft,
                this._container[0].offsetTop
            )
        });
    },
    _mouseDrag: function(aEvt) {
        if ((this._ctr++ % 20)> 0 ) return;
        var o = new Point(
            aEvt.pageX - this.offset.left,
            aEvt.pageY - this.offset.top
        );
        var p = new Point(
            o.x - this.offset.click.x + this.offset.view.x,
            o.y - this.offset.click.y + this.offset.view.y
        );
        this._container.css(p.toOffset());
        this.checkTiles(p);
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