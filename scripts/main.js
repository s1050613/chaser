const precinctNames = {
	c: "Central",
	n: "North",
	e: "East",
	s: "South",
	w: "West"
};
const locationServices = false;

var apiId = 0;
var apiKey = "00000000-0000-0000-0000-000000000000";
const apiBase = "https://timetableapi.ptv.vic.gov.au";
const apiVersion = "v3";

const selectEl = document.querySelector.bind(document);
const selectEls = document.querySelectorAll.bind(document);

var map;
var markers = [];
var precincts = [];

var hasShownLocPopup = false;
var hasShownError = false;

var userPopup;

var linePoints = [];
var line;
var jointLabels = [];
var totalRouteDis = 0;

var routeEditing = false;

window.onload = () => {
	document.body.onkeydown = e => {
		e.key == "z" && linePoints.length && linePoints.pop();
		updateLine();
	}
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

	var latlngs = [
		[45.51, -122.68],
		[37.77, -122.43],
		[34.04, -118.2]
	];
	
	var polyline = L.polyline(latlngs, {color: 'red'}).addTo(map);
	
	map.on("click", e => {
		//var marker = new L.marker(e.latlng).addTo(map);
		console.log(e.latlng);
		//selectEl("#map").requestFullscreen();
	});
	map.on("locationfound", e => {
		console.log(e.latlng);
		if(userPopup) {
			L.removeLayer(userPopup);
		}
		userPopup = L.marker(e.latlng, {
			icon: redIcon
		}).addTo(map).bindPopup("You are here!");
		if(!hasShownLocPopup) {
			userPopup.openPopup();
			hasShownLocPopup = true;
		}
	});
	map.on("locationerror", e => {
		if(!hasShownError) {
			alert("Location error:\n" + e.message);
			hasShownError = true;
		}
		console.log(e);
	});
	if(locationServices) {
		map.locate();	
		setInterval(() => {
			map.locate();
		}, 10000);
	}
	
	fetch("locations.min.json").then(res => res.text()).then(jsonc => {
		var json = jsonc.replace(/\\"|"(?:\\"|[^"])*"|(\/\/.*|\/\*[\s\S]*?\*\/)/g, (m, g) => g? "" : m); // https://stackoverflow.com/a/62945875
		var locations = JSON.parse(json);
		console.log(locations);
		locations.forEach((loc, i) => {
			var popupText = `<div><b>${loc.name}</b><br/><u>${precinctNames[loc.precinct]}</u>` + (loc.note? `<br/>${loc.note}` : "") + `<br/><button data-marker-n="${i}" class='markerBtn visible' onclick='if(this.classList.toggle("visible")) {
				this.innerHTML = "&#9989;";
				selectEl(".idIs${i}").classList.remove("opacityEffect");
			} else {
				this.innerHTML = "&#x274C;";
				selectEl(".idIs${i}").classList.add("opacityEffect");
			}'>&#9989;</button><script>console.log(43);</script></div>`;
			var marker = L.marker(loc.pos).addTo(map).bindPopup(popupText, {
				className: `popup${loc.points}`
			}).on("click", e => {
				if(!routeEditing) {
					return;
				}
				console.log(e);
				var pos = [e.latlng.lat, e.latlng.lng];
				if(!linePoints.length || pos[0] != linePoints[linePoints.length - 1][0] && pos[1] != linePoints[linePoints.length - 1][1]) {
					linePoints.push(pos);
					updateLine();
				}
			});
			L.DomUtil.addClass(marker._icon, `_${loc.points}points`);
			L.DomUtil.addClass(marker._icon, loc.precinct);
			L.DomUtil.addClass(marker._icon, `idIs${i}`)
			markers.push(marker);
			precincts[marker._leaflet_id] = loc.precinct;
		});
	});
	
	showC.oninput = showN.oninput = showE.oninput = showS.oninput = showW.oninput = updatePrecincts;
	
	ptvApiRequest("routes");
};

function addEvent(el) {
	console.log(el);
}
function doSearch() {
	markers.forEach(marker => {
		var text = marker._popup._content.toLowerCase();
		text = text.slice(text.indexOf("<b>") + 3);
		text = text.slice(0, text.indexOf("</b>"));
		if(text.includes(searchInput.value.toLowerCase())) {
			marker.openPopup();
		}
	});
	searchInput.value = "";
}
function updateLine() {
	if(line) {
		map.removeLayer(line);
	}
	line = L.polyline(linePoints, {
		color: "green"
	}).addTo(map);
	while(jointLabels.length) {
		map.removeLayer(jointLabels.pop());
	}
	totalRouteDis = 0;
	for(var i = 0; i < linePoints.length - 1; i++) {
		var mid = [(linePoints[i][0] + linePoints[i + 1][0]) / 2, (linePoints[i][1] + linePoints[i + 1][1]) / 2];
		var dis = L.marker(linePoints[i]).getLatLng().distanceTo(L.marker(linePoints[i + 1]).getLatLng());
		totalRouteDis += dis;
		var m = L.marker(mid, {
			opacity: 0
		}).bindTooltip(`${Math.round(dis)}m`, {
			permanent: true,
			offset: [0, 0],
			className: "translucentTooltip"
		}).addTo(map);
		jointLabels.push(m);
	}
	console.log(totalRouteDis);
	selectEl("#routeDisEl").innerText = Math.round(totalRouteDis);
}
function ptvApiRequest(reqUrl) {
	var fullReq = `/${apiVersion}/${reqUrl}${reqUrl.includes("?")? "&" : "?"}devid=${apiId}`;
	console.log(fullReq);
	
	const shaObj = new jsSHA("SHA-1", "TEXT", {
		hmacKey: {
			value: apiKey,
			format: "TEXT"
		},
	});
	shaObj.update(fullReq);
	var hmac = shaObj.getHash("HEX").toUpperCase();
	
	var fullerReq = `${apiBase}${fullReq}&signature=${hmac}`;
	console.log(fullerReq);
	fetch(fullerReq).then(res => res.json()).then(json => {
		console.log(json);
	});
}
function updatePrecincts() {
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
}
function loadRoute() {
	linePoints = JSON.parse(selectEl("#routeInput").value);
	updateLine();
	selectEl("#routeInput").value = "";
}
function toggleRouteEditing(el) {
	el.innerText = `Route editing: ${["OFF", "ON"][+(routeEditing = !routeEditing)]}`;
}
function exportRoute() {
	navigator.clipboard.writeText(JSON.stringify(linePoints)).then(e => {
		alert("Copied route to clipboard successfully!");
	}).catch(e => {
		alert("Failed to catch route to clipboard!");
		alert(e);
	})
}
function loadApiCreds() {
	apiId = +selectEl("#apiIdEl").value;
	apiKey = selectEl("#apiKeyEl").value;
	alert("Loaded, perhaps...");
}