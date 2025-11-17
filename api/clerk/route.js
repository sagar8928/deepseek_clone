import { Webhook } from 'svix';
import { NextResponse } from 'next/server';
import prisma from '@/app/models/prisma';
import { headers } from 'next/headers';

export async function POST(req) {
  try {
    const wh = new Webhook(process.env.SIGNING_SECRET);

    // Grab raw body for signature verification
    const body = await req.text();

    // Collect headers
    const svixHeaders = {
      'svix-id': headers().get('svix-id'),
      'svix-timestamp': headers().get('svix-timestamp'),
      'svix-signature': headers().get('svix-signature'),
    };

    // Verify webhook
    const { data, type } = wh.verify(body, svixHeaders);

    // Map user data
    const userData = {
      id: data.id,
      email: data.email_addresses?.[0]?.email_address || null,
      name: `${data.first_name || ''} ${data.last_name || ''}`.trim(),
      image: data.image_url || null,
    };

    // Handle events
    switch (type) {
      case 'user.created':
      case 'user.updated':
        await prisma.user.upsert({
          where: { id: data.id },
          create: userData,
          update: userData,
        });
        break;

      case 'user.deleted':
        await prisma.user.delete({
          where: { id: data.id },
        });
        break;

      default:
        console.log(`Unhandled event type: ${type}`);
    }

    console.log(`Webhook processed: ${type} for user ${data.id}`);
    return NextResponse.json({ message: 'Event received' }, { status: 200 });
  } catch (err) {
    console.error('Webhook verification or processing failed:', err);
    return NextResponse.json(
      { message: 'Webhook failed', error: err.message },
      { status: 400 }
    );
  }
}
