const margin = { top: 10, right: 10, bottom: 30, left: 30 };
const width = 1400
const height = 900
const range = (start, end) => Array.from({ length: (end - start) }, (v, k) => k + start);
const files = ["./static/data/world-50m.json", "./static/data/coverage_incidents_population_per_country_per_year.json"];
let datasets
let countriesData
let metricsData
let year = 1980;
const graticule = d3.geoGraticule();
const projection = d3
    .geoLarrivee()
    .scale(width / 3.5 / Math.PI)
    .rotate([-11, 0])
    .translate([width / 2, height / 2]);

const path = d3.geoPath().projection(projection);

const svg = d3
    .select("#viz")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .append("g")

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

Promise.all(files.map(f => d3.json(f))).then(init)

function init(datasets) {
    countriesData = datasets[0];
    metricsData = datasets[1];
    draw()
}

function draw() {
    countries = svg
        .selectAll(".country")
        .data(topojson.feature(countriesData, countriesData.objects.countries).features)
        .enter()
        .append("path")
        .attr("class", "country")
        .attr("d", path)
        .attr("opacity", 1)
        .attr("fill", "grey")
    // .on("click", d => console.table(datasets[1][starYear][d.id]))
}

function filterData(year, metrics) {
    let data = metricsData[year]
    let dataFinal = {}
    Object.keys(data).map(id => {
        if (data[id] != null) {
            dataFinal[id] = {}
            metrics.forEach(metric => {
                if (data[id][metric] != null) {
                    dataFinal[id][metric] = data[id][metric]
                }
            })
        }
    })
    return dataFinal
}

function paint(data) {
    const colors = ["#e8e8e8", "#e4acac", "#c85a5a", "#b0d5df", "#ad9ea5", "#985356", "#64acbe", "#627f8c", "#574249"]
    const n = Math.floor(Math.sqrt(colors.length))
    const x = d3.scaleQuantile([10, 40, 100], d3.range(n))
    const y = d3.scaleQuantile([0, .001, .1], d3.range(n))

    const getColor = data => {
        if (data == null) return "#DCDCDC"
        const { coverage = 0, incidents_normalized = 0 } = data;

        let x_pos = x(coverage)
        let y_pos = y(incidents_normalized)
        let pos = x_pos * n + y_pos
        return colors[pos]
    }

    d3.selectAll('.country').attr("fill", d => getColor(data[d.id])).on('click', d => console.table(metricsData[year][d.id]))

}

document.querySelector('input[id="incidents"]').onchange = function() {
    controlsUpdated()
}

document.querySelector('input[id="coverage"]').onchange = function() {
    controlsUpdated()
}

document.getElementById('mySlider').onchange = function() {
    controlsUpdated()
}

// Listen to the slider?
d3.select("#mySlider").on("change", function(d) {
    controlsUpdated()
    console.log("mySlider moved", this.value)
    year = this.value
    document.getElementById('year').innerHTML = year
    // updateChart(selectedValue)
})

function getMetrics() {
    let metrics = []
    if (document.querySelector('input[id="incidents"]').checked == true) {
        metrics.push("incidents_normalized")
    } else {
        metrics.filter(i => i !== "incidents_normalized")
    }
    if (document.querySelector('input[id="coverage"]').checked == true) {
        metrics.push("coverage")
    } else {
        metrics.filter(i => i !== "coverage")
    }
    return metrics
}

function controlsUpdated() {
    let metrics = getMetrics()
    let year = document.getElementById('mySlider').value
    let dataFiltered = filterData(year, metrics)
    paint(dataFiltered)}