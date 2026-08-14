"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import type { ProgressStatus } from "@/app/generated/prisma/enums";

export async function setSloProgress(sloId: string, status: ProgressStatus) {
  const user = await getCurrentUser();
  if (!user) return { ok: false as const };

  await prisma.userProgress.upsert({
    where: { userId_sloId: { userId: user.id, sloId } },
    update: { status, lastViewedAt: new Date() },
    create: { userId: user.id, sloId, status, lastViewedAt: new Date() },
  });

  return { ok: true as const };
}
