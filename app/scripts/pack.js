define(['jquery', 'InfoBox', 'politicians'], function ($, InfoBox, Politicians) {
    var WIDTH = HEIGHT = 700;
    var color = { 'PD-L' : 'orange', 'PSD' : 'red', 'PNL' : 'yellow', 'UDMR' : 'green' };
    var PackChart = function (data) {
      this.infobox = new InfoBox($('#infobox'), Handlebars.compile($("#infoboxTemplate").html()));

      var vis = initVis("#chart", WIDTH, HEIGHT);
      var pack = configurePack(WIDTH - 4, HEIGHT - 4);
      var node = configureNodes(vis, data, pack);


      node.append("title")
          .text(function(d) { 
            return d.name + (d.children ? "" : ": " + d3.format(",%")(d.attendance / 100)); 
          });

      // pass the context to the event handling functions
      var that = this;
      node.append("circle")
          .attr("r", function(d) { return d.r; })
          .style("fill", Politicians.getPrimaryColor)
          .style("stroke", Politicians.getSecondaryColor)
          .on("mouseover", function (d, i) { that.hilight(d, i, this); })
          .on("mouseout", function (d, i) { that.unhilight(d, i, this); });
    }

     var initVis = function (selector, width, height) {
        return d3.select(selector).append("svg")
            .attr("width", width)
            .attr("height", height)
            .attr("class", "pack")
            .append("g")
            .attr("transform", "translate(2, 2)");
    }

    var configurePack = function (width, height) {
        return d3.layout.pack()
            .size([width, height])
            .value(function(d) { return d.attendance; });
    }

    var configureNodes = function (vis, data, pack) {
        return vis.data([data]).selectAll("g.node")
            .data(pack.nodes)
            .enter().append("g")
            .attr("class", function(d) { return d.children ? "party" : "person"; })
            .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
    }

    PackChart.prototype.hilight = function (d, i, element) {
      // if it's a leaf node, also hilight the party and show
      // an infobox
      if (!d.children && d.group) {
        var personDatum = d, that = this;
        d3.selectAll('.party circle').each(function (d, i) {
          if (d.name === personDatum.group) {
            that.hilight(d, i, this);
          }
        });
        this.infobox.show(d);  
      }
      d3.select(element)
        .style("stroke-width", 2)
        .style("fill-opacity", 1)
        .style("stroke", Politicians.getTertiaryColor(d));
      
    }

    PackChart.prototype.unhilight = function (d, i, element) {
      d3.select(element)
          .style("fill-opacity", "")
          .style("stroke-width", 1);
      this.infobox.hide();
    }

    return PackChart;
});