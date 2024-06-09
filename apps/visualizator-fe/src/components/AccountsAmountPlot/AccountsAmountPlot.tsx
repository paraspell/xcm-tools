/* eslint-disable @typescript-eslint/no-explicit-any */
import { FC } from 'react';
import { AccountCountsQuery } from '../../gql/graphql';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import HC_more from 'highcharts/highcharts-more';
HC_more(Highcharts);

type Props = {
  counts: AccountCountsQuery['accountCounts'];
};

const AccountsAmountPlot: FC<Props> = ({ counts }) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handlePointClick = (point: any) => {
    // Example action: log the point's details
    console.log(`Point clicked: ID = ${point.name}, Count = ${point.value}`);
    // Here, you could also invoke more complex logic based on the clicked point
    navigator.clipboard.writeText(point.name);
  };

  const options: Highcharts.Options = {
    chart: {
      type: 'packedbubble',
      width: null,
      height: '37%'
    },
    title: {
      text: ''
    },
    responsive: {},
    series: [
      {
        type: 'packedbubble',
        data: counts.map(item => ({ name: item.id, value: item.count }))
      }
    ],
    legend: {
      enabled: false
    },
    credits: {
      enabled: false
    },
    tooltip: {
      useHTML: true,
      formatter: function () {
        // Assuming you want to show the item's id (or a hash of it) in the tooltip
        // Here, simply using the item's name (id) as an example. Replace or modify according to your hash generation logic
        return `ID (Hash): <b>${this.point.name.startsWith('0x') ? this.point.name : '0x' + this.point.name}</b><br>Count: <b>${(this.point as any).value}</b>`;
      }
    },
    plotOptions: {
      packedbubble: {
        // minSize: 1,
        maxSize: 150,
        dataLabels: {
          enabled: true,
          formatter: function () {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return (this.point as any).value > 1000 ? `${this.point.name.substring(0, 10)}...` : '';
          }
        },
        point: {
          events: {
            click: function () {
              handlePointClick(this);
            }
          }
        }
      }
    }
  };

  return <HighchartsReact highcharts={Highcharts} options={options} />;
};

export default AccountsAmountPlot;
