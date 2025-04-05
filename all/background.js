'use strict';


// eslint-disable-next-line no-redeclare
const BG_TASK = {
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
	UPDATE_CSS: 11,
};


// Keys
const PREF = {
	CONFIG_OLD: 'mle.config', // old: value was saved as JSON
	CONFIG: 'mle.config.obj', // new: value saved as object
	EMOTES_OLD: 'mle.emotes',
	EMOTES: 'mle.emotes.obj',
	META_OLD: 'mle.meta',
	META: 'mle.meta.obj',
	SUBREDDIT_CSS: 'mle.subreddit.css',
	SUBREDDIT_EMOTES: 'mle.subreddit.emotes',
	TABS: 'mle.tabs',
};


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


/**
 *
 * @returns {object}
 */
function addon() {
	if( typeof browser === 'undefined' ) {
		return chrome;
	}

	return browser;
}


/**
 *
 * @param {string}  key
 * @param {object?} options
 * @param {*}       options.fallback
 * @param {boolean} options.json
 * @returns {Promise<*>}
 */
async function storageGet( key, options ) {
	let value = ( await addon().storage.local.get( key ) )[key];

	if( typeof value === 'undefined' || value === null ) {
		console.warn( `[storageGet] No value for "${key}"`, value );
		value = options?.fallback;
	}

	if( options?.json === true && typeof value === 'string' ) {
		value = JSON.parse( value );
	}

	return value;
}


/**
 *
 * @param {string}  key
 * @param {*}       value
 * @param {object?} options
 * @param {boolean} options.json
 * @returns {Promise<boolean>} True on success, false otherwise.
 */
async function storageSet( key, value, options ) {
	if( options?.json === true && typeof value !== 'string' ) {
		try {
			value = JSON.stringify( value );
		}
		catch( err ) {
			console.error( '[storageSet] For key:', key, err, 'Value was:', value );
			return false;
		}
	}

	try {
		await addon().storage.local.set( { [key]: value } );
	}
	catch( err ) {
		console.error( '[storageSet]', err );
		return false;
	}

	console.debug( '[storageSet] Set', key );

	return true;
}


/**
 *
 * @returns {Promise<object>}
 */
async function getConfig() {
	let config = await storageGet( PREF.CONFIG );

	// Check if old config (JSON string) exists and migrate to new format,
	// or just set the default config as config.
	if( !config ) {
		config = await storageGet( PREF.CONFIG_OLD, { fallback: DEFAULT_CONFIG, json: true } );
		await storageSet( PREF.CONFIG, config );
	}

	return config;
}


/**
 *
 * @returns {Promise<object>}
 */
async function getEmotes() {
	let emotes = await storageGet( PREF.EMOTES );

	// Check if old emotes (JSON string) exists and migrate to new format,
	// or just set the default emotes as value.
	if( !emotes ) {
		emotes = await storageGet( PREF.EMOTES_OLD, { fallback: DEFAULT_EMOTES, json: true } );
		await storageSet( PREF.EMOTES, emotes );
	}

	return emotes;
}


/**
 *
 * @returns {Promise<object>}
 */
async function getMeta() {
	let meta = await storageGet( PREF.META );

	// Check if old meta (JSON string) exists and migrate to new format,
	// or just set the default meta as value.
	if( !meta ) {
		meta = await storageGet( PREF.META_OLD, { fallback: DEFAULT_META, json: true } );
		await storageSet( PREF.META, meta );
	}

	return meta;
}


