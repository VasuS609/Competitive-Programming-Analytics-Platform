
function analyzeWeakTopics(submissions, { window = 150, ignoreEventuallySolved = false } = {}) {
    const solved = new Set(
        submissions.filter((s) => s.verdict === "OK" && s.problem).map((s) => problemKey(s.problem)),
    );
    const recent = submissions
        .filter((s) => s.problem && s.creationTimeSeconds)
        .sort((a, b) => b.creationTimeSeconds - a.creationTimeSeconds)
        .slice(0, window);
    const topics = {};
    const failures = [];
    for (const submission of recent) {
        const accepted = submission.verdict === "OK";
        const eventuallySolved = solved.has(problemKey(submission.problem));
        const failed = !accepted && !(ignoreEventuallySolved && eventuallySolved);
        if (failed) failures.push({
            name: submission.problem.name,
            verdict: submission.verdict,
            tags: submission.problem.tags || [],
            rating: submission.problem.rating,
            eventuallySolved,
            url: problemUrl(submission.problem),
            date: toDate(submission.creationTimeSeconds * 1000),
        });
        for (const tag of submission.problem.tags || []) {
            const stats = topics[tag] || (topics[tag] = { tag, attempts: 0, failed: 0, accepted: 0 });
            stats.attempts += 1;
            if (accepted) stats.accepted += 1;
            else if (failed) stats.failed += 1;
        }
    }
    return {
        windowSize: recent.length,
        failedSubmissions: failures.length,
        weakTopics: Object.values(topics)
            .filter((topic) => topic.failed)
            .map((topic) => ({ ...topic, failRate: Math.round(topic.failed / topic.attempts * 100) }))
            .sort((a, b) => b.failed - a.failed || b.failRate - a.failRate),
        recentFailures: failures,
    };
}