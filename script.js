var height =550;
var projection = d3.geo.albers()
    .scale(1000)

var path = d3.geo.path()
  .projection(projection);

var div = d3.select("#mapContainer").append("div")   
  .style("opacity", 0);

var svg = d3.select("#mapContainer").append("svg")
  .attr("id","map")
  .attr("width", "100%")
  .attr("height", height)
  .style("margin","10px auto");

queue()
  .defer(d3.json, "zips_us_topo.json")
  .defer(d3.csv,"data.csv")
  .defer(d3.csv,"Median_prediction.csv")
  .await(ready);

var color_domain = [ -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
var ext_color_domain = [ -2, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
var legend_labels = ["< -1%", "0% +", "1% +", "2% +", "3% +", "4% +", "5% +", "6% +", "7% +", "8% +", "9% +", "10% +"];             

var color = d3.scale.threshold()
  .domain(color_domain)
  .range(["pink", "#d0d6cd", "#bdc9be", "#aabdaf", "#97b0a0", "#84a491", "719782", "#5e8b73", "#4b7e64", "#387255", "#256546", "#125937"]);

var legend = svg.selectAll("g.legend")
  .data(ext_color_domain)
  .enter().append("g")
  .attr("class", "legend");

var ls_w = 20, ls_h = 20;

legend.append("rect")
  .attr("x", 20)
  .attr("y", function(d, i){ return height - (i*ls_h) - 2*ls_h;})
  .attr("width", ls_w)
  .attr("height", ls_h)
  .style("fill", function(d, i) { return color(d); })
  .style("opacity", 0.8);

legend.append("text")
  .attr("x", 50)
  .attr("y", function(d, i){ return height - (i*ls_h) - ls_h - 4;})
  .text(function(d, i){ return legend_labels[i]; });

var zipInfo = [];

function ready(error, zips_us_topo, data, Median_prediction) {
  var features = topojson.feature(zips_us_topo, zips_us_topo.objects.zip_codes_for_the_usa).features;
  var CRbyZip = {};

  data.forEach(function(d){
    CRbyZip[d.zipcode] = d.prediction;
  })
  
  Median_prediction.forEach(function(d){
    zipInfo[d.Zipcode] = new Array(
      d.MarketHealth,
      d.MoM+"%",
      d.YoY+"%",
      d.DayOnMarket,
      d.Prediction
    )
  });

  svg.append("g")
    .selectAll("path")
    .data(features)
    .enter().append("path")
    .attr("class", "path")
    .attr("zip", function(d) {return d.properties.zip; })
    .attr("state", function(d) {return d.properties.state; })
    .attr("name", function(d) {return d.properties.name; })
    .attr("id",function(d) {return d.properties.zip;})
    .attr("d", path)  
    .style("fill",function(d){
      return color(CRbyZip[d.properties.zip]);
    })
    .on("mouseover", function(d) {
      div.transition().duration(300)
      .style("opacity", 1);
      div.text(" Name: " + d3.select(this).attr('name') +
        ", State: " + d3.select(this).attr('state') +
        ", ZIP: " + d3.select(this).attr('zip'));
    })
    .on("mouseout", function(d) {
      div.transition().duration(300).style("opacity", 0);
    })
    .on("click", function(d){
      var curzip = d3.select(this).attr('zip');
      document.getElementById('myZipCode').value = curzip;
      clickmouse(curzip);
    });
    
  $(function() {
    panZoomInstance = svgPanZoom('#map', {
      zoomEnabled: true,
      controlIconsEnabled: true,
      fit: true,
      center: true,
      minZoom: 1,
      maxZoom: 100,
    
      onZoom: function() {
        var zoomLevel = panZoomInstance.getZoom();
        if ( zoomLevel <= 1 ) {
          panZoomInstance.disablePan(); 
        }
      },
    });
  });
}

function clickApply(){
  var checkedItem = [];
  if (document.getElementById('cb1').checked){
    checkedItem.push(1);
  }
  if (document.getElementById('cb2').checked){
    checkedItem.push(2);
  }
  if (document.getElementById('cb3').checked){
    checkedItem.push(3);
  }
  if (document.getElementById('cb4').checked){
    checkedItem.push(4);
  }
  if (document.getElementById('cb5').checked){
    checkedItem.push(5);
  }
  return checkedItem;
}

function enter(event){
  if(event.keyCode == 13 || event.which == 13){
    clickmouse(document.getElementById('myZipCode').value);
  }
}

function clickApplyButton(){
  clickmouse(document.getElementById('myZipCode').value);
}

function display(zip){
  var selectedInfo = zipInfo[zip];
  if (selectedInfo == null) {
    document.getElementById("myTable").style.display ="none";
    document.getElementById("warning").innerHTML = "No MHI information found!";
    document.getElementById("warning").style.display ="block";
  }
  else {
    document.getElementById("warning").style.display ="none";
    document.getElementById("myTable").style.display ="block";
    document.getElementById("cell1").innerHTML = selectedInfo[0];
    document.getElementById("cell2").innerHTML = selectedInfo[1];
    document.getElementById("cell3").innerHTML = selectedInfo[2];
    document.getElementById("cell4").innerHTML = selectedInfo[3];
    document.getElementById("cell5").innerHTML = selectedInfo[4];                                              
  }
}

function clickmouse(zip){
  display(zip);
  var checkedItem = clickApply();
  var chartArray = [];
  var zipcode=zip;
  var realCr = ["0.5 Year Investment" ,"1 Year Investment","2 Years Investment"];
  var realBed =["1 bedroom", "2 bedrooms", "3 bedrooms", "4 bedrooms", "5 bedrooms and more"];
  
  document.getElementById("errorMessage").innerHTML ="";

  for (var i=0; i<3; i++){
    chartArray[i] = new CanvasJS.Chart("chartContainer"+i, {
      animationEnabled: true,
      zoomEnabled: true,
      exportEnabled: true,
      theme: "light2",
      axisX: {      
        title: "Date (YYYY-MM)"
      },
      axisY: {      
        title: "Captial Return (%) "
      },
      legend: {
        horizontalAlign: "center", 
        verticalAlign: "top",  
        fontSize: 15
      },
      title: {
             text: "",
        },
        data: [{
            color:"rgb(84,139,197)",
            type: "line",
            showInLegend: true,
            legendText: realBed[0],
            dataPoints: []
        },{
            color:"rgb(116,181,103)",
            type: "line",
            showInLegend: true,
            legendText: realBed[1],
            dataPoints: []
        },{
            color:"rgb(230,175,95)",
            type: "line",
            showInLegend: true,
            legendText: realBed[2],
            dataPoints: []
        },{
            color:"rgb(117,190,218)",
            type: "line",
            showInLegend: true,
            legendText: realBed[3],
            dataPoints: []
        },{
            color:"rgb(201,92,84)",
            type: "line",
            showInLegend: true,
            legendText: realBed[4],
            dataPoints: []
        },{
            color:"grey",
            type: "line",
            showInLegend: true,
            legendText: "Median Value per sqft",
            dataPoints: []
        }]
      }); 
      chartArray[i].render();
  }

  function draw(CR,d,dataset){
    for (var i = 0; i < d.length; i++) {
      chartArray[CR].options.data[dataset].dataPoints.push({ 
        y: parseFloat(d[i].CR),
        label: d[i].Date
      });
    }
    chartArray[CR].options.title.text = "Captial Return For " + realCr[CR];
    chartArray[CR].render();
    document.getElementById("errorMessage").innerHTML = document.getElementById("errorMessage").innerHTML+" ";
  }

  for (var capRtn = 0; capRtn < 3; capRtn++){
    const CR = capRtn;
    for (var bedType = 0; bedType < checkedItem.length; bedType++) {
      const BT = bedType;
      var datasetName = "./data_bigData/nb"+CR+"/"+checkedItem[BT]+"B/"+ zipcode +".csv";
      console.log(datasetName);
      d3.csv(datasetName, function(d) {
        try{
          draw(CR,d,checkedItem[BT]-1);
        } 
        catch(error){
          if (CR == 0){
            document.getElementById("errorMessage").innerHTML = document.getElementById("errorMessage").innerHTML+
                                                              "No data for " + realBed[checkedItem[BT]-1]+"! <br>";
          }
        }
      });
    }

    d3.csv("./data_bigData/nb"+CR+"/Median/"+ zipcode +".csv", function(d) {
      try{
        draw(CR,d,5);
      } 
      catch(error){
        if (CR == 0){
          document.getElementById("errorMessage").innerHTML = document.getElementById("errorMessage").innerHTML+
                                                            "No data for mediam value per sqft of Zip Code: "+zipcode+" ! <br>";
        }
      }
    });

  }
}

