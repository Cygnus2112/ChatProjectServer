require('dotenv').config();
const express = require('express');
const WebSocket = require('ws');
const OpenAI = require('openai');

const app = express()
const server = require('http').createServer(app);
const wss = new WebSocket.Server({ server });

const apiKey = process.env["OPENAI_API_KEY"];

const openai = new OpenAI({
  apiKey,
});

const messages = [
  { role: 'system', content: 'You are a helpful assistant' },
]

let messageString = '';

wss.on('connection', (ws, _) => {
  setTimeout(() => {
    ws.send('Hi Thomas, what can I help you with today?');
    ws.send('FINISHED');
  }, 500);
  ws.on('message', async (message) => { 
    try {
      messages.push(
        { role: 'user', content: message.toString() }
      );
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages,
        stream: true,
      });
    
      for await (const chunk of response) {
        const text = chunk.choices[0]?.delta?.content || '';
        messageString += text;
        ws.send(text);
      }
    } catch (err) {
      console.log(err);
    } finally {
      ws.send('FINISHED')
      messages.push({
        role: 'assistant', content: messageString,
      })
      messageString = '';
    }
  });
});

server.listen(9000, () => console.log(`Listening on port 9000`))
