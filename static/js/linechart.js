function chart(id, geo, data, coords) {
    // console.log('chart()')
    // console.log("id", id)
    // console.log("geo", geo)
    console.log("\ndata")
    console.log(data)
    // console.table(data)
    // console.log("incidents": data.map(d => d.incidents))

    let margin = { top: 55, right: 130, bottom: 55, left: 20 };
    let tooltipWidth = 310 - margin.left - margin.right;
    let tooltipHeight = 210 - margin.top - margin.bottom;
    let yearLineOffset = 20;

    let { incidents, coverage, population, incidents_total } = data.filter(d => d.year == year)[0];
    data.sort((a, b) => a.year - b.year);
    let country = data[0].country_new

    function hideTooltip() {
        d3.select("body")
            .select("#tooltip-Container")
            .transition()
            .duration(500)
            .style("opacity", 0)
            .transition()
            .duration(1)
            .style("display", "None");
    }

    function makeChart() {
        d3
            .select("body")
            .select("#tooltip-Container")
            .select("svg")
            .remove()

        var centroid = path.centroid(geo);
        let left = centroid[0] + coords['left'] - (310 / 2);
        let top = centroid[1] + coords['top'] - (210 + 30);
        console.log('centroid', centroid)
        console.log("coords", coords)
        console.log("left:", left, "top:", top)

        d3
            .select("body")
            .select("#tooltip-Container")
            .style("left", `${left}px`)
            .style("top", `${top}px`)
            .attr("width", tooltipWidth + margin.left + margin.right)
            .attr("height", tooltipHeight + margin.top + margin.bottom)
            .style("opacity", 0)
            .style("display", "")
            .transition()
            .duration(800)
            .style("opacity", 1);

        d3
            .select("body")
            .select("#tooltip-Container")
            // .on("mouseout", hideTooltip)
            .style("opacity", 0)
            .style("display", "")
            .transition()
            .duration(800)
            .style("opacity", 1);

        tooltip = d3.select("#tooltip-Container")
            .append('svg')
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
            .domain([0, d3.max(data, d => d.incidents)])
            .range([height, 0]);

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

        let lineIncidents = d3
            .line()
            .x(d => scaleTime(d.year))
            .defined(function(d) { return d.incidents; })
            .y(d => scaleIncidents(d.incidents))

        let lineCoverage = d3
            .line()
            .x(d => scaleTime(d.year))
            .defined(function(d) { return d.coverage; })
            .y(d => scaleCoverage(d.coverage))

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

        let coverageLine = tooltip
            .append("path")
            .attr("d", lineCoverage(data))
            .attr("class", "line")
            .style("stroke", colorCoverage);

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
            .attr("y2", d3.min([scaleCoverage(coverage), scaleIncidents(incidents)]));

        // Circles.
        let coverageCircle = tooltip
            .append("circle")
            .attr("cx", scaleTime(year))
            .attr("cy", scaleCoverage(coverage))
            .attr("r", "5")
            .style("fill", colorCoverage);

        let incidentsCircle = tooltip
            .append("circle")
            .attr("cx", scaleTime(year))
            .attr("cy", () => {
                // console.log("incidents", incidents)
                // console.log("coverage", coverage)
                // console.log("scaleIncidents", scaleIncidents)
                // console.log(scaleIncidents(incidents))
                return scaleIncidents(incidents)
            })
            .attr("r", "5")
            .style("fill", colorIncidents);

        let yearCircle = tooltip
            .append("circle")
            .attr("cx", scaleTime(year))
            .attr("cy", tooltipHeight + yearLineOffset)
            .attr("r", "5")
            .style("fill", colorYear);

        // Bottom year axis.
        let yearAxis = tooltip
            .append("line")
            .style("stroke", colorYear)
            .attr("opacity", 1)
            .attr("x1", 0)
            .attr("y1", tooltipHeight + 20)
            .attr("x2", tooltipWidth)
            .attr("y2", tooltipHeight + 20);

        // Annotations
        let countryLabel = tooltip
            .append("text")
            .text(country.toUpperCase())
            .attr("x", tooltipWidth / 2)
            .attr("y", -30)
            .attr("class", "countryText");

        let yearLabel = tooltip
            .append("text")
            .text(year)
            .attr("x", scaleTime(year))
            .attr("y", tooltipHeight + 45)
            .attr("class", "yearText");

        // Coverage Text
        tooltip.append("text")
            .text(`${Math.round(coverage * 100) / 100}%`)
            .attr("x", tooltipWidth + 15)
            .attr("y", 0)
            .style("fill", colorCoverage)
            .attr("class", "numberText");

        tooltip.append("text")
            .text("vaccine coverage")
            .attr("x", tooltipWidth + 15)
            .attr("y", 14)
            .style("fill", colorCoverage)
            .attr("class", "textText");

        // Incidents Text
        tooltip.append("text")
            .text(Math.round(incidents_total * 100) / 100)
            .attr("x", tooltipWidth + 15)
            .attr("y", scaleCoverage.range()[0] / 2 - 6)
            .style("fill", colorIncidents)
            .attr("class", "numberText");

        tooltip.append("text")
            .text("polio cases")
            .attr("x", tooltipWidth + 15)
            .attr("y", scaleCoverage.range()[0] / 2 + 6)
            .style("fill", colorIncidents)
            .attr("class", "textText");

        // Population Text
        tooltip.append("text")
            .text(nFormatter(population))
            .attr("x", tooltipWidth + 15)
            .attr("y", tooltipHeight - 14)
            .style("fill", "#6b747b")
            .attr("class", "numberText");

        tooltip.append("text")
            .text("population")
            .attr("x", tooltipWidth + 15)
            .attr("y", tooltipHeight)
            .style("fill", "#6b747b")
            .attr("class", "textText");
    }

    return makeChart();
}