export const calculateScoreFromStats = (statsArray) => {
  let score = 0;

  for (const s of statsArray) {
    if (!s) continue;

    if (s.platform === "leetcode") {
      score += s.problemsSolved * 0.3;
    } else if (s.platform === "gfg") {
      score += s.problemsSolved * 0.1;
    } else if (s.platform === "codeforces") {
      score += s.rating * 0.4;
    } else if (s.platform === "codechef") {
      score += s.rating * 0.2;
    }
  }

  return Math.round(score);
};
