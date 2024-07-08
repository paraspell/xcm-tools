import { FC } from 'react';
import { AccountCountsQuery } from '../../gql/graphql';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import HC_more from 'highcharts/highcharts-more';
import { useTranslation } from 'react-i18next';
import { ChartDataItem, CustomPoint } from '../../types/types';
HC_more(Highcharts);

type Props = {
  counts: AccountCountsQuery['accountCounts'];
};

const AccountsAmountPlot: FC<Props> = ({ counts }) => {
  const { t } = useTranslation();
  const handlePointClick = (point: CustomPoint) => {
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
        data: counts.map((item): ChartDataItem => ({ name: item.id, value: item.count }))
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
        const point = this.point as CustomPoint;
        const idHash = point.name.startsWith('0x') ? point.name : '0x' + point.name;
        return t('idHash', { idHash, count: point.value });
      }
    },
    plotOptions: {
      packedbubble: {
        maxSize: 150,
        dataLabels: {
          enabled: true,
          formatter: function () {
            const point = this.point as CustomPoint;
            return point.value > 1000 ? `${point.name.substring(0, 10)}...` : '';
          }
        },
        point: {
          events: {
            click: function () {
              handlePointClick(this as CustomPoint);
            }
          }
        }
      }
    }
  };

  return <HighchartsReact highcharts={Highcharts} options={options} />;
};

export default AccountsAmountPlot;
