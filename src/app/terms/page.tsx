import type { Metadata } from 'next';
import Link from 'next/link';
import LegalPage, { LegalList, LegalSection, LegalText, legalLinkStyle } from '@/components/marketing/LegalPage';
import { LEGAL } from '@/content/legal';

export const metadata: Metadata = {
  title: "Terms of service | Where's My Vibe",
  description:
    "The terms for using Where's My Vibe: what the service is, how accurate the listings are, your account, and what you can and cannot do with the site.",
  alternates: { canonical: '/terms' },
};

export default function TermsPage() {
  const mail = <a href={`mailto:${LEGAL.contactEmail}`} style={legalLinkStyle}>{LEGAL.contactEmail}</a>;
  return (
    <LegalPage
      title="Terms of service"
      intro={<>These terms apply when you use wheresmyvibe.com. By using the site you agree to them. If you do not agree, please do not use the site.</>}
    >
      <LegalSection title="What the service is">
        <LegalText>
          {LEGAL.operator} helps you find events. We gather information that venues and organisers have published, including public Instagram stories and posts, ticketing platforms and community listings, and show it on a map and in a list. The service is free to use.
        </LegalText>
      </LegalSection>

      <LegalSection title="Listings can be wrong or out of date">
        <LegalText>
          We do not run the events we list and we are not the organiser or the venue. Listings are read from other people&rsquo;s posts and pages, partly by automated tools, so a time, price, line-up, offer or location can be wrong, or can change after we read it. An event can also be cancelled without our knowing.
        </LegalText>
        <LegalText>
          Before you travel or pay, check the details with the venue or organiser. Entry rules such as age limits, dress codes and guest lists are set by the venue.
        </LegalText>
      </LegalSection>

      <LegalSection title="Tickets and bookings">
        <LegalText>
          We do not sell tickets or take bookings. When a listing links to a ticketing platform, venue or organiser, any purchase is between you and them and their terms apply. We are not responsible for refunds, cancellations or the event itself.
        </LegalText>
      </LegalSection>

      <LegalSection title="Your account">
        <LegalText>
          You sign in with a Google account. You are responsible for what happens under your account, so keep your Google account secure. You can ask us to delete your account at any time; the steps are on the <Link href="/data-deletion" style={legalLinkStyle}>data deletion page</Link>. How we handle your information is set out in the <Link href="/privacy" style={legalLinkStyle}>privacy policy</Link>.
        </LegalText>
      </LegalSection>

      <LegalSection title="What you must not do">
        <LegalList items={[
          'copy, scrape or republish the listings in bulk, or build a competing service from them',
          'try to break, overload or get around the security of the site',
          'use the site for anything unlawful, or in a way that harms other people',
          'pretend to be a venue, an organiser or another person',
        ]} />
        <LegalText>We may suspend or close an account that breaks these terms.</LegalText>
      </LegalSection>

      <LegalSection title="Content and ownership">
        <LegalText>
          The site, its design and its software belong to {LEGAL.operator}. Event photos, videos, names and logos belong to the venues, organisers and platforms that published them, and are shown to help people find those events.
        </LegalText>
        <LegalText>
          If you run a venue or an event and want a listing corrected or removed, or you own content shown here and want it taken down, write to {mail} and we will act on it.
        </LegalText>
      </LegalSection>

      <LegalSection title="No guarantees">
        <LegalText>
          The site is provided as it is. We work to keep it accurate and available, but we do not promise that it will be free of errors or interruptions. To the extent the law allows, we are not liable for loss arising from your use of the site or from relying on a listing, including a wasted journey, a missed event or a purchase made on another site.
        </LegalText>
      </LegalSection>

      <LegalSection title="Changes">
        <LegalText>
          We may change the service or these terms. When we change the terms we will update this page and the date at the top. If you keep using the site after a change, the new terms apply.
        </LegalText>
      </LegalSection>

      <LegalSection title="Contact">
        <LegalText>Questions about these terms can be sent to {mail}.</LegalText>
      </LegalSection>
    </LegalPage>
  );
}
