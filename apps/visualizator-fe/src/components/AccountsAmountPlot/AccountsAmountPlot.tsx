/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { FC } from 'react';
import { AccountCountsQuery } from '../../gql/graphql';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import HC_more from 'highcharts/highcharts-more';
import { useTranslation } from 'react-i18next';
HC_more(Highcharts);

type Props = {
  counts: AccountCountsQuery['accountCounts'];
};

const AccountsAmountPlot: FC<Props> = ({ counts }) => {
  const { t } = useTranslation();
  const handlePointClick = (point: any) => {
    void navigator.clipboard.writeText(point.name);
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
        const idHash = this.point.name.startsWith('0x') ? this.point.name : '0x' + this.point.name;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const count = (this.point as any).value;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        return t('idHash', { idHash, count });
      }
    },
    plotOptions: {
      packedbubble: {
        maxSize: 150,
        dataLabels: {
          enabled: true,
          formatter: function () {
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
