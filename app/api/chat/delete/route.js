import { getAuth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import Chat from '@/app/models/Chat';
import Message from '@/app/models/Message';

export async function POST(req) {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return NextResponse.json({
        success: false,
        message: 'User not authenticated',
      });
    }

    const body = await req.json();
    const { chatId } = body;

    if (!chatId) {
      return NextResponse.json({
        success: false,
        message: 'chatId is required',
      });
    }

    // Find the chat and ensure it belongs to the user
    const chat = await Chat.findOne({ where: { id: chatId, userId } });
    if (!chat) {
      return NextResponse.json({
        success: false,
        message: 'Chat not found or you do not have permission to delete it',
      });
    }

    // Delete all messages associated with this chat
    await Message.destroy({ where: { chatId } });

    // Delete the chat itself
    await chat.destroy();

    return NextResponse.json({
      success: true,
      message: 'Chat and all associated messages deleted successfully',
    });
  } catch (error) {
    console.error('Delete chat error:', error);
    return NextResponse.json({
      success: false,
      message: error.message,
    });
  }
}
