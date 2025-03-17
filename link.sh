#!/bin/bash

BASEDIR=$(dirname "$0")
SOURCE="$BASEDIR/all"

# Chrome
mkdir -p "$BASEDIR/chrome/icons"
mkdir -p "$BASEDIR/chrome/includes"
ln -f "$SOURCE/mle-codes.js" "$BASEDIR/chrome/includes/mle-codes.js"
ln -f "$SOURCE/my-little-emotebox.js" "$BASEDIR/chrome/includes/my-little-emotebox.js"
ln -f "$SOURCE/options.css" "$BASEDIR/chrome/options.css"
ln -f "$SOURCE/options.html" "$BASEDIR/chrome/options.html"
ln -f "$SOURCE/options.js" "$BASEDIR/chrome/scripts/options.js"
ln -f "$SOURCE/icons/MLE_16.png" "$BASEDIR/chrome/icons/MLE_16.png"
ln -f "$SOURCE/icons/MLE_48.png" "$BASEDIR/chrome/icons/MLE_48.png"
ln -f "$SOURCE/icons/MLE_128.png" "$BASEDIR/chrome/icons/MLE_128.png"
echo ' - Done linking for Chrome.'

# Firefox
mkdir -p "$BASEDIR/firefox/icons"
mkdir -p "$BASEDIR/firefox/includes"
ln -f "$SOURCE/mle-codes.js" "$BASEDIR/firefox/includes/mle-codes.js"
ln -f "$SOURCE/my-little-emotebox.js" "$BASEDIR/firefox/includes/my-little-emotebox.js"
ln -f "$SOURCE/options.css" "$BASEDIR/firefox/options.css"
ln -f "$SOURCE/options.html" "$BASEDIR/firefox/options.html"
ln -f "$SOURCE/options.js" "$BASEDIR/firefox/scripts/options.js"
ln -f "$SOURCE/icons/MLE_16.png" "$BASEDIR/firefox/icons/MLE_16.png"
ln -f "$SOURCE/icons/MLE_48.png" "$BASEDIR/firefox/icons/MLE_48.png"
ln -f "$SOURCE/icons/MLE_128.png" "$BASEDIR/firefox/icons/MLE_128.png"
echo ' - Done linking for Firefox.'

echo ' All done.'

# To check for correct linking you can first look up the inode ID of a file
# with "ls -i" and then search for it with "find .. -inum <inum>".
