import './tabs.less';
import React from 'react';
import { Tabs, Select } from 'antd';
// 引入tabContent组件
import Tabcontent from '../tabContent/tabContent.js';
const onChange = key => {
  console.log(key);
};
const items = (props) => [
  {
    key: '1',
    label: '区间统计',
    children: <Tabcontent {...props} type="interval" />,
  },
  {
    key: '2',
    label: '奇偶统计',
    children: <Tabcontent {...props} type="oddEven" />,
  },
  {
    key: '3',
    label: '冷热统计',
    children: <Tabcontent {...props} type="hotCold" />,
  },
];
const Tab = function ({qishu, intervalStats, oddEvenStats, hotColdStats, handlePeriodChange, ball}) {
  return (
    <div>
      <div className="title">{ball}<Select
            value={qishu.toString()}
            onChange={handlePeriodChange}
            style={{backgroundColor: 'transparent', color: '#000' }}
            options={[
                { value: '10', label: '10' },
                { value: '30', label: '30' },
                { value: '50', label: '50' },
                { value: '100', label: '100' },
                { value: '150', label: '150' },
                { value: '200', label: '200' },
            ]}
            />期统计数据</div>
      <Tabs defaultActiveKey="1" items={items({intervalStats, oddEvenStats, hotColdStats})} onChange={onChange} />
    </div>
  );
};
export default Tab;