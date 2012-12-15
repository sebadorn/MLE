#!/bin/bash

CFX=~/.firefox-addon-sdk-1.11/bin/cfx
PROJECT_URL=http://sebadorn.de/mlp/mle/


function build_opera {
	cd Opera/
	cd ../
}

function build_chrome {
	cd Chrome/
	cd ../
}

function build_firefox {
	cd Firefox/
	$CFX xpi --update-url $PROJECT_URL
	mv mle.xpi ../mle.xpi
	cd ../
}


if [ $# == 0 ]
then
	build_opera
	build_chrome
	build_firefox

elif [ $1 == "opera" ]
then
	build_opera

elif [ $1 == "chrome" ]
then
	build_chrome

elif [ $1 == "firefox" ]
then
	build_firefox

elif [ $1 == "clean" ]
then
	rm mle.xpi
fi