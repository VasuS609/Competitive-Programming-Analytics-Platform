const { JSDOM } = require("jsdom");

async function fetchCodeChefData(handle) {
  const response = await fetch(`https://www.codechef.com/users/${encodeURIComponent(handle)}`);

  if (!response.ok) {
    const error = new Error("CodeChef user not found");
    error.status = response.status;
    throw error;
  }

  const html = await response.text();
  const heatMapStart = html.indexOf("var userDailySubmissionsStats =") +
    "var userDailySubmissionsStats =".length;
  const heatMapEnd = html.indexOf("'#js-heatmap") - 34;
  const ratingStart = html.indexOf("var all_rating = ") + "var all_rating = ".length;
  const ratingEnd = html.indexOf("var current_user_rating =") - 6;

  if (heatMapStart < 0 || heatMapEnd < heatMapStart || ratingStart < 0 || ratingEnd < ratingStart) {
    throw new Error("CodeChef profile format has changed");
  }

  const heatMap = JSON.parse(html.substring(heatMapStart, heatMapEnd));
  const ratingData = JSON.parse(html.substring(ratingStart, ratingEnd));
  const document = new JSDOM(html).window.document;
  const profile = document.querySelector(".user-details-container");
  const rating = document.querySelector(".rating-number");
  const countryFlag = document.querySelector(".user-country-flag");
  const countryName = document.querySelector(".user-country-name");
  const ranks = document.querySelector(".rating-ranks")?.children[0]?.children;

  return {
    success: true,
    status: response.status,
    profile: profile?.children[0]?.children[0]?.src,
    name: profile?.children[0]?.children[1]?.textContent?.trim(),
    currentRating: parseInt(rating?.textContent, 10) || 0,
    highestRating: parseInt(rating?.parentNode?.children[4]?.textContent?.split("Rating")[1], 10) || 0,
    countryFlag: countryFlag?.src,
    countryName: countryName?.textContent?.trim(),
    globalRank: parseInt(ranks?.[0]?.children[0]?.children[0]?.innerHTML, 10) || 0,
    countryRank: parseInt(ranks?.[1]?.children[0]?.children[0]?.innerHTML, 10) || 0,
    stars: document.querySelector(".rating")?.textContent?.trim() || "unrated",
    heatMap,
    ratingData,
  };
}

module.exports = { fetchCodeChefData };
