import './App.css'
import React, {useState, useEffect, useContext} from 'react';
import { DataContext } from './context';
import { Bar } from 'react-chartjs-2';
import {
	Chart as ChartJS,
	CategoryScale,
	LinearScale,
	LogarithmicScale,
	BarElement,
	Title,
	Tooltip,
	Legend
} from 'chart.js';

// ChartJS.register(CategoryScale, LinearScale, LogarithmicScale, BarElement, Title, Tooltip, Legend);
ChartJS.register(CategoryScale, LinearScale, LogarithmicScale, BarElement, Tooltip); // unregistered Title and Legend because easier to customize this way

const SecondView = () => {
	let {dataToPlot} = useContext(DataContext);

	let dataToPlotCopy = {...dataToPlot};

	if (!dataToPlotCopy) return <div>No data available</div>;
	if (!dataToPlotCopy.all_users_average || !dataToPlotCopy.current_user) return <div></div>;

	const labels = Object.keys(dataToPlotCopy.all_users_average);
	const averageData = labels.map(key => Number(dataToPlotCopy.all_users_average[key]) || 0);
	const currentUserData = labels.map(key => Number(dataToPlotCopy.current_user[key]) || 0);

	if (!labels.length || averageData.some(isNaN) || currentUserData.some(isNaN)) {
		return <div>Error: Invalid data format</div>;
	}

	// Determine colors based on comparison
	const userColors = currentUserData.map((value, index) => {
		return value > averageData[index] ? 'rgba(255, 99, 132, 0.6)' : 'rgba(75, 192, 192, 0.6)';
	});

	const chartData = {
		labels: labels,
		datasets: [
			{
				label: 'All Users Average',
				data: averageData,
				backgroundColor: 'rgba(128, 128, 128, 0.6)',
				borderColor: 'rgba(128, 128, 128, 1)',
				borderWidth: 1
			},
			{
				label: 'Current User',
				data: currentUserData,
				backgroundColor: userColors,
				borderColor: userColors.map(color => color.replace('0.6', '1')),
				borderWidth: 1
			}
		]
	};

	const options = {
		responsive: true,
		plugins: {
			legend: {
				position: 'top',
				labels: {
					generateLabels: (chart) => {
						const original = ChartJS.defaults.plugins.legend.labels.generateLabels(chart);
						return [
							original[0], // All Users Average
							{
								...original[1],
								// Custom legend item that shows both colors
								fillStyle: 'rgba(0, 0, 0, 0)', // Transparent
								strokeStyle: 'rgba(0, 0, 0, 0)',
								fontColor: '#666',
								// Add a color box that shows both colors
								text: [
									'\u25A0', // Square character
									'\u25A0'  // Square character
								].join(' '),
								// Custom render function
								pointStyle: false
							}
						];
					}
				}
			},
			tooltip: {
				callbacks: {
					afterBody: (context) => {
						const datasetIndex = context[0].datasetIndex;
						if (datasetIndex === 1) {
							const dataIndex = context[0].dataIndex;
							const userValue = currentUserData[dataIndex];
							const avgValue = averageData[dataIndex];
							const difference = userValue - avgValue;
							const percentage = (Math.abs(difference) / avgValue * 100).toFixed(1);

							return [
								`Difference: ${difference > 0 ? '+' : ''}${difference.toFixed(2)}`,
								`Percentage: ${percentage}% ${difference > 0 ? 'higher' : 'lower'}`
							];
						}
						return [];
					}
				}
			},
			title: {
				display: true,
				text: 'Comparison of Spending Categories'
			}
		},
		scales: {
			y: {
				type: 'logarithmic',
				min: 0,
				ticks: {
					autoSkip: true,
					maxTicksLimit: 15, // Reduce number of ticks
					font: {
						size: 12 // modify this if the font on the y axis labels is too big
					},
					callback: (value) => {
						if (value >= 1000) return `$${value/1000}k`;
						return `$${value}`;
					},
				}
			},
			x: {
				type: 'category',
				barPercentage: 0.6,
				categoryPercentage: 0.8
			}
		}
	};

	return (
		<div id="second-view-container" style={{ border: '2px solid purple', padding: '10px', margin: '10px' }}>
			<h3>Comparison of Spending Categories</h3>

			{/* Improved legend container */}
			<div style={{ 
				display: 'flex', 
				justifyContent: 'center',
				margin: '15px 0',
				padding: '8px',
				borderRadius: '4px'
			}}>
				<div style={{ 
					display: 'flex',
					alignItems: 'center',
					margin: '0 15px'
				}}>
					<div style={{
						width: '20px',
						height: '20px',
						backgroundColor: 'rgba(128, 128, 128, 0.6)',
						marginRight: '8px',
						border: '1px solid rgba(128, 128, 128, 1)'
					}}></div>
					<span>All Users Average</span>
				</div>

				<div style={{ 
					display: 'flex',
					alignItems: 'center',
					margin: '0 15px'
				}}>
					<div style={{
						width: '20px',
						height: '20px',
						background: 'linear-gradient(to right, rgba(255, 99, 132, 0.6) 50%, rgba(75, 192, 192, 0.6) 50%)',
						marginRight: '8px',
						border: '1px solid rgba(0, 0, 0, 0.2)'
					}}></div>
					<span>Current User (color indicates comparison)</span>
				</div>
			</div>

			<div style={{ height: '550px', width: '800px', margin: '20px 0' }}>
				<Bar 
					data={chartData} 
					options={{
						...options,
						maintainAspectRatio: false
					}} 
				/>
			</div>

			{/* Help text */}
			<div style={{
				fontSize: '0.9em',
				color: '#666',
				textAlign: 'center',
				marginTop: '10px'
			}}>
				<p>
					<span style={{ color: 'rgba(255, 99, 132, 0.8)' }}>Red</span> = Higher than average user | 
					<span style={{ color: 'rgba(75, 192, 192, 0.8)' }}> Green</span> = Lower than average user
				</p>
			</div>
		</div>
	);
};

export default SecondView;
