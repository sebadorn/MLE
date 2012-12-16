#!/bin/bash

CFX=~/.firefox-addon-sdk-1.11/bin/cfx
ZIP=zip
CHROME=google-chrome

PROJECT_URL="http://sebadorn.de/mlp/mle"
PROJECT_URL_ESC="http:\/\/sebadorn\.de\/mlp\/mle"


function build_update_file {
	sed -i "s/%MLE_VERSION%/$VERSION/g" build/$1
	sed -i "s/%MLE_URL%/$PROJECT_URL_ESC/g" build/$1
}

function build_opera {
	$ZIP -r build/mle.oex Opera/
	cp server/updates-opera-template.xml build/updates-opera.xml
	build_update_file updates-opera.xml
}

function build_chrome {
	$CHROME --pack-extension=Chrome/ --pack-extension-key=build/chrome-private-key-mle.pem
	mv Chrome.crx build/mle.crx
	cp server/updates-chrome-template.xml build/updates-chrome.xml
	build_update_file updates-chrome.xml
}

function build_firefox {
	cd Firefox/
	$CFX xpi --update-url $PROJECT_URL/updates-firefox.rdf
	mv mle.xpi ../build/mle.xpi
	cd ../
	cp server/updates-firefox-template.rdf build/updates-firefox.rdf
	build_update_file updates-firefox.rdf
}


if [ $# -ge 1 ] && [ $1 == "clean" ]; then
	cd build
	rm mle.xpi mle.crx mle.oex updates-*.xml updates-*.rdf
	cd ../
	exit
fi

if [ $# -lt 2 ]; then
	echo "Not enough arguments provided."
	echo "First argument: all | opera | chrome | firefox | clean"
	echo "Second argument: version"
	exit
fi

BROWSER=$1
VERSION=$2

if [ $BROWSER == "all" ]; then
	build_opera
	build_chrome
	build_firefox
elif [ $BROWSER == "opera" ]; then
	build_opera
elif [ $BROWSER == "chrome" ]; then
	build_chrome
elif [ $BROWSER == "firefox" ]; then
	build_firefox
fi