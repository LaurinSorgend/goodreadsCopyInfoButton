// ==UserScript==
// @name         Goodreads Copy Book Info
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Adds a button to copy book information
// @author       laurin@sorgend.eu
// @match        https://www.goodreads.com/book/show/*
// @grant        GM_setClipboard
// ==/UserScript==

(function() {
    'use strict';

    function waitForElement(selector, callback, checkFrequencyInMs, timeoutInMs) {
        const startTimeInMs = Date.now();
        (function loopSearch() {
            if (document.querySelector(selector) !== null) {
                callback();
                return;
            }
            else {
                setTimeout(function () {
                    if (timeoutInMs && Date.now() - startTimeInMs > timeoutInMs) {
                        return;
                    }
                    loopSearch();
                }, checkFrequencyInMs);
            }
        })();
    }

    function addCopyButton() {

    const buttonBar = document.getElementsByClassName("BookActions")[0];
    const copyButton = document.getElementsByClassName("BookActions__button")[0].cloneNode(true);
    copyButton.innerHTML = '<div class="Button__container Button__container--block"><button type="button" class="Button Button--secondary Button--medium Button--block"><span class="Button__labelItem">Copy Info</span></button></div>';

    const actualButton = copyButton.querySelector("button");

    actualButton.addEventListener('click', function() {
        const bookInfo = getBookInfo();
        GM_setClipboard(bookInfo);
        const originalText = this.querySelector(".Button__labelItem").textContent;
        this.querySelector(".Button__labelItem").textContent = 'Copied!';
        setTimeout(() => {
            this.querySelector(".Button__labelItem").textContent = originalText;
        }, 1500);
    });

    buttonBar.appendChild(copyButton);
    console.log("'Copy Info' button added!");
    }

    function getBookInfo() {
        const titleElement = document.querySelector('h1.Text__title1');
        const title = titleElement ? titleElement.textContent.trim() : '';

        let seriesName = '';
        let seriesNumber = '';

        const seriesElements = document.querySelector('h3.Text__title3 a');
        if (seriesElements.length > 0) {
            const seriesElement = seriesElements[0];
            const seriesText = seriesElement.textContent.trim();
            const regex = /\s*(?:#\s*)?(\d+(?:-\d+)?(?:\.\d+)?)\s*$/;
            const match = seriesText.match(regex);
            if (match) {
                seriesName = seriesText.slice(0, seriesText.lastIndexOf(match[0])).trim();
                seriesNumber = match[1];
            }
            else {
                seriesName = seriesText.trim();
                seriesNumber = null;
            }
        }

        let pages = '';
        const pagesElement = document.querySelector('p[data-testid="pagesFormat"]');
        if (pagesElement) {
            const pagesMatch = pagesElement.textContent.match(/(\d+)\s+pages/);
            if (pagesMatch) {
                pages = pagesMatch[1];
            }
        }

        if (!pages) {
            const detailsElements = document.querySelectorAll('.BookDetails .BookDetails__list span');
            for (let i = 0; i < detailsElements.length; i++) {
                const text = detailsElements[i].textContent;
                if (text.includes('pages')) {
                    pages = text.replace(/\D/g, '');
                    break;
                }
            }
        }

        const ratingElement = document.querySelector('.RatingStatistics__rating');
        const rating = ratingElement ? ratingElement.textContent.trim() : '';

        const authorElement = document.querySelector('.ContributorLink__name');
        let authorFullName = authorElement ? authorElement.textContent.trim() : '';
        let authorLastFirst = '';

        if (authorFullName) {
            const nameParts = authorFullName.split(' ');
            if (nameParts.length > 1) {
                const lastName = nameParts.pop();
                const firstName = nameParts.join(' ');
                authorLastFirst = `${lastName}, ${firstName}`;
            } else {
                authorLastFirst = authorFullName;
            }
        }

        let publishDate = '';

        const pubInfoElement = document.querySelector('p[data-testid="publicationInfo"]');
        if (pubInfoElement) {
            const pubText = pubInfoElement.textContent.trim();
            const fullDateMatch = pubText.match(/(?:First |)published\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{4})/i);
            if (fullDateMatch) {
                publishDate = `${fullDateMatch[1]} ${fullDateMatch[2]}, ${fullDateMatch[3]}`;
            } else {
                const yearMatch = pubText.match(/(?:First |)published\s+(\d{4})/i);
                if (yearMatch) {
                    publishDate = yearMatch[1];
                }
            }
        }

      const options = {
      year: "numeric",
      month: "short",
      day: "numeric",
      };
        const d = new Date().toLocaleDateString("en-UK", options);
        // console.log(`Copied '${title}\t${seriesName}\t${seriesNumber}\t\t${pages}\t${rating}\t${authorLastFirst}\t\t${publishDate}\t\t\t${d}'`)
        return `${title}\t${seriesName}\t${seriesNumber}\t\t${pages}\t${rating}\t${authorLastFirst}\t\t${publishDate}\t\t\t${d}`;
    }

    waitForElement('h1.Text__title1', addCopyButton, 100, 10000);
})();