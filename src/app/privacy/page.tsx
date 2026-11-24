import type { Metadata } from 'next';
import Link from 'next/link';
import LegalPage, { LegalList, LegalSection, LegalText, legalLinkStyle } from '@/components/marketing/LegalPage';
import { LEGAL } from '@/content/legal';

export const metadata: Metadata = {
  title: "Privacy policy | Where's My Vibe",
  description:
    "What Where's My Vibe collects when you use the site, why, who receives it, how long it is kept and how to have it deleted.",
  alternates: { canonical: '/privacy' },
};

export default function PrivacyPage() {
  const mail = <a href={`mailto:${LEGAL.contactEmail}`} style={legalLinkStyle}>{LEGAL.contactEmail}</a>;
  return (
    <LegalPage
      title="Privacy policy"
      intro={<>This page explains what {LEGAL.operator} collects when you use wheresmyvibe.com, why we collect it, who receives it and how you can have it deleted.</>}
    >
      <LegalSection title="Who we are">
        <LegalText>
          {LEGAL.operator} is an event discovery service. We gather public event information for a city and show it on a map and in a list. For any question about this policy or your data, write to {mail}.
        </LegalText>
      </LegalSection>

      <LegalSection title="What we collect when you sign in">
        <LegalText>You sign in with your Google account. Google sends us, and we store:</LegalText>
        <LegalList items={[
          'your email address and whether Google has verified it',
          'your name, including first and last name',
          'the web address of your Google profile picture',
          'the identifier Google uses for your account',
          'the date you first signed in and the date of your most recent sign-in',
        ]} />
        <LegalText>
          We also store the preferences you set, which are your default city and whether you use the light or dark theme. We never see or store your Google password.
        </LegalText>
        <LegalText>
          To keep you signed in we create a session. For each session we store a sign-in token, the browser it was created in, when it was created, when it was last used and when it expires.
        </LegalText>
        <LegalText>We use this information to sign you in, show your name and picture in the site, and remember your preferences.</LegalText>
      </LegalSection>

      <LegalSection title="Usage information">
        <LegalText>
          We record how the site is used so that we can improve it and see how many people visit:
        </LegalText>
        <LegalList items={[
          'the pages you open, the events and venues you view, and the searches and filters you use',
          'the page you came from and any campaign tags in the link you followed',
          'your browser, operating system, device type, screen size, language and time zone',
          'your country, and a scrambled form of your IP address that changes every day. We do not store the IP address itself.',
        ]} />
        <LegalText>
          To count visitors without storing anything on your device, our server gives each visit an identifier worked out from your IP address and browser. It changes every day, so it cannot be used to recognise you from one day to the next.
        </LegalText>
        <LegalText>
          The site also asks whether you accept analytics. If you accept, we keep a random identifier for your browser and one for each visit in your browser&rsquo;s storage, and record your account identifier when you are signed in, so that we can recognise return visits. If you do not accept, none of these are stored or recorded.
        </LegalText>
        <LegalText>
          If you accept analytics, the site may also load Google Analytics, which collects similar usage information for us and sets its own cookies.
        </LegalText>
      </LegalSection>

      <LegalSection title="Error reports">
        <LegalText>
          We use Sentry to find and fix faults. When something goes wrong, Sentry receives a report with the error, the page it happened on and details of your browser. For a share of the visits in which an error occurs, Sentry also records a replay of what was on screen during that visit, which can include text shown on the page. A small sample of visits is measured for loading speed.
        </LegalText>
      </LegalSection>

      <LegalSection title="Location">
        <LegalText>
          The map asks for your location only when you tap the location button. Your position is used inside your browser to show where you are on the map. It is not sent to our servers and we do not store it. Your browser remembers that you turned the feature on, and you can turn it off at any time.
        </LegalText>
      </LegalSection>

      <LegalSection title="What is stored in your browser">
        <LegalText>The site keeps a small amount of information in your browser&rsquo;s storage:</LegalText>
        <LegalList items={[
          'your sign-in token, so that you stay signed in',
          'your answer to the analytics question',
          'if you accept analytics, the random browser and visit identifiers described above, and campaign tags from the link you followed',
          'the city you last viewed and your theme',
          'the events you save. Saved events stay on your device and are not sent to us.',
          'whether you turned on your location on the map',
        ]} />
        <LegalText>
          Our own code does not set cookies. Google Analytics sets cookies if you accept analytics. You can remove everything listed here by clearing the site&rsquo;s data in your browser settings.
        </LegalText>
      </LegalSection>

      <LegalSection title="If you contact us">
        <LegalText>
          If you email us, for example to list a venue, we receive your email address and whatever you choose to write, and we use it to reply to you.
        </LegalText>
      </LegalSection>

      <LegalSection title="Where event listings come from">
        <LegalText>
          The events and venues on the site come from information that venues and organisers have published themselves: public Instagram stories and posts, ticketing platforms and community listings. This is public information about venues and events. It is not personal data about the people who use our site.
        </LegalText>
      </LegalSection>

      <LegalSection title="Information from Meta platforms">
        <LegalText>
          We use Meta&rsquo;s tools to publish and promote our own Instagram and Facebook content. We do not use them to collect personal data about Instagram or Facebook users.
        </LegalText>
      </LegalSection>

      <LegalSection title="Who receives your information">
        <LegalText>We do not sell your information. It is shared only with the services we need to run the site:</LegalText>
        <LegalList items={[
          'Google, for sign-in and, if you accept analytics, for Google Analytics',
          'Sentry, for error reports',
          'our hosting provider, on whose servers the site and its database run',
        ]} />
      </LegalSection>

      <LegalSection title="How long we keep it">
        <LegalText>
          We keep your account information for as long as you have an account, and usage information for as long as it is useful for improving the site. When you ask us to delete your data, we delete it as described on the <Link href="/data-deletion" style={legalLinkStyle}>data deletion page</Link>.
        </LegalText>
      </LegalSection>

      <LegalSection title="Your choices and rights">
        <LegalList items={[
          <>You can ask for a copy of the information we hold about you, or ask us to correct it, by writing to {mail}.</>,
          <>You can ask us to delete your data. The steps are on the <Link href="/data-deletion" style={legalLinkStyle}>data deletion page</Link>.</>,
          'You can withdraw your agreement to analytics by clearing the site’s data in your browser. The site will then ask you again.',
          'You can sign out at any time, which ends your session on that device.',
        ]} />
      </LegalSection>

      <LegalSection title="Changes to this policy">
        <LegalText>
          If we change what we collect or how we use it, we will update this page and the date at the top.
        </LegalText>
      </LegalSection>
    </LegalPage>
  );
}
