'use strict';



/**
 * Register click event on nav elements.
 */
function registerEventToggleNav() {
	var nav = document.querySelectorAll( 'nav label' );

	for( var i = 0; i < nav.length; i++ ) {
		nav[i].addEventListener( 'click', toggleNav, false );
	}
}


/**
 * Add-on install trigger for Firefox.
 */
function setFirefoxInstallTrigger() {
	if( typeof InstallTrigger != 'undefined' ) {
		var lff = document.getElementById( 'link_firefox' );

		lff.addEventListener( 'click', function( ev ) {
			ev.preventDefault();

			var params = {
				'MLE': {
					URL: ev.target.href,
					IconURL: 'http://sebadorn.de/mlp/mle/MLE_32.png',
					Hash: 'sha256:d62ac1082e2774a0b0946d7f272b403729ea093f47b96481c5b97b93b47aeea3',
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
	var v = document.getElementById( 'version' );
	v.textContent = '2.10.2';
}


/**
 * Changes the class of the chosen nav element to "active".
 * @param {Event} ev
 */
function toggleNav( ev ) {
	var nav = document.querySelectorAll( 'nav label' );

	for( var i = 0; i < nav.length; i++ ) {
		if( nav[i] != ev.target ) {
			nav[i].className = '';
		}
	}

	ev.target.className = 'active';
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
	window.addEventListener( 'DOMContentLoaded', init, false );
}
