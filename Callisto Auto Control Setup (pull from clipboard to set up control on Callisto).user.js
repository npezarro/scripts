// ==UserScript==
// @name         Callisto Auto Control Setup (pull from clipboard to set up control on Callisto)
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Automatically clicks Add Control and sets interaction type
// @match        https://callisto.corp.linkedin.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Function to wait for an element
    function waitForElement(selector) {
        return new Promise((resolve) => {
            if (document.querySelector(selector)) {
                return resolve(document.querySelector(selector));
            }

            const observer = new MutationObserver(mutations => {
                if (document.querySelector(selector)) {
                    observer.disconnect();
                    resolve(document.querySelector(selector));
                }
            });

            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        });
    }

    // Function to handle the form setup
    async function setupControlForm() {
        try {
            // Only run on control pages
            if (!window.location.href.includes('/controls')) {
                return;
            }

            console.log('Setting up control form...');

            // Wait for Add Control button
            const addButton = await waitForElement('button.add-entry-btn');
            console.log('Clicking Add Control...');
            addButton.click();

            // Wait for form to load
            await new Promise(r => setTimeout(r, 1000));

            // Set interaction type to SHORT_PRESS
            const typeSelect = await waitForElement('#control-interaction-type');
            typeSelect.value = "7"; // SHORT_PRESS
            typeSelect.dispatchEvent(new Event('change', { bubbles: true }));

            console.log('Form setup complete!');
        } catch (error) {
            console.error('Error in setupControlForm:', error);
        }
    }

    // Start the process when page is ready
    if (window.location.hash.includes('/controls')) {
        waitForElement('.item-list').then(() => {
            setupControlForm();
        });
    }
})();