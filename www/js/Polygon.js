/*
 * Polgon, Point, and Rectangle wrapper classes
 *
 * Contains Point algorithm Generously borrowed and rewritten from http://dawsdesign.com/drupal/google_maps_point_in_polygon
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

(function($) {

//shared utility functions
function _drawRect(x, y, w, h)
{
    var div = $('<div/>')
        .css({
            position: 'absolute',
            left: x,
            top: y,
            width: w,
            height: h
        });
    return div;
}

function Point(x, y)
{
    this.x = x;
    this.y = y;
}

$.extend(Point.prototype, {
    toString: function() {
        return '[x='+this.x+',y='+this.y+']';
    },
    toOffset: function() {
        return {left: this.x, top: this.y};
    },
    toBgOffset: function() {
        return this.x+'px '+this.y+'px';
    }
});

window.Point = Point;

function Rect(l,t,r,b)
{
    this.l = l;
    this.t = t;
    this.r = r;
    this.b = b;
}

$.extend(Rect.prototype, {
    toString: function ()
    {
        return '[l='+this.l+',t='+this.t+',b='+this.b+',r='+this.r+']';
    },
    toCSSRect: function()
    {
        return {
            left: this.l,
            top: this.t,
            width: this.r - this.l + 1,
            height: this.b - this.t + 1
        };
    },
    TL: function()
    {
        return new Point(this.l, this.t);
    },
    TR: function()
    {
        return new Point(this.r, this.t);
    },
    BL: function()
    {
        return new Point(this.l, this.b);
    },
    BR: function()
    {
        return new Point(this.r, this.b);
    },
    extendByPoint: function(point)
    {
        this.l = Math.min(this.l,point.x);
        this.r = Math.max(this.r,point.x);
        this.t = Math.min(this.t,point.y);
        this.b = Math.max(this.b,point.y);
        return this;
    },
    setDimensions: function(width, height)
    {
        this.r = this.l + width - 1;
        this.b = this.t + height -1;
        return this;
    },
    moveTo: function(x, y)
    {
        if (x != this.l) {
            var w = this.r - this.l;
            this.l = x;
            this.r = x + w;
        }
        if (y != this.t) {
            var h = this.b - this.t;
            this.t = y;
            this.b = y + h;
        }
        return this;
    },
    containsPoint: function(point)
    {
        return (point.x >= this.l && point.x <= this.r
            && point.y >= this.t && point.y <= this.b);
    },
    containsRect: function(rect)
    {
        return (rect.l >= this.l && rect.t >= this.t
            && rect.b <= this.b && rect.r <= this.r);
    },
    intersectsRect: function(rect)
    {
        return (this.containsPoint(rect.TL())
            || this.containsPoint(rect.BL())
            || this.containsPoint(rect.TR())
            || this.containsPoint(rect.BR()));
    }
});

window.Rect = Rect;

/**
 * points is an array of 2 member x,y arrays
 */
function Polygon(points, hole/*, holeN...*/)
{
    this.setPoints(points);
    this.holes = [];
    for (var i=1,len=arguments.length; i<len; ++i) {
        this.addHole(arguments[i]);
    }
}

