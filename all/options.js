'use strict';


let CONFIG = null;
let EMOTES = null;
let META = null;

let OPT_CFG = {
	INIT_DONE: false,
	MSG_TIMEOUT: 8000, // [ms]
};



/**
 * Export current config.
 */
function exportConfig() {
	const ta = document.getElementById( 'export-config-ta' );
	ta.value = JSON.stringify( CONFIG );
}


/**
 * Export emotes in JSON.
 */
function exportEmotes() {
	const ta = document.getElementById( 'export-emotes-ta' );
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
	ev.target.removeEventListener( 'click', forceUpdate );
	ev.target.setAttribute( 'readonly', 'readonly' );

	sendMessage( { task: BG_TASK.UPDATE_CSS } );
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
	console.debug( '[handleBackgroundMessages]', ev );

	let data = ev.data ? ev.data : ev;

	if( !data.task ) {
		console.warn( "[handleBackgroundMessages] Message from background process didn't contain the handled task." );
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

		default:
			console.warn( '[handleBackgroundMessages] Unknown task:', data.task );
	}
}


/**
 * Hide the message box.
 */
function hideMsg() {
	const msg_box = document.getElementById( 'msgbox' );
	msg_box.className = '';
}


/**
 * Import a config in JSON.
 */
function importConfig() {
	let ta = document.getElementById( 'import-config-ta' );
	let cfg = ta.value.trim();

	if( cfg.length === 0 ) {
		showMsg( 'Nothing to import.', 'err' );
		console.error( 'MyLittleEmotebox: Nothing to import.' );
		return;
	}

	try {
		cfg = JSON.parse( cfg );
	}
	catch( err ) {
		showMsg( ['Input not parsable as JSON.', 'Config remains unchanged.'], 'err' );
		console.error( 'MyLittleEmotebox: Could not parse input as JSON.' );
		console.error( err );
		return;
	}

	sendMessage( { task: BG_TASK.SAVE_CONFIG, config: cfg } );
	ta.value = '';
	showMsg( ['Import (probably) successful.', 'Changes show after next page load.'], 'info' );
}


/**
 * Import emotes in JSON.
 */
function importEmotes() {
	let importField = document.getElementById( 'import-emotes-ta' );
	let imported = null;

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
		showMsg( ['Input not parsable as JSON.', 'Emotes remain unchanged.'], 'err' );
		console.error( 'MyLittleEmotebox: Could not JSON-parse import.' );
		console.error( err );
		return;
	}

	let count = 0;

	// Parsing successful, but empty?
	for( let ele in imported ) {
		if( Object.prototype.hasOwnProperty.call( imported, ele ) ) {
			count++;
			break;
		}
	}
	if( count === 0 ) {
		showMsg( ['Imported emote list is empty?', 'Emotes remain unchanged.'], 'err' );
		return;
	}

	// Okay, okay, let's use the import already.
	EMOTES = imported;
	saveEmotes( EMOTES );

	showMsg( ['Import (probably) successful.', 'Changes show after next page load.'], 'info' );
	importField.value = '';
}


/**
 * Insert the META data where it should be displayed.
 */
function insertMetaData() {
	let lastCheck = document.getElementById( 'lastSubredditCheck' );
	let date = new Date( META.lastSubredditCheck );
	let month = date.getMonth() + 1;
	let day = date.getDate();
	let hours = date.getHours();
	let minutes = date.getMinutes();

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
	sendMessage( { task: BG_TASK.LOAD, loadMeta: true } );
}


/**
 * Send a message to the background process.
 * @param {Object} msg Message to send.
 */
function sendMessage( msg ) {
	console.debug( '[sendMessage]', msg );

	// Firefox
	if( typeof browser !== 'undefined' ) {
		browser.runtime.sendMessage( msg )
			.then( res => res && handleBackgroundMessages( { data: res } ) )
			.catch( err => console.error( '[sendMessage]', err ) );
	}
	// Chrome
	else if( typeof chrome !== 'undefined' ) {
		chrome.runtime.sendMessage( msg, handleBackgroundMessages );
	}
}


/**
 * Register events for form elements to
 * immediately change the related setting.
 */
function registerEventSettingChanged() {
	const d = document;
	let selects = d.querySelectorAll( 'select' );
	let checkboxes = d.querySelectorAll( 'input[type="checkbox"]' );
	let numbers = d.querySelectorAll( 'input[type="number"]' );
	let texts = d.querySelectorAll( 'input[type="text"]' );
	let exportEmotesBtn = d.getElementById( 'export-emotes' );
	let importEmotesBtn = d.getElementById( 'import-emotes' );
	let resetEmotesBtn = d.getElementById( 'reset-emotes' );
	let forceUpdateBtn = d.getElementById( 'force-update' );
	let exportCfg = d.getElementById( 'export-config' );
	let importCfg = d.getElementById( 'import-config' );
	let resetCfg = d.getElementById( 'reset-config' );

	// <select>s
	for( let i = 0; i < selects.length; i++ ) {
		let select = selects[i];

		if( select.hasAttribute( 'data-meta' ) ) {
			continue;
		}
		select.addEventListener( 'change', saveSetting );

		// Select currently set <option>
		for( let j = 0; j < select.options.length; j++ ) {
			if( select.options[j].value == String( CONFIG[select.id] ) ) {
				select.selectedIndex = j;
			}
		}
	}

	// <input type="checkbox">s
	for( let i = 0; i < checkboxes.length; i++ ) {
		let chkbox = checkboxes[i];

		if( chkbox.hasAttribute( 'data-meta' ) ) {
			continue;
		}
		chkbox.addEventListener( 'change', saveSetting );
		chkbox.checked = CONFIG[chkbox.id];
	}

	// <input type="number">s
	for( let i = 0; i < numbers.length; i++ ) {
		let nmbr = numbers[i];

		if( nmbr.hasAttribute( 'data-meta' ) ) {
			continue;
		}
		nmbr.addEventListener( 'change', saveSetting );
		nmbr.value = CONFIG[nmbr.id];
	}

	// <input type="text">s
	for( let i = 0; i < texts.length; i++ ) {
		let txt = texts[i];

		if( txt.hasAttribute( 'data-meta' ) ) {
			continue;
		}
		txt.addEventListener( 'change', saveSetting );
		txt.value = CONFIG[txt.id];
	}

	// Force stylesheet update
	forceUpdateBtn.addEventListener( 'click', forceUpdate );

	// export/import/reset
	// Emotes
	exportEmotesBtn.addEventListener( 'click', exportEmotes );
	importEmotesBtn.addEventListener( 'click', importEmotes );
	resetEmotesBtn.addEventListener( 'click', resetEmotes );
	// Config
	exportCfg.addEventListener( 'click', exportConfig );
	importCfg.addEventListener( 'click', importConfig );
	resetCfg.addEventListener( 'click', resetConfig );
}


