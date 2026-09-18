// 引入axios实例
import service from '../utils/index.js';
// 引入antd的message组件用于提示错误信息
import { message } from 'antd';

// 注册接口（后端路径不带 /api 前缀）
export function register(data) {
  return service.post('/api/register', data);
}

// 登录接口（后端路径不带 /api 前缀）
export function login(data) {
  return service.post('/api/login', data);
}

/**
 * 流式对话接口（纯 JSON 模式）
 * 
 * 约定：
 * 1. 后端以 SSE（text/event-stream）返回数据，每条数据格式为 `data: {JSON}\n\n`
 * 2. 正常内容块格式：`data: "文本内容"` （JSON 字符串） 或 `data: {"content":"文本内容"}`
 * 3. 错误块格式：`data: {"error":true,"message":"错误信息"}`
 * 4. 结束标记：`data: [DONE]\n\n`
 * 5. 前端按 JSON 解析所有 payload，不再处理裸文本
 * 
 * @param {Object} params
 * @param {Array} params.messages - 对话历史
 * @param {Function} params.onChunk - 每次收到有效内容时回调，参数为字符串
 * @param {AbortSignal} params.signal - 用于取消请求
 * @throws {Error} 网络错误、业务错误或解析错误
 */
export async function streamChat({ messages, onChunk, signal }) {
  console.log('发送消息:', messages);
  // 1. 获取 token 并发送请求
  const token = localStorage.getItem('auth_token');
  let response;
  try {
    response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ messages }),
      // signal 用于取消请求
      signal,
    });
  } catch (err) {
    // 网络层失败（断网/超时/连接被拒）
    if (err.name === 'AbortError') {
      throw err; // 用户主动取消，原样抛出
    }
    // message.error('网络异常，请检查您的网络连接');
    throw new Error('网络异常，请检查您的网络连接');
  }

  // 2. 处理 HTTP 状态码错误
  if (!response.ok) {
    const statusMap = {
      400: '请求参数有误',
      403: '您没有权限执行此操作',
      500: '服务器内部错误，请稍后再试',
      503: '服务器维护中，请稍后再试',
      504: '请求超时，请检查网络',
    };

    if (response.status === 401) {
      message.error('未授权，请重新登录');
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      window.location.href = '/';
    } else {
      message.error(statusMap[response.status] || `请求失败，状态码：${response.status}`);
    }
    throw new Error(`请求失败: ${response.status}`);
  }

  // 3. 检查 Content-Type，如果是 JSON 则说明后端返回了错误对象（非流式）
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    const errorData = await response.json();
    // 根据后端约定判断错误字段（示例用 statusCode）
    if (errorData.statusCode && errorData.statusCode !== 200) {
      if (errorData.statusCode === 401) {
        message.error('未授权，请重新登录');
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        window.location.href = '/';
      } else {
        message.error(errorData.message || '请求失败');
      }
      throw new Error(errorData.message || `业务错误码: ${errorData.statusCode}`);
    } else {
      // 意外情况：返回了 JSON 但不是错误，但预期是流
      throw new Error('接口返回 JSON，但本接口期望流式响应');
    }
  }

  // 4. 检查响应体是否可读
  if (!response.body) {
    throw new Error('当前环境不支持流式读取');
  }

  // 5. 初始化流读取器
  // getReader() 方法返回一个 ReadableStreamDefaultReader 对象，用于读取流数据
  const reader = response.body.getReader();
  // TextDecoder 用于将字节流解码为字符串
  const decoder = new TextDecoder('utf-8');
  let buffer = ''; // 缓冲区，用于处理跨 chunk 的不完整行
  // 6. 循环读取流数据
  while (true) {
    // done 表示流是否结束，value 是当前读取的 Uint8Array 数据块(value 是数字数组，表示当前读取的字节数据)
    const { done, value } = await reader.read();
    // 流结束
    if (done) {
      // 处理缓冲区剩余内容（如有）
      if (buffer.trim()) {
        // 理论上正常情况下不应有残留，但为了健壮性，尝试解析
        console.warn('流结束时缓冲区仍有内容:', buffer);
        // 这里可以按需处理，但通常不会发生
      }
      break;
    }

    // 将新收到的字节解码为字符串，追加到缓冲区
    const chunk = decoder.decode(value, { stream: true });
    buffer += chunk;

    // 7. 按换行符分割，提取完整行
    // 注意：SSE 规范使用 \n\n 作为消息分隔符，但这里我们按 \n 分割后逐行处理（将字符拆分成数组）
    const lines = buffer.split('\n');
    // 最后一行可能不完整，保留到下次处理
    buffer = lines.pop() || '';
    console.log(buffer)
    // 8. 逐行处理
    for (const line of lines) {
      // lines 中的每一行可能是空行或非 data: 开头的行，按约定只处理以 data: 开头的行
      const trimmed = line.trim();
      // 只处理以 'data:' 开头的行
      if (!trimmed.startsWith('data:')) {
        // 忽略非 data: 行（如注释或空行）
        continue;
      }

      // 提取 payload 部分（去掉 "data:" 前缀，包括可能的空格）
      const payload = trimmed.replace(/^data:\s?/, '');
      console.log('=== payload 内容 ===', payload);
      // 结束标记 [DONE] 不是 JSON，单独处理
      if (payload === '[DONE]') {
        // 流结束，无需额外操作，但继续处理后续行（理论上不会再有）
        continue;
      }
      // 9. 纯 JSON 解析
      try {
        const json = JSON.parse(payload);

        // 9.1 处理错误对象（后端可能发送带有 error 字段的 JSON）
        if (json && typeof json === 'object' && json.error === true) {
          const errorMsg = json.message || '未知错误';
          // message.error(errorMsg);
          throw new Error(`业务错误: ${errorMsg}`);
        }

        // 9.2 提取文本内容
        let text = '';

        // 情况 A（我个人项目的接口处理）：json 直接是字符串（如 "### 标题"）
        if (typeof json === 'string') {
          text = json;
        }
        // 情况 B(openAI的标准接口处理)：json 是对象，尝试常见的 content / text / delta 字段
        else if (json && typeof json === 'object') {
          text = json.content || json.text || json.delta || '';
        }

        // 如果有有效文本，则回调
        if (text) {
          onChunk(text);
        }
        // 如果 text 为空字符串，可能是正常情况（例如流式过程中某些块无内容），忽略即可
      } catch (parseError) {
        // JSON 解析失败，说明后端返回了非 JSON 格式，不符合约定，直接抛出错误
        throw new Error(`数据格式错误: ${parseError.message}`);
      }
    }
  }
}
// 获取菜单接口
export function getMenu() {
  return service.get('/api/menu');
}
// 获取双色球数据接口
export function getSSQData(params) {
  return service.get('/api/ssq', { params: params });
}
// 获取用户token接口
export function getUserToken() {
  return service.get('/api/token-usage');
}
// 获取用户token余额接口
export function getUserTokenBalance() {
  return service.get('/api/tokenbalance');
}