import io from 'socket.io-client';

const API_URL = 'https://groupgen-39162.uc.r.appspot.com';
//I have commented out the socket.io connection because I am using the REST API instead, socket.io had too many issues
/*
const SOCKET_URL = 'wss://groupgen-39162.uc.r.appspot.com/api';

const socket = io(SOCKET_URL, {
  withCredentials: true,
  transports: ['websocket', 'polling'],
  path: '/socket.io'
});
*/
const fetchWithBaseUrl = (path, options) => {
  return fetch(`${API_URL}/api${path}`, options);
};

export async function generateConversationImage({ chats, members, style }) {
  console.log("Generating image and user-friendly description based on conversation...");

  // Construct the conversation history
  const conversationHistory = chats.slice(-5)
    .filter(chat => chat[0] === "text")
    .map(chat => `${members[chat[1]][0]}: "${chat[2]}"`)
    .join("\n");

  // Construct the member descriptions
  const memberDescriptions = Object.entries(members)
    .map(([id, [name, personality]]) => `${name}: ${personality}`)
    .join("\n");

  // Prepare the messages for the prompt engineering model (e.g., GPT-4)
  const promptEngineeringMessages = [
    {
      role: 'system',
      content: 'You are an expert at creating optimal prompts for the FLUX.1 image generation model. Your task is to analyze conversations and create vivid prompts that will result in striking and relevant images. Focus on the most important visual elements and avoid including internal thoughts or non-visual details and overwhelming the image generator with too many details.'
    },
    {
      role: 'user',
      content: `Participants:
${memberDescriptions}

Recent conversation:
${conversationHistory}

Based on this conversation and the description of the participants, create an optimal prompt for FLUX.1 to generate an image. The prompt should:
1. Capture the essence and emotion of a recent moment in the conversation through intruguing visual elements
2. Include relevant details about the main action or central theme that can be visually represented
3. Describe a maximum of 2 visible events occurring in the image
4. Be concise yet descriptive (aim for 2-3 sentences)
5. Use clear, specific language focusing on visual aspects that FLUX.1 can actually create
6. Avoid describing internal thoughts, or non-visual elements
7. Describe characters with visual detail


Respond with ONLY the image prompt. Do not include any other text or explanation.`
    }
  ];

  const promptEngineeringBody = {
    messages: promptEngineeringMessages,
    model: "gpt-4o",
    temperature: 0.7,
    max_tokens: 150
  };

  try {
    // Get the optimized prompt from the prompt engineering model
    const promptResponse = await fetchWithBaseUrl('/generate-text', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(promptEngineeringBody)
    });

    if (!promptResponse.ok) {
      throw new Error(`HTTP error! status: ${promptResponse.status}`);
    }

    const promptData = await promptResponse.json();
    const optimizedPrompt = promptData.message.trim();
    console.log("Optimized FLUX.1 prompt:", optimizedPrompt);
    console.log("Style:", style);

    // Generate the image using FLUX.1 with the optimized prompt
    const imageResponse = await fetchWithBaseUrl('/generate-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        prompt: optimizedPrompt + " .Image style must be " + style
      })
    });

    if (!imageResponse.ok) {
      throw new Error(`HTTP error! status: ${imageResponse.status}`);
    }

    const imageData = await imageResponse.json();
    console.log("Image generated:", imageData.imageUrl)

    return {
      imageUrl: imageData.imageUrl,
      description: optimizedPrompt
    };
  } catch (error) {
    console.error("Error in generateConversationImage:", error);
    throw error;
  }
}

