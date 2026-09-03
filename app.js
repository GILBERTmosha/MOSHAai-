const input =
  document.getElementById("messageInput");

const sendBtn =
  document.getElementById("sendBtn");

const messages =
  document.getElementById("messages");

const welcome =
  document.getElementById("welcome");

const historyBox =
  document.getElementById("history");

const newChat =
  document.getElementById("newChat");

const clearBtn =
  document.getElementById("clearBtn");

const themeBtn =
  document.getElementById("themeBtn");

const menuBtn =
  document.getElementById("menuBtn");

const sidebar =
  document.getElementById("sidebar");


let conversation = [];

let savedChats =
  JSON.parse(
    localStorage.getItem("geminiChats") || "[]"
  );


// ============================
// THEME
// ============================

if (
  localStorage.getItem("theme") === "dark"
) {
  document.body.classList.add("dark");
  updateThemeButton();
}

themeBtn.addEventListener("click", () => {

  document.body.classList.toggle("dark");

  const dark =
    document.body.classList.contains("dark");

  localStorage.setItem(
    "theme",
    dark ? "dark" : "light"
  );

  updateThemeButton();

});


function updateThemeButton() {

  const dark =
    document.body.classList.contains("dark");

  themeBtn.innerHTML = dark
    ? `<i class="fa-solid fa-sun"></i>
       <span>Light Mode</span>`
    : `<i class="fa-solid fa-moon"></i>
       <span>Dark Mode</span>`;
}


// ============================
// SEND
// ============================

async function sendMessage() {

  const text =
    input.value.trim();

  if (!text || sendBtn.disabled) {
    return;
  }

  welcome.style.display = "none";

  addMessage(
    "user",
    text
  );

  const history =
    [...conversation];

  conversation.push({
    role: "user",
    parts: [
      {
        text: text
      }
    ]
  });

  input.value = "";

  resizeInput();

  setLoading(true);

  const typing =
    showTyping();


  try {

    const response =
      await fetch(
        "/api/chat",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body: JSON.stringify({
            message: text,
            history: history
          })
        }
      );


    const data =
      await response.json();


    if (!response.ok) {
      throw new Error(
        data.error ||
        "Request failed"
      );
    }


    typing.remove();


    addMessage(
      "ai",
      data.reply
    );


    conversation.push({
      role: "model",

      parts: [
        {
          text: data.reply
        }
      ]
    });


    saveChat();


  } catch (error) {

    console.error(error);

    typing.remove();

    addMessage(
      "ai",
      "⚠️ Samahani, kuna tatizo. " +
      "Hakikisha server na Gemini API key vinafanya kazi."
    );

  } finally {

    setLoading(false);

  }
}


// ============================
// ADD MESSAGE
// ============================

function addMessage(
  role,
  text
) {

  const wrapper =
    document.createElement("div");

  wrapper.className =
    `message ${role}`;


  const avatar =
    document.createElement("div");

  avatar.className =
    "avatar";


  avatar.innerHTML =
    role === "user"
      ? `<i class="fa-solid fa-user"></i>`
      : `<i class="fa-solid fa-sparkles"></i>`;


  const content =
    document.createElement("div");

  content.className =
    "message-content";


  if (role === "user") {

    content.textContent =
      text;

  } else {

    content.innerHTML =
      formatAI(text);


    const copy =
      document.createElement("button");

    copy.className =
      "copy-btn";

    copy.innerHTML =
      `<i class="fa-regular fa-copy"></i>
       Copy`;


    copy.addEventListener(
      "click",
      async () => {

        await navigator
          .clipboard
          .writeText(text);

        copy.innerHTML =
          `<i class="fa-solid fa-check"></i>
           Copied`;

        setTimeout(() => {

          copy.innerHTML =
            `<i class="fa-regular fa-copy"></i>
             Copy`;

        }, 1500);

      }
    );


    content.appendChild(copy);

  }


  wrapper.appendChild(avatar);

  wrapper.appendChild(content);

  messages.appendChild(wrapper);

  scrollBottom();

  return wrapper;
}


// ============================
// FORMAT AI
// ============================

function formatAI(text) {

  let html =
    escapeHTML(text);


  html =
    html.replace(
      /```([\s\S]*?)```/g,
      "<pre><code>$1</code></pre>"
    );


  html =
    html.replace(
      /\*\*(.*?)\*\*/g,
      "<strong>$1</strong>"
    );


  html =
    html.replace(
      /^### (.*)$/gm,
      "<h3>$1</h3>"
    );


  html =
    html.replace(
      /^## (.*)$/gm,
      "<h2>$1</h2>"
    );


  html =
    html.replace(
      /^# (.*)$/gm,
      "<h1>$1</h1>"
    );


  html =
    html.replace(
      /\n/g,
      "<br>"
    );


  return html;
}


