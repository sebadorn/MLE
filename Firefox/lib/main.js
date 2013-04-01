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

	var workers = [];

	var csfWebpage = [
	    	self.data.url( "mle-codes.js" ),
	    	self.data.url( "my-little-emotebox.js" )
	    ],
	    csfOptionsPage = [
	    	self.data.url( "mle-codes.js" ),
	    	self.data.url( "options.js" )
	    ];


	/**
	 * Forget a worker that has been detached.
	 * @param {Object} worker Detached worker.
	 */
	function forgetWorker( worker ) {
		var idx = workers.indexOf( worker );

		if( idx >= 0 ) {
			workers.splice( idx, 1 );
		}
	};


	/**
	 * Every message a page sends gets redirected to the "background",
	 * together with the worker to respond to.
	 * @param {Object} worker
	 */
	function handleOnAttach( worker ) {
		workers.push( worker );
		worker.on( "message", function( msg ) {
			handleMessage( msg, worker );
		} );
		worker.on( "detach", function() {
			forgetWorker( this );
		} );
	};


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
		RESET_EMOTES: 5,
		OPEN_OPTIONS: 6,
		UPDATE_EMOTES: 7,
		UPDATE_LIST_ORDER: 8,
		UPDATE_LIST_NAME: 9,
		UPDATE_LIST_DELETE: 10,
		UPDATE_CSS: 11
	};

}



// Keys
var PREF = {
	CONFIG: "mle.config",
	EMOTES: "mle.emotes",
	SUBREDDIT_CSS: "mle.subreddit.css",
	SUBREDDIT_EMOTES: "mle.subreddit.emotes"
};

// Default config
var DEFAULT_CONFIG = {
	addBlankAfterInsert: true,
	adjustForBetterPonymotes: true,
	adjustForGrEmB: false,
	boxAlign: "left", // "left" or "right"
	boxAnimationSpeed: 420, // [ms]
	boxBgColor: "#f4f4f4", // CSS valid color, examples: "#f6f6f6", "rgba(20,20,20,0.6)"
	boxEmoteBorder: "#ffffff", // CSS valid color
	boxHeight: 330, // [px]
	boxLabelMinimized: "Emotes",
	boxPosTop: 60, // [px]
	boxPosX: 5, // [px]
	boxScrollbar: "left", // "left" or "right"
	boxTrigger: "button", // "float" or "button"
	boxWidth: 650, // [px]
	boxWidthMinimized: 70, // [px]
	boxUnderHeader: true,
	ctxMenu: true,
	msgAnimationSpeed: 1000, // [ms]
	msgPosition: "top", // "top" or "bottom"
	msgTimeout: 7000 // [ms] // How long a popup message is displayed.
};


