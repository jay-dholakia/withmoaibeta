
import React from 'react';
import { Link } from 'react-router-dom';
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Heart, Activity, Award, Handshake, MessageCircle, CalendarDays } from 'lucide-react';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-100">
      {/* Hero Section */}
      <section className="relative bg-gray-900 text-white overflow-hidden">
        <div className="absolute inset-0 bg-[url('/lovable-uploads/78733435-7c36-4255-8ccd-260474050cff.png')] bg-center opacity-10"></div>
        <Container className="relative py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-4">
              <span className="block">Stronger Together with</span>
              <span className="block text-client">Moai</span>
            </h1>
            <p className="max-w-2xl mx-auto text-xl text-gray-300 mb-8">
              Join a supportive fitness community that helps you achieve your health goals through accountability, coaching, and shared progress.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link to="/login">
                <Button size="lg" className="bg-client hover:bg-client/90 shadow-md">
                  Join Now
                </Button>
              </Link>
              <Link to="/portals">
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-white text-white bg-white/10 hover:bg-white/20 shadow-md"
                >
                  Learn More
                </Button>
              </Link>
            </div>
          </div>
        </Container>
      </section>

      {/* Feature Section */}
      <section className="py-16 md:py-24">
        <Container className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Choose Moai?</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Our platform brings together fitness, community, and accountability to help you reach your goals.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <Users className="h-12 w-12 text-client mb-2" />
                <CardTitle>Supportive Community</CardTitle>
                <CardDescription>Connect with like-minded individuals working toward similar health and fitness goals.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Our Moai groups foster genuine support networks that celebrate your victories and help you through challenges.
                </p>
              </CardContent>
            </Card>
            
            {/* Feature 2 */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <Activity className="h-12 w-12 text-client mb-2" />
                <CardTitle>Personalized Workout Plans</CardTitle>
                <CardDescription>Access workouts designed specifically for your fitness level and goals.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Our experienced coaches create customized workout programs that evolve as you progress.
                </p>
              </CardContent>
            </Card>
            
            {/* Feature 3 */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <Handshake className="h-12 w-12 text-client mb-2" />
                <CardTitle>Real Accountability</CardTitle>
                <CardDescription>Stay motivated with group accountability and progress tracking.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Members who join Moai groups are 89% more likely to stick with their fitness routines long-term.
                </p>
              </CardContent>
            </Card>
            
            {/* Feature 4 */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <Heart className="h-12 w-12 text-client mb-2" />
                <CardTitle>Holistic Health Focus</CardTitle>
                <CardDescription>We care about your overall wellbeing, not just physical fitness.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Our approach integrates mental wellness, proper nutrition, and sustainable fitness habits.
                </p>
              </CardContent>
            </Card>
            
            {/* Feature 5 */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <MessageCircle className="h-12 w-12 text-client mb-2" />
                <CardTitle>Expert Coaching</CardTitle>
                <CardDescription>Get guidance from certified fitness professionals who care.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Our coaches provide personalized feedback, form corrections, and motivation to help you succeed.
                </p>
              </CardContent>
            </Card>
            
            {/* Feature 6 */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <CalendarDays className="h-12 w-12 text-client mb-2" />
                <CardTitle>Progress Tracking</CardTitle>
                <CardDescription>Visualize your improvements with comprehensive tracking tools.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Our intuitive dashboard helps you monitor achievements and identify areas for growth.
                </p>
              </CardContent>
            </Card>
          </div>
        </Container>
      </section>

      {/* Community Testimonial Section */}
      <section className="py-16 md:py-24 bg-gray-50">
        <Container className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">The Power of Community</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              The Moai concept originated in Okinawa, Japan, where community groups provide social support throughout life.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left side: Image or illustration */}
            <div className="bg-gray-200 rounded-lg overflow-hidden flex items-center justify-center h-80 md:h-auto">
              <div className="p-8 text-center">
                <Award className="h-16 w-16 text-client mb-4 mx-auto" />
                <h3 className="text-2xl font-bold mb-2">Proven Results</h3>
                <p>
                  Communities with strong social connections have higher rates of longevity, happiness, and health outcomes.
                </p>
              </div>
            </div>

            {/* Right side: Testimonials */}
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-lg shadow-lg">
                <p className="italic mb-4">
                  "Joining a Moai fitness group changed everything for me. Having others who check in on me and celebrate my progress has kept me consistent for the first time in my life."
                </p>
                <p className="font-bold">- Sarah K., Member since 2023</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-lg">
                <p className="italic mb-4">
                  "The accountability and support from my Moai group gave me the structure I needed. I've lost 30 pounds and gained lifelong friends."
                </p>
                <p className="font-bold">- Michael T., Member since 2022</p>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Call to Action */}
      <section className="py-16 md:py-24 bg-client text-white">
        <Container className="max-w-7xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Transform Your Health Journey?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Join the Moai community today and experience the difference that supportive accountability makes.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link to="/login">
              <Button size="lg" className="bg-white text-client hover:bg-gray-100 shadow-md">
                Join Now
              </Button>
            </Link>
            <Link to="/coach-login">
              <Button 
                size="lg" 
                variant="outline" 
                className="border-white text-white bg-white/10 hover:bg-white/20 shadow-md"
              >
                Coach Login
              </Button>
            </Link>
          </div>
        </Container>
      </section>

      {/* Simple Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <Container className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-6 md:mb-0">
              <h2 className="text-2xl font-bold mb-2">Moai Fitness</h2>
              <p className="text-gray-400">Strength through community</p>
            </div>
            <div className="flex gap-8">
              <Link to="/privacy-policy" className="text-gray-300 hover:text-white">
                Privacy Policy
              </Link>
              <Link to="/terms-of-service" className="text-gray-300 hover:text-white">
                Terms of Service
              </Link>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-gray-400">
            <p>© {new Date().getFullYear()} Moai Fitness. All rights reserved.</p>
          </div>
        </Container>
      </footer>
    </div>
  );
};

export default LandingPage;
