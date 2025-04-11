
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Container } from '@/components/ui/container';
import { Button } from '@/components/ui/button';

const TermsOfServicePage = () => {
  return (
    <Container className="max-w-4xl py-8">
      <Button variant="ghost" size="sm" asChild className="mb-6">
        <Link to="/client-dashboard/settings">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Settings
        </Link>
      </Button>

      <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>

      <div className="prose prose-slate max-w-none">
        <p className="text-lg mb-4">
          Last Updated: April 11, 2025
        </p>

        <p>
          Please read these Terms of Service ("Terms") carefully before using our Services.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-4">Acceptance of Terms</h2>
        <p>
          By accessing or using our Services, you agree to be bound by these Terms. If you disagree with any part of the Terms, you may not access or use our Services.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-4">Description of Services</h2>
        <p>
          Moai LLC ("Company," "we," "us," "our") provides fitness coaching services, workout programs, and related digital content through our website and mobile applications (collectively, the "Services").
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-4">Eligibility</h2>
        <p>
          You must be at least 18 years of age to use our Services. By using our Services, you represent and warrant that you are at least 18 years of age.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-4">User Accounts</h2>
        <p>
          When you create an account with us, you must provide accurate, complete, and current information. You are solely responsible for maintaining the confidentiality of your account and password and for restricting access to your computer or mobile device.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-4">Subscription and Fees</h2>
        <p>
          Some aspects of our Services may require payment of fees. All fees are stated in U.S. dollars unless otherwise specified. You agree to pay all fees and charges associated with your account on a timely basis.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-4">Medical Disclaimer</h2>
        <p>
          Our Services are not intended to provide medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-4">Intellectual Property Rights</h2>
        <p>
          The Services and their entire contents, features, and functionality are owned by Moai LLC, its licensors, or other providers and are protected by copyright, trademark, and other intellectual property laws.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-4">User Content</h2>
        <p>
          You retain all rights to the content you post, upload, or otherwise make available through the Services. By making content available, you grant Moai LLC a worldwide, non-exclusive, royalty-free license to use, reproduce, modify, adapt, publish, and display such content.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-4">Prohibited Uses</h2>
        <p>
          You may use our Services only for lawful purposes and in accordance with these Terms. You agree not to use our Services in any way that violates any applicable law or regulation.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-4">Disclaimer of Warranties</h2>
        <p>
          Our Services are provided on an "as is" and "as available" basis, without any warranties of any kind, either express or implied.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-4">Limitation of Liability</h2>
        <p>
          To the fullest extent permitted by applicable law, Moai LLC shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use the Services.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-4">Changes to These Terms</h2>
        <p>
          We may revise and update these Terms from time to time at our sole discretion. All changes are effective immediately when posted. Your continued use of the Services following the posting of revised Terms means that you accept and agree to the changes.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-4">Contact Information</h2>
        <p>
          Questions or comments about the Services or these Terms may be directed to: terms@moai.com
        </p>
      </div>
    </Container>
  );
};

export default TermsOfServicePage;
