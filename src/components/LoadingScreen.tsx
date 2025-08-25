import { useEffect, useState } from "react";

interface LoadingScreenProps {
  message?: string;
}

export default function LoadingScreen({ message = "Loading..." }: LoadingScreenProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 w-screen h-screen flex items-center justify-center bg-background">
      <div
        className={`flex flex-col items-center transition-all duration-500 ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}
      >
        <div
          className={`relative transition-all duration-700 ${
            isVisible ? "scale-100" : "scale-95"
          }`}
        >
          <div className="w-12 h-12 border-4 border-muted rounded-full"></div>
          <div className="absolute inset-0 w-12 h-12 border-4 border-transparent border-t-primary rounded-full animate-spin"></div>
        </div>
        <p
          className={`mt-4 text-muted-foreground transition-all duration-700 delay-200 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
          }`}
        >
          {message}
        </p>
      </div>
    </div>
  );
}
