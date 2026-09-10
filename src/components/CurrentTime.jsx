import { useEffect, useState } from "react";

function formatTime() {
  return new Intl.DateTimeFormat("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  }).format(new Date());
}

function CurrentTime() {
  const [time, setTime] = useState(formatTime);

  useEffect(() => {
    const timer = window.setInterval(() => setTime(formatTime()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  return <time className="current-time" dateTime={new Date().toISOString()}>🕒 {time}</time>;
}

export default CurrentTime;
