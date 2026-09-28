import { useState } from "react";

function ProblemTable({ platform, problems, heading = "Solved problems" }) {
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const pageCount = Math.max(1, Math.ceil(problems.length / pageSize));
    const visibleProblems = problems.slice((page - 1) * pageSize, page * pageSize);

    return <section className="table-panel">

        <div className="table-heading">
            <h3>{heading}</h3>
            <label>Rows 
                <select value={pageSize} onChange={(event) =>
                     { setPageSize(Number(event.target.value)); setPage(1); }}>
                        <option value="10">10</option>
                        <option value="20">20</option>
                        </select>
                        </label>
                        </div>
        {!problems.length ? <p className="muted">Problem details are not available for this platform.</p> : <>

            <div className="problem-list">{visibleProblems.map((problem, index) => {
                const problemName = problem.url ? (
                    <a href={problem.url} target="_blank" rel="noopener noreferrer">
                        {problem.name}
                    </a>
                ) : <span>{problem.name}</span>;

                return (
                    <div className="problem-row" key={`${platform}-${problem.id}-${problem.index || index}`}>
                        {problemName}
                        <small>{problem.rating || "Unrated"}</small>
                    </div>
                );
            })}
            </div>
            <div className="pagination"><button disabled={page === 1} onClick={() => setPage((current) => current - 1)}>Previous</button><span>Page {page} of {pageCount}</span><button disabled={page === pageCount} onClick={() => setPage((current) => current + 1)}>Next</button></div>
        </>}
    </section>;
}

export default ProblemTable;