"use client";
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



const BarChartComponent = ({ data }) => (
  <ResponsiveContainer width="100%" height={300}>
    <BarChart
      data={data.daily_conversation_analysis}
      margin={{
        top: 5,
        right: 10,
        left: 10,
        bottom: 5,
      }}
    >
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="day" />
      <YAxis />
      <Tooltip />
      <Bar
        dataKey="conversations"
        fill="#030250"
        activeBar={<Rectangle fill="pink" stroke="blue" />}
      />
      <Bar
        dataKey="avg_user_total_messages"
        fill="#171717"
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

const DailyActionBarChart = ({ data }) => {
  // Process data to create proper format for action frequencies with a single bar per day
  const processedData = data?.map(day => {
    // Create a new object with day and a single bar value for actions
    return { 
      day: day.month,
      actionFrequency: day.actions_taken || 0,
      total: day.actions_taken || 0,
      // Store the breakdown for tooltip
      breakdown: day.action_frequencies || {}
    };
  });

  // Action specific colors
  const ACTION_COLOR = "#030250"; // Use the Make a call color for all action bars

  // Custom tooltip that shows action breakdown
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      // Find the corresponding day data
      const dayData = processedData.find(day => day.day === label);
      
      return (
        <div className="custom-tooltip" style={{ 
          backgroundColor: 'white', 
          padding: '5px', 
          border: '1px solid #ccc',
          borderRadius: '',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <p className="label" style={{ fontWeight: 'bold', marginBottom: '5px' }}>{`Date: ${label}`}</p>
          <p className="total" style={{ fontWeight: 'bold', color: '#000' }}>{`Total Actions: ${dayData.total}`}</p>
          
          {/* Display breakdown if there are any actions */}
          {dayData.total > 0 && (
            <div className="breakdown" style={{ marginTop: '5px' }}>
              {Object.entries(dayData.breakdown)
                .filter(([action, count]) => count > 0)
                .map(([action, count], idx) => (
                  <p key={idx} style={{ margin: '2px 0' }}>
                    {`${action}: ${count}`}
                  </p>
                ))}
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  // Custom animated bar with bubble effect
  const BubbleBar = (props) => {
    const { x, y, width, height, fill } = props;
    
    return (
      <g>
        <rect 
          x={x} 
          y={y} 
          width={width} 
          height={height} 
          fill={fill}
        />
      </g>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={400}>
      <ComposedChart
        data={processedData}
        margin={{
          top: 20,
          right: 20,
          bottom: 20,
          left: 20,
        }}
      >
        <CartesianGrid stroke="#f5f5f5" />
        <XAxis dataKey="day" scale="band" />
        <YAxis label={{ value: 'Action Frequency', angle: -90, position: 'insideLeft', offset: -5 }} />
        <Tooltip content={<CustomTooltip />} />
        <Legend 
          wrapperStyle={{ paddingTop: '10px' }}
          payload={[
            { value: 'Action Frequency', type: 'square', color: ACTION_COLOR },
          ]}
        />
        
        <Bar 
          dataKey="actionFrequency" 
          name="Action Frequency" 
          fill={ACTION_COLOR} 
          shape={<BubbleBar />}
          barSize={20} 
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
};

// Create a stacked version that shows all action types


const Analytics = ({ data , datamonth , appliedFilters }) => {
 
  return (
    <div className="flex flex-wrap w-full">
      <div className="w-full p-2 mb-4">
        <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
        <p className="text-gray-600">Showing user activities and daily action breakdowns</p>
      </div>
      
      <div className="w-1/2 p-2">
        <div className="border rounded p-3 h-full">
          <h3 className="text-lg font-semibold mb-2">Conversation Analysis</h3>
          <BarChartComponent data={data} />
        </div>
      </div>
      <div className="w-1/2 p-2">
     
        <div className="border rounded p-3 h-full">
        <FilterMonth appliedFilters={appliedFilters} />
          <h3 className="text-lg font-semibold mb-2">Action Frequency</h3>
          <p className="text-sm text-gray-500 mb-2">Bubble visualization of daily action totals</p>
          <DailyActionBarChart data={datamonth} />
        </div>
      </div>
     
    </div>
  );
};

export default Analytics;
