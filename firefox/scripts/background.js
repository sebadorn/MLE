'use strict';


// Set an individual User-Agent for our XMLHttpRequests.
browser.webRequest.onBeforeSendHeaders.addListener(
	/**
	 * Modify user-agent
	 * @param {BlockingResponse} details
	 * @returns {BlockingResponse}
	 */
	details => {
		/** @type {object[]} */
		const headers = details.requestHeaders || [];
		const headerIndexMLE = headers.findIndex( header => header.name === 'MLE-Addon-Request' );

		if( headerIndexMLE > -1 ) {
			headers.splice( headerIndexMLE, 1 );

			for( let i = 0; i < headers.length; i++ ) {
				const header = headers[i];

				if( header.name.toLowerCase() === 'user-agent' ) {
					header.value = Updater.xhrUserAgent;
					break;
				}
			}
		}

		return details;
	},
	// filter
	{
		urls: ['*://*/*'],
		types: ['xmlhttprequest'],
	},
	// extraInfoSpec
	['requestHeaders', 'blocking']
);


// Keys
const PREF = {
	CONFIG: 'mle.config',
	EMOTES: 'mle.emotes',
	META: 'mle.meta',
	SUBREDDIT_CSS: 'mle.subreddit.css',
	SUBREDDIT_EMOTES: 'mle.subreddit.emotes',
};


const DEFAULT_SUB_CSS = {};
const DEFAULT_SUB_EMOTES = {};


// Information that the user won't need to backup
const DEFAULT_META = {
	lastSubredditCheck: 0,
};


// Default config
const DEFAULT_CONFIG = {
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
	ctxMenu: true,
	ctxStyleBgColor: '#ffffff',
	ctxStyleBorderColor: '#d0d0d0',
	ctxStyleColor: '#101010',
	ctxStyleHoverColor: '#cee3f8',
	displayEmotesOutOfSub: true,
	injectEmoteCSS: true,
	intervalToCheckCSS: 172800000, // [ms], default is 2 days.
	keyReverse: 17, // ctrl
	listNameTableA: 'A', // Name of the list for the emotes of table A
	listNameTableB: 'B', // Name of the list for the emotes of table B
	listNameTableC: 'C', // Name of the list for the emotes of table C
	listNameTableE: 'E', // Name of the list for the emotes of table E
	listNameTableF: 'F', // Name of the list for the emotes of table F
	listNameTableG: 'G', // Name of the list for the emotes of table G
	listNameTableH: 'H', // Name of the list for the emotes of table H
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
	showTitleStyleBgColor: 'rgba(255,255,255,0.0)',
	showTitleStyleBorderColor: 'rgba(255,255,255,0.0)',
	showTitleStyleColor: '#808080',
	showTitleStyleDisplay: 'block', // "block" or "float"
	stopEmoteLinkFollowing: true,
};


