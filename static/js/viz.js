const margin = { top: 10, right: 10, bottom: 10, left: 10 };
const width = 1400
const height = 900
const graticule = d3.geoGraticule();
const formatDateIntoYear = d3.timeFormat("%Y");
const formatDate = d3.timeFormat("%b %Y");
const parseDate = d3.timeParse("%m/%d/%y");
const startDate = 1988;
const endDate = 2019;
const range = (start, end) => Array.from({ length: (end - start) }, (v, k) => k + start);
console.log(range(startDate, endDate))

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
Promise.all(files.map(f => d3.json(f))).then(init) //draw(data, 1998));

function init(data) {
    console.log('init')
    metric = "none"
    let year = "1998"
    draw(data, year, metric)
    playButton
        .on("click", function() {
            var button = d3.select(this);
            if (button.text() == "Pause") {
                moving = false;
                clearInterval(timer);
                // timer = 0;
                button.text("Play");
            } else {
                moving = true;
                timer = setInterval(step, 100, data);
                button.text("Pause");
            }
            console.log("Slider moving: " + moving);
        })
}

function draw(data, year, metric) {
    d3.selectAll(".country").remove()
    console.log("DRAW", data, year, metric)
    let coverageStatus;
    let incidentsStatus;
    // let metric = "none"
    const countriesData = data[0];
    const metricsData = data[1][year];
    // console.log("metricsData", metricsData);
    // console.log("countriesData", countriesData);
    const colors = ["#e8e8e8", "#e4acac", "#c85a5a", "#b0d5df", "#ad9ea5", "#985356", "#64acbe", "#627f8c", "#574249"]
    const n = Math.floor(Math.sqrt(colors.length))
    const x = d3.scaleQuantize([10, 70, 100], d3.range(n))
    const y = d3.scaleQuantize([0, .001, .1], d3.range(3))
    // const x = d3.scaleQuantile(Array.from(Object.values(metricsData), d => d['coverage']), d3.range(n))
    // const y = d3.scaleQuantize(Array.from(Object.values(metricsData), d => d['incidents']), d3.range(n))

    const getColor = (data, metric) => {
        if (data == null) return "lightgrey"
        const { coverage, incidents_normalized } = data
        const incidents = incidents_normalized
        // console.log("\n", "incidents:", incidents, "coverage:", coverage)
        let x_pos;
        let y_pos;

        if (metric == "incidents") {
            x_pos = 0
            y_pos = y(incidents)
        } else if (metric == "coverage") {
            x_pos = x(coverage)
            y_pos = 0
        } else if (metric == "both") {
            x_pos = x(coverage)
            y_pos = y(incidents)
        } else {
            x_pos = 0
            y_pos = 0
        }

        let pos = x_pos * n + y_pos
        // console.log(x_pos, y_pos, pos)
        return colors[pos]
    }

    countries = svg
        .selectAll(".country")
        .data(topojson.feature(countriesData, countriesData.objects.countries).features)
        .enter()
        .append("path")
        .attr("class", "country")
        .attr("d", path)
        .attr("opacity", 1)
        .attr("fill", d => getColor(metricsData[d.id], metric))
        .on("click", d => {
            console.log("/nMETRIC", metric)
            console.log(getColor(metricsData[d.id]))
            console.table({ ...metricsData[d.id], "id": d.id })
        })

    checkMetric = () => {
        var incidentsStatus = document.querySelector('input[id="incidents"]').checked;
        var coverageStatus = document.querySelector('input[id="coverage"]').checked;
        console.log("checkMetric")
        if (incidentsStatus == true) {
            if (coverageStatus == true) {
                metric = "both"
            } else {
                metric = "incidents"
            }
        } else if (coverageStatus == true) {
            metric = "coverage"
        } else {
            metric = "none"
        }
        console.log('incidentsStatus', incidentsStatus, 'coverageStatus', coverageStatus, 'metric', metric)
        draw(data, year, metric)
    }

    document.querySelector('input[id="incidents"]').onchange = function() {
        checkMetric();
    }

    document.querySelector('input[id="coverage"]').onchange = function() {
        checkMetric();
    }
};

// Slider
var moving = false;
var currentValue = 0;
var targetValue = width;

var playButton = d3.select("#play-button");

var sliderScale = d3.scaleLinear()
    .domain(range(startDate, endDate))
    .range([0, targetValue])
    .clamp(true);

var slider = svg.append("g")
    .attr("class", "slider")
    .attr("transform", "translate(" + margin.left + "," + height / 5 + ")");

slider.append("line")
    .attr("class", "track")
    .attr("x1", sliderScale.range()[0])
    .attr("x2", sliderScale.range()[1])
    .select(function() { return this.parentNode.appendChild(this.cloneNode(true)); })
    .attr("class", "track-inset")
    .select(function() { return this.parentNode.appendChild(this.cloneNode(true)); })
    .attr("class", "track-overlay")
    .call(d3.drag()
        .on("start.interrupt", function() { slider.interrupt(); })
        .on("start drag", function() {
            currentValue = d3.event.x;
            console.log(sliderScale.invert(currentValue))
            draw(data, sliderScale.invert(currentValue), metric);
        })
    );

slider.insert("g", ".track-overlay")
    .attr("class", "ticks")
    .attr("transform", "translate(0," + 18 + ")")
    .selectAll("text")
    .data(sliderScale.ticks(31))
    .enter()
    .append("text")
    .attr("x", sliderScale)
    .attr("y", 10)
    .attr("text-anchor", "middle")
    .text(function(d) {
        console.log("d", d)
        return d;
    });

var handle = slider.insert("circle", ".track-overlay")
    .attr("class", "handle")
    .attr("r", 9);

var label = slider.append("text")
    .attr("class", "label")
    .attr("text-anchor", "middle")
    .text(formatDate(startDate))
    .attr("transform", "translate(0," + (-25) + ")")


function step(data, metric) {
    console.log(sliderScale.invert(currentValue))
    draw(data, sliderScale.invert(currentValue), metric);
    currentValue = currentValue + (targetValue / 151);
    if (currentValue > targetValue) {
        moving = false;
        currentValue = 0;
        clearInterval(timer);
        // timer = 0;
        playButton.text("Play");
        console.log("Slider moving: " + moving);
    }
}