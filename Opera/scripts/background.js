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
	META: "mle.meta",
	SUBREDDIT_CSS: "mle.subreddit.css",
	SUBREDDIT_EMOTES: "mle.subreddit.emotes"
};


var DEFAULT_SUB_CSS = {},
    DEFAULT_SUB_EMOTES = {};


// Information that the user won't need to backup
var DEFAULT_META = {
	lastSubredditCheck: 0
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
	displayEmotesOutOfSub: true,
	injectEmoteCSS: true,
	intervalToCheckCSS: 28800000, // [ms] // Default is 8 hours.
	msgAnimationSpeed: 1000, // [ms]
	msgPosition: "top", // "top" or "bottom"
	msgTimeout: 7000 // [ms] // How long a popup message is displayed.
};


// Default emotes of r/mylittlepony
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
    CURRENT_EMOTES = null,
    META = null;



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

		CURRENT_CONFIG = wpref[PREF.CONFIG]
				? JSON.parse( wpref[PREF.CONFIG] )
				: saveDefaultToStorage( PREF.CONFIG, DEFAULT_CONFIG );

		CURRENT_EMOTES = wpref[PREF.EMOTES]
				? JSON.parse( wpref[PREF.EMOTES] )
				: saveDefaultToStorage( PREF.EMOTES, DEFAULT_EMOTES );

		META = wpref[PREF.META]
				? JSON.parse( wpref[PREF.META] )
				: saveDefaultToStorage( PREF.META, DEFAULT_META );

		updateObject( CURRENT_CONFIG, DEFAULT_CONFIG, PREF.CONFIG );
		updateObject( META, DEFAULT_META, PREF.META );

		response.config = CURRENT_CONFIG;
		response.emotes = CURRENT_EMOTES;

		response.sub_css = wpref[PREF.SUBREDDIT_CSS]
				? JSON.parse( wpref[PREF.SUBREDDIT_CSS] )
				: saveDefaultToStorage( PREF.SUBREDDIT_CSS, DEFAULT_SUB_CSS );

		response.sub_emotes = wpref[PREF.SUBREDDIT_EMOTES]
				? JSON.parse( wpref[PREF.SUBREDDIT_EMOTES] )
				: saveDefaultToStorage( PREF.SUBREDDIT_EMOTES, DEFAULT_SUB_EMOTES );

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
			CURRENT_CONFIG = !items[PREF.CONFIG]
					? saveDefaultToStorage( PREF.CONFIG, DEFAULT_CONFIG )
					: JSON.parse( items[PREF.CONFIG] );

			CURRENT_EMOTES = !items[PREF.EMOTES]
					? saveDefaultToStorage( PREF.EMOTES, DEFAULT_EMOTES )
					: JSON.parse( items[PREF.EMOTES] );

			META = !items[PREF.META]
					? saveDefaultToStorage( PREF.META, DEFAULT_META )
					: JSON.parse( items[PREF.META] );

			updateObject( CURRENT_CONFIG, DEFAULT_CONFIG, PREF.CONFIG );
			updateObject( META, DEFAULT_META, PREF.META );

			response.config = CURRENT_CONFIG;
			response.emotes = CURRENT_EMOTES;

			response.sub_css = !items[PREF.SUBREDDIT_CSS]
					? saveDefaultToStorage( PREF.SUBREDDIT_CSS, DEFAULT_SUB_CSS )
					: JSON.parse( items[PREF.SUBREDDIT_CSS] );

			response.sub_emotes = !items[PREF.SUBREDDIT_EMOTES]
					? saveDefaultToStorage( PREF.SUBREDDIT_EMOTES, DEFAULT_SUB_EMOTES )
					: JSON.parse( items[PREF.SUBREDDIT_EMOTES] );

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
		CURRENT_CONFIG = ss.storage[PREF.CONFIG]
				? JSON.parse( ss.storage[PREF.CONFIG] )
				: saveDefaultToStorage( PREF.CONFIG, DEFAULT_CONFIG );

		CURRENT_EMOTES = ss.storage[PREF.EMOTES]
				? JSON.parse( ss.storage[PREF.EMOTES] )
				: saveDefaultToStorage( PREF.EMOTES, DEFAULT_EMOTES );

		META = ss.storage[PREF.META]
				? JSON.parse( ss.storage[PREF.META] )
				: saveDefaultToStorage( PREF.META, DEFAULT_META );

		updateObject( CURRENT_CONFIG, DEFAULT_CONFIG, PREF.CONFIG );
		updateObject( META, DEFAULT_META, PREF.META );

		response.config = CURRENT_CONFIG;
		response.emotes = CURRENT_EMOTES;

		response.sub_css = ss.storage[PREF.SUBREDDIT_CSS]
				? JSON.parse( ss.storage[PREF.SUBREDDIT_CSS] )
				: saveDefaultToStorage( PREF.SUBREDDIT_CSS, DEFAULT_SUB_CSS );

		response.sub_emotes = ss.storage[PREF.SUBREDDIT_EMOTES]
				? JSON.parse( ss.storage[PREF.SUBREDDIT_EMOTES] )
				: saveDefaultToStorage( PREF.SUBREDDIT_EMOTES, DEFAULT_SUB_EMOTES );

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
	xhrWait: 2000, // [ms] Time to wait between XHR calls

	xhrCurrentTarget: null,
	xhrProgress: 0,

	tableCodeRegex: /^[abce][0-9]{2}$/i,
	linkStart: 'a[href|="/',

	emoteCSS: {},
	emotes: {},


	/**
	 * Check if it is time for scheduled update
	 * and start the process if it is the case.
	 */
	check: function() {
		// Less than zero means automatic checks are disabled
		if( META.lastSubredditCheck < 0 ) {
			return;
		}
		if( Date.now() - META.lastSubredditCheck >= CURRENT_CONFIG.intervalToCheckCSS ) {
			META.lastSubredditCheck = Date.now() + this.xhrWait;
			saveToStorage( PREF.META, META );
			this.getCSS();
		}
	},


	/**
	 * Get the sub-reddit stylesheet per XHR.
	 */
	getCSS: function() {
		if( this.isProgressFinished() ) {
			this.wrapUp();
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

			// Get next subreddit CSS.
			// The reddit API guidelines say:
			// Not more than 1 request every 2 seconds.
			if( !Updater.isProgressFinished() ) {
				setTimeout( Updater.getCSS.bind( Updater ), Updater.xhrWait );
			}
			else {
				Updater.getCSS();
			}
		}
	},


	/**
	 * Extract the for emotes relevant parts from the stylesheet.
	 * Then extract from those the emote names.
	 * @param  {String} css Stylesheet.
	 * @return {Object}     Emotes ordered by table.
	 */
	extractEmotesStep1: function( css ) {
		var cssCopy = css,
		    emoteCSS = [],
		    needleImage = "background-image",
		    needlePosition = "background-position",
		    selectors = [];
		var eCSS, foundBgPosition, idx, needleLength, record, selector;

		while( true ) {
			idxImage = cssCopy.indexOf( needleImage );
			idxPosition = cssCopy.indexOf( needlePosition );
			foundBgPosition = false;

			if( idxImage < 0 && idxPosition < 0 ) {
				break;
			}

			// Is there "background-image" or "background-position"?
			// If both: Which one is first?
			if( idxPosition < 0 || ( idxImage >= 0 && idxPosition >= 0 && idxImage < idxPosition ) ) {
				idx = idxImage;
				needleLength = needleImage.length;
			}
			else {
				idx = idxPosition;
				foundBgPosition = true;
				needleLength = needlePosition.length;
			}

			selector = [];
			eCSS = [];
			record = false;

			// Get the selectors and part of the CSS
			for( var i = idx; i > 0; i-- ) {
				if( cssCopy[i] == "}" ) {
					break;
				}
				// Ignore the selectors of a found "background-position",
				// because this will only result in doubled selectors.
				if( !foundBgPosition && record ) {
					selector.push( cssCopy[i] );
				}
				if( cssCopy[i] == "{" ) {
					record = true;
				}

				eCSS.push( cssCopy[i] );
			}

			// Get the rest of the relevant CSS part
			eCSS = eCSS.reverse().join( "" );
			eCSS += this.getRestOfCSS( cssCopy, idx );
			emoteCSS.push( eCSS );

			if( !foundBgPosition ) {
				selector = selector.reverse().join( "" );
				selectors.push( selector );
			}

			cssCopy = cssCopy.substr( idx + needleLength );
		}

		this.emotes[this.xhrCurrentTarget] = selectors;
		this.emoteCSS[this.xhrCurrentTarget] = emoteCSS;
	},


	/**
	 * Get the rest of the relevant CSS part starting from
	 * the found needle position to the end of the rule.
	 * @param  {String} cssCopy Current part of the CSS.
	 * @param  {int}    idx     Index of the found needle.
	 * @return {String}         Extracted CSS.
	 */
	getRestOfCSS: function( cssCopy, idx ) {
		var css = "";

		for( var i = idx + 1; i < cssCopy.length; i++ ) {
			css += cssCopy[i];

			if( cssCopy[i] == "}" ) {
				break;
			}
		}

		return css;
	},


	/**
	 * Extract the emote names.
	 */
	extractEmotesStep2: function() {
		var emotesCurrent = this.emotes[this.xhrCurrentTarget],
		    cssCurrent = this.emoteCSS[this.xhrCurrentTarget];
		var emotes = [],
		    idx = -1,
		    purgedCSS = [];
		var css, emote, selector, subEmoteList;

		// Extract emote names
		for( var i = 0; i < emotesCurrent.length; i++ ) {
			selector = emotesCurrent[i].split( "," );
			subEmoteList = [];

			for( var j = 0; j < selector.length; j++ ) {
				emote = selector[j].trim();
				idx = emote.indexOf( this.linkStart );

				if( idx == -1 ) {
					continue;
				}

				emote = emote.substring( idx + this.linkStart.length, emote.length - 2 );
				// "dance" emotes from the Plounge
				// ":hov", because we already removed the last two characters
				emote = emote.replace( '"]:hov', '' );

				if( emotes.indexOf( emote ) == -1 ) {
					subEmoteList.push( emote );
				}
			}

			// Emotes were found
			if( idx >= 0 ) {
				emotes.push( subEmoteList );
			}
		}

		this.emoteCSS[this.xhrCurrentTarget] = this.removeNonEmoteCSS( cssCurrent );
		this.emotes[this.xhrCurrentTarget] = emotes;
	},


	/**
	 * Group emotes that show the same image but have different names.
	 * This is kind of unstable since it depends on the CSS authors' style not to change.
	 */
	groupSameEmotes: function() {
		var emotesCurrent = this.emotes[this.xhrCurrentTarget];
		var newEmoteList = [],
		    nonTableEmotes = [];
		var emote, group, newEmoteSubList;

		for( var i = 0; i < emotesCurrent.length; i++ ) {
			newEmoteSubList = [];
			group = [];

			for( var j = 0; j < emotesCurrent[i].length; j++ ) {
				emote = emotesCurrent[i][j];
				group.push( emote );

				// Start new group if table code has been reached.
				if( this.isTableCode( emote ) ) {
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
	 * Check if all XHR targets have been used.
	 * @return {Boolean} True if no more XHR calls will be made, false otherwise.
	 */
	isProgressFinished: function() {
		return ( this.xhrProgress >= this.xhrTargets.length );
	},


	/**
	 * Checks if a given emote is in table code form, for example "a02".
	 * @param  {String}  emote Emote name.
	 * @return {Boolean}       True if the emote is in table code form, false otherwise.
	 */
	isTableCode: function( emote ) {
		return ( emote.match( this.tableCodeRegex ) != null );
	},


	/**
	 * Remove wrongly identified CSS.
	 * @param  {Array}  css
	 * @return {String}
	 */
	removeNonEmoteCSS: function( css ) {
		var purgedCSS = [];
		var parts, purged, s, selectors;

		for( var i = 0; i < css.length; i++ ) {
			purged = css[i];

			// Alrighty, there is at least one emote selector in there
			if( purged.indexOf( this.linkStart ) >= 0 ) {

				// Remove the non-emote selectors ...
				parts = purged.split( "{" );
				selectors = parts[0].split( "," );
				purged = "";

				// ... by only keeping the emote selectors
				for( var j = 0; j < selectors.length; j++ ) {
					s = selectors[j];

					if( s.indexOf( this.linkStart ) >= 0 ) {
						purged += "," + s;
					}
				}

				purged = purged.substring( 1 ) + "{" + parts[1];
				purgedCSS.push( purged );
			}
		}

		return purgedCSS.join( "\n" );
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

				// If the emote doesn't start with "r" or does, but the
				// part after the first "r" isn't a known emote: keep it
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
	},


	/**
	 * Called at the end of updating ALL subreddit CSS.
	 * Saves the emotes and CSS. Resets counter.
	 */
	wrapUp: function() {
		saveToStorage( PREF.SUBREDDIT_CSS, this.emoteCSS );
		saveToStorage( PREF.SUBREDDIT_EMOTES, this.emotes );

		this.emoteCSS = {};
		this.emotes = {};
		this.xhrProgress = 0;
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
			Updater.check();
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
 * Update the currently stored object in case of newly added keys/values.
 * @param  {Object} current       The object as it is currently stored (not JSON).
 * @param  {Object} defaultValues The default state of the object.
 * @param  {String} storageKey    The storage key to save it under.
 * @return {Object}               The updated object.
 */
function updateObject( current, defaultValues, storageKey ) {
	for( var key in defaultValues ) {
		if( !current.hasOwnProperty( key ) ) {
			current[key] = defaultValues[key];
		}
	}
	saveToStorage( storageKey, current );

	return current;
};


MyBrowser.registerMessageHandler( handleMessage );
