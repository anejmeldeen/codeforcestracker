const RECENT_SUBMISSION_COUNT = 4;
const LARGE_POINT_SIZE = 3.5;
const SMALL_POINT_SIZE = 2.5;
const PROBLEM_PER_TAG = 4;
const TAG_FRACTIONS = {
  "greedy": 0.0741,
  "math": 0.0734,
  "implementation": 0.0676,
  "dp": 0.0536,
  "constructive algorithms": 0.0445,
  "data structures": 0.0439,
  "brute force": 0.0433,
  "binary search": 0.0274,
  "sortings": 0.0269,
  "graphs": 0.0268,
  "dfs and similar": 0.0234,
  "trees": 0.0204,
  "number theory": 0.0189,
  "strings": 0.0179,
  "combinatorics": 0.0172,
  "bitmasks": 0.0146,
  "two pointers": 0.0137,
  "*special": 0.0128,
  "geometry": 0.0096,
  "dsu": 0.0089,
  "divide and conquer": 0.0075,
  "shortest paths": 0.0066,
  "games": 0.006,
  "interactive": 0.0059,
  "probabilities": 0.0057,
  "hashing": 0.0053,
  "flows": 0.0037,
  "matrices": 0.0031,
  "fft": 0.0024,
  "graph matchings": 0.0023,
  "string suffix structures": 0.0022,
  "ternary search": 0.0015,
  "meet-in-the-middle": 0.0012,
  "2-sat": 0.0009,
  "expression parsing": 0.0009,
  "chinese remainder theorem": 0.0005,
  "schedules": 0.0003,
};
const MOST_COMMON = new Set([
  "greedy",
  "math",
  "implementation",
  "dp",
  "constructive algorithms",
  "data structures",
  "brute force",
  "binary search",
  "sortings",
  "graphs",
  "number theory",
  "two pointers",
]);

const params = new URLSearchParams(window.location.search);
let handle = params.get("handle");
document.getElementById("userHandle").textContent = handle || "Unknown";

