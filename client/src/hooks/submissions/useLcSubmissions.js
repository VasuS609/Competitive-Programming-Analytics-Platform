import { useSubmissionCalendar } from "./useSubmissionCalendar";

export function useLcSubmissions(handle) {
	return useSubmissionCalendar("leetcode", handle);
}

export default useLcSubmissions;
