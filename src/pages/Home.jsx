import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Home.css";

const statusMessages = {
  401: "Authentication required.",
  403: "API access is temporarily limited.",
  404: "Repository not found.",
  500: "GitHub server error.",
};
const API_URL = "https://github-pr-dashboard-backend.onrender.com/github";

const Home = () => {
  const navigate = useNavigate();
  const [inputUrl, setInputUrl] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const staleDays = 7;
  const prAge = 10;

  const urlHandler = async () => {
    if (loading) return;
    setErrorMsg("");
    setLoading(true);

    try {
      // ................ Get repository owner and name ................
      const urlArray = inputUrl.trim().split("/");
      const indexOfGithub = urlArray.indexOf("github.com");
      if (indexOfGithub === -1)
        return setErrorMsg("This is not a GitHub repository URL.");

      const owner = urlArray[indexOfGithub + 1];
      const repo = urlArray[indexOfGithub + 2];
      if (!owner || !repo) return setErrorMsg("Invalid GitHub repository URL.");

      // ................ Fetch repository pull requests ................
      const response = await fetch(`${API_URL}?repo=${owner}/${repo}`);
      if (!response.ok)
        return setErrorMsg(
          statusMessages[response.status] ||
            "Something went wrong. Please try again.",
        );

      const pullResponse = await fetch(
        `${API_URL}/pulls?repo=${owner}/${repo}`,
      );
      if (!pullResponse.ok)
        return setErrorMsg(
          statusMessages[pullResponse.status] ||
            "Unable to fetch pull requests.",
        );

      const pullData = await pullResponse.json();
      if (pullData.length === 0)
        return setErrorMsg("This repository has no pull requests.");

      // ................ Calculate PR overview ................
      const openPRs = pullData.filter((pr) => pr.state === "open");
      const closedPRs = pullData.filter((pr) => pr.state === "closed");
      const mergedPRs = pullData.filter(
        (pr) => pr.state === "closed" && pr.merged_at !== null,
      );
      const draftPRs = pullData.filter((pr) => pr.draft === true);
      const readyPRs = pullData.filter(
        (pr) => pr.state === "open" && pr.draft === false,
      );
      const getAgeInDays = (date) =>
        (new Date() - new Date(date)) / (1000 * 60 * 60 * 24);
      const stalePRs = pullData.filter(
        (pr) =>
          pr.state === "open" &&
          !pr.draft &&
          getAgeInDays(pr.updated_at) >= staleDays,
      );
      const oldPRs = pullData.filter(
        (pr) => pr.state === "open" && getAgeInDays(pr.created_at) >= prAge,
      );

      // ................ Calculate merge time ........................
      const mergedPRsLife = mergedPRs.map(
        (pr) =>
          (new Date(pr.merged_at) - new Date(pr.created_at)) /
          (1000 * 60 * 60 * 24),
      );
      const totalMergedPRsLife = mergedPRsLife.reduce((acc, pr) => acc + pr, 0);
      const averageTime =
        mergedPRs.length === 0
          ? "No merged PRs"
          : (totalMergedPRsLife / mergedPRs.length).toFixed(2);

      // ................ Fetch and analyze reviews ................
      const prNumber = pullData.map((pr) => pr.number);
      const allReviewData = await Promise.all(
        prNumber.map((number) =>
          fetch(
            `${API_URL}/reviews?repo=${owner}/${repo}&number=${number}`,
          ).then((reviewResponse) =>
            reviewResponse.ok ? reviewResponse.json() : [],
          ),
        ),
      );
      const allTimesArr = [];
      const reviewersCount = {};
      const neverReviewedPRs = [];
      const reviewActivity = {
        APPROVED: 0,
        CHANGES_REQUESTED: 0,
        COMMENTED: 0,
      };

      allReviewData.forEach((reviewData, index) => {
        const currentPR = pullData.find((pr) => pr.number === prNumber[index]);
        const reviewDates = reviewData.map((review) => review.submitted_at);
        if (reviewDates.length === 0) return neverReviewedPRs.push(currentPR);

        const firstReviewDate = reviewDates.reduce(
          (first, review) =>
            new Date(first) < new Date(review) ? first : review,
          reviewDates[0],
        );
        allTimesArr.push(
          (new Date(firstReviewDate) - new Date(currentPR.created_at)) /
            (1000 * 60 * 60 * 24),
        );

        reviewData.forEach((review) => {
          reviewersCount[review.user.login] =
            (reviewersCount[review.user.login] || 0) + 1;
          if (review.state === "APPROVED") reviewActivity.APPROVED++;
          if (review.state === "CHANGES_REQUESTED")
            reviewActivity.CHANGES_REQUESTED++;
          if (review.state === "COMMENTED") reviewActivity.COMMENTED++;
        });
      });

      const averageFirstReview =
        allTimesArr.length === 0
          ? "No PR reviewed till now"
          : (
              allTimesArr.reduce((acc, time) => acc + time, 0) /
              allTimesArr.length
            ).toFixed(2);
      const top10Reviewers = Object.entries(reviewersCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);
      const authorCounts = {};
      pullData.forEach((pr) => {
        authorCounts[pr.user.login] = (authorCounts[pr.user.login] || 0) + 1;
      });
      const top10Authors = Object.entries(authorCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);

      // ................ Open the dashboard ..........................
      navigate(`/dashboard/${owner}/${repo}`, {
        state: {
          totalPRs: pullData.length,
          openPRs: openPRs.length,
          closedPRs: closedPRs.length,
          mergedPRs: mergedPRs.length,
          unmergedPRs: closedPRs.length - mergedPRs.length,
          draftPRs: draftPRs.length,
          readyForReviewPRs: readyPRs.length,
          stalePRs,
          oldOpenPRs: oldPRs,
          neverReviewedPRs,
          averageTimeToMerge: averageTime,
          averageTimeToFirstReview: averageFirstReview,
          reviewActivity,
          top10Reviewers,
          top10Authors,
          staleDays,
          prAge,
        },
      });
    } catch (error) {
      console.error(error);
      setErrorMsg(
        "Something went wrong while analyzing the repository. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main id="homePage">
      <div className="homeContainer">
        {/* ................ Section 1: Welcome .......................... */}
        <section className="welcomeSection">
          <p className="welcomeText">Welcome to</p>
          <h1 className="homeTitle">GitHub PR Dashboard</h1>
          <p className="homeDescription">
            Understand your repository's pull requests, reviews, and team
            activity at a glance.
          </p>
        </section>

        {/* ................ Section 2: Repository Input .................. */}
        <section className="repoInputContainer">
          <h2>Analyze Your Repository</h2>
          <p className="repoInstruction">
            Please enter your GitHub repository URL.
          </p>
          <div className="repoInputGroup">
            <input
              id="repoUrl"
              type="text"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              placeholder="https://github.com/facebook/react"
              disabled={loading}
            />
            <div className="errorMessageContainer">
              {errorMsg && <p className="errorMessage">{errorMsg}</p>}
            </div>
            <button onClick={urlHandler} disabled={loading}>
              {loading ? "Analyzing..." : "Analyze Repository"}
            </button>
          </div>
          <div className="loaderContainer">
            {loading && (
              <>
                <div className="loader"></div>
                <p>Analyzing repository...</p>
                <span>
                  Pull request and review data may take a little time to load.
                </span>
              </>
            )}
          </div>
        </section>

        {/* ................ Section 3: Features ........................... */}
        <section className="featuresSection">
          <h2>Why this dashboard?</h2>
          <div className="featuresList">
            <div className="featureItem">
              <h3>Find PRs needing attention</h3>
              <p>Quickly spot stale and old PRs.</p>
            </div>
            <div className="featureItem">
              <h3>Understand review performance</h3>
              <p>See how quickly PRs get reviewed.</p>
            </div>
            <div className="featureItem">
              <h3>Track team activity</h3>
              <p>See active reviewers and contributors.</p>
            </div>
            <div className="featureItem">
              <h3>Get a quick overview</h3>
              <p>Understand repository activity in seconds.</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
};

export default Home;
