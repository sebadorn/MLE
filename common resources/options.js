'use strict';


var CONFIG = null;
var EMOTES = null;
var META = null;

var OPT_CFG = {
	MSG_TIMEOUT: 8000 // [ms]
};



/**
 * Export current config.
 * @param {Event} ev
 */
function exportConfig( ev ) {
	var ta = document.getElementById( 'export-config-ta' );

	ta.value = JSON.stringify( CONFIG );
}


/**
 * Export emotes in JSON.
 * @param {Event} ev
 */
function exportEmotes( ev ) {
	var ta = document.getElementById( 'export-emotes-ta' );

	ta.value = JSON.stringify( EMOTES );
	showMsg( ta.value.length + ' bytes', 'info' );
}


/**
 * Tell the background process to get and parse the sub-reddit stylesheets.
 * @param {Event} ev
 */
function forceUpdate( ev ) {
	// Disable button until page reload to avoid
	// multiple updates in a short time interval.
	ev.target.removeEventListener( 'click', forceUpdate, false );
	ev.target.setAttribute( 'readonly', 'readonly' );

	postMessage( { task: BG_TASK.UPDATE_CSS } );
}


/**
 * Get the value of the currently selected <option>.
 * @param {DOMElement} select
 */
function getOptionValue( select ) {
	return select.options[select.selectedIndex].value;
}


/**
 * Handle messages from the background process.
 * @param {Event} ev
 */
function handleBackgroundMessages( ev ) {
	var data = ev.data ? ev.data : ev;

	if( !data.task ) {
		console.warn( 'MyLittleEmotebox: Message from background process didn\'t contain the handled task.' );
		return;
	}

	switch( data.task ) {
		case BG_TASK.LOAD:
			CONFIG = data.config;
			EMOTES = data.emotes;
			META = data.meta;
			init2();
			break;

		case BG_TASK.SAVE_CONFIG:
			if( data.success ) {
				CONFIG = data.config;
			}
			break;

		case BG_TASK.UPDATE_CSS:
			showMsg( 'Force update finished.', 'info' );
			break;
	}
}


/**
 * Hide the message box.
 */
function hideMsg() {
	var msg_box = document.getElementById( 'msgbox' );

	msg_box.className = '';
}


/**
 * Import a config in JSON.
 * @param {Event} ev
 */
function importConfig( ev ) {
	var ta = document.getElementById( "import-config-ta" );
	var cfg = ta.value.trim();

	if( cfg.length === 0 ) {
		showMsg( 'Nothing to import.', 'err' );
		console.error( 'MyLittleEmotebox: Nothing to import.' );
		return;
	}

	try {
		cfg = JSON.parse( cfg );
	}
	catch( err ) {
		showMsg( 'Input not parsable as JSON.<br />Config remains unchanged.', 'err' );
		console.error( 'MyLittleEmotebox: Could not parse input as JSON.' );
		console.error( err );
		return;
	}

	postMessage( { task: BG_TASK.SAVE_CONFIG, config: cfg } );
	ta.value = '';
	showMsg( 'Import (probably) successful.<br />Changes show after next page load.', 'info' );
}


/**
 * Import emotes in JSON.
 * @param {Event} ev
 */
function importEmotes( ev ) {
	var importField = document.getElementById( 'import-emotes-ta' );
	var imported = null;

	importField.value = importField.value.trim();

	// Nothing to do if empty
	if( importField.value.length === 0 ) {
		showMsg( 'Nothing to import.', 'err' );
		return;
	}

	// Parse JSON
	try {
		imported = JSON.parse( importField.value );
	}
	catch( err ) {
		showMsg( 'Input not parsable as JSON.<br />Emotes remain unchanged.', 'err' );
		console.error( 'MyLittleEmotebox: Could not JSON-parse import.' );
		console.error( err );
		return;
	}

	var count = 0;

	// Parsing successful, but empty?
	for( var ele in imported ) {
		if( imported.hasOwnProperty( ele ) ) {
			count++;
			break;
		}
	}
	if( count === 0 ) {
		showMsg( 'Imported emote list is empty?<br />Emotes remain unchanged.', 'err' );
		return;
	}

	// Okay, okay, let's use the import already.
	EMOTES = imported;
	saveEmotes( EMOTES );

	showMsg( 'Import (probably) successful.<br />Changes show after next page load.', 'info' );
	importField.value = '';
}


/**
 * Insert the META data where it should be displayed.
 */
