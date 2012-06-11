RoundedBarGraph = function(ctx){
    if (ctx.width === undefined){ throw Error('No width given.'); }
    this.w = ctx.width;

    if (ctx.height === undefined){ throw Error('No height given.'); }
    this.h = ctx.height;

    if (ctx.node === undefined){ throw Error('No Node given'); }
    this.node =  ctx.node;

    var chart_height = ctx.chart_height || 0.8;
    var chart_width = ctx.chart_width || 0.9;


    this.line = ctx.line || {};
    this.line.color =  this.line.color || '#cf3d96';

    this.chart = {};
    this.chart.width = this.w * chart_width;
    this.chart.width_offset = this.w * (1 - chart_width);
    this.chart.height = this.h * 0.8;
    this.chart.height_offset = this.h * (1 - chart_height);

    // bars config
    this.bar = ctx.bar || {};
    this.bar.color = this.bar.color ||  '#f1b821';
    this.bar.rounding = this.bar.rounding === undefined ? 5 : this.bar.rounding;
    this.bar.width = this.bar.width || 25;
    this.bar.margin = this.bar.margin || 10; // margin between the arcs

    this.colors = ctx.colors || ['#0093d5', '#f1b821', '#009983','#cf3d96', '#df7627', '#252', '#528', '#72f', '#444'];

    if (ctx.data !== undefined && ctx.data !== null){
        this.update_data(ctx.data);
    }
};

