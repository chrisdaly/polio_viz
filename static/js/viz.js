const margin = { top: 10, right: 10, bottom: 10, left: 10 };
const width = 1400
const height = 900
const graticule = d3.geoGraticule();

const projection = d3
    .geoTimes() //geoLarrivee, geoEckert1
    .scale(220) //width / 3.5 / Math.PI
    .rotate([-11, 0])
    .translate([width / 2, height / 2]);

const path = d3.geoPath().projection(projection);

const svg = d3
    .select("#viz")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .append("g")
// .attr("transform", `translate(${margin.left},${margin.top})`);

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


const files = ["./static/data/world-50m.json", "./static/data/coverage_incidents_population_per_country_per_year.json"];
Promise.all(files.map(f => d3.json(f))).then(draw);

function draw(data) {
    const countriesData = data[0];
    const metricsData = data[1];
    console.log("metricsData", metricsData);
    console.log("countriesData", countriesData);
    console.log(topojson.feature(countriesData, countriesData.objects.countries).features);

    const colors = ["#e8e8e8", "#e4acac", "#c85a5a", "#b0d5df", "#ad9ea5", "#985356", "#64acbe", "#627f8c", "#574249"]
    const n = Math.floor(Math.sqrt(colors.length))
    console.log("n", n)
    const x = d3.scaleQuantile(Array.from(Object.values(metricsData), d => d['coverage']), d3.range(n))
    const y = d3.scaleQuantile(Array.from(Object.values(metricsData), d => d['incidents']), d3.range(n))
    console.log("x", x)
    console.log("y", y)

    const getColor = (metrics) => {
        if (metrics == null) return "lightgrey"

        const { incidents, coverage } = metrics
        console.log("incidents:", incidents, y(incidents))
        console.log("coverage:", coverage, x(coverage))
        console.log(colors[y(incidents) + x(coverage) * n]);
        // return colors[x(coverage) * n];
        return colors[y(incidents) + x(coverage) * n];
    }

    countries = svg
        .selectAll(".country")
        .data(topojson.feature(countriesData, countriesData.objects.countries).features)
        .enter()
        .append("path")
        .attr("class", "country")
        .attr("d", path)
        .attr("opacity", 1)
        .attr("fill", d => getColor(metricsData[d.id]))
        .on("click", d => console.table({ ...metricsData[d.id], "id": d.id }))
}

console.log("finished");