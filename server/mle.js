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
					Hash: "sha256:1663187cd3f27efb5ad48a04c120f0bcc8e20895fdd6ab07277169c8c3093537",
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
	v.textContent = "2.5";
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
