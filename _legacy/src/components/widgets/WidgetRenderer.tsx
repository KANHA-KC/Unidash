import React from 'react';
import { DashboardWidget } from '../../types/dashboard';
import { MetricWidget } from './MetricWidget';
import { ChartAreaWidget } from './ChartAreaWidget';
import { ChartBarWidget } from './ChartBarWidget';
import { ChartDonutWidget } from './ChartDonutWidget';
import { TableWidget } from './TableWidget';
import { HabitsWidget } from './HabitsWidget';
import { GaugeWidget } from './GaugeWidget';
import { StatusFeedWidget } from './StatusFeedWidget';
import { NoteWidget } from './NoteWidget';

interface WidgetRendererProps {
  widget: DashboardWidget;
}

export const WidgetRenderer: React.FC<WidgetRendererProps> = ({ widget }) => {
  switch (widget.type) {
    case 'metric':
      return <MetricWidget props={widget.props} binding={widget.binding} />;
    case 'area-chart':
      return <ChartAreaWidget props={widget.props} />;
    case 'bar-chart':
      return <ChartBarWidget props={widget.props} />;
    case 'donut-chart':
      return <ChartDonutWidget props={widget.props} />;
    case 'table':
      return <TableWidget props={widget.props} />;
    case 'habits':
      return <HabitsWidget id={widget.id} props={widget.props} />;
    case 'gauge':
      return <GaugeWidget props={widget.props} />;
    case 'status-feed':
      return <StatusFeedWidget props={widget.props} />;
    case 'note':
      return <NoteWidget props={widget.props} />;
    default:
      return (
        <div style={{ padding: 16, color: 'var(--text-tertiary)' }}>
          Unknown widget type: {(widget as any).type}
        </div>
      );
  }
};
