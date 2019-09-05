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

Promise.all([d3.json("./static/data/world-50m.json")])
	.then(draw)
	.catch(e => console.log(e));

function draw(files) {
	console.log("draw");
	console.log("files", files);
	const usData = files[0];
	console.log("usData", usData);

	// countries = svg
	// 	.selectAll(".country")
	// 	.data(countries_geo)
	// 	.enter()
	// 	.append("path")
	// 	.attr("class", "country")
	// 	.attr("d", path)
	// 	.attr("opacity", 1)
	// 	.attr("fill", "lightgrey");
	svg.insert("path", ".graticule")
		.datum(topojson.feature(usData, usData.objects.land))
		.attr("class", "land")
		.attr("d", path);
}

console.log("finished");
