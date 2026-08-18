// ==UserScript==
// @name         StrategyCombat VEX Zoom
// @namespace    Vex + ChatGPT
// @version      3.0
// @description  Allows StrategyCombat to use the full browser viewport at reduced Chrome zoom.
// @author       Vex + ChatGPT
// @homepageURL  https://github.com/VexTechnician
// @match        https://www.strategycombat.com/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

(() => {
    'use strict';

    const TAG = '[VEX ZOOM]';

    let realDPR = window.devicePixelRatio || 1;

    /*
     * StrategyCombat PX() contains a special branch:
     *
     *     Q.devicePixelRatio < 1
     *
     * When that is true, PX() eventually clamps its internal
     * viewport to 2000 x 1000.
     *
     * We only spoof DPR when the real DPR is below 1.
     *
     * innerWidth / innerHeight are NOT spoofed.
     */

    try {
        Object.defineProperty(window, 'devicePixelRatio', {
            configurable: true,
            get() {
                const dpr = realDPR;

                return dpr < 1 ? 1 : dpr;
            }
        });

        console.log(TAG, 'DPR protection installed.');
        console.log(TAG, {
            realDPR,
            reportedDPR: window.devicePixelRatio
        });

    } catch (e) {
        console.error(TAG, 'Could not install DPR protection:', e);
    }


    /*
     * Find PX() after the game has loaded.
     *
     * We don't replace PX().
     * We simply call the game's own function after resize/zoom changes.
     */

    function findPX() {
        try {
            if (typeof PX === 'function') {
                return PX;
            }
        } catch (_) {}

        return null;
    }


    function refreshGameViewport(reason) {
        const fn = findPX();

        if (!fn) {
            console.log(TAG, 'PX not ready yet.');
            return false;
        }

        try {
            fn();

            const canvas =
                document.getElementById('canvasa') ||
                document.querySelector('canvas');

            console.log(TAG, 'PX refreshed:', {
                reason,
                innerWidth: window.innerWidth,
                innerHeight: window.innerHeight,
                realDPR,
                reportedDPR: window.devicePixelRatio,
                canvasWidth: canvas?.width,
                canvasHeight: canvas?.height
            });

            return true;

        } catch (e) {
            console.error(TAG, 'PX() failed:', e);
            return false;
        }
    }


    /*
     * Keep our copy of the REAL DPR updated.
     *
     * We intentionally do not read window.devicePixelRatio here,
     * because that is our spoofed value.
     */

    function updateRealDPR() {
        try {
            const probe = document.createElement('iframe');

            probe.style.cssText =
                'position:absolute;width:0;height:0;border:0;visibility:hidden;';

            document.documentElement.appendChild(probe);

            const dpr =
                probe.contentWindow?.devicePixelRatio;

            probe.remove();

            if (typeof dpr === 'number' && dpr > 0) {
                realDPR = dpr;
            }

        } catch (_) {}
    }


    /*
     * Browser zoom changes normally produce a resize event.
     */

    let resizeTimer = null;

    window.addEventListener('resize', () => {

        clearTimeout(resizeTimer);

        resizeTimer = setTimeout(() => {

            updateRealDPR();

            console.log(TAG, 'Browser resize detected.');

            refreshGameViewport('browser resize');

        }, 150);

    }, true);


    /*
     * Initial attempts.
     *
     * PX may not exist yet because this script runs at document-start,
     * so we retry for a short period while the game initializes.
     */

    let attempts = 0;

    const startupTimer = setInterval(() => {

        attempts++;

        updateRealDPR();

        if (findPX()) {
            clearInterval(startupTimer);

            console.log(TAG, 'Game PX() found.');

            refreshGameViewport('initialization');
        }

        if (attempts >= 120) {
            clearInterval(startupTimer);

            console.log(TAG, 'Startup search finished.');
        }

    }, 250);


    /*
     * Manual diagnostic helper.
     *
     * Run:
     *
     *     VEXZoomStatus()
     *
     * in the console if you want to see the current state.
     */

    window.VEXZoomStatus = () => {

        const canvas =
            document.getElementById('canvasa') ||
            document.querySelector('canvas');

        console.log(TAG, '===== STATUS =====');

        console.log({
            realDPR,
            reportedDPR: window.devicePixelRatio,
            innerWidth: window.innerWidth,
            innerHeight: window.innerHeight,
            PX: typeof PX,
            canvasWidth: canvas?.width,
            canvasHeight: canvas?.height
        });

        console.log(TAG, '==================');
    };


    console.log(TAG, '===== V3.0 ACTIVE =====');

})();