// Default emotes of r/mylittlepony and r/MLPLounge
const DEFAULT_EMOTES = {
	'A': [
		'twipride', 'twicrazy', 'twiright', 'twibeam', 'spikemeh',
		'celestiawut', 'celestiamad', 'lunateehee', 'lunawait', 'paperbagderpy',
		'ppfear', 'ppcute', 'pinkieawe', 'ajhappy', 'ajsup',
		'applegasp', 'applederp', 'ajlie', 'abbored', 'abmeh',
		'swagintosh', 'grannysmith', 'flutterwhoa', 'flutterroll', 'flutterjerk',
		'rdcry', 'scootaderp', 'scootaplease', 'scootacheer', 'ohcomeon',
		'sbbook', 'raritypaper', 'raritydaww', 'rarityreally', 'rarishock',
		'shiningarmor', 'cadence', 'chrysalis', 'priceless', 'silverspoon',
	],
	'B': [
		'ppseesyou', 'ppshrug', 'ppboring', 'rdcool', 'rdsmile',
		'soawesome', 'rdwut', 'squintyjack', 'ajsly', 'ajcower',
		'ajugh', 'ajwut', 'abwut', 'eeyup', 'fluttershh',
		'fluttershy', 'fluttersrs', 'flutterfear', 'flutterwink', 'flutteryay',
		'spikenervous', 'takealetter', 'noooo', 'spikepushy', 'manspike',
		'facehoof', 'twisquint', 'twirage', 'dumbfabric', 'rarityyell',
		'raritywhine', 'raritydress', 'rarityannoyed', 'raritywut', 'raritywhy',
		'rarityjudge', 'rarityprimp', 'trixiesmug', 'dj', 'cockatrice',
	],
	'C': [
		'rdsitting', 'rdhappy', 'rdannoyed', 'gross', 'louder',
		'rdscared', 'twistare', 'twismug', 'twismile', 'twidaw',
		'ohhi', 'party', 'hahaha', 'joy', 'pinkamina',
		'ppreally', 'ajfrown', 'hmmm', 'flutterblush', 'loveme',
		'whattheflut', 'fluttercry', 'raritysad', 'fabulous', 'sneakybelle',
		'scootaloo', 'derpyhappy', 'derp', 'derpyshock', 'lunasad',
		'lunagasp', 'celestia', 'cadencesmile', 'shiningpride', 'angel',
		'allmybits', 'zecora', 'photofinish', 'trixiesad', 'changeling',
	],
	'E': [
		'fillytgap', 'rdhuh', 'rdsalute', 'awwyeah', 'twiponder',
		'twisad', 'spikewtf', 'huhhuh', 'wahaha', 'sbstare',
		'cutealoo', 'ajconfused', 'absmile', 'abhuh', 'macintears',
		'lyra', 'bonbon', 'spitfire', 'happyluna', 'sotrue',
		'nmm', 'berry', 'whooves', 'octavia', 'colgate',
		'cheerilee', 'lily', 'gilda', 'snails', 'dealwithit',
		'discentia', 'maud', 'discordsad', 'lunamad', 'pinkiepout',
		'twisecret', 'spikehappy', 'scootablue', 'sunsetshimmer', 'sunsetsneaky',
	],
	'F': [
		'pinkiesad', 'diamondtiara', 'sombra', 'sbshocked', 'guard',
		'abstern', 'apathia', 'ajcry', 'rarityeww', 'flutterkay',
		'starlightrage', 'bulkbiceps', 'scootaeww', 'discordgrump', 'troubleshoes',
		'rdsnrk', 'thcalm', 'ooh', 'raritytired', 'notangry',
		'ajdoubt', 'spikewhoa', 'wasntme', 'twipbbt', 'flimflam',
		'cocosmile', 'skeptiloo', 'limestonegrin', 'raritygrump', 'goodjob',
		'flutterhay', 'sbwtf', 'nightmaregrin', 'spikeapproves', 'flutternice',
		'ppdont', 'ajgrump', 'sgpopcorn', 'raritysquee', 'gummystare',
	],
	'G': [
		'karma', 'sbfocus', 'lunagrump', 'twisheepish',
		'discentiajudge', 'sgsneaky', 'sgeesh', 'skystarfine',
		'twisnide', 'trixieww', 'twieek', 'ajeesh',
		'pinkie', 'flutterplz', 'tempest', 'pinkiesugar',
		'cococold', 'emberwtf', 'tempestsmile', 'flutternope',
		'quibble', 'sunsetwhyme', 'squeestar', 'twishame',
		'rdthis', 'abteehee', 'appleroll', 'pinkiesmoosh',
		'flutterbrow', 'squintyglam', 'spikeholdup', 'starlightspittle',
		'celestiahurt', 'rdsup', 'tempestgaze', 'sunburstnervous',
		'sgconcern', 'celestiahappy', 'squeekiepie', 'spikewoke',
	],
	'H': [
		'abgrump', 'gallus', 'cozyglow', 'smolderscowl',
		'celestiawink', 'sandbaruhh', 'shiningsmug', 'pinkiesmug',
		'celestiasquint', 'silverbored', 'rarischeme', 'peekaloo',
		'sunsetgrump', 'ocellus', 'twipudding', 'flutterball',
		'sunspicious', 'smolder', 'scootaglance', 'tirek',
		'twicoffee', 'smolderwelp', 'crazyglow', 'winxie',
		'twiomg', 'silverstream', 'starlightsly', 'spikescowl',
		'yak', 'ajpuzzle', 'rdeyy', 'starlightno',
		'starlightisee', 'pinkieeager', 'galluswtf', 'smolderrage',
		'yona', 'trixiecheer', 'twifret', 'lunaloom',
	],
	'Plounge': [
		'fillyrarity', 'twidurr', 'amazingmagic', 'karmasalute', 'dishappy',
		'karmastare', 'ohnoes', 'filly', 'sabee', 'gayagenda', 'happybee',
	],
};