// Default emotes of r/mylittlepony.
var DEFAULT_EMOTES = {
	"A": [
		"twipride", "twicrazy", "twiright", "twibeam", "spikemeh",
		"celestiawut", "celestiamad", "lunateehee", "lunawait", "derpwizard",
		"pinkiefear", "ppcute", "pinkieawe", "ajhappy", "ajsup",
		"ajlie", "abbored", "abmeh", "swagintosh", "grannysmith",
		"flutterwhoa", "flutterroll", "flutterjerk", "rdcry", "scootaderp",
		"scootaplease", "scootacheer", "ohcomeon", "sbbook", "raritynews",
		"raritydaww", "shiningarmor", "cadence", "chrysalis", "priceless",
		"silverspoon", "rarityreally", "applegasp", "rarishock", "applederp"
	],
	"B": [
		"ppseesyou", "ppshrug", "ppboring", "rdcool", "rdsmile",
		"soawesome", "rdwut", "squintyjack", "ajsly", "ajcower",
		"ajugh", "ajwut", "abwut", "eeyup", "fluttershh",
		"fluttershy", "fluttersrs", "flutterfear", "flutterwink", "flutteryay",
		"spikenervous", "takealetter", "noooo", "spikepushy", "manspike",
		"facehoof", "twisquint", "twirage", "dumbfabric", "rarityyell",
		"raritywhine", "raritydress", "rarityannoyed", "raritywut", "raritywhy",
		"rarityjudge", "rarityprimp", "trixiesmug", "dj", "cockatrice"
	],
	"C": [
		"rdsitting", "rdhappy", "rdannoyed", "gross", "louder",
		"twistare", "twismug", "twismile", "ohhi", "party",
		"hahaha", "joy", "pinkamina", "ajfrown", "hmmm",
		"raritysad", "fabulous", "derpyhappy", "derp", "derpyshock",
		"flutterblush", "loveme", "lunasad", "lunagasp", "celestia",
		"scootaloo", "angel", "allmybits", "zecora", "photofinish",
		"trixiesad", "changeling", "rdscared", "twidaw", "whattheflut"
	],
	"E": [
		"fillytgap", "rdhuh", "rdsalute", "awwyeah", "twiponder",
		"spikewtf", "huhhuh", "wahaha", "sbstare", "cutealoo",
		"ajbaffle", "absmile", "abhuh", "macintears", "lyra",
		"bonbon", "spitfire", "lunahappy", "sotrue", "nmm",
		"punchdrunk", "whooves", "octavia", "colgate", "cheerilee",
		"thehorror", "gilda", "snails", "dealwithit", "discentia"
	]
};

var CURRENT_CONFIG = null,
    CURRENT_EMOTES = null;


/**
 * Browser "class" for Opera.
 * @type {Object}
 */
var BrowserOpera = {

	/**
	 * Save to extension storage.
	 * @param {String} key
	 * @param {String} val String as JSON.
	 */
	save: function( key, val ) {
		widget.preferences[key] = val;
	},

	/**
	 * Load config and emotes in Opera.
	 * @param  {Object} response Response object that will get send to the content script later.
	 * @return {Object} response
	 */
	loadConfigAndEmotes: function( response, sender ) {
		var wpref = widget.preferences;

		CURRENT_CONFIG = wpref[PREF.CONFIG] ? JSON.parse( wpref[PREF.CONFIG] ) : saveDefaultToStorage( PREF.CONFIG, DEFAULT_CONFIG );
		CURRENT_EMOTES = wpref[PREF.EMOTES] ? JSON.parse( wpref[PREF.EMOTES] ) : saveDefaultToStorage( PREF.EMOTES, DEFAULT_EMOTES );

		updateConfig( CURRENT_CONFIG );

		response.config = CURRENT_CONFIG;
		response.emotes = CURRENT_EMOTES;

		return response;
	},

	/**
	 * Open the options page.
	 */
	openOptions: function() {
		opera.extension.tabs.create( {
			url: "options.html",
			focused: true
		} );
	},

	/**
	 * Broadcast a message to everything extension related.
	 * @param {Object} msg
	 */
	broadcast: function( msg ) {
		opera.extension.broadcastMessage( msg );
	},

	/**
	 * Send a response to a page that previously send a message.
	 * @param {Object} source
	 * @param {Object} msg
	 */
	respond: function( source, msg ) {
		source.postMessage( msg );
	},

	/**
	 * Post an error to the error console.
	 * @param {String} msg
	 */
	logError: function( msg ) {
		opera.postError( msg );
	},

	/**
	 * Extend the normal context menu with the context menu API.
	 */
	registerContextMenu: function() {
		var menu = opera.contexts.menu;
		var itemPropsLine = {
				contexts: ["link"],
				targetURLPatterns: [
					"http://*.reddit.com/*",
					"https://*.reddit.com/*",
					"http://reddit.com/*",
					"https://reddit.com/*"
				],
				type: "line"
			},
			itemPropsFolder = {
				contexts: ["link"],
				// Really limited, so the menu item will show up on a lot of links,
				// that aren't emotes. RegExp would be nice, but '*' is the only wildcard.
				targetURLPatterns: [
					"http://*.reddit.com/*",
					"https://*.reddit.com/*",
					"http://reddit.com/*",
					"https://reddit.com/*"
				],
				title: "My Little Emotebox",
				type: "folder"
			};
		var itemLine = menu.createItem( itemPropsLine ),
		    itemFolder = menu.createItem( itemPropsFolder );

		menu.addItem( itemLine );
		//menu.addItem( itemFolder );
	},

	/**
	 * Register a function to handle messaging between pages.
	 * @param {function} handler
	 */
	registerMessageHandler: function( handler ) {
		opera.extension.onmessage = handler;
	}

};


