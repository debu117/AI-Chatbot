const typingForm = document.querySelector(".typing-form");
const chatList = document.querySelector(".chat-list");
const toggleThemeButton = document.querySelector("#toogle-theme-button");
const deleteChatButton  = document.querySelector("#delete-chat-button");
const suggestions = document.querySelectorAll(".suggestion-list .suggestion");
let userMessage = null;
let isResponseGenerating = false;
const API_KEY = "AIzaSyBzaDv_go571a9sHavLtoKYw-pHFYzGLYI";
const API_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${API_KEY}`;


const loadLocalstorageData = ()=>{
    const savedChats = localStorage.getItem("savedChats");
    const isLightMode = (localStorage.getItem("themecolor") === "light_mode");

    //Apply the stored theme
    document.body.classList.toggle("ligt_mode", isLightMode);
    toggleThemeButton.innerText = isLightMode? "dark_mode" : "light_mode";

    chatList.innerHTML = savedChats || "";

    document.body.classList.toggle("hide-header",savedChats);

    chatList.scrollTo(0, chatList.scrollHeight);
}

loadLocalstorageData();

//create a new msg elemnt and return it.
const createMessageElement = (content , ...classes) => {
    const div = document.createElement("div");
    div.classList.add("message", ...classes);
    div.innerHTML = content;
    return div;
}

const showTypingEffect = (text,textElement,incomingMessageDiv)=>{
    const words = text.split(' ');
    let currentWordIndex = 0;
    const typingInterval = setInterval(()=>{
        //append each word with text element with a space
        textElement.innerText+= (currentWordIndex === 0? '' : ' ') + words[currentWordIndex++];
        incomingMessageDiv.querySelector(".icon").classList.add("hide");
        //if all words are displayed.
        if(currentWordIndex === words.length){
            clearInterval(typingInterval);
            isResponseGenerating = false;
            incomingMessageDiv.querySelector(".icon").classList.remove("hide");
            localStorage.setItem("savedChats", chatList.innerHTML); //Saved the chat in local storage.
            
        }        
        chatList.scrollTo(0, chatList.scrollHeight);
    }, 75);
}
const generateAPIResponse = async (incomingMessageDiv) =>{

    const textElement = incomingMessageDiv.querySelector(".text"); //Get txt element

   
    try{
        const response = await fetch(API_URL,{
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
             contents: [{
                role:"user",
                parts: [{text: userMessage }]
             }]   
            })
        });

        const data = await response.json();
        if(!response.ok) throw new Error(data.error.message);
       const apiResponse = data?.candidates[0].content.parts[0].text.replace(/\*\*(.*?)\*\*/g, '$1');
       showTypingEffect(apiResponse,textElement,incomingMessageDiv);
    }catch(error){
        isResponseGenerating = false;
        textElement.innerText = error.message;
        textElement.classList.add("error");
    }finally{
        incomingMessageDiv.classList.remove("loading");
    }
}

//show a oading animation while waiting for API response.
const showLoadingAnimation = () =>{
    const html = `<div class="message-content">
                <img src="gemini.svg" alt="Gemini Image" class="avatar">
                <p class="text"></p> 
                <div class="loading-indicator">
                    <div class="loading-bar"></div>
                    <div class="loading-bar"></div>
                    <div class="loading-bar"></div>
                </div>
            </div>
            <span onclick = "copyMessage(this)" class="icon material-symbols-rounded">
                content_copy
            </span>`;
const incomingMessageDiv = createMessageElement(html, "incoming", "loading");
chatList.appendChild(incomingMessageDiv);

chatList.scrollTo(0, chatList.scrollHeight);

generateAPIResponse(incomingMessageDiv);
}

//copy msg text to clipboard.
const copyMessage = (copyIcon) =>{
    const messageText = copyIcon.parentElement.querySelector(".text").innerText;
    navigator.clipboard.writeText(messageText);
    copyIcon.innerText = "done";
    setTimeout(() =>
        copyIcon.innerText = "content_copy", 1000); //Revert icon after 1 second
    };


const handleOutgoingChat = () =>{
    userMessage = typingForm.querySelector(".typing-input").value.trim() || userMessage;
    if(!userMessage || isResponseGenerating) return //exit if there no message.
    isResponseGenerating = true;
    const html = `    <div class="message-content">
                <img src="user1.jpg.jpeg" alt="User Image" class="avatar">
                <p class="text"></p> 
            </div>`;
    const outgoingMessageDiv = createMessageElement(html, "outgoing");
    
    outgoingMessageDiv.querySelector(".text").innerText = userMessage;
    chatList.appendChild(outgoingMessageDiv);
    
    typingForm.reset(); //clear input field.

    chatList.scrollTo(0, chatList.scrollHeight);

    document.body.classList.add("hide-header"); //hide the header once the chat start

    setTimeout(showLoadingAnimation, 500); //show loading animation after delay.
}

suggestions.forEach(suggestion =>{
    suggestion.addEventListener("click",()=>{
        userMessage = suggestion.querySelector(".text").innerText;
        handleOutgoingChat();
    })
});

//toggle btw light and dark
toggleThemeButton.addEventListener("click",()=>{
  const isLightMode =  document.body.classList.toggle("light_mode");
  localStorage.setItem("themeColor", isLightMode ? "light_mode" : "dark_mode");
    toggleThemeButton.innerText = isLightMode? "dark_mode" : "light_mode";
});

deleteChatButton.addEventListener("click",()=>{
    if(confirm("Are you sure to delete the messages?")){
        localStorage.removeItem("savedChats");
        loadLocalstorageData();
    }
});
//prevent default from submission and handle outgoing chat
typingForm.addEventListener("submit",(e) =>{
    e.preventDefault();

    handleOutgoingChat();
});