$.extend(Polygon.prototype, {
    /**
     * points is an array of 2 member x,y arrays
     */
    setPoints: function(points)
    {
        this.points = [];
        this.bounds = null;
        if (!points || !points.length) {
            return;
        }
        this.addPoint(points[0]);

        for (var i=1, len=points.length; i<len; i++) {
            this.addPoint(points[i]);
        }
    },
    addHole: function(points)
    {
        if (!points || !points.length) {
            return;
        }
        var o = new Polygon(points);
        this.holes.push(o);
    },
    addHoles: function(holes)
    {
        for (var i=0,len=holes.length; i<len; ++i) {
            this.addHole(holes[i]);
        }
    },
    addPoint: function(point)
    {
        var p = point instanceof Point
                    ? point
                    : new Point(point[0], point[1]);
        this.points.push(p);
        if (this.points.length == 1) {
            this.bounds = new Rect(p.x,p.y,p.x,p.y);
        } else {
            this.bounds.extendByPoint(p);
        }
    },
    getBounds: function()
    {
        return this.bounds;
    },
    getPointCount: function()
    {
        return this.points.length;
    },
    getPoint: function(index)
    {
        return this.points[index];
    },
    getPointScaled: function(index, scale, round)
    {
        if (scale.num == scale.den) {
            return this.points[index];
        }
        if (round) {
            return new Point(
                Math.round(this.points[index].x * scale.num / scale.den),
                Math.round(this.points[index].y * scale.num / scale.den)
            );
        } else {
            return new Point(
                this.points[index].x * scale.num / scale.den,
                this.points[index].y * scale.num / scale.den
            );
        }
    },
    getHolesCount: function()
    {
        return this.holes.length;
    },
    getHole: function(index)
    {
        return this.holes[index];
    },
    HolesToArray: function(round)
    {
        var ret = [];
        for (var i=0,l=this.getHolesCount(); i<l; ++i) {
            ret.push(this.getHole(i).toArray(round));
        }
        return ret;
    },
    toArray: function(round)
    {
        var ret = [];
        for (var i=0,l=this.getPointCount(); i<l; ++i) {
            var p = this.getPoint(i);
            if (round===undefined) {
                ret.push([p.x,p.y]);
            } else {
                ret.push([parseFloat(p.x.toFixed(round)),parseFloat(p.y.toFixed(round))]);
            }
        }
        return ret;
    },
    toArrayX: function(round)
    {
        var ret = [];
        for (var i=0,l=this.getPointCount(); i<l; ++i) {
            var p = this.getPoint(i);
            if (round===undefined) {
                ret.push(p.x);
            } else {
                ret.push(parseFloat(p.x.toFixed(round)));
            }
        }
        return ret;
    },
    toArrayY: function(round)
    {
        var ret = [];
        for (var i=0,l=this.getPointCount(); i<l; ++i) {
            var p = this.getPoint(i);
            if (round===undefined) {
                ret.push(p.y);
            } else {
                ret.push(parseFloat(p.y.toFixed(round)));
            }
        }
        return ret;
    },
    clone: function()
    {
        return new Polygon(this.points);
    },
    /**
     * point is a 2 member array of X and Y positions
     */
    containsPoint: function(point) {
        // Do simple calculation so we don't do more CPU-intensive calcs for obvious misses
        if (!this.getBounds().containsPoint(point)) {
            return false;
        }
        var i,l,j;
        // Check Holes FIRST
        for (i=0,l=this.getHolesCount(); i<l; ++i) {
            if (this.getHole(i).containsPoint(point)) {
                return false;
            }
        }
        var inPoly = false;

        for(i=0,l = this.getPointCount(),j=l-1;
                i < l;
                j=i,i++) {
            var vertex1 = this.getPoint(i);
            var vertex2 = this.getPoint(j);
            if (vertex1.y < point.y && vertex2.y >= point.y
                    || vertex2.y < point.y && vertex1.y >= point.y)  {
                if (vertex1.x + (point.y - vertex1.y)
                            / (vertex2.y - vertex1.y)
                            * (vertex2.x - vertex1.x) < point.x) {
                    inPoly = !inPoly;
                }
            }
        }

        return inPoly;
    },
    // retrieves all the edges of this polygon
    getEdges: function(noHoriz, aScale)
    {
        var ret = [];
        for (var i=0,l=this.getPointCount(); i<l; ++i) {
            var edge = {};
            var p1 = this.getPointScaled(i, aScale, true),
                p2 = this.getPointScaled((i==(l-1))?0:i+1, aScale, true);
            edge.iM = (p2.x - p1.x) / (p2.y - p1.y);
            if (!noHoriz || isFinite(edge.iM)) {
                if (p1.y < p2.y) {
                    edge.minY = p1.y;
                    edge.maxY = p2.y;
                    edge.X = p1.x;
                } else {
                    edge.minY = p2.y;
                    edge.maxY = p1.y;
                    edge.X = p2.x;
                }
                ret.push(edge);
            }
        }
        return ret;
    },
    _edgeSortYX: function(a, b) {
        var ret = a.minY - b.minY;
        if (ret == 0) {
            ret = a.X - b.X;
        }
        return ret;
    },
    _edgeSortX: function(a, b) {
        return a.X - b.X;
    },
    draw: function(aDiv, aScale, aColor)
    {
        var color = aColor || '#000000';
        // calculate edges
        var global_edges = [],
            active_edges = [];
        var i,l;

        global_edges = this.getEdges(true, aScale);
        for (i=0,l=this.holes.length; i<l; ++i) {
            var t = this.getHole(i).getEdges(true,aScale);
            for (var ai=0,al=t.length; ai<al; ++ai) {
                global_edges.push(t[ai]);
            }
        }
        global_edges.sort(this._edgeSortYX);
        var scanline = Math.round(this.getBounds().t * aScale.num / aScale.den);
        while (global_edges.length || active_edges.length) {
            //var parity = 0; // Even
            while (global_edges.length) {
                if (global_edges[0].minY == scanline) {
                    active_edges.push(global_edges.shift());
                } else {
                    break;
                }
            }
            active_edges.sort(this._edgeSortX);
            //console.log('Edges',active_edges,',',global_edges);
            // Find "inside" areas
            var polyInts = [];
            var active_temp = [];
            for (i=0,l=active_edges.length; i<l; ++i) {
                var edge = active_edges[i];
                polyInts.push(edge.X);

                if (edge.maxY > (scanline+1)) {
                    // Increase X by slope
                    edge.X += edge.iM;
                    active_temp.push(edge);
                }
            }
            for(i = 0,l=polyInts.length; i < l; i+=2)
                $(aDiv).append(_drawRect(polyInts[i], scanline,
                    polyInts[i+1]-polyInts[i]+1, 1).css({backgroundColor:color}));

            active_edges = active_temp;
            ++scanline;
        }
    },
    drawSVG: function(svg, g, aColor)
    {
        var path = svg.createPath();
        var i = 0;
        var p,pp;
        p = this.points[i];
        path.move(p.x, p.y);
        var l = this.points.length;
        for (++i; i<l; ++i) {
            pp = this.points[i];
            path.line(pp.x - p.x, pp.y - p.y,true);
            p = pp;
        }
        path.close();
        for (var h=0,hl=this.holes.length; h<hl; ++h) {
            i = 0;
            p = this.holes[h].points[i];
            path.move(p.x, p.y);
            l = this.holes[h].points.length;
            for (++i; i<l; ++i) {
                pp = this.holes[h].points[i];
                path.line(pp.x - p.x, pp.y - p.y,true);
                p = pp;
            }
            path.close();
        }
        svg.path(g,path,{fill:aColor,stroke:aColor,strokeWidth: 1});
    }
});

window.Polygon = Polygon;

})(jQuery);