/**
 * Browser "class" for Chrome.
 * @type {Object}
 */
var BrowserChrome = {

	tabs: [],

	/**
	 * Save to extension storage.
	 * @param {String} key
	 * @param {String} val String as JSON.
	 */
	save: function( key, val ) {
		var saveObj = {};
		saveObj[key] = val;
		chrome.storage.local.set( saveObj );
	},

	/**
	 * Called when a tab is closed.
	 * A CHROME ONLY FUNCTION.
	 * @param {int}    tabId ID of the removed tab.
	 * @param {Object} info
	 */
	onTabRemove: function( tabId, info ) {
		var idx = this.tabs.indexOf( tabId );

		if( idx >= 0 ) {
			this.tabs.splice( idx, 1 );
		}
	},

	/**
	 * Load config and emotes in Chrome.
	 * @param  {Object} response Response object that will get send to the content script.
	 * @param  {Object} sender Sender of message. Used to send response. (Chrome only)
	 * @return {Object} response
	 */
	loadConfigAndEmotes: function( response, sender ) {
		this.tabs.push( sender.tab.id );
		chrome.tabs.onRemoved.addListener( this.onTabRemove.bind( this ) );

		chrome.storage.local.get( [PREF.CONFIG, PREF.EMOTES], function( items ) {
			CURRENT_CONFIG = !items[PREF.CONFIG] ? saveDefaultToStorage( PREF.CONFIG, DEFAULT_CONFIG ) : JSON.parse( items[PREF.CONFIG] );
			CURRENT_EMOTES = !items[PREF.EMOTES] ? saveDefaultToStorage( PREF.EMOTES, DEFAULT_EMOTES ) : JSON.parse( items[PREF.EMOTES] );

			updateConfig( CURRENT_CONFIG );

			response.config = CURRENT_CONFIG;
			response.emotes = CURRENT_EMOTES;

			// Send loaded items to the tab that sent the request.
			if( sender ) {
				chrome.tabs.sendMessage( sender.tab.id, response, handleMessage );
			}
		} );

		return response;
	},

	/**
	 * Open the options page.
	 */
	openOptions: function() {
		chrome.tabs.create( {
			url: chrome.extension.getURL( "options.html" ),
			active: true
		} );
	},

	/**
	 * Broadcast a message to everything extension related.
	 * @param {Object} msg
	 */
	broadcast: function( msg ) {
		for( var i = 0; i < this.tabs.length; i++ ) {
			chrome.tabs.sendMessage( this.tabs[i], msg, handleMessage );
		}
	},

	/**
	 * Send a response to a page that previously send a message.
	 * THIS IS JUST A DUMMY FUNCTION.
	 * @see   BrowserChrome.loadConfigAndEmotes()
	 * @param {Object} source
	 * @param {Object} msg
	 */
	respond: function( source, msg ) {
		// pass
	},

	/**
	 * Post an error to the error console.
	 * @param {String} msg
	 */
	logError: function( msg ) {
		console.error( msg );
	},

	/**
	 * Register a function to handle messaging between pages.
	 * @param {function} handler
	 */
	registerMessageHandler: function( handler ) {
		chrome.extension.onMessage.addListener( handler );
	}

};


