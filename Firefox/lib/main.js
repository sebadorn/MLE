// Browser
var BROWSER = {
	CHROME: 1,
	FIREFOX: 2,
	OPERA: 3
};
var I_AM = BROWSER.FIREFOX;
if( typeof opera != "undefined" ) {
	I_AM = BROWSER.OPERA;
}
else if( typeof chrome != "undefined" ) {
	I_AM = BROWSER.CHROME;
}


// Firefox only.
// Include content scripts, handle messaging and add options page.
if( I_AM == BROWSER.FIREFOX ) {

	var self = require( "self" );
	var pageMod = require( "page-mod" );
	var sprefs = require( "simple-prefs" );
	var ss = require( "simple-storage" );
	var tabs = require( "tabs" );

	var csfWebpage = [
			self.data.url( "mle-codes.js" ),
			self.data.url( "my-little-emotebox.js" )
		],
		csfOptionsPage = [
			self.data.url( "mle-codes.js" ),
			self.data.url( "options.js" )
		];


	/**
	 * Every message a page sends gets redirected to the "background",
	 * together with the worker to respond to.
	 * @param {Object} worker
	 */
	function handleOnAttach( worker ) {
		worker.on( "message", function( msg ) {
			handleMessage( msg, worker );
		} );
	}


	// Add content scripts to web pages
	pageMod.PageMod( {
		include: "*",
		attachTo: ["existing", "top"],
		contentScriptWhen: "ready",
		contentScriptFile: csfWebpage,
		onAttach: handleOnAttach
	} );

	// Add scripts to options page. Has to be done this way instead of
	// a parameter for "tabs.open", so the "self" object can be used.
	pageMod.PageMod( {
		include: self.data.url( "options.html" ),
		attachTo: ["existing", "top"],
		contentScriptWhen: "ready",
		contentScriptFile: csfOptionsPage,
		onAttach: handleOnAttach
	} );


	// Open options page when button in addon manager is clicked.
	// @see package.json
	sprefs.on( "optionsPage", function() {
		tabs.open( {
			url: self.data.url( "options.html" )
		} );
	} );


	// mle-codes.js copy
	// Because I don't know how to include "mle-codes.js" so
	// its contents become available here (in Firefox).

	var BG_TASK = {
		LOAD: 1,
		SAVE_CONFIG: 2,
		SAVE_EMOTES: 3,
		RESET_CONFIG: 4,
		RESET_EMOTES: 5
	};

}



// Keys
var PREF = {
	CONFIG: "mle.config",
	EMOTES: "mle.emotes"
};

// Default config
var DEFAULT_CONFIG = {
	boxAlign: "left", // "left" or "right"
	boxWidthMinimized: 70, // [px]
	boxHeight: 330, // [px]
	boxWidth: 650, // [px]
	boxPosTop: 60, // [px]
	boxUnderHeader: true,
	boxAnimationSpeed: 420, // [ms]
	ctxMenu: true,
	adjustForBetterPonymotes: true,
	adjustForGrEmB: false,
	msgAnimationSpeed: 1000, // [ms]
	msgTimeout: 7000 // [ms] // How long a popup message is displayed.
};


// Default emotes of r/mylittlepony.
var DEFAULT_EMOTES = {
	"A": [
		"ajlie", "priceless", "flutterjerk", "flutterroll",
		"twipride", "celestiamad", "twicrazy", "spikemeh",
		"lunateehee", "lunawait", "derpwizard", "abmeh",
		"ajhappy", "pinkiefear", "twibeam", "scootaderp",
		"raritydaww", "scootacheer", "swagintosh", "pinkeawe",
		"ajsup", "flutterwhoa", "rdsad", "silverspoon",
		"ohcomeon", "ppcute", "abbored",
		"raritynews", "sbbook", "scootaplease",
		"twiright", "celestiawut", "grannysmith",
		"shiningarmor", "chrysalis", "cadence"
	],
	"B": [
		"flutterfear", "ppboring", "rarityyell", "fluttershy",
		"ajcower", "ajsly", "eeyup", "rdsmile",
		"fluttersrs", "raritydress", "takealetter", "rdwut",
		"ppshrug", "spikenervous", "noooo", "dj",
		"fluttershh", "flutteryay", "squintyjack", "spikepushy",
		"ajugh", "raritywut", "dumbfabric", "raritywhy",
		"trixiesmug", "flutterwink", "rarityannoyed", "soawesome",
		"ajwut", "twisquint", "raritywhine", "rdcool",
		"abwut", "manspike", "cockatrice", "facehoof",
		"rarityjudge", "rarityprimp", "twirage", "ppseesyou"
	],
	"C": [
		"rdsitting", "rdhappy", "rdannoyed",
		"twismug", "twismile", "twistare",
		"ohhi", "party", "hahaha",
		"flutterblush", "gross", "derpyhappy",
		"ajfrown", "hmmm", "joy",
		"raritysad", "fabulous", "derp",
		"louder", "lunasad", "derpyshock",
		"pinkamina", "loveme", "lunagasp",
		"scootaloo", "celestia", "angel",
		"allmybits", "zecora", "photofinish"
	],
	"E": [
		"fillytgap", "rdhuh", "snails",
		"lyra", "bonbon", "spitfire",
		"cutealoo", "lunahappy", "sptrue",
		"wahaha", "sbstare", "punchdrunk",
		"huhhuh", "absmile", "dealwithit",
		"nmm", "whooves", "rdsalute",
		"octavia", "colgate", "cheerilee",
		"ajbaffle", "abhuh", "thehorror",
		"twiponder", "spikewtf", "awwyeah",
		"e09", "discentia", "macintears"
	]
};

