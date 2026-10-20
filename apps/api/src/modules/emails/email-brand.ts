import type { EmailBrandDetails } from "@clinic/types";
import type { PrismaService } from "@/prisma/prisma.service";

const brandSelect = {
  name: true,
  nameAr: true,
  logoUrl: true,
  brandColor: true,
  timezone: true,
  phone: true,
  address: true,
  email: true,
  emailSettings: true,
} as const;

export async function loadEmailBrand(prisma: PrismaService, clinicId: string) {
  const clinic = await prisma.clinic.findFirst({
    where: { id: clinicId, isActive: true },
    select: brandSelect,
  });
  if (!clinic) return null;
  const { emailSettings, ...brandInfo } = clinic;
  const contact = emailSettings?.replyTo?.trim() || brandInfo.email;
  return {
    ...brandInfo,
    ...emailSettings,
    email: contact,
    phone: emailSettings?.phone?.trim() || brandInfo.phone,
    replyTo: contact || undefined,
    websiteUrl: emailSettings?.websiteUrl ?? undefined,
    instagramUrl: emailSettings?.instagramUrl ?? undefined,
    facebookUrl: emailSettings?.facebookUrl ?? undefined,
    linkedinUrl: emailSettings?.linkedinUrl ?? undefined,
    footerEn: emailSettings?.footerEn ?? undefined,
    footerAr: emailSettings?.footerAr ?? undefined,
  } satisfies EmailBrandDetails;
}