/**
 * Browser "class" for Firefox.
 * @type {Object}
 */
var BrowserFirefox = {

	/**
	 * Save to extension storage.
	 * @param {String} key
	 * @param {String} val String as JSON.
	 */
	save: function( key, val ) {
		ss.storage[key] = val;
	},

	/**
	 * Load config and emotes in Firefox.
	 * @param  {Object} response Response object that will get send to the content script later.
	 * @return {Object} response
	 */
	loadConfigAndEmotes: function( response, sender ) {
		CURRENT_CONFIG = ss.storage[PREF.CONFIG] ? JSON.parse( ss.storage[PREF.CONFIG] ) : saveDefaultToStorage( PREF.CONFIG, DEFAULT_CONFIG );
		CURRENT_EMOTES = ss.storage[PREF.EMOTES] ? JSON.parse( ss.storage[PREF.EMOTES] ) : saveDefaultToStorage( PREF.EMOTES, DEFAULT_EMOTES );

		updateConfig( CURRENT_CONFIG );

		response.config = CURRENT_CONFIG;
		response.emotes = CURRENT_EMOTES;

		return response;
	},

	/**
	 * Open the options page.
	 */
	openOptions: function() {
		tabs.open( {
			url: self.data.url( "options.html" )
		} );
	},

	/**
	 * Broadcast a message to everything extension related.
	 * @param {Object} msg
	 */
	broadcast: function( msg ) {
		for( var i = 0; i < workers.length; i++ ) {
			try {
				workers[i].postMessage( msg );
			}
			catch( err ) {
				forgetWorker( workers[i] );
			}
		}
	},

	/**
	 * Send a response to a page that previously send a message.
	 * @param {Object} source
	 * @param {Object} msg
	 */
	respond: function( source, msg ) {
		source.postMessage( msg );
	},

	/**
	 * Post an error to the error console.
	 * @param  {String} msg
	 */
	logError: function( msg ) {
		console.error( msg );
	},

	/**
	 * Register a function to handle messaging between pages.
	 * THIS IS JUST A DUMMY FUNCTION.
	 * @see   handleOnAttach()
	 * @param {function} handler
	 */
	registerMessageHandler: function( handler ) {
		// pass
	}

};


// Assign correct browser "class".
var MyBrowser = null;

switch( I_AM ) {
	case BROWSER.OPERA:
		MyBrowser = BrowserOpera;
		BrowserChrome = null;
		BrowserFirefox = null;
		break;

	case BROWSER.CHROME:
		MyBrowser = BrowserChrome;
		BrowserOpera = null;
		BrowserFirefox = null;
		break;

	case BROWSER.FIREFOX:
		MyBrowser = BrowserFirefox;
		BrowserOpera = null;
		BrowserChrome = null;
		break;
}



/**
 * Getting the sub-reddit CSS and extracting the emotes.
 * @type {Object}
 */
