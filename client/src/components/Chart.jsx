import { useEffect, useRef } from "react";
import Chart from "chart.js/auto";
import { useSession } from "../lib/session.jsx";

export default function Plot({
  labels,
  datasets,
  stats,
  reverse = false,
  integer = true,
  label = "Chart",
}) {
  const canvas = useRef(null),
    { theme } = useSession();
  useEffect(() => {
    const styles = getComputedStyle(document.documentElement),
      color = styles.getPropertyValue("--muted").trim(),
      grid = styles.getPropertyValue("--line").trim();
    const palette = ["#ffa116", "#00b8a3", "#4197ff"];
    const config = stats
      ? {
          type: "doughnut",
          data: {
            labels: stats.total
              ? ["Easy", "Medium", "Hard"]
              : ["No synced problems"],
            datasets: [
              {
                data: stats.total
                  ? [stats.easy, stats.medium, stats.hard]
                  : [1],
                backgroundColor: stats.total
                  ? ["#00b8a3", "#ffc01e", "#ff375f"]
                  : ["#3b3b3b"],
                borderWidth: 0,
                borderRadius: stats.total ? 4 : 0,
                spacing: stats.total ? 5 : 0,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: "83%",
            plugins: {
              legend: { display: false },
              tooltip: { enabled: !!stats.total },
            },
          },
        }
      : {
          type: "line",
          data: {
            labels,
            datasets: datasets.map((data, index) => ({
              borderColor: palette[index % 3],
              backgroundColor: index ? "#00b8a309" : "#ffa1160c",
              borderWidth: 2,
              fill: datasets.length === 1,
              pointRadius: labels.length > 30 ? 0 : 2,
              pointHoverRadius: 5,
              tension: 0.38,
              ...data,
            })),
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: "index", intersect: false },
            plugins: {
              legend: {
                display: datasets.length > 1,
                labels: {
                  color,
                  usePointStyle: true,
                  boxWidth: 5,
                  font: { size: 10 },
                },
              },
            },
            scales: {
              x: {
                grid: { display: false },
                border: { display: false },
                ticks: {
                  color,
                  maxTicksLimit: 8,
                  maxRotation: 0,
                  font: { size: 9 },
                },
              },
              y: {
                reverse,
                beginAtZero: !reverse,
                border: { display: false },
                ticks: {
                  color,
                  precision: integer ? 0 : undefined,
                  maxTicksLimit: 5,
                  font: { size: 9 },
                },
                grid: { color: `${grid}99` },
              },
            },
          },
        };
    const chart = new Chart(canvas.current, config);
    return () => chart.destroy();
  }, [labels, datasets, stats, reverse, integer, theme]);
  return <canvas ref={canvas} role="img" aria-label={label} />;
}