function insertMetaData() {
	var lastCheck = document.getElementById( 'lastSubredditCheck' );
	var date = new Date( META.lastSubredditCheck );
	var month = date.getMonth() + 1;
	var day = date.getDate();
	var hours = date.getHours();
	var minutes = date.getMinutes();

	if( month < 10 ) { month = '0' + month; }
	if( day < 10 ) { day = '0' + day; }
	if( hours < 10 ) { hours = '0' + hours; }
	if( minutes < 10 ) { minutes = '0' + minutes; }

	lastCheck.value = date.getFullYear() + '-' + month + '-' + day + ' ' + hours + ':' + minutes;
}


/**
 * Validate if given value is a color acceptable in CSS, excluding named colors.
 * @param  {String}  color
 * @return {Boolean} True if the value is a color, false otherwise.
 */
function isColor( color ) {
	if( color == 'transparent' ) {
		return true;
	}
	if( color.match( /^#[0-9a-f]{6}$/ ) ) {
		return true;
	}
	if( color.match( /^rgb\([0-9]{1,3},[0-9]{1,3},[0-9]{1,3}\)$/ ) ) {
		return true;
	}
	if( color.match( /^rgba\([0-9]{1,3},[0-9]{1,3},[0-9]{1,3},[01]\.[0-9]+\)$/ ) ) {
		return true;
	}
	return false;
}


/**
 * Load config through background process.
 */
function loadConfig() {
	postMessage( { task: BG_TASK.LOAD, loadMeta: true } );
}


/**
 * Send a message to the background process.
 * @param {Object} msg Message to send.
 */
function postMessage( msg ) {
	// Opera
	if( typeof opera != 'undefined' ) {
		opera.extension.postMessage( msg );
	}
	// Chrome
	else if( typeof chrome != 'undefined' ) {
		chrome.extension.sendMessage( msg, handleBackgroundMessages );
	}
	// probably Firefox
	else {
		self.postMessage( msg );
	}
}


/**
 * Register events for form elements to
 * immediately change the related setting.
 */
function registerEventSettingChanged() {
	var d = document;
	var selects = d.querySelectorAll( 'select' );
	var checkboxes = d.querySelectorAll( 'input[type="checkbox"]' );
	var numbers = d.querySelectorAll( 'input[type="number"]' );
	var texts = d.querySelectorAll( 'input[type="text"]' );
	var exportEmotesBtn = d.getElementById( 'export-emotes' );
	var importEmotesBtn = d.getElementById( 'import-emotes' );
	var resetEmotesBtn = d.getElementById( 'reset-emotes' );
	var forceUpdateBtn = d.getElementById( 'force-update' );
	var exportCfg = d.getElementById( 'export-config' );
	var importCfg = d.getElementById( 'import-config' );
	var resetCfg = d.getElementById( 'reset-config' );

	// <select>s
	for( var i = 0; i < selects.length; i++ ) {
		var select = selects[i];

		if( select.hasAttribute( 'data-meta' ) ) {
			continue;
		}
		select.addEventListener( 'change', saveSetting, false );

		// Select currently set <option>
		for( var j = 0; j < select.options.length; j++ ) {
			if( select.options[j].value == String( CONFIG[select.id] ) ) {
				select.selectedIndex = j;
			}
		}
	}

	// <input type="checkbox">s
	for( var i = 0; i < checkboxes.length; i++ ) {
		var chkbox = checkboxes[i];

		if( chkbox.hasAttribute( 'data-meta' ) ) {
			continue;
		}
		chkbox.addEventListener( 'change', saveSetting, false );
		chkbox.checked = CONFIG[chkbox.id];
	}

	// <input type="number">s
	for( var i = 0; i < numbers.length; i++ ) {
		var nmbr = numbers[i];

		if( nmbr.hasAttribute( 'data-meta' ) ) {
			continue;
		}
		nmbr.addEventListener( 'change', saveSetting, false );
		nmbr.value = CONFIG[nmbr.id];
	}

	// <input type="text">s
	for( var i = 0; i < texts.length; i++ ) {
		var txt = texts[i];

		if( txt.hasAttribute( 'data-meta' ) ) {
			continue;
		}
		txt.addEventListener( 'change', saveSetting, false );
		txt.value = CONFIG[txt.id];
	}

	// Force stylesheet update
	forceUpdateBtn.addEventListener( 'click', forceUpdate, false );

	// export/import/reset
	// Emotes
	exportEmotesBtn.addEventListener( 'click', exportEmotes, false );
	importEmotesBtn.addEventListener( 'click', importEmotes, false );
	resetEmotesBtn.addEventListener( 'click', resetEmotes, false );
	// Config
	exportCfg.addEventListener( 'click', exportConfig, false );
	importCfg.addEventListener( 'click', importConfig, false );
	resetCfg.addEventListener( 'click', resetConfig, false );
}


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
 * Register for messages from the background process.
 */
function registerForBackgroundMessages() {
	// Opera
	if( typeof opera != 'undefined' ) {
		opera.extension.onmessage = handleBackgroundMessages;
	}
	// Chrome
	else if( typeof chrome != 'undefined' ) {
		chrome.extension.onMessage.addListener( handleBackgroundMessages );
	}
	// probably Firefox
	else {
		self.on( 'message', handleBackgroundMessages );
	}
}


/**
 * Reset the config back to the default values.
 * @param {Event} ev
 */
function resetConfig( ev ) {
	if( window.confirm( 'Do you really want to reset the config?' ) ) {
		exportConfig();
		postMessage( { task: BG_TASK.RESET_CONFIG } );
		showMsg(
			'Config has been reset.<br />' +
			'There is an export from right before the reset,<br />' +
			'that you can still save before reloading the page. Think about it.',
			'info'
		);
	}
}


/**
 * Reset all lists/emotes to the default.
 * @param {Event} ev
 */
function resetEmotes( ev ) {
	if( window.confirm( 'Do you really want to reset all lists and emotes?' ) ) {
		exportEmotes();
		postMessage( { task: BG_TASK.RESET_EMOTES } );
		showMsg(
			'Lists and emotes have been reset.<br />' +
			'There is an export from right before the reset,<br />' +
			'that you can still save before reloading the page. Think about it.',
			'info'
		);
	}
}


/**
 * Save emotes to storage.
 * @param {Object} emotes
 */
function saveEmotes( emotes ) {
	postMessage( { task: BG_TASK.SAVE_EMOTES, emotes: emotes } );
}


/**
 * Get the config value of a changed <input>.
 * @param  {Event}   ev
 * @return {mixed}      String, boolean or integer.
 * @throws {Boolean}    If no valid config value can be extracted.
 */
function saveHandleInput( ev ) {
	var cfgName = ev.target.id;
	var val = null;

	switch( ev.target.type ) {
		case 'checkbox':
			val = ev.target.checked;
			break;

		case 'number':
			val = parseInt( ev.target.value );
			if( isNaN( val ) || val < 0 ) {
				ev.target.value = CONFIG[cfgName];
				throw false;
			}
			break;

		case 'text':
			val = ev.target.value;
			if( ev.target.className == 'color' ) {
				val = val.replace( / /g, '' );
				val = val.toLowerCase();

				if( !isColor( val ) ) {
					throw false;
				}
			}
			break;
	}

	return val;
}


/**
 * Get the config value of a changed <select>.
 * @param  {Event} ev
 * @return {mixed}    String or boolean.
 */
function saveHandleSelect( ev ) {
	var val = getOptionValue( ev.target );

	if( ev.target.id == 'ctxMenu' ) {
		val = ( val == 'true' );
	}
	return val;
}


/**
 * Save a setting that just changed.
 * @param {Event} ev
 */
function saveSetting( ev ) {
	var htmlTag = ev.target.tagName.toLowerCase();
	var cfgName = ev.target.id;
	var val = null;
	var cfg = {};

	switch( htmlTag ) {
		case 'select':
			val = saveHandleSelect( ev );
			break;

		case 'input':
			try {
				val = saveHandleInput( ev );
			}
			catch( err ) { return; }
			break;
	}

	if( val !== null ) {
		cfg[cfgName] = val;
		postMessage( { task: BG_TASK.SAVE_CONFIG, config: cfg } );
	}
}


/**
 * Display a message box on the page.
 * @param {String} msg Message to display.
 * @param {String} mtype "err" or "info".
 */
function showMsg( msg, mtype ) {
	var msg_paragraph = document.getElementById( 'msg' );

	msg_paragraph.innerHTML = msg;
	msg_paragraph.className = mtype;
	msg_paragraph.parentNode.className = 'show';
	window.setTimeout( hideMsg, OPT_CFG.MSG_TIMEOUT );
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
	registerForBackgroundMessages();
	loadConfig();
	registerEventToggleNav();
}


/**
 * Second setup phase after receiving the config, emotes and meta data.
 */
function init2() {
	registerEventSettingChanged();
	insertMetaData();
}


if( document.body ) {
	init();
}
else {
	window.addEventListener( 'DOMContentLoaded', init, false );
}