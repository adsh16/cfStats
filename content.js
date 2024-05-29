// const fetchedSolvedProblemsData;
// const fetchedSolvedProblemResponse;
// fetchSolvedProblemsBOOL = false;

async function loadTemplate() {
  const response = await fetch(chrome.runtime.getURL('template.html'));
  const template = await response.text();
  return template;
}

function getUsernameFromTitle() {
  const title = document.querySelector('title').innerText;
  const username = title.split(' - ')[0];
  return username;
}

async function fetchSolvedProblems(handle) {
  fetchedSolvedProblemResponse = await fetch(`https://codeforces.com/api/user.status?handle=${handle}`);
  fetchSolvedProblems = await fetchedSolvedProblemResponse.json();
  return fetchSolvedProblems;
}

function toggleProblemList(event) {
  const ratingTitle = event.target;
  const problemList = ratingTitle.nextElementSibling;
  if (problemList.style.display === 'none') {
      problemList.style.display = 'block';
      ratingTitle.classList.add('open');
  } else {
      problemList.style.display = 'none';
      ratingTitle.classList.remove('open');
  }
}

function appendScript(src) {
  return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
  });
}

window.addEventListener('load', async () => {
  const handle = getUsernameFromTitle();

  if (handle) {
      const targetElement = document.querySelector('._UserActivityFrame_frame');

      if (targetElement) {
          const template = await loadTemplate();
          const container = document.createElement('div');
          container.id = 'solved-problems-container';
          container.innerHTML = template;

          targetElement.insertAdjacentElement('afterend', container);

          // Dynamically set the background image URL
          const arrowImageUrl = chrome.runtime.getURL('images/arrow.png');
          const style = document.createElement('style');
          style.innerHTML = `
              .rating-title::before {
                  background-image: url(${arrowImageUrl});
              }
          `;
          document.head.appendChild(style);

          try {
              const response = await fetchSolvedProblems(handle);
              if (response.status === "OK") {
                fetchSolvedProblemsBOOL = true;
                  const solvedProblems = response.result.filter(submission => submission.verdict === "OK").map(submission => submission.problem);
                  const resultDiv = document.getElementById('result');
                  resultDiv.innerHTML = '';

                  const problemsByRating = {};
                  solvedProblems.forEach(problem => {
                      const rating = problem.rating || 'Unrated';
                      if (!problemsByRating[rating]) {
                          problemsByRating[rating] = [];
                      }
                      problemsByRating[rating].push(problem);
                  });

                  for (const rating in problemsByRating) {
                      const problems = problemsByRating[rating];
                      const ratingSection = document.createElement('div');
                      ratingSection.className = 'rating-section';

                      const ratingTitle = document.createElement('div');
                      ratingTitle.className = 'rating-title';
                      ratingTitle.innerText = `Rating: ${rating}`;
                      ratingTitle.addEventListener('click', toggleProblemList);

                      const problemList = document.createElement('div');
                      problemList.className = 'problem-list';
                      problems.forEach(problem => {
                          const problemDiv = document.createElement('div');
                          problemDiv.innerHTML = `<a href="https://codeforces.com/problemset/problem/${problem.contestId}/${problem.index}" target="_blank">${problem.name}</a>`;
                          problemList.appendChild(problemDiv);
                      });

                      ratingSection.appendChild(ratingTitle);
                      ratingSection.appendChild(problemList);
                      resultDiv.appendChild(ratingSection);
                  }
              } else {
                  document.getElementById('result').innerText = 'Error fetching problems. Please try again.';
              }
          } catch (error) {
              document.getElementById('result').innerText = `Error: ${error.message}`;
          }
      }
  }
});

function graph(){
    const ctx = document.getElementById('problemGraph');
    new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['800', '900', '1000', '1100', '1200', '1300','1400'],
        datasets: [{
          label: '# of problems',
          data: [12, 19, 3, 5, 2, 3,5],
          borderWidth: 1
        }]
      },
    });
}

function unsolvedProblems(){
    // problem that have been submitted once or more. But have not been accepted
    // if(fetchedSolvedProblems){
    //     const unsolvedProblems = fetchedSolvedProblemResponse.filter
    // }
    // else{
    //     console.error("Error getting problems");
    // }
}