var Updater = {


	// Config
	xhrAsyn: true,
	xhrMethod: "GET",
	xhrTargets: ["r/mylittlepony", "r/mlplounge"],
	xhrUserAgent: "My Little Emotebox v2.3-dev by /u/meinstuhlknarrt",

	xhrCurrentTarget: null,
	xhrProgress: 0,

	tableCodeRegex: /^[abce][0-9]{2}$/i,

	emoteCSS: {},
	emotes: {},


	/**
	 * Get the sub-reddit stylesheet per XHR.
	 */
	getCSS: function() {
		if( this.xhrProgress >= this.xhrTargets.length ) {
			saveToStorage( PREF.SUBREDDIT_CSS, this.emoteCSS );
			saveToStorage( PREF.SUBREDDIT_EMOTES, this.emotes );

			this.emoteCSS = {};
			this.emotes = {};
			this.xhrProgress = 0;

			return;
		}

 		this.xhrCurrentTarget = this.xhrTargets[this.xhrProgress];
 		this.emoteCSS[this.xhrCurrentTarget] = [];
		this.emotes[this.xhrCurrentTarget] = [];
		this.xhrProgress++;

		var xhr = new XMLHttpRequest(),
		    url = "http://www.reddit.com/" + this.xhrCurrentTarget + "/stylesheet";

		xhr.open( this.xhrMethod, url, this.xhrAsync );
		xhr.setRequestHeader( "User-Agent", this.xhrUserAgent );
		xhr.onreadystatechange = this.handleCSS.bind( xhr );
		xhr.send();
	},


	/**
	 * After receiving the stylesheet, start extracting the emotes.
	 */
	handleCSS: function() {
		if( this.readyState == 4 ) {
			Updater.extractEmotesStep1( this.responseText );
			Updater.extractEmotesStep2();
			Updater.removeReverseEmotes();
			Updater.groupSameEmotes();

			// Get next sub-reddit CSS
			Updater.getCSS();
		}
	},


	/**
	 * Extract the for emotes relevant parts from the stylesheet.
	 * Then extract from those the emote names.
	 * @param  {String} css Stylesheet.
	 * @return {Object}     Emotes ordered by table.
	 */
	extractEmotesStep1: function( css ) {
		var needle = "background-image",
		    selectors = [],
		    emoteCSS = [];
		var idx, selector, eCSS, record;

		while( true ) {
			idx = css.indexOf( needle );

			if( idx < 0 ) {
				break;
			}

			selector = [];
			eCSS = [];
			record = false;

			// Get the selectors
			for( var i = idx; i > 0; i-- ) {
				if( css[i] == "}" ) {
					break;
				}
				if( record ) {
					selector[selector.length] = css[i];
				}
				if( css[i] == "{" ) {
					record = true;
				}

				eCSS[eCSS.length] = css[i];
			}

			// Get the whole CSS part
			eCSS = eCSS.reverse();

			for( var i = idx + 1; i < css.length; i++ ) {
				eCSS[eCSS.length] = css[i];

				if( css[i] == "}" ) {
					break;
				}
			}

			selectors[selectors.length] = selector.reverse().join( "" );
			emoteCSS[emoteCSS.length] = eCSS.join( "" );
			css = css.substr( idx + needle.length );
		}

		this.emotes[this.xhrCurrentTarget] = selectors;
		this.emoteCSS[this.xhrCurrentTarget] = emoteCSS;
	},


	/**
	 * Extract the emote names.
	 */
	extractEmotesStep2: function() {
		var emotesCurrent = this.emotes[this.xhrCurrentTarget];
		var linkStart = 'a[href|="/',
		    emotes = [],
		    css = [],
		    idx = -1;
		var selector, emote, subEmoteList;

		for( var i = 0; i < emotesCurrent.length; i++ ) {
			selector = emotesCurrent[i].split( "," );
			subEmoteList = [];

			for( var j = 0; j < selector.length; j++ ) {
				emote = selector[j].trim();
				idx = emote.indexOf( linkStart );

				if( idx == -1 ) {
					continue;
				}

				emote = emote.substring( idx + linkStart.length, emote.length - 2 );
				// "dance" emotes from the Plounge
				// ":hov", because we already removed the last two characters
				emote = emote.replace( '"]:hov', '' );

				if( emotes.indexOf( emote ) == -1 ) {
					subEmoteList[subEmoteList.length] = emote;
				}
			}

			// Emotes were found
			if( idx >= 0) {
				css[css.length] = this.emoteCSS[this.xhrCurrentTarget][i];
				emotes[emotes.length] = subEmoteList;
			}
		}

		this.emotes[this.xhrCurrentTarget] = emotes;
		this.emoteCSS[this.xhrCurrentTarget] = css;
	},


	/**
	 * Group emotes that show the same image but have different names.
	 * This is kind of unstable since it depends on the CSS authors' style not to change.
	 */
	groupSameEmotes: function() {
		var emotesCurrent = this.emotes[this.xhrCurrentTarget];
		var newEmoteList = [],
		    nonTableEmotes = [];
		var newEmoteSubList, group, isTableCode;

		for( var i = 0; i < emotesCurrent.length; i++ ) {
			newEmoteSubList = [];
			group = [];

			for( var j = 0; j < emotesCurrent[i].length; j++ ) {
				group.push( emotesCurrent[i][j] );
				isTableCode = ( emotesCurrent[i][j].match( this.tableCodeRegex ) != null );

				// Start new group if table code has been reached.
				if( isTableCode ) {
					newEmoteSubList.push( group );
					group = [];
				}
			}

			if( group.length > 0 ) {
				nonTableEmotes = nonTableEmotes.concat( group );
			}
			if( newEmoteSubList.length > 0 ) {
				newEmoteList.push( newEmoteSubList );
			}
		}

		if( nonTableEmotes.length > 0 ) {
			newEmoteList.push( nonTableEmotes );
		}
		this.emotes[this.xhrCurrentTarget] = newEmoteList;
	},


	/**
	 * Remove the emotes which are simply mirrored versions of others.
	 */
	removeReverseEmotes: function() {
		var emotesCurrent = this.emotes[this.xhrCurrentTarget];
		var flatCopy = [],
		    newEmoteList = [];
		var emote, idx;

		// Create a flat copy of the emotes for easier searching.
		for( var i = 0; i < emotesCurrent.length; i++ ) {
			flatCopy = flatCopy.concat( emotesCurrent[i] );
		}

		// Create a new (not flat) emote list with only non-reversed emotes.
		for( var i = 0; i < emotesCurrent.length; i++ ) {
			newEmoteList[i] = [];

			for( var j = 0; j < emotesCurrent[i].length; j++ ) {
				emote = emotesCurrent[i][j];

				if( emote[0] != "r" || flatCopy.indexOf( emote.substr( 1 ) ) == -1 ) {
					newEmoteList[i].push( emote );
				}
			}
		}

		// Save the new emote list and fitler out now empty sub-lists.
		this.emotes[this.xhrCurrentTarget] = [];

		for( var i = 0; i < newEmoteList.length; i++ ) {
			if( newEmoteList[i].length > 0 ) {
				this.emotes[this.xhrCurrentTarget].push( newEmoteList[i].slice( 0 ) );
			}
		}
	}


};



