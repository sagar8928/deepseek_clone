import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/app/models/prisma';

export async function POST(req) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'User not authenticated' },
        { status: 401 }
      );
    }

    const { chatId } = await req.json();

    if (!chatId) {
      return NextResponse.json(
        { success: false, message: 'chatId is required' },
        { status: 400 }
      );
    }

    // Check ownership
    const chat = await prisma.chat.findFirst({
      where: { id: chatId, userId },
    });

    if (!chat) {
      return NextResponse.json({
        success: false,
        message: 'Chat not found or not yours',
      });
    }

    // Delete messages first (due to foreign key constraints)
    await prisma.message.deleteMany({
      where: { chatId },
    });

    // Delete chat
    await prisma.chat.delete({
      where: { id: chatId },
    });

    return NextResponse.json({
      success: true,
      message: 'Chat deleted successfully',
    });
  } catch (error) {
    console.error('Delete chat error:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
