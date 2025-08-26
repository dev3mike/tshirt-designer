import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Navigation } from "@/components/navigation";
import { Sparkles, Shirt, Palette, Download, Zap, Users } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <div className="flex justify-center mb-6">
              <Badge variant="secondary" className="px-4 py-2">
                <Sparkles className="w-4 h-4 mr-2" />
                AI-Powered Design Tool
              </Badge>
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
              AI T-Shirt Designer
            </h1>
            <p className="mt-6 text-lg leading-8 text-muted-foreground">
              Create stunning, unique t-shirt designs with the power of artificial intelligence. 
              From concept to creation in minutes, not hours.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link href="/design">
                <Button size="lg" className="px-8">
                  <Shirt className="w-5 h-5 mr-2" />
                  Start Designing
                </Button>
              </Link>
              <Button variant="outline" size="lg">
                View Gallery
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Everything you need to create amazing designs
            </h2>
            <p className="mt-6 text-lg leading-8 text-muted-foreground">
              Our AI-powered platform provides all the tools you need to bring your t-shirt ideas to life.
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <div className="grid max-w-xl grid-cols-1 gap-8 lg:max-w-none lg:grid-cols-3">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Palette className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle>AI Design Generation</CardTitle>
                  </div>
                  <CardDescription>
                    Generate unique designs from text prompts using advanced AI models. 
                    Describe your vision and watch it come to life.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Zap className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle>Real-time Preview</CardTitle>
                  </div>
                  <CardDescription>
                    See your designs on realistic t-shirt mockups instantly. 
                    Choose from various colors, sizes, and styles.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Download className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle>High-Quality Export</CardTitle>
                  </div>
                  <CardDescription>
                    Download your designs in high resolution, print-ready formats. 
                    Perfect for personal use or commercial printing.
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative isolate overflow-hidden bg-primary/5 px-6 py-24 sm:py-32 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Ready to create your perfect t-shirt?
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-muted-foreground">
            Join thousands of creators who are already using AI to bring their t-shirt ideas to life.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Link href="/design">
              <Button size="lg" className="px-8">
                <Sparkles className="w-5 h-5 mr-2" />
                Get Started for Free
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-background border-t">
        <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
          <div className="text-center">
            <p className="text-sm leading-6 text-muted-foreground">
              © 2024 AI T-Shirt Designer. Built with Next.js and shadcn/ui.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
