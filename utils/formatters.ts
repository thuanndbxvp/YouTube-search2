export const parseISO8601Duration = (duration: string): string => {
  const regex = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/;
  const matches = duration.match(regex);

  if (!matches) {
    return "00:00";
  }

  const hours = parseInt(matches[1] || '0', 10);
  const minutes = parseInt(matches[2] || '0', 10);
  const seconds = parseInt(matches[3] || '0', 10);

  const format = (num: number) => num.toString().padStart(2, '0');

  if (hours > 0) {
    return `${format(hours)}:${format(minutes)}:${format(seconds)}`;
  }
  return `${format(minutes)}:${format(seconds)}`;
};

export const formatNumber = (num: string | number): string => {
    return Number(num).toLocaleString('en-US');
}

export const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-GB').replace(/\//g, '/');
}