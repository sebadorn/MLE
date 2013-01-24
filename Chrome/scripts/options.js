"use strict";


var CONFIG = null,
    EMOTES = null;

var OPT_CFG = {
		MSG_TIMEOUT: 8000 // [ms]
	};


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
				case "text":
					val = e.target.value;
					break;
			}
			break;
	}

	cfg[cfgName] = val;

	postMessage( { task: BG_TASK.SAVE_CONFIG, config: cfg } );
};


/**
 * Save emotes to storage.
 * @param {Object} emotes [description]
 */
function saveEmotes( emotes ) {
	postMessage( { task: BG_TASK.SAVE_EMOTES, emotes: emotes } );
};


/**
 * Get the value of the currently selected <option>.
 */
function getOptionValue( select ) {
	return select.options[select.selectedIndex].value;
};


/**
 * Display a message box on the page.
 * @param {String} msg Message to display.
 * @param {String} mtype "err" or "info".
 */
function showMsg( msg, mtype ) {
	var msg_paragraph = document.getElementById( "msg" );

	msg_paragraph.innerHTML = msg;
	msg_paragraph.className = mtype;
	msg_paragraph.parentNode.className = "show";
	window.setTimeout( hideMsg, OPT_CFG.MSG_TIMEOUT );
};


/**
 * Hide the message box.
 */
function hideMsg() {
	var msg_box = document.getElementById( "msgbox" );

	msg_box.className = "";
};


/**
 * Import emotes in JSON.
 */
function importEmotes( e ) {
	var importField = document.getElementById( "import-emotes-ta" );
	var imported = null,
	    ele,
	    count = 0;

	importField.value = importField.value.trim();

	// Nothing to do if empty
	if( importField.value.length == 0 ) {
		showMsg( "Nothing to import.", "err" );
		return;
	}

	// Parse JSON
	try {
		imported = JSON.parse( importField.value );
	}
	catch( err ) {
		showMsg( "Input not parsable as JSON.<br />Emotes remain unchanged.", "err" );
		console.error( "MyLittleEmotebox: Could not JSON-parse import." );
		console.error( err );
		return;
	}

	// Parsing successful, but empty?
	for( ele in imported ) {
		if( imported.hasOwnProperty( ele ) ) {
			count++;
			break;
		}
	}
	if( count == 0 ) {
		showMsg( "Imported emote list is empty?<br />Emotes remain unchanged.", "err" );
		return;
	}

	// Okay, okay, let's use the import already.
	EMOTES = imported;
	saveEmotes( EMOTES );

	showMsg( "Import (probably) successful.<br />Changes show after next page load.", "info" );
	importField.value = "";
};


/**
 * Export emotes in JSON.
 */
function exportEmotes( e ) {
	var ta = document.getElementById( "export-emotes-ta" );

	ta.value = JSON.stringify( EMOTES );
	showMsg( ta.value.length + " bytes", "info" );
};


/**
 * Reset all lists/emotes to the default.
 */
function resetEmotes( e ) {
	if( window.confirm( "Do you really want to reset all lists and emotes?" ) ) {
		exportEmotes();
		postMessage( { task: BG_TASK.RESET_EMOTES } );
		showMsg(
			"Lists and emotes have been reset.<br />"
			+ "There is an export from right before the reset,<br />"
			+ "that you can still save before reloading the page. Think about it.",
			"info"
		);
	}
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
		showMsg( "Nothing to import.", "err" );
		console.error( "MyLittleEmotebox: Nothing to import." );
		return;
	}

	try {
		cfg = JSON.parse( cfg );
	}
	catch( err ) {
		showMsg( "Input not parsable as JSON.<br />Config remains unchanged.", "err" );
		console.error( "MyLittleEmotebox: Could not parse input as JSON." );
		console.error( err );
		return;
	}

	postMessage( { task: BG_TASK.SAVE_CONFIG, config: cfg } );
	ta.value = "";
	showMsg( "Import (probably) successful.<br />Changes show after next page load.", "info" );
};


/**
 * Reset the config back to the default values.
 */
function resetConfig( e ) {
	if( window.confirm( "Do you really want to reset the config?" ) ) {
		exportConfig();
		postMessage( { task: BG_TASK.RESET_CONFIG } );
		showMsg(
			"Config has been reset.<br />"
			+ "There is an export from right before the reset,<br />"
			+ "that you can still save before reloading the page. Think about it.",
			"info"
		);
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
	    texts = d.querySelectorAll( "input[type='text']" );
	var exportEmotesBtn = d.getElementById( "export-emotes" ),
	    importEmotesBtn = d.getElementById( "import-emotes" ),
	    resetEmotesBtn = d.getElementById( "reset-emotes" ),
	    exportCfg = d.getElementById( "export-config" ),
	    importCfg = d.getElementById( "import-config" ),
	    resetCfg = d.getElementById( "reset-config" );
	var i, j, val, select, chkbox, nmbr, txt;


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

	// <input type="text">s
	for( i = 0; i < texts.length; i++ ) {
		txt = texts[i];
		txt.addEventListener( "change", saveSetting, false );
		txt.value = CONFIG[txt.id];
	}

	// export/import/reset
	// Emotes
	exportEmotesBtn.addEventListener( "click", exportEmotes, false );
	importEmotesBtn.addEventListener( "click", importEmotes, false );
	resetEmotesBtn.addEventListener( "click", resetEmotes, false );
	// Config
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
			EMOTES = data.emotes;
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