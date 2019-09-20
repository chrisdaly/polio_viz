var margin = { top: 30, right: 40, bottom: 30, left: 50 },
    width = 600 - margin.left - margin.right,
    height = 270 - margin.top - margin.bottom;

var parseTime = d3.timeParse("%Y");
var x = d3.scaleTime().range([0, width]);
var y0 = d3.scaleLinear().range([height, 0]);
var y1 = d3.scaleLinear().range([height, 0]);
var year = 1999;
var coverageMax;
var incidentsMax;

var xAxis = d3
    .axisBottom()
    .scale(x)
    .ticks(5);

var yAxisLeft = d3
    .axisLeft()
    .scale(y0)
    .ticks(5);

var yAxisRight = d3
    .axisRight()
    .scale(y1)
    .ticks(5);

var valueline = d3
    .line()
    .x(d => x(d.year))
    .y(d => y0(d.incidents));

var valueline2 = d3
    .line()
    .x(d => x(d.year))
    .y(d => y1(d.coverage));

var svg = d3
    .select("body")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

data = [
    {
        key: "1980",
        value: [1.1317171717171712, 49.464646464646464]
    },
    {
        key: "1981",
        value: [0.7818750000000002, 52.8125]
    },
    {
        key: "1982",
        value: [0.8540833333333337, 56.30833333333333]
    },
    {
        key: "1984",
        value: [0.768, 60.9]
    },
    {
        key: "1985",
        value: [0.628768115942029, 62.710144927536234]
    },
    {
        key: "1986",
        value: [0.7852980132450333, 66.43708609271523]
    },
    {
        key: "1987",
        value: [0.44779874213836474, 68.32075471698113]
    },
    {
        key: "1988",
        value: [0.36579268292682937, 71.3780487804878]
    },
    {
        key: "1989",
        value: [0.267625, 74.78125]
    },
    {
        key: "1990",
        value: [0.16843930635838156, 80.32369942196532]
    },
    {
        key: "1991",
        value: [0.1449425287356322, 79.39080459770115]
    },
    {
        key: "1993",
        value: [0.12676136363636362, 79.30681818181819]
    },
    {
        key: "1994",
        value: [0.1109941520467836, 80.06432748538012]
    },
    {
        key: "1996",
        value: [0.09262569832402234, 83.03351955307262]
    },
    {
        key: "1997",
        value: [0.06112299465240643, 81.70588235294117]
    },
    {
        key: "1998",
        value: [0.03593023255813954, 82.18023255813954]
    },
    {
        key: "1999",
        value: [0.10597701149425284, 81.21264367816092]
    },
    {
        key: "2000",
        value: [0.12139664804469276, 82.36312849162012]
    },
    {
        key: "2001",
        value: [0.0027374301675977654, 82.33519553072625]
    },
    {
        key: "2002",
        value: [0.001978021978021978, 84.43956043956044]
    },
    {
        key: "2003",
        value: [0.005274725274725276, 85.75274725274726]
    },
    {
        key: "2004",
        value: [0.015430107526881719, 85.69354838709677]
    },
    {
        key: "2005",
        value: [0.028306878306878305, 87.35978835978835]
    },
    {
        key: "2006",
        value: [0.013089005235602096, 89.16230366492147]
    },
    {
        key: "2007",
        value: [0.00461139896373057, 89.15544041450777]
    },
    {
        key: "2008",
        value: [0.00946808510638298, 89.84574468085107]
    },
    {
        key: "2009",
        value: [0.020317460317460314, 89.47089947089947]
    },
    {
        key: "2010",
        value: [0.09425531914893616, 90]
    },
    {
        key: "2011",
        value: [0.012010582010582012, 90.55555555555556]
    },
    {
        key: "2012",
        value: [0.0024083769633507857, 91.05235602094241]
    },
    {
        key: "2013",
        value: [0.010264550264550264, 90.25396825396825]
    },
    {
        key: "2014",
        value: [0.00436842105263158, 89.91578947368421]
    },
    {
        key: "2015",
        value: [0.0016230366492146595, 89.93193717277487]
    },
    {
        key: "2016",
        value: [0.00046632124352331605, 89.55958549222798]
    },
    {
        key: "2017",
        value: [0.002421052631578947, 89.42631578947369]
    },
    {
        key: "2018",
        value: [0.0024598930481283423, 89.4812834224599]
    },
    {
        key: "1983",
        value: [0.43111111111111106, 59.92063492063492]
    },
    {
        key: "1992",
        value: [0.10738372093023255, 79.3313953488372]
    },
    {
        key: "1995",
        value: [0.09081521739130431, 82.27173913043478]
    }
];

data.sort((a, b) => a.key - b.key);
data.forEach(function(d) {
    d.year = parseTime(d.key);
    d.incidents = +d.value[1];
    d.coverage = +d.value[0];
});
console.log(data);

// Scale the range of the data
x.domain(d3.extent(data, d => d.year));
y0.domain(d3.extent(data, d => d.incidents));
y1.domain(d3.extent(data, d => d.coverage));

svg.append("path").attr("d", valueline(data));

svg.append("path")
    .style("stroke", "red")
    .attr("d", valueline2(data));

svg.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + height + ")")
    .call(xAxis);

svg.append("g")
    .attr("class", "y axis")
    .style("fill", "steelblue")
    .call(yAxisLeft);

svg.append("g")
    .attr("class", "y axis")
    .attr("transform", "translate(" + width + " ,0)")
    .style("fill", "red")
    .call(yAxisRight);

svg.append("line")
    .style("stroke", "lightgrey")
    .attr("x1", x(parseTime(year)))
    .attr("y1", y1(d3.min(data, d => d.coverage)))
    .attr("x2", x(parseTime(year)))
    .attr("y2", y1(d3.max(data, d => d.coverage)));
