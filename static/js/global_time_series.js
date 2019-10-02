function global_time_series(divId, data) {
    console.log("global_time_series()");
    let margin = { top: 40, right: 40, bottom: 44, left: 40 };
    let globalTimeseriesWidth = document.getElementById(divId.replace("#", "")).offsetWidth - margin.left - margin.right;
    let globalTimeseriesHeight = 205 - margin.top - margin.bottom;
    let yearLineOffset = 15;
    let textOffset = 14;
    let manualOffset = 6;
    let circleRadius = 4;
    console.log("GLOBAL");
    console.log(divId);
    console.log(data);

    let { incidents, coverage, population, incidents_total } = data.filter(d => d.year == year)[0];
    data.sort((a, b) => a.year - b.year);

    function makeChart() {
        d3.select("body")
            .select(divId)
            .select("svg")
            .remove();

        let globalTimeseries = d3
            .select(divId)
            .style("opacity", 1)
            .append("svg")
            .attr("width", globalTimeseriesWidth + margin.left + margin.right)
            .attr("height", globalTimeseriesHeight + margin.top + margin.bottom)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
            .attr("id", "globalTimeseriesChart");

        // Scale the range of the data
        let scaleTime = d3
            .scaleTime()
            .domain(d3.extent(data, d => d.year))
            .range([0, globalTimeseriesWidth]);

        let scaleIncidents = d3
            .scaleLinear()
            .domain([0, d3.max(data, d => (!isNaN(d.incidents_total) ? d.incidents_total : 0))])
            .range([globalTimeseriesHeight, 0]);

        let scaleCoverage = d3
            .scaleLinear()
            .domain([0, 100]) //d3.max(data, d => d.coverage)])
            .range([globalTimeseriesHeight, 0]);

        let scalePopulation = d3
            .scaleLinear()
            .domain([0, d3.max(data, d => d.population)])
            .range([globalTimeseriesHeight, 0]);

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
            .y0(d => globalTimeseriesHeight)
            .y1(d => scalePopulation(d.population));

        let lineIncidents = d3
            .line()
            .defined(d => !isNaN(d.incidents_total))
            .x(d => scaleTime(d.year))
            .y(d => {
                if (scaleIncidents.domain()[1] == 0) return globalTimeseriesHeight;
                return scaleIncidents(d.incidents_total);
            });

        let lineCoverage = d3
            .line()
            .defined(d => !isNaN(d.coverage))
            .x(d => scaleTime(d.year))
            .y(d => scaleCoverage(d.coverage));

        var filteredDataIncidents = data.filter(lineIncidents.defined());
        var filteredDataCoverage = data.filter(lineCoverage.defined());

        // Aesthetics
        let colorPop = "#e2e2e2";
        let colorCoverage = "#3e90d0";
        let colorIncidents = "#be006b";
        let colorYear = "#c3c7cb";

        // Drawing
        let populationArea = globalTimeseries
            .append("path")
            .attr("d", areaPopulation(data))
            .attr("fill", colorPop);

        let coverageLineMissing = globalTimeseries
            .append("path")
            .attr("d", lineCoverage(data))
            .attr("class", "line dashed")
            .style("stroke", "red");

        let coverageLine = globalTimeseries
            .append("path")
            .attr("d", lineCoverage(filteredDataCoverage))
            .attr("class", "line")
            .style("stroke", colorCoverage);

        let incidentsLineMissing = globalTimeseries
            .append("path")
            .attr("d", lineIncidents(data.filter(lineIncidents.defined())))
            .attr("class", "line dashed")
            .style("stroke", colorIncidents);

        let incidentsLine = globalTimeseries
            .append("path")
            .attr("d", lineIncidents(data))
            .attr("class", "line incidents")
            .style("stroke", colorIncidents);

        let yearLine = globalTimeseries
            .append("line")
            .style("stroke", colorYear)
            .style("opacity", 1)
            .attr("x1", scaleTime(year))
            .attr("y1", globalTimeseriesHeight + yearLineOffset)
            .attr("x2", scaleTime(year))
            .attr("y2", d3.min([scaleCoverage(coverage), scaleIncidents(incidents_total)]));

        // Circles.
        if (!isNaN(coverage)) {
            let coverageCircle = globalTimeseries
                .append("circle")
                .attr("cx", scaleTime(year))
                .attr("cy", scaleCoverage(coverage))
                .attr("r", circleRadius)
                .style("fill", colorCoverage);
        }

        if (incidents_total != "null") {
            let incidentsCircle = globalTimeseries
                .append("circle")
                .attr("cx", scaleTime(year))
                .attr("cy", () => {
                    if (scaleIncidents.domain()[1] == 0) return globalTimeseriesHeight;
                    return scaleIncidents(incidents_total);
                })
                .attr("r", circleRadius)
                .style("fill", colorIncidents);
        }

        let yearCircle = globalTimeseries
            .append("circle")
            .attr("cx", scaleTime(year))
            .attr("cy", globalTimeseriesHeight + yearLineOffset)
            .attr("r", circleRadius)
            .style("fill", colorYear);

        // Bottom year axis.
        let yearAxis = globalTimeseries
            .append("line")
            .style("stroke", colorYear)
            .style("opacity", 1)
            .attr("x1", 0)
            .attr("y1", globalTimeseriesHeight + yearLineOffset)
            .attr("x2", globalTimeseriesWidth)
            .attr("y2", globalTimeseriesHeight + yearLineOffset);

        // Annotations;
        let countryLabel = globalTimeseries
            .append("text")
            .text("GLOBAL")
            .attr("x", globalTimeseriesWidth / 2)
            .attr("y", -20)
            .attr("class", "countryText");

        let yearLabel = globalTimeseries
            .append("text")
            .text(year)
            .attr("x", scaleTime(year))
            .attr("y", globalTimeseriesHeight + yearLineOffset + textOffset + 12)
            .attr("class", "yearText");

        // Coverage Text
        if (!isNaN(coverage)) {
            globalTimeseries
                .append("text")
                .text(`${Math.round(coverage * 100) / 100}%`)
                .attr("x", scaleTime(year))
                .attr("y", scaleCoverage(coverage) - 20)
                .style("fill", colorCoverage)
                .attr("class", "numberText");
        }

        // Incidents Text
        globalTimeseries
            .append("text")
            .text(incidents_total.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","))
            .attr("x", scaleTime(year))
            .attr("y", scaleIncidents(incidents_total) - 20)
            .style("fill", colorIncidents)
            .attr("class", "numberText");

        // Population Text
        // globalTimeseries
        //     .append("text")
        //     .text(nFormatter(population))
        //     .attr("x", globalTimeseriesWidth + 15)
        //     .attr("y", globalTimeseriesHeight - textOffset)
        //     .style("fill", "#6b747b")
        //     .attr("class", "numberText");

        // globalTimeseries
        //     .append("text")
        //     .text("population")
        //     .attr("x", globalTimeseriesWidth + 15)
        //     .attr("y", globalTimeseriesHeight)
        //     .style("fill", "#6b747b")
        //     .attr("class", "textText");
    }

    return makeChart();
}
