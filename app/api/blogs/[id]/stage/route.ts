/**
 * Article Stage API
 * PATCH /api/blogs/[id]/stage - Move an article through the writing lifecycle
 *                               and save its workspace material
 *
 * Every stage transition goes through here, so the entry gates live in exactly
 * one place. The ordinary update route deliberately does not touch stage.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sql } from '@vercel/postgres'
import { BlogStage, Workspace } from '@/lib/types/blog'
import {
  isBlogStage,
  normalizeWorkspace,
  stageEntryBlocker,
  validateTwm,
} from '@/lib/lifecycle'

interface StageRequest {
  stage?: BlogStage
  workspace?: Workspace
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const blogId = parseInt(id)

    if (isNaN(blogId)) {
      return NextResponse.json({ error: 'Invalid blog ID' }, { status: 400 })
    }

    const body: StageRequest = await request.json()

    if (body.stage !== undefined && !isBlogStage(body.stage)) {
      return NextResponse.json({ error: `Unknown stage: ${body.stage}` }, { status: 400 })
    }

    const { rows: existing } = await sql`
      SELECT id, stage, status, workspace
      FROM personal_website_blogs
      WHERE id = ${blogId}
    `

    if (existing.length === 0) {
      return NextResponse.json({ error: 'Blog not found' }, { status: 404 })
    }

    const current = existing[0]

    // A saved workspace replaces the stored one; omitting it saves the stage
    // alone, so the panels can autosave without knowing the whole picture.
    const workspace = body.workspace === undefined
      ? normalizeWorkspace(current.workspace)
      : normalizeWorkspace(body.workspace)

    // The twenty-word ceiling is the primitive, so it is enforced on write
    // rather than left to the input that happens to be on screen.
    for (const twm of workspace.twms) {
      const problem = validateTwm(twm.text)
      if (problem) {
        return NextResponse.json({ error: problem }, { status: 422 })
      }
    }

    const stage = body.stage ?? (isBlogStage(current.stage) ? current.stage : 'final')

    // Only check the gate when the article is actually moving.
    if (stage !== current.stage) {
      const blocker = stageEntryBlocker(workspace, stage)
      if (blocker) {
        return NextResponse.json({ error: blocker }, { status: 422 })
      }
    }

    // A published article cannot be walked back to an unfinished stage while
    // it is still live; unpublish it first.
    if (current.status === 'published' && stage !== 'final') {
      return NextResponse.json(
        { error: 'Unpublish this article before moving it back to an earlier stage' },
        { status: 422 }
      )
    }

    const { rows } = await sql`
      UPDATE personal_website_blogs SET
        stage = ${stage},
        workspace = ${JSON.stringify(workspace)}::jsonb
      WHERE id = ${blogId}
      RETURNING id, title, stage, workspace, updated_at
    `

    return NextResponse.json({
      success: true,
      blog: rows[0],
      message: 'Stage updated successfully',
    })

  } catch (error) {
    console.error('Error updating stage:', error)
    return NextResponse.json(
      { error: 'Failed to update stage' },
      { status: 500 }
    )
  }
}
