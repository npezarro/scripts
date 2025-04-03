// ==UserScript==
// @name         LinkedIn TREx Auto Approval and Activation (on page load, request approval or start activation if button available)
// @namespace    http://tampermonkey.net/
// @version      0.3
// @description  Automatically handles approval and activation flows on LinkedIn TREx iteration pages
// @author       You
// @match        https://trex.corp.linkedin.com/trex/test/*
// @match        https://trex.corp.linkedin.com/trex/test/*/iteration/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';

    // Function to find and click the Request Approval button, then select the approval group, and submit
    function findAndClickApprovalButton() {
        // Look for the specific button with the class and text
        const approvalButton = Array.from(document.querySelectorAll('button.primary-medium-button.iteration-actions.iteration-request-approval')).find(
            button => button.textContent.trim() === 'Request Approval'
        );

        if (approvalButton) {
            console.log('TREx Auto: Found Request Approval button, clicking it...');
            approvalButton.click();

            // Wait a short time for the dropdown to appear after clicking the button
            setTimeout(() => {
                // Select "moonshots-eng" from the approval group dropdown
                const approvalGroupDropdown = document.getElementById('approval-group');
                if (approvalGroupDropdown) {
                    console.log('TREx Auto: Found approval group dropdown, selecting moonshots-eng...');
                    approvalGroupDropdown.value = 'moonshots-eng';

                    // Trigger change event to ensure the UI updates
                    const changeEvent = new Event('change', { bubbles: true });
                    approvalGroupDropdown.dispatchEvent(changeEvent);

                    console.log('TREx Auto: Successfully selected moonshots-eng');

                    // Wait a moment and then click the Submit button
                    setTimeout(() => {
                        const submitButton = document.querySelector('button.primary-large-button.btn-submit-request[type="submit"]');
                        if (submitButton) {
                            console.log('TREx Auto: Found Submit button, clicking it...');
                            submitButton.click();
                            console.log('TREx Auto: Successfully submitted the approval request');
                        } else {
                            console.log('TREx Auto: Could not find Submit button');
                        }
                    }, 300); // 300ms delay before clicking submit
                } else {
                    console.log('TREx Auto: Could not find approval group dropdown');
                }
            }, 500); // 500ms delay to allow the dropdown to appear

            return true;
        } else {
            console.log('TREx Auto: Request Approval button not found yet, will check for Begin Activating button...');
            return tryActivatingButton();
        }
    }

    // Function to find and click the Begin Activating button
    function tryActivatingButton() {
        const activatingButton = Array.from(document.querySelectorAll('button.primary-medium-button.iteration-actions.iteration-activating')).find(
            button => button.textContent.trim() === 'Begin Activating'
        );

        if (activatingButton) {
            console.log('TREx Auto: Found Begin Activating button, clicking it...');
            activatingButton.click();
            return true;
        } else {
            console.log('TREx Auto: Neither Request Approval nor Begin Activating buttons found yet, will try again...');
            return false;
        }
    }

    // Add a small delay before initial check to ensure page is fully loaded
    setTimeout(() => {
        console.log('TREx Auto: Script starting on URL: ' + window.location.href);

        // Initial attempt to find and click either button
        let buttonFound = findAndClickApprovalButton();

        // If no button found immediately, set up a mutation observer to watch for DOM changes
        if (!buttonFound) {
            // Check periodically in case the button appears after page load or dynamic content changes
            let checkCount = 0;
            const maxChecks = 10;

            const observer = new MutationObserver(function(mutations) {
                if (buttonFound || checkCount >= maxChecks) {
                    observer.disconnect();
                    return;
                }

                checkCount++;
                buttonFound = findAndClickApprovalButton();

                if (buttonFound) {
                    observer.disconnect();
                }
            });

            // Start observing the document with the configured parameters
            observer.observe(document.body, { childList: true, subtree: true });

            // Also set a timeout for cases where the button might appear without triggering the observer
            const intervalId = setInterval(function() {
                if (buttonFound || checkCount >= maxChecks) {
                    clearInterval(intervalId);
                    return;
                }

                checkCount++;
                console.log('TREx Auto: Check #' + checkCount + ' for buttons...');
                buttonFound = findAndClickApprovalButton();

                if (buttonFound) {
                    clearInterval(intervalId);
                }
            }, 1000); // Check every second, up to maxChecks times
        }
    }, 1000); // Wait 1 second for page to fully load
})();