d3.csv('https://cdn.glitch.com/b05cb463-6c18-4ca8-83a8-682fe8669285%2F220220.csv?v=1582793838173')
	.then(data => {
	
	let datam = data;
	
	buildHla(datam);
	buildDisease(datam);
	buildPopu(datam);
	studyResult(datam);
});
// put first 5 letters of group except for,hla-d its hla-drb1 - Done
//put alpha in color for popu & may be disease also - pleasant coloring
//highlight population blob only on hover along with percentage.
//in sunburst - have gadient based on frequency. - Done

function buildHla(data){

	let r = { key: "root", values: [] };
	r.values = d3.nest()
				.key(d => {
				let k = d.group.slice(0,5);
				
				if( k == "HLA-D")
					k = "HLA-DRB1";
				
				if( k == "")
					k = "NA";
				
				return k
				}).sortKeys(d3.ascending)
				.key(d => (d.group===""?'NA':d.group)).sortKeys(d3.ascending)
				.key(d => d.keyword)
				.sortValues(function(a,b) { return a.keyword - b.keyword; })
				.rollup(l =>l.length)
				//.rollup(l => { return {"length": l.length,"details":l}})
				.entries(data);

	let rootH = d3.hierarchy(r, d => d.values)
			.sum(function(d) { return d.value; })
			//.sort();
      .sort(function(a, b) { if((a.height == 0 ||a.height == 1) && (b.height == 0 ||b.height == 1)) return b.value - a.value; });
			//.sort(function(a, b) { return b.value - a.value; });
	
	let widthH = window.innerWidth * 0.5;
	let heightH = widthH;
	let radiusH = widthH/6;
	
	let colorH = d3.scaleOrdinal(d3.quantize(d3.interpolateRainbow, rootH.children.length + 1));
			
	let partitionH = d3.partition()
					.size([2 * Math.PI, rootH.height +1 ])(rootH);
	
	let arcH = d3.arc()  // <-- 2
		.startAngle(d => d.x0)
		.endAngle(d => d.x1)
		.padAngle(d => Math.min((d.x1 - d.x0) / 2, 0.005))
		.padRadius(radiusH * 1.5)
		.innerRadius(d => d.y0 * radiusH)
		.outerRadius(d => Math.max(d.y0 * radiusH, d.y1 * radiusH - 1));
	
	let arcVisibleH = d => { return d.y1 <= 3 && d.y0 >= 1 && d.x1 > d.x0} ;

    let labelVisibleH = d => { return  d.y1 <= 3 && d.y0 >= 1 && (d.y1 - d.y0) * (d.x1 - d.x0) > 0.03 } ;

	let labelTransformH = d => {
		const x = (d.x0 + d.x1) / 2 * 180 / Math.PI;
		const y = (d.y0 + d.y1) / 2 * radiusH;
		return `rotate(${x - 90}) translate(${y},0) rotate(${x < 180 ? 0 : 180})`;
	};	
	
	
	partitionH.each(d => d.current = d);
	
	let svgH = d3.select('div.visual1')
			.append('svg')
			.attr('width' , widthH )
			.attr('height' , heightH )
			.attr("viewBox", [-widthH / 2, -heightH / 2, widthH, heightH]);
	let gH = svgH.append("g");

	let pathH = gH.append("g")
		.selectAll('path')
		.data(rootH.descendants()
				//.filter(d => {
					// Don't draw the root node, and for efficiency, filter out nodes that would be too small to see
				//	return d.depth && d.x1 - d.x0 > 0.01;
				//})
		)
		.join('path')
		.attr("fill", d => { while (d.depth > 1) d = d.parent; return colorH(d.data.key); })
		.attr("fill-opacity", d => {
			let fill = '0';
			if(arcVisibleH(d.current)){
				switch(d.depth){ 
					case 1:
						fill = 0.8;
						break;
					case 2:	
						fill = 0.6;
						break;
					case 3:
						fill = 0.4;
						break;
				}
			}
			
			return fill;
		})
		.attr("id", function(d,i){ return "hla_"+i})
		.attr("d", d => arcH(d.current));
		
	pathH.filter(d => d.children)
		.style("cursor", "pointer")
		.on("click", clicked);

	pathH.filter(d => arcVisibleH(d.current))
		.on("mouseleave", (d,i) => {
			d3.select("#hla_" + ++i).attr("fill-opacity", d => {
			let fill = '0';
			if(arcVisibleH(d.current)){
				switch(d.depth){ 
					case 1:
						fill = 0.8;
						break;
					case 2:	
						fill = 0.6;
						break;
					case 3:
						fill = 0.4;
						break;
				}
			}
			
			return fill;
		});	
		})
		.on("mouseenter", (d,i) => {
						d3.select("#hla_" + ++i).attr("fill-opacity",1);
		});
		
		
	pathH.append("title")
	.text(d => `${d.ancestors().map(d => d.data.key).reverse().join("/")}`);
		
	let labelH = gH.append("g")
				.attr("pointer-events", "none")
				.attr("text-anchor", "middle")
				.style("user-select", "none")
				.selectAll("text")
				.data(rootH.descendants())
				.join("text")
				.attr("dy", "0.35em")
				.attr("fill-opacity", d => +labelVisibleH(d.current))
				.attr("transform", d => labelTransformH(d.current))
				.text(d => d.data.key);

	let parent = gH.append("circle")
					.datum(rootH)
					.attr("r", radiusH)
					.attr("fill", "none")
					.attr("pointer-events", "all")
					.on("click", clicked);
	
	//central label
	let labelHC = svgH
				.append("text")
				.attr("text-anchor", "middle")
				.attr("fill", "#444")
				.style("visibility", "visible");
		
	labelHC.append("tspan")
		.attr("pointer-events", "none")
		.attr("class", "keyword")
		.attr("x", 0)
		.attr("y", 0)
		.attr("dy", "-0.1em")
		.attr("font-size", "2.5em")
		.text("HLA");
	
	labelHC.append("tspan")
		.attr("pointer-events", "none")
		.attr("class", "keyparent")
		.attr("x", 0)
		.attr("y", 0)
		.attr("dy", "1.2em")
		.attr("font-size", "1em")
		.text("genes");

	labelHC.append("tspan")
		.attr("pointer-events", "none")
		.attr("class", "keycounts")
		.attr("x", 0)
		.attr("y", 0)
		.attr("dy", "3em")
		.attr("font-size", "0.9em")
		.text("("+rootH.value+")");
	
	
	
	
	
	
	function clicked(p) {
		parent.datum(p.parent || rootH);
		
		rootH.each(d => d.target = {
		x0: Math.max(0, Math.min(1, (d.x0 - p.x0) / (p.x1 - p.x0))) * 2 * Math.PI,
		x1: Math.max(0, Math.min(1, (d.x1 - p.x0) / (p.x1 - p.x0))) * 2 * Math.PI,
		y0: Math.max(0, d.y0 - p.depth),
		y1: Math.max(0, d.y1 - p.depth)
		});
		
		const t = gH.transition().duration(750);
		
		// Transition the data on all arcs, even the ones that aren’t visible,
		// so that if this transition is interrupted, entering arcs will start
		// the next transition from the desired position.
		pathH.transition(t)
			.tween("data", d => {
			const i = d3.interpolate(d.current, d.target);
			return t => d.current = i(t);
			})
		.filter(function(d) {
			return +this.getAttribute("fill-opacity") || arcVisibleH(d.target);
		})
			.attr("fill-opacity", d => {
				let fill = '0';
				if(arcVisibleH(d.target)){
					switch(d.depth){ 
						case 1:
							fill = 0.8;
							break;
						case 2:	
							fill = 0.6;
							break;
						case 3:
							fill = 0.4;
							break;
					}
				}
				
				return fill;
			})
			.attrTween("d", d => () => arcH(d.current));
		
		labelH.filter(function(d) {
			return +this.getAttribute("fill-opacity") || labelVisibleH(d.target);
		}).transition(t)
			.attr("fill-opacity", d => +labelVisibleH(d.target))
			.attrTween("transform", d => () => labelTransformH(d.current));
	
		if(p.data.key == "root"){
			buildDisease(data);
			buildPopu(data);
			labelHC.select(".keyword")
			.text("HLA");
			labelHC.select(".keyparent")
			.text("genes");
			labelHC.select(".keycounts")
			.text("("+rootH.value+")");
			
			studyResult(data);
		}else{
			buildDisease(data,p.data.key,p.depth);
			buildPopu(data,p.data.key,p.depth);
			labelHC.select(".keyword")
			.text(p.data.key);
			labelHC.select(".keyparent")
			.text(p.parent.data.key == "root" ? "HLA" : p.parent.data.key);
			labelHC.select(".keycounts")
			.text("("+p.value+")");
			
			studyResult(data,p.data.key,p.depth);
		}
		
	}
}

