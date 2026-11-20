import type { Metadata } from 'next';
import Link from 'next/link';
import LegalPage, { LegalList, LegalSection, LegalText, legalLinkStyle } from '@/components/marketing/LegalPage';
import { LEGAL } from '@/content/legal';

export const metadata: Metadata = {
  title: "Delete your data | Where's My Vibe",
  description:
    "How to ask Where's My Vibe to delete your account and the data linked to it, what is deleted and how long it takes.",
  alternates: { canonical: '/data-deletion' },
};

export default function DataDeletionPage() {
  const href = `mailto:${LEGAL.contactEmail}?subject=${encodeURIComponent(LEGAL.deletionSubject)}`;
  const mail = <a href={href} style={legalLinkStyle}>{LEGAL.contactEmail}</a>;
  return (
    <LegalPage
      title="Delete your data"
      intro={<>You can ask {LEGAL.operator} to delete your account and the data linked to it at any time. It is free and you do not need to give a reason.</>}
    >
      <LegalSection title="How to ask">
        <LegalList ordered items={[
          <>Send an email to {mail}.</>,
          'Send it from the email address you use to sign in, so that we know the request comes from the account holder.',
          <>Use the subject &ldquo;{LEGAL.deletionSubject}&rdquo;.</>,
        ]} />
        <LegalText>You do not need to write anything else.</LegalText>
      </LegalSection>

      <LegalSection title="What we delete">
        <LegalList items={[
          'your account: your email address, name, profile picture address, Google account identifier and preferences',
          'your sign-in sessions, which signs you out on every device',
          'the usage records linked to your account',
        ]} />
      </LegalSection>

      <LegalSection title="What is not deleted">
        <LegalList items={[
          'Usage records that were never linked to an account. They carry only a random browser identifier, so we cannot tell which ones are yours.',
          'Information stored in your own browser, such as saved events and your theme. You can remove it by clearing the site’s data in your browser settings.',
          'The email you sent us, which we keep as a record that the request was made and completed.',
        ]} />
      </LegalSection>

      <LegalSection title="How long it takes">
        <LegalText>
          We delete your data within {LEGAL.deletionDays} days of receiving your email. We then reply to the same address to confirm that it is done.
        </LegalText>
      </LegalSection>

      <LegalSection title="More information">
        <LegalText>
          Our <Link href="/privacy" style={legalLinkStyle}>privacy policy</Link> lists everything we collect and why.
        </LegalText>
      </LegalSection>
    </LegalPage>
  );
}
