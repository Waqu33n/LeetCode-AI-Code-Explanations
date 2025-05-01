console.log("Content script loaded on:", window.location.href);
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "explainSelectedCode") {
        try {
            analyzeSelectedCode();
            sendResponse({ status: "done" });
        } catch (err) {
            console.error("Error in message listener:", err);
        }
    }
    return true;
});
function getSelectedText() {
    const selection = window.getSelection();
    if (selection && selection.toString().trim() !== "") {
        return selection.toString().trim();
    }
    return null;
}

let spinInterval = null;

function showSpinner() {
    const spinner = document.getElementById('thinking-spinner');
    if (!spinner) return;

    spinner.style.display = 'block';
    let dots = 0;

    spinnerInterval = setInterval(() => {
        dots = (dots + 1) % 4; 
        spinner.innerText = 'Thinking' + '.'.repeat(dots);
    }, 500);
}

function hideSpinner() {
    const spinner = document.getElementById('thinking-spinner');
    if (spinner) {
        spinner.style.display = 'none';
        spinner.innerText = 'Thinking...';  // Reset default
    }
    if (spinnerInterval) {
        clearInterval(spinnerInterval);
        spinnerInterval = null;
    }
}

function readChunk(reader, modalContent, decoder, onDone) {
    reader.read().then(({ done, value }) => {
        if (done) {
            console.log("Stream finished.");
            if (onDone) onDone();
            return;
        }

        if (!value) {
            console.warn("Empty chunk received — skipping.");
            readChunk(reader, modalContent, decoder, onDone);
            return;
        }

        try {
            const text = decoder.decode(value, { stream: true });

            const isUserAtBottom =
                modalContent.scrollHeight - modalContent.scrollTop <= modalContent.clientHeight + 10;

            modalContent.textContent += text;

            if (isUserAtBottom) {
                modalContent.scrollTop = modalContent.scrollHeight;
            }
        } catch (e) {
            console.error("Decode error:", e);
        }

        readChunk(reader, modalContent, decoder, onDone);
    }).catch(err => {
        console.error("Streaming error:", err);
        modalContent.textContent += "\n[Stream interrupted]";
        if (onDone) onDone();
    });
}

function analyzeSelectedCode() {
    console.log("Analyzing...");
    const selectedText = getSelectedText();
    if (selectedText) {
        displayExplanation("");

        const followUpInput = document.getElementById('followup-input');
        const sendBtn = followUpInput?.nextElementSibling;

        if (followUpInput) followUpInput.disabled = true;
        if (sendBtn) sendBtn.disabled = true;

        streamController = new AbortController();
        const signal = streamController.signal;

        showSpinner();

        fetch('http://localhost:5000/explain', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code: selectedText }),
            signal: signal,
        }).then(response => {
            const reader = response.body?.getReader();
            const decoder = new TextDecoder("utf-8");
            const modalContent = document.getElementById("modal-stream-output");

            if (!reader || !modalContent) {
                console.warn("Streaming reader or modal content not available.");
                return;
            }

            hideSpinner();

            readChunk(reader, modalContent, decoder, () => {
                streamController = null;
                if (followUpInput) followUpInput.disabled = false;
                if (sendBtn) sendBtn.disabled = false;
            });

        }).catch((error) => {
            console.error('Initial explain fetch error:', error);
            streamController = null;
            if (followUpInput) followUpInput.disabled = false;
            if (sendBtn) sendBtn.disabled = false;
            hideSpinner();
        });
    }
    else {
        alert("Please highlight some code first!");
    }
}


function attemptFollowUp() {
    const followUpInput = document.getElementById('followup-input');
    const sendBtn = followUpInput?.nextElementSibling;
    const modalContent = document.getElementById("modal-stream-output");

    if (!followUpInput || !sendBtn || !modalContent) return;

    if (streamController) {
        console.warn("Stream still in progress, please wait...");
        return;
    }

    const text = followUpInput.value.trim();
    if (!text) {
        alert("Please type something!");
        return;
    }

    sendFollowUp(text);
    followUpInput.value = '';
}

function sendFollowUp(followUpText) {
    const modalContent = document.getElementById("modal-stream-output");
    if (!modalContent) return;

    modalContent.textContent += `\n\nUser: ${followUpText}\nAssistant: `;

    const followUpInput = document.getElementById('followup-input');
    const sendBtn = followUpInput?.nextElementSibling;

    if (followUpInput) followUpInput.disabled = true;
    if (sendBtn) sendBtn.disabled = true;

    streamController = new AbortController();
    const signal = streamController.signal;

    showSpinner();

    fetch('http://localhost:5000/followup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: followUpText }),
        signal: signal,
    }).then(response => {
        const reader = response.body?.getReader();
        const decoder = new TextDecoder("utf-8");

        if (!reader) {
            console.warn("No stream reader available.");
            return;
        }

        hideSpinner();

        readChunk(reader, modalContent, decoder, () => {
            streamController = null;
            if (followUpInput) followUpInput.disabled = false;
            if (sendBtn) sendBtn.disabled = false;
        });

    }).catch((error) => {
        console.error('Follow-up fetch error:', error);
        streamController = null;
        if (followUpInput) followUpInput.disabled = false;
        if (sendBtn) sendBtn.disabled = false;
        hideSpinner();
    });
}


let streamController = null

