import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import Project from '@/models/Project';
import User from '@/models/User';

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const user = await User.findOne({ clerkId: userId });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { diagram, diagram_img, prompt } = await req.json();

    const project = await Project.findOneAndUpdate(
      { _id: params.id, userId: user._id },
      {
        $push: {
          history: {
            $each: [{
              prompt,
              diagram,
              diagram_img: diagram_img,
              updateType: 'chat',
              updatedAt: new Date()
            }],
            $position: 0
          }
        },
        $set: {
          diagramSVG: diagram_img
        }
      },
      { new: true }
    );

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error('Error in diagram API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 