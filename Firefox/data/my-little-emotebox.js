"use strict";

( function() {

	// Hostnames where this extension should be active.
	var ALLOWED_HOSTNAMES = ["reddit.com"];

	var GLOBAL = {
			config: null,
			CTX: {
				ctxMenu: null,
				dialogMoveEmote: null,
				dialogSaveEmote: null,
				selectedEmote: null,
				trigger: null
			},
			draggingEmote: null,
			draggingList: null,
			emoteBlocks: {},
			emotes: null,
			focusedInput: null,
			ID: {
				ctxmenu: "mle-ctxmenu",
				exportField: "mle-export",
				importField: "mle-import",
				inputAddEmote: "addemote",
				inputAddList: "addlist",
				inputAddToList: "addtolist",
				inputDelList: "dellist",
				inputPreviewEmote: "previewaddemote",
				lists: "mle-blocklist",
				mainbox: "mle",
				mngForm: "mle-manage",
				styleNode: "MyLittleEmotebox"
			},
			mainCont: null,
			msg: null,
			msgTimeout: null,
			navList: [],
			// Noise for CSS classes and IDs, to minimise the probability
			// of accidentally overwriting existing styles.
			noise: "-bd6acd4a",
			shownBlock: null
		};



	/**
	 * Load saved data from the extension storage.
	 */
	function loadStorage() {
		postMessage( { task: BG_TASK.LOAD } );
	};


	/**
	 * Add CSS classes to the emote so it will be displayed
	 * if it is an out-of-sub emote.
	 * @param  {DOMElement} emote
	 * @return {DOMElement} The emote with CSS classes (or not).
	 */
	function addClassesForEmote( emote ) {
		var cfg = GLOBAL.config;
		var cn = emote.href.split( "/" );

		cn = cn[cn.length - 1];

		if( !emote.className ) {
			emote.className = "";
		}

		// If BetterPonymotes is used for out-of-sub emotes
		if( cfg.adjustForBetterPonymotes ) {
			emote.className += " bpmote-" + cn;
		}
		// If GrEmB is used
		if( cfg.adjustForGrEmB ) {
			emote.className += " G_" + cn + "_";
		}

		emote.className = emote.className.trim();

		return emote;
	};


	/**
	 * Get the value of the currently selected <option>.
	 */
	function getOptionValue( select ) {
		return select.options[select.selectedIndex].value;
	};


	/**
	 * Get the x and y coordinate for the context sub-menu.
	 * @param  {DOMElement} ctxMenu The ctx menu.
	 * @return {Object} Object with the attributes "x" and "y".
	 */
	function getPosForCtxMenu( ctxMenu ) {
		var x = ctxMenu.style.left.replace( "px", "" ),
		    y = ctxMenu.style.top.replace( "px", "" );

		x = parseInt( x, 10 );
		y = parseInt( y, 10 );
		x += ctxMenu.offsetWidth + 10;

		return { "x": x, "y": y };
	};


	/**
	 * Hide the context menu of this userscript.
	 */
	function hideCtxMenu() {
		var g = GLOBAL;

		g.CTX.trigger = null;
		g.CTX.ctxMenu.className = "";
		if( g.CTX.dialogSaveEmote ) {
			g.CTX.dialogSaveEmote.className = "diag";
		}
		if( g.CTX.dialogMoveEmote ) {
			g.CTX.dialogMoveEmote.className = "diag";
		}
		g.CTX.selectedEmote = null;
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

		if( node.outerHTML.indexOf( "href=\"/" ) < 0
				|| node.outerHTML.indexOf( "href=\"/http://" ) > -1
				|| node.outerHTML.indexOf( "href=\"/r/" ) > -1
				|| node.outerHTML.indexOf( "href=\"/user/" ) > -1 ) {
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
	 * Add CSS rules to the page inside a <style> tag in the head.
	 */
	function addCSS() {
		var g = GLOBAL,
		    cfg = g.config,
		    d = document;
		var styleNode = d.createElement( "style" );
		var rule,
		    rules = '\n';
		var zIndex = cfg.boxUnderHeader ? 10 : 10000,
		    boxPos;

		if( cfg.boxAlign == "left" ) {
			boxPos = "left: 5px;";
		}
		else if( cfg.boxAlign == "right" ) {
			boxPos = "right: 5px;";
		}

		// '%' will be replaced with noise
		var css = {
			// Collection of same CSS
			"#mle%.show .mle-close, #mle%.show ul, #mle%.show .mle-block%, #mle%.show .mng-link, #mle%.show #mle-manage%.show-manage, #mle-ctxmenu%.show, .diag.show":
					"display: block;",
			"#mle%, #mle-ctxmenu%":
					"font: 12px Verdana, Arial, Helvetica, \"DejaVu Sans\", sans-serif; line-height: 14px; text-align: left;",
			"#mle% .btn":
					"background-color: #808080; border-bottom-left-radius: 2px; border-bottom-right-radius: 2px; border-top: 1px solid #404040; color: #ffffff; cursor: default; font-weight: bold; padding: 5px 0 6px; text-align: center;",
			"#mle% .btn:hover":
					"background-color: #404040;",
			// Inactive state
			"#mle%":
					"background-color: #f4f4f4; border: 1px solid #d0d0d0; border-radius: 2px; box-sizing: border-box; -moz-box-sizing: border-box; position: fixed; " + boxPos + " top: " + cfg.boxPosTop + "px; z-index: " + zIndex + "; width: " + cfg.boxWidthMinimized + "px;"
					+ "-moz-transition: width " + cfg.boxAnimationSpeed + "ms; -webkit-transition: width " + cfg.boxAnimationSpeed + "ms; -o-transition: width " + cfg.boxAnimationSpeed + "ms; transition: width " + cfg.boxAnimationSpeed + "ms;",
			// Active state
			"#mle%.show":
					"width: " + cfg.boxWidth + "px; height: " + cfg.boxHeight + "px; padding: 36px 10px 10px; z-index: 10000;",
			// Header
			"#mle% .mle-header":
					"display: block; color: #303030; font-weight: bold; padding: 6px 0; text-align: center;",
			"#mle%.show .mle-header":
					"display: none;",
			// Close button
			"#mle% .mle-close":
					"display: none; position: absolute; right: 10px; top: -1px; z-index: 12; padding-left: 12px; padding-right: 12px;",
			// Selection list
			"#mle% ul":
					"box-sizing: border-box; -moz-box-sizing: border-box; direction: rtl; display: none; overflow: auto; float: left; height: 100%; margin: 0; max-width: 250px; padding: 0;",
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
					"display: inline-block; float: none; border: 1px solid #ffffff; border-radius: 2px; margin: 1px; min-height: 10px; min-width: 10px; vertical-align: top;",
			".mle-block% a:hover":
					"border-color: #96BFE9;",
			// Notifier
			"#mle% .mle-msg":
					"background-color: #303030; color: #ffffff; border-radius: 2px; line-height: 19px; position: fixed; left: " + ( cfg.boxWidth + 13 ) + "px; top: -200px; padding: 10px;"
					+ "-moz-transition: top " + cfg.msgAnimationSpeed + "ms; -webkit-transition: top " + cfg.msgAnimationSpeed + "ms; -o-transition: top " + cfg.msgAnimationSpeed + "ms; transition: top " + cfg.msgAnimationSpeed + "ms;",
			"#mle% .mle-msg span":
					"float: left; margin-left: 10px;",
			"#mle% .mle-msg.show":
					"top: " + cfg.boxPosTop + "px;",
			// Manage link
			"#mle% .mng-link":
					"display: none; width: 72px; position: absolute; top: -1px; z-index: 10;",
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
					"font-style: italic;",
			// Context menu
			"#mle-ctxmenu%, .diag":
					"cursor: default; display: none; position: fixed; z-index: 10010; white-space: nowrap; background-color: #ffffff; border: 1px solid #d0d0d0; border-radius: 1px; box-shadow: 2px 1px 6px -2px rgba( 80, 80, 80, 0.4 ); font-size: 12px; list-style-type: none; margin: 0; padding: 0;",
			"#mle-ctxmenu% li":
					"display: none;",
			"#mle-ctxmenu% li, .diag li":
					"margin: 2px 0; padding: 5px 14px;",
			"#mle-ctxmenu% li:hover, .diag li:hover":
					"background-color: #cee3f8;",
			"#mle-ctxmenu%.in-box .in, #mle-ctxmenu%.out-of-box .out, #mle-ctxmenu%.list-trigger .list":
					"display: block;",
			// Dialog "Save Emote"
			".diag":
					"max-height: 200px; max-width: 180px; overflow: auto; z-index: 10020;"
		};

		styleNode.type = "text/css";
		styleNode.id = g.ID.styleNode + g.noise;

		for( rule in css ) {
			rules += rule.replace( /%/g, g.noise );
			rules += " { " + css[rule] + "}\n";
		}

		styleNode.textContent = rules;

		d.getElementsByTagName( "head" )[0].appendChild( styleNode );
	};


	/**
	 * Add the HTML to the page.
	 */
	function addHTML() {
		var d = document,
		    g = GLOBAL;
		var mainContainer = d.createElement( "div" ),
		    fragmentNode = d.createDocumentFragment(),
		    labelMain = d.createElement( "strong" ),
		    close = d.createElement( "span" ),
		    mngTrigger = d.createElement( "span" ),
		    mngForm = d.createElement( "div" ),
		    msg = d.createElement( "p" );

		// Add headline
		labelMain.className = "mle-header";
		labelMain.textContent = "Emotes";

		// Add close button
		close.className = "mle-close btn";
		close.textContent = "x";
		close.addEventListener( "click", mainContainerHide, false );

		// Add manage link
		mngTrigger.className = "mng-link btn";
		mngTrigger.textContent = "Manage";
		mngTrigger.addEventListener( "click", showManagePage, false );

		// Add manage page
		mngForm.id = g.ID.mngForm + g.noise;

		// Add most-of-the-time-hidden message block
		msg.className = "mle-msg";

		// Append all the above to the DOM fragment
		fragmentNode = appendChildren(
			fragmentNode,
			[labelMain, close, mngTrigger, createEmoteBlocksAndNav(), mngForm, msg]
		);

		// Add list and emote blocks to main container
		mainContainer.id = g.ID.mainbox + g.noise;
		mainContainer.appendChild( fragmentNode );
		mainContainer.addEventListener( "mouseover", rememberActiveTextarea, false );
		mainContainer.addEventListener( "mouseover", mainContainerShow, false );

		g.msg = msg;
		g.mainCont = mainContainer;

		d.body.appendChild( mainContainer );

		if( g.config.ctxMenu ) {
			d.body.appendChild( createCtxMenu() );
		}
	};


	/**
	 * Create a context/right-click menu.
	 * @return {DOMElement} Context menu.
	 */
	function createCtxMenu() {
		var d = document,
		    g = GLOBAL;
		var menu = d.createElement( "ul" ),
		    item;
		var items = [
				{
					className: "out",
					text: "Save Emote",
					onclick: ctxMenuSaveEmote
				},
				{
					className: "in",
					text: "Delete Emote",
					onclick: ctxMenuDelEmote
				},
				{
					className: "in",
					text: "Move to List",
					onclick: ctxMenuMoveEmote
				},
				{
					className: "list",
					text: "Rename List",
					onclick: ctxMenuRenameList
				}
			];

		menu.id = g.ID.ctxmenu + g.noise;

		// Add items to menu
		for( var i = 0; i < items.length; i++ ) {
			item = d.createElement( "li" );
			item.className = items[i]["className"];
			item.textContent = items[i]["text"];
			item.addEventListener( "click", items[i]["onclick"], false );
			menu.appendChild( item );
		}

		// Add listener for context menu (will only be used on emotes)
		d.body.addEventListener( "contextmenu", showCtxMenu, false );
		d.body.addEventListener( "click", hideCtxMenu, false );

		g.CTX.ctxMenu = menu;
		return menu;
	};


	/**
	 * Create dialog for the option "Move Emote".
	 * @param {int} x X coordinate from the left.
	 * @param {int} y Y coordinate from the top.
	 */
	function createDialogMoveEmote( x, y ) {
		var g = GLOBAL;

		if( !g.CTX.dialogMoveEmote ) {
			var d = document;
			var cont = d.createElement( "ul" ),
			    list;
			var listName;

			// Add available lists
			for( listName in g.emotes ) {
				list = d.createElement( "li" );
				list.appendChild( d.createTextNode( listName ) );
				list.addEventListener( "click", ctxMoveEmoteToList, false );
				cont.appendChild( list );
			}

			g.CTX.dialogMoveEmote = cont;
			d.body.appendChild( cont );
		}

		g.CTX.dialogMoveEmote.className = "diag show";
		g.CTX.dialogMoveEmote.style.left = x + "px";
		g.CTX.dialogMoveEmote.style.top = y + "px";
	};


	/**
	 * Create dialog for the option "Rename List".
	 * @param {int} x X coordinate from the left.
	 * @param {int} y Y coordinate from the top.
	 */
	function createDialogRenameList( x, y ) {
		var d = document,
		    g = GLOBAL;
		var list = g.CTX.trigger,
		    name = list.children[0],
		    input = d.createElement( "input" );

		input.type = "text";
		input.value = name.textContent;
		input.addEventListener( "keydown", function( e ) {
			ctxRenameList( list, e );
		}, false );

		list.replaceChild( input, name );

		hideCtxMenu();
	};


	/**
	 * Create dialog for the option "Save Emote".
	 * @param {int} x X coordinate from the left.
	 * @param {int} y Y coordinate from the top.
	 */
	function createDialogSaveEmote( x, y ) {
		var g = GLOBAL;

		if( !g.CTX.dialogSaveEmote ) {
			var d = document;
			var cont = d.createElement( "ul" ),
			    list;
			var listName;

			// Add available lists
			for( listName in g.emotes ) {
				list = d.createElement( "li" );
				list.appendChild( d.createTextNode( listName ) );
				list.addEventListener( "click", ctxSaveEmoteToList, false );
				cont.appendChild( list );
			}

			g.CTX.dialogSaveEmote = cont;
			d.body.appendChild( cont );
		}

		g.CTX.dialogSaveEmote.className = "diag show";
		g.CTX.dialogSaveEmote.style.left = x + "px";
		g.CTX.dialogSaveEmote.style.top = y + "px";
	};


	/**
	 * Create emote blocks filled with emotes and the navigation.
	 */
	function createEmoteBlocksAndNav() {
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
		listNav.id = g.ID.lists + g.noise;
		fragmentNode.appendChild( listNav );

		for( listName in g.emotes ) {
			emoteList = g.emotes[listName];

			// Create list navigation
			listLink = createListLink( listName, g.emotes[listName].length );
			listNav.appendChild( listLink );

			// Create emotes section
			emoteBlock = d.createElement( "div" );
			emoteBlock.className = "mle-block" + g.noise;

			// Add the emotes to the block
			emoteBlock.appendChild( createEmotes( emoteList ) );

			// Display first emote section per default
			if( countBlocks == 0 ) {
				listLink.className = "activelist";
				g.shownBlock = listName;
				fragmentNode.appendChild( emoteBlock );
			}

			g.navList[countBlocks] = listLink;
			g.emoteBlocks[listName] = emoteBlock;

			countBlocks++;
		}

		return fragmentNode;
	};


	/**
	 * Fill an emote block with emotes.
	 */
	function createEmotes( emoteList ) {
		var fragment = document.createDocumentFragment(),
		    emoteLink;
		var i;

		for( i = 0; i < emoteList.length; i++ ) {
			emoteLink = '/' + emoteList[i];
			fragment.appendChild( createEmote( emoteLink ) );
		}

		return fragment;
	};


	/**
	 * Create a single emote.
	 * @param {String} link
	 */
	function createEmote( link ) {
		var emote = document.createElement( "a" );

		emote.href = link;
		emote = addClassesForEmote( emote );

		emote.addEventListener( "click", insertEmote, false );
		emote.addEventListener( "dragstart", moveEmoteStart, false );

		// The "dragenter" and "dragover" events have
		// to be stopped in order for "drop" to work.
		emote.addEventListener( "dragenter", stopEvent, false );
		emote.addEventListener( "dragover", stopEvent, false );

		// Stop "dragend" as well, so if the drop target isn't
		// an emote, the browser doesn't open the emote URL.
		emote.addEventListener( "dragend", stopEvent, false );

		emote.addEventListener( "drop", moveEmoteDrop, false );

		return emote;
	};


	/**
	 * Create list element to toggle display of the corresponding emote box.
	 * @param  {String} listName     Name of list.
	 * @param  {int}    elementCount Number of emotes in this list.
	 * @return {DOMElement}
	 */
	function createListLink( listName, elementCount ) {
		var d = document;
		var listLink = d.createElement( "li" ),
		    name = d.createElement( "strong" ),
		    count = d.createElement( "span" );

		name.textContent = listName;
		name.addEventListener( "click", toggleEmoteBlock, false );

		count.textContent = elementCount + " emotes";
		count.addEventListener( "click", toggleEmoteBlock, false );

		listLink.id = strToValidID( listName ) + GLOBAL.noise;
		listLink.setAttribute( "draggable", "true" );
		listLink.addEventListener( "click", toggleEmoteBlock, false );
		listLink.addEventListener( "dragstart", moveListStart, false );
		listLink.addEventListener( "dragenter", stopEvent, false );
		listLink.addEventListener( "dragover", stopEvent, false );
		listLink.addEventListener( "drop", moveListDrop, false );

		appendChildren( listLink, [name, count] );

		return listLink;
	};


	/**
	 * Create a label.
	 * @param  {String} text Text for the label.
	 * @return {DOMElement} label
	 */
	function createLabel( text ) {
		var label = document.createElement( "label" );
		label.textContent = text;
		return label;
	};


	/**
	 * Create a HTML select of all existing emote lists/blocks.
	 * @param {String} selId Value for ID attribute of the <select>.
	 */
	function createListSelect( selId ) {
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
	};


	/**
	 * Create the parts of the manage page.
	 * @param {DOMElement} form The manage page (container).
	 */
	function createManagePage( form ) {
		var areas = [
				mngAreaForNewEmote(),
				mngAreaForNewList(),
				mngAreaForDelList(),
				mngAreaForMovEmote(),
				mngAreaForDelEmote(),
				mngAreaForMovList()
			];
		var frag = appendChildren( document.createDocumentFragment(), areas );

		form.appendChild( frag );
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
	 * Create manage area for adding new emotes to lists.
	 */
	function mngAreaForNewEmote() {
		var d = document,
		    g = GLOBAL;
		var inputEmote = d.createElement( "input" ),
		    preview = d.createElement( "a" ),
		    selList,
		    submitEmote = d.createElement( "input" );

		inputEmote.type = "text";
		inputEmote.id = g.ID.inputAddEmote + g.noise;
		inputEmote.addEventListener( "keyup", updatePreview, false );
		preview.id = g.ID.inputPreviewEmote + g.noise;

		// Select a list to add the emote to.
		selList = createListSelect( "addtolist" + g.noise );

		submitEmote.type = "submit";
		submitEmote.value = "save emote";
		submitEmote.addEventListener( "click", saveNewEmote, false );

		return appendChildren(
			d.createElement( "div" ),
			[
				createLabel( "Add emote" ),
				inputEmote,
				d.createTextNode( " to " ),
				selList,
				submitEmote,
				d.createElement( "br" ),
				preview
			]
		);
	};


	/**
	 * Create manage area for adding new lists.
	 */
	function mngAreaForNewList() {
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
			[createLabel( "Add list" ), inputList, submitList]
		);
	};


	/**
	 * Create manage area for deleting lists.
	 */
	function mngAreaForDelList() {
		var d = document,
		    g = GLOBAL;
		var submitDel = d.createElement( "input" );

		submitDel.type = "submit";
		submitDel.value = "delete list";
		submitDel.addEventListener( "click", delList, false );

		return appendChildren(
			d.createElement( "div" ),
			[
				createLabel( "Delete list" ),
				createListSelect( g.ID.inputDelList + g.noise ),
				submitDel
			]
		);
	};


	/**
	 * Create manage area for moving emotes.
	 */
	function mngAreaForMovEmote() {
		var d = document;
		var note = d.createElement( "em" );

		note.innerHTML = "Use Drag&amp;Drop to move emotes.<br />To move it to another list, right-click on it and select “Move to List”.";

		return appendChildren(
			d.createElement( "div" ),
			[createLabel( "Move emotes" ), note]
		);
	};


	/**
	 * Create manage area for deleting emotes.
	 */
	function mngAreaForDelEmote() {
		var d = document;
		var note = d.createElement( "em" );

		note.textContent = "Right-click on the emote and select “Delete Emote”.";

		return appendChildren(
			d.createElement( "div" ),
			[createLabel( "Delete emotes" ), note]
		);
	};


	/**
	 * Create manage area for moving lists.
	 */
	function mngAreaForMovList() {
		var d = document;
		var note = d.createElement( "em" );

		note.textContent = "Use Drag&amp;Drop to move lists. A dragged object will be inserted before the one it was dropped on.";

		return appendChildren(
			d.createElement( "div" ),
			[createLabel( "Move list" ), note]
		);
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
		children = g.emoteBlocks[list].childNodes;
		emoteSlash = "/" + emote;
		for( i = 0; i < children.length; i++ ) {
			if( children[i].pathname == emoteSlash ) {
				g.emoteBlocks[list].removeChild( children[i] );
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
			showMsg( "That ain't no emote, sugarcube.", "squintyjack" );
			return;
		}

		// Emotes are saved without leading slash
		if( emote.indexOf( '/' ) == 0 ) {
			emote = emote.substring( 1 );
		}

		// Only save if not already in list
		if( g.emotes[list].indexOf( emote ) > -1 ) {
			showMsg( "Um, this emote is already in the list.", "fluttershy" );
			return;
		}

		g.emotes[list].push( emote );
		saveEmotesToStorage( g.emotes );

		// Add to DOM
		g.emoteBlocks[list].appendChild( createEmote( '/' + emote ) );
	};


	/**
	 * Saves the emotes to the storage.
	 * @param {Object} emotes Lists/emotes to save.
	 */
	function saveEmotesToStorage( emotes ) {
		postMessage( { task: BG_TASK.SAVE_EMOTES, emotes: emotes } );
	};


	/**
	 * Display a little popup message, that disappears after a few seconds again.
	 */
	function showMsg( text, emote ) {
		var g = GLOBAL,
		    cfg = g.config;

		if( !g.msg || g.msg == null ) { return; }

		clearTimeout( g.msgTimeout );
		g.msg.className += " show";

		if( emote.trim().length > 0 ) {
			g.msg.innerHTML = "<a href=\"/" + emote + "\"></a><span>" + text + "</span>";
		}
		else {
			g.msg.textContent = text;
		}

		g.msgTimeout = setTimeout( function() {
			GLOBAL.msg.className = "mle-msg";
		}, cfg.msgTimeout );
	};



	// Reacting to events


	/**
	 * Delete the selected emote from the list.
	 */
	function ctxMenuDelEmote( e ) {
		var g = GLOBAL;
		var emote = g.CTX.selectedEmote.pathname,
		    list = g.shownBlock;

		deleteEmote( emote, list );
	};


	/**
	 * Move the selected emote to another list.
	 */
	function ctxMenuMoveEmote( e ) {
		var pos = getPosForCtxMenu( e.target.parentNode );

		createDialogMoveEmote( pos.x, pos.y );
		e.stopPropagation(); // Keep context menu open.
	};


	/**
	 * Rename a list.
	 */
	function ctxMenuRenameList( e ) {
		var pos = getPosForCtxMenu( e.target.parentNode );

		createDialogRenameList( pos.x, pos.y );
		e.stopPropagation(); // Keep the context menu open.
	};


	/**
	 * Show available lists for the emote.
	 */
	function ctxMenuSaveEmote( e ) {
		var pos = getPosForCtxMenu( e.target.parentNode );

		createDialogSaveEmote( pos.x, pos.y );
		e.stopPropagation(); // Keep context menu open.
	};


	/**
	 * Move an emote to the chosen list.
	 */
	function ctxMoveEmoteToList( e ) {
		var g = GLOBAL;
		var emote = g.CTX.selectedEmote.pathname,
		    listNew = e.target.textContent,
		    listOld = g.shownBlock;

		saveEmote( emote, listNew );
		deleteEmote( emote, listOld );

		g.CTX.dialogMoveEmote.className = "diag";
		g.CTX.selectedEmote = null;
	};


	/**
	 * Rename a list.
	 * @param {Object} list The list element that triggered the name change.
	 */
	function ctxRenameList( list, e ) {
		if( e.keyCode == "13" ) { // 13 == Enter
			var g = GLOBAL;
			var name = document.createElement( "strong" ),
			    listNameOld = list.id.replace( g.noise, '' ),
			    listNameNew = e.target.value;

			// Length: at least 1 char
			if( listNameNew.length > 0 && listNameOld != listNameNew ) {
				// Change emotes object (memory, not storage)
				g.emotes[listNameNew] = g.emotes[listNameOld];
				delete g.emotes[listNameOld];

				// Change attribute name in emoteBlocks object
				g.emoteBlocks[listNameNew] = g.emoteBlocks[listNameOld];
				delete g.emoteBlocks[listNameOld];

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
	};


	/**
	 * Save an emote to the chosen list.
	 */
	function ctxSaveEmoteToList( e ) {
		var g = GLOBAL;
		var emote = g.CTX.selectedEmote.pathname,
		    list = e.target.textContent;

		saveEmote( emote, list );

		g.CTX.dialogSaveEmote.className = "diag";
		g.CTX.selectedEmote = null;
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
		    listBlocks = d.getElementById( g.ID.lists + g.noise ),
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
		listBlocks.removeChild( listToDel );
		delete g.emoteBlocks[listName];

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
		destroyCtxMenus();
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
				initStep2();
				break;

			case BG_TASK.SAVE_EMOTES:
				if( !data.success ) {
					showMsg( "Um, I'm sorry, but the changes could not be saved.", "fluttershy" );
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
		var ta = GLOBAL.focusedInput;

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
		g.mainCont.removeEventListener( "mouseover", mainContainerShow, false );
		g.mainCont.className = "";
		setTimeout( function() {
			GLOBAL.mainCont.addEventListener( "mouseover", mainContainerShow, false );
		}, g.config.boxAnimationSpeed + 100 );
	};


	/**
	 * Fully display main container.
	 */
	function mainContainerShow( e ) {
		GLOBAL.mainCont.className = "show";
	};


	/**
	 * Drop the emote into the DOM at the new place
	 * and remove it from the old one.
	 */
	function moveEmoteDrop( e ) {
		var g = GLOBAL;
		var emoteNameSource, emoteNameTarget;
		var list, emoteIdxSource, emoteIdxTarget;

		e.preventDefault();

		// Different parent means we may drag a list element.
		// We don't drop list elements on emotes, stop it.
		if( e.target.parentNode != g.draggingEmote.parentNode ) {
			g.draggingList = null;
			return;
		}

		emoteNameSource = g.draggingEmote.pathname.substring( 1 );
		emoteNameTarget = e.target.pathname.substring( 1 );

		// Do nothing if source and target are the same
		if( emoteNameSource == emoteNameTarget ) {
			g.draggingEmote = null;
			return;
		}

		e.target.parentNode.removeChild( g.draggingEmote );
		e.target.parentNode.insertBefore( g.draggingEmote, e.target );

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

		g.draggingEmote = null;
	};


	/**
	 * Remember the currently dragged around emote.
	 */
	function moveEmoteStart( e ) {
		GLOBAL.draggingEmote = e.target;
	};


	/**
	 * Drop the list into the DOM at the new place
	 * and remove it from the old one.
	 */
	function moveListDrop( e ) {
		var g = GLOBAL;
		var nameSource,
		    nameTarget,
		    reordered = {};
		var block;

		e.preventDefault();

		// Do nothing if source and target are the same
		if( e.target == g.draggingList ) {
			g.draggingList = null;
			return;
		}

		// Different parent means we may drag an emote.
		// We don't drop emotes on lists, stop it.
		if( e.target.parentNode != g.draggingList.parentNode ) {
			g.draggingList = null;
			return;
		}

		e.target.parentNode.removeChild( g.draggingList );
		e.target.parentNode.insertBefore( g.draggingList, e.target );

		// Save new order to storage
		nameSource = g.draggingList.id.replace( g.noise, '' );
		nameTarget = e.target.id.replace( g.noise, '' );

		for( block in g.emotes ) {
			if( block == nameSource ) {
				continue;
			}
			if( block == nameTarget ) {
				reordered[nameSource] = g.emotes[nameSource];
			}
			reordered[block] = g.emotes[block];
		}

		g.emotes = reordered;
		saveEmotesToStorage( g.emotes );

		g.draggingList = null;
	};


	/**
	 * Remember the currently dragged around list element.
	 */
	function moveListStart( e ) {
		GLOBAL.draggingList = e.target;

		// Drag&Drop won't work on the list in Firefox 14 without set data.
		e.dataTransfer.setData( "text/plain", "" );
	};


	/**
	 * Remember the currently focused/active textarea
	 * (if there is on) as input for the emotes.
	 */
	function rememberActiveTextarea( e ) {
		var ae = document.activeElement;

		if( ae && ae.tagName.toLowerCase() == "textarea" ) {
			GLOBAL.focusedInput = ae;
		}
	};


	/**
	 * From the options page: Save new emote.
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
	 * From the options page: Save new list.
	 */
	function saveNewList( e ) {
		var d = document,
		    g = GLOBAL;
		var inputField = d.getElementById( g.ID.inputAddList + g.noise ),
		    listNav = d.getElementById( g.ID.lists + g.noise ),
		    navLink = d.createElement( "li" ),
		    newBlock = d.createElement( "div" ),
		    selAddHTML = d.getElementById( g.ID.inputAddToList + g.noise ),
		    selDelHTML = d.getElementById( g.ID.inputDelList + g.noise ),
		    selOption;
		var listName = inputField.value.trim();

		// Ignore empty
		if( listName.length == 0 ) {
			showMsg( "That ain't no valid name for a list.", "squintyjack" );
			return;
		}

		// Only create list if it doesn't exist already
		if( listName in g.emotes ) {
			showMsg( "This list already exists.", "fluttershy" );
			return;
		}

		g.emotes[listName] = [];
		saveEmotesToStorage( g.emotes );
		inputField.value = "";

		// Add to emote block selection
		navLink = createListLink( listName, 0 );
		listNav.appendChild( navLink );
		g.navList.push( navLink );

		// Add (empty) emote block to main container
		newBlock.className = "mle-block" + g.noise;
		g.emoteBlocks[listName] = newBlock;

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
		destroyCtxMenus();
	};


	/**
	 * Destroy the context menu parts that have to do with the emote lists.
	 */
	function destroyCtxMenus() {
		var g = GLOBAL;

		if( g.CTX.dialogMoveEmote ) {
			g.CTX.dialogMoveEmote.parentNode.removeChild( g.CTX.dialogMoveEmote );
			g.CTX.dialogMoveEmote = null;
		}
		if( g.CTX.dialogSaveEmote ) {
			g.CTX.dialogSaveEmote.parentNode.removeChild( g.CTX.dialogSaveEmote );
			g.CTX.dialogSaveEmote = null;
		}
	};


	/**
	 * Show the context menu for either an emote or list element.
	 */
	function showCtxMenu( e ) {
		var bIsEmote = isEmote( e.target ),
		    bIsList = isList( e.target );

		if( !bIsEmote && !bIsList ) {
			hideCtxMenu();
			return;
		}
		var g = GLOBAL;

		g.CTX.trigger = e.target;
		g.CTX.ctxMenu.className = "show";

		if( bIsEmote ) {
			showCtxMenuEmote( e );
		}
		else if( bIsList ) {
			showCtxMenuList( e );
		}

		g.CTX.ctxMenu.style.left = ( e.clientX + 2 ) + "px";
		g.CTX.ctxMenu.style.top = e.clientY + "px";

		e.preventDefault();
	};


	/**
	 * Show the context menu for an emote.
	 */
	function showCtxMenuEmote( e ) {
		var g = GLOBAL;

		g.CTX.selectedEmote = e.target;

		// Click occured in emote box.
		// This changes some of the available options.
		if( e.target.parentNode.className.indexOf( "mle-block" ) > -1 ) {
			g.CTX.ctxMenu.className += " in-box";
		}
		else {
			g.CTX.ctxMenu.className += " out-of-box";
		}
	};


	/**
	 * Show the context menu for a list element.
	 */
	function showCtxMenuList( e ) {
		GLOBAL.CTX.ctxMenu.className += " list-trigger";
	};


	/**
	 * Create and show manage page.
	 * Only create manage elements when needed. Because
	 * it won't be needed that often, probably.
	 */
	function showManagePage( e ) {
		var g = GLOBAL;
		var form = document.getElementById( g.ID.mngForm + g.noise );

		// Hide emote blocks
		toggleEmoteBlock( false );

		// Create manage elements if first time opening manage page
		if( form.childNodes.length < 1 ) {
			createManagePage( form );
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
		    geb = g.emoteBlocks,
		    gnl = g.navList,
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
			g.mainCont.removeChild( geb[g.shownBlock] );
			g.shownBlock = null;
		}

		// Show emotes of chosen block
		else {
			form = document.getElementById( g.ID.mngForm + g.noise )
			form.className = "";

			for( listName in geb ) {
				if( e && strToValidID( listName ) + g.noise == e_target.id ) {
					if( !g.shownBlock ) {
						g.mainCont.appendChild( geb[listName] );
					}
					else {
						g.mainCont.replaceChild( geb[listName], geb[g.shownBlock] );
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
		preview = addClassesForEmote( preview );
	};



	// Getting ready.


	/**
	 * Starting point.
	 */
	function init() {
		if( !isRedditDown() ) {
			loadStorage();
		}
	};


	/**
	 * Called after preferences have been loaded from the background script.
	 */
	function initStep2() {
		addCSS();
		addHTML();
	}


	/**
	 * Checks if the site is in maintenance mode.
	 * @return {Boolean}
	 */
	function isRedditDown() {
		var title = document.getElementsByTagName( "title" )[0].textContent;
		return ( title == "reddit is down" || title == "Ow! -- reddit.com" );
	};


	/**
	 * Register for messages from the background process.
	 */
	function registerForBackgroundMessages() {
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
	 * Checks if this is a page, where MLE should be active.
	 * @return {Boolean}
	 */
	function isAllowedHostname() {
		var hn = window.location.hostname,
		    sliceLen;

		// FIXME: Only a workaround for .co.uk TLDs. What about others?
		sliceLen = ( hn.substr( hn.length - 6 ) == ".co.uk" ) ? -3 : -2;
		hn = hn.split( "." ).slice( sliceLen ).join( "." );

		return ALLOWED_HOSTNAMES.indexOf( hn ) > -1 ? true : false;
	};


	// Aaand start!
	// Uhm, if that's okay with you.

	if( isAllowedHostname() ) {
		registerForBackgroundMessages();

		// Everything ready in the DOM.
		if( document.body ) {
			init();
		}
		// Our script is too early. Wait until the DOM has been loaded.
		else {
			window.addEventListener( "DOMContentLoaded", init, false );
		}
	}

} )();