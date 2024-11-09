import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { HfInference } from "@huggingface/inference";
import { OpenAI } from "openai";
import MistralClient from "@mistralai/mistralai";
import cors from 'cors';
import axios from 'axios';

const app = express();
const server = createServer(app);
const io = new Server(server, {
  path: '/api/socket.io',
  cors: {
    origin: ["https://groupgen-39162.uc.r.appspot.com", "https://api-dot-groupgen-39162.uc.r.appspot.com"],
    methods: ["GET", "POST"],
    credentials: true,
    transports: ['websocket', 'polling']
  }
});

app.use(cors({
  origin: ["https://groupgen-39162.uc.r.appspot.com", "https://api-dot-groupgen-39162.uc.r.appspot.com"],
  credentials: true
}));
app.use(express.json());

const port = process.env.PORT || 3090;

// Initialize AI clients
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const mistral = new MistralClient(process.env.MISTRAL_API_KEY);

const huggingface = new HfInference(process.env.HUGGINGFACE_API_KEY);
io.on('connect_error', (err) => {
  console.log(`connect_error due to ${err.message}`);
});
io.on('connection', (socket) => {
  console.log('a user connected');

  const processMessages = (body) => {
    let messages = [];
    for (var key in body) {
      if (!isNaN(key)) {
        if ('name' in body[key]) {
          messages.push({
            role: body[key].role,
            content: body[key].content,
            name: body[key].name
          });
        } else {
          messages.push({ role: body[key].role, content: body[key].content });
        }
      }
    }
    return messages;
  };

  const streamHuggingFaceCompletion = async (model, messages, max_tokens, socket) => {
    try {
      for await (const chunk of huggingface.chatCompletionStream({
        model: model,
        messages: messages,
        max_tokens: max_tokens,
      })) {
        const content = chunk.choices[0]?.delta?.content || "";
        console.log(content);
        socket.emit('chatUpdate', content);
      }

      console.log("completed chat");
      socket.emit('chatComplete');
    } catch (error) {
      console.error("Error in chat completion:", error);
      socket.emit('chatError', { message: "An error occurred during chat completion." });
    }
  };

  const streamOpenAICompletion = async (model, messages, max_tokens, socket) => {
    try {
      const stream = await openai.chat.completions.create({
        model: model,
        messages: messages,
        max_tokens: max_tokens,
        stream: true,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || "";
        console.log(content);
        socket.emit('chatUpdate', content);
      }

      console.log("completed chat");
      socket.emit('chatComplete');
    } catch (error) {
      console.error("Error in chat completion:", error);
      socket.emit('chatError', { message: "An error occurred during chat completion." });
    }
  };

  const streamMistralCompletion = async (model, messages, max_tokens, socket) => {
    try {
      const stream = await mistral.chatStream({
        model: model,
        messages: messages,
        max_tokens: max_tokens,
      });

      for await (const chunk of stream) {
        const streamText = chunk.choices[0].delta.content;
        console.log(streamText);
        socket.emit('chatUpdate', streamText);
      }

      console.log("completed chat");
      socket.emit('chatComplete');
    } catch (error) {
      console.error("Error in Mistral chat completion:", error);
      socket.emit('chatError', { message: "An error occurred during Mistral chat completion." });
    }
  };

  socket.on('requestFineTunedLlama', async (body, max_tokens) => {
    const messages = processMessages(body);
    console.log(messages);
    
    await streamHuggingFaceCompletion("tgi", messages, max_tokens, socket);
  });
  
  socket.on('requestGpt4', async (body, max_tokens) => {
    const messages = processMessages(body);
    console.log(messages);
    
    await streamOpenAICompletion("gpt-4o-mini", messages, max_tokens, socket);
  });

  socket.on('requestMistral', async (body, max_tokens) => {
    const messages = processMessages(body);
    console.log(messages);
    
    await streamMistralCompletion("mistral-small-latest", messages, max_tokens, socket);
  });

  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});

// REST API endpoints
app.post('/api/generate-text', async (req, res) => {
  const body = req.body;
  console.log(body);
  
  try {
    const completion = await openai.chat.completions.create({
      model: body.model || "gpt-4o-mini",
      messages: body.messages,
      temperature: body.temperature || 0.7,
      max_tokens: body.max_tokens || 150
    });
    
    console.log(completion.choices[0].message.content);
    res.json({
      message: completion.choices[0].message.content,
    });
  } catch (error) {
    console.error("Error calling OpenAI:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/generate-text-mistral', async (req, res) => {
  const body = req.body;
  console.log(body);
  
  try {
    const completion = await mistral.chat({
      model: body.model || "mistral-large-latest",
      messages: body.messages,
      max_tokens: body.max_tokens || 150,
      temperature: body.temperature || 0.7
    });
    
    console.log(completion.choices[0].message.content);
    res.json({
      message: completion.choices[0].message.content,
    });
  } catch (error) {
    console.error("Error calling Mistral:", error);
    res.status(500).json({ error: error.message });
  }
});



app.post('/api/generate-image', async (req, res) => {
  const { prompt } = req.body;
  console.log("Image generation prompt:", prompt);
  
  const options = {
    method: 'POST',
    url: 'https://api.getimg.ai/v1/flux-schnell/text-to-image',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      authorization: `Bearer ${process.env.GETIMG_API_KEY}`
    },
    data: {
      response_format: 'url',
      width: 512,
      height: 512,
      prompt: prompt
    }
  };

  try {
    const response = await axios.request(options);
    console.log("Generated image URL:", response.data.url);
    res.json({ imageUrl: response.data.url });
  } catch (error) {
    console.error("Error generating image:", error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working' });
});

server.listen(port, () => {
  console.log(`listening at http://localhost:${port}`);
});