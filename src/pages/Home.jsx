import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Home.css";

const statusMessages = {
  401: "Authentication required.",
  403: "API access is temporarily limited.",
  404: "Repository not found.",
  500: "GitHub server error.",
};

const Home = () => {
  const navigate = useNavigate();

  const [inputUrl, setInputUrl] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const staleDays = 7;
  const prAge = 10;

  const urlHandler = async () => {
    if (loading) {
      return;
    }

    setErrorMsg("");
    setLoading(true);

    try {
      const urlArray = inputUrl.trim().split("/");
      const indexOfGithub = urlArray.indexOf("github.com");

      if (indexOfGithub === -1) {
        setErrorMsg("This is not a GitHub repository URL.");
        return;
      }

      const owner = urlArray[indexOfGithub + 1];
      const repo = urlArray[indexOfGithub + 2];

      if (!owner || !repo) {
        setErrorMsg("Invalid GitHub repository URL.");
        return;
      }

      const response = await fetch(
        `https://github-pr-dashboard-backend.onrender.com/github?repo=${owner}/${repo}`
      );

      if (!response.ok) {
        setErrorMsg(
          statusMessages[response.status] ||
            "Something went wrong. Please try again."
        );
        return;
      }

      const pullResponse = await fetch(
        `https://github-pr-dashboard-backend.onrender.com/github/pulls?repo=${owner}/${repo}`
      );

      if (!pullResponse.ok) {
        setErrorMsg(
          statusMessages[pullResponse.status] ||
            "Unable to fetch pull requests."
        );
        return;
      }

      const pullData = await pullResponse.json();

      if (pullData.length === 0) {
        setErrorMsg("This repository has no pull requests.");
        return;
      }

      const openPRs = pullData.filter(
        (pr) => pr.state === "open"
      );

      const closedPRs = pullData.filter(
        (pr) => pr.state === "closed"
      );

      const mergedPRs = pullData.filter(
        (pr) =>
          pr.state === "closed" &&
          pr.merged_at !== null
      );

      const unmergedClosedPRs =
        closedPRs.length - mergedPRs.length;

      const draftPRs = pullData.filter(
        (pr) => pr.draft === true
      );

      const readyPRs = pullData.filter(
        (pr) =>
          pr.state === "open" &&
          pr.draft === false
      );

      const stalePRs = pullData.filter((pr) => {
        const now = new Date();
        const updatedDate = new Date(pr.updated_at);

        const difference = now - updatedDate;

        const days =
          difference / (1000 * 60 * 60 * 24);

        return (
          pr.state === "open" &&
          pr.draft === false &&
          days >= staleDays
        );
      });

      const oldPRs = pullData.filter((pr) => {
        const now = new Date();
        const createdDate = new Date(pr.created_at);

        const difference = now - createdDate;

        const days =
          difference / (1000 * 60 * 60 * 24);

        return (
          pr.state === "open" &&
          days >= prAge
        );
      });

      const mergedPRsLife = mergedPRs.map((pr) => {
        const mergedDate = new Date(pr.merged_at);
        const createdDate = new Date(pr.created_at);

        const difference =
          mergedDate - createdDate;

        return (
          difference /
          (1000 * 60 * 60 * 24)
        );
      });

      const totalMergedPRsLife =
        mergedPRsLife.reduce(
          (acc, pr) => acc + pr,
          0
        );

      const averageTime =
        mergedPRs.length === 0
          ? "No merged PRs"
          : (
              totalMergedPRsLife /
              mergedPRs.length
            ).toFixed(2);

      const prNumber = pullData.map(
        (pr) => pr.number
      );

      const reviewPromises = prNumber.map((number) => {
        return fetch(
          `https://github-pr-dashboard-backend.onrender.com/github/reviews?repo=${owner}/${repo}&number=${number}`
        ).then((response) => {
          if (!response.ok) {
            return [];
          }

          return response.json();
        });
      });

      const allReviewData =
        await Promise.all(reviewPromises);

      const allTimesArr = [];
      let count = 0;

      const reviewersCount = {};
      const neverReviewedPRs = [];

      const reviewActivity = {
        APPROVED: 0,
        CHANGES_REQUESTED: 0,
        COMMENTED: 0,
      };

      allReviewData.forEach(
        (reviewData, index) => {
          const prNumberValue =
            prNumber[index];

          const reviewArr = reviewData.map(
            (review) => review.submitted_at
          );

          if (reviewArr.length === 0) {
            const PR = pullData.find(
              (pr) =>
                pr.number === prNumberValue
            );

            neverReviewedPRs.push(PR);
            return;
          }

          const firstReviewDate =
            reviewArr.reduce(
              (acc, review) => {
                const date1 = new Date(acc);
                const date2 = new Date(review);

                return date1 < date2
                  ? date1
                  : date2;
              },
              reviewArr[0]
            );

          const PR = pullData.find(
            (pr) =>
              pr.number === prNumberValue
          );

          const createdDate =
            new Date(PR.created_at);

          const firstReviewTime =
            (firstReviewDate -
              createdDate) /
            (1000 * 60 * 60 * 24);

          allTimesArr.push(
            firstReviewTime
          );

          count++;

          const viewerArr =
            reviewData.map(
              (review) =>
                review.user.login
            );

          viewerArr.reduce(
            (acc, reviewer) => {
              acc[reviewer] =
                (acc[reviewer] || 0) + 1;

              return acc;
            },
            reviewersCount
          );

          reviewData.forEach((review) => {
            if (
              review.state === "APPROVED"
            ) {
              reviewActivity.APPROVED++;
            }

            if (
              review.state ===
              "CHANGES_REQUESTED"
            ) {
              reviewActivity.CHANGES_REQUESTED++;
            }

            if (
              review.state === "COMMENTED"
            ) {
              reviewActivity.COMMENTED++;
            }
          });
        }
      );

      const sumAllTimesArr =
        allTimesArr.reduce(
          (acc, pr) => acc + pr,
          0
        );

      const averageFirstReview =
        count === 0
          ? "No PR reviewed till now"
          : (
              sumAllTimesArr / count
            ).toFixed(2);

      const reviewersArr =
        Object.entries(
          reviewersCount
        );

      reviewersArr.sort(
        (a, b) => b[1] - a[1]
      );

      const top10Reviewers =
        reviewersArr.slice(0, 10);

      const authorCounts = {};

      pullData.forEach((pr) => {
        const author =
          pr.user.login;

        if (
          authorCounts[author] ===
          undefined
        ) {
          authorCounts[author] = 1;
        } else {
          authorCounts[author]++;
        }
      });

      const authorsList =
        Object.entries(authorCounts);

      authorsList.sort(
        (a, b) => b[1] - a[1]
      );

      const top10Authors =
        authorsList.slice(0, 10);

      const dashboardData = {
        totalPRs: pullData.length,

        openPRs: openPRs.length,
        closedPRs: closedPRs.length,

        mergedPRs: mergedPRs.length,
        unmergedPRs:
          unmergedClosedPRs,

        draftPRs: draftPRs.length,
        readyForReviewPRs:
          readyPRs.length,

        stalePRs,
        oldOpenPRs: oldPRs,
        neverReviewedPRs,

        averageTimeToMerge:
          averageTime,

        averageTimeToFirstReview:
          averageFirstReview,

        reviewActivity,

        top10Reviewers,
        top10Authors,

        staleDays,
        prAge,
      };

      navigate(
        `/dashboard/${owner}/${repo}`,
        {
          state: dashboardData,
        }
      );
    } catch (error) {
      console.error(error);

      setErrorMsg(
        "Something went wrong while analyzing the repository. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main id="homePage">

      <div className="homeContainer">

        <section className="welcomeSection">

          <p className="welcomeText">
            Welcome to
          </p>

          <h1 className="homeTitle">
            GitHub PR Dashboard
          </h1>

          <p className="homeDescription">
            Understand your repository's pull requests,
            reviews, and team activity at a glance.
          </p>

        </section>


        <section className="repoInputContainer">

          <h2>
            Analyze Your Repository
          </h2>

          <p className="repoInstruction">
            Please enter your GitHub repository URL.
          </p>

          <div className="repoInputGroup">

            <input
              id="repoUrl"
              type="text"
              value={inputUrl}
              onChange={(e) =>
                setInputUrl(e.target.value)
              }
              placeholder="https://github.com/facebook/react"
              disabled={loading}
            />

            <div className="errorMessageContainer">

              {errorMsg && (
                <p className="errorMessage">
                  {errorMsg}
                </p>
              )}

            </div>

            <button
              onClick={urlHandler}
              disabled={loading}
            >
              {loading
                ? "Analyzing..."
                : "Analyze Repository"}
            </button>

          </div>


          <div className="loaderContainer">

            {loading && (
              <>
                <div className="loader"></div>

                <p>
                  Analyzing repository...
                </p>

                <span>
                  Pull request and review data
                  may take a little time to load.
                </span>
              </>
            )}

          </div>

        </section>


        <section className="featuresSection">

          <h2>
            Why this dashboard?
          </h2>

          <div className="featuresList">

            <div className="featureItem">
              <h3>
                Find PRs needing attention
              </h3>

              <p>
                Quickly spot stale and old PRs.
              </p>
            </div>

            <div className="featureItem">
              <h3>
                Understand review performance
              </h3>

              <p>
                See how quickly PRs get reviewed.
              </p>
            </div>

            <div className="featureItem">
              <h3>
                Track team activity
              </h3>

              <p>
                See active reviewers and contributors.
              </p>
            </div>

            <div className="featureItem">
              <h3>
                Get a quick overview
              </h3>

              <p>
                Understand repository activity in seconds.
              </p>
            </div>

          </div>

        </section>

      </div>

    </main>
  );
};

export default Home;