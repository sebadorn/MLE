<!DOCTYPE html>

<html>
<head>
	<meta charset="utf-8" />
	<meta name="robots" content="noindex" />
	<title>My Little Emotebox – A browser extension for Chrome, Firefox and Opera</title>
	<meta name="author" content="meinstuhlknarrt" />
	<link rel="shortcut icon" href="MLE_32.png" />
	<link rel="stylesheet" href="mle.css" />
	<link rel="chrome-webstore-item" href="https://chrome.google.com/webstore/detail/akkkkifniibnnabhagkppchajlbaggbp">
	<script src="mle.js"></script>
</head>
<body>

<h1>My Little Emotebox<sup id="version"></sup></h1>

<nav class="main">
	<a href="index.php">Features</a>
	<a href="install.php">Install</a>
	<a href="changelog.php" class="active">Changelog</a>
</nav>


<section class="main changelog">
	<ul>
		<li>
			<a href="https://github.com/sebadorn/MLE">Source code available on GitHub.</a>
		</li>
		<li>
			<h2>2.10.9</h2>
			<ul>
				<li><code>Bugfix</code> Some missing G table integration.</li>
			</ul>
		</li>
		<li>
			<h2>2.10.7</h2>
			<ul>
				<li><code>Misc.</code> Added tags for new emotes.</li>
			</ul>
		</li>
		<li>
			<h2>2.10.6</h2>
			<ul>
				<li><code>Misc.</code> Added new G table.</li>
				<li><code>Misc.</code> Added tags for new emotes.</li>
			</ul>
		</li>
		<li>
			<h2>2.10.5</h2>
			<ul>
				<li><code>Misc.</code> Switched to HTTPS for addon update checks. (Thanks, <a href="https://letsencrypt.org/">Let's Encrypt</a>!)</li>
				<li><code>Misc.</code> Moved from cfx to <a href="https://developer.mozilla.org/en-US/Add-ons/SDK/Tools/jpm">jpm</a> including automated signing. (Remember my angry rant for version 2.10.2? Well, jpm got a lot better.)</li>
				<li><code>Misc.</code> Added tags for new emotes.</li>
			</ul>
		</li>
		<li>
			<h2>2.10.4</h2>
			<ul>
				<li><code>Misc.</code> Added tags for new emotes.</li>
			</ul>
		</li>
		<li>
			<h2>2.10.3</h2>
			<ul>
				<li><code>Bugfix</code> When processing the CSS of r/mlplounge, ignore <em>/pl00</em> etc. because the emotes would be duplicated.</li>
				<li><code>Misc.</code> Added tags for new emotes.</li>
				<li><code>Misc.</code> Corrected BPM link on options page.</li>
			</ul>
		</li>
		<li>
			<h2>2.10.2</h2>
			<ul>
				<li><code>Misc.</code> Minor code changes to pass the Firefox validation process without review. Firefox add-on is now signed. <em>(Also a tip for fellow Firefox add-on developers: Don't switch from cfx to jpm. I tried, nothing worked and I got angry, and after a few hours switched back to cfx.)</em></li>
			</ul>
		</li>
		<li>
			<h2>2.10.1</h2>
			<ul>
				<li><code>Misc.</code> Added tags for new emotes.</li>
			</ul>
		</li>
		<li>
			<h2>2.10</h2>
			<ul>
				<li><code>Misc.</code> Added support for new emote table F.</li>
				<li><code>Misc.</code> Using JSHint now for code improvements and followed some of its advice.</li>
			</ul>
		</li>
		<li>
			<h2>2.9.6</h2>
			<ul>
				<li><code>Bugfix</code> Inserting an emote deletes most of the textarea text. (Bug introduced in 2.9.5.)</li>
			</ul>
		</li>
		<li>
			<h2>2.9.5</h2>
			<ul>
				<li><code>Bugfix</code> Lists vanishing until reload if dropped onto an emote or an emote dropped onto the list.</li>
				<li><code>Bugfix</code> Lists vanishing until reload if dropped onto itself.</li>
				<li><code>Bugfix</code> Lists with quotation marks not being removed from selection fields when deleted (until reload).</li>
				<li><code>Misc.</code> Added new emotes for fresh installs and tags for the search.</li>
			</ul>
		</li>
		<li>
			<h2>2.9.4</h2>
			<ul>
				<li><code>Misc.</code> Use HTTP<strong>S</strong>.</li>
			</ul>
		</li>
		<li>
			<h2>2.9.3</h2>
			<ul>
				<li><code>Bugfix</code> Reverse emotes not working due to changes to the subreddit CSS. Yes, again.</li>
			</ul>
		</li>
		<li>
			<h2>2.9.2</h2>
			<ul>
				<li><code>Bugfix</code> Reverse emotes not working due to changes to the subreddit CSS.</li>
			</ul>
		</li>
		<li>
			<h2>2.9.1</h2>
			<ul>
				<li><code>Bugfix</code> MLE not working in Chrome/Chromium/Opera 15+ when browsing http<strong>s</strong>://reddit.com.</li>
				<li><code>Bugfix</code> URLs in revealed title text not being converted to links if they are at the beginning of the text. Also added an option to enable/disable URL converting.</li>
			</ul>
		</li>
		<li>
			<h2>2.9</h2>
			<ul>
				<li><code>Bugfix/Feature</code> RES live preview now shows revealed title text of emotes and unknown emotes (depending on your settings of course).</li>
				<li><code>Bugfix</code> Emote updates deleting default emotes because of a bad response.</li>
				<li><code>Bugfix</code> Reduced false positive rate of emotes being treated as unknown emotes.</li>
				<li><code>Misc.</code> MLE is now on the Chrome Web Store, because Chrome (stable) now blocks all non-store extensions on Windows.</li>
				<li><code>Misc.</code> Chrome now sends an adjusted User-Agent header in XMLHttpRequests of the extension (has always been like this for Firefox and Opera).</li>
			</ul>
		</li>
		<li>
			<h2>2.8.6</h2>
			<ul>
				<li><code>Misc.</code> Added new emotes for fresh installs and tags for the search.</li>
			</ul>
		</li>
		<li>
			<h2>2.8.5</h2>
			<ul>
				<li><code>Bugfix</code> Emotes not being automatically added if in the CSS their table code isn't mentioned before their alternate names. That fix was quite a piece of work, I tell ya.</li>
				<li><code>Misc.</code> Added new emotes for fresh installs and tags for the search.</li>
			</ul>
		</li>
		<li>
			<h2>2.8.4</h2>
			<ul>
				<li><code>Bugfix</code> Remember that mentioned bugfix of 2.8-2.8.3? That fix contained a bug.</li>
			</ul>
		</li>
		<li>
			<h2>2.8.3</h2>
			<ul>
				<li><code>Bugifx</code> Mentioned bugfix of 2.8 not being fixed in Chrome and Opera.</li>
				<li><code>Bugfix</code> Automatic emote update breaking the feature to display emotes outside of their subreddit.</li>
			</ul>
		</li>
		<li>
			<h2>2.8</h2>
			<ul>
				<li><code>Feature</code> URLs and Markdown link code in revealed title text are now converted to actual links.</li>
				<li><code>Feature</code> Can now be installed on Firefox Mobile. However, I didn't make any adjustments, so it is really terrible. Updating emotes or displaying emotes outside of their subreddit doesn't work either (this is unrelated to the following bugfix).</li>
				<li><code>Bugfix</code> Emote update by loading the subreddit CSS failing. Also affected the display of emotes outside of their subreddit in some cases.</li>
				<li><code>Misc.</code> If using the “forced stylesheet update” there is now a little message after the process has finished.</li>
				<li><code>Misc.</code> Wrote more about tag search under “Manage”.</li>
			</ul>
		</li>
		<li>
			<h2>2.7</h2>
			<ul>
				<li><code>Bugfix</code> Adjust emotes from the MLPLounge in /r/friends/comments as well.</li>
				<li><code>Bugfix</code> Scroll stop not working in Firefox.</li>
				<li><code>Bugfix</code> Emotes that start with "/s" not having their title text revealed. (Of course "/spoiler" and "/s" will still not be revealed.)</li>
				<li><code>Bugfix</code> In Firefox, if box alignment is to the right, moving the box results in a little jump in position upon release. <em>This still isn't fixed.</em> But the position before the little jump will be the saved one, so reloading the page will show the wanted position. If you want pixel perfect settings, you will have to use the options page.</li>
			</ul>
		</li>
		<li>
			<h2>2.6</h2>
			<ul>
				<li><code>Bugfix</code> Reveal unknown emotes and title text in RES live preview as well.</li>
				<li><code>Bugfix</code> Don't reveal title text if it is emote info put there by BPM.</li>
				<li><code>Bugfix</code> Don't reveal title text of out-of-sub spoiler tag <code>/s</code>.</li>
			</ul>
		</li>
		<li>
			<h2>2.5</h2>
			<ul>
				<li><code>Feature</code> Grab the window in the bottom left or bottom right area to resize it.</li>
				<li><code>Feature</code> Added option for the key to press to insert an emote reversed.</li>
				<li><code>Bugfix</code> Emotes with "r" prefix for reversing or flags like "-r" as suffix could be added to lists. Flags are now removed first.</li>
				<li><code>Bugfix</code> If "show title" option activated, even titles of spoilers were revealed.</li>
				<li><code>Bugfix</code> Some links on the reddit wiki page being treated as emotes.</li>
			</ul>
		</li>
		<li>
			<h2>2.4</h2>
			<ul>
				<li><code>Feature</code> Show hidden title text of emotes.</li>
				<li><code>Feature</code> Reveal unknown emotes.</li>
				<li><code>Feature</code> Option to <em>not</em> group search results by list.</li>
				<li><code>Feature</code> Stop following of emote links.</li>
				<li><code>Feature</code> Added styling options for the context menu.</li>
				<li><code>Bugfix</code> Time of last stylesheet check showing wrong day.</li>
				<li><code>Bugfix</code> Use "r" as prefix to reverse emotes from the default lists, but "-r" as suffix for other emotes. Hold [Ctrl] and click an emote to insert it reversed.</li>
				<li><code>Bugfix</code> Tab sync broken in Opera in some cases.</li>
				<li><code>Misc.</code> Added warning for Plounge list while being on r/mylittlepony, that these emotes cannot be seen by users without the script.</li>
				<li><code>Misc.</code> More pony tags for the search.</li>
			</ul>
		</li>
		<li>
			<h2>2.3</h2>
			<ul>
				<li><code>Feature</code> Display emotes of r/mylittlepony and r/MLPLounge outside of their subreddit.</li>
				<li><code>Feature</code> Auto-updating lists with the emotes of r/mylittlepony and r/MLPLounge.</li>
				<li><code>Feature</code> Emote search (modes: normal, regex, alt, tag).</li>
				<li><code>Feature</code> The context menu for saving emotes now works in the BPM window as well.</li>
				<li><code>Bugfix</code> Scrolling to an end inside the MLE window causing the main window to continue the scrolling.</li>
			</ul>
		</li>
		<li>
			<h2>2.2</h2>
			<ul>
				<li><code>Feature</code> You can now grab and move the MLE window.</li>
				<li><code>Feature</code> Changes in one window/tab will be applied in all the others as well, no page reload required.</li>
				<li><code>Bugfix</code> When using MLE in <em>button</em> mode, emotes cannot be click-inserted into textareas.</li>
				<li><code>Bugfix</code> After renaming a list, the list cannot be renamed or drag&amp;dropped until a page reload.</li>
				<li><code>Bugfix</code> Emote counter under list name not being updated until page reload.</li>
				<li><code>Bugfix</code> Moving an emote to the list it already is in removes the emote.</li>
			</ul>
		</li>
		<li>
			<h2>2.1.1</h2>
			<ul>
				<li><code>Feature</code> New option <em>Page integration</em> to use buttons instead of having an always-on-top float.</li>
				<li><code>Bugfix</code> Confused scrollbar position ltr/rtl.</li>
				<li><code>Bugfix</code> Not more than one option change being saved without reload of options page.</li>
				<li><code>Bugfix</code> New config options polluting the storage and not being added to the config.</li>
			</ul>
		</li>
		<li>
			<h2>2.0.1</h2>
			<ul>
				<li><code>Bugfix</code> Mail icon is seen as emote.</li>
				<li><code>Bugfix</code> Lists with a white space in their name cannot be reordered and produce a duplicate instead.</li>
			</ul>
		</li>
		<li>
			<h2>2.0</h2>
			Initial release. (Version 1 was a plain userscript.)
		</li>
	</ul>
</section>

</body>
</html>