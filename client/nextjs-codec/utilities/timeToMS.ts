export default function TimeToMS(
  hours: number,
  minutes: number,
  seconds: number
): number {
  const hoursInMS = hours * 60 * 60 * 1000;
  const minutesInMS = minutes * 60 * 1000;
  const secondsInMS = seconds * 1000;

  return hoursInMS + minutesInMS + secondsInMS;
}
