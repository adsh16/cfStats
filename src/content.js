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
  const response = await fetch(`https://codeforces.com/api/user.status?handle=${handle}`);
  const data = await response.json();
  return data;
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

let currentChart;

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
          // Ignore the errors
          console.log("Ignore the errors :}");
          
          const solvedProblems = response.result.filter(submission => submission.verdict === "OK").map(submission => submission.problem);
          const problemsByRating = displaySolvedProblems(solvedProblems);

          unsolvedProblems(response.result);
          problemHistogram(problemsByRating);

          document.getElementById('graph-type').addEventListener('change', (event) => {
            problemHistogram(problemsByRating, event.target.value);
          });
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
    problemList.style = "padding-top: 0.5em;padding-bottom: 0.5em;" // adding padding
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

function problemRatingBackgroundColor(rating) {
  const legendaryGrandmaster = 'rgba(170,  0,  0, 1)';
  const internationalGrandmaster = 'rgba(255, 51, 51, 1)';
  const grandmaster = 'rgba(255, 119, 119, 1)';
  const internationalMaster = 'rgba(255, 187, 85, 1)';
  const master = 'rgba(255, 204, 136, 1)';
  const candidateMaster = 'rgba(255, 136, 255, 1)';
  const expert = 'rgba(170, 170, 255, 1)';
  const specialist = 'rgba(119, 221, 187, 1)';
  const pupil = 'rgba(119, 255, 119, 1)';
  const newbie = 'rgba(204, 204, 204, 1)';
  const borderColor = 'rgba(0, 0, 0, 1)';
  
  if (rating >= 3000) {
    return { backgroundColor: legendaryGrandmaster, borderColor };
  } else if (rating >= 2600 && rating <= 2999) {
    return { backgroundColor: internationalGrandmaster, borderColor };
  } else if (rating >= 2400 && rating <= 2599) {
    return { backgroundColor: grandmaster, borderColor };
  } else if (rating >= 2300 && rating <= 2399) {
    return { backgroundColor: internationalMaster, borderColor };
  } else if (rating >= 2100 && rating <= 2299) {
    return { backgroundColor: master, borderColor };
  } else if (rating >= 1900 && rating <= 2099) {
    return { backgroundColor: candidateMaster, borderColor };
  } else if (rating >= 1600 && rating <= 1899) {
    return { backgroundColor: expert, borderColor };
  } else if (rating >= 1400 && rating <= 1599) {
    return { backgroundColor: specialist, borderColor };
  } else if (rating >= 1200 && rating <= 1399) {
    return { backgroundColor: pupil, borderColor };
  } else {
    return { backgroundColor: newbie, borderColor };
  }
}

function problemHistogram(problemsByRating, chartType = 'line') {
  if (!problemsByRating) {
    console.error("problemsByRating is undefined");
    return;
  }

  const ratings = Object.keys(problemsByRating)
    .map(rating => parseInt(rating))
    .filter(rating => !isNaN(rating))
    .sort((a, b) => a - b);

  const problemCounts = ratings.map(rating => problemsByRating[rating].length);

  const canvas = document.getElementById('problemGraph');
  const ctx = canvas.getContext('2d');

  if (currentChart) {
    currentChart.destroy();
  }

  const backgroundColors = ratings.map(rating => problemRatingBackgroundColor(rating).backgroundColor);
  const borderColors = ratings.map(rating => {
    if (chartType === 'doughnut' || chartType === 'pie') {
      return 'rgba(255, 255, 255, 1)'; // White border color for doughnut or pie chart
    } else {
      return problemRatingBackgroundColor(rating).borderColor;
    }
  });


  const chartOptions = {
    type: chartType,
    data: {
      labels: ratings,
      datasets: [{
        label: 'Number of Problems Solved',
        data: problemCounts,
        backgroundColor: backgroundColors,
        borderColor: borderColors,
        borderWidth: 1,
        pointRadius: 8,
        pointHoverRadius: 12
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
  };

  currentChart = new Chart(ctx, chartOptions);
}
