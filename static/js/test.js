function chart(id, geo, data) {
    console.log('chart()')
    console.log("id", id)
    console.log("geo", geo)
    console.log("data", data)

    let margin = { top: 40, right: 100, bottom: 50, left: 15 };
    let width = 500 - margin.left - margin.right;
    let height = 200 - margin.top - margin.bottom;
    let yearLineOffset = 20;

    let { incidents_total, coverage, population } = data.filter(d => d.year == year)[0];
    let incidents = incidents_total;
    data.sort((a, b) => a.year - b.year);
    let country = data[0].country

    function makeChart() {
        d3
            .select("body")
            .select("#tooltip-Container")
            .select("svg")
            .remove()

        console.log('makeChart()')
        var coords = path.centroid(geo);
        console.log('coords', coords)

        d3
            .select("body")
            .select("#tooltip-Container")
            .style("left", coords[0] + "px")
            .style("top", coords[1] + "px")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .style("opacity", 0)
            .style("display", "")
            .transition()
            .duration(800)
            .style("opacity", 1);

        tooltip = d3.select("#tooltip-Container")
            .append('svg')
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        // Scale the range of the data
        let scaleTime = d3
            .scaleTime()
            .domain(d3.extent(data, d => d.year))
            .range([0, width]);

        let scaleIncidents = d3
            .scaleLinear()
            .domain([0, d3.max(data, d => d.incidents_total)])
            .range([height, 0]);

        let scaleCoverage = d3
            .scaleLinear()
            .domain([0, d3.max(data, d => d.coverage)])
            .range([height, 0]);

        let scalePopulation = d3
            .scaleLinear()
            .domain([0, d3.max(data, d => d.population)])
            .range([height, 0]);

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
            .y0(d => height)
            .y1(d => scalePopulation(d.population));

        let lineIncidents = d3
            .line()
            .x(d => scaleTime(d.year))
            .y(d => scaleIncidents(d.incidents_total));

        let lineCoverage = d3
            .line()
            .x(d => scaleTime(d.year))
            .y(d => scaleCoverage(d.coverage));

        // Aesthetics
        let colorPop = "lightgrey";
        let colorCoverage = "lightblue";
        let colorIncidents = "purple";
        let colorYear = "grey";

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
            .attr("y1", height + yearLineOffset)
            .attr("x2", scaleTime(year))
            .attr("y2", d3.min([scaleCoverage(coverage), scaleIncidents(incidents)]));

        let coverageCircle = tooltip
            .append("circle")
            .attr("cx", scaleTime(year))
            .attr("cy", scaleCoverage(coverage))
            .attr("r", "6")
            .style("fill", colorCoverage);

        let incidentsCircle = tooltip
            .append("circle")
            .attr("cx", scaleTime(year))
            .attr("cy", scaleIncidents(incidents))
            .attr("r", "6")
            .style("fill", colorIncidents);

        let yearCircle = tooltip
            .append("circle")
            .attr("cx", scaleTime(year))
            .attr("cy", height + yearLineOffset)
            .attr("r", "6")
            .style("fill", colorYear);

        let yearAxis = tooltip
            .append("line")
            .style("stroke", colorYear)
            .attr("opacity", 1)
            .attr("x1", 0)
            .attr("y1", height + 20)
            .attr("x2", width)
            .attr("y2", height + 20);

        // Annotations
        let countryLabel = tooltip
            .append("text")
            .text(country.toUpperCase())
            .attr("x", width / 2)
            .attr("y", -10)
            .attr("class", "countryText");

        let yearLabel = tooltip
            .append("text")
            .text(year)
            .attr("x", scaleTime(year))
            .attr("y", height + 45)
            .attr("class", "yearText");

        // Coverage Text
        tooltip.append("text")
            .text(`${Math.round(coverage * 100) / 100}%`)
            .attr("x", width + 20)
            .attr("y", 0)
            .attr("fill", "steelblue");

        tooltip.append("text")
            .text("vaccine")
            .attr("x", width + 20)
            .attr("y", 12)
            .attr("fill", "steelblue");

        tooltip.append("text")
            .text("coverage")
            .attr("x", width + 20)
            .attr("y", 24)
            .attr("fill", "steelblue");

        // Incidents Text
        tooltip.append("text")
            .text(Math.round(incidents * 100) / 100)
            .attr("x", width + 20)
            .attr("y", scaleCoverage.range()[0] / 2 - 10)
            .attr("fill", colorIncidents);

        tooltip.append("text")
            .text("polio")
            .attr("x", width + 20)
            .attr("y", scaleCoverage.range()[0] / 2)
            .attr("fill", colorIncidents);

        tooltip.append("text")
            .text("cases")
            .attr("x", width + 20)
            .attr("y", scaleCoverage.range()[0] / 2 + 12)
            .attr("fill", colorIncidents);

        // Population Text
        tooltip.append("text")
            .text(nFormatter(population))
            .attr("x", width + 20)
            .attr("y", height - 10)
            .attr("fill", colorPop);

        tooltip.append("text")
            .text("population")
            .attr("x", width + 20)
            .attr("y", height)
            .attr("fill", colorPop);
    }

    return makeChart();
}