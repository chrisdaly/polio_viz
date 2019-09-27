const margin = {
    top: 10,
    right: 10,
    bottom: 20,
    left: 30
};
const width = 1600;
const height = 1200;
const range = (start, end) => Array.from({
    length: end - start
}, (v, k) => k + start);
const files = ["./static/data/world-50m.json", "./static/data/records.json"];
let redundantCountries = [10, 304]; // Greenland, Antarctica
let datasets;
let countriesData;
let rawData;
let year;
let metricActive;
const colors = [
    "#d6abd9",
    "#ff3fab",
    "#be006b",
    "#8bbce3",
    "#882e94",
    "#67045e",
    "#3e90d0",
    "#3a2489",
    "#2b0055"
];

const n = Math.floor(Math.sqrt(colors.length));
const coverageScale = d3.scaleThreshold([50, 85, 100], d3.range(n));
const incidentsScale = d3.scaleThreshold([0.0001, .5, 1], d3.range(n));

const graticule = d3.geoGraticule();

const projection = d3
    .geoMercator()
    .scale(width / 3.5 / Math.PI)
    .rotate([-11, 0])
    .translate([width / 2, height / 2]);

const path = d3.geoPath().projection(projection);

const svg = d3
    .select("#viz")
    .append("svg")
    .attr("id", "mapSvg")
    .attr("width", width)
    .attr("height", height)
    .append("g");

Promise.all(files.map(f => d3.json(f))).then(init);

function init(datasets) {
    countriesData = datasets[0];
    countriesData.objects.countries.geometries = countriesData.objects.countries.geometries.filter(d => !redundantCountries.includes(d.id));
    rawData = datasets[1];
    metricsData = d3
        .nest()
        .key(d => d.year)
        .key(d => d.id)
        .object(rawData);

    console.log("countriesData", countriesData);
    console.log("rawData", rawData);
    console.log("datadatadata", metricsData);
    draw();
    // controlsUpdated('incidents')
}

function filterData(year, metrics) {
    console.log('filterData')
    console.log(year)
    console.log(metrics)
    let data = metricsData[year];
    let dataFinal = {};
    Object.keys(data).map(id => {
        if (data[id] != null) {
            dataFinal[id] = {};
            [metrics].forEach(metric => {
                if (data[id][0][metric] != null) {
                    dataFinal[id][metric] = data[id][0][metric];
                }
            });
        }
    });
    return dataFinal;
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
        .attr("fill", "#F0F0F0")
}

const getColor = countryMetrics => {
    if (Object.entries(countryMetrics).length === 0) return "#F0F0F0";
    const {
        coverage = 0, incidents = 0
    } = countryMetrics;
    console.log();

    let coverageRank = coverageScale(coverage);
    let incidentsRank = incidentsScale(incidents);
    let rank = coverageRank * n + incidentsRank;
    // console.log(`coverageRank: ${coverageRank}, incidentsRank: ${incidentsRank}, rank: ${coverageRank * n + incidentsRank}, color: ${colors[rank]}`);
    return colors[rank];
};

function paint(data) {
    console.log(data);
    // time_series("#global_time_series", d, rawData.filter(x => x.id == d.id), coords)


    d3.selectAll(".country")
        .on("mouseover", d => {
            if (metricsData[year][d.id] != undefined) {
                let coords = getCoords("mapSvg")
                time_series("#tooltip-Container", d, rawData.filter(x => x.id == d.id), coords)
            }
        })
        .on("mouseout", d => {
            d3
                .select("body")
                .select("#tooltip-Container")
                .transition(200)
                .style('opacity', 0)
        })
        .on("click", d => getColor(data[d.id]))
        .transition()
        .duration(1000)
        .attr("fill", d => {
            if (data[d.id] != null) {
                return getColor(data[d.id]);
            } else {
                return "#F0F0F0";
            }
        });
}

// d3.select("#buttonIncidents").on("click", controlsUpdated)
// d3.select("#buttonCoverage").on("click", controlsUpdated)
// document.getElementById("#buttonIncidents").onchange = function() {
//     console.log("#")
//     controlsUpdated('incidents');
// };

d3.select("#cases").on("click", function(d) {
    d3.select(this).classed("filter cases_active", true)
    d3.select("#coverage").attr("class", 'filter')
    metricActive = 'incidents'
    controlsUpdated();
});

d3.select("#coverage").on("click", function(d) {
    d3.select(this).classed("filter cover_active", true)
    d3.select("#cases").attr("class", 'filter')
    metricActive = 'coverage'
    controlsUpdated();
});

document.getElementById("mySlider").onchange = function() {
    controlsUpdated();
};

d3.select("#mySlider").on("input", function(d) {
    controlsUpdated();
    document.getElementById("year").innerHTML = this.value;
});

function getMetrics() {
    console.log(getMetrics)
    let metrics = [];
    if (document.querySelector('input[id="incidents"]').checked == true) {
        metrics.push("incidents");
    } else {
        metrics.filter(i => i !== "incidents");
    }
    if (document.querySelector('input[id="coverage"]').checked == true) {
        metrics.push("coverage");
    } else {
        metrics.filter(i => i !== "coverage");
    }
    return metrics;
}

function controlsUpdated(metric) {
    console.log('controlsUpdated')
    console.log(metric)
    // let metrics = getMetrics();
    year = document.getElementById("mySlider").value;
    console.log(year)
    let dataFiltered = filterData(year, metricActive);
    paint(dataFiltered);
}