"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Rectangle,
  ResponsiveContainer,
  ComposedChart,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
} from "recharts";
import FilterMonth from "./FilterMonth";
import { useI18n } from "@/context/translate-api";

// Custom tooltip for the enhanced bar chart
const CustomTooltip = ({ active, payload, label }) => {
  const { t } = useI18n();

  if (active && payload && payload.length) {
    // Find the conversation data and average messages data
    const conversationData = payload.find(p => p.dataKey === 'conversations');
    const avgMessagesData = payload.find(p => p.dataKey === 'avg_user_total_messages');

    return (
      <div className="bg-white p-4 border border-gray-200 shadow-lg rounded-md">
        <p className="font-bold text-gray-900">{`${label}`}</p>
        <p style={{ color: "#030250" }}>
          <span className="inline-block w-3 h-3 mr-2" style={{ backgroundColor: "#030250" }}></span>
          {`${t?.conversation || "Conversations"}: ${conversationData?.value || 0}`}
        </p>
        <p style={{ color: "#5d3dd5" }}>
          <span className="inline-block w-3 h-3 mr-2" style={{ backgroundColor: "#5d3dd5" }}></span>
          {`${t?.averageMessagesPerUser || "Average Messages per User"}: ${avgMessagesData?.value || 0}`}
        </p>
      </div>
    );
  }
  return null;
};