function buildDisease(datam,filter = "",fdepth = ""){
	let r = { key: "root", values: [] };
	
	if(filter !== ""){
	switch(fdepth){
		case 1:
			datam = datam.filter(d=>(d.group.slice(0,5) == filter.slice(0,5)));
			break;
		case 2:
			datam = datam.filter(d=>(d.group == filter));
			break;
	}}
	else{
		filter = "HLA";
	}
	
	r.values = d3.nest()
				.key(d => d.T0).sortKeys(d3.ascending)
				.key(d => d.T1).sortKeys(d3.ascending)
				.key(d => d.T2).sortKeys(d3.ascending)
				.key(d => d.T3).sortKeys(d3.ascending)
				.key(d => d.T4).sortKeys(d3.ascending)
				.key(d => d.T5).sortKeys(d3.ascending)
				.key(d => d.T6).sortKeys(d3.ascending)
				.key(d => d.T7).sortKeys(d3.ascending)
				.key(d => d.T8).sortKeys(d3.ascending)
				.key(d => d.T9).sortKeys(d3.ascending)
				.rollup(l =>l.length)
				.entries(datam);
	
	let rootD = d3.hierarchy(r, d => d.values)
			.sum(function(d) { return d.value; })
			.sort(function(a, b) { return b.value - a.value; });
	
	let widthD = window.innerWidth * 0.5;
	let heightD = widthD * 0.75;
	let radiusD = Math.min(widthD, heightD) / 2;  
	let colorD = d3.scaleOrdinal(d3.schemeCategory10); 

	d3.partition()
		.size([2 * Math.PI, radiusD*radiusD])
		(rootD);
		
	let arcD = d3.arc() 
		.startAngle(d => d.x0)
		.endAngle(d => d.x1)
		.padAngle(1 / radiusD)
		.padRadius(radiusD)
		.innerRadius(d => Math.sqrt(d.y0))
		.outerRadius(d => Math.sqrt(d.y1) - 1);	
	
	/*
	let mousearcD = d3.arc()
		.startAngle(d => d.x0)
		.endAngle(d => d.x1)
		.innerRadius(d => Math.sqrt(d.y0))
		.outerRadius(radiusD);	
	 */
	
	d3.select('div.visual2 > svg').remove();
	
	let svgD = d3.select('div.visual2')
		.append('svg')
		.attr('width' , widthD )
		.attr('height' , heightD )
		.attr("viewBox", [-widthD / 2, -heightD / 2, widthD, heightD]);	

	let pathD = svgD.append("g")
		.selectAll('g')
		.data(rootD.descendants()
				.filter(d => {
					// Don't draw the root node, and for efficiency, filter out nodes that would be too small to see
					return d.depth && d.x1 - d.x0 > 0.01 && d.data.key !== "NA";
				})
		)
		.enter()
		.append('g')
		.attr('class','node')
		.append('path')
		//.attr('display',d => d.depth ? null : 'none')
		.style('stroke',"white")
		.style('stroke-opacity',0.3)
		.style('fill',d =>{ while (d.depth >1) d = d.parent; return colorD(d.data.key);})
		.attr('fill-opacity',d => d3.scalePow().exponent(0.5).domain([1,10]).range([0.3,1.0])(d.depth))
		//.style('fill-opacity',d => d3.scalePow().exponent(0.5).domain([1,10]).range([0.3,1.0])(d.depth))
		.attr('d',arcD);
	
	let labelD = svgD
				.append("text")
				.attr("text-anchor", "middle")
				.attr("fill", "#444")
				.style("visibility", "visible");
		
	labelD.append("tspan")
		.attr("class", "keyword")
		.attr("x", 0)
		.attr("y", 0)
		.attr("dy", "-0.1em")
		.attr("font-size", "1.2em")
		.text("Diseases");
	
	
	labelD.append("tspan")
		.attr("class", "keydetail")
		.attr("x", 0)
		.attr("y", 0)
		.attr("dy", "1.75em")
		.attr("font-size", "1em")
		.text(rootD.value + " - " + filter);

	//Highlight on mouseOver
	svgD.append("g")
	.selectAll("path")
	.data(rootD.descendants()
			.filter(d => {
				// Don't draw the root node, and for efficiency, filter out nodes that would be too small to see
				return d.depth && d.x1 - d.x0 > 0.01 && d.data.key !== "NA";
			})
	)
	.join("path")
	.attr('class','nodec')
	.attr('d',arcD)
	//.attr("d", mousearcD)
	.attr("fill", "none")
	.style("cursor", "pointer")
	.attr("pointer-events", "all")
	.on("mouseleave", () => {
			//pathD.attr("fill-opacity", 1);
			pathD.attr('fill-opacity',d => d3.scalePow().exponent(0.5).domain([1,10]).range([0.6,1.0])(d.depth));
			labelD.select(".keyword")
				.text("Diseases");
			labelD.select(".keydetail")
				.text(rootD.value + " - " + filter);
			//label.style("visibility", "hidden");
			// Update the value of this view
			//element.value = { sequence: [], percentage: 0.0 };
			//element.dispatchEvent(new CustomEvent("input"));
	})
	.on("mouseenter", d => {
						// Get the ancestors of the current segment, minus the root
						let sequence = d.ancestors().reverse().slice(1);
						// Highlight the ancestors
						pathD.attr("fill-opacity", node =>
									sequence.indexOf(node) >= 0 ? 0.8 : 0.3
						);
						let percentage = ((100 * d.value) / rootD.value).toPrecision(3);
						let keyNode = percentage + "% - "+d.value+( (d.parent && d.parent.data.key !== "root") ? "/ Belongs to : " +d.parent.data.key : "");
						//label.style("visibility", null)
						labelD.select(".keyword")
						.text(d.data.key);
						labelD.select(".keydetail")
						.text(keyNode);
						// Update the value of this view with the currently hovered sequence and percentage
						//element.value = { sequence, percentage };
						//element.dispatchEvent(new CustomEvent("input"));
	});
	
}

