'use strict';


function bootstrap() {
	if (typeof chrome !== 'undefined' || typeof opera !== 'undefined' ) {
		var optScript = document.createElement( 'script' );
		optScript.src = 'scripts/options.js';

		var head = document.querySelector( 'head' );
		head.appendChild( optScript );
	}
}


if( document.body ) {
	bootstrap();
}
else {
	window.addEventListener( 'DOMContentLoaded', bootstrap, false );
}