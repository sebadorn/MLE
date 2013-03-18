"use strict";

( function() {

	// Hostnames where this extension should be active.
	var ALLOWED_HOSTNAMES = ["reddit.com"];

	var GLOBAL = {
			// Loaded config
			config: null,
			// Loaded emotes
			emotes: null,
			// IDs of some HTML elements
			ID: {
				inputAddEmote: "addemote",
				inputAddList: "addlist",
				inputAddToList: "addtolist",
				inputDelList: "dellist"
			},
			// Reference to the timeout object for the notifier
			msgTimeout: null,
			// Noise for CSS classes and IDs, to minimise the probability
			// of accidentally overwriting existing styles.
			noise: "-bd6acd4a",
			// Holding references to DOMElements
			REF: {
				emoteBlocks: {},
				focusedInput: null,
				lists: null,
				mainCont: null,
				mngForm: null,
				msg: null,
				navList: []
			},
			// String, key of block in REF.emoteBlocks
			shownBlock: null
		};



	/**
	 * Load saved data from the extension storage.
	 */
	function loadStorage() {
		postMessage( { task: BG_TASK.LOAD } );
	};


	/**
	 * Send a message to the background process.
	 */
	function postMessage( msg ) {
		// Opera
		if( typeof opera != "undefined" ) {
			opera.extension.postMessage( msg );
		}
		// Chrome
		else if( typeof chrome != "undefined" ) {
			chrome.extension.sendMessage( msg, handleBackgroundMessages );
		}
		// probably Firefox
		else {
			self.postMessage( msg );
		}
	};


	/**
	 * Get the value of the currently selected <option>.
	 */
	function getOptionValue( select ) {
		return select.options[select.selectedIndex].value;
	};


	/**
	 * Checks if a given DOM node is an emote.
	 * @param  {DOMElement} node
	 * @return {Boolean} True if emote, false otherwise.
	 */
	function isEmote( node ) {
		if( node.tagName.toLowerCase() != "a" ) {
			return false;
		}
		if( !node.href ) {
			return false;
		}

		var nodeHTML = node.outerHTML;

		if( nodeHTML.indexOf( "href=\"/" ) < 0
				|| nodeHTML.indexOf( "href=\"/http://" ) > -1
				|| nodeHTML.indexOf( "href=\"/r/" ) > -1
				|| nodeHTML.indexOf( "href=\"/user/" ) > -1
				|| nodeHTML.indexOf( "href=\"/message/" ) > -1 ) {
			return false;
		}
		return true;
	};


	/**
	 * Checks if a given DOM node is a draggable list element.
	 * @param  {DOMElement} node
	 * @return {Boolean} True if list, false otherwise.
	 */
	function isList( node ) {
		if( node.tagName.toLowerCase() != "li" ) {
			return false;
		}
		if( !node.getAttribute( "draggable" ) ) {
			return false;
		}

		return true;
	};


	/**
	 * Change a string to a valid ID (HTML attribute) value.
	 */
	function strToValidID( name ) {
		return name.replace( / /g, '_' );
	};



	/**
	 * Build all the HTML.
	 * Or most of it. There is an extra "class" for the context menu.
	 * @type {Object}
	 */
	var Builder = {


		/**
		 * Add CSS classes to the emote so it will be displayed
		 * if it is an out-of-sub emote.
		 * @param  {DOMElement} emote
		 * @return {DOMElement} The emote with CSS classes (or not).
		 */
		addClassesForEmote: function( emote ) {
			var cfg = GLOBAL.config;
			var emoteName = emote.href.split( "/" );

			emoteName = emoteName[emoteName.length - 1];

			if( !emote.className ) {
				emote.className = "";
			}

			// If BetterPonymotes is used for out-of-sub emotes
			if( cfg.adjustForBetterPonymotes ) {
				emote.className += " bpmote-" + emoteName;
			}
			// If GrEmB is used
			if( cfg.adjustForGrEmB ) {
				emote.className += " G_" + emoteName + "_";
			}

			emote.className = emote.className.trim();

			return emote;
		},


		/**
		 * Add CSS rules to the page inside a <style> tag in the head.
		 */
		addCSS: function() {
			var g = GLOBAL,
			    cfg = g.config,
			    d = document;
			var styleNode = d.createElement( "style" );
			var rule,
			    rules = '\n';
			var zIndex = cfg.boxUnderHeader ? 10 : 10000,
			    boxPos = ( cfg.boxAlign == "left" ) ? "left: 5px;" : "right: 5px;",
			    listDirection = ( cfg.boxScrollbar == "right" ) ? "ltr" : "rtl";

			// '%' will be replaced with noise
			var css = {
				// Collection of same CSS
				"#mle%.show, #mle%.show ul, #mle%.show .mle-block%, #mle%.show .mle-btn, #mle%.show #mle-manage%.show-manage, #mle-ctxmenu%.show, .diag.show":
						"display: block;",
				"#mle%, #mle-ctxmenu%":
						"font: 12px Verdana, Arial, Helvetica, \"DejaVu Sans\", sans-serif; line-height: 14px; text-align: left;",
				"#mle% .mle-btn":
						"background-color: #808080; border-bottom-left-radius: 2px; border-bottom-right-radius: 2px; border-top: 1px solid #404040; color: #ffffff; cursor: default; display: none; font-weight: bold; padding: 5px 0 6px; position: absolute; text-align: center; top: -1px;",
				"#mle% .mle-btn:hover":
						"background-color: #404040;",
				// Inactive state
				"#mle%":
						"background-color: " + cfg.boxBgColor + "; border: 1px solid #d0d0d0; border-radius: 2px; box-sizing: border-box; -moz-box-sizing: border-box; position: fixed; " + boxPos + " top: " + cfg.boxPosTop + "px; z-index: " + zIndex + "; width: " + cfg.boxWidthMinimized + "px;"
						+ "-moz-transition: width " + cfg.boxAnimationSpeed + "ms; -webkit-transition: width " + cfg.boxAnimationSpeed + "ms; -o-transition: width " + cfg.boxAnimationSpeed + "ms; transition: width " + cfg.boxAnimationSpeed + "ms;",
				// Active state
				"#mle%.show":
						"width: " + cfg.boxWidth + "px; height: " + cfg.boxHeight + "px; padding: 36px 10px 10px; z-index: 10000;",
				// Header
				"#mle% .mle-header":
						"display: block; color: #303030; font-weight: bold; padding: 6px 0; text-align: center;",
				"#mle%.show .mle-header":
						"display: none;",
				// Manage button
				"#mle% .mng-link":
						"width: 72px; z-index: 10;",
				// Options button
				"#mle% .opt-link":
						"background-color: #f4f4f4 !important; border-top-color: #b0b0b0; color: #a0a0a0; font-weight: normal !important; left: 98px; padding-left: 8px; padding-right: 8px; z-index: 14;",
				"#mle% .opt-link:hover":
						"border-top-color: #606060; color: #000000;",
				// Close button
				"#mle% .mle-close":
						"right: 10px; z-index: 20; padding-left: 12px; padding-right: 12px;",
				// Selection list
				"#mle% ul":
						"box-sizing: border-box; -moz-box-sizing: border-box; direction: " + listDirection + "; display: none; overflow: auto; float: left; height: 100%; margin: 0; max-width: 250px; padding: 0;",
				"#mle% li":
						"background-color: #e0e0e0; color: #303030; cursor: default; border-bottom: 1px solid #c0c0c0; border-top: 1px solid #ffffff; direction: ltr; padding: 8px 16px; position: relative;"
						+ "-moz-user-select: none; -o-user-select: none; -webkit-user-select: none; user-select: none;",
				"#mle% li:first-child":
						"border-top-width: 0;",
				"#mle% li:last-child":
						"border-bottom-width: 0;",
				"#mle% li:hover":
						"background-color: #d0d0d0;",
				"#mle% li.activelist":
						"background-color: transparent;",
				"#mle% li.activelist strong":
						"font-weight: bold;",
				"#mle% li strong":
						"font-weight: normal; white-space: nowrap;",
				"#mle% li span":
						"color: #909090; display: block; font-size: 9px; font-weight: normal !important; white-space: nowrap;",
				// Emote blocks
				".mle-block%, #mle-manage%":
						"box-sizing: border-box; -moz-box-sizing: border-box; display: none; height: 100%; overflow: auto; padding: 10px;",
				".mle-block% a":
						"display: inline-block; float: none; border: 1px solid " + cfg.boxEmoteBorder + "; border-radius: 2px; margin: 1px; min-height: 10px; min-width: 10px; vertical-align: top;",
				".mle-block% a:hover":
						"border-color: #96BFE9;",
				// Notifier
				".mle-msg%":
						"background-color: rgba( 10, 10, 10, 0.6 ); color: #ffffff; font-size: 13px; position: fixed; left: 0; " + cfg.msgPosition + ": -200px; padding: 19px 0; text-align: center; width: 100%; z-index: 10100;"
						+ "-moz-transition: " + cfg.msgPosition + " " + cfg.msgAnimationSpeed + "ms; -webkit-transition: " + cfg.msgPosition + " " + cfg.msgAnimationSpeed + "ms; -o-transition: " + cfg.msgPosition + " " + cfg.msgAnimationSpeed + "ms; transition: " + cfg.msgPosition + " " + cfg.msgAnimationSpeed + "ms;",
				".mle-msg%.show":
						cfg.msgPosition + ": 0;",
				// Manage page
				"#mle-manage% label":
						"border-bottom: 1px solid #e0e0e0; display: block; font-weight: bold; margin-bottom: 10px; padding-bottom: 4px;",
				"#mle-manage% div":
						"padding-bottom: 20px;",
				"#mle-manage% input[type=\"text\"]":
						"background-color: #ffffff; border: 1px solid #d0d0d0; padding: 2px 4px; width: 120px;",
				"#mle-manage% select":
						"background-color: #ffffff; border: 1px solid #d0d0d0; max-width: 100px; padding: 2px 4px;",
				"#mle-manage% input[type=\"submit\"]":
						"background-color: #6189b5; border: 0; border-radius: 2px; color: #ffffff; margin-left: 12px; padding: 3px 8px;",
				"#mle-manage% input[type=\"submit\"]:hover":
						"background-color: #202020 !important;",
				"#previewaddemote%":
						"display: inline-block; border: 1px solid #505050; border-radius: 2px; float: none; margin-top: 10px; min-height: 4px; min-width: 4px;",
				"#mle% em":
						"font-style: italic;"
			};

			if( cfg.boxTrigger != "float" ) {
				css["#mle%"] += " display: none;";
			}
			if( cfg.boxTrigger == "button" ) {
				css[".mle-open-btn"] = "margin: 0 0 0 4px !important;";
			}
			if( cfg.ctxMenu ) {
				css["#mle-ctxmenu%, .diag"] = "cursor: default; display: none; position: fixed; z-index: 10010; white-space: nowrap; background-color: #ffffff; border: 1px solid #d0d0d0; border-radius: 1px; box-shadow: 2px 1px 6px -2px rgba( 80, 80, 80, 0.4 ); font-size: 12px; list-style-type: none; margin: 0; padding: 0;";
				css["#mle-ctxmenu% li"] = "display: none;";
				css["#mle-ctxmenu% li, .diag li"] = "margin: 2px 0; padding: 5px 14px;";
				css["#mle-ctxmenu% li:hover, .diag li:hover"] = "background-color: #cee3f8;";
				css["#mle-ctxmenu%.in-box .in, #mle-ctxmenu%.out-of-box .out, #mle-ctxmenu%.list-trigger .list"] = "display: block;";
				css[".diag"] = "max-height: 200px; max-width: 180px; overflow: auto; z-index: 10020;";
			}

			styleNode.type = "text/css";
			styleNode.id = "MyLittleEmotebox" + g.noise;

			for( rule in css ) {
				rules += rule.replace( /%/g, g.noise );
				rules += " { " + css[rule] + "}\n";
			}

			styleNode.textContent = rules;

			d.getElementsByTagName( "head" )[0].appendChild( styleNode );

			// The CSS variable is a little big and we won't need this function again, sooo...
			// Leave this function for the Garbage Collector.
			this.addCSS = null;
		},


		/**
		 * Add the HTML to the page.
		 */
		addHTML: function() {
			var d = document,
			    g = GLOBAL;
			var close = d.createElement( "span" ),
			    fragmentNode = d.createDocumentFragment(),
			    labelMain = d.createElement( "strong" ),
			    mainContainer = d.createElement( "div" ),
			    mngForm = d.createElement( "div" ),
			    mngTrigger = d.createElement( "span" ),
			    msg = d.createElement( "p" ),
			    optTrigger = d.createElement( "span" );

			// Add headline
			labelMain.className = "mle-header";
			labelMain.textContent = g.config.boxLabelMinimized;

			// Add close button
			close.className = "mle-close mle-btn";
			close.textContent = "x";
			close.addEventListener( "click", mainContainerHide, false );

			// Add manage link
			mngTrigger.className = "mng-link mle-btn";
			mngTrigger.textContent = "Manage";
			mngTrigger.addEventListener( "click", showManagePage, false );

			// Add options link
			optTrigger.className = "opt-link mle-btn";
			optTrigger.textContent = "Options";
			optTrigger.title = "Opens the options page";
			optTrigger.addEventListener( "click", function( e ) {
				postMessage( { task: BG_TASK.OPEN_OPTIONS } );
			}, false );

			// Add manage page
			mngForm.id = "mle-manage" + g.noise;

			// Add most-of-the-time-hidden message block
			// (NOT a part of the main container)
			msg.className = "mle-msg" + g.noise;

			// Append all the above to the DOM fragment
			fragmentNode = appendChildren(
				fragmentNode,
				[
					labelMain, close,
					mngTrigger, optTrigger,
					this.createEmoteBlocksAndNav(), mngForm
				]
			);

			// Add list and emote blocks to main container
			mainContainer.id = "mle" + g.noise;
			mainContainer.appendChild( fragmentNode );
			mainContainer.addEventListener( "mouseover", rememberActiveTextarea, false );
			mainContainer.addEventListener( "mouseover", mainContainerShow, false );

			g.REF.msg = msg;
			g.REF.mngForm = mngForm;
			g.REF.mainCont = mainContainer;

			d.body.appendChild( mainContainer );
			d.body.appendChild( msg );

			if( g.config.ctxMenu ) {
				d.body.appendChild( ContextMenu.create() );
			}

			if( g.config.boxTrigger == "button" ) {
				this.addMLEButtons();
			}
		},


		/**
		 * Add buttons top open MLE next to every textarea.
		 */
		addMLEButtons: function() {
			var d = document;
			var textareas = d.querySelectorAll( ".help-toggle" ),
			    button,
			    refEle;

			for( var i = 0; i < textareas.length; i++ ) {
				button = d.createElement( "button" );
				button.className = "mle-open-btn";
				button.type = "button";
				button.textContent = "open MLE";
				button.addEventListener( "click", mainContainerShow, false );

				refEle = textareas[i].querySelector( ".bpm-search-toggle" );

				if( refEle ) {
					// Place MLE button to the left of the BPM button
					textareas[i].insertBefore( button, refEle );
				}
				else {
					textareas[i].appendChild( button );
				}
			}

			observeReplyChangesForMLEButtons();
		},


		/**
		 * Create emote blocks filled with emotes and the navigation.
		 */
		createEmoteBlocksAndNav: function() {
			var d = document,
			    g = GLOBAL;
			var fragmentNode = d.createDocumentFragment(),
			    listNav = d.createElement( "ul" ),
			    listLink,
			    emoteBlock;
			var listName,
			    emoteList,
			    countBlocks = 0;

			// Add navigation
			listNav.id = "mle-blocklist" + g.noise;
			fragmentNode.appendChild( listNav );

			for( listName in g.emotes ) {
				emoteList = g.emotes[listName];

				// Create list navigation
				listLink = this.createListLink( listName, g.emotes[listName].length );
				listNav.appendChild( listLink );

				// Create emotes section
				emoteBlock = d.createElement( "div" );
				emoteBlock.className = "mle-block" + g.noise;

				// Add the emotes to the block
				emoteBlock.appendChild( this.createEmotesOfList( emoteList ) );

				// Display first emote section per default
				if( countBlocks == 0 ) {
					listLink.className = "activelist";
					g.shownBlock = listName;
					fragmentNode.appendChild( emoteBlock );
				}

				g.REF.navList[countBlocks] = listLink;
				g.REF.emoteBlocks[listName] = emoteBlock;

				countBlocks++;
			}

			g.REF.listNav = listNav;

			return fragmentNode;
		},


		/**
		 * Fill an emote block with emotes.
		 */
		createEmotesOfList: function( emoteList ) {
			var fragment = document.createDocumentFragment(),
			    emoteLink;
			var i;

			for( i = 0; i < emoteList.length; i++ ) {
				emoteLink = '/' + emoteList[i];
				fragment.appendChild( this.createEmote( emoteLink ) );
			}

			return fragment;
		},


		/**
		 * Create a single emote.
		 * @param {String} link
		 */
		createEmote: function( link ) {
			var emote = document.createElement( "a" );

			emote.href = link;
			emote = this.addClassesForEmote( emote );

			emote.addEventListener( "click", insertEmote, false );
			emote.addEventListener( "dragstart", DragAndDrop.dragstartMoveEmote.bind( DragAndDrop ), false );

			// The "dragenter" and "dragover" events have
			// to be stopped in order for "drop" to work.
			emote.addEventListener( "dragenter", stopEvent, false );
			emote.addEventListener( "dragover", stopEvent, false );

			// Stop "dragend" as well, so if the drop target isn't
			// an emote, the browser doesn't open the emote URL.
			emote.addEventListener( "dragend", stopEvent, false );

			emote.addEventListener( "drop", DragAndDrop.dropMoveEmote.bind( DragAndDrop ), false );

			return emote;
		},


		/**
		 * Create list element to toggle display of the corresponding emote box.
		 * @param  {String} listName     Name of list.
		 * @param  {int}    elementCount Number of emotes in this list.
		 * @return {DOMElement}
		 */
		createListLink: function( listName, elementCount ) {
			var d = document;
			var listLink = d.createElement( "li" ),
			    name = d.createElement( "strong" ),
			    count = d.createElement( "span" );

			name.textContent = listName;
			name.addEventListener( "click", toggleEmoteBlock, false );
			DragAndDrop.makeDropZone( name, DragAndDrop.dropMoveList );

			count.textContent = elementCount + " emotes";
			count.addEventListener( "click", toggleEmoteBlock, false );
			DragAndDrop.makeDropZone( count, DragAndDrop.dropMoveList );

			listLink.id = strToValidID( listName ) + GLOBAL.noise;
			listLink.setAttribute( "draggable", "true" );
			listLink.addEventListener( "click", toggleEmoteBlock, false );
			listLink.addEventListener( "dragstart", DragAndDrop.dragstartMoveList.bind( DragAndDrop ), false );
			DragAndDrop.makeDropZone( listLink, DragAndDrop.dropMoveList );

			appendChildren( listLink, [name, count] );

			return listLink;
		},


		/**
		 * Create a label.
		 * @param  {String} text Text for the label.
		 * @return {DOMElement} label
		 */
		createLabel: function( text ) {
			var label = document.createElement( "label" );
			label.textContent = text;

			return label;
		},


		/**
		 * Create a HTML select of all existing emote lists/blocks.
		 * @param {String} selId Value for ID attribute of the <select>.
		 */
		createListSelect: function( selId ) {
			var d = document,
			    g = GLOBAL;
			var selList = d.createElement( "select" ),
			    optList,
			    listName;

			for( listName in g.emotes ) {
				optList = d.createElement( "option" );
				optList.value = listName;
				optList.textContent = listName;

				selList.appendChild( optList );
			}
			selList.id = selId;

			return selList;
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
					this.mngAreaForMovEmote(),
					this.mngAreaForDelEmote(),
					this.mngAreaForMovList()
				];
			var frag = appendChildren( document.createDocumentFragment(), areas );

			form.appendChild( frag );
		},


		/**
		 * Create manage area for adding new emotes to lists.
		 */
		mngAreaForNewEmote: function() {
			var d = document,
			    g = GLOBAL;
			var inputEmote = d.createElement( "input" ),
			    preview = d.createElement( "a" ),
			    selList,
			    submitEmote = d.createElement( "input" );

			inputEmote.type = "text";
			inputEmote.id = g.ID.inputAddEmote + g.noise;
			inputEmote.addEventListener( "keyup", updatePreview, false );
			preview.id = "previewaddemote" + g.noise;

			// Select a list to add the emote to.
			selList = this.createListSelect( "addtolist" + g.noise );

			submitEmote.type = "submit";
			submitEmote.value = "save emote";
			submitEmote.addEventListener( "click", saveNewEmote, false );

			return appendChildren(
				d.createElement( "div" ),
				[
					this.createLabel( "Add emote" ),
					inputEmote,
					d.createTextNode( " to " ),
					selList,
					submitEmote,
					d.createElement( "br" ),
					preview
				]
			);
		},


		/**
		 * Create manage area for adding new lists.
		 */
		mngAreaForNewList: function() {
			var d = document,
			    g = GLOBAL;
			var inputList = d.createElement( "input" ),
			    submitList = d.createElement( "input" );

			inputList.type = "text";
			inputList.id = g.ID.inputAddList + g.noise;

			submitList.type = "submit";
			submitList.value = "create new list";
			submitList.addEventListener( "click", saveNewList, false );

			return appendChildren(
				d.createElement( "div" ),
				[
					this.createLabel( "Add list" ),
					inputList,
					submitList
				]
			);
		},


		/**
		 * Create manage area for deleting lists.
		 */
		mngAreaForDelList: function() {
			var d = document,
			    g = GLOBAL;
			var submitDel = d.createElement( "input" );

			submitDel.type = "submit";
			submitDel.value = "delete list";
			submitDel.addEventListener( "click", delList, false );

			return appendChildren(
				d.createElement( "div" ),
				[
					this.createLabel( "Delete list" ),
					this.createListSelect( g.ID.inputDelList + g.noise ),
					submitDel
				]
			);
		},


		/**
		 * Create manage area for moving emotes.
		 */
		mngAreaForMovEmote: function() {
			var d = document;
			var note = d.createElement( "em" );

			note.innerHTML = "Use Drag&amp;Drop to move emotes.<br />To move it to another list, right-click on it and select “Move to List”.";

			return appendChildren(
				d.createElement( "div" ),
				[
					this.createLabel( "Move emotes" ),
					note
				]
			);
		},


		/**
		 * Create manage area for deleting emotes.
		 */
		mngAreaForDelEmote: function() {
			var d = document;
			var note = d.createElement( "em" );

			note.textContent = "Right-click on the emote and select “Delete Emote”.";

			return appendChildren(
				d.createElement( "div" ),
				[
					this.createLabel( "Delete emotes" ),
					note
				]
			);
		},


		/**
		 * Create manage area for moving lists.
		 */
		mngAreaForMovList: function() {
			var d = document;
			var note = d.createElement( "em" );

			note.textContent = "Use Drag&Drop to move lists. A dragged object will be inserted before the one it was dropped on.";

			return appendChildren(
				d.createElement( "div" ),
				[
					this.createLabel( "Move list" ),
					note
				]
			);
		}


	};


	/**
	 * Observe document for dynamically inserted reply areas.
	 * If this happens, add the "click" event listener to the inserted MLE button.
	 * (Sometimes you just don't know what to call a function.)
	 */
	function observeReplyChangesForMLEButtons() {
		// Add the click event to comment replies, too.
		var MutationObserver = window.MutationObserver || window.WebkitMutationObserver;

		// MutationObserver is implented in Chrome (vendor prefixed with "Webkit") and Firefox
		if( MutationObserver ) {
			var observer = new MutationObserver( mutationHandler );
			var targets = document.querySelectorAll( ".child" ),
			    observerConfig = { attributes: false, childList: true, characterData: false };

			for( var i = 0; i < targets.length; i++ ) {
				observer.observe( targets[i], observerConfig );
			}
		}

		// ... but not in Opera, so we have to do this the deprecated way
		else {
			document.addEventListener( "DOMNodeInserted", function( e ) {
				// "usertext cloneable" is the whole reply-to-comment section
				if( e.target.className == "usertext cloneable" ) {
					var buttonMLE = e.target.querySelector( ".mle-open-btn" );
					buttonMLE.addEventListener( "click", mainContainerShow, false );
				}
			}, false );
		}
	};


	/**
	 * Callback function for the MutationObserver.
	 * @param {MutationRecord} mutations
	 */
	function mutationHandler( mutations ) {
		var mutation, node, buttonMLE;
		var i, j;

		for( i = 0; i < mutations.length; i++ ) {
			mutation = mutations[i];

			for( j = 0; j < mutation.addedNodes.length; j++ ) {
				node = mutation.addedNodes[j];

				if( node.className == "usertext cloneable" ) {
					buttonMLE = node.querySelector( ".mle-open-btn" );

					if( buttonMLE ) {
						buttonMLE.addEventListener( "click", mainContainerShow, false );
						return;
					}
				}
			}
		}
	};


	/**
	 * Append multiple children to a DOMElement.
	 * @param  {DOMElement} parent
	 * @param  {Array} children List of children to append.
	 * @return {DOMElement} parent
	 */
	function appendChildren( parent, children ) {
		for( var i = 0; i < children.length; i++ ) {
			parent.appendChild( children[i] );
		}
		return parent;
	};


	/**
	 * Delete an emote from a list.
	 * @param {String} emote
	 * @param {String} list
	 */
	function deleteEmote( emote, list ) {
		var g = GLOBAL;
		var idx, children, emoteSlash, i;

		// Emotes don't have a leading slash
		if( emote.indexOf( '/' ) == 0 ) {
			emote = emote.substring( 1 );
		}

		// Remove from locale storage
		idx = g.emotes[list].indexOf( emote );
		if( idx == -1 ) { return; }
		g.emotes[list].splice( idx, 1 );
		saveEmotesToStorage( g.emotes );

		// Remove from DOM
		children = g.REF.emoteBlocks[list].childNodes;
		emoteSlash = "/" + emote;
		for( i = 0; i < children.length; i++ ) {
			if( children[i].pathname == emoteSlash ) {
				g.REF.emoteBlocks[list].removeChild( children[i] );
				break;
			}
		}
	};


	/**
	 * Save the given emote to the given list.
	 * @param {String} emote
	 * @param {String} list
	 */
	function saveEmote( emote, list ) {
		var g = GLOBAL;

		// Ignore empty
		if( emote.length == 0 ) {
			showMsg( "That ain't no emote, sugarcube." );
			return;
		}

		// Emotes are saved without leading slash
		if( emote.indexOf( '/' ) == 0 ) {
			emote = emote.substring( 1 );
		}

		// Only save if not already in list
		if( g.emotes[list].indexOf( emote ) > -1 ) {
			showMsg( "This emote is already in the list." );
			return;
		}

		g.emotes[list].push( emote );
		saveEmotesToStorage( g.emotes );

		// Add to DOM
		g.REF.emoteBlocks[list].appendChild( Builder.createEmote( '/' + emote ) );
	};


	/**
	 * Saves the emotes to the storage.
	 * @param {Object} emotes Lists/emotes to save.
	 */
	function saveEmotesToStorage( emotes ) {
		postMessage( { task: BG_TASK.SAVE_EMOTES, emotes: emotes } );
	};


	/**
	 * Display a little popup message, that disappears again after a few seconds.
	 */
	function showMsg( text ) {
		var g = GLOBAL;

		if( !g.REF.msg || g.REF.msg == null ) { return; }

		clearTimeout( g.msgTimeout );
		g.REF.msg.className += " show";
		g.REF.msg.textContent = text;

		g.msgTimeout = setTimeout( function() {
			GLOBAL.REF.msg.className = "mle-msg" + GLOBAL.noise;
		}, g.config.msgTimeout );
	};


	/**
	 * Delete an emote list/block.
	 * This will delete all the emotes in this list as well.
	 */
	function delList( e ) {
		var d = document,
		    g = GLOBAL;
		var selectDelHTML = d.getElementById( g.ID.inputDelList + g.noise ),
		    selectAddHTML = d.getElementById( g.ID.inputAddToList + g.noise ),
		    listName = getOptionValue( selectDelHTML ),
		    listToDel = d.getElementById( strToValidID( listName ) + g.noise );
		var confirmDel = false,
		    children,
		    i;

		// Major decision. Better ask first.
		confirmDel = window.confirm(
			"My Little Emotebox:\n\n"
			+ "If you delete the list, you will also DELETE ALL EMOTES in this list!\n\n"
			+ "Proceed?"
		);
		if( !confirmDel ) { return; }

		// Delete from emote lists
		delete g.emotes[listName];
		saveEmotesToStorage( g.emotes );

		// Remove from DOM.
		g.REF.lists.removeChild( listToDel );
		delete g.REF.emoteBlocks[listName];

		children = selectDelHTML.childNodes;
		for( i = 0; i < children.length; i++ ) {
			if( children[i].value == listName ) {
				selectDelHTML.removeChild( children[i] );
				break;
			}
		}

		children = selectAddHTML.childNodes;
		for( i = 0; i < children.length; i++ ) {
			if( children[i].value == listName ) {
				selectAddHTML.removeChild( children[i] );
				break;
			}
		}

		// Remove context menus.
		// Will be rebuild when needed.
		ContextMenu.destroyMenus();
	};


	/**
	 * Handle messages from the background process.
	 */
	function handleBackgroundMessages( e ) {
		var g = GLOBAL;
		var data = e.data ? e.data : e;

		if( !data.task ) {
			console.warn( "MyLittleEmotebox: Message from background process didn't contain the handled task." );
			return;
		}

		switch( data.task ) {
			case BG_TASK.LOAD:
				g.config = data.config;
				g.emotes = data.emotes;
				Init.initStep2();
				Init = null;
				break;

			case BG_TASK.SAVE_EMOTES:
				if( !data.success ) {
					showMsg( "I'm sorry, but the changes could not be saved." );
					console.error( "MyLittleEmotebox: Could not save emotes." );
				}
				break;
		}
	};


	/**
	 * Insert a selected emote.
	 */
	function insertEmote( e ) {
		e.preventDefault(); // Don't follow emote link
		var ta = GLOBAL.REF.focusedInput;

		mainContainerHide( e );
		if( !ta ) { return; }

		var emoteLink = e.target.href.split( '/' );
		var selStart = ta.selectionStart,
		    selEnd = ta.selectionEnd,
		    taLen = ta.value.length,
		    altText;

		// Emote name
		emoteLink = emoteLink[emoteLink.length - 1];
		// Insert reversed emote version
		emoteLink = e.ctrlKey ? emoteLink + "-r" : emoteLink;

		// Nothing selected, just insert at position
		if( selStart == selEnd ) {
			emoteLink = "[](/" + emoteLink + ")";
		}
		// Text marked, use for alt text
		else {
			altText = ta.value.substring( selStart, selEnd );
			emoteLink = "[](/" + emoteLink + " \"" + altText + "\")";
		}

		// Add a blank after the emote
		if( GLOBAL.config.addBlankAfterInsert ) {
			emoteLink += ' ';
		}

		ta.value = ta.value.substring( 0, selStart )
				+ emoteLink
				+ ta.value.substring( selEnd, taLen );

		// Focus to the textarea
		ta.focus();
		ta.setSelectionRange(
			selStart + emoteLink.length,
			selStart + emoteLink.length
		);

		// Fire input event, so that RedditEnhancementSuite updates the preview
		var inputEvent = document.createEvent( "Events" );
		inputEvent.initEvent( "input", true, true );
		ta.dispatchEvent( inputEvent );
	};


	/**
	 * Minimize main container.
	 */
	function mainContainerHide( e ) {
		var g = GLOBAL;

		e.preventDefault();

		// While box closes, remove mouse event for opening.
		// Afterwards add it again.
		// Prevents the box from opening again, if mouse cursor hovers
		// over the closing (CSS3 transition) box.
		g.REF.mainCont.removeEventListener( "mouseover", mainContainerShow, false );
		g.REF.mainCont.className = "";
		setTimeout( function() {
			GLOBAL.REF.mainCont.addEventListener( "mouseover", mainContainerShow, false );
		}, g.config.boxAnimationSpeed + 100 );
	};


	/**
	 * Fully display main container.
	 */
	function mainContainerShow( e ) {
		GLOBAL.REF.mainCont.className = "show";
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
		 */
		dragstartMoveEmote: function( e ) {
			this.REF.draggedEmote = e.target;
		},


		/**
		 * Remember the currently dragged around list element.
		 */
		dragstartMoveList: function( e ) {
			this.REF.draggedList = e.target;

			// Drag&Drop won't work on the list in Firefox 14 without set data.
			e.dataTransfer.setData( "text/plain", "" );
		},


		/**
		 * Drop the emote into the DOM at the new place
		 * and remove it from the old one.
		 */
		dropMoveEmote: function( e ) {
			var g = GLOBAL;
			var emoteNameSource, emoteNameTarget;
			var list, emoteIdxSource, emoteIdxTarget;

			e.preventDefault();

			// Different parent means we may drag a list element.
			// We don't drop list elements on emotes, stop it.
			if( e.target.parentNode != this.REF.draggedEmote.parentNode ) {
				this.REF.draggedList = null;
				return;
			}

			emoteNameSource = this.REF.draggedEmote.pathname.substring( 1 );
			emoteNameTarget = e.target.pathname.substring( 1 );

			// Do nothing if source and target are the same
			if( emoteNameSource == emoteNameTarget ) {
				this.REF.draggedEmote = null;
				return;
			}

			e.target.parentNode.removeChild( this.REF.draggedEmote );
			e.target.parentNode.insertBefore( this.REF.draggedEmote, e.target );

			// Save new order to local storage
			list = g.emotes[g.shownBlock];
			emoteIdxSource = list.indexOf( emoteNameSource );

			if( emoteIdxSource > -1 ) {
				list.splice( emoteIdxSource, 1 );
				emoteIdxTarget = list.indexOf( emoteNameTarget );

				// Same position? Well, back where you belong.
				if( emoteIdxTarget == -1 ) {
					emoteIdxTarget = emoteIdxSource;
				}
				list.splice( emoteIdxTarget, 0, emoteNameSource );
			}

			saveEmotesToStorage( g.emotes );

			this.REF.draggedEmote = null;
		},


		/**
		 * Drop the list into the DOM at the new place
		 * and remove it from the old one.
		 */
		dropMoveList: function( e ) {
			var g = GLOBAL;
			var e_target = e.target,
			    nameSource,
			    nameTarget,
			    reordered;

			e.preventDefault();

			// Hooray for weird bugs. Opera fires the drop event two times.
			if( this.REF.draggedList == null ) {
				return;
			}

			// Do nothing if source and target are the same
			if( e_target == this.REF.draggedList ) {
				this.REF.draggedList = null;
				return;
			}

			// If we drop on an element inside of the list, go one up
			if( isList( e_target.parentNode ) ) {
				e_target = e_target.parentNode;
			}

			// Different parent means we may drag an emote.
			// We don't drop emotes on lists, stop it.
			if( e_target.parentNode != this.REF.draggedList.parentNode ) {
				this.REF.draggedList = null;
				return;
			}

			e_target.parentNode.removeChild( this.REF.draggedList );
			e_target.parentNode.insertBefore( this.REF.draggedList, e_target );

			// Reorder and save to storage
			nameSource = this.REF.draggedList.querySelector( "strong" ).textContent;
			nameTarget = e_target.querySelector( "strong" ).textContent;

			reordered = reorderList( nameSource, nameTarget );

			g.emotes = reordered;
			saveEmotesToStorage( g.emotes );

			this.REF.draggedList = null;
		},


		/**
		 * Adds a function to the drop event and stops interfering drag events.
		 * @param  {DOMElement}   node     The DOMElement to listen to drop events.
		 * @param  {Function}     callback Function to call in case of drop.
		 */
		makeDropZone: function( node, callback ) {
			node.addEventListener( "dragenter", stopEvent, false );
			node.addEventListener( "dragover", stopEvent, false );
			node.addEventListener( "drop", callback.bind( this ), false );
		}


	};



	/**
	 * Reorder emote list. (Not the emotes, but the lists itself.)
	 * @param  {String} moving    Name of list to insert before "inFrontOf".
	 * @param  {String} inFrontOf Name of list, that "moving" will be inserted in front of.
	 * @return {Object} Reordered list.
	 */
	function reorderList( moving, inFrontOf ) {
		var g = GLOBAL;
		var reordered = {},
		    block;

		if( moving == inFrontOf ) {
			return g.emotes;
		}

		for( block in g.emotes ) {
			if( block == moving ) {
				continue;
			}
			if( block == inFrontOf ) {
				reordered[moving] = g.emotes[moving];
			}
			reordered[block] = g.emotes[block];
		}

		return reordered;
	};


	/**
	 * Remember the currently focused/active textarea
	 * (if there is one) as input for the emotes.
	 */
	function rememberActiveTextarea( e ) {
		var ae = document.activeElement;

		if( ae && ae.tagName && ae.tagName.toLowerCase() == "textarea" ) {
			GLOBAL.REF.focusedInput = ae;
		}
	};


	/**
	 * From the manage page: Save new emote.
	 */
	function saveNewEmote( e ) {
		var d = document,
		    g = GLOBAL;
		var emoteInput = d.getElementById( g.ID.inputAddEmote + g.noise ),
		    selectHTML = d.getElementById( g.ID.inputAddToList + g.noise ),
		    list = getOptionValue( selectHTML );
		var emote = emoteInput.value.trim();

		saveEmote( emote, list );
		emoteInput.value = "";
		emoteInput.focus();
	};


	/**
	 * From the manage page: Save new list.
	 */
	function saveNewList( e ) {
		var d = document,
		    g = GLOBAL;
		var inputField = d.getElementById( g.ID.inputAddList + g.noise ),
		    navLink = d.createElement( "li" ),
		    newBlock = d.createElement( "div" ),
		    selAddHTML = d.getElementById( g.ID.inputAddToList + g.noise ),
		    selDelHTML = d.getElementById( g.ID.inputDelList + g.noise ),
		    selOption;
		var listName = inputField.value.trim();

		// Ignore empty
		if( listName.length == 0 ) {
			showMsg( "That ain't no valid name for a list." );
			return;
		}

		// Only create list if it doesn't exist already
		if( listName in g.emotes ) {
			showMsg( "This list already exists." );
			return;
		}

		g.emotes[listName] = [];
		saveEmotesToStorage( g.emotes );
		inputField.value = "";

		// Add to emote block selection
		navLink = createListLink( listName, 0 );
		g.REF.lists.appendChild( navLink );
		g.REF.navList.push( navLink );

		// Add (empty) emote block to main container
		newBlock.className = "mle-block" + g.noise;
		g.REF.emoteBlocks[listName] = newBlock;

		// Add <option>s to <select>s
		selOption = d.createElement( "option" );
		selOption.value = listName;
		selOption.textContent = listName;
		selAddHTML.appendChild( selOption );

		selOption = d.createElement( "option" );
		selOption.value = listName;
		selOption.textContent = listName;
		selDelHTML.appendChild( selOption );

		// Destroy context menus.
		// Will be rebuild when needed.
		ContextMenu.destroyMenus();
	};


	/**
	 * Create and show manage page.
	 * Only create manage elements when needed. Because
	 * it won't be needed that often, probably.
	 */
	function showManagePage( e ) {
		var form = GLOBAL.REF.mngForm;

		// Hide emote blocks
		toggleEmoteBlock( false );

		// Create manage elements if first time opening manage page
		if( form.childNodes.length < 1 ) {
			Builder.createManagePage( form );
		}

		form.className = "show-manage";
	};


	/**
	 * Prevent the default action of an event.
	 * @param {Event} e The event.
	 */
	function stopEvent( e ) {
		e.preventDefault();
	};


	/**
	 * Show/hide emote blocks when selected in the navigation.
	 */
	function toggleEmoteBlock( e ) {
		var g = GLOBAL,
		    geb = g.REF.emoteBlocks,
		    gnl = g.REF.navList,
		    e_target = e.target;
		var form, listName, i;

		// In case a child element was clicked instead of the (parent) list element container
		if( e_target != this ) {
			e_target = e_target.parentNode;
		}

		// Set chosen list to active
		for( i = 0; i < gnl.length; i++ ) {
			gnl[i].className = "";
		}
		if( e ) {
			e_target.className = "activelist";
		}

		// Show "Manage" page
		if( !e ) {
			g.REF.mainCont.removeChild( geb[g.shownBlock] );
			g.shownBlock = null;
		}

		// Show emotes of chosen block
		else {
			form = g.REF.mngForm;
			form.className = "";

			for( listName in geb ) {
				if( e && strToValidID( listName ) + g.noise == e_target.id ) {
					if( !g.shownBlock ) {
						g.REF.mainCont.appendChild( geb[listName] );
					}
					else {
						g.REF.mainCont.replaceChild( geb[listName], geb[g.shownBlock] );
					}
					g.shownBlock = listName;
					break;
				}
			}
		}
	};


	/**
	 * Show a preview of the emote that is about to be added.
	 */
	function updatePreview( e ) {
		var d = document;
		var previewId = "preview" + e.target.id,
		    preview = d.getElementById( previewId ),
		    emoteLink = e.target.value;

		if( emoteLink.indexOf( '/' ) != 0 ) {
			emoteLink = '/' + emoteLink;
		}
		if( emoteLink == preview.href ) {
			return;
		}

		preview.href = emoteLink;
		preview.className = ""; // reset old classes
		preview = Builder.addClassesForEmote( preview );
	};



	/**
	 * Everything context menu related.
	 * @type {Object}
	 */
	var ContextMenu = {


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
			var d = document,
			    g = GLOBAL;
			var menu = d.createElement( "ul" ),
			    item;
			var items = [
					{
						className: "out",
						text: "Save Emote",
						onclick: this.itemActionSaveEmote
					},
					{
						className: "in",
						text: "Delete Emote",
						onclick: this.itemActionDeleteEmote
					},
					{
						className: "in",
						text: "Move to List",
						onclick: this.itemActionMoveEmote
					},
					{
						className: "list",
						text: "Rename List",
						onclick: this.itemActionRenameList
					}
				];

			menu.id = "mle-ctxmenu" + g.noise;

			// Add items to menu
			for( var i = 0; i < items.length; i++ ) {
				item = d.createElement( "li" );
				item.className = items[i]["className"];
				item.textContent = items[i]["text"];
				item.addEventListener( "click", items[i]["onclick"].bind( this ), false );

				menu.appendChild( item );
			}

			// Add listener for context menu (will only be used on emotes)
			d.body.addEventListener( "contextmenu", this.show.bind( this ), false );
			d.body.addEventListener( "click", this.hide.bind( this ), false );

			this.REF.menu = menu;

			return menu;
		},


		/**
		 * Create dialog for the option "Move Emote".
		 * @param {int} x X coordinate from the left.
		 * @param {int} y Y coordinate from the top.
		 */
		createDialogMoveEmote: function( x, y ) {
			if( !this.REF.dialogMoveEmote ) {
				var d = document,
				    emotes = GLOBAL.emotes;
				var cont = d.createElement( "ul" ),
				    list;
				var listName;

				// Add available lists
				for( listName in emotes ) {
					list = d.createElement( "li" );
					list.appendChild( d.createTextNode( listName ) );
					list.addEventListener( "click", this.moveEmoteToList.bind( this ), false );
					cont.appendChild( list );
				}

				this.REF.dialogMoveEmote = cont;
				d.body.appendChild( cont );
			}

			this.REF.dialogMoveEmote.className = "diag show";
			this.REF.dialogMoveEmote.style.left = x + "px";
			this.REF.dialogMoveEmote.style.top = y + "px";
		},


		/**
		 * Create dialog for the option "Rename List".
		 * @param {int} x X coordinate from the left.
		 * @param {int} y Y coordinate from the top.
		 */
		createDialogRenameList: function( x, y ) {
			var list = this.REF.trigger,
			    name = list.children[0],
			    input = document.createElement( "input" );

			input.type = "text";
			input.value = name.textContent;
			input.addEventListener( "keydown", function( e ) {
				this.renameList( list, e );
			}.bind( this ), false );

			list.replaceChild( input, name );

			this.hide();
		},


		/**
		 * Create dialog for the option "Save Emote".
		 * @param {int} x X coordinate from the left.
		 * @param {int} y Y coordinate from the top.
		 */
		createDialogSaveEmote: function( x, y ) {
			if( !this.REF.dialogSaveEmote ) {
				var d = document,
				    emotes = GLOBAL.emotes;
				var cont = d.createElement( "ul" ),
				    list;
				var listName;

				// Add available lists
				for( listName in emotes ) {
					list = d.createElement( "li" );
					list.appendChild( d.createTextNode( listName ) );
					list.addEventListener( "click", this.saveEmoteToList.bind( this ), false );
					cont.appendChild( list );
				}

				this.REF.dialogSaveEmote = cont;
				d.body.appendChild( cont );
			}

			this.REF.dialogSaveEmote.className = "diag show";
			this.REF.dialogSaveEmote.style.left = x + "px";
			this.REF.dialogSaveEmote.style.top = y + "px";
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
		 * @return {Object} Object with the attributes "x" and "y".
		 */
		getPosForMenu: function( menu ) {
			var x = menu.style.left.replace( "px", "" ),
			    y = menu.style.top.replace( "px", "" );

			x = parseInt( x, 10 );
			y = parseInt( y, 10 );
			x += menu.offsetWidth + 10;

			return { "x": x, "y": y };
		},


		/**
		 * Hide the context menu of this userscript.
		 */
		hide: function() {
			var ctx = this.REF;

			ctx.trigger = null;
			ctx.menu.className = "";

			if( ctx.dialogSaveEmote ) {
				ctx.dialogSaveEmote.className = "diag";
			}
			if( ctx.dialogMoveEmote ) {
				ctx.dialogMoveEmote.className = "diag";
			}
			ctx.selectedEmote = null;
		},


		/**
		 * Delete the selected emote from the list.
		 */
		itemActionDeleteEmote: function( e ) {
			var emote = this.REF.selectedEmote.pathname,
			    list = GLOBAL.shownBlock;

			deleteEmote( emote, list );
		},


		/**
		 * Move the selected emote to another list.
		 */
		itemActionMoveEmote: function( e ) {
			var pos = this.getPosForMenu( e.target.parentNode );

			this.createDialogMoveEmote( pos.x, pos.y );
			e.stopPropagation(); // Keep context menu open.
		},


		/**
		 * Rename a list.
		 */
		itemActionRenameList: function( e ) {
			var pos = this.getPosForMenu( e.target.parentNode );

			this.createDialogRenameList( pos.x, pos.y );
			e.stopPropagation(); // Keep the context menu open.
		},


		/**
		 * Show available lists for the emote.
		 */
		itemActionSaveEmote: function( e ) {
			var pos = this.getPosForMenu( e.target.parentNode );

			this.createDialogSaveEmote( pos.x, pos.y );
			e.stopPropagation(); // Keep context menu open.
		},


		/**
		 * Move an emote to the chosen list.
		 */
		moveEmoteToList: function( e ) {
			var emote = this.REF.selectedEmote.pathname,
			    listNew = e.target.textContent,
			    listOld = GLOBAL.shownBlock;

			if( listNew == listOld ) {
				return;
			}

			saveEmote( emote, listNew );
			deleteEmote( emote, listOld );

			this.REF.dialogMoveEmote.className = "diag";
			this.REF.selectedEmote = null;
		},


		/**
		 * Rename a list.
		 * @param {Object} list The list element that triggered the name change.
		 */
		renameList: function( list, e ) {
			if( e.keyCode == "13" ) { // 13 == Enter
				var g = GLOBAL;
				var name = document.createElement( "strong" ),
				    listNameOld = list.id.replace( g.noise, '' ),
				    listNameNew = e.target.value;

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

					// Change ID in list
					list.id = strToValidID( listNameNew ) + g.noise;

					// Save changes to storage
					saveEmotesToStorage( g.emotes );
				}

				name.textContent = listNameNew;
				list.replaceChild( name, e.target );
			}
		},


		/**
		 * Save an emote to the chosen list.
		 */
		saveEmoteToList: function( e ) {
			var g = GLOBAL;
			var emote = this.REF.selectedEmote.pathname,
			    list = e.target.textContent;

			saveEmote( emote, list );

			this.REF.dialogSaveEmote.className = "diag";
			this.REF.selectedEmote = null;
		},


		/**
		 * Show the context menu for either an emote or list element.
		 */
		show: function( e ) {
			var bIsEmote = isEmote( e.target ),
			    bIsList = isList( e.target );

			if( !bIsEmote && !bIsList ) {
				this.hide();
				return;
			}

			e.preventDefault();

			var g = GLOBAL;

			this.REF.trigger = e.target;
			this.REF.menu.className = "show";

			if( bIsEmote ) {
				this.showDialogEmote( e );
			}
			else if( bIsList ) {
				this.showDialogList( e );
			}

			this.REF.menu.style.left = ( e.clientX + 2 ) + "px";
			this.REF.menu.style.top = e.clientY + "px";
		},


		/**
		 * Show the context menu for an emote.
		 */
		showDialogEmote: function( e ) {
			this.REF.selectedEmote = e.target;

			// Click occured in emote box.
			// This changes some of the available options.
			if( e.target.parentNode.className.indexOf( "mle-block" ) > -1 ) {
				this.REF.menu.className += " in-box";
			}
			else {
				this.REF.menu.className += " out-of-box";
			}
		},


		/**
		 * Show the context menu for a list element.
		 */
		showDialogList: function( e ) {
			this.REF.menu.className += " list-trigger";
		}


	};



	/**
	 * Setting things up. Getting ready for the show.
	 * Init object will be deleted after everything has been loaded from the storage.
	 * @see  handleBackgroundMessages
	 * @type {Object}
	 */
	var Init = {


		/**
		 * Starting point.
		 */
		initStep1: function() {
			if( !this.isRedditDown() ) {
				loadStorage();
			}
		},


		/**
		 * Called after preferences have been loaded from the background script.
		 */
		initStep2: function() {
			Builder.addCSS();
			Builder.addHTML();
		},


		/**
		 * Checks if this is a page, where MLE should be active.
		 * @return {Boolean}
		 */
		isAllowedHostname: function() {
			var hn = window.location.hostname,
			    sliceLen;

			// FIXME: Only a workaround for .co.uk TLDs. What about others?
			sliceLen = ( hn.substr( hn.length - 6 ) == ".co.uk" ) ? -3 : -2;
			hn = hn.split( "." ).slice( sliceLen ).join( "." );

			return ALLOWED_HOSTNAMES.indexOf( hn ) > -1 ? true : false;
		},


		/**
		 * Checks if the site is in maintenance mode.
		 * @return {Boolean}
		 */
		isRedditDown: function() {
			var title = document.getElementsByTagName( "title" )[0].textContent;
			return ( title == "reddit is down" || title == "Ow! -- reddit.com" );
		},


		/**
		 * Register for messages from the background process.
		 */
		registerForBackgroundMessages: function() {
			// Opera
			if( typeof opera != "undefined" ) {
			    opera.extension.onmessage = handleBackgroundMessages;
			}
			// Chrome
			else if( typeof chrome != "undefined" ) {
				chrome.extension.onMessage.addListener( handleBackgroundMessages );
			}
			// probably Firefox
			else {
			    self.on( "message", handleBackgroundMessages );
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
					window.addEventListener( "DOMContentLoaded", this.initStep1.bind( this ), false );
				}
			}
		}


	};


	Init.start();


} )();