function displayExplanation(initialText) {
    const existing = document.getElementById('leetcode-explain-modal');
    if (existing) existing.remove();

    const modalContainer = document.createElement('div');
    modalContainer.id = 'leetcode-explain-modal';
    modalContainer.style.position = 'fixed';
    modalContainer.style.top = '20px';
    modalContainer.style.left = '20px';
    modalContainer.style.width = '400px';
    modalContainer.style.height = '400px';
    modalContainer.style.display = 'flex';
    modalContainer.style.flexDirection = 'column';
    modalContainer.style.backgroundColor = '#f9f9f9';
    modalContainer.style.border = '1px solid #ccc';
    modalContainer.style.borderRadius = '8px';
    modalContainer.style.boxShadow = '0px 4px 8px rgba(0, 0, 0, 0.2)';
    modalContainer.style.padding = '0';
    modalContainer.style.zIndex = '99999';
    modalContainer.style.overflow = 'hidden';
    modalContainer.style.resize = 'both';

    const modalHeader = document.createElement('div');
    modalHeader.style.backgroundColor = '#3b3b3b';
    modalHeader.style.padding = '5px 10px';
    modalHeader.style.cursor = 'move';
    modalHeader.style.borderBottom = '1px solid #ccc';
    modalHeader.style.display = 'flex';
    modalHeader.style.justifyContent = 'space-between';
    modalHeader.style.alignItems = 'center';

    const title = document.createElement('span');
    title.innerText = 'Code Explanation';
    modalHeader.appendChild(title);

    const closeBtn = document.createElement('button');
    closeBtn.innerText = '✖';
    closeBtn.style.border = 'none';
    closeBtn.style.background = 'transparent';
    closeBtn.style.cursor = 'pointer';
    closeBtn.style.fontSize = '16px';
    closeBtn.onclick = () => {
        if (streamController) {
            streamController.abort();
        }
        modalContainer.remove();
    };
    modalHeader.appendChild(closeBtn);

    modalContainer.appendChild(modalHeader);

    const modalContent = document.createElement('pre');
    modalContent.id = 'modal-stream-output';
    modalContent.style.padding = '10px';
    modalContent.style.flex = '1';
    modalContent.style.height = 'calc(100% - 90px)';
    modalContent.style.overflowY = 'auto';
    modalContent.style.color = '#000';
    modalContent.style.whiteSpace = 'pre-wrap';
    modalContent.style.fontFamily = 'monospace';
    modalContent.style.margin = '0';
    modalContent.textContent = initialText;
    modalContainer.appendChild(modalContent);

    const spinner = document.createElement('div');
    spinner.id = 'thinking-spinner';
    spinner.style.padding = '5px';
    spinner.style.fontSize = '14px';
    spinner.style.color = '#555';
    spinner.innerText = 'Thinking...';
    spinner.style.display = 'none';
    modalContainer.appendChild(spinner);

    // Add input for follow-up question
    const inputContainer = document.createElement('div');
    inputContainer.style.display = 'flex';
    inputContainer.style.padding = '8px';
    inputContainer.style.gap = '8px';
    inputContainer.style.borderTop = '1px solid #ccc'; 
    inputContainer.style.backgroundColor = '#f0f0f0';   

    const followUpInput = document.createElement('input');
    followUpInput.type = 'text';
    followUpInput.placeholder = 'Ask a follow-up question...';
    followUpInput.style.flex = '1';
    followUpInput.style.padding = '8px';
    followUpInput.style.border = 'none';
    followUpInput.style.outline = 'none';
    followUpInput.id = 'followup-input';

    const sendBtn = document.createElement('button');
    sendBtn.innerText = 'Send';
    sendBtn.style.padding = '8px 12px';
    sendBtn.style.border = 'none';
    sendBtn.style.backgroundColor = '#4CAF50';
    sendBtn.style.color = 'white';
    sendBtn.style.cursor = 'pointer';

    inputContainer.appendChild(followUpInput);
    inputContainer.appendChild(sendBtn);
    modalContainer.appendChild(inputContainer);

    document.body.appendChild(modalContainer);
    makeDraggable(modalContainer, modalHeader);

    sendBtn.onclick = () => {
        attemptFollowUp();
    };

    followUpInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter'){
            attemptFollowUp();
        }
    });
}

function makeDraggable(modal, header) {
    let offsetX = 0, offsetY = 0, isDragging = false;
    header.onmousedown = (e) => {
        e.preventDefault();
        offsetX = e.clientX - modal.offsetLeft;
        offsetY = e.clientY - modal.offsetTop;
        isDragging = true;
        document.onmousemove = dragMouseMove;
        document.onmouseup = stopDrag;
    };
    function dragMouseMove(e) {
        if (isDragging) {
            let newLeft = e.clientX - offsetX;
            let newTop = e.clientY - offsetY;
    
            const windowWidth = window.innerWidth;
            const windowHeight = window.innerHeight;
    
            const modalWidth = modal.offsetWidth;
            const modalHeight = modal.offsetHeight;
    
            newLeft = Math.max(0, Math.min(newLeft, windowWidth - modalWidth));
            newTop  = Math.max(0, Math.min(newTop, windowHeight - modalHeight));
    
            modal.style.left = newLeft + 'px';
            modal.style.top = newTop + 'px';
        }
    }
    function stopDrag() {
        isDragging = false;
        document.onmousemove = null;
        document.onmouseup = null;
    }
}
