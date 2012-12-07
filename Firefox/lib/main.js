var self = require( "self" );
var pageMod = require( "page-mod" );
var pageWorker = require( "page-worker" );

var myContentScriptFiles = [
		self.data.url( "mle-codes.js" ),
		self.data.url( "my-little-emotebox.js" )
	];


pageMod.PageMod( {
	include: "*",
	attachTo: ["existing", "top"],
	contentScriptWhen: "ready",
	contentScriptFile: myContentScriptFiles,
	onAttach: function( worker ) {
		worker.on( "message", function( msg ) { handleMessage( msg, worker ); } );
	}
} );



// mle-codes.js copy

var BG_TASK = {
	LOAD: 1,
	SAVE_CONFIG: 2,
	SAVE_EMOTES: 3,
	RESET_CONFIG: 4,
	RESET_EMOTES: 5
};



// background.js copy, modified only for Firefox

var ss = require( "simple-storage" );


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
    console.error( msg );
};


/**
 * Receive message from inline script and answer back.
 * @param {Event} e
 * @param {Object} worker Content script file that sent the message.
 */
function handleMessage( e, worker ) {
	var response,
	    data = e;

	// Only handle messages which come with a set task.
	if( !data.task ) {
		postError( "Background process: No task specified." );
		return;
	}

	switch( data.task ) {

		case BG_TASK.LOAD:
			response = loadConfigAndEmotes();
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

	worker.postMessage( response );
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

	ss.storage[key] = obj_json;

	return { success: true };
};


/**
 * Load the configuration and lists/emotes from the extension storage.
 * @return {Object}
 */
function loadConfigAndEmotes() {
	var load_config,
	    load_emotes;

	try {
		load_config = ss.storage[PREF.CONFIG] ? JSON.parse( ss.storage[PREF.CONFIG] ) : saveDefaultToStorage( PREF.CONFIG, DEFAULT_CONFIG );
		load_emotes = ss.storage[PREF.EMOTES] ? JSON.parse( ss.storage[PREF.EMOTES] ) : saveDefaultToStorage( PREF.EMOTES, DEFAULT_EMOTES );
	}
	catch( err ) {
		postError( "Background process: Could not parse preferences as JSON." );
		postError( err );
		return null;
	}

	CURRENT_CONFIG = load_config;

	return {
		config: load_config,
		emotes: load_emotes
	};
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