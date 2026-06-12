import { prisma } from "@/lib/prisma";
import type { ContactSuggestion } from "@/lib/types";

export async function listContacts(userId: string): Promise<ContactSuggestion[]> {
  const rows = await prisma.savedContact.findMany({
    where: { userId },
    orderBy: [{ relevance: "desc" }, { createdAt: "desc" }],
  });

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    title: row.title || "",
    company: row.company || "",
    linkedinUrl: row.linkedinUrl,
    relevance: row.relevance,
    location: row.location || undefined,
  }));
}

export async function saveContacts(
  userId: string,
  contacts: Omit<ContactSuggestion, "id">[]
) {
  for (const contact of contacts) {
    if (!contact.linkedinUrl) continue;
    await prisma.savedContact.upsert({
      where: {
        userId_linkedinUrl: { userId, linkedinUrl: contact.linkedinUrl },
      },
      create: {
        userId,
        name: contact.name,
        title: contact.title || null,
        company: contact.company || null,
        location: contact.location || null,
        linkedinUrl: contact.linkedinUrl,
        relevance: contact.relevance || 0,
      },
      update: {
        name: contact.name,
        title: contact.title || null,
        company: contact.company || null,
        location: contact.location || null,
        relevance: contact.relevance || 0,
      },
    });
  }
  return listContacts(userId);
}

export async function deleteContact(userId: string, id: string) {
  await prisma.savedContact.deleteMany({ where: { id, userId } });
}
