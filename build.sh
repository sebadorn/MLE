#!/usr/bin/env bash

MCCOY="/home/$USER/.mccoy/mccoy"
CHROME="google-chrome"

FF_MLE_ID="mle@sebadorn.de"
FF_MIN="38.0a1"
FF_MAX="48.*"

PROJECT_URL="https://sebadorn.de/mlp/mle"
ABSOLUTE_PATH="/home/$USER/programming/My Little Emotebox"

BROWSER="$1"
VERSION="$2"

export LD_LIBRARY_PATH="/home/$USER/.mccoy/xulrunner/"

cd $(dirname "$0")


function set_version_and_url {
	sed -i "s;%MLE_VERSION%;$VERSION;g" "$1"
	sed -i "s;%MLE_URL%;$PROJECT_URL;g" "$1"
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
	$CHROME --pack-extension="$ABSOLUTE_PATH/Chrome/" --pack-extension-key="$ABSOLUTE_PATH/build/chrome-private-key-mle.pem"

	mv manifest_tmp.json Chrome/manifest.json
	mv Chrome.crx build/mle.crx
	cp server/updates-chrome-template.xml build/updates-chrome.xml

	set_version_and_url build/updates-chrome.xml
}


function build_chrome_store {
	cd Chrome/
	cp manifest.json ../manifest_tmp.json

	set_version_and_url manifest.json
	sed -i "s/\t\"update_url\".*//g" manifest.json
	zip -r ../build/mle-chrome.zip *

	mv ../manifest_tmp.json manifest.json
	cd ../
}


function build_firefox {
	cd Firefox/
	cp package.json ../package_tmp.json

	local FF_API_USER=$(cat ../build/ff-sign-api-user.txt)
	local FF_API_KEY=$(cat ../build/ff-sign-api-key.txt)

	sed -i "s;%FF_MAX%;$FF_MAX;g" package.json
	set_version_and_url package.json

	jpm xpi
	jpm sign --api-key ${FF_API_USER} --api-secret ${FF_API_KEY}

	if [ -e "mle@sebadorn.de-${VERSION}.xpi" ]; then
		mv "mle@sebadorn.de-${VERSION}.xpi" '../build/mle.xpi'
		rm "${FF_MLE_ID}-${VERSION}.update.rdf"
	elif [ -e "my_little_emotebox-${VERSION}-fx+an.xpi" ]; then
		mv "my_little_emotebox-${VERSION}-fx+an.xpi" '../build/mle.xpi'
		rm "${FF_MLE_ID}-${VERSION}.update.rdf"
	elif [ -e "my_little_emotebox-${VERSION}-an+fx.xpi" ]; then
		mv "my_little_emotebox-${VERSION}-an+fx.xpi" '../build/mle.xpi'
		rm "${FF_MLE_ID}-${VERSION}.update.rdf"
	fi

	mv ../package_tmp.json package.json
	cd ../

	# Add updateHash to update.rdf and sign it for old
	# installs that don't use the HTTPS updateLink.
	local XPI_HASH=$(sha256sum build/mle.xpi | sed "s/ .*//g" -)

	# Sign update RDF
	cp "server/updates-firefox-template.rdf" "build/updates-firefox.rdf"
	sed -i "s;%FF_MLE_ID%;$FF_MLE_ID;g" "build/updates-firefox.rdf"
	sed -i "s;%FF_MIN%;$FF_MIN;g" "build/updates-firefox.rdf"
	sed -i "s;%FF_MAX%;$FF_MAX;g" "build/updates-firefox.rdf"
	sed -i "s;%XPI_HASH%;sha256:$XPI_HASH;g" "build/updates-firefox.rdf"
	set_version_and_url "build/updates-firefox.rdf"

	$MCCOY -signRDF "build/updates-firefox.rdf" -key "My Little Emotebox"

	# Replace XPI hash in mle.js
	build_page
}


function build_page {
	local XPI_HASH=$(sha256sum build/mle.xpi | sed "s/ .*//g" -)

	cd server/
	cp "mle-template.js" mle.js
	sed -i "s;%XPI_HASH%;sha256:${XPI_HASH};g" mle.js
	set_version_and_url mle.js
	cd ../
}


if [ $# -ge 1 ] && [ "$1" == "clean" ]; then
	cd build
	rm mle.xpi "mle-unsigned.xpi" mle.crx mle.oex updates-*.xml updates-*.rdf
	cd ../
	exit
fi

if [ $# -lt 2 ]; then
	echo "Not enough arguments provided."
	echo "First argument: all | opera | chrome | chrome_store | firefox | page | clean"
	echo "Second argument: version"
	exit
fi


if [ "$BROWSER" == "all" ]; then
	build_opera
	build_chrome
	build_chrome_store
	build_firefox
elif [ "$BROWSER" == "opera" ]; then
	build_opera
elif [ "$BROWSER" == "chrome" ]; then
	build_chrome
elif [ "$BROWSER" == "chrome_store" ]; then
	build_chrome_store
elif [ "$BROWSER" == "firefox" ]; then
	build_firefox
elif [ "$BROWSER" == "page" ]; then
	build_page
fi

echo " ---------- ---------- ---------- "
echo " Done."
