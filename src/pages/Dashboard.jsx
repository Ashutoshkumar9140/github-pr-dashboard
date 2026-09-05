import { useLocation, useNavigate } from "react-router-dom";
import "./Dashboard.css";

const formatDuration = (days) => {
  if (typeof days !== "number" || Number.isNaN(days)) return days;
  const totalHours = Math.round(days * 24);
  if (totalHours < 1) return "Less than 1 hour";
  const wholeDays = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  if (wholeDays === 0) return `${hours} ${hours === 1 ? "hour" : "hours"}`;
  if (hours === 0) return `${wholeDays} ${wholeDays === 1 ? "day" : "days"}`;
  return `${wholeDays} ${wholeDays === 1 ? "day" : "days"} ${hours} ${hours === 1 ? "hour" : "hours"}`;
};

const Dashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dashboardData = location.state;

  if (!dashboardData) {
    return (
      <main id="dashboardError">
        <div className="dashboardErrorContainer">
          <h1>Dashboard Data Not Found</h1>
          <p>This dashboard needs data from a GitHub repository analysis.</p>
          <p>Please go back to the home page and analyze a repository again.</p>
          <button onClick={() => navigate("/")}>Back to Home</button>
        </div>
      </main>
    );
  }

  return (
    <div id="mainDiv">
      {/* ................ Section 1: PR Overview ................ */}

      <section className="sections">
        <div className="prOverviewContainer">
          <h1 className="sectionHeading">PR Overview</h1>
          <h2 id="totalPrHeading">
            Total Pull Requests: {dashboardData.totalPRs}
          </h2>
          <div className="openClosedContainer">
            <div className="openClosedPRs">
              <h3>Open Pull Requests: {dashboardData.openPRs}</h3>
              <ul>
                <li>Draft Pull Requests: {dashboardData.draftPRs}</li>
                <li>Ready for Review: {dashboardData.readyForReviewPRs}</li>
              </ul>
            </div>
            <div className="openClosedPRs">
              <h3>Closed Pull Requests: {dashboardData.closedPRs}</h3>
              <ul>
                <li>Merged Pull Requests: {dashboardData.mergedPRs}</li>
                <li>Unmerged Pull Requests: {dashboardData.unmergedPRs}</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ................ Section 2: Attention Needed ................ */}

      <section className="sections">
        <div id="attentionContainer">
          <h2 className="sectionHeading">Attention Needed</h2>
          <p>
            These pull requests may need attention because of their age,
            inactivity, or review status.
          </p>
          <div id="attentionChildContainer">
            {/* STALE PRs ...................................... */}

            <div className="attectionChild">
              <h3>
                Stale Pull Requests ({dashboardData.staleDays}+ days):{" "}
                {dashboardData.stalePRs.length}
              </h3>
              <p>
                Open PRs with no update for {dashboardData.staleDays}+ days.
              </p>
              <div className="attentionList">
                {dashboardData.stalePRs.length === 0 ? (
                  <p>No stale pull requests found.</p>
                ) : (
                  dashboardData.stalePRs.map((pr) => {
                    const days =
                      (new Date() - new Date(pr.updated_at)) /
                      (1000 * 60 * 60 * 24);
                    return (
                      <div key={pr.number} className="attentionListChild">
                        <p>PR no.: {pr.number}</p>
                        <p>Title: {pr.title}</p>
                        <p>Author: {pr.user.login}</p>
                        <p>Last updated: {formatDuration(days)} ago</p>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* OLD OPEN PRs .................................. */}

            <div className="attectionChild">
              <h3>
                Old Open Pull Requests ({dashboardData.prAge}+ days):{" "}
                {dashboardData.oldOpenPRs.length}
              </h3>
              <p>Open PRs created {dashboardData.prAge}+ days ago.</p>
              <div className="attentionList">
                {dashboardData.oldOpenPRs.length === 0 ? (
                  <p>No old open pull requests found.</p>
                ) : (
                  dashboardData.oldOpenPRs.map((pr) => {
                    const days =
                      (new Date() - new Date(pr.created_at)) /
                      (1000 * 60 * 60 * 24);
                    return (
                      <div key={pr.number} className="attentionListChild">
                        <p>PR no.: {pr.number}</p>
                        <p>Title: {pr.title}</p>
                        <p>Author: {pr.user.login}</p>
                        <p>Created: {formatDuration(days)} ago</p>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* NEVER REVIEWED PRs ................................ */}

            <div className="attectionChild">
              <h3>
                Never Reviewed Pull Requests:{" "}
                {dashboardData.neverReviewedPRs.length}
              </h3>
              <p>Pull requests that have not received a review yet.</p>
              <div className="attentionList">
                {dashboardData.neverReviewedPRs.length === 0 ? (
                  <p>All pull requests have received a review.</p>
                ) : (
                  dashboardData.neverReviewedPRs.map((pr) => {
                    const days =
                      (new Date() - new Date(pr.created_at)) /
                      (1000 * 60 * 60 * 24);
                    return (
                      <div key={pr.number} className="attentionListChild">
                        <p>PR no.: {pr.number}</p>
                        <p>Title: {pr.title}</p>
                        <p>Author: {pr.user.login}</p>
                        <p>Created: {formatDuration(days)} ago</p>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ................ Section 3: Review Health ................ */}

      <section className="sections">
        <div className="reviewHealthContainerOuter">
          <h2 className="sectionHeading">Review Health</h2>
          <p className="reviewHealthDescription">
            This section shows how quickly pull requests receive reviews and how
            long they take to get merged.
          </p>
          <div className="reviewHealthContent">
            <div className="reviewHealthLeft">
              {/* REVIEW METRICS ................................... */}

              <div className="reviewMetricsContainer">
                <div className="reviewMetricCard">
                  <h3>Average Time to First Review</h3>
                  <p className="reviewMetricValue">
                    {formatDuration(
                      Number(dashboardData.averageTimeToFirstReview),
                    )}
                  </p>
                </div>
                <div className="reviewMetricCard">
                  <h3>Average Time to Merge</h3>
                  <p className="reviewMetricValue">
                    {formatDuration(Number(dashboardData.averageTimeToMerge))}
                  </p>
                </div>
              </div>

              {/* REVIEW ACTIVITY ............................ */}

              <div className="reviewActivityCard">
                <h3>Review Activity</h3>
                <p>Number of reviews by review type.</p>
                <div className="reviewActivityList">
                  <div className="reviewActivityItem">
                    <span>Approved</span>
                    <strong>{dashboardData.reviewActivity.APPROVED}</strong>
                  </div>
                  <div className="reviewActivityItem">
                    <span>Changes Requested</span>
                    <strong>
                      {dashboardData.reviewActivity.CHANGES_REQUESTED}
                    </strong>
                  </div>
                  <div className="reviewActivityItem">
                    <span>Commented</span>
                    <strong>{dashboardData.reviewActivity.COMMENTED}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* TOP REVIEWERS .................................. */}

            <div className="topReviewersCard">
              <h3>Top Reviewers</h3>
              <p>Reviewers ranked by the number of reviews they submitted.</p>
              {dashboardData.top10Reviewers.length === 0 ? (
                <p>No reviewer data available.</p>
              ) : (
                <div className="reviewerTable">
                  <div className="reviewerTableHeader">
                    <span>Rank</span>
                    <span>Reviewer</span>
                    <span>Reviews</span>
                  </div>
                  {dashboardData.top10Reviewers.map((reviewer, index) => (
                    <div key={reviewer[0]} className="reviewerTableRow">
                      <span>{index + 1}</span>
                      <span>{reviewer[0]}</span>
                      <span>{reviewer[1]}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ................ Section 4: Team Activity ................ */}

      <section className="sections">
        <div className="teamActivityContainer">
          <h2 className="sectionHeading">Team Activity</h2>
          <p>See which contributors have created the most pull requests.</p>
          <div className="teamActivityInner">
            <h3>Top 10 PR Authors</h3>
            {dashboardData.top10Authors.length === 0 ? (
              <p>No author data available.</p>
            ) : (
              <div className="authorTable">
                <div className="authorTableHeader">
                  <span>Rank</span>
                  <span>Author</span>
                  <span className="pullRequestHeader">Pull Requests</span>
                </div>
                {dashboardData.top10Authors.map((author, index) => (
                  <div key={author[0]} className="authorTableRow">
                    <span>{index + 1}</span>
                    <span>{author[0]}</span>
                    <span>{author[1]}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
