"use strict";


/**
 * Register click event on nav elements.
 */
function registerEventToggleNav() {
	var nav = document.querySelectorAll( "nav label" );
	var i;

	for( i = 0; i < nav.length; i++ ) {
		nav[i].addEventListener( "click", toggleNav, false );
	}
};


/**
 * Changes the class of the chosen nav element to "active".
 */
function toggleNav( e ) {
	var nav = document.querySelectorAll( "nav label" );
	var i;

	for( i = 0; i < nav.length; i++ ) {
		if( nav[i] != e.target ) {
			nav[i].className = "";
		}
	}

	e.target.className = "active";
};


/**
 * Addon install trigger for Firefox.
 */
function setFirefoxInstallTrigger() {
	if( typeof InstallTrigger != "undefined" ) {
		var lff = document.getElementById( "link_firefox" );

		lff.addEventListener( "click", function( e ) {
			e.preventDefault();

			var params = {
				"MLE": {
					URL: e.target.href,
					IconURL: "http://sebadorn.de/mlp/mle/MLE_32.png",
					Hash: "sha256:aa991b8edd5020fe8ba876c2a1ef1e6ebebf1dbd3a98c3f00b5625028b622895",
					toString: function() { return this.URL; }
				}
			};

			InstallTrigger.install( params );
		}, false );
	}
};


/**
 * Set current version of MLE in headline.
 */
function setVersion() {
	var v = document.getElementById( "version" );
	v.textContent = "2.6";
};


/**
 * Get started.
 */
function init() {
	setVersion();
	registerEventToggleNav();
	setFirefoxInstallTrigger();
}


if( document.body ) {
	init();
}
else {
	window.addEventListener( "DOMContentLoaded", init, false );
}
