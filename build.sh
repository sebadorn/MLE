#!/usr/bin/env bash

CHROME='google-chrome'

if [ ! "$(command -v $CHROME)" ]; then
	CHROME='chromium'
fi

PROJECT_URL="https://sebadorn.de/mlp/mle"
ABSOLUTE_PATH="/home/$USER/programming/My Little Emotebox"

BROWSER="$1"
VERSION="$2"

cd $(dirname "$0")


function set_version_and_url {
	sed -i "s;%MLE_VERSION%;$VERSION;g" "$1"
	sed -i "s;%MLE_URL%;$PROJECT_URL;g" "$1"
}


function build_chrome {
	OUT_DIR='build/chrome'

	if [ -d "$OUT_DIR" ]; then
		rm -r "$OUT_DIR"
	fi

	mkdir -p "$OUT_DIR"
	cp 'chrome/manifest.json' 'manifest_tmp.json'

	set_version_and_url 'chrome/manifest.json'
	$CHROME \
		--pack-extension="$ABSOLUTE_PATH/chrome/" \
		--pack-extension-key="$ABSOLUTE_PATH/chrome-private-key-mle.pem"

	mv 'manifest_tmp.json' 'chrome/manifest.json'
	mv 'chrome.crx' "$OUT_DIR/mle.crx"
	cp 'server/updates-chrome-template.xml' "$OUT_DIR/updates-chrome.xml"

	set_version_and_url "$OUT_DIR/updates-chrome.xml"
}


function build_chrome_store {
	OUT_DIR='build/chrome_store'

	if [ -d "$OUT_DIR" ]; then
		rm -r "$OUT_DIR"
	fi

	mkdir -p "$OUT_DIR"
	cd 'chrome/'
	cp 'manifest.json' '../manifest_tmp.json'

	set_version_and_url 'manifest.json'
	sed -i 's/\t"update_url".*//g' 'manifest.json'
	zip -r "../$OUT_DIR/mle-chrome.zip" *

	mv '../manifest_tmp.json' 'manifest.json'
	cd '..'
}


function build_firefox {
	OUT_DIR='build/firefox'

	if [ -d "$OUT_DIR" ]; then
		rm -r "$OUT_DIR"
	fi

	mkdir -p "$OUT_DIR"

	cd 'firefox/'
	cp 'manifest.json' '../manifest_tmp.json'

	set_version_and_url 'manifest.json'
	zip -r -FS "../$OUT_DIR/mle-ff-webext.zip" *

	mv '../manifest_tmp.json' 'manifest.json'
	cp '../server/updates-firefox-template.json' "../$OUT_DIR/updates-firefox.json"
	set_version_and_url "../$OUT_DIR/updates-firefox.json"
}


function build_page {
	cd 'server/'
	rm 'mle.js'
	cp 'mle-template.js' 'mle.js'
	set_version_and_url 'mle.js'
	cd '../'
}


if [ $# -lt 2 ]; then
	echo 'Not enough arguments provided.'
	echo 'First argument: all | chrome | chrome_store | firefox | page'
	echo 'Second argument: version'
	exit
fi


if [ "$BROWSER" == 'all' ]; then
	build_chrome
	build_chrome_store
	build_firefox
elif [ "$BROWSER" == 'chrome' ]; then
	build_chrome
elif [ "$BROWSER" == 'chrome_store' ]; then
	build_chrome_store
elif [ "$BROWSER" == 'firefox' ]; then
	build_firefox
elif [ "$BROWSER" == 'page' ]; then
	build_page
fi

echo ' ---------- ---------- ---------- '
echo ' Done.'
