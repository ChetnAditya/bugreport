import { prisma } from '../../db';
import { AppError } from '../../lib/http-error';
import type { CreateCommentInput, UpdateCommentInput } from './comments.schema';
import type { Role } from '@prisma/client';

const authorSelect = { id: true, name: true, email: true, role: true } as const;

export async function listComments(bugId: string) {
  const bug = await prisma.bug.findUnique({ where: { id: bugId } });
  if (!bug) throw AppError.notFound('Bug not found');
  return prisma.comment.findMany({
    where: { bugId },
    orderBy: { createdAt: 'asc' },
    include: { author: { select: authorSelect } },
  });
}

export async function createComment(authorId: string, bugId: string, input: CreateCommentInput) {
  const bug = await prisma.bug.findUnique({ where: { id: bugId } });
  if (!bug) throw AppError.notFound('Bug not found');
  return prisma.comment.create({
    data: { bugId, authorId, text: input.text },
    include: { author: { select: authorSelect } },
  });
}

export async function updateComment(
  actorId: string,
  actorRole: Role,
  id: string,
  input: UpdateCommentInput,
) {
  const c = await prisma.comment.findUnique({ where: { id } });
  if (!c) throw AppError.notFound('Comment not found');
  const isAuthor = c.authorId === actorId;
  if (!isAuthor) throw AppError.forbidden('Only the author can edit');
  return prisma.comment.update({
    where: { id },
    data: { text: input.text },
    include: { author: { select: authorSelect } },
  });
}

export async function deleteComment(
  actorId: string,
  actorRole: Role,
  id: string,
) {
  const c = await prisma.comment.findUnique({ where: { id } });
  if (!c) throw AppError.notFound('Comment not found');
  const isAuthor = c.authorId === actorId;
  const isPrivileged = actorRole === 'SUPERADMIN' || actorRole === 'TEAMLEAD';
  if (!isAuthor && !isPrivileged) throw AppError.forbidden();
  await prisma.comment.delete({ where: { id } });
}