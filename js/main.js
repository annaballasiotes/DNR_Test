// Author: Anna Ballasiotes
// Date: 05/29/2025

// Create map object
var mymap = L.map('map', {
    center: [47.75, -120.74],
    zoom: 7,
    maxZoom: 11,
    minZoom: 3,
    detectRetina: true});
    
     
// Esri satellite imagery layer
var satimagery = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
    maxZoom: 11
  }).addTo(mymap);


// CartoDB base map
var cartobasemap = L.tileLayer('http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',{
    attribution: 'CartoDB'
}).addTo(mymap);


var baseMaps = {
    "Satellite": satimagery,
    "Street Map": cartobasemap,
    };


// Basemap Toggle
L.control.layers(baseMaps, null, {collapsed: false}).addTo(mymap);



// FIRE DATA

// Colors from colorbrewer - YlOrBr
var colors = chroma.scale('YlOrBr').colors(5);

// Setting colors & styles
function setColor(yr) {
    var id = 0;
    if (yr < 1985) { id = 1; }
    else if (yr >= 1985 && yr < 1995) { id = 2; }
    else if (yr >= 1995 && yr < 2007) { id = 3; }
    else if (yr >= 2005) { id = 4; }
    else  { id = 0; }
    return colors[id];
}

function style(feature) {
    return {
        fillColor: setColor(feature.properties.YEAR),
        fillOpacity: 0.4,
        weight: 1,
        opacity: 1,
        color: setColor(feature.properties.YEAR)
    };
}


// Fetching ESRI Query + converting to GeoJSON for Leaflet
// ESRI REST query URL
// Note: I queried fires 2014 & earlier within the query URL (everything prior to 2015)
const queryUrl = 'https://gis.dnr.wa.gov/site3/rest/services/Public_Wildfire/WADNR_PUBLIC_WD_WildFire_Data/MapServer/0/query?where=YEAR%20%3E%3D%201973%20AND%20YEAR%20%3C%3D%202014&outFields=*&outSR=4326&f=json';

// Fetch and convert ESRI JSON to GeoJSON
fetch(queryUrl)
  .then(response => response.json())
  .then(data => {
    const geojsonFeatures = data.features.map(f => {
      return Terraformer.ArcGIS.parse(f);
    });

    const fires_GJ = {
      type: "FeatureCollection",
      features: geojsonFeatures
    };

    // Add to map
    var fires = L.geoJSON(fires_GJ, {
        style: style,
        onEachFeature: function (feature, layer) {
            var acresRaw = feature.properties.ACRES;
            var acresRounded = Math.round(acresRaw)
            layer.bindPopup(
                "<div class='popup'>" +
                "<b>Fire Name: </b>" + feature.properties.FIRENAME +
                "<br> <b> Total acres: </b>" + acresRounded +
                "<br><b> Fire Year: </b>" + feature.properties.YEAR +
                "</div>");
        },
        attribution: 'Anna Ballasiotes'
    }).addTo(mymap);
  })
  .catch(err => console.error("Error loading or converting data:", err));




// REGION DATA
function regionstyle(feature) {
    return {
        fillColor: 'black',
        fillOpacity: 0.2,
        weight: 2,
        opacity: 1,
        color: '#ffffff',
        dashArray: '1'
    };
}

// Fetching ESRI Query + converting to GeoJSON for Leaflet
// ESRI REST query URL
// Note: I queried fires 2014 & earlier within the query URL (everything prior to 2015)
const queryUrl_R = 'https://gis.dnr.wa.gov/site3/rest/services/Public_Boundaries/WADNR_PUBLIC_Cadastre_OpenData/MapServer/3/query?where=1%3D1&outFields=*&outSR=4326&f=json'

// Fetch and convert ESRI JSON to GeoJSON
fetch(queryUrl_R)
  .then(response => response.json())
  .then(data => {
    const geojsonFeatures = data.features.map(f => {
      return Terraformer.ArcGIS.parse(f);
    });

    const region_GJ = {
      type: "FeatureCollection",
      features: geojsonFeatures
    };

    // Add to map
    var regions = L.geoJSON(region_GJ, {
        style: regionstyle,
        onEachFeature: function(feature, layer) {
            layer.bindPopup(
                "<div class='popup'>" +
                feature.properties.JURISDICT_NM +
                "</div>");
        },
        attribution: 'WADNR'
    }).addTo(mymap);
  })
  .catch(err => console.error("Error loading or converting data:", err));



//  LEGEND

var legend = L.control({position: 'topright'});

// Populate legend
legend.onAdd = function () {

    // Create Div Element and Populate it with HTML
    var div = L.DomUtil.create('div', 'legend');
    div.innerHTML += '<t><b>Historical Fires in Washington State (1973 - 2015)</b></t><br />';
    div.innerHTML += '<b>Fires by Year</b><br />';
    div.innerHTML += '<i style="background: ' + colors[4] + '; opacity: 0.5"></i><p>2005 - 2015</p>';
    div.innerHTML += '<i style="background: ' + colors[3] + '; opacity: 0.5"></i><p>1995-2005</p>';
    div.innerHTML += '<i style="background: ' + colors[2] + '; opacity: 0.5"></i><p> 1985 - 1995</p>';
    div.innerHTML += '<i style="background: ' + colors[1] + '; opacity: 0.5"></i><p>Before 1985</p>';
    div.innerHTML += '<i style="background: #000000; opacity: 0.2;  border: 1px solid white;"></i><p><b>DNR Regions </b></p>';
    // Return the Legend div containing the HTML content
    return div;
};

// Add to legend to map
legend.addTo(mymap);

L.control.scale({position: 'bottomleft'}).addTo(mymap);
