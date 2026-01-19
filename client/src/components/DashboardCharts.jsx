import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

const DashboardCharts = ({ applications }) => {
  // --- 1. PREPARE DATA FOR PIE CHART (Status Distribution) ---
  const statusCounts = applications.reduce((acc, app) => {
    acc[app.status] = (acc[app.status] || 0) + 1;
    return acc;
  }, {});

  const pieData = [
    { name: "Applied", value: statusCounts["Applied"] || 0, color: "#3B82F6" }, // Blue
    {
      name: "Interview",
      value: statusCounts["Interview"] || 0,
      color: "#EAB308",
    }, // Yellow
    { name: "Offer", value: statusCounts["Offer"] || 0, color: "#22C55E" }, // Green
    {
      name: "Rejected",
      value: statusCounts["Rejected"] || 0,
      color: "#EF4444",
    }, // Red
  ].filter((item) => item.value > 0); // Hide empty slices

  // --- 2. PREPARE DATA FOR BAR CHART (Monthly Activity) ---
  const monthlyData = applications.reduce((acc, app) => {
    const month = new Date(app.applied_date).toLocaleString("default", {
      month: "short",
    });
    const existing = acc.find((item) => item.name === month);
    if (existing) {
      existing.count += 1;
    } else {
      acc.push({ name: month, count: 1 });
    }
    return acc;
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      {/* --- PIE CHART CARD --- */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 transition-colors">
        <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">
          Application Status
        </h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1F2937",
                  borderColor: "#374151",
                  color: "#F3F4F6",
                }}
                itemStyle={{ color: "#F3F4F6" }}
              />
              <Legend verticalAlign="bottom" height={36} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* --- BAR CHART CARD --- */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 transition-colors">
        <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">
          Monthly Activity
        </h3>
        <div className="h-64 w-full">
          {monthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#374151"
                  opacity={0.2}
                />
                <XAxis dataKey="name" stroke="#9CA3AF" />
                <YAxis allowDecimals={false} stroke="#9CA3AF" />
                <Tooltip
                  cursor={{ fill: "transparent" }}
                  contentStyle={{
                    backgroundColor: "#1F2937",
                    borderColor: "#374151",
                    color: "#F3F4F6",
                  }}
                />
                <Bar
                  dataKey="count"
                  fill="#6366F1"
                  radius={[4, 4, 0, 0]}
                  barSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400">
              Not enough data yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardCharts;