const MyBrowser = {


	/**
	 * Broadcast a message to everything extension related.
	 * @param {object} sender
	 * @param {object} msg
	 */
	async broadcast( sender, msg ) {
		msg.from = 'background';

		console.debug( '[MyBrowser.broadcast]', sender, msg );

		const makeCb = sender => {
			return response => {
				if( response ) {
					handleMessage( { data: response }, sender );
				}
			};
		};

		const tabs = await storageGet( PREF.TABS, { fallback: [] } );

		for( let i = 0; i < tabs.length; i++ ) {
			const tabId = tabs[i];

			if( sender?.tab?.id == tabId ) {
				continue;
			}

			addon().tabs.sendMessage( tabId, msg )
				.then( makeCb( sender ) )
				.catch( err => console.error( '[MyBrowser.broadcast]', err ) );
		}
	},


	/**
	 * Handle the items loaded from the storage.
	 * (this == binded object with variables)
	 * @param {object} packet
	 * @param {object} items Loaded items in key/value pairs.
	 */
	async handleLoadedItems( packet, items ) {
		const config = await getConfig();
		const emotes = await getEmotes();
		const meta = await getMeta();

		const subredditCSS = !items[PREF.SUBREDDIT_CSS] ?
			await saveDefaultToStorage( PREF.SUBREDDIT_CSS, {} ) :
			JSON.parse( items[PREF.SUBREDDIT_CSS] );

		const subredditEmotes = !items[PREF.SUBREDDIT_EMOTES] ?
			await saveDefaultToStorage( PREF.SUBREDDIT_EMOTES, {} ) :
			JSON.parse( items[PREF.SUBREDDIT_EMOTES] );

		await updateObject( config, DEFAULT_CONFIG, PREF.CONFIG );
		await updateObject( meta, DEFAULT_META, PREF.META );

		packet.response.config = config;
		packet.response.emotes = emotes;
		packet.response.sub_css = subredditCSS;
		packet.response.sub_emotes = subredditEmotes;

		if( packet.loadMeta ) {
			packet.response.meta = meta;
		}

		setTimeout( () => Updater.check( meta, config, subredditCSS, subredditEmotes ), 0 );
	},


	/**
	 * Load config and emotes.
	 * @param  {object}  response Response object that will get send to the content script.
	 * @param  {object}  sender   Sender of message. Used to send response.
	 * @param  {boolean} loadMeta True, if META data shall be included in the response.
	 * @return {Promise<object>} response
	 */
	async loadConfigAndEmotes( response, sender, loadMeta ) {
		response.from = 'background';

		const packet = {
			loadMeta: loadMeta,
			response: response,
			sender: sender,
		};

		const tabs = await storageGet( PREF.TABS, { fallback: [] } );

		// Remember this tab in which MLE is running
		if( !tabs.includes( sender.tab.id ) ) {
			tabs.push( sender.tab.id );
			await storageSet( PREF.TABS, tabs );
		}

		addon().tabs.onRemoved.addListener( this.onTabRemove );

		try {
			const items = await addon().storage.local.get();
			await this.handleLoadedItems( packet, items );

			// Send loaded items to the tab that sent the request.
			if( packet.sender ) {
				const response = await addon().tabs.sendMessage( packet.sender.tab.id, packet.response );

				if( response ) {
					handleMessage( { data: response }, packet.sender );
				}
			}
		}
		catch( err ) {
			console.error( '[MyBrowser.loadConfigAndEmotes]', err );
		}

		return response;
	},


	/**
	 * Called when a tab is closed.
	 * @param {number} tabId ID of the removed tab.
	 * @param {object} info
	 */
	async onTabRemove( tabId, info ) {
		console.debug( '[MyBrowser.onTabRemove]', tabId, info );

		const tabs = await storageGet( PREF.TABS, { fallback: [] } );
		const idx = tabs.indexOf( tabId );

		if( idx >= 0 ) {
			tabs.splice( idx, 1 );
			await storageSet( PREF.TABS, tabs );
		}
	},


	/**
	 * Open the options page.
	 */
	openOptions() {
		const create = {
			url: addon().runtime.getURL( 'options.html' ),
			active: true,
		};

		addon().tabs.create( create )
			.catch( err => console.error( '[MyBrowser.openOptions]', err ) );
	},


	/**
	 * Register a function to handle messaging between pages.
	 */
	registerMessageHandler() {
		addon().runtime.onMessage.addListener( ( msg, sender, sendResponse ) => {
			handleMessage( { data: msg }, sender, sendResponse );
		} );
	},


	/**
	 * Save to extension storage.
	 * @param {String} key
	 * @param {String} val String as JSON.
	 */
	save( key, val ) {
		console.debug( `[MyBrowser.save] Saving "${key}" string with length ${val.length}...` );

		const saveObj = {};
		saveObj[key] = val;

		addon().storage.local.set( { [key]: val } )
			.then( () => console.debug( '[MyBrowser.save] Success' ) )
			.catch( err => console.error( '[MyBrowser.save]', err ) );
	},


};


