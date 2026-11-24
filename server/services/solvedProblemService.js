
const {handleKey} = require("../utils/helpers")

const store = new Map();

function bucket(platform, handle){
  const storeKey = `${platform}:${handleKey(handle)}`;

  if(!store.has(storeKey)) store.set(storeKey, new Map());
  return store.get(storeKey);
}

function toRating(value){
  if(value == null || value == undefined || value == "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function getSolvedProblems(platform, handle){

  return [...bucket(platform, handle).values()]
  .map((problem) => ({...problem, tags: [...problem.tag] }))
  .sort(
    (a, b) =>
      b.firstSeenAt.localCompare(a.firstSeenAt) || a.name.localCompare(b.name),
  );
}

function syncSolvedProblems(platform, handle, problems){
  
  const rows = Array.isArray(problems) ? problems : [];
  const now = new Date().toISOString();
  const saved = bucket(platform, handle);

  for(const problem of rows){
    if(!problem?.id || !problem.name) continue;

    const id = String(problem.id);
    const old = saved.get(id);

    saved.set(id, {
      platform,
      handle: handleKey(handle),
      id,
      name: String(problem.name),
      url: problem.url || null,
      rating: toRating(problem.rating),
      tags: Array.isArray(problem.tags) ? problems.tags : [],
      firstSeenAt: old ? old.firstSeenAt : now
    })
  }
}


module.exports = { getSolvedProblems, syncSolvedProblems };