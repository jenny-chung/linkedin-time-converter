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

function formatTimestampToLocalDate(timestamp, isHour12) {
    const date = new Date(timestamp);

    const dateTimeFormatted = date.toLocaleString(undefined, {
        hour: 'numeric',
        minute: '2-digit',
        hour12: isHour12,
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });

    const timezone = date.toLocaleString(undefined, {
        timeZoneName: 'short',
    }).split(' ').pop()

    return `${dateTimeFormatted} (${timezone})`;
}

function convertRelativeToDateTime() {
    
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
    elements.forEach(e => {

        const rawUrn = e.dataset.urn || e.dataset.id;
        if (!rawUrn) {
            return;
        }
        console.log(rawUrn);

        const matches = [...rawUrn.matchAll(/\d{19}/g)];
        console.log(matches)

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

        console.log(targetID);
        const timestamp = extractUnixTimestamp(targetID);
        
        // Convert into date format
        const date = formatTimestampToLocalDate(timestamp, true);
        console.log(date);
        
        results.push({ element: e, urn: rawUrn, id: targetID, date });
    });
    

    results.forEach(({ element, urn, date }) => {
        // Check if this element has already been processed
        if (element.classList.contains('linkedin-timestamp-processed')) {
            return;
        }

        // Mark element as processed
        element.classList.add('linkedin-timestamp-processed');

        if (urn.startsWith('urn:li:comment')) {

            const timeElement = element.querySelector('time.comments-comment-meta__data');
            console.log(timeElement);
            
            if (timeElement) {
                const badge = document.createElement("span");
                badge.innerText = `${date} •`;
                badge.style.fontSize = "1em";
                badge.style.color = "#666";

                timeElement.prepend(badge);
            }

        } else {

            const postTimeElement = element.querySelector('.update-components-actor__sub-description > span[aria-hidden="true"]');
            console.log(postTimeElement);

            if (postTimeElement) {
                const badge = document.createElement("span");
                badge.innerText = `${date} • `;
                badge.style.fontSize = "1em";
                badge.style.color = "#666";

                postTimeElement.prepend(badge);
            }
            
        }
    });

}

// update-components-actor__sub-description text-body-xsmall
// t-black--light
                
// {/* <time class="comments-comment-meta__data">
// 5mo
// </time>              */}
{/* <div class="comments-comment-meta__info">
<time class="comments-comment-meta__data">
    5mo
</time> */}

function initializeTimestampConverter() {

    convertRelativeToDateTime();

    const observer = new MutationObserver((mutations) => {
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





