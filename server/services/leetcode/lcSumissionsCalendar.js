import { LeetCode } from "leetcode-query"; 

async function lcSubmissionCalendar(handle) {
    const leetcode = new LeetCode(); 

    const response = await leetcode.graphql({
        operationName: "userProfileCalendar",
       
        query: `
            query userProfileCalendar($username: String!) {
                matchedUser(username: $username) {
                    userCalendar {
                        submissionCalendar
                    }
                }
            }
        `,  
        variables: { handle} 
    });

    const calendarStr = response.data?.matchedUser?.userCalendar?.submissionCalendar;

    if (!calendarStr) {
        console.log("No leetcode submission calendar found for this user");
        return [];
    }

    const calendar = JSON.parse(calendarStr);

    const now = Math.floor(Date.now() / 1000);
    const sevenDaysAgo = now - (7 * 24 * 60 * 60);

    const past7DaysData = Object.entries(calendar)
      
        .map(([timestampstr, count]) => ({
            date: new Date(parseInt(timestampstr) * 1000).toLocaleDateString(),
            timestamp: parseInt(timestampstr),
            count
        }))
        .filter(item => item.timestamp >= sevenDaysAgo)
        .sort((a, b) => b.timestamp - a.timestamp);

    return past7DaysData;
}

module.exports = lcSubmissionCalendar;