function escapeHTML(text) {

  const element =
    document.createElement("div");

  element.textContent =
    text;

  return element.innerHTML;
}


// ============================
// TYPING
// ============================

function showTyping() {

  const wrapper =
    document.createElement("div");

  wrapper.className =
    "message ai";


  wrapper.innerHTML = `
    <div class="avatar">
      <i class="fa-solid fa-sparkles"></i>
    </div>

    <div class="message-content">

      <div class="typing">
        <span></span>
        <span></span>
        <span></span>
      </div>

    </div>
  `;


  messages.appendChild(wrapper);

  scrollBottom();

  return wrapper;
}


// ============================
// LOADING
// ============================

function setLoading(
  loading
) {

  sendBtn.disabled =
    loading;

  input.disabled =
    loading;

  if (!loading) {
    input.disabled = false;
    input.focus();
  }

}


// ============================
// NEW CHAT
// ============================

newChat.addEventListener(
  "click",
  () => {

    saveChat();

    conversation = [];

    messages.innerHTML = "";

    welcome.style.display =
      "block";

    input.value = "";

    resizeInput();

    sidebar.classList
      .remove("open");

  }
);


// ============================
// CLEAR HISTORY
// ============================

clearBtn.addEventListener(
  "click",
  () => {

    savedChats = [];

    localStorage.removeItem(
      "geminiChats"
    );

    conversation = [];

    messages.innerHTML = "";

    welcome.style.display =
      "block";

    renderHistory();

  }
);


// ============================
// SAVE CHAT
// ============================

function saveChat() {

  if (
    conversation.length === 0
  ) {
    return;
  }


  const first =
    conversation.find(
      item =>
        item.role === "user"
    );


  if (!first) {
    return;
  }


  const title =
    first.parts[0].text
      .substring(0, 45);


  const chat = {
    id: Date.now(),

    title: title,

    conversation:
      conversation
  };


  savedChats.unshift(chat);

  savedChats =
    savedChats.slice(0, 20);


  localStorage.setItem(
    "geminiChats",
    JSON.stringify(savedChats)
  );


  renderHistory();

}


// ============================
// HISTORY
// ============================

function renderHistory() {

  historyBox.innerHTML = "";


  savedChats.forEach(
    chat => {

      const item =
        document.createElement("div");

      item.className =
        "history-item";


      item.innerHTML = `
        <i class="fa-regular fa-message"></i>
        <span>
          ${escapeHTML(chat.title)}
        </span>
      `;


      item.addEventListener(
        "click",
        () => {

          conversation =
            chat.conversation;

          messages.innerHTML =
            "";

          welcome.style.display =
            "none";


          conversation.forEach(
            message => {

              addMessage(
                message.role === "model"
                  ? "ai"
                  : "user",

                message.parts[0].text
              );

            }
          );


          sidebar.classList
            .remove("open");

        }
      );


      historyBox.appendChild(
        item
      );

    }
  );

}


// ============================
// SUGGESTIONS
// ============================

document
  .querySelectorAll(".suggestion")
  .forEach(button => {

    button.addEventListener(
      "click",
      () => {

        input.value =
          button.dataset.text;

        resizeInput();

        input.focus();

      }
    );

  });


// ============================
// ENTER
// ============================

input.addEventListener(
  "keydown",
  event => {

    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {

      event.preventDefault();

      sendMessage();

    }

  }
);


// ============================
// RESIZE
// ============================

input.addEventListener(
  "input",
  resizeInput
);


function resizeInput() {

  input.style.height =
    "auto";

  input.style.height =
    Math.min(
      input.scrollHeight,
      150
    ) + "px";

}


// ============================
// SEND BUTTON
// ============================

sendBtn.addEventListener(
  "click",
  sendMessage
);


// ============================
// MOBILE MENU
// ============================

menuBtn.addEventListener(
  "click",
  () => {

    sidebar.classList
      .toggle("open");

  }
);


// ============================
// SCROLL
// ============================

function scrollBottom() {

  const area =
    document.getElementById(
      "chatArea"
    );

  setTimeout(() => {

    area.scrollTop =
      area.scrollHeight;

  }, 30);

}


// ============================
// START
// ============================

renderHistory();
