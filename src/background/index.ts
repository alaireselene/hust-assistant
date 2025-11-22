const HUST_ORIGIN_SUFFIX = '.hust.edu.vn';

chrome.tabs.onUpdated.addListener(async (tabId, info, tab) => {
    if (!tab.url) return;

    try {
        const url = new URL(tab.url);
        // Enables the side panel on *.hust.edu.vn
        if (url.hostname.endsWith(HUST_ORIGIN_SUFFIX)) {
            await chrome.sidePanel.setOptions({
                tabId,
                path: 'src/sidepanel/index.html',
                enabled: true
            });
        } else {
            // Disables the side panel on all other sites
            await chrome.sidePanel.setOptions({
                tabId,
                enabled: false
            });
        }
    } catch (error) {
        console.error('Error updating side panel options:', error);
    }
});

// Also check on tab activation to ensure state is correct when switching tabs
chrome.tabs.onActivated.addListener(async (activeInfo) => {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    if (!tab.url) return;

    try {
        const url = new URL(tab.url);
        if (url.hostname.endsWith(HUST_ORIGIN_SUFFIX)) {
            await chrome.sidePanel.setOptions({
                tabId: activeInfo.tabId,
                path: 'src/sidepanel/index.html',
                enabled: true
            });
        } else {
            await chrome.sidePanel.setOptions({
                tabId: activeInfo.tabId,
                enabled: false
            });
        }
    } catch (error) {
        console.error('Error updating side panel options on activation:', error);
    }
});
