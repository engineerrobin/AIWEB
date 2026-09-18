import { useRef, useState ,useEffect} from 'react';
import { streamChat } from '../../apis/index.js';
import './conversation.less';
// 引入react-markdown，
import ReactMarkdown from 'react-markdown';

// 引入remark-gfm插件，用于支持GitHub风格的Markdown语法，如表格、任务列表等
import remarkGfm from 'remark-gfm';
// antd组件引入
import { Button,message } from 'antd';
import UserMenu from '../../components/UserMenu';
// 引入icon组件
import Icon from '../../components/iconSvg/icon.js';
// 引入路由器实例，用于在401错误时跳转到登录页
import { useNavigate } from 'react-router-dom';
// 引入useSelector
import { useSelector } from 'react-redux';
function Conversation() {
  // 获取redux的state
  const conversations = useSelector((state) => state.conversations);

  const navigate = useNavigate();
// 保存输入框的内容、消息列表、加载状态和错误信息
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  // 使用useRef创建一个ref对象(ref可以理解为一个可变的容器，这个容器用于保存AbortController实例，以便在需要时取消请求)
  const abortRef = useRef(null);
  const logRef = useRef(null);
  useEffect(() => {
    //  document.addEventListener('keydown', keyDownEnter);
    // 每次 messages 更新，滚动到底部
    if (logRef.current) {
      // scrollTop 属性设置或返回一个元素的内容垂直滚动的像素数。scrollHeight 属性返回一个元素的内容高度，包括溢出部分。通过将 scrollTop 设置为 scrollHeight，可以实现滚动到底部的效果。
      logRef.current.scrollTop = logRef.current.scrollHeight;
    };
    // 将conversations中的消息添加到消息列表中
    setMessages(conversations);

  },[conversations]);
  useEffect(() => {
    // 在组件挂载时，添加全局键盘事件监听器，监听回车键按下事件
    window.addEventListener('keydown', keyDownEnter);
    return () => {
      window.removeEventListener('keydown', keyDownEnter);
    };
  });
  // 回车键发送消息
  const keyDownEnter = (event) => {
    // 按下Enter键时，调用handleSend函数发送消息
    if (event.key === 'Enter') {
      handleSend(event);
    }
  };
  const handleSend = async (event) => {
    // 阻止表单默认提交行为
    event.preventDefault();
    // 获取输入框的内容，并去除首尾空格
    const content = input.trim();
    console.log(content);
    // 如果输入为空或正在加载中，则不发送消息
    if (!content) {
      message.error('输入不能为空');
      return;
    }
    if (loading) {
      message.error('正在发送中，请稍等');
      return;
    }
    // 创建用户消息
    const userMsg = {
      id: `${Date.now()}_u`,
      role: 'user',
      content,
    };
    // 创建助手消息，初始内容为空
    const assistantId = `${Date.now()}_a`;
    const assistantMsg = {
      id: assistantId,
      role: 'assistant',
      content: '',
    };
    // 将用户消息和助手消息添加到消息列表中，并清空输入框和错误信息，同时设置加载状态为true
    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setInput('');
    setError('');
    setLoading(true);
    // AbortController 用于在需要时取消请求(AbortController 是一个浏览器提供的 API，用于在需要时取消 fetch 请求。)
    const controller = new AbortController();
    // 将当前的 AbortController 实例存储在 ref 中，以便在需要时可以调用 abort 方法取消请求
    abortRef.current = controller;
    // 调用 streamChat 函数发送消息，并处理流式返回的数据
    try {
      await streamChat({
        // 多轮对话时，需要将之前的消息也传给后端，以便后端能够理解上下文。在这里，我们将当前的用户消息和之前的所有消息一起发送给后端。
        messages: [...messages, userMsg],
        // signal是AbortSignal对象，用于在需要时中止fetch请求。在这里，它用于在用户取消请求时中止fetch请求。
        signal: controller.signal,
        // onChunk是一个回调函数，用于处理流式返回的数据块（它就相当于一个桥梁，连接接口流式数据和前端显示）。在这里，它将数据块追加到助手消息的content中，并更新消息列表。
        onChunk: (chunk) => {
          // setMessages必须使用函数式更新(prev)来确保在异步操作中获取到最新的状态值，避免闭包问题。
          setMessages((prev) =>
            prev.map((item) => {
              // 如果当前消息不是助手消息，则直接返回原消息
              if (item.id !== assistantId) {
                return item;
              }
              return {
                ...item,
                content: item.content + chunk,
              };
            })
          );
        },
      });
    } catch (err) {
      // 用户主动停止（AbortError）时保留已生成的部分内容；其他失败则移除空的助手消息
      console.log('err', err);
      if (err.name !== 'AbortError') {
        setMessages((prev) => prev.filter((item) => item.id !== assistantId));
        // 如果是网络超时重新登录
        if (err.message.includes('504')) {
          navigate('/');
        }
      }
    } finally {
      setLoading(false);
      // 清空 ref 中的 AbortController 实例，以便下次发送消息时创建新的实例
      abortRef.current = null;
    }
  };
// handleStop 函数用于在用户点击停止按钮时取消请求。它会调用 ref 中的 AbortController 实例的 abort 方法，并将 ref 置为 null，同时将加载状态设置为 false。
  const handleStop = () => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
      setLoading(false);
    }
  };

  return (
    <main className="chat-page">
      <section className="chat-card">
        <header className="chat-header">
          <div className="header-left">
            <h1>AI对话</h1>
            <h3>可以向AI提出你感兴趣的XX问题</h3>
          </div>
        </header>

        <section className="chat-log" ref={logRef}>
          {messages.length === 0 ? (
            <p className="placeholder">开始输入问题，助手会实时输出内容。</p>
          ) : (
            messages.map((msg) => (
              <article key={msg.id} className={`chat-item ${msg.role}`}>
                <div className="role">{msg.role === 'user' ? '你：' : '助手：'}</div>
                <div className="content">
                  <ReactMarkdown  remarkPlugins={[remarkGfm]}>{msg.content || (loading && msg.role === 'assistant' ? '思考中...' : '')}</ReactMarkdown>
                </div>
              </article>
            ))
          )}
        </section>

        {error ? <p className="chat-error">{error}</p> : null}

        <form className="chat-input" onSubmit={handleSend}>
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="输入你的问题..."
            rows={4}
          />
          <div className="actions">
            <Button type="primary" htmlType="submit" size='large' disabled={loading}>
              {loading ? '发送中...' : '发送'}
            </Button>
            <Button type="primary" onClick={handleStop} size='large' disabled={!loading}>
              停止
            </Button>
          </div>
        </form>
      </section>
    </main>
  );
}

export default Conversation;