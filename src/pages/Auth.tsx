import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Link2, Lock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const {
    signIn,
    user
  } = useAuth();
  const {
    toast
  } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const updateUserProfile = async (userId: string, email: string) => {
    let username = email; // Default fallback

    // Set specific usernames based on email
    if (email === 'user1@example.com') {
      username = 'Kristi';
    } else if (email === 'user2@example.com') {
      username = 'Gledi';
    }
    try {
      const {
        error
      } = await supabase.from('profiles').update({
        username
      }).eq('id', userId);
      if (error) {
        console.error('Error updating profile:', error);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const {
        error
      } = await signIn(email, password);
      if (error) {
        toast({
          title: "Access denied",
          description: error.message,
          variant: "destructive"
        });
      } else {
        // Get the current user after successful sign in
        const {
          data: {
            user
          }
        } = await supabase.auth.getUser();
        if (user) {
          await updateUserProfile(user.id, email);
        }
        navigate('/');
      }
    } catch (error: any) {
      toast({
        title: "Something went wrong",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden">
      {/* Modern gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50" />
      
      {/* Animated background elements */}
      <div className="absolute inset-0">
        {/* Large floating shapes */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-br from-indigo-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-gradient-to-br from-purple-400/15 to-blue-400/15 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '2s' }} />
        
        {/* Subtle geometric patterns */}
        <div className="absolute inset-0 opacity-5">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
                <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#6366f1" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>
        
        {/* Floating link icons */}
        <div className="absolute top-20 left-20 text-blue-300/30 animate-bounce" style={{ animationDelay: '0.5s' }}>
          <Link2 className="h-8 w-8" />
        </div>
        <div className="absolute top-32 right-32 text-purple-300/30 animate-bounce" style={{ animationDelay: '1.5s' }}>
          <Link2 className="h-6 w-6 rotate-45" />
        </div>
        <div className="absolute bottom-32 left-32 text-indigo-300/30 animate-bounce" style={{ animationDelay: '2.5s' }}>
          <Link2 className="h-7 w-7 -rotate-12" />
        </div>
        <div className="absolute bottom-20 right-20 text-pink-300/30 animate-bounce" style={{ animationDelay: '3s' }}>
          <Link2 className="h-5 w-5 rotate-12" />
        </div>
      </div>
      
      <div className="w-full max-w-md relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-6">
            <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-4 rounded-2xl shadow-lg">
              <Link2 className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3">
            LinkVault
          </h1>
          <p className="text-slate-600 text-lg">Share links seamlessly with your team</p>
        </div>

        {/* Main Card */}
        <Card className="bg-white/80 backdrop-blur-xl border-0 shadow-2xl shadow-blue-500/10">
          <CardHeader className="text-center pb-6">
            <div className="flex items-center justify-center gap-3 mb-3">
              <div className="p-2 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg">
                <Lock className="h-5 w-5 text-blue-600" />
              </div>
              <CardTitle className="text-2xl text-slate-800">
                Welcome Back
              </CardTitle>
            </div>
            <CardDescription className="text-slate-600 text-base">
              Sign in to access your link sharing workspace
            </CardDescription>
          </CardHeader>
          
          <CardContent className="pt-0 px-8 pb-8">
            <form onSubmit={handleSignIn} className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="email" className="text-slate-700 text-sm font-semibold">Email Address</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="Enter your email" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  required 
                  className="h-12 border-slate-200 focus:border-blue-400 focus:ring-blue-400/20 bg-white/50 backdrop-blur-sm" 
                />
              </div>
              <div className="space-y-3">
                <Label htmlFor="password" className="text-slate-700 text-sm font-semibold">Password</Label>
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="Enter your password" 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  required 
                  className="h-12 border-slate-200 focus:border-blue-400 focus:ring-blue-400/20 bg-white/50 backdrop-blur-sm" 
                />
              </div>
              <Button 
                type="submit" 
                className="w-full h-12 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 mt-8" 
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing you in...
                  </div>
                ) : (
                  'Sign In to LinkVault'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-slate-500 text-sm">
          <p className="flex items-center justify-center gap-2">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
            Secure • Fast • Collaborative
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
