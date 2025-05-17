"use client"
// import "./styles.css";
import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  // Legend,
  Rectangle,
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const data = [
  {
    name: "Page A",
    uv: 4000,
    pv: 2400,
    amt: 2400,
  },
  {
    name: "Page B",
    uv: 3000,
    pv: 1398,
    amt: 2210,
  },
  {
    name: "Page C",
    uv: 2000,
    pv: 9800,
    amt: 2290,
  },
  {
    name: "Page D",
    uv: 2780,
    pv: 3908,
    amt: 2000,
  },
  {
    name: "Page E",
    uv: 1890,
    pv: 4800,
    amt: 2181,
  },
  {
    name: "Page F",
    uv: 2390,
    pv: 3800,
    amt: 2500,
  },
  {
    name: "Page G",
    uv: 3490,
    pv: 4300,
    amt: 2100,
  },
];

const pieData = [
  { name: "Group A", value: 400 },
  { name: "Group B", value: 300 },
  { name: "Group C", value: 300 },
  { name: "Group D", value: 200 },
];

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

// Chart components
const BarChartComponent = () => (
  <ResponsiveContainer width="100%" height={300}>
    <BarChart
      data={data}
      margin={{
        top: 5,
        right: 10,
        left: 10,
        bottom: 5,
      }}
    >
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="name" />
      <YAxis />
      <Tooltip />
      <Bar
        dataKey="uv"
        fill="#B3CDAD"
        activeBar={<Rectangle fill="pink" stroke="blue" />}
      />
      <Bar
        dataKey="pv"
        fill="#FF5F5E"
        activeBar={<Rectangle fill="gold" stroke="purple" />}
      />
      {/* <Bar
        dataKey="amt"
        fill="#FF5F5E"
        activeBar={<Rectangle fill="gold" stroke="purple" />}
      /> */}
    </BarChart>
  </ResponsiveContainer>
);

const LineChartComponent = () => (
  <ResponsiveContainer width="100%" height={300}>
    <LineChart
      data={data}
      margin={{
        top: 5,
        right: 10,
        left: 10,
        bottom: 5,
      }}
    >
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="name" />
      <YAxis />
      <Tooltip />
      <Line type="monotone" dataKey="pv" stroke="#8884d8" />
      <Line type="monotone" dataKey="uv" stroke="#82ca9d" />
    </LineChart>
  </ResponsiveContainer>
);

const AreaChartComponent = () => (
  <ResponsiveContainer width="100%" height={300}>
    <AreaChart
      data={data}
      margin={{
        top: 5,
        right: 10,
        left: 10,
        bottom: 5,
      }}
    >
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="name" />
      <YAxis />
      <Tooltip />
      <Area type="monotone" dataKey="uv" stroke="#8884d8" fill="#8884d8" />
      <Area type="monotone" dataKey="pv" stroke="#82ca9d" fill="#82ca9d" />
    </AreaChart>
  </ResponsiveContainer>
);

const PieChartComponent = () => (
  <ResponsiveContainer width="100%" height={300}>
    <PieChart>
      <Pie
        data={pieData}
        cx="50%"
        cy="50%"
        labelLine={false}
        outerRadius={80}
        fill="#8884d8"
        dataKey="value"
      >
        {pieData.map((entry, index) => (
          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
        ))}
      </Pie>
      <Tooltip />
    </PieChart>
  </ResponsiveContainer>
);

const Analytics = () => {
  return (
    <div className="flex flex-wrap w-full">
      <div className="w-1/2 p-2">
        <div className="border rounded p-3 h-full">
          <h3 className="text-lg font-semibold mb-2">Bar Chart</h3>
          <BarChartComponent />
        </div>
      </div>
      <div className="w-1/2 p-2">
        <div className="border rounded p-3 h-full">
          <h3 className="text-lg font-semibold mb-2">Line Chart</h3>
          <LineChartComponent />
        </div>
      </div>
      <div className="w-1/2 p-2">
        <div className="border rounded p-3 h-full">
          <h3 className="text-lg font-semibold mb-2">Area Chart</h3>
          <PieChartComponent />
        </div>
      </div>
      <div className="w-1/2 p-2 border border-red-500">
        <div className="border rounded p-3 h-full">
          <h3 className="text-lg font-semibold mb-2">Pie Chart</h3>
          <BarChartComponent />
        </div>
      </div>
    </div>
  );
};

export default Analytics;
