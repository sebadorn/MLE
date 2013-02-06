#!/bin/bash

CFX=~/.firefox-addon-sdk-1.13.1/bin/cfx
MCCOY=~/.mccoy/mccoy
CHROME=google-chrome

PROJECT_URL="http://sebadorn.de/mlp/mle"


function set_version_and_url {
	sed -i "s;%MLE_VERSION%;$VERSION;g" $1
	sed -i "s;%MLE_URL%;$PROJECT_URL;g" $1
}


function build_opera {
	cd Opera/
	cp config.xml ../config_tmp.xml

	set_version_and_url config.xml
	zip -r ../build/mle.oex *

	mv ../config_tmp.xml config.xml
	cd ../
	cp server/updates-opera-template.xml build/updates-opera.xml

	set_version_and_url build/updates-opera.xml
}


function build_chrome {
	cp Chrome/manifest.json manifest_tmp.json

	set_version_and_url Chrome/manifest.json
	$CHROME --pack-extension=Chrome/ --pack-extension-key=build/chrome-private-key-mle.pem

	mv manifest_tmp.json Chrome/manifest.json
	mv Chrome.crx build/mle.crx
	cp server/updates-chrome-template.xml build/updates-chrome.xml

	set_version_and_url build/updates-chrome.xml
}


function build_firefox {
	cd Firefox/
	cp package.json ../package_tmp.json

	# Generate addon install file (XPI)
	set_version_and_url package.json
	$CFX xpi --update-url $PROJECT_URL/updates-firefox.rdf

	# Insert our public key into the generated install.rdf
	unzip mle.xpi install.rdf
	$MCCOY -installRDF install.rdf -key "My Little Emotebox"
	zip -f mle.xpi install.rdf
	rm install.rdf

	# Clean up
	mv ../package_tmp.json package.json
	mv mle.xpi ../build/mle.xpi
	cd ../

	# Generate update RDF
	cp server/updates-firefox-template.rdf build/updates-firefox.rdf
	local XPI_HASH=$(sha256sum build/mle.xpi | sed "s/ .*//g" -)
	sed -i "s;%XPI_HASH%;sha256:$XPI_HASH;g" build/updates-firefox.rdf
	set_version_and_url build/updates-firefox.rdf

	# Sign update RDF
	$MCCOY -signRDF build/updates-firefox.rdf -key "My Little Emotebox"
	# $MCCOY -verifyRDF build/updates-firefox.rdf -key "My Little Emotebox"
}


function hint_firefox {
	echo " ---------- ---------- ---------- "
	echo "Maybe you have to change min/maxVersion in updates-firefox-template.rdf."
	echo "See: .firefox-addon-sdk-1.13.1/app-extension/install.rdf (also check for updates)"
	echo "Current Firefox: $(firefox -v)"
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
	hint_firefox
elif [ $BROWSER == "opera" ]; then
	build_opera
elif [ $BROWSER == "chrome" ]; then
	build_chrome
elif [ $BROWSER == "firefox" ]; then
	build_firefox
	hint_firefox
fi

echo " ---------- ---------- ---------- "
