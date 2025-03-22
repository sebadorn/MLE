'use strict';



/**
 * Register click event on nav elements.
 */
function registerEventToggleNav() {
	const nav = document.querySelectorAll( 'nav label' );

	for( let i = 0; i < nav.length; i++ ) {
		nav[i].addEventListener( 'click', toggleNav, false );
	}
}


/**
 * Set current version of MLE in headline.
 */
function setVersion() {
	const v = document.getElementById( 'version' );
	v.textContent = '%MLE_VERSION%';
}


/**
 * Changes the class of the chosen nav element to "active".
 * @param {Event} ev
 */
function toggleNav( ev ) {
	const nav = document.querySelectorAll( 'nav label' );

	for( let i = 0; i < nav.length; i++ ) {
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
}


if( document.body ) {
	init();
}
else {
	window.addEventListener( 'DOMContentLoaded', init, false );
}
