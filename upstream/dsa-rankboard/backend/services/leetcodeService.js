import axios from "axios";

export const fetchLeetCodeStats = async (username) => {
  if (!username) return null;

  const query = `
    query getUserProfile($username: String!) {
      matchedUser(username: $username) {
        submitStatsGlobal {
          acSubmissionNum {
            difficulty
            count
          }
        }
      }
    }
  `;

  const res = await axios.post("https://leetcode.com/graphql", {
    query,
    variables: { username }
  });

  const data = res.data.data;
  if (!data?.matchedUser) return null;

  const totalSolved =
    data.matchedUser.submitStatsGlobal.acSubmissionNum[0]?.count || 0;

  return {
    platform: "leetcode",
    problemsSolved: totalSolved,
    rating: 0
  };
};
