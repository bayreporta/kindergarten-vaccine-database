var stackedColumnChart = {
	getAttr: function(type, path, contain, w, h, m, color, items, sort, xlabel, ylabel, tF, tick, pad, title, subhed, source, legend){
		var p = {
			label:[],
			data:[],
			w:null,
			h:null,
			m:{},
			contain:null,
			xaxisLabel:null,
			yaxisLabel:null,
			tickFormat:null,
			ticks:null,
			path:null,
			color:null,
			padding:null,
			sort:false,
			items:null,
			title:null,
			subhed:null,
			source:null,
			type:null,
			legend:null
		}
		p.type = type;

		p.w = parseInt(w)// - m[1] - m[3];
		p.h = parseInt(h)// - m[0] - m[2];
		p.m = {
			top:m[0],
			right:m[1],
			bottom:m[2],
			left:m[3]
		};
		p.path = path;
		p.contain = '#' + contain;
		p.xaxisLabel = xlabel;
		p.yaxisLabel = ylabel;
		p.tickFormat = tF;
		p.ticks = tick;
		p.color = color[items];
		p.padding = pad;
		p.sort = sort;

		p.title = title;
		p.subhed = subhed;
		p.source = source;

		p.legend = legend;

		stackedColumnChart.drawChart(p);
	},
	commaSeparateNumber:function(val){
	    while (/(\d+)(\d{3})/.test(val.toString())){
	      val = val.toString().replace(/(\d+)(\d{3})/, '$1'+','+'$2');
	    }
	    return val;
	},
	processData:function(d){
		console.log(d);

		var ret = new Array(),
			year = 2008;

		for (var i = 0 ; i < 8 ; i++){
			var obj = new Object();

			obj['utd_' + year] = Math.round((parseInt(d['utd_' + year]) / parseInt(d['enroll_' + year])) * 100);
			obj['con_' + year] = Math.round((parseInt(d['con_' + year]) / parseInt(d['enroll_' + year])) * 100);
			obj['pme_' + year] = Math.round((parseInt(d['pme_' + year]) / parseInt(d['enroll_' + year])) * 100);
			obj['pbe_' + year] = Math.round((parseInt(d['pbe_' + year]) / parseInt(d['enroll_' + year])) * 100);
			i == 7 ? obj['overdue_' + year] = Math.round((parseInt(d['overdue_' + year]) / parseInt(d['enroll_' + year])) * 100) : obj['overdue_' + year] = 0

			ret.push(obj);
			year ++;
		}
		return ret;
	},
	drawChart: function(p){
		var contain = p.contain;

		/* SCALE
		==========================*/
		var xScale = d3.scale.ordinal().rangeRoundBands([0, p.w - (p.m.left - 10)], p.padding);
		var yScale = d3.scale.linear().rangeRound([p.h, 0]);

		/* COLOR
		==========================*/
		var color = d3.scale.ordinal().range(p.color);

		/* AXES
		==========================*/
		var xAxis = d3.svg.axis().scale(xScale).orient('bottom');
		var yAxis = d3.svg.axis().scale(yScale).orient('left').ticks(p.ticks).tickFormat(d3.format(p.tickFormat));

		/* CHART
		==========================*/
		var chart = d3.select(p.contain).append('svg').classed('s_c_p', true).attr('width', p.w).attr('height', p.h)
					.append('g').attr('transform', 'translate('+ p.m.left +','+ p.m.top + ')');

		/* DATA AND DRAW
		===============================================================================*/
		p.data = this.processData(p.path);

		color.domain(d3.keys(data[0]).filter(function(key){ return key !== 'xlabel'}));
		
		/* MAPS Y POS FOR SEGMENTS
		====================================*/
		if (p.type === 'stackedbarpercent'){
			data.forEach(function(d){
				var y0 = 0;
				d.seg = color.domain().map(function(name){ return {data:d[name], name:name, y0:y0, y1: y0 += +d[name]}; })
				d.seg.forEach(function(d) {d.y0 /= y0; d.y1 /= y0;});
			})
		}
		else if (p.type === 'stackedbar'){
			data.forEach(function(d) {
			   	var y0 = 0;
			   	d.seg = color.domain().map(function(name) { return {data:d[name], name: name, y0: y0, y1: y0 += +d[name]}; });
			   	d.total = d.seg[d.seg.length - 1].y1;
			});

			/* MAX VALUE
			====================================*/
			yScale.domain([0, d3.max(data, function(d) { return d.total; })]).nice().clamp(true);
		}

		/* SORT
		====================================*/
		if (p.sort == true || p.sort === 'true'){data.sort(function(a,b) {return b.seg[0].y1 - a.seg[0].y1;})}

		/* MAP X COLUMNS
		====================================*/
		xScale.domain(data.map(function(d){ return d.xlabel;}));

		/* DRAW AXES
		====================================*/
		chart.append('g').attr('class', 'xaxis').attr('transform', 'translate(0,' + p.h + ')').call(xAxis)
			.selectAll(".tick text").call(stackedColumnChart.wrapLabels, xScale.rangeBand());
		chart.append('g').attr('class', 'yaxis').call(yAxis);

		/* TOOLTIP
		====================================*/
		var tip = d3.tip().html(function(d) { 
			jQuery('.n').addClass('d3-tip');
			console.log(d)
			if (p.tickFormat == '.0%'){
				return (d.name + '<br>' + d.data * 100 + '%');
			}
			else if (p.tickFormat == '$,'){
				return (d.name + '<br>' + '$' + stackedColumnChart.commaSeparateNumber(Math.round(d.y1 - d.y0)));
			}
			else if (p.tickFormat == ',g'){
				return (d.name + '<br>' + stackedColumnChart.commaSeparateNumber(Math.round(d.y1 - d.y0)));
			}
		});
		chart.call(tip);

		/* DRAW COLUMNS
		====================================*/
		var items = chart.selectAll('.xitem').data(data).enter()
					.append('g').attr('class','xitem').attr('transform', function(d){return 'translate(' + xScale(d.xlabel) + ',0)';});

		items.selectAll('rect').data(function(d) {return d.seg;}).enter().append('rect')
			.attr('width', xScale.rangeBand()).attr('y', function(d) {return yScale(d.y1);}).attr('height', function(d) {return yScale(d.y0) - yScale(d.y1); }).style('fill', function(d){ return color(d.name);})
			.on('mouseover', tip.show).on('mouseout', tip.hide);

		/* ADJUST SVG
		====================================*/
		jQuery(contain + ' svg').attr('height', p.h+(p.m.top * 2));
		var svgg = jQuery(contain + ' svg').attr('height');		

		jQuery(contain).prepend('<div id="legend"></div>');
		for (var i = 0 ; i < p.data[0].seg.length ; i++){
			jQuery(contain + ' #legend').append('<div class="legend-item"><div></div><p>'+p.data[0].seg[i].name+'</p></div>');
			jQuery(contain + ' .legend-item>div:eq('+i+')').css({'background-color':p.color[i]})
		}


		/* ADD META DETAILS
		=================================*/
		jQuery(contain).prepend('<div id="meta"></div>');
		jQuery(contain + ' #meta').append('<h2>'+p.title+'</h2>');
		jQuery(contain + ' #meta').append('<p>'+p.subhed+'</p>');
		jQuery(contain + ' #meta').append('<p>'+p.source+'</p>');

		/* STYLES
		=================================*/
		jQuery(contain).css('width', parseInt(p.w)+ 'px');

		jQuery(contain + ' #meta h2').css({'margin':0});
		jQuery(contain + ' #meta p:eq(0)').css({'margin':0});
		jQuery(contain + ' #meta p:eq(1)').css({'font-style':'italic', 'font-size':'.9em','margin-top':'5px'});

		jQuery(contain + ' #legend').css({'overflow':'hidden', 'margin':'20px 0 0 0'});
		jQuery(contain + ' .legend-item').css({'float':'left','overflow':'hidden', 'margin':'0 15px 10px 0'});
		jQuery(contain + ' .legend-item>div').css({'width':'30px','height':'30px','float':'left'});
		jQuery(contain + ' .legend-item p').css({'font-size':'.9em','color':'#333','float': 'right', 'margin': '0 0 0 10px'});
	},
	wrapLabels: function(text, width){
		text.each(function() {
		    var text = d3.select(this),
		        words = text.text().split(/\s+/).reverse(),
		        word,
		        line = [],
		        lineNumber = 0,
		        lineHeight = 1.1, // ems
		        y = text.attr("y"),
		        dy = parseFloat(text.attr("dy")),
		        tspan = text.text(null).append("tspan").attr("x", 0).attr("y", y).attr("dy", dy + "em");
		    while (word = words.pop()) {
		      line.push(word);
		      tspan.text(line.join(" "));
		      if (tspan.node().getComputedTextLength() > width) {
		        line.pop();
		        tspan.text(line.join(" "));
		        line = [word];
		        tspan = text.append("tspan").attr("x", 0).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
		      }
		    }
		  });
	}
}