var CURRENT_CONFIG = null;


/**
 * Post an error to the error console.
 * @param  {String} msg
 */
function postError( msg ) {
	if( I_AM == BROWSER.OPERA ) {
	    opera.postError( msg );
	}
	else {
	    console.error( msg );
	}
};


/**
 * Receive message from inline script and answer back.
 * @param {Event} e
 * @param {Object} sender (Chrome and Firefox only)
 * @param {Object} sendResponse (Chrome only)
 */
function handleMessage( e, sender, sendResponse ) {
	var response,
	    data = e.data ? e.data : e;

	// Only handle messages which come with a set task.
	if( !data.task ) {
		postError( "Background process: No task specified." );
		return;
	}

	switch( data.task ) {
		case BG_TASK.LOAD:
			response = loadConfigAndEmotes( { task: data.task }, sender );
			break;

		case BG_TASK.SAVE_EMOTES:
			response = saveToStorage( PREF.EMOTES, data.emotes );
			break;

		case BG_TASK.SAVE_CONFIG:
			data.config = mergeWithConfig( data.config );
			response = saveToStorage( PREF.CONFIG, data.config );
			response.config = data.config;
			break;

		case BG_TASK.RESET_CONFIG:
			saveDefaultToStorage( PREF.CONFIG, DEFAULT_CONFIG );
			break;

		default:
			postError( "Background process: Unknown task given - \"" + data.task + "\"." );
			return;
	}

	// Include received task in response
	response.task = data.task;

	if( I_AM == BROWSER.OPERA ) {
		e.source.postMessage( response );
	}
	else if( I_AM == BROWSER.FIREFOX ) {
		sender.postMessage( response );
	}
};


/**
 * Merge the config obj with the current config.
 * So only changes are overwritten and all other values are preserved.
 * Unknown config keys in obj will be removed!
 * @param  {Object} obj
 * @return {Object}
 */
function mergeWithConfig( obj ) {
	var key, obj_new = {};

	if( CURRENT_CONFIG == null ) {
		loadConfigAndEmotes();
	}

	// Remove unknown config keys
	for( key in obj ) {
		if( CURRENT_CONFIG.hasOwnProperty( key ) ) {
			obj_new[key] = obj[key];
		}
	}

	// Add missing config keys
	for( key in CURRENT_CONFIG ) {
		if( !obj_new.hasOwnProperty( key ) ) {
			obj_new[key] = CURRENT_CONFIG[key];
		}
	}

	return obj_new;
};


/**
 * Save to the extension storage.
 * @param  {int} key Key to save the object under.
 * @param  {Object} obj Object to save.
 * @return {Object} Contains key "success" with a bool value.
 */
function saveToStorage( key, obj ) {
	var obj_json;

	if( obj == null ) {
		return { success: false };
	}

	try {
		obj_json = JSON.stringify( obj );
	}
	catch( err ) {
		postError( "Background process: Could not stringify in order to save." );
		postError( err );
		return { success: false };
	}

	if( I_AM == BROWSER.OPERA ) {
		widget.preferences[key] = obj_json;
	}
	else if( I_AM == BROWSER.CHROME ) {
		var saveObj = {};

		saveObj[key] = obj_json;
		chrome.storage.sync.set( saveObj );
	}
	else if( I_AM == BROWSER.FIREFOX ) {
		ss.storage[key] = obj_json;
	}

	return { success: true };
};


