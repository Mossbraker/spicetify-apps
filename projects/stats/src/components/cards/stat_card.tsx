import React from "react";

interface StatCardProps {
	label: string;
	value: number | string;
}

function StatCard({ label, value }: StatCardProps) {
	return (
		<div className="main-card-card">
			<div className="stats-statCardValue">{value}</div>
			<div className="stats-statCardLabel">{label}</div>
		</div>
	);
}

export default StatCard;
