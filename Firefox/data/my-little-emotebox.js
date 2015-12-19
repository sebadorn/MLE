'use strict';


( function() {


	var GLOBAL = {
		// Loaded config
		config: null,
		// Loaded emotes
		emotes: null,
		// Links to ignore
		ignoreLinks: [
			'/gold',
			'/account-activity',
			'/prefs',
			'/password',
			'/about',
			'/ad_inq',
			'/bookmarklets',
			'/buttons',
			'/feedback',
			'/widget'
		],
		// Keep track of mouse stats
		MOUSE: {
			lastX: null,
			lastY: null,
			resizeDirection: null,
			resizeLimitWidth: 400,
			resizeLimitHeight: 200
		},
		// Reference to the timeout object for the notifier
		msgTimeout: null,
		// Noise for CSS classes and IDs, to minimise the probability
		// of accidentally overwriting existing styles.
		noise: '-bd6acd4a',
		// Holding references to DOMElements
		REF: {
			emoteBlocks: {},
			focusedInput: null,
			inputAddEmote: null,
			inputAddList: null,
			lists: {},
			listsCont: null,
			mainCont: null,
			mngPage: null,
			msg: null,
			searchPage: null,
			selectListAddEmote: null,
			selectListDelete: null
		},
		// String, key of block in REF.emoteBlocks
		shownBlock: null,
		// CSS for out-of-subreddit emote display
		sub_css: null,
		// Emotes found in the stylesheets
		sub_emotes: null
	};



	/**
	 * Append multiple children to a DOMElement.
	 * @param  {DOMElement}        parent
	 * @param  {Array<DOMElement>} children List of children to append.
	 * @return {DOMElement}                 parent
	 */
	function appendChildren( parent, children ) {
		for( var i = 0; i < children.length; i++ ) {
			parent.appendChild( children[i] );
		}
		return parent;
	}


	/**
	 * Callback function for the DOMNodeInserted event.
	 * @param {Event} ev
	 */
	function buttonObserverDOMEvent( ev ) {
		// nodeType = 3 = TEXT_NODE
		if( ev.target.nodeType == 3 ) {
			return;
		}

		// 'usertext cloneable' is the whole reply-to-comment section
		if( ev.target.className == 'usertext cloneable' ) {
			var buttonMLE = ev.target.querySelector( '.mle-open-btn' );

			buttonMLE.addEventListener( 'mouseover', rememberActiveTextarea, false );
			buttonMLE.addEventListener( 'click', mainContainerShow, false );
		}
	}


	/**
	 * Callback function for the MutationObserver.
	 * @param {MutationRecord} mutations
	 */
	function buttonObserverMutation( mutations ) {
		for( var i = 0; i < mutations.length; i++ ) {
			var mutation = mutations[i];

			for( var j = 0; j < mutation.addedNodes.length; j++ ) {
				var node = mutation.addedNodes[j];

				if( node.className == 'usertext cloneable' ) {
					var buttonMLE = node.querySelector( '.mle-open-btn' );

					if( buttonMLE ) {
						buttonMLE.addEventListener( 'mouseover', rememberActiveTextarea, false );
						buttonMLE.addEventListener( 'click', mainContainerShow, false );
						return;
					}
				}
			}
		}
	}


	/**
	 * Observe document for dynamically inserted reply areas.
	 * If this happens, add the "click" event listener to the inserted MLE button.
	 */
	function buttonObserverSetup() {
		var MutationObserver = window.MutationObserver || window.WebkitMutationObserver;

		// MutationObserver is implented in Chrome (vendor prefixed with "Webkit") and Firefox
		if( MutationObserver ) {
			var observer = new MutationObserver( buttonObserverMutation );
			var observerConfig = {
				attributes: false,
				childList: true,
				characterData: false
			};
			var targets = document.querySelectorAll( '.child' );

			for( var i = 0; i < targets.length; i++ ) {
				observer.observe( targets[i], observerConfig );
			}
		}
		// ... but not in Opera 12, so we have to do this the deprecated way
		else {
			document.addEventListener( 'DOMNodeInserted', buttonObserverDOMEvent, false );
		}
	}


	/**
	 * It is possible to change the names of the default lists.
	 * If this happened, we have to adjust the default name each
	 * time it is used internally.
	 * @param  {String} listName
	 * @return {String}
	 */
	function convertListNameToConfigName( listName ) {
		var cfg = GLOBAL.config;

		switch( listName ) {
			case 'A':
				return cfg.listNameTableA;

			case 'B':
				return cfg.listNameTableB;

			case 'C':
				return cfg.listNameTableC;

			case 'E':
				return cfg.listNameTableE;

			case 'F':
				return cfg.listNameTableF;

			case 'Plounge':
				return cfg.listNamePlounge;

			default:
				return listName;
		}
	}


	/**
	 * Delete an emote from a list.
	 * @param {String} emote
	 * @param {String} list
	 */
	function deleteEmote( emote, list ) {
		var g = GLOBAL;

		// Emotes don't have a leading slash
		if( emote.indexOf( '/' ) === 0 ) {
			emote = emote.substring( 1 );
		}

		// Remove from locale storage
		var idx = g.emotes[list].indexOf( emote );

		if( idx === -1 ) {
			return;
		}

		g.emotes[list].splice( idx, 1 );

		var update = {};
		update[list] = g.emotes[list];
		saveChangesToStorage( BG_TASK.UPDATE_EMOTES, update );

		// Remove from DOM
		var emoteSlash = '/' + emote;
		var children = g.REF.emoteBlocks[list].childNodes;

		for( var i = 0; i < children.length; i++ ) {
			if( children[i].pathname == emoteSlash ) {
				g.REF.emoteBlocks[list].removeChild( children[i] );
				break;
			}
		}

		// If it is from the search page
		children = g.REF.searchPage.childNodes;

		for( var i = 0; i < children.length; i++ ) {
			if( children[i].pathname == emoteSlash ) {
				g.REF.searchPage.removeChild( children[i] );
				break;
			}
		}

		// Update list counter
		Builder.updateEmoteCount( list, g.emotes[list].length );
	}


	/**
	 * Delete an emote list.
	 * This will delete all the emotes in this list as well.
	 * @param {Event} ev
	 */
	function deleteList( ev ) {
		var g = GLOBAL;

		// Major decision. Better ask first.
		var confirmDel = window.confirm(
			'My Little Emotebox:\n\n' +
			'If you delete the list, you will also DELETE ALL EMOTES in this list!\n\n' +
			'Proceed?'
		);

		if( !confirmDel ) {
			return;
		}

		var listNameEscaped = getOptionValue( g.REF.selectListDelete );
		var listName = listNameEscaped.replace( /\\"/g, '"' );

		var listToDel = g.REF.lists[listName];

		// Delete from emote lists
		delete g.emotes[listName];
		saveChangesToStorage( BG_TASK.UPDATE_LIST_DELETE, { deleteList: listName } );

		// Remove from DOM.
		delete g.REF.emoteBlocks[listName];
		g.REF.listsCont.removeChild( listToDel );

		var selectLists = [g.REF.selectListDelete, g.REF.selectListAddEmote];

		for( var i = 0; i < selectLists.length; i++ ) {
			var children = selectLists[i].childNodes;

			for( var j = 0; j < children.length; j++ ) {
				if( children[j].value == listNameEscaped ) {
					selectLists[i].removeChild( children[j] );
					break;
				}
			}
		}

		// Remove context menus. Will be rebuild when needed.
		ContextMenu.destroyMenus();
	}


	/**
	 * Get the value of the currently selected <option>.
	 */
	function getOptionValue( select ) {
		return select.options[select.selectedIndex].value;
	}


	/**
	 * Handle messages from the background process.
	 * @param {Event} ev Event sent from the background process.
	 */
	function handleBackgroundMessages( ev ) {
		var g = GLOBAL;
		var data = ev.data ? ev.data : ev;

		if( !data.task ) {
			console.warn( 'MLE: Message from background process didn\'t contain the handled task.' );
			return;
		}

		switch( data.task ) {
			case BG_TASK.LOAD:
				g.config = data.config;
				g.emotes = data.emotes;
				g.sub_css = data.sub_css;
				g.sub_emotes = data.sub_emotes;

				Init.initStep2();
				Init = null;
				break;

			case BG_TASK.SAVE_EMOTES:
				if( !data.success ) {
					showMsg( 'I\'m sorry, but the changes could not be saved.' );
					console.error( 'MLE: Could not save emotes.' );
				}
				break;

			case BG_TASK.UPDATE_EMOTES:
				mergeEmotesWithUpdate( data.update );
				Builder.updateLists( data.update );
				break;

			case BG_TASK.UPDATE_LIST_ORDER:
				g.emotes = data.update;
				Builder.updateListOrder( g.emotes );
				break;

			case BG_TASK.UPDATE_LIST_NAME:
				var u = data.update;
				g.emotes[u.newName] = g.emotes[u.oldName].slice( 0 );
				delete g.emotes[u.oldName];
				Builder.updateListName( u.oldName, u.newName );
				break;

			case BG_TASK.UPDATE_LIST_DELETE:
				delete g.emotes[data.deleteList];
				Builder.removeList( data.deleteList );
				break;
		}
	}


	/**
	 * Insert a selected emote.
	 * @param {MouseEvent} ev
	 */
	function insertEmote( ev ) {
		ev.preventDefault(); // Don't follow emote link

		var g = GLOBAL;
		var ta = g.REF.focusedInput;

		mainContainerHide( ev );

		if( !ta ) {
			return;
		}

		// Emote name
		var emote = ev.target.href.split( '/' );
		emote = emote[emote.length - 1];

		// Insert reversed emote version
		if(
			( g.config.keyReverse == 16 && ev.shiftKey ) ||
			( g.config.keyReverse == 17 && ev.ctrlKey ) ||
			( g.config.keyReverse == 18 && ev.altKey )
		) {
			if( isFromDefaultSub( emote ) ) {
				emote = 'r' + emote;
			}
			else {
				emote += '-r';
			}
		}

		var selStart = ta.selectionStart;
		var selEnd = ta.selectionEnd;

		// Nothing selected, just insert at position
		if( selStart == selEnd ) {
			emote = '[](/' + emote + ')';
		}
		// Text marked, use for alt text
		else {
			var altText = ta.value.substring( selStart, selEnd );
			emote = '[](/' + emote + ' "' + altText + '")';
		}

		// Add a blank after the emote
		if( g.config.addBlankAfterInsert ) {
			emote += ' ';
		}

		// Insert emote
		var taLen = ta.value.length;
		ta.value = ta.value.substring( 0, selStart ) + emote + ta.value.substring( selEnd, taLen );

		// Focus to the textarea
		ta.focus();
		ta.setSelectionRange(
			selStart + emote.length,
			selStart + emote.length
		);

		// Fire input event, so that RedditEnhancementSuite updates the preview
		var inputEvent = document.createEvent( 'Events' );
		inputEvent.initEvent( 'input', true, true );
		ta.dispatchEvent( inputEvent );
	}


	/**
	 * Checks if a given DOM node is an emote.
	 * @param  {DOMElement} node
	 * @return {Boolean}    True if emote, false otherwise.
	 */
	function isEmote( node ) {
		// Emotes inside the BPM window
		if( node.parentNode.id == 'bpm-sb-results' ) {
			return !!node.getAttribute( 'data-emote' );
		}

		// Regular link emotes
		if( node.tagName.toLowerCase() != 'a' ) {
			return false;
		}
		if( !node.pathname ) {
			return false;
		}
		// Making the hopeful assumption that emote
		// names will never contain more than one '/'
		if( node.pathname.split( '/' ).length > 2 ) {
			return false;
		}

		var nodeHTML = node.outerHTML;

		if(
			nodeHTML.indexOf( 'href="/' ) < 0 ||
			nodeHTML.indexOf( 'href="//' ) > -1 ||
			nodeHTML.indexOf( 'href="/http://' ) > -1 ||
			nodeHTML.indexOf( 'href="/https://' ) > -1 ||
			node.pathname == '/'
		) {
			return false;
		}

		// Links that are a normal part of reddit.
		for( var i = 0; i < GLOBAL.ignoreLinks.length; i++ ) {
			if( node.pathname.indexOf( GLOBAL.ignoreLinks[i] ) === 0 ) {
				return false;
			}
		}

		return true;
	}


	/**
	 * Check if for the given emote is from a default
	 * pony sub (r/mylittlepony or r/MLPLounge).
	 * @param  {String}  emote Emote name.
	 * @return {Boolean}       True if the emote is from a default sub, false otherwise.
	 */
	function isFromDefaultSub( emote ) {
		var cfg = GLOBAL.config;
		var keys = [
			cfg.listNameTableA,
			cfg.listNameTableB,
			cfg.listNameTableC,
			cfg.listNameTableE,
			cfg.listNameTableF,
			cfg.listNamePlounge
		];

		for( var i = 0; i < keys.length; i++ ) {
			var list = GLOBAL.emotes[keys[i]];

			if( list.indexOf( emote ) >= 0 ) {
				return true;
			}
		}

		return false;
	}


	/**
	 * Checks if a given DOM node is a draggable list element.
	 * @param  {DOMElement} node
	 * @return {Boolean}    True if list, false otherwise.
	 */
	function isList( node ) {
		if( node.tagName.toLowerCase() != 'li' ) {
			return false;
		}
		if( !node.getAttribute( 'draggable' ) ) {
			return false;
		}

		return true;
	}


	/**
	 * Minimize main container.
	 * @param {Event} ev
	 */
	function mainContainerHide( ev ) {
		var g = GLOBAL;
		var mc = g.REF.mainCont;

		ev.preventDefault();

		// Wait with adding the event listener.
		// Prevents the box from opening again, if mouse cursor hovers
		// over the closing (CSS3 transition) box.
		mc.className = mc.className.replace( ' show', '' );

		setTimeout( function() {
			this.addEventListener( 'mouseover', mainContainerShow, false );
		}.bind( mc ), g.config.boxAnimationSpeed + 100 );
	}


	/**
	 * Fully display main container.
	 * @param {Event} ev
	 */
	function mainContainerShow( ev ) {
		var mc = GLOBAL.REF.mainCont;

		if( mc.className.indexOf( ' show' ) < 0 ) {
			mc.className += ' show';
			mc.removeEventListener( 'mouseover', mainContainerShow, false );
		}
	}


	/**
	 * Merge the currently loaded emotes with the update.
	 * @param {Object} emotes Changed lists with their emotes.
	 */
	function mergeEmotesWithUpdate( emotes ) {
		for( var key in emotes ) {
			GLOBAL.emotes[key] = emotes[key];
		}
	}


	/**
	 * Move the MLE window.
	 * @param {MouseEvent} ev MouseEvent from a "mousemove".
	 */
	function moveMLE( ev ) {
		ev.preventDefault();

		var m = GLOBAL.MOUSE;
		var mainCont = GLOBAL.REF.mainCont;
		var moveX = ev.clientX - m.lastX;
		var moveY = ev.clientY - m.lastY;

		if( GLOBAL.config.boxAlign == 'right' ) {
			mainCont.style.right = ( parseInt( mainCont.style.right, 10 ) - moveX ) + 'px';
		}
		else {
			mainCont.style.left = ( mainCont.offsetLeft + moveX ) + 'px';
		}

		mainCont.style.top = ( mainCont.offsetTop + moveY ) + 'px';

		m.lastX = ev.clientX;
		m.lastY = ev.clientY;
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
	 * Remove all children from a node.
	 * @param  {DOMElement} node
	 * @return {DOMElement}
	 */
	function removeAllChildren( node ) {
		while( node.firstChild ) {
			node.removeChild( node.firstChild );
		}

		return node;
	}


	/**
	 * Rename a list.
	 * @param {Object}   list The list element that triggered the name change.
	 * @param {KeyEvent} ev
	 */
	function renameList( list, ev ) {
		if( ev.keyCode != 13 ) { // [Enter]
			return;
		}

		var g = GLOBAL;
		var name = list.querySelector( 'strong' );
		var listNameOld = name.textContent;
		var listNameNew = ev.target.value;

		// Length: at least 1 char
		if( listNameNew.length > 0 && listNameOld != listNameNew ) {
			// Change emotes object (memory, not storage)
			g.emotes[listNameNew] = g.emotes[listNameOld];
			g.emotes = reorderList( listNameNew, listNameOld );
			delete g.emotes[listNameOld];

			// Change attribute name in emoteBlocks object
			g.REF.emoteBlocks[listNameNew] = g.REF.emoteBlocks[listNameOld];
			delete g.REF.emoteBlocks[listNameOld];

			// Change name of the currently shown block if necessary
			if( g.shownBlock == listNameOld ) {
				g.shownBlock = listNameNew;
			}

			// Change name in the object of all lists
			g.REF.lists[listNameNew] = g.REF.lists[listNameOld];
			delete g.REF.lists[listNameOld];

			// Change the <select>s of the manage page
			Builder.updateManageSelects( listNameOld, listNameNew );

			// Save changes to storage
			saveChangesToStorage(
				BG_TASK.UPDATE_LIST_NAME,
				{
					oldName: listNameOld,
					newName: listNameNew
				}
			);
		}

		name.textContent = listNameNew;
		name.removeAttribute( 'hidden' );
		list.removeChild( ev.target );
	}


	/**
	 * Remember the currently focused/active textarea
	 * (if there is one) as input for the emotes.
	 * @param {Event} ev
	 */
	function rememberActiveTextarea( ev ) {
		var ae = document.activeElement;

		if( ae && ae.tagName && ae.tagName.toLowerCase() == 'textarea' ) {
			GLOBAL.REF.focusedInput = ae;
		}
	}


	/**
	 * Remove all emote blocks and pages (manage/search) from
	 * the MLE window. Well, technically only one will be
	 * removed since only one is attached at any given moment.
	 */
	function removeAllBlocksAndPages() {
		var g = GLOBAL;

		if( g.shownBlock !== null ) {
			g.REF.mainCont.removeChild( g.REF.emoteBlocks[g.shownBlock] );
			g.shownBlock = null;
		}
		else if( g.REF.mngPage.parentNode == g.REF.mainCont ) {
			g.REF.mainCont.removeChild( g.REF.mngPage );
		}
		else if( g.REF.searchPage.parentNode == g.REF.mainCont ) {
			g.REF.mainCont.removeChild( g.REF.searchPage );
		}
	}


	/**
	 * Reorder emote list. (Not the emotes, but the lists itself.)
	 * @param  {String} moving    Name of list to insert before "inFrontOf".
	 * @param  {String} inFrontOf Name of list, that "moving" will be inserted in front of.
	 * @return {Object} Reordered list.
	 */
	function reorderList( moving, inFrontOf ) {
		var g = GLOBAL;
		var reordered = {};

		if( moving == inFrontOf ) {
			return g.emotes;
		}

		for( var block in g.emotes ) {
			if( block == moving ) {
				continue;
			}
			if( block == inFrontOf ) {
				reordered[moving] = g.emotes[moving];
			}

			reordered[block] = g.emotes[block];
		}

		return reordered;
	}


	/**
	 * Resize the MLE window.
	 * @param {MouseEvent} ev MouseEvent from a "mousemove".
	 */
	function resizeMLE( ev ) {
		ev.preventDefault();

		var g = GLOBAL;
		var m = g.MOUSE;
		var mainCont = g.REF.mainCont;
		var moveX = ev.clientX - m.lastX;
		var moveY = ev.clientY - m.lastY;
		var newHeight = mainCont.offsetHeight + moveY;
		var newWidth = mainCont.offsetWidth;
		var adjustPosX = true;

		newWidth += ( m.resizeDirection == 'sw' ) ? -moveX : moveX;

		// Limits
		if( newWidth < m.resizeLimitWidth ) {
			newWidth = m.resizeLimitWidth;
			adjustPosX = false;
		}
		if( newHeight < m.resizeLimitHeight ) {
			newHeight = m.resizeLimitHeight;
		}

		// Move window only if width limit has not been reached
		if( adjustPosX ) {
			// X axis orientates to the left
			if( g.config.boxAlign == 'left' && m.resizeDirection == 'sw' ) {
				mainCont.style.left = ( mainCont.offsetLeft + moveX ) + 'px';
			}
			// X axis oritentates to the right
			else if( g.config.boxAlign == 'right' && m.resizeDirection == 'se' ) {
				mainCont.style.right = ( parseInt( mainCont.style.right, 10 ) - moveX ) + 'px';
			}
		}

		mainCont.style.width = newWidth + 'px';
		mainCont.style.height = newHeight + 'px';

		m.lastX = ev.clientX;
		m.lastY = ev.clientY;
	}


	/**
	 * Save the given emote to the given list.
	 * @param {String} emote
	 * @param {String} list
	 */
	function saveEmote( emote, list ) {
		var g = GLOBAL;

		// Ignore empty
		if( emote.length === 0 ) {
			showMsg( 'That ain\'t no emote, sugarcube.' );
			return;
		}

		// Emotes are saved without leading slash
		if( emote.indexOf( '/' ) === 0 ) {
			emote = emote.substring( 1 );
		}

		// Remove modifier flags
		if( emote.indexOf( '-' ) > -1 ) {
			emote = emote.split( '-' )[0];
		}

		// Only save if not already in list
		if( g.emotes[list].indexOf( emote ) > -1 ) {
			showMsg( 'This emote is already in the list.' );
			return;
		}
		// Don't save mirrored ones either
		if( emote[0] == 'r' && g.emotes[list].indexOf( emote.substring( 1 ) ) > -1 ) {
			showMsg( 'This emote is a mirrored version of one already in the list.' );
			return;
		}

		var update = {};

		g.emotes[list].push( emote );
		update[list] = g.emotes[list];
		saveChangesToStorage( BG_TASK.UPDATE_EMOTES, update );

		// Add to DOM
		g.REF.emoteBlocks[list].appendChild( Builder.createEmote( '/' + emote ) );

		// Update emote count of list
		Builder.updateEmoteCount( list, g.emotes[list].length );
	}


	/**
	 * Saves emotes/lists to the storage.
	 * @param {Integer} task   BG_TASK.
	 * @param {Object}  update Change to update.
	 */
	function saveChangesToStorage( task, update ) {
		postMessage( {
			task: task,
			update: update
		} );
	}


	/**
	 * From the manage page: Save new emote.
	 * @param {Event} ev
	 */
	function saveNewEmote( ev ) {
		var g = GLOBAL;
		var inputEmote = g.REF.inputAddEmote;
		var selectHTML = g.REF.selectListAddEmote;
		var list = getOptionValue( selectHTML );
		var emote = inputEmote.value.trim();

		saveEmote( emote, list );
		inputEmote.value = '';
		inputEmote.focus();
	}


	/**
	 * From the manage page: Save new list.
	 * @param {Event} ev
	 */
	function saveNewList( ev ) {
		var g = GLOBAL;
		var inputField = g.REF.inputAddList;
		var listName = inputField.value.trim();

		// Ignore empty
		if( listName.length === 0 ) {
			showMsg( 'That ain\'t no valid name for a list.' );
			return;
		}

		// Only create list if it doesn't exist already
		if( listName in g.emotes ) {
			showMsg( 'This list already exists.' );
			return;
		}

		var update = {};

		g.emotes[listName] = [];
		update[listName] = [];
		saveChangesToStorage( BG_TASK.UPDATE_EMOTES, update );

		inputField.value = '';
		Builder.updateListsAddNew( listName );
	}


	/**
	 * Create and show manage page.
	 * Only create manage elements when needed. Because
	 * it won't be needed that often, probably.
	 * @param {Event} ev
	 */
	function showManagePage( ev ) {
		var gr = GLOBAL.REF;

		toggleEmoteBlock( false );

		// Create manage elements if first time opening manage page
		if( gr.mngPage.childNodes.length < 1 ) {
			Builder.createManagePage( gr.mngPage );
		}

		gr.mainCont.appendChild( gr.mngPage );
	}


	/**
	 * Display a little popup message, that disappears again after a few seconds.
	 * @param {String} text Message text to display.
	 */
	function showMsg( text ) {
		var g = GLOBAL;

		if( !g.REF.msg ) {
			return;
		}

		clearTimeout( g.msgTimeout );
		g.REF.msg.className += ' show';
		g.REF.msg.textContent = text;

		g.msgTimeout = setTimeout( function() {
			GLOBAL.REF.msg.className = 'mle-msg' + GLOBAL.noise;
		}, g.config.msgTimeout );
	}


	/**
	 * Prevent the default action of an event.
	 * @param {Event} ev The event.
	 */
	function stopEvent( ev ) {
		ev.preventDefault();
	}


	/**
	 * Show/hide emote blocks when selected in the navigation.
	 * @param {Event} ev
	 */
	function toggleEmoteBlock( ev ) {
		var g = GLOBAL;
		var geb = g.REF.emoteBlocks;
		var gnl = g.REF.lists;
		var evTarget = ev.target;

		// In case a child element was clicked instead of the (parent) list element container
		/* jshint validthis: true */
		if( evTarget != this ) {
			evTarget = evTarget.parentNode;
		}

		// Set chosen list to active
		for( var key in gnl ) {
			gnl[key].className = '';
		}
		if( ev ) {
			evTarget.className = 'activelist';
		}

		removeAllBlocksAndPages();

		// Show emotes of chosen block
		if( ev ) {
			for( var listName in geb ) {
				var name = evTarget.querySelector( 'strong' );

				if( name && name.textContent == listName ) {
					g.REF.mainCont.appendChild( geb[listName] );
					g.shownBlock = listName;
					break;
				}
			}
		}
	}


	/**
	 * Keep track if the left mouse button is pressed.
	 * @param {Event} ev
	 */
	function trackMouseDown( ev ) {
		ev.preventDefault();

		// Move (drag) or Resize
		var cn = ev.target.className;
		var hasCase;

		if( cn.indexOf( 'mle-dragbar' ) >= 0 ) {
			hasCase = 'MOVE';
		}
		else if( cn.indexOf( 'mle-resizer' ) >= 0 ) {
			hasCase = 'RESIZE';
		}

		// In case of mouse down
		if( ev.type == 'mousedown' && ev.which == 1 ) {
			switch( hasCase ) {
				case 'MOVE':
					trackMouseDownStart_Move( ev );
					break;

				case 'RESIZE':
					var direction = ( cn.indexOf( 'mle-resizer0' ) >= 0 ) ? 'sw' : 'se';
					trackMouseDownStart_Resize( ev, direction );
					break;
			}
		}
	}


	/**
	 * Start tracking the mouse movement and
	 * adjust the window position.
	 * @param {Event} ev
	 */
	function trackMouseDownEnd_Move( ev ) {
		var g = GLOBAL;
		var m = g.MOUSE;
		var posX;

		m.lastX = null;
		m.lastY = null;

		document.removeEventListener( 'mousemove', moveMLE, false );
		document.removeEventListener( 'mouseup', trackMouseDownEnd_Move, false );

		if( g.config.boxAlign == 'right' ) {
			posX = parseInt( g.REF.mainCont.style.right, 10 );

			// Workaround for Firefox: Troubles with scrollbar width.
			if( typeof chrome == 'undefined' && typeof opera == 'undefined' ) {
				posX -= window.innerWidth - document.body.offsetWidth;
			}
		}
		else {
			posX = g.REF.mainCont.offsetLeft;
		}

		// Update config in this tab
		g.config.boxPosTop = g.REF.mainCont.offsetTop;
		g.config.boxPosX = posX;

		var update = {
			boxPosTop: g.REF.mainCont.offsetTop,
			boxPosX: posX
		};

		saveChangesToStorage( BG_TASK.SAVE_CONFIG, update );
	}


	/**
	 * Stop tracking the mouse movement and save the window position.
	 * @param {MouseEvent} ev
	 */
	function trackMouseDownStart_Move( ev ) {
		var m = GLOBAL.MOUSE;

		m.lastX = ev.clientX;
		m.lastY = ev.clientY;

		document.addEventListener( 'mousemove', moveMLE, false );
		document.addEventListener( 'mouseup', trackMouseDownEnd_Move, false );
	}


	/**
	 * Start tracking the mouse movement and adjust the window size.
	 * @param {MouseEvent} ev
	 */
	function trackMouseDownEnd_Resize( ev ) {
		var d = document;
		var g = GLOBAL;
		var m = g.MOUSE;
		var mc = g.REF.mainCont;
		var posX = mc.offsetLeft;
		var boxWidth = parseInt( mc.style.width, 10 );
		var boxHeight = parseInt( mc.style.height, 10 );

		mc.className += ' transition';

		m.lastX = null;
		m.lastY = null;

		d.removeEventListener( 'mousemove', resizeMLE, false );
		d.removeEventListener( 'mouseup', trackMouseDownEnd_Resize, false );

		// Update config in this tab – part 1
		g.config.boxWidth = boxWidth;
		g.config.boxHeight = boxHeight;

		if( g.config.boxAlign == 'right' ) {
			posX = parseInt( mc.style.right, 10 );
		}
		else {
			posX = mc.offsetLeft;
		}

		// Update config in this tab – part 2
		g.config.boxPosX = posX;

		var update = {
			boxWidth: boxWidth,
			boxHeight: boxHeight,
			boxPosX: posX
		};

		saveChangesToStorage( BG_TASK.SAVE_CONFIG, update );

		// Adjust CSS just until the next page reload
		var tempStyle = d.getElementById( 'MLE-temp' + g.noise );

		if( !tempStyle ) {
			tempStyle = d.createElement( 'style' );
			tempStyle.type = 'text/css';
			tempStyle.id = 'MLE-temp' + g.noise;
		}

		tempStyle.textContent = '#mle' + g.noise + '.show {' +
			' width: ' + boxWidth + 'px !important;' +
			' height: ' + boxHeight + 'px !important; }';
		d.getElementsByTagName( 'head' )[0].appendChild( tempStyle );

		mc.style.width = '';
		mc.style.height = '';
	}


	/**
	 * Stop tracking the mouse movement and
	 * save the window size.
	 * @param {MouseEvent} ev
	 * @param {String}     direction "sw" or "se".
	 */
	function trackMouseDownStart_Resize( ev, direction ) {
		var d = document;
		var g = GLOBAL;
		var m = g.MOUSE;
		var mc = g.REF.mainCont;
		var tempStyle = d.getElementById( 'MLE-temp' + g.noise );

		if( tempStyle ) {
			tempStyle.textContent = '';
		}

		mc.className = mc.className.replace( ' transition', '' );
		mc.style.width = g.config.boxWidth + 'px';
		mc.style.height = g.config.boxHeight + 'px';

		m.lastX = ev.clientX;
		m.lastY = ev.clientY;
		m.resizeDirection = direction;

		d.addEventListener( 'mousemove', resizeMLE, false );
		d.addEventListener( 'mouseup', trackMouseDownEnd_Resize, false );
	}


	/**
	 * Show a preview of the emote that is about to be added.
	 * @param {Event} ev
	 */
	function updatePreview( ev ) {
		var previewId = 'preview' + ev.target.id;
		var preview = document.getElementById( previewId );
		var emoteLink = ev.target.value;

		if( emoteLink.indexOf( '/' ) !== 0 ) {
			emoteLink = '/' + emoteLink;
		}
		if( emoteLink == preview.href ) {
			return;
		}

		preview.href = emoteLink;
		preview.className = ''; // reset old classes
		preview = Builder.addClassesForEmote( preview );
	}



	/**
	 * Build all the HTML.
	 * Or most of it. There is an extra "class" for the context menu.
	 */
	var Builder = {


		ploungeClass: 'mle-ploungemote',


		/**
		 * Add CSS classes to the emote so it will be displayed
		 * if it is an out-of-sub emote.
		 * @param  {DOMElement} emote
		 * @return {DOMElement} The emote with CSS classes (or not).
		 */
		addClassesForEmote: function( emote ) {
			var cfg = GLOBAL.config;
			var emoteName = emote.href.split( '/' );

			emoteName = emoteName[emoteName.length - 1];

			if( !emote.className ) {
				emote.className = '';
			}

			// If BetterPonymotes is used for out-of-sub emotes
			if( cfg.adjustForBetterPonymotes ) {
				emote.className += ' bpmote-' + emoteName.toLowerCase();
			}
			// If GrEmB is used
			if( cfg.adjustForGrEmB ) {
				emote.className += ' G_' + emoteName + '_';
			}

			emote.className = emote.className.trim();

			return emote;
		},


		/**
		 * Add CSS rules to the page inside a <style> tag in the head.
		 */
		addCSS: function() {
			var g = GLOBAL;
			var cfg = g.config;
			var styleNode = document.createElement( 'style' );
			var rules = '\n';
			var zIndex, listDir;

			zIndex = cfg.boxUnderHeader ? 10 : 10000;
			listDir = ( cfg.boxScrollbar == 'right' ) ? 'ltr' : 'rtl';

			// Show out-of-sub emotes
			this.addOutOfSubCSS();

			// '%' will be replaced with noise
			var css = {
				// Collection of same CSS
				'#mle%.show,\
				 #mle%.show ul,\
				 #mle%.show .mle-dragbar,\
				 #mle%.show .mle-btn,\
				 #mle%.show .mle-search,\
				 #mle%.show div,\
				 #mle-ctxmenu%.show,\
				 .diag.show':
						'display: block;',
				'#mle%,\
				 #mle-ctxmenu%':
						'font: 12px Verdana, Arial, Helvetica, "DejaVu Sans", sans-serif; line-height: 14px; text-align: left;',
				'#mle% .mle-btn':
						'background-color: #808080; border-bottom-left-radius: 2px; border-bottom-right-radius: 2px; border-top: 1px solid #404040; color: #ffffff; cursor: default; display: none; font-weight: bold; padding: 5px 0 6px; position: absolute; text-align: center; top: -1px;',
				'#mle% .mle-btn:hover':
						'background-color: #404040;',
				// Inactive state
				'#mle%':
						'background-color: ' + cfg.boxBgColor + '; border: 1px solid #d0d0d0; border-radius: 2px; box-sizing: border-box; -moz-box-sizing: border-box; position: fixed; z-index: ' + zIndex + '; width: ' + cfg.boxWidthMinimized + 'px;',
				'#mle%.transition':
						'-moz-transition: width ' + cfg.boxAnimationSpeed + 'ms; -webkit-transition: width ' + cfg.boxAnimationSpeed + 'ms; -o-transition: width ' + cfg.boxAnimationSpeed + 'ms; transition: width ' + cfg.boxAnimationSpeed + 'ms;',
				// Active state
				'#mle%.show':
						'width: ' + cfg.boxWidth + 'px; height: ' + cfg.boxHeight + 'px; padding: 36px 10px 10px; z-index: 10000;',
				// Dragging bars
				'.mle-dragbar':
						'display: none; position: absolute;',
				'.mle-dragbar0': // left
						'height: 100%; left: 0; top: 0; width: 10px;',
				'.mle-dragbar1': // right
						'height: 100%; right: 0; top: 0; width: 10px;',
				'.mle-dragbar2': // bottom
						'bottom: 0; height: 10px; left: 0; width: 100%;',
				'.mle-dragbar3': // top
						'height: 32px; left: 0; top: 0; width: 100%;',
				// Resize handles
				'.mle-resizer':
						'background-image: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAG0lEQVQY02NgIBFoEKuQf+AUaxCrmH9wKMYKALBdAnfp7Ex1AAAAAElFTkSuQmCC"); bottom: 0; display: none; height: 10px; position: absolute; width: 10px;',
				'.mle-resizer:hover':
						'background-color: rgba( 10, 10, 10, 0.1 );',
				'.mle-resizer0':
						'border-top-right-radius: 2px; cursor: sw-resize; left: 0;',
				'.mle-resizer1':
						'border-top-left-radius: 2px; cursor: se-resize; right: 0; -o-transform: scaleX( -1 ); -webkit-transform: scaleX( -1 ); transform: scaleX( -1 );',
				// Header
				'#mle% .mle-header':
						'display: block; color: #303030; font-weight: bold; padding: 6px 0; text-align: center;',
				'#mle%.show .mle-header':
						'display: none;',
				// Manage button
				'#mle% .mle-mng-link':
						'width: 72px; z-index: 10;',
				// Options button
				'#mle% .mle-opt-link':
						'background-color: #f4f4f4 !important; border-top-color: #b0b0b0; color: #a0a0a0; font-weight: normal !important; left: 98px; padding-left: 8px; padding-right: 8px; z-index: 14;',
				'#mle% .mle-opt-link:hover':
						'border-top-color: #606060; color: #000000;',
				// Search field
				'#mle% .mle-search':
						'border: 1px solid #e0e0e0; border-top-color: #b0b0b0; border-bottom-left-radius: 4px; border-bottom-right-radius: 4px; color: #b0b0b0; display: none; left: 175px; padding: 3px 5px; position: absolute; top: -1px; width: 120px; z-index: 16;',
				'#mle% .mle-search:active,\
				 #mle% .mle-search:focus':
						'color: #101010;',
				// Search page
				'strong.search-header%':
						'border-bottom: 1px solid #e0e0e0; color: #101010; display: block; font-size: 14px; font-weight: normal; margin: 14px 0 10px; padding-bottom: 2px;',
				'strong.search-header%:first-child':
						'margin-top: 0;',
				// Close button
				'#mle% .mle-close':
						'right: 10px; z-index: 20; padding-left: 12px; padding-right: 12px;',
				// Selection list
				'#mle% ul':
						'direction: ' + listDir + '; display: none; overflow: auto; float: left; height: 100%; margin: 0; max-width: 150px; padding: 0;',
				'#mle% li':
						'background-color: #e0e0e0; color: #303030; cursor: default; border-bottom: 1px solid #c0c0c0; border-top: 1px solid #ffffff; direction: ltr; padding: 8px 16px; -moz-user-select: none; -o-user-select: none; -webkit-user-select: none; user-select: none;',
				'#mle% li:first-child':
						'border-top-width: 0;',
				'#mle% li:last-child':
						'border-bottom-width: 0;',
				'#mle% li:hover':
						'background-color: #d0d0d0;',
				'#mle% li.activelist':
						'background-color: transparent;',
				'#mle% li.activelist strong':
						'font-weight: bold;',
				'#mle% li strong':
						'font-weight: normal; padding-right: 16px; white-space: nowrap;',
				'#mle% li span':
						'color: #909090; display: block; font-size: 9px; font-weight: normal !important; white-space: nowrap;',
				'#mle% li input':
						'box-sizing: border-box; -moz-box-sizing: border-box; width: 100%;',
				// Blocks and pages
				'.mle-block%,\
				 .mle-manage%,\
				 .mle-search%':
						'box-sizing: border-box; -moz-box-sizing: border-box; display: none; height: 100%; overflow: auto; padding: 10px;',
				// Emote blocks
				'.mle-block% a':
						'display: inline-block !important; float: none !important; border: 1px solid ' + cfg.boxEmoteBorder + '; border-radius: 2px; box-sizing: content-box; margin: 1px; min-height: 10px; min-width: 10px; vertical-align: top;',
				'.mle-block% a:hover':
						'border-color: #96BFE9;',
				'.mle-warning':
						'color: #808080; margin-bottom: 10px; text-align: center; text-shadow: 1px 1px 0 #ffffff;',
				// Notifier
				'.mle-msg%':
						'background-color: rgba( 10, 10, 10, 0.6 ); color: #ffffff; font-size: 13px; position: fixed; left: 0; ' + cfg.msgPosition + ': -200px; padding: 19px 0; text-align: center; width: 100%; z-index: 10100; -moz-transition: ' + cfg.msgPosition + ' ' + cfg.msgAnimationSpeed + 'ms; -webkit-transition: ' + cfg.msgPosition + ' ' + cfg.msgAnimationSpeed + 'ms; -o-transition: ' + cfg.msgPosition + ' ' + cfg.msgAnimationSpeed + 'ms; transition: ' + cfg.msgPosition + ' ' + cfg.msgAnimationSpeed + 'ms;',
				'.mle-msg%.show':
						cfg.msgPosition + ': 0;',
				// Manage page
				'.mle-manage% label':
						'border-bottom: 1px solid #e0e0e0; display: block; font-weight: bold; margin-bottom: 10px; padding-bottom: 4px;',
				'.mle-manage% div':
						'padding-bottom: 20px;',
				'.mle-manage% input[type="text"]':
						'background-color: #ffffff; border: 1px solid #d0d0d0; padding: 2px 4px; width: 120px;',
				'.mle-manage% select':
						'background-color: #ffffff; border: 1px solid #d0d0d0; max-width: 100px; padding: 2px 4px;',
				'.mle-manage% input[type="submit"]':
						'background-color: #6189b5; border: 0; border-radius: 2px; color: #ffffff; margin-left: 12px; padding: 3px 8px;',
				'.mle-manage% input[type="submit"]:hover':
						'background-color: #202020 !important;',
				'#previewaddemote%':
						'display: inline-block; border: 1px solid #505050; border-radius: 2px; float: none; margin-top: 10px; min-height: 4px; min-width: 4px;',
				'.mle-manage% div div':
						'line-height: 16px; padding: 0;',
				'.mle-manage% table':
						'margin-top: 10px;',
				'.mle-manage% th,\
				 .mle-manage% td':
						'border: 1px solid #e0e0e0; padding: 2px 4px; vertical-align: top;'
			};

			if( cfg.boxTrigger != 'float' ) {
				css['#mle%'] += ' display: none;';
			}

			if( cfg.boxTrigger == 'button' ) {
				css['.mle-open-btn'] = 'margin: 0 0 0 4px !important; vertical-align: top;';
			}

			if( cfg.ctxMenu ) {
				css['#mle-ctxmenu%,\
				     .diag'] =
						'color: ' + cfg.ctxStyleColor + '; cursor: default; display: none; position: fixed; z-index: 50000000; white-space: nowrap; background-color: ' + cfg.ctxStyleBgColor + '; border: 1px solid ' + cfg.ctxStyleBorderColor + '; border-radius: 1px; box-shadow: 2px 1px 6px -2px rgba( 80, 80, 80, 0.4 ); font-size: 12px; list-style-type: none; margin: 0; padding: 0;';
				css['#mle-ctxmenu% li'] =
						'display: none;';
				css['#mle-ctxmenu% li,\
				     .diag li'] =
						'margin: 2px 0; padding: 5px 14px;';
				css['#mle-ctxmenu% li:hover,\
				     .diag li:hover'] =
						'background-color: ' + cfg.ctxStyleHoverColor + ';';
				css['#mle-ctxmenu%.in-box .in,\
				     #mle-ctxmenu%.out-of-box .out'] =
						'display: block;';
				css['.diag'] =
						'max-height: ' + ContextMenu.CONFIG.menuMaxHeight + 'px; overflow: auto; width: ' + ContextMenu.CONFIG.menuWidth + 'px; z-index: 50000010;';
			}

			if( cfg.showEmoteTitleText ) {
				var display = 'float: left;';

				if( cfg.showTitleStyleDisplay == 'block' ) {
					display = 'display: block;';
				}

				css['.mle-titletext'] =
						'background-color: ' + cfg.showTitleStyleBgColor + '; border: 1px solid ' + cfg.showTitleStyleBorderColor + '; border-radius: 2px; color: ' + cfg.showTitleStyleColor + '; margin-right: 4px; padding: 0 4px; ' + display;
			}

			if( cfg.revealUnknownEmotes ) {
				css['.mle-revealemote'] =
						'background-color: ' + cfg.revealStyleBgColor + '; border: 1px solid ' + cfg.revealStyleBorderColor + '; border-radius: 2px; color: ' + cfg.revealStyleColor + '; display: inline-block; float: left; margin-right: 4px; padding: 2px 6px;' ;
			}

			styleNode.type = 'text/css';
			styleNode.id = 'MLE' + g.noise;

			for( var rule in css ) {
				rules += rule.replace( /%/g, g.noise );
				rules += '{' + css[rule] + '}';
			}

			styleNode.textContent = rules;

			document.getElementsByTagName( 'head' )[0].appendChild( styleNode );

			// The CSS variable is a little big and we won't need this function again, sooo...
			// Leave this function for the Garbage Collector.
			this.addCSS = null;
		},


		/**
		 * Add the HTML to the page.
		 */
		addHTML: function() {
			var d = document;
			var g = GLOBAL;
			var fragmentNode = d.createDocumentFragment();

			// Add headline
			var labelMain = d.createElement( 'strong' );
			labelMain.className = 'mle-header';
			labelMain.textContent = g.config.boxLabelMinimized;

			// Add close button
			var close = d.createElement( 'span' );
			close.className = 'mle-close mle-btn';
			close.textContent = 'x';
			close.addEventListener( 'click', mainContainerHide, false );

			// Add manage link
			var mngTrigger = d.createElement( 'span' );
			mngTrigger.className = 'mle-mng-link mle-btn';
			mngTrigger.textContent = 'Manage';
			mngTrigger.addEventListener( 'click', showManagePage, false );

			// Add options link
			var optTrigger = d.createElement( 'span' );
			optTrigger.className = 'mle-opt-link mle-btn';
			optTrigger.textContent = 'Options';
			optTrigger.title = 'Opens the options page';
			optTrigger.addEventListener( 'click', function( e ) {
				postMessage( { task: BG_TASK.OPEN_OPTIONS } );
			}, false );

			// Add search field
			var searchTrigger = d.createElement( 'input' );
			searchTrigger.className = 'mle-search';
			searchTrigger.value = 'search';
			searchTrigger.addEventListener( 'click', Search.activate, false );
			searchTrigger.addEventListener( 'keyup', Search.submit.bind( Search ), false );

			// Add search page
			var searchPage = d.createElement( 'div' );
			searchPage.className = 'mle-block' + g.noise;
			this.preventOverScrolling( searchPage );

			// Add manage page
			var mngPage = d.createElement( 'div' );
			mngPage.className = 'mle-manage' + g.noise;

			// Add most-of-the-time-hidden message block
			// (NOT a part of the main container)
			var msg = d.createElement( 'p' );
			msg.className = 'mle-msg' + g.noise;

			// Add dragging bars
			var dragbar;
			for( var i = 0; i < 4; i++ ) {
				dragbar = d.createElement( 'div' );
				dragbar.className = 'mle-dragbar mle-dragbar' + i;
				dragbar.addEventListener( 'mousedown', trackMouseDown, false );
				dragbar.addEventListener( 'mouseup', trackMouseDown, false );

				fragmentNode.appendChild( dragbar );
			}

			// Add resize handles
			var resizer;
			for( var i = 0; i < 2; i++ ) {
				resizer = d.createElement( 'div' );
				resizer.className = 'mle-resizer mle-resizer' + i;
				resizer.addEventListener( 'mousedown', trackMouseDown, false );
				resizer.addEventListener( 'mouseup', trackMouseDown, false );

				fragmentNode.appendChild( resizer );
			}

			// Append all the above to the DOM fragment
			fragmentNode = appendChildren(
				fragmentNode,
				[
					mngTrigger,
					optTrigger,
					searchTrigger,
					labelMain,
					close,
					this.createEmoteBlocksAndNav()
				]
			);

			// Add list and emote blocks to main container
			g.REF.mainCont = this.createMainContainer();
			g.REF.mainCont.appendChild( fragmentNode );

			g.REF.msg = msg;
			g.REF.mngPage = mngPage;
			g.REF.searchPage = searchPage;

			d.body.appendChild( g.REF.mainCont );
			d.body.appendChild( msg );

			if( g.config.ctxMenu ) {
				d.body.appendChild( ContextMenu.create() );
			}

			if( g.config.boxTrigger == 'button' ) {
				this.addMLEButtons();
			}
		},


		/**
		 * Add buttons top open MLE next to every textarea.
		 */
		addMLEButtons: function() {
			var d = document;
			var textareas = d.querySelectorAll( '.help-toggle' );

			for( var i = 0; i < textareas.length; i++ ) {
				var ta = textareas[i];

				var button = d.createElement( 'button' );
				button.className = 'mle-open-btn';
				button.type = 'button';
				button.textContent = 'open MLE';
				button.addEventListener( 'mouseover', rememberActiveTextarea, false );
				button.addEventListener( 'click', mainContainerShow, false );

				// Place MLE button to the left of the BPM button
				var refEle = ta.querySelector( '.bpm-search-toggle' );
				refEle ? ta.insertBefore( button, refEle ) : ta.appendChild( button );
			}

			buttonObserverSetup();
		},


		/**
		 * Switch the name of the list with an input field to change the name.
		 * @param {Event} ev
		 */
		addRenameListField: function( ev ) {
			var name = ev.target.textContent;
			var parent = ev.target.parentNode;
			var input = document.createElement( 'input' );

			input.type = 'text';
			input.value = name;
			input.addEventListener( 'keydown', function( ev ) {
				renameList( parent, ev );
			}, false );

			ev.target.setAttribute( 'hidden', 'hidden' );
			parent.insertBefore( input, parent.firstChild );
		},


		/**
		 * Add a stylesheet to display out-of-sub emotes.
		 */
		addOutOfSubCSS: function() {
			var g = GLOBAL;

			if( !g.config.displayEmotesOutOfSub ) {
				return;
			}

			var styleNode = document.createElement( 'style' );
			styleNode.type = 'text/css';
			styleNode.id = 'MLE-emotes' + g.noise;

			// Not very graceful, but at the moment this extension
			// is build under the assumption that no more subreddits
			// will be added in the future.

			var here = window.location.pathname.toLowerCase();
			var subCSS;

			// Don't include CSS on the subreddit it originates from
			if( !/^\/r\/mlplounge\//i.test( here ) ) {
				// On the user/message page we know from which subreddit a
				// comment comes from, therefore we can use the right emote.
				if( /^\/(user\/|message\/|r\/friends\/comments)/i.test( here ) ) {
					subCSS = g.sub_css['r/mlplounge'] + '\n\n';
					subCSS = subCSS.replace(
						/a\[href\|="(\/[a-zA-Z0-9-]+)"]/g,
						'a.' + this.ploungeClass + '[href|="$1"],$&'
					);
					this.findAndAddClassToPloungeEmotes();
				}
				else {
					subCSS = g.sub_css['r/mlplounge'] + '\n\n';
				}

				styleNode.textContent += subCSS;
			}

			if( !/^\/r\/mylittlepony\//i.test( here ) ) {
				styleNode.textContent += g.sub_css['r/mylittlepony'] + '\n\n';
			}

			// Special modifiers from r/mylittlepony
			styleNode.textContent += 'a[href|="/sp"]{display:inline-block;padding-right:100%;width:0px;height:0px}a[href|="/sp"]+.reddit_show_hidden_emotes_span{display:none}a[href^="/"][href*="-in-"],a[href^="/"][href$="-in"],a[href^="/"][href*="-inp-"],a[href^="/"][href$="-inp"]{float:none!important;display:inline-block!important}body a[href="/spoiler"]{background:black!important;color:black!important}body a[href="/spoiler"]:hover{color:white!important}';

			// Not needed anymore, leave it for the Garbage Collector
			g.sub_css = {};

			var head = document.getElementsByTagName( 'head' )[0];
			head.insertBefore( styleNode, head.firstChild );
		},


		/**
		 * Create emote blocks filled with emotes and the navigation.
		 */
		createEmoteBlocksAndNav: function() {
			var d = document;
			var g = GLOBAL;
			var countBlocks = 0;
			var fragmentNode = d.createDocumentFragment();
			var here = window.location.pathname.toLowerCase();
			var listNav = d.createElement( 'ul' );

			// Add navigation
			this.preventOverScrolling( listNav );
			fragmentNode.appendChild( listNav );

			for( var listName in g.emotes ) {
				var emoteList = g.emotes[listName];

				// Create list navigation
				var listLink = this.createListLink( listName, g.emotes[listName].length );
				listNav.appendChild( listLink );

				// Create emotes section
				var emoteBlock = d.createElement( 'div' );
				emoteBlock.className = 'mle-block' + g.noise;
				this.preventOverScrolling( emoteBlock );

				// Display a little warning for the Plounge emote list, if opened in
				// r/mylittlepony since those emotes won't be visible for not-pony-script-users.
				if(
					here.indexOf( '/r/mylittlepony/' ) === 0 &&
					listName == g.config.listNamePlounge
				) {
					var warn = document.createElement( 'p' );
					warn.className = 'mle-warning';
					warn.textContent = 'Please remember that the emotes of this list won\'t be visible to people without an extension like MLE or BPM in this subreddit.';
					emoteBlock.appendChild( warn );
				}

				// Add the emotes to the block
				emoteBlock.appendChild( this.createEmotesOfList( emoteList ) );

				// Display first emote section per default
				if( countBlocks === 0 ) {
					listLink.className = 'activelist';
					g.shownBlock = listName;
					fragmentNode.appendChild( emoteBlock );
				}

				g.REF.lists[listName] = listLink;
				g.REF.emoteBlocks[listName] = emoteBlock;

				countBlocks++;
			}

			g.REF.listsCont = listNav;

			return fragmentNode;
		},


		/**
		 * Fill an emote block with emotes.
		 */
		createEmotesOfList: function( emoteList ) {
			var fragment = document.createDocumentFragment();

			for( var i = 0; i < emoteList.length; i++ ) {
				var emoteLink = '/' + emoteList[i];
				fragment.appendChild( this.createEmote( emoteLink ) );
			}

			return fragment;
		},


		/**
		 * Create a single emote.
		 * @param {String}  link
		 * @param {Boolean} draggable If the emote shall be draggable.
		 */
		createEmote: function( link, draggable ) {
			var emote = document.createElement( 'a' );

			if( typeof draggable == 'undefined' ) {
				draggable = true;
			}

			emote.href = link;
			emote = this.addClassesForEmote( emote );

			emote.addEventListener( 'click', insertEmote, false );

			if( draggable ) {
				emote.addEventListener( 'dragstart', DragAndDrop.dragstartMoveEmote.bind( DragAndDrop ), false );

				// The "dragenter" and "dragover" events have
				// to be stopped in order for "drop" to work.
				emote.addEventListener( 'dragenter', stopEvent, false );
				emote.addEventListener( 'dragover', stopEvent, false );

				// Stop "dragend" as well, so if the drop target isn't
				// an emote, the browser doesn't open the emote URL.
				emote.addEventListener( 'dragend', stopEvent, false );

				emote.addEventListener( 'drop', DragAndDrop.dropMoveEmote.bind( DragAndDrop ), false );
			}

			return emote;
		},


		/**
		 * Create a header for the search page results.
		 * @param  {String}     listName Name of the list.
		 * @return {DOMElement}
		 */
		createHeaderForSearch: function( listName ) {
			var header = document.createElement( 'strong' );

			header.className = 'search-header' + GLOBAL.noise;
			header.textContent = listName;

			return header;
		},


		/**
		 * Create list element to toggle display of the corresponding emote box.
		 * @param  {String}     listName     Name of list.
		 * @param  {Integer}    elementCount Number of emotes in this list.
		 * @return {DOMElement}
		 */
		createListLink: function( listName, elementCount ) {
			var d = document;
			var listLink = d.createElement( 'li' );
			var name = d.createElement( 'strong' );
			var count = d.createElement( 'span' );

			name.textContent = listName;
			name.addEventListener( 'dblclick', this.addRenameListField, false );

			count.textContent = elementCount + ' emotes';

			listLink.setAttribute( 'draggable', 'true' );
			listLink.addEventListener( 'click', toggleEmoteBlock, false );
			listLink.addEventListener( 'dragstart', DragAndDrop.dragstartMoveList.bind( DragAndDrop ), false );
			DragAndDrop.makeDropZone( listLink, DragAndDrop.dropMoveList );

			appendChildren( listLink, [name, count] );

			return listLink;
		},


		/**
		 * Create a label.
		 * @param  {String}     text Text for the label.
		 * @return {DOMElement}      The label.
		 */
		createLabel: function( text ) {
			var label = document.createElement( 'label' );
			label.textContent = text;

			return label;
		},


		/**
		 * Create a HTML select of all existing emote lists/blocks.
		 * @param {String} selId Value for ID attribute of the <select>.
		 */
		createListSelect: function( selId ) {
			var selList = document.createElement( 'select' );

			for( var listName in GLOBAL.emotes ) {
				var optList = document.createElement( 'option' );
				optList.value = listName.replace( /"/g, '\\"' );
				optList.textContent = listName;

				selList.appendChild( optList );
			}
			selList.id = selId;

			return selList;
		},


		/**
		 * Create the main container without its later children,
		 * but set up with event listeners and style.
		 * @return {DOMElement} Main container.
		 */
		createMainContainer: function() {
			var cfg = GLOBAL.config;
			var main = document.createElement( 'div' );

			main.id = 'mle' + GLOBAL.noise;
			main.className = ' transition';
			main.addEventListener( 'mouseover', rememberActiveTextarea, false );
			main.addEventListener( 'mouseover', mainContainerShow, false );

			// Add style for position of main container
			if( cfg.boxAlign == 'right' ) {
				main.style.right = cfg.boxPosX + 'px';
			}
			else {
				main.style.left = cfg.boxPosX + 'px';
			}

			main.style.top = cfg.boxPosTop + 'px';

			return main;
		},


		/**
		 * Create the parts of the manage page.
		 * @param {DOMElement} form The manage page (container).
		 */
		createManagePage: function( form ) {
			var areas = [
				this.mngAreaForNewEmote(),
				this.mngAreaForNewList(),
				this.mngAreaForDelList(),
				this.mngAreaForNote(
					'Move emotes',
					'Use Drag&amp;Drop to move emotes.<br />To move it to another list, right-click on it and select “Move to List”.'
				),
				this.mngAreaForNote(
					'Delete emotes',
					'Right-click on the emote and select “Delete Emote”.'
				),
				this.mngAreaForNote(
					'Move lists',
					'Use Drag&amp;Drop to move lists. A dragged object will be inserted before the one it was dropped on.'
				),
				this.mngAreaForNote(
					'Rename lists',
					'Double-click on the list name. Confirm the new name with [Enter].'
				),
				this.mngAreaForNote(
					'Search',
					'There are additional search modes. Set one of the following as prefix:<table>' +
					'<tr><th><code>regex:</code></th><td>Use regular expressions.</td></tr>' +
					'<tr><th><code>alt:</code></th><td>Include alternative names learned from the subreddit stylesheets. For example "a00" will find "ajlie".</td></tr>' +
					'<tr><th><code>tag:</code></th><td>Get all emotes with the given tag.<br />' +
					'<span style="font-weight: bold;">Moods:</span> angry, bashful, blank, crazed (derped), evil (malicious), determined, distraught, happy, incredulous, misc, sad, sarcastic (smug), scared, shocked, thoughtful.<br />' +
					'<span style="font-weight: bold;">Ponies:</span> Just use the name (without blanks) or try initials like <code>"ts"</code> for Twilight.</td></tr>' +
					'</table>'
				),
				this.mngAreaForNote(
					'Backups',
					'Please back up your emotes and config from time to time. You can export those on the options page and then copy&amp;paste them into a text file.'
				),
				this.mngAreaForNote(
					'Did you know?',
					'You can move this window. Just grab it close to its border.'
				)
			];
			var frag = appendChildren( document.createDocumentFragment(), areas );

			this.preventOverScrolling( form );
			form.appendChild( frag );
		},


		/**
		 * Display the title text of an emote next to it.
		 * @param {DOMElement} emote
		 */
		emoteShowTitleText: function( emote ) {
			var pathNoFlags = emote.pathname.split( '-' )[0];

			if(
				emote.title.length === 0 ||
				pathNoFlags == '/spoiler' ||
				pathNoFlags == '/s'
			) {
				return;
			}

			// Don't reveal title text if it's some emote info put there by BPM
			if( emote.title.match( /( from r\/[a-z0-9-_]+$)|(Unknown emote )/i ) ) {
				return;
			}

			var text = document.createElement( 'span' );
			var evaluated = this.linkifyURLs( emote.title );

			text.className = 'mle-titletext';

			if( emote.title == evaluated ) {
				text.textContent = evaluated;
			}
			else {
				text.innerHTML = evaluated;
			}

			emote.parentNode.insertBefore( text, emote.nextSibling );
		},


		/**
		 * Add an additional CSS class to every emote found on the page.
		 */
		findAndAddClassToPloungeEmotes: function() {
			if( GLOBAL.config.adjustEmotesInInbox ) {
				var targets = document.querySelectorAll( '.comment, .message' );

				for( var i = 0; i < targets.length; i++ ) {
					var target = targets[i];
					var subreddit = target.querySelector( '.parent a.subreddit' );
					var subjectLink = target.querySelector( '.subject a' );
					var from;

					if( subreddit ) {
						from = subreddit.pathname.toLowerCase();
					}
					else if( subjectLink ) {
						from = subjectLink.pathname.toLowerCase();
					}
					else {
						continue;
					}

					if( from.indexOf( '/r/mlplounge/' ) === 0 ) {
						var emotes = target.querySelectorAll( '.md a' );
						this.ploungeEmotesAddClass( emotes );
					}
				}
			}
		},


		/**
		 * Get the base HTML object for the RES live preview.
		 * @param  {DOMElement} ele
		 * @return {DOMElement|Boolean}
		 */
		getBaseForLivePreview: function( ele ) {
			var base = false;

			// Textarea
			if( ele.tagName.toLowerCase() == 'textarea' ) {
				base = ele.parentNode.parentNode.parentNode;
			}
			// Reply
			else if(
				ele.tagName.toLowerCase() == 'a' &&
				ele.outerHTML.indexOf( 'onclick="return reply(this)"' ) >= 0
			) {
				// I'm sorry.
				base = ele.parentNode.parentNode.parentNode.parentNode.parentNode.querySelector( '.child > form.usertext' );
			}
			// Edit
			else if(
				ele.tagName.toLowerCase() == 'a' &&
				ele.outerHTML.indexOf( 'onclick="return edit_usertext(this)"' ) >= 0
			) {
				base = ele.parentNode.parentNode.parentNode.querySelector( 'form.usertext' );
			}

			return base;
		},


		/**
		 * Convert URLs to actual HTML links.
		 * @param  {String} text String to evaluate.
		 * @return {String}      Evaluated String.
		 */
		linkifyURLs: function( text ) {
			if( !GLOBAL.config.showTitleConvertURLs ) {
				return text;
			}

			// // Markdown
			// text = text.replace( /\[(.*)\]\((.+)\)/g, "<a href=\"$2\">$1</a>" );

			// URL only
			text = text.replace( /([^=][^"])((http|ftp)[s]?:\/\/[^ "']+)/gi, '$1<a href="$2">$2</a>' );
			text = text.replace( /^((http|ftp)[s]?:\/\/[^ "']+)/gi, '<a href="$1">$1</a>' );

			return text;
		},


		/**
		 * Iterates over all the emotes on the page in order
		 * to maybe modify them in some way.
		 */
		modifyAllOnPageEmotes: function() {
			var d = document;
			var cfg = GLOBAL.config;

			// If we ain't gonna modify anything, then there's no reason
			// to iterate through all the links, now is there?
			if(
				!cfg.showEmoteTitleText &&
				!cfg.stopEmoteLinkFollowing &&
				!cfg.revealUnknownEmotes
			) {
				return;
			}

			d.addEventListener( 'click', this.scanForLivePreview );

			// Iterate all the links
			for( var i = 0; i < d.links.length; i++ ) {
				this.modifyEmote( d.links[i] );
			}
		},


		/**
		 * Modify an emote: Stop link following, show title, reveal unknown ones.
		 * @param {DOMElement} emote
		 */
		modifyEmote: function( emote ) {
			if( !isEmote( emote ) ) {
				return;
			}

			var cfg = GLOBAL.config;

			// Prevent following of the link (what an emote basically is)
			if( cfg.stopEmoteLinkFollowing ) {
				emote.addEventListener( 'click', stopEvent, false );
			}

			// Display title text
			if( cfg.showEmoteTitleText ) {
				this.emoteShowTitleText( emote );
			}

			// Reveal unknown emotes
			if( cfg.revealUnknownEmotes ) {
				this.revealUnknownEmote( emote );
			}
		},


		/**
		 * Modify emotes: Stop link following, show title, reveal unknown ones.
		 * Callback function for the DOMNodeInserted event.
		 * @param {Event} ev
		 */
		modifyEmotesDOMEvent: function( ev ) {
			// nodeType = 3 = TEXT_NODE
			if( ev.target.nodeType == 3 ) {
				return;
			}

			if( ev.target.tagName.toLowerCase() == 'a' ) {
				this.modifyEmote( ev.target );
				return;
			}

			// Not a link and no child nodes, so there can't be any emotes
			if( ev.target.children.length === 0 ) {
				return;
			}

			var links = ev.target.querySelectorAll( 'a[href]' );

			for( var i = 0; i < links.length; i++ ) {
				this.modifyEmote( links[i] );
			}
		},


		/**
		 * Modify emotes: Stop link following, show title, reveal unknown ones.
		 * Callback function for the MutationObserver.
		 * @param {MutationRecord} mutations
		 */
		modifyEmotesMutationObserver: function( mutations ) {
			for( var i = 0; i < mutations.length; i++ ) {
				var mutation = mutations[i];

				for( var j = 0; j < mutation.addedNodes.length; j++ ) {
					var node = mutation.addedNodes[j];

					// nodeType = 3 = TEXT_NODE
					if( node.nodeType == 3 ) {
						continue;
					}

					var links = node.querySelectorAll( 'a[href]' );

					for( var k = 0; k < links.length; k++ ) {
						this.modifyEmote( links[k] );
					}
				}
			}
		},


		/**
		 * Create manage area for adding new emotes to lists.
		 */
		mngAreaForNewEmote: function() {
			var d = document;
			var g = GLOBAL;
			var inputEmote = d.createElement( 'input' );
			var preview = d.createElement( 'a' );
			var submitEmote = d.createElement( 'input' );

			inputEmote.type = 'text';
			inputEmote.id = 'addemote' + g.noise;
			inputEmote.addEventListener( 'keyup', updatePreview, false );
			g.REF.inputAddEmote = inputEmote;

			preview.id = 'previewaddemote' + g.noise;

			// Select a list to add the emote to.
			g.REF.selectListAddEmote = this.createListSelect( 'addtolist' + g.noise );

			submitEmote.type = 'submit';
			submitEmote.value = 'save emote';
			submitEmote.addEventListener( 'click', saveNewEmote, false );

			return appendChildren(
				d.createElement( 'div' ),
				[
					this.createLabel( 'Add emote' ),
					inputEmote,
					d.createTextNode( ' to ' ),
					g.REF.selectListAddEmote,
					submitEmote,
					d.createElement( 'br' ),
					preview
				]
			);
		},


		/**
		 * Create manage area for adding new lists.
		 */
		mngAreaForNewList: function() {
			var d = document;

			var inputList = d.createElement( 'input' );
			inputList.type = 'text';
			inputList.id = 'addlist' + GLOBAL.noise;
			GLOBAL.REF.inputAddList = inputList;

			var submitList = d.createElement( 'input' );
			submitList.type = 'submit';
			submitList.value = 'create new list';
			submitList.addEventListener( 'click', saveNewList, false );

			return appendChildren(
				d.createElement( 'div' ),
				[
					this.createLabel( 'Add list' ),
					inputList,
					submitList
				]
			);
		},


		/**
		 * Create manage area for deleting lists.
		 */
		mngAreaForDelList: function() {
			var g = GLOBAL;

			g.REF.selectListDelete = this.createListSelect( 'dellist' + g.noise );

			var submitDel = document.createElement( 'input' );
			submitDel.type = 'submit';
			submitDel.value = 'delete list';
			submitDel.addEventListener( 'click', deleteList, false );

			return appendChildren(
				document.createElement( 'div' ),
				[
					this.createLabel( 'Delete list' ),
					g.REF.selectListDelete,
					submitDel
				]
			);
		},


		/**
		 * Create manage area with contains just a hint.
		 * @param  {String} title
		 * @param  {String} text
		 * @return {DOMElement}
		 */
		mngAreaForNote: function( title, text ) {
			var note = document.createElement( 'div' );
			note.innerHTML = text;

			return appendChildren(
				document.createElement( 'div' ),
				[
					this.createLabel( title ),
					note
				]
			);
		},


		/**
		 * Add a plounge emote CSS class to the list of given emotes.
		 * @param {Array<DOMElement>} emotes List of emotes.
		 */
		ploungeEmotesAddClass: function( emotes ) {
			for( var i = 0; i < emotes.length; i++ ) {
				var emote = emotes[i];

				if( isEmote( emote ) ) {
					emote.className += ' ' + this.ploungeClass;
				}
			}
		},


		/**
		 * When scrolled to the end of a node,
		 * prevent the main window from scrolling.
		 * @param {DOMElement} node
		 */
		preventOverScrolling: function( node ) {
			// Chrome, Opera
			node.addEventListener(
				'mousewheel', this.stopScrolling.bind( node ), false
			);
			// Firefox, the actual standard
			node.addEventListener(
				'wheel', this.stopScrolling.bind( node ), false
			);
		},


		/**
		 * Remove a list.
		 * @param {String} listName Name of the list.
		 */
		removeList: function( listName ) {
			var g = GLOBAL;
			var gr = g.REF;
			var selectLists = [gr.selectListDelete, gr.selectListAddEmote];

			// Remove list from DOM
			for( var key in gr.lists ) {
				var li = gr.lists[key].querySelector( 'strong' );

				if( li.textContent == listName ) {
					gr.listsCont.removeChild( gr.lists[key] );
					delete gr.lists[key];
					break;
				}
			}

			// Remove child if currently shown
			if( g.shownBlock == listName ) {
				gr.mainCont.removeChild( gr.emoteBlocks[listName] );
				g.shownBlock = null;
			}

			// Remove block from memory
			delete gr.emoteBlocks[listName];

			// Remove list name from <select>s
			for( var i = 0; i < selectLists.length; i++ ) {
				if( !selectLists[i] ) {
					continue;
				}

				var children = selectLists[i].childNodes;

				for( var j = 0; j < children.length; j++ ) {
					if( children[j].value == listName ) {
						selectLists[i].removeChild( children[j] );
						break;
					}
				}
			}

			// Remove context menus. Will be rebuild when needed.
			ContextMenu.destroyMenus();
		},


		/**
		 * Reveal an unknown emote.
		 * @param {DOMElement} emote
		 */
		revealUnknownEmote: function( emote ) {
			// Give other scripts (BPM) a little time to apply CSS to emotes.
			// An attempt to reduce the false positive rate for unknown emotes.
			window.setTimeout( function( ev ) {
				// Special emote, nevermind
				if( emote.pathname.indexOf( '/sp' ) === 0 ) {
					return;
				}

				// Has size
				if( emote.offsetWidth > 0 && emote.offsetHeight > 0 ) {
					return;
				}

				var emoteStyle = window.getComputedStyle( emote );

				if(
					( emoteStyle.width == '0px' || emoteStyle.width == 'auto' ) &&
					( emoteStyle.height == '0px' || emoteStyle.height == 'auto' ) &&
					emoteStyle.backgroundImage == 'none'
				) {
					emote.className += ' mle-revealemote';
					emote.textContent = emote.pathname;
				}
			}, 250 );
		},


		/**
		 * Add an observer to every RES live preview element that pops up.
		 * @param {Event} ev
		 */
		scanForLivePreview: function( ev ) {
			var base = Builder.getBaseForLivePreview( ev.target );

			if( !base ) {
				return;
			}

			var previewBox = base.querySelector( '.livePreview .md' );

			if( !previewBox || previewBox.className.indexOf( 'mle-lp-' + base.id ) >= 0 ) {
				return;
			}

			var MutationObserver = window.MutationObserver || window.WebkitMutationObserver;

			// MutationObserver is implented in Chrome (vendor prefixed with "Webkit") and Firefox
			if( MutationObserver ) {
				var observer = new MutationObserver( Builder.modifyEmotesMutationObserver.bind( Builder ) );
				var observerConfig = {
					attributes: false,
					childList: true,
					characterData: false
				};

				observer.observe( previewBox, observerConfig );
			}
			// ... but not in Opera, so we have to do this the deprecated way
			else {
				previewBox.addEventListener( 'DOMNodeInserted', Builder.modifyEmotesDOMEvent.bind( Builder ), false );
			}

			previewBox.className += ' mle-lp-' + base.id;
		},


		/**
		 * Stop scrolling if top or bottom of node has been reached.
		 * this == node
		 * @param {Event} ev
		 */
		stopScrolling: function( ev ) {
			var scrolledToBottom = ( this.scrollHeight - this.scrollTop == this.clientHeight );
			var scrolledToTop = ( this.scrollTop === 0 );
			var wheelDeltaY = ( ev.wheelDeltaY || -ev.deltaY );

			if( scrolledToBottom && wheelDeltaY < 0 ) {
				ev.preventDefault();
			}
			else if( scrolledToTop && wheelDeltaY > 0 ) {
				ev.preventDefault();
			}
		},


		/**
		 * Update the emote counter of the list.
		 * @param {String}  listName Name of the list to update the counter of.
		 * @param {Integer} count    New number of emotes.
		 */
		updateEmoteCount: function( listName, count ) {
			var counterDisplay = GLOBAL.REF.lists[listName].querySelector( 'span' );
			counterDisplay.textContent = count + ' emotes';
		},


		/**
		 * Change name of a list.
		 * @param {String} oldName Old name of the list.
		 * @param {String} newName New name for the list.
		 */
		updateListName: function( oldName, newName ) {
			var g = GLOBAL;
			var gr = g.REF;

			gr.emoteBlocks[newName] = gr.emoteBlocks[oldName];
			delete gr.emoteBlocks[oldName];

			gr.lists[newName] = gr.lists[oldName];
			delete gr.lists[oldName];

			if( g.shownBlock == oldName ) {
				g.shownBlock = newName;
			}

			for( var name in gr.lists ) {
				var strong = gr.lists[name].querySelector( 'strong' );

				if( strong && strong.textContent == oldName ) {
					strong.textContent = newName;
					break;
				}
			}

			this.updateManageSelects( oldName, newName );
		},


		/**
		 * Rebuild list navigation.
		 * @param {Object} lists All lists with all their emotes.
		 */
		updateListOrder: function( lists ) {
			var g = GLOBAL;
			var ul = g.REF.listsCont;

			removeAllChildren( ul );

			g.REF.lists = {};

			for( var listName in lists ) {
				var listLink = this.createListLink( listName, lists[listName].length );
				ul.appendChild( listLink );
				g.REF.lists[listName] = listLink;
			}
		},


		/**
		 * Rebuild the lists that changed or add new ones.
		 * @param {Object} lists Lists and their emotes, that changed.
		 */
		updateLists: function( lists ) {
			var emoteBlocks = GLOBAL.REF.emoteBlocks;

			for( var key in lists ) {
				// Only the content of an existing list changed
				if( emoteBlocks.hasOwnProperty( key ) ) {
					this.updateListsChangeExisting( emoteBlocks[key], lists[key] );
					this.updateEmoteCount( key, lists[key].length );
				}
				// This update adds a new list
				else {
					this.updateListsAddNew( key );
				}
			}
		},


		/**
		 * Add a new list.
		 * @param {String} listName Name of the new (empty) list.
		 */
		updateListsAddNew: function( listName ) {
			var g = GLOBAL;
			var block = document.createElement( 'div' );
			var listLink = this.createListLink( listName, 0 );
			var selectLists = [g.REF.selectListDelete, g.REF.selectListAddEmote];

			// Add new block
			block.className = 'mle-block' + g.noise;
			g.REF.emoteBlocks[listName] = block;

			// Add new list
			g.REF.listsCont.appendChild( listLink );
			g.REF.lists[listName] = listLink;

			// Add <option>s to <select>s
			for( var i = 0; i < selectLists.length; i++ ) {
				if( !selectLists[i] ) {
					continue;
				}

				var selOption = document.createElement( 'option' );
				selOption.value = listName.replace( /"/g, '\\"' );
				selOption.textContent = listName;

				selectLists[i].appendChild( selOption );
			}

			// Destroy context menus. Will be rebuild when needed.
			ContextMenu.destroyMenus();
		},


		/**
		 * Update an existing list.
		 * @param {DOMElement} block  The emote block.
		 * @param {Array}      emotes Emotes of the list.
		 */
		updateListsChangeExisting: function( block, emotes ) {
			removeAllChildren( block );

			// Add all emotes of the updated list
			block.appendChild( this.createEmotesOfList( emotes ) );
		},


		/**
		 * Update the <select>s of the manage page.
		 * @param {String} oldName Old list name.
		 * @param {String} newName New list name.
		 */
		updateManageSelects: function( oldName, newName ) {
			var g = GLOBAL;
			var selectLists = [g.REF.selectListDelete, g.REF.selectListAddEmote];

			for( var i = 0; i < selectLists.length; i++ ) {
				if( !selectLists[i] ) {
					continue;
				}

				var options = selectLists[i].childNodes;

				for( var j = 0; j < options.length; j++ ) {
					if( options[j].value == oldName ) {
						var newOption = document.createElement( 'option' );
						newOption.value = newName.replace( /"/g, '\\"' );
						newOption.textContent = newName;

						selectLists[i].replaceChild( newOption, options[j] );
						break;
					}
				}
			}
		}


	};



	/**
	 * Everything Drag&Drop.
	 * @type {Object}
	 */
	var DragAndDrop = {


		// References to DOMElements associated with Drag&Drop
		REF: {
			draggedEmote: null,
			draggedList: null
		},


		/**
		 * Remember the currently dragged around emote.
		 * @param {Event} ev
		 */
		dragstartMoveEmote: function( ev ) {
			this.REF.draggedEmote = ev.target;
		},


		/**
		 * Remember the currently dragged around list element.
		 * @param {Event} ev
		 */
		dragstartMoveList: function( ev ) {
			this.REF.draggedList = ev.target;

			// Drag&Drop won't work on the list in Firefox 14 without set data.
			ev.dataTransfer.setData( 'text/plain', '' );
		},


		/**
		 * Drop the emote into the DOM at the new place
		 * and remove it from the old one.
		 * @param {Event} ev
		 */
		dropMoveEmote: function( ev ) {
			var g = GLOBAL;

			ev.preventDefault();

			// Different parent means we may drag a list element.
			// We don't drop list elements on emotes, stop it.
			if(
				!ev.target.parentNode ||
				!this.REF.draggedEmote ||
				ev.target.parentNode != this.REF.draggedEmote.parentNode
			) {
				this.REF.draggedList = null;
				return;
			}

			var emoteNameSource = this.REF.draggedEmote.pathname.substring( 1 );
			var emoteNameTarget = ev.target.pathname.substring( 1 );

			// Do nothing if source and target are the same
			if( emoteNameSource == emoteNameTarget ) {
				this.REF.draggedEmote = null;
				return;
			}

			ev.target.parentNode.removeChild( this.REF.draggedEmote );
			ev.target.parentNode.insertBefore( this.REF.draggedEmote, ev.target );

			// Save new order to local storage
			var list = g.emotes[g.shownBlock];
			var emoteIdxSource = list.indexOf( emoteNameSource );

			if( emoteIdxSource > -1 ) {
				list.splice( emoteIdxSource, 1 );
				var emoteIdxTarget = list.indexOf( emoteNameTarget );

				// Same position? Well, back where you belong.
				if( emoteIdxTarget == -1 ) {
					emoteIdxTarget = emoteIdxSource;
				}
				list.splice( emoteIdxTarget, 0, emoteNameSource );
			}

			var update = {};
			update[g.shownBlock] = list;
			saveChangesToStorage( BG_TASK.UPDATE_EMOTES, update );

			this.REF.draggedEmote = null;
		},


		/**
		 * Drop the list into the DOM at the new place
		 * and remove it from the old one.
		 * @param {Event} ev
		 */
		dropMoveList: function( ev ) {
			var g = GLOBAL;
			var evTarget = ev.target;

			ev.preventDefault();

			if( !this.REF.draggedList ) {
				return;
			}

			// If we drop on an element inside of the list, go one up
			if( isList( evTarget.parentNode ) ) {
				evTarget = evTarget.parentNode;
			}

			// Do nothing if source and target are the same
			if( evTarget == this.REF.draggedList ) {
				this.REF.draggedList = null;
				return;
			}

			// Different parent means we may drag an emote.
			// We don't drop emotes on lists, stop it.
			if(
				!evTarget.parentNode ||
				evTarget.parentNode != this.REF.draggedList.parentNode
			) {
				this.REF.draggedList = null;
				return;
			}

			evTarget.parentNode.removeChild( this.REF.draggedList );
			evTarget.parentNode.insertBefore( this.REF.draggedList, evTarget );

			// Reorder and save to storage
			var nameSource = this.REF.draggedList.querySelector( 'strong' ).textContent;
			var nameTarget = evTarget.querySelector( 'strong' ).textContent;

			var reordered = reorderList( nameSource, nameTarget );

			g.emotes = reordered;
			saveChangesToStorage( BG_TASK.UPDATE_LIST_ORDER, g.emotes );

			this.REF.draggedList = null;
		},


		/**
		 * Adds a function to the drop event and stops interfering drag events.
		 * @param {DOMElement}   node     The DOMElement to listen to drop events.
		 * @param {Function}     callback Function to call in case of drop.
		 */
		makeDropZone: function( node, callback ) {
			node.addEventListener( 'dragenter', stopEvent, false );
			node.addEventListener( 'dragover', stopEvent, false );
			node.addEventListener( 'drop', callback.bind( this ), false );
		}


	};



	/**
	 * Everything context menu related.
	 * @type {Object}
	 */
	var ContextMenu = {


		CONFIG: {
			menuMargin: 10, // [px] Margin between menu and sub-menu
			menuMaxHeight: 200, // [px]
			menuWidth: 126 // [px]
		},

		// References to DOMElements associated with the HTML context menu
		REF: {
			menu: null,
			dialogMoveEmote: null,
			dialogSaveEmote: null,
			selectedEmote: null,
			// DOMElement that triggered the context menu
			trigger: null
		},


		/**
		 * Create a context/right-click menu.
		 * @return {DOMElement} Context menu.
		 */
		create: function() {
			var d = document;
			var g = GLOBAL;
			var menu = d.createElement( 'ul' );
			var items = [
				{
					className: 'out',
					text: 'Save Emote',
					onclick: this.itemActionSaveEmote
				},
				{
					className: 'in',
					text: 'Delete Emote',
					onclick: this.itemActionDeleteEmote
				},
				{
					className: 'in',
					text: 'Move to List',
					onclick: this.itemActionMoveEmote
				}
			];

			menu.id = 'mle-ctxmenu' + g.noise;

			// Add items to menu
			for( var i = 0; i < items.length; i++ ) {
				var item = d.createElement( 'li' );
				item.className = items[i].className;
				item.textContent = items[i].text;
				item.addEventListener( 'click', items[i].onclick.bind( this ), false );

				menu.appendChild( item );
			}

			// Add listener for context menu (will only be used on emotes)
			d.body.addEventListener( 'contextmenu', this.show.bind( this ), false );
			d.body.addEventListener( 'click', this.hide.bind( this ), false );

			Builder.preventOverScrolling( menu );
			this.REF.menu = menu;

			return menu;
		},


		/**
		 * Create dialog for the option "Move Emote".
		 * @param {Number} x X coordinate from the left.
		 * @param {Number} y Y coordinate from the top.
		 */
		createDialogMoveEmote: function( x, y ) {
			if( !this.REF.dialogMoveEmote ) {
				var d = document;
				var emotes = GLOBAL.emotes;
				var cont = d.createElement( 'ul' );

				// Add available lists
				for( var listName in emotes ) {
					var list = d.createElement( 'li' );
					list.appendChild( d.createTextNode( listName ) );
					list.addEventListener( 'click', this.moveEmoteToList.bind( this ), false );

					cont.appendChild( list );
				}

				Builder.preventOverScrolling( cont );
				this.REF.dialogMoveEmote = cont;
				d.body.appendChild( cont );
			}

			this.REF.dialogMoveEmote.className = 'diag show';
			this.REF.dialogMoveEmote.style.left = x + 'px';
			this.REF.dialogMoveEmote.style.top = y + 'px';
		},


		/**
		 * Create dialog for the option "Save Emote".
		 * @param {Integer} x X coordinate from the left.
		 * @param {Integer} y Y coordinate from the top.
		 */
		createDialogSaveEmote: function( x, y ) {
			if( !this.REF.dialogSaveEmote ) {
				var d = document;
				var emotes = GLOBAL.emotes;
				var cont = d.createElement( 'ul' );

				// Add available lists
				for( var listName in emotes ) {
					var list = d.createElement( 'li' );
					list.appendChild( d.createTextNode( listName ) );
					list.addEventListener( 'click', this.saveEmoteToList.bind( this ), false );

					cont.appendChild( list );
				}

				Builder.preventOverScrolling( cont );
				this.REF.dialogSaveEmote = cont;
				d.body.appendChild( cont );
			}

			this.REF.dialogSaveEmote.className = 'diag show';
			this.REF.dialogSaveEmote.style.left = x + 'px';
			this.REF.dialogSaveEmote.style.top = y + 'px';
		},


		/**
		 * Destroy the context menu parts that have to do with the emote lists.
		 */
		destroyMenus: function() {
			var ctx = this.REF;

			if( ctx.dialogMoveEmote ) {
				ctx.dialogMoveEmote.parentNode.removeChild( ctx.dialogMoveEmote );
				ctx.dialogMoveEmote = null;
			}
			if( ctx.dialogSaveEmote ) {
				ctx.dialogSaveEmote.parentNode.removeChild( ctx.dialogSaveEmote );
				ctx.dialogSaveEmote = null;
			}
		},


		/**
		 * Get the x and y coordinate for the context sub-menu.
		 * @param  {DOMElement} menu The ctx menu.
		 * @return {Object}          Object with the attributes "x" and "y".
		 */
		getPosForMenu: function( menu ) {
			var x = menu.offsetLeft;
			var y = menu.offsetTop;

			x += menu.offsetWidth + this.CONFIG.menuMargin;

			// Correct x
			if( x + this.CONFIG.menuWidth > document.body.offsetWidth ) {
				x = this.REF.menu.offsetLeft - this.CONFIG.menuWidth - this.CONFIG.menuMargin;
			}

			// Correct y
			var diffY = window.innerHeight - y - this.CONFIG.menuMaxHeight;

			if( diffY < 0 ) {
				y += diffY - this.CONFIG.menuMargin;
			}

			return { x: x, y: y };
		},


		/**
		 * Hide the context menu of this userscript.
		 */
		hide: function() {
			var ctx = this.REF;

			ctx.trigger = null;
			ctx.menu.className = '';

			if( ctx.dialogSaveEmote ) {
				ctx.dialogSaveEmote.className = 'diag';
			}
			if( ctx.dialogMoveEmote ) {
				ctx.dialogMoveEmote.className = 'diag';
			}

			ctx.selectedEmote = null;
		},


		/**
		 * Delete the selected emote from the list.
		 * @param {Event} ev
		 */
		itemActionDeleteEmote: function( ev ) {
			var emote = this.REF.selectedEmote.pathname;
			var list = GLOBAL.shownBlock;

			// If the emote is from the search page
			if( list === null ) {
				list = this.REF.selectedEmote.getAttribute( 'data-list' );

				if( list === null ) {
					return;
				}
			}

			deleteEmote( emote, list );
		},


		/**
		 * Move the selected emote to another list.
		 * @param {Event} ev
		 */
		itemActionMoveEmote: function( ev ) {
			var pos = this.getPosForMenu( ev.target.parentNode );

			this.createDialogMoveEmote( pos.x, pos.y );
			ev.stopPropagation(); // Keep context menu open.
		},


		/**
		 * Show available lists for the emote.
		 * @param {Event} ev
		 */
		itemActionSaveEmote: function( ev ) {
			var pos = this.getPosForMenu( ev.target.parentNode );

			this.createDialogSaveEmote( pos.x, pos.y );
			ev.stopPropagation(); // Keep context menu open.
		},


		/**
		 * Move an emote to the chosen list.
		 * @param {Event} ev
		 */
		moveEmoteToList: function( ev ) {
			var emote = this.REF.selectedEmote.pathname;
			var listNew = ev.target.textContent;
			var listOld = GLOBAL.shownBlock;

			// If the emote is from the search page
			if( listOld === null ) {
				listOld = this.REF.selectedEmote.getAttribute( 'data-list' );

				if( listOld === null ) {
					return;
				}
			}

			if( listNew == listOld ) {
				return;
			}

			saveEmote( emote, listNew );
			deleteEmote( emote, listOld );

			this.REF.dialogMoveEmote.className = 'diag';
			this.REF.selectedEmote = null;
		},


		/**
		 * Save an emote to the chosen list.
		 * @param {Event} ev
		 */
		saveEmoteToList: function( ev ) {
			var emote = this.REF.selectedEmote;
			var list = ev.target.textContent;
			var name = null;

			// Regular link emote
			if( typeof emote.pathname != 'undefined' ) {
				name = emote.pathname;
			}
			// Emote inside the BPM window
			else if( !!emote.getAttribute( 'data-emote' ) ) {
				name = emote.getAttribute( 'data-emote' );
			}

			saveEmote( name, list );

			this.REF.dialogSaveEmote.className = 'diag';
			this.REF.selectedEmote = null;
		},


		/**
		 * Show the context menu for either an emote or list element.
		 * @param {Event} ev
		 */
		show: function( ev ) {
			var bIsEmote = isEmote( ev.target );

			if( !bIsEmote ) {
				this.hide();
				return;
			}

			ev.preventDefault();

			this.REF.trigger = ev.target;
			this.REF.menu.className = 'show';

			if( bIsEmote ) {
				this.showDialogEmote( ev );
			}

			this.REF.menu.style.left = ( ev.clientX + 2 ) + 'px';
			this.REF.menu.style.top = ev.clientY + 'px';
		},


		/**
		 * Show the context menu for an emote.
		 * @param {Event} ev
		 */
		showDialogEmote: function( ev ) {
			this.REF.selectedEmote = ev.target;

			// Click occured in emote box.
			// This changes some of the available options.
			if( ev.target.parentNode.className.indexOf( 'mle-block' ) > -1 ) {
				this.REF.menu.className += ' in-box';
			}
			else {
				this.REF.menu.className += ' out-of-box';
			}
		}


	};



	/**
	 * The search.
	 * @type {Object}
	 */
	var Search = {


		MODE: {
			ALTERNATIVES: 1,
			NORMAL: 2,
			REGEX: 3,
			TAG: 4
		},


		/**
		 * Activate the search field, because the user clicked it.
		 * @param {Event} ev
		 */
		activate: function( ev ) {
			if( ev.target.value == 'search' ) {
				ev.target.value = '';
			}
		},


		/**
		 * Get the mode for the search.
		 * @param  {String} firstPart The first part of the search term before a ":".
		 * @return {Number}           A Search.MODE. Defaults to NORMAL.
		 */
		getMode: function( firstPart ) {
			var mode = null;

			switch( firstPart.trim() ) {
				case 'regex':
					mode = this.MODE.REGEX;
					break;

				case 'alt':
					mode = this.MODE.ALTERNATIVES;
					break;

				case 'tag':
					mode = this.MODE.TAG;
					break;

				default:
					mode = this.MODE.NORMAL;
			}

			return mode;
		},


		/**
		 * Get the search function according to the set mode.
		 * @param  {Number}   mode Search.MODE
		 * @return {Function}
		 */
		getSearchFunc: function( mode ) {
			var searchFunc = null;

			switch( mode ) {
				case this.MODE.REGEX:
					searchFunc = this.searchRegex;
					break;

				case this.MODE.ALTERNATIVES:
					searchFunc = this.searchAlt;
					break;

				case this.MODE.TAG:
					searchFunc = this.searchTag;
					break;

				default:
					searchFunc = this.searchNormal;
			}

			return searchFunc;
		},


		/**
		 * Prepare the search term according to the used mode.
		 * @param  {Number}        mode  Search.MODE
		 * @param  {Array<String>} parts Parts of the provided search term.
		 * @return {String|RegExp}
		 */
		prepareSearchTerm: function( mode, parts ) {
			var term;

			// Get the search term without a possible mode prefix
			if( parts.length == 1 ) {
				term = parts[0];
			}
			else {
				term = parts.slice( 1 ).join( ':' );
			}

			term = term.toLowerCase();

			switch( mode ) {
				case this.MODE.REGEX:
					term = new RegExp( term, 'i' );
					break;

				case this.MODE.ALTERNATIVES:
				case this.MODE.TAG:
					term = term.replace( ' ', '' );
					break;
			}

			return term;
		},


		/**
		 * The routine for doing a search in NORMAL, REGEX or ALTERNATIVES mode.
		 * @param {String|RegExp} term
		 * @param {Function}      searchFunc
		 */
		routineForNormalMode: function( term, searchFunc ) {
			var g = GLOBAL;
			var searchPage = g.REF.searchPage;

			for( var listName in g.emotes ) {
				var list = g.emotes[listName];
				var header = false;

				for( var i = 0; i < list.length; i++ ) {
					var emote = list[i];

					if( searchFunc( emote, term ) ) {
						if( !header && g.config.searchGroupEmotes ) {
							header = Builder.createHeaderForSearch( listName );
							searchPage.appendChild( header );
						}

						var buildEmote = Builder.createEmote( '/' + emote, false );
						buildEmote.setAttribute( 'data-list', listName );
						searchPage.appendChild( buildEmote );
					}
				}
			}
		},


		/**
		 * The routine for doing a search in TAG mode.
		 * @param {String} term
		 */
		routineForTagMode: function( term ) {
			var g = GLOBAL;
			var searchPage = g.REF.searchPage;
			var taggedEmotes = this.searchTag( term );

			for( var listName in taggedEmotes ) {
				var group = taggedEmotes[listName];
				var adjustedListName = convertListNameToConfigName( listName );

				if( g.config.searchGroupEmotes ) {
					var header = Builder.createHeaderForSearch( adjustedListName );
					searchPage.appendChild( header );
				}

				for( var i = 0; i < group.length; i++ ) {
					var buildEmote = Builder.createEmote( '/' + group[i], false );
					buildEmote.setAttribute( 'data-list', adjustedListName );
					searchPage.appendChild( buildEmote );
				}
			}
		},


		/**
		 * The alternative name search mode.
		 * Includes alternative names like "a00" as well.
		 * @param  {String}  emote Emote name.
		 * @param  {String}  term  Search term.
		 * @return {Boolean}       True if term is contained in emote or
		 *                         an alternate name for that emote.
		 */
		searchAlt: function( emote, term ) {
			var subEmotes = GLOBAL.sub_emotes;
			var alternatives = [];

			// Get all the alternative names of the emote
			for( var subreddit in subEmotes ) {
				var emoteLists = subEmotes[subreddit];

				for( var i = 0; i < emoteLists.length; i++ ) {
					var emoteList = emoteLists[i];

					for( var j = 0; j < emoteList.length; j++ ) {
						var group = emoteList[j];

						// Emote is from this group, check the alternative names
						if( group.indexOf( emote ) >= 0 ) {
							alternatives = alternatives.concat( group );
						}
					}
				}
			}

			// Check the alternative names
			// + the original one, of course
			for( var i = 0; i < alternatives.length; i++ ) {
				if( alternatives[i].indexOf( term ) >= 0 ) {
					return true;
				}
			}

			return false;
		},


		/**
		 * The normal search mode. Tests if the search
		 * term is contained in the emote name.
		 * @param  {String}  emote Emote name.
		 * @param  {String}  term  Search term.
		 * @return {Boolean}       True if term is contained in emote.
		 */
		searchNormal: function( emote, term ) {
			return emote.indexOf( term ) >= 0;
		},


		/**
		 * The regex search mode. Tests if the regular
		 * expression matches the emote name.
		 * @param  {String}  emote Emote name.
		 * @param  {RegExp}  term  Regular expression.
		 * @return {Boolean}       True if the regexp matches the emote name.
		 */
		searchRegex: function( emote, term ) {
			return term.test( emote );
		},


		/**
		 * The tag search mode. Gives all emotes that have the given tag.
		 * @param  {String} tag A tag like "happy" or "sad".
		 * @return {Object}     List of all the emotes tagged with the given tag, organized by list.
		 */
		searchTag: function( tag ) {
			if( !TAGS.hasOwnProperty( tag ) ) {
				return [];
			}
			return TAGS[tag];
		},


		/**
		 * Show the search result page.
		 */
		show: function() {
			var gr = GLOBAL.REF;

			toggleEmoteBlock( false );
			gr.mainCont.appendChild( gr.searchPage );
		},


		/**
		 * Start the search.
		 * @param {DOMElement} searchInput The search field.
		 */
		start: function( searchInput ) {
			var searchPage = GLOBAL.REF.searchPage;
			var term = searchInput.value.trim();

			if( term.length === 0 ) {
				return;
			}

			removeAllChildren( searchPage );

			// Determine the search mode to use
			var parts = term.split( ':' );
			var mode = this.getMode( parts[0].toLowerCase() );

			// Set the search method according to the mode
			var searchFunc = this.getSearchFunc( mode );
			term = this.prepareSearchTerm( mode, parts );

			// Special search routine for tags
			if( mode == this.MODE.TAG ) {
				this.routineForTagMode( term );
			}
			// The "normal" search for the other modes
			else {
				this.routineForNormalMode( term, searchFunc );
			}

			if( searchPage.childNodes.length === 0 ) {
				searchPage.appendChild( document.createTextNode( 'No emotes found.' ) );
			}
		},


		/**
		 * If the enter key has beend pressed, submit the search value.
		 * @param {KeyEvent} ev
		 */
		submit: function( ev ) {
			if( ev.keyCode == 13 ) { // [Enter]
				this.show();
				this.start( ev.target );
			}
		}


	};



	/**
	 * Setting things up. Getting ready for the show.
	 * Init object will be deleted after everything has been loaded from the storage.
	 * @see  handleBackgroundMessages
	 * @type {Object}
	 */
	var Init = {


		// Hostnames where this extension should be active.
		ALLOWED_HOSTNAMES: ['reddit.com'],


		/**
		 * Starting point.
		 */
		initStep1: function() {
			if( !this.isRedditDown() ) {
				// Load storage (config and emotes)
				postMessage( { task: BG_TASK.LOAD } );
			}
		},


		/**
		 * Called after preferences have been loaded from the background script.
		 */
		initStep2: function() {
			Builder.addCSS();
			Builder.addHTML();
			Builder.modifyAllOnPageEmotes();
		},


		/**
		 * Checks if this is a page, where MLE should be active.
		 * @return {Boolean}
		 */
		isAllowedHostname: function() {
			var hn = window.location.hostname;

			// FIXME: Only a workaround for .co.uk TLDs. What about others?
			var sliceLen = ( hn.substr( hn.length - 6 ) == '.co.uk' ) ? -3 : -2;
			hn = hn.split( '.' ).slice( sliceLen ).join( '.' );

			return ( this.ALLOWED_HOSTNAMES.indexOf( hn ) > -1 );
		},


		/**
		 * Checks if the site is in maintenance mode.
		 * @return {Boolean}
		 */
		isRedditDown: function() {
			var title = document.getElementsByTagName( 'title' )[0].textContent;
			return ( title == 'reddit is down' || title == 'Ow! -- reddit.com' );
		},


		/**
		 * Register for messages from the background process.
		 */
		registerForBackgroundMessages: function() {
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
		},


		/**
		 * First function to be called.
		 */
		start: function() {
			if( this.isAllowedHostname() ) {
				this.registerForBackgroundMessages();

				// Everything ready in the DOM.
				if( document.body ) {
					this.initStep1();
				}
				// Our script is too early. Wait until the DOM has been loaded.
				else {
					window.addEventListener( 'DOMContentLoaded', this.initStep1.bind( this ), false );
				}
			}
		}


	};


	Init.start();



	/**
	 * Tags for all the emotes.
	 * Based on Snivian_Moon's emote stats for r/mylittlepony.
	 * Extended with pony names.
	 */
	var TAGS = {
		// mood/feeling
		'happy': {
			'A': [
				'twipride', 'twibeam', 'raritydaww', 'ajhappy', 'lunateehee',
				'scootacheer'
			],
			'B': [
				'rdsmile', 'soawesome', 'dj', 'dumbfabric', 'flutterwink',
				'flutteryay', 'spikenervous', 'raritydress'
			],
			'C': [
				'joy', 'hahaha', 'ohhi', 'party', 'celestia',
				'zecora', 'twismile', 'derpyhappy', 'scootaloo', 'rdhappy',
				'rdsitting', 'twidaw', 'cadencesmile'
			],
			'E': [
				'awwyeah', 'cheerilee', 'dealwithit', 'sotrue', 'spitfire',
				'colgate', 'absmile', 'happyluna', 'bonbon', 'lyra',
				'cutealoo', 'huhhuh', 'wahaha', 'maud', 'sunsetshimmer',
				'twisecret', 'spikehappy'
			],
			'F': [
				'sombra', 'flimflam', 'cocosmile', 'goodjob', 'nightmaregrin',
				'spikeapproved', 'flutternice'
			],
			'Plounge': ['fillyrarity', 'dishappy', 'amzingmagic', 'filly']
		},
		'sad': {
			'A': ['rdcry', 'paperbagderpy', 'lunawait'],
			'C': ['trixiesad', 'lunasad', 'raritysad', 'fluttercry'],
			'E': ['macintears', 'twisad', 'discordsad', 'maud', 'scootablue'],
			'F': ['pinkiesad', 'ajcry', 'troubleshoes', 'raritytired']
		},
		'angry': {
			'A': ['silverspoon', 'cadence', 'grannysmith', 'ohcomeon'],
			'B': ['rdcool', 'twirage', 'cockatrice', 'fluttersrs'],
			'C': ['angel', 'rdannoyed', 'louder', 'loveme'],
			'E': ['snails', 'discentia', 'lunamad', 'maud'],
			'F': [
				'diamondtiara', 'guard', 'abstern', 'starlightrage', 'bulkbiceps',
				'discordgrump', 'notangry', 'twipbbt', 'skeptiloo', 'raritygrump',
				'ppdont'
			],
			'Plounge': ['karmastare']
		},
		'incredulous': {
			'A': ['rarityreally', 'raritypaper', 'sbbook', 'spikemeh', 'celestiamad', 'abmeh'],
			'B': ['twisquint', 'facehoof', 'ajugh', 'squintyjack', 'rarityannoyed', 'raritywut', 'rarityjudge'],
			'C': ['whattheflut', 'ppreally'],
			'E': ['spikewtf', 'abhuh', 'rdhuh', 'pinkiepout', 'maud'],
			'F': [
				'scootaeww', 'ajdoubt', 'spikewhoa', 'skeptiloo', 'sbwtf',
				'ppdont'
			],
			'Plounge': ['twidur']
		},
		'scared': {
			'A': ['ppfear'],
			'B': ['abwut', 'ajcower', 'flutterfear'],
			'C': ['rdscared'],
			'E': ['lily', 'maud'],
			'F': ['sbshocked', 'spikewhoa']
		},
		'shocked': {
			'A': ['rarishock', 'applegasp', 'pinkieawe', 'celestiawut', 'flutterwhoa'],
			'B': ['ajwut'],
			'C': ['lunagasp', 'derpyshock', 'fluttercry'],
			'E': ['ajconfused', 'maud'],
			'F': ['sbshocked', 'rarityeww', 'scootaeww', 'spikewhoa']
		},
		'crazed': {
			'A': ['applederp', 'scootaderp', 'twicrazy'],
			'B': ['rdwut'],
			'C': ['pinkamina'],
			'F': ['thcalm', 'flutterhay'],
			'Plounge': ['twidur']
		},
		'thoughtful': {
			'A': ['scootaplease'],
			'C': ['hmmm'],
			'E': ['twiponder', 'pinkiepout', 'maud'],
			'F': ['ooh', 'sbwtf']
		},
		'sarcastic': {
			'A': [
				'flutterroll', 'flutterjerk', 'ppcute', 'twiright', 'ajsup',
				'ajlie'
			],
			'B': ['ajsly', 'ppboring', 'trixiesmug', 'rarityprimp'],
			'C': ['twismug'],
			'E': ['octavia', 'maud'],
			'F': ['diamondtiara', 'apathia', 'rdsnrk', 'ajdoubt', 'goodjob']
		},
		'bashful': {
			'A': ['shiningarmor'],
			'B': ['fluttershy', 'fluttershh'],
			'C': ['flutterblush', 'derp'],
			'E': ['whooves', 'maud'],
			'F': ['bashful']
		},
		'determined': {
			'A': ['swagintosh'],
			'C': ['sneakybelle'],
			'E': ['rdsalute', 'fillytgap', 'lunamad', 'maud', 'sunsetsneaky'],
			'F': [
				'guard', 'abstern', 'bulkbiceps', 'discordgrump', 'notangry',
				'flimflam', 'nightmaregrin', 'ppdont'
			],
			'Plounge': ['karmasalute', 'karmastare']
		},
		'evil': {
			'A': ['chrysalis', 'priceless'],
			'C': ['changeling'],
			'E': ['gilda', 'nmm', 'maud', 'sunsetsneaky'],
			'F': [
				'sombra', 'starlightrage', 'discordgrump', 'notangry', 'twipbbt',
				'limestonegrin', 'raritygrump', 'nightmaregrin'
			]
		},
		'distraught': {
			'B': ['rarityyell', 'raritywhine', 'raritywhy', 'noooo'],
			'E': ['maud'],
			'F': ['scootaeww', 'raritytired']
		},
		'blank': {
			'B': ['ppseesyou', 'eeyup'],
			'C': ['twistare', 'photofinish', 'ajfrown'],
			'E': ['sbstare', 'maud'],
			'F': ['apathia', 'flutterkay']
		},
		'misc': {
			'A': ['abbored'],
			'B': ['takealetter', 'manspike', 'spikepushy', 'ppshrug'],
			'C': ['fabulous', 'gross', 'allmybits'],
			'E': ['berry'],
			'F': ['wasntme'],
			'Plounge': ['ohnoes']
		},
		// pony names
		'apathia': {
			'F': ['apathia']
		},
		'applebloom': {
			'A': ['abbored', 'abmeh'],
			'B': ['abwut'],
			'E': ['absmile', 'abhuh'],
			'F': ['abstern']
		},
		'angel': {
			'C': ['angel']
		},
		'applejack': {
			'A': ['ajhappy', 'ajsup', 'applegasp', 'applederp', 'ajlie'],
			'B': ['squintyjack', 'ajsly', 'ajcower', 'ajugh', 'ajwut'],
			'C': ['ajfrown', 'hmmm'],
			'E': ['ajconfused'],
			'F': ['ajcry', 'ajdoubt']
		},
		'berrypunch': {
			'E': ['berry']
		},
		'bonbon': {
			'E': ['bonbon']
		},
		'bulkbiceps': {
			'F': ['bulkbiceps']
		},
		'cadence': {
			'A': ['cadence'],
			'C': ['cadencesmile']
		},
		'celestia': {
			'A': ['celestiawut', 'celestiamad'],
			'C': ['celestia']
		},
		'changeling': {
			'A': ['chrysalis'],
			'C': ['changeling']
		},
		'cheerilee': {
			'E': ['cheerilee']
		},
		'coco': {
			'F': ['cocosmile']
		},
		'colgate': {
			'E': ['colgate']
		},
		'derpy': {
			'A': ['paperbagderpy'],
			'C': ['derpyhappy', 'derp', 'derpyshock']
		},
		'diamondtiara': {
			'F': ['diamondtiara']
		},
		'discentia': {
			'E': ['discentia'],
			'Plounge': ['dishappy']
		},
		'discord': {
			'A': ['priceless'],
			'E': ['discordsad'],
			'F': ['discordgrump']
		},
		'flimflam': {
			'F': ['flimflam']
		},
		'fluttershy': {
			'A': ['flutterwhoa', 'flutterroll', 'flutterjerk'],
			'B': ['fluttershh', 'fluttershy', 'fluttersrs', 'flutterfear', 'flutterwink', 'flutteryay'],
			'C': ['flutterblush', 'loveme', 'whattheflut', 'fluttercry'],
			'F': ['flutterkay', 'flutterhay', 'flutternice']
		},
		'gilda': {
			'E': ['gilda']
		},
		'grannysmith': {
			'A': ['grannysmith']
		},
		'karma': {
			'E': ['dealwithit'],
			'Plounge': ['karmasalute', 'karmastare']
		},
		'lily': {
			'E': ['lily']
		},
		'limestone': {
			'F': ['limestonegrin']
		},
		'luna': {
			'A': ['lunateehee', 'lunawait'],
			'C': ['lunasad', 'lunagasp'],
			'E': ['happyluna', 'nmm', 'lunamad'],
			'F': ['nightmaregrin']
		},
		'lyra': {
			'E': ['lyra']
		},
		'macintosh': {
			'A': ['swagintosh'],
			'B': ['eeyup'],
			'E': ['macintears']
		},
		'maud': {
			'E': ['maud']
		},
		'nightmaremoon': {
			'E': ['nmm'],
			'F': ['nightmaregrin']
		},
		'octavia': {
			'E': ['octavia']
		},
		'photofinish': {
			'C': ['photofinish']
		},
		'pinkie': {
			'A': ['ppfear', 'ppcute', 'pinkieawe'],
			'B': ['ppseesyou', 'ppshrug', 'ppboring'],
			'C': ['ohhi', 'party', 'hahaha', 'joy', 'pinkamina', 'ppreally'],
			'E': ['huhhuh', 'pinkiepout'],
			'F': ['pinkiesad', 'ooh', 'ppdont']
		},
		'rainbow': {
			'A': ['rdcry'],
			'B': ['rdcool', 'rdsmile', 'soawesome', 'rdwut'],
			'C': ['rdsitting', 'rdhappy', 'rdannoyed', 'gross', 'louder', 'rdscared'],
			'E': ['rdhuh', 'rdsalute', 'awwyeah'],
			'F': ['rdsnrk', 'notangry']
		},
		'rarity': {
			'A': ['raritypaper', 'raritydaww', 'rarityreally', 'rarishock'],
			'B': ['rarityyell', 'raritywhine', 'raritydress', 'rarityannoyed', 'raritywut', 'raritywhy', 'rarityjudge', 'rarityprimp'],
			'C': ['raritysad', 'fabulous'],
			'E': ['wahaha'],
			'F': ['rarityeww', 'raritytired', 'raritygrump'],
			'Plounge': ['fillyrarity']
		},
		'scootaloo': {
			'A': ['scootaderp', 'scootaplease', 'scootacheer'],
			'C': ['scootaloo'],
			'E': ['cutealoo', 'scootablue'],
			'F': ['scootaeww', 'skeptiloo']
		},
		'seafoam': {
			'F': ['wasntme']
		},
		'shiningarmor': {
			'A': ['shiningarmor'],
			'E': ['shiningpride']
		},
		'silverspoon': {
			'A': ['silverspoon']
		},
		'snails': {
			'E': ['snails']
		},
		'sombra': {
			'F': ['sombra']
		},
		'spike': {
			'A': ['spikemeh'],
			'B': ['spikenervous', 'takealetter', 'noooo', 'spikepushy', 'manspike'],
			'C': ['allmybits'],
			'E': ['spikewtf', 'spikehappy'],
			'F': ['spikewhoa', 'spikeapproves']
		},
		'spitfire': {
			'E': ['spitfire']
		},
		'starlight': {
			'F': ['starlightrage', 'goodjob']
		},
		'stevenmagnet': {
			'E': ['sotrue']
		},
		'sunsetshimmer': {
			'E': ['sunsetshimmer', 'sunsetsneaky']
		},
		'sweetie': {
			'A': ['ohcomeon', 'sbbook'],
			'B': ['dumbfabric'],
			'C': ['sneakybelle'],
			'E': ['sbstare'],
			'F': ['sbshocked', 'sbwtf']
		},
		'treehugger': {
			'F': ['thcalm']
		},
		'trixie': {
			'B': ['trixiesmug'],
			'C': ['trixiesad'],
			'E': ['fillytgap'],
			'Plounge': ['amzingmagic']
		},
		'troubleshoes': {
			'F': ['troubleshoes']
		},
		'twilight': {
			'A': ['twipride', 'twiright', 'twibeam', 'twicrazy'],
			'B': ['facehoof', 'twisquint', 'twirage'],
			'C': ['twistare', 'twismug', 'twismile', 'twidaw'],
			'E': ['twiponder', 'twisad', 'twisecret'],
			'F': ['twipbbt'],
			'Plounge': ['twidur']
		},
		'vinyl': {
			'B': ['dj']
		},
		'whooves': {
			'E': ['whooves']
		},
		'zecora': {
			'C': ['zecora']
		}
	};

	/* jshint -W069 */
	// jshint -W069: Ignore the message "[…] is better written in dot notation".

	// Alternative names for certain tags
	TAGS['derped'] = TAGS['crazed'];
	TAGS['malicious'] = TAGS['evil'];
	TAGS['smug'] = TAGS['sarcastic'];

	// Alternative names for certain ponies
	TAGS['ab'] = TAGS['applebloom'];
	TAGS['aj'] = TAGS['applejack'];
	TAGS['berry'] = TAGS['berrypunch'];
	TAGS['bigmac'] = TAGS['macintosh'];
	TAGS['bigmacintosh'] = TAGS['macintosh'];
	TAGS['bon-bon'] = TAGS['bonbon'];
	TAGS['chrysalis'] = TAGS['changeling'];
	TAGS['cocopommel'] = TAGS['coco'];
	TAGS['dash'] = TAGS['rainbow'];
	TAGS['derpyhooves'] = TAGS['derpy'];
	TAGS['ditzy'] = TAGS['derpy'];
	TAGS['djpon-3'] = TAGS['vinyl'];
	TAGS['djpon3'] = TAGS['vinyl'];
	TAGS['doctor'] = TAGS['whooves'];
	TAGS['doctorwhooves'] = TAGS['whooves'];
	TAGS['dt'] = TAGS['diamondtiara'];
	TAGS['fs'] = TAGS['fluttershy'];
	TAGS['griffin'] = TAGS['gilda'];
	TAGS['heartstrings'] = TAGS['lyra'];
	TAGS['nightmare'] = TAGS['nightmaremoon'];
	TAGS['nmm'] = TAGS['nightmaremoon'];
	TAGS['minuette'] = TAGS['colgate'];
	TAGS['pinkiepie'] = TAGS['pinkie'];
	TAGS['pp'] = TAGS['pinkie'];
	TAGS['rainbowdash'] = TAGS['rainbow'];
	TAGS['rd'] = TAGS['rainbow'];
	TAGS['sb'] = TAGS['sweetie'];
	TAGS['sc'] = TAGS['scootaloo'];
	TAGS['seaswirl'] = TAGS['seafoam'];
	TAGS['shimmer'] = TAGS['sunsetshimmer'];
	TAGS['ss'] = TAGS['sunsetshimmer'];
	TAGS['starlightglimmer'] = TAGS['starlight'];
	TAGS['steven'] = TAGS['stevenmagnet'];
	TAGS['sunset'] = TAGS['sunsetshimmer'];
	TAGS['sweetiebelle'] = TAGS['sweetie'];
	TAGS['tgap'] = TAGS['trixie'];
	TAGS['tia'] = TAGS['celestia'];
	TAGS['tree'] = TAGS['fluttershy'];
	TAGS['ts'] = TAGS['twilight'];
	TAGS['twi'] = TAGS['twilight'];
	TAGS['twilightsparkle'] = TAGS['twilight'];
	TAGS['vinylscratch'] = TAGS['vinyl'];
	TAGS['vs'] = TAGS['vinyl'];

	TAGS['bestpony'] = TAGS['applejack'];


} )();
