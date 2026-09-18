import React, { useMemo, useEffect } from 'react';
import { Table, Select, Spin } from 'antd';
import './ssq.less';
// 引入apis中的getSSQData函数
import { getSSQData } from '../../apis/index.js';
// 引入tab组件
import Tab from '../../components/tabs/tabs.js';
// 用户配置组件
import UserSet from '../../components/userSet/userSet.js';
// helper: pad number to two digits
const pad = (n) => n.toString().padStart(2, '0');

const computeFrequencies = (rows) => {
  const freq = new Map();
  for (let i = 1; i <= 33; i++) freq.set(i, 0);
  rows.forEach((r) => {
    r.reds.forEach((n) => freq.set(n, (freq.get(n) || 0) + 1));
  });
  return freq;
};

const SSQPage = () => {
  // data assumed newest-first (index 0 newest)
  const [rows, setRows] = React.useState([]);
  // 处理Select组件的onChange事件
  const [selectedPeriod, setSelectedPeriod] = React.useState(30);
  useEffect(() => {
    const fetchData = async () => {
      // 请求API获取双色球数据，传入selectedPeriod作为参数
      let response = await getSSQData({issue: 200});
      if (response.data.status === 'error') return;
      // 将返回的数据存入rows状态中
      setRows(response.data);
    };
    fetchData();
  }, []);
// useMemo的作用是缓存计算结果，避免不必要的重复计算，提高性能。它会在依赖项发生变化时重新计算，否则返回缓存的值
  const { hotSet, coldSet, tableData } = useMemo(() => {
    const freq = computeFrequencies(rows);
    const nums = Array.from(freq.entries()).sort((a, b) => b[1] - a[1]);
    const hot = nums.slice(0, 6).map((i) => i[0]);
    const cold = nums.slice(-6).map((i) => i[0]);
    const hotSet = new Set(hot);
    const coldSet = new Set(cold);

    // 重新计算“冷号”集合：按照最新期（rows[0]）的 prior-omit >4 为冷号
    // 注意：如果没有历史数据（last === -1），将 omit 设为 null，不计入冷号
    const latestColdSet = new Set();
    if (rows.length > 0) {
      for (let n = 1; n <= 33; n++) {
        const appearsInLatest = rows[0].reds.includes(n);
        if (appearsInLatest) continue;
        let last = -1;
        for (let j = 1; j < rows.length; j++) {
          if (rows[j].reds.includes(n)) { last = j; break; }
        }
        // prior-omit defined as zero-based: if last appearance was previous period, omit = 0
        const omit = last === -1 ? null : (last - 1); // last - idx - 1 with idx===0
        if (omit !== null && omit > 4) latestColdSet.add(n);
      }
    }

    const tableData = rows.map((r, idx) => {
      const redsMap = [];
      let coldCountForRow = 0;
      for (let n = 1; n <= 33; n++) {
        const appeared = r.reds.includes(n);
        // 查找当前期之前最近一次出现的位置（向后查找索引更大的 entries，即更老的期）
        let last = -1;
        for (let j = idx + 1; j < rows.length; j++) {
          if (rows[j].reds.includes(n)) { last = j; break; }
        }
        // 如果没有历史出现（last === -1），设 omit 为 rows.length - idx - 1（零基），
        // 这样最旧的期也会显示一个合理的遗漏值而不是 null/无记录
        const omit = last === -1 ? (rows.length - idx - 1) : (last - idx - 1);
        // 对于当前期出现的号码，若其 prior-omit >4 则计为冷号（prior-omit 为零基）
        if (appeared && omit !== null && omit > 4) {
          coldCountForRow += 1;
        }
        redsMap.push({ n, appeared, omit });
      }

      const bluesMap = [];
      for (let n = 1; n <= 16; n++) {
        const appeared = r.blue === n;
        if (appeared) {
          // prior-omit zero-based for when blue appears in current row
          bluesMap.push({ n, appeared: true, omit: 0 });
        } else {
          let last = -1;
          for (let j = idx + 1; j < rows.length; j++) {
            if (rows[j].blue === n) { last = j; break; }
          }
          const omit = last === -1 ? (rows.length - idx - 1) : (last - idx - 1);
          bluesMap.push({ n, appeared: false, omit });
        }
      }
      // 计算奇偶比
      const odd = r.reds.filter((n) => n % 2 === 1).length;
      const even = r.reds.length - odd;
      // 计算区间比
      const i1 = r.reds.filter((n) => n >= 1 && n <= 11).length;
      const i2 = r.reds.filter((n) => n >= 12 && n <= 22).length;
      const i3 = r.reds.filter((n) => n >= 23 && n <= 33).length;
      // 计算冷热比：冷号标准为“最新遗漏>4”，并保证两者之和为6（6个红球）
      const coldCount = coldCountForRow;
      const hotCount = r.reds.length - coldCount;

      const rec = {
        key: r.period,
        period: r.period,
        idx,
        blue: r.blue,
        oddEven: `${odd}:${even}`,
        interval: `${i1}:${i2}:${i3}`,
        hotCold: `${coldCount}:${hotCount}`,
      };

      redsMap.forEach((cell) => { rec[`red_${cell.n}`] = cell; });
      bluesMap.forEach((cell) => { rec[`blue_${cell.n}`] = cell; });

      return rec;
    });

    return { hotSet, coldSet, tableData };
  }, [rows]);

  // 统计冷热比模式，固定标签顺序：从 "6:0" 到 "0:6"（冷数:热数），基于表格展示的数据子集
  const hotColdStats = useMemo(() => {
    const freqMap = new Map();
    const display = tableData.slice(0, selectedPeriod);
    display.forEach((rec) => {
      const key = rec.hotCold; // e.g. "2:4"
      freqMap.set(key, (freqMap.get(key) || 0) + 1);
    });
    const labels = [];
    for (let cold = 6; cold >= 0; cold--) {
      const hot = 6 - cold;
      labels.push(`${cold}:${hot}`);
    }
    const freqs = labels.map((lab) => freqMap.get(lab) || 0);
    return { intervals: labels, freqs };
  }, [tableData, selectedPeriod]);

  // 计算区间统计，用于柱状图：返回 { intervals: [...], freqs: [...] }，基于表格展示子集
  const intervalStats = useMemo(() => {
    const subset = rows.slice(0, selectedPeriod);
    const freqMap = new Map();
    subset.forEach((r) => {
      const i1 = r.reds.filter((n) => n >= 1 && n <= 11).length;
      const i2 = r.reds.filter((n) => n >= 12 && n <= 22).length;
      const i3 = r.reds.filter((n) => n >= 23 && n <= 33).length;
      const key = `${i1}:${i2}:${i3}`;
      freqMap.set(key, (freqMap.get(key) || 0) + 1);
    });

    const entries = Array.from(freqMap.entries());
    entries.sort((a, b) => b[1] - a[1]);
    const intervals = entries.map((e) => e[0]);
    const freqs = entries.map((e) => e[1]);
    return { intervals, freqs };
  }, [rows, selectedPeriod]);

  // 计算奇偶比模式统计，例如 "3:3"，并按固定标签顺序返回（6:0 -> 0:6），基于表格展示子集
  const oddEvenStats = useMemo(() => {
    const labels = [];
    for (let odd = 6; odd >= 0; odd--) {
      const even = 6 - odd;
      labels.push(`${odd}:${even}`);
    }

    const freqMap = new Map();
    const subset = rows.slice(0, selectedPeriod);
    subset.forEach((r) => {
      const odd = r.reds.filter((n) => n % 2 === 1).length;
      const even = r.reds.length - odd;
      const key = `${odd}:${even}`;
      freqMap.set(key, (freqMap.get(key) || 0) + 1);
    });

    const freqs = labels.map((lab) => freqMap.get(lab) || 0);
    return { intervals: labels, freqs };
  }, [rows, selectedPeriod]);

  // ===== 蓝球统计（基于表格展示子集） =====
  const blueIntervalStats = useMemo(() => {
    const display = tableData.slice(0, selectedPeriod);
    const freqMap = new Map();
    display.forEach((rec) => {
      const n = rec.blue;
      const key = (n >= 1 && n <= 8) ? '一区' : '二区';
      freqMap.set(key, (freqMap.get(key) || 0) + 1);
    });
    const labels = ['一区', '二区'];
    const freqs = labels.map((lab) => freqMap.get(lab) || 0);
    return { intervals: labels, freqs };
  }, [tableData, selectedPeriod]);

  const blueOddEvenStats = useMemo(() => {
    const display = tableData.slice(0, selectedPeriod);
    const freqMap = new Map();
    display.forEach((rec) => {
      const n = rec.blue;
      const key = (n % 2 === 1) ? '奇数' : '偶数';
      freqMap.set(key, (freqMap.get(key) || 0) + 1);
    });
    const labels = ['奇数', '偶数'];
    const freqs = labels.map((lab) => freqMap.get(lab) || 0);
    return { intervals: labels, freqs };
  }, [tableData, selectedPeriod]);

  const blueHotColdStats = useMemo(() => {
    const freqMap = new Map();
    const display = tableData.slice(0, selectedPeriod);
    display.forEach((rec) => {
      const idx = rec.idx;
      const n = rec.blue;
      // find last appearance after idx
      let last = -1;
      for (let j = idx + 1; j < rows.length; j++) {
        if (rows[j].blue === n) { last = j; break; }
      }
      const omit = last === -1 ? (rows.length - idx - 1) : (last - idx - 1);
      const key = (omit > 4) ? '冷号' : '热号';
      freqMap.set(key, (freqMap.get(key) || 0) + 1);
    });
    const labels = ['冷号', '热号'];
    const freqs = labels.map((lab) => freqMap.get(lab) || 0);
    return { intervals: labels, freqs };
  }, [tableData, rows, selectedPeriod]);

  const redCols = (start, end) => {
    const childs = [];
    for (let i = start; i <= end; i++) {
      const isSep = i === 11 || i === 22 || i === 33;
      childs.push({
        title: `${i}`,
        dataIndex: `red_${i}`,
        key: `red_${i}`,
        className: isSep ? 'sep-col' : undefined,
        render: (cell) => {
          if (!cell) return null;
          return (
            <div className={`cell ${cell.appeared ? 'present red' : 'absent'}`} title={cell.appeared ? pad(cell.n) : `遗漏 ${cell.omit}`}>
              {cell.appeared ? pad(cell.n) : cell.omit}
            </div>
          );
        },
      });
    }
    return childs;
  };

  const blueCols = (start, end) => {
    const childs = [];
    for (let i = start; i <= end; i++) {
      const isSep = i === 8;
      childs.push({
        title: `${i}`,
        dataIndex: `blue_${i}`,
        key: `blue_${i}`,
        className: isSep ? 'sep-col' : undefined,
        render: (cell) => {
          if (!cell) return null;
          const title = cell.appeared ? pad(cell.n) : (cell.omit === null ? '无记录' : `遗漏 ${cell.omit}`);
          const display = cell.appeared ? pad(cell.n) : (cell.omit === null ? '-' : cell.omit);
          return (
            <div className={`cell ${cell.appeared ? 'present blue' : 'absent'}`} title={title}>
              {display}
            </div>
          );
        },
      });
    }
    return childs;
  };

  const columns = [
    { title: '期数', dataIndex: 'period', key: 'period', fixed: 'left' },
    {
      title: '红球',
      children: [
        { title: '一区', children: redCols(1, 11) },
        { title: '二区', children: redCols(12, 22) },
        { title: '三区', children: redCols(23, 33) },
      ],
    },
    {
      title: '篮球',
      children: [
        { title: '一区', children: blueCols(1, 8) },
        { title: '二区', children: blueCols(9, 16) },
      ],
    },
    { title: '奇偶比', dataIndex: 'oddEven', key: 'oddEven' },
    { title: '区间比', dataIndex: 'interval', key: 'interval' },
    { title: '冷热比', dataIndex: 'hotCold', key: 'hotCold' },
  ];
  // 处理Select组件的onChange事件
  const handleChange = (value) => {
    setSelectedPeriod(Number(value));
  };
  // 更改期数
  const handlePeriodChange = (value) => {
    setSelectedPeriod(value);
  }
  return (
    <div className="ssq-page">
        {rows.length === 0 ? <Spin size="large" /> : (
            <div className="spin-container">
        <div className="ssq-header">
        查询历史期数：<Select
            // defaultValue="30"
            value={selectedPeriod.toString()}
            style={{ width: 120, backgroundColor: 'transparent', color: '#000', fontSize: '1.2rem' }}
            onChange={handleChange}
            options={[
                { value: '10', label: '10期' },
                { value: '30', label: '30期' },
                { value: '50', label: '50期' },
                { value: '100', label: '100期' },
                { value: '150', label: '150期' },
                { value: '200', label: '200期' },
            ]}
            />
        </div>
            <Table
              columns={columns}
              // 只显示最新的 selectedPeriod 条数据，并按期数倒序排列（最新期在上）
              dataSource={tableData.slice(0, selectedPeriod).reverse()}
              pagination={false}
              bordered={false}
              size="small"
              rowKey="key"
              // 使用自动表格布局使列按内容自适应，并允许内容决定横向滚动宽度
              tableLayout="auto"
              scroll={{ x: 'max-content', y: 420 }}
              sticky
              rowHoverable={true}
            /> 
        <div className="tab">
          <Tab qishu={selectedPeriod} intervalStats={intervalStats} oddEvenStats={oddEvenStats} hotColdStats={hotColdStats} handlePeriodChange={handlePeriodChange} ball='红球'/>
        </div>  
        <div className="tab">
          <Tab qishu={selectedPeriod} intervalStats={blueIntervalStats} oddEvenStats={blueOddEvenStats} hotColdStats={blueHotColdStats} handlePeriodChange={handlePeriodChange}  ball='蓝球'/>
        </div> 
        <div className="tab">
          <UserSet selectedPeriod={selectedPeriod} intervalStats={intervalStats} oddEvenStats={oddEvenStats} hotColdStats={hotColdStats} rows={rows} period={rows.slice(0, selectedPeriod)} />
        </div>
        <div className="footer">
          <p>温馨提示：彩票开奖结果为随机事件，AI仅提供数据筛选不可预测开奖结果，祝君好运！</p>
        </div>
        </div>
    )}
    </div>
  );
};

export default SSQPage;