/**
 * Receive message from inline script and answer back.
 * @param {Event} e
 * @param {Object} sender (Chrome and Firefox only)
 * @param {Object} sendResponse (Chrome only)
 */
function handleMessage( e, sender, sendResponse ) {
	var response = {},
	    data = e.data ? e.data : e,
	    source = sender ? sender : e.source,
	    broadcast = false;

	// Only handle messages which come with a set task.
	if( !data.task ) {
		MyBrowser.logError( "Background process: No task specified." );
		return;
	}

	switch( data.task ) {
		case BG_TASK.UPDATE_EMOTES:
			mergeEmotesWithUpdate( data.update );
			response = saveToStorage( PREF.EMOTES, CURRENT_EMOTES );

			response.update = data.update;
			broadcast = true;
			break;

		case BG_TASK.UPDATE_LIST_ORDER:
			CURRENT_EMOTES = data.update;
			saveToStorage( PREF.EMOTES, data.update );

			response.update = data.update;
			broadcast = true;
			break;

		case BG_TASK.UPDATE_LIST_NAME:
			var u = data.update;

			changeListName( u.oldName, u.newName );
			saveToStorage( PREF.EMOTES, CURRENT_EMOTES );

			response.update = u;
			broadcast = true;
			break;

		case BG_TASK.UPDATE_LIST_DELETE:
			delete CURRENT_EMOTES[data.update.deleteList];
			saveToStorage( PREF.EMOTES, CURRENT_EMOTES );

			response.deleteList = data.update.deleteList;
			broadcast = true;
			break;

		case BG_TASK.LOAD:
			response = loadConfigAndEmotes( { task: data.task }, source );
			break;

		case BG_TASK.SAVE_EMOTES:
			response = saveToStorage( PREF.EMOTES, data.emotes );
			break;

		case BG_TASK.SAVE_CONFIG:
			var config = data.config || data.update;

			CURRENT_CONFIG = mergeWithConfig( config );
			response = saveToStorage( PREF.CONFIG, CURRENT_CONFIG );

			response.config = CURRENT_CONFIG;
			break;

		case BG_TASK.RESET_CONFIG:
			saveDefaultToStorage( PREF.CONFIG, DEFAULT_CONFIG );
			break;

		case BG_TASK.RESET_EMOTES:
			saveDefaultToStorage( PREF.EMOTES, DEFAULT_EMOTES );
			break;

		case BG_TASK.OPEN_OPTIONS:
			MyBrowser.openOptions();
			break;

		case BG_TASK.UPDATE_CSS:
			Updater.getCSS();
			break;

		default:
			MyBrowser.logError( "Background process: Unknown task given - \"" + data.task + "\"." );
			return;
	}

	response.task = data.task;

	if( broadcast ) {
		MyBrowser.broadcast( response );
	}
	else {
		MyBrowser.respond( source, response );
	}
};