function buildPopu(datam,filter = "",fdepth = ""){
	
	datam = datam.filter(d=> d.population_norp != "NA");
	
	let r = { key: "root", values: [] };
	
	if(filter !== ""){
	switch(fdepth){
		case 1:
			datam = datam.filter(d=>(d.group.slice(0,5) == filter.slice(0,5)));
			break;
		case 2:
			datam = datam.filter(d=>(d.group == filter));
			break;
	}}
	else{
		filter = "HLA";
	}
	
	r.values = d3.nest()
				.key(d => d.population_norp).sortKeys(d3.ascending)
				.entries(datam);
	
	let rootP = d3.hierarchy(r, d => d.values)
			.sum(function(d) { return d.value; })
			.sort();
	
	let widthP = window.innerWidth * 0.5;
	let heightP = widthP * 0.5;
	let radiusP = Math.min(widthP, heightP) / 2;  
	//let colorP = d3.scaleOrdinal(d3.schemeSet3); 
	let colorP = d3.scaleOrdinal(d3.schemeSet2); 
	
	d3.pack()
		.size([widthP, heightP])
		.padding(3)
		(rootP);
	
	d3.select('div.visual3 > svg').remove();
	
	let svgP = d3.select('div.visual3')
			.append('svg')
			.attr('width' , widthP )
			.attr('height' , heightP )
			.style("margin", "0 -14px")
			//.style("cursor", "pointer")
			.attr("viewBox", [-widthP / 2, -heightP / 2, widthP, heightP]);	
	
	let node = svgP.append("g")
		.selectAll("circle")
		.data(rootP.descendants().slice(1).filter(d=>d.height>0))
		.join("circle")
		.attr("fill", d => d.children ? colorP(d.data.key) : colorP(d.parent.data.key))
		//.attr("fill-opacity", 0.6);
		//.attr('fill-opacity',d => d3.scalePow().exponent(0.1).domain([1,5]).range([0.5,0.8])(d.value));
		.style("cursor", "pointer")
		.attr("pointer-events", "all")
		.on("mouseenter",menter)
		.on("mouseleave",mexit);
	
	let labelP = svgP.append("g")
		.style("font", "12px sans-serif")
		.attr("pointer-events", "none")
		.attr("text-anchor", "middle")
		.attr("fill", "#444")
		.selectAll("text")
		.data(rootP.descendants().slice(1).filter(d=>d.height>0))
		.join("text")
		.style("fill-opacity", d => d.parent === rootP ? 1 : 0)
		.style("display", d => d.parent === rootP ? "inline" : "none")
		.text(d => {
			if(d.r >15){
				//let percentage = ((100 * d.value) / rootP.value).toPrecision(3);
				//let keyText = d.data.key + " ("+percentage + ")";
				return d.data.key ;
				//return d.data.key;
			}
			});
	
	let labelPP = svgP
		.append("text")
		.attr("text-anchor", "left")
		.attr("fill", "#444")
		.style("visibility", "visible")
		.attr("class", "keypop")
		.attr("x", widthP*0.1)
		.attr("y", -heightP*0.45)
		.attr("font-size", "1.2em")
		.text(rootP.value + " - Population for "+ filter);
	
	let lineP = svgP.append("line")
		.attr("stroke","#888")
		.attr("stroke-width","2px")
		.attr("x1",widthP*0.05)
		.attr("y1",-heightP*0.46)
		.attr("x2",widthP*0.09)
		.attr("y2",-heightP*0.46)
		.attr("opacity",0);
	
	
	let linePP = svgP
		.append("line")
		.attr("stroke","#888")
		.attr("stroke-width","2px")
		.attr("x1",widthP*0.05)
		.attr("y1",-heightP*0.46)
		.attr("x2",0)
		.attr("y2",0)
		.attr("opacity",0);
		
	zoomTo([rootP.x, rootP.y, rootP.r * 4]);
	
	function menter(d,i){
		labelPP.text(d.value + " - " + d.data.key + " - "+ filter);
		lineP.attr("opacity",1).attr("stroke",d.children ? colorP(d.data.key) : colorP(d.parent.data.key));
		
		linePP.attr("opacity",1)
		.attr("stroke",d.children ? colorP(d.data.key) : colorP(d.parent.data.key))
		.attr("x2",(d.x - rootP.x) * (widthP/(rootP.r * 4) ))
		.attr("y2",((d.y - rootP.y) * (widthP/(rootP.r * 4) )) - d.r*0.5);
		
	}
	function mexit(d,i){
		labelPP.text(rootP.value + " - Population for "+ filter);
		lineP.attr("opacity",0);
		linePP.attr("opacity",0);
	}
	
	
	function zoomTo(v) {
		const k = widthP / v[2];
	
		view = v;
	
		labelP.attr("transform", d => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k})`);
		node.attr("transform", d => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k})`);
		node.attr("r", d => d.r * k);
	}		
			
}

