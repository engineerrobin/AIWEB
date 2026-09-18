// 引入createSlice函数,用于创建slice对象
import { createSlice } from "@reduxjs/toolkit";
// 创建一个slice对象,并设置name、initialState、reducers等属性,slice对象会自动生成action和reducer
const conversationSlice = createSlice({
    // slice名称
  name: "conversation",
    // 保存会话数据
  initialState: [],
        // reducers对象，定义修改state的方法
    reducers: {
        addConversation(state, action) {
            state.push(action.payload);
        },
        clearConversation(state) {
            return [];
        }
    },
});
// 导出action和reducer,action用于分发，reducer用于修改状态
export const { addConversation, clearConversation } = conversationSlice.actions;
// 默认导出reducer,供store使用
export default conversationSlice.reducer;