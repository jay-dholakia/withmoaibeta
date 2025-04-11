
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Container } from '@/components/ui/container';
import { Button } from '@/components/ui/button';

const PrivacyPolicyPage = () => {
  return (
    <Container className="max-w-4xl py-8">
      <Button variant="ghost" size="sm" asChild className="mb-6">
        <Link to="/client-dashboard/settings">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Settings
        </Link>
      </Button>

      <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>

      <div className="prose prose-slate max-w-none">
        <p className="text-lg mb-4">
          Last Updated: April 11, 2025
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-4">Introduction</h2>
        <p>
          Welcome to Moai LLC ("Company," "we," "us," "our"). We respect your privacy and are committed to protecting it through our compliance with this policy.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-4">Information We Collect</h2>
        <p>We collect several types of information from and about users of our Services, including:</p>
        <ul className="list-disc ml-6 mb-4">
          <li>Personal information, such as name, email address, phone number, and date of birth;</li>
          <li>Health and fitness data that you voluntarily provide, such as height, weight, workout history, and performance metrics;</li>
          <li>Information about your internet connection, the equipment you use to access our Services, and usage details;</li>
          <li>Location information when you use our mobile application with location services enabled.</li>
        </ul>

        <h2 className="text-xl font-semibold mt-8 mb-4">How We Use Your Information</h2>
        <p>We use information that we collect about you or that you provide to us, including any personal information:</p>
        <ul className="list-disc ml-6 mb-4">
          <li>To provide you with our Services and their contents;</li>
          <li>To provide you with information about your account and subscriptions;</li>
          <li>To analyze trends and to improve our Services;</li>
          <li>To personalize your experience and deliver content and product offerings relevant to your interests;</li>
          <li>To fulfill any other purpose for which you provide it or for which we have your consent.</li>
        </ul>

        <h2 className="text-xl font-semibold mt-8 mb-4">Disclosure of Your Information</h2>
        <p>We may disclose personal information that we collect or you provide as described in this privacy policy:</p>
        <ul className="list-disc ml-6 mb-4">
          <li>To contractors, service providers, and other third parties we use to support our business;</li>
          <li>To comply with any court order, law, or legal process;</li>
          <li>To enforce or apply our Terms of Service and other agreements;</li>
          <li>If we believe disclosure is necessary or appropriate to protect the rights, property, or safety of Moai LLC, our customers, or others;</li>
          <li>With your consent.</li>
        </ul>

        <h2 className="text-xl font-semibold mt-8 mb-4">Data Security</h2>
        <p>
          We have implemented measures designed to secure your personal information from accidental loss and from unauthorized access, use, alteration, and disclosure.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-4">Changes to Our Privacy Policy</h2>
        <p>
          We may update our privacy policy from time to time. If we make material changes, we will notify you through the Services or by email.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-4">Contact Information</h2>
        <p>
          To ask questions or comment about this privacy policy and our privacy practices, contact us at: privacy@moai.com
        </p>
      </div>
    </Container>
  );
};

export default PrivacyPolicyPage;
