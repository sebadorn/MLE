"use strict";


var CONFIG = null;


/**
 * Send a message to the background process.
 */
function postMessage( msg ) {
	// Opera
	if( typeof opera != "undefined" ) {
		opera.extension.postMessage( msg );
	}
	// Chrome
	else if( typeof chrome != "undefined" ) {
		chrome.extension.sendMessage( msg, handleBackgroundMessages );
	}
	// probably Firefox
	else {
		self.postMessage( msg );
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
 * Save a setting that just changed.
 */
function saveSetting( e ) {
	var htmlTag = e.target.tagName.toLowerCase(),
	    cfgName = e.target.id;
	var val,
	    cfg = {};

	switch( htmlTag ) {

		case "select":
			val = getOptionValue( e.target );
			if( val == "true" ) {
				val = true;
			}
			else if( val == "false" ) {
				val = false;
			}
			break;

		case "input":
			switch( e.target.type ) {
				case "checkbox":
					val = e.target.checked;
					break;
				case "number":
					val = parseInt( e.target.value );
					if( isNaN( val ) || val < 0 ) {
						e.target.value = CONFIG[cfgName];
						return;
					}
					break;
			}
			break;

	}

	cfg[cfgName] = val;

	postMessage( { task: BG_TASK.SAVE_CONFIG, config: cfg } );
};


/**
 * Get the value of the currently selected <option>.
 */
function getOptionValue( select ) {
	return select.options[select.selectedIndex].value;
};


/**
 * Export current config.
 */
function exportConfig( e ) {
	var ta = document.getElementById( "export-config-ta" );

	ta.value = JSON.stringify( CONFIG );
};


/**
 * Import a config in JSON.
 */
function importConfig( e ) {
	var ta = document.getElementById( "import-config-ta" );
	var cfg = ta.value.trim();

	if( cfg == "" ) {
		console.error( "MyLittleEmotebox: Nothing to import." );
		return;
	}

	try {
		cfg = JSON.parse( cfg );
	}
	catch( err ) {
		console.error( "MyLittleEmotebox: Could not parse input as JSON." );
		console.error( err );
		return;
	}

	ta.value = "";
	postMessage( { task: BG_TASK.SAVE_CONFIG, config: cfg } );
};


/**
 * Reset the config back to the default values.
 */
function resetConfig( e ) {
	if( window.confirm( "Do you really want to reset the config?" ) ) {
		exportConfig();
		postMessage( { task: BG_TASK.RESET_CONFIG } );
	}
};


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
 * Register events for form elements to
 * immediately change the related setting.
 */
function registerEventSettingChanged() {
	var d = document;
	var selects = d.querySelectorAll( "select" ),
	    checkboxes = d.querySelectorAll( "input[type='checkbox']" ),
	    numbers = d.querySelectorAll( "input[type='number']" ),
	    exportCfg = d.getElementById( "export-config" ),
	    importCfg = d.getElementById( "import-config" ),
	    resetCfg = d.getElementById( "reset-config" );
	var i, j, val, select, chkbox, nmbr;

	// <select>s
	for( i = 0; i < selects.length; i++ ) {
		select = selects[i];
		select.addEventListener( "change", saveSetting, false );

		// Select currently set <option>
		for( j = 0; j < select.options.length; j++ ) {
			if( select.options[j].value == String( CONFIG[select.id] ) ) {
				select.selectedIndex = j;
			}
		}
	}

	// <input type="checkbox">s
	for( i = 0; i < checkboxes.length; i++ ) {
		chkbox = checkboxes[i];
		chkbox.addEventListener( "change", saveSetting, false );
		chkbox.checked = CONFIG[chkbox.id];
	}

	// <input type="number">s
	for( i = 0; i < numbers.length; i++ ) {
		nmbr = numbers[i];
		nmbr.addEventListener( "change", saveSetting, false );
		nmbr.value = CONFIG[nmbr.id];
	}

	// export/import/reset
	exportCfg.addEventListener( "click", exportConfig, false );
	importCfg.addEventListener( "click", importConfig, false );
	resetCfg.addEventListener( "click", resetConfig, false );
};


/**
 * Register for messages from the background process.
 */
function registerForBackgroundMessages() {
	// Opera
	if( typeof opera != "undefined" ) {
	    opera.extension.onmessage = handleBackgroundMessages;
	}
	// Chrome
	else if( typeof chrome != "undefined" ) {
		chrome.extension.onMessage.addListener( handleBackgroundMessages );
	}
	// probably Firefox
	else {
	    self.on( "message", handleBackgroundMessages );
	}
};


/**
 * Handle messages from the background process.
 */
function handleBackgroundMessages( e ) {
	var data = e.data ? e.data : e;

	if( !data.task ) {
		console.warn( "MyLittleEmotebox: Message from background process didn't contain the handled task." );
		return;
	}

	switch( data.task ) {
		case BG_TASK.LOAD:
			CONFIG = data.config;
			init2();
			break;

		case BG_TASK.SAVE_CONFIG:
			if( data.success ) {
				CONFIG = data.config;
			}
			break;
	}
};


/**
 * Load config through background process.
 */
function loadConfig() {
	postMessage( { task: BG_TASK.LOAD } );
};


/**
 * Get started.
 */
function init() {
	registerForBackgroundMessages();
	loadConfig();
	registerEventToggleNav();
};


function init2() {
	registerEventSettingChanged();
};


if( document.body ) {
	init();
}
else {
	window.addEventListener( "DOMContentLoaded", init, false );
}