export async function generateChatName({chats, members}) {
  console.log("generating chat name!");

  let conversationContent = chats
    .filter(chat => chat[0] === "text")
    .map(chat => `${members[chat[1]][0]} said: "${chat[2]}"`).join(" ");

  let membersInfo = Object.entries(members)
    .map(([id, [name, personality]]) => `${name}: ${personality}`)
    .join(". ");

  const messages = [
    {
      role: 'system',
      content: 'You are an AI assistant that generates concise and relevant chat names based on conversation history and participant information.'
    },
    {
      role: 'user',
      content: `Previous conversation: ${conversationContent}
      Participant information: ${membersInfo}
      Based on this information, generate a fitting name for the chat that is less than 15 characters.
      Respond with ONLY the chat name. Do not include any other text or explanation.`
    }
  ];

  const body = {
    messages: messages,
    model: "gpt-4o",
    temperature: 0.7,
    max_tokens: 30
  };

  console.log("Request body:", body);

  try {
    const response = await fetchWithBaseUrl('/generate-text', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("AI response:", data);

    const chatName = data.message;

    return chatName;
  } catch (error) {
    console.error("Error generating chat name:", error);
    return "New Chat";
  }
}
/*
export function llamaAI({ chats, members, responder, setChats, setPendingMessage }) {
  console.log("llamaAI has been called!");

  let [name, personality, avatarUrl] = members[responder];
  let content = "This is the previous conversation: ";
  chats.forEach((chat, index) => {
    if (chat[0] === "text") {
      content = content.concat(members[chat[1]][0] + " said: \"" + chat[2] + "\" ");
    }
  });

  let body = {
    0: {'role': 'system', 'content': "You are: " + name + ". " + personality +". do NOT respond with quotes around your response"},
    1: {'role': 'user', 'content': content}
  };
  console.log(body);

  // Remove any existing listeners before adding new ones
  socket.off('chatUpdate');
  socket.off('chatComplete');

  let accumulatedResponse = "";
  const generateUniqueKey = () => {
    return Math.random().toString(36).substr(2, 9);
  };

  const key = generateUniqueKey();

  return new Promise((resolve) => {
    socket.on('chatUpdate', (data) => {
      accumulatedResponse += data;
      setChats(prevChats => {
        const newChats = [...prevChats];
        newChats[newChats.length - 1] = ["text", responder, accumulatedResponse, key];
        return newChats;
      });
    });

    socket.on('chatComplete', () => {
      setPendingMessage(false);
      socket.off('chatUpdate');
      socket.off('chatComplete');
      resolve();
    });

    socket.emit('requestFineTunedLlama', body, 500);
  });
}
*/
//this is for chats
export function mistralAI({ chats, members, responder, setChats, setPendingMessage }) {
  console.log("mistralAI has been called!");

  let [name, personality, avatarUrl] = members[responder];

  let systemContent = `Embody the character of ${name}.
${personality}
Be true to ${name}'s unique personality and quirks.
When responding, speak naturally as ${name} would, with their characteristic tone and mannerisms.
You will be engaging in a conversation where each message is preceded by the name of the speaker.
When it's your turn to speak, respond directly as ${name} without any additional text or indicators.
Your response should include both dialogue and physical actions:
- Dialogue should be written normally, without quotation marks.
- Physical actions or movements should be enclosed in single asterisks *.
For example: Hello there! *waves enthusiastically* It's great to see you.
Do not add any text before or after your dialogue and actions.
Do not indicate that you are speaking or thinking.
Simply provide the message and actions as ${name} would express them.
Do not include responses or actions from other characters in your message.
Only respond as ${name} and do not continue the conversation for other participants.
Your response should be a single turn in the conversation, not multiple exchanges.
Add variety to your responses. Don't always agree with others. Feel free to disagree, challenge ideas, or introduce new perspectives based on ${name}'s personality and beliefs.`;

  let userContent = `Continue the conversation as ${name}. Only respond as ${name} and do not continue the conversation for other participants. Include both dialogue and physical actions. Respond with a single message as ${name}, do not include responses from other participants:\n\n`;
  chats.forEach((chat) => {
    if (chat[0] === "text") {
      userContent += `${members[chat[1]][0]}: ${chat[2]}\n`;
    }
  });
  userContent += `${name}:`;

  let body = {
    messages: [
      { role: 'system', content: systemContent },
      { role: 'user', content: userContent }
    ],
    max_tokens: 150
  };

  console.log(body);

  const generateUniqueKey = () => Math.random().toString(36).substr(2, 9);
  const key = generateUniqueKey();

  return new Promise((resolve) => {
    fetchWithBaseUrl('/generate-text-mistral', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    })
    .then(response => response.json())
    .then(data => {
      console.log("Mistral response:", data);
      setChats(prevChats => {
        const newChats = [...prevChats];
        newChats[newChats.length - 1] = ["text", responder, data.message, key];
        return newChats;
      });
      setPendingMessage(false);
      resolve();
    })
    .catch(error => {
      console.error("Error in mistralAI:", error);
      setPendingMessage(false);
      resolve();
    });
  });
}