/**
 * Register click event on nav elements.
 */
function registerEventToggleNav() {
	let nav = document.querySelectorAll( 'nav label' );

	for( let i = 0; i < nav.length; i++ ) {
		nav[i].addEventListener( 'click', toggleNav );
	}
}


/**
 * Register for messages from the background process.
 */
function registerForBackgroundMessages() {
	console.debug( '[registerForBackgroundMessages]' );

	// Firefox
	if( typeof browser !== 'undefined' ) {
		browser.runtime.onMessage.addListener( msg => handleBackgroundMessages( { data: msg } ) );
	}
	// Chrome
	else if( typeof chrome !== 'undefined' ) {
		chrome.runtime.onMessage.addListener( handleBackgroundMessages );
	}
}


/**
 * Reset the config back to the default values.
 */
function resetConfig() {
	if( window.confirm( 'Do you really want to reset the config?' ) ) {
		exportConfig();
		sendMessage( { task: BG_TASK.RESET_CONFIG } );
		showMsg(
			[
				'Config has been reset.',
				'There is an export from right before the reset,',
				'that you can still save before reloading the page. Think about it.'
			],
			'info'
		);
	}
}


/**
 * Reset all lists/emotes to the default.
 */
function resetEmotes() {
	if( window.confirm( 'Do you really want to reset all lists and emotes?' ) ) {
		exportEmotes();
		sendMessage( { task: BG_TASK.RESET_EMOTES } );
		showMsg(
			[
				'Lists and emotes have been reset.',
				'There is an export from right before the reset,',
				'that you can still save before reloading the page. Think about it.'
			],
			'info'
		);
	}
}


/**
 * Save emotes to storage.
 * @param {Object} emotes
 */
function saveEmotes( emotes ) {
	sendMessage( { task: BG_TASK.SAVE_EMOTES, emotes: emotes } );
}


/**
 * Get the config value of a changed <input>.
 * @param  {Event}   ev
 * @return {mixed}      String, boolean or integer.
 * @throws {Boolean}    If no valid config value can be extracted.
 */
function saveHandleInput( ev ) {
	let cfgName = ev.target.id;
	let val = null;

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
	let val = getOptionValue( ev.target );

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
	let htmlTag = ev.target.tagName.toLowerCase();
	let cfgName = ev.target.id;
	let val = null;
	let cfg = {};

	switch( htmlTag ) {
		case 'select':
			val = saveHandleSelect( ev );
			break;

		case 'input':
			try {
				val = saveHandleInput( ev );
			}
			catch( _err ) { return; }
			break;
	}

	if( val !== null ) {
		cfg[cfgName] = val;
		sendMessage( { task: BG_TASK.SAVE_CONFIG, config: cfg } );
	}
}


/**
 * Display a message box on the page.
 * @param {Array<String>|String} msg   Message to display.
 * @param {String}               mtype "err" or "info".
 */
function showMsg( msg, mtype ) {
	const msgContainer = document.getElementById( 'msg' );
	msgContainer.innerHTML = '';

	if( typeof msg == 'string' ) {
		msg = [msg];
	}

	for( let i = 0; i < msg.length; i++ ) {
		const p = document.createElement( 'p' );
		p.textContent = msg[i];
		msgContainer.appendChild(p);
	}

	msgContainer.className = mtype;
	msgContainer.parentNode.className = 'show';
	window.setTimeout( hideMsg, OPT_CFG.MSG_TIMEOUT );
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
	// Already done. Happens if options page is still open
	// and another tab triggers loading of config.
	if( OPT_CFG.INIT_DONE ) {
		return;
	}

	console.debug( '[init]' );
	registerForBackgroundMessages();
	loadConfig();
	registerEventToggleNav();
}


/**
 * Second setup phase after receiving the config, emotes and meta data.
 */
function init2() {
	// Already done. Happens if options page is still open
	// and another tab triggers loading of config.
	if( OPT_CFG.INIT_DONE ) {
		return;
	}

	console.debug( '[init2]' );
	registerEventSettingChanged();
	insertMetaData();
	OPT_CFG.INIT_DONE = true;
}


if( document.body ) {
	init();
}
else {
	window.addEventListener( 'DOMContentLoaded', init );
}