import type { FC, RefObject } from 'react';
import type { AccountCountsQuery } from '../../gql/graphql';
import Highcharts from 'highcharts';
import type { HighchartsReactRefObject } from 'highcharts-react-official';
import HighchartsReact from 'highcharts-react-official';
import HC_more from 'highcharts/highcharts-more';
import { useTranslation } from 'react-i18next';
import type { ChartDataItem, CustomPoint } from '../../types/types';
import { FixedSizeBinary } from 'polkadot-api';
HC_more(Highcharts);

type Props = {
  counts: AccountCountsQuery['accountCounts'];
  ref: RefObject<HighchartsReactRefObject | null>;
};

const AccountsAmountPlot: FC<Props> = ({ ref, counts }) => {
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
      style: {
        pointerEvents: 'auto'
      },
      formatter: function () {
        const point = this.point as CustomPoint;
        const { name } = point;
        const address = name.startsWith('0x') ? name : `0x${name}`;

        let encodedAddress;
        try {
          encodedAddress = FixedSizeBinary.fromAccountId32<32>(address).asHex();
        } catch (_e) {
          encodedAddress = address;
        }

        return `${t('idHash', { address, count: point.value })} <br> <a target="_blank" href="https://subscan.io/account/${encodedAddress}">${t('showInExplorer')}</a>`;
      }
    },
    plotOptions: {
      packedbubble: {
        stickyTracking: false,
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

  return <HighchartsReact ref={ref} highcharts={Highcharts} options={options} />;
};

AccountsAmountPlot.displayName = 'AccountsAmountPlot';

export default AccountsAmountPlot;
