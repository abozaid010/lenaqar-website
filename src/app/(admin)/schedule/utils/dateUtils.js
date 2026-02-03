import { API_BASE_URL } from "@/lib/apiConfig";

export const getWeekDates = () => {
  const today = new Date();
  const currentDay = today.getDay(); // 0 is Sunday, 1 is Monday, etc.
  
  // Calculate start of current week (Monday)
  const currentWeekStart = new Date(today);
  currentWeekStart.setDate(today.getDate() - currentDay + (currentDay === 0 ? -6 : 1));
  currentWeekStart.setHours(0, 0, 0, 0);
  
  // Calculate end of current week (Sunday)
  const currentWeekEnd = new Date(currentWeekStart);
  currentWeekEnd.setDate(currentWeekStart.getDate() + 6);
  currentWeekEnd.setHours(23, 59, 59, 999);
  
  // Calculate previous week
  const previousWeekStart = new Date(currentWeekStart);
  previousWeekStart.setDate(currentWeekStart.getDate() - 7);
  
  const previousWeekEnd = new Date(currentWeekEnd);
  previousWeekEnd.setDate(currentWeekEnd.getDate() - 7);
  
  // Calculate next week
  const nextWeekStart = new Date(currentWeekStart);
  nextWeekStart.setDate(currentWeekStart.getDate() + 7);
  
  const nextWeekEnd = new Date(currentWeekEnd);
  nextWeekEnd.setDate(currentWeekEnd.getDate() + 7);

  // Format dates for API
  const formatDateForAPI = (date) => {
    return date.toISOString().split('T')[0];
  };

  // Get the earliest start date and latest end date
  const startDate = formatDateForAPI(previousWeekStart);
  const endDate = formatDateForAPI(nextWeekEnd);

  return {
    apiUrl: `${API_BASE_URL}/action/by-date?start_date=${startDate}&end_date=${endDate}`,
    dates: {
      currentWeek: {
        start: currentWeekStart,
        end: currentWeekEnd
      },
      previousWeek: {
        start: previousWeekStart,
        end: previousWeekEnd
      },
      nextWeek: {
        start: nextWeekStart,
        end: nextWeekEnd
      }
    }
  };
};

export const formatDate = (date) => {
  return date.toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}; 