/**
 * Change the name of a list while keeping the order.
 * @param {String} oldName Current name of the list.
 * @param {String} newName New name for the list.
 */
function changeListName( oldName, newName ) {
	var emotesNew = {};

	for( var key in CURRENT_EMOTES ) {
		if( key == oldName ) {
			emotesNew[newName] = CURRENT_EMOTES[key];
		}
		else {
			emotesNew[key] = CURRENT_EMOTES[key];
		}
	}

	CURRENT_EMOTES = emotesNew;
};


/**
 * Merge the currently loaded emotes with the update.
 * @param  {Object} emotes  Changed lists with their emotes.
 * @return {Object} Updated emote lists.
 */
function mergeEmotesWithUpdate( emotes ) {
	for( var key in emotes ) {
		CURRENT_EMOTES[key] = emotes[key];
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
		loadConfigAndEmotes( {} ); // This part may cause trouble in Chrome for some use cases.
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
 * Update the currently stored config in case of newly added options.
 * @param  {Object} current_config The config as it is currently stored (not JSON).
 * @return {Object} The updated config.
 */
function updateConfig( current_config ) {
	for( var key in DEFAULT_CONFIG ) {
		if( !current_config.hasOwnProperty( key ) ) {
			current_config[key] = DEFAULT_CONFIG[key];
		}
	}
	saveToStorage( PREF.CONFIG, current_config );

	return current_config;
};


/**
 * Save to the extension storage.
 * @param  {int}    key Key to save the object under.
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
		MyBrowser.logError( err );
		return { success: false };
	}

	MyBrowser.save( key, obj_json );

	return { success: true };
};


/**
 * Load the configuration and lists/emotes from the extension storage.
 * @param  {Object} response Part of the response object to send. Contains the task value.
 * @param  {Object} sender Sender of message. Used to send response. (Chrome and Firefox only)
 * @return {Object} Response with the loaded config and emotes.
 */
function loadConfigAndEmotes( response, sender ) {
	if( !response ) {
		response = {};
	}

	try {
		response = MyBrowser.loadConfigAndEmotes( response, sender );
	}
	catch( err ) {
		MyBrowser.logError( "Background process: Could not load preferences." );
		MyBrowser.logError( err );
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

	MyBrowser.logError( msg );

	return obj;
};


MyBrowser.registerMessageHandler( handleMessage );
// MyBrowser.registerContextMenu();