/**
 * Load config and emotes in Opera.
 * @param {Object} response Response object that will get send to the content script later.
 * @return {Object} response
 */
function loadCaEOpera( response ) {
	var wpref = widget.preferences;
	var load_config, load_emotes;

	load_config = wpref[PREF.CONFIG] ? JSON.parse( wpref[PREF.CONFIG] ) : saveDefaultToStorage( PREF.CONFIG, DEFAULT_CONFIG );
	load_emotes = wpref[PREF.EMOTES] ? JSON.parse( wpref[PREF.EMOTES] ) : saveDefaultToStorage( PREF.EMOTES, DEFAULT_EMOTES );

	CURRENT_CONFIG = load_config;

	response.config = load_config;
	response.emotes = load_emotes;

	return response;
};


/**
 * Load config and emotes in Chrome.
 * @param {Object} response Response object that will get send to the content script.
 * @param {Object} sender Sender of message. Used to send response. (Chrome only)
 */
function loadCaEChrome( response, sender ) {
	chrome.storage.sync.get( [PREF.CONFIG, PREF.EMOTES], function( items ) {
		var lc = !items[PREF.CONFIG] ? saveDefaultToStorage( PREF.CONFIG, DEFAULT_CONFIG ) : JSON.parse( items[PREF.CONFIG] );
		var le = !items[PREF.EMOTES] ? saveDefaultToStorage( PREF.EMOTES, DEFAULT_EMOTES ) : JSON.parse( items[PREF.EMOTES] );

		CURRENT_CONFIG = lc;

		response.config = lc;
		response.emotes = le;

		// Send loaded items to the tab that sent the request.
		chrome.tabs.getSelected( null, function( tab ) {
			chrome.tabs.sendMessage( sender.tab.id, response, handleMessage );
		} );
	} );
};


/**
 * Load config and emotes in Firefox.
 * @param {Object} response Response object that will get send to the content script later.
 * @return {Object} response
 */
function loadCaEFirefox( response ) {
	var lc = ss.storage[PREF.CONFIG] ? JSON.parse( ss.storage[PREF.CONFIG] ) : saveDefaultToStorage( PREF.CONFIG, DEFAULT_CONFIG );
	var le = ss.storage[PREF.EMOTES] ? JSON.parse( ss.storage[PREF.EMOTES] ) : saveDefaultToStorage( PREF.EMOTES, DEFAULT_EMOTES );

	CURRENT_CONFIG = lc;

	response.config = lc;
	response.emotes = le;

	return response;
};


/**
 * Load the configuration and lists/emotes from the extension storage.
 * @param {Object} response Part of the response object to send. Contains the task value.
 * @param {Object} sender Sender of message. Used to send response. (Chrome and Firefox only)
 * @return {Object} Response with the loaded config and emotes.
 */
function loadConfigAndEmotes( response, sender ) {
	try {
		if( I_AM == BROWSER.OPERA ) {
			response = loadCaEOpera( response );
		}
		else if( I_AM == BROWSER.CHROME ) {
			loadCaEChrome( response, sender );
		}
		else if( I_AM == BROWSER.FIREFOX ) {
			response = loadCaEFirefox( response );
		}
		else {
			throw {
				name: "Browser Error",
				message: "Unknown browser. Don't know how to load from storage."
			};
		}
	}
	catch( err ) {
		postError( "Background process: Could not load preferences." );
		postError( err );
	}

	return response;
};


/**
 * Save a default value to the extension storage.
 * @param  {int} key Key to save the object under.
 * @param  {Object} obj Default value to save.
 * @return {Object} Default value. Same as parameter "obj".
 */
function saveDefaultToStorage( key, obj ) {
	var r = saveToStorage( key, obj );
	var msg = r.success
			? "Background process: \"" + key + "\" not in extension preferences yet. Created default."
			: "Background process: Could not save default value.";

	postError( msg );

	return obj;
};


// Opera
if( I_AM == BROWSER.OPERA ) {
	opera.extension.onmessage = handleMessage;
}
// Chrome
else if( I_AM == BROWSER.CHROME ) {
	chrome.extension.onMessage.addListener( handleMessage );
}
// Firefox
// Handled at begin of this file in "handleOnAttach( worker )".