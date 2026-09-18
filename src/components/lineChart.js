
// 引入echarts主模块
import * as echarts from 'echarts';
import { useEffect, useRef } from 'react';

const LineChart = ({
    xTitle = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    data = [120, 200, 150, 80, 70, 110, 130],
}) => {
    const chartRef = useRef(null);

    useEffect(() => {
        // 初始化echarts实例
        const chartInstance = echarts.init(chartRef.current);
        // 处理窗口大小变化，自动调整图表尺寸
        const handleResize = () => {
            chartInstance.resize();
        };
        // 监听窗口大小变化，调整图表尺寸
        window.addEventListener('resize', handleResize);
        const option = {
            animation: true,
            animationDuration: 800,
            animationEasing: 'cubicOut',
            animationDurationUpdate: 800,
            xAxis: {
                type: 'category',
                data: xTitle,
            },
            yAxis: {
                type: 'value',
            },
            series: [
                {
                    data: data,
                    smooth: true,
                    type: 'line',
                    label: {
                        show: true,
                        position: 'top',
                    },
                    // itemStyle: {
                    //     color: function (params) {
                    //         // 高亮最高值（第一个出现的最大值）
                    //         const max = Math.max.apply(null, seriesData || []);
                    //         return params.value === max ? '#ff7f50' : '#5470c6';
                    //     },
                    // },
                },
            ],
        };

        option && chartInstance.setOption(option);
        // 销毁echarts实例，释放资源
        return () => {
            // 移除窗口大小变化监听，释放资源
            window.removeEventListener('resize', handleResize);
            // 销毁echarts实例，释放资源
            chartInstance.dispose();
        };
    }, [xTitle, data]);

    return (
        <div>
            <div className="chart" ref={chartRef} style={{ width: '100%', height: '400px' }}>tokens用量</div>
        </div>
    );
};
export default LineChart;