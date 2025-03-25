# Changelog


## 2.12.0 (WIP)

* `Misc` Add-on is now using Manifest V3.
* `Misc` Removed more permissions.
* `Misc` Cleaned up code for CSS updater.


## 2.11.1 (2025-03-22)

Same as 2.11.0. Had to create a new version in order to migrate to hosting on the [Firefox Add-On page](https://addons.mozilla.org/firefox/addon/my-little-emotebox/) (AMO).


## 2.11.0 (2025-03-22)

For now there will only be an update for Firefox. For Chrome the addon has to be moved to manifest v3, which requires some additional work.

* `Feature` Support the new Reddit UI (*Limitations:* Emotes cannot be automatically inserted into the comment editor, and the "Open MLE" button is only added to the top-level comment editor.)
* `Feature` Showing the emote code in the top bar of the MLE window so it can be copied. Especially relevant for use in the new Reddit UI where automatically inserting the code does not work.
* `Feature` Added new emotes of G table and support for new H table.
* `Fix` Make sure the subreddit custom CSS with the emotes is loaded from old.reddit.com.
* `Misc` Uploaded the new version to Mozilla to have it re-signed so it becomes available again.
* `Misc` Changed options page to a darker style.
* `Misc` Removed unused permission "contextMenus".
* `Misc` Cleaned up code, improved some minor details, removed support for Opera and legacy Firefox add-on format.


## 2.10.10 (2017-08-18)

* `Misc` Firefox extension is now a WebExtension. **Important: All settings, lists and saved emotes will be lost after the update. Create a backup before updating.**
* `Fix` Fixed CSS URL retrieval from subreddit.


## 2.10.9 (2016-09-30)

* `Fix` Some missing G table integration.


## 2.10.7

* `Misc` Added tags for new emotes.


## 2.10.6 (2016-05-21)

* `Misc` Added new G table.
* `Misc` Added tags for new emotes.


## 2.10.5 (2015-12-19)

* `Misc` Switched to HTTPS for addon update checks. (Thanks, [Let's Encrypt](https://letsencrypt.org/)!)
* `Misc` Moved from cfx to [jpm](https://developer.mozilla.org/en-US/Add-ons/SDK/Tools/jpm) including automated signing. (Remember my angry rant for version 2.10.2? Well, jpm got a lot better.)
* `Misc` Added tags for new emotes.


## 2.10.4

* `Misc` Added tags for new emotes.


## 2.10.3

* `Fix` When processing the CSS of r/mlplounge, ignore `/pl00` etc. because the emotes would be duplicated.
* `Misc` Added tags for new emotes.
* `Misc` Corrected BPM link on options page.


## 2.10.2

* `Misc` Minor code changes to pass the Firefox validation process without review. Firefox add-on is now signed. *(Also a tip for fellow Firefox add-on developers: Don't switch from cfx to jpm. I tried, nothing worked and I got angry, and after a few hours switched back to cfx.)*


## 2.10.1

* `Misc` Added tags for new emotes.


## 2.10

* `Misc` Added support for new emote table F.
* `Misc` Using JSHint now for code improvements and followed some of its advice.


## 2.9.6

* `Fix` Inserting an emote deletes most of the textarea text. (Bug introduced in 2.9.5.)


## 2.9.5

* `Fix` Lists vanishing until reload if dropped onto an emote or an emote dropped onto the list.
* `Fix` Lists vanishing until reload if dropped onto itself.
* `Fix` Lists with quotation marks not being removed from selection fields when deleted (until reload).
* `Misc` Added new emotes for fresh installs and tags for the search.


## 2.9.4

* `Misc` Use HTTP**S**.


## 2.9.3

* `Fix` Reverse emotes not working due to changes to the subreddit CSS. Yes, again.


## 2.9.2

* `Fix` Reverse emotes not working due to changes to the subreddit CSS.


## 2.9.1

* `Fix` MLE not working in Chrome/Chromium/Opera 15+ when browsing "http**s**://reddit.com".
* `Fix` URLs in revealed title text not being converted to links if they are at the beginning of the text. Also added an option to enable/disable URL converting.


## 2.9

* `Fix/Feature` RES live preview now shows revealed title text of emotes and unknown emotes (depending on your settings of course).
* `Fix` Emote updates deleting default emotes because of a bad response.
* `Fix` Reduced false positive rate of emotes being treated as unknown emotes.
* `Misc` MLE is now on the Chrome Web Store, because Chrome (stable) now blocks all non-store extensions on Windows.
* `Misc` Chrome now sends an adjusted User-Agent header in XMLHttpRequests of the extension (has always been like this for Firefox and Opera).


## 2.8.6

* `Misc` Added new emotes for fresh installs and tags for the search.


## 2.8.5

* `Fix` Emotes not being automatically added if in the CSS their table code isn't mentioned before their alternate names. That fix was quite a piece of work, I tell ya.
* `Misc` Added new emotes for fresh installs and tags for the search.


## 2.8.4

* `Fix` Remember that mentioned bugfix of 2.8-2.8.3? That fix contained a bug.


## 2.8.3

* `Fix` Mentioned bugfix of 2.8 not being fixed in Chrome and Opera.
* `Fix` Automatic emote update breaking the feature to display emotes outside of their subreddit.


## 2.8

* `Feature` URLs and Markdown link code in revealed title text are now converted to actual links.
* `Feature` Can now be installed on Firefox Mobile. However, I didn't make any adjustments, so it is really terrible. Updating emotes or displaying emotes outside of their subreddit doesn't work either (this is unrelated to the following bugfix).
* `Fix` Emote update by loading the subreddit CSS failing. Also affected the display of emotes outside of their subreddit in some cases.
* `Misc` If using the “forced stylesheet update” there is now a little message after the process has finished.
* `Misc` Wrote more about tag search under “Manage”.


## 2.7

* `Fix` Adjust emotes from the MLPLounge in "/r/friends/comments" as well.
* `Fix` Scroll stop not working in Firefox.
* `Fix` Emotes that start with `/s` not having their title text revealed. (Of course `/spoiler` and `/s` will still not be revealed.)
* `Fix` In Firefox, if box alignment is to the right, moving the box results in a little jump in position upon release. *This still isn't fixed.* But the position before the little jump will be the saved one, so reloading the page will show the wanted position. If you want pixel perfect settings, you will have to use the options page.


## 2.6

* `Fix` Reveal unknown emotes and title text in RES live preview as well.
* `Fix` Don't reveal title text if it is emote info put there by BPM.
* `Fix` Don't reveal title text of out-of-sub spoiler tag `/s`.


## 2.5

* `Feature` Grab the window in the bottom left or bottom right area to resize it.
* `Feature` Added option for the key to press to insert an emote reversed.
* `Fix` Emotes with `r` prefix for reversing or flags like `-r` as suffix could be added to lists. Flags are now removed first.
* `Fix` If "show title" option activated, even titles of spoilers were revealed.
* `Fix` Some links on the reddit wiki page being treated as emotes.


## 2.4

* `Feature` Show hidden title text of emotes.
* `Feature` Reveal unknown emotes.
* `Feature` Option to *not* group search results by list.
* `Feature` Stop following of emote links.
* `Feature` Added styling options for the context menu.
* `Fix` Time of last stylesheet check showing wrong day.
* `Fix` Use `r` as prefix to reverse emotes from the default lists, but `-r` as suffix for other emotes. Hold \[Ctrl\] and click an emote to insert it reversed.
* `Fix` Tab sync broken in Opera in some cases.
* `Misc` Added warning for Plounge list while being on r/mylittlepony, that these emotes cannot be seen by users without the script.
* `Misc` More pony tags for the search.


## 2.3

* `Feature` Display emotes of "r/mylittlepony" and "r/MLPLounge" outside of their subreddit.
* `Feature` Auto-updating lists with the emotes of "r/mylittlepony" and "r/MLPLounge".
* `Feature` Emote search (modes: normal, regex, alt, tag).
* `Feature` The context menu for saving emotes now works in the BPM window as well.
* `Fix` Scrolling to an end inside the MLE window causing the main window to continue the scrolling.


## 2.2

* `Feature` You can now grab and move the MLE window.
* `Feature` Changes in one window/tab will be applied in all the others as well, no page reload required.
* `Fix` When using MLE in *button* mode, emotes cannot be click-inserted into textareas.
* `Fix` After renaming a list, the list cannot be renamed or drag&amp;dropped until a page reload.
* `Fix` Emote counter under list name not being updated until page reload.
* `Fix` Moving an emote to the list it already is in removes the emote.


## 2.1.1

* `Feature` New option *Page integration* to use buttons instead of having an always-on-top float.
* `Fix` Confused scrollbar position ltr/rtl.
* `Fix` Not more than one option change being saved without reload of options page.
* `Fix` New config options polluting the storage and not being added to the config.


## 2.0.1

* `Fix` Mail icon is seen as emote.
* `Fix` Lists with a white space in their name cannot be reordered and produce a duplicate instead.


## 2.0

* Initial release. (Version 1 was a plain userscript.)