/**
 * Getting the sub-reddit CSS and extracting the emotes.
 */
const Updater = {


	// Config
	subreddits: [
		'r/mylittlepony',
		'r/mlplounge',
	],

	// If true, the Last-Modified header will be ignored.
	// Will be reset to false at the end of the update process.
	// @see Updater.wrapUp()
	forceUpdate: false,
	// Option page to respond to
	forceSource: null,

	linkStart: 'a[href|="/',
	linkStartReverse: 'a[href^="/r"]',
	tableCodeRegex: /^[abcefgh][0-9]{2}$/i,


	/**
	 * Check if it is time for scheduled update
	 * and start the process if it is the case.
	 * @param {object} meta
	 * @param {object} config
	 * @param {object} css
	 * @param {object} emotes
	 */
	check( meta, config, css, emotes ) {
		// Less than zero means automatic checks are disabled
		if( meta.lastSubredditCheck < 0 ) {
			return;
		}

		if( Date.now() - meta.lastSubredditCheck >= config.intervalToCheckCSS ) {
			this.getAndParseCSS( emotes, css );
		}
	},


	/**
	 * Get the URLs to the CSS files.
	 * @param {object?} currentEmotes
	 * @param {object?} currentCSS
	 */
	async getAndParseCSS( currentEmotes, currentCSS ) {
		console.debug( '[Updater.getAndParseCSS]' );

		const meta = await getMeta();

		const resultEmotes = currentEmotes || {};
		const resultCSS = currentCSS || {};
		let hadChanges = false;

		const processCSSToEmotes = ( subreddit, css ) => {
			let emotes = [];

			// Process CSS to emotes
			[emotes, css] = this._extractEmotesStep1( css );
			[emotes, css] = this._extractEmotesStep2( emotes, css, subreddit === 'r/mlplounge' );
			emotes = this._removeReverseEmotes( emotes );
			emotes = this._groupSameEmotes( emotes, css );

			return [emotes, css]
		};

		for( let i = 0; i < this.subreddits.length; i++ ) {
			// Wait between requests
			if( i > 0 ) {
				await new Promise( r => setTimeout( r, 1500 ) );
			}

			const subreddit = this.subreddits[i];
			const pageURL = 'https://old.reddit.com/' + subreddit;

			console.debug( '[Updater.getAndParseCSS] Subreddit:', subreddit );

			const resHTML = await fetch( pageURL );
			const pageHTML = await resHTML.text();

			const cssURL = this._getCSSURLFromPage( pageHTML );
			console.debug( '[Updater.getAndParseCSS] Custom CSS URL is:', cssURL );

			const resCSS = await fetch( cssURL );
			const contentType = resCSS.headers.get( 'Content-Type' );

			if( contentType === 'text/css' ) {
				const lastModified = Date.parse( resCSS.headers.get( 'Last-Modified' ) );

				// Only process the stylesheet if something changed
				// since the last check or it is a forced update.
				if( this.forceUpdate || lastModified >= meta.lastSubredditCheck ) {
					const css = await resCSS.text();
					let [emotes, processedCSS] = processCSSToEmotes( subreddit, css );
					resultEmotes[subreddit] = emotes;
					resultCSS[subreddit] = processedCSS;
					console.debug( '[Updater.getAndParseCSS] Added emotes and CSS.' );

					hadChanges = true;
				}
				else {
					console.debug( `[Updater.getAndParseCSS] No changes: ${lastModified} < ${meta.lastSubredditCheck}` );
				}
			}
			else {
				console.warn( '[Updater.getAndParseCSS] Content-Type of CSS was not "text/css":', contentType );
			}
		}

		await this._wrapUp( hadChanges, resultEmotes, resultCSS );
	},


	/**
	 * Extract the for emotes relevant parts from the stylesheet.
	 * Then extract from those the emote names.
	 * @param  {String} css Stylesheet.
	 * @return {Object}     Emotes ordered by table.
	 */
	_extractEmotesStep1( css ) {
		let cssCopy = css;
		let emoteCSS = [];
		let needleImage = 'background-image';
		let needlePosition = 'background-position';
		let needleTransform = 'transform';
		let selectors = [];

		// CSS code for reversing emotes

		let rCSS = this._getReverseEmotesCSS( css );

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
			eCSS += this._getRestOfCSS( cssCopy, idx );
			emoteCSS.push( eCSS );

			if( !ignoreSelectors ) {
				selector = selector.reverse().join( '' );
				selectors.push( selector );
			}

			// Remove the CSS part we just processed
			cssCopy = cssCopy.substring( idx + needleLength );
		}

		return [selectors, emoteCSS];
	},


	/**
	 * Extract the emote names.
	 * @private
	 * @param {string[]} emotesCurrent
	 * @param {string}   cssCurrent
	 * @returns {(string[]|string)[]}
	 */
	_extractEmotesStep2( emotesCurrent, cssCurrent, isPlounge ) {
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
					if( !isPlounge || emote.match( /^r?pl[0-9]{2}$/ ) === null ) {
						subEmoteList.push( emote );
					}
				}
			}

			// Emotes were found
			if( idx >= 0 ) {
				emotes.push( subEmoteList );
			}
		}

		return [emotes, this._removeNonEmoteCSS( cssCurrent )];
	},


	/**
	 * Handle the XHR callback for the request for a page from
	 * which we can extract the CSS URL.
	 * @param {string} responseText
	 * @returns {string}
	 */
	_getCSSURLFromPage( responseText ) {
		const match = responseText.match( /href="[a-zA-Z0-9/.:\-_+]+" (ref="applied_subreddit_stylesheet")? title="applied_subreddit_stylesheet"/ );

		if( !match ) {
			console.error( '[Updater._getCSSURLFromPage] No CSS URL found.' );
			return null;
		}

		let url = match[0];
		url = url.substring( 6 );
		url = url.replace( '" ref="applied_subreddit_stylesheet', '' );
		url = url.replace( '" title="applied_subreddit_stylesheet"', '' );

		return url;
	},


	/**
	 * Get the rest of the relevant CSS part starting from
	 * the found needle position to the end of the rule.
	 * @param  {String} cssCopy Current part of the CSS.
	 * @param  {Number} idx     Index of the found needle.
	 * @return {String}         Extracted CSS.
	 */
	_getRestOfCSS( cssCopy, idx ) {
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
	_getReverseEmotesCSS( css ) {
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
	 * @private
	 * @param {string[][]} emotesCurrent
	 * @param {string}     css
	 * @returns {string[][]}
	 */
	_groupSameEmotes( emotesCurrent, css ) {
		let newEmoteList = [];
		let nonTableEmotes = [];


		// Get a list of lists with all the emotes that share the same background position
		let emotesCurrentCSS = css.split( '\n' );
		let lineEmotes = [];

		for( let i = 0; i < emotesCurrentCSS.length; i++ ) {
			let line = emotesCurrentCSS[i];

			if( line.indexOf( 'background-position:' ) == -1 ) {
				continue;
			}

			line = line.substring( 0, line.indexOf( '{' ) ) + ',';
			line = line.replace( /a\[href\|="\/([a-zA-Z0-9-_]+)"\],/g, '$1::' );
			line = line.substring( 0, line.length - 2 );
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
					if( !belongsToTable && this._isTableCode( group[rem] ) ) {
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

		return newEmoteList;
	},


	/**
	 * Get the table name (A/B/C/E) for a given emote and its alternative names.
	 * @param  {Array<String>} group Emote and its names.
	 * @return {String}              Table name of the emote or false if it cannot be identified.
	 */
	_identifyTableOfEmoteGroup( group ) {
		for( let i = group.length - 1; i >= 0; i-- ) {
			if( this._isTableCode( group[i] ) ) {
				return group[i][0].toUpperCase();
			}
		}

		return false;
	},


	/**
	 * Checks if a given emote is in table code form, for example "a02".
	 * @param  {String}  emote Emote name.
	 * @return {Boolean}       True if the emote is in table code form, false otherwise.
	 */
	_isTableCode( emote ) {
		return emote.match( this.tableCodeRegex ) !== null;
	},


	/**
	 * Merge the emotes extracted from the subreddit stylesheets
	 * with our lists. Or create the list if it doesn't exist yet.
	 * @param {object} emotes
	 * @returns {object}
	 */
	async _mergeSubredditEmotesIntoLists( emotes ) {
		const cfg = await getConfig();
		const currentEmotes = await getEmotes();

		const r_mlp = emotes['r/mylittlepony'];
		const r_plounge = emotes['r/mlplounge'];

		// r/mylittlepony
		// Different tables to take care of.
		for( let i = 0; i < r_mlp.length; i++ ) {
			let emoteCluster = r_mlp[i];

			for( let j = 0; j < emoteCluster.length; j++ ) {
				let group = emoteCluster[j];
				let table = this._identifyTableOfEmoteGroup( group );

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
				if( !Object.prototype.hasOwnProperty.call( currentEmotes, table ) ) {
					currentEmotes[table] = [];
				}

				// Add emote to the table if not in there already
				let add = false;

				for( let k = 0; k < group.length; k++ ) {
					if( group.length > 1 && this._isTableCode( group[k] ) ) {
						continue;
					}
					if( currentEmotes[table].indexOf( group[k] ) >= 0 ) {
						add = false;
						break;
					}
					if( add === false ) {
						add = group[k];
					}
				}
				if( add !== false ) {
					currentEmotes[table].push( add );
				}
			}
		}

		// r/mlplounge
		// No tables, but additional emotes.
		for( let i = 0; i < r_plounge.length; i++ ) {
			let emoteCluster = r_plounge[i];

			for( let j = 0; j < emoteCluster.length; j++ ) {
				let group = emoteCluster[j];
				let table = this._identifyTableOfEmoteGroup( group );

				if( table !== false ) {
					continue;
				}

				if( !Object.prototype.hasOwnProperty.call( currentEmotes, cfg.listNamePlounge ) ) {
					currentEmotes[cfg.listNamePlounge] = [];
				}

				for( let k = 0; k < group.length; k++ ) {
					if( currentEmotes[cfg.listNamePlounge].indexOf( group[k] ) < 0 ) {
						currentEmotes[cfg.listNamePlounge].push( group[k] );
					}
				}
			}
		}

		return currentEmotes;
	},


	/**
	 * Remove wrongly identified CSS.
	 * @param  {Array<String>} css
	 * @return {String}
	 */
	_removeNonEmoteCSS( css ) {
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
	 * @private
	 * @param {string[][]} emotesCurrent
	 * @returns {string[][]}
	 */
	_removeReverseEmotes( emotesCurrent ) {
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
				if( emote[0] != 'r' || !flatCopy.includes( emote.substring( 1 ) ) ) {
					newEmoteList[i].push( emote );
				}
			}
		}

		// Save the new emote list and filter out now empty sub-lists.
		const newList = [];

		for( let i = 0; i < newEmoteList.length; i++ ) {
			if( newEmoteList[i].length > 0 ) {
				newList.push( newEmoteList[i].slice( 0 ) );
			}
		}

		return newList;
	},


	/**
	 * Called at the end of updating ALL subreddit CSS.
	 * Saves the emotes and CSS. Resets counter.
	 * @param {boolean} hadChanges
	 * @param {object}  resultEmotes
	 * @param {object}  resultCSS
	 */
	async _wrapUp( hadChanges, resultEmotes, resultCSS ) {
		console.debug( '[Updater._wrapUp]', hadChanges, resultEmotes, resultCSS );

		const meta = await getMeta();
		meta.lastSubredditCheck = Date.now();
		await storageSet( PREF.META, meta );

		if( hadChanges ) {
			let flagUpdateSuccess = true;

			for( let i = 0; i < this.subreddits.length; i++ ) {
				const subreddit = this.subreddits[i];

				if( !resultEmotes[subreddit] || resultEmotes[subreddit].length === 0 ) {
					flagUpdateSuccess = false;
				}
			}

			if( flagUpdateSuccess ) {
				await storageSet( PREF.SUBREDDIT_CSS, resultCSS, { json: true } );
				await storageSet( PREF.SUBREDDIT_EMOTES, resultEmotes, { json: true } );

				const currentEmotes = await this._mergeSubredditEmotesIntoLists( resultEmotes );
				await storageSet( PREF.EMOTES, currentEmotes );
			}
		}
		else {
			console.debug( '[Updater._wrapUp] No changes to save.' );
		}

		if( this.forceUpdate ) {
			const response = { task: BG_TASK.UPDATE_CSS, from: 'background' };
			const promise = addon().tabs.sendMessage( this.forceSource.tab.id, response );
			promise.then(
				null,
				err => console.error( err ),
			);
		}

		this.forceUpdate = false;
		this.forceSource = null;
	},


};



/**
 * Receive message from inline script and answer back.
 * @param {Event}  ev
 * @param {object} sender
 */
async function handleMessage( ev, sender ) {
	console.debug( '[handleMessage]', ev, sender );

	let response = {};
	let data = ev.data || ev;
	let source = sender || ev.source;
	let broadcast = false;

	// Only handle messages which come with a set task.
	if( !data.task ) {
		console.error( '[handleMessage] Background process: No task specified.' );
		return;
	}

	switch( data.task ) {
		case BG_TASK.UPDATE_EMOTES:
			{
				const currentEmotes = await getEmotes();
				mergeEmotesWithUpdate( currentEmotes, data.update );
				response.success = await storageSet( PREF.EMOTES, currentEmotes );
				response.update = data.update;
				broadcast = true;
			}
			break;

		case BG_TASK.UPDATE_LIST_ORDER:
			response.success = await storageSet( PREF.EMOTES, data.update );
			response.update = data.update;
			broadcast = true;
			break;

		case BG_TASK.UPDATE_LIST_NAME:
			{
				const u = data.update;
				let currentEmotes = await getEmotes();
				currentEmotes = changeListName( currentEmotes, u.oldName, u.newName );
				response.success = await storageSet( PREF.EMOTES, currentEmotes );
				response.update = u;
				broadcast = true;
			}
			break;

		case BG_TASK.UPDATE_LIST_DELETE:
			{
				let currentEmotes = await getEmotes();
				delete currentEmotes[data.update.deleteList];
				response.success = await storageSet( PREF.EMOTES, currentEmotes );
				response.deleteList = data.update.deleteList;
				broadcast = true;
			}
			break;

		case BG_TASK.LOAD:
			response = await loadConfigAndEmotes( { task: data.task }, source, !!data.loadMeta );
			break;

		case BG_TASK.SAVE_EMOTES:
			{
				const currentEmotes = await getEmotes();

				// Currently we have more than 1 list, but the update is empty.
				// This is too suspicious and shouldn't happen. Don't do it.
				if( currentEmotes.length >= 2 && data.emotes.length <= 0 ) {
					response.success = false;
					break;
				}

				response.success = await storageSet( PREF.EMOTES, data.emotes );
			}
			break;

		case BG_TASK.SAVE_CONFIG:
			try {
				let currentConfig = await getConfig();
				currentConfig = mergeWithConfig( currentConfig, data.config || data.update );
				response.success = await storageSet( PREF.CONFIG, currentConfig );
				response.config = currentConfig;
			}
			catch( err ) {
				console.error( '[handleMessage] SAVE_CONFIG', err );
				return;
			}
			break;

		case BG_TASK.RESET_CONFIG:
			response.success = await storageSet( PREF.CONFIG, DEFAULT_CONFIG );
			break;

		case BG_TASK.RESET_EMOTES:
			response.success = await storageSet( PREF.EMOTES, DEFAULT_EMOTES );
			break;

		case BG_TASK.OPEN_OPTIONS:
			MyBrowser.openOptions();
			return;

		case BG_TASK.UPDATE_CSS:
			Updater.forceUpdate = true;
			Updater.forceSource = source;
			Updater.getAndParseCSS();
			return;

		default:
			console.error( `[handleMessage] Background process: Unknown task given - "${data.task}".` );
			return;
	}

	response.task = data.task;

	if( broadcast ) {
		MyBrowser.broadcast( source, response );
	}
}


/**
 * Change the name of a list while keeping the order.
 * @param {object} emotes
 * @param {string} oldName Current name of the list.
 * @param {string} newName New name for the list.
 * @returns {object}
 */
function changeListName( emotes, oldName, newName ) {
	let emotesNew = {};

	for( const key in emotes ) {
		if( key == oldName ) {
			emotesNew[newName] = emotes[key];
		}
		else {
			emotesNew[key] = emotes[key];
		}
	}

	return emotesNew;
}


/**
 * Load the configuration and lists/emotes from the extension storage.
 * @param  {Object}  response Part of the response object to send. Contains the task value.
 * @param  {Object}  sender   Sender of message. Used to send response. (Chrome and Firefox only)
 * @param  {Boolean} loadMeta True, if META data shall be included in the response.
 * @return {Object}           Response with the loaded config and emotes.
 */
async function loadConfigAndEmotes( response, sender, loadMeta ) {
	if( !response ) {
		response = {};
	}

	try {
		response = await MyBrowser.loadConfigAndEmotes( response, sender, loadMeta );
	}
	catch( err ) {
		console.error( '[loadConfigAndEmotes] Background process: Could not load preferences.', err );
	}

	return response;
}


/**
 * Merge the currently loaded emotes with the update.
 * @param {object} currentEmotes
 * @param {object} emotes  Changed lists with their emotes.
 */
function mergeEmotesWithUpdate( currentEmotes, emotes ) {
	for( const key in emotes ) {
		currentEmotes[key] = emotes[key];
	}
}


/**
 * Merge the config obj with the current config.
 * So only changes are overwritten and all other values are preserved.
 * Unknown config keys in obj will be removed!
 * @param {object} currentConfig
 * @param {object} update
 * @return {object}
 */
function mergeWithConfig( currentConfig, update ) {
	let merged = {};

	// Only add known config keys
	for( const key in update ) {
		if( Object.prototype.hasOwnProperty.call( currentConfig, key ) ) {
			merged[key] = update[key];
		}
	}

	// Add missing config keys
	for( const key in currentConfig ) {
		if( !Object.prototype.hasOwnProperty.call( merged, key ) ) {
			merged[key] = currentConfig[key];
		}
	}

	return merged;
}


/**
 * Save a default value to the extension storage.
 * @param  {number} key Key to save the object under.
 * @param  {object} obj Default value to save.
 * @return {Promise<object>} Default value. Same as parameter "obj".
 */
async function saveDefaultToStorage( key, obj ) {
	const success = await storageSet( key, obj );

	if( success ) {
		console.debug( `[saveDefaultToStorage] Background process: "${key}" not in extension preferences yet. Created default.` );
	}
	else {
		console.error( '[saveDefaultToStorage] Background process: Could not save default value.' );
	}

	return obj;
}


/**
 * Update the currently stored object in case of newly added keys/values.
 * @param  {object} current       The object as it is currently stored (not JSON).
 * @param  {object} defaultValues The default state of the object.
 * @param  {string} storageKey    The storage key to save it under.
 * @return {Promise<object>} The updated object.
 */
async function updateObject( current, defaultValues, storageKey ) {
	for( const key in defaultValues ) {
		if( !Object.prototype.hasOwnProperty.call( current, key ) ) {
			current[key] = defaultValues[key];
		}
	}

	await storageSet( storageKey, current );

	return current;
}


MyBrowser.registerMessageHandler();
