// ==UserScript==
// @name         StrategyCombat - VEX Next Units
// @namespace    vex.strategycombat.nextunits
// @version      3.0
// @description  Next unit unlocks with automatic mapjahr timing and automatic map change detection.
// @author       Vex + ChatGPT
// @match        https://www.strategycombat.com/*
// @run-at       document-idle
// @grant        unsafeWindow
// ==/UserScript==

(function () {
    'use strict';

    const W =
        typeof unsafeWindow !== 'undefined'
            ? unsafeWindow
            : window;

    // =========================================================
    // SETTINGS
    // =========================================================

    const MAPJAHR = 'mapjahr';
    const MAP_NUMBER = 'mapnr';

    const NAME_ARRAY = 'pnam';
    const DESC_ARRAY = 'sinf';

    const CALIBRATION_INTERVAL = 10000;
    const DISPLAY_INTERVAL = 1000;

    const YEAR_STEP = 0.001;

    // Known measurement:
    // 0.001 mapjahr ≈ 150.1 real seconds
    const START_RATE = 150.1;

    const MAX_SAMPLES = 8;

    const SHOW_UNITS = 5;


    // =========================================================
    // UNLOCK TABLE
    // =========================================================

    const THRESHOLDS = [

        [143,1912.1],
        [140,1913.1],
        [141,1914.3],
        [170,1914.7],
        [167,1915.1],
        [211,1915.2],
        [161,1915.5],
        [183,1915.8],
        [62,1916.2],
        [187,1916.3],
        [224,1916.35],
        [136,1916.4],
        [205,1916.45],
        [149,1916.7],
        [189,1916.8],
        [156,1916.9],
        [150,1917.1],
        [157,1917.2],
        [151,1917.25],
        [159,1917.3],
        [153,1917.4],
        [186,1917.5],
        [155,1917.6],
        [154,1917.8],
        [22,1917.9],
        [226,1917.9],
        [158,1918.3],
        [162,1918.5],
        [152,1918.7],
        [145,1918.8],
        [195,1919.5],
        [192,1920.8],
        [196,1922.5],
        [166,1925.5],
        [180,1928.4],
        [178,1931.1],
        [20,1931.6],
        [132,1932.5],
        [112,1932.7],
        [46,1933.1],
        [103,1933.3],
        [48,1933.6],
        [36,1933.8],
        [146,1933.95],
        [78,1934.3],
        [131,1934.6],
        [84,1935.1],
        [221,1935.2],
        [72,1935.7],
        [0,1935.85],
        [49,1936.1],
        [37,1936.2],
        [13,1936.5],
        [83,1936.9],
        [91,1936.95],
        [104,1937.2],
        [101,1937.4],
        [102,1937.4],
        [105,1937.7],
        [108,1938.1],
        [41,1939.1],
        [74,1939.15],
        [51,1939.2],
        [69,1939.3],
        [15,1939.5],
        [90,1939.55],
        [94,1939.6],
        [79,1939.75],
        [34,1939.8],
        [264,1939.9],
        [99,1940.15],
        [100,1940.15],
        [42,1940.5],
        [53,1940.6],
        [109,1940.7],
        [68,1940.8],
        [75,1940.85],
        [77,1940.85],
        [80,1940.9],
        [1,1940.95],
        [2,1941.1],
        [147,1941.27],
        [25,1941.4],
        [27,1941.5],
        [116,1941.6],
        [93,1941.7],
        [71,1941.8],
        [85,1941.9],
        [4,1942.05],
        [3,1942.1],
        [63,1942.3],
        [44,1942.5],
        [23,1942.6],
        [110,1942.65],
        [113,1942.75],
        [87,1942.9],
        [10,1943.02],
        [98,1943.05],
        [31,1943.1],
        [114,1943.12],
        [12,1943.15],
        [111,1943.2],
        [59,1943.3],
        [61,1943.35],
        [81,1943.4],
        [82,1943.45],
        [54,1943.5],
        [88,1943.55],
        [14,1943.6],
        [92,1943.65],
        [5,1943.8],
        [89,1943.83],
        [32,1943.85],
        [9,1943.9],
        [76,1944.05],
        [11,1944.1],
        [64,1944.15],
        [106,1944.2],
        [40,1944.5],
        [65,1944.55],
        [8,1944.6],
        [95,1944.8],
        [38,1944.9],
        [86,1945.1],
        [58,1945.15],
        [6,1945.6],
        [73,1945.65],
        [97,1945.9],
        [206,1946.9],
        [231,1948.2],
        [237,1951.1],
        [200,1951.5],
        [236,1952.5],
        [135,1954.2],
        [265,1954.8],
        [230,1955.2],
        [176,1955.8],
        [220,1955.9],
        [229,1956.5],
        [177,1956.8],
        [233,1959.2],
        [269,1959.6],
        [255,1962.7],
        [225,1964.5],
        [232,1964.8],
        [258,1964.9],
        [266,1965.3],
        [262,1965.7],
        [188,1965.8],
        [204,1966.1],
        [238,1966.3],
        [222,1966.5],
        [257,1966.5],
        [267,1967.2],
        [268,1967.2],
        [234,1967.3],
        [270,1967.3],
        [256,1967.5],
        [223,1969.2],
        [235,1969.7],
        [263,1982.5]

    ].map(([index, year]) => ({
        index,
        year
    })).sort(
        (a, b) => a.year - b.year
    );


    // =========================================================
    // TIMING STATE
    // =========================================================

    let secondsPerStep = START_RATE;

    let anchorYear = null;
    let anchorTime = null;

    let previousYear = null;
    let previousTime = null;

    let currentMap = null;

    let samples = [];


    // =========================================================
    // READ MAP NUMBER
    // =========================================================

    async function readMapNumber() {

        let value =
            W[MAP_NUMBER];

        if (
            typeof value === 'function'
        ) {
            try {
                value =
                    value.call(W);
            } catch (_) {}
        }

        value =
            await Promise.resolve(value);

        /*
         * Normal number.
         */

        if (
            typeof value === 'number' &&
            Number.isFinite(value)
        ) {
            return value;
        }


        /*
         * Numeric string.
         */

        if (
            typeof value === 'string'
        ) {

            const match =
                value.match(/\d+/);

            if (match) {

                const n =
                    Number(match[0]);

                if (
                    Number.isFinite(n)
                ) {
                    return n;
                }
            }
        }


        /*
         * If mapnr happens to be an object,
         * search its immediate properties for
         * a plausible numeric map number.
         */

        if (
            value &&
            typeof value === 'object'
        ) {

            for (
                const key in value
            ) {

                const n =
                    Number(value[key]);

                if (
                    Number.isFinite(n) &&
                    n >= 0 &&
                    n < 100000
                ) {
                    return n;
                }
            }
        }


        return null;
    }


    // =========================================================
    // READ MAPJAHR
    // =========================================================

    async function readMapjahr() {

        let value =
            W[MAPJAHR];

        if (
            typeof value === 'function'
        ) {
            value =
                value.call(W);
        }

        value =
            await Promise.resolve(value);


        if (
            typeof value === 'number' &&
            Number.isFinite(value)
        ) {
            return value;
        }


        if (
            typeof value === 'string'
        ) {

            const match =
                value.match(
                    /\d{4}(?:\.\d+)/
                );

            if (match) {

                const n =
                    Number(match[0]);

                if (
                    Number.isFinite(n)
                ) {
                    return n;
                }
            }
        }


        if (
            value &&
            typeof value === 'object'
        ) {

            for (
                const key in value
            ) {

                const n =
                    Number(value[key]);

                if (
                    Number.isFinite(n) &&
                    n > 1900 &&
                    n < 2100
                ) {
                    return n;
                }
            }
        }


        throw new Error(
            'mapjahr could not be read'
        );
    }


    // =========================================================
    // RESET TIMING
    // =========================================================

    function resetTiming(year) {

        const now =
            performance.now();

        anchorYear =
            year;

        anchorTime =
            now;

        previousYear =
            year;

        previousTime =
            now;

        /*
         * Start a new calibration history for
         * the new map.
         *
         * Keep the known 150.1 starting value.
         */

        samples = [];

        secondsPerStep =
            START_RATE;

        console.log(
            '[VEX] Timing reset for map:',
            currentMap,
            '| mapjahr:',
            year
        );
    }


    // =========================================================
    // RECORD YEAR
    // =========================================================

    function recordYear(year) {

        const now =
            performance.now();


        if (
            previousYear !== null &&
            previousTime !== null
        ) {

            const yearDelta =
                year -
                previousYear;


            const timeDelta =
                (
                    now -
                    previousTime
                ) / 1000;


            if (
                yearDelta > 0 &&
                timeDelta > 0
            ) {

                const steps =
                    yearDelta /
                    YEAR_STEP;


                const rate =
                    timeDelta /
                    steps;


                if (
                    rate >= 100 &&
                    rate <= 250
                ) {

                    samples.push(rate);


                    while (
                        samples.length >
                        MAX_SAMPLES
                    ) {
                        samples.shift();
                    }


                    const sorted =
                        [...samples].sort(
                            (a, b) =>
                                a - b
                        );


                    const middle =
                        Math.floor(
                            sorted.length / 2
                        );


                    secondsPerStep =
                        sorted.length % 2
                            ? sorted[middle]
                            : (
                                sorted[middle - 1] +
                                sorted[middle]
                            ) / 2;


                    console.log(
                        '[VEX] Calibration:',
                        secondsPerStep.toFixed(2),
                        'sec / 0.001'
                    );
                }
            }
        }


        anchorYear =
            year;

        anchorTime =
            now;

        previousYear =
            year;

        previousTime =
            now;
    }


    // =========================================================
    // ESTIMATED CURRENT YEAR
    // =========================================================

    function estimatedYear() {

        if (
            anchorYear === null ||
            anchorTime === null
        ) {
            return null;
        }


        const elapsed =
            (
                performance.now() -
                anchorTime
            ) / 1000;


        return (
            anchorYear +
            (
                elapsed /
                secondsPerStep
            ) *
            YEAR_STEP
        );
    }


    // =========================================================
    // YEAR -> REAL SECONDS
    // =========================================================

    function secondsUntil(targetYear) {

        const current =
            estimatedYear();


        if (
            current === null ||
            !Number.isFinite(targetYear)
        ) {
            return null;
        }


        const difference =
            targetYear -
            current;


        if (
            difference <= 0
        ) {
            return 0;
        }


        return (
            difference /
            YEAR_STEP
        ) *
        secondsPerStep;
    }


    // =========================================================
    // FORMAT TIME
    // =========================================================

    function formatTime(seconds) {

        if (
            seconds === null
        ) {
            return '—';
        }


        if (
            seconds <= 0
        ) {
            return 'READY';
        }


        let total =
            Math.ceil(seconds);


        const days =
            Math.floor(
                total / 86400
            );

        total -=
            days * 86400;


        const hours =
            Math.floor(
                total / 3600
            );

        total -=
            hours * 3600;


        const minutes =
            Math.floor(
                total / 60
            );

        total -=
            minutes * 60;


        const secs =
            total;


        return (
            days +
            'd ' +

            String(hours)
                .padStart(2, '0') +
            'h ' +

            String(minutes)
                .padStart(2, '0') +
            'm ' +

            String(secs)
                .padStart(2, '0') +
            's'
        );
    }


    // =========================================================
    // NAME LOOKUP
    // =========================================================

    function unitName(index) {

        const array =
            W[NAME_ARRAY];


        if (
            Array.isArray(array) &&
            array[index] != null
        ) {

            const name =
                String(
                    array[index]
                ).trim();


            if (name) {
                return name;
            }
        }


        return 'Unit #' + index;
    }


    // =========================================================
    // DESCRIPTION LOOKUP
    // =========================================================

    function unitDescription(index) {

        const array =
            W[DESC_ARRAY];


        if (
            Array.isArray(array) &&
            array[index] != null
        ) {

            return String(
                array[index]
            ).trim();
        }


        return '';
    }


    // =========================================================
    // CREATE UI
    // =========================================================

    const host =
        document.createElement('div');


    host.id =
        'vex-next-units';


    host.style.cssText = `
        position:fixed;
        right:18px;
        bottom:18px;
        z-index:2147483647;
    `;


    const shadow =
        host.attachShadow({
            mode: 'open'
        });


    shadow.innerHTML = `

        <style>

            * {
                box-sizing:border-box;
            }

            .panel {
                width:350px;
                background:#12100c;
                color:#ffb642;
                border:1px solid #3b3122;
                border-radius:5px;
                box-shadow:
                    0 10px 34px rgba(0,0,0,.55);
                overflow:hidden;
                font-family:
                    "SF Mono",
                    "JetBrains Mono",
                    "Cascadia Code",
                    Consolas,
                    monospace;
            }

            .bar {
                display:flex;
                align-items:center;
                gap:8px;
                padding:8px 10px;
                background:#1b1811;
                border-bottom:1px solid #3b3122;
                cursor:grab;
                user-select:none;
            }

            .bar:active {
                cursor:grabbing;
            }

            .dot {
                width:7px;
                height:7px;
                border-radius:50%;
                background:#ffb642;
                flex:none;
            }

            .dot.error {
                background:#ff6045;
            }

            .dot.mapchange {
                background:#72d6ff;
            }

            .title {
                font-size:11px;
                letter-spacing:.09em;
                text-transform:uppercase;
            }

            .gameyear {
                margin-left:auto;
                font-size:11px;
                font-variant-numeric:tabular-nums;
            }

            .body {
                max-height:46vh;
                overflow:auto;
            }

            .row {
                display:flex;
                align-items:flex-start;
                gap:10px;
                padding:7px 10px;
            }

            .row + .row {
                border-top:1px solid #221e16;
            }

            .info {
                flex:1;
                min-width:0;
            }

            .name {
                font-size:12px;
                white-space:nowrap;
                overflow:hidden;
                text-overflow:ellipsis;
            }

            .desc {
                margin-top:2px;
                font-size:10px;
                color:#8a7550;
                white-space:nowrap;
                overflow:hidden;
                text-overflow:ellipsis;
            }

            .time {
                min-width:145px;
                text-align:right;
                font-size:11px;
                font-variant-numeric:tabular-nums;
                white-space:nowrap;
            }

            .jahr {
                display:block;
                font-weight:700;
                color:#ffb642;
            }

            .countdown {
                display:block;
                margin-top:2px;
                color:#8a7550;
            }

            .error {
                padding:10px;
                color:#ff6045;
                font-size:12px;
            }

            .empty {
                padding:10px;
                color:#8a7550;
                font-size:12px;
            }

            .maplabel {
                color:#8a7550;
                font-size:10px;
                margin-left:5px;
            }

        </style>

        <div class="panel">

            <div class="bar">

                <span
                    class="dot"
                    id="dot"
                ></span>

                <span class="title">
                    Next Units
                </span>

                <span
                    class="gameyear"
                    id="gameyear"
                >
                    ----
                </span>

            </div>

            <div
                class="body"
                id="body"
            ></div>

        </div>
    `;


    const bar =
        shadow.querySelector('.bar');

    const dot =
        shadow.getElementById('dot');

    const gameYearDisplay =
        shadow.getElementById('gameyear');

    const body =
        shadow.getElementById('body');


    // =========================================================
    // BUILD UNIT LIST
    // =========================================================

    function buildList() {

        const year =
            estimatedYear();


        if (
            year === null
        ) {
            return;
        }


        gameYearDisplay.textContent =
            year.toFixed(3);


        body.replaceChildren();


        const upcoming =
            THRESHOLDS
                .filter(
                    item =>
                        item.year > year
                )
                .slice(
                    0,
                    SHOW_UNITS
                );


        if (
            upcoming.length === 0
        ) {

            const empty =
                document.createElement(
                    'div'
                );

            empty.className =
                'empty';

            empty.textContent =
                'No further unlocks';

            body.append(empty);

            return;
        }


        for (
            const item of upcoming
        ) {

            const row =
                document.createElement(
                    'div'
                );

            row.className =
                'row';


            const info =
                document.createElement(
                    'div'
                );

            info.className =
                'info';


            const name =
                document.createElement(
                    'div'
                );

            name.className =
                'name';

            name.textContent =
                unitName(
                    item.index
                );


            info.append(name);


            const description =
                unitDescription(
                    item.index
                );


            if (
                description
            ) {

                const desc =
                    document.createElement(
                        'div'
                    );

                desc.className =
                    'desc';

                desc.textContent =
                    description;

                info.append(desc);
            }


            const time =
                document.createElement(
                    'div'
                );

            time.className =
                'time';


            const jahr =
                document.createElement(
                    'span'
                );

            jahr.className =
                'jahr';

            jahr.textContent =
                item.year.toFixed(3);


            const countdown =
                document.createElement(
                    'span'
                );

            countdown.className =
                'countdown';

            countdown.dataset.year =
                String(item.year);


            countdown.textContent =
                formatTime(
                    secondsUntil(
                        item.year
                    )
                );


            time.append(
                jahr,
                countdown
            );


            row.append(
                info,
                time
            );


            body.append(row);
        }
    }


    // =========================================================
    // UPDATE COUNTDOWNS
    // =========================================================

    function updateDisplay() {

        const year =
            estimatedYear();


        if (
            year === null
        ) {
            return;
        }


        gameYearDisplay.textContent =
            year.toFixed(3);


        body
            .querySelectorAll(
                '.countdown[data-year]'
            )
            .forEach(
                element => {

                    const target =
                        Number(
                            element.dataset.year
                        );


                    element.textContent =
                        formatTime(
                            secondsUntil(
                                target
                            )
                        );
                }
            );
    }


    // =========================================================
    // SYNCHRONIZE
    // =========================================================

    async function synchronize() {

        try {

            const map =
                await readMapNumber();

            const year =
                await readMapjahr();


            // =================================================
            // MAP CHANGE DETECTED
            // =================================================

            if (
                map !== null &&
                currentMap !== null &&
                map !== currentMap
            ) {

                console.log(
                    '[VEX] ============================='
                );

                console.log(
                    '[VEX] MAP CHANGE DETECTED:',
                    currentMap,
                    '->',
                    map
                );

                console.log(
                    '[VEX] New mapjahr:',
                    year
                );

                console.log(
                    '[VEX] Rebuilding unit list...'
                );

                console.log(
                    '[VEX] ============================='
                );


                currentMap =
                    map;


                resetTiming(
                    year
                );


                dot.className =
                    'dot mapchange';


                buildList();


                /*
                 * Give the UI a moment to display
                 * the map-change state, then return
                 * to normal.
                 */

                setTimeout(
                    () => {

                        if (
                            dot.className ===
                            'dot mapchange'
                        ) {
                            dot.className =
                                'dot';
                        }

                    },
                    500
                );


                return;
            }


            // =================================================
            // FIRST MAP DETECTION
            // =================================================

            if (
                currentMap === null &&
                map !== null
            ) {

                currentMap =
                    map;


                console.log(
                    '[VEX] Initial map:',
                    currentMap
                );


                resetTiming(
                    year
                );


                buildList();

                return;
            }


            // =================================================
            // NORMAL CALIBRATION
            // =================================================

            recordYear(
                year
            );


            dot.className =
                'dot';


            buildList();


            console.log(
                '[VEX] Sync:',
                'map =',
                currentMap,
                '| mapjahr =',
                year,
                '| rate =',
                secondsPerStep.toFixed(2),
                'sec / 0.001'
            );

        } catch (error) {

            console.error(
                '[VEX NEXT UNITS]',
                error
            );


            dot.className =
                'dot error';
        }
    }


    // =========================================================
    // DRAGGING
    // =========================================================

    let drag = null;


    bar.addEventListener(
        'pointerdown',
        event => {

            const rect =
                host.getBoundingClientRect();


            drag = {

                x:
                    event.clientX -
                    rect.left,

                y:
                    event.clientY -
                    rect.top
            };


            bar.setPointerCapture(
                event.pointerId
            );
        }
    );


    bar.addEventListener(
        'pointermove',
        event => {

            if (!drag) {
                return;
            }


            host.style.right =
                'auto';

            host.style.bottom =
                'auto';


            host.style.left =
                (
                    event.clientX -
                    drag.x
                ) + 'px';


            host.style.top =
                (
                    event.clientY -
                    drag.y
                ) + 'px';
        }
    );


    bar.addEventListener(
        'pointerup',
        event => {

            drag = null;


            try {

                bar.releasePointerCapture(
                    event.pointerId
                );

            } catch (_) {}
        }
    );


    // =========================================================
    // START
    // =========================================================

    document.documentElement.append(
        host
    );


    console.log(
        '[VEX NEXT UNITS] Starting...'
    );


    synchronize();


    // =========================================================
    // 10 SECOND MAPJAHR / MAP CHECK
    // =========================================================

    const calibrationTimer =
        setInterval(
            () => {

                if (
                    document.visibilityState ===
                    'visible'
                ) {

                    synchronize();
                }

            },
            CALIBRATION_INTERVAL
        );


    // =========================================================
    // 1 SECOND DISPLAY TIMER
    // =========================================================

    const displayTimer =
        setInterval(
            () => {

                if (
                    document.visibilityState ===
                    'visible'
                ) {

                    updateDisplay();
                }

            },
            DISPLAY_INTERVAL
        );


    // =========================================================
    // VISIBILITY
    // =========================================================

    document.addEventListener(
        'visibilitychange',
        () => {

            if (
                document.visibilityState ===
                'visible'
            ) {

                synchronize();
            }
        }
    );


    // =========================================================
    // CLEANUP
    // =========================================================

    window.addEventListener(
        'unload',
        () => {

            clearInterval(
                calibrationTimer
            );

            clearInterval(
                displayTimer
            );
        }
    );


    console.log(
        '[VEX NEXT UNITS] Loaded successfully.'
    );

})();
