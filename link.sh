#!/bin/bash

BASEDIR=$(dirname "$0")
TARGETS="$BASEDIR/common resources"


# Checking out a branch will kill all links between files/directories.
# Run this script to fix them.


# Check if target files exist

if [ ! -f "$TARGETS/background.js" ]; then
	echo " ! Missing target file: $TARGETS/background.js"
	exit
fi

if [ ! -f "$TARGETS/mle-codes.js" ]; then
	echo " ! Missing target file: $TARGETS/mle-codes.js"
	exit
fi

if [ ! -f "$TARGETS/my-little-emotebox.js" ]; then
	echo " ! Missing target file: $TARGETS/my-little-emotebox.js"
	exit
fi

if [ ! -f "$TARGETS/options-bootstrap.js" ]; then
	echo " ! Missing target file: $TARGETS/options-bootstrap.js"
	exit
fi

if [ ! -f "$TARGETS/options.css" ]; then
	echo " ! Missing target file: $TARGETS/options.css"
	exit
fi

if [ ! -f "$TARGETS/options.html" ]; then
	echo " ! Missing target file: $TARGETS/options.html"
	exit
fi

if [ ! -f "$TARGETS/options.js" ]; then
	echo " ! Missing target file: $TARGETS/options.js"
	exit
fi

if [ ! -f "$TARGETS/img/MLE_128.png" ]; then
	echo " ! Missing target file: $TARGETS/img/MLE_128.png"
	exit
fi

if [ ! -f "$TARGETS/img/MLE_16.png" ]; then
	echo " ! Missing target file: $TARGETS/img/MLE_16.png"
	exit
fi

if [ ! -f "$TARGETS/img/MLE_32.png" ]; then
	echo " ! Missing target file: $TARGETS/img/MLE_32.png"
	exit
fi

if [ ! -f "$TARGETS/img/MLE_48.png" ]; then
	echo " ! Missing target file: $TARGETS/img/MLE_48.png"
	exit
fi

if [ ! -f "$TARGETS/img/MLE_64.png" ]; then
	echo " ! Missing target file: $TARGETS/img/MLE_64.png"
	exit
fi


# Linking

# Chrome
ln -f "$TARGETS/background.js" "$BASEDIR/Chrome/scripts/background.js"
ln -f "$TARGETS/mle-codes.js" "$BASEDIR/Chrome/includes/mle-codes.js"
ln -f "$TARGETS/my-little-emotebox.js" "$BASEDIR/Chrome/includes/my-little-emotebox.js"
ln -f "$TARGETS/options.css" "$BASEDIR/Chrome/options.css"
ln -f "$TARGETS/options.html" "$BASEDIR/Chrome/options.html"
ln -f "$TARGETS/options-bootstrap.js" "$BASEDIR/Chrome/scripts/options-bootstrap.js"
ln -f "$TARGETS/options.js" "$BASEDIR/Chrome/scripts/options.js"
ln -f "$TARGETS/img/MLE_128.png" "$BASEDIR/Chrome/icons/MLE_128.png"
ln -f "$TARGETS/img/MLE_16.png" "$BASEDIR/Chrome/icons/MLE_16.png"
ln -f "$TARGETS/img/MLE_48.png" "$BASEDIR/Chrome/icons/MLE_48.png"
echo ' - Done linking Chrome.'

# Firefox WebExt
ln -f "$TARGETS/background.js" "$BASEDIR/Firefox_WebExt/scripts/background.js"
ln -f "$TARGETS/mle-codes.js" "$BASEDIR/Firefox_WebExt/includes/mle-codes.js"
ln -f "$TARGETS/my-little-emotebox.js" "$BASEDIR/Firefox_WebExt/includes/my-little-emotebox.js"
ln -f "$TARGETS/options.css" "$BASEDIR/Firefox_WebExt/options.css"
ln -f "$TARGETS/options.html" "$BASEDIR/Firefox_WebExt/options.html"
ln -f "$TARGETS/options-bootstrap.js" "$BASEDIR/Firefox_WebExt/scripts/options-bootstrap.js"
ln -f "$TARGETS/options.js" "$BASEDIR/Firefox_WebExt/scripts/options.js"
ln -f "$TARGETS/img/MLE_128.png" "$BASEDIR/Firefox_WebExt/icons/MLE_128.png"
ln -f "$TARGETS/img/MLE_16.png" "$BASEDIR/Firefox_WebExt/icons/MLE_16.png"
ln -f "$TARGETS/img/MLE_48.png" "$BASEDIR/Firefox_WebExt/icons/MLE_48.png"
echo ' - Done linking Firefox (WebExt).'

echo ' All done.'

# To check for correct linking you can first look up the inode ID of a file
# with "ls -i" and then search for it with "find .. -inum <inum>".