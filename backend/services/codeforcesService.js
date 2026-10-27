import axios from "axios";

export const fetchCodeforcesStats = async (handle) => {
  if (!handle) return null;

  const res = await axios.get(
    `https://codeforces.com/api/user.info?handles=${handle}`
  );

  const user = res.data.result[0];

  return {
    platform: "codeforces",
    problemsSolved: 0,
    rating: user.rating || 0
  };
};
