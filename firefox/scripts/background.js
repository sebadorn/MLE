'use strict';


// Browser
var BROWSER = {
	CHROME: 1,
	FIREFOX_LEGACY: 2,
	FIREFOX_WEBEXT: 3,
	OPERA: 4
};

var I_AM = BROWSER.FIREFOX_LEGACY;

if( typeof opera != 'undefined' ) {
	I_AM = BROWSER.OPERA;
}
else if( typeof browser !== 'undefined' ) {
	I_AM = BROWSER.FIREFOX_WEBEXT;
}
else if( typeof chrome != 'undefined' ) {
	I_AM = BROWSER.CHROME;
}


// In strict mode code, functions may be declared only at
// top level or immediately within another function.
// These functions will be implemented in the following
// conditional branch for Firefox.
var forgetWorker = null;
var handleOnAttach = null;


// Firefox only.
// Include content scripts, handle messaging and add options page.
if( I_AM == BROWSER.FIREFOX_LEGACY ) {

	var pageMod = require( 'sdk/page-mod' );
	var Request = require( 'sdk/request' ).Request;
	var self = require( 'sdk/self' );
	var sprefs = require( 'sdk/simple-prefs' );
	var ss = require( 'sdk/simple-storage' );
	var tabs = require( 'sdk/tabs' );
	var Timer = require( 'sdk/timers' );

	var workers = [];

	var csfWebpage = [
		self.data.url( 'mle-codes.js' ),
		self.data.url( 'my-little-emotebox.js' )
	];
	var csfOptionsPage = [
		self.data.url( 'mle-codes.js' ),
		self.data.url( 'options.js' )
	];


	/**
	 * Forget a worker that has been detached.
	 * @param {Object} worker Detached worker.
	 */
	forgetWorker = function( worker ) {
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
	handleOnAttach = function( worker ) {
		worker.on( 'message', function( msg ) {
			handleMessage( msg, worker );
		} );
		worker.on( 'detach', function() {
			forgetWorker( this );
		} );
	};


	// Add content scripts to web pages
	pageMod.PageMod( {
		include: '*',
		attachTo: ['existing', 'top'],
		contentScriptWhen: 'ready',
		contentScriptFile: csfWebpage,
		onAttach: handleOnAttach
	} );

	// Add scripts to options page. Has to be done this way instead of
	// a parameter for "tabs.open", so the "self" object can be used.
	pageMod.PageMod( {
		include: self.data.url( 'options.html' ),
		attachTo: ['existing', 'top'],
		contentScriptWhen: 'ready',
		contentScriptFile: csfOptionsPage,
		onAttach: handleOnAttach
	} );


	// Open options page when button in addon manager is clicked.
	// @see package.json
	sprefs.on( 'optionsPage', function() {
		tabs.open( {
			url: self.data.url( 'options.html' )
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
// Firefox (WebExt)
else if( I_AM == BROWSER.FIREFOX_WEBEXT ) {

	// Set an individual User-Agent for our XMLHttpRequests.
	browser.webRequest.onBeforeSendHeaders.addListener(
		// Modify user-agent
		function( details ) {
			var headers = details.requestHeaders;
			var flagMLE = false;

			for( var i = 0; i < headers.length; i++ ) {
				if( headers[i].name == 'MLE-Chrome' ) {
					flagMLE = true;
				}
				else if( headers[i].name.toLowerCase() == 'user-agent' ) {
					headers[i].value = Updater.xhrUserAgent;
				}
			}

			return { requestHeaders: flagMLE ? headers: details.requestHeaders };
		},
		// filter
		{
			urls: ['<all_urls>'],
			types: ['xmlhttprequest']
		},
		['requestHeaders', 'blocking']
	);

}
// Chrome only.
else if( I_AM == BROWSER.CHROME ) {

	// Set an individual User-Agent for our XMLHttpRequests.
	chrome.webRequest.onBeforeSendHeaders.addListener(
		// Modify user-agent
		function( details ) {
			var headers = details.requestHeaders;
			var flagMLE = false;

			for( var i = 0; i < headers.length; i++ ) {
				if( headers[i].name == 'MLE-Chrome' ) {
					flagMLE = true;
				}
				else if( headers[i].name.toLowerCase() == 'user-agent' ) {
					headers[i].value = Updater.xhrUserAgent;
				}
			}

			return { requestHeaders: flagMLE ? headers: details.requestHeaders };
		},
		// filter
		{
			urls: ['<all_urls>'],
			types: ['xmlhttprequest']
		},
		['requestHeaders', 'blocking']
	);

}



// Keys
var PREF = {
	CONFIG: 'mle.config',
	EMOTES: 'mle.emotes',
	META: 'mle.meta',
	SUBREDDIT_CSS: 'mle.subreddit.css',
	SUBREDDIT_EMOTES: 'mle.subreddit.emotes'
};


var DEFAULT_SUB_CSS = {};
var DEFAULT_SUB_EMOTES = {};


// Information that the user won't need to backup
var DEFAULT_META = {
	lastSubredditCheck: 0
};


// Default config
var DEFAULT_CONFIG = {
	addBlankAfterInsert: true,
	adjustEmotesInInbox: true, // Adjust Plounge emotes in user overview and inbox
	adjustForBetterPonymotes: true,
	adjustForGrEmB: false,
	boxAlign: 'left', // "left" or "right"
	boxAnimationSpeed: 420, // [ms]
	boxBgColor: '#f4f4f4', // CSS valid color, examples: "#f6f6f6", "rgba(20,20,20,0.6)"
	boxEmoteBorder: '#ffffff', // CSS valid color
	boxHeight: 330, // [px]
	boxLabelMinimized: 'Emotes',
	boxPosTop: 60, // [px]
	boxPosX: 5, // [px]
	boxScrollbar: 'left', // "left" or "right"
	boxTrigger: 'button', // "float" or "button"
	boxWidth: 650, // [px]
	boxWidthMinimized: 70, // [px]
	boxUnderHeader: true,
	ctxMenu: true,
	ctxStyleBgColor: '#ffffff',
	ctxStyleBorderColor: '#d0d0d0',
	ctxStyleColor: '#101010',
	ctxStyleHoverColor: '#cee3f8',
	displayEmotesOutOfSub: true,
	injectEmoteCSS: true,
	intervalToCheckCSS: 43200000, // [ms] // Default is 12 hours.
	keyReverse: 17, // ctrl
	listNameTableA: 'A', // Name of the list for the emotes of table A
	listNameTableB: 'B', // Name of the list for the emotes of table B
	listNameTableC: 'C', // Name of the list for the emotes of table C
	listNameTableE: 'E', // Name of the list for the emotes of table E
	listNameTableF: 'F', // Name of the list for the emotes of table F
	listNameTableG: 'G', // Name of the list for the emotes of table G
	listNamePlounge: 'Plounge', // Name of the list for the non-table emotes of the Plounge
	msgAnimationSpeed: 1000, // [ms]
	msgPosition: 'top', // "top" or "bottom"
	msgTimeout: 7000, // [ms] // How long a popup message is displayed.
	revealStyleBgColor: '#ffffff',
	revealStyleBorderColor: '#e0e0e0',
	revealStyleColor: '#808080',
	revealUnknownEmotes: true,
	searchGroupEmotes: true, // Group emotes by table/subreddit
	showEmoteTitleText: false,
	showTitleConvertURLs: true,
	showTitleStyleBgColor: 'rgba(255,255,255,0.0)',
	showTitleStyleBorderColor: 'rgba(255,255,255,0.0)',
	showTitleStyleColor: '#808080',
	showTitleStyleDisplay: 'block', // "block" or "float"
	stopEmoteLinkFollowing: true
};


// Default emotes of r/mylittlepony and r/MLPLounge
var DEFAULT_EMOTES = {
	'A': [
		'twipride', 'twicrazy', 'twiright', 'twibeam', 'spikemeh',
		'celestiawut', 'celestiamad', 'lunateehee', 'lunawait', 'paperbagderpy',
		'ppfear', 'ppcute', 'pinkieawe', 'ajhappy', 'ajsup',
		'applegasp', 'applederp', 'ajlie', 'abbored', 'abmeh',
		'swagintosh', 'grannysmith', 'flutterwhoa', 'flutterroll', 'flutterjerk',
		'rdcry', 'scootaderp', 'scootaplease', 'scootacheer', 'ohcomeon',
		'sbbook', 'raritypaper', 'raritydaww', 'rarityreally', 'rarishock',
		'shiningarmor', 'cadence', 'chrysalis', 'priceless', 'silverspoon'
	],
	'B': [
		'ppseesyou', 'ppshrug', 'ppboring', 'rdcool', 'rdsmile',
		'soawesome', 'rdwut', 'squintyjack', 'ajsly', 'ajcower',
		'ajugh', 'ajwut', 'abwut', 'eeyup', 'fluttershh',
		'fluttershy', 'fluttersrs', 'flutterfear', 'flutterwink', 'flutteryay',
		'spikenervous', 'takealetter', 'noooo', 'spikepushy', 'manspike',
		'facehoof', 'twisquint', 'twirage', 'dumbfabric', 'rarityyell',
		'raritywhine', 'raritydress', 'rarityannoyed', 'raritywut', 'raritywhy',
		'rarityjudge', 'rarityprimp', 'trixiesmug', 'dj', 'cockatrice'
	],
	'C': [
		'rdsitting', 'rdhappy', 'rdannoyed', 'gross', 'louder',
		'rdscared', 'twistare', 'twismug', 'twismile', 'twidaw',
		'ohhi', 'party', 'hahaha', 'joy', 'pinkamina',
		'ppreally', 'ajfrown', 'hmmm', 'flutterblush', 'loveme',
		'whattheflut', 'fluttercry', 'raritysad', 'fabulous', 'sneakybelle',
		'scootaloo', 'derpyhappy', 'derp', 'derpyshock', 'lunasad',
		'lunagasp', 'celestia', 'cadencesmile', 'shiningpride', 'angel',
		'allmybits', 'zecora', 'photofinish', 'trixiesad', 'changeling'
	],
	'E': [
		'fillytgap', 'rdhuh', 'rdsalute', 'awwyeah', 'twiponder',
		'twisad', 'spikewtf', 'huhhuh', 'wahaha', 'sbstare',
		'cutealoo', 'ajconfused', 'absmile', 'abhuh', 'macintears',
		'lyra', 'bonbon', 'spitfire', 'happyluna', 'sotrue',
		'nmm', 'berry', 'whooves', 'octavia', 'colgate',
		'cheerilee', 'lily', 'gilda', 'snails', 'dealwithit',
		'discentia', 'maud', 'discordsad', 'lunamad', 'pinkiepout',
		'twisecret', 'spikehappy', 'scootablue', 'sunsetshimmer', 'sunsetsneaky'
	],
	'F': [
		'pinkiesad', 'diamondtiara', 'sombra', 'sbshocked', 'guard',
		'abstern', 'apathia', 'ajcry', 'rarityeww', 'flutterkay',
		'starlightrage', 'bulkbiceps', 'scootaeww', 'discordgrump', 'troubleshoes',
		'rdsnrk', 'thcalm', 'ooh', 'raritytired', 'notangry',
		'ajdoubt', 'spikewhoa', 'wasntme', 'twipbbt', 'flimflam',
		'cocosmile', 'skeptiloo', 'limestonegrin', 'raritygrump', 'goodjob',
		'flutterhay', 'sbwtf', 'nightmaregrin', 'spikeapproves', 'flutternice',
		'ppdont', 'ajgrump', 'sgpopcorn', 'raritysquee', 'gummystare'
	],
	'G': [
		'karma', 'discentiajudge', 'twisnide', 'pinkie', 'cococold',
		'quibble', 'rdthis', 'flutterbrow'
	],
	'Plounge': [
		'fillyrarity', 'twidur', 'amzingmagic', 'karmasalute', 'dishappy',
		'karmastare', 'ohnoes', 'filly'
	]
};

var CURRENT_CONFIG = null;
var CURRENT_EMOTES = null;
var META = null;
var SUBREDDIT_CSS = null;
var SUBREDDIT_EMOTES = null;



/**
 * Browser "class" for Opera.
 * @type {Object}
 */
var BrowserOpera = {


	tabSources: [],


	/**
	 * Broadcast a message to everything extension related.
	 * @param {Object} source
	 * @param {Object} msg
	 */
	broadcast: function( source, msg ) {
		var remove = [];

		for( var i = 0; i < this.tabSources.length; i++ ) {
			if( this.tabSources[i] != source ) {
				try {
					this.tabSources[i].postMessage( msg );
				}
				// Using the ondisconnect event didn't work as expected.
				// If it doesn't work (because the tab has been closed)
				// catch the error and remove the source from the list.
				catch( err ) {
					remove.push( this.tabSources[i] );
				}
			}
		}

		// Remove failed sources
		for( var j = 0; j < remove.length; j++ ) {
			var idx = this.tabSources.indexOf( remove[j] );

			if( idx >= 0 ) {
				this.tabSources.splice( idx, 1 );
			}
		}
	},


	/**
	 * Load config and emotes in Opera.
	 * @param  {Object}  response Response object that will get send to the content script later.
	 * @param  {Boolean} loadMeta True, if META data shall be included in the response.
	 * @return {Object}  response
	 */
	loadConfigAndEmotes: function( response, sender, loadMeta ) {
		var wpref = widget.preferences;

		// Remember this tab in which MLE is running
		if( this.tabSources.indexOf( sender ) < 0 ) {
			this.tabSources.push( sender );
		}

		CURRENT_CONFIG = wpref[PREF.CONFIG] ?
		                 JSON.parse( wpref[PREF.CONFIG] ) :
		                 saveDefaultToStorage( PREF.CONFIG, DEFAULT_CONFIG );

		CURRENT_EMOTES = wpref[PREF.EMOTES] ?
		                 JSON.parse( wpref[PREF.EMOTES] ) :
		                 saveDefaultToStorage( PREF.EMOTES, DEFAULT_EMOTES );

		META = wpref[PREF.META] ?
		       JSON.parse( wpref[PREF.META] ) :
		       saveDefaultToStorage( PREF.META, DEFAULT_META );

		SUBREDDIT_CSS = wpref[PREF.SUBREDDIT_CSS] ?
		                JSON.parse( wpref[PREF.SUBREDDIT_CSS] ) :
		                saveDefaultToStorage( PREF.SUBREDDIT_CSS, DEFAULT_SUB_CSS );

		SUBREDDIT_EMOTES = wpref[PREF.SUBREDDIT_EMOTES] ?
		                   JSON.parse( wpref[PREF.SUBREDDIT_EMOTES] ) :
		                   saveDefaultToStorage( PREF.SUBREDDIT_EMOTES, DEFAULT_SUB_EMOTES );

		updateObject( CURRENT_CONFIG, DEFAULT_CONFIG, PREF.CONFIG );
		updateObject( META, DEFAULT_META, PREF.META );

		response.config = CURRENT_CONFIG;
		response.emotes = CURRENT_EMOTES;
		response.sub_css = SUBREDDIT_CSS;
		response.sub_emotes = SUBREDDIT_EMOTES;

		if( loadMeta ) {
			response.meta = META;
		}

		// It's ugly to place that function call here.
		// But THANKS TO CHROME that's the way it has to be.
		// Unless I come up with a good way to refactor this.
		Updater.check();

		return response;
	},


	/**
	 * Post an error to the error console.
	 * @param {String} msg
	 */
	logError: function( msg ) {
		opera.postError( msg );
	},


	/**
	 * Open the options page.
	 */
	openOptions: function() {
		opera.extension.tabs.create( {
			url: 'options.html',
			focused: true
		} );
	},


	/**
	 * Register a function to handle messaging between pages.
	 * @param {Function} handler
	 */
	registerMessageHandler: function( handler ) {
		opera.extension.onmessage = handler;
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
	 * Save to extension storage.
	 * @param {String} key
	 * @param {String} val String as JSON.
	 */
	save: function( key, val ) {
		widget.preferences[key] = val;
	},


	/**
	 * Send a XMLHttpRequest.
	 * @param {String}   method    POST or GET.
	 * @param {String}   url       URL to send the request to.
	 * @param {Boolean}  async     If to make the request async.
	 * @param {String}   userAgent The User-Agent to sent.
	 * @param {Function} callback  Callback function to handle the response.
	 */
	sendRequest: function( method, url, async, userAgent, callback ) {
		var xhr = new XMLHttpRequest();

		xhr.open( method, url, async );
		xhr.setRequestHeader( 'User-Agent', userAgent );
		xhr.onreadystatechange = callback.bind( xhr );
		xhr.send();
	}


};



/**
 * Browser "class" for Chrome.
 * @type {Object}
 */
var BrowserChrome = {


	tabs: [],


	/**
	 * Broadcast a message to everything extension related.
	 * @param {Object} sender
	 * @param {Object} msg
	 */
	broadcast: function( sender, msg ) {
		for( var i = 0; i < this.tabs.length; i++ ) {
			if( sender && sender.tab.id == this.tabs[i] ) {
				continue;
			}
			chrome.tabs.sendMessage( this.tabs[i], msg, handleMessage );
		}
	},


	/**
	 * CHROME ONLY.
	 * Handle the items loaded from the storage.
	 * (this == binded object with variables)
	 * @param {Object} items Loaded items in key/value pairs.
	 */
	handleLoadedItems: function( items ) {
		CURRENT_CONFIG = !items[PREF.CONFIG] ?
		                 saveDefaultToStorage( PREF.CONFIG, DEFAULT_CONFIG ) :
		                 JSON.parse( items[PREF.CONFIG] );

		CURRENT_EMOTES = !items[PREF.EMOTES] ?
		                 saveDefaultToStorage( PREF.EMOTES, DEFAULT_EMOTES ) :
		                 JSON.parse( items[PREF.EMOTES] );

		META = !items[PREF.META] ?
		       saveDefaultToStorage( PREF.META, DEFAULT_META ) :
		       JSON.parse( items[PREF.META] );

		SUBREDDIT_CSS = !items[PREF.SUBREDDIT_CSS] ?
		                saveDefaultToStorage( PREF.SUBREDDIT_CSS, DEFAULT_SUB_CSS ) :
		                JSON.parse( items[PREF.SUBREDDIT_CSS] );

		SUBREDDIT_EMOTES = !items[PREF.SUBREDDIT_EMOTES] ?
		                   saveDefaultToStorage( PREF.SUBREDDIT_EMOTES, DEFAULT_SUB_EMOTES ) :
		                   JSON.parse( items[PREF.SUBREDDIT_EMOTES] );

		updateObject( CURRENT_CONFIG, DEFAULT_CONFIG, PREF.CONFIG );
		updateObject( META, DEFAULT_META, PREF.META );

		this.response.config = CURRENT_CONFIG;
		this.response.emotes = CURRENT_EMOTES;
		this.response.sub_css = SUBREDDIT_CSS;
		this.response.sub_emotes = SUBREDDIT_EMOTES;

		if( this.loadMeta ) {
			this.response.meta = META;
		}

		// It's ugly to place that function call here.
		// But THANKS TO CHROME that's the way it has to be.
		// Unless I come up with a good way to refactor this.
		Updater.check();

		// Send loaded items to the tab that sent the request.
		if( this.sender ) {
			chrome.tabs.sendMessage( this.sender.tab.id, this.response, handleMessage );
		}
	},


	/**
	 * Load config and emotes in Chrome.
	 * @param  {Object}  response Response object that will get send to the content script.
	 * @param  {Object}  sender   Sender of message. Used to send response. (Chrome only)
	 * @param  {Boolean} loadMeta True, if META data shall be included in the response.
	 * @return {Object}  response
	 */
	loadConfigAndEmotes: function( response, sender, loadMeta ) {
		var packet = {
			loadMeta: loadMeta,
			response: response,
			sender: sender
		};

		// Remember this tab in which MLE is running
		if( this.tabs.indexOf( sender.tab.id ) < 0 ) {
			this.tabs.push( sender.tab.id );
		}

		chrome.tabs.onRemoved.addListener( this.onTabRemove.bind( this ) );

		chrome.storage.local.get( null, this.handleLoadedItems.bind( packet ) );

		// Response unaltered.
		// Actual response happens in this.handleLoadedItems.
		return response;
	},


	/**
	 * Post an error to the error console.
	 * @param {String} msg
	 */
	logError: function( msg ) {
		console.error( msg );
	},


	/**
	 * Called when a tab is closed.
	 * A CHROME ONLY FUNCTION.
	 * @param {Number} tabId ID of the removed tab.
	 * @param {Object} info
	 */
	onTabRemove: function( tabId, info ) {
		var idx = this.tabs.indexOf( tabId );

		if( idx >= 0 ) {
			this.tabs.splice( idx, 1 );
		}
	},


	/**
	 * Open the options page.
	 */
	openOptions: function() {
		chrome.tabs.create( {
			url: chrome.extension.getURL( 'options.html' ),
			active: true
		} );
	},


	/**
	 * Register a function to handle messaging between pages.
	 * @param {Function} handler
	 */
	registerMessageHandler: function( handler ) {
		chrome.runtime.onMessage.addListener( handler );
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
	 * Send a XMLHttpRequest.
	 * @param {String}   method    POST or GET.
	 * @param {String}   url       URL to send the request to.
	 * @param {Boolean}  async     If to make the request async.
	 * @param {String}   userAgent The User-Agent to sent. (NOT USED IN CHROME.)
	 * @param {Function} callback  Callback function to handle the response.
	 */
	sendRequest: function( method, url, async, userAgent, callback ) {
		var xhr = new XMLHttpRequest();

		xhr.open( method, url, async );
		xhr.setRequestHeader( 'MLE-Chrome', '1' );
		xhr.onreadystatechange = callback.bind( xhr );
		xhr.send();
	}


};



/**
 * Browser "class" for Firefox (WebExt).
 * @type {Object}
 */
var BrowserFirefoxWebExt = {


	tabs: [],


	/**
	 * Broadcast a message to everything extension related.
	 * @param {Object} sender
	 * @param {Object} msg
	 */
	broadcast: function( sender, msg ) {
		var makeCb = function( sender ) {
			return function( response ) {
				if( response ) {
					handleMessage( { data: response }, sender );
				}
			};
		};

		for( var i = 0; i < this.tabs.length; i++ ) {
			if( sender && sender.tab.id == this.tabs[i] ) {
				continue;
			}
			var cb = makeCb( sender );
			browser.tabs.sendMessage( this.tabs[i], msg ).then( cb ).catch( this.logError );
		}
	},


	/**
	 * CHROME ONLY.
	 * Handle the items loaded from the storage.
	 * (this == binded object with variables)
	 * @param {Object} items Loaded items in key/value pairs.
	 */
	handleLoadedItems: function( items ) {
		CURRENT_CONFIG = !items[PREF.CONFIG] ?
		                 saveDefaultToStorage( PREF.CONFIG, DEFAULT_CONFIG ) :
		                 JSON.parse( items[PREF.CONFIG] );

		CURRENT_EMOTES = !items[PREF.EMOTES] ?
		                 saveDefaultToStorage( PREF.EMOTES, DEFAULT_EMOTES ) :
		                 JSON.parse( items[PREF.EMOTES] );

		META = !items[PREF.META] ?
		       saveDefaultToStorage( PREF.META, DEFAULT_META ) :
		       JSON.parse( items[PREF.META] );

		SUBREDDIT_CSS = !items[PREF.SUBREDDIT_CSS] ?
		                saveDefaultToStorage( PREF.SUBREDDIT_CSS, DEFAULT_SUB_CSS ) :
		                JSON.parse( items[PREF.SUBREDDIT_CSS] );

		SUBREDDIT_EMOTES = !items[PREF.SUBREDDIT_EMOTES] ?
		                   saveDefaultToStorage( PREF.SUBREDDIT_EMOTES, DEFAULT_SUB_EMOTES ) :
		                   JSON.parse( items[PREF.SUBREDDIT_EMOTES] );

		updateObject( CURRENT_CONFIG, DEFAULT_CONFIG, PREF.CONFIG );
		updateObject( META, DEFAULT_META, PREF.META );

		this.response.config = CURRENT_CONFIG;
		this.response.emotes = CURRENT_EMOTES;
		this.response.sub_css = SUBREDDIT_CSS;
		this.response.sub_emotes = SUBREDDIT_EMOTES;

		if( this.loadMeta ) {
			this.response.meta = META;
		}

		// It's ugly to place that function call here.
		// But THANKS TO CHROME that's the way it has to be.
		// Unless I come up with a good way to refactor this.
		Updater.check();

		// Send loaded items to the tab that sent the request.
		if( this.sender ) {
			var cb = function( response ) {
				if( response ) {
					handleMessage( { data: response }, this.sender );
				}
			};
			browser.tabs.sendMessage( this.sender.tab.id, this.response ).then( cb ).catch( this.logError );
		}
	},


	/**
	 * Load config and emotes in Chrome.
	 * @param  {Object}  response Response object that will get send to the content script.
	 * @param  {Object}  sender   Sender of message. Used to send response. (Chrome only)
	 * @param  {Boolean} loadMeta True, if META data shall be included in the response.
	 * @return {Object}  response
	 */
	loadConfigAndEmotes: function( response, sender, loadMeta ) {
		var packet = {
			loadMeta: loadMeta,
			response: response,
			sender: sender
		};

		// Remember this tab in which MLE is running
		if( this.tabs.indexOf( sender.tab.id ) < 0 ) {
			this.tabs.push( sender.tab.id );
		}

		browser.tabs.onRemoved.addListener( this.onTabRemove.bind( this ) );

		browser.storage.local.get().then( this.handleLoadedItems.bind( packet ), this.logError );

		// Response unaltered.
		// Actual response happens in this.handleLoadedItems.
		return response;
	},


	/**
	 * Post an error to the error console.
	 * @param {String} msg
	 */
	logError: function( msg ) {
		console.error( msg );
	},


	/**
	 * Called when a tab is closed.
	 * A CHROME ONLY FUNCTION.
	 * @param {Number} tabId ID of the removed tab.
	 * @param {Object} info
	 */
	onTabRemove: function( tabId, info ) {
		var idx = this.tabs.indexOf( tabId );

		if( idx >= 0 ) {
			this.tabs.splice( idx, 1 );
		}
	},


	/**
	 * Open the options page.
	 */
	openOptions: function() {
		browser.tabs.create( {
			url: browser.extension.getURL( 'options.html' ),
			active: true
		} ).then( null, this.logError );
	},


	/**
	 * Register a function to handle messaging between pages.
	 * @param {Function} handler
	 */
	registerMessageHandler: function( handler ) {
		browser.runtime.onMessage.addListener( function( msg, sender, sendResponse ) {
			handler( { data: msg }, sender, sendResponse );
		} );
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
	 * Save to extension storage.
	 * @param {String} key
	 * @param {String} val String as JSON.
	 */
	save: function( key, val ) {
		var saveObj = {};
		saveObj[key] = val;
		browser.storage.local.set( saveObj ).then( null, this.logError );
	},


	/**
	 * Send a XMLHttpRequest.
	 * @param {String}   method    POST or GET.
	 * @param {String}   url       URL to send the request to.
	 * @param {Boolean}  async     If to make the request async.
	 * @param {String}   userAgent The User-Agent to sent. (NOT USED IN CHROME.)
	 * @param {Function} callback  Callback function to handle the response.
	 */
	sendRequest: function( method, url, async, userAgent, callback ) {
		var xhr = new XMLHttpRequest();

		xhr.open( method, url, async );
		xhr.setRequestHeader( 'MLE-Firefox_WebExt', '1' );
		xhr.onreadystatechange = callback.bind( xhr );
		xhr.send();
	}


};



/**
 * Browser "class" for Firefox.
 * @type {Object}
 */
var BrowserFirefoxLegacy = {


	/**
	 * Broadcast a message to everything extension related.
	 * @param {Object} sender
	 * @param {Object} msg
	 */
	broadcast: function( sender, msg ) {
		for( var i = 0; i < workers.length; i++ ) {
			if( sender == workers[i] ) {
				continue;
			}
			try {
				workers[i].postMessage( msg );
			}
			catch( err ) {
				forgetWorker( workers[i] );
			}
		}
	},


	/**
	 * Load config and emotes in Firefox.
	 * @param  {Object}  response Response object that will get send to the content script later.
	 * @param  {Boolean} loadMeta True, if META data shall be included in the response.
	 * @return {Object}  response
	 */
	loadConfigAndEmotes: function( response, sender, loadMeta ) {
		// Remember this tab in which MLE is running
		if( workers.indexOf( sender ) < 0 ) {
			workers.push( sender );
		}

		CURRENT_CONFIG = ss.storage[PREF.CONFIG] ?
		                 JSON.parse( ss.storage[PREF.CONFIG] ) :
		                 saveDefaultToStorage( PREF.CONFIG, DEFAULT_CONFIG );

		CURRENT_EMOTES = ss.storage[PREF.EMOTES] ?
		                 JSON.parse( ss.storage[PREF.EMOTES] ) :
		                 saveDefaultToStorage( PREF.EMOTES, DEFAULT_EMOTES );

		META = ss.storage[PREF.META] ?
		       JSON.parse( ss.storage[PREF.META] ) :
		       saveDefaultToStorage( PREF.META, DEFAULT_META );

		SUBREDDIT_CSS = ss.storage[PREF.SUBREDDIT_CSS] ?
		                JSON.parse( ss.storage[PREF.SUBREDDIT_CSS] ) :
		                saveDefaultToStorage( PREF.SUBREDDIT_CSS, DEFAULT_SUB_CSS );

		SUBREDDIT_EMOTES = ss.storage[PREF.SUBREDDIT_EMOTES] ?
		                   JSON.parse( ss.storage[PREF.SUBREDDIT_EMOTES] ) :
		                   saveDefaultToStorage( PREF.SUBREDDIT_EMOTES, DEFAULT_SUB_EMOTES );

		updateObject( CURRENT_CONFIG, DEFAULT_CONFIG, PREF.CONFIG );
		updateObject( META, DEFAULT_META, PREF.META );

		response.config = CURRENT_CONFIG;
		response.emotes = CURRENT_EMOTES;
		response.sub_css = SUBREDDIT_CSS;
		response.sub_emotes = SUBREDDIT_EMOTES;

		if( loadMeta ) {
			response.meta = META;
		}

		// It's ugly to place that function call here.
		// But THANKS TO CHROME that's the way it has to be.
		// Unless I come up with a good way to refactor this.
		Updater.check();

		return response;
	},


	/**
	 * Post an error to the error console.
	 * @param {String} msg
	 */
	logError: function( msg ) {
		console.error( msg );
	},


	/**
	 * Open the options page.
	 */
	openOptions: function() {
		tabs.open( {
			url: self.data.url( 'options.html' )
		} );
	},


	/**
	 * Register a function to handle messaging between pages.
	 * THIS IS JUST A DUMMY FUNCTION.
	 * @see   handleOnAttach()
	 * @param {Function} handler
	 */
	registerMessageHandler: function( handler ) {
		// pass
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
	 * Save to extension storage.
	 * @param {String} key
	 * @param {String} val String as JSON.
	 */
	save: function( key, val ) {
		ss.storage[key] = val;
	},


	/**
	 * Send a XMLHttpRequest.
	 * ONLY USEABLE FOR THE UPDATER AT THIS MOMENT!
	 * @param {String}   method    POST or GET.
	 * @param {String}   url       URL to send the request to.
	 * @param {Boolean}  async     If to make the request async.
	 * @param {String}   userAgent The User-Agent to sent.
	 * @param {Function} callback  Callback function to handle the response. (NOT USED IN FIREFOX.)
	 */
	sendRequest: function( method, url, async, userAgent, callback ) {
		var req = new Request( {
			url: url,
			onComplete: function( response ) {
				var lastModified = response.headers['Last-Modified'];
				var contentType = response.headers['Content-Type'];

				lastModified = Date.parse( lastModified );
				callback( true, response.text, lastModified, contentType );
			},
			headers: {
				'User-Agent': userAgent
			}
		} );

		req.get();
	}


};



// Assign correct browser "class".
var MyBrowser = null;

switch( I_AM ) {
	case BROWSER.OPERA:
		MyBrowser = BrowserOpera;
		BrowserChrome = null;
		BrowserFirefoxLegacy = null;
		BrowserFirefoxWebExt = null;
		break;

	case BROWSER.CHROME:
		MyBrowser = BrowserChrome;
		BrowserFirefoxLegacy = null;
		BrowserFirefoxWebExt = null;
		BrowserOpera = null;
		break;

	case BROWSER.FIREFOX_WEBEXT:
		MyBrowser = BrowserFirefoxWebExt;
		BrowserChrome = null;
		BrowserFirefoxLegacy = null;
		BrowserOpera = null;
		break;

	case BROWSER.FIREFOX_LEGACY:
		MyBrowser = BrowserFirefoxLegacy;
		BrowserChrome = null;
		BrowserFirefoxWebExt = null;
		BrowserOpera = null;
		break;
}



/**
 * Getting the sub-reddit CSS and extracting the emotes.
 * @type {Object}
 */
var Updater = {


	// Config
	xhrAsync: true,
	xhrMethod: 'GET',
	xhrTargets: ['r/mylittlepony', 'r/mlplounge'],
	xhrUserAgent: 'MLE/2.10.10 (by meinstuhlknarrt)',
	xhrWait: 2000, // [ms] Time to wait between XHR calls

	xhrCurrentTarget: null,
	xhrProgress: 0,
	xhrTargetsCSS: [],

	// If true, the Last-Modified header will be ignored.
	// Will be reset to false at the end of the update process.
	// @see Updater.wrapUp()
	forceUpdate: false,
	// Option page to respond to
	forceSource: null,

	linkStart: 'a[href|="/',
	linkStartReverse: 'a[href^="/r"]',
	tableCodeRegex: /^[abcefg][0-9]{2}$/i,

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
			this.emoteCSS = SUBREDDIT_CSS;
			this.emotes = SUBREDDIT_EMOTES;
			this.getCSSURLs();
		}
	},


	/**
	 * Extract the for emotes relevant parts from the stylesheet.
	 * Then extract from those the emote names.
	 * @param  {String} css Stylesheet.
	 * @return {Object}     Emotes ordered by table.
	 */
	extractEmotesStep1: function( css ) {
		var cssCopy = css;
		var emoteCSS = [];
		var needleImage = 'background-image';
		var needlePosition = 'background-position';
		var needleTransform = 'transform';
		var selectors = [];


		// CSS code for reversing emotes

		var rCSS = this.getReverseEmotesCSS( css );

		if( rCSS !== false ) {
			emoteCSS.push( rCSS );
		}


		while( true ) {
			var idxImage = cssCopy.indexOf( needleImage );
			var idxPosition = cssCopy.indexOf( needlePosition );
			var idxTransform = cssCopy.indexOf( needleTransform );
			var ignoreSelectors = false;

			if( idxImage < 0 && idxPosition < 0 && idxTransform < 0 ) {
				break;
			}

			// Pick the index that appears first

			idxImage = ( idxImage < 0 ) ? Infinity : idxImage;
			idxPosition = ( idxPosition < 0 ) ? Infinity : idxPosition;
			idxTransform = ( idxTransform < 0 ) ? Infinity : idxTransform;

			var firstIdx = Math.min( idxImage, idxPosition, idxTransform );
			var idx = -1;
			var needleLength = 0;

			if( firstIdx == idxImage ) {
				idx = idxImage;
				needleLength = needleImage.length;
			}
			else if( firstIdx == idxPosition ) {
				idx = idxPosition;
				needleLength = needlePosition.length;
				ignoreSelectors = true;
			}
			else if( firstIdx == idxTransform ) {
				idx = idxTransform;
				needleLength = needleTransform.length;
				ignoreSelectors = true;
			}

			var selector = [];
			var eCSS = [];
			var record = false;

			// Get the selectors and part of the CSS
			for( var i = idx; i > 0; i-- ) {
				if( cssCopy[i] == '}' ) {
					break;
				}
				// Avoid doubled selectors by only collecting them once.
				if( !ignoreSelectors && record ) {
					selector.push( cssCopy[i] );
				}
				if( cssCopy[i] == '{' ) {
					record = true;
				}

				eCSS.push( cssCopy[i] );
			}

			// Get the rest of the relevant CSS part
			eCSS = eCSS.reverse().join( '' );
			eCSS += this.getRestOfCSS( cssCopy, idx );
			emoteCSS.push( eCSS );

			if( !ignoreSelectors ) {
				selector = selector.reverse().join( '' );
				selectors.push( selector );
			}

			// Remove the CSS part we just processed
			cssCopy = cssCopy.substr( idx + needleLength );
		}


		this.emotes[this.xhrCurrentTarget] = selectors;
		this.emoteCSS[this.xhrCurrentTarget] = emoteCSS;
	},


	/**
	 * Extract the emote names.
	 */
	extractEmotesStep2: function() {
		var emotesCurrent = this.emotes[this.xhrCurrentTarget];
		var cssCurrent = this.emoteCSS[this.xhrCurrentTarget];
		var emotes = [];
		var idx = -1;

		// Extract emote names
		for( var i = 0; i < emotesCurrent.length; i++ ) {
			var selector = emotesCurrent[i].split( ',' );
			var subEmoteList = [];

			for( var j = 0; j < selector.length; j++ ) {
				var emote = selector[j].trim();
				idx = emote.indexOf( this.linkStart );

				if( idx == -1 ) {
					continue;
				}

				emote = emote.substring( idx + this.linkStart.length, emote.length - 2 );
				// "dance" emotes from the Plounge
				// ":hov", because we already removed the last two characters
				emote = emote.replace( '"]:hov', '' );

				if( emotes.indexOf( emote ) == -1 ) {
					// Ignore table-like Plounge emotes. There is no dedicated
					// table list for Plounge emotes in MLE, so we would only
					// end up with duplicated entries.
					if(
						this.xhrCurrentTarget != 'r/mlplounge' ||
						emote.match( /^r?pl[0-9]{2}$/ ) === null
					) {
						subEmoteList.push( emote );
					}
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
	 * Get the sub-reddit stylesheet per XHR.
	 */
	getCSS: function() {
		if( this.isProgressFinished() ) {
			this.wrapUp();
			return;
		}

		var url = this.xhrTargetsCSS[this.xhrProgress];

		this.xhrCurrentTarget = this.xhrTargets[this.xhrProgress];
		this.xhrProgress++;

		MyBrowser.sendRequest(
			this.xhrMethod, url, this.xhrAsync, this.xhrUserAgent, this.handleCSSCallback
		);
	},


	/**
	 * Get the URLs to the CSS files.
	 */
	getCSSURLs: function() {
		// Just getting started. Prepare list for CSS URLs.
		if( this.xhrProgress === 0 ) {
			this.xhrTargetsCSS = [];
		}
		// We have all CSS URLs. Proceed with requesting the CSS files.
		else if( this.xhrProgress == this.xhrTargets.length ) {
			this.xhrProgress = 0;
			this.getCSS();
			return;
		}

		this.xhrCurrentTarget = this.xhrTargets[this.xhrProgress];
		this.xhrProgress++;

		// Fetch a small page which uses the subreddit CSS.
		var url = 'https://www.reddit.com/' + this.xhrCurrentTarget;

		MyBrowser.sendRequest(
			this.xhrMethod, url, this.xhrAsync, this.xhrUserAgent, this.getCSSURLsCallback
		);
	},


	/**
	 * Handle the XHR callback for the request for a page from
	 * which we can extract the CSS URL.
	 * @param {Boolean} hasReadyState4 Workaround for Firefox.
	 * @param {String}  responseText   Workaround for Firefox.
	 */
	getCSSURLsCallback: function( hasReadyState4, responseText ) {
		var responseContent = '';

		if( hasReadyState4 === true ) {
			responseContent = responseText;
		}
		else if( this.readyState == 4 ) {
			responseContent = this.responseText;
		}

		if( hasReadyState4 === true || this.readyState == 4 ) {
			var url = responseContent.match( /href="[a-zA-Z0-9\/.:\-_+]+" (ref="applied_subreddit_stylesheet")? title="applied_subreddit_stylesheet"/ );

			if( !url ) {
				MyBrowser.logError( 'No CSS URL found.' );
				return;
			}

			url = url[0];
			url = url.substr( 6 );
			url = url.replace( '" ref="applied_subreddit_stylesheet', '' );
			url = url.replace( '" title="applied_subreddit_stylesheet"', '' );

			Updater.xhrTargetsCSS.push( url );

			// Get the next CSS URL.
			if( typeof setTimeout != 'undefined' ) {
				setTimeout( function( ev ) {
					Updater.getCSSURLs( ev );
				}, Updater.xhrWait );
			}
			else {
				Timer.setTimeout( function( ev ) {
					Updater.getCSSURLs( ev );
				}, Updater.xhrWait );
			}
		}
	},


	/**
	 * Get the rest of the relevant CSS part starting from
	 * the found needle position to the end of the rule.
	 * @param  {String} cssCopy Current part of the CSS.
	 * @param  {Number} idx     Index of the found needle.
	 * @return {String}         Extracted CSS.
	 */
	getRestOfCSS: function( cssCopy, idx ) {
		var css = '';

		for( var i = idx + 1; i < cssCopy.length; i++ ) {
			css += cssCopy[i];

			if( cssCopy[i] == '}' ) {
				break;
			}
		}

		return css;
	},


	/**
	 * Get CSS code for reversing emotes.
	 * @param  {String}         css The CSS.
	 * @return {String|Boolean}     The relevant CSS part or false if nothing could be found.
	 */
	getReverseEmotesCSS: function( css ) {
		var rCSS = false;
		var idxReverse = css.indexOf( this.linkStartReverse );

		if( idxReverse >= 0 ) {
			rCSS = css.substr( idxReverse );
			var idxEnd = rCSS.indexOf( '}' );
			rCSS = rCSS.substr( 0, idxEnd + 1 );
		}

		return rCSS;
	},


	/**
	 * Group emotes that show the same image but have different names.
	 * This is kind of unstable since it depends on the CSS authors' style not to change.
	 */
	groupSameEmotes: function() {
		var emotesCurrent = this.emotes[this.xhrCurrentTarget];
		var newEmoteList = [];
		var nonTableEmotes = [];


		// Get a list of lists with all the emotes that share the same background position
		var emotesCurrentCSS = this.emoteCSS[this.xhrCurrentTarget].split( '\n' );
		var lineEmotes = [];

		for( var i = 0; i < emotesCurrentCSS.length; i++ ) {
			var line = emotesCurrentCSS[i];

			if( line.indexOf( 'background-position:' ) == -1 ) {
				continue;
			}

			line = line.substr( 0, line.indexOf( '{' ) ) + ',';
			line = line.replace( /a\[href\|="\/([a-zA-Z0-9-_]+)"\],/g, '$1::' );
			line = line.substr( 0, line.length - 2 );
			lineEmotes.push( line.split( '::' ) );
		}


		// Iterate over (presumably) emote tables
		for( var i = 0; i < emotesCurrent.length; i++ ) {
			var newEmoteSubList = [];
			var ecCopy = emotesCurrent[i].slice( 0 );

			// Iterate over emotes of a table
			for( var j = 0; j < emotesCurrent[i].length; j++ ) {
				var emote = emotesCurrent[i][j];

				// Emote has already been checked and was an alternate name for another one
				if( ecCopy.indexOf( emote ) == -1 ) {
					continue;
				}

				var group = [emote];

				for( var k = 0; k < ecCopy.length; k++ ) {
					var emote2 = ecCopy[k];
					var originalFound = false;
					var emote2Found = false;

					if( emote2 == emote ) {
						continue;
					}

					// Iterate over list of lists of emotes with same background position
					for( var l = 0; l < lineEmotes.length; l++ ) {

						// Find bg pos list of current emote
						if( lineEmotes[l].indexOf( emote ) >= 0 ) {
							originalFound = true;

							// Is compared emote in same list? Yes -> is an alternate name
							if( lineEmotes[l].indexOf( emote2 ) >= 0 ) {
								group.push( emote2 );
							}
							break;
						}
						if( lineEmotes[l].indexOf( emote2 ) >= 0 ) {
							emote2Found = true;
							break;
						}
					}

					if( !originalFound && !emote2Found ) {
						group.push( emote2 );
					}
				}

				// Remove already grouped emotes
				var belongsToTable = false;

				for( var rem = 0; rem < group.length; rem++ ) {
					if( !belongsToTable && this.isTableCode( group[rem] ) ) {
						belongsToTable = true;
					}
					ecCopy.splice( ecCopy.indexOf( group[rem] ), 1 );
				}

				if( belongsToTable ) {
					newEmoteSubList.push( group );
				}
				else {
					nonTableEmotes = nonTableEmotes.concat( group );
				}
			}

			if( newEmoteSubList.length > 0 ) {
				newEmoteList.push( newEmoteSubList );
			}
		}

		var noDoubles = [];

		if( nonTableEmotes.length > 0 ) {
			// Remove doubled emotes
			for( var i = 0; i < nonTableEmotes.length; i++ ) {
				if( noDoubles.indexOf( nonTableEmotes[i] ) < 0 ) {
					noDoubles.push( nonTableEmotes[i] );
				}
			}

			newEmoteList.push( [noDoubles] );
		}

		this.emotes[this.xhrCurrentTarget] = newEmoteList;
	},


	/**
	 * After receiving the stylesheet, start extracting the emotes.
	 * @param {String} responseText Response to the request.
	 * @param {Number} lastModified A timestamp when the stylesheet has been last modified.
	 *                              (At least according to what the server tells us.)
	 * @param {String} contentType  Content-Type of the received resource. We need "text/css".
	 */
	handleCSS: function( responseText, lastModified, contentType ) {
		// Don't process if it isn't CSS.
		if( contentType == 'text/css' ) {
			// Only process the stylesheet if something changed since the last check
			// or it is a forced update.
			if( this.forceUpdate || lastModified >= META.lastSubredditCheck ) {
				// Create key for subreddit, if not already existent
				if( !this.emoteCSS.hasOwnProperty( this.xhrCurrentTarget ) ) {
					this.emoteCSS[this.xhrCurrentTarget] = [];
				}
				if( !this.emotes.hasOwnProperty( this.xhrCurrentTarget ) ) {
					this.emotes[this.xhrCurrentTarget] = [];
				}

				// Process CSS to emotes
				this.extractEmotesStep1( responseText );
				this.extractEmotesStep2();
				this.removeReverseEmotes();
				this.groupSameEmotes();
			}
		}

		// Get next subreddit CSS.
		// The reddit API guidelines say:
		// Not more than 1 request every 2 seconds.
		if( !this.isProgressFinished() ) {
			// Firefox doesn't know window.setTimeout in main.js.
			// Great. But it has require( "timers" ).setTimeout which
			// does EXACTLY THE SAME. Go figure.
			if( typeof setTimeout != 'undefined' ) {
				setTimeout( function( ev ) {
					this.getCSS( ev );
				}.bind( this ), this.xhrWait );
			}
			else {
				Timer.setTimeout( function( ev ) {
					this.getCSS( ev );
				}.bind( this ), this.xhrWait );
			}
		}
		else {
			this.getCSS();
		}
	},


	/**
	 * After receiving the stylesheet, start extracting the emotes.
	 * (Callback function for browser who use XMLHttpRequest.)
	 * @param {Boolean} hasReadyState4
	 * @param {String}  responseText
	 * @param {Number}  lastModified
	 * @param {String}  contentType
	 */
	handleCSSCallback: function( hasReadyState4, responseText, lastModified, contentType ) {
		// Firefox
		if( hasReadyState4 === true ) {
			Updater.handleCSS( responseText, lastModified, contentType );
		}
		// The rest
		else if( this.readyState == 4 ) {
			lastModified = this.getResponseHeader( 'Last-Modified' );
			contentType = this.getResponseHeader( 'Content-Type' );

			lastModified = Date.parse( lastModified );
			Updater.handleCSS( this.responseText, lastModified, contentType );
		}
	},


	/**
	 * Get the table name (A/B/C/E) for a given emote and its alternative names.
	 * @param  {Array<String>} group Emote and its names.
	 * @return {String}              Table name of the emote or false if it cannot be identified.
	 */
	identifyTableOfEmoteGroup: function( group ) {
		var emote, table;

		for( var i = group.length - 1; i >= 0; i-- ) {
			if( this.isTableCode( group[i] ) ) {
				return group[i][0].toUpperCase();
			}
		}

		return false;
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
		return ( emote.match( this.tableCodeRegex ) !== null );
	},


	/**
	 * Merge the emotes extracted from the subreddit stylesheets
	 * with our lists. Or create the list if it doesn't exist yet.
	 */
	mergeSubredditEmotesIntoLists: function() {
		var cfg = CURRENT_CONFIG;
		var r_mlp = this.emotes['r/mylittlepony'];
		var r_plounge = this.emotes['r/mlplounge'];

		// r/mylittlepony
		// Different tables to take care of.
		for( var i = 0; i < r_mlp.length; i++ ) {
			var emoteCluster = r_mlp[i];

			for( var j = 0; j < emoteCluster.length; j++ ) {
				var group = emoteCluster[j];
				var table = this.identifyTableOfEmoteGroup( group );

				if( table === false ) {
					continue;
				}

				switch( table ) {
					case 'A':
						table = cfg.listNameTableA;
						break;

					case 'B':
						table = cfg.listNameTableB;
						break;

					case 'C':
						table = cfg.listNameTableC;
						break;

					case 'E':
						table = cfg.listNameTableE;
						break;

					case 'F':
						table = cfg.listNameTableF;
						break;

					case 'G':
						table = cfg.listNameTableG;
						break;
				}

				// Create table if not there anymore
				if( !CURRENT_EMOTES.hasOwnProperty( table ) ) {
					CURRENT_EMOTES[table] = [];
				}

				// Add emote to the table if not in there already
				var add = false;

				for( var k = 0; k < group.length; k++ ) {
					if( group.length > 1 && this.isTableCode( group[k] ) ) {
						continue;
					}
					if( CURRENT_EMOTES[table].indexOf( group[k] ) >= 0 ) {
						add = false;
						break;
					}
					if( add === false ) {
						add = group[k];
					}
				}
				if( add !== false ) {
					CURRENT_EMOTES[table].push( add );
				}
			}
		}

		// r/mlplounge
		// No tables, but additional emotes.
		for( var i = 0; i < r_plounge.length; i++ ) {
			var emoteCluster = r_plounge[i];

			for( var j = 0; j < emoteCluster.length; j++ ) {
				var group = emoteCluster[j];
				var table = this.identifyTableOfEmoteGroup( group );

				if( table !== false ) {
					continue;
				}

				if( !CURRENT_EMOTES.hasOwnProperty( cfg.listNamePlounge ) ) {
					CURRENT_EMOTES[cfg.listNamePlounge] = [];
				}

				for( var k = 0; k < group.length; k++ ) {
					if( CURRENT_EMOTES[cfg.listNamePlounge].indexOf( group[k] ) < 0 ) {
						CURRENT_EMOTES[cfg.listNamePlounge].push( group[k] );
					}
				}
			}
		}
	},


	/**
	 * Remove wrongly identified CSS.
	 * @param  {Array<String>} css
	 * @return {String}
	 */
	removeNonEmoteCSS: function( css ) {
		var purgedCSS = [];

		for( var i = 0; i < css.length; i++ ) {
			var purged = css[i];
			var idx = purged.indexOf( this.linkStart );
			var idxFilly = purged.indexOf( 'a[href="/filly"]' );
			// var idxReverse = purged.indexOf( this.linkStartReverse );

			// Alrighty, there is at least one emote selector in there
			if( idx >= 0 || idxFilly >= 0 ) {

				// Remove the non-emote selectors ...
				var parts = purged.split( '{' );
				var selectors = parts[0].split( ',' );
				purged = '';

				// ... by only keeping the emote selectors
				for( var j = 0; j < selectors.length; j++ ) {
					var s = selectors[j];
					idx = s.indexOf( this.linkStart );
					idxFilly = s.indexOf( 'a[href="/filly"]' );

					if( idx >= 0 || idxFilly >= 0 ) {
						purged += ',' + s;
					}
				}

				purged = purged.substring( 1 ) + '{' + parts[1];
				purgedCSS.push( purged );
			}
			// else if( idxReverse >= 0 ) {
			// 	purgedCSS.push( purged );
			// }
		}

		return purgedCSS.join( '\n' );
	},


	/**
	 * Remove the emotes which are simply mirrored versions of others.
	 */
	removeReverseEmotes: function() {
		var emotesCurrent = this.emotes[this.xhrCurrentTarget];
		var flatCopy = [];
		var newEmoteList = [];

		// Create a flat copy of the emotes for easier searching.
		for( var i = 0; i < emotesCurrent.length; i++ ) {
			flatCopy = flatCopy.concat( emotesCurrent[i] );
		}

		// Create a new (not flat) emote list with only non-reversed emotes.
		for( var i = 0; i < emotesCurrent.length; i++ ) {
			newEmoteList[i] = [];

			for( var j = 0; j < emotesCurrent[i].length; j++ ) {
				var emote = emotesCurrent[i][j];

				// If the emote doesn't start with "r" or does, but the
				// part after the first "r" isn't a known emote: keep it
				if( emote[0] != 'r' || flatCopy.indexOf( emote.substr( 1 ) ) == -1 ) {
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
		META.lastSubredditCheck = Date.now();
		saveToStorage( PREF.META, META );

		var flagUpdateSuccess = true;

		for( var i = 0; i < this.xhrTargets.length; i++ ) {
			if(
				!this.emotes.hasOwnProperty( this.xhrTargets[i] ) ||
				this.emotes[this.xhrTargets[i]].length === 0
			) {
				flagUpdateSuccess = false;
			}
		}

		if( flagUpdateSuccess ) {
			saveToStorage( PREF.SUBREDDIT_CSS, this.emoteCSS );
			saveToStorage( PREF.SUBREDDIT_EMOTES, this.emotes );

			this.mergeSubredditEmotesIntoLists();
			saveToStorage( PREF.EMOTES, CURRENT_EMOTES );
		}

		if( this.forceUpdate ) {
			var response = { task: BG_TASK.UPDATE_CSS };

			if( I_AM === BROWSER.CHROME ) {
				chrome.tabs.sendMessage( this.forceSource.tab.id, response, null );
			}
			else if( I_AM === BROWSER.FIREFOX_WEBEXT ) {
				var promise = browser.tabs.sendMessage( this.forceSource.tab.id, response );
				promise.then(
					null,
					function( err ) {
						console.error( err );
					}
				);
			}
			else {
				MyBrowser.respond( this.forceSource, response );
			}
		}

		this.forceUpdate = false;
		this.forceSource = null;
		this.emoteCSS = {};
		this.emotes = {};
		this.xhrProgress = 0;
	}


};



/**
 * Receive message from inline script and answer back.
 * @param {Event}  ev
 * @param {Object} sender (Chrome and Firefox only)
 * @param {Object} sendResponse (Chrome only)
 */
function handleMessage( ev, sender, sendResponse ) {
	var response = {};
	var data = ev.data ? ev.data : ev;
	var source = sender ? sender : ev.source;
	var broadcast = false;

	// Only handle messages which come with a set task.
	if( !data.task ) {
		MyBrowser.logError( 'Background process: No task specified.' );
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
			response = loadConfigAndEmotes( { task: data.task }, source, !!data.loadMeta );
			break;

		case BG_TASK.SAVE_EMOTES:
			// Currently we have more than 1 list, but the update is empty.
			// This is too suspicious and shouldn't happen. Don't do it.
			if( CURRENT_EMOTES.length >= 2 && data.emotes.length <= 0 ) {
				response.success = false;
				break;
			}
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
			return;

		case BG_TASK.UPDATE_CSS:
			Updater.forceUpdate = true;
			Updater.forceSource = source;
			Updater.getCSSURLs();
			return;

		default:
			MyBrowser.logError( 'Background process: Unknown task given - "' + data.task + '".' );
			return;
	}

	response.task = data.task;

	if( broadcast ) {
		MyBrowser.broadcast( source, response );
	}
	else {
		MyBrowser.respond( source, response );
	}
}


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
}


/**
 * Load the configuration and lists/emotes from the extension storage.
 * @param  {Object}  response Part of the response object to send. Contains the task value.
 * @param  {Object}  sender   Sender of message. Used to send response. (Chrome and Firefox only)
 * @param  {Boolean} loadMeta True, if META data shall be included in the response.
 * @return {Object}           Response with the loaded config and emotes.
 */
function loadConfigAndEmotes( response, sender, loadMeta ) {
	if( !response ) {
		response = {};
	}

	try {
		response = MyBrowser.loadConfigAndEmotes( response, sender, loadMeta );
	}
	catch( err ) {
		MyBrowser.logError( 'Background process: Could not load preferences.' );
		MyBrowser.logError( err );
	}

	return response;
}


/**
 * Merge the currently loaded emotes with the update.
 * @param  {Object} emotes  Changed lists with their emotes.
 * @return {Object} Updated emote lists.
 */
function mergeEmotesWithUpdate( emotes ) {
	for( var key in emotes ) {
		CURRENT_EMOTES[key] = emotes[key];
	}
}


/**
 * Merge the config obj with the current config.
 * So only changes are overwritten and all other values are preserved.
 * Unknown config keys in obj will be removed!
 * @param  {Object} obj
 * @return {Object}
 */
function mergeWithConfig( obj ) {
	var obj_new = {};

	if( !CURRENT_CONFIG ) {
		loadConfigAndEmotes( {} );
	}

	// Remove unknown config keys
	for( var key in obj ) {
		if( CURRENT_CONFIG.hasOwnProperty( key ) ) {
			obj_new[key] = obj[key];
		}
	}

	// Add missing config keys
	for( var key in CURRENT_CONFIG ) {
		if( !obj_new.hasOwnProperty( key ) ) {
			obj_new[key] = CURRENT_CONFIG[key];
		}
	}

	return obj_new;
}


/**
 * Save a default value to the extension storage.
 * @param  {Number} key Key to save the object under.
 * @param  {Object} obj Default value to save.
 * @return {Object}     Default value. Same as parameter "obj".
 */
function saveDefaultToStorage( key, obj ) {
	var r = saveToStorage( key, obj );
	var msg = r.success ?
	          'Background process: "' + key + '" not in extension preferences yet. Created default.' :
	          'Background process: Could not save default value.';

	MyBrowser.logError( msg );

	return obj;
}


/**
 * Save to the extension storage.
 * @param  {Number} key Key to save the object under.
 * @param  {Object} obj Object to save.
 * @return {Object}     Contains key "success" with a boolean value.
 */
function saveToStorage( key, obj ) {
	var obj_json;

	if( !obj ) {
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
}


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
}


MyBrowser.registerMessageHandler( handleMessage );
