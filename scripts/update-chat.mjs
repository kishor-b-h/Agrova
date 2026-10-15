import { readFileSync, writeFileSync } from 'node:fs';
let main = readFileSync('src/main.js', 'utf8');
main = main.replace("import './style.css';", "import './style.css';\nimport './classic-chat.css';\nimport { renderClassicChat, escapeHtml } from './chat-view.js';");
main = main.replace('  chatMessages: [],', "  chatMessages: [],\n  chatPending: false,\n  chatDraft: '',");
main = main.replace(/function renderChatbot\(\) \{[\s\S]*?(?=\/\/ -- Weather Page --)/, `function renderChatbot() {\n  return renderAppLayout(renderClassicChat(state, t));\n}\n\n`);
const start = main.indexOf('  // Chat functionality');
const end = main.indexOf('  // Home Embedded Chat Panel', start);
main = main.slice(0, start) + `  // Classic chat: keep the pending state across renders and prevent duplicate sends.
  const chatInput = document.getElementById('chatInput');
  const scrollChat = () => {
    const messages = document.getElementById('chatMessages');
    if (messages) messages.scrollTop = messages.scrollHeight;
  };

  async function sendChat(text) {
    if (!text?.trim() || state.chatPending) return;
    const question = text.trim();
    state.chatMessages.push({ type: 'user', text: question, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) });
    state.chatDraft = '';
    state.chatPending = true;
    render();
    scrollChat();
    try {
      const response = await askGemini(question);
      state.chatMessages.push({
        type: 'bot',
        text: escapeHtml(response).replace(/\\n/g, '<br>').replace(/\\*\\*(.*?)\\*\\*/g, '<strong>$1</strong>'),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
    } finally {
      state.chatPending = false;
      if (state.currentPage === 'chatbot') {
        render();
        scrollChat();
        document.getElementById('chatInput')?.focus();
      }
    }
  }

  document.getElementById('chatForm')?.addEventListener('submit', (event) => {
    event.preventDefault();
    sendChat(chatInput?.value);
  });
  chatInput?.addEventListener('input', () => { state.chatDraft = chatInput.value; });
  chatInput?.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
      event.preventDefault();
      sendChat(chatInput.value);
    }
  });
  document.getElementById('chatNew')?.addEventListener('click', () => {
    if (state.chatPending) return;
    state.chatMessages = [];
    state.chatDraft = '';
    render();
    document.getElementById('chatInput')?.focus();
  });

` + main.slice(end);
writeFileSync('src/main.js', main);