let CURRENT_CONFIG = null;
let CURRENT_EMOTES = null;
let META = null;
let SUBREDDIT_CSS = null;
let SUBREDDIT_EMOTES = null;


/**
 * Browser namespace for Firefox.
 * @type {object}
 */
const MyBrowser = {


	tabs: [],


	/**
	 * Broadcast a message to everything extension related.
	 * @param {Object} sender
	 * @param {Object} msg
	 */
	broadcast( sender, msg ) {
		console.debug( '[MyBrowser.broadcast]', sender, msg );

		const makeCb = sender => {
			return response => {
				if( response ) {
					handleMessage( { data: response }, sender );
				}
			};
		};

		for( let i = 0; i < this.tabs.length; i++ ) {
			if( sender && sender.tab.id == this.tabs[i] ) {
				continue;
			}

			browser.tabs.sendMessage( this.tabs[i], msg )
				.then( makeCb( sender ) )
				.catch( err => console.error( '[MyBrowser.broadcast]', err ) );
		}
	},


	/**
	 * Handle the items loaded from the storage.
	 * (this == binded object with variables)
	 * @param {Object} items Loaded items in key/value pairs.
	 */
	handleLoadedItems( items ) {
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
			const cb = response => {
				if( response ) {
					handleMessage( { data: response }, this.sender );
				}
			};

			browser.tabs.sendMessage( this.sender.tab.id, this.response )
				.then( cb )
				.catch( err => console.error( '[MyBrowser.handleLoadedItems] Send to:', this.sender, err ) );
		}
	},


	/**
	 * Load config and emotes.
	 * @param  {Object}  response Response object that will get send to the content script.
	 * @param  {Object}  sender   Sender of message. Used to send response.
	 * @param  {Boolean} loadMeta True, if META data shall be included in the response.
	 * @return {Object}  response
	 */
	loadConfigAndEmotes( response, sender, loadMeta ) {
		const packet = {
			loadMeta: loadMeta,
			response: response,
			sender: sender,
		};

		// Remember this tab in which MLE is running
		if( this.tabs.indexOf( sender.tab.id ) < 0 ) {
			this.tabs.push( sender.tab.id );
		}

		browser.tabs.onRemoved.addListener( this.onTabRemove.bind( this ) );

		browser.storage.local.get()
			.then( this.handleLoadedItems.bind( packet ) )
			.catch( err => console.error( '[MyBrowser.loadConfigAndEmotes]', err ) );

		// Response unaltered.
		// Actual response happens in this.handleLoadedItems.
		return response;
	},


	/**
	 * Called when a tab is closed.
	 * @param {Number} tabId ID of the removed tab.
	 * @param {Object} info
	 */
	onTabRemove( tabId, _info ) {
		const idx = this.tabs.indexOf( tabId );

		if( idx >= 0 ) {
			this.tabs.splice( idx, 1 );
		}
	},


	/**
	 * Open the options page.
	 */
	openOptions() {
		const create = {
			url: browser.runtime.getURL( 'options.html' ),
			active: true,
		};

		browser.tabs.create( create )
			.catch( err => console.error( '[MyBrowser.openOptions]', err ) );
	},


	/**
	 * Register a function to handle messaging between pages.
	 * @param {Function} handler
	 */
	registerMessageHandler( handler ) {
		browser.runtime.onMessage.addListener( ( msg, sender, sendResponse ) => {
			handler( { data: msg }, sender, sendResponse );
		} );
	},


	/**
	 * Send a response to a page that previously send a message.
	 * THIS IS JUST A DUMMY FUNCTION.
	 * @see   BrowserChrome.loadConfigAndEmotes()
	 * @param {Object} _source
	 * @param {Object} _msg
	 */
	respond( _source, _msg ) {
		// pass
	},


	/**
	 * Save to extension storage.
	 * @param {String} key
	 * @param {String} val String as JSON.
	 */
	save( key, val ) {
		console.debug( `[MyBrowser.save] Saving for "${key}" string with length ${val.length}...` );

		const saveObj = {};
		saveObj[key] = val;

		browser.storage.local.set( saveObj )
			.then( () => console.debug( '[MyBrowser.save] Success' ) )
			.catch( err => console.error( '[MyBrowser.save]', err ) );
	},


	/**
	 * Send a HTTP request.
	 * @param {string} url URL to send the request to.
	 * @param {string} [method = 'GET']
	 * @returns {string}
	 */
	async sendRequest( url, method = 'GET' ) {
		console.debug( '[MyBrowser.sendRequest]', method, url );

		const response = await fetch( url, {
			method: method,
			headers: {
				'MLE-Addon-Request': '1',
			},
		} );

		return await response.text();
	},


};