const EnhancedBarChart = ({ data, t }) => {
  const [activeIndex, setActiveIndex] = useState(null);

  const handleMouseEnter = (_, index) => {
    setActiveIndex(index);
  };

  const handleMouseLeave = () => {
    setActiveIndex(null);
  };

  // Format date for X-axis
  const formatDate = (value) => {
    if (!value) return '';
    const date = new Date(value);
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const day = date.getDate();
    const month = monthNames[date.getMonth()];
    // Remove year from conversation chart
    return `${month}-${day}`;
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-xl font-bold text-center mb-4 text-gray-800">{t?.dailyConversationAnalysis || "Daily Conversation Analysis"}</h3>
      <ResponsiveContainer width="100%" height={489}>
        <BarChart
          data={data?.daily_conversation_analysis || []}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 20,
          }}
          onMouseMove={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
          <XAxis
            dataKey="day"
            tick={{ fill: '#4B5563' }}
            tickLine={{ stroke: '#4B5563' }}
            axisLine={{ stroke: '#4B5563' }}
            tickFormatter={formatDate}
          />
          <YAxis
            label={{
              value: t?.count || 'Count of Messages & Conversations',
              angle: -90,
              position: 'insideLeft',
              style: { textAnchor: 'middle', fill: '#4B5563', fontWeight: 'bold' }
            }}
            tick={{ fill: '#4B5563' }}
            tickLine={{ stroke: '#4B5563' }}
            axisLine={{ stroke: '#4B5563' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ paddingTop: '10px' }}
            iconSize={10}
            iconType="circle"
            formatter={(value, entry) => {
              const { color } = entry;
              return <span style={{ color }}>{value}</span>;
            }}
          />
          <Bar
            dataKey="conversations"
            name={t?.numberConversation || "Number of Conversations"}
            fill="#030250"
            // radius={[4, 4, 0, 0]}
            barSize={25}
            activeBar={<Rectangle fill="#030250" stroke="#030250" strokeWidth={1} />}
          />
          <Bar
            dataKey="avg_user_total_messages"
            name={t?.averageMessagesPerUser || "Average Messages per User"}
            fill="#5d3dd5"
            // radius={[4, 4, 0, 0]}
            barSize={25}
            activeBar={<Rectangle fill="#5d3dd5" stroke="#5d3dd5" strokeWidth={1} />}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

const EnhancedDailyActionBarChart = ({ data, t }) => {
  const [chartData, setChartData] = useState([]);
  const [activeBarIndex, setActiveBarIndex] = useState(null);
  const [animatedBars, setAnimatedBars] = useState([]);

  // Actions mapping with translations
  const ACTIONS = useMemo(
    () => [
      { label: t?.dashboardFilter?.actions?.makeCall || "Make a call", value: "Make a call" },
      { label: t?.dashboardFilter?.actions?.officeVisit || "Office visit", value: "Office visit" },
      { label: t?.dashboardFilter?.actions?.propertyView || "Property view", value: "Property view" },
      { label: t?.dashboardFilter?.actions?.notInterested || "Not interested", value: "Not interested" },
      { label: t?.dashboardFilter?.actions?.notQualified || "Not qualified", value: "Not qualified" },
      { label: t?.dashboardFilter?.actions?.followUpLater || "Follow up later", value: "Follow up later" },
      { label: t?.dashboardFilter?.actions?.missingRequirement || "Missing requirement", value: "Missing requirement" },
      { label: t?.dashboardFilter?.actions?.blocked || "Blocked", value: "Blocked" },
      { label: t?.dashboardFilter?.actions?.noAction || "No Action", value: "No Action" },
      { label: t?.dashboardFilter?.actions?.sendEmail || "Send email", value: "Send email" },
      { label: t?.dashboardFilter?.actions?.scheduleMeeting || "Schedule meeting", value: "Schedule meeting" },
    ],
    [t]
  );

  // Format date for X-axis
  const formatDate = (value) => {
    if (!value) return '';
    const date = new Date(value);
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();
    // Remove day from action chart
    return `${year}-${month}`;
  };

  useEffect(() => {
    // Process data to create proper format for action frequencies
    const processed = data?.map(day => ({
      day: day.month,
      actionFrequency: day.actions_taken || 0,
      total: day.actions_taken || 0,
      breakdown: day.action_frequencies || {}
    })) || [];

    setChartData(processed);

    // Animation effect for bars on load
    const timer = setTimeout(() => {
      const indices = Array.from({ length: processed.length }, (_, i) => i);
      setAnimatedBars(indices);
    }, 100);

    return () => clearTimeout(timer);
  }, [data]);

  // Get translated action label
  const getActionLabel = (actionValue) => {
    const action = ACTIONS.find(a => a.value === actionValue);
    return action ? action.label : actionValue;
  };

  // Custom tooltip with enhanced styling
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const dayData = chartData.find(day => day.day === label);

      if (!dayData) return null;

      // Get action breakdown sorted by count (descending)
      const actionBreakdown = Object.entries(dayData.breakdown)
        .filter(([_, count]) => count > 0)
        .sort((a, b) => b[1] - a[1]);

      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
          <div className="font-bold text-lg mb-2 border-b pb-2 text-gray-800">
            {formatDate(label)}
          </div>
          <div className="text-gray-800 font-bold mb-3">
            Total Actions: {dayData.total}
          </div>

          {dayData.total > 0 && (
            <div className="space-y-2">
              {actionBreakdown.map(([action, count], idx) => {
                const percentage = Math.round((count / dayData.total) * 100);
                // Generate a color based on the action type
                const actionColor = getActionColor(action);

                return (
                  <div key={idx} className="flex items-center">
                    <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: actionColor }}></div>
                    <div className="flex-1 text-sm">{getActionLabel(action)}</div>
                    <div className="font-medium text-sm">{count} ({percentage}%)</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  // Function to generate color based on action type
  const getActionColor = (action) => {
    const colors = {
      'Make a call': '#030250', // Dark blue
      'Send email': '#5d3dd5', // Purple
      'Schedule meeting': '#9f7afa', // Lighter purple
      'Office visit': '#4c1d95', // Deep purple
      'Property view': '#6d28d9', // Medium purple
      'Not interested': '#ef4444', // Red
      'Not qualified': '#f59e0b', // Amber
      'Follow up later': '#10b981', // Green
      'Missing requirement': '#3b82f6', // Blue
      'Blocked': '#6b7280', // Gray
      'No Action': '#9ca3af', // Light gray
      'default': '#030250' // Default color
    };

    return colors[action] || colors.default;
  };

  // Custom bar with animation and hover effects
  const CustomBar = (props) => {
    const { x, y, width, height, fill, index } = props;
    const isAnimated = animatedBars.includes(index);
    const isActive = index === activeBarIndex;

    // Animation and hover effect styles
    const animationStyle = {
      transform: isAnimated ? 'scaleY(1)' : 'scaleY(0)',
      transformOrigin: 'bottom',
      transition: 'transform 0.5s ease-out',
      opacity: isAnimated ? 1 : 0,
    };

    // Remove hover style changes
    const hoverStyle = {
      // No color changes on hover
    };

    return (
      <g>
        <defs>
          <linearGradient id={`barGradient-${index}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={fill} stopOpacity={0.8} />
            <stop offset="95%" stopColor={fill} stopOpacity={0.6} />
          </linearGradient>
        </defs>
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          rx={4}
          ry={4}
          fill={`url(#barGradient-${index})`}
          style={{ ...animationStyle, ...hoverStyle }}
        />
      </g>
    );
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h3 className="text-xl font-bold text-center mb-4 text-gray-800">
        {t?.monthlyActionFrequency || "Monthly Action Frequency Analysis"}
      </h3>
      <div className="mb-3 text-center text-gray-600 text-sm">
        {t?.breakdownDescription || "Breakdown of actions taken each month"}
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <ComposedChart
          data={chartData}
          margin={{
            top: 20,
            right: 30,
            bottom: 30,
            left: 30,
          }}
          onMouseMove={(data) => {
            if (data.activeTooltipIndex !== undefined) {
              setActiveBarIndex(data.activeTooltipIndex);
            }
          }}
          onMouseLeave={() => {
            setActiveBarIndex(null);
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
          <XAxis
            dataKey="day"
            scale="band"
            padding={{ left: 20, right: 20 }}
            tick={{ fill: '#4B5563', fontWeight: 500 }}
            axisLine={{ stroke: '#9CA3AF' }}
            tickLine={false}
            tickFormatter={formatDate}
          />
          <YAxis
            label={{
              value: t?.actionFrequency || 'Action Frequency',
              angle: -90,
              position: 'insideLeft',
              style: {
                textAnchor: 'middle',
                fill: '#4B5563',
                fontWeight: 'bold',
                fontSize: 14
              },
              offset: -10
            }}
            tick={{ fill: '#4B5563' }}
            axisLine={{ stroke: '#9CA3AF' }}
            tickLine={false}
            tickFormatter={(value) => value > 0 ? value : ''}
            domain={[0, 'dataMax + 2']}
            allowDecimals={false}
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
          />
          <Legend
            wrapperStyle={{
              paddingTop: '20px',
              paddingBottom: '10px',
              fontWeight: 'bold'
            }}
            iconType="circle"
            iconSize={10}
          />

          <Bar
            dataKey="actionFrequency"
            name={t?.actionFrequency || "Action Frequency"}
            fill="#030250"
            shape={<CustomBar />}
            barSize={30}
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill="#030250"
              />
            ))}
          </Bar>
        </ComposedChart>
      </ResponsiveContainer>

      <div className="text-center mt-4 text-gray-500 text-xs">
        {t?.clickBarInfo || "Click on any bar to see detailed breakdown of actions"}
      </div>
    </div>
  );
};

const Analytics = ({ data, datamonth, appliedFilters }) => {
  const { t } = useI18n();
  return (
    <div className="flex flex-wrap w-full">
      <div className="w-full p-2 mb-4">
        <h2 className="text-2xl font-bold">{t?.dashboardTitle || "Analytics Dashboard"}</h2>
        <p className="text-gray-600">{t?.dashboardDescription || "Showing user activities and daily action breakdowns"}</p>
      </div>

      <div className="w-1/2 p-2">
        <div className="border rounded p-3 h-full">
          <h3 className="text-lg font-semibold mb-2">{t?.conversationAnalysis || "Conversation Analysis"}</h3>
          <EnhancedBarChart data={data} t={t} />
        </div>
      </div>
      <div className="w-1/2 p-2">
        <div className="border rounded p-3 h-full">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-lg font-semibold">{t?.actionFrequency || "Action Frequency"}</h3>
              <p className="text-sm text-gray-500">{t?.bubbleVisualization || "Bubble visualization of daily action totals"}</p>
            </div>
            <div className="w-2/5">
              <FilterMonth appliedFilters={appliedFilters} t={t} />
            </div>
          </div>
          <EnhancedDailyActionBarChart data={datamonth} t={t} />
        </div>
      </div>

    </div>
  );
};

export default Analytics;