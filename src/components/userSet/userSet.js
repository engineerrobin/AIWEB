import React, { useMemo, useState, useEffect } from 'react';
import { Select, Button, message, InputNumber, Spin } from 'antd';
import { QuestionCircleFilled } from '@ant-design/icons';
import { streamChat } from '../../apis/index.js';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './userSet.less';
// 引入redux的useDispatch和useSelector
import { useDispatch, useSelector } from 'react-redux';
// 引入redux的action用于分发
import { addConversation, clearConversation } from '../../store/modules/conversation.js';

const RANGE_OPTIONS = [
  { value: '01-08', label: '01-08' },
  { value: '09-16', label: '09-16' },
  { value: '17-24', label: '17-24' },
  { value: '25-33', label: '25-33' },
];

const ODD_EVEN_OPTIONS = ['0:6','1:5','2:4','3:3','4:2','5:1','6:0'].map((v) => ({ value: v, label: v }));
const HOT_COLD_OPTIONS = ODD_EVEN_OPTIONS;

const LIAN_OPTIONS = [
  { value: '不连号', label: '无连号' },
  { value: '2', label: '2连' },
  { value: '<=2', label: '<=2连' },
  { value: '3', label: '3连' },
  { value: '<=3', label: '<=3连' },
  { value: '4', label: '4连' },
  { value: '<=4', label: '<=4连' },
];

const REPEAT_OPTIONS = [
  { value: '无重复号码', label: '无重号' },
  { value: '1', label: '1个' },
  { value: '2', label: '2个' },
  { value: '<=2', label: '<=2' },
  { value: '3', label: '3个' },
  { value: '<=3', label: '<=3' },
];

function parseRatio(value) {
  const [a, b] = String(value).split(':').map((s) => parseInt(s, 10));
  return { odd: isNaN(a) ? 0 : a, even: isNaN(b) ? 0 : b };
}

