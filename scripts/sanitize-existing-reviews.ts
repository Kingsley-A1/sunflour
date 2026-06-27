import "dotenv/config";

import { prisma } from "@/server/db/prisma";
import { containsHtmlMarkup, stripHtmlTags } from "@/server/lib/text/sanitize";

/**
 * One-time remediation for FIND-02. Review ingest now rejects HTML/script
 * markup, but rows stored before that fix may still hold raw payloads. This
 * script strips HTML from any existing review name/comment so stored values are
 * inert in every rendering context (admin queue, email, CSV export).
 */
async function main(): Promise<void> {
  const reviews = await prisma.review.findMany({
    select: { id: true, customerNameSnapshot: true, comment: true },
  });

  let updated = 0;

  for (const review of reviews) {
    const nameHasMarkup = containsHtmlMarkup(review.customerNameSnapshot);
    const commentHasMarkup = containsHtmlMarkup(review.comment);

    if (!nameHasMarkup && !commentHasMarkup) {
      continue;
    }

    const sanitizedName = stripHtmlTags(review.customerNameSnapshot) || "Customer";
    const sanitizedComment =
      stripHtmlTags(review.comment) || "(removed during security cleanup)";

    await prisma.review.update({
      where: { id: review.id },
      data: {
        customerNameSnapshot: nameHasMarkup ? sanitizedName : undefined,
        comment: commentHasMarkup ? sanitizedComment : undefined,
      },
    });

    updated += 1;
  }

  console.log(
    `Reviews scanned: ${reviews.length}. Sanitized ${updated} review(s) containing HTML markup.`,
  );
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
