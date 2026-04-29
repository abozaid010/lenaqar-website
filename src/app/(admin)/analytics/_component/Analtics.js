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
import { useI18n } from "@/hooks/useI18n";

// Custom tooltip for the enhanced bar chart
const CustomTooltip = ({ active, payload, label, t }) => {
  if (active && payload && payload.length) {
    // Find the conversation data and average messages data
    const conversationData = payload.find(p => p.dataKey === 'conversations');
    const avgMessagesData = payload.find(p => p.dataKey === 'avg_user_total_messages');

    return (
      <div className="bg-white p-4 border border-gray-200 shadow-lg rounded-md">
        <p className="font-bold text-gray-900">{`${label}`}</p>
        <p style={{ color: "#030250" }}>
          <span className="inline-block w-3 h-3 mr-2" style={{ backgroundColor: "#030250" }}></span>
          {`${t('conversation')}: ${conversationData?.value || 0}`}
        </p>
        <p style={{ color: "#5d3dd5" }}>
          <span className="inline-block w-3 h-3 mr-2" style={{ backgroundColor: "#5d3dd5" }}></span>
          {`${t('averageMessagesPerUser')}: ${avgMessagesData?.value || 0}`}
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


  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-xl font-bold text-center mb-4 text-gray-800">{t('dailyConversationAnalysis')}</h3>
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
          // tickFormatter={formatDate}
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
          <Tooltip content={<CustomTooltip t={t} />} />
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
            name={t('numberConversation')}
            fill="#030250"
            // radius={[4, 4, 0, 0]}
            barSize={25}
            activeBar={<Rectangle fill="#030250" stroke="#030250" strokeWidth={1} />}
          />
          <Bar
            dataKey="avg_user_total_messages"
            name={t('averageMessagesPerUser')}
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

const EnhancedDailyActionBarChart = ({ datamonth, t }) => {
  const [activeBarIndex, setActiveBarIndex] = useState(null);
  const [animatedBars, setAnimatedBars] = useState([]);
  const [chartData, setChartData] = useState([]);

  // List of all possible actions (snake_case, matching your new data keys)
  const ACTION_KEYS = [
    "make_a_call",
    "office_visit",
    "property_view",
    "not_interested",
    "not_qualified",
    "follow_up_later",
    "missing_requirement",
    "blocked",
    "no_action",
    "qualified_lead"
  ];

  // Map action keys to display labels (add translations as needed)
  const ACTION_LABELS = {
    make_a_call: t?.dashboardFilter?.actions?.makeCall || "Make a call",
    office_visit: t?.dashboardFilter?.actions?.officeVisit || "Office visit",
    property_view: t?.dashboardFilter?.actions?.propertyView || "Property view",
    not_interested: t?.dashboardFilter?.actions?.notInterested || "Not interested",
    not_qualified: t?.dashboardFilter?.actions?.notQualified || "Not qualified",
    follow_up_later: t?.dashboardFilter?.actions?.followUpLater || "Follow up later",
    missing_requirement: t?.dashboardFilter?.actions?.missingRequirement || "Missing requirement",
    blocked: t?.dashboardFilter?.actions?.blocked || "Blocked",
    no_action: t?.dashboardFilter?.actions?.noAction || "No Action",
    qualified_lead: t?.dashboardFilter?.actions?.qualifiedLead || "Qualified Lead"
  };

  useEffect(() => {
    if (!Array.isArray(datamonth) || datamonth.length === 0) {
      setChartData([]);
      return;
    }

    // Process data to create proper format for action frequencies
    const processed = datamonth?.map(item => (item.action_frequencies)) || [];

    const reduced = ACTION_KEYS.map(action => {
      const total = processed.reduce((sum, day) => sum + (day[action] || 0), 0);
      return {
        action,
        label: ACTION_LABELS[action] || action,
        frequency: total
      };
    });

    setChartData(reduced);

    // Animate bars
    const timer = setTimeout(() => {
      setAnimatedBars(reduced.map((_, i) => i));
    }, 100);

    return () => clearTimeout(timer);
  }, [datamonth, t]);

  // Find min/max for Y axis
  const yMax = Math.max(...chartData.map(d => d.frequency), 2);

  const getActionColor = (action) => {
    const colors = {
      make_a_call: '#030250',
      office_visit: '#4c1d95',
      property_view: '#6d28d9',
      not_interested: '#ef4444',
      not_qualified: '#f59e0b',
      follow_up_later: '#10b981',
      missing_requirement: '#3b82f6',
      blocked: '#6b7280',
      no_action: '#9ca3af',
      qualified_lead: '#5d3dd5',
      default: '#030250'
    };
    return colors[action] || colors.default;
  };

  const CustomBar = (props) => {
    const { x, y, width, height, fill, index } = props;
    const isAnimated = animatedBars.includes(index);

    const animationStyle = {
      transform: isAnimated ? 'scaleY(1)' : 'scaleY(0)',
      transformOrigin: 'bottom',
      transition: 'transform 0.5s ease-out',
      opacity: isAnimated ? 1 : 0,
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
          style={animationStyle}
        />
      </g>
    );
  };

  // Tooltip for action frequency
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const { label, value } = payload[0];
      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
          <div className="font-bold text-lg mb-2 border-b pb-2 text-gray-800">
            {label}
          </div>
          <div className="text-gray-800 font-bold mb-1">
            {t('actionFrequency')}: {value}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
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
            dataKey="label"
            tick={{ fill: '#4B5563', fontWeight: 500, fontSize: 12 }}
            axisLine={{ stroke: '#9CA3AF' }}
            tickLine={false}
            interval={0} // Show all labels
            angle={-35}  // Rotate for better fit
            dy={32}      // Move labels down a bit
            height={60}  // Give more space for labels
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
            domain={[0, yMax + 2]}
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
            dataKey="frequency"
            name={t('dashboardFilter.actions.allActions')}
            barSize={30}
            shape={<CustomBar />}
            legendType="none"
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={getActionColor(entry.action)}
              />
            ))}
          </Bar>
        </ComposedChart>
      </ResponsiveContainer>

      <div className="text-center mt-4 text-gray-500 text-xs">
        {t('clickBarInfo')}
      </div>
    </div>
  );
};

const Analytics = ({ data, datamonth, appliedFilters }) => {
  const { translate } = useI18n();

  return (
    <div className="flex flex-wrap w-full">
      <div className="w-full p-2 mb-4">
        <h2 className="text-2xl font-bold">{translate('dashboardTitle')}</h2>
        <p className="text-gray-600">{translate('dashboardDescription')}</p>
      </div>

      <div className="w-full  p-2">
        <div className="border rounded p-3 h-full">
          <h3 className="text-lg font-semibold mb-2">{translate('conversationAnalysis')}</h3>
          <EnhancedBarChart data={data} t={translate} />
        </div>
      </div>

      <div className="w-full p-2">
        <div className="border rounded p-3 h-full">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-lg font-semibold">{translate('monthlyActionFrequency')}</h3>
              <p className="text-sm text-gray-500">{translate('bubbleVisualization')}</p>
            </div>
            <div className="w-2/5">
              <FilterMonth appliedFilters={appliedFilters} t={translate} />
            </div>
          </div>

          <EnhancedDailyActionBarChart datamonth={datamonth} t={translate} />
        </div>
      </div>

    </div>
  );
};

export default Analytics;