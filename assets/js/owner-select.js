(function () {
  "use strict";

  const ASSISTANT_API_URL = "https://bdac.ayon0192.workers.dev/api/chat";
  const ACTIVATION_TAPS = 7;
  const ACTIVATION_WINDOW_MS = 2500;
  const HIGHLIGHT_CLASS = "bdac-owner-select-highlight";
  const PRIVATE_TEXT_SELECTOR = "input, textarea, select, option, [contenteditable], [data-private], [data-owner-select-ignore], .note, .notes, .user-note, script, style, noscript";
  const TAG_EXPLANATIONS = {
    a: "এটি একটি লিংক। সাধারণত অন্য পৃষ্ঠা, ঠিকানা বা কোনো নির্দিষ্ট অংশে নিয়ে যায়।",
    button: "এটি একটি বোতাম। সাধারণত ক্লিক বা ট্যাপ করলে কোনো কাজ চালায়।",
    input: "এটি তথ্য লেখার ইনপুট ঘর। এর ভেতরের লেখা এই টুল সংগ্রহ করে না।",
    textarea: "এটি একাধিক লাইনের লেখা দেওয়ার ঘর। এর ভেতরের লেখা এই টুল সংগ্রহ করে না।",
    select: "এটি তালিকা থেকে একটি বিকল্প বেছে নেওয়ার নিয়ন্ত্রণ।",
    img: "এটি একটি ছবি দেখায়।",
    svg: "এটি ভেক্টর গ্রাফিক বা আইকনের অংশ।",
    nav: "এটি নেভিগেশন অংশ; সাধারণত পৃষ্ঠার বিভিন্ন স্থানে যাওয়ার লিংক থাকে।",
    header: "এটি কোনো পৃষ্ঠা বা অংশের শিরোনাম/উপরের অংশ।",
    footer: "এটি পৃষ্ঠা বা অংশের নিচের তথ্য দেখায়।",
    section: "এটি পৃষ্ঠার একটি স্বতন্ত্র কনটেন্ট সেকশন।",
    article: "এটি স্বতন্ত্র কনটেন্ট বা তথ্যের একটি অংশ।",
    form: "এটি এক বা একাধিক ইনপুট নিয়ে তথ্য জমা দেওয়ার ফর্ম।",
    div: "এটি সাধারণ কনটেইনার; এর ভেতরের উপাদানগুলো একসঙ্গে সাজাতে ব্যবহৃত হয়।",
    span: "এটি লেখা বা ছোট ইনলাইন উপাদানের একটি কনটেইনার।"
  };

  if (document.getElementById("bdacOwnerSelect")) return;

  const root = document.createElement("div");
  root.id = "bdacOwnerSelect";
  root.dataset.ownerSelectUi = "true";
  root.hidden = true;
  root.innerHTML = `
    <section class="bdac-owner-select__toolbar" data-owner-select-ui role="toolbar" aria-label="মালিকের নির্বাচন টুল">
      <div class="bdac-owner-select__heading">
        <strong>নির্বাচন মোড</strong>
        <small>পৃষ্ঠার কোনো উপাদানে ট্যাপ করো</small>
      </div>
      <div class="bdac-owner-select__actions">
        <button type="button" data-action="outer">বাইরের স্তরে যাও</button>
        <button type="button" data-action="inner">ভেতরের স্তরে যাও</button>
        <button type="button" data-action="explain">এটা কী?</button>
        <button type="button" data-action="ai">AI দিয়ে ব্যাখ্যা</button>
        <button type="button" data-action="change">বদলাতে চাই</button>
        <button type="button" data-action="close" class="bdac-owner-select__close">বন্ধ</button>
      </div>
      <p class="bdac-owner-select__status" data-role="status" aria-live="polite">এখনো কোনো উপাদান নির্বাচন করা হয়নি।</p>
      <div class="bdac-owner-select__output" data-role="output" hidden></div>
      <section class="bdac-owner-select__prompt" data-role="prompt" hidden>
        <label for="bdacOwnerIntent">কী পরিবর্তন করতে চাও?</label>
        <textarea id="bdacOwnerIntent" data-role="intent" rows="3" placeholder="বাংলায় পরিবর্তনের কথা লিখো…"></textarea>
        <div class="bdac-owner-select__prompt-actions">
          <button type="button" data-action="make-prompt">ChatGPT নির্দেশ তৈরি</button>
          <button type="button" data-action="copy" disabled>কপি</button>
        </div>
        <textarea data-role="prompt-output" rows="8" readonly aria-label="তৈরি করা ChatGPT নির্দেশ" hidden></textarea>
      </section>
    </section>`;
  document.body.appendChild(root);

  const toolbar = root.querySelector(".bdac-owner-select__toolbar");
  const status = root.querySelector('[data-role="status"]');
  const output = root.querySelector('[data-role="output"]');
  const promptPanel = root.querySelector('[data-role="prompt"]');
  const intentInput = root.querySelector('[data-role="intent"]');
  const promptOutput = root.querySelector('[data-role="prompt-output"]');
  const copyButton = root.querySelector('[data-action="copy"]');
  const outerButton = root.querySelector('[data-action="outer"]');
  const innerButton = root.querySelector('[data-action="inner"]');
  const logo = document.querySelector("[data-owner-select-trigger]");

  let enabled = false;
  let activationCount = 0;
  let activationStartedAt = 0;
  let selectedElement = null;
  let selectedInfo = null;
  let aiPending = false;

  function isOwnerUiTarget(element) {
    return Boolean(element && (element === root || (typeof element.closest === "function" && element.closest("[data-owner-select-ui]"))));
  }

  function escapeCss(value) {
    const string = String(value);
    if (window.CSS && typeof window.CSS.escape === "function") return window.CSS.escape(string);
    return string.replace(/([^a-zA-Z0-9_-])/g, "\\$1");
  }

  function selectorPath(element) {
    const parts = [];
    let current = element;
    while (current && current.nodeType === 1 && current !== document) {
      const tag = current.tagName.toLowerCase();
      let part = tag;
      if (current.id) part += "#" + escapeCss(current.id);
      const classes = Array.from(current.classList || []).filter((name) => name !== HIGHLIGHT_CLASS);
      if (classes.length) part += "." + classes.map(escapeCss).join(".");
      const parent = current.parentElement;
      if (parent) {
        const siblings = Array.from(parent.children).filter((node) => node.tagName === current.tagName);
        if (siblings.length > 1) part += ":nth-of-type(" + (siblings.indexOf(current) + 1) + ")";
      }
      parts.unshift(part);
      current = parent;
    }
    return parts.join(" > ");
  }

  function visibleTextWithoutPrivateFields(element) {
    if (element.matches(PRIVATE_TEXT_SELECTOR)) return "";
    const clone = element.cloneNode(true);
    if (clone.querySelectorAll) {
      clone.querySelectorAll(PRIVATE_TEXT_SELECTOR + ', [data-owner-select-ui]').forEach((node) => node.remove());
    }
    return String(clone.innerText || clone.textContent || "").replace(/\\s+/g, " ").trim().slice(0, 320);
  }

  function sourceHint(element) {
    const marked = element.closest("[data-source]");
    if (marked) return marked.getAttribute("data-source") || "";
    if (element.closest("#bdacAiAssistant")) return "assets/js/ai-assistant.js; assets/css/ai-assistant.css";
    if (element.closest(".brand, .sidebar, .topbar, .mobile-nav")) return "index.html; assets/css/main-shell.css";
    if (element.closest(".page, .app-shell, #mainContent")) return "assets/js/main-shell.js; assets/css/main-shell.css";
    return "assets/js/main-shell.js; assets/css/main-shell.css";
  }

  function collectElementInfo(element) {
    const rect = element.getBoundingClientRect();
    const computed = window.getComputedStyle(element);
    return {
      tag: element.tagName.toLowerCase(),
      id: element.id || "",
      classes: Array.from(element.classList || []).filter((name) => name !== HIGHLIGHT_CLASS),
      selector: selectorPath(element),
      text: visibleTextWithoutPrivateFields(element),
      dimensions: {
        width: Math.round(rect.width * 100) / 100,
        height: Math.round(rect.height * 100) / 100
      },
      styles: {
        color: computed.color,
        background: computed.backgroundColor,
        fontSize: computed.fontSize,
        padding: computed.padding,
        margin: computed.margin,
        border: computed.border,
        borderRadius: computed.borderRadius
      },
      source: sourceHint(element)
    };
  }

  function setOutput(message) {
    output.hidden = false;
    output.textContent = String(message);
  }

  function clearSelection() {
    if (selectedElement) selectedElement.classList.remove(HIGHLIGHT_CLASS);
    selectedElement = null;
    selectedInfo = null;
    outerButton.disabled = true;
    innerButton.disabled = true;
    status.textContent = "এখনো কোনো উপাদান নির্বাচন করা হয়নি।";
  }

  function selectElement(element) {
    if (!element || element.nodeType !== 1 || element === document.body || element === document.documentElement || isOwnerUiTarget(element)) return;
    if (selectedElement) selectedElement.classList.remove(HIGHLIGHT_CLASS);
    selectedElement = element;
    selectedElement.classList.add(HIGHLIGHT_CLASS);
    selectedInfo = collectElementInfo(element);
    status.textContent = "<" + selectedInfo.tag + "> " + (selectedInfo.id ? "#" + selectedInfo.id : selectedInfo.classes.slice(0, 2).join(" ")) + " · " + selectedInfo.dimensions.width + " × " + selectedInfo.dimensions.height;
    outerButton.disabled = !element.parentElement || element.parentElement === document.body || element.parentElement === document.documentElement;
    innerButton.disabled = !Array.from(element.children).some((child) => !isOwnerUiTarget(child));
    output.hidden = true;
    promptPanel.hidden = true;
  }

  function normaliseTarget(target) {
    if (!(target instanceof Element)) return null;
    const control = target.closest("button, a");
    return control || target;
  }

  function captureSelectionClick(event) {
    if (!enabled || isOwnerUiTarget(event.target)) return;
    const target = normaliseTarget(event.target);
    if (!target || isOwnerUiTarget(target)) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    selectElement(target);
  }

  function captureSelectionSubmit(event) {
    if (!enabled || isOwnerUiTarget(event.target)) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    selectElement(event.target);
  }

  function explainLocally(info) {
    const description = TAG_EXPLANATIONS[info.tag] || "এটি একটি HTML " + info.tag + " উপাদান। এর ভূমিকা নির্ধারণে selector, text ও আশপাশের উপাদানও দেখতে হয়।";
    const lines = [
      description,
      "Tag: <" + info.tag + ">",
      info.id ? "ID: " + info.id : "",
      info.classes.length ? "Class: " + info.classes.join(" ") : "",
      info.text ? "দেখানো লেখা: " + info.text : "দেখানো লেখা: নেই বা ব্যক্তিগত ফর্ম/নোটের তথ্য বাদ দেওয়া হয়েছে।",
      "আকার: " + info.dimensions.width + " × " + info.dimensions.height + " px",
      "Selector: " + info.selector,
      "সম্ভাব্য কোড: " + info.source
    ].filter(Boolean);
    return lines.join("\\n");
  }

  function probableFiles(info) {
    const files = String(info.source || "").split(";").map((value) => value.trim()).filter(Boolean);
    if (selectedElement && selectedElement.closest("#bdacAiAssistant")) {
      files.push("assets/js/ai-assistant.js", "assets/css/ai-assistant.css");
    } else if (selectedElement && selectedElement.closest(".brand, .sidebar, .topbar, .mobile-nav")) {
      files.push("index.html", "assets/css/main-shell.css");
    } else {
      files.push("assets/js/main-shell.js", "assets/css/main-shell.css");
    }
    return Array.from(new Set(files));
  }

  function buildChatGptPrompt(info, intent) {
    const files = probableFiles(info);
    return [
      "BDAC UI পরিবর্তনের কাজের নির্দেশ",
      "",
      "Repository: ayon0192/bd-admission-calendar",
      "Base branch: main",
      "কাজের আগে main-এর সর্বশেষ অবস্থা নাও এবং নতুন আলাদা feature branch তৈরি করো।",
      "",
      "নির্বাচিত উপাদান",
      "Tag: " + info.tag,
      "ID: " + (info.id || "(নেই)"),
      "Class: " + (info.classes.join(" ") || "(নেই)"),
      "পূর্ণ CSS selector path: " + info.selector,
      "দৃশ্যমান লেখা: " + (info.text || "(নেই; private field ও notes বাদ)"),
      "Dimensions: " + JSON.stringify(info.dimensions),
      "Current computed styles: " + JSON.stringify(info.styles),
      "data-source: " + (info.source || "(চিহ্ন নেই)"),
      "সম্ভাব্য ফাইল: " + files.join(", "),
      "",
      "মালিকের ইচ্ছা",
      intent.trim(),
      "",
      "অপরিবর্তনীয় নিয়ম",
      "- data/admission-records.json বা কোনো ভর্তি-সংক্রান্ত ডেটা, তারিখ, উৎস, যাচাই-অবস্থা বা রেকর্ড বদলাবে না।",
      "- শুধু প্রয়োজনীয় UI/code পরিবর্তন করবে; অপ্রয়োজনীয় redesign বা refactor নয়।",
      "- main-এ সরাসরি commit করবে না; আলাদা branch-এ কাজ করবে।",
      "- কাজ শেষে Pull Request তৈরি করবে; মালিকের অনুমতি ছাড়া merge বা production deploy করবে না।",
      "- node --test, node scripts/validate-admission-data.cjs এবং node scripts/build.cjs চালিয়ে ফলাফল যাচাই করবে।",
      "- diff পরীক্ষা করবে এবং কোনো test/build ব্যর্থ হলে সেটি ঠিক না করে সফল বলবে না।",
      "",
      "উপাদানের তথ্যটি কেবল নির্বাচনের সময়কার পর্যবেক্ষণ; DOM বদলে থাকতে পারে, তাই বর্তমান কোড যাচাই করে তারপর পরিবর্তন করবে।"
    ].join("\\n");
  }

  function goOuter() {
    if (!selectedElement || !selectedElement.parentElement) return;
    selectElement(selectedElement.parentElement);
  }

  function goInner() {
    if (!selectedElement) return;
    const child = Array.from(selectedElement.children).find((node) => !isOwnerUiTarget(node));
    if (child) selectElement(child);
  }

  function enable() {
    if (enabled) return;
    enabled = true;
    root.hidden = false;
    document.body.classList.add("bdac-owner-select-active");
    clearSelection();
    setOutput("নির্বাচন মোড চালু। এখন কোনো বোতাম বা লিংকে ট্যাপ করলে সেটি কাজ না করে শুধু নির্বাচিত হবে।");
  }

  function disable() {
    enabled = false;
    document.body.classList.remove("bdac-owner-select-active");
    clearSelection();
    root.hidden = true;
    promptPanel.hidden = true;
    output.hidden = true;
    promptOutput.hidden = true;
    promptOutput.value = "";
    intentInput.value = "";
    copyButton.disabled = true;
  }

  function handleLogoActivation() {
    const now = Date.now();
    if (now - activationStartedAt > ACTIVATION_WINDOW_MS) activationCount = 0;
    if (!activationCount) activationStartedAt = now;
    activationCount++;
    if (activationCount >= ACTIVATION_TAPS) {
      activationCount = 0;
      enable();
    }
  }

  async function explainWithAI() {
    if (!selectedElement || !selectedInfo || aiPending) return;
    aiPending = true;
    setOutput("Cloudflare AI দিয়ে উপাদানটির ব্যাখ্যা তৈরি হচ্ছে…");
    const controller = new AbortController();
    const timeoutTimer = window.setTimeout(() => controller.abort(), 30000);
    try {
      const response = await fetch(ASSISTANT_API_URL, {
        method: "POST",
        mode: "cors",
        credentials: "omit",
        cache: "no-store",
        redirect: "error",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "owner-explain",
          question: "এই নির্বাচিত উপাদানটি কী কাজ করে?",
          element: selectedInfo
        }),
        signal: controller.signal
      });
      let payload = null;
      try { payload = await response.json(); } catch (_) {}
      if (payload && typeof payload.answer === "string") setOutput(payload.answer);
      else if (payload && typeof payload.message === "string") setOutput(payload.message);
      else setOutput("এআই থেকে উত্তর পাওয়া যায়নি। আবার চেষ্টা করো।");
    } catch (error) {
      setOutput(error && error.name === "AbortError"
        ? "৩০ সেকেন্ডেও উত্তর আসেনি। পরে আবার চেষ্টা করো।"
        : "এআই সেবায় সংযোগ করা যায়নি। ইন্টারনেট সংযোগ পরীক্ষা করে আবার চেষ্টা করো।");
    } finally {
      window.clearTimeout(timeoutTimer);
      aiPending = false;
    }
  }

  async function copyPrompt() {
    if (!promptOutput.value) return;
    try {
      if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
        await navigator.clipboard.writeText(promptOutput.value);
      } else {
        promptOutput.hidden = false;
        promptOutput.focus();
        promptOutput.select();
        document.execCommand("copy");
      }
      status.textContent = "ChatGPT নির্দেশ কপি করা হয়েছে।";
    } catch (_) {
      promptOutput.hidden = false;
      promptOutput.focus();
      promptOutput.select();
      status.textContent = "স্বয়ংক্রিয় কপি হয়নি। নির্বাচিত লেখা কপি করো।";
    }
  }

  toolbar.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;
    const action = button.dataset.action;
    if (action === "outer") goOuter();
    else if (action === "inner") goInner();
    else if (action === "explain" && selectedInfo) setOutput(explainLocally(selectedInfo));
    else if (action === "ai") explainWithAI();
    else if (action === "change" && selectedInfo) {
      promptPanel.hidden = false;
      output.hidden = true;
      intentInput.focus();
    } else if (action === "make-prompt" && selectedInfo) {
      const intent = intentInput.value.trim();
      if (!intent) {
        status.textContent = "আগে কী পরিবর্তন করতে চাও, সেটি লিখো।";
        intentInput.focus();
        return;
      }
      promptOutput.value = buildChatGptPrompt(selectedInfo, intent);
      promptOutput.hidden = false;
      copyButton.disabled = false;
      status.textContent = "নির্দেশটি এই ব্রাউজারেই তৈরি হয়েছে; AI ব্যবহার করা হয়নি।";
    } else if (action === "copy") copyPrompt();
    else if (action === "close") disable();
  });

  if (logo) {
    logo.addEventListener("click", handleLogoActivation);
    logo.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      handleLogoActivation();
    });
  }

  document.addEventListener("click", captureSelectionClick, true);
  document.addEventListener("submit", captureSelectionSubmit, true);
})();
