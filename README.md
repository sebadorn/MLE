# My Little Emotebox

Browser extension for Opera, Chrome and Firefox to manage emotes of subreddits. Also provides a feature to see the emotes of /r/mylittlepony and /r/MLPLounge in other parts of reddit as well.


## Self-hosted

[The latest non-dev version can be found here.](http://sebadorn.de/mlp/mle/)


## Forword on the project structure

I really try to re-use content as much as possible. One assurance for this project is, that the files:

* `my-little-emotebox.js`
* `mle-codes.js`
* `background.js`
* `options.html`, `options.css`, `options.js`
* and every image

… are the same, no matter where you encounter them. Additionally, `Firefox/lib/main.js` is the same as `my-little-emotebox.js`.

Locally, I have an additional directory called `common resources/` where I store all the files that are shared cross-browser. From there I just hardlink them to their respective places (`ln`).


## Build it

In order to build the browser extensions I wrote the *build.sh* script. It takes two parameters; one for the browser (all, opera, chrome, firefox) and one for the version (for example "2.5"). Example:

    ./build.sh all 2.5

There are some variables inside of some files, that will be replaced while building the extension:

* `%XPI_HASH%` – Firefox specific. A hash (sha256 in this case) will be generated from the build XPI file. Necessary for users to be able to install and update from your own server.
* `%MLE_VERSION%` – Will be replaced with the version parameter provided when calling *build.sh*. Please note that Chrome only accepts versions in the form of point seperated numbers. So "1.9-dev" or "2.5a" wouldn't be valid.
* `%MLE_URL%` – Absolute URL to the project home page. In my case: "http://sebadorn.de/mlp/mle".


### Opera

For Opera extensions (OEX) all the files just have to be zipped into an archive with the extension `.oex`. I use the command:

    zip -r mle.oex *


### Chrome

You can build a Chrome extension right from the Chrome extensions page. (*Developer mode* has to be checked.) The first time you create the Chrome MLE extension, a PEM file will be generated, which stores a private key for this extension. DO NOT SHARE THIS FILE. There's a reason it's called *private* key.

On every following build you have to provide this PEM file. Command line style it looks like this:

    google-chrome --pack-extension=Chrome/ --pack-extension-key=chrome-private-key-mle.pem


### Firefox

Oh boy. Figuring all this stuff out was hard. You will need the following:

* [Firefox Add-on SDK](https://addons.mozilla.org/en-US/developers/builder)
* [Mozilla Mccoy Tool](http://blog.techno-barje.fr/post/2009/10/05/Mozilla-Mccoy-tool-from-the-command-line/) (with command line patch)

*[tbd]*


## Providing updates

Some of it has already been covered in the *Build it* chapter. MLE – as I handle it – isn't hosted in some store, but on my own humble webspace. This means some extra work and hurdles to overcome.


### Opera

*[tbd]*


### Chrome

*[tbd]*


### Firefox

*[tbd]*


## Notes

* Opera will switch engines from *Presto* to *Blink* (same as Chrome) at some point in 2013. This also means, that all Opera extensions won't work anymore. However, they plan on realising a tool to help with the conversion from OEX to the new extension format … or something like that. Well, if it is the same as a Chrome extension, there won't be much of a problem, since MLE already has that.
* Firefox SDK automatically sets a min and max Firefox version number. That shouldn't be a problem if everyone keeps their browser up-to-date. If you want to change it, have a look at `addon-sdk-1.14/app-extension/install.rdf`.
