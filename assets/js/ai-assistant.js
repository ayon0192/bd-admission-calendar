(function () {
  "use strict";

  // Worker URL: deploy the Worker first, then replace only this hostname.
  const ASSISTANT_API_URL = "https://bdac.ayon0192.workers.dev/api/chat";
  const MAX_QUESTION_CHARS = 500;
  const INITIAL_MESSAGE = "ভর্তি ক্যালেন্ডারের তথ্য নিয়ে প্রশ্ন করো। আমি শুধু এই সাইটের তথ্য থেকেই উত্তর দেব।";

  if (document.getElementById("bdacAiAssistant")) return;

  const root = document.createElement("div");
  root.id = "bdacAiAssistant";
  root.className = "bdac-ai";
  root.innerHTML = `
    <button class="bdac-ai__launcher" type="button" aria-label="এআই সহকারী খোলো" aria-expanded="false" aria-controls="bdacAiPanel">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5H7l-3.5 2v-5.5A7.5 7.5 0 1 1 20 11.5Z"/><path d="M8 10h8M8 14h5"/></svg>
      <span>এআই</span>
    </button>
    <section class="bdac-ai__panel" id="bdacAiPanel" role="dialog" aria-label="ভর্তি সহায়িকা এআই" aria-modal="false" hidden>
      <header class="bdac-ai__header">
        <div><strong>ভর্তি সহায়িকা এআই</strong><small>শুধু সাইটের তথ্য থেকে উত্তর</small></div>
        <button class="bdac-ai__close" type="button" aria-label="চ্যাট বন্ধ করো">×</button>
      </header>
      <div class="bdac-ai__messages" role="log" aria-live="polite" aria-relevant="additions text"></div>
      <form class="bdac-ai__form">
        <label class="bdac-ai__sr-only" for="bdacAiQuestion">তোমার প্রশ্ন</label>
        <textarea id="bdacAiQuestion" maxlength="500" rows="2" placeholder="তোমার প্রশ্ন লিখো…" required></textarea>
        <div class="bdac-ai__footer">
          <small>সর্বোচ্চ ৫০০ অক্ষর</small>
          <button class="bdac-ai__send" type="submit">পাঠাও</button>
        </div>
      </form>
    </section>`;
  document.body.appendChild(root);

  const launcher = root.querySelector(".bdac-ai__launcher");
  const panel = root.querySelector(".bdac-ai__panel");
  const closeButton = root.querySelector(".bdac-ai__close");
  const messages = root.querySelector(".bdac-ai__messages");
  const form = root.querySelector(".bdac-ai__form");
  const input = root.querySelector("#bdacAiQuestion");
  const sendButton = root.querySelector(".bdac-ai__send");
  let pending = false;
  const conversationHistory = [];

  function addMessage(text, role) {
    const item = document.createElement("div");
    item.className = `bdac-ai__message bdac-ai__message--${role}`;
    const value = String(text);
    const urlPattern = /https:\/\/[^\s|]+/g;
    let cursor = 0;
    for (const match of value.matchAll(urlPattern)) {
      const rawUrl = match[0];
      const cleanUrl = rawUrl.replace(/[),.;।]+$/u, "");
      const start = match.index;
      item.appendChild(document.createTextNode(value.slice(cursor, start)));
      try {
        const parsed = new URL(cleanUrl);
        if (parsed.protocol !== "https:") throw new Error("unsupported link protocol");
        const link = document.createElement("a");
        link.href = parsed.href;
        link.textContent = cleanUrl;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        item.appendChild(link);
        item.appendChild(document.createTextNode(rawUrl.slice(cleanUrl.length)));
      } catch (_) {
        item.appendChild(document.createTextNode(rawUrl));
      }
      cursor = start + rawUrl.length;
    }
    item.appendChild(document.createTextNode(value.slice(cursor)));
    messages.appendChild(item);
    messages.scrollTop = messages.scrollHeight;
    return item;
  }

  function openPanel() {
    panel.hidden = false;
    launcher.setAttribute("aria-expanded", "true");
    launcher.setAttribute("aria-label", "এআই সহকারী বন্ধ করো");
    input.focus();
  }

  function closePanel() {
    panel.hidden = true;
    launcher.setAttribute("aria-expanded", "false");
    launcher.setAttribute("aria-label", "এআই সহকারী খোলো");
    launcher.focus();
  }

  launcher.addEventListener("click", () => panel.hidden ? openPanel() : closePanel());
  closeButton.addEventListener("click", closePanel);
  addMessage(INITIAL_MESSAGE, "assistant");

  function currentPage() {
    const hash = (window.location.hash || "#today").replace(/^#/, "");
    const pages = { today: "dashboard", dashboard: "dashboard", calendar: "calendar", universities: "universities", info: "info", notices: "notices", me: "profile", profile: "profile" };
    return pages[hash] || "dashboard";
  }

  async function submitQuestion(event) {
    event.preventDefault();
    if (pending) return;
    const question = input.value.trim();
    if (!question) return;
    if (question.length > MAX_QUESTION_CHARS) {
      addMessage("প্রশ্নটি ৫০০ অক্ষরের মধ্যে ছোট করে লিখো।", "assistant");
      return;
    }
    if (ASSISTANT_API_URL.includes("YOUR-WORKER-HOST")) {
      addMessage("এআই সহকারী চালু করতে Worker-এর ঠিকানা সেট করা বাকি আছে।", "assistant");
      return;
    }

    addMessage(question, "user");
    input.value = "";
    pending = true;
    sendButton.disabled = true;
    input.disabled = true;
    const waiting = addMessage("সাইটের তথ্য মিলিয়ে দেখছি…", "assistant bdac-ai__message--waiting");
    const page = currentPage();
    const history = conversationHistory.slice(-8);
    try {
      const response = await fetch(ASSISTANT_API_URL, {
        method: "POST",
        mode: "cors",
        credentials: "omit",
        cache: "no-store",
        redirect: "error",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, page, history })
      });
      let payload = null;
      try { payload = await response.json(); } catch (_) { /* handled below */ }
      waiting.remove();
      if (payload && typeof payload.answer === "string") {
        addMessage(payload.answer, "assistant");
        conversationHistory.push({ role: "user", content: question }, { role: "assistant", content: payload.answer });
        if (conversationHistory.length > 8) conversationHistory.splice(0, conversationHistory.length - 8);
      } else if (payload && typeof payload.message === "string") {
        addMessage(payload.message, "assistant");
      } else if (response.status === 429) {
        addMessage("আজকের এআই সীমা শেষ, কাল আবার চেষ্টা করুন।", "assistant");
      } else {
        addMessage("এখন উত্তর দেওয়া যাচ্ছে না। একটু পরে আবার চেষ্টা করুন।", "assistant");
      }
    } catch (_) {
      waiting.remove();
      addMessage("এআই সেবার সঙ্গে সংযোগ হচ্ছে না। ইন্টারনেট সংযোগ দেখে পরে আবার চেষ্টা করুন।", "assistant");
    } finally {
      pending = false;
      sendButton.disabled = false;
      input.disabled = false;
      input.focus();
    }
  }

  form.addEventListener("submit", submitQuestion);
  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      form.requestSubmit();
    }
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !panel.hidden) closePanel();
  });
})();
