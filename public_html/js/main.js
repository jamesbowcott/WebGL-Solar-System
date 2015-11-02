/* 
 * James Bowcott (jab41@aber.ac.uk)
 * CS323 Assignment 2014
 * Aberystwyth University
 */


/* Utils */
function error(message) {
    alert(message);
}

function degToRad(degrees) {
    return degrees * Math.PI / 180;
}

function dotproduct(a,b) {
	var n = 0, lim = Math.min(a.length,b.length);
	for (var i = 0; i < lim; i++) n += a[i] * b[i];
	return n;
 }

function wrapNum(val, min, max) {
    if (val > max) return val - max;
    if (val < min) return max - (min-val);
    return val;
}

function loadFileSynchronous(url) {
    var request = new XMLHttpRequest();
    request.open('GET', url, false);
    request.send(null);
    
    if (request.status === 200) {
        return request.responseText;
    } else {
        //TODO error handling
        return null;
    }
}

/* Borrowed from jscolor by Jan Odvarko (GNU) */
function HSVtoRGB(h, s, v) {
	var i, f, p, q, t;
	h *= 360;
	// Make sure our arguments stay in-range
	h = Math.max(0, Math.min(360, h));
	s = Math.max(0, Math.min(1, s));
	v = Math.max(0, Math.min(1, v));

	
	if (s === 0) return [v,v,v];
	
	h /= 60; // sector 0 to 5
	i = Math.floor(h);
	f = h - i; // factorial part of h
	p = v * (1 - s);
	q = v * (1 - s * f);
	t = v * (1 - s * (1 - f));

	switch(i) {
		case 0: return [v,t,p];
		case 1: return [q,v,p];
		case 2: return [p,v,t];
		case 3: return [p,q,v];
		case 4: return [t,p,v];
		default: return [v,p,q];
	}
}

/* Main entry point */
function onLoad() {
    initGL(document.getElementById("glcanvas"));
    initSolarSystem();
    initUI();
    tick();
}

/* Main loop */
function tick() {
    requestAnimFrame(tick);
    tickSolarSystem();
    tickGL();
    tickUI();
}