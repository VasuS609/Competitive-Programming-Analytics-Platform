import { useSubmissionCalendar } from "./useSubmissionCalendar";

export function useCcSubmissions(handle) {
	return useSubmissionCalendar("codechef", handle);
}

export default useCcSubmissions;
