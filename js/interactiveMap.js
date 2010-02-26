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
    loadMap: function() {
        var self = this;
        $.get(this._getData('map')+'/map.xml',undefined,function(xml) {
            self._loadXML(xml);
        },'xml');
    },
    _loadXML: function(xml) {
        var pieces = $(xml).find("piece");
        this._size = parseInt($(xml).find('map').attr('size'));
        this._map = [];
        for (var i=0,l=pieces.length; i<l; ++i) {
            var p = pieces.eq(i);
            this._map.push({
                file: p.attr('file'),
                left: p.attr('left'),
                top: p.attr('top')
            });
        }
        var w = this.element.innerWidth() || this._getData('width') || 400;
        var h = this.element.innerHeight() || this._getData('height') || 400;
        this._tileCache.empty();
        var tiles_x = Math.ceil(w / this._size);
        var tiles_y = Math.ceil(h / this._size);
        for (var y=0; y<tiles_y; ++y) {
            for (var x=0; x<tiles_x; ++x) {
                $('<div class="tile"/>')
                    .css({
                        left: x * this._size,
                        top: y * this._size,
                        width: this._size,
                        height: this._size
                    })
                    .appendTo(this._tileCache)
                    .append('<img/>')
                    .children()
                    .attr('src',this._getData('map')+'/'+(y*this._size)+'_'+(x*this._size)+'.jpg')
                    .css({
                        width:this._size,
                        height: this._size
                    });
            }
        }
    },
    _mouseStart: function(aEvt) {
        this.offset = this.element.offset();
        $.extend(this.offset, {
            click: { //Where click happened, relative to the element
                left: aEvt.pageX - this.offset.left,
                top: aEvt.pageY - this.offset.top
            },
            view: {
                left:this._container[0].offsetLeft,
                top:this._container[0].offsetTop
            }
        });
        console.log('Start:',this.offset.click.left,this.offset.click.top,
            'View:',this.offset.view.left, this.offset.view.top);
    },
    _mouseDrag: function(aEvt) {
        if ((this._ctr++ % 20)> 0 ) return;
        var o = {
            left: aEvt.pageX - this.offset.left,
            top: aEvt.pageY - this.offset.top
        };
        var p = {
            left: o.left - this.offset.click.left + this.offset.view.left,
            top: o.top - this.offset.click.top + this.offset.view.top
        }
        this._container.css(p);
    },
    _mouseStop: function(aEvt) {

    }
}));

$.extend($.ui.interactiveMap, {
    version: "0.0.1",
    getter: "",
    defaults: $.extend({}, $.ui.mouse.defaults, {
        map:''
    })
});

})(jQuery);