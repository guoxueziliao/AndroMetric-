import React from 'react';
import WeekOverview from './WeekOverview';
import type { WeekDaySummary } from './model/p1Summary';

interface DashboardWeekViewProps {
  days: WeekDaySummary[];
  onOpenDate: (date: string) => void;
}

const DashboardWeekView: React.FC<DashboardWeekViewProps> = ({ days, onOpenDate }) => (
  <WeekOverview days={days} onOpenDate={onOpenDate} />
);

export default DashboardWeekView;
