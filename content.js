let settings = {
    enabled: true,
    showTime: true,
    hour24: false,
    showTimezone: true,
    showYear: true
};

// Loading settings from Chrome storage
function loadSettings() {
    return new Promise((resolve) => {
        chrome.storage.sync.get(settings, (result) => {
            settings = {...settings, ...result };
            resolve(settings);
        });
    });
}

function extractUnixTimestamp(idString) {
    // Convert 19 digit ID string into binary string
    const idBinary = BigInt(idString).toString(2);

    // Extract first 41 bits to get actual timestamp
    const timestampBits = idBinary.slice(0, 41);

    // Convert timestamp bits to decimal to get original timestamp (in milliseconds)
    const timeStamp = parseInt(timestampBits, 2);
    return timeStamp;
}

function formatTimestampToUTCDate(timestamp) {
    const date = new Date(timestamp);
    return date.toUTCString();
}

function formatTimestampToLocalDate(timestamp) {
    const date = new Date(timestamp);

    const options = {
        month: 'short',
        day: 'numeric',
    };

    if (settings.showYear) {
        options.year = 'numeric';
    }

    if (settings.showTime) {
        options.hour = 'numeric';
        options.minute = '2-digit';
        options.hour12 = !settings.hour24;
    }

    const dateTimeFormatted = date.toLocaleString(undefined, options);

    if (settings.showTime && settings.showTimezone) {
        const timezone = date.toLocaleString(undefined, {
            timeZoneName: 'short',
        }).split(' ').pop();
        return `${dateTimeFormatted} (${timezone})`;
    }
    
    return dateTimeFormatted;
}

const processedIds = new Set();

function convertRelativeToDateTime() {
    
    if (!settings.enabled) {
        return;
    }

    // Select all DOM elements with post or comment ids
    // data-id="urn:li:activity:7345418473369485316"
    // href="/feed/update/urn:li:activity:728760100897156300
    // data-id="urn:li:comment:(activity:7344165155187904512,7346597404298645506)"
    // data-urn="urn:li:activity:7287601008971563008"
    const elements = document.querySelectorAll("[data-id], [data-urn], a[href*='/feed/update/urn:li:activity']");
    const results  = [];

    // Extract target id from elements
    // dataset:  DOMStringMap
        // urn: "urn:li:activity:7287601008971563008"
        // id: "urn:li:comment:(activity:7287601008971563008,7287948535252033539)"
    elements.forEach(element => {
        console.log(element);
        const rawUrn = element.dataset.urn || element.dataset.id;
        if (!rawUrn) {
            return;
        }
        console.log(rawUrn);

        const matches = [...rawUrn.matchAll(/\d{19}/g)];
        // console.log(matches)

        let targetID = null

        if (rawUrn.startsWith('urn:li:comment')) {
            if (matches.length >= 2) {
                targetID = matches[1][0] // second ID for comment
            }
        } else {
            if (matches.length >= 1) {
                targetID = matches[0][0]
            }
        }

        if (!targetID) {
            return;
        }
        
        let targetSelector = rawUrn.startsWith('urn:li:comment') ? 'time.comments-comment-meta__data' : '.update-components-actor__sub-description > span[aria-hidden="true"]';
        const targetElement = element.querySelector(targetSelector);
        
        const hasExistingDateTime = targetElement && targetElement.querySelector('.linkedin-datetime-badge');
        
        if (processedIds.has(targetID) && hasExistingDateTime) {
            console.log(`Skipping duplicate ID with existing timestamp: ${targetID}`);
            return;
        }

        console.log(targetID);
        const timestamp = extractUnixTimestamp(targetID);
        
        // Convert into date format
        const date = formatTimestampToLocalDate(timestamp);
        console.log(date);

        addDateTime(element, date, rawUrn, targetID);
        
    });

}

function addDateTime(element, date, urn, id) {
    
    const isComment = urn.startsWith('urn:li:comment');
    let targetSelector = isComment ? 'time.comments-comment-meta__data' : '.update-components-actor__sub-description > span[aria-hidden="true"]';
   
    const targetElement = element.querySelector(targetSelector);

    if (targetElement) {
        console.log(targetElement);

        // Check if timestamp has already been added to this specific element
        const existingTimeStamp = targetElement.querySelector('.linkedin-datetime-badge');
        if (!existingTimeStamp) {
            createDateTimeSpan(date, targetElement, isComment);
            processedIds.add(id);
        }
       
    }
}

// Refresh date and time display when settings change
function refreshDateTime() {
    const existingBadges = document.querySelectorAll('.linkedin-datetime-badge');
    existingBadges.forEach((badge) => badge.remove());

    processedIds.clear();

    convertRelativeToDateTime();
}

function setupStorageListener() {
    // Listen for messages from popup
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        console.log("Received message in content.js:", message);
        if (message.action === 'settingsChanged') {
            settings = message.settings;

            if (settings.enabled) {
                refreshDateTime();
            } 
        }
    });
}

function createDateTimeSpan(date, element, isComment) {
    const badge = document.createElement("span");
    badge.style.fontSize = "1em";
    badge.style.color = "#666";
    badge.classList.add('linkedin-datetime-badge');

    badge.innerText = isComment ? `${date} •` : `${date} • `;

    element.prepend(badge);
}


function initializeTimestampConverter() {

    loadSettings().then(() => {
        if (settings.enabled) {
            convertRelativeToDateTime();
        }
    });

    setupStorageListener();

    const observer = new MutationObserver((mutations) => {
        if (!settings.enabled) return;

        let shouldRerun = false;

        mutations.forEach((mutation) => {
            // Check if new nodes were added
            if (mutation.addedNodes.length > 0) {
                for (const node of mutation.addedNodes) {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        const hasLinkedInId = node.querySelector && (
                            node.querySelector('[data-id], [data-urn]') ||
                            node.matches('[data-id], [data-urn]') ||
                            /\d{19}/.test(node.outerHTML)
                        );
                        
                        if (hasLinkedInId) {
                            shouldRerun = true;
                            break;
                        }
                    }
                }
            }
        });

        if (shouldRerun) {
            // Debounce the conversion
            clearTimeout(window.linkedinTimestampTimeout);

            // Set a new timeout for 500ms from now
            window.linkedinTimestampTimeout = setTimeout(() => {
                convertRelativeToDateTime();
            }, 500);
        }

    });

    observer.observe(document.body, {
        childList: true,
        subtree: true,
    });

}

initializeTimestampConverter();

// update-components-actor__sub-description text-body-xsmall
// t-black--light
                
{/* <div class="comments-comment-meta__info">
<time class="comments-comment-meta__data">
    5mo
</time> */}