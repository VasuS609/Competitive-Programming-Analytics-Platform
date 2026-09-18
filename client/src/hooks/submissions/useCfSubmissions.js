import { useSubmissionCalendar } from "./useSubmissionCalendar";

export function useCfSubmissions(handle) {
	return useSubmissionCalendar("cf", handle);
}

export default useCfSubmissions;
