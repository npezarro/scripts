// ==UserScript==
// @name         Callisto PageKey Form Automation (auto create mobile or desktop pagekey with owners)
// @namespace    http://tampermonkey.net/
// @version      0.2
// @description  Automates filling out pagekey form based on prefix (d_ or p_)
// @match        https://callisto.corp.linkedin.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    console.log('Callisto PageKey Form Automation script loaded');

    // Function to wait for an element to be present in the DOM with timeout
    function waitForElement(selector, timeoutMs = 30000) {
        console.log(`Waiting for element: ${selector}`);
        return new Promise((resolve, reject) => {
            const startTime = Date.now();

            if (document.querySelector(selector)) {
                console.log(`Element found immediately: ${selector}`);
                return resolve(document.querySelector(selector));
            }

            const intervalId = setInterval(() => {
                if (document.querySelector(selector)) {
                    clearInterval(intervalId);
                    console.log(`Element found after polling: ${selector}`);
                    resolve(document.querySelector(selector));
                } else if (Date.now() - startTime > timeoutMs) {
                    clearInterval(intervalId);
                    console.error(`Timeout waiting for element: ${selector}`);
                    reject(new Error(`Timeout waiting for element: ${selector}`));
                }
            }, 100);

            const observer = new MutationObserver(mutations => {
                if (document.querySelector(selector)) {
                    clearInterval(intervalId);
                    observer.disconnect();
                    console.log(`Element found via MutationObserver: ${selector}`);
                    resolve(document.querySelector(selector));
                }
            });

            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        });
    }

    // Function to add owners using sequential events
    async function addOwners(type, owners) {
        console.log(`Adding owners for ${type}: ${owners}`);
        const ownersList = owners.split(' ');
        for (const owner of ownersList) {
            try {
                // Find the input field within the correct pill input section
                const pillInput = await waitForElement(`#${type}-owner-pill-input input.tt-input`);

                console.log(`Adding owner: ${owner} to ${type}`);

                // Focus the input
                pillInput.focus();

                // Clear existing value
                pillInput.value = '';
                pillInput.dispatchEvent(new Event('input', { bubbles: true }));

                // Type the LDAP character by character
                for (let i = 0; i < owner.length; i++) {
                    pillInput.value += owner[i];
                    pillInput.dispatchEvent(new Event('input', { bubbles: true }));
                    await new Promise(resolve => setTimeout(resolve, 50));
                }

                // Small delay after typing
                await new Promise(resolve => setTimeout(resolve, 300));

                // Sequence of events to simulate Enter press
                pillInput.dispatchEvent(new KeyboardEvent('keydown', {
                    key: 'Enter',
                    code: 'Enter',
                    keyCode: 13,
                    which: 13,
                    bubbles: true,
                    cancelable: true
                }));

                pillInput.dispatchEvent(new KeyboardEvent('keypress', {
                    key: 'Enter',
                    code: 'Enter',
                    keyCode: 13,
                    which: 13,
                    bubbles: true,
                    cancelable: true
                }));

                pillInput.dispatchEvent(new KeyboardEvent('keyup', {
                    key: 'Enter',
                    code: 'Enter',
                    keyCode: 13,
                    which: 13,
                    bubbles: true,
                    cancelable: true
                }));

                // Wait before moving to next owner
                await new Promise(resolve => setTimeout(resolve, 700));
            } catch (error) {
                console.error(`Error adding owner ${owner}:`, error);
            }
        }
    }

    async function fillForm() {
        try {
            console.log('Starting form fill process');

            // Get the page title which contains the pagekey
            const pageTitle = await waitForElement('.page-title h1');
            const pageKey = pageTitle.textContent.trim();
            console.log('Found pageKey:', pageKey);

            // Only proceed if pagekey starts with 'd_' or 'p_'
            if (!pageKey.startsWith('d_') && !pageKey.startsWith('p_')) {
                console.log('Pagekey does not start with d_ or p_, skipping:', pageKey);
                return;
            }

            // Check if we're on the PageKeys tab
            let pageKeysTab;
            try {
                pageKeysTab = await waitForElement('artdeco-tab[role="tab"]:first-child', 5000);
                if (!pageKeysTab.classList.contains('active')) {
                    console.log('PageKeys tab is not active, clicking it');
                    pageKeysTab.click();
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            } catch (e) {
                console.log('Could not find PageKeys tab, continuing anyway');
            }

            // Check if a pagekey card with this name already exists
            const existingCards = document.querySelectorAll('.container-info .container-title h2');
            for (const card of existingCards) {
                if (card.textContent.trim() === pageKey) {
                    console.log('Pagekey already exists, skipping:', pageKey);
                    return;
                }
            }

            // Wait for and click the Add PageKey button
            console.log('Looking for Add PageKey button');
            let addButton;
            try {
                addButton = await waitForElement('button.add-entry-btn', 10000);
                console.log('Found Add PageKey button, clicking');

                // Check if button is disabled
                if (addButton.hasAttribute('disabled')) {
                    console.log('Add PageKey button is disabled, cannot proceed');

                    // Add manual trigger button as fallback
                    addManualTriggerButton();

                    // Alert the user
                    alert('Callisto PageKey Form Automation: Add PageKey button is disabled. Manual trigger button added to top-right corner.');
                    return;
                }

                addButton.click();
            } catch (error) {
                console.error('Error finding Add PageKey button:', error);
                return;
            }

            // Fill PageKey Name
            const pageKeyInput = await waitForElement('#page-key-name');
            pageKeyInput.value = pageKey;
            pageKeyInput.dispatchEvent(new Event('input', { bubbles: true }));

            // Select Crew
            const crewSelect = await waitForElement('#pagekey-crew-select');
            crewSelect.value = '3402'; // Lakshman Somasundaram's Default Crew
            crewSelect.dispatchEvent(new Event('change', { bubbles: true }));

            // Check Full PageKey box
            const fullPagekeyCheckbox = await waitForElement('#is-full');
            fullPagekeyCheckbox.click();
            await new Promise(resolve => setTimeout(resolve, 300));

            // Fill reason textarea
            try {
                const reasonTextarea = await waitForElement('#flip-request-reason', 10000);
                reasonTextarea.value = 'Its a full pagekey';
                reasonTextarea.dispatchEvent(new Event('input', { bubbles: true }));
            } catch (e) {
                console.log('Reason textarea not found, might not be needed');
            }

            // Select Platform based on prefix
            const platformSelect = await waitForElement('#pagekey-platform-select');
            platformSelect.value = pageKey.startsWith('d_') ? 'DESKTOP' : 'PHONE OPTIMIZED';
            platformSelect.dispatchEvent(new Event('change', { bubbles: true }));

            // Select Portal
            const portalSelect = await waitForElement('#pagekey-portal-select');
            portalSelect.value = 'Voyager';
            portalSelect.dispatchEvent(new Event('change', { bubbles: true }));

            // Select Product
            const productSelect = await waitForElement('#pagekey-product-select');
            productSelect.value = 'Others';
            productSelect.dispatchEvent(new Event('change', { bubbles: true }));

            // Select Purpose
            const purposeSelect = await waitForElement('#pagekey-purpose-select');
            purposeSelect.value = 'Flagship';
            purposeSelect.dispatchEvent(new Event('change', { bubbles: true }));

            // Add owners
            await addOwners('eng', 'dokim clo');
            await addOwners('pm', 'npezarro rushabh lsomasun');
            await addOwners('ds', 'pmerkour amychen');

            // Select Voyager Ownership Team
            const teamSelect = await waitForElement('#pagekey-voyager-team-name-select');
            teamSelect.value = 'TopOfFunnel';
            teamSelect.dispatchEvent(new Event('change', { bubbles: true }));

            // Fill Description
            const descriptionTextarea = await waitForElement('#page-key-description');
            descriptionTextarea.value = pageKey;
            descriptionTextarea.dispatchEvent(new Event('input', { bubbles: true }));

            // Check Anchor Page checkbox
            const anchorPageCheckbox = await waitForElement('#anchor');
            if (!anchorPageCheckbox.checked) {
                anchorPageCheckbox.click();
                await new Promise(resolve => setTimeout(resolve, 200));
            }

            // Check RUM Required checkbox using multiple methods
            const rumCheckbox = await waitForElement('#rum');
            if (!rumCheckbox.checked) {
                rumCheckbox.checked = true;
                rumCheckbox.dispatchEvent(new Event('change', { bubbles: true }));
                rumCheckbox.dispatchEvent(new Event('input', { bubbles: true }));

                // Allow some time for the state to propagate
                await new Promise(resolve => setTimeout(resolve, 200));

                // Also try click as a fallback if still not checked
                if (!rumCheckbox.checked) {
                    rumCheckbox.click();
                }
            }

            // Final delay before saving
            await new Promise(resolve => setTimeout(resolve, 500));

            // Click Save button
            console.log('Looking for Save button');
            const saveButton = await waitForElement('button.save-btn');
            console.log('Found Save button, clicking');
            saveButton.click();

            console.log('Form fill completed successfully');
        } catch (error) {
            console.error('Error in fillForm:', error);
            // Add manual trigger button as fallback on error
            addManualTriggerButton();
        }
    }

    // Add a manual trigger button for cases where auto-start fails
    function addManualTriggerButton() {
        // Check if button already exists
        if (document.getElementById('manual-callisto-trigger')) {
            return;
        }

        const button = document.createElement('button');
        button.id = 'manual-callisto-trigger';
        button.textContent = 'Fill PageKey Form';
        button.style.position = 'fixed';
        button.style.top = '10px';
        button.style.right = '10px';
        button.style.zIndex = '9999';
        button.style.padding = '8px 12px';
        button.style.backgroundColor = '#0077b5';
        button.style.color = 'white';
        button.style.border = 'none';
        button.style.borderRadius = '4px';
        button.style.fontWeight = 'bold';
        button.style.cursor = 'pointer';

        button.addEventListener('click', () => {
            console.log('Manual trigger clicked');
            fillForm().catch(err => {
                console.error('Error during manual form fill:', err);
                alert('Error during form fill: ' + err.message);
            });
        });

        document.body.appendChild(button);
        console.log('Manual trigger button added');
    }

    // Check if the page has loaded (or is still loading)
    function startFormFill() {
        console.log('Document readyState:', document.readyState);

        // Always add the manual trigger button
        addManualTriggerButton();

        // If document is already complete, start the form fill
        if (document.readyState === 'complete') {
            console.log('Document already loaded, starting form fill');
            // Use setTimeout to ensure the page has fully rendered
            setTimeout(fillForm, 1500);
        } else {
            // Listen for the load event
            console.log('Waiting for page to load');
            window.addEventListener('load', () => {
                console.log('Page loaded, starting form fill');
                setTimeout(fillForm, 1500);
            });
        }
    }

    // Start the process
    startFormFill();
})();