function time_series(divId, geo, data, coords) {
    console.log("\ndata");
    console.log(data);

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

    function hideTooltip() {
        // d3.select("body")
        //     .select(divId)
        //     .transition()
        //     .duration(500)
        //     .style("opacity", 0)
        //     .transition()
        //     .duration(1)
        //     .style("display", "None");
    }

    function makeChart() {
        d3.select("body")
            .select(divId)
            .select("svg")
            .remove();

        var centroid = path.centroid(geo);
        let left = centroid[0] + coords["left"] - 330 / 2;
        let top = centroid[1] + coords["top"] - (210 + 40);

        d3.select("body")
            .select(divId)
            .style("left", `${left}px`)
            .style("top", `${top}px`)
            .attr("width", tooltipWidth + margin.left + margin.right)
            .attr("height", tooltipHeight + margin.top + margin.bottom)
            .style("opacity", 0)
            .style("display", "")
            .transition()
            .duration(800)
            .style("opacity", 1);

        d3.select("body")
            .select(divId)
            // .on("mouseout", hideTooltip)
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
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        // Scale the range of the data
        let scaleTime = d3
            .scaleTime()
            .domain(d3.extent(data, d => d.year))
            .range([0, tooltipWidth]);

        let scaleIncidents = d3
            .scaleLinear()
            .domain([0, d3.max(data, d => d.incidents_total)])
            .range([tooltipHeight, 0]);

        console.log("scaleIncidents", incidents_total);

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
                console.log(d.year, d.incidents_total);
                return scaleIncidents(d.incidents_total);
            });

        lineCoverage = d3
            .line()
            .defined(d => !isNaN(d.coverage))
            .x(d => scaleTime(d.year))
            .y(d => scaleCoverage(d.coverage));

        var filteredDataIncidents = data.filter(lineIncidents.defined());
        var filteredDataCoverage = data.filter(lineCoverage.defined());

        console.log("filteredDataIncidents", filteredDataIncidents);

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
            .attr("d", () => {
                console.log(data.filter(lineIncidents.defined()));
                lineIncidents(data.filter(lineIncidents.defined()));
            })
            .attr("class", "line dashed")
            .style("stroke", colorIncidents);

        let incidentsLine = tooltip
            .append("path")
            .attr("d", lineIncidents(data))
            .attr("class", "line")
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
        let coverageCircle = tooltip
            .append("circle")
            .attr("cx", scaleTime(year))
            .attr("cy", coverage ? scaleCoverage(coverage) : null)
            .attr("r", coverage ? circleRadius : null)
            .style("fill", colorCoverage);

        let incidentsCircle = tooltip
            .append("circle")
            .attr("cx", scaleTime(year))
            .attr("cy", scaleIncidents(incidents_total))
            .attr("r", incidents_total ? circleRadius : null) //Broken?
            .style("fill", colorIncidents);

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

        // Incidents Text
        tooltip
            .append("text")
            .text(Math.round(incidents_total * 100) / 100)
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
            .text("cases")
            .attr("x", tooltipWidth + 15)
            .attr("y", () => {
                let mid = scaleCoverage.range()[0] / 2;
                return mid + textOffset + manualOffset;
            })
            .style("fill", colorIncidents)
            .attr("class", "textText");

        // Population Text
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
    }

    return makeChart();
}
