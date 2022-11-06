const precinctNames = {
	c: "Central",
	n: "North",
	e: "East",
	s: "South",
	w: "West"
};

const selectEl = document.querySelector.bind(document);
const selectEls = document.querySelectorAll.bind(document);

var map;
var markers = [];
var precincts = [];

var hasShownLocPopup = false;

window.onload = () => {
	var redIcon = new L.Icon({
		iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
		shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
		iconSize: [25, 41],
		iconAnchor: [12, 41],
		popupAnchor: [1, -34],
		shadowSize: [41, 41]
	});
	
	map = L.map("map").setView([-37.8136, 144.9631], 13);
	L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
		maxZoom: 19,
		attribution: "&copy; <a href='http://www.openstreetmap.org/copyright' target='_blank'>OpenStreetMap</a>"
	}).addTo(map);
	L.control.scale().addTo(map);
	
	map.on("click", e => {
		//var marker = new L.marker(e.latlng).addTo(map);
		console.log(e.latlng);
		//selectEl("#map").requestFullscreen();
	});
	map.on("locationfound", e => {
		console.log(e.latlng);
		var userLoc = L.marker(e.latlng, {
			icon: redIcon
		}).addTo(map).bindPopup("You are here!");
		if(!hasShownLocPopup) {
			userLoc.openPopup();
			hasShownLocPopup = true;
		}
	});
	map.on("locationerror", e => {
		alert("Location error:\n" + e);
	});
	map.locate();	
	setInterval(() => {
		//map.locate();
	}, 10000);
	
	fetch("locations.json").then(res => res.text()).then(jsonc => {
		var json = jsonc.replace(/\\"|"(?:\\"|[^"])*"|(\/\/.*|\/\*[\s\S]*?\*\/)/g, (m, g) => g ? "" : m); // https://stackoverflow.com/a/62945875
		var locations = JSON.parse(json);
		console.log(locations);
		locations.forEach((loc, i) => {
			var popupText = `<div data-marker-n="${i}"><b>${loc.name}</b><br/><u>${precinctNames[loc.precinct]}</u>` + (loc.note? `<br/>${loc.note}` : "") + "<br/><button class='markerBtn' onload='addEvent(this);'>&#9989;</button></div>";
			var marker = L.marker(loc.pos).addTo(map).bindPopup(popupText, {
				className: `popup${loc.points}`
			});
			L.DomUtil.addClass(marker._icon, `_${loc.points}points`);
			L.DomUtil.addClass(marker._icon, loc.precinct);
			markers.push(marker);
			precincts[marker._leaflet_id] = loc.precinct;
		});
	});
	
	showC.oninput = showN.oninput = showE.oninput = showS.oninput = showW.oninput = e => {
		/*markers.forEach(marker => {
			onsole.log(marker);
			//map.removeLayer(marker);
			if(precincts[marker._leaflet_id] && showC.checked) {
				//map.addLayer(marker);
				marker.
			}
		});*/
		if(showC.checked) {
			selectEls(".c").forEach(el => {
				el.style.display = "block";
			});
		} else {
			selectEls(".c").forEach(el => {
				el.style.display = "none";
			});
		}
		if(showN.checked) {
			selectEls(".n").forEach(el => {
				el.style.display = "block";
			});
		} else {
			selectEls(".n").forEach(el => {
				el.style.display = "none";
			});
		}
		if(showE.checked) {
			selectEls(".e").forEach(el => {
				el.style.display = "block";
			});
		} else {
			selectEls(".e").forEach(el => {
				el.style.display = "none";
			});
		}
		if(showS.checked) {
			selectEls(".s").forEach(el => {
				el.style.display = "block";
			});
		} else {
			selectEls(".s").forEach(el => {
				el.style.display = "none";
			});
		}
		if(showW.checked) {
			selectEls(".w").forEach(el => {
				el.style.display = "block";
			});
		} else {
			selectEls(".w").forEach(el => {
				el.style.display = "none";
			});
		}
	};
};

function addEvent(el) {
	console.log(el);
}