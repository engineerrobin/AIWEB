// 引入configureStore函数，用于创建redux中最核心的store对象
import { configureStore } from '@reduxjs/toolkit';
// 引入count的reducer
import conversationReducer from './modules/conversation';
// 创建并导出store对象
const store = configureStore({
  reducer: {
    conversations: conversationReducer
  }
});
export default store;