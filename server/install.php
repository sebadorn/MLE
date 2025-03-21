<!DOCTYPE html>

<html>
<head>
	<meta charset="utf-8" />
	<meta name="robots" content="noindex" />
	<title>My Little Emotebox – A browser extension for Chrome, Firefox and Opera</title>
	<meta name="author" content="meinstuhlknarrt" />
	<link rel="shortcut icon" href="MLE_32.png" />
	<link rel="stylesheet" href="mle.css" />
	<link rel="chrome-webstore-item" href="https://chrome.google.com/webstore/detail/akkkkifniibnnabhagkppchajlbaggbp">
	<script src="mle.js"></script>
</head>
<body>

<h1>My Little Emotebox<sup id="version"></sup></h1>

<nav class="main">
	<a href="index.php">Features</a>
	<a href="install.php" class="active">Install</a>
	<a href="changelog.php">Changelog</a>
</nav>


<section class="main install">
	<nav class="tabs">
		<label for="tab_chrome" class="active">Chrome</label>
		<label for="tab_firefox">Firefox</label>
	</nav>

	<div class="browsers">
		<input type="radio" name="browser" id="tab_chrome" hidden checked />
		<div class="tab-content chrome">
			<button class="install_trigger chrome" onclick="chrome.webstore.install();">Install MLE per Chrome Web Store</button>
			<p><strong>Install –</strong> Click the button or go to the <a href="https://chrome.google.com/webstore/detail/my-little-emotebox/akkkkifniibnnabhagkppchajlbaggbp">Chrome Web Store</a>.</p>
			<p>If you use <em>Google Chrome (stable)</em> on Windows, this is the only option.</p>
			<hr />
			<a class="install_trigger chrome" href="mle.crx" id="install_chrome">Install MLE in Chrome</a>
			<p><strong>Install –</strong> Drag&amp;drop the <code>mle.crx</code> file on the <code>chrome://extensions</code> page. (<a href="//sebadorn.de/mlp/mle/mle_install_chrome.png">Screenshot.</a>)</p>
			<p>If you use <em>Chromium</em> or <em>Chrome (dev)</em> or Chrome not on Windows, you can install it from here without using the Web Store.</p>
		</div>

		<input type="radio" name="browser" id="tab_firefox" hidden />
		<div class="tab-content firefox">
			<a class="install_trigger firefox" href="https://addons.mozilla.org/en-US/firefox/addon/my-little-emotebox/" id="install_firefox">Install MLE from the Firefox Add-Ons page</a>
			<hr />
			<p>Download the last self-hosted version to install it manually: <a href="./mle-webext.xpi" download>mle-webext.xpi (v2.11.0)</a><br>Future updates should then theoretically be automatically received from the Firefox store version.</p>
		</div>
	</div>
</section>

</body>
</html>