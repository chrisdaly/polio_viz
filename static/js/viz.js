const margin = { top: 50, right: 20, bottom: 40, left: 60 };
const width = 960 - margin.left - margin.right;
const height = 500 - margin.top - margin.bottom;
const graticule = d3.geoGraticule();

const projection = d3
	.geoTimes() //geoLarrivee, geoEckert1
	.scale(125) //width / 3.5 / Math.PI
	.rotate([-11, 0])
	.translate([width / 2, height / 2]);

const path = d3.geoPath().projection(projection);

const svg = d3
	.select("#viz")
	.append("svg")
	.attr("width", width + margin.left + margin.right)
	.attr("height", height + margin.top + margin.bottom)
	.append("g")
	.attr("transform", `translate(${margin.left},${margin.top})`);

svg.append("path")
	.datum(graticule)
	.attr("class", "graticule")
	.attr("d", path);

svg.append("path")
	.datum({ type: "Sphere" })
	.attr("class", "sphere")
	.attr("d", path)
	.attr("fill", "#f1f1f1")
	.attr("stroke", "black")
	.attr("opacity", 0.3);

const files = ["./static/data/world-50m.json", "./static/data/incidence_data_with_iso.json"];
Promise.all(files.map(f => d3.json(f))).then(draw);

function draw(data) {
	console.log("draw");
	console.log("data", data);
	const usData = data[0];
	const polioData = data[1];
	console.log("usData", usData);
	console.log("polioData", polioData);
	console.log(topojson.feature(usData, usData.objects.countries).features);

	countries = svg
		.selectAll(".country")
		.data(topojson.feature(usData, usData.objects.countries).features)
		.enter()
		.append("path")
		.attr("class", "country")
		.attr("d", path)
		.attr("opacity", 1)
		.attr("fill", "lightgrey");
	// 	d => {
	// 		let id_ = ("0000" + d.id).substr(-3, 3);
	// 		console.log(id_);
	// 		console.log(d3.schemeCategory10[id_]);
	// 		return d3.schemeCategory10[id_];
	// 	}
	// );
}

console.log("finished");
