import { getAuth, currentUser, auth } from '@clerk/nextjs/server';
import prisma from '@/app/models/prisma';

export async function POST(req) {
  try {
    const { userId } = getAuth(req);
    console.log('AUTH DEBUG:', auth());
    if (!userId) {
      return Response.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const authUser = await currentUser();

    if (!authUser) {
      return Response.json(
        { success: false, message: 'Unable to fetch Clerk user' },
        { status: 401 }
      );
    }

    let user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      user = await prisma.user.create({
        data: {
          id: userId,
          email: authUser.emailAddresses[0]?.emailAddress || null,
          name: `${authUser.firstName || ''} ${authUser.lastName || ''}`,
          image: authUser.imageUrl || null,
        },
      });
    }

    const body = await req.json();
    const { name = 'New Chat' } = body;

    const newChat = await prisma.chat.create({
      data: {
        name,
        userId,
      },
    });

    return Response.json({ success: true, chat: newChat });
  } catch (error) {
    console.error('Chat create error:', error);
    return Response.json(
      { success: false, message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
}