RoundedBarGraph.prototype = {

    update_data: function(data){
        if (data.length === undefined || data.length === 0) { return; }
        this.data = data;

        this.max = 0;
        this.total = 0;
        for (var i =0 ; i < this.data.length; i ++){
            var val = this.data[i].value;
            if (val > this.max){
                this.max = val;
            }
        }
        this.max = this.max * 1.5;
        this.bar.width_new = this.bar.width;
        // Check to see if the bar width is too big, if it is reduce the width of the arcs
        if (this.data.length * (this.bar.width + this.bar.margin) > this.chart.width ){
            this.bar.width_new = (this.chart.width - this.data.length * this.bar.margin) / this.data.length;
        }

        var me = this;


        this.vis = d3.select(this.node).select('g.bar-chart');
        if (this.vis.empty()){
            this.vis = d3.select(this.node).append("svg")
                .attr("class", "chart")
                .attr("width", this.w)
                .attr("height", this.h)
                .append('g')
                .attr('class', 'bar-chart');
                            d3.select(this.node).append('g')
                    .attr('class','bw-line-g')
                    .attr("width", this.w)
                    .attr("height", this.h);
        }

        this.line_g = d3.select(this.node).select('g.bw-line-g') ;

        // Add the colored arcs
        var bg = this.vis.selectAll('rect')
            .data(this.data);

        var y = d3.scale.linear()
            .domain([0, this.max])
            .rangeRound([0, this.chart.height]);

        var x = d3.scale.linear()
            .domain([0, 1])
            .range([0, this.bar.width_new]);

        var rects = this.vis.selectAll('rect.rb-bar-main')
                    .data(this.data);

        rects.enter().append('rect')
            .attr('class', function(d, i){ return  'rb-bar rb-bar-main rb-bar-' + i; })
            .attr('x', function(d, i){ return x(i) + me.chart.width_offset + me.bar.margin * i; })
            .attr('rx', this.bar.rounding) // this unfortuantly rounds the entire rectangle :(
            .attr('width', this.bar.width_new)
            .attr('y', me.h - me.chart.height_offset)
            .transition().duration(1000)
            .attr('y', function(d, i) { return me.h - y(d.value) - 0.5 - me.chart.height_offset; })
            .attr('height',  function(d, i) { return y(d.value); } )
            .attr('fill', me.bar.color);

        rects.transition().duration(1000)
            .attr('y', me.h - me.chart.height_offset)
            .attr('width', this.bar.width_new)
            .attr('x', function(d, i){ return x(i) + me.chart.width_offset + me.bar.margin * i; })
            .attr('height',  function(d, i) { return y(d.value); } )
            .attr('y', function(d, i) { return me.h - y(d.value) - 0.5 - me.chart.height_offset; });

        rects.exit().remove();

        if (this.bar.rounding > 0 ){
            // re-square the bottom
            bg.enter().append('rect')
                .attr('x', function(d, i){ return x(i) + me.chart.width_offset + me.bar.margin * i; })
                .attr('width', this.bar.width_new)
                .attr('y', function(d, i) {
                    var tmpy = me.h - me.chart.height_offset - me.bar.rounding;
                    var offy = me.h - y(d.value) - 0.5 - me.chart.height_offset;
                    if (tmpy <= offy){
                        return offy;
                    }
                    return tmpy;
                })
                    //this.h  - this.chart.height_offset - this.bar.rounding)
                .attr('height', function (d, i){
                    var ytmp = me.h - y(d.value) - 0.5 - me.chart.height_offset +  me.bar.rounding;
                    if (ytmp >= me.chart.height){
                        var ret = ytmp - me.chart.height;
                        return me.bar.rounding - ret;
                    }
                    return me.bar.rounding;

                })
                .attr('fill', this.bar.color)
                .attr('class', function(d, i){ return  'rb-bar rb-bar-bottom-square rb-bar-' + i; });

            // re-square the top left
            bg.enter().append('rect')
                .attr('x', function(d, i){ return x(i) + me.chart.width_offset + me.bar.margin * i; })
                .attr('width', this.bar.width_new / 2)
                .attr('y', function(d, i) { return me.h - y(d.value) - 0.5 - me.chart.height_offset; })
                .attr('height', function(d, i){
                    var ytmp = me.h - y(d.value) - 0.5 - me.chart.height_offset +  me.bar.rounding;
                    if (ytmp > me.chart.height){
                         var ret = ytmp - me.chart.height;
                         return me.bar.rounding - ret;
                    }
                    return me.bar.rounding;
                })
                .attr('fill', me.bar.color)
                .attr('class', function(d, i){ return  'rb-bar rb-bar-top-square rb-bar-' + i; });
        }

        var texts = this.vis.selectAll('text.rb-bar-text')
                    .data(this.data);
        // add the text above the bars
        texts.enter()
            .append('text')
            .attr('x', function(d, i){ return x(i) + me.chart.width_offset + me.bar.margin * i + me.bar.width_new / 2; })
            .attr('y', function(d, i){ return me.h - y(d.value) -0.5 - me.chart.height_offset; })
            .attr('dx', 0)
            .attr('dy', -5)
            .attr('class', function(d, i){ return  'rb-bar rb-bar-text rb-bar-text-' + i; })
            .attr('text-anchor', 'middle')
            .attr('font-size', '10px')
            .attr('fill', me.bar.color)
            .text(function(d){ return d.value; });

        texts.transition().duration(1000)
            .attr('x', function(d, i){ return x(i) + me.chart.width_offset + me.bar.margin * i + me.bar.width_new / 2; })
            .attr('y', function(d, i){ return me.h - y(d.value) -0.5 - me.chart.height_offset; })
            .attr('dx', 0)
            .attr('dy', -5)
            .text(function(d){ return d.value; });

        texts.exit().remove();


        texts = this.vis.selectAll('g.rb-series')
                    .data(this.data);
        // add the x series
        texts.enter().append('g')
        .attr('transform', function(d,i) {
                var x_pos = x(i) + me.chart.width_offset + me.bar.margin * i + me.bar.width_new / 2 + 5;
                var y_pos = me.h * 0.9 - 45;
            return 'translate(' + x_pos + ',' + y_pos + ')';})
        .attr('class', function(d, i){ return  'rb-series rb-series-' + i; })
            .append('text')
            .attr('transform', 'rotate(-90)')
            .attr('class', function(d, i){ return  'rb-series-text rb-series-text-' + i; })
            .attr('text-anchor', 'end')
            .attr('font-size', '13px')
            .text(function(d){ return d.series; });

        texts.transition().duration(1000)
             .attr('transform', function(d,i) {
                            var x_pos = x(i) + me.chart.width_offset + me.bar.margin * i + me.bar.width_new / 2 + 5;
                            var y_pos = me.h * 0.9 - 45;
                        return 'translate(' + x_pos + ',' + y_pos + ')';});

        texts.exit().remove();

        texts = this.vis.selectAll('text.rb-series-text')
                    .data(this.data);
        texts.transition().duration(1000)
            .text(function(d){ return d.series; });

        texts.exit().remove();

        yseries = d3.scale.linear()
            .domain([0, this.max])
            .rangeRound([this.chart.height + 5, 10]);

        this.vis.selectAll('g')
            .data(yseries.ticks(4))
            .enter().append('text')
            .attr('y', yseries)
            .attr('x', this.chart.width_offset - 5)
            .attr('text-anchor', 'end')
            .attr('class', 'rb-y-tick')
            .attr('font-size', '12px')
            .text(String);


        if (this.line.percent !== undefined){
            this.line.constant = this.line.percent * this.max;
        }

        if (this.line.average !== undefined){
            for (var j =0; j < data.length; j++){
                this.total += data[j].value;
            }
            var avg = this.total / data.length;
            this.line.constant = avg;
        }


        if (this.line.constant !== undefined){
                var const_line = this.line_g.selectAll('line');
                //const_line.remove();
                const_line = const_line.data([this.line.constant]);

                const_line.enter().append('line')
                    .attr('x1', this.chart.width_offset - 5)
                    .attr('x2', this.w)
                    .attr('y1', function(d) { return me.h - y(d) -0.5 - me.chart.height_offset; })
                    .attr('y2', function(d) { return me.h - y(d) -0.5 - me.chart.height_offset; })
                    .attr('class', 'rb-line')
                    .attr('stroke-dasharray', '3')
                    .attr('stroke-width', '2')
                    .attr('stroke', this.line.color);

                const_line.transition().duration(1000)
                    .attr('y1', function(d) { return me.h - y(d) -0.5 - me.chart.height_offset; })
                    .attr('y2', function(d) { return me.h - y(d) -0.5 - me.chart.height_offset; });

        }else {
            this.line.selectAll('line.bw-cosntant-line').remove();
        }
    }

};