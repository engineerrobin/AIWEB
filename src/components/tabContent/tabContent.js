import './tabContent.less';
// 引入echarts主模块
import * as echarts from 'echarts';
import { useEffect, useRef } from 'react';

const Tabcontent = ({
    xTitle = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    data = [120, 200, 150, 80, 70, 110, 130],
    intervalStats,
    oddEvenStats,
    hotColdStats,
    type = 'interval',
}) => {
    const chartRef = useRef(null);

    useEffect(() => {
        // 初始化echarts实例
        const chartInstance = echarts.init(chartRef.current);

        // 根据 type 选择数据来源
        let xData = xTitle;
        let seriesData = data;
        if (type === 'interval' && intervalStats) {
            xData = intervalStats.intervals;
            seriesData = intervalStats.freqs;
        } else if (type === 'oddEven' && oddEvenStats) {
            xData = oddEvenStats.intervals;
            seriesData = oddEvenStats.freqs;
        } else if (type === 'hotCold' && hotColdStats) {
            xData = hotColdStats.intervals;
            seriesData = hotColdStats.freqs;
        }

        const option = {
            animation: true,
            animationDuration: 800,
            animationEasing: 'cubicOut',
            animationDurationUpdate: 800,
            xAxis: {
                type: 'category',
                data: xData,
            },
            yAxis: {
                type: 'value',
            },
            series: [
                {
                    data: seriesData,
                    type: 'bar',
                    label: {
                        show: true,
                        position: 'top',
                    },
                    itemStyle: {
                        color: function (params) {
                            // 高亮最高值（第一个出现的最大值）
                            const max = Math.max.apply(null, seriesData || []);
                            return params.value === max ? '#ff7f50' : '#5470c6';
                        },
                    },
                },
            ],
        };

        option && chartInstance.setOption(option);
        // 在布局完成后触发一次 resize,resiz
        chartInstance.resize();
        const t = setTimeout(() => chartInstance.resize(), 120);
        const onResize = () => chartInstance.resize();
        window.addEventListener('resize', onResize);

        // 观察元素可见性（用于 tab 从不可见切换到可见时触发 resize）
        let io;
        if (window.IntersectionObserver && chartRef.current) {
            io = new IntersectionObserver((entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        // 当可见时，确保重绘并使用正常更新以保留动画效果
                        chartInstance.resize();
                        chartInstance.setOption(option);
                    }
                });
            });
            io.observe(chartRef.current);
        }

        return () => {
            clearTimeout(t);
            window.removeEventListener('resize', onResize);
            if (io && chartRef.current) io.unobserve(chartRef.current);
            // 销毁echarts实例，释放资源
            chartInstance.dispose();
        };
    }, [xTitle, data, intervalStats, oddEvenStats, hotColdStats, type]);

    return (
        <div>
            <div className="chart" ref={chartRef}>双色球统计图</div>
        </div>
    );
};
export default Tabcontent;