// ==UserScript==
// @name         StrategyCombat - VEX AutoClicker
// @namespace    Vex
// @version      3.0
// @description  Movable autoclicker with adjustable CPS, hotkey toggle, and minimize button
// @author       Vex + ChatGPT
// @match        https://www.strategycombat.com/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

(() => {
    'use strict';

    const TOGGLE_KEY = 'F8';
    let clicksPerSecond = 10;

    let enabled = false;
    let interval = null;

    let mouseX = 0;
    let mouseY = 0;
    let minimized = false;

    // ==========================================
    // TRACK MOUSE
    // ==========================================

    document.addEventListener('mousemove', e => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    }, true);

    // ==========================================
    // CREATE MENU
    // ==========================================

    function createMenu() {

        const menu = document.createElement('div');

        menu.id = 'vex-autoclicker-menu';

        Object.assign(menu.style, {
            position: 'fixed',
            top: '100px',
            left: '100px',
            width: '220px',
            zIndex: '999999',
            background: '#181818',
            color: '#fff',
            border: '1px solid #444',
            borderRadius: '8px',
            boxShadow: '0 5px 20px rgba(0,0,0,.5)',
            fontFamily: 'Arial, sans-serif',
            fontSize: '14px',
            userSelect: 'none'
        });

        // ======================================
        // HEADER
        // ======================================

        const header = document.createElement('div');

        Object.assign(header.style, {
            padding: '10px',
            background: '#242424',
            borderRadius: '8px 8px 0 0',
            cursor: 'move',
            fontWeight: 'bold',
            position: 'relative'
        });

        const title = document.createElement('span');

        title.textContent = 'VEX AutoClicker';

        header.appendChild(title);

        // ======================================
        // MINIMIZE BUTTON
        // ======================================

        const minimizeButton = document.createElement('button');

        minimizeButton.textContent = '—';

        Object.assign(minimizeButton.style, {
            position: 'absolute',
            right: '8px',
            top: '6px',
            width: '25px',
            height: '22px',
            padding: '0',
            background: '#333',
            color: '#fff',
            border: '1px solid #555',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold',
            lineHeight: '18px'
        });

        header.appendChild(minimizeButton);

        menu.appendChild(header);

        // ======================================
        // CONTENT
        // ======================================

        const content = document.createElement('div');

        content.id = 'vex-ac-content';

        content.style.padding = '12px';

        // Status
        const status = document.createElement('div');

        status.id = 'vex-ac-status';

        status.style.marginBottom = '10px';

        content.appendChild(status);

        // CPS label
        const cpsLabel = document.createElement('div');

        cpsLabel.textContent = 'Clicks per second:';

        cpsLabel.style.marginBottom = '5px';

        content.appendChild(cpsLabel);

        // CPS input
        const cpsInput = document.createElement('input');

        cpsInput.type = 'number';
        cpsInput.min = '1';
        cpsInput.max = '1000';
        cpsInput.step = '1';
        cpsInput.value = clicksPerSecond;

        Object.assign(cpsInput.style, {
            width: '80px',
            padding: '5px',
            boxSizing: 'border-box',
            background: '#101010',
            color: '#fff',
            border: '1px solid #555',
            borderRadius: '4px'
        });

        content.appendChild(cpsInput);

        // Apply
        const apply = document.createElement('button');

        apply.textContent = 'Apply';

        Object.assign(apply.style, {
            marginLeft: '6px',
            padding: '5px 9px',
            background: '#333',
            color: '#fff',
            border: '1px solid #555',
            borderRadius: '4px',
            cursor: 'pointer'
        });

        apply.onclick = () => {

            let value = Number(cpsInput.value);

            if (!Number.isFinite(value)) {
                value = 10;
            }

            value = Math.max(1, Math.min(1000, value));

            clicksPerSecond = value;

            cpsInput.value = value;

            if (enabled) {
                restartClicker();
            }

            updateStatus();
        };

        content.appendChild(apply);

        // Hotkey info
        const info = document.createElement('div');

        info.textContent = `Press ${TOGGLE_KEY} to toggle`;

        Object.assign(info.style, {
            marginTop: '12px',
            fontSize: '12px',
            opacity: '0.65'
        });

        content.appendChild(info);

        menu.appendChild(content);

        document.documentElement.appendChild(menu);

        updateStatus();

        // ======================================
        // MINIMIZE / MAXIMIZE
        // ======================================

        minimizeButton.addEventListener('click', e => {

            e.stopPropagation();

            minimized = !minimized;

            if (minimized) {

                content.style.display = 'none';

                minimizeButton.textContent = '+';

                header.style.borderRadius = '8px';

            } else {

                content.style.display = 'block';

                minimizeButton.textContent = '—';

                header.style.borderRadius =
                    '8px 8px 0 0';
            }

        });

        // ======================================
        // DRAGGING
        // ======================================

        let dragging = false;
        let offsetX = 0;
        let offsetY = 0;

        header.addEventListener('mousedown', e => {

            if (e.target === minimizeButton) return;

            dragging = true;

            const rect = menu.getBoundingClientRect();

            offsetX = e.clientX - rect.left;
            offsetY = e.clientY - rect.top;

            e.preventDefault();
        });

        document.addEventListener('mousemove', e => {

            if (!dragging) return;

            let x = e.clientX - offsetX;
            let y = e.clientY - offsetY;

            x = Math.max(
                0,
                Math.min(
                    x,
                    window.innerWidth - menu.offsetWidth
                )
            );

            y = Math.max(
                0,
                Math.min(
                    y,
                    window.innerHeight - menu.offsetHeight
                )
            );

            menu.style.left = `${x}px`;
            menu.style.top = `${y}px`;
        });

        document.addEventListener('mouseup', () => {
            dragging = false;
        });
    }

    // ==========================================
    // STATUS
    // ==========================================

    function updateStatus() {

        const status =
            document.getElementById('vex-ac-status');

        if (!status) return;

        status.textContent = enabled
            ? `● ON — ${clicksPerSecond} CPS`
            : '● OFF';

        status.style.fontWeight = 'bold';

        status.style.color = enabled
            ? '#4cff4c'
            : '#ff5555';
    }

    // ==========================================
    // CLICK
    // ==========================================

    function clickMouse() {

        if (!enabled) return;

        const target =
            document.elementFromPoint(mouseX, mouseY);

        if (!target) return;

        const options = {
            bubbles: true,
            cancelable: true,
            view: window,
            clientX: mouseX,
            clientY: mouseY,
            button: 0,
            buttons: 1
        };

        target.dispatchEvent(
            new MouseEvent('mousedown', options)
        );

        target.dispatchEvent(
            new MouseEvent('mouseup', options)
        );

        target.dispatchEvent(
            new MouseEvent('click', options)
        );
    }

    // ==========================================
    // ENABLE
    // ==========================================

    function enable() {

        if (enabled) return;

        enabled = true;

        restartClicker();

        updateStatus();

        console.log('[VEX AUTOCLICKER] ON');
    }

    // ==========================================
    // DISABLE
    // ==========================================

    function disable() {

        enabled = false;

        if (interval !== null) {
            clearInterval(interval);
            interval = null;
        }

        updateStatus();

        console.log('[VEX AUTOCLICKER] OFF');
    }

    // ==========================================
    // RESTART
    // ==========================================

    function restartClicker() {

        if (interval !== null) {
            clearInterval(interval);
            interval = null;
        }

        if (!enabled) return;

        const delay = 1000 / clicksPerSecond;

        interval = setInterval(
            clickMouse,
            delay
        );

        updateStatus();
    }

    // ==========================================
    // HOTKEY
    // ==========================================

    document.addEventListener('keydown', e => {

        if (e.key === TOGGLE_KEY) {

            e.preventDefault();
            e.stopPropagation();

            if (enabled) {
                disable();
            } else {
                enable();
            }
        }

    }, true);

    // ==========================================
    // INITIALIZE
    // ==========================================

    function init() {

        if (
            !document.getElementById(
                'vex-autoclicker-menu'
            )
        ) {
            createMenu();
        }

        console.log(
            `[VEX AUTOCLICKER] Ready | ${TOGGLE_KEY} = Toggle`
        );
    }

    if (document.readyState === 'loading') {

        document.addEventListener(
            'DOMContentLoaded',
            init
        );

    } else {

        init();
    }

})();