/**
 * Getting the sub-reddit CSS and extracting the emotes.
 * @type {Object}
 */
const Updater = {


	// Config
	xhrTargets: [
		'r/mylittlepony',
		'r/mlplounge',
	],
	xhrUserAgent: 'browser:MLE:2.11.1 (by /u/meinstuhlknarrt)',
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
	tableCodeRegex: /^[abcefgh][0-9]{2}$/i,

	emoteCSS: {},
	emotes: {},


	/**
	 * Check if it is time for scheduled update
	 * and start the process if it is the case.
	 */
	check() {
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
	extractEmotesStep1( css ) {
		let cssCopy = css;
		let emoteCSS = [];
		let needleImage = 'background-image';
		let needlePosition = 'background-position';
		let needleTransform = 'transform';
		let selectors = [];


		// CSS code for reversing emotes

		let rCSS = this.getReverseEmotesCSS( css );

		if( rCSS !== false ) {
			emoteCSS.push( rCSS );
		}


		while( true ) {
			let idxImage = cssCopy.indexOf( needleImage );
			let idxPosition = cssCopy.indexOf( needlePosition );
			let idxTransform = cssCopy.indexOf( needleTransform );
			let ignoreSelectors = false;

			if( idxImage < 0 && idxPosition < 0 && idxTransform < 0 ) {
				break;
			}

			// Pick the index that appears first

			idxImage = ( idxImage < 0 ) ? Infinity : idxImage;
			idxPosition = ( idxPosition < 0 ) ? Infinity : idxPosition;
			idxTransform = ( idxTransform < 0 ) ? Infinity : idxTransform;

			let firstIdx = Math.min( idxImage, idxPosition, idxTransform );
			let idx = -1;
			let needleLength = 0;

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

			let selector = [];
			let eCSS = [];
			let record = false;

			// Get the selectors and part of the CSS
			for( let i = idx; i > 0; i-- ) {
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
	extractEmotesStep2() {
		let emotesCurrent = this.emotes[this.xhrCurrentTarget];
		let cssCurrent = this.emoteCSS[this.xhrCurrentTarget];
		let emotes = [];
		let idx = -1;

		// Extract emote names
		for( let i = 0; i < emotesCurrent.length; i++ ) {
			let selector = emotesCurrent[i].split( ',' );
			let subEmoteList = [];

			for( let j = 0; j < selector.length; j++ ) {
				let emote = selector[j].trim();
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
	async getCSS() {
		if( this.isProgressFinished() ) {
			this.wrapUp();
			return;
		}

		let url = this.xhrTargetsCSS[this.xhrProgress];

		this.xhrCurrentTarget = this.xhrTargets[this.xhrProgress];
		this.xhrProgress++;

		try {
			const responseText = await MyBrowser.sendRequest( url );
			this.handleCSSCallback( responseText );
		}
		catch( err ) {
			console.error( '[Updater.getCSS]', err );
		}
	},


	/**
	 * Get the URLs to the CSS files.
	 */
	async getCSSURLs() {
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
		const url = 'https://old.reddit.com/' + this.xhrCurrentTarget;

		try {
			const responseText = await MyBrowser.sendRequest( url );
			this.getCSSURLsCallback( responseText );
		}
		catch( err ) {
			console.error( '[Updater.getCSSURLs]', err );
		}
	},


	/**
	 * Handle the XHR callback for the request for a page from
	 * which we can extract the CSS URL.
	 * @param {string} responseText
	 */
	getCSSURLsCallback( responseText ) {
		let url = responseText.match( /href="[a-zA-Z0-9/.:\-_+]+" (ref="applied_subreddit_stylesheet")? title="applied_subreddit_stylesheet"/ );

		if( !url ) {
			console.error( '[Updater.getCSSURLsCallback] No CSS URL found.' );
			return;
		}

		url = url[0];
		url = url.substr( 6 );
		url = url.replace( '" ref="applied_subreddit_stylesheet', '' );
		url = url.replace( '" title="applied_subreddit_stylesheet"', '' );

		Updater.xhrTargetsCSS.push( url );

		// Get the next CSS URL.
		setTimeout( () => Updater.getCSSURLs(), Updater.xhrWait );
	},


	/**
	 * Get the rest of the relevant CSS part starting from
	 * the found needle position to the end of the rule.
	 * @param  {String} cssCopy Current part of the CSS.
	 * @param  {Number} idx     Index of the found needle.
	 * @return {String}         Extracted CSS.
	 */
	getRestOfCSS( cssCopy, idx ) {
		let css = '';

		for( let i = idx + 1; i < cssCopy.length; i++ ) {
			css += cssCopy[i];

			if( cssCopy[i] === '}' ) {
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
	getReverseEmotesCSS( css ) {
		let rCSS = false;
		let idxReverse = css.indexOf( this.linkStartReverse );

		if( idxReverse >= 0 ) {
			rCSS = css.substring( idxReverse );
			let idxEnd = rCSS.indexOf( '}' );
			rCSS = rCSS.substring( 0, idxEnd + 1 );
		}

		return rCSS;
	},


	/**
	 * Group emotes that show the same image but have different names.
	 * This is kind of unstable since it depends on the CSS authors' style not to change.
	 */
	groupSameEmotes() {
		let emotesCurrent = this.emotes[this.xhrCurrentTarget];
		let newEmoteList = [];
		let nonTableEmotes = [];


		// Get a list of lists with all the emotes that share the same background position
		let emotesCurrentCSS = this.emoteCSS[this.xhrCurrentTarget].split( '\n' );
		let lineEmotes = [];

		for( let i = 0; i < emotesCurrentCSS.length; i++ ) {
			let line = emotesCurrentCSS[i];

			if( line.indexOf( 'background-position:' ) == -1 ) {
				continue;
			}

			line = line.substr( 0, line.indexOf( '{' ) ) + ',';
			line = line.replace( /a\[href\|="\/([a-zA-Z0-9-_]+)"\],/g, '$1::' );
			line = line.substr( 0, line.length - 2 );
			lineEmotes.push( line.split( '::' ) );
		}


		// Iterate over (presumably) emote tables
		for( let i = 0; i < emotesCurrent.length; i++ ) {
			let newEmoteSubList = [];
			let ecCopy = emotesCurrent[i].slice( 0 );

			// Iterate over emotes of a table
			for( let j = 0; j < emotesCurrent[i].length; j++ ) {
				let emote = emotesCurrent[i][j];

				// Emote has already been checked and was an alternate name for another one
				if( ecCopy.indexOf( emote ) == -1 ) {
					continue;
				}

				let group = [emote];

				for( let k = 0; k < ecCopy.length; k++ ) {
					let emote2 = ecCopy[k];
					let originalFound = false;
					let emote2Found = false;

					if( emote2 == emote ) {
						continue;
					}

					// Iterate over list of lists of emotes with same background position
					for( let l = 0; l < lineEmotes.length; l++ ) {

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
				let belongsToTable = false;

				for( let rem = 0; rem < group.length; rem++ ) {
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

		let noDoubles = [];

		if( nonTableEmotes.length > 0 ) {
			// Remove doubled emotes
			for( let i = 0; i < nonTableEmotes.length; i++ ) {
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
	handleCSS( responseText, lastModified, contentType ) {
		// Don't process if it isn't CSS.
		if( contentType === 'text/css' ) {
			// Only process the stylesheet if something changed since the last check
			// or it is a forced update.
			if( this.forceUpdate || lastModified >= META.lastSubredditCheck ) {
				// Create key for subreddit, if not already existent
				if( !Object.prototype.hasOwnProperty.call( this.emoteCSS, this.xhrCurrentTarget ) ) {
					this.emoteCSS[this.xhrCurrentTarget] = [];
				}
				if( !Object.prototype.hasOwnProperty.call( this.emotes, this.xhrCurrentTarget ) ) {
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
			setTimeout( ev => this.getCSS( ev ), this.xhrWait );
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
	handleCSSCallback( hasReadyState4, responseText, lastModified, contentType ) {
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
	identifyTableOfEmoteGroup( group ) {
		for( let i = group.length - 1; i >= 0; i-- ) {
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
	isProgressFinished() {
		return this.xhrProgress >= this.xhrTargets.length;
	},


	/**
	 * Checks if a given emote is in table code form, for example "a02".
	 * @param  {String}  emote Emote name.
	 * @return {Boolean}       True if the emote is in table code form, false otherwise.
	 */
	isTableCode( emote ) {
		return emote.match( this.tableCodeRegex ) !== null;
	},


	/**
	 * Merge the emotes extracted from the subreddit stylesheets
	 * with our lists. Or create the list if it doesn't exist yet.
	 */
	mergeSubredditEmotesIntoLists() {
		const cfg = CURRENT_CONFIG;
		const r_mlp = this.emotes['r/mylittlepony'];
		const r_plounge = this.emotes['r/mlplounge'];

		// r/mylittlepony
		// Different tables to take care of.
		for( let i = 0; i < r_mlp.length; i++ ) {
			let emoteCluster = r_mlp[i];

			for( let j = 0; j < emoteCluster.length; j++ ) {
				let group = emoteCluster[j];
				let table = this.identifyTableOfEmoteGroup( group );

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

					case 'H':
						table = cfg.listNameTableH;
						break;
				}

				// Create table if not there anymore
				if( !Object.prototype.hasOwnProperty.call( CURRENT_EMOTES, table ) ) {
					CURRENT_EMOTES[table] = [];
				}

				// Add emote to the table if not in there already
				let add = false;

				for( let k = 0; k < group.length; k++ ) {
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
		for( let i = 0; i < r_plounge.length; i++ ) {
			let emoteCluster = r_plounge[i];

			for( let j = 0; j < emoteCluster.length; j++ ) {
				let group = emoteCluster[j];
				let table = this.identifyTableOfEmoteGroup( group );

				if( table !== false ) {
					continue;
				}

				if( !Object.prototype.hasOwnProperty.call( CURRENT_EMOTES, cfg.listNamePlounge ) ) {
					CURRENT_EMOTES[cfg.listNamePlounge] = [];
				}

				for( let k = 0; k < group.length; k++ ) {
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
	removeNonEmoteCSS( css ) {
		let purgedCSS = [];

		for( let i = 0; i < css.length; i++ ) {
			let purged = css[i];
			let idx = purged.indexOf( this.linkStart );
			let idxFilly = purged.indexOf( 'a[href="/filly"]' );

			// Alrighty, there is at least one emote selector in there
			if( idx >= 0 || idxFilly >= 0 ) {

				// Remove the non-emote selectors ...
				let parts = purged.split( '{' );
				let selectors = parts[0].split( ',' );
				purged = '';

				// ... by only keeping the emote selectors
				for( let j = 0; j < selectors.length; j++ ) {
					let s = selectors[j];
					idx = s.indexOf( this.linkStart );
					idxFilly = s.indexOf( 'a[href="/filly"]' );

					if( idx >= 0 || idxFilly >= 0 ) {
						purged += ',' + s;
					}
				}

				purged = purged.substring( 1 ) + '{' + parts[1];
				purgedCSS.push( purged );
			}
		}

		return purgedCSS.join( '\n' );
	},


	/**
	 * Remove the emotes which are simply mirrored versions of others.
	 */
	removeReverseEmotes() {
		let emotesCurrent = this.emotes[this.xhrCurrentTarget];
		let flatCopy = [];
		let newEmoteList = [];

		// Create a flat copy of the emotes for easier searching.
		for( let i = 0; i < emotesCurrent.length; i++ ) {
			flatCopy = flatCopy.concat( emotesCurrent[i] );
		}

		// Create a new (not flat) emote list with only non-reversed emotes.
		for( let i = 0; i < emotesCurrent.length; i++ ) {
			newEmoteList[i] = [];

			for( let j = 0; j < emotesCurrent[i].length; j++ ) {
				let emote = emotesCurrent[i][j];

				// If the emote doesn't start with "r" or does, but the
				// part after the first "r" isn't a known emote: keep it
				if( emote[0] != 'r' || flatCopy.indexOf( emote.substr( 1 ) ) == -1 ) {
					newEmoteList[i].push( emote );
				}
			}
		}

		// Save the new emote list and fitler out now empty sub-lists.
		this.emotes[this.xhrCurrentTarget] = [];

		for( let i = 0; i < newEmoteList.length; i++ ) {
			if( newEmoteList[i].length > 0 ) {
				this.emotes[this.xhrCurrentTarget].push( newEmoteList[i].slice( 0 ) );
			}
		}
	},


	/**
	 * Called at the end of updating ALL subreddit CSS.
	 * Saves the emotes and CSS. Resets counter.
	 */
	wrapUp() {
		META.lastSubredditCheck = Date.now();
		saveToStorage( PREF.META, META );

		let flagUpdateSuccess = true;

		for( let i = 0; i < this.xhrTargets.length; i++ ) {
			if(
				!Object.prototype.hasOwnProperty.call( this.emotes, this.xhrTargets[i] ) ||
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
			let response = { task: BG_TASK.UPDATE_CSS };
			let promise = browser.tabs.sendMessage( this.forceSource.tab.id, response );
			promise.then(
				null,
				function( err ) {
					console.error( err );
				}
			);
		}

		this.forceUpdate = false;
		this.forceSource = null;
		this.emoteCSS = {};
		this.emotes = {};
		this.xhrProgress = 0;
	},


};



/**
 * Receive message from inline script and answer back.
 * @param {Event}  ev
 * @param {Object} sender (Chrome and Firefox only)
 * @param {Object} sendResponse (Chrome only)
 */
function handleMessage( ev, sender, _sendResponse ) {
	let response = {};
	let data = ev.data ? ev.data : ev;
	let source = sender ? sender : ev.source;
	let broadcast = false;

	// Only handle messages which come with a set task.
	if( !data.task ) {
		console.error( '[handleMessage] Background process: No task specified.' );
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
			{
				let u = data.update;
				changeListName( u.oldName, u.newName );
				saveToStorage( PREF.EMOTES, CURRENT_EMOTES );
				response.update = u;
				broadcast = true;
			}
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
			{
				let config = data.config || data.update;
				CURRENT_CONFIG = mergeWithConfig( config );
				response = saveToStorage( PREF.CONFIG, CURRENT_CONFIG );
				response.config = CURRENT_CONFIG;
			}
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
			console.error( `[handleMessage] Background process: Unknown task given - "${data.task}".` );
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
	let emotesNew = {};

	for( const key in CURRENT_EMOTES ) {
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
		console.error( '[loadConfigAndEmotes] Background process: Could not load preferences.', err );
	}

	return response;
}


/**
 * Merge the currently loaded emotes with the update.
 * @param  {Object} emotes  Changed lists with their emotes.
 * @return {Object} Updated emote lists.
 */
function mergeEmotesWithUpdate( emotes ) {
	for( const key in emotes ) {
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
	let obj_new = {};

	if( !CURRENT_CONFIG ) {
		loadConfigAndEmotes( {} );
	}

	// Remove unknown config keys
	for( const key in obj ) {
		if( Object.prototype.hasOwnProperty.call( CURRENT_CONFIG, key ) ) {
			obj_new[key] = obj[key];
		}
	}

	// Add missing config keys
	for( const key in CURRENT_CONFIG ) {
		if( !Object.prototype.hasOwnProperty.call( obj_new, key ) ) {
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
	const r = saveToStorage( key, obj );

	if( r.success ) {
		console.debug( `[saveDefaultToStorage] Background process: "${key}" not in extension preferences yet. Created default.` );
	}
	else {
		console.error( '[saveDefaultToStorage] Background process: Could not save default value.' );
	}

	return obj;
}


/**
 * Save to the extension storage.
 * @param  {Number} key Key to save the object under.
 * @param  {Object} obj Object to save.
 * @return {Object}     Contains key "success" with a boolean value.
 */
function saveToStorage( key, obj ) {
	let obj_json;

	if( !obj ) {
		return { success: false };
	}

	try {
		obj_json = JSON.stringify( obj );
	}
	catch( err ) {
		console.error( '[saveToStorage]', err );
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
	for( const key in defaultValues ) {
		if( !Object.prototype.hasOwnProperty.call( current, key ) ) {
			current[key] = defaultValues[key];
		}
	}

	saveToStorage( storageKey, current );

	return current;
}


MyBrowser.registerMessageHandler( handleMessage );
