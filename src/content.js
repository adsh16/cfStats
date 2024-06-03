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
  fetchedSolvedProblemsData = await fetchedSolvedProblemResponse.json();
  return fetchedSolvedProblemsData;
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

window.addEventListener('load', async () => {
  // No need to load Chart.js dynamically anymore
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
                  const solvedProblems = response.result.filter(submission => submission.verdict === "OK").map(submission => submission.problem);
                  const problemsByRating = displaySolvedProblems(solvedProblems);

                  // Call the function for unsolved problems
                  unsolvedProblems(response.result);

                  // Call the function for problemHistogram
                  problemHistogram(problemsByRating);
              } else {
                  document.getElementById('result').innerText = 'Error fetching problems. Please try again.';
              }
          } catch (error) {
              document.getElementById('result').innerText = `Error : ${error.message}`;
          }
      }
  }
});

function displaySolvedProblems(solvedProblems) {
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
  return problemsByRating;
}

function unsolvedProblems(submissions) {
  const solvedProblems = submissions.filter(submission => submission.verdict === "OK").map(submission => submission.problem);
  const solvedProblemIds = new Set(solvedProblems.map(problem => `${problem.contestId}-${problem.index}`));

  const notAcceptedSubmissions = submissions.filter(submission => submission.verdict !== "OK");
  const unsolvedProblemIds = new Set();
  const unsolvedProblems = [];

  notAcceptedSubmissions.forEach(submission => {
    const problemId = `${submission.problem.contestId}-${submission.problem.index}`;
    if (!solvedProblemIds.has(problemId) && !unsolvedProblemIds.has(problemId)) {
      unsolvedProblemIds.add(problemId);
      unsolvedProblems.push(submission.problem);
    }
  });

  const unsolvedDiv = document.getElementById('unsolvedProblems');
  unsolvedDiv.innerHTML = '';

  const unsolvedProblemCount = unsolvedProblems.length;
  const unsolvedProblemCountHeading = document.getElementById('unsolvedProblemCount');
  unsolvedProblemCountHeading.innerHTML = `<h5>Count: ${unsolvedProblemCount}</h5>`;

  if (unsolvedProblems.length === 0) {
    unsolvedDiv.innerText = 'No unsolved problems found.';
    return;
  }

  unsolvedProblems.forEach(problem => {
    const problemDiv = document.createElement('div');
    problemDiv.innerHTML = `<a href="https://codeforces.com/problemset/problem/${problem.contestId}/${problem.index}" target="_blank">${problem.name}</a>`;
    unsolvedDiv.appendChild(problemDiv);
  });
}

function problemHistogram(problemsByRating) {
  if (!problemsByRating) {
    console.error("problemsByRating is undefined");
    return;
  }
  console.log("problemsByRating:", problemsByRating);

  const ratings = Object.keys(problemsByRating)
    .map(rating => parseInt(rating))
    .filter(rating => !isNaN(rating))
    .sort((a, b) => a - b);

  console.log("ratings:", ratings);

  const problemCounts = ratings.map(rating => problemsByRating[rating].length);

  console.log("problemCounts:", problemCounts);

  // Get the canvas element
  const ctx = document.getElementById('problemGraph').getContext('2d');
  
  ctx.innerHTML = `<h1>testing</h1>`;
  
  // Create the histogram using Chart.js
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ratings,
      datasets: [{
        label: 'Number of Problems Solved',
        data: problemCounts,
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1
      }]
    },
    options: {
      scales: {
        x: {
          title: {
            display: true,
            text: 'Problem Rating'
          }
        },
        y: {
          title: {
            display: true,
            text: 'Number of Problems'
          },
          beginAtZero: true
        }
      },
      plugins: {
        legend: {
          display: false
        }
      }
    }
  });
}


// --------------------------------------------------------------------------