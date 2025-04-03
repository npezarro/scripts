// ==UserScript==
// @name         LinkedIn Games Alert Blocker
// @namespace    http://tampermonkey.net/
// @version      0.3
// @description  Disable alert dialogs and remove all hint usage/hoverable elements on LinkedIn Games pages
// @author       You
// @match        https://www.linkedin.com/games/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

    // Override the alert function immediately when the script runs
    // This will prevent any alerts from showing up
    window.alert = () => {};

    // Function to remove hint usage messages and other hoverable elements
    function removeHoverableElements() {
        // Target the specific hoverable content shell elements
        const hoverableShells = document.querySelectorAll('.artdeco-hoverable-content__shell');

        hoverableShells.forEach(element => {
            // Check if this is the hint usage element by looking for the specific content
            const contentDiv = element.querySelector('.artdeco-hoverable-content__content');
            if (contentDiv && contentDiv.textContent.trim().includes('players use hints')) {
                // Remove the element
                element.remove();
                console.log('Hint usage message removed');
            }
        });

        // Target the artdeco-hoverable-outlet container
        const hoverableOutlet = document.getElementById('artdeco-hoverable-outlet');
        if (hoverableOutlet) {
            hoverableOutlet.remove();
            console.log('Hoverable outlet removed');
        }

        // Also target any visible hoverable content with the artdeco-hoverable-content--visible class
        const visibleHoverables = document.querySelectorAll('.artdeco-hoverable-content--visible');
        visibleHoverables.forEach(element => {
            element.remove();
            console.log('Visible hoverable content removed');
        });
    }

    // Run when DOM is fully loaded
    document.addEventListener('DOMContentLoaded', removeHoverableElements);

    // Also check periodically in case the element is added dynamically after page load
    const observer = new MutationObserver(() => {
        removeHoverableElements();
    });

    // Start observing once the document body is available
    if (document.body) {
        observer.observe(document.body, { childList: true, subtree: true });
    } else {
        document.addEventListener('DOMContentLoaded', () => {
            observer.observe(document.body, { childList: true, subtree: true });
        });
    }

    // Log to console that the script is active
    console.log('LinkedIn Games Alert Blocker active - alerts disabled and all hint/hoverable elements will be removed');
})();