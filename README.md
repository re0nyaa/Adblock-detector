

# AdBlock Detector (Test Version)

This is a **test script** to check if an ad blocker is running in your browser.  
It can detect extensions like AdBlock, uBlock Origin, and Brave Shields.

-----

##  Key Features

  * Detection using fake ad elements (DOM Bait)
  * Uses a `MutationObserver` to watch for the removal of bait elements
  * Detects ad script load blocking
  * Detects network request (Fetch) blocking
  * Simple detection based on script execution timing
  * Console logs and optional alerts on detection
  * Easy to integrate for testing

-----

##  How to Use

### 1. Add it directly to your HTML

Just add the single line of code below to your HTML file, and it will automatically start checking on page load.

```html
<script src="adblock-detector.js"></script>
```

-----

### 2. Control the Detector Directly

You can control the detector directly or check its state through the global `window.__ad_detector_test` object.

```js
// Check the current detection state
console.log(window.__ad_detector_test.getState());

// Register a callback to run when an ad blocker is detected
window.__ad_detector_test.onDetected(info => {
  console.log('Ad blocker found!', info);
});

// Register a callback for when no ad blocker is detected
window.__ad_detector_test.onNotDetected(info => {
  console.log('No ad blocker:', info);
});

// Run a check manually
window.__ad_detector_test.run();
```

-----

### 3. Configure Options

You can change the default settings using the `setOptions` function.

```js
window.__ad_detector_test.setOptions({
  alertOnDetect: false,          // Don't show an alert on detection
  consoleLog: true,              // Show logs in the console
  fetchProbeUrl: '/__ad_probe__' // Specify a custom URL for the fetch probe
});
```

-----

### Things to Note

  * **For Testing Only**: This script is intended for testing and debugging detection features.
  * If you use this in a production environment, you must comply with regulations like privacy policies.
  * The `fetchProbeUrl` must be set to a same-origin address to avoid CORS errors.


