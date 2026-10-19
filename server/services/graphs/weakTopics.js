const WEAK_TOPIC_WINDOW = 150; // look at  N submissions


// Verdicts that say nothing about topic weakness

const IGNORED_VERDICTS = new Set([
    "COMPILATION_ERROR",
    "SKIPPED",
    "TESTING",
    "CHALLENGED",
]);


async function getCFWeakTopics(handle, options) {
    const { submissions } = await getRawData(handle);
    return analyzeWeakTopics(submissions, options);
}


function analyzeWeakTopics(
    submissions,
    { window = WEAK_TOPIC_WINDOW, ignoreEventuallySolved = false } = {}
) {
    const solvedKeys = new Set(
        submissions.filter((s) => s.verdict === "OK" && s.problem).map((s) => problemKey(s.problem))
    );

    const recent = submissions
        .filter((s) => s.problem && !IGNORED_VERDICTS.has(s.verdict))
        .sort((a, b) => b.creationTimeSeconds - a.creationTimeSeconds)
        .slice(0, window);

    const tagStats = {};
    const recentFailures = [];

    for (const s of recent) {
        const isOk = s.verdict === "OK";
        const eventuallySolved = solvedKeys.has(problemKey(s.problem));
        const countsAsFailure = !isOk && !(ignoreEventuallySolved && eventuallySolved);

        if (countsAsFailure) {
            recentFailures.push({
                name: s.problem.name,
                verdict: s.verdict,
                tags: s.problem.tags,
                rating: s.problem.rating,
                eventuallySolved,
                url: problemUrl(s.problem),
                date: toDate(s.creationTimeSeconds * 1000),
            });
        }

        for (const tag of s.problem.tags || []) {
            const t = (tagStats[tag] ||= { tag, attempts: 0, failed: 0, accepted: 0 });
            t.attempts++;
            if (isOk) t.accepted++;
            else if (countsAsFailure) t.failed++;
        }
    }

    const weakTopics = Object.values(tagStats)
        .filter((t) => t.failed > 0)
        .map((t) => ({ ...t, failRate: Math.round((t.failed / t.attempts) * 100) }))
        .sort((a, b) => b.failed - a.failed || b.failRate - a.failRate);

    return {
        windowSize: recent.length,
        failedSubmissions: recentFailures.length,
        weakTopics,     // [{ tag, attempts, failed, accepted, failRate }]
        recentFailures, // the actual non-AC submissions behind the numbers
    };
}