function studyResult(data,f = ""){
		
		let dat = data;
		
		let regex = 
		dat = dat.filter(d=> d.group.includes(f));
		if(f == ""){
			f = "HLA";
		}
		//dat = dat.filter(d=>(d.depth > 1));
		
		//if(dat.data.key === "root")
		//	dat.data.key = "HLA";
	
		let h = "<h6> Showing first 100 records for "+f+" : "+dat.length+" .</h6><a href='report.html' target='_blank'><small>Click Here for Full Report</small> </a>";
		
		h += '<table class="table table-striped" style="font-size: 12px;"><thead>\
				<tr>\
					<th scope="col" class="w-10">#</th>\
					<th scope="col" class="w-10">PMID</th>\
					<th scope="col" class="w-30">Keyword(grp)</th>\
					<th scope="col" class="w-20">Population(Continent)</th>\
					<th scope="col" class="w-30">Disease</th>\
				</tr>\
				</thead><tbody>';
		dat.forEach( (r,i)=>{
		if(i>=100)
			return;
		h +=  '<tr>\
					<td scope="row">'+ ++i +'</td>\
					<td scope="row">'+r.pmid+'</td>\
					<td scope="row">'+r.keyword+ " ("+r.group+")"+'</td>\
					<td scope="row">'+r.population_norp+ " ("+r.Continent+")"+'</td>\
					<td scope="row">'+r.diseases+removeNA(r.T0)+removeNA(r.T1)+removeNA(r.T2)+removeNA(r.T3)+removeNA(r.T4)+removeNA(r.T5)+removeNA(r.T6)+removeNA(r.T7)+removeNA(r.T8)+removeNA(r.T9)+'</td>\
				</tr>';
		});
		d3.select("#search-box").html(h);
		let e = document.getElementById("search-box");
		e.scrollTop = 0;
	}

function removeNA(s){
	if(s === "NA")
		return "";
	else
		return " > "+ s;
}