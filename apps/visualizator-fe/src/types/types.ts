export type ChartDataItem = {
  name: string;
  value: number;
};

export interface CustomPoint extends Highcharts.Point {
  name: string;
  value: number;
}
