chrome.runtime.onInstalled.addListener(() => {
    console.log('Codeforces Tracker installed.');
  });
  
  // Function to fetch solved problems for a user
  async function fetchSolvedProblems(handle) {
    const response = await fetch(`https://codeforces.com/api/user.status?handle=${handle}`);
    const data = await response.json();
    return data;
  }
  
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "fetchSolvedProblems") {
      fetchSolvedProblems(request.handle).then(data => {
        sendResponse(data);
      });
      return true; // Indicates we will send a response asynchronously
    }
  });
  