async function configurePanel(): Promise<void> {
  try {
    // Route the toolbar gesture through onClicked so activeTab is granted before the panel scans.
    await chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: false });
  } catch (error) {
    console.error('ClearView could not configure its side panel:', error);
  }
}

chrome.runtime.onInstalled.addListener(() => { void configurePanel(); });
chrome.runtime.onStartup.addListener(() => { void configurePanel(); });
chrome.action.onClicked.addListener(tab => {
  if (typeof tab.id !== 'number') return;
  void chrome.sidePanel.open({ tabId: tab.id }).catch(error => {
    console.error('ClearView could not open its side panel:', error);
  });
});
void configurePanel();
