chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: "explainCode",
        title: "Explain Selected Code",
        contexts: ["selection"]
    });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "explainCode" && tab.id) {
        chrome.tabs.sendMessage(tab.id, { action: 'explainSelectedCode' }, (response) => {
            if (chrome.runtime.lastError) {
                console.error("Error sending message:", chrome.runtime.lastError.message);
            } else {
                console.log("Message sent successfully.");
            }
        });
    }
});
