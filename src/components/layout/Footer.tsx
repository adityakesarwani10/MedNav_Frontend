import { Heart } from "lucide-react";

export const Footer = () => (
  <footer className="border-t border-border/60 bg-secondary/40">
    <div className="container py-10 grid gap-8 md:grid-cols-4 text-sm">
      <div className="md:col-span-2 space-y-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-primary">
            <Heart className="h-4 w-4 text-primary-foreground" fill="currentColor" />
          </div>
          <span className="font-display text-lg font-bold">MedNav</span>
        </div>
        <p className="text-muted-foreground max-w-sm">
          Emergency ambulance dispatch, hospital network, and live tracking — built for the moments that matter.
        </p>
      </div>
      <div className="space-y-2">
        <h4 className="font-semibold mb-2">Product</h4>
        <ul className="space-y-1.5 text-muted-foreground">
          <li><a href="#how" className="hover:text-foreground">How it works</a></li>
          <li><a href="#why" className="hover:text-foreground">Why MedNav</a></li>
          <li><a href="#live" className="hover:text-foreground">Live status</a></li>
        </ul>
      </div>
      <div className="space-y-2">
        <h4 className="font-semibold mb-2">Emergency</h4>
        <ul className="space-y-1.5 text-muted-foreground">
          <li>24/7 dispatch line: <span className="text-foreground font-mono">102</span></li>
          <li>Support: hello@mednav.app</li>
        </ul>
      </div>
    </div>
    <div className="border-t border-border/60 py-5 text-center text-xs text-muted-foreground">
      © {new Date().getFullYear()} MedNav. Every second counts.
    </div>
  </footer>
);
