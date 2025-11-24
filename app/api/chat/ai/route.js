export const maxDuration = 60;

import { NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server'; // ✅ FIXED
import prisma from '@/app/models/prisma';
import Groq from 'groq-sdk';

// Initialize Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(req) {
  try {
    // Clerk Authentication
    const { userId } = getAuth(req); 
    if (!userId) {
      console.error('No userId — token missing or invalid'); 
      return NextResponse.json(
        { success: false, message: 'User not authenticated' },
        { status: 401 }
      );
    }

    // Extract chat and prompt
    const { chatId, prompt } = await req.json();
    if (!chatId || !prompt) {
      return NextResponse.json(
        { success: false, message: 'chatId and prompt required' },
        { status: 400 }
      );
    }

    // Validate chat belongs to user
    const chat = await prisma.chat.findFirst({
      where: { id: chatId, userId },
    });

    if (!chat) {
      return NextResponse.json(
        { success: false, message: 'Chat not found' },
        { status: 404 }
      );
    }

    // Store user message in MySQL
    await prisma.message.create({
      data: {
        chatId,
        role: 'user',
        content: prompt,
      },
    });

    // --- Groq Llama-3.1-8b-instant ---
    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'system', content: 'You are a helpful AI assistant.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 800,
    });

    const aiText = completion.choices[0].message.content;

    // Save AI message
    const botMessage = await prisma.message.create({
      data: {
        chatId,
        role: 'assistant',
        content: aiText,
      },
    });

    return NextResponse.json({
      success: true,
      data: botMessage,
    });
  } catch (error) {
    console.error('Chat AI Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