//this is for chats
export function gpt4AI({ chats, members, responder, setChats, setPendingMessage }) {
  console.log("gpt4AI has been called!");

  let [name, personality, avatarUrl] = members[responder];

  let systemContent = `Embody the character of ${name}.
${personality}
Be true to ${name}'s unique personality and quirks.
When responding, speak naturally as ${name} would, with their characteristic tone and mannerisms.
You will be engaging in a conversation where each message is preceded by the name of the speaker.
When it's your turn to speak, respond directly as ${name} without any additional text or indicators.
Your response should include both dialogue and physical actions:
- Dialogue should be written normally, without quotation marks.
- Physical actions or movements should be enclosed in asterisks **.
For example: Hello there! *waves enthusiastically* It's great to see you.
Do not add any text before or after your dialogue and actions.
Do not indicate that you are speaking or thinking.
Simply provide the message and actions as ${name} would express them.
Do not include responses or actions from other characters in your message.
Only respond as ${name} and do not continue the conversation for other participants.
Your response should be a single turn in the conversation, not multiple exchanges.
Add variety to your responses. Don't always agree with others. Feel free to disagree, challenge ideas, or introduce new perspectives based on ${name}'s personality and beliefs.`;

  let userContent = `Continue the conversation as ${name}. Only respond as ${name} and do not continue the conversation for other participants. Include both dialogue and physical actions. Remember to add variety to your responses - you don't always have to agree with others. Respond with a single message as ${name}, do not include responses from other participants:\n\n`;
  chats.forEach((chat) => {
    if (chat[0] === "text") {
      userContent += `${members[chat[1]][0]}: ${chat[2]}\n`;
    }
  });
  userContent += `${name}:`;

  let body = {
    messages: [
      { role: 'system', content: systemContent },
      { role: 'user', content: userContent }
    ],
    model: "gpt-4o",
    temperature: 0.7,
    max_tokens: 150
  };

  console.log(body);

  const generateUniqueKey = () => Math.random().toString(36).substr(2, 9);
  const key = generateUniqueKey();

  return new Promise((resolve) => {
    fetchWithBaseUrl('/generate-text', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    })
    .then(response => response.json())
    .then(data => {
      console.log("GPT-4 mini response:", data);
      setChats(prevChats => {
        const newChats = [...prevChats];
        newChats[newChats.length - 1] = ["text", responder, data.message, key];
        return newChats;
      });
      setPendingMessage(false);
      resolve();
    })
    .catch(error => {
      console.error("Error in gpt4AI:", error);
      setPendingMessage(false);
      resolve();
    });
  });
}

export async function generateProfilePicture({name, personality}) {
  console.log("Generating profile picture for:", name);

  const prompt = `Create a portrait of ${name}, ${personality}.`;

  try {
    const imageResponse = await fetchWithBaseUrl('/generate-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ prompt })
    });

    if (!imageResponse.ok) {
      throw new Error(`HTTP error! status: ${imageResponse.status}`);
    }

    const imageData = await imageResponse.json();
    console.log("Profile picture generated:", imageData.imageUrl);

    return imageData.imageUrl;
  } catch (error) {
    console.error("Error generating profile picture:", error);
    throw error;
  }
}

export async function determineAIResponder({ chats, members, setCurrentAIResponder, allowAIResponse, usersMember }) {
  console.log("Determining AI responder...");

  // Filter out usersMember if allowAIResponse is false
  const filteredMembers = allowAIResponse ? members : Object.fromEntries(
    Object.entries(members).filter(([id]) => id !== usersMember)
  );

  // Construct the conversation history
  const conversationHistory = chats
    .filter(chat => chat[0] === "text")
    .map(chat => `${members[chat[1]][0]} said: "${chat[2]}"`)
    .join(" ");

  // Prepare the messages for the AI model
  const messages = [
    {
      role: 'system',
      content: 'You are an AI assistant that determines which personality should respond next in a conversation. You must respond with only a the ID of the chosen personality. Do not include any other text in your response.'
    },
    {
      role: 'user',
      content: `Previous conversation: ${conversationHistory}
      Personality ID to Name mapping: ${JSON.stringify(Object.fromEntries(Object.entries(filteredMembers).map(([id, [name]]) => [id, name])))}
      Personality ID to Description mapping: ${JSON.stringify(Object.fromEntries(Object.entries(filteredMembers).map(([id, [_, personality]]) => [id, personality])))}
      Based on this information, determine the ID number of the personality most likely to respond next.
      Respond with ONLY the ID. Do not include any other text or explanation.`
    }
  ];

  const body = {
    messages: messages,
    model: "gpt-4o",
    max_tokens: 30
  };

  console.log("Request body:", body);

  try {
    const response = await fetchWithBaseUrl('/generate-text', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("AI response:", data);

    const responderId = data.message.trim()
    
    if (!(responderId in filteredMembers)) {
      throw new Error("API did not return a valid integer");
    }
    
    if (responderId in filteredMembers) {
      setCurrentAIResponder(responderId);
    }
    return responderId;
  } catch (error) {
    console.error("Error determining AI responder:", error);
    throw error;
  }
}
