# My Little Emotebox

Browser extension for Firefox and Chrome to manage emotes of subreddits. Also provides a feature to see the emotes of /r/mylittlepony and /r/MLPLounge in other parts of reddit as well.

[A small project page with changelog and download links can be found here.](https://sebadorn.de/mlp/mle/)


## Forword on the project structure

The directory `all/` is where I store all the files that are shared cross-browser. The only exception is `background.js`. From there I just hardlink them to their respective places (`ln`). The script `link.sh` does this (and overwrites existing files by the same name!).


## Build it

In order to build the browser extensions I wrote the *build.sh* script. It takes two parameters; one for the browser (all, chrome, firefox) and one for the version (for example "2.11.0"). Example:

    ./build.sh firefox 2.11.0

There are some variables inside of some files, that will be replaced while building the extension:

* `%MLE_VERSION%` – Will be replaced with the version parameter provided when calling *build.sh*. Please note that Chrome only accepts versions in the form of point seperated numbers. So "1.9-dev" or "2.5a" wouldn't be valid.
* `%MLE_URL%` – Absolute URL to the project home page. In my case: "https://sebadorn.de/mlp/mle".


### Chrome

You can build a Chrome extension right from the Chrome extensions page. (*Developer mode* has to be checked.) The first time you create the Chrome MLE extension, a PEM file will be generated, which stores a private key for this extension. DO NOT SHARE THIS FILE. There's a reason it's called *private* key.

On every following build you have to provide this PEM file. Command line style it looks like this:

    google-chrome --pack-extension=Chrome/ --pack-extension-key=chrome-private-key-mle.pem


### Firefox

The build script created a ZIP file for the extension. For validation and signing this has to be uploaded to the Mozilla [Add-on Developer Hub](https://addons.mozilla.org/developers/).
