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
}


/**
 * Add-on install trigger for Firefox.
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
					Hash: "sha256:47a7733ca49ad259e023b89b4f903baa362f567999c8cf29a3ef498d7412ea84",
					toString: function() { return this.URL; }
				}
			};

			InstallTrigger.install( params );
		}, false );
	}
}


/**
 * Set current version of MLE in headline.
 */
function setVersion() {
	var v = document.getElementById( "version" );
	v.textContent = "2.9.1";
}


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
}


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