function computeConsecutiveOptions(count, totalSlots = 6) {
  if (!count || count === totalSlots) return [];
  const opts = [];
  const other = totalSlots - count;
  const minMaxRun = Math.ceil(count / (other + 1));
  const allowNon = minMaxRun === 1;
  if (allowNon) opts.push({ value: 'non', label: '不相连（可间隔）' });
  const max = Math.min(count, 4);
  for (let i = 2; i <= max; i++) {
    if (count >= i) opts.push({ value: String(i), label: `${i}连` });
    if (count >= 2 && minMaxRun <= i) {
      if (!(i === 2 && (count === 2 || count === 4))) {
        const leLabel = allowNon ? `<=${i}连（含不相连）` : `<=${i}连`;
        opts.push({ value: `<=${i}`, label: leLabel });
      }
    }
  }
  return opts;
}
const UserSet = ({ selectedPeriod, intervalStats, oddEvenStats, hotColdStats, rows = [], onSave, period }) => {
    // 获取redux的dispatch函数用于分发action
  const dispatch = useDispatch();
  // 获取redux的state
  const conversations = useSelector((state) => state.conversations);
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRanges, setSelectedRanges] = useState([]);
  const [oddEven, setOddEven] = useState('3:3');
  const [hotCold, setHotCold] = useState('3:3');
  const [minRedParity, setMinRedParity] = useState('even');
  const [lian, setLian] = useState('不连号');
  const [lianParity, setLianParity] = useState(null);
  const [lianParityLen, setLianParityLen] = useState(null);
  const [coldConsecutive, setColdConsecutive] = useState(null);
  const [repeat, setRepeat] = useState('0');
  const [ratioResult, setRatioResult] = useState(null);
  const [ticketCount, setTicketCount] = useState(1);

  const oddEvenCounts = useMemo(() => parseRatio(oddEven), [oddEven]);
  const hotColdCounts = useMemo(() => parseRatio(hotCold), [hotCold]);

  const parityOptionsMap = useMemo(() => {
    const map = {};
    const totalSlots = 6;
    for (let odd = 0; odd <= totalSlots; odd++) {
      const even = totalSlots - odd;
      const key = `${odd}:${even}`;
      map[key] = {
        oddOptions: computeConsecutiveOptions(odd, totalSlots),
        evenOptions: computeConsecutiveOptions(even, totalSlots),
      };
    }
    return map;
  }, []);

  const currentRatioKey = `${oddEvenCounts.odd}:${oddEvenCounts.even}`;
  const currentParityOptions = parityOptionsMap[currentRatioKey] || { oddOptions: [], evenOptions: [] };

  const hasConsecutiveSelectable = (opts) => Array.isArray(opts) && opts.some((o) => typeof o.value === 'string' && (/^\d+$/.test(o.value) || /^<=\d+$/.test(o.value)));

  const lianParitySelectOptions = [
    { value: 'odd', label: '连奇', disabled: !hasConsecutiveSelectable(currentParityOptions.oddOptions) },
    { value: 'even', label: '连偶', disabled: !hasConsecutiveSelectable(currentParityOptions.evenOptions) },
  ];

  const coldConsecutiveOptions = useMemo(() => computeConsecutiveOptions(hotColdCounts.odd || 0, 6), [hotColdCounts]);

  const oddEvenOptionsFromStats = useMemo(() => {
    if (!oddEvenStats || !Array.isArray(oddEvenStats.intervals)) return ODD_EVEN_OPTIONS;
    const freqs = oddEvenStats.freqs || [];
    const total = Number(selectedPeriod) || 1;
    return oddEvenStats.intervals.map((lab, idx) => {
      const count = freqs[idx] || 0;
      const pct = ((count / total) * 100).toFixed(1);
      return { value: lab, label: `${lab} (${pct}%)` };
    });
  }, [oddEvenStats, selectedPeriod]);

  const hotColdOptionsFromStats = useMemo(() => {
    if (!hotColdStats || !Array.isArray(hotColdStats.intervals)) return HOT_COLD_OPTIONS;
    const freqs = hotColdStats.freqs || [];
    const total = Number(selectedPeriod) || 1;
    return hotColdStats.intervals.map((lab, idx) => {
      const count = freqs[idx] || 0;
      const pct = ((count / total) * 100).toFixed(1);
      return { value: lab, label: `${lab} (${pct}%)` };
    });
  }, [hotColdStats, selectedPeriod]);

  const intervalOptions = useMemo(() => {
    if (!intervalStats || !Array.isArray(intervalStats.intervals)) return RANGE_OPTIONS;
    const freqs = intervalStats.freqs || [];
    const total = Number(selectedPeriod) || 1;
    return intervalStats.intervals.map((lab, idx) => {
      const count = freqs[idx] || 0;
      const pct = ((count / total) * 100).toFixed(1);
      return { value: lab, label: `${lab} (${pct}%)` };
    });
  }, [intervalStats, selectedPeriod]);

  useEffect(() => {
    if (lianParity === 'odd' && (!currentParityOptions.oddOptions || currentParityOptions.oddOptions.length === 0)) {
      setLianParity(null);
      setLianParityLen(null);
    }
    if (lianParity === 'even' && (!currentParityOptions.evenOptions || currentParityOptions.evenOptions.length === 0)) {
      setLianParity(null);
      setLianParityLen(null);
    }
    if (coldConsecutiveOptions.length === 0) setColdConsecutive(null);
  }, [lianParity, currentParityOptions, coldConsecutiveOptions]);
  let context='';
  const handleSubmit = async () => {
    if(localStorage.getItem('role')!=='65a1b2c3d4e5f67890a1b2c6') {
      message.error('您没有权限提交此操作');
      return;
    }
    dispatch(clearConversation());
    try {
      if (lianParity && (!currentParityOptions || (lianParity === 'odd' && !currentParityOptions.oddOptions.length) || (lianParity === 'even' && !currentParityOptions.evenOptions.length))) {
        message.error('所选奇偶侧无可用连数选项，无法提交');
        return;
      }
      if (lianParity && !lianParityLen) {
        message.error('请选择连奇/连偶的连数或范围');
        return;
      }

      const changeKey = period.map((item) => ({ '期数': item.period, '红球': item.reds.join(), '蓝球': item.blue }));
      const text = `这里是双色球最近${selectedPeriod}期历史开奖数据：` + JSON.stringify(changeKey) + '请根据以下各个条件筛选出符合条件的号码';
      const setText = `
      \n1.区间比：${selectedRanges}（指每个区间的号码比例，一区指1-11，二区指12-22，三区指23-33）,
      \n2.奇偶比：${oddEven},
      \n3.冷热比：${hotCold}(冷号的概念是指最近5期未出现的号码；必须严格校验每注号码的每一个号码，例如当冷热比为1：5时，我发现你在查找到第一个冷号后就不再对后续号码进行校验，从而可能导致冷热比不符合要求)，
      \n4.最小红球为：${minRedParity == 'even' ? '偶数' : '奇数'}(红球的第一个号码的奇偶性，必须严格验证),
      \n5.连号：${lian}（连号是指筛选的号码连续出现相邻阿拉伯数字，若连续出现则为相连，否则为不相连；值为2，表示连续出现的数量为2；值为3，表示连续出现的数量为3；<=3表示连续出现的数量不超过3个,可以是号码不连、连两个或连三个）,
      \n6.连奇/连偶：${lianParity ? (lianParity === 'odd' ? '奇数' : '偶数') : '无要求'}${lianParityLen == 'none' ? '不相连':'的连数为' + lianParityLen}（首先连奇/连偶的内容是基于奇偶比的选项，连奇：指代的是每注号码中位置关系上奇数的连数，连偶：指代的是每注号码中偶数的连数；连奇/连偶的连数是指连续出现的奇数或偶数的数量，并不是指大小关系上加1相邻的号码（但大小关系+1相邻的号码也算连奇/连偶）；连奇数为2，那就带表筛选的号码中的奇数连续出现了2个，连奇为3，那就带表筛选的号码中的奇数连续出现了3个，连奇数<=3,就代表筛选的号码中的奇数连续出现的数量不超过3个，可以是两个或三个；注意在筛选的时候每个奇数位置在验证了该位置的前一位的同时，还需要验证该位置的后一位是否符合连奇/连偶的要求，因为我发现你在验证了第一个奇数的位置后，可能会忽略了后一个奇数的位置；偶数同理）,
      \n7.冷号相连：${coldConsecutive == 'non' ? '不相连' : coldConsecutive}（冷号相连是指筛选的号码中冷号连续出现的情况，若冷号连续出现则为相连，否则为不相连，值为2，表示冷号连续出现的数量为2，值为3，表示冷号连续出现的数量为3，<=3表示冷号连续出现的数量不超过3个,可以是两个或三个）,
      \n8.重号：${repeat}（和最后一期的开奖号码相同的号码，2表示有2个重号，3表示有3个重号，<=3表示重号数量不超过3个，可以是1个、2个或3个；当值为范围时，例如：<=2,表示可以不重、重1个或重2个,每种情况都需要考虑，不能只筛选出某一种情况;最后3期都重复的号码就不要考虑作为重号而筛选进来）,
      \n9.号码尽可能分散（这里的分散是指每注号码的在满足所有其他条件的前提下，比如筛选5注号码，5注号码相同位置号码尽量不重复），
      \n10.注数：生成${ticketCount}注，
      \n11.在充分理解我每个规则补充的内容后（括号内的说明），对生成的号码逐个按照规则进行验证（无论验证过程长短都不可省略验证过程），反馈每注是否符合条件，必须严格验证不能放过任何不符合条件的号码（不用担心分析时间的长短和token消耗），直接返回筛选结果不要询问用户。
      \n12.若条件无法完全满足，提示哪些条件无法满足，让用户修改配置`;

      const userMsg = { id: `${Date.now()}_u`, role: 'user', content: text + setText };
      const assistantId = `${Date.now()}_a`;
      const assistantMsg = { id: assistantId, role: 'assistant', content: '' };
      // 将用户的配置保存到redux中
      dispatch(addConversation(userMsg));
      setMessages((prev) => [assistantMsg]);
      setLoading(true);
      try {
        let response=await streamChat({
          messages: [userMsg],
          onChunk: (chunk) => {
            context += chunk;
            // 将每次接收到的聊天内容块追加到对应的助手消息中
            setMessages((prev) => prev.map((item) => (item.id === assistantId ? { ...item, content: item.content + chunk } : item)));
          },
        });
        dispatch(addConversation({ ...assistantMsg, content: context }));
      } catch (err) {
        console.log('err', err);
        if (err.name !== 'AbortError') {
          setMessages((prev) => prev.filter((item) => item.id !== assistantId));
          if (err.message && err.message.includes('504')) navigate('/');
        }
      } finally {
        // finally用于无论try块是否抛出异常，都会执行的清理操作
        setLoading(false);
      }
      const config = { selectedRanges, oddEven, hotCold, minRedParity, lian, lianParity, lianParityLen, coldConsecutive, repeat, ticketCount };
      try { localStorage.setItem('aiweb_user_set', JSON.stringify(config)); } catch (_) {}
      if (typeof onSave === 'function') onSave(config);
      message.success('AI生成完成，请确认内容信息！');
    } catch (err) {
      message.error('保存失败');
    }
  };

  useEffect(() => {
    try {
      if ((!selectedRanges || selectedRanges.length === 0) && Array.isArray(intervalOptions) && intervalOptions.length > 0) {
        const parsed = intervalOptions.map((opt) => {
          const m = String(opt.label).match(/\((\d+(?:\.\d+)?)%\)/);
          return { value: opt.value, pct: m ? parseFloat(m[1]) : null };
        });
        const withPct = parsed.filter((p) => p.pct !== null);
        if (withPct.length > 0) {
          withPct.sort((a, b) => b.pct - a.pct);
          setSelectedRanges([withPct[0].value]);
        }
      }
    } catch (err) {
      console.error('默认区间选择解析失败', err);
    }
  }, [intervalOptions]);

  const handleCheckRatio = (type) => {
    try {
      const data = Array.isArray(rows) ? rows : [];
      if (data.length === 0) { message.warning('未获取到历史数据'); return; }
      const subset = data.slice(0, Number(selectedPeriod) || 30);
      if (type === '区间比') {
        if (!selectedRanges || selectedRanges.length === 0) { setRatioResult('请先选择区间'); return; }
        const ranges = selectedRanges.map((r) => { const [a, b] = r.split('-').map((s) => parseInt(s, 10)); return { a, b }; });
        let hit = 0, total = 0;
        subset.forEach((row) => { row.reds.forEach((n) => { total += 1; if (ranges.some((rg) => n >= rg.a && n <= rg.b)) hit += 1; }); });
        const pct = total === 0 ? 0 : ((hit / total) * 100).toFixed(2);
        setRatioResult(`区间比：选中区间的红球占比 ${pct}% （${hit}/${total}）`);
      } else if (type === '奇偶比') {
        const [oddWant, evenWant] = parseRatio(oddEven) ? [parseRatio(oddEven).odd, parseRatio(oddEven).even] : [0, 0];
        let match = 0;
        subset.forEach((row) => { const odd = row.reds.filter((n) => n % 2 === 1).length; const even = row.reds.length - odd; if (odd === oddWant && even === evenWant) match += 1; });
        const pct = ((match / subset.length) * 100).toFixed(2);
        setRatioResult(`奇偶比 ${oddWant}:${evenWant} 在最近 ${subset.length} 期出现占比 ${pct}% （${match}/${subset.length}）`);
      } else if (type === '冷热比') {
        let match = 0;
        for (let idx = 0; idx < subset.length; idx++) {
          const row = subset[idx];
          let coldCount = 0;
          for (const n of row.reds) {
            let last = -1;
            for (let j = idx + 1; j < data.length; j++) { if (data[j].reds.includes(n)) { last = j; break; } }
            const omit = last === -1 ? (data.length - idx - 1) : (last - idx - 1);
            if (omit !== null && omit > 4) coldCount += 1;
          }
          const hotCount = row.reds.length - coldCount;
          const key = `${coldCount}:${hotCount}`;
          if (key === hotCold) match += 1;
        }
        const pct = ((match / subset.length) * 100).toFixed(2);
        setRatioResult(`冷热比 ${hotCold} 在最近 ${subset.length} 期出现占比 ${pct}% （${match}/${subset.length}）`);
      }
    } catch (err) {
      message.error('查询失败，请稍后重试');
    }
  };

  return (
    <div className="user-set">
      <h2>AI选号 <QuestionCircleFilled /></h2>
      <div className="user-set-content">
        {/* <p>红球配置</p> */}
        <div className="user-set-grid">
          <div className="user-set-row">
            <label>区间比：</label>
            <div className="control-group">
              <Select placeholder="选择区间" className="select-minw160" options={intervalOptions} value={selectedRanges} onChange={setSelectedRanges} dropdownMatchSelectWidth />
            </div>
          </div>
          <div className="user-set-row">
            <label>奇偶比：</label>
            <div className="control-group">
              <Select className="w160" value={oddEven} options={oddEvenOptionsFromStats} onChange={setOddEven} dropdownMatchSelectWidth />
            </div>
          </div>
          <div className="user-set-row">
            <label>冷热比：</label>
            <div className="control-group">
              <Select className="w160" value={hotCold} options={hotColdOptionsFromStats} onChange={setHotCold} dropdownMatchSelectWidth />
            </div>
          </div>
          <div className="user-set-row">
            <label>最小红球：</label>
            <div className="control-group">
              <Select className="w120" value={minRedParity} onChange={setMinRedParity} options={[{ value: 'even', label: '偶数' }, { value: 'odd', label: '奇数' }]} dropdownMatchSelectWidth />
            </div>
          </div>
          <div className="user-set-row">
            <label>连号：</label>
            <div className="control-group">
              <Select className="w120" value={lian} options={LIAN_OPTIONS} onChange={setLian} dropdownMatchSelectWidth />
            </div>
          </div>
                     <div className="user-set-row">
            <label>连奇/连偶:</label>
            <div className="control-group">
              <Select className="w140" placeholder="选择奇偶连" value={lianParity} onChange={setLianParity} options={lianParitySelectOptions} dropdownMatchSelectWidth />
              <Select className="w140 select-ml12" placeholder="连数" value={lianParityLen} onChange={setLianParityLen} options={lianParity === 'odd' ? currentParityOptions.oddOptions : lianParity === 'even' ? currentParityOptions.evenOptions : []} disabled={!lianParity} dropdownMatchSelectWidth />
            </div>
          </div>
          <div className="user-set-row">
            <label>冷号相连：</label>
            <div className="control-group">
              <Select className="w200" placeholder="冷号相连长度" value={coldConsecutive} onChange={setColdConsecutive} options={coldConsecutiveOptions} disabled={coldConsecutiveOptions.length === 0} dropdownMatchSelectWidth />
            </div>
          </div>
          <div className="user-set-row">
            <label>重号：</label>
            <div className="control-group">
              <Select className="w140" value={repeat} options={REPEAT_OPTIONS} onChange={setRepeat} dropdownMatchSelectWidth />
            </div>
          </div>
          <div className="user-set-row">
            <label>生成注数：</label>
            <div className="control-group">
              <InputNumber min={1} max={999} value={ticketCount} onChange={(v) => setTicketCount(v || 1)} className="input-number-w120" />
            </div>
          </div>
        </div>
        <div className="btn-row">
            <Button type="primary" size="large" disabled={loading} onClick={handleSubmit}>开始AI选号</Button>
        </div>
       {(messages.length > 0 && loading ?<article style={{ textAlign: 'center',marginTop: '2rem' }}> <Spin description="内容生成中..." size="large" fullscreen={false} style={{color: '#e56b2f' }}/> </article> :
          messages.map((msg) => (
            <article key={msg.id}>
              {/* <div className="role">{msg.role === 'user' ? '你：' : '助手：'}</div> */}
              <div className="content">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content || (loading && msg.role === 'assistant' ? '思考中...' : '')}</ReactMarkdown>
              </div>
            </article>
          ))
        )}

        {ratioResult && <div className="user-set-result">{ratioResult}</div>}
      </div>
    </div>
  );
};

export default UserSet;