async function loadData() {
  try {
    const userRes = await fetch(
      `https://codeforces.com/api/user.info?handles=${handle}`
    );
    const userData = await userRes.json();

    if (userData.status !== "OK") {
      localStorage.setItem("error", "Invalid handle: " + handle);
      window.location.href = "index.html";
      return;
    }

    handle = userData.result[0].handle;

    // activate user codeforces button
    document.getElementById(
      "cfProfileBtn"
    ).href = `https://codeforces.com/profile/${handle}`;

    // classifies the users rank to change color
    const currRating = userData.result[0].rating;
    let newUser = "";
    if (currRating < 1200) {
      newUser =
        '<span style="color: #A0A0A0; font-weight: bold;">' +
        handle +
        " - newbie</span>";
    } else if (currRating < 1400) {
      newUser =
        '<span style="color: #008000; font-weight: bold;">' +
        handle +
        " - pupil</span>";
    } else if (currRating < 1600) {
      newUser =
        '<span style="color: #03A89E; font-weight: bold;">' +
        handle +
        " - specialist</span>";
    } else if (currRating < 1900) {
      newUser =
        '<span style="color: #0437F2; font-weight: bold;">' +
        handle +
        " - expert</span>";
    } else if (currRating < 2100) {
      newUser =
        '<span style="color: #AA00AA; font-weight: bold;">' +
        handle +
        " - candidate master</span>";
    } else if (currRating < 2300) {
      newUser =
        '<span style="color: #FF8C00; font-weight: bold;">' +
        handle +
        " - master</span>";
    } else if (currRating < 2400) {
      newUser =
        '<span style="color: #FF8C00; font-weight: bold;">' +
        handle +
        " - international master</span>";
    } else if (currRating < 2600) {
      newUser =
        '<span style="color: #FF0000; font-weight: bold;">' +
        handle +
        " - grandmaster</span>";
    } else if (currRating < 3000) {
      newUser =
        '<span style="color: #FF0000; font-weight: bold;">' +
        handle +
        " - international grandmaster</span>";
    } else {
      newUser =
        '<span style="color: white; font-weight: bold;">' +
        handle[0] +
        "</span>" +
        '<span style="color: red; font-weight: bold;">' +
        handle.slice(1) +
        " - legendary grandmaster </span>";
    }

    // setting rating info
    document.getElementById("userHandle").innerHTML = newUser;
    document.getElementById("userRating").innerHTML =
      '<span style="color: #facc15; font-weight: bold;">Current Rating: </span>' +
      '<span style="color: white; font-weight: bold;">' +
      userData.result[0].rating +
      '</span>&nbsp;&nbsp;&nbsp;<span style="color: #facc15; font-weight: bold;">Max Rating: </span>' +
      '<span style="color: white; font-weight: bold;">' +
      userData.result[0].maxRating +
      "</span>";
    document.getElementById("userAvatar").src = userData.result[0].titlePhoto;

    // getting all past ratings
    const ratingsRes = await fetch(
      `https://codeforces.com/api/user.rating?handle=${handle}`
    );
    const ratingsData = await ratingsRes.json();
    let currentRating = ratingsData.result[0].oldRating;
    const dataPoints = ratingsData.result.map((contest) => {
      currentRating = contest.newRating;
      return {
        x: new Date(contest.ratingUpdateTimeSeconds * 1000), // convert to JS Date
        y: currentRating,
      };
    });

    // grabbing data on all problem submissions
    const problemsRes = await fetch(
      `https://codeforces.com/api/user.status?handle=${handle}`
    );
    const problemsData = await problemsRes.json();
    const problems = problemsData.result;
    const seenProblemIDs = new Set();
    const resultMap = new Map();
    const ratingMap = new Map();
    const tagMap = new Map();
    const solved = new Set();
    let total_tag = 0.0;
    let total_ratings = 0;
    let undefineds = 0;
    problems.forEach((obj) => {
      // type of result after submitting
      if (
        obj.verdict === "OK" &&
        !seenProblemIDs.has(obj.problem.contestId + obj.problem.index)
      ) {
        solved.add(obj.id);
        seenProblemIDs.add(obj.problem.contestId + obj.problem.index);
        // rating of the solved problem
        if (ratingMap.has(obj.problem.rating)) {
          ratingMap.set(
            obj.problem.rating,
            ratingMap.get(obj.problem.rating) + 1
          );
        } else {
          ratingMap.set(obj.problem.rating, 1);
        }
        obj.problem.tags.forEach((tag) => {
          total_tag++;
          if (tagMap.has(tag)) {
            tagMap.set(tag, tagMap.get(tag) + 1);
            tagMap[tag]++;
          } else {
            tagMap.set(tag, 1);
          }
        });
        if (obj.problem.rating !== undefined)
          total_ratings += obj.problem.rating;
        else {
          undefineds++;
        }
      }

      if (resultMap.has(obj.verdict)) {
        resultMap.set(obj.verdict, resultMap.get(obj.verdict) + 1);
      } else {
        resultMap.set(obj.verdict, 1);
      }
    });

    // displaying data on weak tags and strong tags
    const normalizedTags = Object.fromEntries(
      [...tagMap].map(([tag, count]) => [tag, count / total_tag])
    );

    const comparison = [];
    Object.entries(normalizedTags).forEach((tag) => {
      const baseline = TAG_FRACTIONS[tag[0]] || 0;
      const current = normalizedTags[tag[0]] || 0;
      const ratio =
        baseline === 0
          ? current === 0
            ? 1
            : Infinity
          : (current / baseline) * current;
      const taggy = tag[0];
      comparison.push({ taggy, baseline, current, ratio });
    });

    comparison.sort((a, b) => b.ratio - a.ratio);
    const top3 = comparison.slice(0, 3);
    const bottom3 = comparison.slice(-3).reverse();

    function createTagBox(tag, status) {
      llink = "https://codeforces.com/problemset?tags=" + tag;
      const className =
        status === "Needs Work" ? "tag-box needs-work" : "tag-box better";
      return `
          <a class="${className}" href="${llink}" style="text-decoration: none; color: inherit;">
          <h3>${tag}</h3>
          <div class="rating"></div>
          <div class="verdict">${status}</div>
          </a>
          `;
    }

    let html = `<h3 id="tag-special">Common Tag Analysis</h3>`;
    top3.forEach(({ taggy }) => {
      html += createTagBox(taggy, "Strong");
    });

    bottom3.forEach(({ taggy }) => {
      html += createTagBox(taggy, "Needs Work");
    });

    document.querySelector(".tags-location").innerHTML = html;

    // displaying data on recent submissions
    const recentContainer = document.getElementById("recentSubmissions");
    const submissions = problems.slice(0, RECENT_SUBMISSION_COUNT);

    submissions.forEach((submission) => {
      const name = submission.problem.name;
      const rating = submission.problem.rating || "Unrated";
      const verdict = submission.verdict || "Pending";

      const box = document.createElement("div");

      linky =
        "http://codeforces.com/problemset/problem/" +
        submission.problem.contestId +
        "/" +
        submission.problem.index;

      box.innerHTML = `
          <a href="${linky}" class = "submission-box" target="_blank" style="text-decoration: none; color: inherit;">
          <h3>${name.length > 20 ? name.slice(0, 20) + "..." : name}</h3>
          <div class="rating">Rating:<br>${rating}</div>
          <div class="verdict" style="color: ${
            verdict === "OK" ? "#22c55e" : "#ef4444"
          }">${verdict === "OK" ? "PASS" : "FAIL"}</div>
          </a>
          `;

      recentContainer.appendChild(box);
    });

    let solvednum = 0;
    let wrongAnswer = 0;
    let runtimeError = 0;
    let compilationError = 0;
    let timeLimitExceeded = 0;
    if (resultMap.has("OK")) solvednum = resultMap.get("OK");
    if (resultMap.has("WRONG_ANSWER"))
      wrongAnswer = resultMap.get("WRONG_ANSWER");
    if (resultMap.has("RUNTIME_ERROR"))
      runtimeError = resultMap.get("RUNTIME_ERROR");
    if (resultMap.has("COMPILATION_ERROR"))
      compilationError = resultMap.get("COMPILATION_ERROR");
    if (resultMap.has("TIME_LIMIT_EXCEEDED"))
      timeLimitExceeded = resultMap.get("TIME_LIMIT_EXCEEDED");
    const ctx = document.getElementById("verdictChart").getContext("2d");
    document.getElementById("problems-solved").innerHTML =
      "Total Problems Solved: " + solved.size;
    const verdictChart = new Chart(ctx, {
      type: "pie",
      data: {
        labels: [
          "Accepted",
          "Wrong Answer",
          "Runtime Error",
          "Compilation Error",
          "Time Limit Exceeded",
        ],
        datasets: [
          {
            data: [
              solvednum,
              wrongAnswer,
              runtimeError,
              compilationError,
              timeLimitExceeded,
            ],
            backgroundColor: [
              "#16a34a", // green
              "#ef4444", // red
              "#f59e0b", // orange
              "#3b82f6", // blue
              "#8b5cf6", // purple
            ],
            borderWidth: 1,
          },
        ],
      },
      options: {
        plugins: {
          tooltip: {
            callbacks: {
              label: function (context) {
                const dataset = context.dataset;
                const total = dataset.data.reduce((a, b) => a + b, 0);
                const value = context.parsed;
                const percentage = ((value / total) * 100).toFixed(1);
                return `${context.label}: ${value} (${percentage}%)`;
              },
            },
          },
          legend: {
            labels: {
              color: "#ffffff", // white labels (for dark background)
              font: {
                size: 14,
              },
            },
          },
          title: {
            display: true,
            text: "Verdict Distribution",
            color: "#ffffff",
            font: {
              size: 18,
            },
          },
        },
      },
    });

    // create recommended problems
    const avg_rating =
      Math.ceil(total_ratings / (solved.size - undefineds) / 100) * 100;
    const seenProblems = new Set();
    console.log(avg_rating);
    for (const { taggy } of bottom3) {
      const problemsRes = await fetch(
        `https://codeforces.com/api/problemset.problems?tags=` + taggy
      );
      const problemsJSON = await problemsRes.json();
      const problems = problemsJSON.result.problems;
      for (const problem of problems) {
        if (
          problem.rating <= avg_rating + 200 &&
          !seenProblemIDs.has(problem.contestId + problem.index)
        ) {
          seenProblems.add(problem);
          seenProblemIDs.add(problem.contestId + problem.index);
          if (seenProblems.size % PROBLEM_PER_TAG == 0) break;
        }
      }
    }
    const recommendedProblems = [];
    console.log(seenProblems);
    seenProblems.forEach((problem) => {
      recommendedProblems.push({
        name: problem.name,
        link:
          "https://codeforces.com/problemset/problem/" +
          problem.contestId +
          "/" +
          problem.index,
        rating: problem.rating,
        tags: problem.tags,
      });
    });

    function createProblemBox(problem) {
      return `
          <a class="problem-box" href="${problem.link}" target="_blank">
            <div class="problem-title">${problem.name}</div>
            <div class="problem-info">
              <span class="rating">Rating: ${problem.rating}</span>
              <span class="tags">${problem.tags.join(", ")}</span>
            </div>
          </a>
        `;
    }

    const recommendedContainer = document.getElementById("recommendedProblems");
    recommendedContainer.innerHTML = recommendedProblems
      .map(createProblemBox)
      .join("");

    // create the problem solved rating bar graph
    const labels = Array.from(ratingMap.keys()).sort((a, b) => a - b);
    const filteredLabels = labels.filter((label) => label !== undefined);
    const data = filteredLabels.map((rating) => Number(ratingMap.get(rating)));
    let mostSolved = Math.max(...data);
    const cgx = document.getElementById("ratingBarChart").getContext("2d");
    const colors = ["#F59E0B", "#6366F1"];
    const backgroundColors = filteredLabels.map(
      (_, index) => colors[index % 2]
    );
    const chart = new Chart(cgx, {
      type: "bar",
      data: {
        labels: filteredLabels, // ratings like 800, 900, ...
        datasets: [
          {
            label: "Problems Solved",
            data: data, // counts
            backgroundColor: backgroundColors,
            borderColor: backgroundColors,
            borderWidth: 1,
            title: {
              font: {
                weight: "bold", // <--- bold
                size: 14, // optional: size
              },
            },
          },
        ],
      },
      options: {
        scales: {
          x: {
            title: {
              display: true,
              text: "Problem Rating",
              color: "white",
              padding: {
                top: 5,
              },
              font: {
                weight: "bold", // <--- bold
                size: 14, // optional: size
              },
            },
            ticks: {
              color: "white",
            },
          },
          y: {
            beginAtZero: true,
            max: Math.round((mostSolved + 10) / 10) * 10,
            title: {
              display: true,
              text: "Number Solved",
              color: "white",
              padding: {
                right: 5,
              },
              font: {
                weight: "bold", // <--- bold
                size: 14, // optional: size
              },
            },
            ticks: {
              color: "white",
            },
          },
        },
        plugins: {
          legend: {
            display: true,
            labels: {
              color: "white", // white-ish text
            },
            font: {
              weight: "bold",
              size: 16,
            },
            onClick: () => {},
          },
        },
      },
    });

    // creating the rating chart
    const ctb = document.getElementById("ratingChart").getContext("2d");
    const dataMaxY = Math.max(...dataPoints.map((p) => p.y));
    const pointColors = [];
    const pointBGColors = [];
    let found = false;
    dataPoints.forEach((point) => {
      if (point.y == dataMaxY && !found) {
        found = true;
        pointColors.push("red");
      } else {
        pointColors.push("rgba(250, 234, 21, 0.8)");
      }
    });
    found = false;
    dataPoints.forEach((point) => {
      if (point.y == dataMaxY && !found) {
        found = true;
        pointBGColors.push("black");
      } else {
        pointBGColors.push("rgba(250, 234, 21, 0.8)");
      }
    });
    found = false;
    pointSizes = dataPoints.map((point) => {
      if (point.y == dataMaxY && !found) {
        found = true;
        return LARGE_POINT_SIZE;
      }
      return SMALL_POINT_SIZE;
    });
    const ratingChart = new Chart(ctb, {
      type: "line",
      data: {
        datasets: [
          {
            label: "Rating",
            data: dataPoints,
            borderColor: "rgba(250, 204, 21, 0.8)", // nice blue line
            pointBackgroundColor: pointColors,
            pointBorderColor: pointBGColors,
            borderWidth: 3,
            pointBorderWidth: 1,
            backgroundColor: "rgba(250, 204, 21, 0.8)", // transparent fill
            fill: false,
            tension: 0.1, // smooth curves
            pointRadius: pointSizes,
            pointHoverRadius: 4,
          },
        ],
      },
      options: {
        interaction: {
          mode: "index", // or 'index'
          intersect: true,
          responsive: true,
          maintainAspectRatio: false,
        },
        scales: {
          x: {
            type: "time", // time scale on x axis
            time: {
              unit: "month",
              tooltipFormat: "MMM dd, yyyy",
              stepSize: 1,
            },
            ticks: {
              color: "white",
            },
            title: {
              display: true,
              text: "Date",
              color: "white",
              font: {
                weight: "bold", // <--- bold
                size: 14, // optional: size
              },
              padding: {
                top: 10, // <--- space between title and ticks
              },
            },
          },
          y: {
            beginAtZero: true,
            max: Math.round((dataMaxY + 800) / 100) * 100,
            type: "linear",
            ticks: {
              stepSize: 200, // sets fixed gap between ticks
              maxTicksLimit: 50, // limits max number of ticks
              color: "white",
            },
            title: {
              display: true,
              text: "Rating",
              color: "white",
              font: {
                weight: "bold", // <--- bold
                size: 14,
              },
              padding: {
                bottom: 10, // <--- space between title and ticks
              },
            },
          },
        },
        plugins: {
          annotation: {
            drawTime: "beforeDatasetsDraw",
            annotations: {
              beginner: {
                type: "box",
                yMin: 0,
                yMax: 1199,
                backgroundColor: "rgba(204, 204, 204, 0.8)", // gray
                borderWidth: 0,
              },
              newbie: {
                type: "box",
                yMin: 1200,
                yMax: 1399,
                backgroundColor: "rgba(120, 255, 120, 0.8)", // green
                borderWidth: 0,
              },
              specialist: {
                type: "box",
                yMin: 1400,
                yMax: 1599,
                backgroundColor: "rgba(120, 220, 187, 0.8)", // cyan
                borderWidth: 0,
              },
              expert: {
                type: "box",
                yMin: 1600,
                yMax: 1899,
                backgroundColor: "rgba(170, 170, 255, 0.8)", // dark blue
                borderWidth: 0,
              },
              candidate_master: {
                type: "box",
                yMin: 1900,
                yMax: 2099,
                backgroundColor: "rgba(255, 136, 255, 0.8)", // purple
                borderWidth: 0,
              },
              master: {
                type: "box",
                yMin: 2100,
                yMax: 2299,
                backgroundColor: "rgba(255, 204, 136, 0.8)", // light orange
                borderWidth: 0,
              },
              international_master: {
                type: "box",
                yMin: 2300,
                yMax: 2399,
                backgroundColor: "rgba(255, 187, 85, 0.8)", // yellow/orange
                borderWidth: 0,
              },
              grandmaster: {
                type: "box",
                yMin: 2400,
                yMax: 2599,
                backgroundColor: "rgba(255, 119, 119, 0.8)", // light red
                borderWidth: 0,
                clip: false,
              },
              international_grandmaster: {
                type: "box",
                yMin: 2600,
                yMax: 2999,
                backgroundColor: "rgba(225, 50, 50, 0.8)", // red
                borderWidth: 0,
                clip: false,
              },
              legendary_grandmaster: {
                type: "box",
                yMin: 3000,
                yMax: 5000,
                backgroundColor: "rgba(170, 20, 20, 0.8)", // dark red
                borderWidth: 0,
                clip: false,
              },
              // Add more rank bands as you want
            },
          },
          legend: {
            display: true,
            labels: {
              color: "white", // white-ish text
            },
            font: {
              weight: "bold",
              size: 16,
            },
            onClick: () => {},
          },
          tooltip: {
            enabled: true,
            mode: "index",
            intersect: false,
            title: (context) => {
              return new Intl.DateTimeFormat("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              }).format(new Date(context[0].parsed.x));
            },
          },
        },
      },
    });

    // now that data is ready, hide loader and show dashboard
    document.getElementById("loadingScreen").style.display = "none";
    document.querySelector(".dashboard-container").style.display = "block";
    document.body.classList.remove('loading');
  } catch (err) {
    console.error("Error fetching data", err);
    localStorage.setItem("error", "Unable to fetch user data.");
    window.location.href = "index.html";
  }
}

loadData();
