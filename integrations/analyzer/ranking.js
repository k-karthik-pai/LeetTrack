// Adapted from iamvijayvarma/LEETCODE-ANALYZER (MIT). See docs/UPSTREAM.md.
                                      
             
                    
                     
                
               
                      
                           
               
                 
               
                
                               
                            
                             
                                
                            
                               
                           
                 
                              
                                  
               
                            
                       
                           
                             
                           
 

/**
 * Computes rankings with tie-breaking (Total -> Hard -> Medium -> Easy)
 * and calculates daily progress differences against the previous snapshot
 */
export function computeRankingsAndDiffs(
  currentStats       ,
  previousStatsMap                                                                             = new Map()
)                        {
  // Sort stats descending: Total -> Hard -> Medium -> Easy -> Name
  const sorted = [...currentStats].sort((a, b) => {
    // Put SUCCESS before non-success
    const aSuccess = a.status === 'SUCCESS' ? 1 : 0;
    const bSuccess = b.status === 'SUCCESS' ? 1 : 0;
    if (aSuccess !== bSuccess) return bSuccess - aSuccess;

    if (b.total !== a.total) return b.total - a.total;
    if (b.hard !== a.hard) return b.hard - a.hard;
    if (b.medium !== a.medium) return b.medium - a.medium;
    if (b.easy !== a.easy) return b.easy - a.easy;
    return (a.student?.name || '').localeCompare(b.student?.name || '');
  });

  return sorted.map((stat, index) => {
    const student = stat.student || {};
    const regNo = student.regNo || stat.regNo || '';
    const prev = previousStatsMap.get(regNo);

    let diff                = null;
    let diffEasy                = null;
    let diffMedium                = null;
    let diffHard                = null;

    if (prev && stat.status === 'SUCCESS') {
      diff = stat.total - prev.total;
      diffEasy = stat.easy - prev.easy;
      diffMedium = stat.medium - prev.medium;
      diffHard = stat.hard - prev.hard;
    }

    return {
      id: stat.id,
      studentId: stat.studentId || student.id,
      sNo: student.sNo ?? stat.sNo ?? index + 1,
      regNo,
      name: student.name || stat.name || 'Unknown',
      leetcodeUrl: student.leetcodeUrl || stat.leetcodeUrl || `https://leetcode.com/u/${stat.leetcodeUsername}/`,
      leetcodeUsername: student.leetcodeUsername || stat.leetcodeUsername || '',
      easy: stat.easy,
      medium: stat.medium,
      hard: stat.hard,
      total: stat.total,
      contestRating: stat.contestRating,
      globalRank: stat.globalRank,
      submissions: stat.submissions,
      acceptanceRate: stat.acceptanceRate,
      activeDays: stat.activeDays,
      currentStreak: stat.currentStreak,
      maxStreak: stat.maxStreak,
      status: stat.status,
      errorMessage: stat.errorMessage,
      fetchedAt: stat.fetchedAt,
      rank: index + 1,
      prevTotal: prev?.total ?? null,
      diff,
      diffEasy,
      diffMedium,
      diffHard,
    };
  });
}
