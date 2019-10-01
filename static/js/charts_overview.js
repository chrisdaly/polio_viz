const margin = {
    top: 10,
    right: 10,
    bottom: 20,
    left: 30
};
const width = 1600;
const height = 1200;
const files = ["./static/data/world-50m.json", "./static/data/records.json"];
let redundantCountries = [10, 304]; // Greenland, Antarctica
let datasets;
let countriesData;
let rawData;
let year;
let metricActive;
const colors = ["#d6abd9", "#ff3fab", "#be006b", "#8bbce3", "#882e94", "#67045e", "#3e90d0", "#3a2489", "#2b0055"];

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

    const ids = [...new Set(rawData.map(item => item.id))];
    console.log(ids);

    ids.forEach(id => time_series("#viz", rawData.filter(x => x.id == id), 2018));
}

function filterData(year, metrics) {
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

const getColor = countryMetrics => {
    if (Object.entries(countryMetrics).length === 0) return "#F0F0F0";
    let { coverage = 0, incidents = 0 } = countryMetrics;
    coverage = coverage != "null" ? coverage : null;
    incidents = incidents != "null" ? incidents : null;

    let coverageRank = coverageScale(coverage);
    let incidentsRank = incidentsScale(incidents);
    let rank = coverageRank * n + incidentsRank;
    // console.log(`coverageRank: ${coverageRank}, incidentsRank: ${incidentsRank}, rank: ${coverageRank * n + incidentsRank}, color: ${colors[rank]}`);
    return colors[rank];
};

function getMetrics() {
    console.log(getMetrics);
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

function time_series(divId, data, year) {
    console.log("time_series");
    console.log(data);
    console.log(year);
    console.log(data.filter(d => d.year == year)[0]);
    let margin = { top: 40, right: 80, bottom: 44, left: 10 };
    let tooltipWidth = 310 - margin.left - margin.right;
    let tooltipHeight = 205 - margin.top - margin.bottom;
    let yearLineOffset = 15;
    let textOffset = 14;
    let manualOffset = 6;
    let circleRadius = 4;
    let { incidents, coverage, population, incidents_total } = data.filter(d => d.year == year)[0];
    data.sort((a, b) => a.year - b.year);
    let country = data[0].country_new;
    console.log("COUNTRY: ", country);
    console.log(data);

    function makeChart() {
        // d3.select("body")
        //     .select(divId)
        //     .select("svg")
        //     .remove();

        // var centroid = path.centroid(geo);
        // let left = centroid[0] + coords["left"] - 330 / 2;
        // let top = centroid[1] + coords["top"] - (210 + 40);

        d3.select("body")
            .select(divId)
            // .style("left", `${left}px`)
            // .style("top", `${top}px`)
            .attr("width", tooltipWidth + margin.left + margin.right)
            .attr("height", tooltipHeight + margin.top + margin.bottom)
            .style("opacity", 0)
            .style("display", "")
            .transition()
            .duration(800)
            .style("opacity", 1);

        tooltip = d3
            .select(divId)
            .append("svg")
            .attr("width", tooltipWidth + margin.left + margin.right)
            .attr("height", tooltipHeight + margin.top + margin.bottom)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
            .attr("id", "tooltipChart");

        // Scale the range of the data
        let scaleTime = d3
            .scaleTime()
            .domain(d3.extent(data, d => d.year))
            .range([0, tooltipWidth]);

        scaleIncidents = d3
            .scaleLinear()
            .domain([0, d3.max(data, d => (!isNaN(d.incidents_total) ? d.incidents_total : 0))])
            .range([tooltipHeight, 0]);

        let scaleCoverage = d3
            .scaleLinear()
            .domain([0, 100]) //d3.max(data, d => d.coverage)])
            .range([tooltipHeight, 0]);

        let scalePopulation = d3
            .scaleLinear()
            .domain([0, d3.max(data, d => d.population)])
            .range([tooltipHeight, 0]);

        // Axes.
        let xAxis = d3
            .axisBottom()
            .scale(scaleTime)
            .ticks(5);

        let yAxisLeft = d3
            .axisLeft()
            .scale(scaleIncidents)
            .ticks(5);

        let yAxisLeftPop = d3
            .axisLeft()
            .scale(scalePopulation)
            .ticks(5);

        let yAxisRight = d3
            .axisRight()
            .scale(scaleCoverage)
            .ticks(5);

        // Path generators.
        let areaPopulation = d3
            .area()
            .x(d => scaleTime(d.year))
            .y0(d => tooltipHeight)
            .y1(d => scalePopulation(d.population));

        lineIncidents = d3
            .line()
            .defined(d => !isNaN(d.incidents_total))
            .x(d => scaleTime(d.year))
            .y(d => {
                if (scaleIncidents.domain()[1] == 0) return tooltipHeight;
                return scaleIncidents(d.incidents_total);
            });

        lineCoverage = d3
            .line()
            .defined(d => !isNaN(d.coverage))
            .x(d => scaleTime(d.year))
            .y(d => scaleCoverage(d.coverage));

        var filteredDataIncidents = data.filter(lineIncidents.defined());
        var filteredDataCoverage = data.filter(lineCoverage.defined());

        // console.log("filteredDataIncidents", filteredDataIncidents);

        // Aesthetics
        let colorPop = "#e2e2e2";
        let colorCoverage = "#3e90d0";
        let colorIncidents = "#be006b";
        let colorYear = "#c3c7cb";

        // Drawing
        let populationArea = tooltip
            .append("path")
            .attr("d", areaPopulation(data))
            .attr("fill", colorPop);

        let coverageLineMissing = tooltip
            .append("path")
            .attr("d", lineCoverage(data))
            .attr("class", "line dashed")
            .style("stroke", "red");

        let coverageLine = tooltip
            .append("path")
            .attr("d", lineCoverage(filteredDataCoverage))
            .attr("class", "line")
            .style("stroke", colorCoverage);

        let incidentsLineMissing = tooltip
            .append("path")
            .attr("d", lineIncidents(data.filter(lineIncidents.defined())))
            .attr("class", "line dashed")
            .style("stroke", colorIncidents);

        let incidentsLine = tooltip
            .append("path")
            .attr("d", lineIncidents(data))
            .attr("class", "line incidents")
            .style("stroke", colorIncidents);

        let yearLine = tooltip
            .append("line")
            .style("stroke", colorYear)
            .attr("opacity", 1)
            .attr("x1", scaleTime(year))
            .attr("y1", tooltipHeight + yearLineOffset)
            .attr("x2", scaleTime(year))
            .attr("y2", d3.min([scaleCoverage(coverage), scaleIncidents(incidents_total)]));

        // Circles.
        if (coverage != "null") {
            let coverageCircle = tooltip
                .append("circle")
                .attr("cx", scaleTime(year))
                .attr("cy", scaleCoverage(coverage))
                .attr("r", circleRadius)
                .style("fill", colorCoverage);
        }

        if (incidents_total != "null") {
            let incidentsCircle = tooltip
                .append("circle")
                .attr("cx", scaleTime(year))
                .attr("cy", () => {
                    if (scaleIncidents.domain()[1] == 0) return tooltipHeight;
                    return scaleIncidents(incidents_total);
                })
                .attr("r", circleRadius)
                .style("fill", colorIncidents);
        }

        let yearCircle = tooltip
            .append("circle")
            .attr("cx", scaleTime(year))
            .attr("cy", tooltipHeight + yearLineOffset)
            .attr("r", circleRadius)
            .style("fill", colorYear);

        // Bottom year axis.
        let yearAxis = tooltip
            .append("line")
            .style("stroke", colorYear)
            .attr("opacity", 1)
            .attr("x1", 0)
            .attr("y1", tooltipHeight + yearLineOffset)
            .attr("x2", tooltipWidth)
            .attr("y2", tooltipHeight + yearLineOffset);

        // Annotations
        let countryLabel = tooltip
            .append("text")
            .text(country.toUpperCase())
            .attr("x", 310 / 2)
            .attr("y", -20)
            .attr("class", "countryText");

        let yearLabel = tooltip
            .append("text")
            .text(year)
            .attr("x", scaleTime(year))
            .attr("y", tooltipHeight + yearLineOffset + textOffset + 12)
            .attr("class", "yearText");

        // Coverage Text
        if (!isNaN(coverage)) {
            tooltip
                .append("text")
                .text(`${Math.round(coverage * 100) / 100}%`)
                .attr("x", tooltipWidth + 15)
                .attr("y", 0)
                .style("fill", colorCoverage)
                .attr("class", "numberText");

            tooltip
                .append("text")
                .text("vaccine")
                .attr("x", tooltipWidth + 15)
                .attr("y", textOffset)
                .style("fill", colorCoverage)
                .attr("class", "textText");

            tooltip
                .append("text")
                .text("coverage")
                .attr("x", tooltipWidth + 15)
                .attr("y", textOffset * 2)
                .style("fill", colorCoverage)
                .attr("class", "textText");
        } else {
            tooltip
                .append("text")
                .text("No")
                .attr("x", tooltipWidth + 15)
                .attr("y", 0)
                .style("fill", colorCoverage)
                .attr("class", "numberText");

            tooltip
                .append("text")
                .text("data")
                .attr("x", tooltipWidth + 15)
                .attr("y", textOffset)
                .style("fill", colorCoverage)
                .attr("class", "textText");
        }

        // Incidents Text
        if (!isNaN(incidents_total)) {
            tooltip
                .append("text")
                .text(incidents_total.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","))
                .attr("x", tooltipWidth + 15)
                .attr("y", () => {
                    let mid = scaleCoverage.range()[0] / 2;
                    return mid - textOffset + manualOffset;
                })
                .style("fill", colorIncidents)
                .attr("class", "numberText");

            tooltip
                .append("text")
                .text("polio")
                .attr("x", tooltipWidth + 15)
                .attr("y", () => {
                    let mid = scaleCoverage.range()[0] / 2;
                    return mid + manualOffset;
                })
                .style("fill", colorIncidents)
                .attr("class", "textText");

            tooltip
                .append("text")
                .text(incidents_total == 1 ? "case" : "cases")
                .attr("x", tooltipWidth + 15)
                .attr("y", () => {
                    let mid = scaleCoverage.range()[0] / 2;
                    return mid + textOffset + manualOffset;
                })
                .style("fill", colorIncidents)
                .attr("class", "textText");
        } else {
            tooltip
                .append("text")
                .text("No")
                .attr("x", tooltipWidth + 15)
                .attr("y", () => {
                    let mid = scaleCoverage.range()[0] / 2;
                    return mid - textOffset + manualOffset;
                })
                .style("fill", colorIncidents)
                .attr("class", "numberText");

            tooltip
                .append("text")
                .text("data")
                .attr("x", tooltipWidth + 15)
                .attr("y", () => {
                    let mid = scaleCoverage.range()[0] / 2;
                    return mid + manualOffset;
                })
                .style("fill", colorIncidents)
                .attr("class", "textText");
        }

        // Population Text
        if (!isNaN(population)) {
            tooltip
                .append("text")
                .text(nFormatter(population))
                .attr("x", tooltipWidth + 15)
                .attr("y", tooltipHeight - textOffset)
                .style("fill", "#6b747b")
                .attr("class", "numberText");

            tooltip
                .append("text")
                .text("population")
                .attr("x", tooltipWidth + 15)
                .attr("y", tooltipHeight)
                .style("fill", "#6b747b")
                .attr("class", "textText");
        } else {
            tooltip
                .append("text")
                .text("No")
                .attr("x", tooltipWidth + 15)
                .attr("y", tooltipHeight - textOffset)
                .style("fill", "#6b747b")
                .attr("class", "numberText");

            tooltip
                .append("text")
                .text("data")
                .attr("x", tooltipWidth + 15)
                .attr("y", tooltipHeight)
                .style("fill", "#6b747b")
                .attr("class", "textText");
        }
    }

    return makeChart();
}
